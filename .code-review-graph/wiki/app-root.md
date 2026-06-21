# app-root

## Overview

Directory-based community: app

- **Size**: 2 nodes
- **Cohesion**: 0.0000
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| RootLayout | Function | /root/yvon/app/layout.tsx | 14-28 |
| Home | Function | /root/yvon/app/page.tsx | 3-5 |

## Execution Flows

- **RootLayout** (criticality: 0.68, depth: 3)

## Dependencies

### Outgoing

- `/root/yvon/lib/WorkspaceContext.tsx::WorkspaceProvider` (1 edge(s))
- `/root/yvon/components/ErrorBoundary.tsx::ErrorBoundary` (1 edge(s))
- `/root/yvon/components/Shell.tsx::Shell` (1 edge(s))
- `Analytics` (1 edge(s))
- `SpeedInsights` (1 edge(s))
- `redirect` (1 edge(s))

### Incoming

- `/root/yvon/app/layout.tsx` (1 edge(s))
- `/root/yvon/app/page.tsx` (1 edge(s))
