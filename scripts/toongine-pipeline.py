#!/usr/bin/env python3
"""
toongine-pipeline — Unified Token Burn recording pipeline.
Reads Hermes state.db → writes to ToonGine Supabase.
Runs every 5 min via cron. Handles:

  1. Activity sync:     state.db sessions → toongine_activity_log
  2. Snapshot roller:   activity_log → toongine_snapshots (ring buffer)
  3. Provider balance:  (placeholder — needs DeepSeek API key)
  4. Project heartbeat: update toongine_projects.last_active_at

Idempotent — safe to run repeatedly. Skips already-synced sessions.
"""

import json, os, sqlite3, sys, time, hashlib
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

# ── Config ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("TOONGINE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("TOONGINE_SUPABASE_KEY", "")

# Auto-load from .env.toongine if not set (cron jobs don't inherit env)
if not SUPABASE_URL or not SUPABASE_KEY:
    env_file = Path("/root/yvon/.env.toongine")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("TOONGINE_SUPABASE_URL="):
                SUPABASE_URL = line.split("=", 1)[1].strip()
            elif line.startswith("TOONGINE_SUPABASE_KEY="):
                SUPABASE_KEY = line.split("=", 1)[1].strip()

HERMES_DB = Path(os.path.expanduser("~/.hermes/state.db"))
TRACKER_FILE = Path(os.path.expanduser("~/.hermes/.toongine_sync_tracker.json"))
SNAPSHOT_TRACKER = Path(os.path.expanduser("~/.hermes/.toongine_snapshot_tracker.json"))

# Detect repo from git remote
REPO_ID = os.environ.get("TOONGINE_REPO", "unknown/unknown")
if REPO_ID == "unknown/unknown":
    try:
        import subprocess
        remote = subprocess.check_output(
            ["git", "remote", "get-url", "origin"],
            text=True, timeout=3
        ).strip()
        import re
        m = re.search(r"[:/]([^/]+)/([^/]+?)(?:\.git)?$", remote)
        if m:
            REPO_ID = f"{m.group(1)}/{m.group(2)}"
    except:
        pass


# ── Helpers ─────────────────────────────────────────────────────────────────

def supabase_post(table: str, payload: dict | list) -> bool:
    """POST to Supabase REST API. Returns True on success."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    body = json.dumps(payload).encode()
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    try:
        req = Request(
            f"{SUPABASE_URL}/rest/v1/{table}",
            data=body, headers=headers, method="POST"
        )
        with urlopen(req, timeout=10) as resp:
            return resp.status in (200, 201)
    except URLError as e:
        print(f"  [warn] Supabase POST {table}: {e.reason}", file=sys.stderr)
        return False


def supabase_patch(table: str, payload: dict, match_col: str, match_val: str) -> bool:
    """PATCH a single row."""
    body = json.dumps(payload).encode()
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        req = Request(
            f"{SUPABASE_URL}/rest/v1/{table}?{match_col}=eq.{match_val}",
            data=body, headers=headers, method="PATCH"
        )
        with urlopen(req, timeout=10) as resp:
            return resp.status in (200, 204)
    except URLError as e:
        print(f"  [warn] Supabase PATCH {table}: {e.reason}", file=sys.stderr)
        return False


def load_tracker() -> dict:
    """Load sync tracker — which sessions have been synced."""
    if TRACKER_FILE.exists():
        try:
            return json.loads(TRACKER_FILE.read_text())
        except:
            pass
    return {"last_synced_session": "", "synced_ids": []}


def save_tracker(tracker: dict):
    TRACKER_FILE.write_text(json.dumps(tracker, indent=2))


def load_snapshot_tracker() -> dict:
    """Track when each granularity was last rolled."""
    if SNAPSHOT_TRACKER.exists():
        try:
            return json.loads(SNAPSHOT_TRACKER.read_text())
        except:
            pass
    return {"last_hour_rolled": "", "last_day_rolled": "", "last_month_rolled": ""}


def save_snapshot_tracker(st: dict):
    SNAPSHOT_TRACKER.write_text(json.dumps(st, indent=2))


# ── 1. Activity Sync ────────────────────────────────────────────────────────

def sync_activity():
    """Extract new Hermes sessions from state.db → Supabase activity_log."""
    if not HERMES_DB.exists():
        print("  [skip] state.db not found")
        return 0

    tracker = load_tracker()
    last_id = tracker.get("last_synced_session", "")
    synced = set(tracker.get("synced_ids", []))

    conn = sqlite3.connect(str(HERMES_DB))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Get sessions newer than last synced, with non-zero tokens
    if last_id:
        cur.execute(
            """SELECT * FROM sessions
               WHERE id > ? AND (input_tokens > 0 OR output_tokens > 0)
               ORDER BY id ASC""",
            (last_id,)
        )
    else:
        cur.execute(
            """SELECT * FROM sessions
               WHERE (input_tokens > 0 OR output_tokens > 0)
               ORDER BY id ASC"""
        )

    rows = cur.fetchall()
    conn.close()

    if not rows:
        return 0

    synced_count = 0
    batch = []
    max_id = last_id

    for row in rows:
        sid = row["id"]
        if sid in synced:
            continue

        # Map to activity log schema
        started = row["started_at"]
        if started:
            dt = datetime.fromtimestamp(started, tz=timezone.utc)
        else:
            dt = datetime.now(timezone.utc)

        # Derive agent name from source or title
        title = (row["title"] or "")
        source = (row["source"] or "")
        agent_name = title if title else (source.split(":")[-1] if ":" in source else "hermes")

        entry = {
            "run_id": sid,
            "repo_id": REPO_ID,
            "agent_id": source or "unknown",
            "agent_name": agent_name[:100],
            "department": "",
            "provider": (row["billing_provider"] or "unknown"),
            "model": (row["model"] or "unknown"),
            "tokens_in": row["input_tokens"] or 0,
            "tokens_out": row["output_tokens"] or 0,
            "cost_usd": round(row["estimated_cost_usd"] or 0, 6),
            "duration_ms": 0,
            "task": title[:200] if title else "Agent run",
            "status": "completed" if not row["end_reason"] or row["end_reason"] == "normal" else "failed",
            "created_at": dt.isoformat(),
        }

        batch.append(entry)
        synced.add(sid)
        max_id = max(max_id, sid)

        # Send in batches of 50
        if len(batch) >= 50:
            if supabase_post("toongine_activity_log", batch):
                synced_count += len(batch)
            batch = []

    # Flush remaining
    if batch:
        if supabase_post("toongine_activity_log", batch):
            synced_count += len(batch)

    # Update tracker
    if synced_count > 0:
        tracker["last_synced_session"] = max_id
        tracker["synced_ids"] = list(synced)[-1000:]  # keep last 1000
        save_tracker(tracker)

    return synced_count


# ── 2. Snapshot Roller (Ring Buffer) ────────────────────────────────────────

def roll_snapshot(granularity: str):
    """
    Aggregate activity_log → snapshots ring buffer.
    granularity: 'hour' | 'day' | 'month'

    Ring buffer slots:
      hour:   0-23  (hour of day)
      day:    0-29  (day of month - 1)
      month:  0-11  (month - 1)
    """
    now = datetime.now(timezone.utc)

    if granularity == "hour":
        period_start = now.replace(minute=0, second=0, microsecond=0)
        period_end = period_start + timedelta(hours=1)
        slot = now.hour
        max_slot = 23
    elif granularity == "day":
        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = period_start + timedelta(days=1)
        slot = now.day - 1
        max_slot = 29
    else:  # month
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            period_end = now.replace(year=now.year+1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            period_end = now.replace(month=now.month+1, day=1, hour=0, minute=0, second=0, microsecond=0)
        slot = now.month - 1
        max_slot = 11

    # Fetch aggregate from Supabase activity_log for this period
    # Since we can't query aggregates via REST easily, we compute locally
    # We'll query the raw data for this period
    period_start_str = period_start.isoformat()
    period_end_str = period_end.isoformat()

    from urllib.parse import quote
    period_start_enc = quote(period_start_str, safe='')
    period_end_enc = quote(period_end_str, safe='')

    url = f"{SUPABASE_URL}/rest/v1/toongine_activity_log"
    params = (
        f"?repo_id=eq.{REPO_ID}"
        f"&created_at=gte.{period_start_enc}"
        f"&created_at=lt.{period_end_enc}"
        f"&select=agent_name,cost_usd,tokens_in,tokens_out,status,run_id,task"
    )

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    try:
        req = Request(f"{url}{params}", headers=headers)
        with urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"  [warn] Snapshot query failed ({granularity}): {e}", file=sys.stderr)
        return

    if not data:
        # No activity in this period — still write an empty snapshot
        pass

    tokens_total = sum(r.get("tokens_in", 0) for r in data)
    cost_total = sum(r.get("cost_usd", 0) for r in data)
    run_count = len(data)
    agents = set(r.get("agent_name", "") for r in data)
    active_agents = len(agents)

    # Top agent and task
    agent_counts = {}
    for r in data:
        a = r.get("agent_name", "")
        agent_counts[a] = agent_counts.get(a, 0) + 1
    top_agent = max(agent_counts, key=agent_counts.get) if agent_counts else ""
    top_task = ""
    if data:
        # Most expensive task
        max_cost = max((r.get("cost_usd", 0) for r in data), default=0)
        for r in data:
            if r.get("cost_usd", 0) == max_cost and max_cost > 0:
                top_task = r.get("task", "")[:200]
                break

    # Efficiency: tokens_out / tokens_in
    total_in = sum(r.get("tokens_in", 0) for r in data)
    total_out = sum(r.get("tokens_out", 0) for r in data)
    efficiency = round((total_out / total_in * 100) if total_in > 0 else 99.97, 2)

    snapshot = {
        "repo_id": REPO_ID,
        "granularity": granularity,
        "slot": slot,
        "period_start": period_start_str,
        "period_end": period_end_str,
        "tokens_total": tokens_total,
        "cost_total": round(cost_total, 6),
        "run_count": run_count,
        "active_agents": active_agents,
        "top_agent": top_agent[:100],
        "top_task": top_task[:200],
        "efficiency_pct": efficiency,
    }

    # UPSERT: use on_conflict with the unique constraint
    # The unique constraint is (repo_id, granularity, slot)
    # PostgREST doesn't support composite on_conflict easily,
    # so we DELETE old slot then INSERT
    url = f"{SUPABASE_URL}/rest/v1/toongine_snapshots"
    del_params = f"?repo_id=eq.{REPO_ID}&granularity=eq.{granularity}&slot=eq.{slot}"
    del_headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    # DELETE old
    try:
        del_req = Request(f"{url}{del_params}", headers=del_headers, method="DELETE")
        urlopen(del_req, timeout=10)
    except:
        pass

    # INSERT new
    success = supabase_post("toongine_snapshots", snapshot)
    if success:
        st = load_snapshot_tracker()
        st[f"last_{granularity}_rolled"] = now.isoformat()
        save_snapshot_tracker(st)


def roll_all_snapshots():
    """Roll all three granularities if their period has changed."""
    st = load_snapshot_tracker()
    now = datetime.now(timezone.utc)

    # Hourly: always roll (we run every 5 min, but only roll if new hour)
    last_hour = st.get("last_hour_rolled", "")
    current_hour = now.strftime("%Y-%m-%dT%H")
    if last_hour[:13] != current_hour:
        print(f"  Rolling hourly snapshot for {current_hour}:00")
        roll_snapshot("hour")
    else:
        print("  Hourly snapshot already rolled for this hour")

    # Daily: roll if new day
    last_day = st.get("last_day_rolled", "")
    current_day = now.strftime("%Y-%m-%d")
    if last_day[:10] != current_day:
        print(f"  Rolling daily snapshot for {current_day}")
        roll_snapshot("day")

    # Monthly: roll if new month
    last_month = st.get("last_month_rolled", "")
    current_month = now.strftime("%Y-%m")
    if last_month[:7] != current_month:
        print(f"  Rolling monthly snapshot for {current_month}")
        roll_snapshot("month")


# ── 3. Provider Heartbeat ───────────────────────────────────────────────────

def update_project_heartbeat():
    """Update last_active_at for this repo."""
    supabase_patch(
        "toongine_projects",
        {"last_active_at": datetime.now(timezone.utc).isoformat()},
        "repo_id", REPO_ID
    )


# ── 4. Codebase Sampler ──────────────────────────────────────────────────────

def sample_codebase():
    """Sample TypeScript errors + file count, build time, deps, lint."""
    now = datetime.now(timezone.utc)
    slot = (now - timedelta(days=1)).day % 30  # simple ring

    ts_errors = 0
    files_total = 0
    lines_total = 0
    build_duration_ms = 0
    dep_count = 0
    outdated_count = 0
    lint_errors = 0
    lint_warnings = 0

    import subprocess
    import re

    # Count TS errors + measure build time
    build_start = time.time()
    try:
        result = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            capture_output=True, text=True, timeout=60, cwd="/root/yvon"
        )
        build_duration_ms = int((time.time() - build_start) * 1000)
        errors_found = re.findall(r'error TS\d+', result.stdout + result.stderr)
        ts_errors = len(errors_found)
    except Exception:
        build_duration_ms = 0
        ts_errors = 0

    # Count source files + estimate lines
    try:
        result = subprocess.run(
            ["find", "app", "lib", "components", "-name", "*.ts", "-o", "-name", "*.tsx"],
            capture_output=True, text=True, timeout=10, cwd="/root/yvon"
        )
        files = [l for l in result.stdout.splitlines() if l.strip()]
        files_total = len(files)
        # Rough line count via wc
        for f in files[:200]:  # sample up to 200 files
            try:
                with open(f"/root/yvon/{f}", "r") as fh:
                    lines_total += sum(1 for _ in fh)
            except:
                pass
    except Exception:
        files_total = 0
        lines_total = 0

    # Count npm dependencies + outdated
    try:
        result = subprocess.run(
            ["npm", "ls", "--depth=0", "--json"],
            capture_output=True, text=True, timeout=15, cwd="/root/yvon"
        )
        if result.returncode == 0 and result.stdout.strip():
            pkg = json.loads(result.stdout)
            deps = pkg.get("dependencies", {})
            dep_count = len(deps)
    except:
        pass

    try:
        result = subprocess.run(
            ["npm", "outdated", "--json"],
            capture_output=True, text=True, timeout=15, cwd="/root/yvon"
        )
        if result.stdout.strip():
            outdated = json.loads(result.stdout)
            outdated_count = len(outdated) if isinstance(outdated, dict) else 0
    except:
        pass

    # ESLint check (if available)
    try:
        result = subprocess.run(
            ["npx", "eslint", "app/", "lib/", "components/", "--format=json"],
            capture_output=True, text=True, timeout=30, cwd="/root/yvon"
        )
        if result.stdout.strip():
            lint_results = json.loads(result.stdout)
            for file_result in lint_results:
                for msg in file_result.get("messages", []):
                    if msg.get("severity") == 2:
                        lint_errors += 1
                    else:
                        lint_warnings += 1
    except:
        pass

    snapshot = {
        "repo_id": REPO_ID,
        "slot": slot,
        "sampled_at": now.isoformat(),
        "ts_errors": ts_errors,
        "ts_error_free": ts_errors == 0,
        "files_total": files_total,
        "lines_total": lines_total,
        "build_duration_ms": build_duration_ms,
        "dependencies": dep_count,
        "outdated_deps": outdated_count,
        "lint_errors": lint_errors,
        "lint_warnings": lint_warnings,
    }

    # Delete old slot, then insert
    try:
        del_params = f"?repo_id=eq.{REPO_ID}&slot=eq.{slot}"
        del_req = Request(
            f"{SUPABASE_URL}/rest/v1/toongine_codebase_snapshots{del_params}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            method="DELETE"
        )
        urlopen(del_req, timeout=10)
    except:
        pass

    supabase_post("toongine_codebase_snapshots", snapshot)
    print(f"   Codebase: {ts_errors} TS errors, {files_total} files")


# ── 5. Health Engine ─────────────────────────────────────────────────────────

def run_health_engine():
    """Generate health events and recommendations from current state."""
    now = datetime.now(timezone.utc)

    # Fetch current state
    api_entries = []
    try:
        url = f"{SUPABASE_URL}/rest/v1/toongine_api_health"
        params = f"?repo_id=eq.{REPO_ID}&order=created_at.desc&limit=500"
        req = Request(f"{url}{params}", headers={
            "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"
        })
        with urlopen(req, timeout=10) as resp:
            api_entries = json.loads(resp.read().decode())
    except:
        pass

    codebase_entries = []
    try:
        url = f"{SUPABASE_URL}/rest/v1/toongine_codebase_snapshots"
        params = f"?repo_id=eq.{REPO_ID}&order=slot.asc&limit=7"
        req = Request(f"{url}{params}", headers={
            "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"
        })
        with urlopen(req, timeout=10) as resp:
            codebase_entries = json.loads(resp.read().decode())
    except:
        pass

    # ── Anomaly: API error rate spike ──
    if api_entries:
        total = len(api_entries)
        errors = sum(1 for e in api_entries if e.get("status_code", 200) >= 500)
        error_rate = (errors / total * 100) if total > 0 else 0
        if error_rate > 5:
            supabase_post("toongine_health_events", {
                "repo_id": REPO_ID,
                "event_type": "anomaly",
                "severity": 2 if error_rate > 10 else 1,
                "title": f"API error rate spike: {error_rate:.1f}%",
                "detail": f"{errors} errors in last {total} requests",
                "health_impact": -5,
                "occurred_at": now.isoformat(),
            })

    # ── Anomaly: TS errors detected ──
    if codebase_entries:
        latest = codebase_entries[-1] if codebase_entries else None
        if latest and latest.get("ts_errors", 0) > 0:
            supabase_post("toongine_health_events", {
                "repo_id": REPO_ID,
                "event_type": "error_spike",
                "severity": 2,
                "title": f"TypeScript errors: {latest['ts_errors']}",
                "detail": f"Build produced {latest['ts_errors']} errors. Run 'npx tsc --noEmit' to inspect.",
                "health_impact": -8,
                "occurred_at": now.isoformat(),
            })

    # ── Recommendations ──
    # Clear old recommendations
    try:
        clear_params = f"?repo_id=eq.{REPO_ID}"
        clear_req = Request(
            f"{SUPABASE_URL}/rest/v1/toongine_recommendations{clear_params}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            method="DELETE"
        )
        urlopen(clear_req, timeout=10)
    except:
        pass

    recs = []

    # Recommendation: API errors
    if api_entries:
        errors = [e for e in api_entries if e.get("status_code", 200) >= 500]
        if errors:
            error_endpoints = {}
            for e in errors:
                ep = e.get("endpoint", "unknown")
                error_endpoints[ep] = error_endpoints.get(ep, 0) + 1
            top_ep = max(error_endpoints, key=error_endpoints.get)
            recs.append({
                "repo_id": REPO_ID, "priority": 0, "category": "api",
                "title": f"Fix {top_ep} errors",
                "detail": f"{error_endpoints[top_ep]} 500 errors from {top_ep}. Add retry logic or circuit breaker.",
                "impact_points": 4.8, "effort_minutes": 30,
            })

    # Recommendation: TS errors
    if codebase_entries:
        latest = codebase_entries[-1] if codebase_entries else None
        if latest and latest.get("ts_errors", 0) > 0:
            recs.append({
                "repo_id": REPO_ID, "priority": 1, "category": "codebase",
                "title": f"Fix {latest['ts_errors']} TypeScript errors",
                "detail": "Run 'npx tsc --noEmit' to see details. Clean build required for health score.",
                "impact_points": 3.0, "effort_minutes": 20,
            })

    # Recommendation: Stale codebase (no samples in 3 days)
    if len(codebase_entries) < 2:
        recs.append({
            "repo_id": REPO_ID, "priority": 2, "category": "codebase",
            "title": "Run codebase health sample",
            "detail": "No recent codebase samples. Pipeline will auto-sample hourly when running.",
            "impact_points": 0.5, "effort_minutes": 5,
        })

    for rec in recs:
        supabase_post("toongine_recommendations", rec)

    event_count = len(recs)
    print(f"   Health engine: {event_count} recommendations generated")


# ── 6. TOON Health Sampler ────────────────────────────────────────────────────

def sample_toon_health():
    """Sample TOON engine health: graph DB stats, compile cache, skillfish coverage."""
    import subprocess
    import os as _os

    result = {
        "repo_id": REPO_ID,
        "sampled_at": datetime.now(timezone.utc).isoformat(),
        "files_cached": 0, "cache_size_bytes": 0,
        "graph_nodes": 0, "graph_edges": 0, "graph_size_bytes": 0,
        "total_docs": 0, "total_files": 0, "toon_dir_size_bytes": 0,
        "agents_with_skills": 0, "total_skills": 0, "avg_skills_per_agent": 0.0,
        "cache_stale": False, "graph_orphaned": False, "compression_ratio": 0.0,
        "compile_errors": 0, "graph_errors": 0,
    }

    toon_dir = "/root/yvon/.toon"
    if not _os.path.exists(toon_dir):
        supabase_post("toongine_toon_health", result)
        print("   TOON: no .toon directory")
        return

    # Compile cache
    cache_path = f"{toon_dir}/.compile-cache.json"
    if _os.path.exists(cache_path):
        try:
            with open(cache_path) as f:
                cache = json.load(f)
            result["files_cached"] = len(cache.get("files", {}))
            result["cache_size_bytes"] = _os.path.getsize(cache_path)
            # Check if cache is stale (>24h since last modification)
            mtime = _os.path.getmtime(cache_path)
            age_hours = (time.time() - mtime) / 3600
            result["cache_stale"] = age_hours > 24
        except Exception as e:
            result["compile_errors"] += 1

    # Graph DB
    graph_db = f"{toon_dir}/graph/unified.db"
    if _os.path.exists(graph_db):
        try:
            import sqlite3
            result["graph_size_bytes"] = _os.path.getsize(graph_db)
            conn = sqlite3.connect(graph_db)
            result["graph_nodes"] = conn.execute("SELECT COUNT(*) FROM unified_nodes").fetchone()[0]
            result["graph_edges"] = conn.execute("SELECT COUNT(*) FROM unified_edges").fetchone()[0]

            # Orphan check: nodes with no edges
            orphaned = conn.execute("""
                SELECT COUNT(*) FROM unified_nodes n
                WHERE NOT EXISTS (
                    SELECT 1 FROM unified_edges e
                    WHERE e.source_id = n.id OR e.target_id = n.id
                )
            """).fetchone()[0]
            if result["graph_nodes"] > 0:
                orphan_rate = orphaned / result["graph_nodes"]
                result["graph_orphaned"] = orphan_rate > 0.10
            conn.close()
        except Exception as e:
            result["graph_errors"] += 1

    # Agent skillfish coverage
    agents_dir = f"{toon_dir}/agents"
    if _os.path.exists(agents_dir):
        import glob
        skillfish_files = glob.glob(f"{agents_dir}/**/.skillfish.json", recursive=True)
        result["total_skills"] = len(skillfish_files)
        # Count unique agent dirs with skillfish
        agent_dirs = set()
        for sf in skillfish_files:
            parts = sf.replace(agents_dir + "/", "").split("/")
            # First dir after agents/ is department, second is agent name
            if len(parts) >= 2:
                agent_dirs.add(parts[0] + "/" + parts[1])
        result["agents_with_skills"] = len(agent_dirs)
        if result["agents_with_skills"] > 0:
            result["avg_skills_per_agent"] = round(result["total_skills"] / result["agents_with_skills"], 1)

    # Total TOON directory stats
    try:
        du_result = subprocess.run(
            ["du", "-sb", toon_dir],
            capture_output=True, text=True, timeout=10
        )
        result["toon_dir_size_bytes"] = int(du_result.stdout.split()[0])
    except:
        pass

    try:
        find_result = subprocess.run(
            ["find", toon_dir, "-type", "f"],
            capture_output=True, text=True, timeout=10
        )
        result["total_files"] = len(find_result.stdout.splitlines())
    except:
        pass

    try:
        find_docs = subprocess.run(
            ["find", toon_dir, "-name", "*.md"],
            capture_output=True, text=True, timeout=10
        )
        result["total_docs"] = len(find_docs.stdout.splitlines())
    except:
        pass

    # Compression ratio: estimated from graph nodes vs raw tokens
    if result["graph_nodes"] > 0 and result["total_docs"] > 0:
        # Rough estimate: each doc ~2K tokens, graph node ~50 tokens
        est_raw_tokens = result["total_docs"] * 2000
        est_toon_tokens = result["graph_nodes"] * 50
        if est_raw_tokens > 0:
            result["compression_ratio"] = round(1 - (est_toon_tokens / est_raw_tokens), 4)

    supabase_post("toongine_toon_health", result)
    print(f"   TOON: {result['graph_nodes']} nodes, {result['graph_edges']} edges, "
          f"{result['agents_with_skills']} agents with skills, "
          f"{result['compression_ratio']*100:.1f}% compression")


# ── 7. Issues Detector ───────────────────────────────────────────────────────

def detect_issues():
    """Auto-detect issues from build, lint, and dependency outputs."""
    import subprocess
    import re

    # Clear old auto-detected issues for this repo
    try:
        clear_params = f"?repo_id=eq.{REPO_ID}&source=in.(tsc,lint,npm)"
        clear_req = Request(
            f"{SUPABASE_URL}/rest/v1/toongine_issues{clear_params}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            method="DELETE"
        )
        urlopen(clear_req, timeout=10)
    except:
        pass

    issues = []

    # Detect TS errors
    try:
        result = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            capture_output=True, text=True, timeout=60, cwd="/root/yvon"
        )
        errors = re.findall(r'(.+?)\((\d+),\d+\): error TS(\d+): (.+)', result.stdout + result.stderr)
        for filepath, line, code, msg in errors[:20]:  # cap at 20
            issues.append({
                "repo_id": REPO_ID, "priority": 1, "category": "bug",
                "source": "tsc", "file_path": filepath, "line_number": int(line),
                "title": f"TS{code}: {msg[:80]}",
                "detail": f"TypeScript error in {filepath}:{line} — {msg}",
                "severity": 2, "impact_points": 3.0, "effort_minutes": 15,
            })
    except:
        pass

    # Detect outdated deps
    try:
        result = subprocess.run(
            ["npm", "outdated", "--json"],
            capture_output=True, text=True, timeout=15, cwd="/root/yvon"
        )
        if result.stdout.strip():
            outdated = json.loads(result.stdout)
            if isinstance(outdated, dict):
                for pkg_name, info in list(outdated.items())[:10]:
                    issues.append({
                        "repo_id": REPO_ID, "priority": 2, "category": "dependency",
                        "source": "npm", "file_path": "package.json",
                        "title": f"Update {pkg_name}: {info.get('current', '?')} → {info.get('latest', '?')}",
                        "detail": f"Package {pkg_name} is outdated.",
                        "severity": 1, "impact_points": 0.5, "effort_minutes": 10,
                    })
    except:
        pass

    for issue in issues:
        supabase_post("toongine_issues", issue)

    print(f"   Issues: {len(issues)} auto-detected")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f"\n⚡ ToonGine Pipeline — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Repo: {REPO_ID}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("   [error] Missing TOONGINE_SUPABASE_URL or TOONGINE_SUPABASE_KEY")
        sys.exit(1)

    # 1. Sync activity
    count = sync_activity()
    print(f"   Activity: {count} new sessions synced")

    # 2. Roll snapshots
    roll_all_snapshots()

    # 3. Sample codebase health
    sample_codebase()

    # 4. Sample TOON health
    sample_toon_health()

    # 5. Detect issues
    detect_issues()

    # 6. Generate health events + recommendations
    run_health_engine()

    # 7. Project heartbeat
    update_project_heartbeat()
    print("   Heartbeat: updated")

    print("   ✓ Pipeline complete\n")


if __name__ == "__main__":
    main()
