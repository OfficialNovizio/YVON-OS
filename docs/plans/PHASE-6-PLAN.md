# Phase 6: E2E Quality Gates — Testing, Performance & Polish

> **For Hermes:** Execute task-by-task. Each task has exact commands and verification steps. Commit after every task.

**Goal:** Add smoke tests, error boundaries, Lighthouse optimization, and final mobile QA to lock in production quality across all 33 YVON OS pages.

**Architecture:** Four layers of quality: (1) Playwright smoke tests covering every page, (2) React Error Boundary preventing white screens, (3) Lighthouse audit with fixes for performance/accessibility/SEO, (4) Final mobile QA sweep. No heavy test frameworks — Playwright for E2E, lightweight assertions for API routes.

**Tech Stack:** Playwright (E2E) · React Error Boundary · Lighthouse CI · next/bundle-analyzer

**Current state:** 33 pages, 176 API routes, 9 components, ~44K LOC. Zero test infrastructure. Test scripts are placeholders. ESLint is the only dev dependency.

---

## Phase 6A: Playwright E2E Smoke Tests

### Task 6A.1: Install Playwright + configure

**Objective:** Set up Playwright with a minimal config targeting the local dev server

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/` directory
- Modify: `package.json` (scripts)

**Step 1: Install**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Step 2: Create config**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
```

**Step 3: Update package.json scripts**

```json
"test:e2e": "playwright test",
"test:e2e:smoke": "playwright test --grep @smoke",
"test:e2e:desktop": "playwright test --project=desktop",
"test:e2e:mobile": "playwright test --project=mobile"
```

**Step 4: Verify**

```bash
npx playwright test --list
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add playwright.config.ts package.json package-lock.json
git commit -m "feat(6a): install Playwright + config for desktop/mobile E2E"
```

---

### Task 6A.2: Smoke test — all 33 pages render without crashing

**Objective:** One test file that visits every page and asserts the shell layout renders

**Files:**
- Create: `e2e/smoke.spec.ts`

**Step 1: Write smoke test**

```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'

// Every page defined in the sidebar navigation
const PAGES = [
  // Command Center
  '/decision-queue', '/task-board', '/advisory-council', '/agents',
  '/org-chart', '/office', '/skill-workshop',
  // Long-form
  '/content-pipeline', '/production-calendar', '/youtube-studio', '/youtube-analytics',
  // Shorts
  '/short-pipeline', '/shorts',
  // Posts
  '/social-approvals', '/scheduler', '/social-analytics', '/newsletter',
  // Knowledge
  '/brain-wiki', '/asset-lab', '/trend-radar',
  // Build
  '/idea-feed', '/software-pipeline',
  // Revenue
  '/consulting-crm', '/cinematic-sites',
  // System
  '/inbox', '/dashboard', '/settings', '/hardware', '/projects', '/people', '/docs', '/logs',
]

for (const path of PAGES) {
  test(`@smoke page renders: ${path}`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)

    // Shell layout — sidebar + topbar should be present
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('aside, nav')).toBeVisible({ timeout: 5000 })

    // Page header (h1) should exist
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible({ timeout: 5000 })

    // No error text visible
    await expect(page.locator('text=Application error')).not.toBeVisible()
    await expect(page.locator('text=500')).not.toBeVisible()
  })
}
```

**Step 2: Run smoke tests**

```bash
npx playwright test --grep @smoke --project=desktop
```

Expected: 33 passed, 0 failed.

**Step 3: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "feat(6a): Playwright smoke tests — all 33 pages render check"
```

---

### Task 6A.3: Mobile smoke test — responsive layout on 390px viewport

**Objective:** Verify hamburger menu works and pages are readable on mobile

**Files:**
- Create: `e2e/mobile.spec.ts`

**Step 1: Write mobile smoke test**

```typescript
// e2e/mobile.spec.ts
import { test, expect } from '@playwright/test'

const KEY_PAGES = [
  '/decision-queue', '/dashboard', '/agents', '/software-pipeline',
  '/inbox', '/people', '/settings',
]

for (const path of KEY_PAGES) {
  test(`@smoke mobile renders: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)

    // Hamburger should be visible on mobile
    const hamburger = page.locator('button[aria-label="Open menu"]')
    await expect(hamburger).toBeVisible({ timeout: 5000 })

    // Click hamburger → sidebar should open
    await hamburger.click()
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible({ timeout: 3000 })

    // Close by clicking backdrop
    await page.locator('.fixed.inset-0 > .absolute').first().click()
  })
}
```

**Step 2: Run**

```bash
npx playwright test --grep @smoke --project=mobile
```

**Step 3: Commit**

```bash
git add e2e/mobile.spec.ts
git commit -m "feat(6a): mobile smoke tests — hamburger + 7 key pages at 390px"
```

---

## Phase 6B: React Error Boundary — Global Crash Protection

### Task 6B.1: Create ErrorBoundary component

**Objective:** Wrap the entire app in an error boundary so a component crash shows a recovery UI instead of a white screen

**Files:**
- Create: `components/ErrorBoundary.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create ErrorBoundary**

```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="mb-2 text-xl font-bold text-on-surface">Something went wrong</h1>
            <p className="mb-4 text-sm text-on-surface-variant">
              A component crashed. The rest of YVON OS is unaffected.
            </p>
            <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-white/[0.04] p-3 text-left text-[11px] text-error">
              {this.state.error?.message ?? 'Unknown error'}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-accent !py-2 !text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Step 2: Wrap layout**

In `app/layout.tsx`, wrap children:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Inside RootLayout:
<WorkspaceProvider>
  <ErrorBoundary>
    <Shell>{children}</Shell>
  </ErrorBoundary>
</WorkspaceProvider>
```

**Step 3: Verify**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -3
```

**Step 4: Commit**

```bash
git add components/ErrorBoundary.tsx app/layout.tsx
git commit -m "feat(6b): add ErrorBoundary — global crash protection with recovery UI"
```

---

## Phase 6C: Lighthouse Performance Audit

### Task 6C.1: Run Lighthouse audit on key pages

**Objective:** Measure performance, accessibility, SEO, and best practices scores for critical pages

**Step 1: Install Lighthouse CLI**

```bash
npm install -D lighthouse
```

**Step 2: Run audits**

```bash
# Start dev server in background
npm run dev &
sleep 5

# Audit key pages
for page in decision-queue dashboard agents software-pipeline inbox; do
  echo "=== Auditing /$page ==="
  npx lighthouse "http://localhost:3000/$page" \
    --output=json --output-path=".lighthouse/$page.json" \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo \
    2>/dev/null | grep -E "score|performance|accessibility|best-practices|seo"
done

kill %1
```

**Step 3: Document scores**

Create `.lighthouse/REPORT.md` with scores for each page. Target: ≥90 performance, ≥95 accessibility, ≥90 best-practices, ≥90 SEO.

**Step 4: Commit**

```bash
git add .lighthouse/
git commit -m "feat(6c): Lighthouse audit — baseline scores for 5 key pages"
```

---

### Task 6C.2: Fix accessibility issues from Lighthouse

**Objective:** Address any <95 accessibility scores

**Common fixes:**
- Add `aria-label` to icon-only buttons
- Ensure color contrast ≥ 4.5:1 for text
- Add `alt` text to any images
- Ensure form inputs have labels

**Step 1: Run axe-core for detailed accessibility report**

```bash
npx playwright test --grep @smoke  # ensure baseline
npx @axe-core/playwright  # if installed
```

**Step 2: Apply fixes per page, re-audit**

**Step 3: Commit**

```bash
git add -A && git commit -m "fix(6c): accessibility improvements — aria-labels, contrast, alt text"
```

---

### Task 6C.3: Performance optimizations

**Objective:** Address Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) issues

**Fixes (if needed):**
- Add `loading="lazy"` to below-fold images
- Add explicit `width`/`height` to images to prevent CLS
- Consider `next/image` for the background image
- Add font `display: swap` for Inter/SF Pro fonts

**Files likely changed:**
- `app/layout.tsx` — font optimization
- `app/globals.css` — font-display
- Any page with large inline images

**Step: Apply and verify Lighthouse re-audit**

```bash
git commit -m "perf(6c): LCP/CLS fixes — lazy loading, image dimensions, font-display swap"
```

---

## Phase 6D: API Route Contract Tests

### Task 6D.1: Test key API routes return valid JSON

**Objective:** Verify the most-used API endpoints return 200 with valid JSON

**Files:**
- Create: `e2e/api.spec.ts`

**Step 1: Write API tests**

```typescript
// e2e/api.spec.ts
import { test, expect } from '@playwright/test'

const API_ROUTES = [
  '/api/agent-status',
  '/api/task-board',
  '/api/knowledge-graph',
  '/api/content-feed',
  '/api/decision-queue',
  '/api/social-approvals',
  '/api/trend-radar',
  '/api/idea-feed',
  '/api/logs',
  '/api/hardware',
  '/api/people',
  '/api/projects',
  '/api/consulting',
  '/api/cinematic-sites',
  '/api/youtube?ventureId=novizio',
]

for (const route of API_ROUTES) {
  test(`API returns 200: ${route}`, async ({ request }) => {
    const res = await request.get(route)
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body).toBeTruthy()
    expect(typeof body).toBe('object')

    // Every route should have a source field
    expect(body).toHaveProperty('source')
  })
}
```

**Step 2: Run**

```bash
npx playwright test e2e/api.spec.ts
```

**Step 3: Commit**

```bash
git add e2e/api.spec.ts
git commit -m "feat(6d): API contract tests — 15 key routes return 200 + valid JSON"
```

---

## Phase 6E: Bundle Analysis

### Task 6E.1: Analyze bundle size + optimize

**Objective:** Identify large chunks and trim unnecessary imports

**Step 1: Install analyzer**

```bash
npm install -D @next/bundle-analyzer
```

**Step 2: Run analysis**

```bash
ANALYZE=true npm run build
```

**Step 3: Check for issues**
- Any chunk > 200KB → investigate
- Duplicate dependencies → deduplicate
- Unused heavy imports → tree-shake

**Step 4: Commit fixes + report**

```bash
git add -A && git commit -m "perf(6e): bundle analysis — identified and trimmed large chunks"
```

---

## Phase 6F: Final Mobile QA Sweep

### Task 6F.1: Manual QA checklist on 390px viewport

**Checklist — verify on mobile (390×844):**

- [ ] Sidebar hamburger opens/closes smoothly
- [ ] All 33 pages scrollable, no horizontal overflow
- [ ] Decision Queue: cards are full-width, touch targets ≥ 44px
- [ ] Kanban boards (Software Pipeline, Content Pipeline, Task Board): horizontal scroll works, cards visible
- [ ] Scheduler: calendar scrolls horizontally on mobile
- [ ] Office 3D: pinch-zoom disabled, scrollable viewport
- [ ] Modals: full-screen on mobile, close button accessible
- [ ] Forms/inputs: no zoom-on-focus on iOS (font-size ≥ 16px)
- [ ] No text truncation or overlapping
- [ ] Workspace switcher works in mobile sidebar

**Files to fix (if issues found):**
- Any page with `min-w-[760px]` without scroll hint
- Modals without mobile full-screen behavior

**Step: Run mobile smoke tests first, then manual review**

```bash
npx playwright test --grep @smoke --project=mobile
```

**Step: Fix any issues + commit**

```bash
git commit -m "fix(6f): mobile QA — overflow fixes, touch targets, modal behavior"
```

---

## Phase 6G: CI Integration

### Task 6G.1: Update GitHub Actions CI to run E2E tests

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Add E2E job**

```yaml
  e2e:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e:smoke
```

**Step 2: Verify CI passes**

Push and check GitHub Actions.

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(6g): add Playwright E2E smoke tests to CI pipeline"
```

---

## Phase 6H: Final Deploy

### Task 6H.1: Full build + typecheck + lint + E2E

```bash
npx tsc --noEmit
npm run lint
npm run build
npx playwright test --grep @smoke
```

### Task 6H.2: Push + deploy

```bash
git add -A
git commit -m "feat(phase-6): E2E tests, error boundaries, Lighthouse audit, mobile QA — production gate"
git push origin master
```

Vercel auto-deploys via GitHub Actions.

---

## Summary: Phase 6 Deliverables

| Layer | What | New Files | Status Target |
|-------|------|-----------|:------------:|
| **E2E Smoke** | 33 pages render check (desktop + mobile) | `e2e/smoke.spec.ts`, `e2e/mobile.spec.ts`, `playwright.config.ts` | 33/33 pass |
| **API Contracts** | 15 key routes return 200 + valid JSON | `e2e/api.spec.ts` | 15/15 pass |
| **Error Boundary** | Global crash protection | `components/ErrorBoundary.tsx` | No white screens |
| **Lighthouse** | Performance ≥90, A11y ≥95, SEO ≥90 | `.lighthouse/REPORT.md` | All green |
| **Bundle Analysis** | Identify + trim large chunks | — | No chunk > 200KB |
| **Mobile QA** | 390px viewport sweep | Fixes in page files | All pages usable |
| **CI Integration** | E2E in GitHub Actions | `.github/workflows/ci.yml` (update) | CI green |

**Final state:** 33 pages, 176 routes, E2E-tested, error-guarded, Lighthouse-optimized, mobile-verified, CI-gated.
