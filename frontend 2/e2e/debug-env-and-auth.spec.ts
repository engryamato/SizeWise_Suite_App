import { test, expect, Page } from '@playwright/test';

/**
 * Debug Environment Variables and Authentication Logic
 * 
 * Specifically test environment variable loading and authentication logic
 */

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Debug Environment and Authentication', () => {
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

  test('Debug: Check environment variables in browser context', async () => {
    console.log('🔍 Testing environment variables...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if environment variables are accessible
    const envVarsCheck = await page.evaluate(() => {
      // Check various ways environment variables might be exposed
      const checks = {
        // Check if Next.js exposes them through __NEXT_DATA__
        nextData: (window as any).__NEXT_DATA__,
        
        // Check if they're on the window object
        windowEnv: (window as any).env,
        
        // Check if they're in process.env (shouldn't be available in browser)
        processEnv: typeof process !== 'undefined' ? 'process available' : 'process not available',
        
        // Check if they're in any global variables
        globalVars: Object.keys(window).filter(key => key.includes('SUPER') || key.includes('ADMIN') || key.includes('ENV')),
        
        // Check if we can access them through module imports
        moduleCheck: 'will test separately'
      };
      
      return checks;
    });
    
    console.log('Environment variables check:', envVarsCheck);

    // Test if we can access the HybridAuthManager and its environment variables
    const authManagerCheck = await page.evaluate(async () => {
      try {
        // Try to create a simple test to check environment variable access
        const testEnvAccess = () => {
          // In a real Next.js app, environment variables starting with NEXT_PUBLIC_ 
          // should be available in the browser
          const email = process?.env?.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
          const password = process?.env?.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD;
          
          return {
            email: email || 'not found',
            password: password || 'not found',
            processAvailable: typeof process !== 'undefined'
          };
        };
        
        return testEnvAccess();
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Auth manager environment check:', authManagerCheck);
  });

  test('Debug: Test authentication logic step by step', async () => {
    console.log('🔍 Testing authentication logic step by step...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 1: Fill the form
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);

    // Step 2: Intercept the form submission to see what happens
    let formSubmissionCaught = false;
    let authenticationAttempted = false;
    
    // Monitor for any authentication-related console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('isSuperAdminCredentials') || text.includes('🔍') || text.includes('login')) {
        console.log(`[AUTH LOG] ${text}`);
        authenticationAttempted = true;
      }
      if (text.includes('form') || text.includes('submit')) {
        console.log(`[FORM LOG] ${text}`);
        formSubmissionCaught = true;
      }
    });

    // Step 3: Submit the form
    console.log('📍 Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for any authentication logic to execute
    await page.waitForTimeout(5000);
    
    console.log('Form submission caught:', formSubmissionCaught);
    console.log('Authentication attempted:', authenticationAttempted);
    
    // Step 4: Check the current state
    const currentUrl = page.url();
    console.log('Current URL after submission:', currentUrl);
    
    // Step 5: Check for any error messages
    const errorMessages = await page.locator('.error, .text-red, [role="alert"]').allTextContents();
    console.log('Error messages:', errorMessages);
  });

  test('Debug: Test HybridAuthManager directly with console injection', async () => {
    console.log('🔍 Testing HybridAuthManager with console injection...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Inject a test function into the page to test authentication
    const authTestResult = await page.evaluate(async (credentials) => {
      try {
        // Create a test function that mimics the authentication logic
        const testSuperAdminCredentials = (email: string, password: string) => {
          // Hardcode the expected values since env vars might not be available
          const EXPECTED_EMAIL = 'admin@sizewise.com';
          const EXPECTED_PASSWORD = 'SizeWise2024!6EAF4610705941';
          
          console.log('🔍 Testing super admin credentials:', {
            inputEmail: email,
            inputPassword: password,
            expectedEmail: EXPECTED_EMAIL,
            expectedPassword: EXPECTED_PASSWORD,
            emailMatch: email === EXPECTED_EMAIL,
            passwordMatch: password === EXPECTED_PASSWORD
          });
          
          return email === EXPECTED_EMAIL && password === EXPECTED_PASSWORD;
        };
        
        // Test the credentials
        const isValid = testSuperAdminCredentials(credentials.email, credentials.password);
        
        return {
          credentialsValid: isValid,
          testCompleted: true
        };
      } catch (error) {
        return {
          error: error.message,
          testCompleted: false
        };
      }
    }, SUPER_ADMIN_CREDENTIALS);
    
    console.log('Direct authentication test result:', authTestResult);
  });

  test('Debug: Check form submission event handling', async () => {
    console.log('🔍 Testing form submission event handling...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if the form has proper event handlers
    const formEventCheck = await page.evaluate(() => {
      const form = document.querySelector('form');
      const submitButton = document.querySelector('button[type="submit"]');
      
      if (!form || !submitButton) {
        return { error: 'Form or submit button not found' };
      }
      
      // Check for event listeners (this is limited in what we can detect)
      const formInfo = {
        formAction: form.action,
        formMethod: form.method,
        formOnSubmit: form.onsubmit ? 'has onsubmit' : 'no onsubmit',
        submitButtonDisabled: submitButton.disabled,
        submitButtonType: submitButton.type,
        submitButtonText: submitButton.textContent?.trim()
      };
      
      return formInfo;
    });
    
    console.log('Form event check:', formEventCheck);

    // Fill the form
    await page.fill('input[type="email"]', SUPER_ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', SUPER_ADMIN_CREDENTIALS.password);

    // Try to trigger form submission manually
    const manualSubmitResult = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        // Try to submit the form programmatically
        try {
          form.submit();
          return { manualSubmit: 'success' };
        } catch (error) {
          return { manualSubmit: 'failed', error: error.message };
        }
      }
      return { manualSubmit: 'no form found' };
    });
    
    console.log('Manual submit result:', manualSubmitResult);
    
    await page.waitForTimeout(3000);
    console.log('URL after manual submit:', page.url());
  });
});
