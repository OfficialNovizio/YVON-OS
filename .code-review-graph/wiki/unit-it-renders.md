# unit-it:renders

## Overview

Directory-based community: tests/unit

- **Size**: 46 nodes
- **Cohesion**: 0.0873
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| describe:Agent Personalities@L9 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 9-105 |
| it:should have exactly 13 agents@L10 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 10-12 |
| it:every agent should have a valid personality object@L14 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 14-28 |
| it:every agent personality should be at least 100 characters (meaningful)@L30 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 30-34 |
| it:all shortIds should be unique@L36 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 36-39 |
| it:all agentIds should be unique@L41 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 41-44 |
| it:all names should be unique@L46 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 46-49 |
| describe:agents by department@L51 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 51-72 |
| it:should have all 4 departments covered@L59 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 59-64 |
| it:all expected shortIds should be present@L66 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 66-71 |
| describe:getAgentPersonality@L74 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 74-92 |
| it:should find agent by shortId@L75 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 75-80 |
| it:should find agent by full agentId@L82 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 82-87 |
| it:should return undefined for unknown agent@L89 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 89-91 |
| describe:getPersonalityExtension@L94 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 94-104 |
| it:should return a formatted personality string@L95 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 95-99 |
| it:should return empty string for unknown agent@L101 | Test | /root/yvon/tests/unit/agent-personalities.test.ts | 101-103 |
| describe:Card@L5 | Test | /root/yvon/tests/unit/ui.test.tsx | 5-34 |
| it:renders children@L6 | Test | /root/yvon/tests/unit/ui.test.tsx | 6-9 |
| it:applies custom className@L11 | Test | /root/yvon/tests/unit/ui.test.tsx | 11-15 |
| it:renders with glass-card class@L17 | Test | /root/yvon/tests/unit/ui.test.tsx | 17-21 |
| it:adds glass-card-hover when hover prop is true@L23 | Test | /root/yvon/tests/unit/ui.test.tsx | 23-27 |
| it:does not add glass-card-hover when hover is not set@L29 | Test | /root/yvon/tests/unit/ui.test.tsx | 29-33 |
| describe:StatusBadge@L36 | Test | /root/yvon/tests/unit/ui.test.tsx | 36-54 |
| it:renders children text@L37 | Test | /root/yvon/tests/unit/ui.test.tsx | 37-40 |
| it:renders with tone "${tone}" without error@L47 | Test | /root/yvon/tests/unit/ui.test.tsx | 47-52 |
| describe:Chip@L56 | Test | /root/yvon/tests/unit/ui.test.tsx | 56-79 |
| it:renders children text@L57 | Test | /root/yvon/tests/unit/ui.test.tsx | 57-60 |
| it:renders with chip class@L62 | Test | /root/yvon/tests/unit/ui.test.tsx | 62-66 |
| it:applies accent class when accent prop is true@L68 | Test | /root/yvon/tests/unit/ui.test.tsx | 68-72 |
| it:applies custom className@L74 | Test | /root/yvon/tests/unit/ui.test.tsx | 74-78 |
| describe:PageHeader@L81 | Test | /root/yvon/tests/unit/ui.test.tsx | 81-116 |
| it:renders title@L82 | Test | /root/yvon/tests/unit/ui.test.tsx | 82-85 |
| it:renders subtitle when provided@L87 | Test | /root/yvon/tests/unit/ui.test.tsx | 87-90 |
| it:does not render subtitle element when not provided@L92 | Test | /root/yvon/tests/unit/ui.test.tsx | 92-98 |
| it:renders actions when provided@L100 | Test | /root/yvon/tests/unit/ui.test.tsx | 100-108 |
| it:uses h1 tag for title@L110 | Test | /root/yvon/tests/unit/ui.test.tsx | 110-115 |
| describe:WorkspaceContext@L6 | Test | /root/yvon/tests/unit/workspace.test.tsx | 6-100 |
| beforeEach@L7 | Test | /root/yvon/tests/unit/workspace.test.tsx | 7-10 |
| it:provides default workspace (Novizio)@L12 | Test | /root/yvon/tests/unit/workspace.test.tsx | 12-18 |
| it:switches workspace to Hourbour@L20 | Test | /root/yvon/tests/unit/workspace.test.tsx | 20-31 |
| it:switches workspace back to Novizio@L33 | Test | /root/yvon/tests/unit/workspace.test.tsx | 33-49 |
| it:persists workspace selection to localStorage@L51 | Test | /root/yvon/tests/unit/workspace.test.tsx | 51-62 |
| it:sets workspace-specific data attribute on container@L64 | Test | /root/yvon/tests/unit/workspace.test.tsx | 64-77 |
| it:workspace object has expected shape@L79 | Test | /root/yvon/tests/unit/workspace.test.tsx | 79-92 |
| it:throws error when used outside WorkspaceProvider@L94 | Test | /root/yvon/tests/unit/workspace.test.tsx | 94-99 |

## Execution Flows

No execution flows pass through this community.

## Dependencies

### Outgoing

- `expect` (64 edge(s))
- `toBe` (26 edge(s))
- `render` (16 edge(s))
- `toContain` (11 edge(s))
- `toBeDefined` (9 edge(s))
- `renderHook` (7 edge(s))
- `/root/yvon/lib/WorkspaceContext.tsx::useWorkspace` (7 edge(s))
- `getByText` (6 edge(s))
- `/root/yvon/lib/WorkspaceContext.tsx::WorkspaceProvider` (6 edge(s))
- `toBeTruthy` (5 edge(s))
- `toHaveLength` (5 edge(s))
- `/root/yvon/components/ui.tsx::Card` (5 edge(s))
- `/root/yvon/components/ui.tsx::PageHeader` (5 edge(s))
- `act` (5 edge(s))
- `setWorkspace` (5 edge(s))

### Incoming

- `expect` (64 edge(s))
- `toBe` (26 edge(s))
- `render` (16 edge(s))
- `toContain` (11 edge(s))
- `toBeDefined` (9 edge(s))
- `renderHook` (7 edge(s))
- `/root/yvon/lib/WorkspaceContext.tsx::useWorkspace` (7 edge(s))
- `getByText` (6 edge(s))
- `toBeTruthy` (5 edge(s))
- `toHaveLength` (5 edge(s))
- `/root/yvon/components/ui.tsx::Card` (5 edge(s))
- `/root/yvon/components/ui.tsx::PageHeader` (5 edge(s))
- `act` (5 edge(s))
- `setWorkspace` (5 edge(s))
- `toHaveProperty` (5 edge(s))
