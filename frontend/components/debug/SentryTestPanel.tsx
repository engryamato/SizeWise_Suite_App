'use client'

/**
 * Sentry Test Panel - Development Only
 *
 * Enhanced retractable component for testing Sentry integration in development mode.
 * Provides buttons to trigger various types of errors and performance traces.
 * Features: collapsible design, keyboard shortcuts, visual feedback, proper positioning.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Sentry from '@sentry/nextjs';
import { HVACTracing } from '@/lib/monitoring/HVACTracing';
import { logger } from '@/lib/monitoring/SentryLogger';
import { useSentryErrorReporting } from '@/components/error/SentryErrorBoundary';

// =============================================================================
// Types
// =============================================================================

interface TestButtonState {
  loading: boolean;
  lastResult: 'success' | 'error' | null;
  lastExecuted: Date | null;
}

interface SentryTestPanelState {
  isOpen: boolean;
  testStates: Record<string, TestButtonState>;
}

// =============================================================================
// Test Button Component
// =============================================================================

interface TestButtonProps {
  testKey: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
  testStates: Record<string, TestButtonState>;
}

const TestButton: React.FC<TestButtonProps> = ({
  testKey,
  onClick,
  className,
  children,
  testStates
}) => {
  const state = testStates[testKey];
  const isLoading = state?.loading || false;
  const lastResult = state?.lastResult;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`
        w-full px-3 py-1 text-xs rounded transition-all duration-200 relative
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
      whileTap={!isLoading ? { scale: 0.95 } : {}}
    >
      <div className="flex items-center justify-center space-x-2">
        {isLoading && (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
        )}
        <span>{children}</span>
        {lastResult && !isLoading && (
          <span className="text-xs">
            {lastResult === 'success' ? '✅' : '❌'}
          </span>
        )}
      </div>
    </motion.button>
  );
};

// =============================================================================
// Toggle Button Component
// =============================================================================

interface SentryTestToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

const SentryTestToggle: React.FC<SentryTestToggleProps> = ({ isOpen, onClick }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`
        fixed top-20 left-4 z-[65] w-10 h-10 rounded-lg shadow-lg
        flex items-center justify-center transition-all duration-200
        ${isOpen
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Toggle Sentry Test Panel (Ctrl+Shift+S)"
      aria-label="Toggle Sentry Test Panel"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      >
        <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    </motion.button>
  );
};

// =============================================================================
// Main Panel Component
// =============================================================================

export const SentryTestPanel: React.FC = () => {
  const { reportError } = useSentryErrorReporting();
  const panelRef = useRef<HTMLDivElement>(null);

  // State management
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sentry-test-panel-open') === 'true';
    }
    return false;
  });

  const [testStates, setTestStates] = useState<Record<string, TestButtonState>>({
    error: { loading: false, lastResult: null, lastExecuted: null },
    calculation: { loading: false, lastResult: null, lastExecuted: null },
    validation: { loading: false, lastResult: null, lastExecuted: null },
    api: { loading: false, lastResult: null, lastExecuted: null },
    interaction: { loading: false, lastResult: null, lastExecuted: null },
    logging: { loading: false, lastResult: null, lastExecuted: null },
    breadcrumbs: { loading: false, lastResult: null, lastExecuted: null },
    transaction: { loading: false, lastResult: null, lastExecuted: null },
  });

  // Persist panel state
  useEffect(() => {
    localStorage.setItem('sentry-test-panel-open', isOpen.toString());
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+S to toggle panel
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }

      // Escape to close panel
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Helper function to update test state
  const updateTestState = (testKey: string, updates: Partial<TestButtonState>) => {
    setTestStates(prev => ({
      ...prev,
      [testKey]: { ...prev[testKey], ...updates }
    }));
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Enhanced test functions with loading states and feedback
  const testError = () => {
    updateTestState('error', { loading: true });
    try {
      throw new Error('Test error from SentryTestPanel');
    } catch (error) {
      try {
        reportError(error as Error, {
          component: 'SentryTestPanel',
          action: 'test_error',
          testType: 'manual'
        }, {
          test_error: 'manual_trigger'
        });
        updateTestState('error', {
          loading: false,
          lastResult: 'success',
          lastExecuted: new Date()
        });
        console.log('✅ Sentry error test sent successfully');
      } catch (sentryError) {
        updateTestState('error', {
          loading: false,
          lastResult: 'error',
          lastExecuted: new Date()
        });
        console.error('❌ Failed to send Sentry error test:', sentryError);
      }
    }
  };

  const testCalculationTrace = async () => {
    updateTestState('calculation', { loading: true });
    try {
      await HVACTracing.traceDuctCalculation(
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
      updateTestState('calculation', {
        loading: false,
        lastResult: 'success',
        lastExecuted: new Date()
      });
      console.log('✅ Sentry calculation trace sent successfully');
    } catch (error) {
      updateTestState('calculation', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
      console.error('❌ Failed to send Sentry calculation trace:', error);
    }
  };

  const testValidationTrace = async () => {
    updateTestState('validation', { loading: true });
    try {
      await HVACTracing.traceValidation(
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
      updateTestState('validation', {
        loading: false,
        lastResult: 'success',
        lastExecuted: new Date()
      });
      console.log('✅ Sentry validation trace sent successfully');
    } catch (error) {
      updateTestState('validation', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
      console.error('❌ Failed to send Sentry validation trace:', error);
    }
  };

  const testAPITrace = async () => {
    updateTestState('api', { loading: true });
    try {
      await HVACTracing.traceAPICall(
        '/api/test/calculation',
        'POST',
        async () => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 200));
          return { status: 'success', data: {} };
        },
        { testData: true }
      );
      updateTestState('api', {
        loading: false,
        lastResult: 'success',
        lastExecuted: new Date()
      });
      console.log('✅ Sentry API trace sent successfully');
    } catch (error) {
      updateTestState('api', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
      console.error('❌ Failed to send Sentry API trace:', error);
    }
  };

  const testUserInteraction = () => {
    updateTestState('interaction', { loading: true });
    try {
      HVACTracing.traceUserInteraction(
        'test_button_click',
        'air-duct-sizer',
        () => {
          console.log('Test user interaction logged');
        },
        { testMode: true }
      );
      updateTestState('interaction', {
        loading: false,
        lastResult: 'success',
        lastExecuted: new Date()
      });
      console.log('✅ Sentry user interaction trace sent successfully');
    } catch (error) {
      updateTestState('interaction', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
      console.error('❌ Failed to send Sentry user interaction trace:', error);
    }
  };

  const testLogging = () => {
    updateTestState('logging', { loading: true });
    try {
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
      // Add a small delay to simulate async operation
      setTimeout(() => {
        updateTestState('logging', {
          loading: false,
          lastResult: 'success',
          lastExecuted: new Date()
        });
        console.log('✅ Sentry logging tests sent successfully');
      }, 500);
    } catch (error) {
      updateTestState('logging', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
      console.error('❌ Failed to send Sentry logging tests:', error);
    }
  };

  const testBreadcrumbs = () => {
    updateTestState('breadcrumbs', { loading: true });
    try {
      Sentry.addBreadcrumb({
        category: 'test',
        message: 'Test breadcrumb from SentryTestPanel',
        level: 'info',
        data: {
          testData: true,
          timestamp: new Date().toISOString()
        }
      });
      setTimeout(() => {
        updateTestState('breadcrumbs', {
          loading: false,
          lastResult: 'success',
          lastExecuted: new Date()
        });
        console.log('✅ Sentry breadcrumb test sent successfully');
      }, 300);
    } catch (error) {
      updateTestState('breadcrumbs', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
      console.error('❌ Failed to send Sentry breadcrumb test:', error);
    }
  };

  const testTransaction = () => {
    updateTestState('transaction', { loading: true });
    try {
      Sentry.startSpan(
        {
          op: 'test.transaction',
          name: 'Test Transaction',
        },
        (span) => {
          span.setAttribute('test.component', 'SentryTestPanel');
          span.setAttribute('test.type', 'manual');
          span.setStatus({ code: 1 }); // OK
        }
      );
      setTimeout(() => {
        updateTestState('transaction', {
          loading: false,
          lastResult: 'success',
          lastExecuted: new Date()
        });
        console.log('✅ Sentry transaction test sent successfully');
      }, 300);
    } catch (error) {
      updateTestState('transaction', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
      console.error('❌ Failed to send Sentry transaction test:', error);
    }
  };

  // Test /api/sentry-example-api with robust JSON parse error handling
  const testSentryExampleAPI = async () => {
    updateTestState('sentryExampleAPI', { loading: true });
    try {
      const response = await fetch('/api/sentry-example-api');
      let data = null;
      let rawText = '';
      try {
        rawText = await response.text();
        data = JSON.parse(rawText);
        logger.info('Successfully parsed JSON from /api/sentry-example-api', { data });
        updateTestState('sentryExampleAPI', {
          loading: false,
          lastResult: 'success',
          lastExecuted: new Date()
        });
      } catch (jsonError) {
        logger.error('Failed to parse JSON from /api/sentry-example-api',
          jsonError instanceof Error ? jsonError : new Error(String(jsonError)),
          {
            rawResponse: rawText
          });
        reportError(jsonError instanceof Error ? jsonError : new Error('Invalid JSON'), {
          endpoint: '/api/sentry-example-api',
          rawResponse: rawText
        }, { test: 'sentryExampleAPI' });
        updateTestState('sentryExampleAPI', {
          loading: false,
          lastResult: 'error',
          lastExecuted: new Date()
        });
        return;
      }
    } catch (error) {
      logger.error('Network or fetch error calling /api/sentry-example-api',
        error instanceof Error ? error : new Error(String(error)));
      reportError(error instanceof Error ? error : new Error('Unknown fetch error'), {
        endpoint: '/api/sentry-example-api'
      }, { test: 'sentryExampleAPI' });
      updateTestState('sentryExampleAPI', {
        loading: false,
        lastResult: 'error',
        lastExecuted: new Date()
      });
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <SentryTestToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />

      {/* Retractable Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click-outside detection */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[69]"
              onClick={() => setIsOpen(false)}
            />

            {/* Main Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
              className="fixed top-20 left-4 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-[70] max-h-[calc(100vh-6rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Sentry Test Panel</h3>
                    <p className="text-xs text-gray-600">Development mode only</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close panel"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="p-4">
                <div className="space-y-2">
                  <TestButton
                    testKey="error"
                    onClick={testError}
                    className="bg-red-500 text-white hover:bg-red-600"
                    testStates={testStates}
                  >
                    Test Error Reporting
                  </TestButton>

                  <TestButton
                    testKey="calculation"
                    onClick={testCalculationTrace}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                    testStates={testStates}
                  >
                    Test Calculation Trace
                  </TestButton>

                  <TestButton
                    testKey="validation"
                    onClick={testValidationTrace}
                    className="bg-green-500 text-white hover:bg-green-600"
                    testStates={testStates}
                  >
                    Test Validation Trace
                  </TestButton>

                  <TestButton
                    testKey="api"
                    onClick={testAPITrace}
                    className="bg-purple-500 text-white hover:bg-purple-600"
                    testStates={testStates}
                  >
                    Test API Trace
                  </TestButton>

                  <TestButton
                    testKey="interaction"
                    onClick={testUserInteraction}
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                    testStates={testStates}
                  >
                    Test User Interaction
                  </TestButton>

                  <TestButton
                    testKey="logging"
                    onClick={testLogging}
                    className="bg-indigo-500 text-white hover:bg-indigo-600"
                    testStates={testStates}
                  >
                    Test Logging
                  </TestButton>

                  <TestButton
                    testKey="breadcrumbs"
                    onClick={testBreadcrumbs}
                    className="bg-pink-500 text-white hover:bg-pink-600"
                    testStates={testStates}
                  >
                    Test Breadcrumbs
                  </TestButton>

                  <TestButton
                    testKey="transaction"
                    onClick={testTransaction}
                    className="bg-teal-500 text-white hover:bg-teal-600"
                    testStates={testStates}
                  >
                    Test Transaction
                  </TestButton>

                  <TestButton
                    testKey="sentryExampleAPI"
                    onClick={testSentryExampleAPI}
                    className="bg-gray-700 text-white hover:bg-gray-900"
                    testStates={testStates}
                  >
                    Test /api/sentry-example-api (Robust JSON)
                  </TestButton>
                </div>

                {/* Panel Footer */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">
                      Check Sentry dashboard for events
                    </p>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">Connected</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Keyboard shortcut: <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Shift+S</kbd>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Note: 403 errors in development are expected and non-blocking
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
