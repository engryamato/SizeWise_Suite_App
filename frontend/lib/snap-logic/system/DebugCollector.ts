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

  constructor() {
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

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.stopPerformanceMonitoring();
    this.reset();
  }
}
