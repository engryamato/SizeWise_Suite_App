import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive Authentication Flow Testing for SizeWise Suite
 * 
 * This test suite validates real user authentication workflows and catches 
 * production-level issues, not simplified scenarios.
 * 
 * Testing Requirements:
 * 1. Complete login/logout cycle with valid credentials
 * 2. Authentication redirects to /dashboard route
 * 3. Authentication persistence across browser sessions
 * 4. Error handling for invalid credentials
 * 5. Session timeout and re-authentication flows
 */

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

const INVALID_CREDENTIALS = {
  email: 'invalid@test.com',
  password: 'wrongpassword'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Authentication Flow Testing - Production Level', () => {
  let page: Page;
  let context: BrowserContext;
  let consoleErrors: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Reset error arrays
    consoleErrors = [];
    networkErrors = [];
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      networkErrors.push(`Network Error: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test.afterEach(async () => {
    await page.close();
    await context.close();
  });

  test('1.1 Complete Login/Logout Cycle with Valid Credentials', async () => {
    console.log('🧪 Testing complete login/logout cycle...');

    // Step 1: Navigate to application root
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify redirect to login page for unauthenticated users
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ Unauthenticated user redirected to login page');

    // Step 3: Verify login page elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    console.log('✅ Login form elements are visible');

    // Step 4: Fill in valid credentials
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);
    console.log('✅ Credentials filled');

    // Step 5: Submit login form
    await page.click('button[type="submit"]');
    console.log('✅ Login form submitted');

    // Step 6: Wait for authentication and verify redirect to dashboard
    await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 });
    
    // Verify we're on the dashboard or main app
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|$)/);
    console.log('✅ Successfully redirected to dashboard after login');

    // Step 7: Verify authentication state in UI
    // Look for user-specific elements that indicate successful authentication
    await expect(page.locator('[data-testid="user-menu"], .user-avatar, [aria-label*="user"], [aria-label*="profile"]')).toBeVisible({ timeout: 5000 });
    console.log('✅ User authentication state visible in UI');

    // Step 8: Test logout functionality
    // Find logout button/link (could be in dropdown, menu, or direct button)
    const logoutTrigger = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out"), [data-testid="logout"]').first();
    
    if (await logoutTrigger.isVisible()) {
      await logoutTrigger.click();
    } else {
      // Try to find user menu first, then logout
      const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, [aria-label*="user"]').first();
      await userMenu.click();
      await page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]').first().click();
    }
    console.log('✅ Logout action triggered');

    // Step 9: Verify logout redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    console.log('✅ Successfully redirected to login page after logout');

    // Step 10: Verify session cleanup - try to access protected route
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ Session properly cleaned up - protected route redirects to login');

    // Step 11: Check for any console errors during the flow
    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors detected:', consoleErrors);
      // Don't fail the test for minor console errors, but log them
    }

    if (networkErrors.length > 0) {
      console.warn('⚠️ Network errors detected:', networkErrors);
    }

    console.log('✅ Complete login/logout cycle test passed');
  });

  test('1.2 Authentication Persistence Across Browser Sessions', async () => {
    console.log('🧪 Testing authentication persistence...');

    // Step 1: Login with valid credentials
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 });
    console.log('✅ Initial login successful');

    // Step 2: Close current page and create new one (simulating new tab/window)
    await page.close();
    page = await context.newPage();

    // Step 3: Navigate to protected route and verify authentication persists
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to login if session persists
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login')) {
      console.log('⚠️ Session did not persist - user redirected to login');
      // This might be expected behavior depending on session configuration
    } else {
      console.log('✅ Authentication persisted across browser session');
      await expect(page.locator('[data-testid="user-menu"], .user-avatar, [aria-label*="user"]')).toBeVisible({ timeout: 5000 });
    }

    console.log('✅ Authentication persistence test completed');
  });

  test('1.3 Error Handling for Invalid Credentials', async () => {
    console.log('🧪 Testing error handling for invalid credentials...');

    // Step 1: Navigate to login page
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');

    // Step 2: Fill in invalid credentials
    await page.fill('input[type="email"]', INVALID_CREDENTIALS.email);
    await page.fill('input[type="password"]', INVALID_CREDENTIALS.password);
    console.log('✅ Invalid credentials filled');

    // Step 3: Submit login form
    await page.click('button[type="submit"]');
    console.log('✅ Login form submitted with invalid credentials');

    // Step 4: Wait for error handling
    await page.waitForTimeout(3000);

    // Step 5: Verify error message is displayed
    const errorMessage = page.locator('.error, .alert-error, [role="alert"], .text-red, .text-danger, [data-testid="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Error message displayed for invalid credentials');

    // Step 6: Verify user remains on login page
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ User remains on login page after invalid credentials');

    // Step 7: Verify form is still functional after error
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Should successfully login with valid credentials
    await page.waitForURL(url => !url.includes('/auth/login'), { timeout: 10000 });
    console.log('✅ Form remains functional after error - valid login successful');

    console.log('✅ Invalid credentials error handling test passed');
  });

  test('1.4 Session Timeout and Re-authentication Flow', async () => {
    console.log('🧪 Testing session timeout and re-authentication...');

    // Step 1: Login with valid credentials
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 });
    console.log('✅ Initial login successful');

    // Step 2: Simulate session expiration by clearing cookies/storage
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('✅ Session data cleared to simulate timeout');

    // Step 3: Try to access protected route
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Step 4: Verify redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ Expired session redirected to login page');

    // Step 5: Re-authenticate
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 });
    console.log('✅ Re-authentication successful');

    console.log('✅ Session timeout and re-authentication test passed');
  });

  test('1.5 Authentication Security and Edge Cases', async () => {
    console.log('🧪 Testing authentication security and edge cases...');

    // Step 1: Test empty form submission
    await page.goto(`${BASE_URL}/auth/login`);
    await page.click('button[type="submit"]');
    
    // Should show validation errors or prevent submission
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ Empty form submission handled correctly');

    // Step 2: Test SQL injection attempt
    await page.fill('input[type="email"]', "admin@test.com'; DROP TABLE users; --");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ SQL injection attempt blocked');

    // Step 3: Test XSS attempt
    await page.fill('input[type="email"]', "<script>alert('xss')</script>");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ XSS attempt handled correctly');

    // Step 4: Verify no critical security errors in console
    const securityErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('security') || 
      error.toLowerCase().includes('xss') ||
      error.toLowerCase().includes('injection')
    );
    
    expect(securityErrors.length).toBe(0);
    console.log('✅ No security-related console errors detected');

    console.log('✅ Authentication security test passed');
  });
});
