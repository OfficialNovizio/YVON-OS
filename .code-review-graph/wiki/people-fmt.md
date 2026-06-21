# people-fmt

## Overview

Directory-based community: app/people

- **Size**: 6 nodes
- **Cohesion**: 0.0315
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| fmt | Function | /root/yvon/app/people/page.tsx | 49-49 |
| daysAgo | Function | /root/yvon/app/people/page.tsx | 50-50 |
| isActiveThisMonth | Function | /root/yvon/app/people/page.tsx | 178-182 |
| isNewThisWeek | Function | /root/yvon/app/people/page.tsx | 184-188 |
| PeoplePage | Function | /root/yvon/app/people/page.tsx | 192-489 |
| toggle | Function | /root/yvon/app/people/page.tsx | 222-228 |

## Execution Flows

- **PeoplePage** (criticality: 0.58, depth: 1)

## Dependencies

### Outgoing

- `/root/yvon/components/ui.tsx::Card` (6 edge(s))
- `map` (6 edge(s))
- `/root/yvon/components/ui.tsx::SectionLabel` (6 edge(s))
- `slice` (5 edge(s))
- `Mail` (5 edge(s))
- `useState` (4 edge(s))
- `Phone` (4 edge(s))
- `filter` (3 edge(s))
- `includes` (3 edge(s))
- `toLowerCase` (3 edge(s))
- `useMemo` (2 edge(s))
- `has` (2 edge(s))
- `setSel` (2 edge(s))
- `/root/yvon/components/ui.tsx::Avatar` (2 edge(s))
- `Building2` (2 edge(s))

### Incoming

- `/root/yvon/app/people/page.tsx` (41 edge(s))
