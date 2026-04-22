# Dev — Lead Developer Memory
> Read on session start for: Next.js, API routes, architecture, TypeScript, build errors.
> After task completion, append: `[YYYY-MM-DD] — task — outcome`

## Status
session_count: 0
Last updated: 2026-03-23 | Current: idle

## Completed Tasks
| Date | Task | Outcome |
|------|------|---------|
| 2026-03-23 | Implemented Skill Improvement Protocol (SIP) | Added SIP section to CLAUDE.md; Distillation Log to all 17 SKILLS.md; Command Health Log to all COMMANDS.md; File Verification Log to all FILES.md. Hard caps set per agent. |
| 2026-03-23 | Token optimisation pass | Stripped ~300-token boilerplate from all 17 prompts; prompt caching added to /api/claude; War Room capped at 2 specialists; max_tokens halved |
| 2026-03-23 | Remove Aria (designer) agent | Deleted from agents.ts, types.ts, agent-skills.ts |
| 2026-03-23 | Legacy page redirect refactor | 4 page folders deleted; permanent redirects in next.config.ts |
| 2026-03-23 | CLAUDE.md full rewrite | Updated agent count (17), model assignments, memory routing table, removed PIPELINE.md refs |

## Personality Baseline — Linus Torvalds
- Good taste in software is non-negotiable. Ugly code doesn't merge regardless of whether it works.
- Name bad patterns directly. No diplomatic feedback on broken architecture.
- Own every architecture decision. If it breaks later, fix it — no blame-shifting.
- Challenge complexity. Every abstraction must justify its existence.

## Never Again
> Populated from session errors. Each entry: [date] — pattern — rule that prevents recurrence.

## Architecture Decisions (locked — do not re-debate)
- **SSE over WebSockets** — simpler, works with Vercel serverless. `/api/claude` streams via `ReadableStream`.
- **All external calls via /api/ route handlers only** — API keys never touch client components. Non-negotiable.
- **Supabase for all persistent data** — localStorage is ephemeral UI only (active tab, scroll, prefs).
- **Prompt caching on system prompts** — `/api/claude` wraps systemPrompt in `cache_control: { type: 'ephemeral' }`.
- **War Room hard cap: 2 specialists** — `.slice(0, 2)` enforced in `/api/team-chat`. Never raise this.
- **Nate model: claude-haiku-4-5-20251001** — downgraded from Sonnet 2026-03-23. Applies in `agents.ts` + `briefing/route.ts`.
- **TypeScript in Linux VM** — `npx tsc --noEmit` only. `npm run build` won't work (SWC binary is Windows-only).
- **Cookie `yvon_active_venture`** — venture source of truth, server-readable. All new pages must read from it.

## Rejected Patterns
- ❌ API calls from client components — security violation
- ❌ File-write instructions in API system prompts — memory write-back is CLAUDE.md only
- ❌ localStorage for data — fails on cache clear
- ❌ Hardcoded colors in components — CSS variable tokens from globals.css only
- ❌ Hardcoded social handles / GA property IDs — per-venture env vars only

## API Contracts (current)
| Route | Input | Output |
|-------|-------|--------|
| `/api/claude` | `{ systemPrompt, userMessage, model?, ventureId }` | SSE stream |
| `/api/route-intent` | `{ message, ventureId }` | `{ intent, specialists[], reasoning }` |
| `/api/team-chat` | `{ message, ventureId }` | SSE stream (routing events + final answer) |
| `/api/briefing` | `{ ventureId, trigger }` | `{ brief: Brief }` |
| `/api/settings` | `type=agents\|memory\|ventures` | agent/memory configs |

## Token Budget (current)
| Route | Model | max_tokens |
|-------|-------|-----------|
| `/api/claude` individual chat | Sonnet (default, per-agent override applies) | 2048 |
| War Room specialist briefing | Haiku | 250 |
| War Room CEO synthesis | Sonnet | 1024 |
| CEO briefing | Sonnet | 800 |
| Intent classifier | Haiku | 150 |

## Known Tech Debt
- `storage.ts` — verify no stale data keys remain (should be UI-only)
- `/scripts/seed-agents.ts` — one-time script; safe to delete if agents table already seeded

## Completed Tasks
| Date | Task | Outcome |
|------|------|---------|
| 2026-03-27 | Code Hub + external codebase workflow | lib/projects.ts, /api/codebase route, /technical page, Sidebar Code Hub link — TypeScript clean |
| 2026-03-27 | Tech team chat in Code Hub | /api/tech-chat keyword router + Team Chat tab in /technical — natural language → auto-route to right agent, Stage as Change button, TypeScript clean |
| 2026-04-19 | CEO 3.1 Verification | Verified spatial background, glass materials, and fixed animation reveal cycle |
