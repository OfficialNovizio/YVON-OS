# 00 · Page Inventory & Global UI

This file covers the chrome that is shared by every screen — the left sidebar, workspace switcher, top bar, and global theming — plus the complete map of pages.

## App identity

- **Product name:** LifeOS, labelled **"MISSION CONTROL"** under the logo (top-left).
- **Logo:** a purple/violet gradient rounded-square mark with an "L".
- **Default workspace:** "Vibe with AI" (the owner's main brand).

## Left sidebar (primary navigation)

The sidebar is dark, fixed to the left, and grouped into labelled sections. Items can carry a **count badge** (a small pill with a number) indicating pending items.

**Workspace switcher (top of sidebar)**
- A boxed selector showing `WORKSPACE` label and the active workspace name ("Vibe with AI") with up/down chevrons to switch between workspaces. Switching changes both the data and the visual theme of the whole app (see `26-workspaces-and-design-system.md`).

**Command Center (top, ungrouped/core)**
- Decision Queue
- Task Board
- Advisory Council
- Agents
- Org Chart
- Office
- Skill Workshop

**LONG-FORM**
- Content Pipeline
- Production Calendar
- YouTube Studio
- YouTube Analytics

**SHORTS**
- Short Pipeline
- Shorts

**POSTS**
- Social Approvals — badge `6`
- Scheduler
- Social Analytics
- Newsletter

**KNOWLEDGE**
- Brain & Wiki
- Asset Lab · Leonardo
- Trend Radar · Isaac

**BUILD · SOFTWARE FACTORY**
- Idea Feed — badge `94`
- Software Pipeline — badge `1`

**REVENUE**
- Consulting CRM — badge `3`
- Cinematic Sites
- (list continues below the fold)

> The badges are live counters of items awaiting attention in each module (e.g., 6 social approvals, 94 ideas, 1 software item, 3 consulting items).

## Top bar (global)

Persistent across pages:

- **Breadcrumb / context** — shows the active workspace and page, e.g. `Vibe with AI / Decision Queue`.
- **Global search** — a centered "Ask Henry or jump anywhere…" command box (jump-to-page + ask-the-chief-of-staff in one).
- **System status** — a "System healthy" indicator.
- **Agents-live counter** — e.g. "12 agents live" / "agents live", showing how many agents are currently running.
- **Account avatar** — top-right user/account circle.
- Some pages add page-specific buttons to the top bar (e.g. *New task*, *Search & filter*, *Board/List* toggle, *Set today's topic*).

## Global theming

The whole UI is a dark, neon-accented "command center" aesthetic with a magenta/violet primary accent and a thin magenta progress bar along the bottom edge. Each workspace overrides the accent and mood:

| Workspace | Brand | Theme |
|---|---|---|
| Vibe with AI | main brand | default violet/magenta |
| Canela | e-commerce shop | "deep sea" greenish |
| Valhalla | music business | "techno" (electronic) |
| By Design | app/agency | "glass neon" |

## Complete page map (with briefing file)

| # | Page | Section | Briefing |
|---|---|---|---|
| 1 | Decision Queue | Command | `01-decision-queue.md` |
| 2 | Task Board | Command | `02-task-board.md` |
| 3 | Advisory Council (+ War Room) | Command | `03-advisory-council.md` |
| 4 | Agents | Command | `04-agents-page.md` |
| 5 | Org Chart | Command | `05-org-chart.md` |
| 6 | Office | Command | `06-office.md` |
| 7 | Skill Workshop | Command | `07-skill-workshop.md` |
| 8 | Content Pipeline | Long-form | `08-content-pipeline.md` |
| 9 | Production Calendar | Long-form | `09-production-calendar.md` |
| 10 | YouTube Studio | Long-form | `10-youtube-studio.md` |
| 11 | YouTube Analytics | Long-form | `11-youtube-analytics.md` |
| 12 | Short Pipeline | Shorts | `12-short-pipeline.md` |
| 13 | Shorts | Shorts | `13-shorts.md` |
| 14 | Social Approvals | Posts | `14-social-approvals.md` |
| 15 | Scheduler | Posts | `15-scheduler.md` |
| 16 | Social Analytics | Posts | `16-social-analytics.md` |
| 17 | Newsletter | Posts | `17-newsletter.md` |
| 18 | Brain & Wiki | Knowledge | `18-brain-and-wiki.md` |
| 19 | Asset Lab · Leonardo | Knowledge | `19-asset-lab-leonardo.md` |
| 20 | Trend Radar · Isaac | Knowledge | `20-trend-radar-isaac.md` |
| 21 | Idea Feed | Build | `21-idea-feed.md` |
| 22 | Software Pipeline | Build | `22-software-pipeline.md` |
| 23 | Consulting CRM | Revenue | `23-consulting-crm.md` |
| 24 | Cinematic Sites | Revenue | `24-cinematic-sites.md` |
| 25 | Email Inbox | System | `25-email-inbox.md` |
| 26 | Workspaces & Design System | System | `26-workspaces-and-design-system.md` |
| 27 | Hardware & Runtime | System | `27-hardware-and-runtime.md` |
| 28 | Dashboard / Home | System (inferred) | `28-dashboard-home.md` |
| 29 | Projects | System (inferred) | `29-projects-page.md` |
| 30 | People | System (inferred) | `30-people-page.md` |
| 31 | Docs | System (inferred) | `31-docs.md` |
| 32 | Logs | System (inferred) | `32-logs.md` |

> Pages 28–32 were not shown as dedicated UI screenshots; they were identified from the creator's own `Briefings/` folder (screenshot 181510) and are flagged **Inferred**. See `../VERIFICATION.md` for the full three-pass coverage check.

> **Confidence key used throughout:** *Confirmed* = visible in a screenshot; *Stated* = described in the walkthrough transcript; *Inferred* = reasonable interpretation where the screen was named but not shown in detail. Each briefing flags inferred content.

## The cast of agents (referenced across screens)

- **Henry (Henri Matisse)** — Chief of Staff; runs the Decision Queue, filters/escalates, nudges via Telegram, coordinates the personal team.
- **Knox** — Security Officer (credential leaks, key rotations).
- **Nexus** — CTO; codes PRs in the Software Pipeline (create PRs only, never merge to main).
- **Steve** — Quality Assurance; reviews Nexus's code before it reaches the owner.
- **Wolf** — Finance Officer.
- **Leonardo** — image-generation agent (Asset Lab).
- **Isaac** — trend/research agent (Trend Radar).
- **William** — copywriting agent (social copy A/B variants).
- Plus per-workspace master agents and workspace-specific agents (e.g., Canela: Aria, Nyx, Lucia, Estelle; By Design: Viola, Hana, Atlas; Valhalla: Fenrir, Saga).
