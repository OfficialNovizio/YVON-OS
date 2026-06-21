# scripts-memory

## Overview

Directory-based community: scripts

- **Size**: 151 nodes
- **Cohesion**: 0.1402
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| walk | Function | /root/yvon/scripts/codegraph-build.mjs | 27-36 |
| extractImports | Function | /root/yvon/scripts/codegraph-build.mjs | 43-51 |
| i | Function | /root/yvon/scripts/codegraph-build.mjs | 50-50 |
| resolveImport | Function | /root/yvon/scripts/codegraph-build.mjs | 53-57 |
| findFile | Function | /root/yvon/scripts/codegraph-build.mjs | 64-70 |
| rel | Function | /root/yvon/scripts/codegraph-build.mjs | 72-74 |
| f | Function | /root/yvon/scripts/codegraph-build.mjs | 198-198 |
| x | Function | /root/yvon/scripts/codegraph-build.mjs | 121-121 |
| route | Function | /root/yvon/scripts/codegraph-build.mjs | 117-120 |
| dfs | Function | /root/yvon/scripts/codegraph-build.mjs | 137-146 |
| dep | Function | /root/yvon/scripts/codegraph-build.mjs | 188-188 |
| daysSince | Function | /root/yvon/scripts/curator.mjs | 22-26 |
| loadMemoryIndex | Function | /root/yvon/scripts/curator.mjs | 28-39 |
| analyzeMemoryFiles | Function | /root/yvon/scripts/curator.mjs | 41-65 |
| f | Function | /root/yvon/scripts/curator.mjs | 42-42 |
| generateReport | Function | /root/yvon/scripts/curator.mjs | 67-113 |
| a | Function | /root/yvon/scripts/curator.mjs | 131-131 |
| m | Function | /root/yvon/scripts/curator.mjs | 93-93 |
| e | Function | /root/yvon/scripts/curator.mjs | 135-135 |
| runCurator | Function | /root/yvon/scripts/curator.mjs | 115-145 |
| nameCommunity | Function | /root/yvon/scripts/graphify-postprocess.mjs | 74-80 |
| n | Function | /root/yvon/scripts/graphify-postprocess.mjs | 93-93 |
| l | Function | /root/yvon/scripts/graphify-postprocess.mjs | 106-106 |
| c | Function | /root/yvon/scripts/graphify-postprocess.mjs | 140-141 |
| run | Function | /root/yvon/scripts/insights.mjs | 19-22 |
| analyzeGitActivity | Function | /root/yvon/scripts/insights.mjs | 24-32 |
| analyzeMemoryUsage | Function | /root/yvon/scripts/insights.mjs | 34-39 |
| f | Function | /root/yvon/scripts/insights.mjs | 55-55 |
| generateInsightsReport | Function | /root/yvon/scripts/insights.mjs | 41-76 |
| n | Function | /root/yvon/scripts/insights.mjs | 60-60 |
| main | Function | /root/yvon/scripts/kai-query2.mjs | 8-82 |
| e | Function | /root/yvon/scripts/kai-query2.mjs | 84-84 |
| main | Function | /root/yvon/scripts/migrate-agent-memory-to-db.mjs | 31-54 |
| e | Function | /root/yvon/scripts/migrate-agent-memory-to-db.mjs | 56-56 |
| findMemoryFiles | Function | /root/yvon/scripts/migrate-memory-files.ts | 8-22 |
| migrateMemoryFile | Function | /root/yvon/scripts/migrate-memory-files.ts | 24-51 |
| main | Function | /root/yvon/scripts/migrate-memory-files.ts | 53-74 |
| main | Function | /root/yvon/scripts/migrate-secrets-to-vault.mjs | 23-40 |
| e | Function | /root/yvon/scripts/migrate-secrets-to-vault.mjs | 42-42 |
| main | Function | /root/yvon/scripts/migrate-venture-docs-to-db.mjs | 18-59 |
| e | Function | /root/yvon/scripts/migrate-venture-docs-to-db.mjs | 61-61 |
| loadEnv | Function | /root/yvon/scripts/migrate.mjs | 27-41 |
| migrate | Function | /root/yvon/scripts/migrate.mjs | 45-114 |
| r | Function | /root/yvon/scripts/migrate.mjs | 74-74 |
| f | Function | /root/yvon/scripts/migrate.mjs | 78-78 |
| err | Function | /root/yvon/scripts/migrate.mjs | 116-119 |
| findMemoryFiles | Function | /root/yvon/scripts/optimize-memory-system.ts | 15-29 |
| main | Function | /root/yvon/scripts/optimize-memory-system.ts | 31-147 |
| sip | Function | /root/yvon/scripts/optimize-memory-system.ts | 90-92 |
| getDepartment | Function | /root/yvon/scripts/optimize-memory-system.ts | 149-167 |

*... and 101 more members.*

## Execution Flows

- **main** (criticality: 0.88, depth: 4)
- **main** (criticality: 0.88, depth: 4)
- **main** (criticality: 0.70, depth: 3)
- **main** (criticality: 0.69, depth: 2)
- **main** (criticality: 0.62, depth: 2)
- **main** (criticality: 0.49, depth: 2)
- **main** (criticality: 0.45, depth: 2)

## Dependencies

### Outgoing

- `log` (225 edge(s))
- `push` (56 edge(s))
- `join` (54 edge(s))
- `String` (48 edge(s))
- `slice` (43 edge(s))
- `exit` (33 edge(s))
- `split` (29 edge(s))
- `includes` (27 edge(s))
- `filter` (25 edge(s))
- `error` (25 edge(s))
- `trim` (22 edge(s))
- `startsWith` (20 edge(s))
- `toISOString` (17 edge(s))
- `stringify` (16 edge(s))
- `map` (14 edge(s))

### Incoming

- `/root/yvon/scripts/codegraph-build.mjs` (26 edge(s))
- `/root/yvon/scripts/validate-memory-system.ts` (15 edge(s))
- `/root/yvon/scripts/validate-memory-system-simple.ts` (14 edge(s))
- `/root/yvon/scripts/curator.mjs` (13 edge(s))
- `/root/yvon/scripts/session-end.mjs` (13 edge(s))
- `/root/yvon/scripts/test-enhanced-systems.ts` (13 edge(s))
- `/root/yvon/scripts/push-metrics-to-supabase.ts` (11 edge(s))
- `/root/yvon/scripts/self-reflect.mjs` (11 edge(s))
- `/root/yvon/scripts/insights.mjs` (9 edge(s))
- `/root/yvon/scripts/run-migration.mjs` (8 edge(s))
- `/root/yvon/scripts/sync-hermes-tokens.ts` (8 edge(s))
- `/root/yvon/scripts/update-skill-frontmatter.mjs` (8 edge(s))
- `/root/yvon/scripts/test-a1-session.ts` (7 edge(s))
- `/root/yvon/scripts/test-buildgate.ts` (7 edge(s))
- `/root/yvon/scripts/graphify-postprocess.mjs` (6 edge(s))
