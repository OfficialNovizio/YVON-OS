# trend-radar-trend

## Overview

Directory-based community: app/trend-radar

- **Size**: 2 nodes
- **Cohesion**: 0.0000
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| TrendRadarPage | Function | /root/yvon/app/trend-radar/page.tsx | 177-532 |
| handleIsaacScan | Function | /root/yvon/app/trend-radar/page.tsx | 190-207 |

## Execution Flows

- **TrendRadarPage** (criticality: 0.51, depth: 1)

## Dependencies

### Outgoing

- `/root/yvon/components/ui.tsx::Card` (11 edge(s))
- `map` (9 edge(s))
- `useState` (4 edge(s))
- `filter` (2 edge(s))
- `includes` (2 edge(s))
- `sort` (2 edge(s))
- `setWsFilter` (2 edge(s))
- `setTypeFilter` (2 edge(s))
- `setUrgencyFilter` (2 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (2 edge(s))
- `setScanning` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))
- `flatMap` (1 edge(s))
- `/root/yvon/components/ui.tsx::PageHeader` (1 edge(s))
- `RefreshCw` (1 edge(s))

### Incoming

- `/root/yvon/app/trend-radar/page.tsx` (2 edge(s))
