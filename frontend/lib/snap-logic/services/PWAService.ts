/**
 * PWA Service Implementation
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Offline-first PWA service implementing service worker management,
 * intelligent caching strategies, offline operation queues, and data synchronization.
 * 
 * @fileoverview PWA service implementation
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  IPWAService,
  ICacheManager,
  IOfflineQueueManager,
  ISyncManager,
  INetworkMonitor,
  PWAConfig,
  CacheConfig,
  CacheStrategy,
  CachePriority,
  OfflineOperation,
  OfflineOperationType,
  SyncStatus,
  SyncResult,
  NetworkStatus,
  NetworkInfo,
  CacheStats,
  PWAInstallPrompt,
  ServiceWorkerUpdate,
  BackgroundSyncConfig
} from '../core/interfaces/IPWAService';

import { ILogger } from '../core/interfaces';

/**
 * Cache Manager Implementation
 */
export class CacheManager implements ICacheManager {
  private cacheConfigs: Map<string, CacheConfig> = new Map();
  private cacheStats: Map<string, { hits: number; misses: number }> = new Map();

  constructor(private logger: ILogger) {}

  async initialize(configs: CacheConfig[]): Promise<void> {
    for (const config of configs) {
      this.cacheConfigs.set(config.name, config);
      this.cacheStats.set(config.name, { hits: 0, misses: 0 });
      
      // Create cache if it doesn't exist
      await caches.open(config.name);
    }
    
    this.logger.info(`Cache manager initialized with ${configs.length} cache configurations`);
  }

  async cacheResource(url: string, response: Response, cacheName?: string): Promise<void> {
    const cache = await this.getCacheForUrl(url, cacheName);
    if (cache) {
      await cache.put(url, response.clone());
      this.logger.debug(`Cached resource: ${url} in cache: default`);
    }
  }

  async getCachedResource(url: string, cacheName?: string): Promise<Response | null> {
    const cache = await this.getCacheForUrl(url, cacheName);
    if (cache) {
      const response = await cache.match(url);
      if (response) {
        this.recordCacheHit(cache.name || 'default');
        return response;
      } else {
        this.recordCacheMiss(cache.name || 'default');
      }
    }
    return null;
  }

  async deleteCachedResource(url: string, cacheName?: string): Promise<boolean> {
    const cache = await this.getCacheForUrl(url, cacheName);
    if (cache) {
      return await cache.delete(url);
    }
    return false;
  }

  async clearCache(cacheName?: string): Promise<boolean> {
    if (cacheName) {
      return await caches.delete(cacheName);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      const results = await Promise.all(cacheNames.map(name => caches.delete(name)));
      return results.every(result => result);
    }
  }

  async getCacheSize(cacheName?: string): Promise<number> {
    let totalSize = 0;
    
    if (cacheName) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    } else {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        totalSize += await this.getCacheSize(name);
      }
    }
    
    return totalSize;
  }

  async evictOldEntries(cacheName?: string): Promise<number> {
    let evictedCount = 0;
    const now = Date.now();
    
    const cacheNames = cacheName ? [cacheName] : await caches.keys();
    
    for (const name of cacheNames) {
      const config = this.cacheConfigs.get(name);
      if (!config) continue;
      
      const cache = await caches.open(name);
      const requests = await cache.keys();
      
      // Sort by date and keep only the most recent entries
      const requestsWithDates = await Promise.all(
        requests.map(async (request) => {
          const response = await cache.match(request);
          const dateHeader = response?.headers.get('date');
          const date = dateHeader ? new Date(dateHeader).getTime() : 0;
          return { request, date };
        })
      );
      
      requestsWithDates.sort((a, b) => b.date - a.date);
      
      // Evict old entries based on maxAge
      for (const { request, date } of requestsWithDates) {
        if (now - date > config.maxAge) {
          await cache.delete(request);
          evictedCount++;
        }
      }
      
      // Evict excess entries based on maxEntries
      if (requestsWithDates.length > config.maxEntries) {
        const excessEntries = requestsWithDates.slice(config.maxEntries);
        for (const { request } of excessEntries) {
          await cache.delete(request);
          evictedCount++;
        }
      }
    }
    
    this.logger.info(`Evicted ${evictedCount} old cache entries`);
    return evictedCount;
  }

  async updateCacheStrategy(cacheName: string, strategy: CacheStrategy): Promise<void> {
    const config = this.cacheConfigs.get(cacheName);
    if (config) {
      config.strategy = strategy;
      this.cacheConfigs.set(cacheName, config);
    }
  }

  private async getCacheForUrl(url: string, cacheName?: string): Promise<Cache | null> {
    if (cacheName) {
      return await caches.open(cacheName);
    }
    
    // Find cache based on URL patterns
    for (const [name, config] of this.cacheConfigs) {
      if (config.patterns.some(pattern => new RegExp(pattern).test(url))) {
        return await caches.open(name);
      }
    }
    
    return null;
  }

  private recordCacheHit(cacheName: string): void {
    const stats = this.cacheStats.get(cacheName);
    if (stats) {
      stats.hits++;
    }
  }

  private recordCacheMiss(cacheName: string): void {
    const stats = this.cacheStats.get(cacheName);
    if (stats) {
      stats.misses++;
    }
  }
}

/**
 * Offline Queue Manager Implementation
 */
export class OfflineQueueManager implements IOfflineQueueManager {
  private readonly STORAGE_KEY = 'sizewise-offline-queue';
  private operations: Map<string, OfflineOperation> = new Map();

  constructor(private logger: ILogger) {
    this.loadOperationsFromStorage();
  }

  async addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const id = this.generateOperationId();
    const fullOperation: OfflineOperation = {
      ...operation,
      id,
      timestamp: new Date(),
      status: SyncStatus.PENDING,
      retryCount: 0
    };

    this.operations.set(id, fullOperation);
    await this.saveOperationsToStorage();
    
    this.logger.info(`Added offline operation: ${operation.type} (${id})`);
    return id;
  }

  async getAllOperations(): Promise<OfflineOperation[]> {
    return Array.from(this.operations.values());
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    return Array.from(this.operations.values()).filter(op => 
      op.status === SyncStatus.PENDING || op.status === SyncStatus.FAILED
    );
  }

  async updateOperationStatus(operationId: string, status: SyncStatus, error?: Error): Promise<void> {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = status;
      if (error) {
        operation.metadata = { ...operation.metadata, error: error.message };
      }
      if (status === SyncStatus.FAILED) {
        operation.retryCount++;
      }
      
      this.operations.set(operationId, operation);
      await this.saveOperationsToStorage();
      
      this.logger.info(`Updated operation ${operationId} status to ${status}`);
    }
  }

  async removeOperation(operationId: string): Promise<boolean> {
    const deleted = this.operations.delete(operationId);
    if (deleted) {
      await this.saveOperationsToStorage();
      this.logger.info(`Removed operation: ${operationId}`);
    }
    return deleted;
  }

  async clearAllOperations(): Promise<number> {
    const count = this.operations.size;
    this.operations.clear();
    await this.saveOperationsToStorage();
    this.logger.info(`Cleared all ${count} operations`);
    return count;
  }

  async clearSyncedOperations(): Promise<number> {
    const syncedOperations = Array.from(this.operations.values()).filter(op => 
      op.status === SyncStatus.SYNCED
    );
    
    for (const operation of syncedOperations) {
      this.operations.delete(operation.id);
    }
    
    await this.saveOperationsToStorage();
    this.logger.info(`Cleared ${syncedOperations.length} synced operations`);
    return syncedOperations.length;
  }

  async retryFailedOperations(): Promise<SyncResult[]> {
    const failedOperations = Array.from(this.operations.values()).filter(op => 
      op.status === SyncStatus.FAILED && op.retryCount < op.maxRetries
    );

    const results: SyncResult[] = [];
    for (const operation of failedOperations) {
      operation.status = SyncStatus.PENDING;
      this.operations.set(operation.id, operation);
      
      results.push({
        operationId: operation.id,
        success: true,
        status: SyncStatus.PENDING,
        timestamp: new Date()
      });
    }

    await this.saveOperationsToStorage();
    this.logger.info(`Retrying ${failedOperations.length} failed operations`);
    return results;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadOperationsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const operations = JSON.parse(stored) as OfflineOperation[];
        for (const operation of operations) {
          // Convert timestamp string back to Date
          operation.timestamp = new Date(operation.timestamp);
          this.operations.set(operation.id, operation);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load operations from storage', error as Error);
    }
  }

  private async saveOperationsToStorage(): Promise<void> {
    try {
      const operations = Array.from(this.operations.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
      this.logger.error('Failed to save operations to storage', error as Error);
    }
  }
}

/**
 * Network Monitor Implementation
 */
export class NetworkMonitor implements INetworkMonitor {
  private isMonitoring = false;
  private networkStatusListeners: ((status: NetworkInfo) => void)[] = [];
  private onlineListeners: (() => void)[] = [];
  private offlineListeners: (() => void)[] = [];
  private currentStatus: NetworkInfo;

  constructor(private logger: ILogger) {
    this.currentStatus = {
      status: navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE,
      effectiveType: (navigator as any).connection?.effectiveType || '4g',
      downlink: (navigator as any).connection?.downlink || 10,
      rtt: (navigator as any).connection?.rtt || 100,
      saveData: (navigator as any).connection?.saveData || false
    };
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen for connection changes
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', this.handleConnectionChange);
    }

    // Periodic network quality check
    this.startNetworkQualityCheck();

    this.logger.info('Network monitoring started');
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if ((navigator as any).connection) {
      (navigator as any).connection.removeEventListener('change', this.handleConnectionChange);
    }

    this.logger.info('Network monitoring stopped');
  }

  async getNetworkStatus(): Promise<NetworkInfo> {
    return { ...this.currentStatus };
  }

  async isOnline(): Promise<boolean> {
    return this.currentStatus.status === NetworkStatus.ONLINE;
  }

  onNetworkStatusChange(listener: (status: NetworkInfo) => void): () => void {
    this.networkStatusListeners.push(listener);
    return () => {
      const index = this.networkStatusListeners.indexOf(listener);
      if (index > -1) {
        this.networkStatusListeners.splice(index, 1);
      }
    };
  }

  onOnline(listener: () => void): () => void {
    this.onlineListeners.push(listener);
    return () => {
      const index = this.onlineListeners.indexOf(listener);
      if (index > -1) {
        this.onlineListeners.splice(index, 1);
      }
    };
  }

  onOffline(listener: () => void): () => void {
    this.offlineListeners.push(listener);
    return () => {
      const index = this.offlineListeners.indexOf(listener);
      if (index > -1) {
        this.offlineListeners.splice(index, 1);
      }
    };
  }

  private handleOnline = (): void => {
    const wasOffline = this.currentStatus.status === NetworkStatus.OFFLINE;
    this.updateNetworkStatus();
    
    if (wasOffline) {
      this.onlineListeners.forEach(listener => listener());
      this.logger.info('Network status changed to online');
    }
  };

  private handleOffline = (): void => {
    const wasOnline = this.currentStatus.status === NetworkStatus.ONLINE;
    this.currentStatus.status = NetworkStatus.OFFLINE;
    this.notifyStatusChange();
    
    if (wasOnline) {
      this.offlineListeners.forEach(listener => listener());
      this.logger.info('Network status changed to offline');
    }
  };

  private handleConnectionChange = (): void => {
    this.updateNetworkStatus();
  };

  private updateNetworkStatus(): void {
    const connection = (navigator as any).connection;
    
    this.currentStatus = {
      status: navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE,
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    };

    // Determine if connection is slow
    if (this.currentStatus.status === NetworkStatus.ONLINE) {
      if (this.currentStatus.rtt > 300 || this.currentStatus.downlink < 1) {
        this.currentStatus.status = NetworkStatus.SLOW;
      }
    }

    this.notifyStatusChange();
  }

  private notifyStatusChange(): void {
    this.networkStatusListeners.forEach(listener => listener(this.currentStatus));
  }

  private startNetworkQualityCheck(): void {
    // Check network quality every 30 seconds
    setInterval(() => {
      if (this.isMonitoring && navigator.onLine) {
        this.performNetworkQualityCheck();
      }
    }, 30000);
  }

  private async performNetworkQualityCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = Date.now();
      
      const rtt = endTime - startTime;
      this.currentStatus.rtt = rtt;
      
      // Update status based on response time
      if (rtt > 1000) {
        this.currentStatus.status = NetworkStatus.SLOW;
      } else if (navigator.onLine) {
        this.currentStatus.status = NetworkStatus.ONLINE;
      }
      
      this.notifyStatusChange();
    } catch (error) {
      // Network check failed, might be offline
      if (navigator.onLine) {
        this.currentStatus.status = NetworkStatus.SLOW;
        this.notifyStatusChange();
      }
    }
  }
}

/**
 * Sync Manager Implementation
 */
export class SyncManager implements ISyncManager {
  private syncHandlers: Map<OfflineOperationType, (operation: OfflineOperation) => Promise<any>> = new Map();

  constructor(
    private logger: ILogger,
    private queueManager: IOfflineQueueManager
  ) {}

  async syncOperation(operation: OfflineOperation): Promise<SyncResult> {
    const handler = this.syncHandlers.get(operation.type);
    if (!handler) {
      const error = new Error(`No sync handler registered for operation type: ${operation.type}`);
      await this.queueManager.updateOperationStatus(operation.id, SyncStatus.FAILED, error);
      return {
        operationId: operation.id,
        success: false,
        status: SyncStatus.FAILED,
        error,
        timestamp: new Date()
      };
    }

    try {
      await this.queueManager.updateOperationStatus(operation.id, SyncStatus.SYNCING);

      const serverResponse = await handler(operation);

      await this.queueManager.updateOperationStatus(operation.id, SyncStatus.SYNCED);

      this.logger.info(`Successfully synced operation: ${operation.id}`);

      return {
        operationId: operation.id,
        success: true,
        status: SyncStatus.SYNCED,
        serverResponse,
        timestamp: new Date()
      };

    } catch (error) {
      await this.queueManager.updateOperationStatus(operation.id, SyncStatus.FAILED, error as Error);

      this.logger.error(`Failed to sync operation: ${operation.id}`, error as Error);

      return {
        operationId: operation.id,
        success: false,
        status: SyncStatus.FAILED,
        error: error as Error,
        timestamp: new Date()
      };
    }
  }

  async syncAllOperations(): Promise<SyncResult[]> {
    const pendingOperations = await this.queueManager.getPendingOperations();
    const results: SyncResult[] = [];

    for (const operation of pendingOperations) {
      const result = await this.syncOperation(operation);
      results.push(result);
    }

    this.logger.info(`Synced ${results.length} operations`);
    return results;
  }

  async handleSyncConflict(operation: OfflineOperation, serverData: any): Promise<SyncResult> {
    // Default conflict resolution: server wins
    await this.queueManager.updateOperationStatus(operation.id, SyncStatus.CONFLICT);

    return {
      operationId: operation.id,
      success: false,
      status: SyncStatus.CONFLICT,
      conflictData: serverData,
      timestamp: new Date()
    };
  }

  registerSyncHandler(type: OfflineOperationType, handler: (operation: OfflineOperation) => Promise<any>): void {
    this.syncHandlers.set(type, handler);
    this.logger.info(`Registered sync handler for operation type: ${type}`);
  }

  unregisterSyncHandler(type: OfflineOperationType): void {
    this.syncHandlers.delete(type);
    this.logger.info(`Unregistered sync handler for operation type: ${type}`);
  }
}

/**
 * Main PWA Service Implementation
 */
export class PWAService implements IPWAService {
  private config: PWAConfig;
  private cacheManager: ICacheManager;
  private queueManager: IOfflineQueueManager;
  private syncManager: ISyncManager;
  private networkMonitor: INetworkMonitor;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private installPromptEvent: any = null;

  constructor(private logger: ILogger) {
    this.cacheManager = new CacheManager(logger);
    this.queueManager = new OfflineQueueManager(logger);
    this.syncManager = new SyncManager(logger, this.queueManager);
    this.networkMonitor = new NetworkMonitor(logger);
  }

  async initialize(config?: PWAConfig): Promise<void> {
    try {
      this.config = config || this.getDefaultConfig();

      // Initialize cache manager
      await this.cacheManager.initialize(this.config.cacheConfigs);

      // Start network monitoring
      await this.networkMonitor.startMonitoring();

      // Register service worker
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker(this.config.serviceWorkerUrl);
      }

      // Setup install prompt listener
      this.setupInstallPromptListener();

      // Setup network status listeners
      this.setupNetworkListeners();

      // Register default sync handlers
      this.registerDefaultSyncHandlers();

      // Setup periodic sync
      this.setupPeriodicSync();

      this.logger.info('PWA service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PWA service', error as Error);
      throw error;
    }
  }

  async registerServiceWorker(scriptUrl: string = '/sw.js'): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(scriptUrl);

      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        this.logger.info('Service Worker update found');
      });

      this.logger.info('Service Worker registered successfully');
      return this.serviceWorkerRegistration;
    } catch (error) {
      this.logger.error('Service Worker registration failed', error as Error);
      throw error;
    }
  }

  async updateServiceWorker(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.update();
      this.logger.info('Service Worker update initiated');
    }
  }

  async getServiceWorkerUpdate(): Promise<ServiceWorkerUpdate> {
    if (!this.serviceWorkerRegistration) {
      return {
        available: false,
        installing: false,
        waiting: false,
        activate: async () => {},
        skip: async () => {}
      };
    }

    const waiting = !!this.serviceWorkerRegistration.waiting;
    const installing = !!this.serviceWorkerRegistration.installing;

    return {
      available: waiting || installing,
      installing,
      waiting,
      activate: async () => {
        if (this.serviceWorkerRegistration?.waiting) {
          this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      },
      skip: async () => {
        if (this.serviceWorkerRegistration?.waiting) {
          this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    };
  }

  async getInstallPrompt(): Promise<PWAInstallPrompt> {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;

    return {
      canInstall: !!this.installPromptEvent && !isInstalled,
      isInstalled,
      prompt: async () => {
        if (this.installPromptEvent) {
          this.installPromptEvent.prompt();
          const result = await this.installPromptEvent.userChoice;
          this.installPromptEvent = null;
          return result.outcome === 'accepted';
        }
        return false;
      },
      dismiss: () => {
        this.installPromptEvent = null;
      }
    };
  }

  async getNetworkStatus(): Promise<NetworkInfo> {
    return await this.networkMonitor.getNetworkStatus();
  }

  async isOnline(): Promise<boolean> {
    return await this.networkMonitor.isOnline();
  }

  async addOfflineOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const operationId = await this.queueManager.addOperation(operation);

    // Try to sync immediately if online
    if (await this.isOnline()) {
      const fullOperation = (await this.queueManager.getAllOperations()).find(op => op.id === operationId);
      if (fullOperation) {
        await this.syncManager.syncOperation(fullOperation);
      }
    }

    return operationId;
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    return await this.queueManager.getPendingOperations();
  }

  async syncOfflineOperations(): Promise<SyncResult[]> {
    if (!(await this.isOnline())) {
      this.logger.warn('Cannot sync offline operations: device is offline');
      return [];
    }

    return await this.syncManager.syncAllOperations();
  }

  async clearSyncedOperations(): Promise<number> {
    return await this.queueManager.clearSyncedOperations();
  }

  async getCacheStats(): Promise<CacheStats> {
    const totalSize = await this.cacheManager.getCacheSize();
    const cacheNames = await caches.keys();

    let totalEntries = 0;
    const cachesByName: Record<string, { size: number; entries: number; hitRate: number }> = {};

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const size = await this.cacheManager.getCacheSize(name);

      totalEntries += keys.length;
      cachesByName[name] = {
        size,
        entries: keys.length,
        hitRate: 0 // Would need to track this separately
      };
    }

    return {
      totalSize,
      entryCount: totalEntries,
      hitRate: 0, // Would need to track this
      missRate: 0, // Would need to track this
      lastUpdated: new Date(),
      cachesByName
    };
  }

  async clearCache(cacheName?: string): Promise<boolean> {
    return await this.cacheManager.clearCache(cacheName);
  }

  async preloadCriticalResources(urls: string[]): Promise<void> {
    const criticalCache = await caches.open('critical-resources');

    const preloadPromises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await criticalCache.put(url, response);
          this.logger.debug(`Preloaded critical resource: ${url}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to preload resource: ${url}`, error as Error);
      }
    });

    await Promise.all(preloadPromises);
    this.logger.info(`Preloaded ${urls.length} critical resources`);
  }

  async setupBackgroundSync(config: BackgroundSyncConfig): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(config.tag);
      this.logger.info(`Background sync registered: ${config.tag}`);
    } else {
      this.logger.warn('Background sync not supported');
    }
  }

  async enableOfflineMode(): Promise<void> {
    localStorage.setItem('sizewise-offline-mode', 'enabled');
    this.logger.info('Offline mode enabled');
  }

  async disableOfflineMode(): Promise<void> {
    localStorage.setItem('sizewise-offline-mode', 'disabled');
    this.logger.info('Offline mode disabled');
  }

  async isOfflineModeEnabled(): Promise<boolean> {
    return localStorage.getItem('sizewise-offline-mode') === 'enabled';
  }

  // Private helper methods
  private getDefaultConfig(): PWAConfig {
    return {
      serviceWorkerUrl: '/sw.js',
      cacheConfigs: [
        {
          name: 'critical-resources',
          strategy: CacheStrategy.CACHE_FIRST,
          priority: CachePriority.CRITICAL,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          maxEntries: 50,
          patterns: ['/static/js/', '/static/css/', '/manifest.json']
        },
        {
          name: 'api-cache',
          strategy: CacheStrategy.NETWORK_FIRST,
          priority: CachePriority.HIGH,
          maxAge: 5 * 60 * 1000, // 5 minutes
          maxEntries: 100,
          patterns: ['/api/']
        },
        {
          name: 'images-cache',
          strategy: CacheStrategy.CACHE_FIRST,
          priority: CachePriority.MEDIUM,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          maxEntries: 200,
          patterns: ['/images/', '/icons/']
        }
      ],
      offlineQueueConfig: {
        maxOperations: 1000,
        maxRetries: 3,
        retryDelay: 5000
      },
      syncConfig: {
        syncInterval: 30000, // 30 seconds
        batchSize: 10,
        conflictResolution: 'server-wins'
      },
      networkConfig: {
        slowConnectionThreshold: 300,
        offlineTimeout: 5000
      },
      installPromptConfig: {
        showPrompt: true,
        promptDelay: 60000, // 1 minute
        maxPrompts: 3
      }
    };
  }

  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event;
      this.logger.info('Install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      this.logger.info('App installed successfully');
    });
  }

  private setupNetworkListeners(): void {
    this.networkMonitor.onOnline(() => {
      this.logger.info('Device came online, syncing offline operations');
      this.syncOfflineOperations();
    });

    this.networkMonitor.onOffline(() => {
      this.logger.info('Device went offline, enabling offline mode');
    });
  }

  private registerDefaultSyncHandlers(): void {
    // Register sync handlers for different operation types
    this.syncManager.registerSyncHandler(OfflineOperationType.CREATE_SNAP_POINT, async (operation) => {
      // Implementation would call actual API
      return { success: true, id: operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.UPDATE_SNAP_POINT, async (operation) => {
      // Implementation would call actual API
      return { success: true, id: operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.DELETE_SNAP_POINT, async (operation) => {
      // Implementation would call actual API
      return { success: true, id: operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.CREATE_CENTERLINE, async (operation) => {
      // Implementation would call actual API
      return { success: true, id: operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.UPDATE_CENTERLINE, async (operation) => {
      // Implementation would call actual API
      return { success: true, id: operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.DELETE_CENTERLINE, async (operation) => {
      // Implementation would call actual API
      return { success: true, id: operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.SAVE_PROJECT, async (operation) => {
      // Implementation would call actual API
      return { success: true, id: operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.EXPORT_PROJECT, async (operation) => {
      // Implementation would call actual API
      return { success: true, exportUrl: '/exports/' + operation.data.id };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.VALIDATE_SMACNA, async (operation) => {
      // Implementation would call actual API
      return { success: true, validationResult: operation.data.result };
    });

    this.syncManager.registerSyncHandler(OfflineOperationType.TRACK_USAGE, async (operation) => {
      // Implementation would call actual API
      return { success: true, tracked: true };
    });
  }

  private setupPeriodicSync(): void {
    // Sync offline operations periodically
    setInterval(async () => {
      if (await this.isOnline()) {
        const pendingOps = await this.getPendingOperations();
        if (pendingOps.length > 0) {
          this.logger.info(`Syncing ${pendingOps.length} pending operations`);
          await this.syncOfflineOperations();
        }
      }
    }, this.config.syncConfig.syncInterval);

    // Clean up old cache entries periodically
    setInterval(async () => {
      await this.cacheManager.evictOldEntries();
    }, 60 * 60 * 1000); // Every hour
  }
}
