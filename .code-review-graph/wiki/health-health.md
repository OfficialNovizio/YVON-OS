# health-health

## Overview

Directory-based community: lib/health

- **Size**: 9 nodes
- **Cohesion**: 0.0000
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| writeHealthAlert | Function | /root/yvon/lib/health/alerts.ts | 19-36 |
| checkDatabaseHealth | Function | /root/yvon/lib/health/database.ts | 11-52 |
| d | Function | /root/yvon/lib/health/database.ts | 49-49 |
| checkRepositoryHealth | Function | /root/yvon/lib/health/repository.ts | 9-52 |
| p | Function | /root/yvon/lib/health/repository.ts | 22-22 |
| d | Function | /root/yvon/lib/health/repository.ts | 50-50 |
| checkSpend | Function | /root/yvon/lib/health/spend.ts | 11-43 |
| checkWebsiteHealth | Function | /root/yvon/lib/health/website.ts | 9-48 |
| d | Function | /root/yvon/lib/health/website.ts | 45-45 |

## Execution Flows

- **GET** (criticality: 0.77, depth: 4)

## Dependencies

### Outgoing

- `now` (15 edge(s))
- `filter` (7 edge(s))
- `values` (6 edge(s))
- `fetch` (5 edge(s))
- `timeout` (5 edge(s))
- `select` (4 edge(s))
- `from` (4 edge(s))
- `toISOString` (3 edge(s))
- `limit` (3 edge(s))
- `createClient` (2 edge(s))
- `json` (2 edge(s))
- `slice` (2 edge(s))
- `mkdir` (1 edge(s))
- `join` (1 edge(s))
- `split` (1 edge(s))

### Incoming

- `/root/yvon/app/api/health/route.ts::GET` (5 edge(s))
- `/root/yvon/lib/health/repository.ts` (4 edge(s))
- `/root/yvon/lib/health/database.ts` (3 edge(s))
- `/root/yvon/lib/health/website.ts` (3 edge(s))
- `/root/yvon/lib/health/alerts.ts` (1 edge(s))
- `/root/yvon/lib/health/spend.ts` (1 edge(s))
