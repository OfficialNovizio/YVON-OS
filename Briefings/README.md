# LifeOS — Mission Control: Feature Briefings

This folder documents every screen of the **LifeOS Mission Control** dashboard as shown in the source walkthrough ("My AI Agents Redesigned My Mission Control") and its 32 accompanying screenshots. Each briefing describes one screen in detail: its purpose, every visible UI element, sub-features, popups, modes, and the agents and workflows behind it.

## What this product is

LifeOS Mission Control is a single command center for running a one-person company operated largely by AI agents. The owner's stated goal: wake up to **one screen that surfaces only the ~7 things that actually need a human decision**, because everything else has been handled by agents overnight. It is organized as a multi-workspace ("multi-tenant") app where each business/project gets its own workspace, design theme, pages, and partner logins, all sharing a common agent roster and memory system.

> Status note from the source: at the time of capture this is a **mock-up / blueprint** — screens are hard-coded and not yet functionally wired. These briefings document the *intended* design and behavior of each screen, which is exactly the planning artifact ("the briefings") the build is meant to be driven from.

## How the briefings are organized

The files mirror the creator's own `Briefings` documentation folder. Read `00-Page-Inventory.md` first for the global UI (sidebar, workspace switcher, top bar, themes) and the full map of pages.

### Command Center
- `01-decision-queue.md` — the daily "7 things that need me" queue
- `02-task-board.md` — the agents' Kanban + live activity tracker
- `03-advisory-council.md` — strategic advisor agents, recommendations, War Room live session
- `04-agents-page.md` — which agents run on which machine
- `05-org-chart.md` — org structure across personal team and workspaces
- `06-office.md` — 3D "office space" visualization of agent activity
- `07-skill-workshop.md` — agent skill training / improvement

### Content & Social
- `08-content-pipeline.md` — long-form (YouTube) idea→published Kanban
- `09-production-calendar.md` — content cadence calendar
- `10-youtube-studio.md` — packaging, titles, thumbnails, descriptions
- `11-youtube-analytics.md` — long-form performance
- `12-short-pipeline.md` — shorts production flow
- `13-shorts.md` — shorts upload & multi-platform distribution
- `14-social-approvals.md` — image + copy approval for posts
- `15-scheduler.md` — drag-and-drop multi-platform posting calendar
- `16-social-analytics.md` — cross-platform post performance
- `17-newsletter.md` — Kit-integrated newsletter studio

### Knowledge
- `18-brain-and-wiki.md` — 3D knowledge graph + memory library
- `19-asset-lab-leonardo.md` — image-generation asset library + brand kits
- `20-trend-radar-isaac.md` — trend/research analysis feed

### Build · Software Factory
- `21-idea-feed.md` — proposed product/build ideas
- `22-software-pipeline.md` — portfolio + coding Kanban (Nexus/Steve)

### Revenue
- `23-consulting-crm.md` — consulting lead pipeline
- `24-cinematic-sites.md` — client website builds

### System
- `25-email-inbox.md` — multi-account inbox with inline drafts + triage
- `26-workspaces-and-design-system.md` — multi-workspace model, themes, Supabase multi-tenancy
- `27-hardware-and-runtime.md` — Mac minis, Hermes gateway, agent runtime
- `28-dashboard-home.md` — landing/overview page *(inferred)*
- `29-projects-page.md` — project portfolio *(inferred)*
- `30-people-page.md` — people/contacts directory *(inferred)*
- `31-docs.md` — authored documentation/SOPs *(inferred)*
- `32-logs.md` — activity/audit log *(inferred)*

> **`VERIFICATION.md`** (folder root) contains a triple-check: all 32 screenshots mapped to files, the full transcript mapped to files, and a reconciliation against the creator's own `Briefings/` folder. Pages 28–32 were added from that reconciliation and are flagged inferred.

## Recurring design patterns

A handful of ideas repeat across nearly every screen. They are documented once here and referenced throughout:

- **Human-as-bottleneck filtering.** Agents produce fast; the human is the constraint. Henry (chief of staff) filters everything down to the few items that truly need a decision, and escalates the rest into the Decision Queue.
- **Learning over time.** Almost every approval surface is designed so the agent learns the owner's decisions and asks for less and less over time (drafts → auto-send once trust is built).
- **Two "yellow" human-input states.** Kanban boards use *Proposed* and *Review* as the stages that need the human; both escalate into the Decision Queue.
- **Defer / snooze.** Items can be deferred (look again in a day, tonight, tomorrow, a few days), after which Henry nudges via Telegram.
- **Per-workspace theming.** Each workspace has its own visual theme (Vibe with AI default; Canela "deep sea green"; Valhalla "techno"; By Design "glass neon").
- **Drafts not sends.** Email and social start as drafts the human reviews; full automation is the long-term vision once trust is established.

## Source

- Walkthrough transcript: *"My AI Agents Redesigned My Mission Control"* (YouTube: https://www.youtube.com/watch?v=AIV3El9HJ5w)
- 32 screenshots dated 2026-06-10 (sidebar, each page, popups, War Room, and the creator's own Briefings folder).
