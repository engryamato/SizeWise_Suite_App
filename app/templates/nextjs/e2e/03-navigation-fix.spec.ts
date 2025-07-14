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
    
    // Click the link and wait for navigation
    await Promise.all([
      page.waitForURL('/air-duct-sizer'),
      airDuctSizerLink.click()
    ]);
    
    // Verify we're on the correct page
    await expect(page).toHaveURL('/air-duct-sizer');
    
    // Check for the Air Duct Sizer header
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
  });

  test('should directly navigate to air duct sizer', async ({ page }) => {
    // Navigate directly to the air duct sizer page
    await page.goto('/air-duct-sizer');
    
    // Check that we're on the correct page
    await expect(page).toHaveURL('/air-duct-sizer');
    
    // Check for the Air Duct Sizer header
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    
    // Check for toolbar
    const toolbar = page.getByRole('toolbar', { name: 'Drawing tools' });
    await expect(toolbar).toBeVisible();
  });
});
