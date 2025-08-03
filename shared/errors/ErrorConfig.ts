/**
 * Error Handling Configuration for SizeWise Suite
 * 
 * Centralized configuration for error handling across frontend and backend
 */

import { ErrorHandler, ErrorHandlerConfig } from './ErrorHandler';

// =============================================================================
// Environment-specific Configurations
// =============================================================================

const developmentConfig: ErrorHandlerConfig = {
  enableSentry: false,
  enableConsoleLogging: true,
  enableUserNotifications: true,
  enableRetryMechanism: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  environment: 'development'
};

const stagingConfig: ErrorHandlerConfig = {
  enableSentry: true,
  enableConsoleLogging: true,
  enableUserNotifications: true,
  enableRetryMechanism: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  environment: 'staging',
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN
};

const productionConfig: ErrorHandlerConfig = {
  enableSentry: true,
  enableConsoleLogging: false,
  enableUserNotifications: true,
  enableRetryMechanism: true,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  environment: 'production',
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN
};

// =============================================================================
// Configuration Factory
// =============================================================================

export function getErrorHandlerConfig(): ErrorHandlerConfig {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// =============================================================================
// Error Handler Initialization
// =============================================================================

let errorHandlerInstance: ErrorHandler | null = null;

export function initializeErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    const config = getErrorHandlerConfig();
    errorHandlerInstance = ErrorHandler.getInstance(config);
    
    // Log initialization
    console.log(`Error handler initialized for ${config.environment} environment`);
  }
  
  return errorHandlerInstance;
}

export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    return initializeErrorHandler();
  }
  
  return errorHandlerInstance;
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

export const ErrorHandlingUtils = {
  /**
   * Initialize error handling for the application
   */
  initialize: initializeErrorHandler,
  
  /**
   * Get the current error handler instance
   */
  getInstance: getErrorHandler,
  
  /**
   * Check if error handling is properly configured
   */
  isConfigured: (): boolean => {
    return errorHandlerInstance !== null;
  },
  
  /**
   * Update error handler configuration
   */
  updateConfig: (newConfig: Partial<ErrorHandlerConfig>): void => {
    if (errorHandlerInstance) {
      errorHandlerInstance.updateConfig(newConfig);
    }
  },
  
  /**
   * Get current configuration
   */
  getConfig: (): ErrorHandlerConfig => {
    return getErrorHandlerConfig();
  }
};

// =============================================================================
// Error Handling Middleware for Next.js
// =============================================================================

export function withErrorHandling<T extends (...args: any[]) => any>(
  handler: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    const errorHandler = getErrorHandler();
    
    try {
      return await handler(...args);
    } catch (error) {
      await errorHandler.handleError(error as Error, {
        component: 'api_handler',
        ...context
      });
      throw error;
    }
  }) as T;
}

// =============================================================================
// React Error Boundary Configuration
// =============================================================================

export const ErrorBoundaryConfig = {
  development: {
    showErrorDetails: true,
    enableRetry: true,
    logToConsole: true,
    reportToSentry: false
  },
  staging: {
    showErrorDetails: true,
    enableRetry: true,
    logToConsole: true,
    reportToSentry: true
  },
  production: {
    showErrorDetails: false,
    enableRetry: true,
    logToConsole: false,
    reportToSentry: true
  }
};

export function getErrorBoundaryConfig() {
  const environment = process.env.NODE_ENV || 'development';
  return ErrorBoundaryConfig[environment as keyof typeof ErrorBoundaryConfig] || ErrorBoundaryConfig.development;
}

// =============================================================================
// HVAC-Specific Error Handling
// =============================================================================

export const HVACErrorHandling = {
  /**
   * Handle HVAC calculation errors with domain-specific context
   */
  handleCalculationError: async (
    error: Error,
    calculationType: string,
    parameters: Record<string, any>
  ) => {
    const errorHandler = getErrorHandler();
    
    return errorHandler.handleError(error, {
      component: 'hvac_calculation',
      action: calculationType,
      additionalData: {
        calculationType,
        parameters: Object.keys(parameters), // Don't log sensitive data
        parameterCount: Object.keys(parameters).length
      }
    });
  },
  
  /**
   * Handle 3D visualization errors
   */
  handle3DError: async (
    error: Error,
    operation: string,
    context?: Record<string, any>
  ) => {
    const errorHandler = getErrorHandler();
    
    return errorHandler.handleError(error, {
      component: '3d_visualization',
      action: operation,
      additionalData: {
        webglSupported: typeof WebGLRenderingContext !== 'undefined',
        ...context
      }
    });
  },
  
  /**
   * Handle offline-first synchronization errors
   */
  handleSyncError: async (
    error: Error,
    syncType: 'upload' | 'download' | 'conflict_resolution',
    context?: Record<string, any>
  ) => {
    const errorHandler = getErrorHandler();
    
    return errorHandler.handleError(error, {
      component: 'offline_sync',
      action: syncType,
      additionalData: {
        isOnline: navigator.onLine,
        syncType,
        ...context
      }
    });
  }
};

// =============================================================================
// Error Monitoring and Analytics
// =============================================================================

export const ErrorMonitoring = {
  /**
   * Get error statistics
   */
  getErrorStats: () => {
    const errorHandler = getErrorHandler();
    const history = errorHandler.getErrorHistory();
    
    const stats = {
      totalErrors: history.length,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      recentErrors: history.slice(-10),
      retryQueue: errorHandler.getRetryQueue()
    };
    
    history.forEach(error => {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });
    
    return stats;
  },
  
  /**
   * Clear error history
   */
  clearHistory: () => {
    const errorHandler = getErrorHandler();
    errorHandler.clearErrorHistory();
  },
  
  /**
   * Export error data for analysis
   */
  exportErrorData: () => {
    const errorHandler = getErrorHandler();
    const history = errorHandler.getErrorHistory();
    
    return {
      exportDate: new Date().toISOString(),
      environment: getErrorHandlerConfig().environment,
      errors: history,
      retryQueue: errorHandler.getRetryQueue()
    };
  }
};

// =============================================================================
// Default Export
// =============================================================================

export default {
  initialize: initializeErrorHandler,
  getHandler: getErrorHandler,
  getConfig: getErrorHandlerConfig,
  utils: ErrorHandlingUtils,
  hvac: HVACErrorHandling,
  monitoring: ErrorMonitoring,
  withErrorHandling
};
