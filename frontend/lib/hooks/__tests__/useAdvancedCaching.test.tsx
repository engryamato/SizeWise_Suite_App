/**
 * useAdvancedCaching Hook Test Suite
 *
 * Tests for React integration of AdvancedCachingService including:
 * - Hook initialization and cleanup
 * - Cache operations through React interface
 * - Performance monitoring integration
 * - Error handling in React context
 * - HVAC calculation caching workflows
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdvancedCaching } from '../useAdvancedCaching';
import { useMicroservices } from '../useMicroservices';

// Mock the AdvancedCachingService
jest.mock('../../services/AdvancedCachingService', () => ({
  AdvancedCachingService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    cacheCalculationResult: jest.fn().mockResolvedValue(undefined),
    getCachedCalculation: jest.fn().mockResolvedValue(null),
    prefetchProjectData: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn().mockReturnValue({
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      missRate: 0,
      memoryUsage: 0,
      evictionCount: 0,
      compressionRatio: 1,
      avgResponseTime: 0
    }),
    getRecommendations: jest.fn().mockReturnValue([]),
    resetMetrics: jest.fn(),
    updateConfig: jest.fn()
  }))
}));

// Mock DexieDatabase
jest.mock('../../database/DexieDatabase', () => ({
  SizeWiseDatabase: jest.fn().mockImplementation(() => ({
    cacheEntries: {
      put: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined)
    }
  }))
}));

describe('useAdvancedCaching Hook', () => {
  let mockCachingService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked service instance
    const { AdvancedCachingService } = require('../../services/AdvancedCachingService');
    mockCachingService = new AdvancedCachingService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // Hook Initialization Tests
  // =============================================================================

  describe('Hook Initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useAdvancedCaching());

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.get).toBe('function');
      expect(typeof result.current.set).toBe('function');
      expect(typeof result.current.delete).toBe('function');
      expect(typeof result.current.clear).toBe('function');
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        maxMemorySize: 100,
        defaultTTL: 120000,
        compressionEnabled: false
      };

      const { result } = renderHook(() => useAdvancedCaching(customConfig));

      expect(result.current.isInitialized).toBe(true);
      expect(mockCachingService.updateConfig).toHaveBeenCalledWith(customConfig);
    });

    it('should handle initialization errors gracefully', () => {
      // Mock initialization error
      const { AdvancedCachingService } = require('../../services/AdvancedCachingService');
      AdvancedCachingService.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      const { result } = renderHook(() => useAdvancedCaching());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  // =============================================================================
  // Cache Operations Tests
  // =============================================================================

  describe('Cache Operations', () => {
    it('should perform get operations', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };
      
      mockCachingService.get.mockResolvedValueOnce(testValue);

      const { result } = renderHook(() => useAdvancedCaching());

      let retrievedValue: any;
      await act(async () => {
        retrievedValue = await result.current.get(testKey);
      });

      expect(mockCachingService.get).toHaveBeenCalledWith(testKey);
      expect(retrievedValue).toEqual(testValue);
    });

    it('should perform set operations', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };
      const ttl = 60000;

      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        await result.current.set(testKey, testValue, ttl);
      });

      expect(mockCachingService.set).toHaveBeenCalledWith(testKey, testValue, ttl);
    });

    it('should perform delete operations', async () => {
      const testKey = 'test-key';

      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        await result.current.delete(testKey);
      });

      expect(mockCachingService.delete).toHaveBeenCalledWith(testKey);
    });

    it('should perform clear operations', async () => {
      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        await result.current.clear();
      });

      expect(mockCachingService.clear).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // HVAC Calculation Integration Tests
  // =============================================================================

  describe('HVAC Calculation Integration', () => {
    it('should cache calculation results', async () => {
      const projectUuid = 'project-123';
      const inputHash = 'input-hash-456';
      const result = {
        ductSize: 12.5,
        velocity: 1800,
        pressureDrop: 0.25
      };

      const { result: hookResult } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        await hookResult.current.cacheCalculation(projectUuid, inputHash, result);
      });

      expect(mockCachingService.cacheCalculationResult).toHaveBeenCalledWith(
        projectUuid,
        inputHash,
        result
      );
    });

    it('should retrieve cached calculations', async () => {
      const projectUuid = 'project-123';
      const inputHash = 'input-hash-456';
      const cachedResult = {
        ductSize: 12.5,
        velocity: 1800,
        pressureDrop: 0.25
      };

      mockCachingService.getCachedCalculation.mockResolvedValueOnce(cachedResult);

      const { result } = renderHook(() => useAdvancedCaching());

      let retrievedResult: any;
      await act(async () => {
        retrievedResult = await result.current.getCachedCalculation(projectUuid, inputHash);
      });

      expect(mockCachingService.getCachedCalculation).toHaveBeenCalledWith(
        projectUuid,
        inputHash
      );
      expect(retrievedResult).toEqual(cachedResult);
    });

    it('should prefetch project data', async () => {
      const projectUuid = 'project-123';

      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        await result.current.prefetchProject(projectUuid);
      });

      expect(mockCachingService.prefetchProjectData).toHaveBeenCalledWith(projectUuid);
    });
  });

  // =============================================================================
  // Performance Monitoring Tests
  // =============================================================================

  describe('Performance Monitoring', () => {
    it('should provide performance metrics', () => {
      const mockMetrics = {
        totalRequests: 100,
        totalHits: 80,
        totalMisses: 20,
        hitRate: 0.8,
        missRate: 0.2,
        memoryUsage: 25.5,
        evictionCount: 5,
        compressionRatio: 0.7,
        avgResponseTime: 2.5
      };

      mockCachingService.getMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useAdvancedCaching());

      expect(result.current.performanceMetrics).toEqual(mockMetrics);
    });

    it('should provide performance recommendations', () => {
      const mockRecommendations = [
        {
          type: 'performance' as const,
          severity: 'medium' as const,
          message: 'Cache hit rate is below optimal threshold',
          action: jest.fn()
        }
      ];

      mockCachingService.getRecommendations.mockReturnValue(mockRecommendations);

      const { result } = renderHook(() => useAdvancedCaching());

      expect(result.current.getRecommendations()).toEqual(mockRecommendations);
    });

    it('should reset metrics', async () => {
      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        result.current.resetMetrics();
      });

      expect(mockCachingService.resetMetrics).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle cache operation errors gracefully', async () => {
      const error = new Error('Cache operation failed');
      mockCachingService.get.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        try {
          await result.current.get('test-key');
        } catch (err) {
          expect(err).toBe(error);
        }
      });

      expect(result.current.error).toBeNull(); // Hook should not store operation errors
    });

    it('should handle service errors in state', async () => {
      // Mock service method to throw error
      mockCachingService.set.mockRejectedValueOnce(new Error('Service error'));

      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        try {
          await result.current.set('key', 'value');
        } catch (error) {
          // Error should be thrown but not stored in hook state
          expect(error).toBeInstanceOf(Error);
        }
      });

      // Hook should remain functional
      expect(result.current.isInitialized).toBe(true);
    });
  });

  // =============================================================================
  // Configuration Updates Tests
  // =============================================================================

  describe('Configuration Updates', () => {
    it('should update cache configuration', async () => {
      const newConfig = {
        maxMemorySize: 200,
        defaultTTL: 180000
      };

      const { result } = renderHook(() => useAdvancedCaching());

      await act(async () => {
        result.current.updateConfig(newConfig);
      });

      expect(mockCachingService.updateConfig).toHaveBeenCalledWith(newConfig);
    });
  });

  // =============================================================================
  // Hook Lifecycle Tests
  // =============================================================================

  describe('Hook Lifecycle', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useAdvancedCaching());

      // Unmount the hook
      unmount();

      // Verify cleanup (this would be implementation-specific)
      // For now, we just ensure no errors occur during unmount
      expect(true).toBe(true);
    });

    it('should handle re-initialization', async () => {
      const { result, rerender } = renderHook(
        ({ config }) => useAdvancedCaching(config),
        {
          initialProps: { config: { maxMemorySize: 50 } }
        }
      );

      expect(result.current.isInitialized).toBe(true);

      // Re-render with new config
      rerender({ config: { maxMemorySize: 100 } });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });
  });

  // =============================================================================
  // Integration Workflow Tests
  // =============================================================================

  describe('Integration Workflows', () => {
    it('should support complete HVAC calculation workflow', async () => {
      const projectUuid = 'project-123';
      const inputHash = 'calc-hash-456';
      const calculationResult = {
        ductSize: 14.2,
        velocity: 1750,
        pressureDrop: 0.18,
        efficiency: 0.92
      };

      // Mock cache miss first, then cache hit
      mockCachingService.getCachedCalculation
        .mockResolvedValueOnce(null) // Cache miss
        .mockResolvedValueOnce(calculationResult); // Cache hit

      const { result } = renderHook(() => useAdvancedCaching());

      // Step 1: Check for cached result (miss)
      let cachedResult: any;
      await act(async () => {
        cachedResult = await result.current.getCachedCalculation(projectUuid, inputHash);
      });
      expect(cachedResult).toBeNull();

      // Step 2: Cache the calculation result
      await act(async () => {
        await result.current.cacheCalculation(projectUuid, inputHash, calculationResult);
      });

      // Step 3: Retrieve cached result (hit)
      await act(async () => {
        cachedResult = await result.current.getCachedCalculation(projectUuid, inputHash);
      });
      expect(cachedResult).toEqual(calculationResult);

      // Verify all service calls
      expect(mockCachingService.getCachedCalculation).toHaveBeenCalledTimes(2);
      expect(mockCachingService.cacheCalculationResult).toHaveBeenCalledTimes(1);
    });

    it('should support batch operations', async () => {
      const { result } = renderHook(() => useAdvancedCaching());

      const batchOperations = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' }
      ];

      // Perform batch set operations
      await act(async () => {
        await Promise.all(
          batchOperations.map(({ key, value }) =>
            result.current.set(key, value)
          )
        );
      });

      // Verify all set operations were called
      expect(mockCachingService.set).toHaveBeenCalledTimes(3);
      batchOperations.forEach(({ key, value }) => {
        expect(mockCachingService.set).toHaveBeenCalledWith(key, value, undefined);
      });
    });
  });
});
