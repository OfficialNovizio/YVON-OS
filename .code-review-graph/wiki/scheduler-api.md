# scheduler-api

## Overview

Directory-based community: app/scheduler

- **Size**: 4 nodes
- **Cohesion**: 0.0577
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| apiDayToIndex | Function | /root/yvon/app/scheduler/page.tsx | 43-47 |
| feedItemToSlot | Function | /root/yvon/app/scheduler/page.tsx | 50-60 |
| SchedulerPage | Function | /root/yvon/app/scheduler/page.tsx | 64-207 |
| drop | Function | /root/yvon/app/scheduler/page.tsx | 90-95 |

## Execution Flows

- **SchedulerPage** (criticality: 0.58, depth: 1)

## Dependencies

### Outgoing

- `map` (5 edge(s))
- `useState` (5 edge(s))
- `setOverDay` (4 edge(s))
- `setFix` (4 edge(s))
- `filter` (3 edge(s))
- `setDragId` (3 edge(s))
- `setSlots` (2 edge(s))
- `/root/yvon/components/ui.tsx::Card` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))
- `useMemo` (1 edge(s))
- `useEffect` (1 edge(s))
- `/root/yvon/components/ui.tsx::PageHeader` (1 edge(s))
- `refetch` (1 edge(s))
- `RefreshCw` (1 edge(s))
- `Plus` (1 edge(s))

### Incoming

- `/root/yvon/app/scheduler/page.tsx` (4 edge(s))
