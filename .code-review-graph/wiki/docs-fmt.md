# docs-fmt

## Overview

Directory-based community: app/docs

- **Size**: 3 nodes
- **Cohesion**: 0.0225
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| fmt | Function | /root/yvon/app/docs/page.tsx | 42-42 |
| daysAgo | Function | /root/yvon/app/docs/page.tsx | 43-43 |
| DocsPage | Function | /root/yvon/app/docs/page.tsx | 437-674 |

## Execution Flows

- **DocsPage** (criticality: 0.59, depth: 2)

## Dependencies

### Outgoing

- `slice` (9 edge(s))
- `startsWith` (8 edge(s))
- `/root/yvon/components/ui.tsx::Card` (5 edge(s))
- `map` (5 edge(s))
- `includes` (4 edge(s))
- `toLocaleString` (4 edge(s))
- `useState` (3 edge(s))
- `toLowerCase` (3 edge(s))
- `useMemo` (2 edge(s))
- `filter` (2 edge(s))
- `setCatFilter` (2 edge(s))
- `setSel` (2 edge(s))
- `Eye` (2 edge(s))
- `split` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))

### Incoming

- `/root/yvon/app/docs/page.tsx` (13 edge(s))
