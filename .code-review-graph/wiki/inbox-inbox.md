# inbox-inbox

## Overview

Directory-based community: app/inbox

- **Size**: 3 nodes
- **Cohesion**: 0.0328
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| InboxPage | Function | /root/yvon/app/inbox/page.tsx | 116-471 |
| pick | Function | /root/yvon/app/inbox/page.tsx | 151-154 |
| send | Function | /root/yvon/app/inbox/page.tsx | 161-163 |

## Execution Flows

- **InboxPage** (criticality: 0.58, depth: 1)

## Dependencies

### Outgoing

- `useState` (8 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (4 edge(s))
- `map` (4 edge(s))
- `/root/yvon/components/ui.tsx::PageHeader` (3 edge(s))
- `setTriage` (3 edge(s))
- `/root/yvon/components/ui.tsx::Card` (3 edge(s))
- `includes` (3 edge(s))
- `setTIdx` (2 edge(s))
- `Zap` (2 edge(s))
- `setAccountFilter` (2 edge(s))
- `/root/yvon/components/ui.tsx::Avatar` (2 edge(s))
- `setDraft` (2 edge(s))
- `Send` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))
- `useMemo` (1 edge(s))

### Incoming

- `/root/yvon/app/inbox/page.tsx` (3 edge(s))
