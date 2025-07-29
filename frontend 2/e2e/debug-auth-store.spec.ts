import { test, expect, Page } from '@playwright/test';

/**
 * Debug Authentication Store Test
 * 
 * Test the authentication store directly to understand what's happening
 */

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Debug Authentication Store', () => {
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

  test('Debug: Test authentication store directly', async () => {
    console.log('🔍 Testing authentication store directly...');

    // Navigate to login page to ensure all scripts are loaded
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    
    // Wait for services to initialize
    await page.waitForTimeout(3000);

    // Test the authentication store directly
    const authResult = await page.evaluate(async (credentials) => {
      try {
        // Check if Zustand store is available
        const stores = Object.keys(window).filter(key => key.includes('store') || key.includes('auth'));
        console.log('Available stores on window:', stores);

        // Try to access the auth store through different methods
        let authStore = null;
        
        // Method 1: Check if it's exposed on window
        if ((window as any).useAuthStore) {
          authStore = (window as any).useAuthStore;
        }
        
        // Method 2: Try to import it dynamically
        if (!authStore) {
          try {
            const module = await import('/stores/auth-store.ts');
            authStore = module.useAuthStore;
          } catch (e) {
            console.log('Could not import auth store:', e.message);
          }
        }

        if (!authStore) {
          return { error: 'Auth store not accessible', stores };
        }

        // Get the current state
        const currentState = authStore.getState();
        console.log('Current auth state:', {
          isAuthenticated: currentState.isAuthenticated,
          user: currentState.user,
          isLoading: currentState.isLoading,
          token: !!currentState.token
        });

        // Try to login
        console.log('Attempting login with credentials:', credentials.email);
        const loginResult = await currentState.login(credentials.email, credentials.password);
        console.log('Login result:', loginResult);

        // Get state after login attempt
        const newState = authStore.getState();
        console.log('State after login:', {
          isAuthenticated: newState.isAuthenticated,
          user: newState.user,
          isLoading: newState.isLoading,
          token: !!newState.token
        });

        return { 
          success: loginResult, 
          beforeState: currentState,
          afterState: newState,
          stores 
        };
      } catch (error) {
        console.error('Error in auth test:', error);
        return { error: error.message, stack: error.stack };
      }
    }, SUPER_ADMIN_CREDENTIALS);

    console.log('Authentication store test result:', authResult);

    // If authentication was successful, check the current URL
    if (authResult.success) {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log('URL after successful auth:', currentUrl);
    }
  });

  test('Debug: Test HybridAuthManager directly', async () => {
    console.log('🔍 Testing HybridAuthManager directly...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const hybridAuthResult = await page.evaluate(async (credentials) => {
      try {
        // Try to access HybridAuthManager
        let hybridAuthManager = null;
        
        // Check if it's available on window
        if ((window as any).hybridAuthManager) {
          hybridAuthManager = (window as any).hybridAuthManager;
        }

        // Try to import it
        if (!hybridAuthManager) {
          try {
            const module = await import('/lib/auth/HybridAuthManager.ts');
            hybridAuthManager = new module.HybridAuthManager();
          } catch (e) {
            console.log('Could not import HybridAuthManager:', e.message);
          }
        }

        if (!hybridAuthManager) {
          return { error: 'HybridAuthManager not accessible' };
        }

        // Test login directly
        console.log('Testing HybridAuthManager login...');
        const result = await hybridAuthManager.login(credentials.email, credentials.password);
        console.log('HybridAuthManager result:', result);

        return { result };
      } catch (error) {
        console.error('Error testing HybridAuthManager:', error);
        return { error: error.message, stack: error.stack };
      }
    }, SUPER_ADMIN_CREDENTIALS);

    console.log('HybridAuthManager test result:', hybridAuthResult);
  });

  test('Debug: Check super admin credentials validation', async () => {
    console.log('🔍 Testing super admin credentials validation...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const credentialsTest = await page.evaluate(async (credentials) => {
      try {
        // Check environment variables
        const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@sizewise.com';
        const superAdminPassword = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD || 'SizeWise2024!6EAF4610705941';

        console.log('Environment check:', {
          expectedEmail: superAdminEmail,
          expectedPassword: superAdminPassword,
          inputEmail: credentials.email,
          inputPassword: credentials.password,
          emailMatch: credentials.email === superAdminEmail,
          passwordMatch: credentials.password === superAdminPassword
        });

        // Try to access AuthenticationManager
        let authManager = null;
        try {
          const module = await import('/lib/auth/AuthenticationManager.ts');
          authManager = new module.AuthenticationManager();
        } catch (e) {
          console.log('Could not import AuthenticationManager:', e.message);
        }

        if (authManager) {
          console.log('Testing AuthenticationManager.authenticateUser...');
          const authResult = await authManager.authenticateUser(credentials.email, credentials.password);
          console.log('AuthenticationManager result:', authResult);
          return { authResult, envCheck: true };
        }

        return { envCheck: true, error: 'AuthenticationManager not available' };
      } catch (error) {
        console.error('Error in credentials test:', error);
        return { error: error.message, stack: error.stack };
      }
    }, SUPER_ADMIN_CREDENTIALS);

    console.log('Credentials validation result:', credentialsTest);
  });
});
