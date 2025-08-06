/**
 * Snap Logic Error System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive error type definitions and custom error classes for the snap logic system.
 * Provides structured error handling with context preservation, error categorization,
 * and integration with debug collection for professional HVAC design workflows.
 * 
 * @fileoverview Custom error types and classes for snap logic system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for snap logic system
 */
export enum ErrorCategory {
  // Core system errors
  SNAP_LOGIC = 'snap_logic',
  PERFORMANCE = 'performance',
  VALIDATION = 'validation',
  
  // Drawing and geometry errors
  CENTERLINE = 'centerline',
  GEOMETRY = 'geometry',
  SPATIAL_INDEX = 'spatial_index',
  
  // User interaction errors
  TOUCH_GESTURE = 'touch_gesture',
  USER_INPUT = 'user_input',
  UI_COMPONENT = 'ui_component',
  
  // System integration errors
  CACHE = 'cache',
  STORAGE = 'storage',
  NETWORK = 'network',
  
  // HVAC specific errors
  SMACNA_VALIDATION = 'smacna_validation',
  FITTING_CALCULATION = 'fitting_calculation',
  BRANCH_ANALYSIS = 'branch_analysis',
  
  // Debug and monitoring errors
  DEBUG_COLLECTION = 'debug_collection',
  PERFORMANCE_MONITORING = 'performance_monitoring',
  
  // General system errors
  CONFIGURATION = 'configuration',
  INITIALIZATION = 'initialization',
  UNKNOWN = 'unknown'
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  USER_INTERVENTION = 'user_intervention',
  SYSTEM_RESTART = 'system_restart',
  NO_RECOVERY = 'no_recovery'
}

/**
 * Error context interface
 */
export interface ErrorContext {
  // System context
  timestamp: number;
  sessionId?: string;
  userId?: string;
  
  // Component context
  component: string;
  operation: string;
  parameters?: Record<string, any>;
  
  // System state context
  snapLogicEnabled?: boolean;
  activeTool?: string;
  touchDevice?: boolean;
  
  // Performance context
  memoryUsage?: number;
  performanceScore?: number;
  
  // User context
  userAgent?: string;
  viewport?: { width: number; height: number };
  
  // Additional context
  metadata?: Record<string, any>;
}

/**
 * Error reporting data
 */
export interface ErrorReportData {
  errorId: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: ErrorContext;
  recoveryStrategy: RecoveryStrategy;
  recoverable: boolean;
  userVisible: boolean;
  reportToServer: boolean;
}

/**
 * Base snap logic error class
 */
export class SnapLogicError extends Error {
  public readonly errorId: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly recoveryStrategy: RecoveryStrategy;
  public readonly recoverable: boolean;
  public readonly userVisible: boolean;
  public readonly reportToServer: boolean;
  public readonly timestamp: number;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    options: {
      recoveryStrategy?: RecoveryStrategy;
      recoverable?: boolean;
      userVisible?: boolean;
      reportToServer?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    
    this.name = 'SnapLogicError';
    this.errorId = `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.severity = severity;
    this.category = category;
    this.timestamp = Date.now();
    
    // Set recovery strategy based on severity if not provided
    this.recoveryStrategy = options.recoveryStrategy || this.getDefaultRecoveryStrategy(severity);
    this.recoverable = options.recoverable ?? (severity !== ErrorSeverity.CRITICAL);
    this.userVisible = options.userVisible ?? (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL);
    this.reportToServer = options.reportToServer ?? (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL);
    
    // Build complete context
    this.context = {
      timestamp: this.timestamp,
      component: 'unknown',
      operation: 'unknown',
      ...context
    };

    // Preserve original error if provided
    if (options.cause) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, SnapLogicError.prototype);
  }

  /**
   * Get default recovery strategy based on severity
   */
  private getDefaultRecoveryStrategy(severity: ErrorSeverity): RecoveryStrategy {
    switch (severity) {
      case ErrorSeverity.LOW:
        return RecoveryStrategy.GRACEFUL_DEGRADATION;
      case ErrorSeverity.MEDIUM:
        return RecoveryStrategy.RETRY;
      case ErrorSeverity.HIGH:
        return RecoveryStrategy.FALLBACK;
      case ErrorSeverity.CRITICAL:
        return RecoveryStrategy.SYSTEM_RESTART;
      default:
        return RecoveryStrategy.NO_RECOVERY;
    }
  }

  /**
   * Convert error to report data
   */
  toReportData(): ErrorReportData {
    return {
      errorId: this.errorId,
      severity: this.severity,
      category: this.category,
      message: this.message,
      stack: this.stack,
      context: this.context,
      recoveryStrategy: this.recoveryStrategy,
      recoverable: this.recoverable,
      userVisible: this.userVisible,
      reportToServer: this.reportToServer
    };
  }

  /**
   * Create user-friendly error message
   */
  getUserMessage(): string {
    const categoryMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.SNAP_LOGIC]: 'Snap logic system encountered an issue',
      [ErrorCategory.PERFORMANCE]: 'Performance issue detected',
      [ErrorCategory.VALIDATION]: 'Validation error occurred',
      [ErrorCategory.CENTERLINE]: 'Centerline drawing error',
      [ErrorCategory.GEOMETRY]: 'Geometry calculation error',
      [ErrorCategory.SPATIAL_INDEX]: 'Spatial indexing error',
      [ErrorCategory.TOUCH_GESTURE]: 'Touch gesture recognition error',
      [ErrorCategory.USER_INPUT]: 'Invalid user input',
      [ErrorCategory.UI_COMPONENT]: 'User interface error',
      [ErrorCategory.CACHE]: 'Cache system error',
      [ErrorCategory.STORAGE]: 'Storage system error',
      [ErrorCategory.NETWORK]: 'Network connection error',
      [ErrorCategory.SMACNA_VALIDATION]: 'SMACNA validation error',
      [ErrorCategory.FITTING_CALCULATION]: 'Fitting calculation error',
      [ErrorCategory.BRANCH_ANALYSIS]: 'Branch analysis error',
      [ErrorCategory.DEBUG_COLLECTION]: 'Debug collection error',
      [ErrorCategory.PERFORMANCE_MONITORING]: 'Performance monitoring error',
      [ErrorCategory.CONFIGURATION]: 'Configuration error',
      [ErrorCategory.INITIALIZATION]: 'System initialization error',
      [ErrorCategory.UNKNOWN]: 'An unexpected error occurred'
    };

    const baseMessage = categoryMessages[this.category] || 'An error occurred';
    
    if (this.severity === ErrorSeverity.CRITICAL) {
      return `Critical Error: ${baseMessage}. Please restart the application.`;
    } else if (this.severity === ErrorSeverity.HIGH) {
      return `Error: ${baseMessage}. Some features may not work correctly.`;
    } else {
      return `${baseMessage}. The system will attempt to recover automatically.`;
    }
  }
}

/**
 * Snap logic validation error
 */
export class SnapLogicValidationError extends SnapLogicError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    options: {
      recoveryStrategy?: RecoveryStrategy;
      recoverable?: boolean;
    } = {}
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      context,
      {
        recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
        recoverable: true,
        userVisible: false,
        reportToServer: false,
        ...options
      }
    );
    this.name = 'SnapLogicValidationError';
  }
}

/**
 * Snap logic performance error
 */
export class SnapLogicPerformanceError extends SnapLogicError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    options: {
      recoveryStrategy?: RecoveryStrategy;
      recoverable?: boolean;
    } = {}
  ) {
    super(
      message,
      ErrorCategory.PERFORMANCE,
      ErrorSeverity.HIGH,
      context,
      {
        recoveryStrategy: RecoveryStrategy.FALLBACK,
        recoverable: true,
        userVisible: true,
        reportToServer: true,
        ...options
      }
    );
    this.name = 'SnapLogicPerformanceError';
  }
}

/**
 * Touch gesture error
 */
export class TouchGestureError extends SnapLogicError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    options: {
      recoveryStrategy?: RecoveryStrategy;
      recoverable?: boolean;
    } = {}
  ) {
    super(
      message,
      ErrorCategory.TOUCH_GESTURE,
      ErrorSeverity.LOW,
      context,
      {
        recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
        recoverable: true,
        userVisible: false,
        reportToServer: false,
        ...options
      }
    );
    this.name = 'TouchGestureError';
  }
}

/**
 * Centerline drawing error
 */
export class CenterlineError extends SnapLogicError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    options: {
      recoveryStrategy?: RecoveryStrategy;
      recoverable?: boolean;
    } = {}
  ) {
    super(
      message,
      ErrorCategory.CENTERLINE,
      ErrorSeverity.MEDIUM,
      context,
      {
        recoveryStrategy: RecoveryStrategy.RETRY,
        recoverable: true,
        userVisible: true,
        reportToServer: false,
        ...options
      }
    );
    this.name = 'CenterlineError';
  }
}

/**
 * SMACNA validation error
 */
export class SMACNAValidationError extends SnapLogicError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    options: {
      recoveryStrategy?: RecoveryStrategy;
      recoverable?: boolean;
    } = {}
  ) {
    super(
      message,
      ErrorCategory.SMACNA_VALIDATION,
      ErrorSeverity.MEDIUM,
      context,
      {
        recoveryStrategy: RecoveryStrategy.USER_INTERVENTION,
        recoverable: true,
        userVisible: true,
        reportToServer: false,
        ...options
      }
    );
    this.name = 'SMACNAValidationError';
  }
}
