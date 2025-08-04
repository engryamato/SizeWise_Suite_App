/**
 * Accessibility Testing Automation Utility
 * 
 * Comprehensive automation framework for WCAG 2.1 AA compliance testing
 * using axe-core with CI/CD integration and detailed reporting.
 */

import { axe, toHaveNoViolations, AxeResults, Result } from 'jest-axe';
import { render, RenderResult } from '@testing-library/react';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { expect } from '@jest/globals';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

export interface AccessibilityTestConfig {
  /** Component name for reporting */
  componentName: string;
  /** Test environment (development, staging, production) */
  environment?: string;
  /** Custom axe configuration */
  axeConfig?: any;
  /** Whether to generate detailed reports */
  generateReports?: boolean;
  /** Output directory for reports */
  reportOutputDir?: string;
  /** WCAG level to test against (A, AA, AAA) */
  wcagLevel?: 'A' | 'AA' | 'AAA';
  /** Additional tags to include in testing */
  tags?: string[];
}

export interface AccessibilityTestResult {
  /** Component name tested */
  componentName: string;
  /** Test timestamp */
  timestamp: string;
  /** Whether test passed */
  passed: boolean;
  /** Number of violations found */
  violationCount: number;
  /** Detailed violation information */
  violations: AccessibilityViolation[];
  /** Test configuration used */
  config: AccessibilityTestConfig;
  /** Performance metrics */
  performance: {
    testDuration: number;
    axeRuntime: number;
  };
}

export interface AccessibilityViolation {
  /** Violation ID */
  id: string;
  /** Impact level (minor, moderate, serious, critical) */
  impact: string;
  /** Description of the violation */
  description: string;
  /** Help text for fixing the violation */
  help: string;
  /** Help URL for more information */
  helpUrl: string;
  /** Number of elements affected */
  elementCount: number;
  /** Sample HTML of affected elements */
  sampleHtml: string[];
  /** WCAG criteria violated */
  tags: string[];
}

export class AccessibilityTestAutomation {
  private static instance: AccessibilityTestAutomation;
  private testResults: AccessibilityTestResult[] = [];
  private defaultConfig: AccessibilityTestConfig = {
    componentName: 'Unknown',
    environment: process.env.NODE_ENV || 'test',
    generateReports: true,
    reportOutputDir: 'test-results/accessibility',
    wcagLevel: 'AA',
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  };

  private constructor() {
    this.ensureReportDirectory();
  }

  public static getInstance(): AccessibilityTestAutomation {
    if (!AccessibilityTestAutomation.instance) {
      AccessibilityTestAutomation.instance = new AccessibilityTestAutomation();
    }
    return AccessibilityTestAutomation.instance;
  }

  /**
   * Test a React component for accessibility violations
   */
  public async testComponent(
    component: React.ReactElement,
    config: Partial<AccessibilityTestConfig> = {}
  ): Promise<AccessibilityTestResult> {
    const testConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    try {
      // Render the component
      const { container } = render(component);
      
      // Configure axe-core
      const axeConfig = {
        tags: testConfig.tags,
        rules: {
          // Ensure color contrast meets WCAG AA standards
          'color-contrast': { enabled: true },
          // Ensure proper heading structure
          'heading-order': { enabled: true },
          // Ensure all images have alt text
          'image-alt': { enabled: true },
          // Ensure form labels are properly associated
          'label': { enabled: true },
          // Ensure landmarks are used properly
          'landmark-one-main': { enabled: true },
          // Ensure page has a title
          'document-title': { enabled: true },
          // Ensure focus is manageable
          'focus-order-semantics': { enabled: true },
          // Ensure ARIA attributes are valid
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          ...testConfig.axeConfig?.rules
        },
        ...testConfig.axeConfig
      };

      // Run axe-core accessibility testing
      const axeStartTime = Date.now();
      const results: AxeResults = await axe(container, axeConfig);
      const axeEndTime = Date.now();

      // Process results
      const violations = this.processViolations(results.violations);
      const testResult: AccessibilityTestResult = {
        componentName: testConfig.componentName,
        timestamp: new Date().toISOString(),
        passed: violations.length === 0,
        violationCount: violations.length,
        violations,
        config: testConfig,
        performance: {
          testDuration: Date.now() - startTime,
          axeRuntime: axeEndTime - axeStartTime
        }
      };

      // Store result
      this.testResults.push(testResult);

      // Generate reports if enabled
      if (testConfig.generateReports) {
        await this.generateComponentReport(testResult);
      }

      return testResult;
    } catch (error) {
      const errorResult: AccessibilityTestResult = {
        componentName: testConfig.componentName,
        timestamp: new Date().toISOString(),
        passed: false,
        violationCount: -1,
        violations: [{
          id: 'test-error',
          impact: 'critical',
          description: `Accessibility test failed: ${error.message}`,
          help: 'Fix the underlying component error before running accessibility tests',
          helpUrl: '',
          elementCount: 0,
          sampleHtml: [],
          tags: ['error']
        }],
        config: testConfig,
        performance: {
          testDuration: Date.now() - startTime,
          axeRuntime: 0
        }
      };

      this.testResults.push(errorResult);
      return errorResult;
    }
  }

  /**
   * Test multiple components in batch
   */
  public async testComponentBatch(
    components: Array<{ component: React.ReactElement; config: Partial<AccessibilityTestConfig> }>
  ): Promise<AccessibilityTestResult[]> {
    const results: AccessibilityTestResult[] = [];
    
    for (const { component, config } of components) {
      const result = await this.testComponent(component, config);
      results.push(result);
    }

    // Generate batch report
    if (results.length > 0 && results[0].config.generateReports) {
      await this.generateBatchReport(results);
    }

    return results;
  }

  /**
   * Generate comprehensive accessibility report
   */
  public async generateComprehensiveReport(): Promise<string> {
    const reportPath = path.join(
      this.defaultConfig.reportOutputDir!,
      `accessibility-comprehensive-${Date.now()}.json`
    );

    const report = {
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(r => r.passed).length,
        failedTests: this.testResults.filter(r => !r.passed).length,
        totalViolations: this.testResults.reduce((sum, r) => sum + r.violationCount, 0),
        averageTestDuration: this.testResults.reduce((sum, r) => sum + r.performance.testDuration, 0) / this.testResults.length,
        generatedAt: new Date().toISOString(),
        environment: this.defaultConfig.environment
      },
      violationsByImpact: this.getViolationsByImpact(),
      violationsByComponent: this.getViolationsByComponent(),
      wcagComplianceStatus: this.getWCAGComplianceStatus(),
      recommendations: this.generateRecommendations(),
      detailedResults: this.testResults
    };

    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Also generate HTML report for better readability
    await this.generateHTMLReport(report, reportPath.replace('.json', '.html'));
    
    return reportPath;
  }

  /**
   * Get CI/CD integration summary
   */
  public getCIIntegrationSummary(): {
    exitCode: number;
    summary: string;
    metrics: Record<string, number>;
  } {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalViolations = this.testResults.reduce((sum, r) => sum + r.violationCount, 0);

    const exitCode = failedTests > 0 ? 1 : 0;
    const summary = `Accessibility Tests: ${passedTests}/${totalTests} passed, ${totalViolations} violations found`;

    return {
      exitCode,
      summary,
      metrics: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: failedTests,
        total_violations: totalViolations,
        critical_violations: this.testResults.reduce((sum, r) => 
          sum + r.violations.filter(v => v.impact === 'critical').length, 0),
        serious_violations: this.testResults.reduce((sum, r) => 
          sum + r.violations.filter(v => v.impact === 'serious').length, 0)
      }
    };
  }

  /**
   * Clear all test results (useful for test isolation)
   */
  public clearResults(): void {
    this.testResults = [];
  }

  private processViolations(violations: Result[]): AccessibilityViolation[] {
    return violations.map(violation => ({
      id: violation.id,
      impact: violation.impact || 'unknown',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      elementCount: violation.nodes.length,
      sampleHtml: violation.nodes.slice(0, 3).map(node => node.html),
      tags: violation.tags
    }));
  }

  private ensureReportDirectory(): void {
    const reportDir = this.defaultConfig.reportOutputDir!;
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  private async generateComponentReport(result: AccessibilityTestResult): Promise<void> {
    const reportPath = path.join(
      result.config.reportOutputDir!,
      `${result.componentName}-${Date.now()}.json`
    );
    await fs.promises.writeFile(reportPath, JSON.stringify(result, null, 2));
  }

  private async generateBatchReport(results: AccessibilityTestResult[]): Promise<void> {
    const reportPath = path.join(
      results[0].config.reportOutputDir!,
      `batch-report-${Date.now()}.json`
    );
    await fs.promises.writeFile(reportPath, JSON.stringify(results, null, 2));
  }

  private getViolationsByImpact(): Record<string, number> {
    const impacts = ['critical', 'serious', 'moderate', 'minor'];
    const result: Record<string, number> = {};
    
    impacts.forEach(impact => {
      result[impact] = this.testResults.reduce((sum, r) => 
        sum + r.violations.filter(v => v.impact === impact).length, 0);
    });
    
    return result;
  }

  private getViolationsByComponent(): Record<string, number> {
    const result: Record<string, number> = {};
    
    this.testResults.forEach(r => {
      result[r.componentName] = r.violationCount;
    });
    
    return result;
  }

  private getWCAGComplianceStatus(): Record<string, boolean> {
    const criticalViolations = this.testResults.reduce((sum, r) => 
      sum + r.violations.filter(v => v.impact === 'critical').length, 0);
    const seriousViolations = this.testResults.reduce((sum, r) => 
      sum + r.violations.filter(v => v.impact === 'serious').length, 0);

    return {
      'WCAG 2.1 A': criticalViolations === 0,
      'WCAG 2.1 AA': criticalViolations === 0 && seriousViolations === 0,
      'WCAG 2.1 AAA': this.testResults.every(r => r.passed)
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const violationsByImpact = this.getViolationsByImpact();

    if (violationsByImpact.critical > 0) {
      recommendations.push(`Address ${violationsByImpact.critical} critical accessibility violations immediately`);
    }
    if (violationsByImpact.serious > 0) {
      recommendations.push(`Fix ${violationsByImpact.serious} serious accessibility issues for WCAG AA compliance`);
    }
    if (violationsByImpact.moderate > 0) {
      recommendations.push(`Consider fixing ${violationsByImpact.moderate} moderate accessibility issues for better user experience`);
    }

    return recommendations;
  }

  private async generateHTMLReport(report: any, htmlPath: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SizeWise Suite - Accessibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .violation { border-left: 4px solid #e74c3c; padding: 10px; margin: 10px 0; }
        .violation.critical { border-color: #e74c3c; }
        .violation.serious { border-color: #f39c12; }
        .violation.moderate { border-color: #f1c40f; }
        .violation.minor { border-color: #3498db; }
        .passed { color: #27ae60; }
        .failed { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>SizeWise Suite - Accessibility Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${report.summary.totalTests}</p>
        <p><strong>Passed:</strong> <span class="passed">${report.summary.passedTests}</span></p>
        <p><strong>Failed:</strong> <span class="failed">${report.summary.failedTests}</span></p>
        <p><strong>Total Violations:</strong> ${report.summary.totalViolations}</p>
        <p><strong>Generated:</strong> ${report.summary.generatedAt}</p>
    </div>
    <h2>WCAG Compliance Status</h2>
    <ul>
        ${Object.entries(report.wcagComplianceStatus).map(([level, status]) => 
          `<li><strong>${level}:</strong> <span class="${status ? 'passed' : 'failed'}">${status ? 'COMPLIANT' : 'NON-COMPLIANT'}</span></li>`
        ).join('')}
    </ul>
    <h2>Recommendations</h2>
    <ul>
        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>`;
    
    await fs.promises.writeFile(htmlPath, html);
  }
}

export default AccessibilityTestAutomation;
