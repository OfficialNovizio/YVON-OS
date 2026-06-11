# Phase 2 Plan — Dashboard Home + Task Board + Complete Feature Migration

## Agent Team Assignment

| Agent | Role | Phase 2 Tasks |
|-------|------|---------------|
| **Dev** (💻) | Architecture + API routes | Dashboard API, Task Board API, settings endpoints |
| **Raj** (🔧) | Supabase + data pipelines | Schema extensions, real data queries, migrations |
| **Mia** (🎨) | UI components + responsive | Dashboard page, Task Board page, Settings page |
| **Quinn** (🧪) | QA + verification | tsc, lint, build, agent spawn verification after each task |

---

## Part A: Complete Feature Migration Map (YVON 2.0 → YVON-OS)

### 1. CEO Command Dashboard (13 tabs → 4 pages)

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| Decision Queue | → | `decision-queue` page | ✅ Built P1 |
| KPI Gauges (ROAS/CAC/Brand) | → | `dashboard` home page | 🔨 Phase 2 |
| Key Numbers sparklines | → | `dashboard` home page | 🔨 Phase 2 |
| System Strip (graph, health) | → | `dashboard` + TopBar | 🔨 Phase 2 |
| Token Usage Panel | → | `dashboard` + `hardware` | 🔨 Phase 2 |
| Strategic Briefing | → | `advisory-council` | ✅ Exists |
| Priorities | → | `task-board` (Priorities lane) | 🔨 Phase 2 |
| Intelligence Feed | → | `trend-radar` | ✅ Exists |
| Agent Status | → | `agents` page + TopBar | ✅ Exists |
| Calendar | → | `scheduler` + `production-calendar` | ✅ Exists |
| Venture Context | → | Sidebar workspace switcher | ✅ Built P1 |
| Operations Log | → | `logs` | ✅ Exists |

### 2. Analytics Dashboard (9 tabs → 3 pages + API)

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| Overview | → | `dashboard` home page | 🔨 Phase 2 |
| Portfolio | → | `projects` page | 🔨 Phase 2 |
| Social Media analytics | → | `social-analytics` | ✅ Exists |
| Content analytics | → | `content-pipeline` + `youtube-analytics` | ✅ Exists |
| Market analytics | → | `trend-radar` (Isaac) | ✅ Exists |
| Reports | → | `docs` page (report archive) | ✅ Exists |
| Kai's Read | → | `trend-radar` + embedded in all pages | ✅ Exists |
| Data Source Notes | → | `hardware` page | ✅ Exists |
| Instagram Insights | → | `social-analytics` | ✅ Exists |
| **API routes (analytics/*)** | → | `app/api/` already ported | ✅ Done |

### 3. Competitor Dashboard (7 tabs → 2 pages + API)

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| Competitor Overview | → | `projects` (per-venture competitor cards) | 🔨 Phase 2 |
| Alerts | → | `decision-queue` (security/competitor alerts) | 🔨 P2 |
| Content Gaps | → | `content-pipeline` (gap analysis section) | 📋 Later |
| Keywords | → | `trend-radar` | ✅ Exists |
| Reports | → | `docs` page | ✅ Exists |
| Opportunities | → | `idea-feed` | ✅ Exists |
| Auto-Discovery | → | `projects` (competitive landscape) | 🔨 Phase 2 |
| **API routes (competitor-*)** | → | `app/api/` already ported | ✅ Done |

### 4. Marketing Dashboard (7 tabs → 3 pages + API)

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| Content Intelligence | → | `content-pipeline` (intelligence engine) | ✅ Exists |
| Growth Sprint | → | `task-board` (growth tasks) | 🔨 Phase 2 |
| Community | → | `social-analytics` | ✅ Exists |
| Calendar | → | `scheduler` | ✅ Exists |
| CSE / Content Suggestions | → | `content-pipeline` | ✅ Exists |
| Weight Proposals | → | `task-board` (proposed) | 🔨 Phase 2 |
| **API routes (content-*, growth-*)** | → | `app/api/` already ported | ✅ Done |

### 5. Creative Studio (2 tabs → 2 pages)

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| Studio Sessions | → | `asset-lab` | ✅ Exists |
| Content Generation | → | `social-approvals` | ✅ Exists |
| **API routes (creative-*, studio-*)** | → | `app/api/` already ported | ✅ Done |

### 6. War Room (2 tabs → 1 page)

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| Strategy Sessions | → | `advisory-council` (War Room modal) | ✅ Exists |
| Team Chat / Plans | → | `decision-queue` (approval items) | 🔨 Phase 2 |
| **API routes (war-room-*)** | → | `app/api/` already ported | ✅ Done |

### 7. Settings (2 tabs → 1 tabbed page) ⭐ NEW

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| Profile | → | `settings` page (Profile tab) | 🔨 Phase 2 |
| Agents config | → | `settings` page (Agents tab) | 🔨 Phase 2 |
| Providers / API keys | → | `settings` page (Providers tab) | 🔨 Phase 2 |
| Secrets vault | → | `settings` page (Secrets tab) | 🔨 Phase 2 |
| Venture setup | → | `settings` page (Venture tab) | 🔨 Phase 2 |
| Panels / feature flags | → | `settings` page (Features tab) | 🔨 Phase 2 |
| Danger zone | → | `settings` page (Danger tab) | 🔨 Phase 2 |
| **API routes (profile, secrets, venture)** | → | `app/api/` already ported | ✅ Done |

### 8. Other Screens (Health, Career, Merchandise)

| YVON 2.0 Feature | → | YVON-OS Destination | Status |
|---|---|---|---|
| System Health | → | `dashboard` + TopBar | 🔨 Phase 2 |
| Career Dashboard | → | `people` page (team section) | 📋 Later |
| Merchandise | → | `asset-lab` (branded products) | 📋 Later |

---

## Part B: Phase 2 Build Plan

### Task 2.1 — Dashboard Home Page (Dev + Raj + Mia)

**Dev (💻):** Create `GET /api/dashboard` route
- Aggregates from Decision Queue API (pending count)
- Agent status (queries agent_memory for recent activity)
- Token usage (queries token_usage table, last 24h spend)
- DeepSeek balance (calls /api/deepseek-balance, already ported)
- KPI snapshot per venture (queries ventures + social_posts + competitors)

**Raj (🔧):** Verify Supabase tables for dashboard queries
- `agent_memory` — recent activity entries exist
- `token_usage` — has recent data
- `ventures` — Novizio + Hourbour exist
- `competitors` — per-venture counts

**Mia (🎨):** Build `app/dashboard/page.tsx`
- Morning overview cards: "X items need you" (linked to decision-queue)
- System health strip: agents live, Supabase OK, DeepSeek balance
- KPI cards per venture (pulls from API)
- Recent agent activity feed
- Quick-jump grid: Decision Queue, Task Board, Advisory Council, Software Pipeline
- Responsive: single column mobile, 2-col tablet, 3-col desktop

**Quinn (🧪):** Verify: tsc --noEmit, next build, lint

### Task 2.2 — Task Board with Real Data (Dev + Raj + Mia)

**Dev (💻):** Create `GET /api/task-board` route
- Agent-proposed tasks (from agent_memory + war_room_plans)
- Active tasks (execution_steps in progress)
- Review items (execution_steps in review)
- Completed items (last 7 days)
- `POST /api/task-board` — approve/reject/defer task actions

**Raj (🔧):** Wire existing tables
- `war_room_plans` → Proposed column
- `execution_steps` → In Progress / Review / Done columns
- Add `deferred_until` column if missing

**Mia (🎨):** Wire `app/task-board/page.tsx`
- Kanban columns: Proposed → Backlog → This Week → Review → Done
- Live Activity tracker (right rail)
- Card actions: Approve, Reject, Defer
- Color-coded by workspace
- Responsive: horizontal scroll on mobile, full columns on desktop

**Quinn (🧪):** Verify: tsc, build, lint, spawn Kai to review

### Task 2.3 — Projects Page with Ventures (Dev + Raj + Mia)

**Dev (💻):** Create `GET /api/projects` route
- Per-venture cards with metrics
- Competitor counts per venture
- Recent activity per venture
- Health indicators

**Raj (🔧):** Query existing data
- `ventures` table — names, slugs, brand tiers
- `competitors` — count per venture
- `social_posts` — recent post count per venture

**Mia (🎨):** Wire `app/projects/page.tsx`
- Venture cards (Novizio, Hourbour) with metrics
- Competitor landscape per venture
- Quick links to each venture's pages
- Responsive grid

**Quinn (🧪):** Verify

### Task 2.4 — Settings Page (Mia + Dev)

**Mia (🎨):** Build `app/settings/page.tsx`
- Tabbed layout: Profile, Agents, Providers, Secrets, Venture, Features, Danger
- Each tab reads from existing API routes (already ported)
- Glass-card styling consistent with YVON design

**Dev (💻):** Verify existing API routes for settings
- `/api/profile` ✅
- `/api/ventures` ✅
- `/api/secrets` ✅ (from lib/secrets.ts)
- `/api/providers` ✅

**Quinn (🧪):** Verify

---

## Part C: Task Delegation Protocol

For every coding task in Phase 2:
1. **Dev** writes the code
2. **Raj** verifies data layer (Supabase queries, schema)
3. **Mia** builds/verifies the UI
4. **Quinn** runs final QA: `npx tsc --noEmit`, `npm run build`, `npx react-doctor`

### Technical Team Spawn Commands

```bash
# Dev reviews architecture
hermes --profile yvon -s dev-lead chat -q "Review the Phase 2 plan for YVON-OS. Check API routes and data flow."

# Raj checks Supabase
hermes --profile yvon -s raj-backend chat -q "Verify all Supabase tables needed for dashboard, task-board, and projects exist and have data."

# Mia reviews UI
hermes --profile yvon -s mia-frontend chat -q "Wire dashboard page with morning overview, KPI cards, and system health. Use glass-card design."

# Quinn QA gate
hermes --profile yvon -s quinn-qa chat -q "Run tsc, lint, and build on YVON-OS after Phase 2 changes. Report any errors."
```

---

## Summary

| Phase | What | Agents | Pages Affected |
|-------|------|--------|----------------|
| 2.1 | Dashboard Home | Dev → Raj → Mia → Quinn | `dashboard` |
| 2.2 | Task Board | Dev → Raj → Mia → Quinn | `task-board` |
| 2.3 | Projects | Dev → Raj → Mia → Quinn | `projects` |
| 2.4 | Settings | Mia → Dev → Quinn | `settings` (NEW) |

**YVON 2.0 feature coverage after Phase 2:**
- CEO Dashboard: **11/13** features mapped (2 deferred: calendar, legacy)
- Analytics: **10/10** mapped ✅
- Competitor: **7/7** mapped ✅
- Marketing: **7/7** mapped ✅
- Creative Studio: **2/2** mapped ✅
- War Room: **2/2** mapped ✅
- Settings: **7/7** mapped ✅
- Health: **1/1** mapped ✅

**Total: 47/49 features → 96% coverage after Phase 2**

## ═══ Technical Team QA Results (2026-06-11) ═══════════════

| Agent | Role | Result | Notes |
|-------|------|:------:|-------|
| Quinn | QA | ✅ PASS | tsc 0 errors, lint 8 pre-existing warnings, build passes |
| Dev | Code Review | 🟡 FIXED | 3 critical issues resolved (DeepSeek math, env validation, error 500) |
| Mia | UI Review | ✅ PASS | Responsive breakpoints, overflow, z-index all correct |

**Issues found & resolved:**
- Dashboard API `/api/dashboard`: DeepSeek balance CNY→USD conversion fixed, env var validation added at top, error responses use 500, empty catch blocks now log warnings
- `KaisRead.tsx`: Unused `useWorkspace` import removed, HTTP `!r.ok` check added, AbortError distinguished from real errors, console.error added to catch
- ESLint config: `.eslintrc.json` → `eslint.config.js` for ESLint 9 compatibility

**Deferred to Phase 3 (plan items marked at gate-time):**
- `app/api/task-board/route.ts` — Task Board API (page exists, no backend)
- `app/api/projects/route.ts` — Projects API (page exists, no backend)
- `app/settings/page.tsx` — Settings page
- CEO Strategic Briefing panel port
- Token Usage panel port
- Software Pipeline API backend (UI done in Phase 2)
