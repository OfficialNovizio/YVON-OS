# venture-toggle

## Overview

Directory-based community: app/settings

- **Size**: 43 nodes
- **Cohesion**: 0.0791
- **Dominant Language**: tsx

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| DashboardSettingsPage | Function | /root/yvon/app/settings/dashboard/page.tsx | 11-197 |
| r | Function | /root/yvon/app/settings/dashboard/page.tsx | 32-32 |
| toggleSetting | Function | /root/yvon/app/settings/dashboard/page.tsx | 40-52 |
| load | Function | /root/yvon/app/settings/page.tsx | 24-26 |
| save | Function | /root/yvon/app/settings/page.tsx | 27-27 |
| SettingsPage | Function | /root/yvon/app/settings/page.tsx | 29-173 |
| toggle | Function | /root/yvon/app/settings/page.tsx | 69-76 |
| DeploymentTab | Function | /root/yvon/app/settings/venture/_deployment.tsx | 54-286 |
| dp | Function | /root/yvon/app/settings/venture/_deployment.tsx | 63-87 |
| pid | Function | /root/yvon/app/settings/venture/_deployment.tsx | 93-273 |
| p | Function | /root/yvon/app/settings/venture/_deployment.tsx | 94-94 |
| e | Function | /root/yvon/app/settings/venture/_deployment.tsx | 193-193 |
| ChipToggle | Function | /root/yvon/app/settings/venture/_general.tsx | 100-110 |
| ProductTreeView | Function | /root/yvon/app/settings/venture/_general.tsx | 115-254 |
| toggleCategory | Function | /root/yvon/app/settings/venture/_general.tsx | 129-136 |
| c | Function | /root/yvon/app/settings/venture/_general.tsx | 237-237 |
| toggleSub | Function | /root/yvon/app/settings/venture/_general.tsx | 138-146 |
| s | Function | /root/yvon/app/settings/venture/_general.tsx | 394-394 |
| addCustomSub | Function | /root/yvon/app/settings/venture/_general.tsx | 148-158 |
| addCustomCategory | Function | /root/yvon/app/settings/venture/_general.tsx | 160-164 |
| sub | Function | /root/yvon/app/settings/venture/_general.tsx | 222-227 |
| t | Function | /root/yvon/app/settings/venture/_general.tsx | 235-235 |
| cat | Function | /root/yvon/app/settings/venture/_general.tsx | 235-246 |
| GeneralTab | Function | /root/yvon/app/settings/venture/_general.tsx | 284-434 |
| e | Function | /root/yvon/app/settings/venture/_general.tsx | 332-332 |
| g | Function | /root/yvon/app/settings/venture/_general.tsx | 400-400 |
| p | Function | /root/yvon/app/settings/venture/_general.tsx | 394-394 |
| x | Function | /root/yvon/app/settings/venture/_general.tsx | 394-394 |
| SocialTab | Function | /root/yvon/app/settings/venture/_social.tsx | 41-65 |
| p | Function | /root/yvon/app/settings/venture/_social.tsx | 44-62 |
| s | Function | /root/yvon/app/settings/venture/_social.tsx | 45-45 |
| TechnicalTab | Function | /root/yvon/app/settings/venture/_technical.tsx | 26-98 |
| e | Function | /root/yvon/app/settings/venture/_technical.tsx | 91-91 |
| SubTabs | Function | /root/yvon/app/settings/venture/page.tsx | 55-69 |
| VentureSettingsPage | Function | /root/yvon/app/settings/venture/page.tsx | 74-287 |
| r | Function | /root/yvon/app/settings/venture/page.tsx | 131-131 |
| v | Function | /root/yvon/app/settings/venture/page.tsx | 114-114 |
| addSocial | Function | /root/yvon/app/settings/venture/page.tsx | 169-179 |
| p | Function | /root/yvon/app/settings/venture/page.tsx | 191-191 |
| s | Function | /root/yvon/app/settings/venture/page.tsx | 186-186 |
| removeSocial | Function | /root/yvon/app/settings/venture/page.tsx | 180-188 |
| toggleDeployment | Function | /root/yvon/app/settings/venture/page.tsx | 190-192 |
| x | Function | /root/yvon/app/settings/venture/page.tsx | 191-191 |

## Execution Flows

- **VentureSettingsPage** (criticality: 0.68, depth: 3)
- **SettingsPage** (criticality: 0.51, depth: 1)

## Dependencies

### Outgoing

- `useState` (36 edge(s))
- `map` (20 edge(s))
- `/root/yvon/components/ui.tsx::Card` (20 edge(s))
- `/root/yvon/components/ui.tsx::StatusBadge` (14 edge(s))
- `filter` (11 edge(s))
- `fetch` (10 edge(s))
- `includes` (10 edge(s))
- `onChange` (9 edge(s))
- `toFixed` (8 edge(s))
- `json` (7 edge(s))
- `useCallback` (6 edge(s))
- `then` (6 edge(s))
- `find` (6 edge(s))
- `Link` (5 edge(s))
- `useEffect` (4 edge(s))

### Incoming

- `/root/yvon/app/settings/venture/_general.tsx` (36 edge(s))
- `/root/yvon/app/settings/venture/page.tsx` (15 edge(s))
- `/root/yvon/app/settings/venture/_deployment.tsx` (5 edge(s))
- `/root/yvon/app/settings/page.tsx` (4 edge(s))
- `/root/yvon/app/settings/dashboard/page.tsx` (3 edge(s))
- `/root/yvon/app/settings/venture/_social.tsx` (3 edge(s))
- `/root/yvon/app/settings/venture/_technical.tsx` (3 edge(s))
