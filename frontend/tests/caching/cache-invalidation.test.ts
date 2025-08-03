/**
 * Cache Invalidation Tests
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Comprehensive testing for cache invalidation strategies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { 
  cacheInvalidationManager,
  RedisCacheLayer,
  BrowserCacheLayer,
  ServiceWorkerCacheLayer
} from '@/lib/caching/cache-invalidation-manager';
import { 
  useCacheInvalidation,
  useAutoCacheInvalidation,
  useOptimisticCacheInvalidation
} from '@/lib/hooks/useCacheInvalidation';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage and sessionStorage
const mockStorage = {
  data: new Map<string, string>(),
  getItem: jest.fn((key: string) => mockStorage.data.get(key) || null),
  setItem: jest.fn((key: string, value: string) => mockStorage.data.set(key, value)),
  removeItem: jest.fn((key: string) => mockStorage.data.delete(key)),
  clear: jest.fn(() => mockStorage.data.clear()),
  get length() { return mockStorage.data.size; },
  key: jest.fn((index: number) => Array.from(mockStorage.data.keys())[index] || null)
};

Object.defineProperty(window, 'localStorage', { value: mockStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    controller: {
      postMessage: jest.fn()
    }
  },
  writable: true
});

// Mock caches API
global.caches = {
  keys: jest.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
  open: jest.fn().mockResolvedValue({
    keys: jest.fn().mockResolvedValue([
      { url: 'https://example.com/api/data' },
      { url: 'https://example.com/static/image.png' }
    ])
  })
} as any;

describe('Cache Invalidation Manager', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockStorage.data.clear();
    
    // Reset cache invalidation manager
    cacheInvalidationManager['cacheLayers'].clear();
    cacheInvalidationManager['eventQueue'] = [];
  });

  test('should register cache layers correctly', () => {
    const redisLayer = new RedisCacheLayer();
    const browserLayer = new BrowserCacheLayer();
    
    cacheInvalidationManager.registerCacheLayer('redis', redisLayer);
    cacheInvalidationManager.registerCacheLayer('browser', browserLayer);
    
    expect(cacheInvalidationManager['cacheLayers'].size).toBe(2);
    expect(cacheInvalidationManager['cacheLayers'].get('redis')).toBe(redisLayer);
    expect(cacheInvalidationManager['cacheLayers'].get('browser')).toBe(browserLayer);
  });

  test('should generate correct invalidation patterns', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response);

    const redisLayer = new RedisCacheLayer();
    cacheInvalidationManager.registerCacheLayer('redis', redisLayer);

    await cacheInvalidationManager.invalidate({
      entity: 'project',
      type: 'update',
      source: 'frontend',
      projectId: 'test-project-123',
      userId: 'test-user-456'
    });

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledWith('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('test-project-123')
    });
  });

  test('should handle cascade invalidation', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response);

    const redisLayer = new RedisCacheLayer();
    cacheInvalidationManager.registerCacheLayer('redis', redisLayer);

    await cacheInvalidationManager.invalidate({
      entity: 'project',
      type: 'update',
      source: 'frontend',
      projectId: 'test-project-123'
    });

    // Wait for cascade processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should have called invalidation multiple times for cascaded entities
    expect(mockFetch).toHaveBeenCalledTimes(4); // project + 3 cascade entities
  });
});

describe('Browser Cache Layer', () => {
  let browserLayer: BrowserCacheLayer;

  beforeEach(() => {
    browserLayer = new BrowserCacheLayer();
    mockStorage.data.clear();
  });

  test('should invalidate localStorage patterns correctly', async () => {
    // Set up test data
    localStorage.setItem('project:123:data', 'test-data');
    localStorage.setItem('project:456:data', 'test-data-2');
    localStorage.setItem('user:789:profile', 'user-data');
    localStorage.setItem('other:data', 'other-data');

    await browserLayer.invalidate(['project:*']);

    expect(localStorage.getItem('project:123:data')).toBeNull();
    expect(localStorage.getItem('project:456:data')).toBeNull();
    expect(localStorage.getItem('user:789:profile')).toBe('user-data');
    expect(localStorage.getItem('other:data')).toBe('other-data');
  });

  test('should clear all storage correctly', async () => {
    localStorage.setItem('test1', 'value1');
    sessionStorage.setItem('test2', 'value2');

    await browserLayer.clear();

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  test('should provide accurate storage stats', async () => {
    localStorage.setItem('key1', 'value1');
    localStorage.setItem('key2', 'value2');

    const stats = await browserLayer.getStats();

    expect(stats.localStorage.keys).toBe(2);
    expect(stats.localStorage.estimatedSize).toBeGreaterThan(0);
  });
});

describe('Service Worker Cache Layer', () => {
  let serviceWorkerLayer: ServiceWorkerCacheLayer;

  beforeEach(() => {
    serviceWorkerLayer = new ServiceWorkerCacheLayer();
    jest.clearAllMocks();
  });

  test('should send invalidation message to service worker', async () => {
    const patterns = ['api:*', 'static:*'];
    
    await serviceWorkerLayer.invalidate(patterns);

    expect(navigator.serviceWorker.controller?.postMessage).toHaveBeenCalledWith({
      type: 'CACHE_INVALIDATE',
      patterns
    });
  });

  test('should send clear message to service worker', async () => {
    await serviceWorkerLayer.clear();

    expect(navigator.serviceWorker.controller?.postMessage).toHaveBeenCalledWith({
      type: 'CACHE_CLEAR'
    });
  });

  test('should provide cache statistics', async () => {
    const stats = await serviceWorkerLayer.getStats();

    expect(stats.caches).toBeDefined();
    expect(stats.caches['cache-v1']).toEqual({
      entries: 2,
      urls: [
        'https://example.com/api/data',
        'https://example.com/static/image.png'
      ]
    });
  });
});

describe('useCacheInvalidation Hook', () => {
  test('should initialize cache layers automatically', async () => {
    const { result } = renderHook(() => useCacheInvalidation({
      autoRegisterLayers: true
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isInitialized).toBe(true);
  });

  test('should invalidate project correctly', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response);

    const { result } = renderHook(() => useCacheInvalidation());

    await act(async () => {
      await result.current.invalidateProject('test-project-123', 'test-user-456');
    });

    // Should not throw and should call the invalidation
    expect(mockFetch).toHaveBeenCalled();
  });

  test('should handle cache stats updates', async () => {
    const { result } = renderHook(() => useCacheInvalidation({
      enableRealTimeStats: true,
      statsUpdateInterval: 100
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.cacheStats).toBeDefined();
  });
});

describe('useAutoCacheInvalidation Hook', () => {
  test('should provide correct invalidation methods', () => {
    const { result } = renderHook(() => useAutoCacheInvalidation('project', {
      projectId: 'test-project-123',
      userId: 'test-user-456'
    }));

    expect(result.current.invalidateOnCreate).toBeInstanceOf(Function);
    expect(result.current.invalidateOnUpdate).toBeInstanceOf(Function);
    expect(result.current.invalidateOnDelete).toBeInstanceOf(Function);
  });

  test('should call invalidation with correct parameters', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response);

    const { result } = renderHook(() => useAutoCacheInvalidation('project', {
      projectId: 'test-project-123'
    }));

    await act(async () => {
      await result.current.invalidateOnUpdate();
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('useOptimisticCacheInvalidation Hook', () => {
  test('should invalidate cache after successful operation', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response);

    const { result } = renderHook(() => useOptimisticCacheInvalidation());

    const mockOperation = jest.fn().mockResolvedValue('success');

    await act(async () => {
      const operationResult = await result.current.withOptimisticInvalidation(
        mockOperation,
        {
          entity: 'project',
          projectId: 'test-project-123'
        }
      );
      expect(operationResult).toBe('success');
    });

    expect(mockOperation).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
  });

  test('should not invalidate cache if operation fails', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    
    const { result } = renderHook(() => useOptimisticCacheInvalidation());

    const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

    await act(async () => {
      try {
        await result.current.withOptimisticInvalidation(
          mockOperation,
          {
            entity: 'project',
            projectId: 'test-project-123'
          }
        );
      } catch (error) {
        expect(error.message).toBe('Operation failed');
      }
    });

    expect(mockOperation).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
