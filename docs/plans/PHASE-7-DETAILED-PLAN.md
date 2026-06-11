# Phase 7 — YVON OS Feature Audit & Gap Analysis

> **CEO Marcus:** Full audit of every page, every feature — what's live, what's missing, what the old LifeOS spec demands.
> **Date:** 2026-06-11
> **Source:** 35 LifeOS briefings (`yvon-os/Briefings/`) + agent MEMORY.md files + current codebase inspection

---

## Methodology

Two-reference comparison:
- **Reference A:** Current YVON OS codebase (`/root/yvon/app/`) — 35 pages, 173 API routes
- **Reference B:** LifeOS product briefings (`/root/yvon-os/Briefings/00–32`) — specs from the "My AI Agents Redesigned My Mission Control" walkthrough and 32 screenshots

Each page was audited for feature coverage against its briefing spec. Features confirmed present in the codebase get ✅. Features in the spec but missing get ❌.

---

## 1. COMMAND CENTER (7 pages)

### 1.1 Dashboard / Home
| Feature | Status | Notes |
|---------|:------:|-------|
| Greeting + workspace subtitle | ✅ | Live |
| System health badge | ✅ | Live |
| Agents-live counter | ✅ | Live |
| Decision queue summary | ✅ | Live |
| Venture cards with pending counts | ✅ | Live |
| Activity feed | ✅ | Live |
| DeepSeek balance display | ✅ | Live |
| Token usage tracker | ✅ | Live |
| **Sidebar badge counts** (global) | ❌ | LifeOS sidebar shows live count badges on every nav item (e.g. "Social Approvals 6", "Idea Feed 94") |
| **Global search: "Ask Henry or jump anywhere"** | ❌ | LifeOS top bar has a centered command box for jump-to-page + ask-chief-of-staff |

**Gap severity:** Low — page is solid. Missing global chrome (sidebar badges, global search) is a system-wide concern.

---

### 1.2 Decision Queue
| Feature | Status | Notes |
|---------|:------:|-------|
| Decision card feed with workspace tags | ✅ | Live |
| Email reply cards with inline draft | ✅ | Live |
| Security stop / credential leak cards | ✅ | Live |
| Post approval batch cards | ✅ | Live |
| Code PR merge gate cards | ✅ | Live |
| Workspace filter rail | ✅ | Live |
| "How it's flowing" metrics rail | ✅ | Live |
| "Clear my queue" triage mode (one-by-one) | ✅ | Live |
| Defer / snooze (day, tonight, tomorrow, few days) | ✅ | Live |
| Nudge plan + Telegram pings | ✅ | Live |
| **Henry agent identity** | ❌ | Cards show generic agent avatars, not explicitly "Henry" (Chief of Staff) |
| **Learning behavior** (fewer items over time) | ❌ | Design intent — Henry learns owner decisions, auto-handles more |

**Gap severity:** Low. The queue is the most feature-complete page.

---

### 1.3 Task Board
| Feature | Status | Notes |
|---------|:------:|-------|
| Kanban: PROPOSED → BACKLOG → THIS WEEK → REVIEW → DONE | ✅ | Five columns live |
| No "In Progress" column (replaced by Live Activity) | ✅ | Correct per spec |
| Approve buttons on PROPOSED cards | ✅ | Live |
| Approve/discard on REVIEW cards | ✅ | Live |
| Live Activity tracker (right rail) | ✅ | Agent working feed |
| Decision Queue escalation from Proposed/Review | ✅ | Live |
| **Learning behavior** (auto-approve safe task types) | ❌ | Design intent — agents learn which tasks need review |

**Gap severity:** Low.

---

### 1.4 Advisory Council (+ War Room)
| Feature | Status | Notes |
|---------|:------:|-------|
| Recommendations list | ✅ | Live |
| "Set today's topic" | ✅ | Live |
| "Run a live session" → War Room | ✅ | Live |
| Pattern Tracker (right rail) | ✅ | Live |
| War Room transcript rail | ✅ | Live |
| War Room 3D conference room | ✅ | Live |
| "Jump in — steer the debate" | ✅ | Live |
| Council recommends popup | ✅ | Live |
| Audio player / podcast-style | ✅ | Live |
| Accept / Accept & create task / Defer / Reject | ✅ | Live |
| **HeyGen voice integration** | ❌ | Spec calls for distinct HeyGen voices per council agent |

**Gap severity:** Low. HeyGen is a nice-to-have integration.

---

### 1.5 Agents Page
| Feature | Status | Notes |
|---------|:------:|-------|
| Agent list with status dots | ✅ | Live |
| Per-agent settings (model selector) | ✅ | Live |
| Per-agent system prompt extension | ✅ | Live |
| Department color coding | ✅ | Live |
| **Machine groups (Mac Mini 1/2/3)** | ❌ | LifeOS spec: agents grouped by physical machine with status |
| **Fleet stats: machines online, agents running, RAM** | ❌ | LifeOS header: "3 machines online · 23 agents running · 48 GB RAM" |
| **Hermes gateway indicator** | ❌ | LifeOS: "Routing · Hermes" status indicator |
| **SSH / terminal direct connection** | ❌ | LifeOS: per-machine SSH + screen-share buttons |
| **Screen-share option** | ❌ | LifeOS: owner can jump into a machine visually |

**Gap severity: HIGH.** The current Agents page shows agent configuration. The LifeOS spec wants an infrastructure/fleet monitoring page. Two completely different purposes. The current configure functionality (model selector, system prompt) should move to the Settings page; the Agents page should be rebuilt to match the spec.

**LifeOS spec — what this page should be:**
- Top row: 4 KPI cards → machines online, agents running, RAM used, Hermes routing status
- Below: machine groups (Mac Mini 2 Hermes → Personal Layer agents, Mac Mini 1 OpenClaw → Workspace agents, Mac Mini 3 Workshop → training agents, Mac Studio M5 → reserved)
- Each machine expandable: shows agents on it, SSH button, screen-share button
- Search + link to Org Chart

---

### 1.6 Org Chart
| Feature | Status | Notes |
|---------|:------:|-------|
| Hierarchical org layout | ✅ | Live |
| Personal Layer (C-suite) | ✅ | Live |
| Workspace Tier (master agents) | ✅ | Live |
| Per-workspace teams | ✅ | Live |
| Search | ✅ | Live |
| **Skill Workshop band (bottom)** | ❌ | LifeOS: bottom tier shows per-master "workshops" that improve agents above |
| **Color-coded by workspace** | ❌ | LifeOS: per-workspace teams color-coded |

**Gap severity:** Medium.

---

### 1.7 Office
| Feature | Status | Notes |
|---------|:------:|-------|
| 3D rendered office floor | ✅ | Live |
| Desks per agent | ✅ | Live |
| Working / idle state visualization | ✅ | Live |
| Navigable camera | ✅ | Live |
| **Workspace tabs** (Whole floor / Vibe / By Design / Valhalla) | ❌ | LifeOS: one room per workspace |
| **Meeting state** (agents gathered at table) | ❌ | LifeOS: agents in meeting, not just working/idle |
| **"Speak to a room/agent" action** | ❌ | LifeOS: jump into chat with agent from floor |

**Gap severity:** Medium. Current is a single room; spec wants per-workspace rooms.

---

### 1.8 Skill Workshop
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but stub |
| **Per-master workshops** (William's Workshop, Leonardo's Workshop) | ❌ | Entire page is a thin stub; spec calls for per-agent skill training interfaces |
| **Skill training / iteration UI** | ❌ | Building, testing, refining skills for master agents |

**Gap severity: HIGH.** Entire page is basically placeholder content. This is the training/improvement layer for agents — a core differentiator.

---

## 2. LONG-FORM CONTENT (4 pages)

### 2.1 Content Pipeline
| Feature | Status | Notes |
|---------|:------:|-------|
| Kanban: IDEAS → SCRIPTING → THUMBNAILS → FILMING → EDITING → READY → PUBLISHED | ✅ | 7 columns live |
| Cadence indicator (1 video/week) | ✅ | Live |
| Cards show workspace + agents | ✅ | Live |
| Calendar view toggle | ✅ | Live |
| **Strategy view** | ❌ | LifeOS: alternative planning/strategy layout |

**Gap severity:** Low.

---

### 2.2 Production Calendar
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but thin (30 lines) |
| **Weekly/monthly grid with content cards** | ❌ | Spec: calendar layout showing filming/edit/publish dates |
| **Cadence health at a glance** | ❌ | Spec: gaps in schedule visible |

**Gap severity: HIGH.** 30-line stub vs a fully specified calendar view.

---

### 2.3 YouTube Studio
| Feature | Status | Notes |
|---------|:------:|-------|
| Title workshop with variants | ✅ | Live |
| Thumbnail section | ✅ | Live |
| Description generator from transcript | ✅ | Live |
| Chapter extraction | ✅ | Live |
| Upload checklist | ✅ | Live |
| Pinned comment generator | ✅ | Live |
| **Packaging mode** (lifecycle: footage → edit → ready) | ❌ | Spec: flow chips showing video lifecycle |
| **A/B test helper for title/thumbnail** | ❌ | Spec: split-testing UI |

**Gap severity:** Low.

---

### 2.4 YouTube Analytics
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but thin (26 lines) |
| **Per-video metrics (views, retention, CTR, subs)** | ❌ | Spec: detailed per-video analytics |
| **Channel-level trends over time** | ❌ | Spec: comparisons, title/thumbnail pattern winners |

**Gap severity: HIGH.** 26-line stub vs full analytics dashboard.

---

## 3. SHORTS (2 pages)

### 3.1 Short Pipeline
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but thin (36 lines) |
| **Staged board (idea → cut/clip → caption → ready)** | ❌ | Spec: Kanban for shorts production |

**Gap severity: HIGH.** Stub.

---

### 3.2 Shorts (Distribution)
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live |
| Upload zone | ✅ | Live |
| **Per-platform queue cards** | ❌ | Spec: one card per platform (YouTube, LinkedIn, Instagram, TikTok), each with its own preview + copy |
| **Platform filter chips** | ❌ | Spec: YouTube / LinkedIn / Instagram / TikTok filter |

**Gap severity: Medium.**

---

## 4. POSTS (4 pages)

### 4.1 Social Approvals
| Feature | Status | Notes |
|---------|:------:|-------|
| A/B copy variants (William) | ✅ | Live |
| 8-image grid (Leonardo) | ✅ | Live |
| Post now / Schedule actions | ✅ | Live |
| Image selection | ✅ | Live |
| **Full match to LifeOS spec** | ✅ | This is one of the best-implemented pages |

**Gap severity:** None. Feature-complete per spec.

---

### 4.2 Scheduler
| Feature | Status | Notes |
|---------|:------:|-------|
| Week/day calendar with post cards | ✅ | Live |
| Drag and drop | ✅ | Live |
| Platform filters (YouTube, LinkedIn, Instagram, TikTok) | ✅ | Live |
| Failure triage | ✅ | Live |
| Publishing engine status | ✅ | Live |
| Refine button | ✅ | Live |
| **Platform filter chips** (visual chip UI) | ❌ | Minor — content is present but chip UI differs from spec |

**Gap severity:** Low.

---

### 4.3 Social Analytics
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but thin (44 lines) |
| **Per-platform + aggregate metrics** | ❌ | Spec: impressions, engagement, follower growth |
| **A/B outcome tracking** | ❌ | Spec: which copy variant / image won |
| **Best-performing posts** | ❌ | Spec: top post callouts |

**Gap severity: HIGH.** 44-line stub vs fully specified analytics.

---

### 4.4 Newsletter
| Feature | Status | Notes |
|---------|:------:|-------|
| Kit integration indicator | ✅ | Live |
| Audience tab (subscriber metrics, segments) | ✅ | Live |
| Compose tab (draft editor, blocks, subject line) | ✅ | Live |
| Broadcasts tab (past sends) | ✅ | Live |
| Sequences tab (automations) | ✅ | Live |
| Growth tab (sign-up sources) | ✅ | Live |
| Analytics tab | ✅ | Live |
| Right rail live preview | ✅ | Live |
| **Open rate / click rate data** | ❌ | Minor — Broadcasts tab shows sends but missing engagement metrics |

**Gap severity:** Low. This is one of the most feature-rich pages.

---

## 5. KNOWLEDGE (3 pages)

### 5.1 Brain & Wiki
| Feature | Status | Notes |
|---------|:------:|-------|
| 3D graph view | ✅ | Live |
| Library view (document browser) | ✅ | Live |
| Node click detail panel | ✅ | Live |
| Semantic search | ✅ | Live |
| "What the agents know" gaps panel | ✅ | Live |
| **Force-directed graph** (physics-based) | ❌ | Current graph is static nodes; spec wants force-directed with camera orbit |
| **Visibility filter chips** (All / Private / Team / Workspace / Cross-WS) | ❌ | Spec: filter knowledge by visibility scope |
| **Node size reflecting knowledge volume** | ❌ | Minor visual detail |
| **Topic/Document counters** (e.g. 248 topics, 3,412 documents) | ❌ | Minor KPI row |

**Gap severity:** Medium. Graph needs force-directed layout + visibility filters.

---

### 5.2 Asset Lab · Leonardo
| Feature | Status | Notes |
|---------|:------:|-------|
| Gallery view | ✅ | Live |
| Generate mode | ✅ | Live |
| Brand kits | ✅ | Live |
| Spend tracker ($/last/$today/$month) | ✅ | Live |
| Search + brand filter chips | ✅ | Live |
| **Type filter chips** (Thumbnail, Post, Hero, Cinematic, Graphic) | ❌ | Spec: filter by asset type |
| **Masonry grid layout** | ❌ | Spec: masonry/grid, current is standard grid |

**Gap severity:** Medium.

---

### 5.3 Trend Radar · Isaac
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but thin (47 lines) |
| **Trend detection cards across workspaces** | ❌ | Spec: Isaac identifies trends, tagged by workspace, with sources |
| **Feed into Content Pipeline / Idea Feed** | ❌ | Spec: trend → task/idea promotion |
| **Feed into Advisory Council** | ❌ | Spec: strategic inputs |

**Gap severity: HIGH.** Stub page for a core knowledge agent.

---

## 6. BUILD · SOFTWARE FACTORY (2 pages)

### 6.1 Idea Feed
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live |
| Idea card stream | ✅ | Live |
| Sidebar badge (94) | ❌ | Spec: live count badge on sidebar nav |
| **Promote to Software Pipeline** | ❌ | Spec: idea → project promotion |
| **Input from Trend Radar + Advisory Council** | ❌ | Minor integration |

**Gap severity:** Medium. Core flow missing.

---

### 6.2 Software Pipeline
| Feature | Status | Notes |
|---------|:------:|-------|
| Portfolio overview (project cards) | ✅ | Live |
| Kanban: TRIAGE → PLANNING → IN PROGRESS → STEVE QA → NEEDS REVIEW → DONE | ✅ | 6 columns live |
| Nexus (CTO) + Steve (QA) agent roles | ✅ | Live |
| PR integration | ✅ | Live |
| Task detail panel with QA gate recap | ✅ | Live |
| **BACKLOG column** | ❌ | Spec has BACKLOG between PLANNING and IN PROGRESS |
| **Merge gate from Decision Queue** | ❌ | Spec: owner reviews NEEDS REVIEW items → Decision Queue card |

**Gap severity:** Low. Missing one column + integration.

---

## 7. REVENUE (2 pages)

### 7.1 Consulting CRM
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but thin |
| **Lead/deal pipeline** (Lead → Conversation → Proposal → Won/Lost) | ❌ | Spec: structured pipeline |
| **Per-lead context from memory system** | ❌ | Spec: relationship history, last contact |
| **Draft outreach via agents** | ❌ | Spec: agent-assisted outreach |
| **Sidebar badge (3)** | ❌ | Minor — missing badge count |

**Gap severity: HIGH.** Thin stub vs revenue pipeline spec.

---

### 7.2 Cinematic Sites
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live but thin |
| **Client site project board** (inquiry → scoped → production → delivered) | ❌ | Spec: project tracking |
| **Per-project assets from Asset Lab** | ❌ | Spec: hero imagery from Leonardo |
| **Tie into Software Pipeline for builds** | ❌ | Spec: Nexus builds/deploys sites |

**Gap severity: HIGH.** Thin stub vs project delivery spec.

---

## 8. SYSTEM (5 pages)

### 8.1 Inbox
| Feature | Status | Notes |
|---------|:------:|-------|
| Multi-account email list | ✅ | Live (4 accounts) |
| Inline draft responses | ✅ | Live |
| "Reply now" with pre-drafted replies | ✅ | Live |
| Triage mode (one-by-one) | ✅ | Live |
| Account filter tabs | ✅ | Live |
| Escalate to Henry | ✅ | Live |
| **Contact intelligence panel** ("What we know about [sender]") | ❌ | Spec: right-rail panel with relationship, value, memory notes |
| **Inbox Zero protocol indicator** | ❌ | Spec: "Inbox Zero · twice daily · X% done · next sweep" |

**Gap severity:** Medium.

---

### 8.2 Hardware & Runtime
| Feature | Status | Notes |
|---------|:------:|-------|
| Page exists | ✅ | Live |
| **Machine fleet view** (Mac Mini 1/2/3, Mac Studio M5) | ❌ | This data should also surface on Agents page |
| **SSH/terminal per machine** | ❌ | Spec: direct connection buttons |
| **Cron jobs + memories reference** | ❌ | Minor |

**Gap severity:** Medium. This and Agents page overlap — spec splits hardware here and agents there.

---

### 8.3 Settings
| Feature | Status | Notes |
|---------|:------:|-------|
| 7 static cards (Profile, Preferences, AI Provider, Database, API Keys, Active Venture, Deployment) | ✅ | Live |
| Venture sub-page (General, Technical, Social, Deployment) | ✅ | Live |
| 13 deployment platform cards with credentials | ✅ | Live |
| DeepSeek balance | ✅ | Live |
| Token usage estimation | ✅ | Live |
| Toggles persist to localStorage | ✅ | Live |
| **Agent model per-agent configuration** (currently on Agents page) | ⚠️ | Misplaced — should be here, not on Agents page |

**Gap severity:** Low. Needs content relocation from Agents page.

---

### 8.4 People, Projects, Docs, Logs
| Feature | Status | Notes |
|---------|:------:|-------|
| All pages exist | ✅ | Live but thin stubs |
| **People:** contact directory with memory integration | ❌ | Spec: directory linked to memory system |
| **Projects:** portfolio with status, progress, GitHub/Vercel links | ❌ | Spec: project overview |
| **Docs:** authored documentation/SOPs | ❌ | Spec: knowledge base of docs |
| **Logs:** activity/audit log | ❌ | Currently thin |

**Gap severity:** Medium. Four pages that need fleshing out per spec.

---

## 9. GLOBAL UI (cross-page)

### 9.1 Sidebar
| Feature | Status | Notes |
|---------|:------:|-------|
| Grouped navigation (Command, Long-form, Shorts, Posts, Knowledge, Build, Revenue) | ✅ | Live |
| **Live count badges** on nav items | ❌ | LifeOS: "Social Approvals 6", "Idea Feed 94", "Consulting CRM 3" |
| **Workspace switcher in sidebar** | ❌ | LifeOS: WORKSPACE selector at top of sidebar. Currently in TopBar pill |

**Gap severity: MEDIUM.** Badges are a core UX pattern — the whole system is built around surfacing "what needs you" counts.

---

### 9.2 Top Bar
| Feature | Status | Notes |
|---------|:------:|-------|
| Breadcrumb (workspace / page) | ✅ | Live |
| System health indicator | ✅ | Live |
| Agents-live counter | ✅ | Live |
| Workspace switcher pill | ✅ | Live (TopBar) |
| **Global search: "Ask Henry or jump anywhere…"** | ❌ | LifeOS: centered command box for search + ask chief-of-staff |

**Gap severity: MEDIUM.** The command box is the fastest way to navigate across 33 pages.

---

## 10. AGENT SYSTEM (cross-cutting)

### 10.1 Agent Personalities (from agent-department/MEMORY.md)
| Agent | Personality Baseline | Implemented? |
|-------|-------------------|:-----------:|
| Marcus (CEO) | Steve Jobs — conviction, triple-pass, taste over data | ❌ Not in system prompts |
| Diana (COO) | Operations — workflow, process, milestones | ❌ |
| Dev (Lead) | Linus Torvalds — good taste, no diplomacy, own decisions | ❌ |
| Raj (Backend) | Supabase, database, query, schema, migration | ⚠️ Partial |
| Mia (Frontend) | React, UI, Tailwind, CSS, design system | ⚠️ Partial |
| Quinn (QA) | Testing, bugs, lint, build check, code quality | ⚠️ Partial |
| Kai (Analyst) | Market/competitor intelligence | ❌ |
| Lena (Brand) | Copy, caption, content, brand voice | ❌ |
| Rio (Ads) | Paid ads, Meta, TikTok, ROAS, funnel | ❌ |
| Nate (Growth) | Growth experiments, conversion | ❌ |
| Atlas (Art Director) | Visual direction, design quality | ❌ |
| Pixel (Production) | Asset production, delivery | ❌ |
| Felix (Finance) | Financial intelligence, runway, pricing | ❌ |
| Kahneman (Psychology) | Behavioral validation, cognitive bias check | ❌ |

**Gap severity: HIGH.** 13 agents exist in the org chart but lack their documented personality baselines in the actual agent system.

---

### 10.2 Agent Workflows (not implemented)
| Workflow | Spec | Status |
|----------|------|:------:|
| Henry filters & escalates to Decision Queue | Briefing 01 | ❌ Design intent |
| Nexus codes PRs, never merges | Briefing 22 | ❌ Design intent |
| Steve QA gate between Nexus and owner | Briefing 22 | ❌ Design intent |
| Knox security stops + credential rotation | Briefing 01 | ❌ Design intent |
| William A/B copy generation | Briefing 14 | ⚠️ Partial |
| Leonardo 8-image generation per post | Briefing 14, 19 | ❌ |
| Isaac trend detection across workspaces | Briefing 20 | ❌ |
| Henry pre-drafts all email replies | Briefing 25 | ❌ |
| Morning brief via cron + Telegram | MEMORY.md | ⚠️ Partial (API exists, cron not verified) |

---

## 11. PRIORITY MATRIX

### 🔴 CRITICAL — Pages that are stubs or completely off-spec
| # | Page | Lines | Issue |
|---|------|:-----:|-------|
| 1 | **Agents page** | 223 | Completely wrong purpose — shows agent config, should show infrastructure/fleet |
| 2 | **Skill Workshop** | 37 | Stub — core differentiator, agent improvement system |
| 3 | **Production Calendar** | 30 | Stub — should be full calendar with content scheduling |
| 4 | **YouTube Analytics** | 26 | Stub — should be full analytics dashboard |
| 5 | **Social Analytics** | 44 | Stub — should be cross-platform analytics |
| 6 | **Trend Radar** | 47 | Stub — Isaac's trend detection feed |
| 7 | **Consulting CRM** | ~53 | Thin — should be lead/deal pipeline |
| 8 | **Cinematic Sites** | ~37 | Thin — should be client project tracker |
| 9 | **Short Pipeline** | 36 | Stub — should be shorts Kanban |

### 🟡 HIGH — Missing key features
| # | Page | Gap |
|---|------|-----|
| 10 | **Brain & Wiki** | Force-directed 3D graph, visibility filters, node sizing |
| 11 | **Office** | Per-workspace rooms, meeting state, "speak to agent" |
| 12 | **Inbox** | Contact intelligence panel, Inbox Zero protocol |
| 13 | **Asset Lab** | Type filters, masonry grid |
| 14 | **Idea Feed** | Promote-to-pipeline flow, inputs from Trend Radar/Council |
| 15 | **Shorts** | Per-platform queue cards, platform filter chips |
| 16 | **People** | Memory-integrated contact directory |
| 17 | **Projects** | Portfolio with GitHub/Vercel links |

### 🟢 MEDIUM — Global system improvements
| # | Feature | Scope |
|---|---------|-------|
| 18 | **Sidebar live badges** | All pages — count badges on nav items |
| 19 | **Global search command box** | TopBar — "Ask Henry or jump anywhere" |
| 20 | **Workspace switcher in sidebar** | Move from TopBar to sidebar top (or keep both) |
| 21 | **Agent personality baselines** | 13 agents — inject personality into system prompts |
| 22 | **Org Chart Skill Workshop band** | Bottom tier with per-master workshops |
| 23 | **Software Pipeline BACKLOG column** | + merge gate from Decision Queue |
| 24 | **Newsletter open/click rates** | Broadcasts tab |
| 25 | **YouTube Studio A/B test + packaging mode** | Missing sub-features |
| 26 | **Content Pipeline Strategy view** | Alternative planning layout |
| 27 | **Hardware/Runtime page fleet view** | Machine groups with SSH/status |
| 28 | **Docs/Logs pages** | Flesh out from stubs |

### ⚪ NICE-TO-HAVE
| # | Feature |
|---|---------|
| 29 | HeyGen voice integration for Advisory Council |
| 30 | Learning behavior (agents auto-handle more over time) |
| 31 | Henry agent identity across all decision cards |
| 32 | Agent workflow automation (Nexus PRs, Steve QA, Knox security) |

---

## 12. RECOMMENDED BUILD ORDER

### Sprint A — Fix the worst stubs (3-4 days)
1. **Agents page rebuild** — Fleet view + machine groups + SSH
2. **Skill Workshop** — Per-agent training interfaces
3. **Production Calendar** — Calendar grid with content cards
4. **Trend Radar** — Isaac's trend detection feed

### Sprint B — Analytics & Revenue (2-3 days)
5. **YouTube Analytics** — Per-video + channel metrics
6. **Social Analytics** — Cross-platform performance
7. **Consulting CRM** — Lead/deal pipeline
8. **Cinematic Sites** — Project tracking board

### Sprint C — Knowledge & Content depth (2-3 days)
9. **Brain & Wiki** — Force-directed graph + visibility filters
10. **Office** — Per-workspace rooms + meeting state
11. **Asset Lab** — Type filters + masonry grid
12. **Short Pipeline + Shorts** — Kanban + per-platform queues

### Sprint D — Global system polish (2-3 days)
13. **Sidebar live badges** — Count badges on all nav items
14. **Global search command box** — "Ask Henry or jump anywhere"
15. **Agent personality baselines** — 13 agent MEMORY.md → system prompts
16. **Inbox** — Contact intelligence panel + Inbox Zero
17. **Idea Feed** — Promote-to-pipeline + cross-linking

### Sprint E — Remaining pages (1-2 days)
18. **People page** — Memory-integrated directory
19. **Projects page** — Portfolio with links
20. **Docs/Logs pages** — Flesh out
21. **Hardware/Runtime** — Fleet view (shared with Agents page)
22. **Org Chart** — Skill Workshop band + workspace colors

---

## 13. CURRENT STATE SUMMARY

| Metric | Count |
|--------|:----:|
| Total pages | 35 |
| Feature-complete (≥80% match to spec) | 12 |
| Good but with gaps (60-79% match) | 9 |
| Thin/stub (20-59% match) | 8 |
| Completely off-spec (Agents page) | 1 |
| API routes | 173 |
| Build status | ✅ tsc 0 errors, ESLint clean |
| CI pipeline | ✅ 6 jobs (lint → typecheck → build → lighthouse + bundle → deploy) |
| Phase 6 quality gates | ✅ ErrorBoundary, Lighthouse, Mobile QA, CI gating |

---

## 14. WHAT THE OLD LIFeOS SPEC HAD THAT YVON OS IS MISSING

### Core UX patterns
1. **Live count badges** on every sidebar nav item — the most important missing pattern. The entire system is built around "surfacing what needs you."
2. **Global command/search box** — fastest navigation across 33 pages
3. **Machine/fleet infrastructure view** — currently on wrong page (Agents page)
4. **Per-workspace visual theming** — currently only accent colors; spec calls for distinct design per workspace

### Agent system depth
5. **13 agent personality baselines** — documented but not injected into agent system
6. **Agent workflows** — Henry filtering, Nexus PRs-only, Steve QA gate, Knox security — all design intent, none implemented
7. **Learning behavior** — agents auto-handle more over time as they learn owner decisions

### Screen-level features
8. **9 stub pages** that need full implementations (see Priority Matrix)
9. **Force-directed 3D graph** in Brain & Wiki
10. **Per-workspace rooms** in Office
11. **Contact intelligence** in Inbox
12. **Lead/deal pipeline** in Consulting CRM
13. **Client project tracker** in Cinematic Sites
