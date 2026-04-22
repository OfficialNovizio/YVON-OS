---
project: yvon
owner: Stark
version: 2.0
last-updated: 2026-04-20
---

# CLAUDE.md — Official YVON

> Read the parent `CLAUDE.md` first (C:\Users\Novy\Desktop\Projects\CLAUDE.md), then this file.
> Session start: read this file + the active brand's CLAUDE.md. Never load everything at once.

## What is YVON

YVON is a CLI-based AI operating system. It orchestrates 13 AI agents across 3 layers, manages brand workspaces, reads memory, and executes tasks across Novizio and Hourbour without reloading context from scratch every session.

**Current ventures:** Novizio (fashion e-commerce) · Hourbour (fintech SaaS)

**Stack:** Next.js 15 · TypeScript strict · Tailwind CSS · Supabase · Vercel · LM Studio (local AI)

---

## Session Start Protocol

1. Read `.yvon-os/SESSION.md` — identify what's In Flight
2. Check `.active-session` in Obsidian vault — which brand is active?
3. Read that brand's `memory/brands/[name]/INDEX.md` — always first, never skip
4. Read `memory/brands/[name]/known-issues.md` — required before touching code
5. Identify the correct agent from the routing table below
6. Read that agent's `MEMORY.md` for continuity
7. First session of the day: also read `.yvon-os/USER.md`
8. Do not make changes until you have 95% confidence in what's needed — ask first

## Session End Protocol

1. Append one-line log to the active agent's `MEMORY.md`: `[YYYY-MM-DD] — [task] — [outcome]`
2. Update brand's `INDEX.md` Last 3 Changes
3. Update `.yvon-os/SESSION.md` — note what was done + what's next
4. If task had 3+ tool calls: run SIP → see `reference/SIP.md`
5. If any error occurred twice: add it to that agent's Never Again section in MEMORY.md

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

### Loop — Autonomous Resolution Boundary
| Decision Type | Behaviour |
|---|---|
| Technical error (build fail, broken API, TypeScript error) | Resolve autonomously → log it |
| Data task (pull stats, generate brief, run cron) | Execute autonomously → log it |
| Content output (caption, copy, creative) | Draft → flag to Stark before any publish |
| Strategy shift (budget, priority, brand direction) | Surface options → never decide |
| Anything touching money or external publishing | Stop → alert Stark immediately |

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
| Full agent registry (13 agents) | `reference/AGENTS.md` |
| Stack, architecture, services | `reference/STACK.md` |
| Pages, routes, API endpoints | `reference/PAGES.md` |
| Environment variables | `reference/ENV.md` |
| Component + lib structure | `reference/ARCHITECTURE.md` |
| SIP protocol detail | `reference/SIP.md` |
| Troubleshooting guide | `reference/TROUBLESHOOTING.md` |
| War Room spec | `reference/SPEC-war-room.md` |
| Active venture brand profile | `agents/[brand-agent]/MEMORY.md` |
| Shared benchmarks | Obsidian `brands/shared/benchmarks.md` |
| YVON parent company overview | Obsidian `brands/shared/yvon-overview.md` |
