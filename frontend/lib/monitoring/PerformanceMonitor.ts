/**
 * PerformanceMonitor - Application Performance Monitoring
 * 
 * MISSION-CRITICAL: Monitor and optimize application performance
 * Tracks startup time, feature flag performance, and memory usage
 * 
 * Performance Requirements:
 * - Application startup: <3s
 * - Feature flag evaluation: <50ms
 * - Memory usage: <100MB baseline
 * - Cache hit rate: >90%
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'mb' | 'percent' | 'count';
  timestamp: number;
  category: 'startup' | 'feature_flags' | 'memory' | 'cache' | 'database';
}

export interface StartupMetrics {
  totalStartupTime: number;
  databaseInitTime: number;
  featureManagerInitTime: number;
  uiRenderTime: number;
  cacheWarmupTime: number;
}

export interface FeatureFlagMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  totalRequests: number;
  slowQueries: number; // >50ms
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

/**
 * Performance monitoring and optimization system
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startupStartTime: number = 0;
  private readonly maxMetricsHistory = 1000;
  private readonly performanceThresholds = {
    startupTime: 3000, // 3s
    featureFlagResponse: 50, // 50ms
    memoryUsage: 100 * 1024 * 1024, // 100MB
    cacheHitRate: 90 // 90%
  };

  constructor() {
    this.startupStartTime = performance.now();
  }

  /**
   * Start monitoring application startup
   */
  startStartupMonitoring(): void {
    this.startupStartTime = performance.now();
    this.recordMetric('startup_begin', 0, 'ms', 'startup');
  }

  /**
   * Record database initialization time
   */
  recordDatabaseInit(duration: number): void {
    this.recordMetric('database_init', duration, 'ms', 'startup');
  }

  /**
   * Record feature manager initialization time
   */
  recordFeatureManagerInit(duration: number): void {
    this.recordMetric('feature_manager_init', duration, 'ms', 'startup');
  }

  /**
   * Record UI render time
   */
  recordUIRender(duration: number): void {
    this.recordMetric('ui_render', duration, 'ms', 'startup');
  }

  /**
   * Record cache warmup time
   */
  recordCacheWarmup(duration: number): void {
    this.recordMetric('cache_warmup', duration, 'ms', 'startup');
  }

  /**
   * Complete startup monitoring
   */
  completeStartupMonitoring(): StartupMetrics {
    const totalStartupTime = performance.now() - this.startupStartTime;
    this.recordMetric('startup_complete', totalStartupTime, 'ms', 'startup');

    const metrics = this.getMetricsByCategory('startup');
    const startupMetrics: StartupMetrics = {
      totalStartupTime,
      databaseInitTime: this.getMetricValue(metrics, 'database_init') || 0,
      featureManagerInitTime: this.getMetricValue(metrics, 'feature_manager_init') || 0,
      uiRenderTime: this.getMetricValue(metrics, 'ui_render') || 0,
      cacheWarmupTime: this.getMetricValue(metrics, 'cache_warmup') || 0
    };

    // Check performance thresholds
    if (totalStartupTime > this.performanceThresholds.startupTime) {
      console.warn(`Startup time ${totalStartupTime}ms exceeds threshold ${this.performanceThresholds.startupTime}ms`);
    }

    return startupMetrics;
  }

  /**
   * Record feature flag performance
   */
  recordFeatureFlagPerformance(
    featureName: string,
    responseTime: number,
    cached: boolean
  ): void {
    this.recordMetric(`feature_flag_${featureName}`, responseTime, 'ms', 'feature_flags');
    this.recordMetric('feature_flag_cache_hit', cached ? 1 : 0, 'count', 'cache');

    if (responseTime > this.performanceThresholds.featureFlagResponse) {
      this.recordMetric('feature_flag_slow_query', 1, 'count', 'feature_flags');
      console.warn(`Feature flag ${featureName} response time ${responseTime}ms exceeds threshold`);
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): MemoryMetrics {
    const memoryUsage = process.memoryUsage();
    
    this.recordMetric('memory_heap_used', memoryUsage.heapUsed, 'mb', 'memory');
    this.recordMetric('memory_heap_total', memoryUsage.heapTotal, 'mb', 'memory');
    this.recordMetric('memory_external', memoryUsage.external, 'mb', 'memory');
    this.recordMetric('memory_rss', memoryUsage.rss, 'mb', 'memory');

    if (memoryUsage.heapUsed > this.performanceThresholds.memoryUsage) {
      console.warn(`Memory usage ${memoryUsage.heapUsed} exceeds threshold ${this.performanceThresholds.memoryUsage}`);
    }

    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    };
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(queryType: string, duration: number): void {
    this.recordMetric(`db_query_${queryType}`, duration, 'ms', 'database');
    
    if (duration > 100) { // 100ms threshold for database queries
      this.recordMetric('db_slow_query', 1, 'count', 'database');
      console.warn(`Database query ${queryType} took ${duration}ms`);
    }
  }

  /**
   * Record cache performance
   */
  recordCachePerformance(hitRate: number, size: number): void {
    this.recordMetric('cache_hit_rate', hitRate, 'percent', 'cache');
    this.recordMetric('cache_size', size, 'count', 'cache');

    if (hitRate < this.performanceThresholds.cacheHitRate) {
      console.warn(`Cache hit rate ${hitRate}% below threshold ${this.performanceThresholds.cacheHitRate}%`);
    }
  }

  /**
   * Record error for monitoring
   */
  recordError(category: string, error: Error): void {
    this.recordMetric(`error_${category}`, 1, 'count', category as any);
    console.error(`Performance Monitor - ${category} error:`, error);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    startup: StartupMetrics | null;
    featureFlags: FeatureFlagMetrics;
    memory: MemoryMetrics;
    recommendations: string[];
  } {
    const startupMetrics = this.getStartupSummary();
    const featureFlagMetrics = this.getFeatureFlagSummary();
    const memoryMetrics = this.getLatestMemoryMetrics();
    const recommendations = this.generateRecommendations();

    return {
      startup: startupMetrics,
      featureFlags: featureFlagMetrics,
      memory: memoryMetrics,
      recommendations
    };
  }

  /**
   * Private helper methods
   */
  private recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'mb' | 'percent' | 'count',
    category: 'startup' | 'feature_flags' | 'memory' | 'cache' | 'database'
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category
    };

    this.metrics.push(metric);

    // Limit metrics history to prevent memory leaks
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private getMetricsByCategory(category: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  private getMetricValue(metrics: PerformanceMetric[], name: string): number | null {
    const metric = metrics.find(m => m.name === name);
    return metric ? metric.value : null;
  }

  private getStartupSummary(): StartupMetrics | null {
    const startupMetrics = this.getMetricsByCategory('startup');
    const totalTime = this.getMetricValue(startupMetrics, 'startup_complete');
    
    if (!totalTime) return null;

    return {
      totalStartupTime: totalTime,
      databaseInitTime: this.getMetricValue(startupMetrics, 'database_init') || 0,
      featureManagerInitTime: this.getMetricValue(startupMetrics, 'feature_manager_init') || 0,
      uiRenderTime: this.getMetricValue(startupMetrics, 'ui_render') || 0,
      cacheWarmupTime: this.getMetricValue(startupMetrics, 'cache_warmup') || 0
    };
  }

  private getFeatureFlagSummary(): FeatureFlagMetrics {
    const flagMetrics = this.getMetricsByCategory('feature_flags');
    const cacheMetrics = this.getMetricsByCategory('cache');
    
    const responseTimes = flagMetrics
      .filter(m => m.name.startsWith('feature_flag_') && !m.name.includes('slow_query'))
      .map(m => m.value);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const cacheHits = cacheMetrics.filter(m => m.name === 'feature_flag_cache_hit' && m.value === 1).length;
    const totalRequests = cacheMetrics.filter(m => m.name === 'feature_flag_cache_hit').length;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    const slowQueries = flagMetrics.filter(m => m.name === 'feature_flag_slow_query').length;

    return {
      averageResponseTime,
      cacheHitRate,
      totalRequests,
      slowQueries
    };
  }

  private getLatestMemoryMetrics(): MemoryMetrics {
    const memoryMetrics = this.getMetricsByCategory('memory');
    
    return {
      heapUsed: this.getMetricValue(memoryMetrics, 'memory_heap_used') || 0,
      heapTotal: this.getMetricValue(memoryMetrics, 'memory_heap_total') || 0,
      external: this.getMetricValue(memoryMetrics, 'memory_external') || 0,
      rss: this.getMetricValue(memoryMetrics, 'memory_rss') || 0
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = this.getPerformanceSummary();

    if (summary.startup && summary.startup.totalStartupTime > this.performanceThresholds.startupTime) {
      recommendations.push('Consider optimizing startup sequence - current time exceeds 3s threshold');
    }

    if (summary.featureFlags.averageResponseTime > this.performanceThresholds.featureFlagResponse) {
      recommendations.push('Feature flag response time is slow - consider cache optimization');
    }

    if (summary.featureFlags.cacheHitRate < this.performanceThresholds.cacheHitRate) {
      recommendations.push('Cache hit rate is low - consider increasing cache size or TTL');
    }

    if (summary.memory.heapUsed > this.performanceThresholds.memoryUsage) {
      recommendations.push('Memory usage is high - consider memory optimization');
    }

    return recommendations;
  }
}
