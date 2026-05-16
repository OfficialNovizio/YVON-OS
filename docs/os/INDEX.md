# docs/os/ — YVON OS Runtime Files

These are the live, mutable files that track YVON's current state across sessions.
They change frequently. Treat them as the OS memory — not documentation.

---

## Files

| File | Purpose | When to read | When to write |
|------|---------|-------------|--------------|
| [`SESSION.md`](SESSION.md) | Rolling log of the last 5 sessions — what happened, who did it, what's next | Every session start | Every session end (mandatory) |
| [`CONTEXT.md`](CONTEXT.md) | Permanent architecture locks, venture status, open strategic decisions | When making architectural or strategic decisions | Only when a decision is locked permanently |
| [`ROADMAP.md`](ROADMAP.md) | Master feature roadmap and priority list across both ventures | When planning new features or sprints | When a roadmap item ships or priority changes |
| [`USER.md`](USER.md) | Stark's working preferences — tone, output format, decision style, Monday protocol | First session of the day | When Stark updates a preference |

---

## archive/

Completed session reports and one-off research documents.
Read-only — never updated, only appended when a session report is archived.

| File | Content |
|------|---------|
| `2026-04-01-yvon-roadmap-full.md` | Original master roadmap document |
| `2026-04-05-marketing-dashboard-research.md` | Marketing dashboard research notes |
| `2026-04-08-complete-implementation-summary.md` | Full 19-test implementation summary |
| `2026-04-08-enhanced-systems-implementation.md` | Enhanced systems build report |
| `2026-04-08-memory-system-overhaul.md` | Memory system redesign report |

---

## How these files relate to each other

```
SESSION.md ← updated every session, summarises what CONTEXT.md decisions were acted on
CONTEXT.md ← receives locked decisions that emerge from sessions
ROADMAP.md ← Diana + Marcus update when sprints close
USER.md    ← standalone, no dependencies — read cold at session start
```

**SESSION.md is the source of truth.** If SESSION.md and an agent's own SESSION.md diverge, the agent's file wins. SESSION.md here is the global summary.
