# Dev — Lead Developer Memory
> Read on session start for: Next.js, API routes, architecture, TypeScript, build errors.
> Permanent knowledge only — completed tasks and session logs live in SESSION.md.

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

