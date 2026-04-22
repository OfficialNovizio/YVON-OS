# YVON BI Dashboard — Reference Documentation

## Project Context
- **Ventures:** Novizio (fashion) + Hourbour (fintech)
- **Purpose:** Self-hosted analytics platform replacing SaaS subscriptions
- **Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS, Supabase Postgres
- **Current Date:** 2026-04-20

## Folder Structure Overview

### Root Directories
```
YVON/
├── app/                    # Next.js App Router routes
│   ├── api/               # All API route handlers (60+ endpoints)
│   │   ├── claude/        # AI streaming endpoint
│   │   ├── analytics/     # Social & web metrics APIs
│   │   ├── content/       # Content pipeline routes
│   │   └── ...           # 60+ feature-specific routes
│   ├── ceo/               # CEO briefings with spatial UI
│   ├── analytical/        # Analytics hub page
│   ├── content/           # Content calendar management
│   ├── creative/          # Campaign builder + Krea AI integration
│   ├── market-radar/      # Market intelligence dashboard
│   └── settings/          # Agent configuration UI
├── lib/                   # Library modules & service integrations
│   ├── agents.ts          # 19 agent definitions
│   ├── db.ts              # Supabase schema + queries
│   ├── memory-manager.ts  # Session memory orchestration
│   └── session-schema.ts  # Session data structure
├── components/ui/         # Reusable UI components
│   ├── DashboardCard.tsx
│   ├── KPI_Card.tsx
│   ├── MetricCard.tsx
│   └── TrendGraph.tsx
├── .yvon-os/             # Operational files (session memory)
│   ├── SESSION.md        # Rolling session context
│   ├── ROADMAP.md        # Priority task list
│   └── USER.md           # User preferences & goals
└── departments/           # Agent configuration directories
    ├── executive/        # Marcus, Diana
    ├── marketing/        # Lena, Rio, Atlas, Pixel, Sofia
    ├── analytics/        # Kai, Nate, Zara
    ├── operations/       # Felix, Sam
    └── technical/        # Dev, Raj, Mia, Quinn
```

## Session Start Protocol

1. Read `.yvon-os/SESSION.md` — identify what's in progress
2. Identify relevant agents from task keywords
3. Read agent's MEMORY.md for continuity
4. (First session) Also read `.yvon-os/USER.md`

**Do not make changes until 95% confidence reached.**

## Agent Memory Files to Load by Task Category

| Task Keywords | Load These FILES |
|---------------|------------------|
| CEO brief, strategy, OKRs, business direction | `departments/executive/marcus-ceo/MEMORY.md` |
| Operations, workflow, sprints, milestones | `departments/executive/diana-coo/MEMORY.md` |
| Next.js, API routes, tech decisions, build errors | `departments/technical/dev-lead/MEMORY.md` |
| Supabase, database, backend API, queries | `departments/technical/raj-backend/MEMORY.md` |
| React components, UI design, Tailwind | `departments/technical/mia-frontend/MEMORY.md` |
| Testing, bugs, linting, edge cases | `departments/technical/quinn-qa/MEMORY.md` |

## Critical System Rules (from CLAUDE.md)

- **API keys in /api/ routes only** — never client components
- **SUPABASE_SERVICE_ROLE_KEY server-side only**
- **No localStorage for data** — Supabase only
- **CSS variable tokens from globals.css** — no hardcoded colors
- **globals.css ↔ tailwind.config.ts must stay in sync**
- **War Room hard cap: 2 specialists** — `.slice(0, 2)` enforced
- **No new page without NavBar entry + venture cookie read**

## Verification Protocol (before any task)

1. State which verification method applies
2. Prefer test-driven development
3. Run `build` + `lint` after implementation
4. For UI changes: browser verification required

```bash
npm install          # Install dependencies
npm run dev          # Local dev server
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript (run in Linux VM)
```

## Open Decisions (2026-04-20)

| Decision | Options | Priority |
|----------|---------|----------|
| Scout / Personal revival | Keep killed vs lightweight tab | High |
| Compact Steve Jobs model | Philosophy in USER.md or CLAUDE.md | Medium |
| RLS per venture in Supabase | Add before daily_logs table | Critical |

## Reference Files Location

| Need | File Path |
|------|-----------|
| Full agent registry (19 agents) | `reference/AGENTS.md` |
| Technical stack reference | `reference/STACK.md` |
| Pages & API routes list | `reference/PAGES.md` |
| Environment variables | `reference/ENV.md` |
| SIP protocol details | `reference/SIP.md` |
| Troubleshooting guide | `reference/TROUBLESHOOTING.md` |
