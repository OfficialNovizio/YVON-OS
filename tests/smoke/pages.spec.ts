import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/dashboard',
  '/decision-queue',
  '/task-board',
  '/advisory-council',
  '/agents',
  '/org-chart',
  '/office',
  '/skill-workshop',
  '/content-pipeline',
  '/production-calendar',
  '/youtube-studio',
  '/youtube-analytics',
  '/short-pipeline',
  '/shorts',
  '/social-approvals',
  '/scheduler',
  '/social-analytics',
  '/newsletter',
  '/brain-wiki',
  '/asset-lab',
  '/trend-radar',
  '/idea-feed',
  '/software-pipeline',
  '/consulting-crm',
  '/cinematic-sites',
  '/inbox',
  '/hardware',
  '/settings',
  '/settings/venture',
  '/people',
  '/projects',
  '/docs',
  '/logs',
];

for (const path of pages) {
  test(`page loads: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const response = await page.goto(path, { waitUntil: 'networkidle' });

    // Verify HTTP 200
    expect(response?.status()).toBe(200);

    // Verify no console errors
    expect(errors).toEqual([]);

    // Verify root layout is mounted (critical element)
    await expect(page.locator('body')).toBeVisible();
  });
}
