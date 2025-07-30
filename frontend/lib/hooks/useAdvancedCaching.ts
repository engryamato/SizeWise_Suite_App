/**
 * React Hook for Advanced Caching Service
 * 
 * Provides React integration for the AdvancedCachingService with:
 * - Automatic cache initialization
 * - React state integration
 * - Performance monitoring
 * - Cache warming strategies
 * - Memory pressure handling
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AdvancedCachingService, CacheConfig, CacheMetrics, PrefetchStrategy } from '../services/AdvancedCachingService';
import { useSizeWiseDatabase } from './useSizeWiseDatabase';
import { CalculationResult } from '@/types/air-duct-sizer';

// =============================================================================
// Hook Configuration and Types
// =============================================================================

export interface CachingHookConfig extends Partial<CacheConfig> {
  enableAutoWarmup?: boolean;
  enablePerformanceMonitoring?: boolean;
  monitoringInterval?: number;
  autoCleanupInterval?: number;
}

export interface CachingHookReturn {
  // Core caching operations
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  
  // Specialized operations
  cacheCalculation: (projectUuid: string, inputHash: string, result: CalculationResult) => Promise<void>;
  getCachedCalculation: (projectUuid: string, inputHash: string) => Promise<CalculationResult | null>;
  prefetchProject: (projectUuid: string) => Promise<void>;
  
  // Cache management
  warmCache: (keys: string[]) => Promise<void>;
  addPrefetchStrategy: (strategy: PrefetchStrategy) => void;
  
  // Monitoring and metrics
  metrics: CacheMetrics;
  isReady: boolean;
  error: Error | null;
  
  // Performance optimization
  optimizeCache: () => Promise<void>;
  getRecommendations: () => CacheRecommendation[];
}

export interface CacheRecommendation {
  type: 'memory' | 'ttl' | 'prefetch' | 'cleanup';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: () => Promise<void>;
}

// =============================================================================
// Advanced Caching Hook Implementation
// =============================================================================

export function useAdvancedCaching(config: CachingHookConfig = {}): CachingHookReturn {
  const { database, isReady: dbReady } = useSizeWiseDatabase();
  const [cachingService, setCachingService] = useState<AdvancedCachingService | null>(null);
  const [metrics, setMetrics] = useState<CacheMetrics>({
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    memoryUsage: 0,
    indexedDBUsage: 0,
    evictionCount: 0,
    compressionRatio: 0
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // =============================================================================
  // Service Initialization
  // =============================================================================

  useEffect(() => {
    if (!dbReady || !database) return;

    try {
      const service = new AdvancedCachingService(database, {
        maxMemorySize: 50,
        defaultTTL: 30 * 60 * 1000, // 30 minutes
        maxIndexedDBSize: 200,
        compressionEnabled: true,
        prefetchEnabled: true,
        metricsEnabled: true,
        ...config
      });

      setCachingService(service);
      setIsReady(true);
      setError(null);

      // Initialize default prefetch strategies
      if (config.enableAutoWarmup !== false) {
        initializeDefaultStrategies(service);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize caching service'));
      setIsReady(false);
    }
  }, [dbReady, database, config]);

  // =============================================================================
  // Performance Monitoring
  // =============================================================================

  useEffect(() => {
    if (!cachingService || !config.enablePerformanceMonitoring) return;

    const interval = config.monitoringInterval || 5000; // 5 seconds default
    
    metricsIntervalRef.current = setInterval(() => {
      try {
        const currentMetrics = cachingService.getMetrics();
        setMetrics(currentMetrics);
      } catch (err) {
        console.warn('Failed to update cache metrics:', err);
      }
    }, interval);

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [cachingService, config.enablePerformanceMonitoring, config.monitoringInterval]);

  // =============================================================================
  // Automatic Cleanup
  // =============================================================================

  useEffect(() => {
    if (!cachingService) return;

    const cleanupInterval = config.autoCleanupInterval || 60000; // 1 minute default
    
    cleanupIntervalRef.current = setInterval(async () => {
      try {
        await performAutomaticCleanup(cachingService);
      } catch (err) {
        console.warn('Automatic cleanup failed:', err);
      }
    }, cleanupInterval);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cachingService, config.autoCleanupInterval]);

  // =============================================================================
  // Core Cache Operations
  // =============================================================================

  const get = useCallback(async <T>(key: string): Promise<T | null> => {
    if (!cachingService) return null;
    try {
      return await cachingService.get<T>(key);
    } catch (err) {
      console.warn('Cache get failed:', err);
      return null;
    }
  }, [cachingService]);

  const set = useCallback(async <T>(
    key: string, 
    value: T, 
    ttl?: number
  ): Promise<void> => {
    if (!cachingService) return;
    try {
      await cachingService.set(key, value, ttl);
    } catch (err) {
      console.warn('Cache set failed:', err);
    }
  }, [cachingService]);

  const deleteKey = useCallback(async (key: string): Promise<void> => {
    if (!cachingService) return;
    try {
      await cachingService.delete(key);
    } catch (err) {
      console.warn('Cache delete failed:', err);
    }
  }, [cachingService]);

  const clear = useCallback(async (): Promise<void> => {
    if (!cachingService) return;
    try {
      await cachingService.clear();
    } catch (err) {
      console.warn('Cache clear failed:', err);
    }
  }, [cachingService]);

  // =============================================================================
  // Specialized Operations
  // =============================================================================

  const cacheCalculation = useCallback(async (
    projectUuid: string,
    inputHash: string,
    result: CalculationResult
  ): Promise<void> => {
    if (!cachingService) return;
    try {
      await cachingService.cacheCalculationResult(projectUuid, inputHash, result);
    } catch (err) {
      console.warn('Cache calculation failed:', err);
    }
  }, [cachingService]);

  const getCachedCalculation = useCallback(async (
    projectUuid: string,
    inputHash: string
  ): Promise<CalculationResult | null> => {
    if (!cachingService) return null;
    try {
      return await cachingService.getCachedCalculation(projectUuid, inputHash);
    } catch (err) {
      console.warn('Get cached calculation failed:', err);
      return null;
    }
  }, [cachingService]);

  const prefetchProject = useCallback(async (projectUuid: string): Promise<void> => {
    if (!cachingService) return;
    try {
      await cachingService.prefetchProjectData(projectUuid);
    } catch (err) {
      console.warn('Prefetch project failed:', err);
    }
  }, [cachingService]);

  // =============================================================================
  // Cache Management
  // =============================================================================

  const warmCache = useCallback(async (keys: string[]): Promise<void> => {
    if (!cachingService) return;
    try {
      await cachingService.warmCache(keys);
    } catch (err) {
      console.warn('Cache warming failed:', err);
    }
  }, [cachingService]);

  const addPrefetchStrategy = useCallback((strategy: PrefetchStrategy): void => {
    if (!cachingService) return;
    try {
      cachingService.addPrefetchStrategy(strategy);
    } catch (err) {
      console.warn('Add prefetch strategy failed:', err);
    }
  }, [cachingService]);

  const optimizeCache = useCallback(async (): Promise<void> => {
    if (!cachingService) return;
    
    try {
      // Perform cache optimization based on current metrics
      const currentMetrics = cachingService.getMetrics();
      
      // If hit rate is low, suggest cache warming
      if (currentMetrics.hitRate < 0.6 && currentMetrics.totalRequests > 100) {
        console.log('Low hit rate detected, consider cache warming');
      }
      
      // If memory usage is high, trigger cleanup
      if (currentMetrics.memoryUsage > config.maxMemorySize! * 0.8 * 1024 * 1024) {
        await performAutomaticCleanup(cachingService);
      }
      
    } catch (err) {
      console.warn('Cache optimization failed:', err);
    }
  }, [cachingService, config.maxMemorySize]);

  const getRecommendations = useCallback((): CacheRecommendation[] => {
    if (!cachingService) return [];
    
    const recommendations: CacheRecommendation[] = [];
    const currentMetrics = cachingService.getMetrics();
    
    // Memory usage recommendations
    if (currentMetrics.memoryUsage > config.maxMemorySize! * 0.9 * 1024 * 1024) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: 'Memory usage is very high. Consider increasing cache size or reducing TTL.',
        action: async () => await performAutomaticCleanup(cachingService)
      });
    }
    
    // Hit rate recommendations
    if (currentMetrics.hitRate < 0.5 && currentMetrics.totalRequests > 50) {
      recommendations.push({
        type: 'prefetch',
        severity: 'medium',
        message: 'Low cache hit rate. Consider implementing prefetch strategies.',
      });
    }
    
    // TTL recommendations
    if (currentMetrics.evictionCount > currentMetrics.totalRequests * 0.1) {
      recommendations.push({
        type: 'ttl',
        severity: 'medium',
        message: 'High eviction rate. Consider increasing TTL or cache size.',
      });
    }
    
    return recommendations;
  }, [cachingService, config.maxMemorySize]);

  // =============================================================================
  // Helper Functions
  // =============================================================================

  const initializeDefaultStrategies = (service: AdvancedCachingService) => {
    // Default calculation prefetch strategy
    service.addPrefetchStrategy({
      type: 'calculation',
      patterns: ['calc:*'],
      priority: 1,
      maxPrefetch: 10
    });
    
    // Default project prefetch strategy
    service.addPrefetchStrategy({
      type: 'project',
      patterns: ['project:*'],
      priority: 2,
      maxPrefetch: 5
    });
  };

  const performAutomaticCleanup = async (service: AdvancedCachingService) => {
    // Implementation would trigger internal cleanup mechanisms
    // This is a placeholder for more sophisticated cleanup logic
    console.log('Performing automatic cache cleanup');
  };

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // Core operations
    get,
    set,
    delete: deleteKey,
    clear,
    
    // Specialized operations
    cacheCalculation,
    getCachedCalculation,
    prefetchProject,
    
    // Management
    warmCache,
    addPrefetchStrategy,
    
    // Monitoring
    metrics,
    isReady,
    error,
    
    // Optimization
    optimizeCache,
    getRecommendations
  };
}
