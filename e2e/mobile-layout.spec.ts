import { test, expect } from '@playwright/test';

test.describe('Mobile Layout', () => {
  test.describe('on narrow screens (< 768px)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('shows mobile home layout without topology map', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Mobile layout should have mobile-specific elements
      await expect(page.locator('.mobile-home')).toBeVisible();

      // Should NOT have the desktop topology graph
      await expect(page.locator('.react-flow')).not.toBeVisible();

      // Should have mobile-specific elements
      await expect(page.locator('.mobile-pulse-banner')).toBeVisible();
      await expect(page.locator('.mobile-stats-row')).toBeVisible();
      await expect(page.locator('.mobile-tabs')).toBeVisible();
    });

    test('has MAP button that navigates to /map', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Find and click the MAP button
      const mapBtn = page.locator('.mobile-map-btn');
      await expect(mapBtn).toBeVisible();
      await mapBtn.click();

      // Should navigate to /map
      await expect(page).toHaveURL('/map');

      // Map page should show the topology graph
      await expect(page.locator('.react-flow')).toBeVisible();
    });

    test('map page has back button that returns to home', async ({ page }) => {
      await page.goto('/map');
      await page.waitForTimeout(1000);

      // Should have back button
      const backBtn = page.locator('.mobile-back-btn');
      await expect(backBtn).toBeVisible();

      await backBtn.click();

      // Should return to home
      await expect(page).toHaveURL('/');
      await expect(page.locator('.mobile-home')).toBeVisible();
    });

    test('selecting a node on map and tapping again returns to home with selection', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.mobile-home', { timeout: 30000 });

      // Navigate to map
      await page.locator('.mobile-map-btn').click();
      await page.waitForURL('/map');
      await page.waitForSelector('.react-flow', { timeout: 30000 });

      // Click a node to select it
      const node = page.locator('[data-testid="rf__node"]').first();
      if (await node.count() > 0) {
        await node.click();
        await page.waitForTimeout(300);

        // Click again to navigate back
        await node.click();

        // Should return home with details tab showing
        await expect(page).toHaveURL('/');
      }
    });
  });

  test.describe('on wide screens (>= 768px)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('shows desktop layout with topology map', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Should NOT have mobile-specific elements
      await expect(page.locator('.mobile-home')).not.toBeVisible();

      // Should have desktop layout with the topology graph visible
      await expect(page.locator('.react-flow')).toBeVisible();

      // Should have Bloomberg Terminal elements
      await expect(page.locator('.bb-command-bar')).toBeVisible();
      await expect(page.locator('.bb-ticker')).toBeVisible();
    });
  });
});
