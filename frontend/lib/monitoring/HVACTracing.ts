/**
 * HVAC-specific Sentry tracing utilities for SizeWise Suite
 * Provides performance monitoring for duct sizing, validation, and calculations
 */

import * as Sentry from '@sentry/nextjs';

export interface CalculationMetrics {
  inputComplexity: 'simple' | 'moderate' | 'complex';
  calculationType: 'round' | 'rectangular' | 'validation' | 'optimization';
  standardsUsed: string[];
  userTier: 'free' | 'pro' | 'enterprise';
  fallbackUsed?: boolean;
}

export interface ValidationMetrics {
  segmentCount: number;
  roomCount: number;
  warningCount: number;
  errorCount: number;
  standardsChecked: string[];
}

/**
 * Trace HVAC calculation operations with detailed performance metrics
 */
export class HVACTracing {
  /**
   * Trace duct sizing calculations
   */
  static traceDuctCalculation<T>(
    calculationType: 'round' | 'rectangular',
    callback: () => T | Promise<T>,
    metrics?: Partial<CalculationMetrics>
  ): T | Promise<T> {
    return Sentry.startSpan(
      {
        op: 'hvac.calculation',
        name: `Duct Sizing - ${calculationType}`,
      },
      (span) => {
        // Add HVAC-specific attributes
        span.setAttribute('hvac.calculation_type', calculationType);
        span.setAttribute('hvac.category', 'duct_sizing');
        span.setAttribute('application', 'sizewise-suite');
        
        if (metrics) {
          span.setAttribute('hvac.input_complexity', metrics.inputComplexity || 'simple');
          span.setAttribute('hvac.user_tier', metrics.userTier || 'free');
          span.setAttribute('hvac.standards_used', metrics.standardsUsed?.join(',') || '');
          
          if (metrics.fallbackUsed) {
            span.setAttribute('hvac.fallback_used', true);
            span.setAttribute('hvac.calculation_source', 'client');
          } else {
            span.setAttribute('hvac.calculation_source', 'backend');
          }
        }

        const startTime = performance.now();
        
        try {
          const result = callback();
          
          // Handle both sync and async results
          if (result instanceof Promise) {
            return result.then((res) => {
              const duration = performance.now() - startTime;
              span.setAttribute('hvac.calculation_duration_ms', duration);
              span.setStatus({ code: 1 }); // OK
              return res;
            }).catch((error) => {
              const duration = performance.now() - startTime;
              span.setAttribute('hvac.calculation_duration_ms', duration);
              span.setStatus({ code: 2, message: error.message }); // ERROR
              Sentry.captureException(error, {
                tags: {
                  component: 'hvac_calculation',
                  calculation_type: calculationType,
                },
              });
              throw error;
            });
          } else {
            const duration = performance.now() - startTime;
            span.setAttribute('hvac.calculation_duration_ms', duration);
            span.setStatus({ code: 1 }); // OK
            return result;
          }
        } catch (error) {
          const duration = performance.now() - startTime;
          span.setAttribute('hvac.calculation_duration_ms', duration);
          span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
          Sentry.captureException(error, {
            tags: {
              component: 'hvac_calculation',
              calculation_type: calculationType,
            },
          });
          throw error;
        }
      }
    );
  }

  /**
   * Trace validation operations
   */
  static traceValidation<T>(
    validationType: 'duct' | 'room' | 'system',
    callback: () => T | Promise<T>,
    metrics?: Partial<ValidationMetrics>
  ): T | Promise<T> {
    return Sentry.startSpan(
      {
        op: 'hvac.validation',
        name: `HVAC Validation - ${validationType}`,
      },
      (span) => {
        span.setAttribute('hvac.validation_type', validationType);
        span.setAttribute('hvac.category', 'validation');
        span.setAttribute('application', 'sizewise-suite');
        
        if (metrics) {
          span.setAttribute('hvac.segment_count', metrics.segmentCount || 0);
          span.setAttribute('hvac.room_count', metrics.roomCount || 0);
          span.setAttribute('hvac.standards_checked', metrics.standardsChecked?.join(',') || '');
        }

        const startTime = performance.now();
        
        try {
          const result = callback();
          
          if (result instanceof Promise) {
            return result.then((res) => {
              const duration = performance.now() - startTime;
              span.setAttribute('hvac.validation_duration_ms', duration);
              
              // Add result metrics if available
              if (metrics) {
                span.setAttribute('hvac.warnings_generated', metrics.warningCount || 0);
                span.setAttribute('hvac.errors_generated', metrics.errorCount || 0);
              }
              
              span.setStatus({ code: 1 }); // OK
              return res;
            }).catch((error) => {
              const duration = performance.now() - startTime;
              span.setAttribute('hvac.validation_duration_ms', duration);
              span.setStatus({ code: 2, message: error.message }); // ERROR
              throw error;
            });
          } else {
            const duration = performance.now() - startTime;
            span.setAttribute('hvac.validation_duration_ms', duration);
            span.setStatus({ code: 1 }); // OK
            return result;
          }
        } catch (error) {
          const duration = performance.now() - startTime;
          span.setAttribute('hvac.validation_duration_ms', duration);
          span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
          throw error;
        }
      }
    );
  }

  /**
   * Trace API calls to backend calculation service
   */
  static traceAPICall<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    callback: () => T | Promise<T>,
    requestData?: any
  ): T | Promise<T> {
    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `${method} ${endpoint}`,
      },
      (span) => {
        span.setAttribute('http.method', method);
        span.setAttribute('http.url', endpoint);
        span.setAttribute('hvac.category', 'api_call');
        span.setAttribute('application', 'sizewise-suite');
        
        if (requestData) {
          span.setAttribute('http.request_size', JSON.stringify(requestData).length);
        }

        const startTime = performance.now();
        
        try {
          const result = callback();
          
          if (result instanceof Promise) {
            return result.then((res) => {
              const duration = performance.now() - startTime;
              span.setAttribute('http.response_time_ms', duration);
              span.setAttribute('http.status_code', 200);
              span.setStatus({ code: 1 }); // OK
              return res;
            }).catch((error) => {
              const duration = performance.now() - startTime;
              span.setAttribute('http.response_time_ms', duration);
              span.setAttribute('http.status_code', error.status || 500);
              span.setStatus({ code: 2, message: error.message }); // ERROR
              throw error;
            });
          } else {
            const duration = performance.now() - startTime;
            span.setAttribute('http.response_time_ms', duration);
            span.setAttribute('http.status_code', 200);
            span.setStatus({ code: 1 }); // OK
            return result;
          }
        } catch (error) {
          const duration = performance.now() - startTime;
          span.setAttribute('http.response_time_ms', duration);
          span.setAttribute('http.status_code', (error as any).status || 500);
          span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
          throw error;
        }
      }
    );
  }

  /**
   * Trace user interactions with HVAC tools
   */
  static traceUserInteraction(
    action: string,
    tool: 'air-duct-sizer' | 'grease-duct-sizer' | 'estimating' | 'canvas',
    callback: () => void,
    context?: Record<string, any>
  ): void {
    Sentry.startSpan(
      {
        op: 'ui.click',
        name: `${tool} - ${action}`,
      },
      (span) => {
        span.setAttribute('ui.action', action);
        span.setAttribute('ui.tool', tool);
        span.setAttribute('hvac.category', 'user_interaction');
        span.setAttribute('application', 'sizewise-suite');
        
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            span.setAttribute(`ui.${key}`, value);
          });
        }

        try {
          callback();
          span.setStatus({ code: 1 }); // OK
        } catch (error) {
          span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
          throw error;
        }
      }
    );
  }

  /**
   * Log HVAC-specific performance metrics
   */
  static logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      category: 'hvac.performance',
      message: `${metric}: ${value} ${unit}`,
      level: 'info',
      data: {
        metric,
        value,
        unit,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }
}
