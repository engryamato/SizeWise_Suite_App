/**
 * Performance Optimizer System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Debouncing and batch processing system for optimizing performance during
 * rapid user interactions. Handles mouse movements, drawing operations, and
 * snap point updates with configurable timing and batch processing.
 * 
 * @fileoverview Performance optimization through debouncing and batching
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const optimizer = new PerformanceOptimizer({
 *   debounceDelay: 16,        // 60fps
 *   batchSize: 50,            // Process 50 operations per batch
 *   enableBatching: true
 * });
 * 
 * // Debounce rapid mouse movements
 * optimizer.debounceMouseMove(position, (debouncedPosition) => {
 *   snapLogic.updateCursor(debouncedPosition);
 * });
 * 
 * // Batch snap point updates
 * optimizer.batchSnapPointUpdate('add', snapPoint);
 * ```
 */

import { SnapPoint, SnapPointType } from '@/types/air-duct-sizer';
import { Point2D, Bounds2D } from './QuadTree';

/**
 * Performance optimizer configuration
 */
export interface PerformanceOptimizerConfig {
  // Debouncing settings
  debounceDelay: number;           // Debounce delay in milliseconds (default: 16ms for 60fps)
  mouseMoveDebounce: number;       // Mouse movement debounce (default: 8ms for 120fps)
  drawingDebounce: number;         // Drawing operation debounce (default: 16ms)
  snapQueryDebounce: number;       // Snap query debounce (default: 8ms)
  
  // Batching settings
  enableBatching: boolean;         // Enable batch processing
  batchSize: number;              // Max operations per batch
  batchDelay: number;             // Max delay before processing batch (ms)
  maxBatchWait: number;           // Max time to wait for batch completion (ms)
  
  // Performance monitoring
  enableMetrics: boolean;         // Enable performance metrics collection
  metricsInterval: number;        // Metrics collection interval (ms)
  
  // Adaptive optimization
  enableAdaptive: boolean;        // Enable adaptive timing based on performance
  targetFrameRate: number;        // Target frame rate (fps)
  performanceThreshold: number;   // Performance threshold for adaptive adjustments
}

/**
 * Batch operation types
 */
export type BatchOperationType = 'add' | 'remove' | 'update' | 'invalidate';

/**
 * Batch operation definition
 */
export interface BatchOperation {
  type: BatchOperationType;
  target: 'snapPoint' | 'cache' | 'spatialIndex';
  data: any;
  timestamp: number;
  priority: number;
}

/**
 * Performance metrics for debouncing and batching
 */
export interface PerformanceOptimizerMetrics {
  debouncing: {
    mouseMoveEvents: number;
    debouncedMouseMoves: number;
    drawingEvents: number;
    debouncedDrawingOps: number;
    snapQueryEvents: number;
    debouncedSnapQueries: number;
    averageDebounceTime: number;
  };
  
  batching: {
    totalOperations: number;
    batchedOperations: number;
    batchCount: number;
    averageBatchSize: number;
    averageBatchProcessTime: number;
    batchEfficiency: number;      // Percentage of operations that were batched
  };
  
  performance: {
    frameRate: number;
    averageFrameTime: number;
    droppedFrames: number;
    performanceScore: number;     // 0-100 performance score
  };
  
  adaptive: {
    adjustmentCount: number;
    currentDebounceDelay: number;
    currentBatchSize: number;
    optimizationLevel: 'low' | 'medium' | 'high' | 'maximum';
  };
}

/**
 * Debounced function wrapper
 */
interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
  pending(): boolean;
}

/**
 * Default performance optimizer configuration
 */
const DEFAULT_OPTIMIZER_CONFIG: PerformanceOptimizerConfig = {
  debounceDelay: 16,              // 60fps
  mouseMoveDebounce: 8,           // 120fps for smooth mouse tracking
  drawingDebounce: 16,            // 60fps for drawing operations
  snapQueryDebounce: 8,           // 120fps for responsive snapping
  
  enableBatching: true,
  batchSize: 50,
  batchDelay: 32,                 // ~30fps for batch processing
  maxBatchWait: 100,              // Max 100ms wait
  
  enableMetrics: true,
  metricsInterval: 1000,          // 1 second metrics collection
  
  enableAdaptive: true,
  targetFrameRate: 60,
  performanceThreshold: 0.8       // 80% performance threshold
};

/**
 * Performance optimizer for debouncing and batch processing
 */
export class PerformanceOptimizer {
  private config: PerformanceOptimizerConfig;
  private metrics: PerformanceOptimizerMetrics;
  
  // Debouncing state
  private debouncedFunctions: Map<string, DebouncedFunction<any>> = new Map();
  private frameTimeHistory: number[] = [];
  private lastFrameTime: number = 0;
  
  // Batching state
  private batchQueue: Map<string, BatchOperation[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private processingBatches: Set<string> = new Set();
  
  // Performance monitoring
  private metricsTimer: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  
  // Adaptive optimization
  private adaptiveTimer: NodeJS.Timeout | null = null;
  private lastAdaptiveAdjustment: number = 0;

  constructor(config?: Partial<PerformanceOptimizerConfig>) {
    this.config = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    
    this.startPerformanceMonitoring();
    this.startAdaptiveOptimization();
  }

  /**
   * Debounce mouse movement events
   */
  debounceMouseMove<T extends (position: Point2D) => void>(
    position: Point2D,
    callback: T,
    customDelay?: number
  ): void {
    const delay = customDelay || this.config.mouseMoveDebounce;
    const key = 'mouseMove';
    
    this.metrics.debouncing.mouseMoveEvents++;
    
    this.createOrUpdateDebouncedFunction(key, callback, delay);
    const debouncedFn = this.debouncedFunctions.get(key);
    
    if (debouncedFn) {
      debouncedFn(position);
    }
  }

  /**
   * Debounce drawing operations
   */
  debounceDrawingOperation<T extends (...args: any[]) => void>(
    operationKey: string,
    callback: T,
    ...args: Parameters<T>
  ): void {
    const delay = this.config.drawingDebounce;
    const key = `drawing_${operationKey}`;
    
    this.metrics.debouncing.drawingEvents++;
    
    this.createOrUpdateDebouncedFunction(key, callback, delay);
    const debouncedFn = this.debouncedFunctions.get(key);
    
    if (debouncedFn) {
      debouncedFn(...args);
    }
  }

  /**
   * Debounce snap query operations
   */
  debounceSnapQuery<T extends (position: Point2D, excludeTypes?: SnapPointType[]) => void>(
    position: Point2D,
    callback: T,
    excludeTypes?: SnapPointType[],
    customDelay?: number
  ): void {
    const delay = customDelay || this.config.snapQueryDebounce;
    const key = 'snapQuery';
    
    this.metrics.debouncing.snapQueryEvents++;
    
    this.createOrUpdateDebouncedFunction(key, callback, delay);
    const debouncedFn = this.debouncedFunctions.get(key);
    
    if (debouncedFn) {
      debouncedFn(position, excludeTypes);
    }
  }

  /**
   * Add operation to batch queue
   */
  batchOperation(
    batchKey: string,
    operation: Omit<BatchOperation, 'timestamp'>
  ): void {
    if (!this.config.enableBatching) {
      // Process immediately if batching is disabled
      this.processOperation(operation);
      return;
    }

    const fullOperation: BatchOperation = {
      ...operation,
      timestamp: performance.now()
    };

    // Add to batch queue
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, []);
    }
    
    const queue = this.batchQueue.get(batchKey)!;
    queue.push(fullOperation);
    
    this.metrics.batching.totalOperations++;

    // Check if batch should be processed
    if (queue.length >= this.config.batchSize) {
      this.processBatch(batchKey);
    } else {
      this.scheduleBatchProcessing(batchKey);
    }
  }

  /**
   * Batch snap point updates
   */
  batchSnapPointUpdate(
    operation: 'add' | 'remove' | 'update',
    snapPoint: SnapPoint,
    priority: number = 1
  ): void {
    this.batchOperation('snapPoints', {
      type: operation,
      target: 'snapPoint',
      data: snapPoint,
      priority
    });
  }

  /**
   * Batch cache invalidation operations
   */
  batchCacheInvalidation(
    operation: 'region' | 'type' | 'clear',
    data: Bounds2D | SnapPointType[] | null,
    priority: number = 2
  ): void {
    this.batchOperation('cache', {
      type: 'invalidate',
      target: 'cache',
      data: { operation, data },
      priority
    });
  }

  /**
   * Batch spatial index updates
   */
  batchSpatialIndexUpdate(
    operation: BatchOperationType,
    data: SnapPoint | string | null,
    priority: number = 3
  ): void {
    this.batchOperation('spatialIndex', {
      type: operation,
      target: 'spatialIndex',
      data,
      priority
    });
  }

  /**
   * Force process all pending batches
   */
  flushAllBatches(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const batchKey of this.batchQueue.keys()) {
      promises.push(this.processBatch(batchKey));
    }
    
    return Promise.all(promises).then(() => {});
  }

  /**
   * Cancel all pending debounced operations
   */
  cancelAllDebounced(): void {
    for (const debouncedFn of this.debouncedFunctions.values()) {
      debouncedFn.cancel();
    }
  }

  /**
   * Flush all pending debounced operations
   */
  flushAllDebounced(): void {
    for (const debouncedFn of this.debouncedFunctions.values()) {
      debouncedFn.flush();
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceOptimizerMetrics {
    this.updatePerformanceMetrics();
    return { ...this.metrics };
  }

  /**
   * Update optimizer configuration
   */
  updateConfig(newConfig: Partial<PerformanceOptimizerConfig>): void {
    const oldConfig = this.config;
    this.config = { ...this.config, ...newConfig };

    // Handle configuration changes
    if (newConfig.enableMetrics !== oldConfig.enableMetrics) {
      if (newConfig.enableMetrics) {
        this.startPerformanceMonitoring();
      } else {
        this.stopPerformanceMonitoring();
      }
    }

    if (newConfig.enableAdaptive !== oldConfig.enableAdaptive) {
      if (newConfig.enableAdaptive) {
        this.startAdaptiveOptimization();
      } else {
        this.stopAdaptiveOptimization();
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceOptimizerConfig {
    return { ...this.config };
  }

  /**
   * Create or update debounced function
   */
  private createOrUpdateDebouncedFunction<T extends (...args: any[]) => any>(
    key: string,
    callback: T,
    delay: number
  ): void {
    // Cancel existing debounced function if it exists
    const existing = this.debouncedFunctions.get(key);
    if (existing) {
      existing.cancel();
    }

    // Create new debounced function
    const debouncedFn = this.createDebouncedFunction(callback, delay);
    this.debouncedFunctions.set(key, debouncedFn);
  }

  /**
   * Create debounced function with cancel and flush capabilities
   */
  private createDebouncedFunction<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): DebouncedFunction<T> {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;

    const debouncedFn = (...args: Parameters<T>) => {
      lastArgs = args;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
          this.recordDebouncedExecution();
        }
        timeoutId = null;
        lastArgs = null;
      }, delay);
    };

    debouncedFn.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        lastArgs = null;
      }
    };

    debouncedFn.flush = () => {
      if (timeoutId && lastArgs) {
        clearTimeout(timeoutId);
        func(...lastArgs);
        this.recordDebouncedExecution();
        timeoutId = null;
        lastArgs = null;
      }
    };

    debouncedFn.pending = () => {
      return timeoutId !== null;
    };

    return debouncedFn as DebouncedFunction<T>;
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(batchKey: string): void {
    // Clear existing timer if any
    const existingTimer = this.batchTimers.get(batchKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new batch processing
    const timer = setTimeout(() => {
      this.processBatch(batchKey);
    }, this.config.batchDelay);

    this.batchTimers.set(batchKey, timer);
  }

  /**
   * Process batch of operations
   */
  private async processBatch(batchKey: string): Promise<void> {
    if (this.processingBatches.has(batchKey)) {
      return; // Already processing this batch
    }

    const queue = this.batchQueue.get(batchKey);
    if (!queue || queue.length === 0) {
      return;
    }

    this.processingBatches.add(batchKey);
    
    try {
      const startTime = performance.now();
      
      // Clear timer
      const timer = this.batchTimers.get(batchKey);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(batchKey);
      }

      // Sort operations by priority (lower number = higher priority)
      const operations = [...queue].sort((a, b) => a.priority - b.priority);
      
      // Clear the queue
      this.batchQueue.set(batchKey, []);

      // Process operations
      for (const operation of operations) {
        await this.processOperation(operation);
      }

      // Update metrics
      const processingTime = performance.now() - startTime;
      this.metrics.batching.batchedOperations += operations.length;
      this.metrics.batching.batchCount++;
      this.metrics.batching.averageBatchSize = 
        this.metrics.batching.batchedOperations / this.metrics.batching.batchCount;
      this.metrics.batching.averageBatchProcessTime = 
        (this.metrics.batching.averageBatchProcessTime * (this.metrics.batching.batchCount - 1) + processingTime) / 
        this.metrics.batching.batchCount;

    } finally {
      this.processingBatches.delete(batchKey);
    }
  }

  /**
   * Set operation processor callback
   */
  setOperationProcessor(processor: (operation: BatchOperation) => Promise<void> | void): void {
    this.operationProcessor = processor;
  }

  /**
   * Process individual operation
   */
  private async processOperation(operation: BatchOperation): Promise<void> {
    if (this.operationProcessor) {
      await this.operationProcessor(operation);
    } else {
      // Default processing - log for debugging
      console.warn('PerformanceOptimizer: No operation processor set', operation);
    }
  }

  // Operation processor callback
  private operationProcessor?: (operation: BatchOperation) => Promise<void> | void;

  /**
   * Record debounced execution for metrics
   */
  private recordDebouncedExecution(): void {
    // Update appropriate debounced metrics based on the operation type
    // This would be more specific in a real implementation
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): PerformanceOptimizerMetrics {
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
        currentDebounceDelay: this.config.debounceDelay,
        currentBatchSize: this.config.batchSize,
        optimizationLevel: 'medium'
      }
    };
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (!this.config.enableMetrics) return;

    this.metricsTimer = setInterval(() => {
      this.updatePerformanceMetrics();
    }, this.config.metricsInterval);

    // Use Performance Observer if available
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.frameTimeHistory.push(entry.duration);
            if (this.frameTimeHistory.length > 100) {
              this.frameTimeHistory = this.frameTimeHistory.slice(-100);
            }
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Calculate frame rate
    if (this.frameTimeHistory.length > 0) {
      const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      this.metrics.performance.averageFrameTime = avgFrameTime;
      this.metrics.performance.frameRate = 1000 / avgFrameTime;
    }

    // Calculate batch efficiency
    if (this.metrics.batching.totalOperations > 0) {
      this.metrics.batching.batchEfficiency = 
        this.metrics.batching.batchedOperations / this.metrics.batching.totalOperations;
    }

    // Calculate performance score
    const targetFrameTime = 1000 / this.config.targetFrameRate;
    const frameTimeRatio = Math.min(1, targetFrameTime / this.metrics.performance.averageFrameTime);
    this.metrics.performance.performanceScore = Math.round(frameTimeRatio * 100);
  }

  /**
   * Start adaptive optimization
   */
  private startAdaptiveOptimization(): void {
    if (!this.config.enableAdaptive) return;

    this.adaptiveTimer = setInterval(() => {
      this.performAdaptiveOptimization();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop adaptive optimization
   */
  private stopAdaptiveOptimization(): void {
    if (this.adaptiveTimer) {
      clearInterval(this.adaptiveTimer);
      this.adaptiveTimer = null;
    }
  }

  /**
   * Perform adaptive optimization based on performance metrics
   */
  private performAdaptiveOptimization(): void {
    const now = performance.now();
    if (now - this.lastAdaptiveAdjustment < 10000) {
      return; // Don't adjust too frequently
    }

    const performanceRatio = this.metrics.performance.performanceScore / 100;
    
    if (performanceRatio < this.config.performanceThreshold) {
      // Performance is below threshold - increase debounce delays and batch sizes
      this.config.debounceDelay = Math.min(32, this.config.debounceDelay * 1.2);
      this.config.batchSize = Math.min(100, this.config.batchSize * 1.1);
      this.metrics.adaptive.optimizationLevel = 'high';
    } else if (performanceRatio > 0.95) {
      // Performance is excellent - can reduce delays for better responsiveness
      this.config.debounceDelay = Math.max(8, this.config.debounceDelay * 0.9);
      this.config.batchSize = Math.max(20, this.config.batchSize * 0.95);
      this.metrics.adaptive.optimizationLevel = 'low';
    }

    this.metrics.adaptive.adjustmentCount++;
    this.metrics.adaptive.currentDebounceDelay = this.config.debounceDelay;
    this.metrics.adaptive.currentBatchSize = this.config.batchSize;
    this.lastAdaptiveAdjustment = now;
  }

  /**
   * Destroy optimizer and cleanup resources
   */
  destroy(): void {
    this.cancelAllDebounced();
    this.flushAllBatches();
    this.stopPerformanceMonitoring();
    this.stopAdaptiveOptimization();

    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Clear all queues
    this.batchQueue.clear();
    this.debouncedFunctions.clear();
  }
}
