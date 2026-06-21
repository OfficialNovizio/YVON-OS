# YVON OS v3.0

**AI Operating System — 24 agents, multi-venture dashboard, advisory council.**

[![deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://yvon.in)
[![stack](https://img.shields.io/badge/stack-Next.js%2015%20%7C%20TypeScript%20%7C%20Supabase-blue)](https://nextjs.org)
[![engine](https://img.shields.io/badge/engine-ToonGine%20v1.5.4-purple)](https://github.com/OfficialNovizio/ToonGine)
[![agents](https://img.shields.io/badge/agents-24-green)](#agents)
[![license](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

**Live:** [yvon.in](https://yvon.in) · **Repo:** [github.com/OfficialNovizio/YVON-OS](https://github.com/OfficialNovizio/YVON-OS)

---

## What is YVON OS

YVON OS orchestrates 24 AI agents across 10 departments, manages multiple ventures (Novizio fashion e-commerce + Hourbour fintech SaaS), and provides a glass-morphism dashboard with real-time agent council decisions — all powered by ToonGine under the hood.

```bash
npm install          # install deps
npm run dev          # → localhost:3000
npm run build        # production build
```

## Architecture

```
YVON OS (Next.js 15 App Router)
│
├── app/                          # Routes + Screens
│   ├── api/                      # 188 API routes
│   │   ├── council/convene/      # Advisory Council — live Hermes agent spawns
│   │   ├── team-chat/            # Multi-agent chat pipeline
│   │   ├── claude/               # Anthropic/DeepSeek proxy
│   │   └── ...                   # Analytics, social, competitors, etc.
│   ├── advisory-council/         # Council UI — real-time debate view
│   ├── screens/                  # Dashboard tabs (Overview, Burn, Health, etc.)
│   └── layout.tsx                # Root layout (Vercel Analytics + Speed Insights)
│
├── lib/                          # 50+ business logic modules
│   ├── agents.ts                 # Agent dispatch system
│   ├── hermes-spawn.ts           # Agent subprocess spawner + CONSTITUTION injection
│   ├── agent-tools.ts            # War Room tools (Read, Glob, Grep, WebFetch, etc.)
│   ├── cie/                      # Context Intelligence Engine sources
│   │   └── sources/              # agent-memory, graphify, codegraph, hermes-memory
│   ├── ai-client.ts              # Multi-provider AI client (Anthropic/DeepSeek/OpenAI)
│   └── supabase.ts               # Database client
│
├── .toon/                        # TOON-compressed data (build artifact, gitignored)
│   ├── agents/                    # 24 agents from ToonGine (source of truth)
│   ├── memory/hermes/             # Hermes sync cache (gitignored)
│   ├── graphify/                  # Graphify knowledge graph output
│   ├── codegraph/                 # Codegraph dependency graph output
│   └── docs/                     # CONSTITUTION.toon + ENGINE.toon
│
├── docs/                         # Human-readable documentation (55 files)
│   ├── CONSTITUTION.md           # 10 immutable operational laws
│   ├── ENGINE.md                 # Architecture reference
│   ├── WORKFLOW.md               # Session protocol (mandatory read)
│   └── ventures/                 # Venture-specific docs (Novizio, Hourbour)
│
├── supabase/migrations/          # 51 database migrations
├── components/                   # Shared UI (Shell, Sidebar, Modal, etc.)
└── public/                       # Static assets
```

## Agents

24 agents across 10 departments. All agent definitions ship from ToonGine via `npm install`.

| Department | Agents | Level |
|---|---|---|
| **Command** | Board | L1 — governance |
| **CEO** | Marcus | L1 — orchestrator, final say |
| **COO** | Diana | L1 — operations, sprints |
| **Finance** | Felix | L2 — financial intelligence |
| **Psychology** | Kahneman | L2 — bias audit, decision review |
| **Legal** | Docs, Comply, Guard | L2–L3 |
| **Research** | Vette, Depth, Synth | L3 |
| **Sense** | Scout, Radar, Forge | L3 |
| **Marketing** | Kai, Lena, Rio, Nate, Atlas, Pixel | L2–L3 |
| **Technical** | Dev, Mia, Raj, Quinn | L2–L3 |

**Level-gating:** L3 (execution) — no delegate/cron access. L2 (intelligence) — propose, not approve. L1 (command) — full access.

## Ventures

| Venture | Type | Description |
|---|---|---|
| **Novizio** | Fashion e-commerce | Brand: bold, modern, Gen-Z streetwear |
| **Hourbour** | Fintech SaaS | Brand: professional, trust-forward, data-driven |
| **YVON Dashboard** | Internal OS | Glass-morphism dark theme, 9+ tabs |

## Dashboard

Live at `localhost:3000` (dev) or `yvon.in` (production). Glass-morphism dark theme.

| Tab | Description |
|---|---|
| Overview | System status, agent health, recent decisions |
| Efficiency | TOON compression stats, token savings |
| Agents | 24-agent status grid with level/role |
| TOON | Compression pipeline view |
| Cost | 💰 Token burn tracking (Hermes + ToonGine + API) |
| Health | 🏥 Project health metrics, error rates |
| Burn | Real-time cost monitor |
| Sim | Simulation sandbox |
| System | Config, env vars, database status |

## Advisory Council

Real multi-agent decision system. `POST /api/council/convene` spawns 4 Hermes agents (Marcus, Diana, Felix, Kai) in sequence, synthesizes with Marcus, runs Kahneman bias audit.

```
Council page → user submits question
       │
       ▼  /api/council/convene
       │
       ├── Spawn Marcus (90s)    → strategic analysis
       ├── Spawn Diana (90s)     → operational review
       ├── Spawn Felix (90s)     → financial check
       ├── Spawn Kai (90s)       → market data analysis
       │
       ▼  Marcus synthesizes → Kahneman bias audit
       │
       ▼  Decision card: APPROVED / CONDITIONAL / DENIED
```

## Commands

```bash
# Development
npm run dev                 # Next.js dev server → localhost:3000
npm run build               # production build (type-check + bundle)
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit

# Testing
npm test                    # vitest
npm run test:unit           # unit tests
npm run test:e2e            # Playwright e2e
npm run test:a1             # A1 simulation tests

# Database
npm run db:migrate          # run Supabase migrations

# Knowledge Graphs (powered by ToonGine)
npm run graphify:build      # rebuild code structure graph
npm run graphify:query      # query the graph
npm run codegraph:build     # rebuild dependency graph
npm run codegraph:serve     # open graph web UI

# Hermes Agent
npm run hermes:sync         # sync agent memories
npm run hermes:setup        # clone + configure Hermes runtime

# Maintenance
npm run curator             # curator check (docs, memory, cleanup)
npm run insights            # generate insights report
npm run reflect             # post-session reflection (agent learning)
```

## API Highlights (188 routes)

| Endpoint | Method | Description |
|---|---|---|
| `/api/council/convene` | POST | Advisory Council — live agent debate |
| `/api/claude` | POST | AI proxy (Anthropic/DeepSeek via ToonGine CIE) |
| `/api/team-chat` | POST | Multi-agent chat pipeline |
| `/api/ai-keys` | GET/POST | Provider key management |
| `/api/token-usage` | POST | Unified token tracking (Hermes + API) |
| `/api/project-health` | GET | System health metrics |
| `/api/token-burn` | GET | Real-time cost data |
| `/api/analytics` | GET | Google Analytics proxy |
| `/api/social/*` | * | Social media data pipeline |
| `/api/competitor/*` | * | Competitor intelligence |

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + glass-morphism design system |
| Database | Supabase (PostgreSQL) |
| AI Engine | ToonGine v1.5.4 (TOON compression, CIE, agents) |
| AI Providers | Anthropic (Claude), DeepSeek, OpenAI-compatible |
| Deployment | Vercel (yvon.in) |
| Testing | Vitest + Playwright |
| Auth | Supabase Auth + jose (JWT) |
| Payments | Stripe |
| Email | Resend |
| Monitoring | @vercel/analytics + @vercel/speed-insights |

## Package Info

```bash
npm info yvon-os version     # check version
npm ls --depth=0             # list direct dependencies
```

```
Name        : yvon-os
Version     : 0.1.0
Description : AI Operating System — 24 agents, multi-venture, advisory council
Stack       : Next.js 15 · TypeScript strict · Supabase · Vercel
Engine      : ToonGine v1.5.4
Agents      : 24 (shipped from ToonGine templates)
API Routes  : 188
Migrations  : 51
```

## Quick Start

```bash
git clone https://github.com/OfficialNovizio/YVON-OS.git
cd YVON-OS
cp .env.example .env.local    # add your API keys
npm install                   # installs ToonGine + all deps
npm run dev                   # → http://localhost:3000
```

## Environment Variables

See `.env.example` for the full list. Key variables:

```bash
ANTHROPIC_API_KEY=            # Anthropic/DeepSeek API key
SUPABASE_URL=                 # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=    # Supabase service role (server-only)
GITHUB_TOKEN=                 # GitHub personal access token
VERCEL_TOKEN=                 # Vercel deploy token
STRIPE_SECRET_KEY=            # Stripe payments
RESEND_API_KEY=               # Email service
```

## License

MIT — YVON OS
