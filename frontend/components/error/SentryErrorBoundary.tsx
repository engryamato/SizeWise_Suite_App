"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  tags?: Record<string, string>;
  context?: Record<string, any>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Enhanced Error Boundary with Sentry integration for SizeWise Suite
 * Maintains existing UI patterns while adding comprehensive error reporting
 */
export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, tags, context } = this.props;

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Capture error to Sentry with enhanced context
    const errorId = Sentry.captureException(error, {
      tags: {
        component: 'ErrorBoundary',
        application: 'sizewise-suite',
        ...tags,
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        errorBoundary: {
          location: 'SentryErrorBoundary',
          hasCustomFallback: !!this.props.fallback,
          ...context,
        },
      },
      level: 'error',
    });

    this.setState({ errorId });

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('SentryErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleReportFeedback = () => {
    if (this.state.errorId) {
      Sentry.showReportDialog({
        eventId: this.state.errorId,
        title: 'SizeWise Suite Error Report',
        subtitle: 'Help us improve by reporting this error',
        subtitle2: 'Your feedback helps us fix issues faster.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What were you doing when this error occurred?',
        labelClose: 'Close',
        labelSubmit: 'Submit Report',
        successMessage: 'Thank you for your report!',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI matching SizeWise Suite design patterns
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                {/* Error Message */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 mb-6">
                  We&apos;ve encountered an unexpected error. Our team has been notified and is working on a fix.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                    <p className="text-sm font-mono text-gray-800 break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Try Again
                  </button>
                  
                  {this.props.showDialog !== false && this.state.errorId && (
                    <button
                      onClick={this.handleReportFeedback}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Report Issue
                    </button>
                  )}
                </div>

                {/* Error ID for Support */}
                {this.state.errorId && (
                  <p className="mt-4 text-xs text-gray-500">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with Sentry error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryOptions?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <SentryErrorBoundary {...errorBoundaryOptions}>
      <Component {...props} />
    </SentryErrorBoundary>
  );

  WrappedComponent.displayName = `withSentryErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manually reporting errors to Sentry
 */
export function useSentryErrorReporting() {
  const reportError = React.useCallback((
    error: Error,
    context?: Record<string, any>,
    tags?: Record<string, string>
  ) => {
    return Sentry.captureException(error, {
      tags: {
        source: 'manual',
        application: 'sizewise-suite',
        ...tags,
      },
      contexts: {
        manual: context,
      },
    });
  }, []);

  const reportMessage = React.useCallback((
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, any>
  ) => {
    return Sentry.captureMessage(message, {
      level,
      tags: {
        source: 'manual',
        application: 'sizewise-suite',
      },
      contexts: {
        manual: context,
      },
    });
  }, []);

  return { reportError, reportMessage };
}
