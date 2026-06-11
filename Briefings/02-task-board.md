# 02 · Task Board

> This is the **agents' task board, not the owner's personal to-do list.** Agents propose work daily; the owner approves; agents execute; the owner reviews only when needed.

## Purpose

A Kanban board of the work the AI team wants to do and is doing. Every day the agents propose ideas/tasks they want to take on. The owner quickly approves them into the backlog and the week; agents execute (usually in minutes); the owner reviews only outputs that need verification.

## Page header

- Title: **Task Board**, breadcrumb `Vibe with AI / Task Board`.
- Top bar: **System healthy**, **agents live** counter.
- Buttons: **Search & filter**, **New task**.
- A sub-line with quick filters/labels (e.g. *Needs me*, plus filters for proposer, workspace, view).

## Kanban columns (stages)

Left → right, the observed columns:

1. **PROPOSED** *(yellow / needs-human stage)* — tasks agents want to do, each with an **Approve** button. Examples seen: "Script benchmark: Claude 4.7 vs Gemini 3 on the OpenClaw refactor"; "Research: is 'agent-as-a-service' a real hype/cycle category?". Approving moves a card to Backlog.
2. **BACKLOG** — approved-but-not-yet-scheduled work. Examples: "Draft the newsletter #13 outline"; "Rotate the exposed Google API key"; "Compile 3D Ikea venue contacts."
3. **THIS WEEK** — scheduled for the current week. Example: "LinkedIn carousel — tighten the hook."
4. **REVIEW** *(yellow / needs-human stage)* — agent output awaiting the owner's check, each with **Approve** / discard. Examples: "Newsletter #12 — first draft"; "Download concepts for 'shipping cuts'"; "Thumbnail v2 — '10 agents that ship code'"; "Newsletter draft."
5. **DONE** — completed and accepted work.

> **Design decision — no "In Progress" column.** The owner *removed* the in-process stage because agents execute quickly (a few minutes, max ~20–30 min). Instead of cards sitting in an extra stage, live execution is shown by the **Live Activity tracker** (right rail). Cards only need to surface when they're **ready to review**, then move to Done.

> **Two yellow stages need the human:** *Proposed* and *Review*. Both **escalate into the Decision Queue** so nothing waits silently.

## Live Activity tracker (right rail)

Replaces the "In Progress" column. Shows real-time agent work:

- A live feed of **which agents are working and on which tasks** (e.g. Nexus, Ivy, Leonardo, Kira, Henry, William), each line with the agent avatar, the task, and a status.
- A small "X working" counter at the top.
- Lets the owner watch execution happen without managing a column.

## Learning behavior (design intent)

The board is meant to learn **which kinds of tasks need review and which can ship from the get-go**, so the owner has to approve less over time — both at the *Proposed* gate (auto-approve safe task types) and the *Review* gate (auto-accept trusted outputs).

## Workflow summary

Agent proposes → owner approves (Proposed→Backlog) → scheduled (This Week) → agent executes (shown in Live Activity, not a column) → output lands in Review → owner approves → Done. Proposed and Review items also appear in the Decision Queue.
