# decision-queue-decision

## Overview

Directory-based community: app/decision-queue

- **Size**: 3 nodes
- **Cohesion**: 0.0357
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| DecisionQueuePage | Function | /root/yvon/app/decision-queue/page.tsx | 70-525 |
| handleAction | Function | /root/yvon/app/decision-queue/page.tsx | 99-117 |
| triageNext | Function | /root/yvon/app/decision-queue/page.tsx | 123-126 |

## Execution Flows

- **DecisionQueuePage** (criticality: 0.52, depth: 2)

## Dependencies

### Outgoing

- `/root/yvon/components/ui.tsx::Card` (9 edge(s))
- `useState` (8 edge(s))
- `/root/yvon/components/ui.tsx::Avatar` (7 edge(s))
- `map` (7 edge(s))
- `setTriageIdx` (5 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (5 edge(s))
- `slice` (4 edge(s))
- `setTriageMode` (3 edge(s))
- `toUpperCase` (3 edge(s))
- `Check` (3 edge(s))
- `Clock` (3 edge(s))
- `toFixed` (3 edge(s))
- `/root/yvon/lib/henry-learning.ts::getStats` (2 edge(s))
- `setLoading` (2 edge(s))
- `fetch` (2 edge(s))

### Incoming

- `/root/yvon/app/decision-queue/page.tsx` (3 edge(s))
