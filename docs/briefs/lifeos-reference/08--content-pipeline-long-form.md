# 08 · Content Pipeline (Long-form)

> The "whole content machine" for long-form (YouTube): a Kanban from raw idea → published, where agents handle ideation, talking points, thumbnails, descriptions and chapters, and the owner films/edits.

## Purpose

Run long-form content end to end. Agents help **find ideas, draft talking points (not full scripts), design thumbnails, and prep descriptions/titles**; the owner does filming and editing. It enforces a **cadence** so videos ship on schedule.

## Page header

- Title: **Content Pipeline**, breadcrumb `Vibe with AI / Content Pipeline`.
- Sub-line: "Long-form · idea → published" plus a **cadence** indicator (e.g. "1 video / week · cadence: X · 6 ideas in clear-up"), an **On cadence** status pill, and **ideas-in-queue** counter.
- View toggles: **Strategy view**, **Calendar**, and **New idea** button.

## Kanban columns (stages)

Left → right:

1. **IDEAS** — raw video ideas, each a card (e.g. "I gave 5 AI agents one indecisive idea for a week," "Building a $X SaaS company with just Claude Code"). Tagged by source/score.
2. **SCRIPTING** — talking-points stage (explicitly **only talking points, not a full script**). Cards like "AI agents that ship code while you sleep," "I rebuilt my whole company on a team of AI agents." Items show a "script angle / talking points" note.
3. **THUMBNAILS** — thumbnail design/iteration. Cards like "From idea to shipped in one prompt," "My agent stack, fully explained." Each card carries thumbnail concepts and a "needs candidate / pick one" note.
4. **FILMING** — ready to film; the owner records. Card e.g. "Why I fired my dashboards for a cockpit."
5. **EDITING** — owner edits. Card e.g. "How I let software edit my code," "The memory system that runs my agents."
6. **READY** — finished, ready to upload (handing off to YouTube Studio packaging).
7. **PUBLISHED** — live videos (e.g. "Building my Mission Control, part 1").

Each card shows the workspace tag, contributing agents (e.g. Leonardo for thumbnails, William for copy), and the next required action.

## How agents and the owner split work

- **Agents:** find YouTube ideas, generate talking points, design thumbnail concepts, and (post-production) draft descriptions/titles/chapters.
- **Owner:** filming and editing are done manually.
- The pipeline hands off to **YouTube Studio** (`10-youtube-studio.md`) for packaging the final upload, and to **YouTube Analytics** (`11-youtube-analytics.md`) for performance.

## Cadence & views

- **Cadence enforcement:** the header tracks whether the channel is "on cadence" (e.g. 1 video/week) and how many ideas are queued to keep the funnel full.
- **Strategy view** and **Calendar** offer alternative lenses on the same content (a planning/strategy layout and a date-based layout, linking to the Production Calendar).
