# team-chat-post

## Overview

Directory-based community: app/api

- **Size**: 603 nodes
- **Cohesion**: 0.0561
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| GET | Function | /root/yvon/app/api/activity/route.ts | 5-68 |
| start | Function | /root/yvon/app/api/activity/route.ts | 12-58 |
| emit | Function | /root/yvon/app/api/activity/route.ts | 13-16 |
| GET | Function | /root/yvon/app/api/agent-cron/calibration/route.ts | 12-83 |
| s | Function | /root/yvon/app/api/agent-cron/calibration/route.ts | 28-28 |
| r | Function | /root/yvon/app/api/agent-cron/calibration/route.ts | 32-32 |
| e | Function | /root/yvon/app/api/agent-cron/calibration/route.ts | 44-45 |
| GET | Function | /root/yvon/app/api/agent-cron/henry-filter/route.ts | 23-113 |
| GET | Function | /root/yvon/app/api/agent-cron/knox-security/route.ts | 72-177 |
| GET | Function | /root/yvon/app/api/agent-cron/nexus-code/route.ts | 22-107 |
| GET | Function | /root/yvon/app/api/agent-cron/pulse/route.ts | 21-81 |
| id | Function | /root/yvon/app/api/agent-cron/pulse/route.ts | 34-35 |
| v | Function | /root/yvon/app/api/agent-cron/pulse/route.ts | 35-35 |
| GET | Function | /root/yvon/app/api/agent-cron/steve-qa/route.ts | 24-143 |
| hashString | Function | /root/yvon/app/api/agent-cron/steve-qa/route.ts | 146-154 |
| GET | Function | /root/yvon/app/api/agent-log/route.ts | 4-17 |
| POST | Function | /root/yvon/app/api/agent-log/route.ts | 19-54 |
| GET | Function | /root/yvon/app/api/agent-memory/route.ts | 12-27 |
| POST | Function | /root/yvon/app/api/agent-memory/route.ts | 29-43 |
| scanAgents | Function | /root/yvon/app/api/agent-ops/route.ts | 23-102 |
| d | Function | /root/yvon/app/api/agent-ops/route.ts | 29-29 |
| a | Function | /root/yvon/app/api/agent-ops/route.ts | 33-33 |
| scanSkills | Function | /root/yvon/app/api/agent-ops/route.ts | 54-64 |
| GET | Function | /root/yvon/app/api/agent-ops/route.ts | 104-137 |
| GET | Function | /root/yvon/app/api/agent-personality/route.ts | 10-36 |
| verifyInternalAuth | Function | /root/yvon/app/api/agent-session-memory/route.ts | 17-21 |
| GET | Function | /root/yvon/app/api/agent-session-memory/route.ts | 23-40 |
| POST | Function | /root/yvon/app/api/agent-session-memory/route.ts | 42-77 |
| GET | Function | /root/yvon/app/api/agent-status/route.ts | 24-85 |
| getServiceClient | Function | /root/yvon/app/api/ai-keys/route.ts | 12-17 |
| maskKey | Function | /root/yvon/app/api/ai-keys/route.ts | 19-22 |
| GET | Function | /root/yvon/app/api/ai-keys/route.ts | 26-66 |
| r | Function | /root/yvon/app/api/ai-keys/route.ts | 56-60 |
| POST | Function | /root/yvon/app/api/ai-keys/route.ts | 70-114 |
| DELETE | Function | /root/yvon/app/api/ai-keys/route.ts | 118-138 |
| PATCH | Function | /root/yvon/app/api/ai-keys/route.ts | 142-172 |
| POST | Function | /root/yvon/app/api/ai-keys/test/route.ts | 12-90 |
| GET | Function | /root/yvon/app/api/analytics-overview/route.ts | 38-225 |
| GET | Function | /root/yvon/app/api/analytics/route.ts | 4-32 |
| resolveThresholds | Function | /root/yvon/app/api/anomaly-check/route.ts | 28-39 |
| GET | Function | /root/yvon/app/api/anomaly-check/route.ts | 41-180 |
| GET | Function | /root/yvon/app/api/api-costs/route.ts | 22-69 |
| GET | Function | /root/yvon/app/api/archive-intelligence/route.ts | 6-23 |
| GET | Function | /root/yvon/app/api/asset-lab/route.ts | 38-218 |
| GET | Function | /root/yvon/app/api/audience-intelligence/route.ts | 9-33 |
| POST | Function | /root/yvon/app/api/audience-intelligence/route.ts | 35-83 |
| POST | Function | /root/yvon/app/api/auth/logout/route.ts | 3-7 |
| POST | Function | /root/yvon/app/api/auth/token/route.ts | 9-38 |
| getBands | Function | /root/yvon/app/api/auto-competitors/route.ts | 13-21 |
| fmtBand | Function | /root/yvon/app/api/auto-competitors/route.ts | 23-26 |

*... and 553 more members.*

## Execution Flows

- **POST** (criticality: 0.84, depth: 8)
- **GET** (criticality: 0.81, depth: 4)
- **GET** (criticality: 0.81, depth: 5)
- **POST** (criticality: 0.80, depth: 6)
- **POST** (criticality: 0.80, depth: 6)
- **POST** (criticality: 0.78, depth: 6)
- **POST** (criticality: 0.78, depth: 6)
- **POST** (criticality: 0.77, depth: 6)
- **GET** (criticality: 0.77, depth: 3)
- **GET** (criticality: 0.77, depth: 4)
- *... and 128 more flows.*

## Dependencies

### Outgoing

- `json` (1174 edge(s))
- `get` (277 edge(s))
- `from` (273 edge(s))
- `map` (246 edge(s))
- `slice` (186 edge(s))
- `select` (182 edge(s))
- `String` (174 edge(s))
- `eq` (167 edge(s))
- `filter` (158 edge(s))
- `push` (154 edge(s))
- `join` (153 edge(s))
- `toISOString` (119 edge(s))
- `round` (97 edge(s))
- `trim` (96 edge(s))
- `order` (76 edge(s))

### Incoming

- `/root/yvon/app/api/market-intelligence/route.ts` (57 edge(s))
- `/root/yvon/app/api/team-chat/route.ts` (44 edge(s))
- `/root/yvon/app/api/council/convene/route.ts` (28 edge(s))
- `/root/yvon/app/api/growth-sprint/route.ts` (22 edge(s))
- `/root/yvon/app/api/team-chat/plan-stage.ts` (22 edge(s))
- `/root/yvon/app/api/team-chat/brief-builder.ts` (18 edge(s))
- `/root/yvon/app/api/competitor-bulk/route.ts` (17 edge(s))
- `/root/yvon/app/api/skill-workshop/route.ts` (14 edge(s))
- `/root/yvon/app/api/github/route.ts` (13 edge(s))
- `/root/yvon/app/api/org-chart/route.ts` (13 edge(s))
- `/root/yvon/app/api/team-chat/synthesize-stage.ts` (12 edge(s))
- `/root/yvon/app/api/team-chat/validate-stage.ts` (12 edge(s))
- `/root/yvon/app/api/content-intelligence/route.ts` (11 edge(s))
- `/root/yvon/app/api/morning-brief/today/route.ts` (11 edge(s))
- `/root/yvon/app/api/codebase/route.ts` (10 edge(s))
