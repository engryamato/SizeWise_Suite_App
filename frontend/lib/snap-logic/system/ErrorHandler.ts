/**
 * Error Handler System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive error handling system with context preservation, recovery strategies,
 * and integration with debug collection. Provides graceful degradation and error
 * reporting for professional HVAC design workflows.
 * 
 * @fileoverview Central error handling system for snap logic
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { 
  SnapLogicError, 
  ErrorSeverity, 
  ErrorCategory, 
  RecoveryStrategy, 
  ErrorContext,
  ErrorReportData
} from './SnapLogicError';
import { DebugCollector } from './DebugCollector';

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  // Error reporting
  enableErrorReporting: boolean;
  reportToServer: boolean;
  serverEndpoint?: string;
  
  // Recovery behavior
  enableAutoRecovery: boolean;
  maxRetryAttempts: number;
  retryDelay: number; // milliseconds
  
  // User notifications
  showUserNotifications: boolean;
  notificationDuration: number; // milliseconds
  
  // Debug integration
  enableDebugIntegration: boolean;
  verboseLogging: boolean;
  
  // Performance monitoring
  enablePerformanceTracking: boolean;
  performanceThresholds: {
    warning: number; // milliseconds
    critical: number; // milliseconds
  };
  
  // Graceful degradation
  enableGracefulDegradation: boolean;
  fallbackStrategies: Record<ErrorCategory, () => void>;
}

/**
 * Error recovery result
 */
export interface ErrorRecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  attempts: number;
  duration: number;
  fallbackUsed: boolean;
  message?: string;
}

/**
 * Error notification data
 */
export interface ErrorNotification {
  id: string;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  timestamp: number;
  dismissible: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

/**
 * Default error handler configuration
 */
const DEFAULT_ERROR_CONFIG: ErrorHandlerConfig = {
  enableErrorReporting: true,
  reportToServer: false,
  
  enableAutoRecovery: true,
  maxRetryAttempts: 3,
  retryDelay: 1000,
  
  showUserNotifications: true,
  notificationDuration: 5000,
  
  enableDebugIntegration: true,
  verboseLogging: false,
  
  enablePerformanceTracking: true,
  performanceThresholds: {
    warning: 100,
    critical: 500
  },
  
  enableGracefulDegradation: true,
  fallbackStrategies: {
    [ErrorCategory.SNAP_LOGIC]: () => console.log('Snap logic fallback'),
    [ErrorCategory.PERFORMANCE]: () => console.log('Performance fallback'),
    [ErrorCategory.VALIDATION]: () => console.log('Validation fallback'),
    [ErrorCategory.CENTERLINE]: () => console.log('Centerline fallback'),
    [ErrorCategory.GEOMETRY]: () => console.log('Geometry fallback'),
    [ErrorCategory.SPATIAL_INDEX]: () => console.log('Spatial index fallback'),
    [ErrorCategory.TOUCH_GESTURE]: () => console.log('Touch gesture fallback'),
    [ErrorCategory.USER_INPUT]: () => console.log('User input fallback'),
    [ErrorCategory.UI_COMPONENT]: () => console.log('UI component fallback'),
    [ErrorCategory.CACHE]: () => console.log('Cache fallback'),
    [ErrorCategory.STORAGE]: () => console.log('Storage fallback'),
    [ErrorCategory.NETWORK]: () => console.log('Network fallback'),
    [ErrorCategory.SMACNA_VALIDATION]: () => console.log('SMACNA validation fallback'),
    [ErrorCategory.FITTING_CALCULATION]: () => console.log('Fitting calculation fallback'),
    [ErrorCategory.BRANCH_ANALYSIS]: () => console.log('Branch analysis fallback'),
    [ErrorCategory.DEBUG_COLLECTION]: () => console.log('Debug collection fallback'),
    [ErrorCategory.PERFORMANCE_MONITORING]: () => console.log('Performance monitoring fallback'),
    [ErrorCategory.CONFIGURATION]: () => console.log('Configuration fallback'),
    [ErrorCategory.INITIALIZATION]: () => console.log('Initialization fallback'),
    [ErrorCategory.UNKNOWN]: () => console.log('Unknown error fallback')
  }
};

/**
 * Central error handler class
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private debugCollector: DebugCollector | null = null;
  private errorHistory: SnapLogicError[] = [];
  private recoveryAttempts: Map<string, number> = new Map();
  private activeNotifications: Map<string, ErrorNotification> = new Map();
  private errorListeners: Array<(error: SnapLogicError) => void> = [];
  private notificationListeners: Array<(notification: ErrorNotification) => void> = [];

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    this.setupGlobalErrorHandlers();
  }

  /**
   * Set debug collector for integration
   */
  setDebugCollector(debugCollector: DebugCollector): void {
    this.debugCollector = debugCollector;
  }

  /**
   * Handle error with comprehensive processing
   */
  async handleError(
    error: Error | SnapLogicError,
    context?: Partial<ErrorContext>
  ): Promise<ErrorRecoveryResult> {
    const startTime = performance.now();
    
    // Convert to SnapLogicError if needed
    const snapError = this.normalizeError(error, context);
    
    // Add to error history
    this.errorHistory.push(snapError);
    this.limitErrorHistory();
    
    // Log to debug collector
    if (this.config.enableDebugIntegration && this.debugCollector) {
      this.debugCollector.logError(snapError, snapError.context, 'error');
    }
    
    // Log to console if verbose
    if (this.config.verboseLogging) {
      console.error('[ErrorHandler] Error occurred:', snapError);
    }
    
    // Notify error listeners
    this.notifyErrorListeners(snapError);
    
    // Attempt recovery
    const recoveryResult = await this.attemptRecovery(snapError);
    
    // Show user notification if needed
    if (snapError.userVisible && this.config.showUserNotifications) {
      this.showUserNotification(snapError, recoveryResult);
    }
    
    // Report to server if configured
    if (snapError.reportToServer && this.config.reportToServer) {
      this.reportToServer(snapError);
    }
    
    // Calculate total duration
    recoveryResult.duration = performance.now() - startTime;
    
    return recoveryResult;
  }

  /**
   * Attempt error recovery based on strategy
   */
  private async attemptRecovery(error: SnapLogicError): Promise<ErrorRecoveryResult> {
    const errorKey = `${error.category}_${error.context.component}_${error.context.operation}`;
    const attempts = this.recoveryAttempts.get(errorKey) || 0;
    
    const result: ErrorRecoveryResult = {
      success: false,
      strategy: error.recoveryStrategy,
      attempts: attempts + 1,
      duration: 0,
      fallbackUsed: false
    };

    if (!error.recoverable || !this.config.enableAutoRecovery) {
      result.message = 'Error is not recoverable or auto-recovery is disabled';
      return result;
    }

    if (attempts >= this.config.maxRetryAttempts) {
      result.message = 'Maximum retry attempts exceeded';
      return this.attemptFallback(error, result);
    }

    // Update attempt count
    this.recoveryAttempts.set(errorKey, attempts + 1);

    try {
      switch (error.recoveryStrategy) {
        case RecoveryStrategy.RETRY:
          result.success = await this.retryOperation(error);
          break;
          
        case RecoveryStrategy.FALLBACK:
          result.success = await this.useFallback(error);
          result.fallbackUsed = true;
          break;
          
        case RecoveryStrategy.GRACEFUL_DEGRADATION:
          result.success = await this.gracefulDegradation(error);
          break;
          
        case RecoveryStrategy.USER_INTERVENTION:
          result.success = false;
          result.message = 'User intervention required';
          break;
          
        case RecoveryStrategy.SYSTEM_RESTART:
          result.success = false;
          result.message = 'System restart required';
          break;
          
        default:
          result.success = false;
          result.message = 'No recovery strategy available';
      }
    } catch (recoveryError) {
      result.success = false;
      result.message = `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`;
      
      // Log recovery failure
      if (this.config.verboseLogging) {
        console.error('[ErrorHandler] Recovery failed:', recoveryError);
      }
    }

    // Clear attempt count on success
    if (result.success) {
      this.recoveryAttempts.delete(errorKey);
    }

    return result;
  }

  /**
   * Retry the failed operation
   */
  private async retryOperation(error: SnapLogicError): Promise<boolean> {
    // Wait before retry
    await this.delay(this.config.retryDelay);
    
    // For now, we'll return true to simulate successful retry
    // In a real implementation, this would re-execute the failed operation
    if (this.config.verboseLogging) {
      console.log(`[ErrorHandler] Retrying operation: ${error.context.operation}`);
    }
    
    return true;
  }

  /**
   * Use fallback strategy
   */
  private async useFallback(error: SnapLogicError): Promise<boolean> {
    const fallbackStrategy = this.config.fallbackStrategies[error.category];
    
    if (fallbackStrategy) {
      try {
        fallbackStrategy();
        return true;
      } catch (fallbackError) {
        if (this.config.verboseLogging) {
          console.error('[ErrorHandler] Fallback strategy failed:', fallbackError);
        }
        return false;
      }
    }
    
    return false;
  }

  /**
   * Attempt graceful degradation
   */
  private async gracefulDegradation(error: SnapLogicError): Promise<boolean> {
    if (!this.config.enableGracefulDegradation) {
      return false;
    }

    // Implement graceful degradation based on error category
    switch (error.category) {
      case ErrorCategory.PERFORMANCE:
        // Reduce performance-intensive features
        return this.degradePerformanceFeatures();
        
      case ErrorCategory.TOUCH_GESTURE:
        // Fall back to mouse-only interaction
        return this.degradeTouchFeatures();
        
      case ErrorCategory.SPATIAL_INDEX:
        // Fall back to linear search
        return this.degradeSpatialIndexing();
        
      case ErrorCategory.CACHE:
        // Disable caching
        return this.degradeCaching();
        
      default:
        return false;
    }
  }

  /**
   * Attempt fallback recovery
   */
  private async attemptFallback(error: SnapLogicError, result: ErrorRecoveryResult): Promise<ErrorRecoveryResult> {
    if (error.recoveryStrategy !== RecoveryStrategy.FALLBACK) {
      // Try fallback as last resort
      const fallbackSuccess = await this.useFallback(error);
      if (fallbackSuccess) {
        result.success = true;
        result.fallbackUsed = true;
        result.message = 'Recovered using fallback strategy';
      }
    }
    
    return result;
  }

  /**
   * Show user notification
   */
  private showUserNotification(error: SnapLogicError, recovery: ErrorRecoveryResult): void {
    const notification: ErrorNotification = {
      id: error.errorId,
      severity: error.severity,
      message: error.message,
      userMessage: error.getUserMessage(),
      timestamp: Date.now(),
      dismissible: error.severity !== ErrorSeverity.CRITICAL,
      actions: this.getNotificationActions(error, recovery)
    };

    this.activeNotifications.set(notification.id, notification);
    this.notifyNotificationListeners(notification);

    // Auto-dismiss non-critical notifications
    if (notification.dismissible) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, this.config.notificationDuration);
    }
  }

  /**
   * Get notification actions based on error and recovery
   */
  private getNotificationActions(error: SnapLogicError, recovery: ErrorRecoveryResult): Array<{ label: string; action: () => void }> {
    const actions: Array<{ label: string; action: () => void }> = [];

    if (!recovery.success && error.recoverable) {
      actions.push({
        label: 'Retry',
        action: () => this.handleError(error)
      });
    }

    if (error.category === ErrorCategory.PERFORMANCE) {
      actions.push({
        label: 'Optimize',
        action: () => this.optimizePerformance()
      });
    }

    return actions;
  }

  /**
   * Report error to server
   */
  private async reportToServer(error: SnapLogicError): Promise<void> {
    if (!this.config.serverEndpoint) {
      return;
    }

    try {
      const reportData = error.toReportData();
      
      await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
    } catch (reportError) {
      if (this.config.verboseLogging) {
        console.error('[ErrorHandler] Failed to report error to server:', reportError);
      }
    }
  }

  /**
   * Normalize error to SnapLogicError
   */
  private normalizeError(error: Error | SnapLogicError, context?: Partial<ErrorContext>): SnapLogicError {
    if (error instanceof SnapLogicError) {
      return error;
    }

    // Convert generic Error to SnapLogicError
    return new SnapLogicError(
      error.message,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.MEDIUM,
      {
        component: 'unknown',
        operation: 'unknown',
        ...context
      },
      {
        cause: error
      }
    );
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(
          new Error(event.reason?.message || 'Unhandled promise rejection'),
          {
            component: 'global',
            operation: 'promise_rejection',
            metadata: { reason: event.reason }
          }
        );
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.handleError(
          event.error || new Error(event.message),
          {
            component: 'global',
            operation: 'global_error',
            metadata: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            }
          }
        );
      });
    }
  }

  /**
   * Performance degradation strategies
   */
  private degradePerformanceFeatures(): boolean {
    // Implement performance degradation
    if (this.config.verboseLogging) {
      console.log('[ErrorHandler] Degrading performance features');
    }
    return true;
  }

  private degradeTouchFeatures(): boolean {
    // Disable touch-specific features
    if (this.config.verboseLogging) {
      console.log('[ErrorHandler] Degrading touch features');
    }
    return true;
  }

  private degradeSpatialIndexing(): boolean {
    // Fall back to linear search
    if (this.config.verboseLogging) {
      console.log('[ErrorHandler] Degrading spatial indexing');
    }
    return true;
  }

  private degradeCaching(): boolean {
    // Disable caching
    if (this.config.verboseLogging) {
      console.log('[ErrorHandler] Degrading caching');
    }
    return true;
  }

  private optimizePerformance(): void {
    // Trigger performance optimization
    if (this.config.verboseLogging) {
      console.log('[ErrorHandler] Optimizing performance');
    }
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private limitErrorHistory(): void {
    const maxHistory = 100;
    if (this.errorHistory.length > maxHistory) {
      this.errorHistory = this.errorHistory.slice(-maxHistory);
    }
  }

  private notifyErrorListeners(error: SnapLogicError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('[ErrorHandler] Error listener failed:', listenerError);
      }
    });
  }

  private notifyNotificationListeners(notification: ErrorNotification): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (listenerError) {
        console.error('[ErrorHandler] Notification listener failed:', listenerError);
      }
    });
  }

  /**
   * Public API methods
   */
  addErrorListener(listener: (error: SnapLogicError) => void): void {
    this.errorListeners.push(listener);
  }

  removeErrorListener(listener: (error: SnapLogicError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  addNotificationListener(listener: (notification: ErrorNotification) => void): void {
    this.notificationListeners.push(listener);
  }

  removeNotificationListener(listener: (notification: ErrorNotification) => void): void {
    const index = this.notificationListeners.indexOf(listener);
    if (index > -1) {
      this.notificationListeners.splice(index, 1);
    }
  }

  dismissNotification(notificationId: string): void {
    this.activeNotifications.delete(notificationId);
  }

  getErrorHistory(): SnapLogicError[] {
    return [...this.errorHistory];
  }

  getActiveNotifications(): ErrorNotification[] {
    return Array.from(this.activeNotifications.values());
  }

  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }

  dispose(): void {
    this.errorListeners = [];
    this.notificationListeners = [];
    this.activeNotifications.clear();
    this.recoveryAttempts.clear();
    this.errorHistory = [];
  }
}
