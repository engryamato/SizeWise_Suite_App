/**
 * PWA Service Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Offline-first PWA capabilities interfaces for service worker management,
 * intelligent caching strategies, offline operation queues, and data synchronization.
 * 
 * @fileoverview PWA service interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Cache strategies for different resource types
 */
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',           // Serve from cache, fallback to network
  NETWORK_FIRST = 'network-first',       // Try network first, fallback to cache
  CACHE_ONLY = 'cache-only',            // Serve only from cache
  NETWORK_ONLY = 'network-only',        // Serve only from network
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate' // Serve from cache, update in background
}

/**
 * Cache priority levels
 */
export enum CachePriority {
  CRITICAL = 'critical',     // Essential for app functionality
  HIGH = 'high',            // Important for user experience
  MEDIUM = 'medium',        // Nice to have cached
  LOW = 'low'              // Can be fetched as needed
}

/**
 * Offline operation types
 */
export enum OfflineOperationType {
  CREATE_SNAP_POINT = 'create_snap_point',
  UPDATE_SNAP_POINT = 'update_snap_point',
  DELETE_SNAP_POINT = 'delete_snap_point',
  CREATE_CENTERLINE = 'create_centerline',
  UPDATE_CENTERLINE = 'update_centerline',
  DELETE_CENTERLINE = 'delete_centerline',
  SAVE_PROJECT = 'save_project',
  EXPORT_PROJECT = 'export_project',
  VALIDATE_SMACNA = 'validate_smacna',
  TRACK_USAGE = 'track_usage'
}

/**
 * Sync status for offline operations
 */
export enum SyncStatus {
  PENDING = 'pending',       // Waiting to be synced
  SYNCING = 'syncing',      // Currently being synced
  SYNCED = 'synced',        // Successfully synced
  FAILED = 'failed',        // Sync failed
  CONFLICT = 'conflict'     // Sync conflict detected
}

/**
 * Network status
 */
export enum NetworkStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLOW = 'slow',           // Slow connection detected
  UNKNOWN = 'unknown'
}

/**
 * Cache configuration for different resource types
 */
export interface CacheConfig {
  name: string;
  strategy: CacheStrategy;
  priority: CachePriority;
  maxAge: number;          // Cache duration in milliseconds
  maxEntries: number;      // Maximum number of cached entries
  patterns: string[];      // URL patterns to match
  headers?: Record<string, string>; // Custom headers for cached responses
}

/**
 * Offline operation data
 */
export interface OfflineOperation {
  id: string;
  type: OfflineOperationType;
  data: any;
  timestamp: Date;
  status: SyncStatus;
  retryCount: number;
  maxRetries: number;
  userId: string;
  metadata?: Record<string, any>;
}

/**
 * Sync result for offline operations
 */
export interface SyncResult {
  operationId: string;
  success: boolean;
  status: SyncStatus;
  error?: Error;
  conflictData?: any;
  serverResponse?: any;
  timestamp: Date;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalSize: number;       // Total cache size in bytes
  entryCount: number;      // Number of cached entries
  hitRate: number;         // Cache hit rate percentage
  missRate: number;        // Cache miss rate percentage
  lastUpdated: Date;
  cachesByName: Record<string, {
    size: number;
    entries: number;
    hitRate: number;
  }>;
}

/**
 * Network information
 */
export interface NetworkInfo {
  status: NetworkStatus;
  effectiveType: string;   // '4g', '3g', '2g', 'slow-2g'
  downlink: number;        // Bandwidth in Mbps
  rtt: number;            // Round trip time in ms
  saveData: boolean;       // Data saver mode enabled
}

/**
 * PWA installation prompt
 */
export interface PWAInstallPrompt {
  canInstall: boolean;
  isInstalled: boolean;
  prompt: () => Promise<boolean>;
  dismiss: () => void;
}

/**
 * Service worker update information
 */
export interface ServiceWorkerUpdate {
  available: boolean;
  installing: boolean;
  waiting: boolean;
  activate: () => Promise<void>;
  skip: () => Promise<void>;
}

/**
 * Background sync configuration
 */
export interface BackgroundSyncConfig {
  tag: string;
  options?: {
    minDelay?: number;     // Minimum delay before retry
    maxDelay?: number;     // Maximum delay before retry
    powerState?: 'avoid-draining' | 'auto';
    networkState?: 'avoid-cellular' | 'auto';
  };
}

/**
 * Main PWA Service interface
 */
export interface IPWAService {
  /**
   * Initialize PWA service
   */
  initialize(config?: PWAConfig): Promise<void>;

  /**
   * Register service worker
   */
  registerServiceWorker(scriptUrl?: string): Promise<ServiceWorkerRegistration>;

  /**
   * Update service worker
   */
  updateServiceWorker(): Promise<void>;

  /**
   * Get service worker update status
   */
  getServiceWorkerUpdate(): Promise<ServiceWorkerUpdate>;

  /**
   * Check if app is installable
   */
  getInstallPrompt(): Promise<PWAInstallPrompt>;

  /**
   * Get network status
   */
  getNetworkStatus(): Promise<NetworkInfo>;

  /**
   * Check if app is online
   */
  isOnline(): Promise<boolean>;

  /**
   * Add offline operation to queue
   */
  addOfflineOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string>;

  /**
   * Get pending offline operations
   */
  getPendingOperations(): Promise<OfflineOperation[]>;

  /**
   * Sync offline operations
   */
  syncOfflineOperations(): Promise<SyncResult[]>;

  /**
   * Clear synced operations
   */
  clearSyncedOperations(): Promise<number>;

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<CacheStats>;

  /**
   * Clear cache by name
   */
  clearCache(cacheName?: string): Promise<boolean>;

  /**
   * Preload critical resources
   */
  preloadCriticalResources(urls: string[]): Promise<void>;

  /**
   * Setup background sync
   */
  setupBackgroundSync(config: BackgroundSyncConfig): Promise<void>;

  /**
   * Enable offline mode
   */
  enableOfflineMode(): Promise<void>;

  /**
   * Disable offline mode
   */
  disableOfflineMode(): Promise<void>;

  /**
   * Check if offline mode is enabled
   */
  isOfflineModeEnabled(): Promise<boolean>;
}

/**
 * Cache manager interface
 */
export interface ICacheManager {
  /**
   * Initialize cache manager
   */
  initialize(configs: CacheConfig[]): Promise<void>;

  /**
   * Cache resource
   */
  cacheResource(url: string, response: Response, cacheName?: string): Promise<void>;

  /**
   * Get cached resource
   */
  getCachedResource(url: string, cacheName?: string): Promise<Response | null>;

  /**
   * Delete cached resource
   */
  deleteCachedResource(url: string, cacheName?: string): Promise<boolean>;

  /**
   * Clear cache
   */
  clearCache(cacheName?: string): Promise<boolean>;

  /**
   * Get cache size
   */
  getCacheSize(cacheName?: string): Promise<number>;

  /**
   * Evict old entries
   */
  evictOldEntries(cacheName?: string): Promise<number>;

  /**
   * Update cache strategy
   */
  updateCacheStrategy(cacheName: string, strategy: CacheStrategy): Promise<void>;
}

/**
 * Offline queue manager interface
 */
export interface IOfflineQueueManager {
  /**
   * Add operation to queue
   */
  addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string>;

  /**
   * Get all operations
   */
  getAllOperations(): Promise<OfflineOperation[]>;

  /**
   * Get pending operations
   */
  getPendingOperations(): Promise<OfflineOperation[]>;

  /**
   * Update operation status
   */
  updateOperationStatus(operationId: string, status: SyncStatus, error?: Error): Promise<void>;

  /**
   * Remove operation
   */
  removeOperation(operationId: string): Promise<boolean>;

  /**
   * Clear all operations
   */
  clearAllOperations(): Promise<number>;

  /**
   * Clear synced operations
   */
  clearSyncedOperations(): Promise<number>;

  /**
   * Retry failed operations
   */
  retryFailedOperations(): Promise<SyncResult[]>;
}

/**
 * Sync manager interface
 */
export interface ISyncManager {
  /**
   * Sync single operation
   */
  syncOperation(operation: OfflineOperation): Promise<SyncResult>;

  /**
   * Sync all pending operations
   */
  syncAllOperations(): Promise<SyncResult[]>;

  /**
   * Handle sync conflicts
   */
  handleSyncConflict(operation: OfflineOperation, serverData: any): Promise<SyncResult>;

  /**
   * Register sync handler
   */
  registerSyncHandler(type: OfflineOperationType, handler: (operation: OfflineOperation) => Promise<any>): void;

  /**
   * Unregister sync handler
   */
  unregisterSyncHandler(type: OfflineOperationType): void;
}

/**
 * Network monitor interface
 */
export interface INetworkMonitor {
  /**
   * Start monitoring network status
   */
  startMonitoring(): Promise<void>;

  /**
   * Stop monitoring network status
   */
  stopMonitoring(): Promise<void>;

  /**
   * Get current network status
   */
  getNetworkStatus(): Promise<NetworkInfo>;

  /**
   * Check if online
   */
  isOnline(): Promise<boolean>;

  /**
   * Register network status change listener
   */
  onNetworkStatusChange(listener: (status: NetworkInfo) => void): () => void;

  /**
   * Register online/offline listeners
   */
  onOnline(listener: () => void): () => void;
  onOffline(listener: () => void): () => void;
}

/**
 * PWA configuration
 */
export interface PWAConfig {
  serviceWorkerUrl: string;
  cacheConfigs: CacheConfig[];
  offlineQueueConfig: {
    maxOperations: number;
    maxRetries: number;
    retryDelay: number;
  };
  syncConfig: {
    syncInterval: number;
    batchSize: number;
    conflictResolution: 'client-wins' | 'server-wins' | 'manual';
  };
  networkConfig: {
    slowConnectionThreshold: number; // RTT threshold for slow connection
    offlineTimeout: number;          // Timeout to consider offline
  };
  installPromptConfig: {
    showPrompt: boolean;
    promptDelay: number;
    maxPrompts: number;
  };
}

/**
 * PWA manifest interface
 */
export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
  theme_color: string;
  background_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: 'any' | 'maskable' | 'monochrome';
  }>;
  categories?: string[];
  screenshots?: Array<{
    src: string;
    sizes: string;
    type: string;
    platform?: 'wide' | 'narrow';
  }>;
}
