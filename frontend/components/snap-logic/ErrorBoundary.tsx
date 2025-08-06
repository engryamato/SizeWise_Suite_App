/**
 * Error Boundary Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * React Error Boundary component with integration to the snap logic error handling
 * system. Provides graceful error recovery and user-friendly error displays for
 * professional HVAC design workflows.
 * 
 * @fileoverview React Error Boundary for snap logic components
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorHandler } from '@/lib/snap-logic/system/ErrorHandler';
import { SnapLogicError, ErrorCategory, ErrorSeverity } from '@/lib/snap-logic/system/SnapLogicError';

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  errorHandler?: ErrorHandler;
  showErrorDetails?: boolean;
  enableRecovery?: boolean;
  component?: string;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  snapLogicError: SnapLogicError | null;
  showDetails: boolean;
  recoveryAttempts: number;
  isRecovering: boolean;
}

/**
 * Error boundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler: ErrorHandler | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      snapLogicError: null,
      showDetails: false,
      recoveryAttempts: 0,
      isRecovering: false
    };

    this.errorHandler = props.errorHandler || null;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Create SnapLogicError from React error
    const snapLogicError = new SnapLogicError(
      error.message,
      ErrorCategory.UI_COMPONENT,
      ErrorSeverity.HIGH,
      {
        component: this.props.component || 'ErrorBoundary',
        operation: 'component_render',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        }
      },
      {
        cause: error,
        recoverable: true,
        userVisible: true,
        reportToServer: true
      }
    );

    this.setState({
      errorInfo,
      snapLogicError
    });

    // Handle error through error handler
    if (this.errorHandler) {
      this.errorHandler.handleError(snapLogicError);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console
    console.error('[ErrorBoundary] Component error caught:', error, errorInfo);
  }

  /**
   * Attempt to recover from error
   */
  handleRecovery = async () => {
    if (!this.props.enableRecovery || this.state.isRecovering) {
      return;
    }

    this.setState({ 
      isRecovering: true,
      recoveryAttempts: this.state.recoveryAttempts + 1
    });

    try {
      // Wait a moment before attempting recovery
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        snapLogicError: null,
        showDetails: false,
        isRecovering: false
      });

      console.log('[ErrorBoundary] Recovery attempt successful');
    } catch (recoveryError) {
      console.error('[ErrorBoundary] Recovery attempt failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  /**
   * Toggle error details visibility
   */
  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  /**
   * Reload the page
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Report bug
   */
  handleReportBug = () => {
    const { error, errorInfo, snapLogicError } = this.state;
    
    const bugReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      snapLogicError: snapLogicError?.toReportData(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a real implementation, this would send the report to a bug tracking system
    console.log('[ErrorBoundary] Bug report:', bugReport);
    
    // Copy to clipboard for now
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2)).then(() => {
      alert('Bug report copied to clipboard');
    }).catch(() => {
      alert('Failed to copy bug report to clipboard');
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, snapLogicError, showDetails, recoveryAttempts, isRecovering } = this.state;
      const maxRecoveryAttempts = 3;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-red-200">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-red-100">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {snapLogicError?.getUserMessage() || 'An unexpected error occurred in the application.'}
                </p>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6">
              {/* Error Summary */}
              <div className="mb-4">
                <div className="text-sm text-gray-700">
                  <strong>Error:</strong> {error?.message || 'Unknown error'}
                </div>
                {snapLogicError && (
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Category:</strong> {snapLogicError.category} | 
                    <strong> Severity:</strong> {snapLogicError.severity} |
                    <strong> Component:</strong> {snapLogicError.context.component}
                  </div>
                )}
              </div>

              {/* Recovery Status */}
              {recoveryAttempts > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    Recovery attempts: {recoveryAttempts}/{maxRecoveryAttempts}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-4">
                {this.props.enableRecovery && recoveryAttempts < maxRecoveryAttempts && (
                  <button
                    onClick={this.handleRecovery}
                    disabled={isRecovering}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isRecovering
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    )}
                  >
                    <RefreshCw className={cn("w-4 h-4", isRecovering && "animate-spin")} />
                    {isRecovering ? 'Recovering...' : 'Try Again'}
                  </button>
                )}

                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </button>
              </div>

              {/* Error Details Toggle */}
              {this.props.showErrorDetails && (
                <div>
                  <button
                    onClick={this.toggleDetails}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {showDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {showDetails ? 'Hide' : 'Show'} Error Details
                  </button>

                  {showDetails && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {error?.stack || 'No stack trace available'}
                      </div>
                      
                      {snapLogicError && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="text-xs text-gray-600 mb-2">
                            <strong>Snap Logic Error Details:</strong>
                          </div>
                          <div className="text-xs font-mono text-gray-700">
                            Error ID: {snapLogicError.errorId}<br />
                            Timestamp: {new Date(snapLogicError.timestamp).toLocaleString()}<br />
                            Recovery Strategy: {snapLogicError.recoveryStrategy}<br />
                            Recoverable: {snapLogicError.recoverable ? 'Yes' : 'No'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support with the error details above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;
