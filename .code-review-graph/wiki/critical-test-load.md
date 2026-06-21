# critical-test:load

## Overview

Directory-based community: tests/critical

- **Size**: 13 nodes
- **Cohesion**: 0.0422
- **Dominant Language**: typescript

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| describe:Decision Queue@L3 | Test | /root/yvon/tests/critical/decision-queue.spec.ts | 3-69 |
| test:load decision queue page@L4 | Test | /root/yvon/tests/critical/decision-queue.spec.ts | 4-8 |
| test:verify decision items render@L10 | Test | /root/yvon/tests/critical/decision-queue.spec.ts | 10-29 |
| test:test filter functionality@L31 | Test | /root/yvon/tests/critical/decision-queue.spec.ts | 31-51 |
| test:test clear-my-queue mode@L53 | Test | /root/yvon/tests/critical/decision-queue.spec.ts | 53-68 |
| describe:Settings Page@L3 | Test | /root/yvon/tests/critical/settings.spec.ts | 3-55 |
| test:load settings page@L4 | Test | /root/yvon/tests/critical/settings.spec.ts | 4-8 |
| test:verify settings cards visible@L10 | Test | /root/yvon/tests/critical/settings.spec.ts | 10-24 |
| test:click venture settings card and verify sub-page@L26 | Test | /root/yvon/tests/critical/settings.spec.ts | 26-54 |
| describe:Venture Switching@L3 | Test | /root/yvon/tests/critical/venture.spec.ts | 3-57 |
| test:load dashboard@L4 | Test | /root/yvon/tests/critical/venture.spec.ts | 4-9 |
| test:switch venture and verify accent color change@L11 | Test | /root/yvon/tests/critical/venture.spec.ts | 11-44 |
| test:verify venture-specific data loads after switch@L46 | Test | /root/yvon/tests/critical/venture.spec.ts | 46-56 |

## Execution Flows

No execution flows pass through this community.

## Dependencies

### Outgoing

- `expect` (19 edge(s))
- `locator` (18 edge(s))
- `goto` (11 edge(s))
- `toBeVisible` (9 edge(s))
- `catch` (9 edge(s))
- `first` (8 edge(s))
- `isVisible` (6 edge(s))
- `click` (6 edge(s))
- `toHaveURL` (5 edge(s))
- `count` (3 edge(s))
- `toBeGreaterThanOrEqual` (3 edge(s))
- `waitForTimeout` (2 edge(s))
- `evaluate` (2 edge(s))
- `getComputedStyle` (2 edge(s))
- `trim` (2 edge(s))

### Incoming

- `expect` (19 edge(s))
- `locator` (18 edge(s))
- `goto` (11 edge(s))
- `toBeVisible` (9 edge(s))
- `catch` (9 edge(s))
- `first` (8 edge(s))
- `isVisible` (6 edge(s))
- `click` (6 edge(s))
- `toHaveURL` (5 edge(s))
- `count` (3 edge(s))
- `toBeGreaterThanOrEqual` (3 edge(s))
- `waitForTimeout` (2 edge(s))
- `evaluate` (2 edge(s))
- `getComputedStyle` (2 edge(s))
- `trim` (2 edge(s))
