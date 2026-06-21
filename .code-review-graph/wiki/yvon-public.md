# yvon-public

## Overview

Directory-based community: middleware

- **Size**: 9 nodes
- **Cohesion**: 0.2542
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| isReadPublicApi | Function | /root/yvon/middleware.ts | 63-65 |
| isOwnOrigin | Function | /root/yvon/middleware.ts | 68-73 |
| isAllowedOrigin | Function | /root/yvon/middleware.ts | 71-71 |
| isPublicApiPath | Function | /root/yvon/middleware.ts | 79-81 |
| getClientIp | Function | /root/yvon/middleware.ts | 84-90 |
| isCronAuthorized | Function | /root/yvon/middleware.ts | 93-98 |
| isTokenAuthorized | Function | /root/yvon/middleware.ts | 101-111 |
| setCorsHeaders | Function | /root/yvon/middleware.ts | 114-128 |
| middleware | Function | /root/yvon/middleware.ts | 134-224 |

## Execution Flows

- **middleware** (criticality: 0.49, depth: 2)

## Dependencies

### Outgoing

- `get` (8 edge(s))
- `set` (5 edge(s))
- `startsWith` (4 edge(s))
- `next` (4 edge(s))
- `some` (3 edge(s))
- `log` (2 edge(s))
- `stringify` (2 edge(s))
- `trim` (1 edge(s))
- `split` (1 edge(s))
- `/root/yvon/lib/rate-limit.ts::checkRateLimit` (1 edge(s))
- `ceil` (1 edge(s))
- `now` (1 edge(s))
- `String` (1 edge(s))
- `includes` (1 edge(s))

### Incoming

- `/root/yvon/middleware.ts` (9 edge(s))
