# 18 · Brain & Wiki (Knowledge)

> The memory system, visualized as a **3D knowledge graph** you can fly through, plus a searchable **Library** of the MD files the agents create. Everything is vectorized in Supabase with semantic search for all agents.

## Purpose

The shared memory/wiki for the whole org. It both **visualizes** how knowledge is forming (a 3D graph of connected topics) and lets the owner **navigate** the underlying documents. The new memory system is what makes the Advisory Council and agents far smarter than the old narrow-knowledge setup.

## Page header

- Title: **Brain & Wiki**, breadcrumb `Vibe with AI / Brain & Wiki`.
- Global search ("Ask Henry or jump anywhere…").
- **View toggle: Graph | Library**.
- **Visibility filter chips**: **All areas**, **Private**, **Team**, **Workspace**, **Cross-WS** (cross-workspace) — filter the knowledge by who can see it.
- Counters top-right: **Topics** (e.g. 248), **Documents** (e.g. 3,412), and a small alert count (e.g. 7).

## Graph view (3D knowledge map)

- A **3D force-directed graph** of glowing nodes (topics) connected by edges, color-coded (purple/teal/yellow) — likely by visibility or workspace.
- **Interactions:** hover a node to see the topic; **zoom** in/out; **click a node** to open its detail (see below). The camera can orbit the cluster.
- Node **size** reflects how much knowledge is built around a topic; clusters show how knowledge areas are developing.

### Node detail (click popup / right panel)
Clicking a node opens a detail panel, e.g. **"Nina's voice profile — example"**:
- A description of the topic ("a topic in the Workspace zone … connected to X related topics").
- **Visibility** and **zone** tags (Workspace / Private / Team / Cross-WS).
- **Connected topics** — linked nodes (e.g. Offer-fit zone, Lineateza library — example, By Design launch fame…).
- **Source MD files** that make up the topic (e.g. `voice-guidelines.md`, `analytics-2026-q1.md`, `persona-setup.md`) — the actual Markdown documents being created.
- Actions: **Reveal in Library**, **Send by mail/share**.

## "What the agents know" (right rail, graph view)

- A live panel summarizing the knowledge base and **gaps/alerts** — e.g. "No data on TikTok Shop fees," "Missing competitor thumbnail teardown," "Valhalla venue contacts incomplete" — each with an **Account / fix** action. This turns missing knowledge into actionable tasks.

## Library view

- A **document browser** of all the MD files the memory system has created.
- **Filter by category** and **sort** controls to quickly navigate.
- Each document row shows title, category, visibility, source, and last-updated; selecting one opens the document with its **Answer / Findings / sources** structure.
- Example doc opened: *"is agent-as-a-service real demand?"* showing an **Answer**, **Findings** (with inline source chips/links), and **"What this means for us"** synthesis — i.e. memory entries are structured research notes, not just raw text.

## Technical model (stated)

- Built on **Supabase**.
- **Everything is vectorized**; **semantic search is enabled for all agents** so any agent can retrieve relevant memory.
- Visibility scoping (Private / Team / Workspace / Cross-workspace) controls which agents can access which knowledge.

## Why it matters

This is the backbone that gives every agent (and especially the Advisory Council) complete, shared context — the single biggest upgrade over the old system's siloed, narrow knowledge.
