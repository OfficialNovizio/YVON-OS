# YVON Master Roadmap
> Created: 2026-04-01 | Owner: Stark | Review: weekly every Monday
> DRI for execution: Stark. Each item must reach "Shipped" state before the next Priority tier begins.

---

## Priority 1 — Foundation (everything else depends on this)

### P1-A: Brand Sidebar + Venture Scoping `Point 4`
- Brands listed in left sidebar as clickable cards (Novizio, Hourbour)
- Click brand → writes `yvon_active_venture` cookie → all pages re-render scoped to that brand
- Each dashboard view is brand-isolated: no Novizio data bleeds into Hourbour views
- DRI: Mia (UI) + Raj (cookie/API) | Done when: clicking a brand in sidebar scopes the entire app
- **Status:** Scoped

### P1-B: Project Memory + Selective Loading `Point 12`
- Create `project-memory/PROJECT-MEMORY.md` — daily close appends all active agents' session logs
- Session-start filter: only load agents whose last log entry is relevant to today's task keywords
- CLAUDE.md appends one "What changed this session" line at every session close → self-improving
- DRI: Stark (protocol) | Done when: session start only loads contextually relevant agents
- **Status:** Scoped

---

## Priority 2 — Intelligence Layer (highest daily value)

### P2-A: Data → Decision Layer `Points 2, 3`
- Every analytics page gets a "Kai's Read" card: what happened / why it matters / what to do
- Every social page gets a brand-intelligence card: data → content brief → action
- Decision cards are NOT optional commentary — they are the primary output
- DRI: Kai (analysis) + Mia (UI card) | Done when: every metrics page has a "decision to take" section
- **Status:** Scoped

### P2-B: Agent Contradiction + WebSearch `Point 9`
- Marcus, Kai, Rio, Felix gain WebSearch capability in their system prompts
- Contradiction mode: all COMMAND-layer agents (Marcus, Diana) must challenge Stark's inputs with evidence before agreeing
- Personality profiles (Steve Jobs, Sheryl Sandberg, etc.) embedded in each agent's SKILLS.md — see agent files
- DRI: Stark (to wire WebSearch into /api/claude route) | Done when: Marcus pushes back with cited evidence
- **Status:** Scoped

---

## Priority 3 — Action & Approval

### P3-A: Approval Mechanism in /inbox `Point 8`
- Each decision card in /inbox has: Approve / Reject / Defer buttons
- Approval logged to Supabase `decisions` table with: agent, decision_text, action_taken, timestamp
- Daily report consolidates: decisions pending your approval + decisions you approved/rejected yesterday
- DRI: Raj (schema + API) + Mia (UI) | Done when: you can approve a recommendation and it's logged
- **Status:** Scoped

### P3-B: Daily Session + Report Persistence `Point 10`
- Create Supabase `daily_logs` table: date, agent_id, task, outcome, venture
- Every agent appends session log to `daily_logs` via `/api/agent-log` at session close
- `/inbox` daily report pulls from `daily_logs` (not just MEMORY.md files)
- DRI: Raj | Done when: a week of session history is queryable in Supabase
- **Status:** Scoped

---

## Priority 4 — Content Intelligence

### P4-A: Brand Intelligence Pipeline `Point 2`
- Flow: Kai reads social stats + competitor content → auto-generates content brief → Lena drafts → Atlas gives direction → you approve
- Triggered daily by Vercel Cron or on-demand from /creative page
- Competitor content fed by existing `/api/competitor-content` route
- DRI: Kai (brief) + Lena (copy) + Atlas (visual) | Done when: one-click generates content brief from real data
- **Status:** Scoped

### P4-B: Sidebar Quick Access `Point 5`
- Left sidebar sections: Brands (venture switcher) | Pages (Scout, Settings, Team, AI Team)
- **Decision required:** Scout + Personal were killed 2026-04-01. Confirm before rebuilding.
  - Option A: Keep killed. Sidebar = Brands + 5 links (current pages).
  - Option B: Revive Scout as a lightweight "idea capture" tab (not a full agent).
- DRI: Mia | Done when: sidebar has brand cards + quick-nav links
- **Status:** Waiting on Stark decision re: Scout/Personal

---

## Priority 5 — Autonomy

### P5-A: Self-Developing AI + GitHub Integration `Point 7`
- GitHub API server-side: read repo state, create branch, propose change, open PR
- Dev proposes code changes → shows diff in /technical → Stark approves → Dev pushes
- Error-solve mode: Dev reads build errors, proposes fix, Stark approves, Dev commits
- **Safety gate is non-negotiable:** no auto-push without explicit Stark approval on each change
- DRI: Dev + Raj | Done when: Dev can propose a code fix and Stark approves/rejects it from the UI
- **Status:** Scoped (Code Hub foundation exists from 2026-03-27)

---

## Priority 6 — Financial Visibility

### P6-A: Weekly API Cost Report `Point 13`
- Felix owns: track Claude API tokens, Apify calls, Supabase reads/writes per week
- Sources: Anthropic usage API, Apify billing API, Supabase dashboard
- Delivered every Monday in Marcus's CEO brief as a cost section
- Alert if weekly spend > budget threshold (set in /settings)
- DRI: Felix + Raj | Done when: Monday brief includes last week's API costs per service
- **Status:** Scoped

---

## Priority 7 — Roadmap View

### P7-A: Stats + Roadmap + Decisions Surface `Point 1`
- `/` Command Center gets a "Roadmap pulse" section: top 3 in-progress items from this file
- Each item shows: state (Scoped / In Flight / Shipped), DRI, last updated
- Decisions feed from Supabase `decisions` table (built in P3-A)
- DRI: Mia + Raj | Done when: Command Center shows roadmap state + pending decisions
- **Status:** Blocked on P1-A, P3-A

---

## Open Decisions (Stark must resolve before build)

| Decision | Options | Deadline |
|----------|---------|----------|
| Scout / Personal revival (P4-B) | Keep killed vs. lightweight tab | Before P4-B build |
| Compact Steve Jobs model (Points 10b/11) | Philosophy embedded in CLAUDE.md USER.md | This session |
| RLS in Supabase per venture | Add Row Level Security before `daily_logs` table is built | Before P3-B |
| WebSearch provider | Use existing WebSearch tool in Claude Code vs. Serper API | Before P2-B build |

---

## Architecture Gaps (must resolve before affected priorities)

| Gap | Affects | Action |
|-----|---------|--------|
| No RLS per venture in Supabase | P3-B, P6-A — data could bleed across brands | Raj to add RLS before new tables |
| WebSearch not wired into /api/claude | P2-B | Dev to add WebSearch tool to streaming route |
| No approval UI | P3-A | Mia to build decision card component |
| GitHub write access not configured | P5-A | Dev to add GitHub token to env, server-side only |
| Content approval exists as verbal rule only | P4-A | Raj to build /api/approve-content route |

---

## Completed

| Item | Date | Notes |
|------|------|-------|
| **Phase 1 — Data Foundation** | 2026-04-12 | 6 new Supabase tables, Stripe webhook, PostHog ingest, Content Scorer (per-platform weights), Anomaly Alert engine, Audience Momentum, Attribution Map |
| **Phase 2 — Brand Pulse** | 2026-04-12 | `/brand-pulse` page, top/worst 10 tables, anomaly alert cards, sidebar entry |
| **Phase 3 — Market Radar + Campaign Studio** | 2026-04-12 | `competitors` + `territory_clusters` tables, scoring engine, Territory Scout API, Campaign Builder (9-stage pipeline), Krea AI + ElevenLabs integrations, Experiment Engine, Content Multiplier |
| 21 → 13 agent restructure | 2026-04-01 | 3-layer org, Loop/Pulse/Ship protocols |
| Agent personality profiles | 2026-04-01 | All 13 agents assigned real-world genius counterpart |
| Code Hub foundation | 2026-03-27 | /technical page, lib/projects.ts, /api/codebase |
| YVON Health Score | 2026-03-26 | Composite metric on / Command Center |
