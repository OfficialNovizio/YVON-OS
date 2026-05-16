# YVON Dashboard — Strategic Context
> LONG-TERM. Architecture locks and permanent decisions for the YVON OS platform.
> Rolling state → SESSION.md · Operational rules → FEEDBACK.md
> Cross-venture architecture locks also live here — these apply to ALL ventures built on YVON.

---

## What YVON Dashboard Is
The internal BI platform that hosts Novizio and Hourbour. Stark's operating system.
Mission: replace external SaaS subscriptions with self-hosted intelligence.

---

## Architecture Locks (cross-venture — applies to all)

| Decision | Rule | Locked | Why |
|----------|------|--------|-----|
| Framework | Next.js 15 + TypeScript strict — no alternatives | 2026-03-01 | Stack decision, not revisable |
| Data persistence | Supabase only. localStorage for ephemeral UI prefs only. | 2026-03-01 | Single source of truth |
| Deployment | Vercel. `maxDuration: 30` for scraper/Apify routes. | 2026-03-01 | Hosting decision |
| Streaming | SSE over WebSockets — simpler, works with Vercel serverless | 2026-03-01 | Avoid WebSocket complexity |
| API security | API keys in /api/ routes only — never in client components | 2026-03-01 | Security boundary |
| Venture context | Cookie `yvon_active_venture` — server-readable, single source | 2026-03-01 | All pages read from here |
| Color system | No hardcoded colors — CSS variable tokens from globals.css only | 2026-03-01 | Consistency + theming |
| Config sync | globals.css ↔ tailwind.config.ts must stay in sync always | 2026-03-01 | Token drift causes bugs |
| New pages | Every new page: NavBar entry + reads yvon_active_venture cookie | 2026-03-01 | Navigation consistency |
| War Room cap | 2 specialists max — .slice(0,2) in /api/team-chat. Never raise. | 2026-03-23 | Token cost + quality |

---

## Model Assignments (locked)

| Agent | Model | Locked | Why |
|-------|-------|--------|-----|
| Marcus, Dev, Raj, Mia, Kai | claude-sonnet-4-6 | 2026-03-23 | High-quality reasoning |
| Nate | claude-haiku-4-5-20251001 | 2026-03-23 | Sufficient for growth pattern analysis |
| War Room specialist briefing | claude-haiku-4-5-20251001 | 2026-03-23 | Speed + cost (250 token cap) |
| War Room CEO synthesis | claude-sonnet-4-6 | 2026-03-23 | Quality synthesis |
| Gatekeeper / intent classifier | claude-haiku-4-5-20251001 | 2026-03-23 | Latency-sensitive (150 token cap) |

---

## Open Strategic Decisions

| Decision | Owner | Status |
|----------|-------|--------|
| Auth provider | Marcus → Stark | Pending — Supabase Auth built-in vs custom OAuth |
| Alert channel | Marcus → Stark | Pending — Resend email vs dashboard panel first |
| Rate limiting | Dev → Stark | Needs Upstash Redis setup |
| Auto SKILLS.md updates | Dev → Stark | Recommend: dev-lead, raj-backend, mia-frontend first |
