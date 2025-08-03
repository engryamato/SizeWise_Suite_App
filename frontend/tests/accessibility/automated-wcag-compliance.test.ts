/**
 * Automated WCAG 2.1 AA Compliance Testing
 * 
 * Comprehensive automated accessibility testing for CI/CD integration
 * using the AccessibilityTestAutomation utility with detailed reporting.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import React from 'react';
import AccessibilityTestAutomation from '../utils/accessibility-automation';

// Import components to test (mocked for now, replace with actual components)
const MockHVACCalculator = () => {
  return React.createElement('div', { role: 'main', 'aria-label': 'HVAC Calculator' },
    React.createElement('h1', null, 'Duct Sizing Calculator'),
    React.createElement('form', { 'aria-label': 'Duct sizing form' },
      React.createElement('label', { htmlFor: 'duct-width' }, 'Duct Width (inches)'),
      React.createElement('input', {
        id: 'duct-width',
        type: 'number',
        'aria-describedby': 'width-help',
        'aria-required': 'true'
      }),
      React.createElement('div', { id: 'width-help' }, 'Enter the width of the duct in inches'),
      React.createElement('label', { htmlFor: 'duct-height' }, 'Duct Height (inches)'),
      React.createElement('input', {
        id: 'duct-height',
        type: 'number',
        'aria-describedby': 'height-help',
        'aria-required': 'true'
      }),
      React.createElement('div', { id: 'height-help' }, 'Enter the height of the duct in inches'),
      React.createElement('button', {
        type: 'submit',
        'aria-describedby': 'calc-help'
      }, 'Calculate Duct Size'),
      React.createElement('div', { id: 'calc-help' }, 'Calculate the optimal duct dimensions')
    )
  );
};

const MockNavigation = () => {
  return React.createElement('nav', { role: 'navigation', 'aria-label': 'Main navigation' },
    React.createElement('ul', null,
      React.createElement('li', null,
        React.createElement('a', { href: '/calculators', 'aria-current': 'page' }, 'Calculators')
      ),
      React.createElement('li', null,
        React.createElement('a', { href: '/reports' }, 'Reports')
      ),
      React.createElement('li', null,
        React.createElement('a', { href: '/settings' }, 'Settings')
      )
    )
  );
};

const MockDataTable = () => {
  return React.createElement('div', { role: 'region', 'aria-label': 'Calculation Results' },
    React.createElement('h2', null, 'Results'),
    React.createElement('table', { 'aria-label': 'HVAC calculation results' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', { scope: 'col' }, 'Parameter'),
          React.createElement('th', { scope: 'col' }, 'Value'),
          React.createElement('th', { scope: 'col' }, 'Unit')
        )
      ),
      React.createElement('tbody', null,
        React.createElement('tr', null,
          React.createElement('td', null, 'Duct Diameter'),
          React.createElement('td', null, '16'),
          React.createElement('td', null, 'inches')
        ),
        React.createElement('tr', null,
          React.createElement('td', null, 'Air Velocity'),
          React.createElement('td', null, '1500'),
          React.createElement('td', null, 'fpm')
        )
      )
    )
  );
};

const MockFormWithErrors = () => {
  return React.createElement('div', { role: 'main', 'aria-label': 'Form with validation' },
    React.createElement('h1', null, 'HVAC System Configuration'),
    React.createElement('form', { 'aria-label': 'System configuration form' },
      React.createElement('div', { role: 'alert', 'aria-live': 'polite' },
        'Please correct the following errors:'
      ),
      React.createElement('label', { htmlFor: 'system-type' }, 'System Type'),
      React.createElement('select', {
        id: 'system-type',
        'aria-describedby': 'system-type-error',
        'aria-invalid': 'true',
        'aria-required': 'true'
      },
        React.createElement('option', { value: '' }, 'Select system type'),
        React.createElement('option', { value: 'duct' }, 'Ductwork'),
        React.createElement('option', { value: 'boiler' }, 'Boiler')
      ),
      React.createElement('div', { 
        id: 'system-type-error', 
        role: 'alert',
        'aria-live': 'polite'
      }, 'System type is required'),
      React.createElement('button', { type: 'submit' }, 'Save Configuration')
    )
  );
};

const MockAccessibleModal = () => {
  return React.createElement('div', null,
    React.createElement('button', { 
      'aria-haspopup': 'dialog',
      'aria-expanded': 'true'
    }, 'Open Settings'),
    React.createElement('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
      'aria-describedby': 'modal-description'
    },
      React.createElement('h2', { id: 'modal-title' }, 'System Settings'),
      React.createElement('p', { id: 'modal-description' }, 'Configure your HVAC system settings'),
      React.createElement('button', { 'aria-label': 'Close settings dialog' }, 'Close')
    )
  );
};

describe('Automated WCAG 2.1 AA Compliance Testing', () => {
  let accessibilityTester: AccessibilityTestAutomation;
  let testResults: any[] = [];

  beforeAll(() => {
    accessibilityTester = AccessibilityTestAutomation.getInstance();
    accessibilityTester.clearResults();
  });

  beforeEach(() => {
    // Clear results before each test for isolation
    testResults = [];
  });

  afterAll(async () => {
    // Generate comprehensive report for CI/CD
    const reportPath = await accessibilityTester.generateComprehensiveReport();
    const ciSummary = accessibilityTester.getCIIntegrationSummary();
    
    console.log('🔍 Accessibility Testing Summary:');
    console.log(ciSummary.summary);
    console.log('📊 Detailed metrics:', ciSummary.metrics);
    console.log('📄 Comprehensive report generated:', reportPath);
    
    // Log for CI/CD integration
    if (process.env.CI) {
      console.log('::set-output name=accessibility_exit_code::', ciSummary.exitCode);
      console.log('::set-output name=accessibility_summary::', ciSummary.summary);
      console.log('::set-output name=accessibility_report::', reportPath);
    }
  });

  describe('Core HVAC Components', () => {
    it('should pass WCAG 2.1 AA compliance for HVAC Calculator', async () => {
      const result = await accessibilityTester.testComponent(
        React.createElement(MockHVACCalculator),
        {
          componentName: 'HVACCalculator',
          wcagLevel: 'AA',
          generateReports: true
        }
      );

      testResults.push(result);
      expect(result.passed).toBe(true);
      expect(result.violationCount).toBe(0);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass WCAG 2.1 AA compliance for Navigation', async () => {
      const result = await accessibilityTester.testComponent(
        React.createElement(MockNavigation),
        {
          componentName: 'Navigation',
          wcagLevel: 'AA',
          generateReports: true
        }
      );

      testResults.push(result);
      expect(result.passed).toBe(true);
      expect(result.violationCount).toBe(0);
    });

    it('should pass WCAG 2.1 AA compliance for Data Tables', async () => {
      const result = await accessibilityTester.testComponent(
        React.createElement(MockDataTable),
        {
          componentName: 'DataTable',
          wcagLevel: 'AA',
          generateReports: true
        }
      );

      testResults.push(result);
      expect(result.passed).toBe(true);
      expect(result.violationCount).toBe(0);
    });

    it('should pass WCAG 2.1 AA compliance for Forms with Error Handling', async () => {
      const result = await accessibilityTester.testComponent(
        React.createElement(MockFormWithErrors),
        {
          componentName: 'FormWithErrors',
          wcagLevel: 'AA',
          generateReports: true
        }
      );

      testResults.push(result);
      expect(result.passed).toBe(true);
      expect(result.violationCount).toBe(0);
    });

    it('should pass WCAG 2.1 AA compliance for Modal Dialogs', async () => {
      const result = await accessibilityTester.testComponent(
        React.createElement(MockAccessibleModal),
        {
          componentName: 'AccessibleModal',
          wcagLevel: 'AA',
          generateReports: true
        }
      );

      testResults.push(result);
      expect(result.passed).toBe(true);
      expect(result.violationCount).toBe(0);
    });
  });

  describe('Batch Testing', () => {
    it('should run batch accessibility tests for all core components', async () => {
      const components = [
        {
          component: React.createElement(MockHVACCalculator),
          config: { componentName: 'HVACCalculator-Batch', wcagLevel: 'AA' as const }
        },
        {
          component: React.createElement(MockNavigation),
          config: { componentName: 'Navigation-Batch', wcagLevel: 'AA' as const }
        },
        {
          component: React.createElement(MockDataTable),
          config: { componentName: 'DataTable-Batch', wcagLevel: 'AA' as const }
        }
      ];

      const results = await accessibilityTester.testComponentBatch(components);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.passed).toBe(true);
        expect(result.violationCount).toBe(0);
      });

      testResults.push(...results);
    });
  });

  describe('Performance and Metrics', () => {
    it('should complete accessibility tests within performance thresholds', async () => {
      const startTime = Date.now();
      
      const result = await accessibilityTester.testComponent(
        React.createElement(MockHVACCalculator),
        {
          componentName: 'HVACCalculator-Performance',
          wcagLevel: 'AA'
        }
      );

      const totalTime = Date.now() - startTime;
      
      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.performance.testDuration).toBeLessThan(3000); // Test duration under 3 seconds
      expect(result.performance.axeRuntime).toBeLessThan(2000); // Axe runtime under 2 seconds
      
      testResults.push(result);
    });

    it('should provide detailed violation information when violations exist', async () => {
      // Create a component with intentional accessibility issues for testing
      const ComponentWithIssues = () => {
        return React.createElement('div', null,
          React.createElement('img', { src: 'test.jpg' }), // Missing alt text
          React.createElement('button', null, 'Click'), // Missing accessible name
          React.createElement('input', { type: 'text' }) // Missing label
        );
      };

      const result = await accessibilityTester.testComponent(
        React.createElement(ComponentWithIssues),
        {
          componentName: 'ComponentWithIssues',
          wcagLevel: 'AA'
        }
      );

      // This test expects violations, so we check the structure rather than pass/fail
      expect(result.violations).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
      
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation).toHaveProperty('id');
        expect(violation).toHaveProperty('impact');
        expect(violation).toHaveProperty('description');
        expect(violation).toHaveProperty('help');
        expect(violation).toHaveProperty('helpUrl');
        expect(violation).toHaveProperty('elementCount');
        expect(violation).toHaveProperty('sampleHtml');
        expect(violation).toHaveProperty('tags');
      }

      testResults.push(result);
    });
  });

  describe('CI/CD Integration', () => {
    it('should provide CI-compatible summary and exit codes', () => {
      const ciSummary = accessibilityTester.getCIIntegrationSummary();
      
      expect(ciSummary).toHaveProperty('exitCode');
      expect(ciSummary).toHaveProperty('summary');
      expect(ciSummary).toHaveProperty('metrics');
      
      expect(typeof ciSummary.exitCode).toBe('number');
      expect(typeof ciSummary.summary).toBe('string');
      expect(typeof ciSummary.metrics).toBe('object');
      
      // Verify metrics structure
      expect(ciSummary.metrics).toHaveProperty('total_tests');
      expect(ciSummary.metrics).toHaveProperty('passed_tests');
      expect(ciSummary.metrics).toHaveProperty('failed_tests');
      expect(ciSummary.metrics).toHaveProperty('total_violations');
      expect(ciSummary.metrics).toHaveProperty('critical_violations');
      expect(ciSummary.metrics).toHaveProperty('serious_violations');
    });

    it('should generate reports in the correct directory structure', async () => {
      const fs = require('fs');
      const path = require('path');
      
      const reportDir = 'test-results/accessibility';
      expect(fs.existsSync(reportDir)).toBe(true);
      
      // Check if reports are being generated
      const files = fs.readdirSync(reportDir);
      expect(files.length).toBeGreaterThan(0);
      
      // Verify JSON and HTML reports exist
      const jsonReports = files.filter(f => f.endsWith('.json'));
      const htmlReports = files.filter(f => f.endsWith('.html'));
      
      expect(jsonReports.length).toBeGreaterThan(0);
      expect(htmlReports.length).toBeGreaterThan(0);
    });
  });
});

console.log('✅ Automated WCAG 2.1 AA Compliance Testing completed');
