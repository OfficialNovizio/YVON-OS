#!/usr/bin/env python3
"""toongine-sync — Push agent roster + skills to Supabase every 5 min.
Runs on the VPS as a cron job. Reads .toon/agents/ and .toon/hermes/config.json.

Environment:
  TOONGINE_SUPABASE_URL      Supabase project URL
  TOONGINE_SUPABASE_KEY      Supabase service_role key
"""

import json, os, sys, time
from datetime import datetime, timezone
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("[toongine-sync] pip install supabase", file=sys.stderr)
    sys.exit(1)

# ── Config ──────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("TOONGINE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("TOONGINE_SUPABASE_KEY", "")

# Paths — try YVON OS first, then cwd
YVON_ROOT = Path(os.environ.get("YVON_HOME", "/root/yvon"))
AGENTS_DIR = YVON_ROOT / ".toon" / "agents"

if not AGENTS_DIR.exists():
    print(f"[toongine-sync] No .toon/agents at {AGENTS_DIR} — nothing to sync")
    sys.exit(0)


# ── Agent scanner ───────────────────────────────────────────────────────
def scan_agents() -> list[dict]:
    """Walk .toon/agents/{Dept}/{agent}/ and extract roster data."""
    agents = []
    for dept_dir in sorted(AGENTS_DIR.iterdir()):
        if not dept_dir.is_dir() or dept_dir.name.startswith("."):
            continue
        dept_name = dept_dir.name
        for agent_dir in sorted(dept_dir.iterdir()):
            if not agent_dir.is_dir() or agent_dir.name.startswith("."):
                continue
            agent_name = agent_dir.name
            agent_id = f"{agent_name}-{dept_name.lower()}"

            # Manifest
            role, level = "", 1
            manifest_path = agent_dir / "manifest.toon"
            if manifest_path.exists():
                try:
                    text = manifest_path.read_text()
                    for line in text.splitlines():
                        if line.startswith("title:"):
                            role = line.split(":", 1)[1].strip()
                        elif line.startswith("level:"):
                            try:
                                level = int(line.split(":", 1)[1].strip())
                            except ValueError:
                                pass
                except Exception:
                    pass

            # Skills
            skills = []
            skills_dir = agent_dir / "skills"
            if skills_dir.exists():
                for cat_dir in sorted(skills_dir.iterdir()):
                    if not cat_dir.is_dir():
                        continue
                    category = cat_dir.name
                    for skill_entry in sorted(cat_dir.iterdir()):
                        if not skill_entry.is_dir():
                            continue
                        if (skill_entry / "SKILL.md").exists():
                            skills.append({"name": skill_entry.name, "category": category})

            # Memory health
            memory_path = agent_dir / "MEMORY.md"
            memory_size = "0 KB"
            memory_health = 0
            if memory_path.exists():
                kb = memory_path.stat().st_size / 1024
                memory_size = f"{kb:.0f} KB" if kb >= 1 else f"{(kb*1024):.0f} B"
                memory_health = min(100, round((kb / 20) * 100))

            agents.append({
                "id": agent_id,
                "name": agent_name.capitalize(),
                "role": role or "—",
                "department": dept_name,
                "level": level,
                "status": "idle",
                "skills_count": len(skills),
                "skills": skills,
                "memory_size": memory_size,
                "memory_health": memory_health,
                "last_active": None,
            })

    return agents


# ── Supabase sync ───────────────────────────────────────────────────────
def sync(supabase, agents: list[dict]):
    """Upsert all agents, one by one (Supabase upsert with on_conflict)."""
    now = datetime.now(timezone.utc).isoformat()
    for agent in agents:
        agent["updated_at"] = now
        try:
            supabase.table("toongine_hermes_agents").upsert(
                agent, on_conflict="id"
            ).execute()
        except Exception as e:
            print(f"[toongine-sync] Failed to upsert {agent['id']}: {e}", file=sys.stderr)

    # Sync log
    try:
        supabase.table("toongine_hermes_sync_log").insert({
            "synced_at": now,
            "agents_count": len(agents),
            "status": "ok",
        }).execute()
    except Exception as e:
        print(f"[toongine-sync] Failed to write sync log: {e}", file=sys.stderr)


# ── Main ────────────────────────────────────────────────────────────────
def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[toongine-sync] Missing TOONGINE_SUPABASE_URL or TOONGINE_SUPABASE_KEY", file=sys.stderr)
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    agents = scan_agents()
    print(f"[toongine-sync] Found {len(agents)} agents across {len(set(a['department'] for a in agents))} departments")
    sync(supabase, agents)
    print("[toongine-sync] Done")


if __name__ == "__main__":
    main()
