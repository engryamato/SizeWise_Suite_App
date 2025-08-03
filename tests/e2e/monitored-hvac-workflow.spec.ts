/**
 * SizeWise Suite - Monitored HVAC Workflow E2E Tests
 * 
 * Enhanced E2E tests with comprehensive monitoring and performance tracking.
 * Tests critical HVAC workflows while collecting detailed metrics.
 * 
 * Features:
 * - Performance monitoring for all user interactions
 * - Error tracking and reporting
 * - Workflow timing analysis
 * - Resource usage monitoring
 * - Test reliability metrics
 */

import { test, expect, E2ETestUtils } from './monitoring/playwright-monitoring-fixture';
import { 
  monitoredClick, 
  monitoredFill, 
  monitoredNavigate, 
  monitoredWaitFor,
  monitoredExpect 
} from './monitoring/e2e-monitoring-hooks';

// Test data constants
const TEST_PROJECT = {
  name: 'Monitored E2E Test HVAC Project',
  buildingArea: '10000',
  occupancy: '100',
  buildingType: 'office',
  climateZone: 'zone_4a'
};

const HVAC_CALCULATIONS = {
  airDuct: {
    roomArea: '500',
    cfmRequired: '2000',
    ductMaterial: 'galvanized_steel'
  },
  loadCalculation: {
    buildingArea: '5000',
    occupancy: '50',
    buildingType: 'office'
  },
  equipmentSizing: {
    heatingLoad: '50000',
    coolingLoad: '60000',
    systemType: 'heat_pump'
  }
};

test.describe('Monitored HVAC Workflow Tests', () => {
  test.beforeEach(async ({ monitoredPage }) => {
    // Wait for performance stabilization before starting tests
    await E2ETestUtils.waitForPerformanceStabilization(monitoredPage);
  });

  test('Complete HVAC Design Workflow with Performance Monitoring', async ({ monitoredPage }) => {
    // Step 1: Navigate to application
    await E2ETestUtils.step('Navigate to Application', async () => {
      await monitoredNavigate(monitoredPage, '/');
      await monitoredWaitFor(monitoredPage, '[data-testid="app-header"]');
    });

    // Measure initial page performance
    const initialPerformance = await E2ETestUtils.measurePagePerformance(monitoredPage);
    console.log('Initial page performance:', initialPerformance);

    // Step 2: Create new project
    await E2ETestUtils.step('Create New Project', async () => {
      await monitoredClick(monitoredPage, '[data-testid="new-project-btn"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="project-form"]');
      
      await monitoredFill(monitoredPage, '[data-testid="project-name"]', TEST_PROJECT.name);
      await monitoredFill(monitoredPage, '[data-testid="building-area"]', TEST_PROJECT.buildingArea);
      await monitoredFill(monitoredPage, '[data-testid="occupancy"]', TEST_PROJECT.occupancy);
      
      await monitoredClick(monitoredPage, '[data-testid="building-type"]');
      await monitoredClick(monitoredPage, `[data-value="${TEST_PROJECT.buildingType}"]`);
      
      await monitoredClick(monitoredPage, '[data-testid="create-project-btn"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="project-dashboard"]');
    });

    // Step 3: Perform Air Duct Sizing Calculation
    await E2ETestUtils.step('Air Duct Sizing Calculation', async () => {
      await monitoredClick(monitoredPage, '[data-testid="air-duct-sizing"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="air-duct-form"]');
      
      await monitoredFill(monitoredPage, '[data-testid="room-area"]', HVAC_CALCULATIONS.airDuct.roomArea);
      await monitoredFill(monitoredPage, '[data-testid="cfm-required"]', HVAC_CALCULATIONS.airDuct.cfmRequired);
      
      await monitoredClick(monitoredPage, '[data-testid="duct-material"]');
      await monitoredClick(monitoredPage, `[data-value="${HVAC_CALCULATIONS.airDuct.ductMaterial}"]`);
      
      await monitoredClick(monitoredPage, '[data-testid="calculate-btn"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="calculation-results"]');
      
      // Verify calculation results
      await monitoredExpected('Air duct calculation results displayed', async () => {
        await expect(monitoredPage.locator('[data-testid="duct-diameter"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="pressure-drop"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="velocity"]')).toBeVisible();
      });
    });

    // Step 4: Perform Load Calculation
    await E2ETestUtils.step('Load Calculation', async () => {
      await monitoredClick(monitoredPage, '[data-testid="load-calculation"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="load-calc-form"]');
      
      await monitoredFill(monitoredPage, '[data-testid="building-area-load"]', HVAC_CALCULATIONS.loadCalculation.buildingArea);
      await monitoredFill(monitoredPage, '[data-testid="occupancy-load"]', HVAC_CALCULATIONS.loadCalculation.occupancy);
      
      await monitoredClick(monitoredPage, '[data-testid="building-type-load"]');
      await monitoredClick(monitoredPage, `[data-value="${HVAC_CALCULATIONS.loadCalculation.buildingType}"]`);
      
      await monitoredClick(monitoredPage, '[data-testid="calculate-load-btn"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="load-results"]');
      
      // Verify load calculation results
      await monitoredExpected('Load calculation results displayed', async () => {
        await expect(monitoredPage.locator('[data-testid="heating-load"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="cooling-load"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="total-load"]')).toBeVisible();
      });
    });

    // Step 5: Equipment Sizing
    await E2ETestUtils.step('Equipment Sizing', async () => {
      await monitoredClick(monitoredPage, '[data-testid="equipment-sizing"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="equipment-form"]');
      
      await monitoredFill(monitoredPage, '[data-testid="heating-load-input"]', HVAC_CALCULATIONS.equipmentSizing.heatingLoad);
      await monitoredFill(monitoredPage, '[data-testid="cooling-load-input"]', HVAC_CALCULATIONS.equipmentSizing.coolingLoad);
      
      await monitoredClick(monitoredPage, '[data-testid="system-type"]');
      await monitoredClick(monitoredPage, `[data-value="${HVAC_CALCULATIONS.equipmentSizing.systemType}"]`);
      
      await monitoredClick(monitoredPage, '[data-testid="size-equipment-btn"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="equipment-results"]');
      
      // Verify equipment sizing results
      await monitoredExpected('Equipment sizing results displayed', async () => {
        await expect(monitoredPage.locator('[data-testid="equipment-capacity"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="equipment-model"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="efficiency-rating"]')).toBeVisible();
      });
    });

    // Step 6: Generate Report
    await E2ETestUtils.step('Generate Project Report', async () => {
      await monitoredClick(monitoredPage, '[data-testid="generate-report"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="report-options"]');
      
      await monitoredClick(monitoredPage, '[data-testid="include-calculations"]');
      await monitoredClick(monitoredPage, '[data-testid="include-diagrams"]');
      await monitoredClick(monitoredPage, '[data-testid="include-specifications"]');
      
      await monitoredClick(monitoredPage, '[data-testid="generate-pdf-btn"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="report-generated"]');
      
      // Verify report generation
      await monitoredExpected('Report generated successfully', async () => {
        await expect(monitoredPage.locator('[data-testid="download-report"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="report-preview"]')).toBeVisible();
      });
    });

    // Step 7: Test Offline Functionality
    await E2ETestUtils.step('Test Offline Functionality', async () => {
      // Simulate offline mode
      await monitoredPage.context().setOffline(true);
      
      // Verify offline functionality
      await monitoredClick(monitoredPage, '[data-testid="offline-calculations"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="offline-mode-indicator"]');
      
      // Perform calculation in offline mode
      await monitoredFill(monitoredPage, '[data-testid="offline-duct-size"]', '12');
      await monitoredClick(monitoredPage, '[data-testid="offline-calculate"]');
      
      await monitoredExpected('Offline calculation works', async () => {
        await expect(monitoredPage.locator('[data-testid="offline-result"]')).toBeVisible();
      });
      
      // Restore online mode
      await monitoredPage.context().setOffline(false);
      await monitoredWaitFor(monitoredPage, '[data-testid="online-mode-indicator"]');
    });

    // Final performance measurement
    const finalPerformance = await E2ETestUtils.measurePagePerformance(monitoredPage);
    console.log('Final page performance:', finalPerformance);

    // Check memory usage
    const memoryUsage = await E2ETestUtils.getMemoryUsage(monitoredPage);
    if (memoryUsage) {
      console.log('Memory usage:', memoryUsage);
    }

    // Get current test metrics
    const currentMetrics = E2ETestUtils.getCurrentMetrics();
    if (currentMetrics) {
      console.log('Test execution metrics:', {
        duration: currentMetrics.duration,
        steps: currentMetrics.workflowMetrics.stepCount,
        interactions: currentMetrics.workflowMetrics.userInteractionCount,
        errors: currentMetrics.errorMetrics.jsErrors.length
      });
    }
  });

  test('HVAC Calculation Performance Benchmark', async ({ monitoredPage }) => {
    // This test focuses specifically on calculation performance
    
    await E2ETestUtils.step('Setup Performance Test', async () => {
      await monitoredNavigate(monitoredPage, '/calculations');
      await monitoredWaitFor(monitoredPage, '[data-testid="calculation-dashboard"]');
    });

    // Benchmark air duct calculations
    await E2ETestUtils.step('Benchmark Air Duct Calculations', async () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        await monitoredClick(monitoredPage, '[data-testid="air-duct-quick-calc"]');
        await monitoredFill(monitoredPage, '[data-testid="quick-cfm"]', (1000 + i * 100).toString());
        await monitoredClick(monitoredPage, '[data-testid="quick-calculate"]');
        await monitoredWaitFor(monitoredPage, '[data-testid="quick-result"]');
        await monitoredClick(monitoredPage, '[data-testid="clear-result"]');
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 10;
      
      console.log(`Average calculation time: ${averageTime.toFixed(2)}ms`);
      
      // Assert performance benchmark
      await monitoredExpected('Calculation performance meets benchmark', async () => {
        expect(averageTime).toBeLessThan(500); // Should complete in under 500ms
      });
    });

    // Benchmark load calculations
    await E2ETestUtils.step('Benchmark Load Calculations', async () => {
      const startTime = performance.now();
      
      await monitoredClick(monitoredPage, '[data-testid="load-calc-benchmark"]');
      await monitoredFill(monitoredPage, '[data-testid="benchmark-area"]', '5000');
      await monitoredFill(monitoredPage, '[data-testid="benchmark-occupancy"]', '100');
      await monitoredClick(monitoredPage, '[data-testid="run-benchmark"]');
      await monitoredWaitFor(monitoredPage, '[data-testid="benchmark-complete"]');
      
      const endTime = performance.now();
      const calculationTime = endTime - startTime;
      
      console.log(`Load calculation time: ${calculationTime.toFixed(2)}ms`);
      
      // Assert performance benchmark
      await monitoredExpected('Load calculation performance meets benchmark', async () => {
        expect(calculationTime).toBeLessThan(1000); // Should complete in under 1 second
      });
    });
  });

  test('Error Handling and Recovery', async ({ monitoredPage }) => {
    // Test error scenarios and recovery mechanisms
    
    await E2ETestUtils.step('Navigate to Error Test Page', async () => {
      await monitoredNavigate(monitoredPage, '/error-test');
      await monitoredWaitFor(monitoredPage, '[data-testid="error-test-dashboard"]');
    });

    // Test invalid input handling
    await E2ETestUtils.step('Test Invalid Input Handling', async () => {
      await monitoredFill(monitoredPage, '[data-testid="invalid-input"]', 'invalid-data');
      await monitoredClick(monitoredPage, '[data-testid="submit-invalid"]');
      
      await monitoredExpected('Error message displayed for invalid input', async () => {
        await expect(monitoredPage.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="error-message"]')).toContainText('Invalid input');
      });
    });

    // Test network error recovery
    await E2ETestUtils.step('Test Network Error Recovery', async () => {
      // Simulate network failure
      await monitoredPage.route('**/api/**', route => route.abort());
      
      await monitoredClick(monitoredPage, '[data-testid="network-dependent-action"]');
      
      await monitoredExpected('Network error handled gracefully', async () => {
        await expect(monitoredPage.locator('[data-testid="network-error-message"]')).toBeVisible();
        await expect(monitoredPage.locator('[data-testid="retry-button"]')).toBeVisible();
      });
      
      // Restore network and test recovery
      await monitoredPage.unroute('**/api/**');
      await monitoredClick(monitoredPage, '[data-testid="retry-button"]');
      
      await monitoredExpected('Recovery successful after network restoration', async () => {
        await expect(monitoredPage.locator('[data-testid="success-message"]')).toBeVisible();
      });
    });
  });
});

// Helper function for monitored expect (fixing typo from above)
async function monitoredExpected(assertion: string, expectFunction: () => Promise<void>): Promise<void> {
  try {
    await expectFunction();
  } catch (error) {
    E2ETestUtils.trackInteraction('assertion_failure', assertion);
    throw error;
  }
}
