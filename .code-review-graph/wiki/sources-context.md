# sources-context

## Overview

Directory-based community: lib/cie

- **Size**: 85 nodes
- **Cohesion**: 0.2232
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| BloomFilter | Class | /root/yvon/lib/cie/algorithms.ts | 11-42 |
| constructor | Function | /root/yvon/lib/cie/algorithms.ts | 16-20 |
| hash | Function | /root/yvon/lib/cie/algorithms.ts | 22-28 |
| add | Function | /root/yvon/lib/cie/algorithms.ts | 30-34 |
| contains | Function | /root/yvon/lib/cie/algorithms.ts | 36-41 |
| minhashSignature | Function | /root/yvon/lib/cie/algorithms.ts | 46-62 |
| jaccardEstimate | Function | /root/yvon/lib/cie/algorithms.ts | 64-70 |
| TfidfIndex | Class | /root/yvon/lib/cie/algorithms.ts | 80-131 |
| add | Function | /root/yvon/lib/cie/algorithms.ts | 85-101 |
| idf | Function | /root/yvon/lib/cie/algorithms.ts | 103-106 |
| tf | Function | /root/yvon/lib/cie/algorithms.ts | 108-112 |
| w | Function | /root/yvon/lib/cie/algorithms.ts | 110-110 |
| search | Function | /root/yvon/lib/cie/algorithms.ts | 114-130 |
| blastRadius | Function | /root/yvon/lib/cie/algorithms.ts | 135-157 |
| ContextPriorityQueue | Class | /root/yvon/lib/cie/algorithms.ts | 169-211 |
| constructor | Function | /root/yvon/lib/cie/algorithms.ts | 174-177 |
| offer | Function | /root/yvon/lib/cie/algorithms.ts | 179-187 |
| select | Function | /root/yvon/lib/cie/algorithms.ts | 189-206 |
| remaining | Function | /root/yvon/lib/cie/algorithms.ts | 208-210 |
| extractKeywords | Function | /root/yvon/lib/cie/algorithms.ts | 215-242 |
| word | Function | /root/yvon/lib/cie/algorithms.ts | 241-241 |
| extractFilePaths | Function | /root/yvon/lib/cie/algorithms.ts | 246-250 |
| buildSystemExtension | Function | /root/yvon/lib/cie/builder.ts | 11-41 |
| i | Function | /root/yvon/lib/cie/builder.ts | 77-77 |
| buildDataBlock | Function | /root/yvon/lib/cie/builder.ts | 45-51 |
| sourceLabel | Function | /root/yvon/lib/cie/builder.ts | 55-66 |
| buildInjection | Function | /root/yvon/lib/cie/builder.ts | 70-89 |
| agentBias | Function | /root/yvon/lib/cie/classifier.ts | 66-72 |
| extractKeywords | Function | /root/yvon/lib/cie/classifier.ts | 78-84 |
| classifyTask | Function | /root/yvon/lib/cie/classifier.ts | 96-157 |
| buildCieContext | Function | /root/yvon/lib/cie/index.ts | 31-73 |
| rankContext | Function | /root/yvon/lib/cie/ranker.ts | 11-83 |
| item | Function | /root/yvon/lib/cie/ranker.ts | 33-36 |
| s | Function | /root/yvon/lib/cie/ranker.ts | 73-73 |
| i | Function | /root/yvon/lib/cie/ranker.ts | 88-88 |
| getSourcesUsed | Function | /root/yvon/lib/cie/ranker.ts | 87-89 |
| fetchSource | Function | /root/yvon/lib/cie/retriever.ts | 34-84 |
| add | Function | /root/yvon/lib/cie/retriever.ts | 36-44 |
| retrieveContext | Function | /root/yvon/lib/cie/retriever.ts | 88-108 |
| s | Function | /root/yvon/lib/cie/retriever.ts | 102-102 |
| i | Function | /root/yvon/lib/cie/retriever.ts | 103-103 |
| resolveAgentPath | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 85-104 |
| getMemoryFilename | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 110-113 |
| extractBulletList | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 122-146 |
| extractSectionText | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 153-177 |
| findSectionHeading | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 184-195 |
| parseMemoryFile | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 203-243 |
| loadCached | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 249-279 |
| getAgentMemoryRules | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 290-298 |
| getCrossAgentRules | Function | /root/yvon/lib/cie/sources/agent-memory.ts | 311-343 |

*... and 35 more members.*

## Execution Flows

- **s** (criticality: 0.71, depth: 5)
- **buildCieContext** (criticality: 0.70, depth: 3)
- **item** (criticality: 0.56, depth: 1)
- **add** (criticality: 0.45, depth: 2)
- **offer** (criticality: 0.45, depth: 2)

## Dependencies

### Outgoing

- `push` (38 edge(s))
- `map` (19 edge(s))
- `toLowerCase` (17 edge(s))
- `trim` (17 edge(s))
- `filter` (16 edge(s))
- `split` (14 edge(s))
- `join` (13 edge(s))
- `slice` (11 edge(s))
- `includes` (11 edge(s))
- `has` (10 edge(s))
- `match` (10 edge(s))
- `test` (10 edge(s))
- `startsWith` (9 edge(s))
- `set` (7 edge(s))
- `replace` (7 edge(s))

### Incoming

- `/root/yvon/lib/cie/sources/agent-memory.ts` (11 edge(s))
- `/root/yvon/lib/cie/sources/codegraph.ts` (11 edge(s))
- `/root/yvon/lib/cie/algorithms.ts` (9 edge(s))
- `/root/yvon/lib/cie/retriever.ts` (9 edge(s))
- `/root/yvon/lib/cie/builder.ts` (8 edge(s))
- `/root/yvon/lib/cie/sources/hermes-memory.ts` (8 edge(s))
- `/root/yvon/lib/cie/sources/project-docs.ts` (8 edge(s))
- `/root/yvon/lib/cie/ranker.ts` (7 edge(s))
- `/root/yvon/lib/cie/sources/graphify.ts` (6 edge(s))
- `/root/yvon/lib/cie/classifier.ts` (3 edge(s))
- `/root/yvon/lib/cie/index.ts` (1 edge(s))
