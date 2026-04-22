# AGENTS.md — Full Agent Registry
> Load this file only when: adding a new agent, debugging agent routing, or reviewing model assignments.
> Supabase `agents` table is the live source of truth. This file is reference only.
> **Restructured 2026-04-01:** Reduced from 21 to 13 agents. 3-layer org structure. See kill log below.

---

## Layer 1 — COMMAND (Direction + Accountability)

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| 👑 Marcus | `marcus-ceo` | claude-sonnet-4-6 | `#F59E0B` | Strategy, synthesis, CEO brief, OKRs, cross-venture decisions |
| ⚙️ Diana | `diana-coo` | claude-sonnet-4-6 | `#94A3B8` | Operations, workflow, process, project planning, milestones, sprint |

---

## Layer 2 — BUILD (Everything That Ships)

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| 💻 Dev | `dev-lead` | claude-opus-4-6 | `#06B6D4` | Architecture, Next.js, TypeScript, tech decisions, build errors |
| 🔧 Raj | `raj-backend` | claude-opus-4-6 | `#F97316` | Supabase, database, API routes, backend, data models |
| 🎨 Mia | `mia-frontend` | claude-sonnet-4-6 | `#D946EF` | React components, UI, Tailwind, design system, wireframes, UX, layout |
| 🧪 Quinn | `quinn-qa` | claude-sonnet-4-6 | `#10B981` | Testing, bugs, QA, lint, edge cases, code review, weekly output spot-checks (Pulse) |

---

## Layer 3 — GROW (Revenue + Insight)

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| ✍️ Lena | `lena-brand` | claude-sonnet-4-6 | `#14B8A6` | Copy, captions, brand voice, email, ad copy, content writing |
| 📈 Rio | `rio-ads` | claude-sonnet-4-6 | `#F97316` | Paid ads, Meta, TikTok, ROAS, CPM, funnel, conversion, retargeting |
| 🎨 Atlas | `atlas-art-director` | claude-sonnet-4-6 | `#6366F1` | Visual system, mood board, art direction, image prompts, brand visual identity, creative pipeline |
| ⚡ Pixel | `pixel-production` | claude-haiku-4-5-20251001 | `#8B5CF6` | Image batch, production pipeline, prompt optimization, asset delivery |
| 📊 Kai | `kai-analyst` | claude-sonnet-4-6 | `#3B82F6` | Analytics, metrics, GA4, KPIs, trends, competitor intel, rival brands, market gaps, YVON Health Score |
| 🚀 Nate | `nate-growth` | claude-sonnet-4-6 | `#22C55E` | Growth, funnel, A/B experiments, channel performance, opportunity identification |
| 💰 Felix | `felix-finance` | claude-sonnet-4-6 | `#10B981` | Finance, budget, P&L, revenue, CAC, LTV, MRR, margin, ROI, runway |

---

## Model Assignment Logic

| Model | Use Case | Agents |
|-------|---------|--------|
| `claude-opus-4-6` | Architecture + complex technical reasoning | Dev, Raj |
| `claude-sonnet-4-6` | Strategy, synthesis, quality output, analytics | Marcus, Diana, Mia, Quinn, Lena, Rio, Atlas, Kai, Nate, Felix |
| `claude-haiku-4-5-20251001` | Volume production, asset pipeline | Pixel |

## War Room Model Assignments
| Step | Model | Reason |
|------|-------|--------|
| Intent classifier (`/api/route-intent`) | Haiku | JSON classification only |
| Specialist briefings (max 2) | Haiku | 100-150 word briefings |
| CEO synthesis (Marcus) | Sonnet | Quality final answer |

---

## Kill Log — 2026-04-01
> Agents removed in restructure. Knowledge preserved in surviving agents' MEMORY.md files.

| Agent | Reason | Knowledge Transferred To |
|-------|--------|--------------------------|
| 🎯 Alex (Marketing Dir) | Stark IS the marketing director. Don't outsource strategic thinking you should own. | Marcus (direction), Lena/Rio/Atlas (execution) |
| 🖌️ Leo (UI Designer) | 80% overlap with Mia. One DRI for design + implementation. | Mia (full design system absorbed) |
| 🗺️ Priya (PM) | Solo founder at this stage = you are the PM. Outsourcing PM thinking creates distance from the product. | Diana (planning absorbed) |
| 📅 Sam (Planner) | Sam = Priya with a calendar. Redundant. | Diana (sprint planning absorbed) |
| 🔍 Zara (Competitor) | Competitor intel is an analytics function. Not a separate discipline. | Kai (full scope absorbed) |
| 🎭 Opus (Creative Ops) | Creative ops = Atlas + Pixel's job. Three people doing what two should. | Atlas (pipeline ownership) |
| 🔭 Scout (Venture Scout) | You have 2 ventures. Idea validation is a distraction. Conviction beats research. | Retired |
| 🌱 Stark Growth (Personal) | Mixing personal brand with company OS is a focus leak. | Retired |
