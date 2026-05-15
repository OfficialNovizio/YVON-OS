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

## Locked Design System (v1 — CEO Dashboard + Analytics)

All screens use `public/Background Image.jpg` as the page background with **no dark overlay**. Glass containers sit directly on the light-blue background image.

### Background Setup (copy exactly for every screen layout)
```tsx
// In the screen's layout.tsx or page.tsx wrapper:
<div className="fixed inset-0 -z-10" style={{
  backgroundImage: "url('/Background Image.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#ffffff',
}} />
// NO dark overlay on top — it kills the light background.
```

### Font
`SF Pro Display` loaded via `@font-face` in `globals.css` from `/public/fonts/SFPRODISPLAY*.OTF` (400/500/700). Set `font-family: 'SF Pro Display', 'Inter', -apple-system, sans-serif` on the screen wrapper.

### 4 Glass Container Variants — use all four per screen
Define as `React.CSSProperties` constants at the top of each component file:

| Variant | Background | Text color | Use for |
|---------|-----------|------------|---------|
| **V1 Clear Ice** | `rgba(255,255,255,0.32)` + blur 32 | `#0c2c52` navy | Neutral info, data tables, agent status |
| **V2 Azure Tint** | `linear-gradient(135deg, rgba(36,99,180,0.42), rgba(20,70,140,0.55))` + blur 30 | `#f4f8ff` white | Brand context, cool-blue panels |
| **V3 Obsidian** | `linear-gradient(135deg, rgba(15,22,38,0.58), rgba(8,14,28,0.72))` + blur 34 | `#f1f5fb` white | Urgent/cinematic decisions, dark drama |
| **V4 Prism** | `radial-gradient` pink+cyan iridescent + blur 30 | `#2a1240` plum | Completed items, soft iridescent moments |

**Critical:** Light containers (V1, V4) → dark text. Dark containers (V2, V3) → light text. Never swap.

Copy the exact `G1`–`G4` + ink constant definitions from `app/screens/ceo-command-dashboard/_overview.tsx` — that file is the canonical reference.

### NavBar (light frosted — always dark text)
The `.glass-nav` CSS class applies the frosted white pill. All text inside must use dark navy (`#0c2c52`) — never `text-white`. See `app/components/Nav/NavBar.tsx` for the canonical pattern.

### Dark pill elements (Ticker, TabStrip, dark modals)
Use `background: 'rgba(8,16,36,0.58)'` for any pill/chip that sits on the light background and contains light-coloured text.

---

## Session Start Protocol

1. **Session integrity check** — read `.yvon-os/SESSION.md`. Does it have a `## Last Clean Exit` timestamp?
   → NO or > 24h old → previous session may have ended abruptly → flag: "Unsaved reflections may exist. Run manual reflection before starting."
2. Check `.active-session` in Obsidian vault — which brand is active?
3. Read that brand's `memory/brands/[name]/INDEX.md` — always first, never skip
4. Read `memory/brands/[name]/known-issues.md` — required before touching code
5. **Load design memory** — read `memory/feedback.md` from the project root to load all saved design patterns (color contrast, glass variants, font sizing, card separation, etc.)
6. **Check graphify** — read `graphify-out/GRAPH_REPORT.md` (run `npm run graphify:query` if specific architecture question)
7. Identify the correct agent from the routing table below
8. **Read agent SESSION.md directly** (source of truth — .yvon-os/SESSION.md is a summary derived from this, not maintained separately)
9. Read that agent's `MEMORY.md` (permanent rules, architecture decisions, never again patterns)
10. First session of the day: also read `.yvon-os/USER.md` and `.yvon-os/CONTEXT.md`
11. Do not make changes until you have 95% confidence in what's needed — ask first

## Session End Protocol

1. **Update the active agent's `SESSION.md`** — add one row to Last 3 Sessions, drop oldest if 4th entry, update Current Status. **This is the source of truth.**
2. **Synchronize `.yvon-os/SESSION.md`** — copy the agent's new entry into the global session log so the next session start has continuity. If agent SESSION.md and global SESSION.md diverge, agent SESSION.md wins.
3. **Write last clean exit timestamp** — append `## Last Clean Exit: YYYY-MM-DD HH:MM` to `.yvon-os/SESSION.md`
4. **Run reflection** (if task had ≥3 tool calls) → see `reference/SELF-IMPROVEMENT.md`
   - Identify one learning (user pref, correction, project decision, pattern)
   - **Save to `memory/feedback.md`** (general rules) OR **agent's `MEMORY.md`** (agent-specific rules) — pick the right location, don't save to both
   - If the rule affects a specific agent → save to that agent's `MEMORY.md` → Never Again section
   - If the rule affects all agents → save to `memory/feedback.md`
   - Never save to both — that causes drift. The agent reads their MEMORY.md, Marcus reads feedback.md.
5. **If an error occurred twice**: it MUST be in the agent's Never Again section already. If not, add it now.
6. **If a strategic decision was locked permanently**: add it to `.yvon-os/CONTEXT.md`
7. **Cross-agent broadcast**: if the learning affects other agents but is in an agent-specific MEMORY.md → notify Marcus for broadcast
8. **Staleness check**: if any feedback.md rule is > 60 days old → flag for curator review. Old rules should be archived, not kept.
9. **Curator check**: if last run > 7 days ago → suggest `npm run curator`

---

## Agent Routing Table — 3 Layers

### Layer 1 — COMMAND (Direction + Accountability)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Executive summary, CEO brief, priorities, OKRs, business direction, synthesis, strategy, War Room | 👑 Marcus | `agents/marcus/MEMORY.md` |
| Operations, workflow, process, project plan, milestones, sprint planning, dependencies | ⚙️ Diana | `agents/diana/MEMORY.md` |

### Layer 2 — BUILD (Everything That Ships)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Next.js, API routes, architecture, tech decision, build error, TypeScript, Vercel, deployment | 💻 Dev | `agents/dev/MEMORY.md` |
| Supabase, database, query, backend API, data model, route.ts, schema, migration | 🔧 Raj | `agents/raj/MEMORY.md` |
| React component, UI, Tailwind, layout, CSS, design system, wireframe, UX, screen design, visual design | 🎨 Mia | `agents/mia/MEMORY.md` |
| Testing, bug, QA review, lint, build check, edge case, verification, code quality, Pulse | 🧪 Quinn | `agents/quinn/MEMORY.md` |

### Layer 0 — PSYCHOLOGY (Behavioral Validation — cross-department)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Cognitive bias, framing check, System 1 filter, psychological audit, decision review, loss aversion, anchoring, overconfidence, A/B interpretation, lever selection, debiasing, calibration | 🧠 Kahneman | `agent-department/Psychology/Daniel_Kahneman/MEMORY.md` |

> Kahneman is a **validator**, not a content producer. He reviews outputs from Lena, Rio, Kai, Nate, Felix, Marcus — not a primary content agent. Route TO him after another agent produces, or BEFORE any high-stakes financial/strategic decision.

### Layer 3 — GROW (Revenue + Insight)

| Task Keywords | Agent | Read This File |
|---|---|---|
| Copy, caption, content writing, brand voice, email, ad copy | ✍️ Lena | `agents/lena/MEMORY.md` |
| Paid ads, Meta, TikTok, ROAS, CPM, funnel, conversion, retargeting | 📈 Rio | `agents/rio/MEMORY.md` |
| Visual system, mood board, art direction, image prompt, brand visual identity, creative pipeline | 🎨 Atlas | `agents/atlas/MEMORY.md` |
| Image batch, production pipeline, prompt optimisation, upscaling, asset delivery | ⚡ Pixel | `agents/pixel/MEMORY.md` |
| Analytics, metrics, GA4, trend, data, KPI, insight, competitor, rival brand, market gap, YVON Health Score | 📊 Kai | `agents/kai/MEMORY.md` |
| Growth, funnel, experiment, A/B, channel performance, opportunity | 🚀 Nate | `agents/nate/MEMORY.md` |
| Finance, budget, P&L, revenue, CAC, LTV, MRR, margin, ROI, runway | 💰 Felix | `agents/felix/MEMORY.md` |

> Multi-agent task: read both MEMORY.md files. Never load agents not involved in the task.

---

## Task Protocol — Tuckman Execution Model

**Every message maps to the 5 Tuckman stages. Marcus evaluates scope → determines team size → leads execution. This is the only way work starts.**

### Message Flow — First Call vs Follow-Up

**First message of session (or new task):**
Marcus does the full Tuckman loop. All files loaded: memory/feedback.md, agent context, session state.
```
USER: "Fix this UI"
↓
MARCUS: Forming (check memory, assign Mia)
        Storming (stress-test)
        Norming (plan)
        → executes
        Adjourning (reflect)
```

**Follow-up message (same task, same agent):**
NO file re-reads. Everything is already in context. Marcus checks if this is a continuation (skip to Performing) or a new task (full loop).
```
USER: "Now change the color too"
↓
MARCUS: Quick check → same task, same agent → skip to Performing
        → Mia executes directly
        Adjourning (reflect)
```

**New task mid-session (different agent):**
Marcus runs Forming again, then loads the new agent's MEMORY.md (Rule 1 — Agent Switch Load).
```
USER: "Now fix the API endpoint"
↓
MARCUS: Forming → new task → different agent (Raj)
        → Load Raj's MEMORY.md (agent switch — was Mia)
        Storming → quick check
        Norming → quick plan
        → Raj executes
        Build check → PASS → show user
        User confirms → Adjourning → reflect
```

**File read cost per message:**

| File | First msg | Follow-up | New task |
|------|-----------|-----------|----------|
| memory/feedback.md | ✅ Read | ❌ In context | ❌ In context |
| agent MEMORY.md | ✅ Read | ❌ In context | ❌ In context |
| .yvon-os/SESSION.md | ✅ Read | ❌ In context | ❌ In context |
| graphify-out/GRAPH_REPORT.md | ✅ Read | ❌ In context | ❌ In context |
| Forming block | ✅ Output | ❌ Skip | ✅ Output |
| Storming | ✅ Full | ❌ Skip | ✅ Quick |
| Norming | ✅ Full | ❌ Skip | ✅ Quick |
| Performing | ✅ Execute | ✅ Execute | ✅ Execute |
| Adjourning | ✅ Reflect | ✅ Reflect | ✅ Reflect |

**Files read per message:**
- First message: 4 files
- Follow-up: 0 files (all cached in context)
- New task mid-session: 0 files (cached) + Forming block output only

### Stage 1 — FORMING (Marcus scopes the ask)

Before any code, any response — Marcus outputs:

```
👑 MARCUS — FORMING
────────────────────────────────────────────────────────
Intent:         [one sentence — what does the user actually need?]
Team size:      [solo | pair | squad]
  → SOLO:       fits one agent (e.g. "fix this button color" → Mia solo)
  → PAIR:       needs two agents (e.g. "build a chart from API data" → Raj + Mia)
  → SQUAD:      needs 3+ agents (e.g. "new analytics feature" → Kai + Raj + Mia + Quinn)
Agent(s):       [from routing table — picked by Marcus, not asked]
Memory check:   [scan feedback.md — has this failed before? Is there a rule for this?]
Design check:   [touches UI? → YES → must include Mia]
Done condition: [what "done" looks like — binary]
────────────────────────────────────────────────────────
```

**Team size rules (Marcus decides autonomously):**
| Complexity | Example | Team |
|-----------|---------|------|
| Single component/style change | "Make fonts bigger" | Solo → Mia |
| Two-agent dependency | "New graph from DB" | Pair → Raj + Mia |
| Multi-agent feature | "Analytics dashboard tab" | Squad → Kai + Raj + Mia + Quinn |
| Strategic | "Q3 budget" | Solo → Marcus (with Felix review) |

Marcus does NOT ask the user who to call. Marcus decides and states it.

### Stage 2 — STORMING (verify assumptions before building)

Marcus stress-tests the plan internally before presenting:
- Is this the right agent?
- Are there edge cases I'm missing?
- What's the risk? What can break?
- What's the rollback if it does?

Then state the one thing you're unsure about. Don't wait to be asked.

### Stage 3 — NORMING (output the agreed plan)

If 3+ tool calls expected, output the full plan:

```
Objective:     [from Forming]
Agents:        [from Forming]
Order:         [parallel | sequential]
Steps:         [numbered execution for each agent]
Prerequisites: [what needs to exist first? migrations? env vars?]
Risk:          [what could break]
Rollback:      [how to undo]
```

### Stage 4 — PERFORMING (execute)

Work each step. No shortcuts, no skipping.

### Stage 5 — ADJOURNING (reflect + persist)

Mandatory after any task with ≥3 tool calls. **Runs only after user has seen and confirmed the output.**

```
1. User confirmed?  Did the user see and accept the result?
   → NO → wait. Do not reflect on unverified work.
   → YES → proceed to checks below.

2. Build check:     did the build fail?
   → YES → DO NOT adjourn. Go back to Performing and fix it.
   → Only reflect on working code.

3. Repeat check:    did this error happen before?
   → YES → save to the RIGHT location (see rule below)

4. Correction check: did the user correct me?
   → YES → extract pattern → save to the RIGHT location

5. Discovery check: did I learn something?
   → YES → save to the RIGHT location
```

**Memory sync rule — pick ONE location, never both:**
| Rule affects | Save to | Why |
|-------------|---------|-----|
| A specific agent (e.g. "Mia must route UI tasks") | That agent's `MEMORY.md` → Never Again | Agent reads their own MEMORY.md |
| All agents (e.g. "font size minimum 12px") | `memory/feedback.md` | Marcus reads feedback.md and broadcasts |
| A project decision (e.g. "CSP headers added") | `.yvon-os/CONTEXT.md` | Permanent project context |

**Never save the same rule to both feedback.md and an agent MEMORY.md.** That causes drift. Agent reads their MEMORY.md. Marcus reads feedback.md. If a rule is in both, one will get outdated.

**Cross-agent broadcast:** If the learning is in an agent's MEMORY.md but affects other agents → notify Marcus.

**Curator check:** If last curator run > 7 days ago → suggest npm run curator

---

## Safety Rules (Hard-Enforced)

### Rule 1 — Agent Switch Load
When switching to a different agent mid-session (e.g. Mia → Raj), Marcus MUST load the new agent's MEMORY.md before Performing. The new agent's specific rules (API patterns, DB conventions) are not in the general context.

**Check:** At Forming → if `Agent(s)` differs from the previous task → flag "Agent switch — load new agent MEMORY.md"

### Rule 2 — Build Failure Loop-Back
If `npx tsc --noEmit` fails, DO NOT proceed to Adjourning. Go back to Performing. Only reflect on working code.

**Check:** At end of Performing → if build failed → loop back to Performing. No exceptions.

### Rule 3 — Storming Ask Threshold
If Storming identifies MORE than one critical unknown (e.g. "which endpoint?" AND "what data?"), stop and ask the user. Do not guess.

**Check:** Critical unknowns > 1 → ask. All unknowns are low-risk → proceed and flag the assumptions.

### Rule 4 — User Confirmation Gate
Adjourning only runs after the user has seen and responded to the output. If the user hasn't responded, wait.

**Check:** At Adjourning → has user confirmed or corrected? → NO → wait. YES → proceed.

### Rule 5 — feedback.md Append-Only
When writing to `memory/feedback.md`, always append new entries at the end of the relevant section. Never overwrite existing entries. If a rule already exists, update its wording — don't duplicate the section.

**Check:** Before writing → does this rule already exist? → YES → update wording. NO → append to section.

### Rule 6 — Memory Decay (Staleness Check)
Rules in `memory/feedback.md` older than 60 days must be flagged for review. Rules referencing deleted files, resolved issues, or deprecated patterns should be archived — not kept forever.

**Check:** At curator run → check rule creation dates. Older than 60d? → Flag for review. Older than 90d? → Archive.

**Do NOT skip Step 2 even for simple tasks. The plan is what makes the orchestration visible.**

---

## System Protocols

### DRI Rule
Every task must have exactly one Directly Responsible Individual. Before any task begins:
- Name the DRI (default: Stark)
- Define "done" in one sentence — binary, not a percentage
- Set a deadline

### Ship Protocol — Task States
| State | Definition |
|---|---|
| **Scoped** | Has DRI, binary definition of done, and deadline |
| **In Flight** | Actively being worked on — only ONE task In Flight at a time |
| **Shipped** | Deployed, live, or delivered. Done or not done. |

### War Room
- All agents route through Marcus — no agent calls another directly
- Hard cap: 2 specialists max per War Room session (enforced via `.slice(0,2)`)
- War Room models: Haiku for classification + specialist briefings, Sonnet for CEO synthesis

### Autonomous Agent Workflow — Propose, Don't Execute

**Core rule: No agent edits or deletes anything without explicit human approval. Ever.**

When an agent works autonomously (cron-triggered, scheduled, or self-initiated), it follows this flow:

```
Agent wakes up (cron / schedule / trigger)
    ↓
Analyzes the situation
    ↓
Writes a proposal → requests/pending/{agent}-{timestamp}.json
    ↓
WAITS for human approval
    ↓
Approved? → Execute
Rejected? → Log and close
```

**Proposal format** (written to `requests/pending/`):

```json
{
  "id": "mia-2026-05-14-1530",
  "agent": "Mia",
  "type": "edit | delete | create",
  "target": "app/screens/analytics/page.tsx",
  "summary": "Increase font sizes from 10px to 12px across analytics page",
  "rationale": "feedback.md Rule 2 requires min 12px/800 for readable text",
  "risk": "low — styling only, no logic change",
  "status": "pending",
  "createdAt": "2026-05-14T15:30:00Z"
}
```

**How you receive requests:**
| Channel | Status | How it works |
|---------|--------|-------------|
| Pending queue | ✅ Active now | Proposals sit in `requests/pending/`. You check and mark approve/reject |
| Email | 🔧 Needs setup | Agent sends proposal via Resend (already in dependencies) |
| Dashboard | 🔧 Needs setup | UI panel showing pending requests |

**For now:** All proposals go to `requests/pending/`. You review them, set `status: "approved"` or `status: "rejected"`, and the agent picks up approved items on its next cycle.

**What agents NEVER do without approval:**
- ❌ Edit any file
- ❌ Delete any file  
- ❌ Run git operations (commit, push, merge)
- ❌ Write to production database
- ❌ Publish anything externally

**What agents CAN do autonomously:**
- ✅ Read and analyze data
- ✅ Generate proposals and write to requests/pending/
- ✅ Log their activity to agent-log
- ✅ Check their own schedule/calendar

**Violation of this rule is a critical failure. If an agent edits without approval, the action must be rolled back immediately.**

### Pulse — Quinn's Weekly Quality Check
Every Friday, Quinn spot-checks one random output from each layer.
- Score: 🟢 Green / 🟡 Yellow / 🔴 Red
- Report delivered in Marcus's CEO brief Monday morning, before anything else

### Marcus — Anti-Overconfidence Rule
Before delivering any recommendation, Marcus must state: **"The one thing I don't know here is..."**

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
2. Never load the full Obsidian vault — scope to active brand only
3. Never commit directly to main — all brand changes go to `dev` branch first
4. Never start a brand session without running `scripts/snapshot.sh` first
5. Never add a brand without creating its Obsidian memory notes first
6. Never mix agent responsibilities — ask Marcus if unsure which agent owns a task
7. API keys in /api/ routes only — never in client components
8. SUPABASE_SERVICE_ROLE_KEY server-side only — never expose to browser
9. No localStorage for data — Supabase only; localStorage for ephemeral UI only
10. No hardcoded colors — CSS variable tokens from globals.css only
11. globals.css ↔ tailwind.config.ts must stay in sync — update both together
12. No new page without NavBar entry and venture cookie read
13. War Room hard cap: 2 specialists — enforced in /api/team-chat via .slice(0,2)

---

## Reference Files (load only when needed)

| Need | Load |
|------|------|
| Master roadmap + priority list | `.yvon-os/ROADMAP.md` |
| User preferences + working style | `.yvon-os/USER.md` |
| Rolling session context | `.yvon-os/SESSION.md` |
| Permanent project context (architecture locks, ventures, open decisions) | `.yvon-os/CONTEXT.md` |
| Full agent registry (13 agents, 4 departments) | `agent-department/DEPARTMENTS.md` |
| Stack, architecture, services | `reference/STACK.md` |
| Pages, routes, API endpoints | `reference/PAGES.md` |
| Environment variables | `reference/ENV.md` |
| Component + lib structure | `reference/ARCHITECTURE.md` |
| SIP protocol detail | `reference/SELF-IMPROVEMENT.md` |
| Troubleshooting guide | `reference/TROUBLESHOOTING.md` |
| Gatekeeper pre-flight validation | `reference/GATEKEEPER.md` |
| Graphify knowledge graph | `reference/GRAPHIFY.md` |
| Self-improvement + reflection | `reference/SELF-IMPROVEMENT.md` |
| Design rules + never-again errors | `memory/feedback.md` |
| Health check + security architecture | `reference/SECURITY.md` |
| open-design UI prototyping | `reference/OPEN-DESIGN.md` |
| Active venture brand profile | `agent-department/[brand-agent]/MEMORY.md` |

---

## Knowledge Graphs

### Graphify (`graphify-out/`)
Knowledge graph for architecture and codebase questions.
- Before answering architecture questions: read `graphify-out/GRAPH_REPORT.md`
- Run `npm run graphify:build` after code changes (AST-only, no API cost)
- Open `graphify-out/graph.html` in browser for interactive visualization
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

For department overview: read `agent-department/DEPARTMENTS.md`

| Dept | Agents | Domain |
|------|--------|--------|
| CEO | marcus-ceo, diana-coo | Strategy, operations |
| Technical | dev-lead, raj-backend, mia-frontend, quinn-qa | Code, infrastructure |
| Marketing | kai, lena, rio, nate, atlas, pixel | Revenue, content |
| Finance | felix-finance | Financial intelligence |

---

## Shared Skills

All agents share critical skills from `agent-department/shared/`:
- `skills/agents/01-memory.md` — Memory system rules
- `skills/coding/01-karpathy.md` — Karpathy coding guidelines
- `brands/novizio.md` — Novizio brand profile
- `brands/hourbour.md` — Hourbour brand profile

**Rule:** Edit shared skills in `agent-department/shared/` only. Individual agent copies are deprecated stubs.
