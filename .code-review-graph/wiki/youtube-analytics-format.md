# youtube-analytics-format

## Overview

Directory-based community: app/youtube-analytics

- **Size**: 6 nodes
- **Cohesion**: 0.1605
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| generateDailyViews | Function | /root/yvon/app/youtube-analytics/page.tsx | 145-159 |
| formatNumber | Function | /root/yvon/app/youtube-analytics/page.tsx | 170-174 |
| formatHours | Function | /root/yvon/app/youtube-analytics/page.tsx | 176-179 |
| YouTubeAnalyticsPage | Function | /root/yvon/app/youtube-analytics/page.tsx | 183-496 |
| toggleSort | Function | /root/yvon/app/youtube-analytics/page.tsx | 213-220 |
| sortIcon | Function | /root/yvon/app/youtube-analytics/page.tsx | 222-225 |

## Execution Flows

- **YouTubeAnalyticsPage** (criticality: 0.51, depth: 1)

## Dependencies

### Outgoing

- `toFixed` (10 edge(s))
- `map` (5 edge(s))
- `/root/yvon/components/ui.tsx::Card` (4 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (4 edge(s))
- `useState` (3 edge(s))
- `toLocaleString` (3 edge(s))
- `slice` (2 edge(s))
- `max` (2 edge(s))
- `floor` (2 edge(s))
- `random` (2 edge(s))
- `setSortDir` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))
- `find` (1 edge(s))
- `min` (1 edge(s))
- `useMemo` (1 edge(s))

### Incoming

- `/root/yvon/app/youtube-analytics/page.tsx` (7 edge(s))
