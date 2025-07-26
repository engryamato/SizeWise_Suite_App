'use client'

/**
 * Sentry Test Panel - Development Only
 * 
 * Component for testing Sentry integration in development mode.
 * Provides buttons to trigger various types of errors and performance traces.
 */

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { HVACTracing } from '@/lib/monitoring/HVACTracing';
import { logger } from '@/lib/monitoring/SentryLogger';
import { useSentryErrorReporting } from '@/components/error/SentryErrorBoundary';

export const SentryTestPanel: React.FC = () => {
  const { reportError } = useSentryErrorReporting();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const testError = () => {
    try {
      throw new Error('Test error from SentryTestPanel');
    } catch (error) {
      reportError(error as Error, {
        component: 'SentryTestPanel',
        action: 'test_error',
        testType: 'manual'
      }, {
        test_error: 'manual_trigger'
      });
    }
  };

  const testCalculationTrace = () => {
    HVACTracing.traceDuctCalculation(
      'rectangular',
      async () => {
        // Simulate calculation
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, width: 12, height: 8 };
      },
      {
        calculationType: 'rectangular',
        inputComplexity: 'moderate',
        standardsUsed: ['SMACNA', 'ASHRAE'],
        userTier: 'free'
      }
    );
  };

  const testValidationTrace = () => {
    HVACTracing.traceValidation(
      'duct',
      async () => {
        // Simulate validation
        await new Promise(resolve => setTimeout(resolve, 50));
        return { warnings: 2, errors: 0 };
      },
      {
        segmentCount: 5,
        roomCount: 3,
        warningCount: 2,
        errorCount: 0,
        standardsChecked: ['SMACNA', 'ASHRAE']
      }
    );
  };

  const testAPITrace = () => {
    HVACTracing.traceAPICall(
      '/api/test/calculation',
      'POST',
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
        return { status: 'success', data: {} };
      },
      { testData: true }
    );
  };

  const testUserInteraction = () => {
    HVACTracing.traceUserInteraction(
      'test_button_click',
      'air-duct-sizer',
      () => {
        console.log('Test user interaction logged');
      },
      { testMode: true }
    );
  };

  const testLogging = () => {
    logger.debug('Test debug message', { component: 'SentryTestPanel' });
    logger.info('Test info message', { component: 'SentryTestPanel' });
    logger.warn('Test warning message', { component: 'SentryTestPanel' });
    logger.featureFlag('test_flag', true, { component: 'SentryTestPanel' });
    logger.userAction('test_action', 'test_tool', { component: 'SentryTestPanel' });
    logger.performance({
      name: 'test_metric',
      value: 123,
      unit: 'ms',
      context: { component: 'SentryTestPanel' }
    });
  };

  const testBreadcrumbs = () => {
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb from SentryTestPanel',
      level: 'info',
      data: {
        testData: true,
        timestamp: new Date().toISOString()
      }
    });
  };

  const testTransaction = () => {
    Sentry.startSpan(
      {
        op: 'test.transaction',
        name: 'Test Transaction',
      },
      (span) => {
        span.setAttribute('test.component', 'SentryTestPanel');
        span.setAttribute('test.type', 'manual');
        
        // Simulate some work
        setTimeout(() => {
          span.setStatus({ code: 1 }); // OK
        }, 100);
      }
    );
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Sentry Test Panel</h3>
        <p className="text-xs text-gray-600">Development mode only</p>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testError}
          className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Test Error Reporting
        </button>
        
        <button
          onClick={testCalculationTrace}
          className="w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Test Calculation Trace
        </button>
        
        <button
          onClick={testValidationTrace}
          className="w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Test Validation Trace
        </button>
        
        <button
          onClick={testAPITrace}
          className="w-full px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Test API Trace
        </button>
        
        <button
          onClick={testUserInteraction}
          className="w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Test User Interaction
        </button>
        
        <button
          onClick={testLogging}
          className="w-full px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          Test Logging
        </button>
        
        <button
          onClick={testBreadcrumbs}
          className="w-full px-3 py-1 text-xs bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
        >
          Test Breadcrumbs
        </button>
        
        <button
          onClick={testTransaction}
          className="w-full px-3 py-1 text-xs bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
        >
          Test Transaction
        </button>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Check Sentry dashboard for captured events
        </p>
      </div>
    </div>
  );
};
