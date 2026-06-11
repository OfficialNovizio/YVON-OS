# YVON 3.0 — Glass × LifeOS Architecture

> **Principle:** YVON's glass-morphism design language absorbs LifeOS's 32-page feature set.
> No copy-paste. Every LifeOS feature reimagined in YVON's dark/glass/neon aesthetic.
> Current 10 screens → 16 screens with full LifeOS capability.

---

## Design Rules (Non-Negotiable)

1. **Glass DNA stays.** Every new panel uses `_glass-tokens.ts` (backdrop-blur, semi-transparent bg, subtle borders, neon glow on hover).
2. **Dark foundation.** Full-bleed dark background image (existing). Glass panels float on top.
3. **Neon accent.** YVON's existing magenta/violet primary; per-venture overrides for Novizio (fashion-warm) / Hourbour (fintech-cool).
4. **Material Symbols.** No new icon library. Every icon from the existing set.
5. **Inter font.** No typography changes.
6. **Floating NavBar pill.** Stays as primary navigation.
7. **Inline actions.** LifeOS's "never leave the page" philosophy — approve, send, merge, defer all happen in-place via glass panels and modals.

---

## New Screen Architecture (16 screens, up from 10)

### SIDEBAR STRUCTURE

```
┌─────────────────────────┐
│ ◆ YVON OS               │
│   Novizio ▾             │  ← VentureSwitcher
├─────────────────────────┤
│ COMMAND                 │
│ ├ Decision Queue   [3]  │  ← NEW (primary screen)
│ ├ Task Board       [4]  │  ← NEW
│ ├ Advisory Council      │  ← NEW (extracted from War Room)
│ └ War Room              │  ← existing, upgraded
├─────────────────────────┤
│ ANALYTICS               │
│ ├ Overview              │
│ ├ Portfolio             │
│ ├ Social Media          │
│ ├ Content               │
│ ├ Reports               │
│ └ Trend Radar           │  ← NEW (Kai's Isaac)
├─────────────────────────┤
│ GROWTH                  │
│ ├ Creative Studio       │  ← UPGRADED (Social Approvals + Asset Lab)
│ ├ Scheduler             │  ← NEW
│ ├ Marketing             │
│ └ Competitor            │
├─────────────────────────┤
│ BUILD                   │
│ ├ Software Pipeline [1] │  ← NEW (PR gate + QA)
│ └ Idea Feed        [94] │  ← NEW
├─────────────────────────┤
│ KNOWLEDGE               │
│ ├ Brain & Wiki          │  ← UPGRADED (3D graph + library)
│ └ Merchandise           │
├─────────────────────────┤
│ SYSTEM                  │
│ ├ Email Inbox      [21] │  ← NEW
│ ├ Settings              │
│ └ Health                │
└─────────────────────────┘
```

Badges: live counts from Marcus filter (e.g., 3 decisions, 4 tasks proposed, 1 code review, 21 unread emails, 94 ideas).

---

## Screen-by-Screen Design (LifeOS feature → YVON glass translation)

### 1. Decision Queue `🆕` — The New Home Screen

**Absorbs:** CEO Command Dashboard (Briefing tab), current _decision-queue.tsx

**LifeOS DNA applied:**
- Marcus filter layer: reads all agent output, surfaces only ~7 items that need CEO
- Reduction stat: "Marcus filtered 83% — 7 items need you"
- Defer/snooze: "Remind me tonight / tomorrow morning / in 3 days"
- "Clear my queue" one-by-one mode
- Telegram nudge: cron monitors deferred items, sends via send_message

**YVON glass design:**
- Header: "Decision Queue" with venture breadcrumb, Marcus reduction stat
- Feed: glass cards with neon-left-border color-coded by source:
  - 🟣 Purple = Code review (Software Pipeline)
  - 🟢 Green = Content approval (Social Approvals)
  - 🟡 Yellow = Task proposal (Task Board)
  - 🔵 Blue = Email reply (Email Inbox)
  - 🔴 Red = Security stop (Knox key rotation)
- Each card: agent avatar, workspace tag, brief, confidence indicator, inline action buttons
- Right rail: workspace filter, "How it's flowing" metrics, "Marcus nudge plan"
- "Clear my queue" button → full-screen glass overlay, one card at a time

**Data sources:** Task Board (proposed/review), Social Approvals, Software Pipeline (review stage), Email Inbox (review drafts), Knox security stops.

---

### 2. Task Board `🆕`

**LifeOS DNA applied:**
- Columns: Proposed → Backlog → This Week → Review → Done
- **No "In Progress" column** — replaced by Live Activity tracker (right rail)
- Two yellow gates (Proposed + Review) escalate to Decision Queue
- Learning: auto-approve safe task types after 3 successes

**YVON glass design:**
- Horizontal scrolling Kanban with glass columns
- Task cards: glass panels with agent avatar, venture tag, priority dot
- Proposed cards: neon yellow left border, "Approve" button
- Review cards: neon yellow left border, "Approve" / "Send back" buttons
- Live Activity tracker: right rail, real-time feed of agent work (agent avatar + task + status pulse)
- "New task" button: glass modal with form (title, description, assign agent, priority)

**Agents proposing tasks:** All 13 agents can propose. Marcus auto-approves low-risk recurring tasks.

---

### 3. Advisory Council `🆕`

**Extracted from:** War Room (currently single-purpose)

**LifeOS DNA applied:**
- 5 YVON agents form the council: Marcus (CEO), Kai (analyst), Lena (brand), Felix (finance), Dev (technical)
- Full knowledge-base access (Supabase vector search)
- Rotating debate topics, set by CEO ("Set today's topic")
- Proposals: Accept / Accept & create task / Assign to agent / Ask follow-up / Defer
- Pattern Tracker: recurring themes the council raises
- Audio player: future — TTS voices for each agent (Hermes text_to_speech)

**YVON glass design:**
- Hero recommendation: prominent glass card with agent avatars, proposed-by line, first step suggestion
- Recommendation stack: scrollable glass cards below, tagged by category (Product, Strategy, Finance, Brand)
- Pattern Tracker: right rail, recurring themes surfaced as glass chips
- "Set today's topic" → glass modal
- "Run live session" → launches War Room

**War Room upgrade:** gains "Council recommends" popup at session end with synthesized recommendation.

---

### 4. War Room `♻️ UPGRADED`

**Changes:**
- Advisory Council spin-off: live sessions launch from Council page
- "Council recommends" card slides up at session end
- Transcript rail stays as glass panel
- Topic set from Advisory Council page

---

### 5. Trend Radar `🆕`

**LifeOS DNA applied:** Isaac-style trend detection across ventures

**YVON glass design:**
- Feed of trend cards: topic, source, confidence score, venture relevance
- Each card: "Turn into task" / "Turn into content idea" / "Send to Council" actions
- Right rail: trend categories, time range filter, venture filter
- Powered by: Kai analyst running periodic trend scans via cron

---

### 6. Creative Studio `♻️ UPGRADED`

**Absorbs:** Social Approvals, Asset Lab

**New tabs:**
- **Generate** (existing) — creative brief → agent generation
- **Approve** `🆕` — Social Approvals flow: A/B copy variants side-by-side glass panels, 8-image grid picker, "Post now" / "Schedule" buttons. William (copy) + Leonardo concept (branded imagery via existing image gen)
- **Gallery** `🆕` — Asset Lab: masonry grid of all generated assets, brand kit panel (colors, logos, assets per venture), download/reuse, cost tracker
- **Calendar** (existing) — upgraded with Scheduler

---

### 7. Scheduler `🆕`

**LifeOS DNA applied:** Drag-drop calendar across platforms, failure triage

**YVON glass design:**
- Week/day calendar grid with glass time slots
- Post cards: drag to desired day/time, platform badge, content preview
- Platform chips: Instagram, Facebook, LinkedIn, TikTok (filterable)
- Right rail: Failure triage (failed posts with Diagnose / Create fix task), Publishing engine status, connected accounts
- Posts arrive from: Creative Studio "Schedule" button, Shorts

---

### 8. Software Pipeline `🆕`

**LifeOS DNA applied:** PR-only gate, Steve QA, portfolio view

**YVON glass design:**
- **Portfolio view:** glass project cards — one per repo/project with progress bar, active task count, status (needs review / active / idle), GitHub/Vercel links
- **Kanban view:** columns: Triage → Planning → Backlog → In Progress → Quinn QA → Needs Review → Done
- **Quinn QA gate:** red if QA failed → sends back to Planning. Green if passed → advances to Needs Review.
- **Needs Review:** escalates to Decision Queue
- **Task detail rail:** right-side glass panel showing QA results, PR link, approve/send-back buttons

**Agent rules:**
- Dev: code + create PR (NEVER merge to master)
- Quinn: automated QA (react-doctor + lint + typecheck + test)
- CEO: final review + merge (from Decision Queue or Software Pipeline)
- Failed QA → back to Planning (not In Progress)

---

### 9. Idea Feed `🆕`

**LifeOS DNA applied:** Product/build idea intake, backlog triage

**YVON glass design:**
- Feed of idea cards with: title, description, source (CEO / agent / Council / Trend Radar), venture tag
- Actions: Promote to Software Pipeline (creates project) / Defer / Reject
- Right rail: filters by venture, source, status
- Badge shows pending count (starts at 0, grows over time)

---

### 10. Brain & Wiki `♻️ UPGRADED`

**Current:** 2D graph view (1,058 nodes) on CEO Operations tab
**Target:** 3D knowledge graph + document library

**LifeOS DNA applied:**
- 3D force-directed graph (Three.js / react-three-fiber)
- Node size = knowledge depth, color by visibility zone
- Click node → detail panel: description, connected topics, source MD files
- Library tab: browse/search all Supabase-stored documents by category
- Visibility scoping: Private / Team / Venture / Cross-Venture
- "What agents don't know" gaps panel → actionable tasks
- Vectorized + semantic search for all agents (already have Supabase)

**YVON glass design:**
- Graph view: dark 3D space with glowing nodes (magenta/violet/teal by zone), glass overlay controls (zoom, filter, search)
- Library view: glass table rows, glass filter chips, document detail slide-out panel
- Gaps panel: "No data on TikTok Shop fees" → "Create research task"

---

### 11. Email Inbox `🆕`

**LifeOS DNA applied:** Multi-account, inline drafts, triage mode

**YVON glass design:**
- Account tabs at top (4 accounts)
- Message list: glass rows with sender, subject, snippet, draft status
- Inline response: selecting an email expands a glass reply panel with pre-drafted response, "Send" / "Edit & send" / "Regenerate" buttons
- Triage mode: full-screen glass overlay, one email at a time
- Right rail: "What we know about [sender]" — contact intelligence pulled from Supabase
- "Reply now" vs "Review" sections: auto-drafted vs. agent-uncertain emails
- Draft-first: nothing auto-sends. Vision: auto-send for trusted categories over time

**Integration:** Connects to email accounts via IMAP/SMTP (Himalaya CLI or direct integration). Hermes himalaya skill already exists.

---

### 12. Analytics (all tabs) `♻️`

**Existing tabs:** Overview, Portfolio, Social Media, Content, Reports
**Kept as-is.** Social Media tab already has Instagram Insights + Facebook Graph integration.

---

### 13. Marketing `♻️`

**Existing tabs:** Growth Sprint, Content Intelligence, Community, Calendar, Content
**Kept as-is.** Already overhauled in Wave 1 — real Supabase data, unlocked Content Intelligence engine.

---

### 14. Competitor `♻️`

**Existing tabs:** Overview, Alerts, Content Gaps, Content Intel, Keywords, Opportunities, Reports
**Kept as-is.** Already overhauled — glass dedup, Kai's Read, dual-tier auto-discovery.

---

### 15. Settings `♻️`

**Existing tabs:** Profile, Agents, Providers, Panels, Secrets, Venture, War Room, Danger
**Minor upgrade:** Agents tab gains machine/RAM/SSH overlay if multi-server setup emerges.

---

### 16. Health `♻️`

**Kept as-is.**

---

## Removed / Reabsorbed

| Old Screen | Fate |
|-----------|------|
| CEO Command Dashboard | **Absorbed into Decision Queue** (briefing data) + Task Board (operations data) |
| Career | **Removed** (not needed for YVON's business context) |
| Merchandise | **Kept** under Knowledge |

---

## Seven Design Patterns — YVON Glass Translation

### Pattern 1: Human-as-Bottleneck Filtering
Marcus becomes the filter. Implemented as: `lib/marcus-filter.ts` — reads all agent output from Supabase, applies decision rules, surfaces urgent items to Decision Queue. Reduction stat displayed prominently.

### Pattern 2: Learning Over Time
`lib/decision-learning.ts` — tracks what CEO approves/defers. After 3 consecutive same-type approvals, auto-approves. Stored in Supabase `decision_patterns` table.

### Pattern 3: Two Yellow Gates
Implemented as status values in Supabase `tasks` table: `proposed` + `review` both trigger Decision Queue entries. Shared component: `YellowGateCard.tsx` used in Task Board, Software Pipeline, and Social Approvals.

### Pattern 4: Defer/Snooze + Telegram Nudges
`lib/defer.ts` — snooze items with `defer_until` timestamp. Cron job checks every 30 min, triggers `send_message` to Telegram for overdue items.

### Pattern 5: Drafts-Not-Sends
All external side-effect actions (social post, email send, code merge, key rotation) start as `draft` status. Only CEO approval changes status to `execute`. Vision: `auto_execute` flag for trusted categories.

### Pattern 6: Per-Venture Theming
CSS custom properties on `:root` switch when VentureSwitcher changes venture:
- Novizio: `--accent: #your-warm-color; --bg-tint: ...`
- Hourbour: `--accent: #your-cool-color; --bg-tint: ...`
Glass tokens already support this via `_glass-tokens.ts` — just add venture overrides.

### Pattern 7: Inline Actions
Every card (decision, task, post, email, code review) has inline action buttons. No navigation required. Glass modal overlays for detail views. Keyboard shortcuts for power users.

---

## Build Order

### PHASE 1 — Foundation (build first, unblocks everything else)
1. **Marcus filter layer** (`lib/marcus-filter.ts` + `lib/defer.ts` + `lib/decision-learning.ts`)
2. **Decision Queue** screen (new home screen)
3. **Sidebar restructure** (new groups, badges, new pages)
4. **Per-venture theming** (CSS custom properties)

### PHASE 2 — Agent Workflow (the "command center")
5. **Task Board** screen (Kanban + Live Activity)
6. **Advisory Council** + War Room upgrade
7. **Trend Radar** tab (Kai's Isaac)

### PHASE 3 — Content & Social
8. **Creative Studio upgrade** (Approve tab, Gallery tab)
9. **Scheduler** screen (drag-drop calendar)

### PHASE 4 — Build Pipeline
10. **Software Pipeline** screen (portfolio + Kanban + QA gate)
11. **Dev agent PR-only rule** (config change)
12. **Quinn automated QA integration** (react-doctor in CI + pre-merge check)

### PHASE 5 — Knowledge & System
13. **Brain & Wiki upgrade** (3D graph + library)
14. **Email Inbox** screen
15. **Idea Feed** screen

### PHASE 6 — Polish
16. **Learning system** (decision pattern tracking)
17. **Telegram nudge cron** (deferred item reminders)
18. **All badges wired** (live counts across sidebar)

---

## What Stays Exactly As-Is

- **Glass design system** — `_glass-tokens.ts`, `globals.css`, `tailwind.config.ts`
- **VentureSwitcher** — cookie-based, works across all screens
- **Supabase backend** — all 49 migrations, all tables
- **API routes** — all ~60+ routes preserved, Decision Queue/Task Board add ~10 new routes
- **CI/CD** — lint → typecheck → build → deploy stays identical
- **13 agents** — all stay, Marcus/Kai/Quinn/Dev gain new responsibilities
- **Cron jobs** — IST cycle stays, add 1 new cron for deferred item nudge
- **Token tracking** — DeepSeek balance stays live
- **Facebook Graph / Apify / Instagram** — all existing integrations preserved

---

## File Count Estimate

| Layer | New Files | Modified Files |
|-------|:---------:|:--------------:|
| lib/ (business logic) | 5 | 3 |
| app/screens/ (new screens) | 12 | 5 |
| app/api/ (new routes) | 10 | 2 |
| app/components/ (shared) | 8 | 3 |
| docs/ | 4 | 1 |
| **Total** | **~39** | **~14** |

---

*Architecture plan v1.0 — ready for implementation sign-off.*
