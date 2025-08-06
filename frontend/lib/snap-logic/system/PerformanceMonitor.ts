/**
 * Performance Monitor System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive performance monitoring system with real-time metrics collection,
 * historical analysis, trend tracking, and automated optimization recommendations.
 * Provides enterprise-level performance insights for HVAC engineering applications.
 * 
 * @fileoverview Performance monitoring and optimization recommendations
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const monitor = new PerformanceMonitor({
 *   enableRealTimeMonitoring: true,
 *   enableHistoricalTracking: true,
 *   alertThresholds: {
 *     frameRate: 45,
 *     memoryUsage: 100,
 *     responseTime: 50
 *   }
 * });
 * 
 * // Start monitoring
 * monitor.startMonitoring();
 * 
 * // Get real-time metrics
 * const metrics = monitor.getCurrentMetrics();
 * 
 * // Get optimization recommendations
 * const recommendations = monitor.getOptimizationRecommendations();
 * ```
 */

import { PerformanceOptimizerMetrics } from './PerformanceOptimizer';
import { CacheStatistics } from './SnapCache';
import { SpatialIndexMetrics } from './SpatialIndex';

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitorConfig {
  // Monitoring settings
  enableRealTimeMonitoring: boolean;    // Enable real-time monitoring
  enableHistoricalTracking: boolean;    // Enable historical data collection
  enableAlerts: boolean;                // Enable performance alerts
  enableRegression: boolean;            // Enable regression detection
  
  // Collection intervals
  metricsInterval: number;              // Metrics collection interval (ms)
  historyRetention: number;             // History retention period (ms)
  alertCheckInterval: number;           // Alert check interval (ms)
  
  // Alert thresholds
  alertThresholds: {
    frameRate: number;                  // Minimum acceptable frame rate
    memoryUsage: number;                // Maximum memory usage (MB)
    responseTime: number;               // Maximum response time (ms)
    cacheHitRate: number;              // Minimum cache hit rate
    performanceScore: number;           // Minimum performance score
  };
  
  // Regression detection
  regressionThresholds: {
    frameRateDropPercent: number;       // Frame rate drop threshold (%)
    memoryIncreasePercent: number;      // Memory increase threshold (%)
    responseTimeIncreasePercent: number; // Response time increase threshold (%)
  };
  
  // Data retention
  maxHistoryEntries: number;            // Maximum history entries
  compressionEnabled: boolean;          // Enable data compression
}

/**
 * Comprehensive performance metrics
 */
export interface ComprehensivePerformanceMetrics {
  timestamp: number;
  
  // System performance
  system: {
    frameRate: number;
    averageFrameTime: number;
    droppedFrames: number;
    memoryUsage: number;
    cpuUsage: number;
    performanceScore: number;
  };
  
  // Snap logic performance
  snapLogic: {
    snapQueryTime: number;
    snapQueryCount: number;
    snapHitRate: number;
    snapPointCount: number;
    activeSnapPoints: number;
  };
  
  // Spatial indexing performance
  spatialIndex: {
    queryTime: number;
    indexDepth: number;
    indexNodes: number;
    spatialHitRate: number;
    memoryUsage: number;
  };
  
  // Cache performance
  cache: {
    hitRate: number;
    memoryUsage: number;
    entryCount: number;
    evictionRate: number;
    averageAccessTime: number;
  };
  
  // Debouncing performance
  debouncing: {
    efficiency: number;
    batchingRate: number;
    averageBatchSize: number;
    processingTime: number;
  };
  
  // User interaction metrics
  interaction: {
    mouseMoveFrequency: number;
    drawingOperations: number;
    snapOperations: number;
    userResponseTime: number;
  };
}

/**
 * Performance alert definition
 */
export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: 'performance' | 'memory' | 'responsiveness' | 'regression';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  timestamp: number;
  acknowledged: boolean;
  recommendations: string[];
}

/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
  metric: string;
  timeframe: 'hour' | 'day' | 'week';
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  confidence: number;
  dataPoints: number;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'configuration' | 'architecture' | 'usage';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: number;
  confidence: number;
  configChanges?: Record<string, any>;
  codeChanges?: string[];
}

/**
 * Performance regression detection
 */
export interface PerformanceRegression {
  id: string;
  metric: string;
  detectedAt: number;
  severity: 'minor' | 'moderate' | 'severe';
  baselineValue: number;
  currentValue: number;
  changePercent: number;
  possibleCauses: string[];
  recommendations: string[];
}

/**
 * Default performance monitor configuration
 */
const DEFAULT_MONITOR_CONFIG: PerformanceMonitorConfig = {
  enableRealTimeMonitoring: true,
  enableHistoricalTracking: true,
  enableAlerts: true,
  enableRegression: true,
  
  metricsInterval: 1000,              // 1 second
  historyRetention: 24 * 60 * 60 * 1000, // 24 hours
  alertCheckInterval: 5000,           // 5 seconds
  
  alertThresholds: {
    frameRate: 45,                    // 45fps minimum
    memoryUsage: 100,                 // 100MB maximum
    responseTime: 50,                 // 50ms maximum
    cacheHitRate: 0.6,               // 60% minimum
    performanceScore: 70              // 70/100 minimum
  },
  
  regressionThresholds: {
    frameRateDropPercent: 15,         // 15% frame rate drop
    memoryIncreasePercent: 25,        // 25% memory increase
    responseTimeIncreasePercent: 30   // 30% response time increase
  },
  
  maxHistoryEntries: 1000,
  compressionEnabled: true
};

/**
 * Performance monitor system
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private isMonitoring = false;
  
  // Monitoring state
  private metricsTimer: NodeJS.Timeout | null = null;
  private alertTimer: NodeJS.Timeout | null = null;
  private currentMetrics: ComprehensivePerformanceMetrics | null = null;
  
  // Historical data
  private metricsHistory: ComprehensivePerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private regressions: PerformanceRegression[] = [];
  
  // Performance baselines
  private baselines: Map<string, number> = new Map();
  private trends: Map<string, PerformanceTrend> = new Map();
  
  // Data sources (injected)
  private spatialIndexMetrics?: () => SpatialIndexMetrics;
  private cacheMetrics?: () => CacheStatistics;
  private optimizerMetrics?: () => PerformanceOptimizerMetrics;
  private snapLogicMetrics?: () => any;

  constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = { ...DEFAULT_MONITOR_CONFIG, ...config };
    this.initializeBaselines();
  }

  /**
   * Set data source providers
   */
  setDataSources(sources: {
    spatialIndex?: () => SpatialIndexMetrics;
    cache?: () => CacheStatistics;
    optimizer?: () => PerformanceOptimizerMetrics;
    snapLogic?: () => any;
  }): void {
    this.spatialIndexMetrics = sources.spatialIndex;
    this.cacheMetrics = sources.cache;
    this.optimizerMetrics = sources.optimizer;
    this.snapLogicMetrics = sources.snapLogic;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Start metrics collection
    if (this.config.enableRealTimeMonitoring) {
      this.metricsTimer = setInterval(() => {
        this.collectMetrics();
      }, this.config.metricsInterval);
    }

    // Start alert checking
    if (this.config.enableAlerts) {
      this.alertTimer = setInterval(() => {
        this.checkAlerts();
      }, this.config.alertCheckInterval);
    }

    console.log('PerformanceMonitor: Monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    if (this.alertTimer) {
      clearInterval(this.alertTimer);
      this.alertTimer = null;
    }

    console.log('PerformanceMonitor: Monitoring stopped');
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): ComprehensivePerformanceMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(timeframe?: number): ComprehensivePerformanceMetrics[] {
    if (!timeframe) return [...this.metricsHistory];

    const cutoff = Date.now() - timeframe;
    return this.metricsHistory.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(): PerformanceTrend[] {
    return Array.from(this.trends.values());
  }

  /**
   * Get detected regressions
   */
  getPerformanceRegressions(): PerformanceRegression[] {
    return [...this.regressions];
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (!this.currentMetrics) return recommendations;

    // Analyze current performance and generate recommendations
    recommendations.push(...this.analyzeFrameRatePerformance());
    recommendations.push(...this.analyzeMemoryUsage());
    recommendations.push(...this.analyzeCachePerformance());
    recommendations.push(...this.analyzeSpatialIndexPerformance());
    recommendations.push(...this.analyzeDeboucingPerformance());

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    let report = 'SizeWise Suite - Performance Monitoring Report\n';
    report += '='.repeat(50) + '\n\n';

    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Monitoring Status: ${this.isMonitoring ? 'Active' : 'Inactive'}\n\n`;

    if (this.currentMetrics) {
      report += 'CURRENT PERFORMANCE\n';
      report += '-------------------\n';
      report += `Frame Rate: ${this.currentMetrics.system.frameRate.toFixed(1)}fps\n`;
      report += `Performance Score: ${this.currentMetrics.system.performanceScore}/100\n`;
      report += `Memory Usage: ${this.currentMetrics.system.memoryUsage.toFixed(1)}MB\n`;
      report += `Cache Hit Rate: ${(this.currentMetrics.cache.hitRate * 100).toFixed(1)}%\n\n`;
    }

    const activeAlerts = this.getActiveAlerts();
    if (activeAlerts.length > 0) {
      report += 'ACTIVE ALERTS\n';
      report += '-------------\n';
      for (const alert of activeAlerts) {
        report += `${alert.type.toUpperCase()}: ${alert.title}\n`;
        report += `  ${alert.description}\n`;
        report += `  Current: ${alert.currentValue}, Threshold: ${alert.thresholdValue}\n\n`;
      }
    }

    const recommendations = this.getOptimizationRecommendations();
    if (recommendations.length > 0) {
      report += 'OPTIMIZATION RECOMMENDATIONS\n';
      report += '----------------------------\n';
      const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
      for (const rec of highPriorityRecs.slice(0, 5)) {
        report += `${rec.priority.toUpperCase()}: ${rec.title}\n`;
        report += `  ${rec.description}\n`;
        report += `  Estimated Improvement: ${rec.estimatedImprovement}%\n\n`;
      }
    }

    return report;
  }

  /**
   * Export performance data
   */
  exportPerformanceData(): {
    metrics: ComprehensivePerformanceMetrics[];
    alerts: PerformanceAlert[];
    trends: PerformanceTrend[];
    regressions: PerformanceRegression[];
    config: PerformanceMonitorConfig;
  } {
    return {
      metrics: this.getPerformanceHistory(),
      alerts: this.getAllAlerts(),
      trends: this.getPerformanceTrends(),
      regressions: this.getPerformanceRegressions(),
      config: this.config
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<PerformanceMonitorConfig>): void {
    const wasMonitoring = this.isMonitoring;
    
    if (wasMonitoring) {
      this.stopMonitoring();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasMonitoring) {
      this.startMonitoring();
    }
  }

  /**
   * Clear performance history
   */
  clearHistory(): void {
    this.metricsHistory = [];
    this.alerts = [];
    this.regressions = [];
    this.trends.clear();
    this.baselines.clear();
    this.initializeBaselines();
  }

  /**
   * Collect comprehensive performance metrics
   */
  private collectMetrics(): void {
    const timestamp = Date.now();

    // Collect system metrics
    const systemMetrics = this.collectSystemMetrics();
    
    // Collect component metrics
    const spatialMetrics = this.spatialIndexMetrics?.() || this.getDefaultSpatialMetrics();
    const cacheMetrics = this.cacheMetrics?.() || this.getDefaultCacheMetrics();
    const optimizerMetrics = this.optimizerMetrics?.() || this.getDefaultOptimizerMetrics();
    const snapMetrics = this.snapLogicMetrics?.() || this.getDefaultSnapMetrics();

    // Compile comprehensive metrics
    const metrics: ComprehensivePerformanceMetrics = {
      timestamp,
      system: systemMetrics,
      snapLogic: {
        snapQueryTime: snapMetrics.averageQueryTime || 0,
        snapQueryCount: snapMetrics.queryCount || 0,
        snapHitRate: snapMetrics.hitRate || 0,
        snapPointCount: snapMetrics.totalSnapPoints || 0,
        activeSnapPoints: snapMetrics.activeSnapPoints || 0
      },
      spatialIndex: {
        queryTime: spatialMetrics.averageQueryTime,
        indexDepth: spatialMetrics.quadTreeDepth,
        indexNodes: spatialMetrics.quadTreeNodes,
        spatialHitRate: spatialMetrics.cacheHitRate,
        memoryUsage: spatialMetrics.memoryUsage
      },
      cache: {
        hitRate: cacheMetrics.hitRate,
        memoryUsage: cacheMetrics.memoryUsage,
        entryCount: cacheMetrics.entryCount,
        evictionRate: cacheMetrics.evictionCount,
        averageAccessTime: cacheMetrics.averageAccessTime
      },
      debouncing: {
        efficiency: optimizerMetrics.debouncing?.mouseMoveEvents > 0 
          ? optimizerMetrics.debouncing.debouncedMouseMoves / optimizerMetrics.debouncing.mouseMoveEvents 
          : 0,
        batchingRate: optimizerMetrics.batching?.batchEfficiency || 0,
        averageBatchSize: optimizerMetrics.batching?.averageBatchSize || 0,
        processingTime: optimizerMetrics.batching?.averageBatchProcessTime || 0
      },
      interaction: {
        mouseMoveFrequency: optimizerMetrics.debouncing?.mouseMoveEvents || 0,
        drawingOperations: optimizerMetrics.debouncing?.drawingEvents || 0,
        snapOperations: optimizerMetrics.debouncing?.snapQueryEvents || 0,
        userResponseTime: systemMetrics.averageFrameTime
      }
    };

    this.currentMetrics = metrics;

    // Store in history if enabled
    if (this.config.enableHistoricalTracking) {
      this.addToHistory(metrics);
    }

    // Update trends and baselines
    this.updateTrends(metrics);
    this.updateBaselines(metrics);

    // Check for regressions
    if (this.config.enableRegression) {
      this.checkForRegressions(metrics);
    }
  }

  /**
   * Collect system performance metrics
   */
  private collectSystemMetrics() {
    // Use Performance API if available
    let frameRate = 60;
    let averageFrameTime = 16.67;
    let memoryUsage = 0;

    if (typeof performance !== 'undefined') {
      // Estimate frame rate from performance timing
      const now = performance.now();
      if (this.currentMetrics) {
        const timeDiff = now - this.currentMetrics.timestamp;
        frameRate = timeDiff > 0 ? 1000 / timeDiff : 60;
        averageFrameTime = timeDiff;
      }

      // Get memory usage if available
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
      }
    }

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(frameRate, memoryUsage);

    return {
      frameRate,
      averageFrameTime,
      droppedFrames: frameRate < 55 ? 1 : 0,
      memoryUsage,
      cpuUsage: 0, // Not available in browser
      performanceScore
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(frameRate: number, memoryUsage: number): number {
    const frameRateScore = Math.min(100, (frameRate / 60) * 100);
    const memoryScore = Math.max(0, 100 - (memoryUsage / 100) * 100);
    
    return Math.round((frameRateScore * 0.6) + (memoryScore * 0.4));
  }

  /**
   * Add metrics to history with retention management
   */
  private addToHistory(metrics: ComprehensivePerformanceMetrics): void {
    this.metricsHistory.push(metrics);

    // Remove old entries
    const cutoff = Date.now() - this.config.historyRetention;
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp >= cutoff);

    // Limit total entries
    if (this.metricsHistory.length > this.config.maxHistoryEntries) {
      this.metricsHistory = this.metricsHistory.slice(-this.config.maxHistoryEntries);
    }
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(): void {
    if (!this.currentMetrics) return;

    const metrics = this.currentMetrics;
    const thresholds = this.config.alertThresholds;

    // Frame rate alert
    if (metrics.system.frameRate < thresholds.frameRate) {
      this.createAlert('frame-rate', 'critical', 'performance', 
        'Low Frame Rate Detected',
        `Frame rate has dropped to ${metrics.system.frameRate.toFixed(1)}fps`,
        'frameRate', metrics.system.frameRate, thresholds.frameRate,
        ['Reduce debounce delays', 'Enable aggressive batching', 'Clear cache']
      );
    }

    // Memory usage alert
    if (metrics.system.memoryUsage > thresholds.memoryUsage) {
      this.createAlert('memory-usage', 'warning', 'memory',
        'High Memory Usage',
        `Memory usage has reached ${metrics.system.memoryUsage.toFixed(1)}MB`,
        'memoryUsage', metrics.system.memoryUsage, thresholds.memoryUsage,
        ['Clear cache', 'Reduce cache size', 'Enable compression']
      );
    }

    // Cache hit rate alert
    if (metrics.cache.hitRate < thresholds.cacheHitRate) {
      this.createAlert('cache-hit-rate', 'warning', 'performance',
        'Low Cache Hit Rate',
        `Cache hit rate has dropped to ${(metrics.cache.hitRate * 100).toFixed(1)}%`,
        'cacheHitRate', metrics.cache.hitRate, thresholds.cacheHitRate,
        ['Increase cache TTL', 'Optimize cache keys', 'Review invalidation strategy']
      );
    }

    // Performance score alert
    if (metrics.system.performanceScore < thresholds.performanceScore) {
      this.createAlert('performance-score', 'warning', 'performance',
        'Low Performance Score',
        `Overall performance score is ${metrics.system.performanceScore}/100`,
        'performanceScore', metrics.system.performanceScore, thresholds.performanceScore,
        ['Enable adaptive optimization', 'Review configuration', 'Check system resources']
      );
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    id: string, 
    type: PerformanceAlert['type'], 
    category: PerformanceAlert['category'],
    title: string, 
    description: string, 
    metric: string, 
    currentValue: number, 
    thresholdValue: number,
    recommendations: string[]
  ): void {
    // Check if alert already exists and is recent
    const existingAlert = this.alerts.find(a => 
      a.id === id && 
      !a.acknowledged && 
      Date.now() - a.timestamp < 60000 // 1 minute
    );

    if (existingAlert) return; // Don't spam alerts

    const alert: PerformanceAlert = {
      id,
      type,
      category,
      title,
      description,
      metric,
      currentValue,
      thresholdValue,
      timestamp: Date.now(),
      acknowledged: false,
      recommendations
    };

    this.alerts.push(alert);

    // Limit alert history
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Initialize performance baselines
   */
  private initializeBaselines(): void {
    // Set default baselines
    this.baselines.set('frameRate', 60);
    this.baselines.set('memoryUsage', 25);
    this.baselines.set('cacheHitRate', 0.7);
    this.baselines.set('performanceScore', 85);
  }

  /**
   * Update performance trends
   */
  private updateTrends(metrics: ComprehensivePerformanceMetrics): void {
    // This would implement trend analysis logic
    // For now, simplified implementation
  }

  /**
   * Update performance baselines
   */
  private updateBaselines(metrics: ComprehensivePerformanceMetrics): void {
    // Update baselines with exponential moving average
    const alpha = 0.1; // Smoothing factor

    const currentFrameRate = this.baselines.get('frameRate') || 60;
    this.baselines.set('frameRate', alpha * metrics.system.frameRate + (1 - alpha) * currentFrameRate);

    const currentMemory = this.baselines.get('memoryUsage') || 25;
    this.baselines.set('memoryUsage', alpha * metrics.system.memoryUsage + (1 - alpha) * currentMemory);
  }

  /**
   * Check for performance regressions
   */
  private checkForRegressions(metrics: ComprehensivePerformanceMetrics): void {
    const thresholds = this.config.regressionThresholds;

    // Frame rate regression
    const baselineFrameRate = this.baselines.get('frameRate') || 60;
    const frameRateChange = (baselineFrameRate - metrics.system.frameRate) / baselineFrameRate;
    
    if (frameRateChange > thresholds.frameRateDropPercent / 100) {
      this.createRegression('frame-rate', 'frameRate', baselineFrameRate, 
        metrics.system.frameRate, frameRateChange * 100);
    }

    // Memory usage regression
    const baselineMemory = this.baselines.get('memoryUsage') || 25;
    const memoryChange = (metrics.system.memoryUsage - baselineMemory) / baselineMemory;
    
    if (memoryChange > thresholds.memoryIncreasePercent / 100) {
      this.createRegression('memory-usage', 'memoryUsage', baselineMemory,
        metrics.system.memoryUsage, memoryChange * 100);
    }
  }

  /**
   * Create performance regression
   */
  private createRegression(
    id: string, 
    metric: string, 
    baselineValue: number, 
    currentValue: number, 
    changePercent: number
  ): void {
    const regression: PerformanceRegression = {
      id,
      metric,
      detectedAt: Date.now(),
      severity: changePercent > 30 ? 'severe' : changePercent > 15 ? 'moderate' : 'minor',
      baselineValue,
      currentValue,
      changePercent,
      possibleCauses: this.identifyPossibleCauses(metric, changePercent),
      recommendations: this.getRegressionsRecommendations(metric)
    };

    this.regressions.push(regression);

    // Limit regression history
    if (this.regressions.length > 50) {
      this.regressions = this.regressions.slice(-50);
    }
  }

  /**
   * Identify possible causes for regression
   */
  private identifyPossibleCauses(metric: string, changePercent: number): string[] {
    const causes: string[] = [];

    switch (metric) {
      case 'frameRate':
        causes.push('Increased snap point density');
        causes.push('Complex centerline geometry');
        causes.push('Cache invalidation issues');
        break;
      case 'memoryUsage':
        causes.push('Cache size growth');
        causes.push('Memory leaks');
        causes.push('Large spatial index');
        break;
    }

    return causes;
  }

  /**
   * Get regression-specific recommendations
   */
  private getRegressionsRecommendations(metric: string): string[] {
    const recommendations: string[] = [];

    switch (metric) {
      case 'frameRate':
        recommendations.push('Enable adaptive optimization');
        recommendations.push('Increase debounce delays');
        recommendations.push('Reduce snap point density');
        break;
      case 'memoryUsage':
        recommendations.push('Clear cache');
        recommendations.push('Reduce cache size');
        recommendations.push('Enable compression');
        break;
    }

    return recommendations;
  }

  // Analysis methods for optimization recommendations
  private analyzeFrameRatePerformance(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (!this.currentMetrics) return recommendations;

    if (this.currentMetrics.system.frameRate < 50) {
      recommendations.push({
        id: 'frame-rate-optimization',
        priority: 'high',
        category: 'configuration',
        title: 'Optimize Frame Rate Performance',
        description: 'Frame rate is below optimal threshold',
        impact: 'Improved user experience and responsiveness',
        implementation: 'Increase debounce delays and enable adaptive optimization',
        estimatedImprovement: 25,
        confidence: 0.8,
        configChanges: {
          debounceDelay: 32,
          enableAdaptive: true
        }
      });
    }

    return recommendations;
  }

  private analyzeMemoryUsage(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (!this.currentMetrics) return recommendations;

    if (this.currentMetrics.system.memoryUsage > 75) {
      recommendations.push({
        id: 'memory-optimization',
        priority: 'medium',
        category: 'configuration',
        title: 'Optimize Memory Usage',
        description: 'Memory usage is above recommended threshold',
        impact: 'Reduced memory footprint and improved stability',
        implementation: 'Reduce cache size and enable compression',
        estimatedImprovement: 20,
        confidence: 0.7,
        configChanges: {
          maxCacheSize: 500,
          enableCompression: true
        }
      });
    }

    return recommendations;
  }

  private analyzeCachePerformance(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (!this.currentMetrics) return recommendations;

    if (this.currentMetrics.cache.hitRate < 0.6) {
      recommendations.push({
        id: 'cache-optimization',
        priority: 'medium',
        category: 'configuration',
        title: 'Improve Cache Performance',
        description: 'Cache hit rate is below optimal threshold',
        impact: 'Faster snap queries and improved responsiveness',
        implementation: 'Increase cache TTL and optimize cache keys',
        estimatedImprovement: 15,
        confidence: 0.6,
        configChanges: {
          cacheTTL: 12000,
          cacheSize: 1500
        }
      });
    }

    return recommendations;
  }

  private analyzeSpatialIndexPerformance(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (!this.currentMetrics) return recommendations;

    if (this.currentMetrics.spatialIndex.queryTime > 5) {
      recommendations.push({
        id: 'spatial-index-optimization',
        priority: 'low',
        category: 'configuration',
        title: 'Optimize Spatial Index',
        description: 'Spatial index queries are slower than optimal',
        impact: 'Faster snap point queries',
        implementation: 'Adjust QuadTree parameters',
        estimatedImprovement: 10,
        confidence: 0.5,
        configChanges: {
          quadTreeMaxPoints: 8,
          quadTreeMaxDepth: 10
        }
      });
    }

    return recommendations;
  }

  private analyzeDeboucingPerformance(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (!this.currentMetrics) return recommendations;

    if (this.currentMetrics.debouncing.efficiency < 0.7) {
      recommendations.push({
        id: 'debouncing-optimization',
        priority: 'low',
        category: 'configuration',
        title: 'Improve Debouncing Efficiency',
        description: 'Debouncing efficiency is below optimal',
        impact: 'Better performance during rapid interactions',
        implementation: 'Adjust debounce timing and batch sizes',
        estimatedImprovement: 12,
        confidence: 0.6,
        configChanges: {
          mouseMoveDebounce: 12,
          batchSize: 75
        }
      });
    }

    return recommendations;
  }

  // Default metrics for when data sources are not available
  private getDefaultSpatialMetrics(): SpatialIndexMetrics {
    return {
      totalSnapPoints: 0,
      quadTreeDepth: 0,
      quadTreeNodes: 0,
      averageQueryTime: 0,
      lastQueryTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0
    };
  }

  private getDefaultCacheMetrics(): CacheStatistics {
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      memoryUsage: 0,
      entryCount: 0,
      averageAccessTime: 0,
      evictionCount: 0,
      compressionSavings: 0
    };
  }

  private getDefaultOptimizerMetrics(): PerformanceOptimizerMetrics {
    return {
      debouncing: {
        mouseMoveEvents: 0,
        debouncedMouseMoves: 0,
        drawingEvents: 0,
        debouncedDrawingOps: 0,
        snapQueryEvents: 0,
        debouncedSnapQueries: 0,
        averageDebounceTime: 0
      },
      batching: {
        totalOperations: 0,
        batchedOperations: 0,
        batchCount: 0,
        averageBatchSize: 0,
        averageBatchProcessTime: 0,
        batchEfficiency: 0
      },
      performance: {
        frameRate: 60,
        averageFrameTime: 16.67,
        droppedFrames: 0,
        performanceScore: 100
      },
      adaptive: {
        adjustmentCount: 0,
        currentDebounceDelay: 16,
        currentBatchSize: 50,
        optimizationLevel: 'medium'
      }
    };
  }

  private getDefaultSnapMetrics(): any {
    return {
      averageQueryTime: 0,
      queryCount: 0,
      hitRate: 0,
      totalSnapPoints: 0,
      activeSnapPoints: 0
    };
  }

  /**
   * Destroy monitor and cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.clearHistory();
  }
}
