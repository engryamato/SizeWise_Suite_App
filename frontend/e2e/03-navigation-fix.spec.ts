import { test, expect } from '@playwright/test';

test.describe('Navigation Fix Test', () => {
  test('should navigate to air duct sizer correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Check homepage loads
    await expect(page).toHaveTitle(/SizeWise Suite App/);

    // Find the Air Duct Sizer link
    const airDuctSizerLink = page.getByText('Air Duct Sizer Tool');
    await expect(airDuctSizerLink).toBeVisible();

    // Click the link and wait for navigation to V1
    await Promise.all([
      page.waitForURL('/air-duct-sizer-v1'),
      airDuctSizerLink.click()
    ]);

    // Verify we're on the correct V1 page
    await expect(page).toHaveURL('/air-duct-sizer-v1');

    // Check for V1 welcome message
    await expect(page.getByText('Welcome to Air Duct Sizer V1!')).toBeVisible({ timeout: 10000 });
  });

  test('should directly navigate to air duct sizer', async ({ page }) => {
    // Navigate directly to the V1 air duct sizer page
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check that we're on the correct V1 page
    await expect(page).toHaveURL('/air-duct-sizer-v1');

    // Check for V1 welcome message
    await expect(page.getByText('Welcome to Air Duct Sizer V1!')).toBeVisible({ timeout: 10000 });

    // Check for V1 FAB instead of traditional toolbar
    const drawingFAB = page.getByRole('button').first(); // The main FAB button
    await expect(drawingFAB).toBeVisible({ timeout: 10000 });
  });
});
