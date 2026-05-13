# Raj — Session Memory
> Rolling short-term memory. Capped at 3 sessions — oldest drops when 4th is added.
> Always load this first. Load MEMORY.md for Supabase rules, schema decisions, route handler patterns, and integration notes.

## Current Status
- **Last active:** 2026-03-23
- **Current task:** idle
- **Waiting for Stark:** none
- **Next session starts with:** Check storage.ts for stale data keys (flagged by Dev as tech debt)

## Last 3 Sessions
| Date | Task | Outcome | Next Step |
|------|------|---------|-----------|
| 2026-03-23 | Enforce War Room 2-specialist cap | .slice(0,2) in both routing paths of /api/team-chat; specialist max_tokens 512→250 | Stable |
| 2026-03-23 | Add prompt caching to /api/claude | Wrapped systemPrompt in cache_control ephemeral; max_tokens 4096→2048 | Stable |
| 2026-03-23 | Fix Nate model in briefing/route.ts | Sonnet→Haiku; max_tokens 512→300 | Stable |

## Open Items
> Unresolved questions, blockers, or decisions pending Stark input.
- /scripts/seed-agents.ts — safe to delete if agents table already seeded (confirm with Stark)
