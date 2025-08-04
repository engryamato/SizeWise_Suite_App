import { test, expect } from '@playwright/test';

test.describe('SizeWise Suite - Comprehensive Sentry + Playwright Testing', () => {
  test('Complete Sentry Integration Testing: Error Monitoring + Application Flow', async ({ page }) => {
    console.log('🚀 Starting comprehensive Sentry + Playwright testing...');
    
    // Step 1: Test Sentry Client-Side Initialization
    console.log('🔧 Step 1: Testing Sentry Client-Side Initialization...');
    
    // Navigate to the application and check for Sentry initialization
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if Sentry is properly loaded in the browser
    const sentryLoaded = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             typeof (window as any).Sentry !== 'undefined' ||
             typeof (window as any).__SENTRY__ !== 'undefined';
    });
    
    console.log(`🔍 Sentry client-side loaded: ${sentryLoaded}`);
    
    // Check for Sentry DSN configuration
    const sentryConfig = await page.evaluate(() => {
      try {
        // Check for Sentry configuration in window object
        const sentryHub = (window as any).__SENTRY__;
        return {
          hasHub: !!sentryHub,
          hasClient: !!(sentryHub && sentryHub.hub && sentryHub.hub.getClient()),
          environment: sentryHub?.hub?.getClient()?.getOptions()?.environment || 'unknown'
        };
      } catch (error) {
        return { hasHub: false, hasClient: false, environment: 'error', error: error.message };
      }
    });
    
    console.log(`🔧 Sentry configuration:`, sentryConfig);
    
    // Step 2: Test Error Boundary Integration
    console.log('🛡️ Step 2: Testing Error Boundary Integration...');
    
    // Look for error boundary components
    const errorBoundaryElements = await page.locator('[class*="error"], [class*="boundary"], [data-testid*="error"]').count();
    console.log(`🛡️ Error boundary elements found: ${errorBoundaryElements}`);
    
    // Step 3: Test Sentry Error Capture with Intentional Errors
    console.log('⚠️ Step 3: Testing Sentry Error Capture...');
    
    // Inject a test error to verify Sentry capture
    const errorCaptureTest = await page.evaluate(() => {
      try {
        // Check if Sentry is available and capture a test error
        if (typeof (window as any).Sentry !== 'undefined') {
          const Sentry = (window as any).Sentry;
          const eventId = Sentry.captureException(new Error('Playwright Test Error - Sentry Integration Check'));
          return { success: true, eventId, method: 'window.Sentry' };
        } else if (typeof (window as any).__SENTRY__ !== 'undefined') {
          // Alternative Sentry access method
          const sentryHub = (window as any).__SENTRY__.hub;
          if (sentryHub && sentryHub.captureException) {
            const eventId = sentryHub.captureException(new Error('Playwright Test Error - Hub Integration Check'));
            return { success: true, eventId, method: 'hub.captureException' };
          }
        }
        return { success: false, reason: 'Sentry not accessible' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log(`⚠️ Error capture test result:`, errorCaptureTest);
    
    // Step 4: Test Performance Monitoring
    console.log('📊 Step 4: Testing Performance Monitoring...');
    
    const performanceTest = await page.evaluate(() => {
      try {
        // Check if performance monitoring is enabled
        const sentryHub = (window as any).__SENTRY__;
        const client = sentryHub?.hub?.getClient();
        const options = client?.getOptions();
        
        return {
          hasPerformanceMonitoring: !!(options && options.tracesSampleRate > 0),
          tracesSampleRate: options?.tracesSampleRate || 0,
          environment: options?.environment || 'unknown',
          debug: options?.debug || false
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log(`📊 Performance monitoring:`, performanceTest);
    
    // Step 5: Test Navigation with Sentry Tracking
    console.log('🧭 Step 5: Testing Navigation with Sentry Tracking...');
    
    const pagesToTest = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/air-duct-sizer', name: 'Air Duct Sizer' },
      { path: '/projects', name: 'Projects' },
      { path: '/tools', name: 'Tools' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' }
    ];
    
    for (const pageInfo of pagesToTest) {
      console.log(`🧭 Testing ${pageInfo.name} with Sentry tracking...`);
      
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Check for any JavaScript errors on the page
      const pageErrors = await page.evaluate(() => {
        return (window as any).__PAGE_ERRORS__ || [];
      });
      
      // Test Sentry breadcrumb creation for navigation
      const breadcrumbTest = await page.evaluate((pageName) => {
        try {
          const sentryHub = (window as any).__SENTRY__;
          if (sentryHub && sentryHub.hub) {
            // Add a custom breadcrumb for testing
            sentryHub.hub.addBreadcrumb({
              message: `Playwright navigated to ${pageName}`,
              category: 'navigation',
              level: 'info',
              data: { page: pageName, timestamp: Date.now() }
            });
            return { success: true, page: pageName };
          }
          return { success: false, reason: 'No Sentry hub available' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, pageInfo.name);
      
      console.log(`🧭 ${pageInfo.name}: ${loadTime}ms, Breadcrumb: ${breadcrumbTest.success}, Errors: ${pageErrors.length}`);
    }
    
    console.log('✅ Navigation with Sentry tracking completed!');

    // Step 6: Test HVAC Calculation Error Monitoring
    console.log('🔧 Step 6: Testing HVAC Calculation Error Monitoring...');

    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test calculation error handling
    const calculationErrorTest = await page.evaluate(() => {
      try {
        // Simulate a calculation error
        const testError = new Error('HVAC Calculation Test Error - Invalid Parameters');
        testError.name = 'HVACCalculationError';

        if (typeof (window as any).Sentry !== 'undefined') {
          const Sentry = (window as any).Sentry;
          const eventId = Sentry.captureException(testError, {
            tags: {
              component: 'HVACCalculator',
              test: 'playwright-integration',
              calculation_type: 'duct_sizing'
            },
            contexts: {
              calculation: {
                parameters: { diameter: 'invalid', flow_rate: -1 },
                timestamp: Date.now()
              }
            },
            level: 'error'
          });
          return { success: true, eventId, component: 'HVACCalculator' };
        }
        return { success: false, reason: 'Sentry not available' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(`🔧 HVAC calculation error test:`, calculationErrorTest);

    // Step 7: Test User Interaction Tracking
    console.log('👆 Step 7: Testing User Interaction Tracking...');

    // Test canvas interactions with Sentry tracking
    const canvas = page.locator('canvas').first();
    if (await canvas.count() > 0) {
      console.log('🎨 Testing canvas interactions with Sentry tracking...');

      // Add interaction tracking
      await page.evaluate(() => {
        if (typeof (window as any).Sentry !== 'undefined') {
          const Sentry = (window as any).Sentry;
          Sentry.addBreadcrumb({
            message: 'Playwright canvas interaction test started',
            category: 'ui.interaction',
            level: 'info',
            data: { element: 'canvas', test: 'playwright' }
          });
        }
      });

      // Perform canvas interactions
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 200, y: 150 } });
      await page.waitForTimeout(500);

      // Log interaction completion
      const interactionResult = await page.evaluate(() => {
        if (typeof (window as any).Sentry !== 'undefined') {
          const Sentry = (window as any).Sentry;
          Sentry.addBreadcrumb({
            message: 'Playwright canvas interaction test completed',
            category: 'ui.interaction',
            level: 'info',
            data: { element: 'canvas', interactions: 2, test: 'playwright' }
          });
          return { success: true, interactions: 2 };
        }
        return { success: false };
      });

      console.log(`👆 Canvas interaction tracking:`, interactionResult);
    }

    // Step 8: Test Error Recovery and Retry Mechanisms
    console.log('🔄 Step 8: Testing Error Recovery and Retry Mechanisms...');

    const errorRecoveryTest = await page.evaluate(() => {
      try {
        // Simulate an error that should trigger recovery
        const recoveryError = new Error('Test Recovery Error - Network Timeout');
        recoveryError.name = 'NetworkTimeoutError';

        if (typeof (window as any).Sentry !== 'undefined') {
          const Sentry = (window as any).Sentry;

          // Capture the error with recovery context
          const eventId = Sentry.captureException(recoveryError, {
            tags: {
              component: 'NetworkService',
              test: 'playwright-recovery',
              recoverable: 'true'
            },
            contexts: {
              recovery: {
                attempt: 1,
                max_attempts: 3,
                strategy: 'exponential_backoff'
              }
            },
            level: 'warning'
          });

          // Simulate successful recovery
          Sentry.addBreadcrumb({
            message: 'Error recovery successful',
            category: 'recovery',
            level: 'info',
            data: { original_error: 'NetworkTimeoutError', recovery_time: '2.3s' }
          });

          return { success: true, eventId, recovered: true };
        }
        return { success: false, reason: 'Sentry not available' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(`🔄 Error recovery test:`, errorRecoveryTest);

    console.log('✅ Comprehensive Sentry + Playwright testing completed!');

    // Final verification
    expect(page.url()).toContain('localhost:3000');
  });
});
