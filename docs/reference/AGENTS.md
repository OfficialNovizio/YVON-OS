# AGENTS.md — Full Agent Registry + Workflow
> Complete reference: who manages agents, how they get tasks, what each does, and the 24-hour cycle.

---

## PART 1: WHO MANAGES THE AGENTS

**Marcus (CEO agent) manages all agents.** He is the orchestrator. No agent calls another agent directly. Every task routes:

```
You / Autonomous trigger → Marcus → assigns agent(s) → agent executes → reports back → you see result
```

Marcus's responsibilities:
- Receive all incoming tasks (from you or from schedule)
- Analyze intent → determine team size (solo/pair/squad) → pick agent(s) from routing table
- Define binary done condition before work starts
- Synthesize multi-agent outputs into one result
- Never implements code himself — routes to the right specialist

See: `agent-department/CEO/marcus/AGENT.md` for full Marcus spec.

---

## PART 2: HOW AGENTS SEE THEIR TASKS

Each agent reads **two files** to know what to do:

| File | What it contains | Where |
|------|-----------------|-------|
| **SESSION.md** | Current task, last 3 sessions, open items | `agent-department/{dept}/{agent}/SESSION.md` |
| **requests/pending/** | Proposals waiting for approval | `requests/pending/{proposal}.json` |

**When an agent starts work (scheduled or triggered):**
1. Read its own `SESSION.md` → "what's my current task?"
2. Read `requests/pending/` → "are there approved proposals for me?"
3. Read `memory/feedback.md` → "what rules must I follow?"
4. Execute → log activity → update SESSION.md

**Task queue flow:**

```
requests/pending/ → You review → Approve? → Move to requests/approved/
                                       ↓
                                 Reject? → Move to requests/rejected/ + log
```

---

## PART 3: DETAILED AGENT BRIEFS BY DASHBOARD

### ANALYTICS DASHBOARD (`app/screens/analytics/`)

| Tab | File | Agent(s) | What it shows |
|-----|------|----------|--------------|
| **Overview** | `page.tsx` | Kai + Mia | Signal strip, KPI strip (ROAS, CAC, Brand Health), social perf, e-commerce health, content correlation, CAC per channel, revenue charts, intelligence synthesis |
| **Portfolio** | `portfolio/page.tsx` | Kai + Mia | Brand comparison (Novizio vs Hourbour), composite health, risk index, growth vs engagement radar, performance stack, allocation decisions, channel contribution, rebalance plan, risk watchlist |
| **Social Media** | `social-media/page.tsx` | Kai + Mia | Kai situation report, platform health matrix, competitor pulse, content intelligence feed, format × platform grid, audience momentum, revenue bridge, Kai's weekly prescription |
| **Content** | `content/page.tsx` | Kai + Lena + Mia | Content health summary, AI recommendations, top posts, platform priority, format conversion, content operations calendar |
| **Reports** | `reports/page.tsx` | Kai + Mia | Intelligence reports with situation/diagnosis/action/prescription, report history |

**Kai's role:** Pulls data, detects anomalies, generates "Kai's Read" cards. If content action needed → briefs Lena.
**Mia's role:** Renders data into glassmorphic UI cards.

### MARKETING DASHBOARD (`app/screens/marketing/`)

| Tab | File | Agent(s) | What it shows |
|-----|------|----------|--------------|
| **Growth Sprint** | `_growth-sprint.tsx` | Nate + Rio | Growth experiments, funnel performance, A/B tests |
| **Community** | `_community.tsx` | Lena + Atlas | Brand voice, content calendar, community engagement |
| **Team Chat** | `_team-chat.tsx` | Marcus + All | War Room cross-agent discussion |

**Nate:** Growth experiments, funnel, referral programs, LTV.
**Rio:** Paid media, ROAS, budget, audience — requires Kahneman validation.
**Lena:** Copy, captions, brand voice, email, content strategy.
**Atlas:** Visual direction, mood boards, creative pipeline.

### COMPETITOR DASHBOARD (`app/screens/competitor/`)

| Tab | File | Agent(s) | What it shows |
|-----|------|----------|--------------|
| **Overview** | `page.tsx` | Kai | Market landscape, rival brand tracking, share of voice |
| **Alerts** | `alerts/page.tsx` | Kai | Competitor movement alerts |
| **Content Gaps** | `content-gaps/page.tsx` | Kai + Lena | Topics competitors cover that we don't |
| **Content Intel** | `content-intel/page.tsx` | Kai | Rival content performance |
| **Keywords** | `keywords/page.tsx` | Kai | SEO keyword gaps |

Kai absorbed Zara (Competitor Intel) on 2026-04-01.

### ADDITIONAL DASHBOARDS

| Dashboard | Agent(s) | Purpose |
|-----------|----------|---------|
| **CEO Command** | Marcus + All | Tabbed overview: Situation, Act, Done, Context, System |
| **War Room** | Marcus + 2 specialists | Real-time decision making (cap: 2 specialists) |
| **Creative Studio** | Atlas + Pixel | 6-step pipeline: Brief → Mood → Script → Captions → Prompts → Assets |
| **Settings** | Dev | Configuration, API keys, venture switching |

---

## PART 4: 24-HOUR CYCLE

Every 24 hours, scheduled agents run autonomously:

```
06:00 — Kai: Pull analytics data, detect anomalies, write brief
        → Writes to requests/pending/ for your review
        → Logs activity

06:30 — Marcus: Read Kai's brief, synthesize CEO morning brief
        → Writes CEO brief to requests/pending/

07:00 — Rio: Analyse ad performance from Kai's data
        → Recommends budget changes → requests/pending/
        → Requires Kahneman validation first

07:30 — Quinn: Spot-check one random output from previous day
        → Scores 🟢/🟡/🔴

08:00 — YOU review the pending queue → approve/reject proposals

--- Day passes, agents execute approved items ---

Next day 06:00 — Cycle repeats
```

**Agents that run on-demand (not scheduled):**
- Mia: UI/design (triggered by approved proposals)
- Dev/Raj: Technical implementation (triggered by approved proposals)
- Lena: Content/copy (triggered by Kai's brief)
- Atlas/Pixel: Creative production (triggered by Lena's brief)
- Felix: Financial reporting (weekly)
- Diana: Operations/process (triggered by milestones)

---

## PART 5: ACTIVITY LOGGING

Every agent action is logged:

```
POST /api/agent-log
{
  "agentId": "kai-analyst",
  "task": "Daily analytics pull",
  "outcome": "completed",
  "notes": "No anomalies detected. Brand health +2pts WoW."
}
```

Logs stored in Supabase, viewable from dashboard.

---

## PART 6: FULL AGENT REGISTRY

### Layer 1 — COMMAND (Direction + Accountability)

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| 👑 Marcus | `marcus-ceo` | claude-sonnet-4-6 | `#F59E0B` | Strategy, synthesis, CEO brief, OKRs, cross-venture decisions |
| ⚙️ Diana | `diana-coo` | claude-sonnet-4-6 | `#94A3B8` | Operations, workflow, process, project planning, milestones, sprint |

### Layer 2 — BUILD (Everything That Ships)

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| 💻 Dev | `dev-lead` | claude-opus-4-6 | `#06B6D4` | Architecture, Next.js, TypeScript, tech decisions, build errors |
| 🔧 Raj | `raj-backend` | claude-opus-4-6 | `#F97316` | Supabase, database, API routes, backend, data models |
| 🎨 Mia | `mia-frontend` | claude-sonnet-4-6 | `#D946EF` | React, UI, Tailwind, design system, wireframes, UX, layout |
| 🧪 Quinn | `quinn-qa` | claude-sonnet-4-6 | `#10B981` | Testing, bugs, QA, lint, edge cases, code review, Pulse |

### Layer 3 — GROW (Revenue + Insight)

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| 📊 Kai | `kai-analyst` | claude-sonnet-4-6 | `#3B82F6` | Analytics, GA4, KPIs, trends, competitor intel, market gaps, Health Score |
| ✍️ Lena | `lena-brand` | claude-sonnet-4-6 | `#EC4899` | Copy, captions, brand voice, email, content writing |
| 📈 Rio | `rio-ads` | claude-sonnet-4-6 | `#F97316` | Paid media, Meta, TikTok, ROAS, CPM, funnel, audience |
| 🚀 Nate | `nate-growth` | claude-sonnet-4-6 | `#8B5CF6` | Growth, funnel, experiment, A/B, channel, referral, LTV |
| 🎨 Atlas | `atlas-art-director` | claude-sonnet-4-6 | `#2DD4BF` | Visual system, mood boards, art direction, creative pipeline |
| ⚡ Pixel | `pixel-production` | claude-sonnet-4-6 | `#FBBF24` | Image batch, asset delivery, prompt optimisation, upscaling |

### Layer 4 — FINANCE

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| 💰 Felix | `felix-finance` | claude-sonnet-4-6 | `#34D399` | Budget, P&L, ROI, unit economics, runway, MRR, CAC, LTV |

### Layer 0 — PSYCHOLOGY (Cross-Department)

| Agent | ID | Model | Color | Scope |
|-------|-----|-------|-------|-------|
| 🧠 Kahneman | `daniel-kahneman` | claude-haiku-3-5 | `#A855F7` | Cognitive bias, framing, System 1 filter, psychological audit, decision review, debiasing |

> Kahneman is a **validator**, not a content producer. He reviews outputs from Lena, Rio, Kai, Nate, Felix, Marcus.

---

## APPENDIX: KNOWN RULE CONFLICTS

| Conflict | Resolution | Decided by |
|----------|-----------|------------|
| karpathy.md (no abstractions) vs nextjs.md (service layers) | Follow karpathy UNLESS task is architecture-level | Stark |
| karpathy.md (minimum code) vs agents/03-prompting.md (structured output) | Structured output only for inter-agent comms, not general code | Stark |

---

## PART 7: WHERE THIS FLOW IS DOCUMENTED

| Document | What it covers |
|----------|---------------|
| `CLAUDE.md` — Task Protocol | Tuckman execution model (Forming→Adjourning), safety rules, routing table |
| `reference/AGENTS.md` | Full agent registry + this workflow document |
| `memory/feedback.md` | Design rules, never-again errors, routing mandates |
| `agent-department/{agent}/AGENT.md` | Each agent's role, rules, skills, success criteria |
| `agent-department/{agent}/SESSION.md` | Each agent's current task, last 3 sessions |
| `reference/SELF-IMPROVEMENT.md` | Auto-reflection loop, error prevention |
| `requests/README.md` | Pending proposal queue workflow |
