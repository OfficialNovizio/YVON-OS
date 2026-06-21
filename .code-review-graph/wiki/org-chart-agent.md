# org-chart-agent

## Overview

Directory-based community: app/org-chart

- **Size**: 7 nodes
- **Cohesion**: 0.0417
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| AgentActionSheet | Function | /root/yvon/app/org-chart/_AgentActionSheet.tsx | 38-189 |
| handleClose | Function | /root/yvon/app/org-chart/_AgentActionSheet.tsx | 62-74 |
| OrgChartNodeCard | Function | /root/yvon/app/org-chart/_OrgChartNodeCard.tsx | 35-225 |
| MOCK_AGENT | Function | /root/yvon/app/org-chart/page.tsx | 16-22 |
| OrgChartPage | Function | /root/yvon/app/org-chart/page.tsx | 91-253 |
| countTree | Function | /root/yvon/app/org-chart/page.tsx | 131-133 |
| ws | Function | /root/yvon/app/org-chart/page.tsx | 212-241 |

## Execution Flows

- **OrgChartPage** (criticality: 0.66, depth: 1)

## Dependencies

### Outgoing

- `to` (8 edge(s))
- `useRef` (7 edge(s))
- `useEffect` (5 edge(s))
- `fromTo` (5 edge(s))
- `slice` (5 edge(s))
- `Link` (5 edge(s))
- `useCallback` (3 edge(s))
- `setExpanded` (3 edge(s))
- `map` (3 edge(s))
- `useState` (2 edge(s))
- `toUpperCase` (2 edge(s))
- `/root/yvon/components/ui.tsx::PageHeader` (2 edge(s))
- `X` (1 edge(s))
- `MessageSquare` (1 edge(s))
- `Wrench` (1 edge(s))

### Incoming

- `/root/yvon/app/org-chart/page.tsx` (27 edge(s))
- `/root/yvon/app/org-chart/_AgentActionSheet.tsx` (2 edge(s))
- `/root/yvon/app/org-chart/_OrgChartNodeCard.tsx` (1 edge(s))
