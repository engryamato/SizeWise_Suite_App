import { test, expect } from '@playwright/test';

test.describe('Basic Application Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/SizeWise Suite App/);

    // Check for the Air Duct Sizer link
    const airDuctSizerLink = page.getByText('Air Duct Sizer Tool');
    await expect(airDuctSizerLink).toBeVisible();
  });

  test('should navigate to Air Duct Sizer application', async ({ page }) => {
    // Click on the Air Duct Sizer link
    await page.getByText('Air Duct Sizer Tool').click();

    // Wait for navigation
    await page.waitForURL('/air-duct-sizer');

    // Check that we're on the Air Duct Sizer page
    await expect(page).toHaveURL('/air-duct-sizer');

    // Check for key UI elements (use role to be more specific)
    await expect(page.getByRole('heading', { name: 'Air Duct Sizer' })).toBeVisible();
  });

  test('should display toolbar with drawing tools', async ({ page }) => {
    await page.goto('/air-duct-sizer');

    // Check for toolbar tools (be specific to avoid conflicts with sidebar)
    await expect(page.getByRole('button', { name: /select tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /room tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /duct tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /equipment tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pan tool/i })).toBeVisible();
  });

  test('should display canvas area', async ({ page }) => {
    await page.goto('/air-duct-sizer');

    // Check for canvas container
    const canvas = page.locator('canvas, [data-testid="drawing-canvas"]');
    await expect(canvas).toBeVisible();
  });

  test('should display usage counters for Free tier', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');

    // Check for usage counters in status bar (Free tier format)
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar.getByText(/\d+\/3 rooms, \d+\/25 segments/)).toBeVisible();

    // Check that Free tier indicator is visible
    await expect(page.getByText('Free')).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/air-duct-sizer');

    // Test keyboard shortcuts
    await page.keyboard.press('v'); // Select tool
    await page.keyboard.press('r'); // Room tool
    await page.keyboard.press('d'); // Duct tool
    await page.keyboard.press('e'); // Equipment tool
    await page.keyboard.press('h'); // Pan tool
    await page.keyboard.press('g'); // Toggle grid
    await page.keyboard.press('s'); // Toggle snap

    // No errors should occur
    const errors = await page.locator('.error, [data-testid="error"]').count();
    expect(errors).toBe(0);
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.goto('/air-duct-sizer');

    // Test tab navigation through toolbar
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should not have console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/air-duct-sizer');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block backend requests to test fallback
    await page.route('**/api/**', route => route.abort());

    await page.goto('/air-duct-sizer');

    // Application should still load (use role to be more specific)
    await expect(page.getByRole('heading', { name: 'Air Duct Sizer' })).toBeVisible();

    // Should show fallback message or work in offline mode
    // This tests the client-side calculation fallback
  });

  test('should display proper ARIA labels', async ({ page }) => {
    await page.goto('/air-duct-sizer');

    // Check for proper ARIA labels on toolbar
    const toolbar = page.getByRole('toolbar', { name: /drawing tools/i });
    await expect(toolbar).toBeVisible();

    // Check for button ARIA labels
    const selectButton = page.getByRole('button', { name: /select tool/i });
    await expect(selectButton).toBeVisible();
  });
});
