# YVON OS — Dashboard & Tab Audit
**CEO Report · Marcus · June 9, 2026**

---

## 📊 Executive Summary

YVON OS has **34 pages** across **8 navigation sections**, backed by **~170 API routes**, **52 Supabase migrations**, and a design system supporting **3 ventures** (Novizio, Hourbour, YVON Dashboard). 

The architecture is modeled after a company: 13 AI agents across 4 departments (Command, Technical, Marketing, Finance). Every screen has a purpose — no dead weight. But several pages are mock-up placeholders that need wiring.

| Metric | Count |
|--------|-------|
| Total pages | 34 |
| Fully built & wired | 10 |
| Built with mock data | 14 |
| Placeholder / stub | 10 |
| API routes | ~170 |
| Supabase tables | ~53 |
| Agent types | 13 (YVON) + 24 (Council) |

---

## 🧭 Navigation Structure

### 8 Sidebar Sections (from `lib/nav.ts`)

```
COMMAND CENTER (8)
  Dashboard              — CEO morning brief, KPI cards
  Decision Queue ✅      — Human-only decisions, triage mode
  Task Board ✅          — Agent Kanban, 5 stages
  Advisory Council ✅    — 24-agent debate, live chat
  Agents ✅              — Venture health, token burn, leaderboard
  Org Chart              — Company tree, workshops
  Office                 — 3D isometric agent floor
  Skill Workshop         — Agent training, skill promotion

LONG-FORM (4)
  Content Pipeline       — YouTube Kanban (7 stages)
  Production Calendar    — Content cadence
  YouTube Studio         — Packaging, titles, thumbnails
  YouTube Analytics      — Performance metrics

SHORTS (2)
  Short Pipeline         — Short-form production flow
  Shorts                 — Multi-platform distribution

POSTS (4)
  Social Approvals       — Image + copy approval
  Scheduler              — Drag-and-drop calendar
  Social Analytics       — Cross-platform performance
  Newsletter             — Kit-integrated studio

KNOWLEDGE (3)
  Brain & Wiki ✅        — Force-directed graph + doc library
  Asset Lab · Leonardo   — Image generation asset library
  Trend Radar · Isaac    — Trend research feed

BUILD · SOFTWARE FACTORY (2)
  Idea Feed              — Product/build proposals
  Software Pipeline ✅   — Dev Kanban (7 stages)

REVENUE (2)
  Consulting CRM         — Lead pipeline
  Cinematic Sites        — Client website builds

SYSTEM (6)
  Email Inbox            — Multi-account + drafts
  People                 — Contacts directory
  Projects               — Portfolio overview
  Docs                   — Documentation/SOPs
  Logs                   — Activity/audit log
  Hardware & Runtime     — Infrastructure monitoring
```

✅ = Fully built (6 in nav, 4 more beyond nav)

---

## 🔴 CRITICAL: Key Pages — Detailed Analysis

### 1. Dashboard (`/dashboard`)
**Status:** Built · **API:** `/api/dashboard`

Shows morning brief, KPI cards (decisions, posts, code reviews, war room, security), overnight agent activity, system health (Supabase, DeepSeek balance, tokens), active ventures, and Kai's Read feed. Redirects to Decision Queue on root `/`.

**Issues:**
- All KPI data is mock (`/api/dashboard` returns static numbers)
- No live token tracking from actual agent sessions
- "Agents live" count is static, not connected to real agent state

### 2. Decision Queue (`/decision-queue`) ✅
**Status:** Fully built · **API:** `/api/decision-queue`

The heart of the OS. Marcus filters everything down to what needs human decision. Features: triage mode (step through one at a time), defer/snooze (tonight, tomorrow AM, 3 days), Henry learning engine that auto-handles over time, workspace filter, type classification (War Room, Post, Code, Security, Intel, Email).

**Strengths:** Triage mode is excellent UX. Henry's learning sidebar shows confidence per type.

### 3. Task Board (`/task-board`) ✅
**Status:** Fully built · **API:** `/api/task-board`

5-stage Kanban: Proposed → Backlog → This Week → Review → Done. 30-second polling via `useLiveData`. Yellow stages (Proposed/Review) are where you're needed.

**Issues:** Approve/Return buttons are present but handlers may not be wired to Supabase writes.

### 4. Advisory Council (`/advisory-council`) ✅
**Status:** Most complex page · **API:** `/api/council/chat`, `/api/council/convene`

Two modes: **Decision Mode** (convene 24 agents, get positions, bias audit, board ruling) and **Live Chat Mode** (streaming chat with context injection). Desktop layout: chat + side panel (Agent Room, Context Panel, Quality Gate). Mobile: tabbed (Chat, Agents, Context). Quality Gate shows constitution compliance, estimated tokens/cost.

**Strengths:** Preflight system expands tasks, assigns agents, validates against constitution. Mobile responsive.

**Issues:** Agent positions show Accept/Assign buttons with no wired actions.

### 5. Agents (`/agents`) ✅
**Status:** Fully built · **API:** `/api/ventures-health?venture=`

Health ring (0-100 score), KPI row (score, agents, tokens, cost, sessions, issues, repo), token burn bar chart (24h), agent roster, leaderboard, provider breakdown, activity feed. Two modes: **OS agents** (no venture param → local `.toon/`) and **Venture agents** (?venture=novizio → GitHub API or local path).

**Issues:** KPI data is static (score always 85, tokens/cost = 0). Needs real Hermes session metrics fed to Supabase.

### 6. Settings (`/settings`)
**Status:** Built · **API:** `/api/dashboard`, `/api/ventures-health`

Card grid: Venture Profile, Dashboard settings, ToonGine OS status (agents, graph checks), Preferences (notifications, dark mode, compact), AI Provider (DeepSeek balance), Database (Supabase status, token spend), API Keys status, Active Venture info, Deployment (Vercel).

**Sub-pages:** `/settings/dashboard` (YVON Engine config, toggles, connection status) and `/settings/venture` (General, Technical, Social, Deployment tabs — editable venture form).

**Issues:** ToonGine OS card reads local `.toon/` — won't work on Vercel (no filesystem access).

### 7. Org Chart (`/org-chart`)
**Status:** Built with live data · **API:** `/api/org-chart`

Tree visualization (You → Marcus → Diana → departments). GSAP animations. 6 Skill Workshops shown below. Click agent → action sheet.

**Issues:** Falls back to hardcoded MOCK_TREE of 24 agents. Needs real `.toon/agents/` parsing.

### 8. Office (`/office`)
**Status:** Built · **API:** `/api/agent-status`

Isometric 3D view with 6 rooms, 18 agents on the floor. Drag to pan, scroll to zoom. Workspace tabs (Whole Floor, Novizio, Hourbour). Meeting tables when 3+ agents in standup. Status dots (working=green, standup=violet, moving=cyan, idle=gray).

**Strengths:** Beautiful. Pure SVG + HTML, no 3D library. Custom isometric math.

**Issues:** Agents and positions are hardcoded. Status enriched from `/api/agent-status` but no real-time position updates.

### 9. Brain & Wiki (`/brain-wiki`) ✅
**Status:** Fully built · **API:** `/api/knowledge-graph`

Toggle: Graph view (force-directed SVG with physics simulation) or Library view (documents). Visibility filter (All, Private, Team, Workspace, Cross-WS). Gap detection sidebar ("What agents don't know").

**Issues:** Physics runs in requestAnimationFrame — could be Web Worker for perf.

### 10. Software Pipeline (`/software-pipeline`) ✅
**Status:** Fully built · **API:** None (client-state)

7-stage Kanban: Triage → Planning → Backlog → In Progress → Steve QA → Needs Review → Done. Portfolio cards (5 projects with progress bars). Review → Create Decision flow (routes to Decision Queue).

**Issues:** All data is client-state only. No persistence. Refresh loses everything.

---

## 🟡 PLACEHOLDER PAGES — Need Building

These pages exist as files but use mock data or are thin stubs:

| Page | Status | What's missing |
|------|--------|---------------|
| Social Approvals | Stub | No real API, no approval flow |
| Scheduler | Stub | Calendar is mock data |
| Social Analytics | Stub | No real metrics |
| Newsletter | Stub | No Kit integration |
| Asset Lab | Placeholder | No Leonardo API wired |
| Trend Radar | Placeholder | No Isaac research pipeline |
| Idea Feed | Placeholder | 94 badge is fake |
| Consulting CRM | Placeholder | 3 badge is fake |
| Cinematic Sites | Placeholder | Hero mockups only |
| Email Inbox | Placeholder | No IMAP/Gmail integration |
| People/Projects/Docs/Logs/Hardware | Placeholder | Content pages, no data |

---

## 🔧 Technical Architecture

### Stack
```
Next.js 15 (App Router) · TypeScript strict · Tailwind CSS
Supabase (PostgreSQL) · Vercel hosting · yvon.in domain
DeepSeek API (primary) · Claude SDK (fallback)
Hermes (VPS 2.25.189.22) · GitHub API
```

### Key Libraries
```
lib/compressor.ts      — TOON dictionary + template engine (65-82% savings)
lib/chat-session.ts    — Agent session lifecycle (.toon/ loading)
lib/use-live-data.ts   — Polling hook (configurable interval + mock fallback)
components/ui.tsx      — Card, PageHeader, StatusBadge, Avatar, Modal
```

### Design System
- Dark glass-morphism (`.glass-card` class)
- Per-venture theming via `--ws-accent`, `--ws-accent-soft`, `--ws-glow` CSS vars
- Workspace context from cookie → `useWorkspace()` hook
- SF Pro Display fonts, Inter for body

---

## ⚠️ Critical Issues

### 1. No Live Data Pipeline
Dashboard, Agents tab, and Decision Queue all show mock/zero data. Metrics that need real feeds:
- Token burn (per agent, per hour) → needs Hermes session reporting
- Agent leaderboard → needs `/api/ventures-health` to read from Supabase
- Decision counts → needs Supabase writes from agent auto-handles
- System health → needs actual health checks, not static responses

### 2. `.toon/` Access on Vercel
Settings → ToonGine OS card calls `readLocalToon()` which uses `fs.readFileSync`. Vercel is serverless — no persistent filesystem. Must read from GitHub API instead.

### 3. Placeholder Page Proliferation
20+ pages are thin shells. Prioritize the 6 "full" pages first (already done), then wire the next tier (Social Approvals, Scheduler, Newsletter).

### 4. No Auth Layer
No login page, no user management. `yvon.in` is publicly accessible. Settings page shows API keys status. Needs AuthGuard implementation before production.

### 5. Mock Data in Production Code
`SEED` arrays and `MOCK_TREE` live directly in page components. Should move to `lib/demo.ts` or a demo mode toggle.

---

## ✅ What's Solid

- **Navigation architecture** — 34 screens, logical grouping, workspace scoping
- **Design consistency** — Glass-morphism everywhere, CSS variable tokens, responsive
- **Component reuse** — `PageHeader`, `StatusBadge`, `Card`, `Avatar`, `KanbanCard`, `Modal`
- **API route design** — Clean separation, server-side only, typed
- **Decision Queue UX** — Triage mode, defer, Henry learning is excellent
- **Advisory Council** — Live chat + decision debate dual mode is unique
- **TypeScript strict** — Zero `any` usage enforced

---

## 📋 Recommended Fix Order

1. **Wire live data pipeline** — Hermes sessions → Supabase → dashboard reads
2. **Fix `.toon/` access** — GitHub API instead of `fs` for Settings card  
3. **Build auth** — AuthGuard + login before public launch
4. **Wire top 5 placeholders** — Social Approvals, Scheduler, Newsletter, Asset Lab, Trend Radar
5. **Persist Software Pipeline** — Kanban state to Supabase
6. **Add real KPI tracking** — Replace static dashboard numbers with live queries

---

*Report generated from full codebase audit of `/root/yvon/*` — 34 page files, ~170 API routes, 52 migrations, 87 lib modules.*
