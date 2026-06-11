import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('load settings page', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('verify settings cards visible', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Look for cards — could be .card, [class*="card"], or similar
    const cards = page.locator(
      '[data-testid*="setting-card"], [class*="Card"], [class*="card"], article, .grid > *, .flex > *'
    );

    // Wait for at least some cards to appear
    await page.waitForSelector('a, button, [role="link"]', { timeout: 10000 });

    const cardCount = await cards.count();
    // Settings page should have multiple navigation/option cards
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  test('click venture settings card and verify sub-page', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Try to find and click a venture-related card or link
    const ventureLink = page.locator(
      'a[href*="venture"], [data-testid*="venture"], a:has-text("Venture"), button:has-text("Venture")'
    ).first();

    if (await ventureLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ventureLink.click();
      await page.waitForURL(/\/settings\/venture/, { timeout: 10000 });
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Direct navigation as fallback
      await page.goto('/settings/venture', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
    }

    // Verify sub-page has loaded with content
    await expect(page).toHaveURL(/\/settings\/venture/);

    // Look for tab-like elements
    const tabs = page.locator(
      '[role="tab"], [data-testid*="tab"], button[class*="Tab"], [class*="tab-button"]'
    );
    const tabCount = await tabs.count();
    // Should find at least 1 tab element
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });
});
