# Phase 3 Plan — Agent Workflow + Content Pipeline + CEO Intelligence

> **Status:** AWAITING APPROVAL  
> **What Phase 2 delivered:** Dashboard Home wired, Decision Queue real data, KaisRead ported,
> Software Pipeline API, system health widgets, responsive shell. **All QA: tsc + build pass.**

---

## What We're Building

Phase 3 connects three critical workflows:

1. **Agent work execution** — agents propose tasks → CEO approves → execute → review → done
2. **Content pipeline** — social posts with A/B copy/image variants, approve → schedule
3. **CEO command briefing** — strategic panels from YVON 2.0 on the new Dashboard

---

## Sub-Phase Map (5 batches, 1 QA gate)

### 3A: Task Board → Wire Real Agent Data

| What | From | To |
|------|------|-----|
| **`/api/task-board`** route | New (write) | GET tasks from `execution_steps` + `war_room_plans`; POST propose/approve/reject |
| **Task Board page** | Existing (mock kanban) | Wire to real API — columns populate from Supabase |
| **Live Activity tracker** | LifeOS design | Shows which agents are working (reads `agent_memory` for recent sessions) |

**Kanban columns:** PROPOSED → BACKLOG → THIS WEEK → REVIEW → DONE  
**No "In Progress" column** — live activity tracker replaces it.

**YVON 2.0 used here:** Agent execution engine from `lib/hermes-spawn.ts`, task status from `execution_steps` table.

---

### 3B: Projects → Venture Portfolio Metrics

| What | From | To |
|------|------|-----|
| **`/api/projects`** route | New (write) | GET venture metrics from Supabase: competitor count, decisions pending, agent tasks, social posts |
| **Projects page** | Existing (stub) | Show cards per venture: Novizio metrics, Hourbour metrics |

**Sources:** `ventures` table, `competitor_settings`, `social_posts`, `execution_steps`.  
**Not needed:** Projects page is NOT the old YVON CEO dashboard — it's a lightweight venture portfolio view.

---

### 3C: Social Approvals → Wire Content Pipeline

| What | From | To |
|------|------|-----|
| **`/api/social-approvals`** route | New (write) | GET pending posts from `social_posts`; POST approve/reject/schedule |
| **Social Approvals page** | Existing (stub) | Show real posts with image grid + copy preview + approve/schedule buttons |

**Sources:** `social_posts` table (already populated by Apify/Instagram scrapers).

---

### 3D: CEO Briefing Panels → YVON 2.0 Legacy Components

| Panel | YVON 2.0 Source | Wired Into |
|-------|----------------|------------|
| **Strategic Briefing** | `_strategic-briefing.tsx` (YVON 2.0) | Dashboard page — KPI snapshot with AI-generated summary |
| **Priorities** | `_priorities.tsx` (YVON 2.0) | Dashboard page — top 3 priorities from decision queue |
| **Intelligence Feed** | `_intelligence-feed.tsx` (YVON 2.0) | Dashboard page — recent Kai reports + competitor alerts |
| **Token Usage** | `_token-usage-panel.tsx` (YVON 2.0) | Dashboard page — DeepSeek spend + per-agent breakdown |

**Strategy:** Port these ONE AT A TIME, adapting YVON 2.0 glass tokens → YVON-OS CSS variables. Each panel gets its own column in the Dashboard grid.

---

### 3E: System Health Widgets → Dashboard Enrichment

| Widget | API Source | Where |
|--------|-----------|-------|
| **Agents Live counter** | `agent_memory` recent sessions | TopBar (already has counter, make it real) |
| **DeepSeek balance card** | `api/deepseek-balance` (YVON 2.0 port) | Dashboard sidebar |
| **Token spend chart** | `token_usage` table | Dashboard — 14-day bar chart |
| **Supabase health** | `api/health` existing route | Dashboard — green/red status dot |

---

## Phase 3 Deliverables

| File | Type | Lines |
|------|------|------|
| `app/api/task-board/route.ts` | New API | ~150 |
| `app/api/projects/route.ts` | New API | ~80 |
| `app/api/social-approvals/route.ts` | New API | ~100 |
| `app/task-board/page.tsx` | Rewrite | ~250 |
| `app/projects/page.tsx` | Rewrite | ~120 |
| `app/social-approvals/page.tsx` | Rewrite | ~200 |
| `app/dashboard/page.tsx` | Add panels | +120 |
| `components/ceo/StrategicBriefing.tsx` | Port | ~100 |
| `components/ceo/Priorities.tsx` | Port | ~80 |
| `components/ceo/IntelligenceFeed.tsx` | Port | ~90 |
| `components/ceo/TokenUsageWidget.tsx` | Port | ~120 |
| **Total** | | **~1,400 lines** |

---

## QA Gate (Phase 3 final)

| Check | Tool | Target |
|-------|------|--------|
| TypeScript strict | `tsc --noEmit` | 0 errors |
| Build | `next build` | All pages + routes compile |
| React quality | `react-doctor --diff main --json .` | 0 new issues |
| Responsive | Manual: mobile/tablet/desktop | No overflow, sidebar works |
| API errors | Manual: missing workspace, bad item ID | Graceful 400/500 responses |

---

## What We're NOT Doing Yet (Phase 4+)

- Email Inbox (complex — needs IMAP/SMTP + Kit API)  
- Newsletter (needs Kit API integration)  
- Advisory Council with HeyGen voices (needs ElevenLabs + 3D rendering)  
- 3D Office / Brain Wiki 3D (low priority)  
- Per-venture unique theming (works — just needs design tokens per venture)  

---

**Approve and I execute all 5 sub-phases with TDD + QA gate by the technical team.**
