# YVON-OS Phase 1 — Foundation + Decision Queue

> **Status:** PENDING APPROVAL  
> **Date:** 2026-06-11  
> **Goal:** Make the existing LifeOS UI responsive (mobile/tablet) + wire up the Decision Queue with live data.

---

## Page Audit Summary

| Category | Count | Pages |
|----------|:-----:|-------|
| **Full mockup** (has UI, needs wiring) | 17 | decision-queue, task-board, advisory-council, social-approvals, scheduler, inbox, brain-wiki, agents, content-pipeline, youtube-studio, shorts, asset-lab, newsletter, office, software-pipeline, org-chart, dashboard |
| **Stub** (placeholder, needs full build) | 14 | cinematic-sites, consulting-crm, docs, hardware, idea-feed, logs, people, production-calendar, projects, short-pipeline, skill-workshop, social-analytics, trend-radar, youtube-analytics |

---

## Phase 1 Scope

### 1A — Responsive Foundation (Shell + Sidebar)

**Current state:** Fixed sidebar, no mobile drawer, no responsive breakpoints.

**Changes:**

1. **Tailwind responsive tokens** — verify `tailwind.config.ts` has proper `screens` (sm: 640, md: 768, lg: 1024, xl: 1280, 2xl: 1536)
2. **Shell.tsx** — add mobile state: `useState(false)` for sidebar open
   - Desktop (≥lg): sidebar always visible, narrow (260px)
   - Tablet (md–lg): sidebar collapses to icon-only (60px)  
   - Mobile (<md): hamburger button top-left, slide-in drawer overlay
3. **Sidebar.tsx** — add `collapsed` prop
   - Collapsed mode: icons only, tooltips on hover
   - Mobile: full sidebar slides in from left with backdrop
4. **Top bar** — add hamburger on mobile, workspace breadcrumb collapses
5. **New component:** `components/MobileNav.tsx` — hamburger + drawer

**Files touched:** `Shell.tsx`, `Sidebar.tsx`, `app/layout.tsx`, `app/globals.css` (add mobile drawer animations)

### 1B — Decision Queue Data Model

**Supabase table:** `decision_queue`

```sql
CREATE TABLE decision_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL DEFAULT 'novizio',
  type TEXT NOT NULL CHECK (type IN ('email', 'security', 'post', 'code', 'task', 'content')),
  agent_id TEXT NOT NULL,       -- e.g., 'marcus-ceo', 'kai-analyst'
  agent_initials TEXT NOT NULL, -- e.g., 'MC', 'KA'
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  workspace TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deferred', 'auto_handled')),
  defer_until TIMESTAMPTZ,
  source_page TEXT,             -- e.g., 'task-board', 'social-approvals', 'inbox'
  source_id TEXT,               -- foreign key to the source table row
  metadata JSONB DEFAULT '{}',   -- flexible: action buttons, links, context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT              -- 'marcus' | 'auto' | 'user'
);

-- Indexes
CREATE INDEX idx_dq_venture ON decision_queue(venture_id);
CREATE INDEX idx_dq_status ON decision_queue(status);
CREATE INDEX idx_dq_type ON decision_queue(type);
CREATE INDEX idx_dq_created ON decision_queue(created_at DESC);
```

**API routes:**
- `GET /api/decision-queue` — list pending decisions (filterable by venture, type, workspace)
- `POST /api/decision-queue` — resolve a decision (approve/reject/defer)
- `GET /api/decision-queue/stats` — queue stats (avg time to clear, cleared today, auto-handled count)

### 1C — Decision Queue Page Wiring

**Current state:** 4 hardcoded demo items. Beautiful UI but no data.

**Changes:**

1. **`app/decision-queue/page.tsx`** — add `useEffect` to fetch from `/api/decision-queue`
   - Replace hardcoded `items` array with live data
   - Add loading skeleton state
   - Add empty state ("Marcus has handled everything — nothing needs you right now.")
   - "Clear my queue" button opens one-by-one modal
   - Workspace filter chips actually filter
   - Right rail "How it's flowing" fetches from `/api/decision-queue/stats`

2. **New component:** `components/decision-queue/ClearMyQueueModal.tsx` — one-by-one triage
   - Steps through items sequentially
   - Shows full brief
   - Actions: Approve, Reject, Defer (dropdown: 1 day, tonight, tomorrow, 3 days)
   - Keystroke shortcuts (A=approve, R=reject, D=defer)

3. **New component:** `components/decision-queue/DecisionCard.tsx` — single decision card
   - Extracted from page for reuse
   - Type-specific icon + color
   - Workspace badge
   - Action buttons (primary + secondary)
   - Agent avatar

4. **Mobile layout:**
   - Single column (no right rail)
   - Right rail becomes bottom sheet or collapsible section
   - Decision cards stack vertically
   - "Clear my queue" becomes full-screen modal on mobile

### 1D — Seed Data (for immediate visual payoff)

Create Supabase seed script that inserts demo items matching the current hardcoded data:
- Email: Reply to Maria (By Design)
- Security: Knox credential leak (Vibe with AI)
- Posts: 3 LinkedIn posts (Vibe with AI)
- Code: Voice-memo PR (Idea-Feed MVP)

This means the page looks identical after wiring — but with real Supabase data flowing.

### 1E — YVON Ventures Mapping

Map LifeOS workspaces to YVON ventures:

| LifeOS Workspace | YVON Venture | Theme |
|-----------------|-------------|-------|
| Vibe with AI | YVON OS (main) | blue/violet |
| By Design | Hourbour | glass neon |
| Canela | Novizio (fashion) | deep sea green |
| Valhalla | (future) | techno |

Update `lib/workspaces.ts` and the workspace switcher.

---

## Files Changed (Phase 1)

| File | Change | Lines |
|------|--------|:-----:|
| `components/Shell.tsx` | Mobile responsive | ~30 |
| `components/Sidebar.tsx` | Collapse mode + mobile | ~40 |
| `components/MobileNav.tsx` | NEW — hamburger drawer | ~60 |
| `app/globals.css` | Mobile drawer animations | ~20 |
| `supabase/migrations/050_decision_queue.sql` | NEW table | ~25 |
| `app/api/decision-queue/route.ts` | NEW — GET + POST | ~100 |
| `app/api/decision-queue/stats/route.ts` | NEW — stats GET | ~40 |
| `app/decision-queue/page.tsx` | Wire live data | ~80 changed |
| `components/decision-queue/ClearMyQueueModal.tsx` | NEW | ~120 |
| `components/decision-queue/DecisionCard.tsx` | NEW | ~40 |
| `lib/workspaces.ts` | Venture mapping | ~15 |
| `scripts/seed-decision-queue.mjs` | NEW | ~30 |

**Total:** ~600 lines changed/added across 13 files

---

## Verification Gate

Before Phase 2 can start:
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run build` — passes
- [ ] Mobile: sidebar drawer opens/closes correctly
- [ ] Tablet: sidebar collapses to icon-only mode
- [ ] Desktop: unchanged behavior
- [ ] Decision Queue loads data from `/api/decision-queue`
- [ ] "Clear my queue" modal steps through items
- [ ] Defer actually updates `defer_until` in Supabase
- [ ] Empty state renders when no pending decisions

---

## Phase 2 Preview (for context — NOT building now)

After Phase 1 approval, Phase 2 will wire:
- Task Board (Proposed → Backlog → Week → Review → Done Kanban)
- Advisory Council (5-agent rotating debate)
- Both escalate into Decision Queue
