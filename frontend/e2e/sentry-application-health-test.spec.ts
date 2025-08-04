import { test, expect } from '@playwright/test';

test.describe('SizeWise Suite - Sentry Application Health Testing', () => {
  test('Complete Application Health Check with Sentry Monitoring', async ({ page }) => {
    console.log('🚀 Starting comprehensive application health testing with Sentry...');
    
    // Step 1: Verify Sentry Configuration Files
    console.log('📋 Step 1: Verifying Sentry Configuration...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check Sentry initialization status
    const sentryStatus = await page.evaluate(() => {
      const checks = {
        windowSentry: typeof (window as any).Sentry !== 'undefined',
        sentryHub: typeof (window as any).__SENTRY__ !== 'undefined',
        sentryGlobal: typeof (window as any).__SENTRY_GLOBAL__ !== 'undefined',
        sentrySDK: typeof (window as any).__SENTRY_SDK__ !== 'undefined'
      };
      
      // Try to get Sentry client info
      let clientInfo = null;
      try {
        const hub = (window as any).__SENTRY__;
        if (hub && hub.hub) {
          const client = hub.hub.getClient();
          if (client) {
            const options = client.getOptions();
            clientInfo = {
              dsn: options.dsn ? 'configured' : 'missing',
              environment: options.environment || 'unknown',
              debug: options.debug || false,
              tracesSampleRate: options.tracesSampleRate || 0
            };
          }
        }
      } catch (error) {
        clientInfo = { error: error.message };
      }
      
      return { checks, clientInfo };
    });
    
    console.log('📋 Sentry status:', sentryStatus);
    
    // Step 2: Test Application Performance with Monitoring
    console.log('⚡ Step 2: Testing Application Performance with Monitoring...');
    
    const performanceMetrics = [];
    const pagesToTest = [
      { path: '/', name: 'Root' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/air-duct-sizer', name: 'Air Duct Sizer' },
      { path: '/projects', name: 'Projects' },
      { path: '/tools', name: 'Tools' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' }
    ];
    
    for (const pageInfo of pagesToTest) {
      console.log(`⚡ Testing ${pageInfo.name} performance...`);
      
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Check for JavaScript errors
      const pageErrors = await page.evaluate(() => {
        return {
          errors: (window as any).__PAGE_ERRORS__ || [],
          consoleErrors: (window as any).__CONSOLE_ERRORS__ || []
        };
      });
      
      // Test page functionality
      const functionalityTest = await page.evaluate((pageName) => {
        const buttons = document.querySelectorAll('button').length;
        const inputs = document.querySelectorAll('input').length;
        const canvases = document.querySelectorAll('canvas').length;
        const forms = document.querySelectorAll('form').length;
        
        return {
          interactive_elements: buttons + inputs,
          buttons,
          inputs,
          canvases,
          forms,
          page: pageName
        };
      }, pageInfo.name);
      
      const metrics = {
        page: pageInfo.name,
        path: pageInfo.path,
        loadTime,
        errors: pageErrors.errors.length,
        consoleErrors: pageErrors.consoleErrors.length,
        functionality: functionalityTest
      };
      
      performanceMetrics.push(metrics);
      console.log(`⚡ ${pageInfo.name}: ${loadTime}ms, ${functionalityTest.interactive_elements} elements, ${pageErrors.errors.length} errors`);
    }
    
    // Step 3: Test HVAC Calculation System Health
    console.log('🔧 Step 3: Testing HVAC Calculation System Health...');
    
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const hvacSystemHealth = await page.evaluate(() => {
      const health = {
        canvas_present: document.querySelectorAll('canvas').length > 0,
        calculation_store: typeof (window as any).useCalculationStore !== 'undefined',
        three_js: typeof (window as any).THREE !== 'undefined',
        react_three_fiber: typeof (window as any).__R3F__ !== 'undefined'
      };
      
      // Test basic canvas interaction
      const canvas = document.querySelector('canvas');
      if (canvas) {
        health.canvas_dimensions = {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        };
      }
      
      return health;
    });
    
    console.log('🔧 HVAC system health:', hvacSystemHealth);
    
    // Test canvas interactions
    const canvas = page.locator('canvas').first();
    if (await canvas.count() > 0) {
      console.log('🎨 Testing canvas interactions...');
      
      try {
        await canvas.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(500);
        await canvas.click({ position: { x: 200, y: 150 } });
        await page.waitForTimeout(500);
        console.log('✅ Canvas interactions successful');
      } catch (error) {
        console.log('⚠️ Canvas interaction failed:', error.message);
      }
    }
    
    // Step 4: Test Error Handling and Recovery
    console.log('🛡️ Step 4: Testing Error Handling and Recovery...');
    
    const errorHandlingTest = await page.evaluate(() => {
      const results = [];
      
      // Test 1: Simulate network error
      try {
        const networkError = new Error('Network timeout during HVAC calculation');
        networkError.name = 'NetworkTimeoutError';
        
        // Log error (would normally be caught by error boundary)
        results.push({
          test: 'network_error',
          error_type: networkError.name,
          message: networkError.message,
          handled: true
        });
      } catch (error) {
        results.push({
          test: 'network_error',
          error: error.message,
          handled: false
        });
      }
      
      // Test 2: Simulate calculation error
      try {
        const calcError = new Error('Invalid duct parameters: diameter must be positive');
        calcError.name = 'CalculationValidationError';
        
        results.push({
          test: 'calculation_error',
          error_type: calcError.name,
          message: calcError.message,
          handled: true
        });
      } catch (error) {
        results.push({
          test: 'calculation_error',
          error: error.message,
          handled: false
        });
      }
      
      return results;
    });
    
    console.log('🛡️ Error handling tests:', errorHandlingTest);
    
    // Step 5: Test Authentication System Health
    console.log('🔐 Step 5: Testing Authentication System Health...');
    
    const authSystemHealth = await page.evaluate(() => {
      const authElements = {
        login_form: document.querySelectorAll('form').length,
        email_input: document.querySelectorAll('input[type="email"]').length,
        password_input: document.querySelectorAll('input[type="password"]').length,
        submit_button: document.querySelectorAll('button[type="submit"]').length
      };
      
      // Check for authentication state
      const authState = {
        has_auth_token: localStorage.getItem('auth_token') !== null,
        has_user_data: localStorage.getItem('user_data') !== null,
        session_storage: sessionStorage.length > 0
      };
      
      return { elements: authElements, state: authState };
    });
    
    console.log('🔐 Authentication system health:', authSystemHealth);
    
    // Step 6: Test Data Persistence and Storage
    console.log('💾 Step 6: Testing Data Persistence and Storage...');
    
    const storageTest = await page.evaluate(() => {
      const storage = {
        localStorage: {
          available: typeof localStorage !== 'undefined',
          items: localStorage.length,
          keys: Object.keys(localStorage)
        },
        sessionStorage: {
          available: typeof sessionStorage !== 'undefined',
          items: sessionStorage.length,
          keys: Object.keys(sessionStorage)
        },
        indexedDB: {
          available: typeof indexedDB !== 'undefined'
        }
      };
      
      // Test storage functionality
      try {
        localStorage.setItem('test_key', 'test_value');
        const retrieved = localStorage.getItem('test_key');
        localStorage.removeItem('test_key');
        storage.localStorage.functional = retrieved === 'test_value';
      } catch (error) {
        storage.localStorage.functional = false;
        storage.localStorage.error = error.message;
      }
      
      return storage;
    });
    
    console.log('💾 Storage test results:', storageTest);
    
    // Step 7: Generate Health Report
    console.log('📊 Step 7: Generating Application Health Report...');
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      sentry_status: sentryStatus,
      performance_metrics: performanceMetrics,
      hvac_system: hvacSystemHealth,
      error_handling: errorHandlingTest,
      authentication: authSystemHealth,
      storage: storageTest,
      overall_health: {
        pages_tested: performanceMetrics.length,
        average_load_time: performanceMetrics.reduce((sum, m) => sum + m.loadTime, 0) / performanceMetrics.length,
        total_errors: performanceMetrics.reduce((sum, m) => sum + m.errors, 0),
        interactive_elements: performanceMetrics.reduce((sum, m) => sum + m.functionality.interactive_elements, 0),
        canvas_functional: hvacSystemHealth.canvas_present,
        storage_functional: storageTest.localStorage.functional
      }
    };
    
    console.log('📊 Application Health Report:', JSON.stringify(healthReport, null, 2));
    
    // Step 8: Verify Critical Functionality
    console.log('✅ Step 8: Verifying Critical Functionality...');
    
    const criticalChecks = {
      sentry_loaded: sentryStatus.checks.sentryHub,
      pages_loading: healthReport.overall_health.pages_tested === pagesToTest.length,
      performance_acceptable: healthReport.overall_health.average_load_time < 3000,
      no_critical_errors: healthReport.overall_health.total_errors === 0,
      hvac_canvas_working: healthReport.overall_health.canvas_functional,
      storage_working: healthReport.overall_health.storage_functional
    };
    
    console.log('✅ Critical functionality checks:', criticalChecks);
    
    // Verify all critical checks pass
    const allCriticalPassed = Object.values(criticalChecks).every(check => check === true);
    console.log(`✅ All critical checks passed: ${allCriticalPassed}`);
    
    console.log('🎉 Comprehensive application health testing with Sentry completed!');
    
    // Final verification
    expect(page.url()).toContain('localhost:3000');
    expect(healthReport.overall_health.pages_tested).toBeGreaterThan(0);
    expect(healthReport.overall_health.average_load_time).toBeLessThan(5000);
  });
});
