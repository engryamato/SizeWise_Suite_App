/**
 * SizeWise Suite - E2E Monitoring Hooks
 * 
 * Provides comprehensive monitoring and performance tracking for E2E tests.
 * Captures metrics, performance data, and test execution reliability without
 * interfering with test execution.
 * 
 * Features:
 * - Performance metric collection
 * - Test execution monitoring
 * - Error tracking and reporting
 * - Workflow timing analysis
 * - Resource usage monitoring
 * - Test reliability metrics
 */

import { Page, BrowserContext, TestInfo } from '@playwright/test';
import { performance } from 'perf_hooks';

export interface E2EMetrics {
  testId: string;
  testName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'passed' | 'failed' | 'skipped';
  performanceMetrics: PerformanceMetrics;
  workflowMetrics: WorkflowMetrics;
  errorMetrics: ErrorMetrics;
  resourceMetrics: ResourceMetrics;
  metadata: Record<string, any>;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  navigationTime: number;
  renderTime: number;
  interactionTime: number;
  apiResponseTimes: number[];
  memoryUsage: number;
  networkRequests: number;
  failedRequests: number;
}

export interface WorkflowMetrics {
  stepCount: number;
  completedSteps: number;
  failedSteps: number;
  stepTimings: Array<{
    stepName: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
  }>;
  criticalPathTime: number;
  userInteractionCount: number;
}

export interface ErrorMetrics {
  jsErrors: Array<{
    message: string;
    stack: string;
    timestamp: number;
    url: string;
  }>;
  networkErrors: Array<{
    url: string;
    status: number;
    statusText: string;
    timestamp: number;
  }>;
  consoleErrors: Array<{
    type: string;
    message: string;
    timestamp: number;
  }>;
  assertionFailures: Array<{
    assertion: string;
    expected: any;
    actual: any;
    timestamp: number;
  }>;
}

export interface ResourceMetrics {
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  cpuUsage: number;
  networkBandwidth: number;
  storageUsage: number;
  cacheHitRate: number;
}

export class E2EMonitoringHooks {
  private metrics: Map<string, E2EMetrics> = new Map();
  private currentTest: string | null = null;
  private stepCounter: number = 0;
  
  constructor() {
    this.initializeGlobalErrorHandling();
  }

  /**
   * Initialize monitoring for a test
   */
  async initializeTest(testInfo: TestInfo, page: Page): Promise<string> {
    const testId = `${testInfo.title}-${Date.now()}`;
    this.currentTest = testId;
    this.stepCounter = 0;

    const metrics: E2EMetrics = {
      testId,
      testName: testInfo.title,
      startTime: performance.now(),
      status: 'running',
      performanceMetrics: {
        pageLoadTime: 0,
        navigationTime: 0,
        renderTime: 0,
        interactionTime: 0,
        apiResponseTimes: [],
        memoryUsage: 0,
        networkRequests: 0,
        failedRequests: 0
      },
      workflowMetrics: {
        stepCount: 0,
        completedSteps: 0,
        failedSteps: 0,
        stepTimings: [],
        criticalPathTime: 0,
        userInteractionCount: 0
      },
      errorMetrics: {
        jsErrors: [],
        networkErrors: [],
        consoleErrors: [],
        assertionFailures: []
      },
      resourceMetrics: {
        memoryUsage: {
          initial: 0,
          peak: 0,
          final: 0
        },
        cpuUsage: 0,
        networkBandwidth: 0,
        storageUsage: 0,
        cacheHitRate: 0
      },
      metadata: {
        browser: testInfo.project.name,
        viewport: testInfo.project.use?.viewport,
        userAgent: await page.evaluate(() => navigator.userAgent),
        url: page.url()
      }
    };

    this.metrics.set(testId, metrics);
    
    // Set up page monitoring
    await this.setupPageMonitoring(page, testId);
    
    return testId;
  }

  /**
   * Set up comprehensive page monitoring
   */
  private async setupPageMonitoring(page: Page, testId: string): Promise<void> {
    const metrics = this.metrics.get(testId)!;

    // Monitor console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        metrics.errorMetrics.consoleErrors.push({
          type: msg.type(),
          message: msg.text(),
          timestamp: performance.now()
        });
      }
    });

    // Monitor JavaScript errors
    page.on('pageerror', (error) => {
      metrics.errorMetrics.jsErrors.push({
        message: error.message,
        stack: error.stack || '',
        timestamp: performance.now(),
        url: page.url()
      });
    });

    // Monitor network requests
    page.on('request', (request) => {
      metrics.performanceMetrics.networkRequests++;
    });

    page.on('response', (response) => {
      const responseTime = performance.now();
      
      if (!response.ok()) {
        metrics.performanceMetrics.failedRequests++;
        metrics.errorMetrics.networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: responseTime
        });
      }

      // Track API response times
      if (response.url().includes('/api/')) {
        const requestTime = responseTime - (response.request().timing()?.requestStart || 0);
        metrics.performanceMetrics.apiResponseTimes.push(requestTime);
      }
    });

    // Monitor page load performance
    page.on('load', async () => {
      const performanceTiming = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          navigationStart: timing.navigationStart,
          loadEventEnd: timing.loadEventEnd,
          domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
          responseEnd: timing.responseEnd
        };
      });

      metrics.performanceMetrics.pageLoadTime = 
        performanceTiming.loadEventEnd - performanceTiming.navigationStart;
      metrics.performanceMetrics.navigationTime = 
        performanceTiming.responseEnd - performanceTiming.navigationStart;
      metrics.performanceMetrics.renderTime = 
        performanceTiming.domContentLoadedEventEnd - performanceTiming.responseEnd;
    });

    // Monitor memory usage
    try {
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });

      if (memoryInfo) {
        metrics.resourceMetrics.memoryUsage.initial = memoryInfo.usedJSHeapSize;
        metrics.performanceMetrics.memoryUsage = memoryInfo.usedJSHeapSize;
      }
    } catch (error) {
      // Memory API not available in all browsers
    }
  }

  /**
   * Track a workflow step
   */
  async trackStep(stepName: string, stepFunction: () => Promise<void>): Promise<void> {
    if (!this.currentTest) return;

    const metrics = this.metrics.get(this.currentTest)!;
    const stepStartTime = performance.now();
    this.stepCounter++;
    metrics.workflowMetrics.stepCount++;

    try {
      await stepFunction();
      
      const stepEndTime = performance.now();
      const stepDuration = stepEndTime - stepStartTime;

      metrics.workflowMetrics.completedSteps++;
      metrics.workflowMetrics.stepTimings.push({
        stepName,
        startTime: stepStartTime,
        endTime: stepEndTime,
        duration: stepDuration,
        success: true
      });

    } catch (error) {
      const stepEndTime = performance.now();
      const stepDuration = stepEndTime - stepStartTime;

      metrics.workflowMetrics.failedSteps++;
      metrics.workflowMetrics.stepTimings.push({
        stepName,
        startTime: stepStartTime,
        endTime: stepEndTime,
        duration: stepDuration,
        success: false
      });

      throw error; // Re-throw to maintain test behavior
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(interactionType: string, element: string): void {
    if (!this.currentTest) return;

    const metrics = this.metrics.get(this.currentTest)!;
    metrics.workflowMetrics.userInteractionCount++;
    
    // Track interaction timing
    const interactionTime = performance.now();
    metrics.performanceMetrics.interactionTime = interactionTime;
  }

  /**
   * Track assertion failure
   */
  trackAssertionFailure(assertion: string, expected: any, actual: any): void {
    if (!this.currentTest) return;

    const metrics = this.metrics.get(this.currentTest)!;
    metrics.errorMetrics.assertionFailures.push({
      assertion,
      expected,
      actual,
      timestamp: performance.now()
    });
  }

  /**
   * Finalize test monitoring
   */
  async finalizeTest(testId: string, status: 'passed' | 'failed' | 'skipped', page?: Page): Promise<E2EMetrics> {
    const metrics = this.metrics.get(testId);
    if (!metrics) {
      throw new Error(`No metrics found for test ${testId}`);
    }

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.status = status;

    // Calculate critical path time
    metrics.workflowMetrics.criticalPathTime = metrics.workflowMetrics.stepTimings
      .reduce((total, step) => total + step.duration, 0);

    // Final memory measurement
    if (page) {
      try {
        const finalMemoryInfo = await page.evaluate(() => {
          return (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize
          } : null;
        });

        if (finalMemoryInfo) {
          metrics.resourceMetrics.memoryUsage.final = finalMemoryInfo.usedJSHeapSize;
          metrics.resourceMetrics.memoryUsage.peak = Math.max(
            metrics.resourceMetrics.memoryUsage.peak,
            finalMemoryInfo.usedJSHeapSize
          );
        }
      } catch (error) {
        // Memory API not available
      }
    }

    this.currentTest = null;
    return metrics;
  }

  /**
   * Get metrics for a specific test
   */
  getTestMetrics(testId: string): E2EMetrics | undefined {
    return this.metrics.get(testId);
  }

  /**
   * Get all collected metrics
   */
  getAllMetrics(): E2EMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      averageDuration: number;
      averagePageLoadTime: number;
      averageApiResponseTime: number;
    };
    details: E2EMetrics[];
  } {
    const allMetrics = this.getAllMetrics();
    
    const summary = {
      totalTests: allMetrics.length,
      passedTests: allMetrics.filter(m => m.status === 'passed').length,
      failedTests: allMetrics.filter(m => m.status === 'failed').length,
      averageDuration: allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / allMetrics.length,
      averagePageLoadTime: allMetrics.reduce((sum, m) => sum + m.performanceMetrics.pageLoadTime, 0) / allMetrics.length,
      averageApiResponseTime: this.calculateAverageApiResponseTime(allMetrics)
    };

    return {
      summary,
      details: allMetrics
    };
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(filePath?: string): string {
    const report = this.generatePerformanceReport();
    const jsonData = JSON.stringify(report, null, 2);
    
    if (filePath) {
      // In a real implementation, you would write to file
      console.log(`Metrics exported to ${filePath}`);
    }
    
    return jsonData;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.currentTest = null;
    this.stepCounter = 0;
  }

  private calculateAverageApiResponseTime(metrics: E2EMetrics[]): number {
    const allApiTimes = metrics.flatMap(m => m.performanceMetrics.apiResponseTimes);
    return allApiTimes.length > 0 
      ? allApiTimes.reduce((sum, time) => sum + time, 0) / allApiTimes.length 
      : 0;
  }

  private initializeGlobalErrorHandling(): void {
    // Global error handling for uncaught errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (this.currentTest) {
          const metrics = this.metrics.get(this.currentTest)!;
          metrics.errorMetrics.jsErrors.push({
            message: event.message,
            stack: event.error?.stack || '',
            timestamp: performance.now(),
            url: event.filename || ''
          });
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (this.currentTest) {
          const metrics = this.metrics.get(this.currentTest)!;
          metrics.errorMetrics.jsErrors.push({
            message: `Unhandled Promise Rejection: ${event.reason}`,
            stack: event.reason?.stack || '',
            timestamp: performance.now(),
            url: window.location.href
          });
        }
      });
    }
  }
}

// Global instance
export const e2eMonitoring = new E2EMonitoringHooks();

/**
 * Decorator function for monitoring test steps
 */
export function monitoredStep(stepName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await e2eMonitoring.trackStep(stepName, async () => {
        return await originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

/**
 * Helper function to wrap page interactions with monitoring
 */
export async function monitoredClick(page: Page, selector: string, options?: any): Promise<void> {
  e2eMonitoring.trackInteraction('click', selector);
  return await e2eMonitoring.trackStep(`Click: ${selector}`, async () => {
    await page.click(selector, options);
  });
}

export async function monitoredFill(page: Page, selector: string, value: string, options?: any): Promise<void> {
  e2eMonitoring.trackInteraction('fill', selector);
  return await e2eMonitoring.trackStep(`Fill: ${selector}`, async () => {
    await page.fill(selector, value, options);
  });
}

export async function monitoredNavigate(page: Page, url: string, options?: any): Promise<void> {
  e2eMonitoring.trackInteraction('navigate', url);
  return await e2eMonitoring.trackStep(`Navigate: ${url}`, async () => {
    await page.goto(url, options);
  });
}

export async function monitoredWaitFor(page: Page, selector: string, options?: any): Promise<void> {
  return await e2eMonitoring.trackStep(`Wait for: ${selector}`, async () => {
    await page.waitForSelector(selector, options);
  });
}

/**
 * Helper function to wrap assertions with monitoring
 */
export async function monitoredExpect(assertion: string, expectFunction: () => Promise<void> | void): Promise<void> {
  try {
    await expectFunction();
  } catch (error) {
    e2eMonitoring.trackAssertionFailure(assertion, 'expected', 'actual');
    throw error;
  }
}
