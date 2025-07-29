import { test, expect, Page } from '@playwright/test';

/**
 * Debug React Hydration Issues
 * 
 * Check for hydration errors and React loading issues
 */

const BASE_URL = 'http://localhost:3000';

test.describe('Debug React Hydration', () => {
  let page: Page;
  let allLogs: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    allLogs = [];
    
    // Capture ALL console messages including warnings and errors
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      allLogs.push(text);
      console.log(text);
    });

    page.on('pageerror', (error) => {
      const text = `[PAGE ERROR] ${error.message}`;
      allLogs.push(text);
      console.log(text);
      console.log(`[PAGE ERROR STACK] ${error.stack}`);
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      const text = `[NETWORK FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`;
      allLogs.push(text);
      console.log(text);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug: Check React hydration and loading', async () => {
    console.log('🔍 Checking React hydration...');

    await page.goto(`${BASE_URL}/auth/login`);
    
    // Wait for initial load
    await page.waitForLoadState('domcontentloaded');
    console.log('📍 DOM content loaded');
    
    // Wait for network idle
    await page.waitForLoadState('networkidle');
    console.log('📍 Network idle');
    
    // Give extra time for React to hydrate
    await page.waitForTimeout(10000);
    console.log('📍 Waited 10 seconds for hydration');

    // Check for hydration-related errors
    const hydrationErrors = allLogs.filter(log => 
      log.includes('hydrat') || 
      log.includes('mismatch') || 
      log.includes('Warning') ||
      log.includes('Error') ||
      log.includes('Failed')
    );

    console.log('=== HYDRATION-RELATED LOGS ===');
    hydrationErrors.forEach((log, index) => {
      console.log(`  ${index + 1}: ${log}`);
    });

    // Check React state
    const reactState = await page.evaluate(() => {
      return {
        hasReact: typeof (window as any).React !== 'undefined',
        hasReactDOM: typeof (window as any).ReactDOM !== 'undefined',
        hasNextData: !!(window as any).__NEXT_DATA__,
        hasNextRouter: !!(window as any).__NEXT_ROUTER__,
        documentReadyState: document.readyState,
        scriptsLoaded: Array.from(document.querySelectorAll('script')).length,
        reactScripts: Array.from(document.querySelectorAll('script')).filter(script => 
          script.src.includes('react') || script.src.includes('next')
        ).map(script => script.src),
        formExists: !!document.querySelector('form'),
        formHasHandlers: !!document.querySelector('form')?.onsubmit,
        buttonExists: !!document.querySelector('button[type="submit"]'),
        buttonDisabled: document.querySelector('button[type="submit"]')?.disabled
      };
    });

    console.log('=== REACT STATE ===');
    console.log(JSON.stringify(reactState, null, 2));

    // Check for specific Next.js errors
    const nextJsErrors = allLogs.filter(log => 
      log.includes('next') || 
      log.includes('Next') ||
      log.includes('_next') ||
      log.includes('chunk')
    );

    console.log('=== NEXT.JS RELATED LOGS ===');
    nextJsErrors.forEach((log, index) => {
      console.log(`  ${index + 1}: ${log}`);
    });

    // Check network requests
    const networkRequests = await page.evaluate(() => {
      return {
        performanceEntries: performance.getEntriesByType('navigation').map(entry => ({
          name: entry.name,
          duration: entry.duration,
          loadEventEnd: (entry as PerformanceNavigationTiming).loadEventEnd
        })),
        resourceEntries: performance.getEntriesByType('resource').slice(0, 10).map(entry => ({
          name: entry.name,
          duration: entry.duration
        }))
      };
    });

    console.log('=== NETWORK PERFORMANCE ===');
    console.log(JSON.stringify(networkRequests, null, 2));

    // Try to manually check if the page is interactive
    const interactivityCheck = await page.evaluate(() => {
      const form = document.querySelector('form');
      const button = document.querySelector('button[type="submit"]');
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      
      // Try to interact with elements
      const tests = {
        canFocusEmail: false,
        canTypeInEmail: false,
        canClickButton: false,
        formHasEventListeners: false
      };

      try {
        if (emailInput) {
          emailInput.focus();
          tests.canFocusEmail = true;
          
          emailInput.value = 'test@example.com';
          tests.canTypeInEmail = emailInput.value === 'test@example.com';
        }
      } catch (e) {
        console.log('Email input interaction failed:', e);
      }

      try {
        if (button && !button.disabled) {
          tests.canClickButton = true;
        }
      } catch (e) {
        console.log('Button interaction failed:', e);
      }

      // Check for event listeners (limited detection)
      try {
        if (form) {
          const hasListeners = !!(form as any)._reactInternalFiber || 
                              !!(form as any).__reactInternalInstance ||
                              !!(form as any)._reactInternals;
          tests.formHasEventListeners = hasListeners;
        }
      } catch (e) {
        console.log('Event listener check failed:', e);
      }

      return tests;
    });

    console.log('=== INTERACTIVITY CHECK ===');
    console.log(JSON.stringify(interactivityCheck, null, 2));

    // Final summary
    console.log('=== SUMMARY ===');
    console.log(`Total logs captured: ${allLogs.length}`);
    console.log(`Hydration errors: ${hydrationErrors.length}`);
    console.log(`Next.js errors: ${nextJsErrors.length}`);
    console.log(`React available: ${reactState.hasReact}`);
    console.log(`Form interactive: ${!reactState.buttonDisabled && reactState.formHasHandlers}`);
  });
});
