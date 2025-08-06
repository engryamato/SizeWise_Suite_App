/**
 * Spatial Index System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * High-performance spatial indexing system for snap points using QuadTree.
 * Replaces linear O(n) search with O(log n) spatial queries for efficient
 * snap point detection in large-scale HVAC projects.
 * 
 * @fileoverview Spatial indexing system for snap point optimization
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const spatialIndex = new SpatialIndex(projectBounds);
 * 
 * // Add snap points
 * spatialIndex.addSnapPoint(snapPoint);
 * 
 * // Query nearby snap points
 * const nearbyPoints = spatialIndex.queryRadius(position, threshold);
 * 
 * // Query viewport
 * const visiblePoints = spatialIndex.queryViewport(viewport);
 * ```
 */

import { QuadTree, SpatialObject, Bounds2D, Point2D } from './QuadTree';
import { SnapPoint, SnapResult } from '@/types/air-duct-sizer';

/**
 * Viewport information for spatial queries
 */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

/**
 * Spatial query options
 */
export interface SpatialQueryOptions {
  maxDistance?: number;
  snapTypes?: string[];
  excludeIds?: string[];
  priorityThreshold?: number;
  limit?: number;
}

/**
 * Spatial index performance metrics
 */
export interface SpatialIndexMetrics {
  totalSnapPoints: number;
  quadTreeDepth: number;
  quadTreeNodes: number;
  averageQueryTime: number;
  lastQueryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

/**
 * Snap point spatial object wrapper
 */
interface SnapPointSpatialObject extends SpatialObject {
  snapPoint: SnapPoint;
  lastAccessed: number;
}

/**
 * Query result cache entry
 */
interface QueryCacheEntry {
  key: string;
  result: SnapPoint[];
  timestamp: number;
  accessCount: number;
}

/**
 * Spatial index configuration
 */
export interface SpatialIndexConfig {
  quadTreeMaxPoints: number;
  quadTreeMaxDepth: number;
  quadTreeMinNodeSize: number;
  cacheEnabled: boolean;
  cacheMaxSize: number;
  cacheTTL: number; // milliseconds
  performanceMonitoring: boolean;
}

/**
 * Default spatial index configuration
 */
const DEFAULT_SPATIAL_CONFIG: SpatialIndexConfig = {
  quadTreeMaxPoints: 10,
  quadTreeMaxDepth: 8,
  quadTreeMinNodeSize: 1.0,
  cacheEnabled: true,
  cacheMaxSize: 1000,
  cacheTTL: 5000, // 5 seconds
  performanceMonitoring: true
};

/**
 * High-performance spatial index for snap points
 */
export class SpatialIndex {
  private quadTree: QuadTree;
  private snapPointMap: Map<string, SnapPointSpatialObject> = new Map();
  private config: SpatialIndexConfig;
  
  // Performance monitoring
  private queryTimes: number[] = [];
  private lastQueryTime: number = 0;
  private totalQueries: number = 0;
  
  // Query result caching
  private queryCache: Map<string, QueryCacheEntry> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  
  // Bounds management
  private bounds: Bounds2D;
  private autoExpandBounds: boolean = true;

  constructor(initialBounds: Bounds2D, config?: Partial<SpatialIndexConfig>) {
    this.config = { ...DEFAULT_SPATIAL_CONFIG, ...config };
    this.bounds = { ...initialBounds };
    
    this.quadTree = new QuadTree(this.bounds, {
      maxPoints: this.config.quadTreeMaxPoints,
      maxDepth: this.config.quadTreeMaxDepth,
      minNodeSize: this.config.quadTreeMinNodeSize
    });
  }

  /**
   * Add a snap point to the spatial index
   */
  addSnapPoint(snapPoint: SnapPoint): void {
    // Remove existing if updating
    if (this.snapPointMap.has(snapPoint.id)) {
      this.removeSnapPoint(snapPoint.id);
    }

    // Check if point is within bounds, expand if necessary
    if (this.autoExpandBounds && !this.isPointInBounds(snapPoint.position)) {
      this.expandBounds(snapPoint.position);
    }

    // Create spatial object
    const spatialObject: SnapPointSpatialObject = {
      id: snapPoint.id,
      position: snapPoint.position,
      snapPoint,
      lastAccessed: Date.now(),
      data: {
        type: snapPoint.type,
        priority: snapPoint.priority,
        elementId: snapPoint.elementId
      }
    };

    // Insert into QuadTree and map
    if (this.quadTree.insert(spatialObject)) {
      this.snapPointMap.set(snapPoint.id, spatialObject);
      this.invalidateCache();
    }
  }

  /**
   * Remove a snap point from the spatial index
   */
  removeSnapPoint(snapPointId: string): boolean {
    const spatialObject = this.snapPointMap.get(snapPointId);
    if (!spatialObject) {
      return false;
    }

    const removed = this.quadTree.remove(snapPointId);
    if (removed) {
      this.snapPointMap.delete(snapPointId);
      this.invalidateCache();
    }

    return removed;
  }

  /**
   * Update a snap point in the spatial index
   */
  updateSnapPoint(snapPoint: SnapPoint): void {
    this.addSnapPoint(snapPoint); // addSnapPoint handles updates
  }

  /**
   * Query snap points within a radius of a position
   */
  queryRadius(
    position: Point2D, 
    radius: number, 
    options: SpatialQueryOptions = {}
  ): SnapPoint[] {
    const startTime = this.config.performanceMonitoring ? performance.now() : 0;

    // Check cache first
    const cacheKey = this.generateCacheKey('radius', position, { radius, ...options });
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      this.recordQueryTime(startTime);
      return cachedResult;
    }

    // Perform spatial query
    const spatialObjects = this.quadTree.queryRadius(position, radius);
    
    // Filter and sort results
    let snapPoints = spatialObjects
      .map(obj => (obj as SnapPointSpatialObject).snapPoint)
      .filter(snapPoint => this.matchesQueryOptions(snapPoint, options));

    // Sort by distance and priority
    snapPoints = this.sortSnapPoints(snapPoints, position);

    // Apply limit
    if (options.limit && options.limit > 0) {
      snapPoints = snapPoints.slice(0, options.limit);
    }

    // Cache result
    this.cacheResult(cacheKey, snapPoints);
    
    // Record performance
    this.recordQueryTime(startTime);
    
    return snapPoints;
  }

  /**
   * Query snap points within viewport bounds
   */
  queryViewport(viewport: Viewport, options: SpatialQueryOptions = {}): SnapPoint[] {
    const startTime = this.config.performanceMonitoring ? performance.now() : 0;

    // Convert viewport to bounds
    const bounds: Bounds2D = {
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height
    };

    // Check cache
    const cacheKey = this.generateCacheKey('viewport', bounds, options);
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      this.recordQueryTime(startTime);
      return cachedResult;
    }

    // Perform spatial query
    const spatialObjects = this.quadTree.query(bounds);
    
    // Filter results
    let snapPoints = spatialObjects
      .map(obj => (obj as SnapPointSpatialObject).snapPoint)
      .filter(snapPoint => this.matchesQueryOptions(snapPoint, options));

    // Sort by priority
    snapPoints = snapPoints.sort((a, b) => b.priority - a.priority);

    // Apply limit
    if (options.limit && options.limit > 0) {
      snapPoints = snapPoints.slice(0, options.limit);
    }

    // Cache result
    this.cacheResult(cacheKey, snapPoints);
    
    // Record performance
    this.recordQueryTime(startTime);
    
    return snapPoints;
  }

  /**
   * Find the nearest snap point to a position
   */
  findNearest(
    position: Point2D, 
    maxDistance?: number, 
    options: SpatialQueryOptions = {}
  ): SnapPoint | null {
    const startTime = this.config.performanceMonitoring ? performance.now() : 0;

    // Use QuadTree's findNearest for efficiency
    const spatialObject = this.quadTree.findNearest(position, maxDistance);
    
    if (!spatialObject) {
      this.recordQueryTime(startTime);
      return null;
    }

    const snapPoint = (spatialObject as SnapPointSpatialObject).snapPoint;
    
    // Check if it matches query options
    if (!this.matchesQueryOptions(snapPoint, options)) {
      // Fallback to radius query for filtered search
      const candidates = this.queryRadius(position, maxDistance || 100, options);
      this.recordQueryTime(startTime);
      return candidates.length > 0 ? candidates[0] : null;
    }

    this.recordQueryTime(startTime);
    return snapPoint;
  }

  /**
   * Get all snap points in the index
   */
  getAllSnapPoints(): SnapPoint[] {
    return Array.from(this.snapPointMap.values()).map(obj => obj.snapPoint);
  }

  /**
   * Clear all snap points from the index
   */
  clear(): void {
    this.quadTree.clear();
    this.snapPointMap.clear();
    this.invalidateCache();
  }

  /**
   * Get spatial index performance metrics
   */
  getMetrics(): SpatialIndexMetrics {
    const quadTreeStats = this.quadTree.getStatistics();
    
    return {
      totalSnapPoints: this.snapPointMap.size,
      quadTreeDepth: quadTreeStats.maxDepth,
      quadTreeNodes: quadTreeStats.nodeCount,
      averageQueryTime: this.calculateAverageQueryTime(),
      lastQueryTime: this.lastQueryTime,
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Rebuild the spatial index
   */
  rebuild(): void {
    const snapPoints = this.getAllSnapPoints();
    this.clear();
    
    for (const snapPoint of snapPoints) {
      this.addSnapPoint(snapPoint);
    }
  }

  /**
   * Update the bounds of the spatial index
   */
  updateBounds(newBounds: Bounds2D): void {
    this.bounds = { ...newBounds };
    this.quadTree.updateBounds(newBounds);
    this.invalidateCache();
  }

  /**
   * Check if a point is within the current bounds
   */
  private isPointInBounds(point: Point2D): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y <= this.bounds.y + this.bounds.height
    );
  }

  /**
   * Expand bounds to include a point
   */
  private expandBounds(point: Point2D): void {
    const margin = 100; // Add some margin
    
    const newBounds: Bounds2D = {
      x: Math.min(this.bounds.x, point.x - margin),
      y: Math.min(this.bounds.y, point.y - margin),
      width: 0,
      height: 0
    };

    const maxX = Math.max(this.bounds.x + this.bounds.width, point.x + margin);
    const maxY = Math.max(this.bounds.y + this.bounds.height, point.y + margin);

    newBounds.width = maxX - newBounds.x;
    newBounds.height = maxY - newBounds.y;

    this.updateBounds(newBounds);
  }

  /**
   * Check if a snap point matches query options
   */
  private matchesQueryOptions(snapPoint: SnapPoint, options: SpatialQueryOptions): boolean {
    // Check snap types filter
    if (options.snapTypes && !options.snapTypes.includes(snapPoint.type)) {
      return false;
    }

    // Check excluded IDs
    if (options.excludeIds && options.excludeIds.includes(snapPoint.id)) {
      return false;
    }

    // Check priority threshold
    if (options.priorityThreshold && snapPoint.priority < options.priorityThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Sort snap points by distance and priority
   */
  private sortSnapPoints(snapPoints: SnapPoint[], referencePoint: Point2D): SnapPoint[] {
    return snapPoints.sort((a, b) => {
      const distanceA = Math.sqrt(
        Math.pow(a.position.x - referencePoint.x, 2) + 
        Math.pow(a.position.y - referencePoint.y, 2)
      );
      const distanceB = Math.sqrt(
        Math.pow(b.position.x - referencePoint.x, 2) + 
        Math.pow(b.position.y - referencePoint.y, 2)
      );

      // Primary sort by distance, secondary by priority
      if (Math.abs(distanceA - distanceB) < 0.1) {
        return b.priority - a.priority;
      }
      return distanceA - distanceB;
    });
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(type: string, position: any, options: any): string {
    return `${type}:${JSON.stringify(position)}:${JSON.stringify(options)}`;
  }

  /**
   * Get cached query result
   */
  private getCachedResult(cacheKey: string): SnapPoint[] | null {
    if (!this.config.cacheEnabled) {
      return null;
    }

    const entry = this.queryCache.get(cacheKey);
    if (!entry) {
      this.cacheMisses++;
      return null;
    }

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      this.queryCache.delete(cacheKey);
      this.cacheMisses++;
      return null;
    }

    entry.accessCount++;
    this.cacheHits++;
    return entry.result;
  }

  /**
   * Cache query result
   */
  private cacheResult(cacheKey: string, result: SnapPoint[]): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    // Remove oldest entries if cache is full
    if (this.queryCache.size >= this.config.cacheMaxSize) {
      const oldestKey = Array.from(this.queryCache.keys())[0];
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(cacheKey, {
      key: cacheKey,
      result: [...result],
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Invalidate query cache
   */
  private invalidateCache(): void {
    this.queryCache.clear();
  }

  /**
   * Record query performance time
   */
  private recordQueryTime(startTime: number): void {
    if (!this.config.performanceMonitoring || startTime === 0) {
      return;
    }

    const queryTime = performance.now() - startTime;
    this.lastQueryTime = queryTime;
    this.queryTimes.push(queryTime);
    this.totalQueries++;

    // Keep only recent query times
    if (this.queryTimes.length > 100) {
      this.queryTimes = this.queryTimes.slice(-100);
    }
  }

  /**
   * Calculate average query time
   */
  private calculateAverageQueryTime(): number {
    if (this.queryTimes.length === 0) {
      return 0;
    }
    
    const sum = this.queryTimes.reduce((a, b) => a + b, 0);
    return sum / this.queryTimes.length;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const totalCacheQueries = this.cacheHits + this.cacheMisses;
    return totalCacheQueries > 0 ? this.cacheHits / totalCacheQueries : 0;
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Rough estimation in MB
    const snapPointSize = 200; // bytes per snap point (estimated)
    const cacheEntrySize = 100; // bytes per cache entry (estimated)
    
    const snapPointMemory = this.snapPointMap.size * snapPointSize;
    const cacheMemory = this.queryCache.size * cacheEntrySize;
    
    return (snapPointMemory + cacheMemory) / (1024 * 1024);
  }

  /**
   * Get current bounds
   */
  getBounds(): Bounds2D {
    return { ...this.bounds };
  }

  /**
   * Get configuration
   */
  getConfig(): SpatialIndexConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SpatialIndexConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Rebuild QuadTree if relevant settings changed
    if (
      newConfig.quadTreeMaxPoints !== undefined ||
      newConfig.quadTreeMaxDepth !== undefined ||
      newConfig.quadTreeMinNodeSize !== undefined
    ) {
      this.rebuild();
    }

    // Clear cache if cache settings changed
    if (newConfig.cacheEnabled === false || newConfig.cacheMaxSize !== undefined) {
      this.invalidateCache();
    }
  }
}
