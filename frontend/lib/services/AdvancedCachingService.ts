/**
 * Advanced Caching Service for SizeWise Suite
 * 
 * Implements intelligent caching algorithms with:
 * - LRU (Least Recently Used) cache eviction
 * - TTL (Time To Live) expiration
 * - Cache warming and prefetching
 * - Memory pressure management
 * - Performance metrics and monitoring
 * - Multi-tier caching (memory + IndexedDB)
 */

import { SizeWiseDatabase } from '../database/DexieDatabase';
import { CalculationResult } from '@/types/air-duct-sizer';

// =============================================================================
// Cache Configuration and Types
// =============================================================================

export interface CacheConfig {
  maxMemorySize: number; // Maximum memory cache size in MB
  defaultTTL: number; // Default TTL in milliseconds
  maxIndexedDBSize: number; // Maximum IndexedDB cache size in MB
  compressionEnabled: boolean;
  prefetchEnabled: boolean;
  metricsEnabled: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Size in bytes
  compressed: boolean;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  indexedDBUsage: number;
  evictionCount: number;
  compressionRatio: number;
}

export interface PrefetchStrategy {
  type: 'calculation' | 'project' | 'spatial';
  patterns: string[];
  priority: number;
  maxPrefetch: number;
}

// =============================================================================
// Advanced Caching Service Implementation
// =============================================================================

export class AdvancedCachingService {
  private memoryCache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private database: SizeWiseDatabase;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private prefetchStrategies: PrefetchStrategy[] = [];
  private compressionWorker?: Worker;
  private accessCounter = 0;

  constructor(database: SizeWiseDatabase, config: Partial<CacheConfig> = {}) {
    this.database = database;
    this.config = {
      maxMemorySize: 50, // 50MB default
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxIndexedDBSize: 200, // 200MB default
      compressionEnabled: true,
      prefetchEnabled: true,
      metricsEnabled: true,
      ...config
    };

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      memoryUsage: 0,
      indexedDBUsage: 0,
      evictionCount: 0,
      compressionRatio: 0
    };

    this.initializeCompressionWorker();
    this.startMemoryPressureMonitoring();
  }

  // =============================================================================
  // Core Cache Operations
  // =============================================================================

  async get<T>(key: string): Promise<T | null> {
    this.metrics.totalRequests++;

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      this.updateAccessMetrics(memoryEntry);
      this.metrics.totalHits++;
      this.updateHitRate();
      return memoryEntry.value as T;
    }

    // Check IndexedDB cache
    try {
      const dbEntry = await this.database.cacheEntries.get(key);
      if (dbEntry && this.isValidEntry(dbEntry)) {
        // Promote to memory cache
        await this.setMemoryCache(key, dbEntry.value, dbEntry.ttl);
        this.metrics.totalHits++;
        this.updateHitRate();
        return dbEntry.value as T;
      }
    } catch (error) {
      console.warn('IndexedDB cache read error:', error);
    }

    this.metrics.totalMisses++;
    this.updateHitRate();
    return null;
  }

  async set<T>(
    key: string, 
    value: T, 
    ttl: number = this.config.defaultTTL
  ): Promise<void> {
    const size = this.calculateSize(value);
    
    // Set in memory cache
    await this.setMemoryCache(key, value, ttl, size);
    
    // Set in IndexedDB cache (async)
    this.setIndexedDBCache(key, value, ttl, size).catch(error => {
      console.warn('IndexedDB cache write error:', error);
    });
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.accessOrder.delete(key);
    
    try {
      await this.database.cacheEntries.delete(key);
    } catch (error) {
      console.warn('IndexedDB cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.accessOrder.clear();
    
    try {
      await this.database.cacheEntries.clear();
    } catch (error) {
      console.warn('IndexedDB cache clear error:', error);
    }
    
    this.resetMetrics();
  }

  // =============================================================================
  // Specialized Caching Methods
  // =============================================================================

  async cacheCalculationResult(
    projectUuid: string,
    inputHash: string,
    result: CalculationResult
  ): Promise<void> {
    const key = `calc:${projectUuid}:${inputHash}`;
    await this.set(key, result, 60 * 60 * 1000); // 1 hour TTL for calculations
  }

  async getCachedCalculation(
    projectUuid: string,
    inputHash: string
  ): Promise<CalculationResult | null> {
    const key = `calc:${projectUuid}:${inputHash}`;
    return await this.get<CalculationResult>(key);
  }

  async prefetchProjectData(projectUuid: string): Promise<void> {
    if (!this.config.prefetchEnabled) return;

    const strategy = this.prefetchStrategies.find(s => s.type === 'project');
    if (!strategy) return;

    try {
      // Prefetch common calculations for this project
      const recentCalculations = await this.database.calculations
        .where('projectUuid')
        .equals(projectUuid)
        .reverse()
        .limit(strategy.maxPrefetch)
        .toArray();

      for (const calc of recentCalculations) {
        const key = `calc:${projectUuid}:${this.hashInput(calc.inputData)}`;
        if (!this.memoryCache.has(key)) {
          await this.set(key, calc.result, this.config.defaultTTL);
        }
      }
    } catch (error) {
      console.warn('Prefetch error:', error);
    }
  }

  // =============================================================================
  // Cache Management and Optimization
  // =============================================================================

  private async setMemoryCache<T>(
    key: string,
    value: T,
    ttl: number,
    size?: number
  ): Promise<void> {
    const entrySize = size || this.calculateSize(value);
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      size: entrySize,
      compressed: false
    };

    // Check if we need to evict entries
    await this.ensureMemoryCapacity(entrySize);

    this.memoryCache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
    this.updateMemoryUsage();
  }

  private async setIndexedDBCache<T>(
    key: string,
    value: T,
    ttl: number,
    size: number
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl,
        accessCount: 1,
        lastAccessed: Date.now(),
        size,
        compressed: false
      };

      await this.database.cacheEntries.put(entry);
    } catch (error) {
      console.warn('IndexedDB cache write failed:', error);
    }
  }

  private async ensureMemoryCapacity(requiredSize: number): Promise<void> {
    const maxSizeBytes = this.config.maxMemorySize * 1024 * 1024;
    let currentSize = this.getCurrentMemoryUsage();

    while (currentSize + requiredSize > maxSizeBytes && this.memoryCache.size > 0) {
      const lruKey = this.findLRUKey();
      if (lruKey) {
        const entry = this.memoryCache.get(lruKey);
        if (entry) {
          currentSize -= entry.size;
          this.memoryCache.delete(lruKey);
          this.accessOrder.delete(lruKey);
          this.metrics.evictionCount++;
        }
      } else {
        break;
      }
    }
  }

  private findLRUKey(): string | null {
    let lruKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        lruKey = key;
      }
    }

    return lruKey;
  }

  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  private updateAccessMetrics(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.accessOrder.set(entry.key, ++this.accessCounter);
  }

  private calculateSize(value: any): number {
    return new Blob([JSON.stringify(value)]).size;
  }

  private getCurrentMemoryUsage(): number {
    let total = 0;
    for (const entry of this.memoryCache.values()) {
      total += entry.size;
    }
    return total;
  }

  private updateMemoryUsage(): void {
    this.metrics.memoryUsage = this.getCurrentMemoryUsage();
  }

  private updateHitRate(): void {
    this.metrics.hitRate = this.metrics.totalHits / this.metrics.totalRequests;
    this.metrics.missRate = this.metrics.totalMisses / this.metrics.totalRequests;
  }

  private resetMetrics(): void {
    this.metrics = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      memoryUsage: 0,
      indexedDBUsage: 0,
      evictionCount: 0,
      compressionRatio: 0
    };
  }

  private hashInput(input: any): string {
    return btoa(JSON.stringify(input)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private initializeCompressionWorker(): void {
    if (this.config.compressionEnabled && typeof Worker !== 'undefined') {
      // Initialize compression worker for large cache entries
      // Implementation would go here
    }
  }

  private startMemoryPressureMonitoring(): void {
    if (typeof navigator !== 'undefined' && 'memory' in navigator) {
      setInterval(() => {
        const memory = (navigator as any).memory;
        if (memory && memory.usedJSHeapSize > memory.totalJSHeapSize * 0.8) {
          // High memory pressure - aggressive cache cleanup
          this.performEmergencyCleanup();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private async performEmergencyCleanup(): Promise<void> {
    const targetSize = this.config.maxMemorySize * 0.5 * 1024 * 1024; // 50% of max
    let currentSize = this.getCurrentMemoryUsage();

    while (currentSize > targetSize && this.memoryCache.size > 0) {
      const lruKey = this.findLRUKey();
      if (lruKey) {
        const entry = this.memoryCache.get(lruKey);
        if (entry) {
          currentSize -= entry.size;
          this.memoryCache.delete(lruKey);
          this.accessOrder.delete(lruKey);
          this.metrics.evictionCount++;
        }
      } else {
        break;
      }
    }
  }

  // =============================================================================
  // Public API for Metrics and Management
  // =============================================================================

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  addPrefetchStrategy(strategy: PrefetchStrategy): void {
    this.prefetchStrategies.push(strategy);
  }

  async warmCache(keys: string[]): Promise<void> {
    // Implementation for cache warming
    for (const key of keys) {
      await this.get(key); // This will populate cache if data exists
    }
  }
}
