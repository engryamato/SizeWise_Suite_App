/**
 * Standardized Error Types for SizeWise Suite
 * 
 * Provides consistent error classification, handling, and reporting
 * across all frontend and backend components.
 */

// =============================================================================
// Error Severity Levels
// =============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  CALCULATION = 'calculation',
  NETWORK = 'network',
  DATABASE = 'database',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
  HVAC_DOMAIN = 'hvac_domain',
  OFFLINE = 'offline',
  PERFORMANCE = 'performance'
}

// =============================================================================
// Base Error Interface
// =============================================================================

export interface StandardError {
  id: string;
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  recoverable: boolean;
  retryable: boolean;
  source: 'frontend' | 'backend' | 'system';
}

// =============================================================================
// Standard Error Classes
// =============================================================================

export class BaseStandardError extends Error implements StandardError {
  public readonly id: string;
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly source: 'frontend' | 'backend' | 'system';

  constructor(
    code: string,
    message: string,
    userMessage: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    options: {
      context?: Record<string, any>;
      recoverable?: boolean;
      retryable?: boolean;
      source?: 'frontend' | 'backend' | 'system';
      cause?: Error;
    } = {}
  ) {
    super(message, { cause: options.cause });
    
    this.id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.category = category;
    this.timestamp = new Date();
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;
    this.retryable = options.retryable ?? false;
    this.source = options.source ?? 'system';
    
    this.name = this.constructor.name;
  }

  toJSON(): StandardError {
    return {
      id: this.id,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      category: this.category,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
      recoverable: this.recoverable,
      retryable: this.retryable,
      source: this.source
    };
  }
}

// =============================================================================
// Specific Error Types
// =============================================================================

export class AuthenticationError extends BaseStandardError {
  constructor(message: string, userMessage: string = 'Authentication failed', context?: Record<string, any>) {
    super(
      'AUTH_FAILED',
      message,
      userMessage,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION,
      { context, recoverable: true, retryable: true, source: 'frontend' }
    );
  }
}

export class AuthorizationError extends BaseStandardError {
  constructor(message: string, userMessage: string = 'Access denied', context?: Record<string, any>) {
    super(
      'ACCESS_DENIED',
      message,
      userMessage,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHORIZATION,
      { context, recoverable: false, retryable: false, source: 'backend' }
    );
  }
}

export class ValidationError extends BaseStandardError {
  constructor(message: string, userMessage: string, context?: Record<string, any>) {
    super(
      'VALIDATION_FAILED',
      message,
      userMessage,
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      { context, recoverable: true, retryable: false, source: 'frontend' }
    );
  }
}

export class HVACCalculationError extends BaseStandardError {
  constructor(message: string, userMessage: string, context?: Record<string, any>) {
    super(
      'HVAC_CALC_ERROR',
      message,
      userMessage,
      ErrorSeverity.HIGH,
      ErrorCategory.HVAC_DOMAIN,
      { context, recoverable: true, retryable: true, source: 'frontend' }
    );
  }
}

export class NetworkError extends BaseStandardError {
  constructor(message: string, userMessage: string = 'Network connection failed', context?: Record<string, any>) {
    super(
      'NETWORK_ERROR',
      message,
      userMessage,
      ErrorSeverity.MEDIUM,
      ErrorCategory.NETWORK,
      { context, recoverable: true, retryable: true, source: 'system' }
    );
  }
}

export class DatabaseError extends BaseStandardError {
  constructor(message: string, userMessage: string = 'Database operation failed', context?: Record<string, any>) {
    super(
      'DATABASE_ERROR',
      message,
      userMessage,
      ErrorSeverity.HIGH,
      ErrorCategory.DATABASE,
      { context, recoverable: true, retryable: true, source: 'backend' }
    );
  }
}

export class OfflineError extends BaseStandardError {
  constructor(message: string, userMessage: string = 'Feature unavailable offline', context?: Record<string, any>) {
    super(
      'OFFLINE_ERROR',
      message,
      userMessage,
      ErrorSeverity.MEDIUM,
      ErrorCategory.OFFLINE,
      { context, recoverable: true, retryable: true, source: 'system' }
    );
  }
}

export class PerformanceError extends BaseStandardError {
  constructor(message: string, userMessage: string = 'Operation taking longer than expected', context?: Record<string, any>) {
    super(
      'PERFORMANCE_ERROR',
      message,
      userMessage,
      ErrorSeverity.LOW,
      ErrorCategory.PERFORMANCE,
      { context, recoverable: true, retryable: true, source: 'system' }
    );
  }
}

// =============================================================================
// Error Factory
// =============================================================================

export class ErrorFactory {
  static createError(
    type: 'authentication' | 'authorization' | 'validation' | 'hvac' | 'network' | 'database' | 'offline' | 'performance',
    message: string,
    userMessage?: string,
    context?: Record<string, any>
  ): BaseStandardError {
    switch (type) {
      case 'authentication':
        return new AuthenticationError(message, userMessage, context);
      case 'authorization':
        return new AuthorizationError(message, userMessage, context);
      case 'validation':
        return new ValidationError(message, userMessage || 'Invalid input provided', context);
      case 'hvac':
        return new HVACCalculationError(message, userMessage || 'HVAC calculation failed', context);
      case 'network':
        return new NetworkError(message, userMessage, context);
      case 'database':
        return new DatabaseError(message, userMessage, context);
      case 'offline':
        return new OfflineError(message, userMessage, context);
      case 'performance':
        return new PerformanceError(message, userMessage, context);
      default:
        return new BaseStandardError(
          'UNKNOWN_ERROR',
          message,
          userMessage || 'An unexpected error occurred',
          ErrorSeverity.MEDIUM,
          ErrorCategory.SYSTEM,
          { context }
        );
    }
  }

  static fromError(error: Error, category?: ErrorCategory, context?: Record<string, any>): BaseStandardError {
    if (error instanceof BaseStandardError) {
      return error;
    }

    // Determine category from error type/message
    const detectedCategory = category || this.detectCategory(error);
    const severity = this.detectSeverity(error, detectedCategory);

    return new BaseStandardError(
      'WRAPPED_ERROR',
      error.message,
      this.generateUserMessage(error, detectedCategory),
      severity,
      detectedCategory,
      { context, cause: error }
    );
  }

  private static detectCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('access') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('database') || message.includes('query') || message.includes('transaction')) {
      return ErrorCategory.DATABASE;
    }
    if (message.includes('hvac') || message.includes('calculation') || message.includes('duct')) {
      return ErrorCategory.HVAC_DOMAIN;
    }
    if (message.includes('offline') || message.includes('sync')) {
      return ErrorCategory.OFFLINE;
    }
    
    return ErrorCategory.SYSTEM;
  }

  private static detectSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    if (category === ErrorCategory.AUTHENTICATION || category === ErrorCategory.AUTHORIZATION) {
      return ErrorSeverity.HIGH;
    }
    if (category === ErrorCategory.HVAC_DOMAIN || category === ErrorCategory.DATABASE) {
      return ErrorSeverity.HIGH;
    }
    if (category === ErrorCategory.VALIDATION || category === ErrorCategory.NETWORK) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private static generateUserMessage(error: Error, category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return 'Please check your login credentials and try again';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action';
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again';
      case ErrorCategory.HVAC_DOMAIN:
        return 'HVAC calculation failed. Please verify your inputs';
      case ErrorCategory.NETWORK:
        return 'Network connection failed. Please check your internet connection';
      case ErrorCategory.DATABASE:
        return 'Data operation failed. Please try again';
      case ErrorCategory.OFFLINE:
        return 'This feature is not available offline';
      case ErrorCategory.PERFORMANCE:
        return 'Operation is taking longer than expected';
      default:
        return 'An unexpected error occurred. Please try again';
    }
  }
}

// =============================================================================
// Error Utilities
// =============================================================================

export const isStandardError = (error: any): error is BaseStandardError => {
  return error instanceof BaseStandardError;
};

export const isRetryableError = (error: any): boolean => {
  return isStandardError(error) ? error.retryable : false;
};

export const isRecoverableError = (error: any): boolean => {
  return isStandardError(error) ? error.recoverable : true;
};

export const getErrorSeverity = (error: any): ErrorSeverity => {
  return isStandardError(error) ? error.severity : ErrorSeverity.MEDIUM;
};

export const getErrorCategory = (error: any): ErrorCategory => {
  return isStandardError(error) ? error.category : ErrorCategory.SYSTEM;
};
