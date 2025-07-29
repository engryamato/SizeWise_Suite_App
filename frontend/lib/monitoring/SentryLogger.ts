/**
 * Sentry-integrated logging utility for SizeWise Suite
 * Enhances existing console logging with Sentry breadcrumbs and error reporting
 */

import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  projectId?: string;
  tool?: string;
  tier?: string;
  [key: string]: any;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  context?: LogContext;
}

/**
 * Enhanced logger that maintains existing console patterns while adding Sentry integration
 */
export class SentryLogger {
  private static instance: SentryLogger;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): SentryLogger {
    if (!SentryLogger.instance) {
      SentryLogger.instance = new SentryLogger();
    }
    return SentryLogger.instance;
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, context);
    }
    
    this.addBreadcrumb('debug', message, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    console.info(`[INFO] ${message}`, context);
    this.addBreadcrumb('info', message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context);
    this.addBreadcrumb('warn', message, context);
  }

  /**
   * Log error messages and report to Sentry
   */
  error(message: string, error?: Error, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error, context);
    
    this.addBreadcrumb('error', message, context);
    
    if (error) {
      Sentry.captureException(error, {
        tags: {
          component: context?.component || 'unknown',
          action: context?.action || 'unknown',
          tool: context?.tool || 'unknown',
        },
        extra: {
          message,
          ...context,
        },
      });
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }

  /**
   * Log feature flag usage
   */
  featureFlag(flagName: string, value: boolean, context?: LogContext): void {
    const message = `Feature flag '${flagName}' is ${value ? 'enabled' : 'disabled'}`;
    
    if (!this.isProduction) {
      console.debug(`[FEATURE] ${message}`, context);
    }
    
    this.addBreadcrumb('info', message, {
      category: 'feature_flag',
      flag_name: flagName,
      flag_value: value,
      ...context,
    });
  }

  /**
   * Log user interactions
   */
  userAction(action: string, tool: string, context?: LogContext): void {
    const message = `User action: ${action} in ${tool}`;
    
    if (!this.isProduction) {
      console.debug(`[USER] ${message}`, context);
    }
    
    this.addBreadcrumb('info', message, {
      category: 'user_action',
      action,
      tool,
      ...context,
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric: PerformanceMetric): void {
    const message = `Performance: ${metric.name} = ${metric.value} ${metric.unit}`;
    
    if (!this.isProduction) {
      console.debug(`[PERF] ${message}`, metric.context);
    }
    
    this.addBreadcrumb('info', message, {
      category: 'performance',
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit,
      ...metric.context,
    });
    
    // Also log as Sentry performance metric
    Sentry.addBreadcrumb({
      category: 'performance.metric',
      message,
      level: 'info',
      data: {
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: new Date().toISOString(),
        ...metric.context,
      },
    });
  }

  /**
   * Log calculation results
   */
  calculation(
    type: 'round' | 'rectangular' | 'validation',
    duration: number,
    success: boolean,
    context?: LogContext
  ): void {
    const message = `Calculation ${type}: ${success ? 'success' : 'failed'} in ${duration}ms`;
    
    if (!this.isProduction) {
      console.debug(`[CALC] ${message}`, context);
    }
    
    this.addBreadcrumb(success ? 'info' : 'warn', message, {
      category: 'calculation',
      calculation_type: type,
      duration_ms: duration,
      success,
      ...context,
    });
  }

  /**
   * Log API calls
   */
  apiCall(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const message = `API ${method} ${endpoint}: ${status} in ${duration}ms`;
    const level = status >= 400 ? 'warn' : 'info';
    
    if (!this.isProduction) {
      console.debug(`[API] ${message}`, context);
    }
    
    this.addBreadcrumb(level, message, {
      category: 'api_call',
      method,
      endpoint,
      status_code: status,
      duration_ms: duration,
      ...context,
    });
  }

  /**
   * Log validation results
   */
  validation(
    type: 'duct' | 'room' | 'system',
    warningCount: number,
    errorCount: number,
    context?: LogContext
  ): void {
    const message = `Validation ${type}: ${errorCount} errors, ${warningCount} warnings`;
    const level = errorCount > 0 ? 'warn' : 'info';
    
    if (!this.isProduction) {
      console.debug(`[VALIDATION] ${message}`, context);
    }
    
    this.addBreadcrumb(level, message, {
      category: 'validation',
      validation_type: type,
      warning_count: warningCount,
      error_count: errorCount,
      ...context,
    });
  }

  /**
   * Add breadcrumb to Sentry
   */
  private addBreadcrumb(level: LogLevel, message: string, context?: LogContext): void {
    Sentry.addBreadcrumb({
      category: context?.component || 'app',
      message,
      level: level === 'warn' ? 'warning' : level,
      data: {
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  /**
   * Set user context for logging
   */
  setUser(userId: string, email?: string, tier?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      tier,
    });
  }

  /**
   * Set project context for logging
   */
  setProject(projectId: string, projectName?: string): void {
    Sentry.setTag('project_id', projectId);
    if (projectName) {
      Sentry.setTag('project_name', projectName);
    }
  }

  /**
   * Clear user and project context
   */
  clearContext(): void {
    Sentry.setUser(null);
    Sentry.setTag('project_id', null);
    Sentry.setTag('project_name', null);
  }
}

// Export singleton instance
export const logger = SentryLogger.getInstance();

// Export convenience functions that maintain existing console patterns
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context);
export const logFeatureFlag = (flagName: string, value: boolean, context?: LogContext) => logger.featureFlag(flagName, value, context);
export const logUserAction = (action: string, tool: string, context?: LogContext) => logger.userAction(action, tool, context);
export const logPerformance = (metric: PerformanceMetric) => logger.performance(metric);
export const logCalculation = (type: 'round' | 'rectangular' | 'validation', duration: number, success: boolean, context?: LogContext) => logger.calculation(type, duration, success, context);
export const logApiCall = (method: string, endpoint: string, status: number, duration: number, context?: LogContext) => logger.apiCall(method, endpoint, status, duration, context);
export const logValidation = (type: 'duct' | 'room' | 'system', warningCount: number, errorCount: number, context?: LogContext) => logger.validation(type, warningCount, errorCount, context);
