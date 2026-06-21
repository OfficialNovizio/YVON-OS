# newsletter-fmt

## Overview

Directory-based community: app/newsletter

- **Size**: 5 nodes
- **Cohesion**: 0.0690
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| fmtRate | Function | /root/yvon/app/newsletter/page.tsx | 91-94 |
| ProgressBar | Function | /root/yvon/app/newsletter/page.tsx | 96-110 |
| kitConnectedLabel | Function | /root/yvon/app/newsletter/page.tsx | 112-116 |
| timeAgo | Function | /root/yvon/app/newsletter/page.tsx | 118-126 |
| NewsletterPage | Function | /root/yvon/app/newsletter/page.tsx | 130-358 |

## Execution Flows

- **NewsletterPage** (criticality: 0.61, depth: 1)

## Dependencies

### Outgoing

- `map` (9 edge(s))
- `/root/yvon/components/ui.tsx::Card` (8 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (3 edge(s))
- `setSendOpen` (3 edge(s))
- `useState` (2 edge(s))
- `RefreshCw` (2 edge(s))
- `Plus` (2 edge(s))
- `String` (2 edge(s))
- `floor` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))
- `filter` (1 edge(s))
- `reduce` (1 edge(s))
- `/root/yvon/components/ui.tsx::PageHeader` (1 edge(s))
- `refetch` (1 edge(s))
- `ExternalLink` (1 edge(s))

### Incoming

- `/root/yvon/app/newsletter/page.tsx` (5 edge(s))
