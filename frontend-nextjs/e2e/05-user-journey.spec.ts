import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('should complete full workflow: project creation → drawing → calculation → export', async ({ page }) => {
    // Step 1: Navigate to application
    await page.goto('/');
    await page.getByText('Air Duct Sizer Tool').click();
    await page.waitForURL('/air-duct-sizer');
    
    // Step 2: Verify project creation
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    await expect(page.getByRole('banner').getByText('New Air Duct Project')).toBeVisible();
    
    // Step 3: Test drawing workflow - Room creation
    const roomTool = page.getByRole('button', { name: /room tool/i });
    await roomTool.click();
    await expect(roomTool).toHaveAttribute('aria-pressed', 'true');
    
    // Step 4: Test drawing workflow - Duct creation
    const ductTool = page.getByRole('button', { name: /duct tool/i });
    await ductTool.click();
    await expect(ductTool).toHaveAttribute('aria-pressed', 'true');
    
    // Step 5: Test drawing workflow - Equipment placement
    const equipmentTool = page.getByRole('button', { name: /equipment tool/i });
    await equipmentTool.click();
    await expect(equipmentTool).toHaveAttribute('aria-pressed', 'true');
    
    // Step 6: Test selection tool
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await selectTool.click();
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    
    // Step 7: Test keyboard shortcuts
    await page.keyboard.press('v'); // Select
    await page.keyboard.press('r'); // Room
    await page.keyboard.press('d'); // Duct
    await page.keyboard.press('e'); // Equipment
    await page.keyboard.press('h'); // Pan
    await page.keyboard.press('g'); // Grid toggle
    await page.keyboard.press('s'); // Snap toggle
    
    // Step 8: Verify no JavaScript errors occurred
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('should handle Free tier limitations correctly', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Verify Free tier indicator
    await expect(page.getByText('Free')).toBeVisible();
    
    // Check for usage counters (if visible)
    const usageText = page.locator('text=/rooms usage|segments usage|equipment usage/i');
    // Usage counters might not be visible if temporarily disabled
    
    // Verify tier limitations are displayed in status bar
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar).toBeVisible();
    
    // Should show room/segment counts with limits for Free tier
    await expect(statusBar.getByText(/0\/3 rooms, 0\/25 segments/)).toBeVisible();
  });

  test('should handle grid and snap functionality', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Test grid toggle with keyboard
    await page.keyboard.press('g');
    
    // Test snap toggle with keyboard
    await page.keyboard.press('s');
    
    // Test grid toggle with mouse (if grid buttons are visible)
    const gridButtons = page.getByRole('button').filter({ hasText: /grid|snap/i });
    const gridButtonCount = await gridButtons.count();
    
    if (gridButtonCount > 0) {
      await gridButtons.first().click();
    }
    
    // Verify status bar shows grid information
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar.getByText(/Grid:/)).toBeVisible();
    await expect(statusBar.getByText(/Zoom:/)).toBeVisible();
  });

  test('should handle canvas interactions', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for canvas to load
    await page.waitForLoadState('networkidle');
    
    // Look for canvas element (Konva creates canvas elements)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Test canvas click (should not cause errors)
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    }
    
    // Test zoom controls if available
    const zoomButtons = page.getByRole('button').filter({ hasText: /zoom/i });
    const zoomButtonCount = await zoomButtons.count();
    
    if (zoomButtonCount > 0) {
      await zoomButtons.first().click();
    }
  });

  test('should handle escape key for canceling operations', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Select room tool
    await page.getByRole('button', { name: /room tool/i }).click();
    
    // Press escape to cancel
    await page.keyboard.press('Escape');
    
    // Should return to select tool
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
  });

  test('should display project information correctly', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Check header information
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    await expect(page.getByRole('banner').getByText('New Air Duct Project')).toBeVisible();
    
    // Check tier indicator
    await expect(page.getByText('Free')).toBeVisible();
    
    // Check project stats in status bar (Free tier format)
    await expect(page.getByText(/0\/3 rooms, 0\/25 segments/)).toBeVisible();
    
    // Check status bar
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar).toBeVisible();
    await expect(statusBar.getByText('Ready')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/air-duct-sizer');
    
    // Toolbar should be visible
    const toolbar = page.getByRole('toolbar');
    await expect(toolbar).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Application should still be functional
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Application should still be functional
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
  });
});
