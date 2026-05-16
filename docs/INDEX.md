# docs/ — YVON Project Documentation Index

All project-level `.md` files live here. Organised into 4 subfolders by type.
`CLAUDE.md` stays at the root — required by Claude Code.
Auto-generated files (`graphify-out/`) stay with their tooling.

---

## Subfolders

| Folder | Purpose | Key files |
|--------|---------|-----------|
| [`os/`](os/INDEX.md) | YVON OS runtime — session state, context, roadmap, user prefs | SESSION.md, CONTEXT.md |
| [`memory/`](memory/INDEX.md) | Persistent design rules and never-again patterns across agents | feedback.md |
| [`reference/`](reference/INDEX.md) | Static reference docs — stack, pages, env, security, specs | STACK.md, SECURITY.md |
| [`dev/`](dev/INDEX.md) | Developer tooling docs | CODE_REVIEW_GRAPH.md |

---

## How these folders relate

```
CLAUDE.md (root)
  ↓ reads on session start
  docs/os/SESSION.md        ← rolling session continuity
  docs/os/CONTEXT.md        ← permanent architecture locks
  docs/os/USER.md           ← Stark's working preferences
  docs/memory/feedback.md   ← design rules Marcus reads at every Forming
  docs/reference/*          ← loaded on demand per task type
```

**Load order at session start:** SESSION.md → CONTEXT.md → memory/feedback.md → agent MEMORY.md
**Load on demand:** reference/* (only the file relevant to the task)
**Never load all at once** — scope to what the task needs.
