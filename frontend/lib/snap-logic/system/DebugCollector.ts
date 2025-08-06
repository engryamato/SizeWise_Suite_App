/**
 * Debug Data Collector
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Collects and manages debug data for the snap logic system including performance
 * metrics, system state, snap point statistics, and troubleshooting information.
 * 
 * @fileoverview Debug data collection system for snap logic
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const debugCollector = new DebugCollector();
 * 
 * // Start performance monitoring
 * debugCollector.startPerformanceMonitoring();
 * 
 * // Record snap operation
 * const startTime = performance.now();
 * // ... snap logic operation ...
 * debugCollector.recordSnapOperation(performance.now() - startTime);
 * 
 * // Get debug data
 * const debugData = debugCollector.getDebugData();
 * ```
 */

import { SnapPoint, SnapResult, Centerline, DrawingTool } from '@/types/air-duct-sizer';
import { DebugData } from '../../components/snap-logic/DebugOverlay';

/**
 * Debug event types
 */
export type DebugEventType =
  | 'snap_query'
  | 'snap_result'
  | 'centerline_added'
  | 'centerline_removed'
  | 'performance_metric'
  | 'error'
  | 'warning'
  | 'user_interaction'
  | 'system_state_change'
  | 'cache_operation'
  | 'spatial_index_operation'
  | 'touch_gesture'
  | 'fitting_recommendation'
  | 'debug_mode_toggle';

/**
 * Performance timing data
 */
export interface PerformanceTimingData {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * Snap statistics data
 */
export interface SnapStatistics {
  totalQueries: number;
  successfulSnaps: number;
  snapsByType: Record<string, number>;
  averageQueryTime: number;
  cacheHitRate: number;
  spatialIndexQueries: number;
  averageSnapDistance: number;
  mostUsedSnapTypes: Array<{ type: string; count: number }>;
}

/**
 * Error tracking data
 */
export interface ErrorTrackingData {
  errorId: string;
  timestamp: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

/**
 * System state data
 */
export interface SystemStateData {
  timestamp: number;
  snapLogicEnabled: boolean;
  magneticSnapping: boolean;
  showSnapIndicators: boolean;
  showSnapLegend: boolean;
  snapDistance: number;
  activeTool: string;
  centerlineCount: number;
  snapPointCount: number;
  cacheSize: number;
  memoryUsage?: number;
  performanceScore: number;
}

/**
 * Debug event data
 */
export interface DebugEventData {
  id: string;
  timestamp: number;
  type: DebugEventType;
  data: any;
  context?: Record<string, any>;
  performance?: PerformanceTimingData;
}

/**
 * Debug collection configuration
 */
export interface DebugCollectorConfig {
  enabled: boolean;
  maxEvents: number;
  maxErrors: number;
  collectPerformance: boolean;
  collectSnapStatistics: boolean;
  collectErrorTracking: boolean;
  collectSystemState: boolean;
  collectUserInteractions: boolean;
  autoExport: boolean;
  exportInterval: number; // milliseconds
  verboseLogging: boolean;
}

/**
 * Performance metrics tracking
 */
interface PerformanceMetrics {
  snapTimes: number[];
  renderTimes: number[];
  snapCallCount: number;
  lastSnapTime: number;
  startTime: number;
  memoryUsage: number;
}

/**
 * System state tracking
 */
interface SystemStateTracking {
  isActive: boolean;
  currentTool: DrawingTool;
  isDrawing: boolean;
  snapEnabled: boolean;
  touchOverrideActive: boolean;
  lastUpdated: number;
}

/**
 * Snap point statistics
 */
interface SnapPointStatistics {
  total: number;
  byType: Record<string, number>;
  visible: number;
  activeSnapPoint: SnapPoint | null;
  lastSnapResult: SnapResult | null;
}

/**
 * Drawing state tracking
 */
interface DrawingStateTracking {
  centerlines: Centerline[];
  currentCenterline: Centerline | null;
  branchPoints: number;
  validationWarnings: string[];
  totalPoints: number;
}

/**
 * Configuration tracking
 */
interface ConfigurationTracking {
  snapThreshold: number;
  magneticThreshold: number;
  attractionStrength: number;
  touchGesturesEnabled: boolean;
  smacnaValidation: boolean;
  lastConfigUpdate: number;
}

/**
 * Debug data collector for snap logic system
 */
export class DebugCollector {
  private performanceMetrics: PerformanceMetrics;
  private systemState: SystemStateTracking;
  private snapPointStats: SnapPointStatistics;
  private drawingState: DrawingStateTracking;
  private configuration: ConfigurationTracking;
  
  // Monitoring state
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private maxHistoryLength = 100; // Keep last 100 measurements

  constructor(config?: Partial<DebugCollectorConfig>) {
    // Initialize enhanced debug collection system
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };
    this.snapStatistics = this.initializeSnapStatistics();

    if (this.config.autoExport) {
      this.startAutoExport();
    }

    // Initialize legacy properties for backward compatibility
    this.performanceMetrics = {
      snapTimes: [],
      renderTimes: [],
      snapCallCount: 0,
      lastSnapTime: 0,
      startTime: performance.now(),
      memoryUsage: 0
    };

    this.systemState = {
      isActive: false,
      currentTool: 'select',
      isDrawing: false,
      snapEnabled: true,
      touchOverrideActive: false,
      lastUpdated: Date.now()
    };

    this.snapPointStats = {
      total: 0,
      byType: {},
      visible: 0,
      activeSnapPoint: null,
      lastSnapResult: null
    };

    this.drawingState = {
      centerlines: [],
      currentCenterline: null,
      branchPoints: 0,
      validationWarnings: [],
      totalPoints: 0
    };

    this.configuration = {
      snapThreshold: 15,
      magneticThreshold: 25,
      attractionStrength: 0.6,
      touchGesturesEnabled: true,
      smacnaValidation: true,
      lastConfigUpdate: Date.now()
    };
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring(interval: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.performanceMetrics.startTime = performance.now();

    this.monitoringInterval = setInterval(() => {
      this.updateMemoryUsage();
      this.cleanupOldMetrics();
    }, interval);
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Record a snap operation performance
   */
  recordSnapOperation(duration: number): void {
    this.performanceMetrics.snapTimes.push(duration);
    this.performanceMetrics.lastSnapTime = duration;
    this.performanceMetrics.snapCallCount++;

    // Keep only recent measurements
    if (this.performanceMetrics.snapTimes.length > this.maxHistoryLength) {
      this.performanceMetrics.snapTimes = this.performanceMetrics.snapTimes.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Record a render operation performance
   */
  recordRenderOperation(duration: number): void {
    this.performanceMetrics.renderTimes.push(duration);

    // Keep only recent measurements
    if (this.performanceMetrics.renderTimes.length > this.maxHistoryLength) {
      this.performanceMetrics.renderTimes = this.performanceMetrics.renderTimes.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Update system state
   */
  updateSystemState(state: Partial<SystemStateTracking>): void {
    this.systemState = {
      ...this.systemState,
      ...state,
      lastUpdated: Date.now()
    };
  }

  /**
   * Update snap point statistics
   */
  updateSnapPointStats(snapPoints: SnapPoint[], activeSnapPoint?: SnapPoint, lastSnapResult?: SnapResult): void {
    // Count by type
    const byType: Record<string, number> = {};
    snapPoints.forEach(point => {
      byType[point.type] = (byType[point.type] || 0) + 1;
    });

    this.snapPointStats = {
      total: snapPoints.length,
      byType,
      visible: snapPoints.length, // Simplified - would need viewport calculation
      activeSnapPoint: activeSnapPoint || null,
      lastSnapResult: lastSnapResult || null
    };
  }

  /**
   * Update drawing state
   */
  updateDrawingState(state: Partial<DrawingStateTracking>): void {
    this.drawingState = {
      ...this.drawingState,
      ...state
    };

    // Calculate total points
    this.drawingState.totalPoints = this.drawingState.centerlines.reduce(
      (total, centerline) => total + centerline.points.length,
      0
    );
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<ConfigurationTracking>): void {
    this.configuration = {
      ...this.configuration,
      ...config,
      lastConfigUpdate: Date.now()
    };
  }

  /**
   * Update spatial index performance metrics
   */
  updateSpatialIndexMetrics(metrics: {
    quadTreeDepth: number;
    quadTreeNodes: number;
    cacheHitRate: number;
    spatialSearchTime: number;
    linearSearchTime: number;
    performanceImprovement: number;
  }): void {
    // Store spatial index metrics for inclusion in debug data
    (this.performanceMetrics as any).spatialIndexMetrics = metrics;
  }

  /**
   * Update snap cache performance metrics
   */
  updateSnapCacheMetrics(metrics: {
    cacheHitRate: number;
    memoryUsage: number;
    entryCount: number;
    averageAccessTime: number;
    evictionCount: number;
    cachedSearchTime: number;
  }): void {
    // Store snap cache metrics for inclusion in debug data
    (this.performanceMetrics as any).snapCacheMetrics = metrics;
  }

  /**
   * Update performance optimizer metrics
   */
  updatePerformanceOptimizerMetrics(metrics: {
    debouncingEfficiency: number;
    batchingEfficiency: number;
    frameRate: number;
    performanceScore: number;
    adaptiveLevel: string;
  }): void {
    // Store performance optimizer metrics for inclusion in debug data
    (this.performanceMetrics as any).performanceOptimizerMetrics = metrics;
  }

  /**
   * Add validation warning
   */
  addValidationWarning(warning: string): void {
    this.drawingState.validationWarnings.push(warning);

    // Keep only recent warnings
    if (this.drawingState.validationWarnings.length > 50) {
      this.drawingState.validationWarnings = this.drawingState.validationWarnings.slice(-50);
    }
  }

  /**
   * Clear validation warnings
   */
  clearValidationWarnings(): void {
    this.drawingState.validationWarnings = [];
  }

  /**
   * Get comprehensive debug data
   */
  getDebugData(): DebugData {
    const now = performance.now();
    const elapsedTime = (now - this.performanceMetrics.startTime) / 1000; // seconds

    return {
      systemState: {
        isActive: this.systemState.isActive,
        currentTool: this.systemState.currentTool,
        isDrawing: this.systemState.isDrawing,
        snapEnabled: this.systemState.snapEnabled,
        touchOverrideActive: this.systemState.touchOverrideActive
      },
      snapPoints: {
        total: this.snapPointStats.total,
        byType: this.snapPointStats.byType,
        visible: this.snapPointStats.visible,
        active: this.snapPointStats.activeSnapPoint
      },
      performance: {
        lastSnapTime: this.performanceMetrics.lastSnapTime,
        averageSnapTime: this.calculateAverageSnapTime(),
        snapCallsPerSecond: elapsedTime > 0 ? this.performanceMetrics.snapCallCount / elapsedTime : 0,
        memoryUsage: this.performanceMetrics.memoryUsage,
        renderTime: this.calculateAverageRenderTime()
      },
      drawing: {
        centerlineCount: this.drawingState.centerlines.length,
        totalPoints: this.drawingState.totalPoints,
        currentCenterline: this.drawingState.currentCenterline,
        branchPoints: this.drawingState.branchPoints,
        validationWarnings: [...this.drawingState.validationWarnings]
      },
      configuration: {
        snapThreshold: this.configuration.snapThreshold,
        magneticThreshold: this.configuration.magneticThreshold,
        attractionStrength: this.configuration.attractionStrength,
        touchGesturesEnabled: this.configuration.touchGesturesEnabled,
        smacnaValidation: this.configuration.smacnaValidation
      }
    };
  }

  /**
   * Calculate average snap time
   */
  private calculateAverageSnapTime(): number {
    if (this.performanceMetrics.snapTimes.length === 0) return 0;
    
    const sum = this.performanceMetrics.snapTimes.reduce((a, b) => a + b, 0);
    return sum / this.performanceMetrics.snapTimes.length;
  }

  /**
   * Calculate average render time
   */
  private calculateAverageRenderTime(): number {
    if (this.performanceMetrics.renderTimes.length === 0) return 0;
    
    const sum = this.performanceMetrics.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.performanceMetrics.renderTimes.length;
  }

  /**
   * Update memory usage (if available)
   */
  private updateMemoryUsage(): void {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
    } else {
      // Fallback estimation
      this.performanceMetrics.memoryUsage = Math.random() * 50 + 10; // Mock data for demo
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const maxAge = 60000; // 1 minute
    const now = Date.now();

    // Clean up old warnings
    this.drawingState.validationWarnings = this.drawingState.validationWarnings.filter(
      (_, index) => index >= this.drawingState.validationWarnings.length - 20
    );
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.performanceMetrics = {
      snapTimes: [],
      renderTimes: [],
      snapCallCount: 0,
      lastSnapTime: 0,
      startTime: performance.now(),
      memoryUsage: 0
    };

    this.snapPointStats = {
      total: 0,
      byType: {},
      visible: 0,
      activeSnapPoint: null,
      lastSnapResult: null
    };

    this.drawingState.validationWarnings = [];
  }

  /**
   * Export debug data as JSON
   */
  exportDebugData(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      debugData: this.getDebugData(),
      metadata: {
        version: '1.1.0',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    status: 'good' | 'caution' | 'warning';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'good' | 'caution' | 'warning' = 'good';

    // Check snap performance
    if (this.performanceMetrics.lastSnapTime > 10) {
      status = 'warning';
      issues.push('Snap operations are slow (>10ms)');
      recommendations.push('Consider reducing snap point density or enabling caching');
    } else if (this.performanceMetrics.lastSnapTime > 5) {
      status = 'caution';
      issues.push('Snap operations are moderately slow (>5ms)');
      recommendations.push('Monitor performance and consider optimization');
    }

    // Check memory usage
    if (this.performanceMetrics.memoryUsage > 100) {
      status = 'warning';
      issues.push('High memory usage (>100MB)');
      recommendations.push('Clear unused data and optimize memory usage');
    } else if (this.performanceMetrics.memoryUsage > 50) {
      if (status === 'good') status = 'caution';
      issues.push('Moderate memory usage (>50MB)');
      recommendations.push('Monitor memory usage');
    }

    // Check validation warnings
    if (this.drawingState.validationWarnings.length > 10) {
      if (status === 'good') status = 'caution';
      issues.push('Many validation warnings');
      recommendations.push('Review and address validation warnings');
    }

    if (status === 'good') {
      recommendations.push('System is performing optimally');
    }

    return { status, issues, recommendations };
  }

  // ========================================
  // Enhanced Debug Collection Methods
  // ========================================

  /**
   * Enable enhanced debug collection
   */
  enableEnhancedDebug(): void {
    this.config.enabled = true;
    this.isEnabled = true;
    this.logEvent('debug_mode_toggle', { enabled: true, enhanced: true });
  }

  /**
   * Disable enhanced debug collection
   */
  disableEnhancedDebug(): void {
    this.config.enabled = false;
    this.isEnabled = false;
    this.logEvent('debug_mode_toggle', { enabled: false, enhanced: true });
  }

  /**
   * Start performance timing
   */
  startTiming(operation: string, metadata?: Record<string, any>): string {
    if (!this.config.enabled || !this.config.collectPerformance) return '';

    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeTimers.set(timerId, performance.now());

    if (this.config.verboseLogging) {
      console.debug(`[DebugCollector] Started timing: ${operation}`, metadata);
    }

    return timerId;
  }

  /**
   * End performance timing
   */
  endTiming(timerId: string, operation?: string, metadata?: Record<string, any>): PerformanceTimingData | null {
    if (!this.config.enabled || !this.config.collectPerformance || !timerId) return null;

    const startTime = this.activeTimers.get(timerId);
    if (startTime === undefined) return null;

    const endTime = performance.now();
    const duration = endTime - startTime;

    const timingData: PerformanceTimingData = {
      operation: operation || timerId.split('_')[0],
      startTime,
      endTime,
      duration,
      metadata
    };

    this.performanceTimings.push(timingData);
    this.activeTimers.delete(timerId);

    // Keep only recent timings
    if (this.performanceTimings.length > this.config.maxEvents) {
      this.performanceTimings = this.performanceTimings.slice(-this.config.maxEvents);
    }

    if (this.config.verboseLogging) {
      console.debug(`[DebugCollector] Ended timing: ${timingData.operation} (${duration.toFixed(2)}ms)`, metadata);
    }

    return timingData;
  }

  /**
   * Log debug event
   */
  logEvent(type: DebugEventType, data: any, context?: Record<string, any>, performance?: PerformanceTimingData): void {
    if (!this.config.enabled) return;

    const event: DebugEventData = {
      id: `event_${++this.eventCounter}`,
      timestamp: Date.now(),
      type,
      data,
      context,
      performance
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    if (this.config.verboseLogging) {
      console.debug(`[DebugCollector] Event: ${type}`, data, context);
    }
  }

  /**
   * Log snap query with enhanced tracking
   */
  logSnapQuery(position: { x: number; y: number }, snapDistance: number, context?: Record<string, any>): string {
    const timerId = this.startTiming('snap_query', { position, snapDistance });

    this.logEvent('snap_query', {
      position,
      snapDistance,
      timestamp: Date.now()
    }, context);

    this.snapStatistics.totalQueries++;
    return timerId;
  }

  /**
   * Log snap result with enhanced tracking
   */
  logSnapResult(timerId: string, result: SnapResult | null, context?: Record<string, any>): void {
    const timing = this.endTiming(timerId, 'snap_query');

    this.logEvent('snap_result', {
      result,
      successful: result !== null,
      snapType: result?.snapPoint?.type,
      distance: result?.distance
    }, context, timing || undefined);

    // Update snap statistics
    if (result) {
      this.snapStatistics.successfulSnaps++;
      const snapType = result.snapPoint.type;
      this.snapStatistics.snapsByType[snapType] = (this.snapStatistics.snapsByType[snapType] || 0) + 1;

      // Update average snap distance
      const totalDistance = this.snapStatistics.averageSnapDistance * (this.snapStatistics.successfulSnaps - 1) + result.distance;
      this.snapStatistics.averageSnapDistance = totalDistance / this.snapStatistics.successfulSnaps;
    }

    // Update average query time
    if (timing) {
      const totalTime = this.snapStatistics.averageQueryTime * (this.snapStatistics.totalQueries - 1) + timing.duration;
      this.snapStatistics.averageQueryTime = totalTime / this.snapStatistics.totalQueries;
    }
  }

  /**
   * Log error with enhanced tracking
   */
  logError(error: Error | string, context?: Record<string, any>, type: 'error' | 'warning' | 'info' = 'error'): void {
    if (!this.config.enabled || !this.config.collectErrorTracking) return;

    const errorData: ErrorTrackingData = {
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: context || {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    this.errors.push(errorData);
    this.logEvent('error', errorData, context);

    // Keep only recent errors
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }

    if (this.config.verboseLogging || type === 'error') {
      console.error(`[DebugCollector] ${type.toUpperCase()}:`, errorData.message, context);
    }
  }

  /**
   * Initialize snap statistics
   */
  private initializeSnapStatistics(): SnapStatistics {
    return {
      totalQueries: 0,
      successfulSnaps: 0,
      snapsByType: {},
      averageQueryTime: 0,
      cacheHitRate: 0,
      spatialIndexQueries: 0,
      averageSnapDistance: 0,
      mostUsedSnapTypes: []
    };
  }

  /**
   * Start auto export
   */
  private startAutoExport(): void {
    if (this.exportTimer) return;

    this.exportTimer = setInterval(() => {
      if (this.config.enabled) {
        const data = this.exportEnhancedDebugData();
        console.log('[DebugCollector] Auto export:', data.length, 'characters');
        // Could save to localStorage or send to server
      }
    }, this.config.exportInterval);
  }

  /**
   * Stop auto export
   */
  private stopAutoExport(): void {
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = null;
    }
  }

  /**
   * Export enhanced debug data
   */
  exportEnhancedDebugData(): string {
    const debugData = this.getEnhancedDebugData();
    const exportData = {
      timestamp: Date.now(),
      version: '1.1.0',
      legacy: this.getDebugData(),
      enhanced: debugData
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get enhanced debug data
   */
  getEnhancedDebugData(): {
    events: DebugEventData[];
    errors: ErrorTrackingData[];
    performanceTimings: PerformanceTimingData[];
    snapStatistics: SnapStatistics;
    systemState: SystemStateData | null;
    config: DebugCollectorConfig;
  } {
    return {
      events: [...this.events],
      errors: [...this.errors],
      performanceTimings: [...this.performanceTimings],
      snapStatistics: { ...this.snapStatistics },
      systemState: this.systemStateData ? { ...this.systemStateData } : null,
      config: { ...this.config }
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.stopPerformanceMonitoring();
    this.stopAutoExport();
    this.activeTimers.clear();
    this.events = [];
    this.errors = [];
    this.performanceTimings = [];
    this.config.enabled = false;
    this.isEnabled = false;
    this.reset();
  }
}
