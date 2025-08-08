import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive Authentication Debug Test
 * 
 * Uses all available debugging capabilities to diagnose authentication issues:
 * - Sentry error capture
 * - Network monitoring
 * - Console logging
 * - Screenshots at each step
 * - Environment variable validation
 * - React state monitoring
 */

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Comprehensive Authentication Debug', () => {
  let page: Page;
  let context: BrowserContext;
  let consoleMessages: string[] = [];
  let networkRequests: any[] = [];
  let networkResponses: any[] = [];
  let sentryEvents: any[] = [];

  test.beforeEach(async ({ browser }) => {
    // Start tracing for detailed debugging
    context = await browser.newContext();
    await context.tracing.start({ screenshots: true, snapshots: true });
    
    page = await context.newPage();
    
    // Reset arrays
    consoleMessages = [];
    networkRequests = [];
    networkResponses = [];
    sentryEvents = [];
    
    // Capture all console messages including Sentry
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
      
      // Capture Sentry events
      if (text.includes('Sentry event') || text.includes('📊')) {
        sentryEvents.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const text = `[PAGE ERROR] ${error.message}`;
      consoleMessages.push(text);
      console.log(text);
    });

    // Capture all network requests
    page.on('request', (request) => {
      const requestData = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      };
      networkRequests.push(requestData);
      
      if (request.url().includes('/api/') || request.url().includes('/auth/') || request.method() === 'POST') {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    // Capture all network responses
    page.on('response', (response) => {
      const responseData = {
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      };
      networkResponses.push(responseData);
      
      if (response.url().includes('/api/') || response.url().includes('/auth/') || response.request().method() === 'POST') {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    // Capture request failures
    page.on('requestfailed', (request) => {
      const text = `[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`;
      consoleMessages.push(text);
      console.log(text);
    });
  });

  test.afterEach(async () => {
    // Stop tracing and save
    await context.tracing.stop({ path: 'auth-debug-trace.zip' });
    await page.close();
    await context.close();
  });

  test('Comprehensive Debug: Full Authentication Flow Analysis', async () => {
    console.log('🔍 Starting comprehensive authentication debug...');

    // Step 1: Environment Variable Check
    console.log('📍 Step 1: Environment Variable Validation');
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    
    const envCheck = await page.evaluate(() => {
      // Environment variables are not directly accessible in browser context
      // Check if they're available through window or other means
      return {
        windowEnv: (window as any).env || 'not available',
        nextConfig: (window as any).__NEXT_DATA__?.props?.pageProps || 'not available',
        location: window.location.href,
        userAgent: navigator.userAgent
      };
    });
    console.log('Environment variables:', envCheck);
    await page.screenshot({ path: 'debug-01-env-check.png', fullPage: true });

    // Step 2: Sentry Initialization Check
    console.log('📍 Step 2: Sentry Integration Check');
    const sentryCheck = await page.evaluate(() => {
      return {
        sentryAvailable: typeof (window as any).Sentry !== 'undefined',
        sentryHub: !!(window as any).Sentry?.getCurrentHub,
        sentryScope: !!(window as any).Sentry?.getCurrentScope,
        sentryClient: !!(window as any).Sentry?.getClient
      };
    });
    console.log('Sentry integration status:', sentryCheck);

    // Step 3: Initial Page State Analysis
    console.log('📍 Step 3: Initial Page State Analysis');
    await page.waitForTimeout(3000); // Wait for all services to initialize
    
    const pageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        formCount: document.querySelectorAll('form').length,
        inputCount: document.querySelectorAll('input').length,
        buttonCount: document.querySelectorAll('button').length,
        errorElements: document.querySelectorAll('.error, .text-red, [role="alert"]').length,
        loadingElements: document.querySelectorAll('.loading, .spinner, [data-testid="loading"]').length
      };
    });
    console.log('Initial page state:', pageState);
    await page.screenshot({ path: 'debug-02-initial-state.png', fullPage: true });

    // Step 4: Form Element Validation
    console.log('📍 Step 4: Form Element Validation');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    const formValidation = await page.evaluate(() => {
      const form = document.querySelector('form');
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

      return {
        formAction: form?.action || 'no action',
        formMethod: form?.method || 'no method',
        emailName: emailInput?.name || 'no name',
        emailRequired: emailInput?.required || false,
        passwordName: passwordInput?.name || 'no name',
        passwordRequired: passwordInput?.required || false,
        submitDisabled: submitButton?.disabled || false,
        submitText: submitButton?.textContent?.trim() || 'no text'
      };
    });
    console.log('Form validation details:', formValidation);

    // Step 5: Credential Input with Monitoring
    console.log('📍 Step 5: Credential Input with Monitoring');
    
    // Monitor for any immediate errors when typing
    await emailInput.click();
    await emailInput.fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.waitForTimeout(500);
    
    await passwordInput.click();
    await passwordInput.fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'debug-03-credentials-filled.png', fullPage: true });

    // Check for validation errors after filling
    const validationErrors = await page.locator('.error, .text-red, [role="alert"]').allTextContents();
    console.log('Validation errors after filling:', validationErrors);

    // Step 6: Pre-Submit State Check
    console.log('📍 Step 6: Pre-Submit State Check');
    const preSubmitState = await page.evaluate(() => {
      const form = document.querySelector('form');
      return {
        formValid: form?.checkValidity() || false,
        emailValue: (document.querySelector('input[type="email"]') as HTMLInputElement)?.value || '',
        passwordValue: (document.querySelector('input[type="password"]') as HTMLInputElement)?.value ? '***filled***' : 'empty',
        submitEnabled: !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled
      };
    });
    console.log('Pre-submit state:', preSubmitState);

    // Step 7: Form Submission with Comprehensive Monitoring
    console.log('📍 Step 7: Form Submission with Comprehensive Monitoring');
    
    // Submit form and wait for cookie then navigate deterministically
    await submitButton.click();
    console.log('✅ Submit button clicked');
    await page.screenshot({ path: 'debug-04-after-submit-click.png', fullPage: true });

    await page.waitForFunction(() => document.cookie.includes('auth-token='), null, { timeout: 10000 });
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 8: Post-Submit Analysis
    console.log('📍 Step 8: Post-Submit Analysis');
    const postSubmitState = await page.evaluate(() => {
      return {
        currentUrl: window.location.href,
        errorElements: Array.from(document.querySelectorAll('.error, .text-red, [role="alert"]')).map(el => el.textContent?.trim()).filter(Boolean),
        loadingElements: document.querySelectorAll('.loading, .spinner, [data-testid="loading"]').length,
        formStillPresent: !!document.querySelector('form'),
        submitButtonState: (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled ? 'disabled' : 'enabled'
      };
    });
    console.log('Post-submit state:', postSubmitState);
    await page.screenshot({ path: 'debug-05-post-submit.png', fullPage: true });

    // Step 9: Network Analysis
    console.log('📍 Step 9: Network Analysis');
    console.log('Total network requests:', networkRequests.length);
    console.log('Total network responses:', networkResponses.length);
    
    const authRelatedRequests = networkRequests.filter(req => 
      req.url.includes('/api/') || 
      req.url.includes('/auth/') || 
      req.method === 'POST'
    );
    console.log('Auth-related requests:', authRelatedRequests);

    // Step 10: Sentry Events Analysis
    console.log('📍 Step 10: Sentry Events Analysis');
    console.log('Sentry events captured:', sentryEvents);

    // Step 11: Console Messages Summary
    console.log('📍 Step 11: Console Messages Summary');
    const errorMessages = consoleMessages.filter(msg => msg.includes('[error]') || msg.includes('ERROR'));
    const warningMessages = consoleMessages.filter(msg => msg.includes('[warning]') || msg.includes('WARN'));
    
    console.log('Error messages:', errorMessages);
    console.log('Warning messages:', warningMessages);

    // Step 12: Final State Check
    console.log('📍 Step 12: Final State Check');
    const finalUrl = page.url();
    const authenticationSuccessful = !finalUrl.includes('/auth/login');
    
    console.log('Final URL:', finalUrl);
    console.log('Authentication successful:', authenticationSuccessful);
    
    if (!authenticationSuccessful) {
      console.log('❌ Authentication failed - user still on login page');
      
      // Try to get more specific error information
      const specificErrors = await page.evaluate(() => {
        const errorElements = Array.from(document.querySelectorAll('.error, .text-red, [role="alert"], .alert-error'));
        return errorElements.map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent?.trim(),
          innerHTML: el.innerHTML
        }));
      });
      console.log('Specific error elements:', specificErrors);
    } else {
      console.log('✅ Authentication successful - redirected away from login');
    }

    console.log('🔍 Comprehensive debug completed');
  });
});
