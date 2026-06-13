# YVON Agent Engine — Core Architecture & Build Plan (v1)

> The core engine. Runs many agents and many sessions in parallel, with graph memory,
> the Hermes learning loop + MCP, verification, and self-improvement. Triple-pass reviewed
> (**[crit]** = changed by the critique pass). Supersedes WAR_ROOM_FIX_PLAN; that plan's
> workstreams are absorbed as engine components below.

## The hard architectural truth (read first)
Hermes is a persistent **Python** service. Vercel serverless **cannot** host it, run its MCP server, or hold long-running multi-session state (60s functions, no persistence). To get the Hermes engine + MCP + reliable parallel sessions, the topology becomes:

```
┌────────────┐    SSE/HTTP    ┌────────────────────────┐   MCP    ┌──────────────────┐
│ Next.js UI │ ◄────────────► │  Orchestrator Worker   │ ◄──────► │ Hermes sidecar   │
│ (Vercel)   │   enqueue/     │  (persistent Node svc) │          │ (Python: engine, │
│  War Room  │   subscribe    │  sessions, agents,     │          │  MCP, learning   │
└────────────┘                │  verification, caches  │          │  loop, memory)   │
                              └──────────┬─────────────┘          └──────────────────┘
                                         │
                        ┌────────────────┼─────────────────┐
                        ▼                ▼                 ▼
                   Supabase DB     Graph memory       LLM providers
                  (sessions,      (graphify graph.json (DeepSeek/Claude)
                   plans, memory)  + code-review graph)
```

**Hosting — LOCKED: dual local + container host.** One **Docker Compose** stack (`hermes` + `orchestrator`) that runs **identically** in two modes:
- **Local (dev/test):** `docker compose up` on your Mac; Next.js UI (local or Vercel) connects to `localhost:PORT` (or a tunnel when UI is on Vercel). The ventures already live on your Mac, so local mode tests against real repos.
- **Production (container host):** same compose deployed to Railway / Fly.io / Render; Vercel UI points at the prod URL.
- One `.env`-driven config switches `ORCHESTRATOR_URL` between local and prod — no code differences, true dev/prod parity.

**Non-negotiable safety net [crit]:** every new layer is **behind a flag and degrades gracefully**. If the Hermes sidecar or worker is down, the War Room falls back to today's in-process TS pipeline. We never rip out the working path before the new one is proven side-by-side.

---

## PART A — Session & Concurrency Engine  ⟵ build FIRST [crit]
*The thing you said matters most: many sessions in parallel without breaking each other.*

- **Session object.** Every War Room run = an isolated `Session { id, ventureSlug, repoMode, localRepoPath, memoryNamespace, cache, eventBus, createdAt }`. Nothing shared between sessions except read-only global config.
- **Per-session caches.** The tree/content caches (Part E) live **inside the Session**, never module-global — keyed by `(sessionId, localRepoPath, path)`, with write-invalidation + TTL. Eliminates cross-session leakage.
- **Concurrency model.** Orchestrator runs N sessions concurrently (async); a bounded worker pool + queue caps simultaneous LLM/tool load. Per-session write locks on the venture repo (so two sessions editing the same repo serialize writes, not reads).
- **Streaming.** UI subscribes to a session's event stream (SSE from the worker, or Supabase Realtime). Survives refresh (resumes from DB — already built).
- **Verification:** load test — 5+ concurrent sessions across 2 ventures; assert zero cross-talk in caches, memory, events, writes.

## PART B — Hermes Sidecar (engine + MCP + learning loop)
- **Stand up Hermes** as a container from the repo (it's MIT, Python). Configure it headless (no Telegram/Discord) exposing only its **MCP server** (`mcp_serve.py` / `hermes_tools_mcp_server.py`).
- **MCP client in the orchestrator.** Add an MCP client so all 13 agents can call Hermes tools (memory, skill, subagent, search) during their work.
- **Learning loop, connected to every agent.** Use Hermes `agent/memory_manager.py` + memory plugins as the experience store. After each **verified** task (Part D), the loop captures what worked/failed → memory + skills → recalled next time. This is the direct fix for "agents make the same mistakes over and over."
- **Session bridge [crit].** Map each YVON Session ↔ a Hermes session (Hermes already has session mgmt + concurrent-fork tests) so memory/learning are isolated per session and per venture.
- **Fallback:** MCP unavailable → agents run with local memory only (degrade, don't break).

## PART C — Memory Fabric (graph + learned + skills, unified)
*Three memory types, one recall interface every agent uses.*
1. **Graph memory (NEW agent tool).** Server-side reader over `.toon/graphs/graph.json` (+ code-review graph) exposed as a `GraphQuery` tool: "what depends on X", "callers of Y", "impact radius of editing Z". Agents query the graph **before** editing → fewer half-applied refactors (the 7-regression bug). *(Note: the `graphify` CLI paths in package.json are Windows-only; runtime querying reads `graph.json` directly in Node — no CLI dependency [crit].)*
2. **Learned memory (Hermes).** Experience/skills from the learning loop (Part B).
3. **Skills.** Static OS skills + pulled Hermes packs + learned skills. **Fix the dead recall** (`buildSpecialistBrief`/`searchSkills` never called) and **index the Hermes packs per agent** so they actually load.
- **Unified `recall(agent, task, venture)`** → returns {graph facts, learned memory, matched skills}, size-capped + cached per session [crit]. Injected into every brief (analyzer/fixer/validator — closing the current gap where fixers/Quinn get almost nothing).

## PART D — Correctness & Verification Engine
- **Build gate** per stack (Flutter `flutter analyze`, TS `tsc`, etc.): baseline-diff catches regressions, feeds exact `file:line` back to the right agent, **cap 3 rounds**, blocks false "fixed." (Already proven the need: 7 agent-introduced errors.)
- **Graph-aware editing:** before a fix, agent queries impact radius (Part C1) → updates all dependents → re-verify.
- **Fail-closed QA** (already shipped) + the build gate = truthful "VERIFIED / N ERRORS REMAIN."
- **Spaced-path read/bash reliability** (already partly shipped; finish bash sandbox).

## PART E — Efficiency Engine
- **Dedup tree exploration:** map repo once per session (Part A cache), serve Glob/Grep from it, give agents the complete subtree.
- **Dedup file reads:** cache contents, forward analyzer-read files into downstream briefs so fixers/QA never re-read.
- **Prompt caching** (already hardened: single trailing breakpoint).

## PART F — Agentic Flow Redesign
*Per session, using the pulled `subagent-driven-development` skill:*
```
PLAN (Marcus) → DELEGATE (subagents per task, parallel where independent)
   → EXECUTE (specialist + recall + graph) → VERIFY (build gate, ≤3 rounds)
   → LEARN (Hermes loop captures verified outcome) → SYNTHESIZE (Marcus, truthful)
```
- **Multi-agent parallel within a session** (independent tasks) + **multi-session parallel across** (Part A).
- Continuation/resume from history (fix the broken autoApprove path; context + cards already restore).

## PART G — Reasoning
- Always-on **thinking toggle** + targeted retry-without-thinking fallback. Honest trade-off: depth vs latency.

## PART H — Rollout, Ops, Fallback

### LOCKED: Foundation first, PAUSE before Hermes.
Build and prove the foundation natively, then stop and review before standing up the Python sidecar/MCP/learning-loop.

**FOUNDATION (now — Parts A, E, C-graph, D):**
- **A — Session & concurrency engine**, in sub-steps:
  - **A1** Introduce the `Session` abstraction + per-session caches/isolation **inside the current Next.js pipeline** (behind a flag). Multi-session-safe immediately, no new infra. ⟵ first concrete step
  - **A2** Extract the orchestrator into a standalone Node service runnable **locally + via Docker Compose** (dual). UI connects over SSE.
  - **A3** Container-host deploy config (Dockerfile + compose + env) — dev/prod parity.
- **E — Efficiency:** session-scoped tree + content caches (built on A1).
- **C-graph:** `GraphQuery` tool over `graph.json` + wire into briefs.
- **C-skills/recall + D — Verification:** fix dead skill-recall, index Hermes packs, build gate.

**⏸ PAUSE / REVIEW GATE** — confirm foundation is solid (load-tested, no cross-session leakage, build gate working) before:

**ENGINE+ (deferred until after pause — Part B, F-learn, G, C-learned):**
- B — Hermes sidecar + MCP + learning loop · F — full agentic flow · G — thinking · C-learned + cross-session recall.

### Ops
- **Health checks** for worker + Hermes; **graceful degrade** to in-process TS pipeline if either is down.
- **Monitoring:** per-session traces, token/latency, error rates, learning-loop hit rate.
- **Each phase:** `tsc` green + concurrent load test + one live hourbour run.

## Already shipped (this session, local)
Synthesis verification · cache_control fix · fail-closed QA · spaced-path regex · agent-work DB persistence (cards restore) · Hermes skill packs pulled + weekly sync + tracking docs. These become components D/E/C of the engine.

## Triple-pass critique → fixes folded in
- Build sessions/concurrency FIRST (it's the core requirement) and load-test it before anything rides on it.
- Everything behind flags + graceful fallback to the current pipeline — never break the working path.
- Per-session caches (not module-global) to guarantee no cross-session leakage.
- Honest hosting reality (Python sidecar + worker; Vercel can't host them) surfaced as the one decision to confirm.
- Graph querying reads `graph.json` in Node (no Windows CLI dependency).
- Learning capture only after verified-clean (don't learn bad fixes).
- Pulled Hermes files stay inert until recall wiring (C) ships — stated plainly.

## Decisions LOCKED
- **Hosting:** dual local + container host (one Docker Compose, env-switched).
- **Sequencing:** foundation first (A, E, C-graph, D), then native learning loop + Hermes sidecar scaffold.

## DELIVERED (all local, tsc-clean, test-verified)
- **A1** per-session isolation (`lib/session.ts`, AsyncLocalStorage) — flag `WAR_ROOM_ENGINE_V2` in Settings → Agents.
- **A2/A3** standalone orchestrator (`orchestrator/`) + Docker dual (`docker-compose.yml`).
- **E** per-session file + Glob/Grep dedup caches.
- **C-graph** `GraphQuery` tool (`lib/graph-memory.ts`) — venture-repo impact/reference query.
- **C-skills + B-recall** memory/skills + Hermes packs wired into every brief (`buildRecallBlock`); Quinn gets the snapshot.
- **D** build gate (`lib/build-gate.ts` + `build-gate-stage.ts`) — **self-activating in local mode**, robust flutter resolution, drives errors→0, truthful verdict overrides "fixed" claims, fix cards persisted.
- **F** native learning loop (`lib/learning-loop.ts`) — captures verified fixes + recurring failures → recall.
- **Hermes**: skill packs pulled + weekly sync; aux-tools sidecar scaffold (`scripts/hermes-setup.mjs`, `docs/hermes/SIDECAR.md`).

Verification suites: `npm run test:a1`, `scripts/test-cgraph.ts`, `scripts/test-cskills.ts`, `scripts/test-buildgate.ts` — all green.

## Remaining
- **Live re-run** (user-triggered): restart dev server → run a hourbour fix task → confirm `build_gate` + `GraphQuery` + truthful verdict + `learning` events.
- **Hermes sidecar wiring** (optional): run `hermes:setup` on a Docker machine, then wire chosen aux tools.
- **Deferred Part G** (thinking toggle) — not yet built.
