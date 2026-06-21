# shorts-handle

## Overview

Directory-based community: app/shorts

- **Size**: 10 nodes
- **Cohesion**: 0.0746
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| getPlatform | Function | /root/yvon/app/shorts/page.tsx | 196-198 |
| statusTone | Function | /root/yvon/app/shorts/page.tsx | 200-204 |
| statusLabel | Function | /root/yvon/app/shorts/page.tsx | 206-210 |
| ShortsPage | Function | /root/yvon/app/shorts/page.tsx | 214-515 |
| handleDragOver | Function | /root/yvon/app/shorts/page.tsx | 234-237 |
| handleDragLeave | Function | /root/yvon/app/shorts/page.tsx | 239-242 |
| handleDrop | Function | /root/yvon/app/shorts/page.tsx | 244-249 |
| handleFileInput | Function | /root/yvon/app/shorts/page.tsx | 251-254 |
| handleFile | Function | /root/yvon/app/shorts/page.tsx | 256-264 |
| clearFile | Function | /root/yvon/app/shorts/page.tsx | 266-269 |

## Execution Flows

- **ShortsPage** (criticality: 0.51, depth: 1)

## Dependencies

### Outgoing

- `useState` (4 edge(s))
- `filter` (3 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (3 edge(s))
- `/root/yvon/components/ui.tsx::Card` (3 edge(s))
- `FileVideo` (3 edge(s))
- `map` (3 edge(s))
- `Link` (3 edge(s))
- `preventDefault` (3 edge(s))
- `setIsDragging` (3 edge(s))
- `setCards` (2 edge(s))
- `setActivePlatform` (2 edge(s))
- `Play` (2 edge(s))
- `CalendarClock` (2 edge(s))
- `setDroppedFile` (2 edge(s))
- `/root/yvon/lib/use-live-data.ts::useLiveData` (1 edge(s))

### Incoming

- `/root/yvon/app/shorts/page.tsx` (10 edge(s))
