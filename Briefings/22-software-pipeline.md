# 22 · Software Pipeline (Build · Software Factory)

> The "software factory": a **portfolio** of coding projects plus a **Kanban** of coding tasks, run by **Nexus** (CTO) with a mandatory **Steve** (QA) gate. Nexus can create PRs and deploy but **can never merge to main** — the owner reviews.

## Purpose

Where actual software gets built. **Nexus** is connected to the **GitHub repo and to Vercel**, can **deploy**, and is **only allowed to create PRs — never merge to main**. Every piece Nexus codes passes a **quality-assurance stage** with **Steve** before reaching the owner's review. This page has two layers: a portfolio overview and a task Kanban.

## Layer 1 — Portfolio overview ("Board" view)

- Title: **Software Pipeline**, breadcrumb `Vibe with AI / Software Pipeline`.
- Top stats: **Products** (e.g. 5), **shipped this XX**, **shipped this week**, **active tasks** (e.g. 44).
- Buttons: **Portfolio**, **Board / List** toggle, **Search & filter**.
- **Project cards** — one per product, each with status and progress:
  - **Idea-Feed MVP** — *needs you* / "X needs review" badge, progress %, "X in progress / X stage."
  - **By Design** — "X needs work," progress.
  - **Canela Shop** — "X in progress," discount/feature note, progress.
  - **Mission Control** — the dashboard itself, "X needs work," progress.
  - **Valhalla Tools** — "Active," progress.
  - Each card links to **GitHub / Vercel** and shows active task counts.

## Layer 2 — Task Kanban (per project / all products)

A board of coding tasks with stages tuned to the Nexus→Steve→owner flow:

1. **TRIAGE** — incoming tasks to be sorted (e.g. "Onboarding tooltip overlaps with shortcut," "Fix cart badge count on tap one mobile").
2. **PLANNING** — scoped/spec'd tasks (e.g. "Stream counter on the home lab · X subtasks," "Decision-queue keyboard shortcuts").
3. **BACKLOG** — approved, not started (e.g. "Stream counter on the home lab · X subtasks").
4. **IN PROGRESS** — Nexus actively coding (e.g. "Apple sign-in flow," "Shopify webhook retry").
5. **STEVE QA** — **Steve's quality-assurance gate**: checks the code aligns with the task/spec. If anything's off, it goes **back into Planning** (re-picked by Nexus). Example: "Brain search relevance tuning," "Venue CSV import validation."
6. **NEEDS REVIEW** *(human gate)* — passed QA, now **awaiting the owner's review** (e.g. "Voice-memo intake → structured idea"). Escalates into the Decision Queue / merge gate.
7. **DONE** — merged/shipped (e.g. "Push notification opt-in," "Discount-code field at checkout").

- A filter row across the top: **All products / By Design / Canela Shop / Idea-Feed MVP / Mission Control / Valhalla Tools**, plus **"Awaiting my review · Stuck > 3 days"** quick filters.

## Right rail — task detail ("Needs you")

Selecting a NEEDS REVIEW task opens a detail panel, e.g. **"Voice-memo intake → structured idea · Needs you"**:
- A description of what was built and a short demo/preview (a player thumbnail — "record a voice memo, get a clean structured idea card with title, summary, and suggested next step. Is this what you want?").
- **Two-stage gate recap:** ✓ *Steve QA — tests pass, QA green, acceptance met* → *Your final review — does it work & feel right? Approve / send back.*
- **Compose / nudge actions** and a **PRD** / **Mockup** reference (links to the spec and the mock).
- Actions: **Open PR**, approve, or **send back**.

## Agents & rules (design decisions)

- **Nexus (CTO):** writes code, opens PRs, deploys to Vercel — **never merges to main**.
- **Steve (QA):** independent quality gate between Nexus and the owner; failed checks loop back to Planning.
- **Owner:** final reviewer/merger for the projects Nexus codes.
- Connected to **GitHub** (repo/PRs) and **Vercel** (deploys).

## Workflow

Idea Feed → project in portfolio → task: Triage → Planning → Backlog → In Progress (Nexus) → Steve QA → Needs Review (owner) → Done. QA failures return to Planning; owner-review items also surface in the Decision Queue.
