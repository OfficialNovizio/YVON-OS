# Phase 8 — Technical Debt + Agent Workflow Automation

> **CEO Marcus:** The audits were clean — now we harden. Split the monoliths that make Raj twitch, fix the layout bugs Mia flagged, and start making the agents actually *do* work.
> **Date:** 2026-06-11
> **Source:** Phase 7 technical audit (Dev/Raj/Mia) + LifeOS agent workflow specs

---

## Sprint A — Split the Monoliths

### A1. Split `lib/db.ts` (2,064 lines → domain modules)
Current: one monolithic file with 70+ functions across 40+ tables.
Target: domain-split modules under `lib/db/`:

```
lib/db/
  index.ts        → re-exports everything (backward compat)
  ventures.ts     → venture CRUD, socials, deployment
  tasks.ts        → tasks, deliverables, decisions
  content.ts      → content_calendar, content_suggestions, content_series, pitches
  agents.ts       → agent sessions, memory, settings, skills
  analytics.ts    → analytics snapshots, growth, attribution
  social.ts       → social stats, posts, approvals
  competitors.ts  → competitor intel, metrics, snapshots
  war-room.ts     → execution plans, strategy log
  network.ts      → contacts, interactions, messages
  jobs.ts         → job search, applications, resumes
```

Each module imports the shared supabase client from `lib/supabase.ts`.
Zero API changes — only internal refactoring.

### A2. Split `app/settings/venture/page.tsx` (1,003 lines → tabs)
Current: one monolithic page with 4 tabs inline.
Target: extract each tab into its own component:

```
app/settings/venture/
  page.tsx          → tab router (80 lines)
  _general.tsx      → General tab (editable profile, brand type, audience chips)
  _technical.tsx    → Technical tab (software status, repo, security)
  _social.tsx       → Social tab (10 platforms add/remove)
  _deployment.tsx   → Deployment tab (13 platform connect cards)
```

Zero visual changes — only file organization.

### A3. Fix layout bugs
- **Software Pipeline** — make right rail side-by-side on desktop (currently stacks below kanban)
- **Idea Feed** — replace raw Tailwind tokens with CSS custom properties (consistency)

---

## Sprint B — E2E Testing Foundation

### B1. Playwright test suite
- Smoke tests: all 33 pages load without crashing
- Critical path tests: venture switching, settings save, deployment connect
- Visual regression baselines (optional — Phase 8B)

### B2. CI gating
- Add Playwright job to CI pipeline
- Block deploy on test failure
- Require tsc + lint + test before merge

---

## Sprint C — Agent Workflow Automation (Phase 1)

### C1. Henry — Decision Queue Filtering
- Cron job: hourly scan of all pending items across ventures
- Filter: auto-handle safe items, escalate only items needing human decision
- Learning: track which items owner approves/rejects → adjust filter over time

### C2. Nexus — PR-Only Coding
- GitHub integration: Nexus can open PRs but merge requires owner approval
- Software Pipeline: tasks auto-flow TRIAGE → PLANNING → IN PROGRESS (Nexus) → STEVE QA

### C3. Steve — QA Gate
- After Nexus opens PR: Steve runs automated checks (lint, typecheck, test)
- Pass → escalate to NEEDS REVIEW (owner)
- Fail → send back to PLANNING with notes

### C4. Knox — Security Stops
- Scan commits/PRs for credential leaks
- If found: halt workflow, create Decision Queue item
- Owner approves rotation → Knox rotates the key

---

## Quality Gates (unchanged)
- tsc --noEmit: 0 errors
- ESLint: 0 new warnings
- next build: 33 pages compiled
- Push to GitHub → Vercel auto-deploy
