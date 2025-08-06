/**
 * Snap Result Caching System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Intelligent caching system for snap results with LRU eviction, TTL expiration,
 * and cache invalidation strategies. Provides significant performance improvements
 * for frequently accessed snap queries in large-scale HVAC projects.
 * 
 * @fileoverview Intelligent caching system for snap result optimization
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const snapCache = new SnapCache({
 *   maxSize: 1000,
 *   ttl: 5000,
 *   enableLRU: true
 * });
 * 
 * // Cache snap result
 * snapCache.set(cacheKey, snapResult);
 * 
 * // Retrieve cached result
 * const cached = snapCache.get(cacheKey);
 * 
 * // Invalidate cache on updates
 * snapCache.invalidateRegion(bounds);
 * ```
 */

import { SnapResult, SnapPoint, SnapPointType } from '@/types/air-duct-sizer';
import { Bounds2D, Point2D } from './QuadTree';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated memory size in bytes
  metadata?: {
    position: Point2D;
    radius?: number;
    bounds?: Bounds2D;
    snapTypes?: SnapPointType[];
  };
}

/**
 * Cache configuration options
 */
export interface SnapCacheConfig {
  maxSize: number;              // Maximum number of cache entries
  maxMemory: number;            // Maximum memory usage in MB
  ttl: number;                  // Time-to-live in milliseconds
  enableLRU: boolean;           // Enable LRU eviction
  enableTTL: boolean;           // Enable TTL expiration
  enableRegionInvalidation: boolean; // Enable spatial invalidation
  enableStatistics: boolean;    // Enable performance statistics
  cleanupInterval: number;      // Cleanup interval in milliseconds
  compressionThreshold: number; // Compress entries larger than this (bytes)
}

/**
 * Cache performance statistics
 */
export interface CacheStatistics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  memoryUsage: number;          // Current memory usage in MB
  entryCount: number;
  averageAccessTime: number;    // Average cache access time in ms
  evictionCount: number;
  compressionSavings: number;   // Memory saved through compression
}

/**
 * Cache invalidation strategy
 */
export type InvalidationStrategy = 'immediate' | 'lazy' | 'batch';

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: SnapCacheConfig = {
  maxSize: 2000,
  maxMemory: 50, // 50MB
  ttl: 10000, // 10 seconds
  enableLRU: true,
  enableTTL: true,
  enableRegionInvalidation: true,
  enableStatistics: true,
  cleanupInterval: 30000, // 30 seconds
  compressionThreshold: 1024 // 1KB
};

/**
 * Intelligent snap result cache implementation
 */
export class SnapCache {
  private cache: Map<string, CacheEntry<SnapResult>> = new Map();
  private config: SnapCacheConfig;
  private statistics: CacheStatistics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private accessTimes: number[] = [];

  // Spatial indexing for cache invalidation
  private spatialIndex: Map<string, Set<string>> = new Map(); // region -> cache keys
  private keyToRegions: Map<string, Set<string>> = new Map(); // cache key -> regions

  constructor(config?: Partial<SnapCacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.statistics = this.initializeStatistics();
    this.startCleanupTimer();
  }

  /**
   * Get cached snap result
   */
  get(key: string): SnapResult | null {
    const startTime = this.config.enableStatistics ? performance.now() : 0;
    
    this.statistics.totalRequests++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.statistics.cacheMisses++;
      this.recordAccessTime(startTime);
      return null;
    }

    // Check TTL expiration
    if (this.config.enableTTL && this.isExpired(entry)) {
      this.delete(key);
      this.statistics.cacheMisses++;
      this.recordAccessTime(startTime);
      return null;
    }

    // Update access metadata
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    this.statistics.cacheHits++;
    this.recordAccessTime(startTime);

    return this.deserializeValue(entry.value);
  }

  /**
   * Cache snap result
   */
  set(key: string, value: SnapResult, metadata?: CacheEntry<SnapResult>['metadata']): void {
    // Check if we need to make space
    this.ensureCapacity();

    const serializedValue = this.serializeValue(value);
    const size = this.estimateSize(serializedValue);
    const now = Date.now();

    const entry: CacheEntry<SnapResult> = {
      key,
      value: serializedValue,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size,
      metadata
    };

    // Compress large entries if enabled
    if (size > this.config.compressionThreshold) {
      entry.value = this.compressValue(entry.value);
      const compressedSize = this.estimateSize(entry.value);
      this.statistics.compressionSavings += size - compressedSize;
      entry.size = compressedSize;
    }

    this.cache.set(key, entry);

    // Update spatial index for region-based invalidation
    if (this.config.enableRegionInvalidation && metadata) {
      this.updateSpatialIndex(key, metadata);
    }

    // Update statistics
    this.updateMemoryUsage();
  }

  /**
   * Check if cache has key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL expiration
    if (this.config.enableTTL && this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.removeSpatialIndex(key);
    this.updateMemoryUsage();

    return true;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.spatialIndex.clear();
    this.keyToRegions.clear();
    this.statistics = this.initializeStatistics();
  }

  /**
   * Invalidate cache entries in a spatial region
   */
  invalidateRegion(bounds: Bounds2D): number {
    if (!this.config.enableRegionInvalidation) {
      return 0;
    }

    const regionKey = this.getRegionKey(bounds);
    const keysToInvalidate = this.spatialIndex.get(regionKey) || new Set();
    
    // Also check overlapping regions
    for (const [region, keys] of this.spatialIndex.entries()) {
      if (this.regionsOverlap(bounds, this.parseRegionKey(region))) {
        for (const key of keys) {
          keysToInvalidate.add(key);
        }
      }
    }

    let invalidatedCount = 0;
    for (const key of keysToInvalidate) {
      if (this.delete(key)) {
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  /**
   * Invalidate cache entries by snap point type
   */
  invalidateByType(snapTypes: SnapPointType[]): number {
    let invalidatedCount = 0;
    const typeSet = new Set(snapTypes);

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata?.snapTypes?.some(type => typeSet.has(type))) {
        if (this.delete(key)) {
          invalidatedCount++;
        }
      }
    }

    return invalidatedCount;
  }

  /**
   * Invalidate cache entries near a point
   */
  invalidateNearPoint(point: Point2D, radius: number): number {
    const bounds: Bounds2D = {
      x: point.x - radius,
      y: point.y - radius,
      width: radius * 2,
      height: radius * 2
    };

    return this.invalidateRegion(bounds);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    this.updateMemoryUsage();
    
    return {
      ...this.statistics,
      hitRate: this.statistics.totalRequests > 0 
        ? this.statistics.cacheHits / this.statistics.totalRequests 
        : 0,
      entryCount: this.cache.size,
      averageAccessTime: this.calculateAverageAccessTime()
    };
  }

  /**
   * Get cache configuration
   */
  getConfig(): SnapCacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<SnapCacheConfig>): void {
    const oldConfig = this.config;
    this.config = { ...this.config, ...newConfig };

    // Handle configuration changes
    if (newConfig.maxSize && newConfig.maxSize < oldConfig.maxSize) {
      this.enforceMaxSize();
    }

    if (newConfig.maxMemory && newConfig.maxMemory < oldConfig.maxMemory) {
      this.enforceMaxMemory();
    }

    if (newConfig.cleanupInterval !== oldConfig.cleanupInterval) {
      this.restartCleanupTimer();
    }
  }

  /**
   * Generate cache key for snap query
   */
  static generateKey(
    position: Point2D, 
    radius?: number, 
    excludeTypes?: SnapPointType[],
    additionalParams?: Record<string, any>
  ): string {
    const parts = [
      `pos:${position.x.toFixed(2)},${position.y.toFixed(2)}`,
      radius ? `r:${radius.toFixed(2)}` : '',
      excludeTypes ? `ex:${excludeTypes.sort().join(',')}` : '',
      additionalParams ? `p:${JSON.stringify(additionalParams)}` : ''
    ].filter(Boolean);

    return parts.join('|');
  }

  /**
   * Ensure cache doesn't exceed capacity limits
   */
  private ensureCapacity(): void {
    this.enforceMaxSize();
    this.enforceMaxMemory();
  }

  /**
   * Enforce maximum cache size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.config.maxSize) return;

    const entriesToRemove = this.cache.size - this.config.maxSize;
    const entries = Array.from(this.cache.entries());

    // Sort by LRU if enabled, otherwise by timestamp
    if (this.config.enableLRU) {
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    } else {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    }

    for (let i = 0; i < entriesToRemove; i++) {
      this.delete(entries[i][0]);
      this.statistics.evictionCount++;
    }
  }

  /**
   * Enforce maximum memory usage
   */
  private enforceMaxMemory(): void {
    const maxMemoryBytes = this.config.maxMemory * 1024 * 1024;
    let currentMemory = this.calculateMemoryUsage();

    if (currentMemory <= maxMemoryBytes) return;

    const entries = Array.from(this.cache.entries());
    
    // Sort by memory efficiency (access count / size)
    entries.sort((a, b) => {
      const efficiencyA = a[1].accessCount / a[1].size;
      const efficiencyB = b[1].accessCount / b[1].size;
      return efficiencyA - efficiencyB; // Remove least efficient first
    });

    for (const [key] of entries) {
      if (currentMemory <= maxMemoryBytes) break;
      
      const entry = this.cache.get(key);
      if (entry) {
        currentMemory -= entry.size;
        this.delete(key);
        this.statistics.evictionCount++;
      }
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<SnapResult>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  /**
   * Serialize snap result for storage
   */
  private serializeValue(value: SnapResult): SnapResult {
    // For now, return as-is. Could implement compression here
    return { ...value };
  }

  /**
   * Deserialize snap result from storage
   */
  private deserializeValue(value: SnapResult): SnapResult {
    // For now, return as-is. Could implement decompression here
    return { ...value };
  }

  /**
   * Compress large cache values
   */
  private compressValue(value: SnapResult): SnapResult {
    // Simplified compression - could use actual compression library
    // For now, just remove unnecessary precision from numbers
    const compressed = { ...value };
    
    if (compressed.snapPoint) {
      compressed.snapPoint = {
        ...compressed.snapPoint,
        position: {
          x: Math.round(compressed.snapPoint.position.x * 100) / 100,
          y: Math.round(compressed.snapPoint.position.y * 100) / 100
        }
      };
    }

    compressed.distance = Math.round(compressed.distance * 100) / 100;

    return compressed;
  }

  /**
   * Estimate memory size of cache entry
   */
  private estimateSize(value: any): number {
    // Rough estimation of object size in bytes
    return JSON.stringify(value).length * 2; // Assume 2 bytes per character
  }

  /**
   * Update spatial index for region-based invalidation
   */
  private updateSpatialIndex(key: string, metadata: CacheEntry<SnapResult>['metadata']): void {
    if (!metadata) return;

    const regions = new Set<string>();

    // Add region for position
    if (metadata.position) {
      const radius = metadata.radius || 50; // Default radius
      const bounds: Bounds2D = {
        x: metadata.position.x - radius,
        y: metadata.position.y - radius,
        width: radius * 2,
        height: radius * 2
      };
      regions.add(this.getRegionKey(bounds));
    }

    // Add region for bounds
    if (metadata.bounds) {
      regions.add(this.getRegionKey(metadata.bounds));
    }

    // Update spatial index
    for (const region of regions) {
      if (!this.spatialIndex.has(region)) {
        this.spatialIndex.set(region, new Set());
      }
      this.spatialIndex.get(region)!.add(key);
    }

    this.keyToRegions.set(key, regions);
  }

  /**
   * Remove key from spatial index
   */
  private removeSpatialIndex(key: string): void {
    const regions = this.keyToRegions.get(key);
    if (!regions) return;

    for (const region of regions) {
      const keys = this.spatialIndex.get(region);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.spatialIndex.delete(region);
        }
      }
    }

    this.keyToRegions.delete(key);
  }

  /**
   * Generate region key for spatial indexing
   */
  private getRegionKey(bounds: Bounds2D): string {
    const gridSize = 100; // 100 unit grid
    const gridX = Math.floor(bounds.x / gridSize);
    const gridY = Math.floor(bounds.y / gridSize);
    return `${gridX},${gridY}`;
  }

  /**
   * Parse region key back to bounds
   */
  private parseRegionKey(regionKey: string): Bounds2D {
    const [gridX, gridY] = regionKey.split(',').map(Number);
    const gridSize = 100;
    return {
      x: gridX * gridSize,
      y: gridY * gridSize,
      width: gridSize,
      height: gridSize
    };
  }

  /**
   * Check if two regions overlap
   */
  private regionsOverlap(bounds1: Bounds2D, bounds2: Bounds2D): boolean {
    return !(
      bounds1.x >= bounds2.x + bounds2.width ||
      bounds1.x + bounds1.width <= bounds2.x ||
      bounds1.y >= bounds2.y + bounds2.height ||
      bounds1.y + bounds1.height <= bounds2.y
    );
  }

  /**
   * Calculate current memory usage
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * Update memory usage statistics
   */
  private updateMemoryUsage(): void {
    this.statistics.memoryUsage = this.calculateMemoryUsage() / (1024 * 1024); // Convert to MB
  }

  /**
   * Record cache access time for statistics
   */
  private recordAccessTime(startTime: number): void {
    if (!this.config.enableStatistics || startTime === 0) return;

    const accessTime = performance.now() - startTime;
    this.accessTimes.push(accessTime);

    // Keep only recent access times
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-1000);
    }
  }

  /**
   * Calculate average access time
   */
  private calculateAverageAccessTime(): number {
    if (this.accessTimes.length === 0) return 0;
    
    const sum = this.accessTimes.reduce((a, b) => a + b, 0);
    return sum / this.accessTimes.length;
  }

  /**
   * Initialize statistics object
   */
  private initializeStatistics(): CacheStatistics {
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

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Restart cleanup timer with new interval
   */
  private restartCleanupTimer(): void {
    this.startCleanupTimer();
  }

  /**
   * Perform periodic cleanup
   */
  private performCleanup(): void {
    if (!this.config.enableTTL) return;

    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
  }
}
