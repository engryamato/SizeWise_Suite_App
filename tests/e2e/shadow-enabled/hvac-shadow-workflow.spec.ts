/**
 * SizeWise Suite - HVAC Shadow Testing Workflow
 * 
 * Demonstrates shadow testing integration with HVAC calculation workflows.
 * These tests run in shadow mode initially and are gradually promoted to
 * enforcement based on reliability metrics.
 */

import { shadowTest, expect, ShadowTestUtils, wrapWithShadowTesting } from '../shadow-testing/playwright-shadow-fixture';

// Example of using shadow test fixture
shadowTest.describe('HVAC Shadow Testing Workflow', () => {
  
  shadowTest('Air Duct Sizing Calculation - Shadow Mode', async ({ shadowPage, shadowResult }) => {
    // This test will run in shadow mode initially
    await shadowPage.goto('/calculations/air-duct');
    
    // Fill in calculation parameters
    await shadowPage.fill('[data-testid="duct-diameter"]', '12');
    await shadowPage.fill('[data-testid="airflow-rate"]', '1000');
    await shadowPage.fill('[data-testid="duct-length"]', '50');
    
    // Trigger calculation
    await shadowPage.click('[data-testid="calculate-btn"]');
    
    // Wait for results
    await shadowPage.waitForSelector('[data-testid="calculation-results"]');
    
    // Verify results are displayed
    await expect(shadowPage.locator('[data-testid="pressure-drop"]')).toBeVisible();
    await expect(shadowPage.locator('[data-testid="velocity"]')).toBeVisible();
    
    // Check if test is in enforced mode
    const isEnforced = ShadowTestUtils.isEnforcedMode('Air Duct Sizing Calculation - Shadow Mode');
    console.log(`Test mode: ${isEnforced ? 'ENFORCED' : 'SHADOW'}`);
    
    // Get reliability metrics
    const reliability = ShadowTestUtils.getTestReliability('Air Duct Sizing Calculation - Shadow Mode');
    console.log(`Success rate: ${reliability.successRate}%, Total runs: ${reliability.totalRuns}`);
  });

  shadowTest('Grease Duct Sizing - Progressive Enhancement', async ({ shadowPage }) => {
    // Navigate to grease duct calculations
    await shadowPage.goto('/calculations/grease-duct');
    
    // Test new grease duct sizing features
    await shadowPage.fill('[data-testid="appliance-type"]', 'fryer');
    await shadowPage.fill('[data-testid="btu-rating"]', '150000');
    await shadowPage.selectOption('[data-testid="duct-material"]', 'stainless-steel');
    
    // Calculate grease duct requirements
    await shadowPage.click('[data-testid="calculate-grease-duct"]');
    
    // Verify new features work correctly
    await expect(shadowPage.locator('[data-testid="duct-size-result"]')).toBeVisible();
    await expect(shadowPage.locator('[data-testid="cleaning-access"]')).toBeVisible();
    
    // Test enhanced validation features (new functionality)
    await shadowPage.click('[data-testid="validate-design"]');
    await expect(shadowPage.locator('[data-testid="validation-results"]')).toBeVisible();
  });

  shadowTest('Equipment Sizing with 3D Visualization', async ({ shadowPage }) => {
    // Test new 3D visualization features
    await shadowPage.goto('/calculations/equipment-sizing');
    
    // Configure equipment parameters
    await shadowPage.fill('[data-testid="cooling-load"]', '5');
    await shadowPage.selectOption('[data-testid="equipment-type"]', 'rooftop-unit');
    
    // Enable 3D visualization (new feature)
    await shadowPage.check('[data-testid="enable-3d-view"]');
    
    // Generate sizing calculation
    await shadowPage.click('[data-testid="size-equipment"]');
    
    // Wait for 3D visualization to load
    await shadowPage.waitForSelector('[data-testid="3d-visualization"]', { timeout: 10000 });
    
    // Verify 3D features work
    await expect(shadowPage.locator('[data-testid="3d-canvas"]')).toBeVisible();
    await expect(shadowPage.locator('[data-testid="3d-controls"]')).toBeVisible();
    
    // Test interaction with 3D model
    await shadowPage.click('[data-testid="rotate-model"]');
    await shadowPage.click('[data-testid="zoom-in"]');
  });

  shadowTest('Offline Mode HVAC Calculations', async ({ shadowPage }) => {
    // Test offline functionality with shadow testing
    await shadowPage.goto('/calculations/air-duct');
    
    // Simulate offline mode
    await shadowPage.context().setOffline(true);
    
    // Verify offline calculations still work
    await shadowPage.fill('[data-testid="duct-diameter"]', '8');
    await shadowPage.fill('[data-testid="airflow-rate"]', '800');
    await shadowPage.click('[data-testid="calculate-btn"]');
    
    // Should work offline
    await expect(shadowPage.locator('[data-testid="calculation-results"]')).toBeVisible();
    
    // Test offline data persistence
    await shadowPage.reload();
    await expect(shadowPage.locator('[data-testid="duct-diameter"]')).toHaveValue('8');
    
    // Restore online mode
    await shadowPage.context().setOffline(false);
  });

  shadowTest('Performance Benchmarking Test', async ({ shadowPage }) => {
    // Test performance with shadow testing monitoring
    const startTime = Date.now();
    
    await shadowPage.goto('/calculations/load-calculation');
    
    // Perform complex calculation
    await shadowPage.fill('[data-testid="building-area"]', '10000');
    await shadowPage.fill('[data-testid="occupancy"]', '100');
    await shadowPage.selectOption('[data-testid="building-type"]', 'office');
    
    // Trigger calculation
    await shadowPage.click('[data-testid="calculate-load"]');
    
    // Wait for results
    await shadowPage.waitForSelector('[data-testid="load-results"]');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Performance assertion (will be tracked in shadow mode)
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    
    // Verify calculation accuracy
    const coolingLoad = await shadowPage.locator('[data-testid="cooling-load-result"]').textContent();
    expect(coolingLoad).toMatch(/\d+\.\d+ tons/);
  });
});

// Example of using wrapper function for existing tests
shadowTest.describe('Legacy Test Migration', () => {
  
  shadowTest('Wrapped Legacy Test', async ({ shadowPage }) => {
    const legacyTest = wrapWithShadowTesting(
      'Legacy HVAC Calculation Test',
      async (page) => {
        await page.goto('/calculations');
        await page.click('[data-testid="legacy-calculator"]');
        await expect(page.locator('[data-testid="legacy-results"]')).toBeVisible();
      }
    );
    
    await legacyTest(shadowPage);
  });
});

// Example of conditional shadow testing
shadowTest.describe('Conditional Shadow Tests', () => {
  
  shadowTest('Feature Flag Dependent Test', async ({ shadowPage }) => {
    // Only run if feature flag is enabled
    const featureEnabled = process.env.ENABLE_NEW_FEATURE === 'true';
    
    if (!featureEnabled) {
      shadowTest.skip();
      return;
    }
    
    await shadowPage.goto('/calculations/new-feature');
    await expect(shadowPage.locator('[data-testid="new-feature"]')).toBeVisible();
  });
  
  shadowTest('Environment Specific Test', async ({ shadowPage }) => {
    // Different behavior in different environments
    const isProduction = process.env.NODE_ENV === 'production';
    
    await shadowPage.goto('/calculations');
    
    if (isProduction) {
      // Production-specific assertions
      await expect(shadowPage.locator('[data-testid="analytics-tracking"]')).toBeVisible();
    } else {
      // Development-specific assertions
      await expect(shadowPage.locator('[data-testid="debug-panel"]')).toBeVisible();
    }
  });
});

// Example of shadow test with custom configuration
shadowTest.describe('Custom Configuration Tests', () => {
  
  shadowTest.beforeAll(async () => {
    // Update shadow test configuration for this test suite
    ShadowTestUtils.updateConfig({
      enforcementThreshold: 98, // Higher threshold for critical tests
      monitoringPeriod: 14,     // Longer monitoring period
      maxFailureRate: 2         // Lower failure tolerance
    });
  });
  
  shadowTest('Critical HVAC Safety Calculation', async ({ shadowPage }) => {
    // Critical safety calculation that requires high reliability
    await shadowPage.goto('/calculations/safety/exhaust-sizing');
    
    // Configure safety parameters
    await shadowPage.fill('[data-testid="hazardous-material"]', 'carbon-monoxide');
    await shadowPage.fill('[data-testid="room-volume"]', '1000');
    await shadowPage.fill('[data-testid="air-changes"]', '6');
    
    // Calculate required exhaust
    await shadowPage.click('[data-testid="calculate-exhaust"]');
    
    // Verify safety calculations
    await expect(shadowPage.locator('[data-testid="exhaust-cfm"]')).toBeVisible();
    await expect(shadowPage.locator('[data-testid="safety-margin"]')).toBeVisible();
    
    // Verify safety warnings are displayed
    await expect(shadowPage.locator('[data-testid="safety-warnings"]')).toBeVisible();
  });
  
  shadowTest.afterAll(async () => {
    // Reset configuration
    ShadowTestUtils.updateConfig({
      enforcementThreshold: 95,
      monitoringPeriod: 7,
      maxFailureRate: 5
    });
  });
});

// Example of shadow test reporting
shadowTest.describe('Shadow Test Reporting', () => {
  
  shadowTest.afterAll(async () => {
    // Generate shadow test report
    const reportPath = ShadowTestUtils.generateReport(7);
    console.log(`Shadow test report generated: ${reportPath}`);
    
    // Get overall reliability metrics
    const allMetrics = ShadowTestUtils.getTestReliability('Overall Test Suite');
    console.log(`Overall success rate: ${allMetrics.successRate}%`);
  });
});
