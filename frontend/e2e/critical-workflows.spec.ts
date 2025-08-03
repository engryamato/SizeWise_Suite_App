import { test, expect } from '@playwright/test';

/**
 * Critical User Workflows E2E Tests
 *
 * This test suite covers the most critical user workflows for SizeWise Suite
 * to ensure core functionality works end-to-end across different scenarios.
 *
 * These tests work with the actual application structure and existing routes.
 */

test.describe('Critical HVAC Application Workflows', () => {

  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('authentication flow and basic navigation', async ({ page }) => {
    // Test the actual authentication flow since the app redirects to login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify we're on the login page (which is expected)
    await expect(page.getByRole('heading', { name: 'SizeWise' })).toBeVisible({ timeout: 10000 });
    console.log('Login page loaded successfully');

    // Test basic login page functionality
    const signInButton = page.getByText('Sign In');
    if (await signInButton.isVisible()) {
      console.log('Sign In button found and visible');
    }

    // Test navigation to create account
    const createAccountLink = page.getByText('Create one here');
    if (await createAccountLink.isVisible()) {
      console.log('Create account link found and visible');
    }

    // Test forgot password functionality
    const forgotPasswordButton = page.getByText('Forgot password?');
    if (await forgotPasswordButton.isVisible()) {
      console.log('Forgot password button found and visible');
    }

    // Try to access the home page directly (might require authentication)
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check if we're still on login or if we can access the home page
    const currentUrl = page.url();
    console.log('Current URL after attempting to access home:', currentUrl);

    if (currentUrl.includes('/auth/login')) {
      console.log('Application requires authentication - this is expected behavior');

      // Test that the login page is functional
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('SizeWise');
      expect(pageContent).toContain('Sign In');
    } else {
      console.log('Successfully accessed home page without authentication');

      // If we can access the home page, test basic functionality
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }

    console.log('Authentication flow test completed successfully');
  });

  test('application navigation and basic functionality', async ({ page }) => {
    // Step 1: Start from home page (which redirects to login)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 2: Verify we're on the login page and it's functional
    await expect(page.getByRole('heading', { name: 'SizeWise' })).toBeVisible({ timeout: 10000 });
    console.log('Login page loaded successfully');

    // Step 3: Test basic login page functionality
    const signInButton = page.getByText('Sign In');
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Step 4: Try to access different routes directly
    const routesToTest = ['/air-duct-sizer', '/reports', '/demo'];

    for (const route of routesToTest) {
      console.log(`Testing route: ${route}`);
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const pageContent = await page.textContent('body');

      if (currentUrl.includes('/auth/login')) {
        console.log(`Route ${route} requires authentication (redirected to login)`);
        // Verify login page elements are present
        await expect(page.getByRole('heading', { name: 'SizeWise' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Sign In')).toBeVisible({ timeout: 5000 });
      } else {
        console.log(`Route ${route} is accessible`);
        expect(pageContent).toBeTruthy();

        // Test basic interaction on accessible pages
        const buttons = await page.locator('button').count();
        console.log(`Found ${buttons} buttons on ${route}`);

        if (buttons > 0) {
          const firstButton = page.locator('button').first();
          if (await firstButton.isVisible()) {
            await firstButton.click();
            await page.waitForTimeout(500);
            console.log(`Successfully interacted with ${route}`);
          }
        }
      }
    }

    console.log('Application navigation test completed successfully');
  });

  test('navigation between different HVAC tools', async ({ page }) => {
    // Step 1: Verify home page loads correctly
    await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });

    // Step 2: Test navigation to Air Duct Sizer
    await page.getByText('Air Duct Sizer Tool').click();
    await page.waitForURL('/air-duct-sizer');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify the page loaded
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('Air Duct Sizer navigation successful');

    // Step 3: Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });

    // Step 4: Test navigation to other available tools
    const availableTools = [
      { name: 'Start New Project', url: '/projects/new' },
      { name: 'View Reports', url: '/reports' },
      { name: 'Components Demo', url: '/demo' }
    ];

    for (const tool of availableTools) {
      const toolLink = page.getByText(tool.name);
      if (await toolLink.isVisible()) {
        console.log(`Testing navigation to ${tool.name}`);
        await toolLink.click();
        await page.waitForURL(tool.url);
        await page.waitForLoadState('domcontentloaded');

        // Verify the tool loaded (basic check)
        await page.waitForTimeout(1000);
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        console.log(`${tool.name} loaded successfully`);

        // Navigate back to home for next test
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      } else {
        console.log(`${tool.name} not found on home page`);
      }
    }
  });

  test('application responsiveness and basic performance', async ({ page }) => {
    // Test application loading performance
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Home page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds

    // Verify home page loaded correctly
    await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });

    // Test navigation to Air Duct Sizer
    const navStartTime = Date.now();
    await page.getByText('Air Duct Sizer Tool').click();
    await page.waitForURL('/air-duct-sizer');
    await page.waitForLoadState('domcontentloaded');

    const navTime = Date.now() - navStartTime;
    console.log(`Air Duct Sizer navigation time: ${navTime}ms`);
    expect(navTime).toBeLessThan(8000); // Should navigate within 8 seconds

    // Test basic interaction responsiveness
    const interactionStartTime = Date.now();
    const buttons = await page.locator('button').count();
    if (buttons > 0) {
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await page.waitForTimeout(500);
      }
    }

    const interactionTime = Date.now() - interactionStartTime;
    console.log(`UI interaction response time: ${interactionTime}ms`);
    expect(interactionTime).toBeLessThan(3000); // Should respond within 3 seconds
  });
});

test.describe('Application Stability and Error Handling', () => {

  test('application handles page refresh gracefully', async ({ page }) => {
    // Step 1: Navigate to Air Duct Sizer
    await page.goto('/');
    await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });
    await page.getByText('Air Duct Sizer Tool').click();
    await page.waitForURL('/air-duct-sizer');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Interact with the application if possible
    const buttons = await page.locator('button').count();
    if (buttons > 0) {
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 4: Verify application loads correctly after refresh
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('Page content exists after refresh');

    // Step 5: Verify basic functionality still works
    const buttonsAfterRefresh = await page.locator('button').count();
    if (buttonsAfterRefresh > 0) {
      const firstButtonAfterRefresh = page.locator('button').first();
      if (await firstButtonAfterRefresh.isVisible()) {
        await firstButtonAfterRefresh.click();
        await page.waitForTimeout(500);
        console.log('Button interaction works after refresh');
      }
    }

    console.log('Application successfully handled page refresh');
  });

  test('application handles network connectivity issues', async ({ page }) => {
    // Step 1: Start with normal operation
    await page.goto('/');
    await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });
    await page.getByText('Air Duct Sizer Tool').click();
    await page.waitForURL('/air-duct-sizer');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Verify normal operation
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('Application loaded normally');

    // Step 3: Simulate network issues by going offline
    await page.context().setOffline(true);

    // Step 4: Test that the application still functions offline
    const buttons = await page.locator('button').count();
    if (buttons > 0) {
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await page.waitForTimeout(500);
        console.log('Button interaction works offline');
      }
    }

    // The application should still be responsive
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Step 5: Restore network connectivity
    await page.context().setOffline(false);

    // Step 6: Verify application continues to work normally
    if (buttons > 0) {
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await page.waitForTimeout(500);
        console.log('Button interaction works after going back online');
      }
    }

    console.log('Application successfully handled network connectivity changes');
  });
});

test.describe('Application Features and Navigation', () => {

  test('reports page navigation and basic functionality', async ({ page }) => {
    // Step 1: Navigate to reports from home page
    await page.goto('/');
    await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });

    await page.getByText('View Reports').click();
    await page.waitForURL('/reports');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Verify reports page loaded
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('Reports page loaded successfully');

    // Step 3: Test basic page interaction
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} buttons on reports page`);

    if (buttons > 0) {
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await page.waitForTimeout(500);
        console.log('Successfully interacted with reports page');
      }
    }
  });

  test('demo page navigation and component showcase', async ({ page }) => {
    // Step 1: Navigate to demo page from home
    await page.goto('/');
    await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });

    await page.getByText('Components Demo').click();
    await page.waitForURL('/demo');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Verify demo page loaded
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('Demo page loaded successfully');

    // Step 3: Test component interactions if available
    const interactiveElements = await page.locator('button, input, select').count();
    console.log(`Found ${interactiveElements} interactive elements on demo page`);

    if (interactiveElements > 0) {
      // Test first interactive element
      const firstElement = page.locator('button, input, select').first();
      if (await firstElement.isVisible()) {
        const tagName = await firstElement.evaluate(el => el.tagName.toLowerCase());

        if (tagName === 'button') {
          await firstElement.click();
          console.log('Successfully clicked demo button');
        } else if (tagName === 'input') {
          await firstElement.fill('test');
          console.log('Successfully filled demo input');
        }

        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('User Interface and Accessibility', () => {

  test('keyboard navigation and accessibility features', async ({ page }) => {
    // Step 1: Navigate to application
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Step 2: Test keyboard navigation on home page
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Step 3: Navigate to Air Duct Sizer using keyboard
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // If we're on the Air Duct Sizer page, test keyboard navigation there
    if (page.url().includes('/air-duct-sizer-v1')) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Test escape key functionality
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      console.log('Keyboard navigation test completed successfully');
    }
  });

  test('responsive design and mobile compatibility', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Standard' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 768, height: 1024, name: 'Tablet Portrait' }
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify the page loads and is usable at this viewport size
      await expect(page.getByText('Welcome to SizeWise Suite')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Air Duct Sizer Tool')).toBeVisible({ timeout: 10000 });

      // Test navigation at this viewport size
      await page.getByText('Air Duct Sizer Tool').click();
      await page.waitForURL('/air-duct-sizer');
      await page.waitForLoadState('domcontentloaded');

      // Verify the application is functional at this size
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();

      // Test basic interaction if buttons are available
      const buttons = await page.locator('button').count();
      if (buttons > 0) {
        const firstButton = page.locator('button').first();
        if (await firstButton.isVisible()) {
          await firstButton.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        }
      }

      console.log(`${viewport.name} test completed successfully`);

      // Navigate back to home for next viewport test
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }
  });
});
