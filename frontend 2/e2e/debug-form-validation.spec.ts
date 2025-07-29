import { test, expect, Page } from '@playwright/test';

/**
 * Debug Form Validation Test
 * 
 * Test form validation and submission behavior
 */

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Debug Form Validation', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture console messages
    page.on('console', (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR] ${error.message}`);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug: Check form validation and error messages', async () => {
    console.log('🔍 Testing form validation...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 1: Check initial form state
    console.log('📍 Step 1: Check initial form state');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Check if submit button is enabled
    const isSubmitEnabled = await submitButton.isEnabled();
    console.log('Submit button enabled initially:', isSubmitEnabled);

    // Step 2: Try submitting empty form
    console.log('📍 Step 2: Submit empty form');
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Check for validation errors
    const validationErrors = await page.locator('.error, .text-red, [role="alert"]').allTextContents();
    console.log('Validation errors after empty submit:', validationErrors);

    // Step 3: Fill email only
    console.log('📍 Step 3: Fill email only');
    await emailInput.fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.waitForTimeout(500);
    
    await submitButton.click();
    await page.waitForTimeout(1000);

    const emailOnlyErrors = await page.locator('.error, .text-red, [role="alert"]').allTextContents();
    console.log('Errors after email only:', emailOnlyErrors);

    // Step 4: Fill both fields
    console.log('📍 Step 4: Fill both fields');
    await passwordInput.fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.waitForTimeout(500);

    // Check if form is now valid
    const isFormValid = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form ? form.checkValidity() : false;
    });
    console.log('Form validity after filling both fields:', isFormValid);

    // Step 5: Submit complete form and monitor closely
    console.log('📍 Step 5: Submit complete form');
    
    // Monitor form submission
    let formSubmitted = false;
    page.on('request', (request) => {
      if (request.method() === 'POST') {
        console.log('POST request detected:', request.url());
        formSubmitted = true;
      }
    });

    // Check for loading states before submit
    const loadingBefore = await page.locator('.loading, .spinner, [data-testid="loading"]').count();
    console.log('Loading elements before submit:', loadingBefore);

    await submitButton.click();
    console.log('Submit button clicked');

    // Wait and check for changes
    await page.waitForTimeout(2000);

    // Check for loading states after submit
    const loadingAfter = await page.locator('.loading, .spinner, [data-testid="loading"]').count();
    console.log('Loading elements after submit:', loadingAfter);

    // Check for any error messages
    const allErrors = await page.locator('.error, .text-red, [role="alert"], .alert-error').allTextContents();
    console.log('All error messages after submit:', allErrors);

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);

    // Check if form was actually submitted
    console.log('Form submission detected:', formSubmitted);

    // Step 6: Check form state after submission
    const formState = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

      return {
        emailValue: emailInput?.value || '',
        passwordValue: passwordInput?.value || '',
        submitDisabled: submitButton?.disabled || false,
        submitText: submitButton?.textContent || ''
      };
    });
    console.log('Form state after submission:', formState);

    // Step 7: Check for any React error boundaries
    const errorBoundary = await page.locator('[data-testid="error-boundary"], .error-boundary').count();
    console.log('Error boundary elements:', errorBoundary);

    // Step 8: Check browser console for any React errors
    const reactErrors = await page.evaluate(() => {
      return (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot ? 'React DevTools detected' : 'No React DevTools';
    });
    console.log('React status:', reactErrors);
  });

  test('Debug: Test with different credentials', async () => {
    console.log('🔍 Testing with different credentials...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test with invalid credentials first
    console.log('📍 Testing with invalid credentials');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const invalidErrors = await page.locator('.error, .text-red, [role="alert"]').allTextContents();
    console.log('Errors with invalid credentials:', invalidErrors);

    // Clear and test with valid credentials
    console.log('📍 Testing with valid credentials');
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const validErrors = await page.locator('.error, .text-red, [role="alert"]').allTextContents();
    console.log('Errors with valid credentials:', validErrors);

    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
  });

  test('Debug: Check form HTML structure', async () => {
    console.log('🔍 Checking form HTML structure...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Get form HTML
    const formHTML = await page.locator('form').innerHTML();
    console.log('Form HTML structure:');
    console.log(formHTML.substring(0, 500) + '...');

    // Check form attributes
    const formAttributes = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return null;

      return {
        action: form.action,
        method: form.method,
        onsubmit: form.onsubmit ? 'has onsubmit handler' : 'no onsubmit handler',
        eventListeners: 'unknown' // Can't easily check event listeners
      };
    });
    console.log('Form attributes:', formAttributes);

    // Check input attributes
    const inputAttributes = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      return {
        email: {
          name: emailInput?.name || '',
          required: emailInput?.required || false,
          value: emailInput?.value || ''
        },
        password: {
          name: passwordInput?.name || '',
          required: passwordInput?.required || false,
          value: passwordInput?.value || ''
        }
      };
    });
    console.log('Input attributes:', inputAttributes);
  });
});
