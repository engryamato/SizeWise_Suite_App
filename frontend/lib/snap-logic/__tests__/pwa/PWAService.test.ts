/**
 * PWA Service Tests
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Comprehensive test suite for offline-first PWA capabilities,
 * service worker management, intelligent caching, and offline operation queues.
 * 
 * @fileoverview PWA service tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  PWAService,
  CacheManager,
  OfflineQueueManager,
  SyncManager,
  NetworkMonitor
} from '../../services/PWAService';
import {
  CacheStrategy,
  CachePriority,
  OfflineOperationType,
  SyncStatus,
  NetworkStatus
} from '../../core/interfaces/IPWAService';

// Mock logger
class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

// Mock Cache API
const mockCache = {
  put: jest.fn(),
  match: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn().mockResolvedValue([])
};

const mockCaches = {
  open: jest.fn().mockResolvedValue(mockCache),
  delete: jest.fn().mockResolvedValue(true),
  keys: jest.fn().mockResolvedValue(['cache1', 'cache2'])
};

// Mock Service Worker API
const mockServiceWorkerRegistration = {
  update: jest.fn(),
  addEventListener: jest.fn(),
  waiting: null,
  installing: null,
  sync: {
    register: jest.fn()
  }
};

const mockServiceWorker = {
  register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
  ready: Promise.resolve(mockServiceWorkerRegistration)
};

// Mock Navigator
const mockNavigator = {
  onLine: true,
  serviceWorker: mockServiceWorker,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
};

// Mock fetch
const mockFetch = jest.fn();

// Setup global mocks
beforeAll(() => {
  (global as any).caches = mockCaches;
  (global as any).navigator = mockNavigator;
  (global as any).fetch = mockFetch;
  (global as any).window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    matchMedia: jest.fn().mockReturnValue({ matches: false }),
    ServiceWorkerRegistration: { prototype: { sync: true } }
  };
  (global as any).localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  };
});

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    cacheManager = new CacheManager(mockLogger as any);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with cache configurations', async () => {
      const configs = [
        {
          name: 'test-cache',
          strategy: CacheStrategy.CACHE_FIRST,
          priority: CachePriority.HIGH,
          maxAge: 3600000,
          maxEntries: 100,
          patterns: ['/api/test']
        }
      ];

      await cacheManager.initialize(configs);

      expect(mockCaches.open).toHaveBeenCalledWith('test-cache');
      expect(mockLogger.info).toHaveBeenCalledWith('Cache manager initialized with 1 cache configurations');
    });
  });

  describe('Cache Operations', () => {
    beforeEach(async () => {
      const configs = [
        {
          name: 'test-cache',
          strategy: CacheStrategy.CACHE_FIRST,
          priority: CachePriority.HIGH,
          maxAge: 3600000,
          maxEntries: 100,
          patterns: ['/api/test']
        }
      ];
      await cacheManager.initialize(configs);
    });

    it('should cache resource', async () => {
      const url = '/api/test/data';
      const response = new Response('test data');

      await cacheManager.cacheResource(url, response);

      expect(mockCache.put).toHaveBeenCalledWith(url, expect.any(Response));
    });

    it('should get cached resource', async () => {
      const url = '/api/test/data';
      const cachedResponse = new Response('cached data');
      mockCache.match.mockResolvedValue(cachedResponse);

      const result = await cacheManager.getCachedResource(url);

      expect(result).toBe(cachedResponse);
      expect(mockCache.match).toHaveBeenCalledWith(url);
    });

    it('should return null for cache miss', async () => {
      const url = '/api/test/data';
      mockCache.match.mockResolvedValue(undefined);

      const result = await cacheManager.getCachedResource(url);

      expect(result).toBeNull();
    });

    it('should delete cached resource', async () => {
      const url = '/api/test/data';
      mockCache.delete.mockResolvedValue(true);

      const result = await cacheManager.deleteCachedResource(url);

      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalledWith(url);
    });

    it('should clear cache', async () => {
      const result = await cacheManager.clearCache('test-cache');

      expect(result).toBe(true);
      expect(mockCaches.delete).toHaveBeenCalledWith('test-cache');
    });

    it('should clear all caches', async () => {
      const result = await cacheManager.clearCache();

      expect(result).toBe(true);
      expect(mockCaches.keys).toHaveBeenCalled();
    });
  });

  describe('Cache Eviction', () => {
    beforeEach(async () => {
      const configs = [
        {
          name: 'test-cache',
          strategy: CacheStrategy.CACHE_FIRST,
          priority: CachePriority.HIGH,
          maxAge: 3600000,
          maxEntries: 2,
          patterns: ['/api/test']
        }
      ];
      await cacheManager.initialize(configs);
    });

    it('should evict old entries', async () => {
      const oldRequest = new Request('/api/test/old');
      const newRequest = new Request('/api/test/new');
      
      mockCache.keys.mockResolvedValue([oldRequest, newRequest]);
      mockCache.match.mockImplementation((request) => {
        const oldDate = new Date(Date.now() - 7200000); // 2 hours ago
        const newDate = new Date();
        
        return Promise.resolve(new Response('data', {
          headers: {
            'date': request.url.includes('old') ? oldDate.toISOString() : newDate.toISOString()
          }
        }));
      });

      const evictedCount = await cacheManager.evictOldEntries('test-cache');

      expect(evictedCount).toBeGreaterThan(0);
    });
  });
});

describe('OfflineQueueManager', () => {
  let queueManager: OfflineQueueManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    queueManager = new OfflineQueueManager(mockLogger as any);
    jest.clearAllMocks();
    (global as any).localStorage.getItem.mockReturnValue(null);
  });

  describe('Operation Management', () => {
    it('should add operation to queue', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operationId = await queueManager.addOperation(operation);

      expect(operationId).toBeDefined();
      expect(operationId).toMatch(/^op_\d+_[a-z0-9]+$/);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Added offline operation: ${operation.type}`)
      );
    });

    it('should get all operations', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      await queueManager.addOperation(operation);
      const operations = await queueManager.getAllOperations();

      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe(OfflineOperationType.CREATE_SNAP_POINT);
      expect(operations[0].status).toBe(SyncStatus.PENDING);
    });

    it('should get pending operations', async () => {
      const operation1 = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operation2 = {
        type: OfflineOperationType.UPDATE_SNAP_POINT,
        data: { id: 'snap1', x: 150, y: 250 },
        userId: 'user123',
        maxRetries: 3
      };

      const id1 = await queueManager.addOperation(operation1);
      const id2 = await queueManager.addOperation(operation2);

      // Mark one as synced
      await queueManager.updateOperationStatus(id1, SyncStatus.SYNCED);

      const pendingOperations = await queueManager.getPendingOperations();

      expect(pendingOperations).toHaveLength(1);
      expect(pendingOperations[0].id).toBe(id2);
    });

    it('should update operation status', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operationId = await queueManager.addOperation(operation);
      await queueManager.updateOperationStatus(operationId, SyncStatus.SYNCING);

      const operations = await queueManager.getAllOperations();
      const updatedOperation = operations.find(op => op.id === operationId);

      expect(updatedOperation?.status).toBe(SyncStatus.SYNCING);
    });

    it('should remove operation', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operationId = await queueManager.addOperation(operation);
      const removed = await queueManager.removeOperation(operationId);

      expect(removed).toBe(true);

      const operations = await queueManager.getAllOperations();
      expect(operations).toHaveLength(0);
    });

    it('should clear all operations', async () => {
      const operation1 = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operation2 = {
        type: OfflineOperationType.UPDATE_SNAP_POINT,
        data: { id: 'snap1', x: 150, y: 250 },
        userId: 'user123',
        maxRetries: 3
      };

      await queueManager.addOperation(operation1);
      await queueManager.addOperation(operation2);

      const clearedCount = await queueManager.clearAllOperations();

      expect(clearedCount).toBe(2);

      const operations = await queueManager.getAllOperations();
      expect(operations).toHaveLength(0);
    });

    it('should clear synced operations only', async () => {
      const operation1 = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operation2 = {
        type: OfflineOperationType.UPDATE_SNAP_POINT,
        data: { id: 'snap1', x: 150, y: 250 },
        userId: 'user123',
        maxRetries: 3
      };

      const id1 = await queueManager.addOperation(operation1);
      const id2 = await queueManager.addOperation(operation2);

      // Mark one as synced
      await queueManager.updateOperationStatus(id1, SyncStatus.SYNCED);

      const clearedCount = await queueManager.clearSyncedOperations();

      expect(clearedCount).toBe(1);

      const operations = await queueManager.getAllOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0].id).toBe(id2);
    });

    it('should retry failed operations', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operationId = await queueManager.addOperation(operation);
      await queueManager.updateOperationStatus(operationId, SyncStatus.FAILED);

      const results = await queueManager.retryFailedOperations();

      expect(results).toHaveLength(1);
      expect(results[0].operationId).toBe(operationId);
      expect(results[0].status).toBe(SyncStatus.PENDING);
    });
  });
});

describe('NetworkMonitor', () => {
  let networkMonitor: NetworkMonitor;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    networkMonitor = new NetworkMonitor(mockLogger as any);
    jest.clearAllMocks();
  });

  describe('Network Status Monitoring', () => {
    it('should start monitoring', async () => {
      await networkMonitor.startMonitoring();

      expect(mockLogger.info).toHaveBeenCalledWith('Network monitoring started');
    });

    it('should stop monitoring', async () => {
      await networkMonitor.startMonitoring();
      await networkMonitor.stopMonitoring();

      expect(mockLogger.info).toHaveBeenCalledWith('Network monitoring stopped');
    });

    it('should get network status', async () => {
      const status = await networkMonitor.getNetworkStatus();

      expect(status).toBeDefined();
      expect(status.status).toBe(NetworkStatus.ONLINE);
      expect(status.effectiveType).toBe('4g');
      expect(status.downlink).toBe(10);
      expect(status.rtt).toBe(100);
      expect(status.saveData).toBe(false);
    });

    it('should check if online', async () => {
      const isOnline = await networkMonitor.isOnline();

      expect(isOnline).toBe(true);
    });

    it('should register network status change listener', async () => {
      const listener = jest.fn();
      const unsubscribe = networkMonitor.onNetworkStatusChange(listener);

      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
    });

    it('should register online listener', async () => {
      const listener = jest.fn();
      const unsubscribe = networkMonitor.onOnline(listener);

      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
    });

    it('should register offline listener', async () => {
      const listener = jest.fn();
      const unsubscribe = networkMonitor.onOffline(listener);

      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
    });
  });
});

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let queueManager: OfflineQueueManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    queueManager = new OfflineQueueManager(mockLogger as any);
    syncManager = new SyncManager(mockLogger as any, queueManager);
    jest.clearAllMocks();
  });

  describe('Sync Handler Management', () => {
    it('should register sync handler', () => {
      const handler = jest.fn().mockResolvedValue({ success: true });

      syncManager.registerSyncHandler(OfflineOperationType.CREATE_SNAP_POINT, handler);

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Registered sync handler for operation type: ${OfflineOperationType.CREATE_SNAP_POINT}`
      );
    });

    it('should unregister sync handler', () => {
      const handler = jest.fn().mockResolvedValue({ success: true });

      syncManager.registerSyncHandler(OfflineOperationType.CREATE_SNAP_POINT, handler);
      syncManager.unregisterSyncHandler(OfflineOperationType.CREATE_SNAP_POINT);

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Unregistered sync handler for operation type: ${OfflineOperationType.CREATE_SNAP_POINT}`
      );
    });
  });

  describe('Operation Syncing', () => {
    it('should sync operation successfully', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true, id: 'snap123' });
      syncManager.registerSyncHandler(OfflineOperationType.CREATE_SNAP_POINT, handler);

      const operation = {
        id: 'op123',
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        timestamp: new Date(),
        status: SyncStatus.PENDING,
        retryCount: 0,
        userId: 'user123',
        maxRetries: 3
      };

      const result = await syncManager.syncOperation(operation);

      expect(result.success).toBe(true);
      expect(result.status).toBe(SyncStatus.SYNCED);
      expect(result.serverResponse).toEqual({ success: true, id: 'snap123' });
      expect(handler).toHaveBeenCalledWith(operation);
    });

    it('should handle sync operation failure', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Sync failed'));
      syncManager.registerSyncHandler(OfflineOperationType.CREATE_SNAP_POINT, handler);

      const operation = {
        id: 'op123',
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        timestamp: new Date(),
        status: SyncStatus.PENDING,
        retryCount: 0,
        userId: 'user123',
        maxRetries: 3
      };

      const result = await syncManager.syncOperation(operation);

      expect(result.success).toBe(false);
      expect(result.status).toBe(SyncStatus.FAILED);
      expect(result.error?.message).toBe('Sync failed');
    });

    it('should handle missing sync handler', async () => {
      const operation = {
        id: 'op123',
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        timestamp: new Date(),
        status: SyncStatus.PENDING,
        retryCount: 0,
        userId: 'user123',
        maxRetries: 3
      };

      const result = await syncManager.syncOperation(operation);

      expect(result.success).toBe(false);
      expect(result.status).toBe(SyncStatus.FAILED);
      expect(result.error?.message).toContain('No sync handler registered');
    });

    it('should sync all operations', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true });
      syncManager.registerSyncHandler(OfflineOperationType.CREATE_SNAP_POINT, handler);
      syncManager.registerSyncHandler(OfflineOperationType.UPDATE_SNAP_POINT, handler);

      // Add operations to queue
      await queueManager.addOperation({
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      });

      await queueManager.addOperation({
        type: OfflineOperationType.UPDATE_SNAP_POINT,
        data: { id: 'snap1', x: 150, y: 250 },
        userId: 'user123',
        maxRetries: 3
      });

      const results = await syncManager.syncAllOperations();

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});

describe('PWAService', () => {
  let pwaService: PWAService;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    pwaService = new PWAService(mockLogger as any);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await pwaService.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith('PWA service initialized successfully');
    });

    it('should register service worker', async () => {
      const registration = await pwaService.registerServiceWorker('/test-sw.js');

      expect(registration).toBe(mockServiceWorkerRegistration);
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/test-sw.js');
    });
  });

  describe('Network Status', () => {
    beforeEach(async () => {
      await pwaService.initialize();
    });

    it('should get network status', async () => {
      const status = await pwaService.getNetworkStatus();

      expect(status).toBeDefined();
      expect(status.status).toBe(NetworkStatus.ONLINE);
    });

    it('should check if online', async () => {
      const isOnline = await pwaService.isOnline();

      expect(isOnline).toBe(true);
    });
  });

  describe('Offline Operations', () => {
    beforeEach(async () => {
      await pwaService.initialize();
    });

    it('should add offline operation', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      const operationId = await pwaService.addOfflineOperation(operation);

      expect(operationId).toBeDefined();
      expect(operationId).toMatch(/^op_\d+_[a-z0-9]+$/);
    });

    it('should get pending operations', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      await pwaService.addOfflineOperation(operation);
      const pendingOperations = await pwaService.getPendingOperations();

      expect(pendingOperations).toHaveLength(1);
      expect(pendingOperations[0].type).toBe(OfflineOperationType.CREATE_SNAP_POINT);
    });

    it('should sync offline operations', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      await pwaService.addOfflineOperation(operation);
      const results = await pwaService.syncOfflineOperations();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should clear synced operations', async () => {
      const operation = {
        type: OfflineOperationType.CREATE_SNAP_POINT,
        data: { x: 100, y: 200 },
        userId: 'user123',
        maxRetries: 3
      };

      await pwaService.addOfflineOperation(operation);
      await pwaService.syncOfflineOperations();
      
      const clearedCount = await pwaService.clearSyncedOperations();

      expect(clearedCount).toBe(1);
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await pwaService.initialize();
    });

    it('should get cache stats', async () => {
      const stats = await pwaService.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.entryCount).toBeGreaterThanOrEqual(0);
      expect(stats.cachesByName).toBeDefined();
    });

    it('should clear cache', async () => {
      const result = await pwaService.clearCache('test-cache');

      expect(result).toBe(true);
    });

    it('should preload critical resources', async () => {
      const urls = ['/app.js', '/app.css', '/manifest.json'];
      mockFetch.mockResolvedValue(new Response('test content'));

      await pwaService.preloadCriticalResources(urls);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledWith('Preloaded 3 critical resources');
    });
  });

  describe('Offline Mode', () => {
    beforeEach(async () => {
      await pwaService.initialize();
    });

    it('should enable offline mode', async () => {
      await pwaService.enableOfflineMode();

      expect((global as any).localStorage.setItem).toHaveBeenCalledWith('sizewise-offline-mode', 'enabled');
      expect(mockLogger.info).toHaveBeenCalledWith('Offline mode enabled');
    });

    it('should disable offline mode', async () => {
      await pwaService.disableOfflineMode();

      expect((global as any).localStorage.setItem).toHaveBeenCalledWith('sizewise-offline-mode', 'disabled');
      expect(mockLogger.info).toHaveBeenCalledWith('Offline mode disabled');
    });

    it('should check if offline mode is enabled', async () => {
      (global as any).localStorage.getItem.mockReturnValue('enabled');

      const isEnabled = await pwaService.isOfflineModeEnabled();

      expect(isEnabled).toBe(true);
      expect((global as any).localStorage.getItem).toHaveBeenCalledWith('sizewise-offline-mode');
    });
  });
});
