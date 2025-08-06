/**
 * Snap Logic Manager
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 *
 * Core snap logic system for HVAC centerline drawing with magnetic snapping,
 * priority hierarchy, and visual feedback according to SMACNA standards.
 *
 * @example
 * ```typescript
 * const snapManager = new SnapLogicManager({
 *   enabled: true,
 *   snapThreshold: 15,
 *   magneticThreshold: 25
 * });
 *
 * // Add snap points
 * snapManager.addSnapPoint({
 *   id: 'room1_corner_0',
 *   type: 'endpoint',
 *   position: { x: 100, y: 100 },
 *   priority: 1,
 *   elementId: 'room1',
 *   elementType: 'room'
 * });
 *
 * // Find closest snap point
 * const result = snapManager.findClosestSnapPoint({ x: 105, y: 98 });
 * if (result.isSnapped) {
 *   console.log('Snapped to:', result.snapPoint);
 * }
 * ```
 */

import { Vector2 } from 'three';
import {
  SnapPoint,
  SnapResult,
  SnapConfig,
  SnapPointType,
  Centerline,
  CenterlinePoint
} from '@/types/air-duct-sizer';
import { SpatialIndex, SpatialIndexConfig, SpatialIndexMetrics } from './system/SpatialIndex';
import { Bounds2D } from './system/QuadTree';
import { SnapCache, SnapCacheConfig, CacheStatistics } from './system/SnapCache';
import { ValidationUtils, ValidationResult } from './utils/ValidationUtils';
import { InputSanitizer, SanitizationResult } from './utils/InputSanitizer';
import { ErrorHandler } from './system/ErrorHandler';
import {
  SnapLogicError,
  SnapLogicValidationError,
  ErrorCategory,
  ErrorSeverity
} from './system/SnapLogicError';

/**
 * Priority hierarchy for snap points (lower number = higher priority)
 */
const SNAP_PRIORITY: Record<SnapPointType, number> = {
  endpoint: 1,
  centerline: 2,
  midpoint: 3,
  intersection: 4
};

/**
 * Default snap configuration
 */
const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  snapThreshold: 15, // pixels
  magneticThreshold: 25, // pixels
  showVisualFeedback: true,
  showSnapLegend: false,
  modifierKeys: {
    ctrl: false,
    alt: false,
    shift: false
  }
};

/**
 * Core snap logic manager for centerline drawing system
 */
export class SnapLogicManager {
  private snapPoints: Map<string, SnapPoint> = new Map();
  private config: SnapConfig = { ...DEFAULT_SNAP_CONFIG };
  private lastSnapResult: SnapResult | null = null;
  private snapHistory: SnapPoint[] = [];

  // Spatial indexing for performance optimization
  private spatialIndex: SpatialIndex;
  private spatialIndexEnabled: boolean = true;

  // Snap result caching for performance optimization
  private snapCache: SnapCache;
  private snapCacheEnabled: boolean = true;

  private performanceMetrics: {
    linearSearchTime: number;
    spatialSearchTime: number;
    cachedSearchTime: number;
    searchCount: number;
  } = { linearSearchTime: 0, spatialSearchTime: 0, cachedSearchTime: 0, searchCount: 0 };

  // Validation and sanitization
  private inputSanitizer: InputSanitizer;
  private errorHandler: ErrorHandler | null = null;

  constructor(initialConfig?: Partial<SnapConfig>) {
    // Initialize spatial index with default bounds
    // These bounds will be expanded automatically as snap points are added
    const defaultBounds: Bounds2D = {
      x: -10000,
      y: -10000,
      width: 20000,
      height: 20000
    };

    const spatialConfig: Partial<SpatialIndexConfig> = {
      quadTreeMaxPoints: 10,
      quadTreeMaxDepth: 8,
      cacheEnabled: true,
      performanceMonitoring: true
    };

    this.spatialIndex = new SpatialIndex(defaultBounds, spatialConfig);

    // Initialize snap result cache
    const cacheConfig: Partial<SnapCacheConfig> = {
      maxSize: 1000,
      maxMemory: 25, // 25MB
      ttl: 8000, // 8 seconds
      enableLRU: true,
      enableTTL: true,
      enableRegionInvalidation: true,
      enableStatistics: true
    };

    this.snapCache = new SnapCache(cacheConfig);

    // Initialize input sanitizer
    this.inputSanitizer = new InputSanitizer({
      enableXSSProtection: true,
      enableSQLInjectionProtection: true,
      enablePathTraversalProtection: true,
      enableDataNormalization: true,
      enableCoordinateNormalization: true,
      enablePrecisionNormalization: true,
      maxSanitizationTime: 50,
      enableCaching: true,
      cacheSize: 500
    });

    if (initialConfig) {
      this.updateConfig(initialConfig);
    }
  }

  /**
   * Set error handler for validation integration
   */
  setErrorHandler(errorHandler: ErrorHandler): void {
    this.errorHandler = errorHandler;
  }

  /**
   * Update snap configuration
   */
  updateConfig(newConfig: Partial<SnapConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current snap configuration
   */
  getConfig(): SnapConfig {
    return { ...this.config };
  }

  /**
   * Add a snap point to the system
   */
  addSnapPoint(snapPoint: SnapPoint): void {
    // Validate and sanitize snap point
    try {
      const snapPointValidation = ValidationUtils.validateSnapPoint(snapPoint, 'addSnapPoint');
      if (!snapPointValidation.isValid) {
        if (this.errorHandler) {
          this.errorHandler.handleError(
            ValidationUtils.createValidationError(
              snapPointValidation,
              'snap point',
              'addSnapPoint'
            )
          );
        }
        return;
      }

      // Use sanitized snap point
      snapPoint = snapPointValidation.sanitizedValue!;

    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError(
          new SnapLogicValidationError(
            `Snap point validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
              component: 'SnapLogicManager',
              operation: 'addSnapPoint',
              parameters: { snapPointId: snapPoint?.id }
            }
          )
        );
      }
      return;
    }

    this.snapPoints.set(snapPoint.id, snapPoint);

    // Add to spatial index for optimized queries
    if (this.spatialIndexEnabled) {
      this.spatialIndex.addSnapPoint(snapPoint);
    }

    // Invalidate cache near the new snap point
    if (this.snapCacheEnabled) {
      this.snapCache.invalidateNearPoint(snapPoint.position, this.config.magneticThreshold);
    }
  }

  /**
   * Remove a snap point from the system
   */
  removeSnapPoint(snapPointId: string): void {
    const snapPoint = this.snapPoints.get(snapPointId);

    this.snapPoints.delete(snapPointId);

    // Remove from spatial index
    if (this.spatialIndexEnabled) {
      this.spatialIndex.removeSnapPoint(snapPointId);
    }

    // Invalidate cache near the removed snap point
    if (this.snapCacheEnabled && snapPoint) {
      this.snapCache.invalidateNearPoint(snapPoint.position, this.config.magneticThreshold);
    }
  }

  /**
   * Clear all snap points
   */
  clearSnapPoints(): void {
    this.snapPoints.clear();

    // Clear spatial index
    if (this.spatialIndexEnabled) {
      this.spatialIndex.clear();
    }

    // Clear snap cache
    if (this.snapCacheEnabled) {
      this.snapCache.clear();
    }
  }

  /**
   * Get all snap points of a specific type
   */
  getSnapPointsByType(type: SnapPointType): SnapPoint[] {
    return Array.from(this.snapPoints.values()).filter(point => point.type === type);
  }

  /**
   * Get all snap points for a specific element
   */
  getSnapPointsByElement(elementId: string): SnapPoint[] {
    return Array.from(this.snapPoints.values()).filter(point => point.elementId === elementId);
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Find the closest snap point to a given position
   */
  findClosestSnapPoint(
    position: { x: number; y: number },
    excludeTypes?: SnapPointType[]
  ): SnapResult {
    // Validate and sanitize input position
    try {
      const positionValidation = ValidationUtils.validatePoint2D(position, 'snap query position');
      if (!positionValidation.isValid) {
        if (this.errorHandler) {
          this.errorHandler.handleError(
            ValidationUtils.createValidationError(
              positionValidation,
              'snap query position',
              'findClosestSnapPoint'
            )
          );
        }
        return this.createEmptySnapResult();
      }

      // Use sanitized position
      position = positionValidation.sanitizedValue!;

      // Validate exclude types if provided
      if (excludeTypes) {
        const validTypes: SnapPointType[] = ['endpoint', 'centerline', 'midpoint', 'intersection'];
        excludeTypes = excludeTypes.filter(type => {
          if (!validTypes.includes(type)) {
            console.warn(`[SnapLogicManager] Invalid exclude type ignored: ${type}`);
            return false;
          }
          return true;
        });
      }

    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError(
          new SnapLogicValidationError(
            `Input validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
              component: 'SnapLogicManager',
              operation: 'findClosestSnapPoint',
              parameters: { position, excludeTypes }
            }
          )
        );
      }
      return this.createEmptySnapResult();
    }

    if (!this.config.enabled) {
      return this.createEmptySnapResult();
    }

    // Check cache first if enabled
    if (this.snapCacheEnabled) {
      const cacheKey = SnapCache.generateKey(
        position,
        Math.max(this.config.snapThreshold, this.config.magneticThreshold),
        excludeTypes,
        { priorityOverride: this.config.priorityOverride }
      );

      const startTime = performance.now();
      const cachedResult = this.snapCache.get(cacheKey);

      if (cachedResult) {
        // Record cached search performance
        this.performanceMetrics.cachedSearchTime += performance.now() - startTime;
        this.performanceMetrics.searchCount++;

        this.lastSnapResult = cachedResult;
        return cachedResult;
      }
    }

    let closestPoint: SnapPoint | null = null;
    let closestDistance = Infinity;

    if (this.spatialIndexEnabled && this.spatialIndex) {
      // Use spatial index for optimized O(log n) search
      const startTime = performance.now();

      // Query spatial index with magnetic threshold for broader search
      const searchRadius = Math.max(this.config.snapThreshold, this.config.magneticThreshold);
      const candidatePoints = this.spatialIndex.queryRadius(position, searchRadius, {
        snapTypes: excludeTypes ? undefined : undefined, // Will filter below
        excludeIds: undefined,
        priorityThreshold: undefined,
        limit: 50 // Limit candidates for performance
      });

      // Filter candidates based on exclusions and modifier keys
      const availablePoints = candidatePoints.filter(point => {
        if (excludeTypes?.includes(point.type)) return false;
        if (this.config.priorityOverride && point.type !== this.config.priorityOverride) return false;
        return true;
      });

      // Find closest point within threshold
      for (const snapPoint of availablePoints) {
        const distance = this.calculateDistance(position, snapPoint.position);

        if (distance <= this.config.snapThreshold) {
          // Use priority hierarchy for equal distances
          if (distance < closestDistance ||
              (distance === closestDistance && snapPoint.priority < (closestPoint?.priority || Infinity))) {
            closestPoint = snapPoint;
            closestDistance = distance;
          }
        }
      }

      // Record spatial search performance
      this.performanceMetrics.spatialSearchTime += performance.now() - startTime;
      this.performanceMetrics.searchCount++;

    } else {
      // Fallback to linear search for compatibility
      const startTime = performance.now();

      // Filter snap points based on exclusions and modifier keys
      const availablePoints = Array.from(this.snapPoints.values()).filter(point => {
        if (excludeTypes?.includes(point.type)) return false;
        if (this.config.priorityOverride && point.type !== this.config.priorityOverride) return false;
        return true;
      });

      // Find closest point within threshold
      for (const snapPoint of availablePoints) {
        const distance = this.calculateDistance(position, snapPoint.position);

        if (distance <= this.config.snapThreshold) {
          // Use priority hierarchy for equal distances
          if (distance < closestDistance ||
              (distance === closestDistance && snapPoint.priority < (closestPoint?.priority || Infinity))) {
            closestPoint = snapPoint;
            closestDistance = distance;
          }
        }
      }

      // Record linear search performance
      this.performanceMetrics.linearSearchTime += performance.now() - startTime;
      this.performanceMetrics.searchCount++;
    }

    // Check for magnetic attraction
    const isInMagneticRange = closestDistance <= this.config.magneticThreshold;
    const isSnapped = closestPoint !== null && closestDistance <= this.config.snapThreshold;

    const result: SnapResult = {
      snapPoint: closestPoint,
      distance: closestDistance,
      isSnapped,
      visualFeedback: this.calculateVisualFeedback(closestPoint, closestDistance, isInMagneticRange)
    };

    // Cache the result if caching is enabled
    if (this.snapCacheEnabled) {
      const cacheKey = SnapCache.generateKey(
        position,
        Math.max(this.config.snapThreshold, this.config.magneticThreshold),
        excludeTypes,
        { priorityOverride: this.config.priorityOverride }
      );

      const metadata = {
        position,
        radius: Math.max(this.config.snapThreshold, this.config.magneticThreshold),
        snapTypes: excludeTypes
      };

      this.snapCache.set(cacheKey, result, metadata);
    }

    this.lastSnapResult = result;

    // Update snap history for consistency
    if (isSnapped && closestPoint) {
      this.updateSnapHistory(closestPoint);
    }

    return result;
  }

  /**
   * Calculate visual feedback properties
   */
  private calculateVisualFeedback(
    snapPoint: SnapPoint | null,
    distance: number,
    isInMagneticRange: boolean
  ): SnapResult['visualFeedback'] {
    if (!this.config.showVisualFeedback || !snapPoint || !isInMagneticRange) {
      return {
        showIndicator: false,
        indicatorType: 'endpoint',
        opacity: 0,
        size: 0
      };
    }

    // Calculate opacity based on distance (closer = more opaque)
    const maxDistance = this.config.magneticThreshold;
    const opacity = Math.max(0.3, 1 - (distance / maxDistance));

    // Calculate size based on priority (higher priority = larger)
    const baseSizes: Record<SnapPointType, number> = {
      endpoint: 12,
      centerline: 10,
      midpoint: 8,
      intersection: 6
    };

    const size = baseSizes[snapPoint.type] * (0.8 + opacity * 0.4);

    return {
      showIndicator: true,
      indicatorType: snapPoint.type,
      opacity,
      size
    };
  }

  /**
   * Create empty snap result
   */
  private createEmptySnapResult(): SnapResult {
    return {
      snapPoint: null,
      distance: Infinity,
      isSnapped: false,
      visualFeedback: {
        showIndicator: false,
        indicatorType: 'endpoint',
        opacity: 0,
        size: 0
      }
    };
  }

  /**
   * Update snap history for consistency
   */
  private updateSnapHistory(snapPoint: SnapPoint): void {
    // Remove if already in history
    this.snapHistory = this.snapHistory.filter(point => point.id !== snapPoint.id);
    
    // Add to front
    this.snapHistory.unshift(snapPoint);
    
    // Keep only last 10 snaps
    if (this.snapHistory.length > 10) {
      this.snapHistory = this.snapHistory.slice(0, 10);
    }
  }

  /**
   * Get last used snap type for consistency
   */
  getLastUsedSnapType(): SnapPointType | null {
    return this.snapHistory.length > 0 ? this.snapHistory[0].type : null;
  }

  /**
   * Check if multiple snap types are at the same position (ambiguous)
   */
  findAmbiguousSnapPoints(position: { x: number; y: number }): SnapPoint[] {
    const threshold = 3; // pixels for considering points at same position
    
    return Array.from(this.snapPoints.values()).filter(point => {
      const distance = this.calculateDistance(position, point.position);
      return distance <= threshold;
    });
  }

  /**
   * Get snap points within a rectangular region
   */
  getSnapPointsInRegion(
    topLeft: { x: number; y: number },
    bottomRight: { x: number; y: number }
  ): SnapPoint[] {
    return Array.from(this.snapPoints.values()).filter(point => {
      return point.position.x >= topLeft.x &&
             point.position.x <= bottomRight.x &&
             point.position.y >= topLeft.y &&
             point.position.y <= bottomRight.y;
    });
  }

  /**
   * Enable/disable snap temporarily
   */
  setSnapEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set priority override for specific snap type
   */
  setPriorityOverride(type: SnapPointType | null): void {
    this.config.priorityOverride = type;
  }

  /**
   * Update modifier key states
   */
  updateModifierKeys(keys: Partial<SnapConfig['modifierKeys']>): void {
    this.config.modifierKeys = { ...this.config.modifierKeys, ...keys };
    
    // Handle modifier key behaviors
    if (keys.ctrl || keys.alt || keys.shift) {
      // Modifier keys can override snap behavior
      this.config.enabled = !this.config.modifierKeys.ctrl; // Ctrl disables snap
    }
  }

  /**
   * Get current snap statistics for debugging
   */
  getSnapStatistics(): {
    totalSnapPoints: number;
    snapPointsByType: Record<SnapPointType, number>;
    lastSnapDistance: number;
    isCurrentlySnapped: boolean;
  } {
    const snapPointsByType = {
      endpoint: 0,
      centerline: 0,
      midpoint: 0,
      intersection: 0
    };

    for (const point of this.snapPoints.values()) {
      snapPointsByType[point.type]++;
    }

    return {
      totalSnapPoints: this.snapPoints.size,
      snapPointsByType,
      lastSnapDistance: this.lastSnapResult?.distance || 0,
      isCurrentlySnapped: this.lastSnapResult?.isSnapped || false
    };
  }

  /**
   * Enable or disable spatial indexing
   */
  setSpatialIndexEnabled(enabled: boolean): void {
    this.spatialIndexEnabled = enabled;

    if (enabled && this.spatialIndex) {
      // Rebuild spatial index with current snap points
      this.spatialIndex.clear();
      for (const snapPoint of this.snapPoints.values()) {
        this.spatialIndex.addSnapPoint(snapPoint);
      }
    }
  }

  /**
   * Get spatial index performance metrics
   */
  getSpatialIndexMetrics(): SpatialIndexMetrics & {
    linearSearchTime: number;
    spatialSearchTime: number;
    searchCount: number;
    performanceImprovement: number;
  } {
    const spatialMetrics = this.spatialIndex?.getMetrics() || {
      totalSnapPoints: 0,
      quadTreeDepth: 0,
      quadTreeNodes: 0,
      averageQueryTime: 0,
      lastQueryTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0
    };

    const avgLinearTime = this.performanceMetrics.searchCount > 0
      ? this.performanceMetrics.linearSearchTime / this.performanceMetrics.searchCount
      : 0;
    const avgSpatialTime = this.performanceMetrics.searchCount > 0
      ? this.performanceMetrics.spatialSearchTime / this.performanceMetrics.searchCount
      : 0;

    const performanceImprovement = avgLinearTime > 0 && avgSpatialTime > 0
      ? (avgLinearTime - avgSpatialTime) / avgLinearTime
      : 0;

    return {
      ...spatialMetrics,
      linearSearchTime: this.performanceMetrics.linearSearchTime,
      spatialSearchTime: this.performanceMetrics.spatialSearchTime,
      searchCount: this.performanceMetrics.searchCount,
      performanceImprovement
    };
  }

  /**
   * Update spatial index bounds (useful for viewport changes)
   */
  updateSpatialIndexBounds(bounds: Bounds2D): void {
    if (this.spatialIndex) {
      this.spatialIndex.updateBounds(bounds);
    }
  }

  /**
   * Rebuild spatial index (useful after bulk operations)
   */
  rebuildSpatialIndex(): void {
    if (this.spatialIndex) {
      this.spatialIndex.rebuild();
    }
  }

  /**
   * Query snap points within viewport for efficient rendering
   */
  queryViewportSnapPoints(viewport: { x: number; y: number; width: number; height: number }): SnapPoint[] {
    if (!this.spatialIndexEnabled || !this.spatialIndex) {
      // Fallback to all snap points
      return Array.from(this.snapPoints.values());
    }

    return this.spatialIndex.queryViewport({
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height,
      scale: 1 // Scale not used in this context
    });
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      linearSearchTime: 0,
      spatialSearchTime: 0,
      cachedSearchTime: 0,
      searchCount: 0
    };
  }

  /**
   * Enable or disable snap result caching
   */
  setSnapCacheEnabled(enabled: boolean): void {
    this.snapCacheEnabled = enabled;

    if (!enabled && this.snapCache) {
      this.snapCache.clear();
    }
  }

  /**
   * Get snap cache statistics
   */
  getSnapCacheStatistics(): CacheStatistics {
    return this.snapCache?.getStatistics() || {
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

  /**
   * Update snap cache configuration
   */
  updateSnapCacheConfig(config: Partial<SnapCacheConfig>): void {
    if (this.snapCache) {
      this.snapCache.updateConfig(config);
    }
  }

  /**
   * Clear snap cache
   */
  clearSnapCache(): void {
    if (this.snapCache) {
      this.snapCache.clear();
    }
  }

  /**
   * Invalidate cache in a region (useful for bulk updates)
   */
  invalidateCacheRegion(bounds: Bounds2D): number {
    if (!this.snapCache) return 0;
    return this.snapCache.invalidateRegion(bounds);
  }

  /**
   * Invalidate cache by snap point types
   */
  invalidateCacheByType(snapTypes: SnapPointType[]): number {
    if (!this.snapCache) return 0;
    return this.snapCache.invalidateByType(snapTypes);
  }

  /**
   * Get comprehensive performance metrics including cache
   */
  getComprehensiveMetrics(): SpatialIndexMetrics & CacheStatistics & {
    cachedSearchTime: number;
    cacheEnabled: boolean;
    spatialIndexEnabled: boolean;
  } {
    const spatialMetrics = this.getSpatialIndexMetrics();
    const cacheStats = this.getSnapCacheStatistics();

    return {
      ...spatialMetrics,
      ...cacheStats,
      cachedSearchTime: this.performanceMetrics.cachedSearchTime,
      cacheEnabled: this.snapCacheEnabled,
      spatialIndexEnabled: this.spatialIndexEnabled
    };
  }

  /**
   * Destroy manager and cleanup resources
   */
  destroy(): void {
    if (this.snapCache) {
      this.snapCache.destroy();
    }

    if (this.spatialIndex) {
      // Spatial index doesn't have destroy method, but we can clear it
      this.spatialIndex.clear();
    }
  }
}
