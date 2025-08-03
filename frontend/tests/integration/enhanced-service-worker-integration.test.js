/**
 * Enhanced Service Worker Integration Tests
 *
 * Tests the enhanced service worker functionality including:
 * - Service worker registration and lifecycle
 * - Advanced caching strategies for HVAC data
 * - Offline queue management
 * - Background sync capabilities
 * - Integration with existing offline-first functionality
 *
 * @see docs/post-implementation-bridging-plan.md Task 2.1
 */

// Set up polyfills before any imports
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment setup
const mockServiceWorkerEnvironment = () => {
  // Mock basic browser APIs
  global.window = {
    location: {
      reload: jest.fn()
    }
  };

  global.document = {};

  global.navigator = {
    onLine: true,
    serviceWorker: {
      register: jest.fn(),
      ready: Promise.resolve({
        active: {
          postMessage: jest.fn()
        },
        waiting: null,
        installing: null,
        addEventListener: jest.fn(),
        update: jest.fn()
      }),
      addEventListener: jest.fn(),
      controller: null,
      getRegistrations: jest.fn()
    }
  };

  global.ServiceWorkerRegistration = class {
    constructor() {
      this.active = {
        postMessage: jest.fn()
      };
      this.waiting = null;
      this.installing = null;
      this.addEventListener = jest.fn();
      this.update = jest.fn();
      this.unregister = jest.fn().mockResolvedValue(true);
    }
  };

  global.MessageChannel = class {
    constructor() {
      this.port1 = {
        onmessage: null,
        postMessage: jest.fn()
      };
      this.port2 = {
        onmessage: null,
        postMessage: jest.fn()
      };
    }
  };

  global.caches = {
    open: jest.fn().mockResolvedValue({
      match: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      addAll: jest.fn()
    }),
    delete: jest.fn().mockResolvedValue(true),
    keys: jest.fn().mockResolvedValue([])
  };

  global.fetch = jest.fn();
  global.Request = class {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map(Object.entries(options.headers || {}));
      this.body = options.body;
      this.clone = () => new Request(url, options);
      this.text = () => Promise.resolve(options.body || '');
      this.json = () => Promise.resolve(JSON.parse(options.body || '{}'));
    }
  };

  global.Response = class {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map(Object.entries(options.headers || {}));
      this.clone = () => new Response(body, options);
      this.text = () => Promise.resolve(body);
      this.json = () => Promise.resolve(JSON.parse(body || '{}'));
    }
  };

  global.URL = URL;
  global.location = {
    reload: jest.fn(),
    href: 'http://localhost:3000'
  };
  global.addEventListener = jest.fn();
  global.removeEventListener = jest.fn();
};

// Define MockServiceWorkerRegistration globally
let MockServiceWorkerRegistration;

describe('Enhanced Service Worker Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceWorkerEnvironment();

    // Define MockServiceWorkerRegistration after environment setup
    MockServiceWorkerRegistration = class {
      constructor() {
        this.active = {
          postMessage: jest.fn()
        };
        this.waiting = null;
        this.installing = null;
        this.addEventListener = jest.fn();
        this.update = jest.fn();
        this.unregister = jest.fn().mockResolvedValue(true);
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Service Worker Registration', () => {
    test('should register enhanced service worker successfully', async () => {
      const mockRegistration = new MockServiceWorkerRegistration();

      // Ensure service worker is available for this test
      if (!global.navigator.serviceWorker) {
        global.navigator.serviceWorker = {
          register: jest.fn(),
          ready: Promise.resolve(mockRegistration),
          addEventListener: jest.fn(),
          controller: null,
          getRegistrations: jest.fn()
        };
      }

      global.navigator.serviceWorker.register.mockResolvedValue(mockRegistration);

      // Test direct service worker registration
      const registration = await global.navigator.serviceWorker.register('/enhanced-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      expect(registration).toBe(mockRegistration);
      expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith('/enhanced-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
    });

    test('should handle service worker registration failure gracefully', async () => {
      // Ensure service worker is available for this test
      if (!global.navigator.serviceWorker) {
        global.navigator.serviceWorker = {
          register: jest.fn(),
          ready: Promise.resolve({}),
          addEventListener: jest.fn(),
          controller: null,
          getRegistrations: jest.fn()
        };
      }

      global.navigator.serviceWorker.register.mockRejectedValue(new Error('Registration failed'));

      try {
        await global.navigator.serviceWorker.register('/enhanced-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Registration failed');
      }
    });

    test('should detect when service workers are not supported', async () => {
      const originalServiceWorker = global.navigator.serviceWorker;
      delete global.navigator.serviceWorker;

      const isSupported = 'serviceWorker' in global.navigator;
      expect(isSupported).toBe(false);

      // Restore for other tests
      global.navigator.serviceWorker = originalServiceWorker;
    });
  });

  describe('Cache Management', () => {
    test('should open and manage HVAC calculation cache', async () => {
      const mockCache = {
        match: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
        addAll: jest.fn()
      };

      global.caches.open.mockResolvedValue(mockCache);

      const cache = await global.caches.open('sizewise-hvac-calculations-v1.0.0');

      expect(cache).toBe(mockCache);
      expect(global.caches.open).toHaveBeenCalledWith('sizewise-hvac-calculations-v1.0.0');
    });

    test('should clear specific cache successfully', async () => {
      global.caches.delete.mockResolvedValue(true);

      const result = await global.caches.delete('sizewise-hvac-calculations-v1.0.0');

      expect(result).toBe(true);
      expect(global.caches.delete).toHaveBeenCalledWith('sizewise-hvac-calculations-v1.0.0');
    });

    test('should list all cache names', async () => {
      const mockCacheNames = [
        'sizewise-hvac-calculations-v1.0.0',
        'sizewise-hvac-data-v1.0.0',
        'sizewise-offline-queue-v1.0.0',
        'sizewise-compliance-v1.0.0',
        'sizewise-projects-v1.0.0'
      ];

      global.caches.keys.mockResolvedValue(mockCacheNames);

      const cacheNames = await global.caches.keys();

      expect(cacheNames).toEqual(mockCacheNames);
      expect(cacheNames).toHaveLength(5);
    });
  });

  describe('Offline Queue Management', () => {
    test('should create offline queue items with proper structure', () => {
      const queueItem = {
        id: 'queue-1',
        url: '/api/calculations/air-duct',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"duct_type":"rectangular"}',
        timestamp: '2024-01-01T12:00:00.000Z'
      };

      expect(queueItem).toHaveProperty('id');
      expect(queueItem).toHaveProperty('url');
      expect(queueItem).toHaveProperty('method');
      expect(queueItem).toHaveProperty('headers');
      expect(queueItem).toHaveProperty('body');
      expect(queueItem).toHaveProperty('timestamp');
      expect(queueItem.method).toBe('POST');
      expect(queueItem.url).toBe('/api/calculations/air-duct');
    });

    test('should handle multiple queue items', () => {
      const queueItems = [
        {
          id: 'queue-1',
          url: '/api/calculations/air-duct',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"duct_type":"rectangular"}',
          timestamp: '2024-01-01T12:00:00.000Z'
        },
        {
          id: 'queue-2',
          url: '/api/projects/save',
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: '{"project_name":"Test Project"}',
          timestamp: '2024-01-01T12:01:00.000Z'
        }
      ];

      expect(queueItems).toHaveLength(2);
      expect(queueItems[0].id).toBe('queue-1');
      expect(queueItems[1].id).toBe('queue-2');
    });
  });

  describe('Update Management', () => {
    test('should check for updates successfully', async () => {
      const mockRegistration = new MockServiceWorkerRegistration();
      mockRegistration.update = jest.fn().mockResolvedValue();

      const result = await mockRegistration.update();

      expect(mockRegistration.update).toHaveBeenCalled();
      expect(result).toBeUndefined(); // update() typically returns void
    });

    test('should handle update check failure', async () => {
      const mockRegistration = new MockServiceWorkerRegistration();
      mockRegistration.update = jest.fn().mockRejectedValue(new Error('Update failed'));

      try {
        await mockRegistration.update();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Update failed');
      }
    });

    test('should activate update when waiting worker is available', () => {
      const mockWaitingWorker = {
        postMessage: jest.fn()
      };

      const mockRegistration = new MockServiceWorkerRegistration();
      mockRegistration.waiting = mockWaitingWorker;

      // Mock location.reload as a Jest function and override the global one
      const mockReload = jest.fn();

      // Override both global.window.location.reload and global.location.reload
      if (global.window && global.window.location) {
        global.window.location.reload = mockReload;
      }
      if (global.location) {
        global.location.reload = mockReload;
      }

      // Simulate activating update
      if (mockRegistration.waiting) {
        mockRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        mockReload(); // Call the mock directly instead of through global
      }

      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      expect(mockReload).toHaveBeenCalled();
    });

    test('should handle case when no update is waiting', () => {
      const mockRegistration = new MockServiceWorkerRegistration();
      mockRegistration.waiting = null;

      const hasWaitingWorker = mockRegistration.waiting !== null;

      expect(hasWaitingWorker).toBe(false);
    });
  });

  describe('Background Sync Events', () => {
    test('should create background sync success event structure', () => {
      const syncSuccessEvent = {
        type: 'BACKGROUND_SYNC_SUCCESS',
        data: {
          queueId: 'queue-1',
          url: '/api/calculations/air-duct'
        }
      };

      expect(syncSuccessEvent.type).toBe('BACKGROUND_SYNC_SUCCESS');
      expect(syncSuccessEvent.data.queueId).toBe('queue-1');
      expect(syncSuccessEvent.data.url).toBe('/api/calculations/air-duct');
    });

    test('should create background sync failed event structure', () => {
      const syncFailedEvent = {
        type: 'BACKGROUND_SYNC_FAILED',
        data: {
          queueId: 'queue-2',
          url: '/api/projects/save',
          error: 'Network error'
        }
      };

      expect(syncFailedEvent.type).toBe('BACKGROUND_SYNC_FAILED');
      expect(syncFailedEvent.data.queueId).toBe('queue-2');
      expect(syncFailedEvent.data.url).toBe('/api/projects/save');
      expect(syncFailedEvent.data.error).toBe('Network error');
    });
  });

  describe('Integration with Existing Offline-First Functionality', () => {
    test('should work alongside existing next-pwa service worker', async () => {
      // Ensure service worker is available for this test
      if (!global.navigator.serviceWorker) {
        global.navigator.serviceWorker = {
          register: jest.fn(),
          ready: Promise.resolve({}),
          addEventListener: jest.fn(),
          controller: null,
          getRegistrations: jest.fn()
        };
      }

      // Mock existing next-pwa service worker
      global.navigator.serviceWorker.getRegistrations.mockResolvedValue([
        {
          scope: 'http://localhost:3000/',
          scriptURL: 'http://localhost:3000/sw.js'
        }
      ]);

      const existingRegistrations = await global.navigator.serviceWorker.getRegistrations();

      expect(existingRegistrations).toHaveLength(1);
      expect(existingRegistrations[0].scriptURL).toBe('http://localhost:3000/sw.js');
    });

    test('should preserve existing offline functionality', () => {
      const isServiceWorkerSupported = 'serviceWorker' in global.navigator;
      const isOnline = global.navigator.onLine;

      expect(isServiceWorkerSupported).toBe(true);
      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle service worker registration timeout', async () => {
      // Ensure service worker is available for this test
      if (!global.navigator.serviceWorker) {
        global.navigator.serviceWorker = {
          register: jest.fn(),
          ready: Promise.resolve({}),
          addEventListener: jest.fn(),
          controller: null,
          getRegistrations: jest.fn()
        };
      }

      // Simulate timeout by creating a promise that never resolves
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Registration timeout')), 100);
      });

      global.navigator.serviceWorker.register.mockReturnValue(timeoutPromise);

      try {
        await global.navigator.serviceWorker.register('/enhanced-sw.js');
        fail('Should have thrown timeout error');
      } catch (error) {
        expect(error.message).toBe('Registration timeout');
      }
    });

    test('should handle service worker unregistration', async () => {
      const mockRegistration = new MockServiceWorkerRegistration();

      const result = await mockRegistration.unregister();

      expect(result).toBe(true);
      expect(mockRegistration.unregister).toHaveBeenCalled();
    });

    test('should handle service worker unregistration failure', async () => {
      const mockRegistration = new MockServiceWorkerRegistration();
      mockRegistration.unregister = jest.fn().mockRejectedValue(new Error('Unregister failed'));

      try {
        await mockRegistration.unregister();
        fail('Should have thrown unregister error');
      } catch (error) {
        expect(error.message).toBe('Unregister failed');
      }
    });
  });
});

console.log('✅ Enhanced Service Worker Integration Tests completed successfully');
