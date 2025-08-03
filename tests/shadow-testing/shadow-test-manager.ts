/**
 * SizeWise Suite - Shadow Testing Manager
 * 
 * Manages shadow testing infrastructure for running new tests in shadow mode
 * without blocking CI/CD builds. Provides gradual enforcement rollout and
 * comprehensive monitoring of shadow test results.
 * 
 * Features:
 * - Shadow mode test execution
 * - Performance monitoring and reporting
 * - Gradual enforcement rollout
 * - CI/CD pipeline integration
 * - Test reliability tracking
 * - Automated promotion to enforcement
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

export interface ShadowTestConfig {
  enabled: boolean;
  mode: 'shadow' | 'enforced' | 'disabled';
  enforcementThreshold: number;        // Success rate threshold for enforcement (%)
  monitoringPeriod: number;           // Days to monitor before enforcement
  gradualRollout: boolean;            // Enable gradual rollout
  rolloutSteps: number[];             // Percentage steps for gradual rollout
  maxFailureRate: number;             // Maximum acceptable failure rate (%)
  reportingEnabled: boolean;          // Enable shadow test reporting
  ciIntegration: boolean;             // Enable CI/CD integration
}

export interface ShadowTestResult {
  testId: string;
  testName: string;
  testFile: string;
  mode: 'shadow' | 'enforced';
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  timestamp: number;
  errorMessage?: string;
  stackTrace?: string;
  metadata: {
    browser?: string;
    viewport?: string;
    environment: string;
    buildId?: string;
    commitHash?: string;
  };
}

export interface ShadowTestMetrics {
  testName: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  skippedRuns: number;
  successRate: number;
  averageDuration: number;
  lastRun: number;
  firstRun: number;
  currentMode: 'shadow' | 'enforced' | 'disabled';
  readyForEnforcement: boolean;
  enforcementDate?: number;
}

export interface ShadowTestReport {
  timestamp: number;
  period: {
    start: number;
    end: number;
    days: number;
  };
  summary: {
    totalTests: number;
    shadowTests: number;
    enforcedTests: number;
    readyForEnforcement: number;
    averageSuccessRate: number;
    totalRuns: number;
  };
  testMetrics: ShadowTestMetrics[];
  recommendations: string[];
}

export class ShadowTestManager {
  private config: ShadowTestConfig;
  private results: ShadowTestResult[] = [];
  private metrics: Map<string, ShadowTestMetrics> = new Map();
  private dataDir: string;

  constructor(config: Partial<ShadowTestConfig> = {}) {
    this.config = {
      enabled: true,
      mode: 'shadow',
      enforcementThreshold: 95,
      monitoringPeriod: 7,
      gradualRollout: true,
      rolloutSteps: [25, 50, 75, 100],
      maxFailureRate: 5,
      reportingEnabled: true,
      ciIntegration: true,
      ...config
    };

    this.dataDir = path.join(process.cwd(), 'test-results', 'shadow-testing');
    this.ensureDataDirectory();
    this.loadExistingData();
  }

  /**
   * Execute a test in shadow mode
   */
  async executeShadowTest(
    testName: string,
    testFile: string,
    testFunction: () => Promise<void>,
    metadata: Partial<ShadowTestResult['metadata']> = {}
  ): Promise<ShadowTestResult> {
    if (!this.config.enabled) {
      throw new Error('Shadow testing is disabled');
    }

    const testId = `shadow-${testName}-${Date.now()}`;
    const startTime = performance.now();
    const timestamp = Date.now();

    const result: ShadowTestResult = {
      testId,
      testName,
      testFile,
      mode: this.getTestMode(testName),
      status: 'failed',
      duration: 0,
      timestamp,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        buildId: process.env.BUILD_ID,
        commitHash: process.env.COMMIT_HASH,
        ...metadata
      }
    };

    try {
      await testFunction();
      result.status = 'passed';
    } catch (error) {
      result.status = 'failed';
      result.errorMessage = error instanceof Error ? error.message : String(error);
      result.stackTrace = error instanceof Error ? error.stack : undefined;
      
      // In shadow mode, don't throw the error to avoid blocking builds
      if (result.mode === 'shadow') {
        console.warn(`Shadow test failed: ${testName}`, error);
      } else {
        throw error; // Re-throw for enforced tests
      }
    } finally {
      const endTime = performance.now();
      result.duration = endTime - startTime;
    }

    // Record the result
    this.recordResult(result);
    
    return result;
  }

  /**
   * Get the current mode for a test (shadow or enforced)
   */
  private getTestMode(testName: string): 'shadow' | 'enforced' {
    const metrics = this.metrics.get(testName);
    
    if (!metrics) {
      return 'shadow'; // New tests start in shadow mode
    }

    if (metrics.currentMode === 'enforced') {
      return 'enforced';
    }

    // Check if test is ready for enforcement
    if (this.isReadyForEnforcement(testName)) {
      return this.shouldEnforceTest(testName) ? 'enforced' : 'shadow';
    }

    return 'shadow';
  }

  /**
   * Check if a test is ready for enforcement
   */
  private isReadyForEnforcement(testName: string): boolean {
    const metrics = this.metrics.get(testName);
    
    if (!metrics) {
      return false;
    }

    // Check success rate threshold
    if (metrics.successRate < this.config.enforcementThreshold) {
      return false;
    }

    // Check monitoring period
    const monitoringPeriodMs = this.config.monitoringPeriod * 24 * 60 * 60 * 1000;
    const hasBeenMonitoredLongEnough = (Date.now() - metrics.firstRun) >= monitoringPeriodMs;

    // Check minimum number of runs
    const hasEnoughRuns = metrics.totalRuns >= 10;

    return hasBeenMonitoredLongEnough && hasEnoughRuns;
  }

  /**
   * Determine if a test should be enforced based on gradual rollout
   */
  private shouldEnforceTest(testName: string): boolean {
    if (!this.config.gradualRollout) {
      return true;
    }

    const metrics = this.metrics.get(testName);
    if (!metrics) {
      return false;
    }

    // Calculate rollout percentage based on test hash
    const testHash = this.hashString(testName);
    const rolloutPercentage = testHash % 100;

    // Get current rollout step
    const currentStep = this.getCurrentRolloutStep(testName);
    
    return rolloutPercentage < currentStep;
  }

  /**
   * Get current rollout step for gradual enforcement
   */
  private getCurrentRolloutStep(testName: string): number {
    const metrics = this.metrics.get(testName);
    if (!metrics || !metrics.enforcementDate) {
      return 0;
    }

    const daysSinceEnforcement = (Date.now() - metrics.enforcementDate) / (24 * 60 * 60 * 1000);
    const stepIndex = Math.floor(daysSinceEnforcement / 2); // New step every 2 days
    
    return this.config.rolloutSteps[Math.min(stepIndex, this.config.rolloutSteps.length - 1)] || 0;
  }

  /**
   * Record a test result and update metrics
   */
  private recordResult(result: ShadowTestResult): void {
    this.results.push(result);
    this.updateMetrics(result);
    this.saveData();

    if (this.config.reportingEnabled) {
      this.logResult(result);
    }
  }

  /**
   * Update metrics for a test
   */
  private updateMetrics(result: ShadowTestResult): void {
    let metrics = this.metrics.get(result.testName);
    
    if (!metrics) {
      metrics = {
        testName: result.testName,
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        skippedRuns: 0,
        successRate: 0,
        averageDuration: 0,
        lastRun: result.timestamp,
        firstRun: result.timestamp,
        currentMode: result.mode,
        readyForEnforcement: false
      };
    }

    // Update counts
    metrics.totalRuns++;
    metrics.lastRun = result.timestamp;
    
    switch (result.status) {
      case 'passed':
        metrics.passedRuns++;
        break;
      case 'failed':
        metrics.failedRuns++;
        break;
      case 'skipped':
        metrics.skippedRuns++;
        break;
    }

    // Calculate success rate (excluding skipped tests)
    const executedRuns = metrics.totalRuns - metrics.skippedRuns;
    metrics.successRate = executedRuns > 0 ? (metrics.passedRuns / executedRuns) * 100 : 0;

    // Update average duration
    const totalDuration = (metrics.averageDuration * (metrics.totalRuns - 1)) + result.duration;
    metrics.averageDuration = totalDuration / metrics.totalRuns;

    // Check if ready for enforcement
    metrics.readyForEnforcement = this.isReadyForEnforcement(result.testName);
    
    // Set enforcement date if newly ready
    if (metrics.readyForEnforcement && !metrics.enforcementDate) {
      metrics.enforcementDate = Date.now();
    }

    this.metrics.set(result.testName, metrics);
  }

  /**
   * Generate shadow test report
   */
  generateReport(periodDays: number = 7): ShadowTestReport {
    const endTime = Date.now();
    const startTime = endTime - (periodDays * 24 * 60 * 60 * 1000);

    // Filter results for the period
    const periodResults = this.results.filter(r => r.timestamp >= startTime);
    
    // Calculate summary metrics
    const allMetrics = Array.from(this.metrics.values());
    const shadowTests = allMetrics.filter(m => m.currentMode === 'shadow').length;
    const enforcedTests = allMetrics.filter(m => m.currentMode === 'enforced').length;
    const readyForEnforcement = allMetrics.filter(m => m.readyForEnforcement).length;
    
    const totalSuccessRate = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length 
      : 0;

    const report: ShadowTestReport = {
      timestamp: endTime,
      period: {
        start: startTime,
        end: endTime,
        days: periodDays
      },
      summary: {
        totalTests: allMetrics.length,
        shadowTests,
        enforcedTests,
        readyForEnforcement,
        averageSuccessRate: totalSuccessRate,
        totalRuns: periodResults.length
      },
      testMetrics: allMetrics,
      recommendations: this.generateRecommendations(allMetrics)
    };

    return report;
  }

  /**
   * Generate recommendations based on test metrics
   */
  private generateRecommendations(metrics: ShadowTestMetrics[]): string[] {
    const recommendations: string[] = [];

    // Tests ready for enforcement
    const readyTests = metrics.filter(m => m.readyForEnforcement && m.currentMode === 'shadow');
    if (readyTests.length > 0) {
      recommendations.push(`${readyTests.length} tests are ready for enforcement`);
    }

    // Tests with low success rates
    const lowSuccessTests = metrics.filter(m => m.successRate < this.config.enforcementThreshold);
    if (lowSuccessTests.length > 0) {
      recommendations.push(`${lowSuccessTests.length} tests have low success rates and need improvement`);
    }

    // Tests with high failure rates
    const highFailureTests = metrics.filter(m => {
      const failureRate = (m.failedRuns / Math.max(m.totalRuns, 1)) * 100;
      return failureRate > this.config.maxFailureRate;
    });
    if (highFailureTests.length > 0) {
      recommendations.push(`${highFailureTests.length} tests have high failure rates`);
    }

    // Overall system health
    const averageSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
    if (averageSuccessRate >= 95) {
      recommendations.push('Shadow testing system is performing well');
    } else if (averageSuccessRate >= 85) {
      recommendations.push('Shadow testing system needs minor improvements');
    } else {
      recommendations.push('Shadow testing system needs significant improvements');
    }

    return recommendations;
  }

  /**
   * Export report to file
   */
  exportReport(report: ShadowTestReport, filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = filename || `shadow-test-report-${timestamp}.json`;
    const reportPath = path.join(this.dataDir, reportFilename);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }

  /**
   * Get test metrics for a specific test
   */
  getTestMetrics(testName: string): ShadowTestMetrics | undefined {
    return this.metrics.get(testName);
  }

  /**
   * Get all test metrics
   */
  getAllMetrics(): ShadowTestMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ShadowTestConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Utility methods
   */
  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadExistingData(): void {
    try {
      const resultsPath = path.join(this.dataDir, 'results.json');
      const metricsPath = path.join(this.dataDir, 'metrics.json');

      if (fs.existsSync(resultsPath)) {
        const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        this.results = resultsData;
      }

      if (fs.existsSync(metricsPath)) {
        const metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        this.metrics = new Map(Object.entries(metricsData));
      }
    } catch (error) {
      console.warn('Failed to load existing shadow test data:', error);
    }
  }

  private saveData(): void {
    try {
      const resultsPath = path.join(this.dataDir, 'results.json');
      const metricsPath = path.join(this.dataDir, 'metrics.json');

      fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
      fs.writeFileSync(metricsPath, JSON.stringify(Object.fromEntries(this.metrics), null, 2));
    } catch (error) {
      console.error('Failed to save shadow test data:', error);
    }
  }

  private saveConfig(): void {
    try {
      const configPath = path.join(this.dataDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save shadow test config:', error);
    }
  }

  private logResult(result: ShadowTestResult): void {
    const status = result.status === 'passed' ? '✅' : '❌';
    const mode = result.mode === 'shadow' ? '[SHADOW]' : '[ENFORCED]';
    console.log(`${status} ${mode} ${result.testName} (${result.duration.toFixed(2)}ms)`);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Global shadow test manager instance
export const shadowTestManager = new ShadowTestManager();

/**
 * Shadow test decorator for automatic shadow testing
 */
export function shadowTest(testName: string, options: {
  enforceImmediately?: boolean;
  skipShadow?: boolean;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (options.skipShadow) {
        return await originalMethod.apply(this, args);
      }

      const testFile = target.constructor.name || 'unknown';

      return await shadowTestManager.executeShadowTest(
        testName,
        testFile,
        async () => {
          return await originalMethod.apply(this, args);
        },
        {
          browser: args[0]?.browserName?.() || 'unknown'
        }
      );
    };

    return descriptor;
  };
}

/**
 * Helper function to wrap existing tests with shadow testing
 */
export async function runInShadowMode<T>(
  testName: string,
  testFile: string,
  testFunction: () => Promise<T>,
  metadata?: Partial<ShadowTestResult['metadata']>
): Promise<T> {
  const result = await shadowTestManager.executeShadowTest(
    testName,
    testFile,
    testFunction,
    metadata
  );

  if (result.mode === 'enforced' && result.status === 'failed') {
    throw new Error(result.errorMessage || 'Shadow test failed in enforced mode');
  }

  return result as any;
}
