# CEO Dashboard Feature Migration — YVON 2.0 → YVON-OS

> What stays, what moves, what dies.

## The Old CEO Dashboard

YVON 2.0 had a 2-tab CEO Command Dashboard:
- **Briefing tab** — Strategic briefing, priorities, decision queue, intelligence feed
- **Operations tab** — System strip (graph view, token usage, workload, session sync), project graph, agent kanban

Legacy code also had:
- **Overview** — KPI gauges (ROAS/CAC/Brand Health), key numbers (removed)
- **Situation** — Agent kanban, intelligence feed
- **Act** — Decision queue, priorities, decisions live
- **Done** — Activity log, source reports
- **Context** — Strategic briefing, pulse, CEO readout

## Where Each Feature Goes

### LIVE DATA → Dashboard/Home (new morning overview)

| Feature | Current | Destination | Why |
|---------|---------|-------------|-----|
| **Token Usage** | CEO > Operations | **Dashboard/Home** | Real data (DeepSeek balance, $17.76, per-agent spend). This is a genuine morning metric. |
| **System Health** | CEO > Operations | **Dashboard/Home** | "System healthy / X agents live" — quick status before CEO dives in |
| **Agent Kanban** | CEO > Situation | **Agents page** | "Which agents are working" belongs on Agents page with Live Activity tracker |
| **Project Graph** | CEO > Operations | **Brain & Wiki** (Graph tab) | 1,058 nodes already live. This is knowledge visualization, not command. Already exists at `/brain-wiki`. |

### DECISION-FLOW → Decision Queue page (superseded)

| Feature | Current | Destination | Why |
|---------|---------|-------------|-----|
| **Decision Queue** | CEO > Act panel | **Decision Queue page** 🎯 | Now the dedicated page. Gets real data + Marcus filter + defer/snooze |
| **Priorities** | CEO > Act panel | **Decision Queue page** (right rail) | "Top 3 priorities" is a filtered view of the queue |
| **Intelligence Feed** | CEO > Situation | **Advisory Council** (Pattern Tracker) | Merged into Council's "what keeps coming up" tracker |

### STRATEGY → Advisory Council page (superseded)

| Feature | Current | Destination | Why |
|---------|---------|-------------|-----|
| **Strategic Briefing** | CEO > Context | **Advisory Council** (recommendations) | "What the council recommends this week" replaces the static briefing |
| **War Room** | CEO > Act button | **Advisory Council** (live session) | War Room moves to Council page as "Run a live session" |
| **Kai's Read** | Every dashboard | **Advisory Council** (trend input) | Kai feeds the council now, not scattered dashboards |

### TASK EXECUTION → Task Board page (superseded)

| Feature | Current | Destination | Why |
|---------|---------|-------------|-----|
| **Task proposals** | War Room | **Task Board** (Proposed column) | Agents propose → CEO approves → this week |
| **Live activity** | CEO > Situation | **Task Board** (right rail) | "Who's working on what" replaces Kanban column |
| **Review queue** | CEO > Situation | **Task Board** (Review column) | Output that needs CEO check |

### SOFTWARE → Software Pipeline page (superseded)

| Feature | Current | Destination | Why |
|---------|---------|-------------|-----|
| **Code deployment** | CEO > Operations | **Software Pipeline** (PR gate) | Dev creates PRs, Quinn QAs, CEO merges |
| **Project health** | CEO > Operations | **Software Pipeline** (portfolio) | One card per project with progress % |

### DEAD — Not migrating

| Feature | Current | Fate | Why |
|---------|---------|------|-----|
| KPI Gauges (ROAS/CAC/Brand Health) | CEO > Overview | ☠️ Deleted | Hardcoded demo data. No live revenue data. Showed "NO LIVE DATA." |
| Key Numbers sparklines | CEO > Overview | ☠️ Deleted | Already removed in YVON 2.0. Duplicate of KPI Gauges. |
| Workload Calendar | CEO > Operations | ☠️ Deleted | Legacy panel. No real cron-based workload to calendarize. |
| Session Sync | CEO > Operations | ☠️ Deleted | Dead feature — no multi-machine session sync needed. |
| Activity Log | CEO > Done | → **Logs page** | Merged into the system-wide audit log (page 32). Not CEO-specific. |
| Source Reports | CEO > Done | → **Trend Radar** | Merged into Isaac's trend analysis. Not CEO-specific. |
| Decisions Live | CEO > Act | ☠️ Deleted | Redundant — Decision Queue IS the decisions feed. |
| CEO Readout | CEO > Context | ☠️ Deleted | Replaced by Advisory Council audio + recommendations. |
| Pulse & Channel | CEO > Context | ☠️ Deleted | Vague health check. Token Usage + System Health cover this. |

## What Remains as "Dashboard/Home" (the morning landing)

The YVON-OS `/dashboard` page becomes the **7-second scan** before the CEO dives into Decision Queue:

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD                                 8:42 AM IST │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ DEEPSEEK │ │ AGENTS   │ │ QUEUE    │ │ SYSTEM   │  │
│  │ $ 17.76  │ │ 13 live  │ │ 7 items  │ │ Healthy  │  │
│  │ balance  │ │ running  │ │ waiting  │ │ all clear│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OVERNIGHT SUMMARY                                │  │
│  │  Kai analyzed 14 competitors · Rio ran 3 ads     │  │
│  │  Dev pushed 2 PRs · Quinn QA'd 1 · Felix updated │  │
│  │  → 7 items need your decision [Go to Queue →]    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ TOKEN SPEND  │ │ TOP PRIORITY │ │ RECENT LOGS  │   │
│  │ Today: $0.03 │ │ Marcus: rate │ │ 08:41 Kai    │   │
│  │ Month: $1.28 │ │ limit fix    │ │ finished     │   │
│  │ [sparkline]  │ │ [Go →]       │ │ report       │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Data sources (all real):**
- DeepSeek balance: `GET /api/deepseek-balance` (already built)
- Agents live: count from agent registry
- Queue count: `GET /api/decision-queue?count=only`
- System health: Supabase ping + DeepSeek API health
- Token spend: `GET /api/token-usage?today=true`
- Recent logs: latest from agent session DB

## Summary: 14 features → 5 destinations + 8 deleted

| Keep? | Feature | Goes to |
|:-----:|---------|---------|
| ✅ | Token Usage | Dashboard/Home |
| ✅ | System Health | Dashboard/Home |
| ✅ | Agent Kanban | Agents page |
| ✅ | Project Graph | Brain & Wiki |
| ✅ | Decision Queue | Decision Queue page |
| ✅ | Priorities | Decision Queue (right rail) |
| ✅ | Intelligence Feed | Advisory Council |
| ✅ | Strategic Briefing | Advisory Council |
| ✅ | War Room | Advisory Council |
| ✅ | Task proposals | Task Board |
| ✅ | Code deployment | Software Pipeline |
| ✅ | Activity Log | Logs page |
| ✅ | Source Reports | Trend Radar |
| ❌ | KPI Gauges | Deleted (no data) |
| ❌ | Key Numbers | Deleted (duplicate) |
| ❌ | Workload Calendar | Deleted (dead) |
| ❌ | Session Sync | Deleted (dead) |
| ❌ | Decisions Live | Deleted (redundant) |
| ❌ | CEO Readout | Deleted (replaced) |
| ❌ | Pulse & Channel | Deleted (vague) |
