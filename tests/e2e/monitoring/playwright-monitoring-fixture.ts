/**
 * SizeWise Suite - Playwright Monitoring Fixture
 * 
 * Provides Playwright test fixtures that automatically integrate E2E monitoring
 * hooks without requiring changes to existing test code.
 * 
 * Features:
 * - Automatic test initialization and cleanup
 * - Performance metric collection
 * - Error tracking and reporting
 * - Test execution monitoring
 * - Report generation and export
 */

import { test as base, Page, BrowserContext, TestInfo } from '@playwright/test';
import { e2eMonitoring, E2EMetrics } from './e2e-monitoring-hooks';
import * as fs from 'fs';
import * as path from 'path';

// Extend the base test with monitoring capabilities
export const test = base.extend<{
  monitoredPage: Page;
  testMetrics: E2EMetrics;
}>({
  // Monitored page fixture
  monitoredPage: async ({ page }, use, testInfo) => {
    // Initialize monitoring for this test
    const testId = await e2eMonitoring.initializeTest(testInfo, page);
    
    // Use the page with monitoring enabled
    await use(page);
    
    // Finalize monitoring and collect metrics
    const finalMetrics = await e2eMonitoring.finalizeTest(
      testId, 
      testInfo.status === 'passed' ? 'passed' : 'failed',
      page
    );
    
    // Export metrics if test failed or if detailed reporting is enabled
    if (testInfo.status !== 'passed' || process.env.E2E_DETAILED_REPORTING === 'true') {
      await exportTestMetrics(finalMetrics, testInfo);
    }
  },

  // Test metrics fixture
  testMetrics: async ({ monitoredPage }, use, testInfo) => {
    // This fixture depends on monitoredPage to ensure monitoring is initialized
    const testId = `${testInfo.title}-${Date.now()}`;
    
    // Provide access to current test metrics
    await use(e2eMonitoring.getTestMetrics(testId) || {} as E2EMetrics);
  }
});

/**
 * Export test metrics to file
 */
async function exportTestMetrics(metrics: E2EMetrics, testInfo: TestInfo): Promise<void> {
  try {
    const outputDir = path.join(process.cwd(), 'test-results', 'e2e-metrics');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate filename with timestamp and test name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedTestName = testInfo.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${timestamp}_${sanitizedTestName}_metrics.json`;
    const filePath = path.join(outputDir, filename);
    
    // Write metrics to file
    fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2));
    
    console.log(`E2E metrics exported to: ${filePath}`);
    
    // Also write a summary file
    const summaryPath = path.join(outputDir, 'latest-summary.json');
    const summary = generateTestSummary(metrics);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('Failed to export E2E metrics:', error);
  }
}

/**
 * Generate test summary from metrics
 */
function generateTestSummary(metrics: E2EMetrics): any {
  return {
    testId: metrics.testId,
    testName: metrics.testName,
    status: metrics.status,
    duration: metrics.duration,
    timestamp: new Date().toISOString(),
    performance: {
      pageLoadTime: metrics.performanceMetrics.pageLoadTime,
      averageApiResponseTime: metrics.performanceMetrics.apiResponseTimes.length > 0
        ? metrics.performanceMetrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.performanceMetrics.apiResponseTimes.length
        : 0,
      networkRequests: metrics.performanceMetrics.networkRequests,
      failedRequests: metrics.performanceMetrics.failedRequests,
      memoryUsage: metrics.performanceMetrics.memoryUsage
    },
    workflow: {
      totalSteps: metrics.workflowMetrics.stepCount,
      completedSteps: metrics.workflowMetrics.completedSteps,
      failedSteps: metrics.workflowMetrics.failedSteps,
      criticalPathTime: metrics.workflowMetrics.criticalPathTime,
      userInteractions: metrics.workflowMetrics.userInteractionCount
    },
    errors: {
      jsErrors: metrics.errorMetrics.jsErrors.length,
      networkErrors: metrics.errorMetrics.networkErrors.length,
      consoleErrors: metrics.errorMetrics.consoleErrors.length,
      assertionFailures: metrics.errorMetrics.assertionFailures.length
    },
    quality: {
      successRate: metrics.workflowMetrics.stepCount > 0 
        ? (metrics.workflowMetrics.completedSteps / metrics.workflowMetrics.stepCount) * 100 
        : 0,
      errorRate: metrics.performanceMetrics.networkRequests > 0
        ? (metrics.performanceMetrics.failedRequests / metrics.performanceMetrics.networkRequests) * 100
        : 0,
      performanceScore: calculatePerformanceScore(metrics)
    }
  };
}

/**
 * Calculate performance score based on metrics
 */
function calculatePerformanceScore(metrics: E2EMetrics): number {
  let score = 100;
  
  // Deduct points for slow page load (>3 seconds)
  if (metrics.performanceMetrics.pageLoadTime > 3000) {
    score -= 20;
  } else if (metrics.performanceMetrics.pageLoadTime > 2000) {
    score -= 10;
  }
  
  // Deduct points for slow API responses (>500ms average)
  const avgApiTime = metrics.performanceMetrics.apiResponseTimes.length > 0
    ? metrics.performanceMetrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.performanceMetrics.apiResponseTimes.length
    : 0;
  
  if (avgApiTime > 500) {
    score -= 15;
  } else if (avgApiTime > 200) {
    score -= 5;
  }
  
  // Deduct points for failed requests
  if (metrics.performanceMetrics.failedRequests > 0) {
    score -= metrics.performanceMetrics.failedRequests * 5;
  }
  
  // Deduct points for JavaScript errors
  if (metrics.errorMetrics.jsErrors.length > 0) {
    score -= metrics.errorMetrics.jsErrors.length * 10;
  }
  
  // Deduct points for failed workflow steps
  if (metrics.workflowMetrics.failedSteps > 0) {
    score -= metrics.workflowMetrics.failedSteps * 15;
  }
  
  return Math.max(0, score);
}

/**
 * Monitoring utilities for use in tests
 */
export class E2ETestUtils {
  /**
   * Create a monitored test step
   */
  static async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return await e2eMonitoring.trackStep(name, fn);
  }
  
  /**
   * Track a user interaction
   */
  static trackInteraction(type: string, element: string): void {
    e2eMonitoring.trackInteraction(type, element);
  }
  
  /**
   * Get current test metrics
   */
  static getCurrentMetrics(): E2EMetrics | undefined {
    const allMetrics = e2eMonitoring.getAllMetrics();
    return allMetrics[allMetrics.length - 1]; // Get latest
  }
  
  /**
   * Wait for performance to stabilize
   */
  static async waitForPerformanceStabilization(page: Page, timeout = 5000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
    
    // Wait for any pending animations or transitions
    await page.waitForTimeout(500);
    
    // Check if there are any pending network requests
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });
    });
  }
  
  /**
   * Measure page performance
   */
  static async measurePagePerformance(page: Page): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  }> {
    return await page.evaluate(() => {
      const timing = performance.timing;
      const paintEntries = performance.getEntriesByType('paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0
      };
    });
  }
  
  /**
   * Check for accessibility violations
   */
  static async checkAccessibility(page: Page): Promise<any[]> {
    // This would integrate with axe-core or similar accessibility testing library
    // For now, return empty array as placeholder
    return [];
  }
  
  /**
   * Monitor memory usage
   */
  static async getMemoryUsage(page: Page): Promise<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null> {
    return await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
  }
}

/**
 * Global test hooks for monitoring
 */
export class E2EGlobalHooks {
  /**
   * Setup global monitoring
   */
  static setup(): void {
    // Clear any existing metrics
    e2eMonitoring.clearMetrics();
    
    console.log('E2E Monitoring initialized');
  }
  
  /**
   * Cleanup and generate final report
   */
  static async teardown(): Promise<void> {
    const report = e2eMonitoring.generatePerformanceReport();
    
    // Export final report
    const outputDir = path.join(process.cwd(), 'test-results', 'e2e-metrics');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(outputDir, `${timestamp}_final-report.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`Final E2E monitoring report exported to: ${reportPath}`);
    console.log(`Test Summary: ${report.summary.passedTests}/${report.summary.totalTests} passed`);
    console.log(`Average duration: ${report.summary.averageDuration.toFixed(2)}ms`);
    console.log(`Average page load: ${report.summary.averagePageLoadTime.toFixed(2)}ms`);
    console.log(`Average API response: ${report.summary.averageApiResponseTime.toFixed(2)}ms`);
  }
}

// Export the expect function from Playwright for convenience
export { expect } from '@playwright/test';
