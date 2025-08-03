/**
 * SizeWise Suite - Playwright Shadow Testing Fixture
 * 
 * Provides Playwright test fixtures that automatically integrate shadow testing
 * capabilities. Allows tests to run in shadow mode without blocking CI/CD builds
 * while monitoring performance and reliability for gradual enforcement rollout.
 * 
 * Features:
 * - Automatic shadow mode execution
 * - CI/CD pipeline integration
 * - Performance monitoring
 * - Gradual enforcement rollout
 * - Test reliability tracking
 */

import { test as base, Page, BrowserContext, TestInfo } from '@playwright/test';
import { shadowTestManager, ShadowTestResult, runInShadowMode } from './shadow-test-manager';

// Extend the base test with shadow testing capabilities
export const shadowTest = base.extend<{
  shadowPage: Page;
  shadowResult: ShadowTestResult;
}>({
  // Shadow page fixture
  shadowPage: async ({ page }, use, testInfo) => {
    // Use the page with shadow testing enabled
    await use(page);
  },

  // Shadow result fixture
  shadowResult: async ({ shadowPage }, use, testInfo) => {
    let shadowResult: ShadowTestResult | undefined;
    
    // Wrap the test execution in shadow mode
    const testName = testInfo.title;
    const testFile = testInfo.file;
    
    try {
      // Execute the test in shadow mode
      shadowResult = await shadowTestManager.executeShadowTest(
        testName,
        testFile,
        async () => {
          // The actual test execution happens in the test body
          // This is just a placeholder that will be overridden
        },
        {
          browser: testInfo.project.name,
          viewport: JSON.stringify(testInfo.project.use?.viewport),
          environment: process.env.NODE_ENV || 'development',
          buildId: process.env.BUILD_ID,
          commitHash: process.env.COMMIT_HASH
        }
      );
    } catch (error) {
      // Create a failed result for tracking
      shadowResult = {
        testId: `shadow-${testName}-${Date.now()}`,
        testName,
        testFile,
        mode: 'shadow',
        status: 'failed',
        duration: 0,
        timestamp: Date.now(),
        errorMessage: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined,
        metadata: {
          browser: testInfo.project.name,
          environment: process.env.NODE_ENV || 'development'
        }
      };
    }
    
    await use(shadowResult!);
  }
});

/**
 * Shadow test utilities for enhanced testing
 */
export class ShadowTestUtils {
  /**
   * Execute a test step in shadow mode
   */
  static async shadowStep<T>(
    stepName: string,
    testFile: string,
    stepFunction: () => Promise<T>
  ): Promise<T> {
    return await runInShadowMode(
      stepName,
      testFile,
      stepFunction,
      {
        environment: process.env.NODE_ENV || 'development'
      }
    );
  }
  
  /**
   * Check if a test should run in enforced mode
   */
  static isEnforcedMode(testName: string): boolean {
    const metrics = shadowTestManager.getTestMetrics(testName);
    return metrics?.currentMode === 'enforced' || false;
  }
  
  /**
   * Get test reliability metrics
   */
  static getTestReliability(testName: string): {
    successRate: number;
    totalRuns: number;
    readyForEnforcement: boolean;
  } {
    const metrics = shadowTestManager.getTestMetrics(testName);
    return {
      successRate: metrics?.successRate || 0,
      totalRuns: metrics?.totalRuns || 0,
      readyForEnforcement: metrics?.readyForEnforcement || false
    };
  }
  
  /**
   * Generate shadow test report
   */
  static generateReport(periodDays: number = 7): string {
    const report = shadowTestManager.generateReport(periodDays);
    return shadowTestManager.exportReport(report);
  }
  
  /**
   * Update shadow test configuration
   */
  static updateConfig(updates: any): void {
    shadowTestManager.updateConfig(updates);
  }
}

/**
 * Shadow test wrapper function for existing tests
 */
export function wrapWithShadowTesting(
  testName: string,
  testFunction: (page: Page) => Promise<void>
) {
  return async (page: Page, testInfo?: TestInfo) => {
    const testFile = testInfo?.file || 'unknown';
    
    return await runInShadowMode(
      testName,
      testFile,
      async () => {
        await testFunction(page);
      },
      {
        browser: testInfo?.project.name,
        environment: process.env.NODE_ENV || 'development'
      }
    );
  };
}

/**
 * Conditional test execution based on shadow mode
 */
export function conditionalShadowTest(
  testName: string,
  testFunction: () => Promise<void>,
  options: {
    runInShadow?: boolean;
    enforceImmediately?: boolean;
    skipCondition?: () => boolean;
  } = {}
) {
  return shadowTest(testName, async ({ shadowPage, shadowResult }) => {
    // Check skip condition
    if (options.skipCondition && options.skipCondition()) {
      shadowTest.skip();
      return;
    }
    
    // Check if test should be enforced
    const isEnforced = options.enforceImmediately || ShadowTestUtils.isEnforcedMode(testName);
    
    if (options.runInShadow === false && !isEnforced) {
      // Skip shadow mode, run normally
      await testFunction();
      return;
    }
    
    // Execute in shadow mode
    const testFile = 'conditional-test';
    await runInShadowMode(
      testName,
      testFile,
      testFunction,
      {
        environment: process.env.NODE_ENV || 'development'
      }
    );
  });
}

/**
 * Shadow test group for organizing related shadow tests
 */
export class ShadowTestGroup {
  private groupName: string;
  private tests: Array<{
    name: string;
    testFunction: () => Promise<void>;
    options?: any;
  }> = [];
  
  constructor(groupName: string) {
    this.groupName = groupName;
  }
  
  /**
   * Add a test to the shadow group
   */
  addTest(
    testName: string,
    testFunction: () => Promise<void>,
    options?: any
  ): void {
    this.tests.push({
      name: `${this.groupName}: ${testName}`,
      testFunction,
      options
    });
  }
  
  /**
   * Execute all tests in the shadow group
   */
  async executeAll(): Promise<ShadowTestResult[]> {
    const results: ShadowTestResult[] = [];
    
    for (const test of this.tests) {
      try {
        const result = await shadowTestManager.executeShadowTest(
          test.name,
          this.groupName,
          test.testFunction,
          test.options?.metadata || {}
        );
        results.push(result);
      } catch (error) {
        console.error(`Shadow test group execution failed for ${test.name}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Get group statistics
   */
  getGroupStats(): {
    totalTests: number;
    shadowTests: number;
    enforcedTests: number;
    averageSuccessRate: number;
  } {
    const stats = {
      totalTests: this.tests.length,
      shadowTests: 0,
      enforcedTests: 0,
      averageSuccessRate: 0
    };
    
    let totalSuccessRate = 0;
    
    for (const test of this.tests) {
      const metrics = shadowTestManager.getTestMetrics(test.name);
      if (metrics) {
        if (metrics.currentMode === 'shadow') {
          stats.shadowTests++;
        } else if (metrics.currentMode === 'enforced') {
          stats.enforcedTests++;
        }
        totalSuccessRate += metrics.successRate;
      }
    }
    
    stats.averageSuccessRate = this.tests.length > 0 ? totalSuccessRate / this.tests.length : 0;
    
    return stats;
  }
}

/**
 * CI/CD integration utilities
 */
export class ShadowTestCIIntegration {
  /**
   * Generate CI/CD report for shadow tests
   */
  static generateCIReport(): {
    summary: string;
    details: any;
    exitCode: number;
  } {
    const report = shadowTestManager.generateReport(7);
    const metrics = shadowTestManager.getAllMetrics();
    
    // Determine if CI should fail based on enforced test failures
    const enforcedFailures = metrics.filter(m => 
      m.currentMode === 'enforced' && m.successRate < 95
    );
    
    const exitCode = enforcedFailures.length > 0 ? 1 : 0;
    
    const summary = [
      `Shadow Testing Report:`,
      `- Total Tests: ${report.summary.totalTests}`,
      `- Shadow Mode: ${report.summary.shadowTests}`,
      `- Enforced Mode: ${report.summary.enforcedTests}`,
      `- Ready for Enforcement: ${report.summary.readyForEnforcement}`,
      `- Average Success Rate: ${report.summary.averageSuccessRate.toFixed(1)}%`,
      `- Exit Code: ${exitCode}`
    ].join('\n');
    
    return {
      summary,
      details: report,
      exitCode
    };
  }
  
  /**
   * Set up CI environment variables
   */
  static setupCIEnvironment(): void {
    // Set environment variables for CI integration
    process.env.SHADOW_TESTING_ENABLED = 'true';
    process.env.SHADOW_TESTING_CI_MODE = 'true';
    
    // Configure based on CI environment
    if (process.env.CI) {
      shadowTestManager.updateConfig({
        reportingEnabled: true,
        ciIntegration: true,
        gradualRollout: true
      });
    }
  }
  
  /**
   * Export artifacts for CI
   */
  static exportCIArtifacts(): string[] {
    const report = shadowTestManager.generateReport(7);
    const reportPath = shadowTestManager.exportReport(report, 'ci-shadow-report.json');
    
    // Export additional artifacts
    const artifacts = [reportPath];
    
    // Export metrics summary
    const metrics = shadowTestManager.getAllMetrics();
    const summaryPath = reportPath.replace('.json', '-summary.json');
    require('fs').writeFileSync(summaryPath, JSON.stringify({
      timestamp: Date.now(),
      totalTests: metrics.length,
      readyForEnforcement: metrics.filter(m => m.readyForEnforcement).length,
      averageSuccessRate: metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
    }, null, 2));
    
    artifacts.push(summaryPath);
    
    return artifacts;
  }
}

// Export the expect function from Playwright for convenience
export { expect } from '@playwright/test';
