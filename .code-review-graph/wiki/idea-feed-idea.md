# idea-feed-idea

## Overview

Directory-based community: app/idea-feed

- **Size**: 5 nodes
- **Cohesion**: 0.1176
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| IdeaFeedPage | Function | /root/yvon/app/idea-feed/page.tsx | 30-346 |
| dismiss | Function | /root/yvon/app/idea-feed/page.tsx | 57-60 |
| defer | Function | /root/yvon/app/idea-feed/page.tsx | 62-65 |
| promote | Function | /root/yvon/app/idea-feed/page.tsx | 67-70 |
| unpromote | Function | /root/yvon/app/idea-feed/page.tsx | 72-78 |

## Execution Flows

- **IdeaFeedPage** (criticality: 0.58, depth: 1)

## Dependencies

### Outgoing

- `filter` (7 edge(s))
- `useState` (6 edge(s))
- `/root/yvon/components/ui.tsx::Card` (5 edge(s))
- `setSel` (5 edge(s))
- `map` (4 edge(s))
- `Check` (4 edge(s))
- `setIdeas` (3 edge(s))
- `useMemo` (3 edge(s))
- `X` (3 edge(s))
- `getMonth` (2 edge(s))
- `getFullYear` (2 edge(s))
- `toLowerCase` (2 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (2 edge(s))
- `Clock` (2 edge(s))
- `setPromoted` (2 edge(s))

### Incoming

- `/root/yvon/app/idea-feed/page.tsx` (5 edge(s))
