/**
 * Cache Invalidation Hook
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * React hook for managing cache invalidation in components
 */

import { useCallback, useEffect, useState } from 'react';
import { 
  cacheInvalidationManager, 
  CacheInvalidationEvent,
  RedisCacheLayer,
  BrowserCacheLayer,
  ServiceWorkerCacheLayer
} from '@/lib/caching/cache-invalidation-manager';

export interface CacheInvalidationHookOptions {
  autoRegisterLayers?: boolean;
  enableRealTimeStats?: boolean;
  statsUpdateInterval?: number;
}

export interface CacheStats {
  redis?: any;
  browser?: any;
  serviceWorker?: any;
  eventQueue?: {
    pending: number;
    processing: boolean;
  };
  rules?: string[];
}

export function useCacheInvalidation(options: CacheInvalidationHookOptions = {}) {
  const {
    autoRegisterLayers = true,
    enableRealTimeStats = false,
    statsUpdateInterval = 5000
  } = options;

  const [cacheStats, setCacheStats] = useState<CacheStats>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cache layers
  useEffect(() => {
    if (!autoRegisterLayers || isInitialized) return;

    const initializeLayers = async () => {
      try {
        // Register Redis cache layer
        cacheInvalidationManager.registerCacheLayer(
          'redis',
          new RedisCacheLayer()
        );

        // Register browser cache layer
        cacheInvalidationManager.registerCacheLayer(
          'browser',
          new BrowserCacheLayer()
        );

        // Register service worker cache layer
        cacheInvalidationManager.registerCacheLayer(
          'serviceWorker',
          new ServiceWorkerCacheLayer()
        );

        setIsInitialized(true);
        console.log('Cache invalidation layers initialized');
      } catch (error) {
        console.error('Failed to initialize cache layers:', error);
      }
    };

    initializeLayers();
  }, [autoRegisterLayers, isInitialized]);

  // Real-time stats updates
  useEffect(() => {
    if (!enableRealTimeStats || !isInitialized) return;

    const updateStats = async () => {
      try {
        const stats = await cacheInvalidationManager.getCacheStats();
        setCacheStats(stats);
      } catch (error) {
        console.error('Failed to update cache stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, statsUpdateInterval);

    return () => clearInterval(interval);
  }, [enableRealTimeStats, isInitialized, statsUpdateInterval]);

  /**
   * Invalidate cache for a specific entity
   */
  const invalidateEntity = useCallback(async (
    entity: string,
    options: {
      entityId?: string;
      userId?: string;
      projectId?: string;
      type?: CacheInvalidationEvent['type'];
      tags?: string[];
    } = {}
  ) => {
    try {
      await cacheInvalidationManager.invalidate({
        entity,
        type: options.type || 'manual',
        source: 'frontend',
        entityId: options.entityId,
        userId: options.userId,
        projectId: options.projectId,
        tags: options.tags
      });
    } catch (error) {
      console.error(`Failed to invalidate ${entity}:`, error);
      throw error;
    }
  }, []);

  /**
   * Invalidate project-related caches
   */
  const invalidateProject = useCallback(async (projectId: string, userId?: string) => {
    await invalidateEntity('project', { projectId, userId, type: 'update' });
  }, [invalidateEntity]);

  /**
   * Invalidate calculation caches
   */
  const invalidateCalculations = useCallback(async (projectId: string) => {
    await invalidateEntity('calculation', { projectId, type: 'update' });
  }, [invalidateEntity]);

  /**
   * Invalidate user-specific caches
   */
  const invalidateUser = useCallback(async (userId: string) => {
    await invalidateEntity('user', { userId, type: 'update' });
  }, [invalidateEntity]);

  /**
   * Invalidate lookup tables (affects all calculations)
   */
  const invalidateLookupTables = useCallback(async () => {
    await invalidateEntity('lookup_table', { type: 'update' });
  }, [invalidateEntity]);

  /**
   * Invalidate 3D fitting caches
   */
  const invalidateFittings = useCallback(async (projectId: string) => {
    await invalidateEntity('fitting', { projectId, type: 'update' });
  }, [invalidateEntity]);

  /**
   * Invalidate export caches
   */
  const invalidateExports = useCallback(async (projectId: string) => {
    await invalidateEntity('export', { projectId, type: 'update' });
  }, [invalidateEntity]);

  /**
   * Invalidate sync-related caches
   */
  const invalidateSync = useCallback(async (userId: string) => {
    await invalidateEntity('sync', { userId, type: 'sync' });
  }, [invalidateEntity]);

  /**
   * Invalidate specific cache patterns
   */
  const invalidatePatterns = useCallback(async (patterns: string[]) => {
    try {
      await cacheInvalidationManager.invalidatePatterns(patterns);
    } catch (error) {
      console.error('Failed to invalidate patterns:', error);
      throw error;
    }
  }, []);

  /**
   * Clear all caches (emergency function)
   */
  const clearAllCaches = useCallback(async () => {
    try {
      await cacheInvalidationManager.clearAllCaches();
    } catch (error) {
      console.error('Failed to clear all caches:', error);
      throw error;
    }
  }, []);

  /**
   * Get current cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      const stats = await cacheInvalidationManager.getCacheStats();
      setCacheStats(stats);
      return stats;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      throw error;
    }
  }, []);

  /**
   * Add custom invalidation rule
   */
  const addInvalidationRule = useCallback((entity: string, rule: any) => {
    cacheInvalidationManager.addInvalidationRule(entity, rule);
  }, []);

  /**
   * Remove invalidation rule
   */
  const removeInvalidationRule = useCallback((entity: string) => {
    cacheInvalidationManager.removeInvalidationRule(entity);
  }, []);

  return {
    // State
    isInitialized,
    cacheStats,

    // Entity-specific invalidation
    invalidateProject,
    invalidateCalculations,
    invalidateUser,
    invalidateLookupTables,
    invalidateFittings,
    invalidateExports,
    invalidateSync,

    // Generic invalidation
    invalidateEntity,
    invalidatePatterns,
    clearAllCaches,

    // Stats and management
    getCacheStats,
    addInvalidationRule,
    removeInvalidationRule
  };
}

/**
 * Hook for automatic cache invalidation on data mutations
 */
export function useAutoCacheInvalidation(
  entity: string,
  dependencies: {
    projectId?: string;
    userId?: string;
    entityId?: string;
  } = {}
) {
  const { invalidateEntity } = useCacheInvalidation();

  const invalidateOnCreate = useCallback(async () => {
    await invalidateEntity(entity, { ...dependencies, type: 'create' });
  }, [entity, dependencies, invalidateEntity]);

  const invalidateOnUpdate = useCallback(async () => {
    await invalidateEntity(entity, { ...dependencies, type: 'update' });
  }, [entity, dependencies, invalidateEntity]);

  const invalidateOnDelete = useCallback(async () => {
    await invalidateEntity(entity, { ...dependencies, type: 'delete' });
  }, [entity, dependencies, invalidateEntity]);

  return {
    invalidateOnCreate,
    invalidateOnUpdate,
    invalidateOnDelete
  };
}

/**
 * Hook for cache invalidation with optimistic updates
 */
export function useOptimisticCacheInvalidation() {
  const { invalidateEntity } = useCacheInvalidation();

  const withOptimisticInvalidation = useCallback(async <T>(
    operation: () => Promise<T>,
    invalidationConfig: {
      entity: string;
      projectId?: string;
      userId?: string;
      entityId?: string;
      type?: CacheInvalidationEvent['type'];
    }
  ): Promise<T> => {
    try {
      // Perform the operation
      const result = await operation();

      // Invalidate cache after successful operation
      await invalidateEntity(invalidationConfig.entity, {
        projectId: invalidationConfig.projectId,
        userId: invalidationConfig.userId,
        entityId: invalidationConfig.entityId,
        type: invalidationConfig.type || 'update'
      });

      return result;
    } catch (error) {
      // Don't invalidate cache if operation failed
      throw error;
    }
  }, [invalidateEntity]);

  return { withOptimisticInvalidation };
}
