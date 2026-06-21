# ToonGine v4 — Complete Workflow

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTALL + COMPILE                             │
│                                                                  │
│  npm install toongine                                            │
│  ├─ .toon/config.json   (repo identity, tracked in git)         │
│  ├─ smart .gitignore     (cache ignored, config+agents tracked) │
│  │                                                               │
│  npx toongine compile                                            │
│  ├─ Build unified.db     (4,708 nodes, 18,006 edges, 13 communities)
│  ├─ Install MCP tools    (5 graph tools for Hermes)             │
│  └─ Verify compression   (sample context: ~90 tokens)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTS WORK (Hermes VPS)                       │
│                                                                  │
│  POST /api/council/chat  (streaming SSE)                          │
│  │                                                               │
│  ├─ Session Manager (lib/chat-session.ts)                        │
│  │   ├─ Create session per venture (one at a time)              │
│  │   ├─ Fingerprint context sources (mtime-based)               │
│  │   ├─ Build context ONCE (CONSTITUTION + memory + graph)      │
│  │   └─ Rebuild ONLY when sources change (delta detect)          │
│  │                                                               │
│  ├─ spawnHermesAgent()                                           │
│  │   ├─ Load CONSTITUTION.toon                                   │
│  │   ├─ Inject v4 Graph Context (stratified 3-layer)            │
│  │   ├─ Load agent MEMORY.md                                     │
│  │   └─ hermes chat -q "<prompt>" → full tool access            │
│  │                                                               │
│  └─ state.db records: tokens, cost, agent, cwd                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE (every 5 min, $0)                     │
│                                                                  │
│  scripts/toongine-pipeline.py                                     │
│  ├─ Read state.db → detect cwd → .toon/config.json → repo_id   │
│  └─ POST to Supabase (activity_log, snapshots, provider)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD (3 tabs)                             │
│                                                                  │
│  🕵️ Agent Memory     — 24-agent roster + graph + plugins        │
│  🔥 Token Burn       — 30-day usage + cost per dept             │
│  🧬 Health           — TOON compression + savings trend         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat System — How It Works

### Context Injection: Once, not every message

```
User: "Analyze Novizio's performance" (message 1)
  ├─ Fingerprint check: sources unchanged → NO rebuild
  ├─ Context: 90 tokens (cached from session start)
  └─ Agent responds → cost: ~$0.001

User: "Now review Hourbour" (message 2)  
  ├─ Venture switch → CLOSE novizio session → CREATE hourbour session
  ├─ New fingerprint → BUILD fresh context (90 tok)
  └─ Agent responds → cost: ~$0.001

User: "Update Novizio dashboard" (message 3 — same session)
  ├─ Fingerprint check: sources unchanged → NO rebuild
  ├─ Context: 90 tokens (still cached)
  └─ Agent responds → cost: ~$0.001

/* If agent modified files during message 3... */

User: "Show me the changes" (message 4)
  ├─ Fingerprint check: unified.db mtime changed → DELTA detected
  ├─ Delta: +10 tokens (only changed files)
  └─ Agent responds → cost: ~$0.0001
```

**Savings:** 450 tok → 90 tok (first message) + 0 tok (messages 2-3) + 10 tok (message 4 if changed) = **97.8% saved**

### Venture Isolation

Each venture has its own session — data never mixes:

```
Chat: Novizio
  Session: { workdir: /root/novizio, agent: marcus-ceo }
  Context: Novizio CONSTITUTION + Novizio docs + Novizio graph
  Data → Supabase with repo_id: "stark-labs/novizio"

Chat: Hourbour  
  Session: { workdir: /root/hourbour, agent: marcus-ceo }
  Context: Hourbour CONSTITUTION + Hourbour docs + Hourbour graph
  Data → Supabase with repo_id: "stark-labs/hourbour"
```

### Specialist Delegation

Marcus handles all chat. For specialized work, mention the agent:

```
User: "@dev-lead needs to fix the type error in dashboard"
  ↓
chat-session.ts detects "@dev-lead" → routes to yvon/dev-lead
  ↓
spawnHermesAgent({ agentId: "yvon/dev-lead", task: "fix type error...", workdir: "..." })
```

---

## 3 Types of Agent Communication

| Mode | Endpoint | When to use | Context |
|------|----------|-------------|---------|
| **Streaming Chat** | `POST /api/council/chat` (SSE) | Daily chat with Marcus | Persistent, delta-refreshed |
| **Council Convene** | `POST /api/council/convene` | Major decisions needing 5-agent debate | Fresh per convene (legal+bias audit) |
| **Specialist Spawn** | Via `@agent-id` mention in chat | Specific technical/marketing/finance task | Full context per spawn |

---

## Context Chain (what gets injected)

```
Agent receives:
┌────────────────────────────────────────┐
│ L1: CONSTITUTION        (~30 tok)      │
│    10 immutable YVON laws              │
├────────────────────────────────────────┤
│ L2: GRAPH INTELLIGENCE  (~30 tok)      │
│    4,708 nodes, 18,006 edges           │
│    Top symbols, communities            │
├────────────────────────────────────────┤
│ L3: AGENT MEMORY        (~20 tok)      │
│    Past decisions, preferences         │
├────────────────────────────────────────┤
│ L4: DELTA (if changed)  (~10 tok)      │
│    Only changed files since last read  │
├────────────────────────────────────────┤
│ TOTAL: ~90 tokens                      │
│ vs 100K original = 99.91% compression  │
└────────────────────────────────────────┘
```

---

## Cost Comparison (Opus 4.7, per chat message)

| | Raw context | With ToonGine | Savings |
|---|---|---|---|
| First message | 100,000 tok | ~90 tok | 99.91% |
| Subsequent (no delta) | 100,000 tok | 0 tok | 100% |
| Subsequent (delta) | 100,000 tok | ~10 tok | 99.99% |
| Cost per message | ~$1.50 | ~$0.001 | 99.93% |

---

## Files

| File | Purpose |
|------|---------|
| `lib/chat-session.ts` | Persistent sessions, fingerprint, delta, delegation |
| `lib/hermes-spawn.ts` | One-shot Hermes spawner (used by chat + council) |
| `app/api/council/chat/route.ts` | SSE streaming endpoint |
| `app/api/council/convene/route.ts` | One-shot 5-agent council with legal+bias audit |
| `scripts/toongine-pipeline.py` | Every 5 min: state.db → Supabase |
| `src/dashboard/` | 3-tab dashboard (AgentMemory, TokenBurn, Health) |
| `src/toon/v4/` | Graph engine (12 files) |
