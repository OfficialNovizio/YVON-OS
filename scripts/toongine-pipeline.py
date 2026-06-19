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

    # 3. Project heartbeat
    update_project_heartbeat()
    print("   Heartbeat: updated")

    print("   ✓ Pipeline complete\n")


if __name__ == "__main__":
    main()
