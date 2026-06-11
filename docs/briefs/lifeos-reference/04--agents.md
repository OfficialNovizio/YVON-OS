# 04 · Agents

> An infrastructure overview: which agents run on which machine, what they have access to, and the health of the fleet.

## Purpose

A single place to keep an overview of the agent fleet across the owner's physical machines — what's running where, access, and connectivity — with a direct line (SSH/screen share) to fix machines when needed.

## Page header

- Title: **Agents**, breadcrumb `Vibe with AI / Agents`.
- A "Find an agent or machine…" search and a link to the **Org Chart**.
- Top bar: **System healthy**, **agents live** counter.

## Top summary cards (fleet stats)

A row of KPI cards across the top:
- **Machines online** — e.g. `3` (Mac minis online).
- **Agents running** — e.g. `23`.
- **Used RAM** — e.g. `48 GB` (with a fraction of total).
- **Routing / gateway** — e.g. **Hermes** (the routing/gateway agent).

## Machine groups (the fleet)

Agents are grouped under the physical machine they run on. Each machine block shows the machine name, role, status (online/cooling/idle), and the agent avatars on it:

- **Mac Mini 2 — Hermes** · *Personal Layer · serves all workspaces.* Hosts the **routing/gateway** and the **personal team**: **Nexus** (CTO), **Steve** (QA), **Knox** (Security), **Wolf** (Finance), Henry (Chief of Staff). Status chips like "routing / online."
- **Mac Mini 1 — OpenClaw** · *Workspace tier · produces the work.* Hosts the workspace/master agents that do the production work ("active load").
- **Mac Mini 3 — Workshop & Services** · *Skill workshop · makes the team better.* The skill-training/improvement machine.
- **Mac Studio M5 — (reserved)** · future capacity ("Mac Studios coming"), shown idle/queued.

Each machine row is expandable to see its agents and exposes a **direct connection via SSH/terminal** and a **screen-share** option so the owner can log in and fix anything if the gateway goes down.

## What it's for (design intent)

This is a monitoring/overview page — keep an eye on which machine hosts which agents, RAM/health, and connectivity. It is the technical counterpart to the **Org Chart** (which shows the *organizational* structure rather than the *hardware* layout). See `27-hardware-and-runtime.md` for the runtime details.
