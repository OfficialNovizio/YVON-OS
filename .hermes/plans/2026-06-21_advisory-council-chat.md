# Advisory Council Chat — Build Plan
> Status: READY · 2026-06-21

## What You Get

### 1. Full Context Panel
Right-side panel (desktop) / Tab-switch (mobile):

```
┌─ Context Injection ──────────────────┐
│ CONSTITUTION 📋 1820 chars  ✔ loaded │
│ Agent Memory  🧠 2140 chars  ✔ fresh │
│ Graph Context 🧬 30 nodes    ✔ stale │
│ TOON Docs     📄 8 files     ✔ OK    │
│                                       │
│ Tokens injected: 92                   │
│ Tokens this session: 1,247            │
│ Cost this session: $0.073             │
│ Model: claude-opus-4-7                │
│ Context rebuilds: 1 (fingerprint)     │
└───────────────────────────────────────┘
```

### 2. Multi-Agent Room
Council handles everything. You @mention specialists:
- @dev-lead → Technical work
- @mia-frontend → UI
- @kai-analyst → Market analysis
- @felix-finance → Financial review
- Default: Marcus (CEO) + council handles

### 3. Council Pre-Processing (every message)
Before agent ever sees your message:
1. COUNCIL EXPANDS — turns "fix dashboard" into full task brief
2. ASSIGN — routes to right agent(s)
3. QUALITY GATE — checks for errors, fallback paths
4. EXECUTE — Hermes runs agent with full .toon context

### 4. Everything Visible
- Streaming SSE response (character by character)
- Tool calls shown inline (read_file, grep, write)
- Token counter ticking in real-time
- Agent switch visible (Marcus → Dev Lead → Back)

### 5. Never Loses Memory
- Pre-load: CONSTITUTION + MEMORY.md + Graph
- Post-sync: Agent writes back to MEMORY.md → pipeline → Supabase
- Context fingerprint: rebuild only when .toon files changed

### 6. Responsive Layout
- Desktop: Chat (left 70%) + Context Panel (right 30%)
- Mobile: Chat (full width) + Context Panel (tab toggle)

### 7. Council Rules
- Council = Marcus CEO + Diana COO + Felix CFO + Kai CMO + Kahneman
- DEFAULT: Council handles all messages
- @mention → that specialist joins council
- Decision flow: Debate → Marcus synthesis → Kahneman bias check → Board gate
---

## Files to Build

### Backend (2 files)
```
app/api/council/chat/route.ts      ✅ ALREADY EXISTS (SSE streaming)
lib/chat-session.ts                 ✅ ALREADY EXISTS (session + fingerpr. + delta)
```

Both already built and TypeScript-clean. Need one extension:
```
lib/council-preflight.ts             🆕 Council pre-processing pipeline
  └─ expandTask(message) → rich brief
     assignAgent(brief) → agent list
     qualityGate(plan) → errors/warnings
     buildContext(venture, agents) → full context object
```

### Frontend (3 components)
```
app/advisory-council/
  ├── page.tsx                       ✏️ REWRITE — add live chat + context panel
  ├── _ChatView.tsx                  🆕 Streaming chat thread
  ├── _ContextPanel.tsx              🆕 Right-side injection panel
  └── _AgentRoom.tsx                 🆕 Agent roster with status dots
```

---

## Data Flow (per message)

```
POST /api/council/chat  { venture: "novizio", message: "check performance" }
  │
  ▼
SERVER: lib/council-preflight.ts
  ├─ expandTask("check performance")
  │   → "Analyze Novizio's DTC fashion metrics across social, ads, and conversion..."
  │
  ├─ assignAgent(brief)
  │   → [marcus-ceo, kai-analyst, rio-ads]
  │
  ├─ qualityGate(plan)
  │   → ✓ No constitution violations
  │   → ✓ Agents have required skills
  │   → ⚠️ Ad data may be stale (last sync: 2 days)
  │
  └─ returns { expandedTask, agents, warnings }
  │
  ▼
SERVER: lib/chat-session.ts
  ├─ getOrCreateSession("novizio")
  ├─ fingerprintSources("/root/novizio")
  │   → fingerprint: abc123 → unchanged since last → use cached context
  │
  ├─ spawnHermesAgent({
  │     agentId: "yvon/marcus-ceo",
  │     task: expandedTask + context + history,
  │     workdir: "/root/novizio",
  │   })
  │
  └─ Yield SSE events:
      event: meta     → { expandedTask, agents, warnings, contextTokens: 92, fingerprintMatch: true }
      event: chunk    → "Novizio's performance shows steady growth..."
      event: tool     → { agent: "marcus-ceo", tool: "read_file", input: ".toon/docs/metrics.toon" }
      event: chunk    → "\n\nRecommendation: Focus on Meta ads..."
      event: done     → { totalTokens: 1247, cost: 0.073, agentSwitch: false }
  │
  ▼
CLIENT: ChatView.tsx
  ├─ Renders streaming SSE text
  ├─ Shows tool calls inline (collapsible)
  ├─ Updates token counter live
  ├─ ContextPanel refreshes after "done" event
  └─ AgentRoom shows active agent (green dot)
```

---

## Council Workflow (step by step)

### Default: Council Handles Everything
```
User → Council (Marcus + Diana + Felix + Kai + Kahneman)
  │
  ├─ Marcus expands task → detailed brief
  ├─ Diana checks operational feasibility
  ├─ Felix estimates cost/tokens
  ├─ Kai provides market context
  └─ Kahneman audits for bias
       │
       ▼
  Council response → User approves/challenges
       │
       ▼
  If task needs specialist: @dev-lead join
```

### Explicit Delegation
```
User → "@dev-lead fix the type error in AgentMemory.tsx"
  │
  ├─ Council pre-flights: what files? errors? fallback?
  ├─ Dev Lead spawns → reads file → patches → tsc check
  ├─ Quinn QA spawns → runs build → verifies
  └─ Diana marks task complete → updates MEMORY.md
       │
       ▼
  Pipeline syncs → dashboard updates (5 min)
```

### Decision Gates (blocking checkpoints)
| Gate | Who checks | Pass condition |
|------|-----------|----------------|
| Constitution gate | Council | No law violations |
| Bias audit | Kahneman | ≤ 2 biases detected |
| Quality gate | Quinn | tsc noEmit + build passes |
| Cost gate | Felix | Under budget threshold |

---

## Technical Details

### SSE Event Format
```
event: meta
data: {"expandedTask":"...", "agents":["marcus-ceo"], "contextTokens":92, "fingerprintMatch":true, "warnings":[]}

event: chunk
data: {"text": "Novizio's performance analysis shows..."}

event: tool
data: {"agent":"marcus-ceo", "tool":"read_file", "input":".toon/docs/metrics.toon", "result":"{\"followers\": 5432}"}

event: agent_switch
data: {"from":"marcus-ceo", "to":"kai-analyst", "reason":"specialist delegation"}

event: done
data: {"totalTokens":1247, "cost":0.073, "sessionTokens":5300, "sessionCost":0.312}
```

### Context Panel Data Model
```typescript
interface ContextPanel {
  constitution:   { loaded: boolean; size: number }
  agentMemory:    { loaded: boolean; size: number; fresh: boolean }
  graphContext:   { loaded: boolean; nodes: number; stale: boolean }
  toonDocs:       { count: number; loaded: boolean }
  injected:       { tokens: number; model: string; cost: number }
  session:        { totalTokens: number; totalCost: number; messages: number }
  fingerprint:    { hash: string; rebuilds: number; lastBuilt: number }
}
```

---

## Build Order

| # | File | Action | Effort |
|---|------|--------|--------|
| 1 | `lib/council-preflight.ts` | 🆕 Create | 30 min |
| 2 | `app/advisory-council/_ContextPanel.tsx` | 🆕 Create | 45 min |
| 3 | `app/advisory-council/_ChatView.tsx` | 🆕 Create | 60 min |
| 4 | `app/advisory-council/_AgentRoom.tsx` | 🆕 Create | 30 min |
| 5 | `app/advisory-council/page.tsx` | ✏️ Rewrite | 30 min |
| 6 | TypeScript check + test | Verify | 15 min |
| 7 | Responsive mobile layout | CSS | 30 min |

**Total: ~4 hours**

---

## Responsive Layout

**Desktop (>768px):**
```
┌────────────────────┬──────────────┐
│                    │  COUNCIL     │
│                    │  Marcus ●    │
│   CHAT THREAD      │  Diana  ◌    │
│   (streaming)      │  Felix  ◌    │
│                    │  Kai    ◌    │
│   ┌──────────────┐ │  Kahneman ◌ │
│   │ Type message │ │              │
│   └──────────────┘ │  CONTEXT     │
│                    │  📋 1820 ch  │
│                    │  🧠 2140 ch  │
│                    │  🧬 30 nodes │
│                    │  $0.073      │
└────────────────────┴──────────────┘
```

**Mobile (<768px):**
```
┌──────────────────┐
│ [Chat] [Agents]  │ ← Tab bar
│ [Context]        │
│                  │
│   CHAT THREAD    │
│   (full width)   │
│                  │
│  ┌──────────────┐│
│  │Type message  ││
│  └──────────────┘│
└──────────────────┘
```
