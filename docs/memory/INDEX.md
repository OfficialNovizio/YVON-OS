# docs/memory/ — Persistent Rules and Patterns

Design rules, correction patterns, and never-again entries that persist across all sessions.
Marcus reads this at every FORMING stage. If a rule is here, it is enforced — no exceptions.

---

## Files

| File | Purpose | Owner | When to read | When to write |
|------|---------|-------|-------------|--------------|
| [`feedback.md`](feedback.md) | All design rules, UI corrections, routing rules, and never-again patterns for the full system | Marcus (broadcasts to all agents) | Every session start + at every FORMING stage | Append only — never overwrite. Write after Adjourning when a new rule is discovered. |

---

## Rules for writing to this folder

- **Append-only.** Never delete or overwrite an existing rule — update its wording if it needs changing.
- **No duplicates.** If a rule already exists, update the existing entry rather than adding a new one.
- **Staleness check.** Rules older than 60 days should be flagged for curator review. Rules older than 90 days should be archived.
- **Scope check.** If a rule affects only one agent → save to that agent's `MEMORY.md` instead, not here.

---

## How this folder relates to agent MEMORY.md files

```
docs/memory/feedback.md       ← rules that affect ALL agents (Marcus reads + broadcasts)
.toon/memory/agent-department/X/MEMORY.md  ← rules specific to one agent (that agent reads directly)
```

Never save the same rule to both. Pick one location. If in doubt → feedback.md (Marcus will route it).
