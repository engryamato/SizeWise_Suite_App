/**
 * Real Login Test
 * 
 * Test the actual login functionality step by step
 */

import { test, expect } from '@playwright/test';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

test.describe('Real Login Test', () => {
  test('Test actual login functionality', async ({ page }) => {
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', (error) => {
      console.log('PAGE ERROR:', error.message);
    });

    page.on('requestfailed', (request) => {
      console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText);
    });

    console.log('🔍 Step 1: Navigate to app...');
    await page.goto('/');

    console.log('⏳ Step 2: Navigate to login page...');
    await page.goto('/auth/login');
    
    console.log('📸 Step 3: Take screenshot of login page...');
    await page.screenshot({ path: 'real-login-page.png' });

    console.log('🔍 Step 4: Check form elements...');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('📝 Step 5: Fill credentials...');
    await emailInput.fill(SUPER_ADMIN_CREDENTIALS.email);
    await passwordInput.fill(SUPER_ADMIN_CREDENTIALS.password);

    console.log('🔍 Step 6: Check submit button state...');
    await expect(submitButton).toBeEnabled();

    console.log('📸 Step 7: Screenshot before submit...');
    await page.screenshot({ path: 'real-before-submit.png' });

    console.log('🚀 Step 8: Submit form...');

    // Add event listener to capture form submission
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          console.log('📝 Form submit event triggered!', e);
        });
      }
    });

    // Try multiple ways to submit the form
    console.log('🔍 Trying button click...');
    await submitButton.click();
    console.log('✅ Button clicked successfully');

    await page.waitForTimeout(1000);

    // If that didn't work, try pressing Enter
    console.log('🔍 Trying Enter key...');
    await passwordInput.press('Enter');
    console.log('✅ Enter key pressed');

    console.log('⏳ Step 9: Wait for response...');
    await page.waitForTimeout(3000);

    console.log('📸 Step 10: Screenshot after submit...');
    await page.screenshot({ path: 'real-after-submit.png' });

    console.log('🔍 Step 11: Check current URL...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/auth/login')) {
      console.log('❌ Still on login page');
      
      // Check for error messages
      const errorElements = await page.locator('[role="alert"], .error, .text-red-400, .text-red-500').all();
      for (const error of errorElements) {
        const errorText = await error.textContent();
        if (errorText && errorText.trim()) {
          console.log('Error message:', errorText);
        }
      }

      // Check form state
      const emailValue = await emailInput.inputValue();
      const passwordValue = await passwordInput.inputValue();
      const isSubmitDisabled = await submitButton.isDisabled();
      
      console.log('Form state:');
      console.log('- Email:', emailValue);
      console.log('- Password:', passwordValue ? '***' : 'empty');
      console.log('- Submit disabled:', isSubmitDisabled);

      // Wait longer for potential redirect
      console.log('⏳ Step 12: Wait longer for redirect...');
      // Deterministic wait for login success and dashboard navigation
      await page.waitForFunction(() => document.cookie.includes('auth-token='), null, { timeout: 10000 });
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
      console.log('✅ Redirected to dashboard after login');
    } else {
      console.log('✅ Successfully redirected!');
      console.log('Final URL:', currentUrl);
    }

    console.log('📸 Step 13: Final screenshot...');
    await page.screenshot({ path: 'real-final-success.png' });
  });
});
