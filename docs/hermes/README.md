# Hermes Integration — Index

> Dedicated tracking for what we pull from [nousresearch/hermes-agent](https://github.com/nousresearch/hermes-agent) (MIT) and how it connects to YVON agents. **Update weekly.**

## Files in this folder
| File | Purpose |
|------|---------|
| [FEATURES.md](FEATURES.md) | Each Hermes capability → what we pull/port → where it lives → connection → status |
| [SKILLS-REGISTRY.md](SKILLS-REGISTRY.md) | The exact skill packs pulled, source, agent mapping, last-synced |
| [WEEKLY-LOG.md](WEEKLY-LOG.md) | Dated log of every sync + integration change (the weekly cadence) |
| [SYNC.md](SYNC.md) | How the weekly pull works + how to add/remove packs |
| `skills-lock.json` | Machine lockfile: per-file upstream blob SHAs (written by the sync script) |

## What Hermes is (so we set expectations honestly)
Hermes Agent is a **standalone MIT-licensed Python app** (CLI/TUI + messaging gateways + learning loop + MCP). We are **not** running its Python runtime inside YVON (Next.js/Vercel). Instead:
- **Pull (real files):** its portable `SKILL.md` packs — same format YVON already uses — into `agent-department/shared/skills/hermes/`, then connect them to our agents.
- **Port (native TS):** the *concepts* its Python engine implements (the learning loop), since the engine itself isn't portable.
- **Bridge (optional, later):** Hermes ships an MCP server (`mcp_serve.py`); if we ever want the live runtime we connect via MCP — heavy, not Vercel-friendly.

## Where pulled files live
`agent-department/shared/skills/hermes/<category>/<skill>/SKILL.md` (+ references/scripts), with upstream `LICENSE` kept alongside for attribution.

## Connection status
Pulling the files is step 1. **Connecting them to agents** (loading into briefs via skill-recall) is Workstream B of the War Room fix plan — see [../os/WAR_ROOM_FIX_PLAN.md](../os/WAR_ROOM_FIX_PLAN.md). Tracked per-skill in SKILLS-REGISTRY.md.
