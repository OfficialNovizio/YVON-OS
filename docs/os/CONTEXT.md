# .yvon-os/CONTEXT.md — Project Permanent Context
> Load when: strategic decisions, venture questions, architecture locks, cross-agent context needed.
> This file grows slowly. Only add entries when a decision is locked permanently.
> Never write rolling session data here — that belongs in .yvon-os/SESSION.md.

---

## Ventures

| Venture | Type | Stage | North Star Metric |
|---------|------|-------|-------------------|
| **Novizio** | Fashion DTC (e-commerce) | Growth | Order volume + Instagram reach |
| **Hourbour** | Fintech SaaS | Growth | MRR + trial-to-paid conversion |

- Both ventures are in growth phase — prioritise reach and retention over margin optimisation
- Novizio: fashion-forward, editorial tone, Novizio SS26 launch in pipeline
- Hourbour: trustworthy fintech positioning, targeting working professionals
- YVON BI Dashboard mission: replace SaaS subscriptions with self-hosted intelligence

---

## Architecture Locks (project-level)
> These are decided. Do not re-debate without Marcus approval.

| Decision | Rule |
|----------|------|
| Framework | Next.js 15 + TypeScript strict — no alternatives |
| Data persistence | Supabase only — localStorage for ephemeral UI prefs only |
| Deployment | Vercel — `maxDuration: 30` in vercel.json for scraper/Apify routes |
| Streaming | SSE over WebSockets — simpler, works with Vercel serverless |
| War Room cap | 2 specialists max — `.slice(0, 2)` in `/api/team-chat`. Never raise. |
| API key security | API keys in /api/ routes only — never in client components |
| Venture context | Cookie `yvon_active_venture` — server-readable source of truth across all pages |
| Color system | No hardcoded colors — CSS variable tokens from `globals.css` only |
| Config sync | `globals.css` ↔ `tailwind.config.ts` must stay in sync — update both together |
| New pages | Every new page requires NavBar entry + reads `yvon_active_venture` cookie |

---

## Model Assignments (locked)

| Agent | Model | Reason |
|-------|-------|--------|
| Marcus, Dev, Raj, Mia, Kai | claude-sonnet-4-6 | High-quality reasoning required |
| Nate | claude-haiku-4-5-20251001 | Downgraded 2026-03-23 — sufficient for growth pattern analysis |
| War Room specialist briefing | claude-haiku-4-5-20251001 | Speed + cost (250 token cap) |
| War Room CEO synthesis | claude-sonnet-4-6 | Quality synthesis |
| Intent classifier (Gatekeeper) | claude-haiku-4-5-20251001 | Latency-sensitive, 150 token cap |

---

## Open Strategic Decisions
> Clear an item only when it is resolved and logged in SESSION.md.

| Decision | Owner | Status |
|----------|-------|--------|
| Hourbour pricing model review | Felix → Marcus | Pending Felix runway analysis |
| Novizio SS26 campaign launch date | Atlas → Marcus | Pending campaign brief |
| Which agents to enable auto-SKILLS.md updates first | Dev → Stark | Recommend: dev-lead, raj-backend, mia-frontend |
| Routing feedback collection strategy | Dev → Stark | Not defined |
| Alert escalation process | Marcus → Stark | Not defined |

---

## Venture Financial Flags
> Felix monitors these. If runway drops below 6 months on either venture: flag at session start.

| Flag | Venture | Status |
|------|---------|--------|
| Runway check | Novizio | Pending actuals from Stark |
| Runway check | Hourbour | Pending actuals from Stark |
| SS26 campaign budget | Novizio | Not yet scoped |
