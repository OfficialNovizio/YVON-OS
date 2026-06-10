# MARCUS_STATE.md — Persistent Cross-Session State
> Marcus reads this at every session start, before SESSION.md.
> Marcus writes this at every session end.
> This is NOT a log — it is a snapshot. Overwrite, do not append.

---

## Active Venture
```
last_venture: yvon-dashboard
switched_at: 2026-06-09
```

## Last Agent Activated
```
novizio:        none — no venture-specific sessions in recent history
hourbour:       none — no venture-specific sessions in recent history
yvon-dashboard: Marcus (CEO audit) + Dev + Raj + Mia + Quinn — Full agent/system audit + react-doctor integration — 2026-06-09
```

## In-Flight Work
```
yvon-dashboard | Phase 1-3 dashboard fixes | Squad: Dev+Raj+Mia+Quinn | Awaiting Stark go-ahead
  - Phase 1: Fix SESSION.md, delete dead code, fix NavBar
  - Phase 2: Create Opportunities tab, extract components
  - Phase 3: Quinn QA hardening
```
```

## Waiting
> Tasks that are queued but not started. Marcus reviews before accepting new requests.
```
yvon-dashboard | Run migration 023 (studio_sessions table) | Stark to run in Supabase SQL Editor
yvon-dashboard | Run migration 022 (content_suggestion_engine — 4 tables) | Stark to run in Supabase SQL Editor
yvon-dashboard | Run migration 021 (clothing_items table) | Stark to run in Supabase SQL Editor
```

## Cross-Venture Insights [global]
> Only entries that are genuinely transferable across both ventures. Tag each with [novizio→hourbour] or [hourbour→novizio].
```
none logged yet
```

---

## Update Protocol
At every session end, Marcus overwrites all sections above with current state.
At every session start, Marcus reads this file first — before SESSION.md, before any agent is activated.
If this file shows in-flight work, Marcus acknowledges it to Stark before taking a new task.
