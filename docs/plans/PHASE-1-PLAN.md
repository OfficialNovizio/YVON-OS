# YVON OS — Phase 1 Plan: Responsive Foundation + Decision Queue

> **Status:** PENDING APPROVAL  
> **Date:** 2026-06-11  
> **Build state:** ✅ tsc passes · ✅ next build passes

---

## Part A: Phase 1 — Responsive + Design System Foundation

### Problem
Current YVON-OS is desktop-only. Every page assumes 1440px+ viewport. Mobile/tablet users get a broken experience — sidebar takes full width, kanban boards overflow, grids don't reflow.

### What We'll Build

#### A1. Responsive Shell (3 breakpoints)

| Breakpoint | Sidebar | TopBar | Main Content |
|-----------|---------|--------|-------------|
| **Mobile** (< 768px) | Hidden by default; slide-over when hamburger tapped | Compact: only hamburger + workspace name + avatar | Full width, single column |
| **Tablet** (768-1024px) | Collapsed to icons-only (48px wide), expands on hover | Shows breadcrumb + search icon + status | Flexible grid |
| **Desktop** (> 1024px) | Full sidebar (260px) as today | Full: breadcrumb + search bar + status + agents + avatar | Current layouts |

**Files to modify:**
- `components/Shell.tsx` — add state for sidebar open/collapsed, mobile overlay
- `components/Sidebar.tsx` — add collapse/expand, mobile slide-over variant, overlay backdrop
- `components/TopBar.tsx` — add hamburger button, responsive hiding of elements
- `app/globals.css` — add mobile/tablet responsive utilities

**Key technical decisions:**
- Sidebar state lives in Shell via React state (no zustand/context overhead for one boolean)
- Mobile sidebar uses `fixed inset-0 z-50` with backdrop blur
- Tablet collapsed sidebar shows only icons; expands to full on hover with CSS transition
- All glass-card containers get `w-full` + max-width constraints per breakpoint

#### A2. YVON Design System Integration

**Background image:** Copy `public/Background Image.jpg` from YVON 2.0 → YVON-OS.
- Applied as fixed background on Shell root: `background-image: url('/Background Image.jpg')`, cover, center
- Dimmed with overlay: `bg-black/60` behind content
- Glass cards already have backdrop-blur — will look stunning over the image

**Glass tokens enhancement:** Add to globals.css:
- YVON's original glass-card light variants (for cards that need higher contrast)
- Glass input/textarea styles
- Glass modal/overlay styles
- Progress bar accent (thin magenta line at top of viewport)

**Files to modify:**
- `components/Shell.tsx` — add background image layer
- `app/globals.css` — add YVON glass variants, responsive utilities, background overlay

#### A3. Responsive Page Grids

Every page gets responsive column layouts:

| Layout Pattern | Desktop | Tablet | Mobile |
|---------------|---------|--------|--------|
| Kanban + right rail | `grid-cols-[1fr_300px]` | `grid-cols-1` (rail below) | Stacked |
| Card grid (2-col) | `grid-cols-2` | `grid-cols-2` | `grid-cols-1` |
| Card grid (3-col) | `grid-cols-3` | `grid-cols-2` | `grid-cols-1` |
| Stats row (4 cards) | `grid-cols-4` | `grid-cols-2` | `grid-cols-2` |

**Files to modify** (12 pages total):
- `app/decision-queue/page.tsx`
- `app/task-board/page.tsx`
- `app/advisory-council/page.tsx`
- `app/social-approvals/page.tsx`
- `app/scheduler/page.tsx`
- `app/content-pipeline/page.tsx`
- `app/brain-wiki/page.tsx`
- `app/software-pipeline/page.tsx`
- `app/inbox/page.tsx`
- `app/newsletter/page.tsx`
- `app/asset-lab/page.tsx`
- `app/youtube-studio/page.tsx`

**Standard responsive class pattern:**
```
grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

#### A4. Mobile Navigation

On mobile, no sidebar visible. Instead:
- Hamburger in TopBar opens slide-over Sidebar
- Slide-over has full sidebar content scrollable
- Tapping a nav item closes sidebar + navigates
- Tapping backdrop closes sidebar
- Active page highlighted in sidebar

---

## Part B: Decision Queue — Full Data Wiring

### Current State
`app/decision-queue/page.tsx` has hardcoded mock data:
- "7 decisions" is a static number
- Decision cards are literal strings
- No workspace filtering actually works
- No Henry/Marcus filter layer
- No defer/snooze
- No Telegram nudges

### What We'll Build

#### B1. Data Pipeline

**Source tables** (already in Supabase via 50 migrations):
```
agent_sessions     → agent outputs/completions
execution_steps    → task execution records
war_room_plans     → strategy plan proposals
social_posts       → posts awaiting approval
war_room_commands  → pending commands
security_alerts    → credential leaks, key rotations
```

**New API route:** `app/api/decision-queue/route.ts`
- GET: aggregates all items needing decisions across ventures
- POST: records decision (approve/reject/defer)
- Marcus filter: only returns items with `needs_human_review = true`

**Filter logic (Marcus/Henry pattern:**
1. Fetches all pending items from Supabase
2. Marcus agent evaluates each item (via Hermes spawn or direct AI call)
3. Auto-handles items that match learned patterns (draft → approve flow)
4. Only surfaces items Marcus is uncertain about (the ~7 that need CEO)

**Response shape:**
```typescript
{
  needsYouCount: 7,
  filteredPercentage: 82,  // "Marcus handled 82% overnight"
  items: [
    {
      id: string,
      type: 'email' | 'security' | 'post' | 'code' | 'task',
      workspace: 'novizio' | 'hourbour',
      agent: { name: string, avatar: string },
      brief: string,
      context: string,
      actions: string[],  // ['approve', 'reject', 'defer']
      priority: 'high' | 'medium',
      createdAt: string,
    }
  ],
  metrics: {
    avgClearTime: '~24h',
    clearedToday: 12,
    autoHandled: 40,
  }
}
```

#### B2. Decision Queue Page Rewrite

**Header:**
- Title: "Decision Queue"
- Subtitle: "Everything in one feed. Aggregated by Marcus, trimmed to ~X%."
- Reduction stat badge (e.g. "82% handled overnight")
- "Clear my queue" button (one-by-one mode)
- Search/filter button

**Decision cards (main feed):**
- Each card shows: agent avatar, workspace tag, brief, context snippet, priority indicator
- Inline action buttons:
  - Email type: "Send" / "Edit & send" / "Open thread"
  - Security type: "Approve rotation" / "See what was stopped"
  - Post type: "Approve all" / "Review each"
  - Code type: "Approve & merge" / "Send back"
  - Task type: "Approve" / "Defer"
- Defer dropdown: "After a day" / "Tonight" / "Tomorrow morning" / "3 days"
- Snooze → Marcus nudges via Telegram when deferral elapses

**Right rail:**
- Workspace filter (All / Novizio / Hourbour) — actually filters this time
- "How it's flowing" metrics (real numbers from API)
- "Marcus's nudge plan" explainer

**Clear my queue mode:**
- Full-screen overlay
- Steps through items one at a time
- Large action buttons for quick triage
- Shows detailed brief per item
- "Keep going" auto-advances to next item

#### B3. Telegram Nudge Integration

When an item is deferred and its deferral time elapses:
1. Cron job checks for expired deferrals every 30 min
2. Sends Telegram message via `send_message` tool
3. Message: "Marcus: 3 decisions waiting — [link to queue]"

**Implementation:**
- Table: `decision_deferrals` (item_id, defer_until, nudge_sent)
- Cron script: `scripts/nudge-deferrals.mjs` (runs every 30 min via crontab)
- Uses existing Hermes `send_message` tool for Telegram delivery

#### B4. Data Flow Diagram

```
Agents produce output
    ↓
Marcus evaluates (Hermes spawn)
    ↓
Auto-handle (learned patterns)  ←┬→  Escalate to Decision Queue
    ↓                                ↓
Silent (done)                   CEO reviews in queue
                                    ↓
                              Approve / Defer / Reject
                                    ↓
                              Defer → Nudge timer → Telegram ping
```

---

## Files Changed (Phase 1 Total)

### New files (6):
- `app/api/decision-queue/route.ts` — GET/POST handler
- `lib/decision-filter.ts` — Marcus filter logic
- `scripts/nudge-deferrals.mjs` — Telegram nudge cron
- `components/MobileSidebar.tsx` — mobile slide-over wrapper
- `components/DecisionCard.tsx` — reusable decision card component
- `components/ClearQueueMode.tsx` — one-by-one triage overlay

### Modified files (18):
- `components/Shell.tsx` — responsive + background image
- `components/Sidebar.tsx` — collapse/expand + mobile
- `components/TopBar.tsx` — hamburger + responsive
- `app/globals.css` — YVON glass variants, responsive utils, overlay
- `app/decision-queue/page.tsx` — full rewrite with real data
- `app/task-board/page.tsx` — responsive grid
- `app/advisory-council/page.tsx` — responsive grid
- `app/social-approvals/page.tsx` — responsive grid
- `app/scheduler/page.tsx` — responsive grid
- `app/content-pipeline/page.tsx` — responsive grid
- `app/brain-wiki/page.tsx` — responsive grid
- `app/software-pipeline/page.tsx` — responsive grid
- `app/inbox/page.tsx` — responsive grid
- `app/newsletter/page.tsx` — responsive grid
- `app/asset-lab/page.tsx` — responsive grid
- `app/youtube-studio/page.tsx` — responsive grid

### Dependencies needed (0 new npm packages):
All responsive work uses Tailwind classes only. No new deps.

---

## Verification Criteria

After Phase 1, the following must pass:
1. ✅ `npx tsc --noEmit` — zero type errors
2. ✅ `npm run build` — compiles clean
3. ✅ Mobile view (< 768px): hamburger opens sidebar, pages stack single-column
4. ✅ Tablet view (768-1024px): icon sidebar, pages use 2-col grids
5. ✅ Desktop view (> 1024px): full sidebar, current layouts preserved
6. ✅ Background image visible behind glass cards on all breakpoints
7. ✅ Decision Queue shows real data from Supabase (or empty state if no data)
8. ✅ Workspace filter actually filters decision items
9. ✅ Defer button shows dropdown with time options
10. ✅ "Clear my queue" opens one-by-one mode

---

## What's NOT in Phase 1

- **Marcus AI filter learning** — the filter exists but learning over time comes later
- **Actual Telegram nudge sending** — cron job is written but needs Hermes Telegram integration
- **Other page data wiring** — only Decision Queue gets real data; other pages stay mock
- **War Room 3D** — advisory council stays as card layout only
- **Email integration** — inbox stays mock

---

## Approval Needed

Please confirm:
1. ✅ Proceed with Phase 1 responsive foundation?
2. ✅ Proceed with Decision Queue data wiring (Supabase + Marcus filter)?
3. ✅ Use YVON background image behind glass cards?
4. ✅ Any changes to the plan above?

*I'll execute after your approval. Each file change will be shown before committing.*
