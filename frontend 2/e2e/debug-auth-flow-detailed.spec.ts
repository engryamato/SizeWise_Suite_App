import { test, expect, Page } from '@playwright/test';

/**
 * Detailed Authentication Flow Debug
 * 
 * Monitor every step of the authentication process with detailed logging
 */

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Detailed Authentication Flow Debug', () => {
  let page: Page;
  let authLogs: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    authLogs = [];
    
    // Capture ALL console messages
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      authLogs.push(text);
      console.log(text);
    });

    page.on('pageerror', (error) => {
      const text = `[PAGE ERROR] ${error.message}`;
      authLogs.push(text);
      console.log(text);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug: Monitor complete authentication flow', async () => {
    console.log('🔍 Starting detailed authentication flow monitoring...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 1: Inject monitoring code into the page
    await page.evaluate(() => {
      // Override console.log to capture authentication-related logs
      const originalLog = console.log;
      console.log = (...args) => {
        originalLog(...args);
        // Also log to a global array we can access
        if (!(window as any).authDebugLogs) {
          (window as any).authDebugLogs = [];
        }
        (window as any).authDebugLogs.push(args.join(' '));
      };

      // Monitor form submission
      const form = document.querySelector('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          console.log('🔥 FORM SUBMIT EVENT TRIGGERED');
          console.log('Form data:', new FormData(form));
        });
      }

      // Monitor button clicks
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.addEventListener('click', (e) => {
          console.log('🔥 SUBMIT BUTTON CLICKED');
          console.log('Button disabled:', submitButton.disabled);
          console.log('Form valid:', form?.checkValidity());
        });
      }
    });

    // Step 2: Fill the form
    console.log('📍 Filling form...');
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);

    // Step 3: Check form state before submission
    const preSubmitState = await page.evaluate(() => {
      const form = document.querySelector('form');
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

      return {
        formValid: form?.checkValidity(),
        emailValue: emailInput?.value,
        passwordValue: passwordInput?.value ? '***filled***' : 'empty',
        submitDisabled: submitButton?.disabled,
        formAction: form?.action,
        formMethod: form?.method
      };
    });
    console.log('Pre-submit state:', preSubmitState);

    // Step 4: Submit the form and monitor
    console.log('📍 Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for authentication to process
    await page.waitForTimeout(5000);

    // Step 5: Check what happened
    const postSubmitState = await page.evaluate(() => {
      return {
        currentUrl: window.location.href,
        authDebugLogs: (window as any).authDebugLogs || [],
        formStillPresent: !!document.querySelector('form'),
        errorElements: Array.from(document.querySelectorAll('.error, .text-red, [role="alert"]'))
          .map(el => el.textContent?.trim())
          .filter(Boolean)
      };
    });

    console.log('Post-submit state:', postSubmitState);
    console.log('Auth debug logs from page:', postSubmitState.authDebugLogs);

    // Step 6: Try to access the auth store directly
    const authStoreState = await page.evaluate(() => {
      try {
        // Try to access Zustand store
        const storeKeys = Object.keys(window).filter(key => 
          key.includes('store') || key.includes('auth') || key.includes('zustand')
        );
        
        return {
          availableStores: storeKeys,
          windowKeys: Object.keys(window).filter(key => key.includes('auth')).slice(0, 10)
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('Auth store investigation:', authStoreState);

    // Step 7: Check if HybridAuthManager was called
    const hybridAuthCheck = await page.evaluate(() => {
      // Look for any signs of HybridAuthManager execution
      const logs = (window as any).authDebugLogs || [];
      const hybridLogs = logs.filter((log: string) => 
        log.includes('HybridAuthManager') || 
        log.includes('isSuperAdminCredentials') ||
        log.includes('Super admin credentials detected')
      );
      
      return {
        totalLogs: logs.length,
        hybridAuthLogs: hybridLogs,
        hasAuthenticationAttempt: logs.some((log: string) => 
          log.includes('login') || log.includes('auth')
        )
      };
    });

    console.log('HybridAuthManager check:', hybridAuthCheck);

    // Step 8: Final analysis
    const finalUrl = page.url();
    const authenticationSuccessful = !finalUrl.includes('/auth/login');
    
    console.log('=== FINAL ANALYSIS ===');
    console.log('Authentication successful:', authenticationSuccessful);
    console.log('Final URL:', finalUrl);
    console.log('Total auth logs captured:', authLogs.length);
    
    // Print all authentication-related logs
    const authRelatedLogs = authLogs.filter(log => 
      log.includes('auth') || 
      log.includes('login') || 
      log.includes('submit') ||
      log.includes('🔥') ||
      log.includes('🔍')
    );
    
    console.log('Authentication-related logs:');
    authRelatedLogs.forEach((log, index) => {
      console.log(`  ${index + 1}: ${log}`);
    });

    if (!authenticationSuccessful) {
      console.log('❌ Authentication failed - investigating why...');
      
      // Take a final screenshot
      await page.screenshot({ path: 'debug-auth-failed-final.png', fullPage: true });
    }
  });
});
