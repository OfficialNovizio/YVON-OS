# lib-session

## Overview

Directory-based community: lib

- **Size**: 550 nodes
- **Cohesion**: 0.1672
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| getStoredWorkspace | Function | /root/yvon/lib/WorkspaceContext.tsx | 9-18 |
| persistWorkspace | Function | /root/yvon/lib/WorkspaceContext.tsx | 20-22 |
| syncVentureCookie | Function | /root/yvon/lib/WorkspaceContext.tsx | 25-31 |
| WorkspaceProvider | Function | /root/yvon/lib/WorkspaceContext.tsx | 40-76 |
| handleSetWorkspace | Function | /root/yvon/lib/WorkspaceContext.tsx | 53-57 |
| useWorkspace | Function | /root/yvon/lib/WorkspaceContext.tsx | 78-82 |
| logActivity | Function | /root/yvon/lib/activity.ts | 5-13 |
| client | Function | /root/yvon/lib/agent-memory.ts | 26-31 |
| getAgentMemory | Function | /root/yvon/lib/agent-memory.ts | 38-67 |
| line | Function | /root/yvon/lib/agent-memory.ts | 56-63 |
| getAgentMemoryRaw | Function | /root/yvon/lib/agent-memory.ts | 70-83 |
| listAgentMemoryStatus | Function | /root/yvon/lib/agent-memory.ts | 86-97 |
| r | Function | /root/yvon/lib/agent-memory.ts | 350-361 |
| setAgentMemory | Function | /root/yvon/lib/agent-memory.ts | 100-109 |
| getVentureAgentMemories | Function | /root/yvon/lib/agent-memory.ts | 141-232 |
| t | Function | /root/yvon/lib/agent-memory.ts | 201-201 |
| add | Function | /root/yvon/lib/agent-memory.ts | 210-216 |
| formatVentureMemoriesBlock | Function | /root/yvon/lib/agent-memory.ts | 235-246 |
| m | Function | /root/yvon/lib/agent-memory.ts | 238-243 |
| saveVentureAgentMemory | Function | /root/yvon/lib/agent-memory.ts | 249-295 |
| saveSessionMemory | Function | /root/yvon/lib/agent-memory.ts | 313-335 |
| getSessionHistory | Function | /root/yvon/lib/agent-memory.ts | 338-362 |
| getAgentPersonality | Function | /root/yvon/lib/agent-personalities.ts | 130-134 |
| getPersonalityExtension | Function | /root/yvon/lib/agent-personalities.ts | 140-144 |
| c | Function | /root/yvon/lib/agent-sdk-runner.ts | 169-169 |
| isAgentSdkEnabled | Function | /root/yvon/lib/agent-sdk-runner.ts | 206-209 |
| safeResolve | Function | /root/yvon/lib/agent-tools.ts | 43-52 |
| ok | Function | /root/yvon/lib/agent-tools.ts | 235-237 |
| err | Function | /root/yvon/lib/agent-tools.ts | 238-240 |
| normalizeSep | Function | /root/yvon/lib/agent-tools.ts | 265-267 |
| isBashAllowedSingle | Function | /root/yvon/lib/agent-tools.ts | 269-302 |
| prefix | Function | /root/yvon/lib/agent-tools.ts | 273-273 |
| p | Function | /root/yvon/lib/agent-tools.ts | 692-692 |
| raw | Function | /root/yvon/lib/agent-tools.ts | 294-298 |
| isBashAllowed | Function | /root/yvon/lib/agent-tools.ts | 304-319 |
| s | Function | /root/yvon/lib/agent-tools.ts | 310-310 |
| stage | Function | /root/yvon/lib/agent-tools.ts | 313-316 |
| execRead | Function | /root/yvon/lib/agent-tools.ts | 327-352 |
| execGlob | Function | /root/yvon/lib/agent-tools.ts | 354-381 |
| exclude | Function | /root/yvon/lib/agent-tools.ts | 367-367 |
| execGraphQuery | Function | /root/yvon/lib/agent-tools.ts | 384-398 |
| execGrep | Function | /root/yvon/lib/agent-tools.ts | 401-487 |
| walk | Function | /root/yvon/lib/agent-tools.ts | 437-452 |
| execBash | Function | /root/yvon/lib/agent-tools.ts | 489-522 |
| execWebFetch | Function | /root/yvon/lib/agent-tools.ts | 524-548 |
| execWebSearch | Function | /root/yvon/lib/agent-tools.ts | 550-644 |
| r | Function | /root/yvon/lib/agent-tools.ts | 708-708 |
| t | Function | /root/yvon/lib/agent-tools.ts | 812-812 |
| execGithub | Function | /root/yvon/lib/agent-tools.ts | 648-803 |
| f | Function | /root/yvon/lib/agent-tools.ts | 673-673 |

*... and 500 more members.*

## Execution Flows

- **main** (criticality: 0.88, depth: 4)
- **main** (criticality: 0.88, depth: 4)
- **POST** (criticality: 0.84, depth: 8)
- **GET** (criticality: 0.81, depth: 4)
- **GET** (criticality: 0.81, depth: 5)
- **POST** (criticality: 0.80, depth: 6)
- **POST** (criticality: 0.80, depth: 6)
- **POST** (criticality: 0.78, depth: 6)
- **POST** (criticality: 0.78, depth: 6)
- **POST** (criticality: 0.77, depth: 6)
- *... and 169 more flows.*

## Dependencies

### Outgoing

- `map` (141 edge(s))
- `push` (108 edge(s))
- `join` (94 edge(s))
- `from` (88 edge(s))
- `slice` (76 edge(s))
- `filter` (74 edge(s))
- `toISOString` (70 edge(s))
- `includes` (69 edge(s))
- `eq` (58 edge(s))
- `split` (52 edge(s))
- `trim` (50 edge(s))
- `select` (49 edge(s))
- `replace` (49 edge(s))
- `Number` (49 edge(s))
- `now` (36 edge(s))

### Incoming

- `/root/yvon/lib/agent-tools.ts` (36 edge(s))
- `/root/yvon/lib/apify.ts` (30 edge(s))
- `/root/yvon/lib/ai-client.ts` (27 edge(s))
- `/root/yvon/lib/toon.ts` (23 edge(s))
- `/root/yvon/lib/db-phase1.ts` (22 edge(s))
- `/root/yvon/lib/github.ts` (22 edge(s))
- `/root/yvon/scripts/test-a1-session.ts::main` (22 edge(s))
- `/root/yvon/lib/agent-memory.ts` (17 edge(s))
- `/root/yvon/app/api/content-intelligence/route.ts::POST` (14 edge(s))
- `/root/yvon/lib/sip-manager.ts` (14 edge(s))
- `/root/yvon/lib/hermes-spawn.ts` (13 edge(s))
- `/root/yvon/lib/intelligence.ts` (13 edge(s))
- `/root/yvon/lib/memory-manager.ts` (12 edge(s))
- `/root/yvon/app/api/growth-sprint/route.ts::start` (11 edge(s))
- `/root/yvon/lib/competitor-pipeline.ts` (11 edge(s))
