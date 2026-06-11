# YVON OS — Master Build Plan

> **Rule:** Each phase has a plan document → user approves → execute → verify → next phase.
> No code changes happen without prior approval.

---

## Phase 0: Responsive Overhaul (FOUNDATION)

**Why first:** The entire UI is desktop-only (sidebar fixed 248px, no mobile toggle, grid layouts break below 1024px). Everything else depends on this being solid.

### What changes:
| Component | Desktop (now) | Tablet (768-1023px) | Mobile (<768px) |
|-----------|:---:|:---:|:---:|
| **Sidebar** | Fixed 248px, always visible | Collapsible to 64px (icons only), expand on hover | Hidden, hamburger slide-over from left |
| **TopBar** | Full search + breadcrumb + agents + avatar | Compact: search icon only, expand on tap | Minimal: hamburger + title + avatar |
| **Kanban boards** | Horizontal scroll columns | 2 columns visible, swipe | Single column, cards stacked, swipe between stages |
| **Glass cards** | 2-3 column grid | 2 column | 1 column |
| **Right rails** | Fixed 280px | Below content on small screens | Below content, collapsible |
| **Decision Queue** | List + right rail | List, rail collapsed | Single column, cards full-width |
| **Scheduler calendar** | Week grid drag-drop | 3-day view | Day view, tap to schedule |
| **Brain & Wiki 3D** | Full graph | Graph, reduced controls | Fallback list view |
| **War Room** | Full 3D stage + transcript | Stage + transcript stacked | Transcript only, "jump in" input |
| **37 pages total** | — | Audit all for breakpoints | — |

### Execution steps:
1. Add `useMediaQuery` hook for breakpoint detection
2. Mobile hamburger + sidebar slide-over component
3. Responsive Shell layout (3 breakpoints)
4. Responsive TopBar (3 breakpoints)
5. Fix all 37 pages: add `sm:` `md:` `lg:` breakpoints
6. Touch targets: min 44px tap areas
7. Test on 3 viewport sizes

**Effort:** ~4-6 hours  
**Files touched:** ~50  
**Risk:** Low (pure CSS/layout, no data logic changes)

---

## Phase 1: Venture/Wiring Setup

Wire Novizio + Hourbour into the workspace system. Currently workspaces are demo data (Canela, Valhalla, By Design, Vibe with AI).

### What changes:
- Map workspace `vibe` → Novizio (fashion e-commerce)
- Map workspace `bydesign` → Hourbour (fintech SaaS)
- Wire `WorkspaceContext` to read from `lib/venture-context.ts`
- Connect `WorkspaceSwitcher` to real Supabase ventures table
- Verify venture-scoped data loading across all pages
- Remove demo workspaces (Canela, Valhalla → keep as future)

**Effort:** ~2 hours  
**Files touched:** ~10

---

## Phase 2: Decision Queue

The #1 page. Connect Marcus filter → real agent output → 7 actionable items.

### What changes:
- Backend: Marcus reads actual agent sessions/tasks/PRs from Supabase
- Backend: Filter layer (Marcus decides: auto-handle vs escalate)
- Frontend: Wire live data into decision cards (not hardcoded)
- Frontend: Defer/snooze with real Supabase persistence
- Integration: Telegram nudge via `send_message` when decisions pile up
- Wire: Clear-my-queue one-by-one mode
- Wire: Workspace filter (scoped to active venture)
- Wire: "How it's flowing" metrics (avg time to clear, Henry's reduction %)

**Effort:** ~5-6 hours  
**Files touched:** ~15

---

## Phase 3: Task Board

Agent task proposal → approve → execute → review pipeline.

### What changes:
- Backend: Task proposal endpoint (agents submit JSON proposals)
- Backend: Marcus auto-approval learning (3 same-type → auto)
- Frontend: Real Kanban data from Supabase (not demo cards)
- Frontend: Live Activity tracker (read from agent sessions)
- Frontend: Review → escalate to Decision Queue
- Wire: Learning system (which tasks get auto-approved)

**Effort:** ~5-6 hours  
**Files touched:** ~12

---

## Phase 4: Social Approvals + Scheduler

Instagram content approval + cross-platform scheduling.

### What changes:
- Backend: Wire Leonardo → Creative Studio image generation
- Backend: William A/B copy generation via Hermes spawn
- Frontend: Real image grid from Supabase storage
- Frontend: A/B copy variants (real, not demo)
- Frontend: Drag-drop scheduler with real posting slots
- Backend: Scheduled post execution via cron
- Wire: Failure triage (retry failed posts)

**Effort:** ~4-5 hours  
**Files touched:** ~15

---

## Phase 5: Advisory Council + War Room

5-agent debate system with live War Room.

### What changes:
- Backend: Council agent orchestration (spawn 5 Hermes agents in parallel)
- Backend: Debate synthesis → recommendation cards
- Backend: Pattern tracker (recurring themes across debates)
- Frontend: Real recommendations (not hardcoded)
- Frontend: War Room live chat (WebSocket or SSE streaming)
- Frontend: Topic scheduling ("set today's topic")
- Wire: Accept → create task → assign agent workflow

**Effort:** ~6-8 hours  
**Files touched:** ~12

---

## Phase 6: Software Pipeline

PR-only gate + QA + review pipeline.

### What changes:
- Backend: Dev agent creates PR, never pushes to main
- Backend: Quinn QA gate (react-doctor, lint, typecheck, test)
- Frontend: Portfolio view with real GitHub repos
- Frontend: Kanban with real tasks from GitHub issues/PRs
- Wire: QA fail → back to Planning
- Wire: QA pass → escalate to Decision Queue (CEO merge)

**Effort:** ~4-5 hours  
**Files touched:** ~10

---

## Phase 7: Brain & Wiki

3D knowledge graph + library browser.

### What changes:
- Wire: Real Supabase vector data → graph nodes
- Wire: Library tab → browse agent-created MD files
- Wire: Visibility scoping (Private/Team/Venture/Cross-Venture)
- Wire: "What agents don't know" gaps panel
- Frontend: 3D graph improvements (performance, touch)

**Effort:** ~3-4 hours  
**Files touched:** ~8

---

## Phase 8: Content Pipeline + YouTube Studio

Content creation workflow.

### What changes:
- Backend: Content intelligence engine → real ideas
- Backend: Kai's Read → content recommendations
- Frontend: Real Kanban data (ideas → published)
- Wire: Cadence tracking (on/off schedule)

**Effort:** ~3-4 hours  
**Files touched:** ~10

---

## Phase 9: Email Inbox

4-account email with inline replies.

### What changes:
- Backend: Email provider integration (Resend SDK already in deps)
- Backend: Auto-draft responses (Hermes agent reads + drafts)
- Frontend: Inline reply composer (real, not demo)
- Frontend: Triage mode with real emails
- Wire: "What we know about sender" from Supabase memory

**Effort:** ~5-6 hours  
**Files touched:** ~10

---

## Phase 10: Newsletter

Kit API newsletter studio.

### What changes:
- Backend: Kit API integration (audience, compose, send, analytics)
- Frontend: Real subscriber data, real compose/send
- Wire: Approval gate (draft → review → send)

**Effort:** ~3-4 hours  
**Files touched:** ~8

---

## Phase 11: Remaining Pages

One-by-one wiring for lower-priority pages:
- Asset Lab (Leonardo gallery)
- Trend Radar (Isaac)
- Idea Feed
- Production Calendar
- Shorts Pipeline + Shorts
- YouTube Analytics + Social Analytics
- Skill Workshop
- Hardware & Runtime
- People, Docs, Logs, Projects

**Effort:** ~8-10 hours total (spread across sub-phases)

---

## Phase 12: Analytics Integration

Real-time metrics across all dashboards.

### What changes:
- Wire Supabase analytics tables to all dashboard KPIs
- Token usage → real data on Operations
- Competitor metrics → real data on Competitor dashboard
- Revenue metrics → real data on Consulting CRM

**Effort:** ~4-5 hours  
**Files touched:** ~15

---

## Phase 13: Testing & QA

Comprehensive test suite.

### What changes:
- Unit tests for lib modules
- Integration tests for API routes
- E2E tests for critical flows (Decision Queue, Task Board, Software Pipeline)
- Quinn QA automation in CI

**Effort:** ~6-8 hours

---

## Phase 14: Production Hardening

Performance, security, monitoring.

### What changes:
- Rate limiting on all API routes
- Error boundary components
- Loading skeletons for all data-dependent pages
- Performance optimization (bundle size, image optimization)
- Security audit (API key handling, RLS, CSP)

**Effort:** ~4-5 hours

---

## Summary

| Phase | Description | Hours | Pages |
|:-----:|------------|:-----:|:-----:|
| **0** | Responsive overhaul | 4-6 | All 37 |
| 1 | Venture/wiring setup | 2 | 5 |
| 2 | Decision Queue | 5-6 | 1 |
| 3 | Task Board | 5-6 | 1 |
| 4 | Social Approvals + Scheduler | 4-5 | 2 |
| 5 | Advisory Council + War Room | 6-8 | 2 |
| 6 | Software Pipeline | 4-5 | 1 |
| 7 | Brain & Wiki | 3-4 | 1 |
| 8 | Content Pipeline | 3-4 | 2 |
| 9 | Email Inbox | 5-6 | 1 |
| 10 | Newsletter | 3-4 | 1 |
| 11 | Remaining pages | 8-10 | 22 |
| 12 | Analytics integration | 4-5 | 15 |
| 13 | Testing & QA | 6-8 | — |
| 14 | Production hardening | 4-5 | — |
| **Total** | | **63-82** | **37** |

---

**Next:** Review this plan. Approve Phase 0, modify ordering, or ask questions — then I'll write the detailed Phase 0 plan and we begin.
