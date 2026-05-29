---
name: session-protocol
description: Universal session start and end protocol for all YVON agents. Defines file load order, memory write obligations, ADJOURNING checklist, and self-improvement logging. Every agent runs this — no exceptions.
version: 1.0.0
applies-to: all-agents
---

# Session Protocol — Universal

> This is the shared standard. Agent-specific session notes live in each agent's `MEMORY.md`.
> Source: `shared/skills/operating-system/session-protocol/SKILL.md`

---

## Session Start (every agent, every session)

```
1. Read this agent's MEMORY.md                ← permanent patterns, Never Again rules
2. Read docs/os/SESSION.md                     ← global in-flight state
3. Read docs/memory/feedback.md               ← 🔴 CRITICAL design/routing rules
4. Check Last Clean Exit timestamp in SESSION.md
   → If missing or > 24h old: flag abrupt exit before proceeding
5. If venture-specific task: load docs/ventures/[active]/SESSION.md
6. If UI task: load docs/ventures/[active]/DESIGN.md
7. If brand/copy task: load docs/ventures/[active]/FEEDBACK.md
```

**Never load all files at once. Load only what the current task requires.**

---

## Session End (every agent, any session with ≥ 3 tool calls)

```
1. Build check (technical agents): npx tsc --noEmit → MUST pass before ADJOURNING
2. Append one row to this agent's MEMORY.md:
   [date] — [task] — [outcome] — [what I'd do differently]
3. Append one row to docs/os/SESSION.md (global log, no duplicates)
4. If venture-specific: append to docs/ventures/[active]/SESSION.md
5. POST /api/agent-session-memory with:
   { agentId, venture, summary, learnings[], corrections[], filesChanged[], toolCallsCount }
6. Write "## Last Clean Exit: YYYY-MM-DD HH:MM" to docs/os/SESSION.md
```

---

## Self-Improvement Trigger

After any session where the user corrected the agent's approach:

1. Extract the correction as a rule: **what went wrong → rule that prevents it**
2. Classify the learning (see reflection-protocol):
   - Venture-specific → `docs/ventures/[name]/FEEDBACK.md`
   - Agent-specific → this agent's `MEMORY.md` Never Again section
   - Universal → `docs/memory/feedback.md`
3. **Never save the same rule in two places** (Memory Sync Rule from WORKFLOW.md)
4. If the same error occurred twice: the rule MUST already exist — if it doesn't, add it now

---

## Memory Write Format

```
[YYYY-MM-DD] [venture-tag or universal] — task — outcome — rule going forward
```

Examples:
```
[2026-05-28] [hourbour] — Cohort LTV analysis — modeled flat churn instead of by-cohort — Rule: always segment Hourbour churn by acquisition cohort, never flat average
[2026-05-28] [universal] — UI component build — shipped without triple-pass — Rule: triple-pass before any delivery, no exceptions even for "simple" changes
```

---

## Error Logging Obligation

When an agent encounters a repeating error (same type twice):
1. Log the error pattern to `MEMORY.md` Never Again section
2. Note the fix that resolved it
3. Flag to Quinn for `error-log-audit` if it was a production route error

---

## Anti-Patterns (never do)

- Starting work before checking SESSION.md for in-flight context
- Ending a session without writing to MEMORY.md (even "No gap found" is a valid entry)
- Writing the same rule to multiple files (pick one location, per Memory Sync Rule)
- Skipping the build check and going straight to ADJOURNING on broken code
