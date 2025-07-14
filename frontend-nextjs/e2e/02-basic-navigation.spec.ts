import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load homepage and navigate to air duct sizer', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Check homepage loads
    await expect(page).toHaveTitle(/SizeWise Suite App/);
    
    // Find and click the Air Duct Sizer link
    const airDuctSizerLink = page.getByText('Air Duct Sizer Tool');
    await expect(airDuctSizerLink).toBeVisible();
    
    // Click the link
    await airDuctSizerLink.click();
    
    // Wait for navigation with a longer timeout
    await page.waitForURL('/air-duct-sizer', { timeout: 10000 });
    
    // Verify we're on the correct page
    await expect(page).toHaveURL('/air-duct-sizer');
    
    // Check for the Air Duct Sizer header
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
  });

  test('should display toolbar with correct ARIA labels', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for toolbar with correct ARIA label
    const toolbar = page.getByRole('toolbar', { name: 'Drawing tools' });
    await expect(toolbar).toBeVisible();
    
    // Check for specific tool buttons with more specific selectors
    const selectButton = page.getByRole('button', { name: /select tool/i });
    await expect(selectButton).toBeVisible();
  });

  test('should handle duplicate button names correctly', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Use more specific selectors to avoid conflicts
    const toolbarRoomButton = page.locator('[role="toolbar"] button').filter({ hasText: 'Room' }).first();
    await expect(toolbarRoomButton).toBeVisible();
    
    // Check that we can click it without errors
    await toolbarRoomButton.click();
    
    // Verify the button state changed
    await expect(toolbarRoomButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should display canvas area', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for canvas - it might be inside a div or be a canvas element
    const canvasArea = page.locator('canvas, [data-testid="canvas"], .konvajs-content').first();
    await expect(canvasArea).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Test keyboard shortcuts
    await page.keyboard.press('v'); // Select tool
    await page.keyboard.press('r'); // Room tool
    await page.keyboard.press('d'); // Duct tool
    await page.keyboard.press('e'); // Equipment tool
    await page.keyboard.press('h'); // Pan tool
    
    // Check that no JavaScript errors occurred
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to surface
    await page.waitForTimeout(1000);
    
    expect(errors).toHaveLength(0);
  });
});
