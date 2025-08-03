/**
 * Frontend Load Testing Suite for SizeWise Suite
 * 
 * This test suite performs load testing on the frontend application
 * to measure performance under various load conditions and identify
 * bottlenecks in the user interface.
 */

import { test, expect, Page, Browser } from '@playwright/test';

interface LoadTestMetrics {
  responseTime: number;
  domContentLoaded: number;
  networkIdle: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

interface LoadTestResult {
  testName: string;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  metrics: LoadTestMetrics[];
}

class LoadTestRunner {
  private results: LoadTestResult[] = [];
  
  async runConcurrentUsers(
    browser: Browser,
    userCount: number,
    testFunction: (page: Page) => Promise<LoadTestMetrics>,
    testName: string
  ): Promise<LoadTestResult> {
    const startTime = Date.now();
    const promises: Promise<LoadTestMetrics | null>[] = [];
    
    console.log(`Starting load test: ${testName} with ${userCount} concurrent users`);
    
    // Create concurrent user sessions
    for (let i = 0; i < userCount; i++) {
      const userPromise = this.createUserSession(browser, testFunction, i);
      promises.push(userPromise);
    }
    
    // Wait for all users to complete
    const results = await Promise.allSettled(promises);
    
    // Process results
    const metrics: LoadTestMetrics[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        metrics.push(result.value);
        successfulRequests++;
      } else {
        failedRequests++;
        console.error('User session failed:', result.status === 'rejected' ? result.reason : 'Unknown error');
      }
    });
    
    const responseTimes = metrics.map(m => m.responseTime);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;
    const maxResponseTime = Math.max(...responseTimes) || 0;
    const minResponseTime = Math.min(...responseTimes) || 0;
    
    const testResult: LoadTestResult = {
      testName,
      concurrentUsers: userCount,
      totalRequests: userCount,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      maxResponseTime,
      minResponseTime,
      metrics
    };
    
    this.results.push(testResult);
    
    console.log(`Load test completed: ${testName}`);
    console.log(`Success rate: ${(successfulRequests / userCount * 100).toFixed(2)}%`);
    console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
    
    return testResult;
  }
  
  private async createUserSession(
    browser: Browser,
    testFunction: (page: Page) => Promise<LoadTestMetrics>,
    userId: number
  ): Promise<LoadTestMetrics | null> {
    let page: Page | null = null;
    
    try {
      const context = await browser.newContext();
      page = await context.newPage();
      
      // Add random delay to simulate realistic user behavior
      await page.waitForTimeout(Math.random() * 1000);
      
      const metrics = await testFunction(page);
      
      await context.close();
      return metrics;
      
    } catch (error) {
      console.error(`User ${userId} session failed:`, error);
      if (page) {
        await page.context().close();
      }
      return null;
    }
  }
  
  getResults(): LoadTestResult[] {
    return this.results;
  }
  
  printSummary(): void {
    console.log('\n=== LOAD TEST SUMMARY ===');
    this.results.forEach(result => {
      console.log(`\nTest: ${result.testName}`);
      console.log(`Concurrent Users: ${result.concurrentUsers}`);
      console.log(`Success Rate: ${(result.successfulRequests / result.totalRequests * 100).toFixed(2)}%`);
      console.log(`Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`Max Response Time: ${result.maxResponseTime.toFixed(2)}ms`);
      console.log(`Min Response Time: ${result.minResponseTime.toFixed(2)}ms`);
    });
  }
}

// Test functions for different scenarios
async function homePageLoadTest(page: Page): Promise<LoadTestMetrics> {
  const startTime = Date.now();
  
  // Navigate to home page
  await page.goto('/');
  
  // Wait for different loading states
  const domContentLoadedTime = Date.now();
  await page.waitForLoadState('domcontentloaded');
  
  const networkIdleTime = Date.now();
  await page.waitForLoadState('networkidle');
  
  // Measure Web Vitals
  const webVitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const metrics = {
          fcp: 0,
          lcp: 0,
          cls: 0
        };
        
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
          } else if (entry.entryType === 'largest-contentful-paint') {
            metrics.lcp = entry.startTime;
          } else if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            metrics.cls += entry.value;
          }
        });
        
        resolve(metrics);
      });
      
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
      
      // Fallback timeout
      setTimeout(() => resolve({ fcp: 0, lcp: 0, cls: 0 }), 5000);
    });
  });
  
  const endTime = Date.now();
  
  return {
    responseTime: endTime - startTime,
    domContentLoaded: domContentLoadedTime - startTime,
    networkIdle: networkIdleTime - startTime,
    firstContentfulPaint: (webVitals as any).fcp,
    largestContentfulPaint: (webVitals as any).lcp,
    cumulativeLayoutShift: (webVitals as any).cls
  };
}

async function authenticationLoadTest(page: Page): Promise<LoadTestMetrics> {
  const startTime = Date.now();
  
  // Navigate to login page
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Verify login page elements
  await expect(page.getByRole('heading', { name: 'SizeWise' })).toBeVisible({ timeout: 10000 });
  
  // Test form interaction
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  if (await emailInput.isVisible()) {
    await emailInput.fill(`loadtest${Math.random()}@example.com`);
  }
  
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('TestPassword123!');
  }
  
  const endTime = Date.now();
  
  return {
    responseTime: endTime - startTime,
    domContentLoaded: 0,
    networkIdle: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0
  };
}

async function navigationLoadTest(page: Page): Promise<LoadTestMetrics> {
  const startTime = Date.now();
  
  // Test navigation between different routes
  const routes = ['/air-duct-sizer', '/reports', '/demo'];
  
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Simulate user reading time
  }
  
  const endTime = Date.now();
  
  return {
    responseTime: endTime - startTime,
    domContentLoaded: 0,
    networkIdle: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0
  };
}

// Load test configurations
test.describe('Frontend Load Testing', () => {
  let loadTestRunner: LoadTestRunner;
  
  test.beforeAll(async () => {
    loadTestRunner = new LoadTestRunner();
  });
  
  test.afterAll(async () => {
    loadTestRunner.printSummary();
  });
  
  test('light load - home page (5 concurrent users)', async ({ browser }) => {
    await loadTestRunner.runConcurrentUsers(
      browser,
      5,
      homePageLoadTest,
      'Home Page Light Load'
    );
  });
  
  test('medium load - home page (15 concurrent users)', async ({ browser }) => {
    await loadTestRunner.runConcurrentUsers(
      browser,
      15,
      homePageLoadTest,
      'Home Page Medium Load'
    );
  });
  
  test('light load - authentication (5 concurrent users)', async ({ browser }) => {
    await loadTestRunner.runConcurrentUsers(
      browser,
      5,
      authenticationLoadTest,
      'Authentication Light Load'
    );
  });
  
  test('medium load - authentication (15 concurrent users)', async ({ browser }) => {
    await loadTestRunner.runConcurrentUsers(
      browser,
      15,
      authenticationLoadTest,
      'Authentication Medium Load'
    );
  });
  
  test('light load - navigation (5 concurrent users)', async ({ browser }) => {
    await loadTestRunner.runConcurrentUsers(
      browser,
      5,
      navigationLoadTest,
      'Navigation Light Load'
    );
  });
  
  test('stress test - home page (25 concurrent users)', async ({ browser }) => {
    await loadTestRunner.runConcurrentUsers(
      browser,
      25,
      homePageLoadTest,
      'Home Page Stress Test'
    );
  });
});

// Performance benchmark tests
test.describe('Performance Benchmarks', () => {
  test('home page performance baseline', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance assertions
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    console.log(`Home page load time: ${loadTime}ms`);
  });
  
  test('authentication page performance baseline', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify login elements are present
    await expect(page.getByRole('heading', { name: 'SizeWise' })).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Performance assertions
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    console.log(`Authentication page load time: ${loadTime}ms`);
  });
  
  test('route navigation performance', async ({ page }) => {
    const routes = ['/air-duct-sizer', '/reports', '/demo'];
    const navigationTimes: number[] = [];
    
    for (const route of routes) {
      const startTime = Date.now();
      
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const navigationTime = Date.now() - startTime;
      navigationTimes.push(navigationTime);
      
      console.log(`Route ${route} load time: ${navigationTime}ms`);
    }
    
    const averageNavigationTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    
    // Performance assertions
    expect(averageNavigationTime).toBeLessThan(4000); // Average should be under 4 seconds
    
    console.log(`Average navigation time: ${averageNavigationTime.toFixed(2)}ms`);
  });
});
