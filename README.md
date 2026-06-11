# YVON OS

A Next.js scaffold that rebuilds the **LifeOS Mission Control** screens (from `../LifeOS-Briefings/`) using the **YVON dashboard's design system** — its Material-3 dark token palette, glassmorphic cards, SF Pro Display type, and accent system.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /decision-queue
npm run build    # production build
npm run lint
```

> Requires Node 18+. No backend or env vars — every screen uses static mockup data (matching the source, which is itself a mockup blueprint).

## What's built

**App shell** — left sidebar (full nav grouped exactly like the briefings), top bar (Ask-Henry search, system health, agents-live, avatar), and a **workspace switcher** that re-themes the whole app per workspace (Vibe / Canela / Valhalla / By Design each get their own accent).

**6 hero screens, fully detailed:**

| Screen | Route | Highlights |
|---|---|---|
| Decision Queue | `/decision-queue` | 7-item decision feed, inline actions, "how it's flowing", Henry's nudge plan, clear-my-queue |
| Task Board | `/task-board` | Proposed→Done Kanban (no In-Progress), Live Activity tracker |
| Advisory Council | `/advisory-council` | recommendations, audio player, Pattern Tracker, **War Room** live-session modal |
| Agents | `/agents` | fleet stats, machine groups, SSH / screen-share |
| Brain & Wiki | `/brain-wiki` | 3D knowledge-graph (SVG), Library view, knowledge-gap rail |
| Software Pipeline | `/software-pipeline` | project portfolio + Nexus→Steve QA→review Kanban |

**~25 more screens** are navigable placeholders (`/content-pipeline`, `/scheduler`, `/newsletter`, `/inbox`, `/asset-lab`, …). Each renders its purpose, key features, and a pointer to its briefing file, themed on the design system and ready to build out.

## Design system mapping (YVON → here)

- **Tailwind tokens** in `tailwind.config.ts` are copied verbatim from YVON (Material-3 dark: `background`, `surface`, `primary #abc7ff`, `tertiary #ffb693`, full container/outline scale).
- **`app/globals.css`** ports YVON's glass-card treatment and adds shell-specific component classes (`.nav-link`, `.kanban-card`, `.btn-accent`, `.chip`, `.live-dot`).
- **Per-workspace accent** is driven by a CSS variable (`--ws-accent`) set via `data-workspace` on the shell root — switch workspaces in the sidebar to see Canela's deep-sea green, Valhalla's techno violet, By Design's glass-neon cyan.
- **Type:** SF Pro Display (drop the YVON `Fonts/*.OTF` into `public/fonts/` for the exact faces; Inter is loaded as a fallback).

## Structure

```
app/
  layout.tsx            # html + WorkspaceProvider + Shell
  page.tsx              # redirect → /decision-queue
  <screen>/page.tsx     # one folder per screen
components/
  Shell, Sidebar, TopBar, WorkspaceSwitcher, Icon, ui, Placeholder
lib/
  nav.ts                # sidebar structure (from the briefings)
  workspaces.ts         # the 4 workspaces + accents
  WorkspaceContext.tsx  # active-workspace state + theming
```

## Verification status

- `tsc --noEmit`: **0 errors**.
- All TS/TSX files parse & transform cleanly (esbuild).
- `next build` / `next lint` were not run in the authoring sandbox (SWC native limitation there); run them locally.

Specs for every screen live in `../LifeOS-Briefings/Briefings/`.
