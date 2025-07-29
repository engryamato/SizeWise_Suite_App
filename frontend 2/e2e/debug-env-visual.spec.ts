import { test, expect, Page } from '@playwright/test';

/**
 * Visual Debug Test for Environment Variables
 * 
 * Take screenshots to see if environment variables are displayed
 */

const BASE_URL = 'http://localhost:3000';

test.describe('Visual Environment Debug', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Visual: Check environment variables display', async () => {
    console.log('🔍 Taking screenshot to check environment variables...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take a full page screenshot
    await page.screenshot({ 
      path: 'debug-env-variables-display.png', 
      fullPage: true 
    });

    // Check if the debug component is visible
    const debugComponent = page.locator('.p-4.bg-gray-100.rounded-lg');
    const isVisible = await debugComponent.isVisible();
    console.log('Debug component visible:', isVisible);

    if (isVisible) {
      const debugText = await debugComponent.textContent();
      console.log('Debug component content:', debugText);
    }

    // Also check the page source for environment variables
    const pageContent = await page.content();
    const hasEnvVars = pageContent.includes('NEXT_PUBLIC_SUPER_ADMIN_EMAIL');
    console.log('Page contains env var references:', hasEnvVars);
  });
});
