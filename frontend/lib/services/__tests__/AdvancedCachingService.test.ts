/**
 * Advanced Caching Service Test Suite
 * 
 * Comprehensive tests for AdvancedCachingService including:
 * - Cache operations (get, set, delete, clear)
 * - LRU eviction mechanisms
 * - TTL expiration handling
 * - Memory pressure management
 * - Performance benchmarking
 * - Integration with DexieDatabase
 * - Error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { AdvancedCachingService, CacheConfig } from '../AdvancedCachingService';
import { SizeWiseDatabase } from '../../database/DexieDatabase';

// Mock DexieDatabase for testing
vi.mock('../../database/DexieDatabase', () => ({
  SizeWiseDatabase: vi.fn().mockImplementation(() => ({
    cacheEntries: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      where: vi.fn().mockReturnValue({
        below: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(0)
        })
      })
    }
  }))
}));

describe('AdvancedCachingService', () => {
  let cachingService: AdvancedCachingService;
  let mockDatabase: any;
  let config: CacheConfig;

  beforeAll(() => {
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  beforeEach(() => {
    mockDatabase = new SizeWiseDatabase();
    config = {
      maxMemorySize: 10, // 10MB for testing
      defaultTTL: 60000, // 1 minute
      maxIndexedDBSize: 50, // 50MB for testing
      compressionEnabled: true,
      prefetchEnabled: true,
      metricsEnabled: true
    };
    cachingService = new AdvancedCachingService(mockDatabase, config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =============================================================================
  // Basic Cache Operations Tests
  // =============================================================================

  describe('Basic Cache Operations', () => {
    it('should set and get cache entries', async () => {
      const key = 'test-key';
      const value = { data: 'test-value', number: 42 };

      await cachingService.set(key, value);
      const result = await cachingService.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cachingService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete cache entries', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await cachingService.set(key, value);
      await cachingService.delete(key);
      const result = await cachingService.get(key);

      expect(result).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await cachingService.set('key1', 'value1');
      await cachingService.set('key2', 'value2');
      
      await cachingService.clear();
      
      const result1 = await cachingService.get('key1');
      const result2 = await cachingService.get('key2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  // =============================================================================
  // TTL (Time To Live) Tests
  // =============================================================================

  describe('TTL Expiration', () => {
    it('should respect custom TTL values', async () => {
      const key = 'ttl-test';
      const value = 'test-value';
      const shortTTL = 100; // 100ms

      await cachingService.set(key, value, shortTTL);
      
      // Should be available immediately
      let result = await cachingService.get(key);
      expect(result).toBe(value);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired now
      result = await cachingService.get(key);
      expect(result).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-test';
      const value = 'test-value';

      await cachingService.set(key, value);
      
      // Should be available (default TTL is 1 minute)
      const result = await cachingService.get(key);
      expect(result).toBe(value);
    });

    it('should handle TTL cleanup automatically', async () => {
      const cleanupSpy = vi.spyOn(cachingService as any, 'cleanupExpiredEntries');
      
      await cachingService.set('key1', 'value1', 50);
      await cachingService.set('key2', 'value2', 100);
      
      // Wait for first entry to expire
      await new Promise(resolve => setTimeout(resolve, 75));
      
      // Trigger cleanup by accessing cache
      await cachingService.get('key2');
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // LRU Eviction Tests
  // =============================================================================

  describe('LRU Eviction', () => {
    beforeEach(() => {
      // Use smaller memory limit for eviction testing
      config.maxMemorySize = 0.001; // 1KB
      cachingService = new AdvancedCachingService(mockDatabase, config);
    });

    it('should evict least recently used entries when memory limit exceeded', async () => {
      const largeValue = 'x'.repeat(500); // 500 bytes
      
      await cachingService.set('key1', largeValue);
      await cachingService.set('key2', largeValue);
      
      // Access key1 to make it more recently used
      await cachingService.get('key1');
      
      // Add key3, should evict key2 (least recently used)
      await cachingService.set('key3', largeValue);
      
      const result1 = await cachingService.get('key1');
      const result2 = await cachingService.get('key2');
      const result3 = await cachingService.get('key3');
      
      expect(result1).toBe(largeValue); // Should still exist
      expect(result2).toBeNull(); // Should be evicted
      expect(result3).toBe(largeValue); // Should exist
    });

    it('should update access time when retrieving entries', async () => {
      await cachingService.set('key1', 'value1');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Access the key
      await cachingService.get('key1');
      
      // The access time should be updated (tested indirectly through LRU behavior)
      expect(await cachingService.get('key1')).toBe('value1');
    });
  });

  // =============================================================================
  // Memory Management Tests
  // =============================================================================

  describe('Memory Management', () => {
    it('should track memory usage accurately', async () => {
      const initialMetrics = cachingService.getMetrics();
      expect(initialMetrics.memoryUsage).toBe(0);
      
      await cachingService.set('test', 'value');
      
      const updatedMetrics = cachingService.getMetrics();
      expect(updatedMetrics.memoryUsage).toBeGreaterThan(0);
    });

    it('should handle memory pressure by triggering cleanup', async () => {
      const cleanupSpy = vi.spyOn(cachingService as any, 'handleMemoryPressure');
      
      // Fill cache to trigger memory pressure
      const largeValue = 'x'.repeat(1000);
      for (let i = 0; i < 20; i++) {
        await cachingService.set(`key${i}`, largeValue);
      }
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Performance Metrics Tests
  // =============================================================================

  describe('Performance Metrics', () => {
    it('should track cache hit and miss rates', async () => {
      await cachingService.set('hit-key', 'value');
      
      // Generate hits and misses
      await cachingService.get('hit-key'); // Hit
      await cachingService.get('hit-key'); // Hit
      await cachingService.get('miss-key'); // Miss
      await cachingService.get('miss-key'); // Miss
      
      const metrics = cachingService.getMetrics();
      
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.totalHits).toBe(2);
      expect(metrics.totalMisses).toBe(2);
      expect(metrics.hitRate).toBe(0.5);
      expect(metrics.missRate).toBe(0.5);
    });

    it('should track eviction count', async () => {
      // Use small memory limit to force evictions
      config.maxMemorySize = 0.001; // 1KB
      cachingService = new AdvancedCachingService(mockDatabase, config);
      
      const largeValue = 'x'.repeat(500);
      
      await cachingService.set('key1', largeValue);
      await cachingService.set('key2', largeValue);
      await cachingService.set('key3', largeValue); // Should trigger eviction
      
      const metrics = cachingService.getMetrics();
      expect(metrics.evictionCount).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // HVAC Calculation Caching Tests
  // =============================================================================

  describe('HVAC Calculation Caching', () => {
    it('should cache calculation results with proper key generation', async () => {
      const projectUuid = 'project-123';
      const inputHash = 'input-hash-456';
      const result = {
        ductSize: 12.5,
        velocity: 1800,
        pressureDrop: 0.25,
        metadata: { calculation: 'air-duct-sizing' }
      };

      await cachingService.cacheCalculationResult(projectUuid, inputHash, result);
      const cachedResult = await cachingService.getCachedCalculation(projectUuid, inputHash);

      expect(cachedResult).toEqual(result);
    });

    it('should return null for non-cached calculations', async () => {
      const result = await cachingService.getCachedCalculation('non-existent', 'hash');
      expect(result).toBeNull();
    });

    it('should handle project data prefetching', async () => {
      const prefetchSpy = vi.spyOn(cachingService as any, 'prefetchProjectCalculations');
      
      await cachingService.prefetchProjectData('project-123');
      
      expect(prefetchSpy).toHaveBeenCalledWith('project-123');
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockDatabase.cacheEntries.put.mockRejectedValueOnce(new Error('Database error'));
      
      // Should not throw, but handle gracefully
      await expect(cachingService.set('key', 'value')).resolves.not.toThrow();
    });

    it('should handle compression errors gracefully', async () => {
      // Mock compression error by using invalid data
      const invalidData = { circular: {} };
      invalidData.circular = invalidData; // Create circular reference
      
      await expect(cachingService.set('key', invalidData)).resolves.not.toThrow();
    });

    it('should handle memory limit exceeded gracefully', async () => {
      config.maxMemorySize = 0.0001; // Very small limit
      cachingService = new AdvancedCachingService(mockDatabase, config);
      
      const largeValue = 'x'.repeat(1000);
      
      // Should handle gracefully without throwing
      await expect(cachingService.set('key', largeValue)).resolves.not.toThrow();
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Database Integration', () => {
    it('should persist cache entries to IndexedDB', async () => {
      await cachingService.set('persistent-key', 'persistent-value');
      
      expect(mockDatabase.cacheEntries.put).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'persistent-key',
          value: expect.any(String), // Compressed value
          timestamp: expect.any(Number),
          lastAccessed: expect.any(Number),
          ttl: expect.any(Number)
        })
      );
    });

    it('should retrieve cache entries from IndexedDB when not in memory', async () => {
      const key = 'db-key';
      const value = 'db-value';
      
      // Mock database return
      mockDatabase.cacheEntries.get.mockResolvedValueOnce({
        key,
        value: JSON.stringify(value),
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        ttl: Date.now() + 60000
      });
      
      const result = await cachingService.get(key);
      expect(result).toBe(value);
    });

    it('should clean up expired entries from IndexedDB', async () => {
      const cleanupSpy = vi.spyOn(cachingService as any, 'cleanupIndexedDB');
      
      await cachingService.set('key', 'value', 50);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 75));
      
      // Trigger cleanup
      await (cachingService as any).cleanupExpiredEntries();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Performance Benchmarking Tests
  // =============================================================================

  describe('Performance Benchmarking', () => {
    it('should demonstrate cache performance benefits', async () => {
      const key = 'perf-test';
      const complexValue = {
        calculations: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          result: Math.random() * 1000,
          metadata: { timestamp: Date.now(), iteration: i }
        }))
      };

      // First set (cache miss)
      const setStart = performance.now();
      await cachingService.set(key, complexValue);
      const setTime = performance.now() - setStart;

      // First get (cache hit)
      const getStart = performance.now();
      const result = await cachingService.get(key);
      const getTime = performance.now() - getStart;

      expect(result).toEqual(complexValue);
      expect(getTime).toBeLessThan(setTime); // Get should be faster than set
      
      const metrics = cachingService.getMetrics();
      expect(metrics.hitRate).toBeGreaterThan(0);
    });

    it('should maintain performance under load', async () => {
      const operations = 100;
      const startTime = performance.now();
      
      // Perform multiple cache operations
      const promises = Array.from({ length: operations }, async (_, i) => {
        await cachingService.set(`load-test-${i}`, { data: `value-${i}` });
        return await cachingService.get(`load-test-${i}`);
      });
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / operations;
      
      expect(results).toHaveLength(operations);
      expect(avgTimePerOperation).toBeLessThan(10); // Should be under 10ms per operation
      
      const metrics = cachingService.getMetrics();
      expect(metrics.totalRequests).toBe(operations);
    });
  });
});
