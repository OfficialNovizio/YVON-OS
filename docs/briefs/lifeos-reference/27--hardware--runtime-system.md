# 27 · Hardware & Runtime (System)

> The physical and runtime layer the whole Life OS runs on: three Mac minis, the **Hermes** gateway, **OpenClaw** agent setup, cron jobs and memories — all archived so the rebuilding agents had complete context.

## Purpose

Document the machines and runtime that host the agents. This isn't a single dashboard page so much as the infrastructure surfaced across the **Agents** and **Org Chart** pages, plus the archived system the new build was based on.

## The machines (current fleet)

- **Mac Mini 2 — Hermes** · *Personal Layer, serves all workspaces.* Runs the **Hermes gateway** (routing) and the **personal C-suite** agents: Henry (Chief of Staff), Nexus (CTO), Steve (QA), Knox (Security), Wolf (Finance).
- **Mac Mini 1 — OpenClaw** · *Workspace tier, produces the work.* Runs the **OpenClaw** setup with the workspace/master agents that do production work.
- **Mac Mini 3 — Workshop & Services** · *Skill workshop, makes the team better.* Dedicated to skill training/improvement (see `07-skill-workshop.md`).
- **Mac Studio M5 (reserved)** · future capacity — "Mac Studios coming."

Fleet stats shown on the Agents page: ~**3 machines online**, ~**23 agents running**, ~**48 GB** RAM in use, routing via **Hermes**.

## Connectivity & control

- **SSH / terminal** direct connection to each machine, plus a **screen-share** option, so the owner can log in and fix things if the gateway goes down.
- **Hermes** is the routing/gateway layer that directs work to agents/machines.

## The archived reference system (how the rebuild got its context)

A key part of the methodology (from the walkthrough):
- The owner **SSH'd into the Mac mini** and made a **complete copy** of the existing **OpenClaw setup** — **Henry's main system, all cron jobs, all memories, all workspaces from every agent**, and the live codebase — and **archived it into a reference folder**.
- Client reference builds were also placed in the reference folder (not shown publicly for privacy).
- This gave the agents building the new project **complete context and a complete knowledge base of what already exists**, so they could build on top and make smarter, improvement-oriented choices rather than guessing.

## Why it matters

The runtime is the substrate for everything else: agents live on these machines, route through Hermes, run cron jobs, and read/write the Supabase-backed memory. Archiving the old system in full is what made the redesign an *improvement of something real* rather than a greenfield guess.
