import { test, expect } from '@playwright/test';

test.describe('Peer Selection', () => {
  test('unavailable peers are visually distinguished and not clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bb-table tbody tr', { timeout: 30000 });

    // Click on first node to select it
    await page.locator('.bb-table tbody tr').first().click();
    await page.waitForTimeout(500);

    // Check if there are peer tags
    const peerTags = page.locator('.bb-peer-tag');
    const peerCount = await peerTags.count();
    console.log(`Found ${peerCount} peer tags`);

    if (peerCount === 0) {
      console.log('No peers found for first node, test cannot proceed');
      return;
    }

    // Check for unavailable peers (those with .bb-peer-unavailable class)
    const unavailablePeers = page.locator('.bb-peer-unavailable');
    const unavailableCount = await unavailablePeers.count();
    console.log(`Unavailable peers: ${unavailableCount} out of ${peerCount}`);

    // Verify unavailable peers have EXT label
    if (unavailableCount > 0) {
      const firstUnavailable = unavailablePeers.first();
      const hasExtLabel = await firstUnavailable.locator('.bb-peer-external').count();
      expect(hasExtLabel).toBe(1);
      console.log('Unavailable peers correctly show EXT label');

      // Verify cursor is not-allowed
      const cursor = await firstUnavailable.evaluate(el => getComputedStyle(el).cursor);
      expect(cursor).toBe('not-allowed');
      console.log('Unavailable peers have not-allowed cursor');
    }

    // Verify available peers are clickable
    const availablePeers = page.locator('.bb-peer-tag:not(.bb-peer-unavailable)');
    const availableCount = await availablePeers.count();
    console.log(`Available peers: ${availableCount}`);

    if (availableCount > 0) {
      // Get current selected node name
      const initialHeader = await page.locator('.bb-panel-header:has-text("Node Details")').textContent();
      console.log(`Initial selection: ${initialHeader}`);

      // Click on an available peer
      await availablePeers.first().click({ force: true });
      await page.waitForTimeout(300);

      // Verify selection changed
      const newHeader = await page.locator('.bb-panel-header:has-text("Node Details")').textContent();
      console.log(`After clicking available peer: ${newHeader}`);

      // Selection should have changed (different node name in header)
      expect(newHeader).not.toBe(initialHeader);
      console.log('Available peer was successfully selected');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total peers: ${peerCount}`);
    console.log(`Available (clickable): ${availableCount}`);
    console.log(`Unavailable (EXT): ${unavailableCount}`);
  });

  test('clicking unavailable peer does not change selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bb-table tbody tr', { timeout: 30000 });

    // Click on first node to select it
    await page.locator('.bb-table tbody tr').first().click();
    await page.waitForTimeout(500);

    // Find an unavailable peer
    const unavailablePeers = page.locator('.bb-peer-unavailable');
    const unavailableCount = await unavailablePeers.count();

    if (unavailableCount === 0) {
      console.log('No unavailable peers found, skipping test');
      return;
    }

    // Get current selection
    const initialHeader = await page.locator('.bb-panel-header:has-text("Node Details")').textContent();
    console.log(`Initial selection: ${initialHeader}`);

    // Click on unavailable peer
    await unavailablePeers.first().click({ force: true });
    await page.waitForTimeout(300);

    // Verify selection did NOT change
    const afterHeader = await page.locator('.bb-panel-header:has-text("Node Details")').textContent();
    console.log(`After clicking unavailable peer: ${afterHeader}`);

    expect(afterHeader).toBe(initialHeader);
    console.log('Clicking unavailable peer correctly kept selection unchanged');
  });

  test('header shows count of peers in dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bb-table tbody tr', { timeout: 30000 });

    // Click on first node to select it
    await page.locator('.bb-table tbody tr').first().click();
    await page.waitForTimeout(500);

    // Check if the connected peers header shows "X in dashboard"
    const header = page.locator('.bb-forensic-section-header:has-text("CONNECTED PEERS")');
    const headerText = await header.textContent();
    console.log(`Header text: ${headerText}`);

    // Verify header contains "in dashboard" count
    expect(headerText).toContain('in dashboard');
    console.log('Header correctly shows count of peers in dashboard');
  });
});
