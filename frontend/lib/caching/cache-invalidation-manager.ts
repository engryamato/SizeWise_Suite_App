/**
 * Cache Invalidation Manager
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Centralized cache invalidation strategy across all caching layers
 */

export interface CacheInvalidationEvent {
  type: 'create' | 'update' | 'delete' | 'sync' | 'manual';
  entity: string;
  entityId?: string;
  userId?: string;
  projectId?: string;
  tags?: string[];
  timestamp: number;
  source: 'frontend' | 'backend' | 'sync' | 'system';
}

export interface CacheLayer {
  name: string;
  invalidate: (patterns: string[]) => Promise<void>;
  clear: () => Promise<void>;
  getStats: () => Promise<any>;
}

export interface InvalidationRule {
  entity: string;
  patterns: string[];
  cascadeRules?: string[];
  ttlOverride?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class CacheInvalidationManager {
  private static instance: CacheInvalidationManager;
  private cacheLayers: Map<string, CacheLayer> = new Map();
  private invalidationRules: Map<string, InvalidationRule> = new Map();
  private eventQueue: CacheInvalidationEvent[] = [];
  private isProcessing = false;
  private batchSize = 10;
  private batchInterval = 1000; // 1 second

  private constructor() {
    this.setupInvalidationRules();
    this.startEventProcessor();
  }

  static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }

  /**
   * Register a cache layer for invalidation
   */
  registerCacheLayer(name: string, layer: CacheLayer): void {
    this.cacheLayers.set(name, layer);
  }

  /**
   * Setup invalidation rules for different entities
   */
  private setupInvalidationRules(): void {
    // Project-related invalidations
    this.invalidationRules.set('project', {
      entity: 'project',
      patterns: [
        'project:{projectId}:*',
        'user:{userId}:projects',
        'calculations:{projectId}:*',
        'exports:{projectId}:*'
      ],
      cascadeRules: ['project_segments', 'calculations', 'exports'],
      priority: 'high'
    });

    // HVAC calculation invalidations
    this.invalidationRules.set('calculation', {
      entity: 'calculation',
      patterns: [
        'calc:{projectId}:*',
        'hvac_calc:*',
        'api:calculations:*',
        'validation:{projectId}:*'
      ],
      priority: 'high'
    });

    // User data invalidations
    this.invalidationRules.set('user', {
      entity: 'user',
      patterns: [
        'user:{userId}:*',
        'auth:{userId}:*',
        'preferences:{userId}:*'
      ],
      priority: 'medium'
    });

    // Material/lookup table invalidations
    this.invalidationRules.set('lookup_table', {
      entity: 'lookup_table',
      patterns: [
        'lookup:*',
        'material:*',
        'hvac_calc:*' // Calculations depend on lookup tables
      ],
      priority: 'critical',
      ttlOverride: 86400 // 24 hours
    });

    // 3D model/fitting invalidations
    this.invalidationRules.set('fitting', {
      entity: 'fitting',
      patterns: [
        'fitting:{projectId}:*',
        '3d_model:{projectId}:*',
        'geometry:*'
      ],
      priority: 'medium'
    });

    // Export invalidations
    this.invalidationRules.set('export', {
      entity: 'export',
      patterns: [
        'export:{projectId}:*',
        'pdf:{projectId}:*',
        'excel:{projectId}:*',
        'bim:{projectId}:*'
      ],
      priority: 'low'
    });

    // Sync-related invalidations
    this.invalidationRules.set('sync', {
      entity: 'sync',
      patterns: [
        'sync:{userId}:*',
        'offline:{userId}:*',
        'changeset:*'
      ],
      priority: 'high'
    });
  }

  /**
   * Trigger cache invalidation for an entity
   */
  async invalidate(event: Omit<CacheInvalidationEvent, 'timestamp'>): Promise<void> {
    const fullEvent: CacheInvalidationEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.eventQueue.push(fullEvent);
    
    // Process immediately for critical events
    if (this.getEventPriority(fullEvent) === 'critical') {
      await this.processEvent(fullEvent);
    }
  }

  /**
   * Process invalidation event
   */
  private async processEvent(event: CacheInvalidationEvent): Promise<void> {
    const rule = this.invalidationRules.get(event.entity);
    if (!rule) {
      console.warn(`No invalidation rule found for entity: ${event.entity}`);
      return;
    }

    try {
      // Generate cache patterns to invalidate
      const patterns = this.generateInvalidationPatterns(event, rule);
      
      // Invalidate across all cache layers
      await this.invalidatePatterns(patterns);
      
      // Process cascade rules
      if (rule.cascadeRules) {
        for (const cascadeEntity of rule.cascadeRules) {
          await this.invalidate({
            ...event,
            entity: cascadeEntity,
            type: 'manual',
            source: 'system'
          });
        }
      }

      console.log(`Cache invalidation completed for ${event.entity}`, {
        patterns,
        event
      });

    } catch (error) {
      console.error(`Cache invalidation failed for ${event.entity}:`, error);
    }
  }

  /**
   * Generate cache patterns based on event and rule
   */
  private generateInvalidationPatterns(
    event: CacheInvalidationEvent, 
    rule: InvalidationRule
  ): string[] {
    return rule.patterns.map(pattern => {
      return pattern
        .replace('{projectId}', event.projectId || '*')
        .replace('{userId}', event.userId || '*')
        .replace('{entityId}', event.entityId || '*');
    });
  }

  /**
   * Invalidate patterns across all cache layers
   */
  private async invalidatePatterns(patterns: string[]): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [layerName, layer] of this.cacheLayers) {
      promises.push(
        layer.invalidate(patterns).catch(error => {
          console.error(`Cache invalidation failed for layer ${layerName}:`, error);
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Get event priority based on entity and type
   */
  private getEventPriority(event: CacheInvalidationEvent): 'low' | 'medium' | 'high' | 'critical' {
    const rule = this.invalidationRules.get(event.entity);
    if (!rule) return 'low';

    // Override priority for certain event types
    if (event.type === 'sync' && event.entity === 'lookup_table') {
      return 'critical';
    }

    return rule.priority;
  }

  /**
   * Start background event processor
   */
  private startEventProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing || this.eventQueue.length === 0) {
        return;
      }

      this.isProcessing = true;

      try {
        // Process events in batches
        const batch = this.eventQueue.splice(0, this.batchSize);
        
        // Sort by priority
        batch.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[this.getEventPriority(b)] - priorityOrder[this.getEventPriority(a)];
        });

        // Process batch
        for (const event of batch) {
          await this.processEvent(event);
        }

      } catch (error) {
        console.error('Error processing invalidation events:', error);
      } finally {
        this.isProcessing = false;
      }
    }, this.batchInterval);
  }

  /**
   * Invalidate all caches (emergency clear)
   */
  async clearAllCaches(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [layerName, layer] of this.cacheLayers) {
      promises.push(
        layer.clear().catch(error => {
          console.error(`Cache clear failed for layer ${layerName}:`, error);
        })
      );
    }

    await Promise.allSettled(promises);
    console.log('All caches cleared');
  }

  /**
   * Get cache statistics across all layers
   */
  async getCacheStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [layerName, layer] of this.cacheLayers) {
      try {
        stats[layerName] = await layer.getStats();
      } catch (error) {
        stats[layerName] = { error: error.message };
      }
    }

    return {
      layers: stats,
      eventQueue: {
        pending: this.eventQueue.length,
        processing: this.isProcessing
      },
      rules: Array.from(this.invalidationRules.keys())
    };
  }

  /**
   * Manually trigger invalidation for specific patterns
   */
  async invalidatePatterns(patterns: string[]): Promise<void> {
    await this.invalidatePatterns(patterns);
  }

  /**
   * Add custom invalidation rule
   */
  addInvalidationRule(entity: string, rule: InvalidationRule): void {
    this.invalidationRules.set(entity, rule);
  }

  /**
   * Remove invalidation rule
   */
  removeInvalidationRule(entity: string): void {
    this.invalidationRules.delete(entity);
  }

  /**
   * Get current invalidation rules
   */
  getInvalidationRules(): Record<string, InvalidationRule> {
    return Object.fromEntries(this.invalidationRules);
  }
}

// Export singleton instance
export const cacheInvalidationManager = CacheInvalidationManager.getInstance();

/**
 * Cache Layer Adapters
 */

// Redis Cache Layer Adapter
export class RedisCacheLayer implements CacheLayer {
  name = 'redis';

  async invalidate(patterns: string[]): Promise<void> {
    try {
      // Call backend API to invalidate Redis patterns
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patterns })
      });

      if (!response.ok) {
        throw new Error(`Redis invalidation failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Redis clear failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Redis cache clear error:', error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await fetch('/api/cache/stats');
      return await response.json();
    } catch (error) {
      console.error('Redis cache stats error:', error);
      return { error: error.message };
    }
  }
}

// Browser Cache Layer Adapter
export class BrowserCacheLayer implements CacheLayer {
  name = 'browser';

  async invalidate(patterns: string[]): Promise<void> {
    // Invalidate localStorage/sessionStorage
    for (const pattern of patterns) {
      this.invalidateStoragePattern(localStorage, pattern);
      this.invalidateStoragePattern(sessionStorage, pattern);
    }

    // Invalidate IndexedDB cache
    await this.invalidateIndexedDBPattern(patterns);
  }

  private invalidateStoragePattern(storage: Storage, pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToRemove: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && regex.test(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));
  }

  private async invalidateIndexedDBPattern(patterns: string[]): Promise<void> {
    try {
      // This would integrate with the AdvancedCachingService
      if (typeof window !== 'undefined' && (window as any).advancedCachingService) {
        const cachingService = (window as any).advancedCachingService;

        for (const pattern of patterns) {
          await cachingService.invalidatePattern(pattern);
        }
      }
    } catch (error) {
      console.error('IndexedDB invalidation error:', error);
    }
  }

  async clear(): Promise<void> {
    localStorage.clear();
    sessionStorage.clear();

    // Clear IndexedDB
    if (typeof window !== 'undefined' && (window as any).advancedCachingService) {
      await (window as any).advancedCachingService.clear();
    }
  }

  async getStats(): Promise<any> {
    return {
      localStorage: {
        keys: localStorage.length,
        estimatedSize: this.estimateStorageSize(localStorage)
      },
      sessionStorage: {
        keys: sessionStorage.length,
        estimatedSize: this.estimateStorageSize(sessionStorage)
      }
    };
  }

  private estimateStorageSize(storage: Storage): number {
    let size = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key);
        size += key.length + (value?.length || 0);
      }
    }
    return size;
  }
}

// Service Worker Cache Layer Adapter
export class ServiceWorkerCacheLayer implements CacheLayer {
  name = 'serviceWorker';

  async invalidate(patterns: string[]): Promise<void> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return;
    }

    try {
      // Send message to service worker to invalidate patterns
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_INVALIDATE',
        patterns
      });
    } catch (error) {
      console.error('Service Worker cache invalidation error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return;
    }

    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_CLEAR'
      });
    } catch (error) {
      console.error('Service Worker cache clear error:', error);
    }
  }

  async getStats(): Promise<any> {
    if (!('serviceWorker' in navigator)) {
      return { error: 'Service Worker not supported' };
    }

    try {
      const cacheNames = await caches.keys();
      const stats: any = { caches: {} };

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats.caches[cacheName] = {
          entries: keys.length,
          urls: keys.map(req => req.url)
        };
      }

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }
}
