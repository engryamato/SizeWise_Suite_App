/**
 * Unified Error Handler for SizeWise Suite
 * 
 * Provides consistent error handling, logging, reporting, and recovery
 * across all frontend and backend components.
 */

import { 
  BaseStandardError, 
  StandardError, 
  ErrorSeverity, 
  ErrorCategory,
  ErrorFactory,
  isStandardError,
  isRetryableError
} from './StandardErrorTypes';

// =============================================================================
// Error Handler Configuration
// =============================================================================

export interface ErrorHandlerConfig {
  enableSentry: boolean;
  enableConsoleLogging: boolean;
  enableUserNotifications: boolean;
  enableRetryMechanism: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  environment: 'development' | 'staging' | 'production';
  sentryDsn?: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: Date;
  additionalData?: Record<string, any>;
}

// =============================================================================
// Error Handler Service
// =============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  private errorQueue: StandardError[] = [];
  private retryQueue: Map<string, { error: StandardError; attempts: number; nextRetry: Date }> = new Map();

  private constructor(config: ErrorHandlerConfig) {
    this.config = config;
    this.initializeErrorHandling();
  }

  public static getInstance(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      if (!config) {
        throw new Error('ErrorHandler must be initialized with config on first call');
      }
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  // =============================================================================
  // Core Error Handling Methods
  // =============================================================================

  public async handleError(
    error: Error | BaseStandardError,
    context?: ErrorContext,
    options?: {
      notify?: boolean;
      retry?: boolean;
      silent?: boolean;
    }
  ): Promise<string> {
    const standardError = this.normalizeError(error, context);
    const errorId = standardError.id;

    // Add to error queue for processing
    this.errorQueue.push(standardError);

    // Log the error
    if (!options?.silent) {
      await this.logError(standardError);
    }

    // Report to external services (Sentry)
    if (this.config.enableSentry && standardError.severity !== ErrorSeverity.LOW) {
      await this.reportToSentry(standardError);
    }

    // Handle user notifications
    if (this.config.enableUserNotifications && (options?.notify !== false)) {
      await this.notifyUser(standardError);
    }

    // Handle retry mechanism
    if (this.config.enableRetryMechanism && (options?.retry !== false) && isRetryableError(standardError)) {
      this.scheduleRetry(standardError);
    }

    // Process error queue
    this.processErrorQueue();

    return errorId;
  }

  public async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      fallback?: () => Promise<T>;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.config.maxRetryAttempts;
    const retryDelay = options?.retryDelay ?? this.config.retryDelayMs;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        const standardError = this.normalizeError(lastError, {
          ...context,
          additionalData: { attempt, maxRetries }
        });

        // Log attempt
        await this.logError(standardError);

        // If this is the last attempt or error is not retryable, break
        if (attempt === maxRetries || !isRetryableError(standardError)) {
          break;
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // Try fallback if available
    if (options?.fallback) {
      try {
        return await options.fallback();
      } catch (fallbackError) {
        await this.handleError(fallbackError as Error, {
          ...context,
          additionalData: { fallbackFailed: true }
        });
      }
    }

    // Final error handling
    await this.handleError(lastError!, context);
    throw lastError!;
  }

  // =============================================================================
  // Error Processing Methods
  // =============================================================================

  private normalizeError(error: Error | BaseStandardError, context?: ErrorContext): StandardError {
    if (isStandardError(error)) {
      // Enhance existing standard error with context
      return {
        ...error.toJSON(),
        context: { ...error.context, ...context }
      };
    }

    // Convert regular error to standard error
    const standardError = ErrorFactory.fromError(error, undefined, context);
    return standardError.toJSON();
  }

  private async logError(error: StandardError): Promise<void> {
    if (!this.config.enableConsoleLogging) return;

    const logLevel = this.getLogLevel(error.severity);
    const logMessage = this.formatLogMessage(error);

    switch (logLevel) {
      case 'error':
        console.error(logMessage, error);
        break;
      case 'warn':
        console.warn(logMessage, error);
        break;
      case 'info':
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }
  }

  private async reportToSentry(error: StandardError): Promise<void> {
    try {
      // Dynamic import to avoid issues if Sentry is not available
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.captureException(new Error(error.message), {
        tags: {
          errorId: error.id,
          errorCode: error.code,
          severity: error.severity,
          category: error.category,
          source: error.source,
          recoverable: error.recoverable.toString(),
          retryable: error.retryable.toString()
        },
        contexts: {
          error: {
            id: error.id,
            code: error.code,
            userMessage: error.userMessage,
            timestamp: error.timestamp
          },
          custom: error.context
        },
        level: this.getSentryLevel(error.severity)
      });
    } catch (sentryError) {
      console.warn('Failed to report error to Sentry:', sentryError);
    }
  }

  private async notifyUser(error: StandardError): Promise<void> {
    // This would integrate with your notification system
    // For now, we'll use a simple console notification
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.warn(`User Notification: ${error.userMessage}`);
      
      // In a real implementation, this would trigger:
      // - Toast notifications
      // - Modal dialogs
      // - Status bar updates
      // - Email notifications (for critical errors)
    }
  }

  private scheduleRetry(error: StandardError): void {
    const retryKey = `${error.code}_${error.timestamp.getTime()}`;
    const existingRetry = this.retryQueue.get(retryKey);
    
    if (existingRetry && existingRetry.attempts >= this.config.maxRetryAttempts) {
      return; // Max retries reached
    }

    const attempts = existingRetry ? existingRetry.attempts + 1 : 1;
    const nextRetry = new Date(Date.now() + this.config.retryDelayMs * Math.pow(2, attempts - 1));

    this.retryQueue.set(retryKey, {
      error,
      attempts,
      nextRetry
    });
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  private getSentryLevel(severity: ErrorSeverity): 'fatal' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  private formatLogMessage(error: StandardError): string {
    return `[${error.severity.toUpperCase()}] [${error.category.toUpperCase()}] ${error.code}: ${error.message}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processErrorQueue(): void {
    // Process error queue in background
    setTimeout(() => {
      if (this.errorQueue.length > 100) {
        // Keep only the most recent 100 errors
        this.errorQueue = this.errorQueue.slice(-100);
      }
    }, 0);
  }

  private initializeErrorHandling(): void {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      // Frontend error handlers
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          component: 'window',
          action: 'global_error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), {
          component: 'window',
          action: 'unhandled_rejection'
        });
      });
    }
  }

  // =============================================================================
  // Public Utility Methods
  // =============================================================================

  public getErrorHistory(): StandardError[] {
    return [...this.errorQueue];
  }

  public getRetryQueue(): Array<{ error: StandardError; attempts: number; nextRetry: Date }> {
    return Array.from(this.retryQueue.values());
  }

  public clearErrorHistory(): void {
    this.errorQueue = [];
  }

  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

export const handleError = async (
  error: Error | BaseStandardError,
  context?: ErrorContext,
  options?: { notify?: boolean; retry?: boolean; silent?: boolean }
): Promise<string> => {
  const handler = ErrorHandler.getInstance();
  return handler.handleError(error, context, options);
};

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    fallback?: () => Promise<T>;
  }
): Promise<T> => {
  const handler = ErrorHandler.getInstance();
  return handler.handleAsyncOperation(operation, context, options);
};

// =============================================================================
// Error Handler Factory
// =============================================================================

export const createErrorHandler = (config: ErrorHandlerConfig): ErrorHandler => {
  return ErrorHandler.getInstance(config);
};
