# components-handle

## Overview

Directory-based community: components

- **Size**: 34 nodes
- **Cohesion**: 0.0347
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| ErrorBoundary | Class | /root/yvon/components/ErrorBoundary.tsx | 15-58 |
| getDerivedStateFromError | Function | /root/yvon/components/ErrorBoundary.tsx | 18-20 |
| render | Function | /root/yvon/components/ErrorBoundary.tsx | 22-57 |
| Icon | Function | /root/yvon/components/Icon.tsx | 6-9 |
| getVentureAccent | Function | /root/yvon/components/KaisRead.tsx | 9-19 |
| KaisRead | Function | /root/yvon/components/KaisRead.tsx | 38-274 |
| r | Function | /root/yvon/components/KaisRead.tsx | 60-60 |
| confidenceColor | Function | /root/yvon/components/KaisRead.tsx | 133-134 |
| item | Function | /root/yvon/components/KaisRead.tsx | 221-230 |
| Modal | Function | /root/yvon/components/Modal.tsx | 6-45 |
| Drawer | Function | /root/yvon/components/Modal.tsx | 47-76 |
| Placeholder | Function | /root/yvon/components/Placeholder.tsx | 4-53 |
| useShell | Function | /root/yvon/components/Shell.tsx | 24-26 |
| Shell | Function | /root/yvon/components/Shell.tsx | 29-110 |
| close | Function | /root/yvon/components/Shell.tsx | 40-40 |
| isActive | Function | /root/yvon/components/Sidebar.tsx | 107-110 |
| Sidebar | Function | /root/yvon/components/Sidebar.tsx | 113-331 |
| handleClick | Function | /root/yvon/components/Sidebar.tsx | 122-126 |
| loadCounts | Function | /root/yvon/components/Sidebar.tsx | 140-176 |
| getBadge | Function | /root/yvon/components/Sidebar.tsx | 183-186 |
| handleNav | Function | /root/yvon/components/Sidebar.tsx | 188-190 |
| useBreadcrumb | Function | /root/yvon/components/TopBar.tsx | 65-71 |
| TopBar | Function | /root/yvon/components/TopBar.tsx | 74-325 |
| handler | Function | /root/yvon/components/TopBar.tsx | 127-131 |
| handleKeyDown | Function | /root/yvon/components/TopBar.tsx | 156-183 |
| WorkspaceSwitcher | Function | /root/yvon/components/WorkspaceSwitcher.tsx | 21-127 |
| Card | Function | /root/yvon/components/ui.tsx | 4-16 |
| Chip | Function | /root/yvon/components/ui.tsx | 18-28 |
| StatusBadge | Function | /root/yvon/components/ui.tsx | 30-43 |
| PageHeader | Function | /root/yvon/components/ui.tsx | 45-63 |
| SectionLabel | Function | /root/yvon/components/ui.tsx | 65-71 |
| Avatar | Function | /root/yvon/components/ui.tsx | 73-82 |
| Shimmer | Function | /root/yvon/components/ui.tsx | 84-88 |
| ShimmerText | Function | /root/yvon/components/ui.tsx | 90-97 |

## Execution Flows

- **RootLayout** (criticality: 0.68, depth: 3)
- **VentureSettingsPage** (criticality: 0.68, depth: 3)
- **OrgChartPage** (criticality: 0.66, depth: 1)
- **NewsletterPage** (criticality: 0.61, depth: 1)
- **CinematicSitesPage** (criticality: 0.59, depth: 2)
- **ContentPipelinePage** (criticality: 0.59, depth: 2)
- **DashboardPage** (criticality: 0.59, depth: 2)
- **DocsPage** (criticality: 0.59, depth: 2)
- **SoftwarePipelinePage** (criticality: 0.59, depth: 2)
- **AssetLabPage** (criticality: 0.58, depth: 1)
- *... and 25 more flows.*

## Dependencies

### Outgoing

- `useState` (14 edge(s))
- `map` (9 edge(s))
- `useEffect` (8 edge(s))
- `push` (5 edge(s))
- `setMobileMenuOpen` (5 edge(s))
- `trim` (5 edge(s))
- `setActiveIndex` (5 edge(s))
- `preventDefault` (5 edge(s))
- `clsx` (5 edge(s))
- `fetch` (4 edge(s))
- `json` (4 edge(s))
- `addEventListener` (4 edge(s))
- `removeEventListener` (4 edge(s))
- `useCallback` (4 edge(s))
- `closePalette` (4 edge(s))

### Incoming

- `/root/yvon/app/decision-queue/page.tsx::DecisionQueuePage` (22 edge(s))
- `/root/yvon/app/people/page.tsx::PeoplePage` (17 edge(s))
- `/root/yvon/app/settings/page.tsx::SettingsPage` (15 edge(s))
- `/root/yvon/app/projects/page.tsx::ProjectsPage` (14 edge(s))
- `/root/yvon/app/settings/venture/_technical.tsx::TechnicalTab` (14 edge(s))
- `/root/yvon/app/trend-radar/page.tsx::TrendRadarPage` (14 edge(s))
- `/root/yvon/app/inbox/page.tsx::InboxPage` (13 edge(s))
- `/root/yvon/app/newsletter/page.tsx::NewsletterPage` (13 edge(s))
- `/root/yvon/app/logs/page.tsx::LogsPage` (13 edge(s))
- `/root/yvon/app/advisory-council/page.tsx::AdvisoryCouncilPage` (13 edge(s))
- `/root/yvon/app/dashboard/page.tsx::DashboardPage` (11 edge(s))
- `/root/yvon/app/production-calendar/page.tsx::ProductionCalendarPage` (11 edge(s))
- `/root/yvon/app/brain-wiki/page.tsx::BrainWikiPage` (11 edge(s))
- `/root/yvon/app/idea-feed/page.tsx::IdeaFeedPage` (10 edge(s))
- `/root/yvon/app/social-approvals/page.tsx::SocialApprovalsPage` (10 edge(s))
