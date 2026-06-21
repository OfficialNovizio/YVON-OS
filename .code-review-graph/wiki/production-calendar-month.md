# production-calendar-month

## Overview

Directory-based community: app/production-calendar

- **Size**: 5 nodes
- **Cohesion**: 0.0741
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| daysInMonth | Function | /root/yvon/app/production-calendar/page.tsx | 189-191 |
| firstDayIndex | Function | /root/yvon/app/production-calendar/page.tsx | 194-197 |
| monthLabel | Function | /root/yvon/app/production-calendar/page.tsx | 199-201 |
| formatDate | Function | /root/yvon/app/production-calendar/page.tsx | 203-206 |
| ProductionCalendarPage | Function | /root/yvon/app/production-calendar/page.tsx | 210-654 |

## Execution Flows

- **ProductionCalendarPage** (criticality: 0.58, depth: 1)

## Dependencies

### Outgoing

- `useMemo` (5 edge(s))
- `filter` (5 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (5 edge(s))
- `map` (5 edge(s))
- `useState` (4 edge(s))
- `/root/yvon/components/ui.tsx::Card` (4 edge(s))
- `setSelected` (4 edge(s))
- `useCallback` (2 edge(s))
- `setViewMonth` (2 edge(s))
- `setViewYear` (2 edge(s))
- `ceil` (2 edge(s))
- `sort` (2 edge(s))
- `localeCompare` (2 edge(s))
- `slice` (2 edge(s))
- `Clock` (2 edge(s))

### Incoming

- `/root/yvon/app/production-calendar/page.tsx` (5 edge(s))
