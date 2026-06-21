# db-agent

## Overview

Directory-based community: lib/db

- **Size**: 102 nodes
- **Cohesion**: 0.0272
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| getAgentMemory | Function | /root/yvon/lib/db/agents.ts | 14-29 |
| setAgentMemory | Function | /root/yvon/lib/db/agents.ts | 31-47 |
| deleteAgentMemory | Function | /root/yvon/lib/db/agents.ts | 49-60 |
| getAllAgentSettings | Function | /root/yvon/lib/db/agents.ts | 64-77 |
| saveAgentSettings | Function | /root/yvon/lib/db/agents.ts | 79-93 |
| getConversation | Function | /root/yvon/lib/db/agents.ts | 97-110 |
| createConversation | Function | /root/yvon/lib/db/agents.ts | 112-123 |
| appendMessage | Function | /root/yvon/lib/db/agents.ts | 125-135 |
| saveAgentSession | Function | /root/yvon/lib/db/agents.ts | 139-149 |
| getAgentSessions | Function | /root/yvon/lib/db/agents.ts | 151-174 |
| r | Function | /root/yvon/lib/db/agents.ts | 331-339 |
| searchAgentSessions | Function | /root/yvon/lib/db/agents.ts | 176-199 |
| prefetchAgentMemory | Function | /root/yvon/lib/db/agents.ts | 203-230 |
| searchSkills | Function | /root/yvon/lib/db/agents.ts | 234-252 |
| appendLearnedActivation | Function | /root/yvon/lib/db/agents.ts | 254-268 |
| trackSkillUsage | Function | /root/yvon/lib/db/agents.ts | 270-276 |
| runSkillLifecycleTransitions | Function | /root/yvon/lib/db/agents.ts | 278-307 |
| saveBrandPsychologyNote | Function | /root/yvon/lib/db/agents.ts | 311-321 |
| getBrandPsychology | Function | /root/yvon/lib/db/agents.ts | 323-340 |
| extractSocialMetric | Function | /root/yvon/lib/db/analytics.ts | 70-88 |
| extractAnalyticsMetric | Function | /root/yvon/lib/db/analytics.ts | 90-93 |
| getAnalyticsReport | Function | /root/yvon/lib/db/analytics.ts | 97-106 |
| setAnalyticsReport | Function | /root/yvon/lib/db/analytics.ts | 108-117 |
| getTrendingItems | Function | /root/yvon/lib/db/analytics.ts | 121-143 |
| upsertTrendingItem | Function | /root/yvon/lib/db/analytics.ts | 145-158 |
| getActivityFeed | Function | /root/yvon/lib/db/analytics.ts | 162-181 |
| logActivityEvent | Function | /root/yvon/lib/db/analytics.ts | 183-193 |
| insertSocialSnapshot | Function | /root/yvon/lib/db/analytics.ts | 197-223 |
| getSocialHistory | Function | /root/yvon/lib/db/analytics.ts | 225-245 |
| r | Function | /root/yvon/lib/db/analytics.ts | 508-513 |
| insertAnalyticsSnapshot | Function | /root/yvon/lib/db/analytics.ts | 249-277 |
| getAnalyticsHistory | Function | /root/yvon/lib/db/analytics.ts | 279-298 |
| insertCompetitorSnapshot | Function | /root/yvon/lib/db/analytics.ts | 302-317 |
| getCompetitorHistory | Function | /root/yvon/lib/db/analytics.ts | 319-342 |
| getGrowthBaselines | Function | /root/yvon/lib/db/analytics.ts | 346-363 |
| setGrowthBaseline | Function | /root/yvon/lib/db/analytics.ts | 365-384 |
| getGrowthSummary | Function | /root/yvon/lib/db/analytics.ts | 388-446 |
| s | Function | /root/yvon/lib/db/analytics.ts | 422-425 |
| getInsights | Function | /root/yvon/lib/db/analytics.ts | 450-515 |
| getCompetitorContent | Function | /root/yvon/lib/db/competitors.ts | 9-30 |
| upsertCompetitorContent | Function | /root/yvon/lib/db/competitors.ts | 32-47 |
| mapCalendarRow | Function | /root/yvon/lib/db/content.ts | 13-29 |
| getContentCalendar | Function | /root/yvon/lib/db/content.ts | 33-63 |
| createContentCalendarEntry | Function | /root/yvon/lib/db/content.ts | 65-95 |
| deleteContentCalendarEntry | Function | /root/yvon/lib/db/content.ts | 97-99 |
| getPastDuePlanned | Function | /root/yvon/lib/db/content.ts | 101-112 |
| markAsPosted | Function | /root/yvon/lib/db/content.ts | 114-119 |
| markAsMissed | Function | /root/yvon/lib/db/content.ts | 121-126 |
| replanEntry | Function | /root/yvon/lib/db/content.ts | 128-151 |
| skipEntry | Function | /root/yvon/lib/db/content.ts | 153-158 |

*... and 52 more members.*

## Execution Flows

- **POST** (criticality: 0.84, depth: 8)
- **GET** (criticality: 0.81, depth: 5)
- **POST** (criticality: 0.80, depth: 6)
- **POST** (criticality: 0.80, depth: 6)
- **POST** (criticality: 0.78, depth: 6)
- **POST** (criticality: 0.78, depth: 6)
- **GET** (criticality: 0.77, depth: 3)
- **POST** (criticality: 0.77, depth: 6)
- **GET** (criticality: 0.76, depth: 3)
- **start** (criticality: 0.76, depth: 6)
- *... and 29 more flows.*

## Dependencies

### Outgoing

- `from` (99 edge(s))
- `eq` (65 edge(s))
- `select` (55 edge(s))
- `map` (44 edge(s))
- `order` (33 edge(s))
- `toISOString` (25 edge(s))
- `insert` (23 edge(s))
- `single` (18 edge(s))
- `limit` (16 edge(s))
- `update` (15 edge(s))
- `upsert` (10 edge(s))
- `split` (9 edge(s))
- `delete` (8 edge(s))
- `gte` (8 edge(s))
- `slice` (6 edge(s))

### Incoming

- `/root/yvon/lib/db/analytics.ts` (25 edge(s))
- `/root/yvon/lib/db/agents.ts` (24 edge(s))
- `/root/yvon/lib/db/war-room.ts` (23 edge(s))
- `/root/yvon/lib/db/content.ts` (16 edge(s))
- `/root/yvon/lib/db/tasks.ts` (12 edge(s))
- `/root/yvon/lib/db/ventures.ts` (9 edge(s))
- `/root/yvon/app/api/team-chat/route.ts::start` (8 edge(s))
- `/root/yvon/app/api/calendar-verify/route.ts::verifyVenture` (5 edge(s))
- `/root/yvon/app/api/kahneman/results/route.ts::POST` (4 edge(s))
- `/root/yvon/lib/db/social.ts` (4 edge(s))
- `/root/yvon/app/api/team-chat/brief-builder.ts::buildRecallBlock` (3 edge(s))
- `/root/yvon/app/api/market-intelligence/route.ts::getCustomerGrowth` (3 edge(s))
- `/root/yvon/app/api/analytics/route.ts::GET` (3 edge(s))
- `/root/yvon/app/api/content-calendar/route.ts::GET` (3 edge(s))
- `/root/yvon/app/api/brand-intelligence/route.ts::POST` (3 edge(s))
