# PROJECT.md — YVON OS Living Knowledge Base

> **Last updated:** 2026-06-04
> **Auto-injected** into every agent's system prompt. Updated when real changes ship.
> ⛔ Do NOT update for cosmetic/War-Room-only changes. Only update when code/structure actually changes.

---

## What Is YVON

YVON is an AI operating system orchestrating **13 agents across 4 departments** managing **2 ventures** (Novizio + Hourbour). Stack: Next.js 15 · TypeScript strict · Tailwind CSS · Supabase · Vercel.

---

## Project Structure

```
YVON2.0/
├── app/
│   ├── api/
│   │   ├── team-chat/          # War Room v4 pipeline (Plan→Execute→Validate→Synthesize)
│   │   │   ├── route.ts         # Thin orchestrator (697 lines) — structural approval gate
│   │   │   ├── plan-stage.ts    # Stage 1: Marcus planning + intent classification
│   │   │   ├── execute-stage.ts # Stage 2: Role-aware specialist execution (ANALYZER/FIXER/VALIDATOR)
│   │   │   ├── validate-stage.ts# Stage 3: Department QA gates (Quinn/Kahneman/Felix)
│   │   │   ├── synthesize-stage.ts # Stage 4: CEO synthesis with extended thinking
│   │   │   ├── brief-builder.ts # Structured specialist briefs with mandatory OS skills
│   │   │   └── mode-resolver.ts # Single source of truth for mode/tool guidance
│   │   ├── route-intent/       # Semantic intent classification (Haiku → Sonnet fallback)
│   │   ├── briefing/           # Morning CEO brief (Resend email)
│   │   └── ...60+ route.ts files
│   ├── screens/
│   │   ├── war-room/           # War Room chat UI with 4-phase PhaseStepper
│   │   ├── ceo-command-dashboard/
│   │   ├── analytics/
│   │   └── ...
│   └── components/
├── lib/
│   ├── agent-tools.ts          # Claude Code-compatible tool palette (8 tools)
│   ├── ai-client.ts            # Unified AI provider client (Anthropic + OpenAI-compat)
│   ├── tool-loop.ts            # Anthropic Messages API tool_use loop with streaming
│   ├── agent-sdk-runner.ts     # Claude Agent SDK wrapper (for YVON Dashboard tasks)
│   ├── validator-rubrics.ts    # Department validator rubrics (Tech/Marketing/Finance)
│   ├── types.ts                # All TypeScript types including WarRoomEvent union
│   └── ...
├── agent-department/
│   ├── CEO/                    # Marcus (CEO) + Diana (COO)
│   ├── Technical/              # Dev Lead + Raj Backend + Mia Frontend + Quinn QA
│   ├── Marketing/              # Kai + Lena + Rio + Nate + Atlas + Pixel
│   ├── Finance/                # Felix
│   └── shared/skills/          # Mandatory OS skills (Karpathy, Memory, Session, Reflection)
├── docs/
│   ├── WORKFLOW.md             # Execution model (ENGAGE+PLAN+PERFORMING+ADJOURNING)
│   ├── ventures/               # Novizio + Hourbour venture docs (CONTEXT, BRAND, DESIGN, FEEDBACK)
│   ├── os/                     # Global state (SESSION.md, ROADMAP.md, CONTEXT.md)
│   └── memory/                 # Feedback rules + design rules
└── PROJECT.md                  # ← THIS FILE
```

---

## War Room v4 Pipeline

```
POST /api/team-chat
  │
  ├─ Phase 1 (approved=false): Plan → emit gate card → close
  │   Model: synthesis (Sonnet-tier). Thinking: extended 2000 tokens.
  │
  └─ Phase 2 (approved=true):  Execute → Validate → Synthesize → persist
      ├─ Stage 2 (Execute): ANALYZER (full context, 40 iter) → FIXER (minimal, 15 iter)
      ├─ Stage 3 (Validate): Automatic QA per department. READ-ONLY validators.
      └─ Stage 4 (Synthesize): Marcus synthesis streamed via SSE
```

**Key architectural rules:**
- Approval gate is STRUCTURAL — Phase 1 and Phase 2 are separate handler functions
- Validators are READ-ONLY — write_file/delete_file stripped from their tool schema
- delete_file is BLOCKED for ALL agents (structural enforcement in agent-tools.ts)
- Mandatory OS skills loaded from filesystem on every agent call — never cached
- Role-aware briefs: ANALYZER (20KB), FIXER (3KB), VALIDATOR (2KB)

---

## Agent Tool Palette

| Tool | Purpose | Available To |
|------|---------|-------------|
| Read | Read file with line numbers | All agents (mode-dependent) |
| Glob | Find files by pattern | All agents |
| Grep | Search file contents | All agents |
| Bash | Read-only shell commands | Tier 1 agents only |
| WebFetch | Fetch URL → plain text | All agents |
| WebSearch | DuckDuckGo search | All agents |
| TodoWrite | In-memory todo list | All agents |
| Github | Read/write venture repo | All agents (write guarded) |

**Structural guards:**
- `delete_file` — BLOCKED for all agents (removed from schema)
- `write_file` — BLOCKED when `readOnly=true` (validators)
- `write_file` — BLOCKED when file not in `allowedWritePaths` (plan enforcement)
- Local FS tools (Read/Glob/Grep/Bash) — BLOCKED for product ventures in GitHub mode

---

## Ventures

### Novizio
- **Type:** Fashion e-commerce
- **Stack:** Next.js/TypeScript (or Shopify storefront)
- **Audience:** Women 28-42, luxury-to-contemporary
- **Docs:** `docs/ventures/novizio/`
- **Key rule:** No discount/urgency language
- **Repo:** GitHub

### Hourbour
- **Type:** Fintech SaaS (shift tracking + debt management)
- **Stack:** Flutter/Dart + Firebase
- **Audience:** Shift workers + financial management
- **Docs:** `docs/ventures/hourbour/`
- **Key rule:** Always segment churn by cohort
- **Repo:** `/Users/novysingh/StudioProjects/hourbour` (local clone)

---

## Agent Registry

| Agent | Department | Model Tier | Role |
|-------|-----------|------------|------|
| 👑 Marcus | CEO | synthesis | Strategy, synthesis, orchestration |
| ⚙️ Diana | CEO | synthesis | Operations, project plans |
| 💻 Dev Lead | Technical | tier1 | Architecture, code review |
| 🔧 Raj | Technical | tier1 | Backend, APIs, Supabase |
| 🎨 Mia | Technical | fast | Frontend, UI, Flutter/Next.js |
| 🧪 Quinn | Technical | fast | QA, debugging, code quality |
| 📊 Kai | Marketing | fast | Analytics, competitor intel |
| ✍️ Lena | Marketing | fast | Brand voice, copywriting |
| 📈 Rio | Marketing | fast | Paid ads, ROAS |
| 🚀 Nate | Marketing | fast | Growth, funnel strategy |
| 🎨 Atlas | Marketing | fast | Art direction, visuals |
| ⚡ Pixel | Marketing | fast | Asset production |
| 💰 Felix | Finance | fast | P&L, CAC, LTV, MRR |
| 🧠 Kahneman | Psychology | fast | Cognitive bias, behavioral audit |

---

## Claude Features Integrated

| Feature | Status | Where |
|---------|--------|-------|
| Messages API | ✅ Active | `ai-client.ts` — callFast, callSynthesis |
| Streaming (SSE) | ✅ Active | `ai-client.ts` — streamSynthesis, streamWithTools |
| Tool Use | ✅ Active | `agent-tools.ts` — 8 tools with Anthropic wire format |
| Agent SDK | ✅ Active | `agent-sdk-runner.ts` — YVON Dashboard tasks |
| Extended Thinking | ✅ Active | `ai-client.ts` — getThinkingConfig() per tier |
| Adaptive Thinking | ✅ Active | Opus 4.8 — `{ type: 'adaptive' }` |
| Prompt Caching | ✅ Active | `tool-loop.ts` — cache_control on system + large results |
| 1M Token Context | ✅ Active | Implicit via Anthropic SDK |
| Vision (Images) | ✅ Active | `streamSynthesis` — base64 image injection |
| Auto-retry | ✅ Active | SDK built-in retry + custom empty-output retry |
| Type Safety | ✅ Active | TypeScript strict — full types for all APIs |
| Dynamic Workflows | 🔶 Ready | `/workflow` slash command integration point |
| Message Batches | 🔶 Ready | Cron jobs (morning brief, Zara sweeps) |
| Computer Use | 🔶 Future | Sofia's domain (social posting) |
| Dreaming | 🔶 Future | Session review during idle periods |

---

## Key Rules — Never Violate

1. ⛔ **NEVER DELETE FILES** — `delete_file` is structurally blocked
2. ⛔ **NEVER WRITE TO UNAPPROVED FILES** — blocked by `allowedWritePaths`
3. ⛔ **VALIDATORS ARE READ-ONLY** — `readOnly: true` strips write tools
4. ⛔ **APPROVAL GATE** — Phase 2 cannot run without user approval
5. ⛔ **MANDATORY OS SKILLS** — loaded from filesystem every call, never cached
6. ⛔ **SINGLE SOURCE OF TRUTH** — `resolveMode()` for tool guidance, `PROJECT.md` for structure

---

## Update Triggers

This file should be updated when:
- ✅ A new venture is added or removed
- ✅ The project structure changes (new directories, moved files)
- ✅ A new agent is added
- ✅ A new Claude feature is integrated
- ✅ Architectural rules change
- ❌ A War Room session runs (no structural changes)
- ❌ A file is edited (routine development)
- ❌ Cosmetic changes
