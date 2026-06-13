# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---
project: yvon
owner: Stark
version: 3.0
last-updated: 2026-05-14
---

# CLAUDE.md — Official YVON

> Read the parent `CLAUDE.md` first (C:\Users\Novy\Desktop\Projects\CLAUDE.md), then this file.
> Session start: read this file + the active brand's CLAUDE.md. Never load everything at once.

> ⚠️ MANDATORY — EVERY SESSION, EVERY TASK, NO EXCEPTIONS:
> Read `docs/WORKFLOW.md` BEFORE doing anything else. No task execution, no file edits, no
> plans until WORKFLOW.md is loaded. This is not optional and cannot be skipped under any
> circumstance. If you have not read WORKFLOW.md this session, read it now before proceeding.

## What is YVON

YVON is an AI operating system. It orchestrates **13 agents** across **4 departments**:
- **CEO** (marcus-ceo, diana-coo) — Direction + Accountability
- **Technical** (dev-lead, raj-backend, mia-frontend, quinn-qa) — Everything That Ships
- **Marketing** (kai-analyst, lena-brand, rio-ads, nate-growth, atlas-art-director, pixel-production) — Revenue + Content
- **Finance** (felix-finance) — Financial Intelligence

**Current ventures:** Novizio (fashion e-commerce) · Hourbour (fintech SaaS)

**Stack:** Next.js 15 · TypeScript strict · Tailwind CSS · Supabase · Vercel

---

## Development Commands

```bash
npm run dev          # start dev server on localhost:3000
npm run build        # production build (runs type-check)
npm run lint         # ESLint via next lint
npm run db:migrate   # run Supabase migrations (scripts/migrate.mjs)

# Knowledge graph (AST-only, no API cost)
npm run graphify:build   # rebuild graph after code changes
npm run graphify:query -- "<question>"  # query the graph
npm run codegraph:build  # rebuild code-review dependency graph
npm run codegraph:serve  # open graph web UI
```

No test runner is configured — QA is manual + Quinn's weekly Pulse check.

---

## App Architecture

### Route Structure (Next.js 15 App Router)
```
app/
  layout.tsx                  # root layout — loads Inter + Material Symbols fonts
  screens/
    ceo-command-dashboard/    # tabbed dashboard (Overview/Situation/Act/Done/Context)
    analytics/                # sub-nav with 5 tabs (Overview/Portfolio/Social/Content/Reports)
    competitor/ marketing/ creative-studio/ war-room/ merchandize/ settings/
  api/                        # ~60+ route.ts files — all LLM/data calls live here
  components/
    Nav/NavBar.tsx             # floating glass pill nav — shared across all screens
    VentureSwitcher.tsx        # switches active brand (Novizio/Hourbour) via cookie
    VentureGate.tsx            # guards screens to active venture
    AuthGuard.tsx
  globals.css                 # single source of truth for all design tokens + CSS classes
```

### Key Architecture Rules
- Each screen folder has its own `layout.tsx` (wraps NavBar + optional bg), `page.tsx` (client component), and `_*.tsx` files for tab/section components.
- All Claude/AI calls go through `/api/` routes — never call Anthropic SDK from client components.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only; client components use `supabaseClient` from `lib/supabase-client.ts`.
- Venture context flows via a cookie read by `getActiveVentureSlugClient()` — no localStorage.
- `globals.css` ↔ `tailwind.config.ts` must stay in sync when adding tokens.

### Venture / Brand Context
`VentureSwitcher` sets a cookie that all screens read to scope data to the active brand (Novizio or Hourbour). New screens must call `getActiveVentureSlugClient()` and pass the slug to API routes.

---

## Design System

Design specs live in venture-specific files — not here. Load the right file for the active venture:

| Active venture | Design spec |
|---------------|------------|
| yvon-dashboard | `docs/ventures/yvon-dashboard/DESIGN.md` ← canonical glass system |
| novizio | `docs/ventures/novizio/DESIGN.md` |
| hourbour | `docs/ventures/hourbour/DESIGN.md` |

**Shared floor rules (all ventures):** `docs/memory/design.md`

**Hard rule:** Load the venture's DESIGN.md before any UI task. Do not build UI from memory.

---

## Session Start Protocol

**3 essential files — load in order, nothing else until the task requires it:**

```
1. docs/WORKFLOW.md           ← load once, cached for the session (execution model)
2. docs/os/SESSION.md         ← global rolling state (what's In Flight, what's waiting)
3. docs/memory/feedback.md    ← 🔴 CRITICAL rules always · 🟡/🟢 on demand
```

**Then — active venture detection (before ENGAGE):**
4. Read cookie `yvon_active_venture` → one of: `novizio` | `hourbour` | `yvon-dashboard`
5. Load `docs/ventures/[active]/SESSION.md`
6. Identify agent from routing table below

**On-demand only (load when task requires it):**
- `docs/ventures/[active]/CONTEXT.md` — architectural decisions for this venture
- `docs/ventures/[active]/DESIGN.md` — before any UI task
- `docs/ventures/[active]/FEEDBACK.md` — before any brand/content/tone task
- `.toon/memory/agent-department/[Dept]/[agent]/MEMORY.md` — when assigned by Marcus (agent switch Rule 1)
- `.toon/graphs/GRAPH_REPORT.md` — for architecture questions

**Integrity check:** Does `docs/os/SESSION.md` have `## Last Clean Exit`?
→ NO or > 24h old → flag: "Previous session may have ended abruptly. Run manual reflection before starting."

**Do not make changes until you have 95% confidence in what's needed. Ask first.**

## Session End Protocol

Full protocol in `docs/WORKFLOW.md` → ADJOURNING section.

**Summary:**
1. Update active agent's SESSION.md (source of truth)
2. Sync `docs/os/SESSION.md` (global log)
3. If venture-specific task: update `docs/ventures/[name]/SESSION.md`
4. Write `## Last Clean Exit: YYYY-MM-DD HH:MM` to `docs/os/SESSION.md`
5. Run reflection if ≥3 tool calls → save to ONE location (see Memory Sync Rule in WORKFLOW.md)
6. Curator check: if last run > 7 days ago → suggest `npm run curator`

---

## Agent Routing Table — 3 Layers

### Layer 1 — COMMAND (Direction + Accountability)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Executive summary, CEO brief, priorities, OKRs, business direction, synthesis, strategy, War Room | 👑 Marcus | `.toon/memory/agent-department/CEO/marcus/MEMORY.md` |
| Operations, workflow, process, project plan, milestones, sprint planning, dependencies | ⚙️ Diana | `.toon/memory/agent-department/COO/diana/MEMORY.md` |

### Layer 2 — BUILD (Everything That Ships)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Next.js, API routes, architecture, tech decision, build error, TypeScript, Vercel, deployment | 💻 Dev | `.toon/memory/agent-department/Technical/dev/MEMORY.md` |
| Supabase, database, query, backend API, data model, route.ts, schema, migration | 🔧 Raj | `.toon/memory/agent-department/Technical/raj/MEMORY.md` |
| React component, UI, Tailwind, layout, CSS, design system, wireframe, UX, screen design, visual design | 🎨 Mia | `.toon/memory/agent-department/Technical/mia/MEMORY.md` |
| Testing, bug, QA review, lint, build check, edge case, verification, code quality, Pulse | 🧪 Quinn | `.toon/memory/agent-department/Technical/quinn/MEMORY.md` |

### Layer 0 — PSYCHOLOGY (Behavioral Validation — cross-department)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Cognitive bias, framing check, System 1 filter, psychological audit, decision review, loss aversion, anchoring, overconfidence, A/B interpretation, lever selection, debiasing, calibration | 🧠 Kahneman | `.toon/memory/agent-department/Psychology/Daniel_Kahneman/MEMORY.md` |

> Kahneman is a **validator**, not a content producer. He reviews outputs from Lena, Rio, Kai, Nate, Felix, Marcus — not a primary content agent. Route TO him after another agent produces, or BEFORE any high-stakes financial/strategic decision.

### Layer 3 — GROW (Revenue + Insight)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Copy, caption, content writing, brand voice, email, ad copy | ✍️ Lena | `.toon/memory/agent-department/Marketing/lena/MEMORY.md` |
| Paid ads, Meta, TikTok, ROAS, CPM, funnel, conversion, retargeting | 📈 Rio | `.toon/memory/agent-department/Marketing/rio/MEMORY.md` |
| Visual system, mood board, art direction, image prompt, brand visual identity, creative pipeline | 🎨 Atlas | `.toon/memory/agent-department/Marketing/atlas/MEMORY.md` |
| Image batch, production pipeline, prompt optimisation, upscaling, asset delivery | ⚡ Pixel | `.toon/memory/agent-department/Marketing/pixel/MEMORY.md` |
| Analytics, metrics, GA4, trend, data, KPI, insight, competitor, rival brand, market gap, YVON Health Score | 📊 Kai | `.toon/memory/agent-department/Marketing/kai/MEMORY.md` |
| Growth, funnel, experiment, A/B, channel performance, opportunity | 🚀 Nate | `.toon/memory/agent-department/Marketing/nate/MEMORY.md` |
| Finance, budget, P&L, revenue, CAC, LTV, MRR, margin, ROI, runway | 💰 Felix | `.toon/memory/agent-department/Finance/felix/MEMORY.md` |

> Multi-agent task: read both MEMORY.md files. Never load agents not involved in the task.

---

## Task Protocol — Execution Model

→ Full execution model in `docs/WORKFLOW.md` — load once per session, cached.

**Summary:** Every task goes through ENGAGE+PLAN (one wait) → PERFORMING (after approval) → ADJOURNING (reflect + session writes). Marcus runs FORMING + STORMING internally before producing the plan. See WORKFLOW.md for scaled plan formats, skip thresholds, venture injection, and all 6 safety rules.

---

## CRITICAL Skills (always loaded)

Source of truth: `D:\Global Skills\yvon-skills\` — NEVER edit copies.

- `coding/01-karpathy.md` — non-negotiable LLM coding behaviour
- `agents/01-memory.md` — memory loading rules
- `agents/02-openrouter.md` — model routing

**After any skill edit:** run `scripts/skills-sync.sh`

---

## Critical Rules (never break)

1. Never edit a skill copy — always edit Global Skills source, then sync
2. Never load venture content from agent MEMORY.md — scope to docs/ventures/[name]/ only
3. Never commit directly to main — all brand changes go to `dev` branch first
4. Never add a venture without creating its docs/ventures/[name]/ folder with all 5 files first
5. Never mix agent responsibilities — ask Marcus if unsure which agent owns a task
6. API keys in /api/ routes only — never in client components
7. SUPABASE_SERVICE_ROLE_KEY server-side only — never expose to browser
8. No localStorage for data — Supabase only; localStorage for ephemeral UI only
9. No hardcoded colors — CSS variable tokens from globals.css only
10. globals.css ↔ tailwind.config.ts must stay in sync — update both together
11. No new page without NavBar entry and venture cookie read
12. War Room hard cap: 2 specialists — enforced in /api/team-chat via .slice(0,2)

---

## Reference Files (load only when needed)

| Need | Load |
|------|------|
| Master roadmap + priority list | `docs/os/ROADMAP.md` |
| User preferences + working style | `docs/os/USER.md` |
| Rolling session context | `docs/os/SESSION.md` |
| Permanent project context (architecture locks, ventures, open decisions) | `docs/os/CONTEXT.md` |
| Full agent registry (13 agents, 4 departments) | `.toon/memory/agent-department/DEPARTMENTS.md` |
| Stack, architecture, services | `docs/reference/STACK.md` |
| Pages, routes, API endpoints | `docs/reference/PAGES.md` |
| Environment variables | `docs/reference/ENV.md` |
| Component + lib structure | `docs/reference/ARCHITECTURE.md` |
| SIP protocol detail | `docs/reference/SELF-IMPROVEMENT.md` |
| Troubleshooting guide | `docs/reference/TROUBLESHOOTING.md` |
| Gatekeeper pre-flight validation | `docs/reference/GATEKEEPER.md` |
| Graphify knowledge graph | `docs/reference/GRAPHIFY.md` |
| Self-improvement + reflection | `docs/reference/SELF-IMPROVEMENT.md` |
| Design rules + never-again errors | `docs/memory/feedback.md` |
| Cross-venture shared design floor rules | `docs/memory/design.md` |
| Venture-specific files (session, context, brand, design, feedback) | `docs/ventures/[name]/` |
| Health check + security architecture | `docs/reference/SECURITY.md` |
| open-design UI prototyping | `docs/reference/OPEN-DESIGN.md` |
| Venture registry + load manifest | `docs/ventures/INDEX.md` |

---

## Knowledge Graphs

### Graphify (`.toon/graphs/`)
Knowledge graph for architecture and codebase questions.
- Before answering architecture questions: read `.toon/graphs/GRAPH_REPORT.md`
- Run `npm run graphify:build` after code changes (AST-only, no API cost)
- Open `.toon/graphs/graph.html` in browser for interactive visualization
- Query with `npm run graphify:query -- "<question>"`

### Code Review Graph (`.code-review-graph/`)
Dependency graph for efficient code reviews.
- Run `npm run codegraph:build` to rebuild
- Start web UI: `npm run codegraph:serve`
- MCP tools available via Claude Code for: detect_changes, get_review_context, get_impact_radius

---

## Pre-Flight Validation (Gatekeeper)

Before any agent call, messages route through `/api/gatekeeper` for intent classification.
This lightweight layer:
1. Classifies intent → selects target agent → validates context completeness
2. Returns routing decision BEFORE LLM call (saves tokens on mis-routed queries)
3. Identifies missing context and suggests reformulation

Use `/api/gatekeeper` for:
- Smart routing instead of keyword matching
- Detecting ambiguous queries before expensive LLM calls
- Ensuring messages include required context (brand, platform, etc.)

---

## Agent Departments (4 Departments)

For department overview: read `.toon/memory/agent-department/DEPARTMENTS.md`

| Dept | Agents | Domain |
|------|--------|--------|
| CEO | marcus-ceo, diana-coo | Strategy, operations |
| Technical | dev-lead, raj-backend, mia-frontend, quinn-qa | Code, infrastructure |
| Marketing | kai, lena, rio, nate, atlas, pixel | Revenue, content |
| Finance | felix-finance | Financial intelligence |

---

## Shared Skills

All agents share critical skills from `.toon/memory/agent-department/shared/`:
- `skills/agents/01-memory.md` — Memory system rules
- `skills/coding/01-karpathy.md` — Karpathy coding guidelines

**Rule:** Edit shared skills in `.toon/memory/agent-department/shared/` only.

> ⛔ `brands/novizio.md` and `brands/hourbour.md` in this folder are **DEPRECATED**.
> Brand context now lives in `docs/ventures/[name]/` (BRAND.md, FEEDBACK.md, DESIGN.md, CONTEXT.md).
> Marcus injects venture context fresh per session — do not load the old brand stubs.
