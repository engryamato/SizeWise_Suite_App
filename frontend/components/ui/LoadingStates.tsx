/**
 * Loading States Components
 * 
 * Consolidates loading and error UI patterns that were duplicated
 * across multiple components in the SizeWise Suite.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  className?: string;
  variant?: 'minimal' | 'card' | 'full';
}

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
  className?: string;
  backdrop?: boolean;
}

export interface ProgressLoaderProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
  className?: string;
  variant?: 'linear' | 'circular';
}

export interface LoadingStateHook {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

// =============================================================================
// Loading Spinner Component
// =============================================================================

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

// =============================================================================
// Error Display Component
// =============================================================================

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  showDetails = false,
  className,
  variant = 'card'
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const errorMessage = message || (error instanceof Error ? error.message : String(error)) || 'An unexpected error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;

  const renderMinimal = () => (
    <div className={cn('flex items-center space-x-2 text-red-600', className)}>
      <XCircle className="w-4 h-4" />
      <span className="text-sm">{errorMessage}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );

  const renderCard = () => (
    <div className={cn(
      'bg-red-50 border border-red-200 rounded-lg p-4',
      'dark:bg-red-900/20 dark:border-red-800',
      className
    )}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {title}
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
          {showDetails && errorStack && (
            <div className="mt-2">
              <button
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                {showErrorDetails ? 'Hide' : 'Show'} Details
              </button>
              {showErrorDetails && (
                <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto max-h-32">
                  {errorStack}
                </pre>
              )}
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{retryLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderFull = () => (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8',
      className
    )}>
      <AlertTriangle className="w-16 h-16 text-red-500" />
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
          {errorMessage}
        </p>
        {showDetails && errorStack && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-800 p-3 rounded overflow-auto max-h-40">
              {errorStack}
            </pre>
          </details>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );

  switch (variant) {
    case 'minimal':
      return renderMinimal();
    case 'full':
      return renderFull();
    default:
      return renderCard();
  }
};

// =============================================================================
// Loading Overlay Component
// =============================================================================

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  progress,
  children,
  className,
  backdrop = true
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center z-50',
        backdrop && 'bg-white/80 dark:bg-black/80 backdrop-blur-sm'
      )}>
        <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
          <LoadingSpinner size="lg" />
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {message}
            </p>
            {progress !== undefined && (
              <div className="mt-2">
                <ProgressLoader progress={progress} showPercentage />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Progress Loader Component
// =============================================================================

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  progress,
  message,
  showPercentage = false,
  className,
  variant = 'linear'
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

    return (
      <div className={cn('flex flex-col items-center space-y-2', className)}>
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-neutral-200 dark:text-neutral-700"
            />
            <circle
              cx="22"
              cy="22"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-blue-500 transition-all duration-300"
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium">{Math.round(clampedProgress)}%</span>
            </div>
          )}
        </div>
        {message && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-2', className)}>
      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      )}
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-neutral-500 text-right">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  );
};

// =============================================================================
// Loading State Hook
// =============================================================================

export const useLoadingState = (): LoadingStateHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null); // Clear error when starting new operation
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return {
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
    withLoading
  };
};

// =============================================================================
// Success State Component
// =============================================================================

export const SuccessDisplay: React.FC<{
  title?: string;
  message?: string;
  onContinue?: () => void;
  continueLabel?: string;
  className?: string;
}> = ({
  title = 'Success!',
  message = 'Operation completed successfully',
  onContinue,
  continueLabel = 'Continue',
  className
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center space-y-4 p-6',
    className
  )}>
    <CheckCircle className="w-12 h-12 text-green-500" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400">
        {message}
      </p>
    </div>
    {onContinue && (
      <button
        onClick={onContinue}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        {continueLabel}
      </button>
    )}
  </div>
);

// =============================================================================
// Standardized Error Boundary Components
// =============================================================================

interface StandardErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: any; retry: () => void }>;
  onError?: (error: any, errorInfo: React.ErrorInfo) => void;
  context?: Record<string, any>;
  enableRetry?: boolean;
}

interface StandardErrorBoundaryState {
  hasError: boolean;
  error?: any;
  errorId?: string;
}

export class StandardErrorBoundary extends React.Component<
  StandardErrorBoundaryProps,
  StandardErrorBoundaryState
> {
  constructor(props: StandardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): StandardErrorBoundaryState {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StandardErrorBoundary caught error:', error, errorInfo);

    this.setState({
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <ErrorDisplay
          title="Something went wrong"
          message={this.state.error.message || 'An unexpected error occurred'}
          error={this.state.error}
          onRetry={this.props.enableRetry ? this.handleRetry : undefined}
          variant="full"
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// HOC for Error Boundary
// =============================================================================

export function withStandardErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<StandardErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <StandardErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </StandardErrorBoundary>
  );

  WrappedComponent.displayName = `withStandardErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// =============================================================================
// Error Reporting Hook
// =============================================================================

export function useErrorReporting() {
  const reportError = React.useCallback(async (
    error: Error,
    context?: Record<string, any>,
    options?: { notify?: boolean; retry?: boolean; silent?: boolean }
  ) => {
    console.error('Error reported:', error, context);

    // In a full implementation, this would integrate with the ErrorHandler
    // For now, we'll provide a simple implementation
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!options?.silent) {
      console.error(`[${errorId}] ${error.message}`, error);
    }

    return errorId;
  }, []);

  const reportAsyncOperation = React.useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      fallback?: () => Promise<T>;
    }
  ): Promise<T> => {
    const maxRetries = options?.maxRetries ?? 3;
    const retryDelay = options?.retryDelay ?? 1000;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }

    // Try fallback if available
    if (options?.fallback) {
      try {
        return await options.fallback();
      } catch (fallbackError) {
        await reportError(fallbackError as Error, { ...context, fallbackFailed: true });
      }
    }

    await reportError(lastError!, context);
    throw lastError!;
  }, [reportError]);

  return { reportError, reportAsyncOperation };
}
