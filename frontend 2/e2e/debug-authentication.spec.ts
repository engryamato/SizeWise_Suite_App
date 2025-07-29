import { test, expect, Page } from '@playwright/test';

/**
 * Debug Authentication Test
 * 
 * Simple test to debug the authentication flow step by step
 */

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Debug Authentication Flow', () => {
  let page: Page;
  let consoleMessages: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const text = `[PAGE ERROR] ${error.message}`;
      consoleMessages.push(text);
      console.log(text);
    });

    // Capture network requests
    page.on('request', (request) => {
      if (request.url().includes('/api/') || request.url().includes('/auth/')) {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', (response) => {
      if (response.url().includes('/api/') || response.url().includes('/auth/')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug: Step-by-step authentication flow', async () => {
    console.log('🔍 Starting debug authentication test...');

    // Step 1: Navigate to login page directly
    console.log('📍 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL:', page.url());
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ On login page');

    // Step 2: Take screenshot of login page
    await page.screenshot({ path: 'debug-login-page.png' });
    console.log('✅ Screenshot taken');

    // Step 3: Check for form elements
    console.log('📍 Step 3: Check form elements');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    console.log('✅ All form elements visible');

    // Step 4: Fill credentials slowly
    console.log('📍 Step 4: Fill credentials');
    await emailInput.fill(SUPER_ADMIN_CREDENTIALS.email);
    console.log('✅ Email filled');
    
    await passwordInput.fill(SUPER_ADMIN_CREDENTIALS.password);
    console.log('✅ Password filled');

    // Step 5: Take screenshot before submit
    await page.screenshot({ path: 'debug-before-submit.png' });
    console.log('✅ Screenshot before submit taken');

    // Step 6: Submit form and wait
    console.log('📍 Step 6: Submit form');
    await submitButton.click();
    console.log('✅ Submit button clicked');

    // Step 7: Wait and observe what happens
    console.log('📍 Step 7: Wait for response');
    await page.waitForTimeout(5000); // Wait 5 seconds to see what happens

    // Step 8: Check current URL
    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);

    // Step 9: Take screenshot after submit
    await page.screenshot({ path: 'debug-after-submit.png' });
    console.log('✅ Screenshot after submit taken');

    // Step 10: Check for any error messages
    const errorElements = await page.locator('.error, .alert-error, [role="alert"], .text-red, .text-danger, [data-testid="error"]').all();
    if (errorElements.length > 0) {
      console.log('❌ Error elements found:');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log('  Error:', text);
      }
    } else {
      console.log('✅ No error elements found');
    }

    // Step 11: Check if we're still on login page
    if (currentUrl.includes('/auth/login')) {
      console.log('⚠️ Still on login page - authentication may have failed');
      
      // Check for loading states
      const loadingElements = await page.locator('.loading, .spinner, [data-testid="loading"]').all();
      if (loadingElements.length > 0) {
        console.log('🔄 Loading elements found - waiting longer...');
        await page.waitForTimeout(5000);
        
        const newUrl = page.url();
        console.log('URL after additional wait:', newUrl);
      }
    } else {
      console.log('✅ Redirected away from login page');
    }

    // Step 12: Print all console messages
    console.log('📍 Console messages during test:');
    consoleMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}: ${msg}`);
    });

    console.log('🔍 Debug test completed');
  });

  test('Debug: Check authentication manager directly', async () => {
    console.log('🔍 Testing authentication manager directly...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');

    // Test authentication manager in browser context
    const authResult = await page.evaluate(async (credentials) => {
      try {
        // Access the auth store directly
        const authStore = (window as any).authStore;
        if (!authStore) {
          return { error: 'Auth store not found on window' };
        }

        // Try to login
        const result = await authStore.getState().login(credentials.email, credentials.password);
        return { success: result, authStore: !!authStore };
      } catch (error) {
        return { error: error.message };
      }
    }, SUPER_ADMIN_CREDENTIALS);

    console.log('Direct auth manager result:', authResult);
  });

  test('Debug: Manual form interaction', async () => {
    console.log('🔍 Testing manual form interaction...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');

    // Fill form manually with delays
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email, { delay: 100 });
    
    await page.click('input[type="password"]');
    await page.type('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password, { delay: 100 });

    // Wait a bit before submitting
    await page.waitForTimeout(1000);

    // Submit and monitor network
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/') && response.request().method() === 'POST'
    );

    await page.click('button[type="submit"]');

    try {
      const response = await responsePromise;
      console.log('API Response:', response.status(), response.url());
      
      const responseBody = await response.text();
      console.log('Response body:', responseBody);
    } catch (error) {
      console.log('No API response captured:', error.message);
    }

    await page.waitForTimeout(3000);
    console.log('Final URL:', page.url());
  });
});
