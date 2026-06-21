# logs-ago

## Overview

Directory-based community: app/logs

- **Size**: 7 nodes
- **Cohesion**: 0.0667
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| now | Function | /root/yvon/app/logs/page.tsx | 40-42 |
| iso | Function | /root/yvon/app/logs/page.tsx | 44-46 |
| minutesAgo | Function | /root/yvon/app/logs/page.tsx | 48-51 |
| hoursAgo | Function | /root/yvon/app/logs/page.tsx | 53-56 |
| isToday | Function | /root/yvon/app/logs/page.tsx | 214-218 |
| formatRelative | Function | /root/yvon/app/logs/page.tsx | 220-230 |
| LogsPage | Function | /root/yvon/app/logs/page.tsx | 234-478 |

## Execution Flows

- **LogsPage** (criticality: 0.51, depth: 1)

## Dependencies

### Outgoing

- `/root/yvon/components/ui.tsx::Card` (5 edge(s))
- `useState` (4 edge(s))
- `filter` (4 edge(s))
- `map` (4 edge(s))
- `X` (3 edge(s))
- `setSevFilter` (3 edge(s))
- `/root/yvon/components/ui.tsx::SectionLabel` (3 edge(s))
- `getTime` (3 edge(s))
- `useMemo` (2 edge(s))
- `/root/yvon/components/ui.tsx::Chip` (2 edge(s))
- `setAgentFilter` (2 edge(s))
- `setWsFilter` (2 edge(s))
- `floor` (2 edge(s))
- `slice` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))

### Incoming

- `/root/yvon/app/logs/page.tsx` (27 edge(s))
