/**
 * React Hook for Enhanced Service Worker Integration
 * 
 * Provides easy integration with the enhanced service worker for React components.
 * Manages service worker lifecycle, cache status, and offline queue operations.
 * 
 * @see docs/post-implementation-bridging-plan.md Task 2.1
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getEnhancedServiceWorkerManager, 
  ServiceWorkerStatus, 
  CacheStatus, 
  OfflineQueueItem,
  BackgroundSyncEvent 
} from '@/lib/services/EnhancedServiceWorkerManager';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface UseEnhancedServiceWorkerReturn {
  // Status
  status: ServiceWorkerStatus;
  isOnline: boolean;
  cacheStatus: CacheStatus | null;
  offlineQueue: OfflineQueueItem[];
  
  // Actions
  initialize: () => Promise<boolean>;
  activateUpdate: () => Promise<boolean>;
  checkForUpdates: () => Promise<boolean>;
  clearCache: (cacheType?: string) => Promise<boolean>;
  refreshCacheStatus: () => Promise<void>;
  refreshOfflineQueue: () => Promise<void>;
  
  // Events
  onUpdateAvailable: (callback: () => void) => void;
  onBackgroundSyncSuccess: (callback: (event: BackgroundSyncEvent) => void) => void;
  onBackgroundSyncFailed: (callback: (event: BackgroundSyncEvent) => void) => void;
  
  // Utilities
  isBackgroundSyncSupported: boolean;
  isPushNotificationSupported: boolean;
}

export interface UseEnhancedServiceWorkerOptions {
  autoInitialize?: boolean;
  autoRefreshInterval?: number;
  enableOnlineStatusTracking?: boolean;
}

// =============================================================================
// Enhanced Service Worker Hook
// =============================================================================

export function useEnhancedServiceWorker(
  options: UseEnhancedServiceWorkerOptions = {}
): UseEnhancedServiceWorkerReturn {
  const {
    autoInitialize = true,
    autoRefreshInterval = 30000, // 30 seconds
    enableOnlineStatusTracking = true
  } = options;

  // State
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isActive: false,
    hasUpdate: false,
    registration: null
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  // Refs for event callbacks
  const updateCallbackRef = useRef<(() => void) | null>(null);
  const syncSuccessCallbackRef = useRef<((event: BackgroundSyncEvent) => void) | null>(null);
  const syncFailedCallbackRef = useRef<((event: BackgroundSyncEvent) => void) | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get service worker manager instance
  const swManager = getEnhancedServiceWorkerManager();

  // =============================================================================
  // Initialization and Setup
  // =============================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      const result = await swManager.initialize();
      updateStatus();
      return result;
    } catch (error) {
      console.error('[useEnhancedServiceWorker] Initialization failed:', error);
      return false;
    }
  }, []);

  const updateStatus = useCallback(() => {
    setStatus(swManager.getStatus());
  }, []);

  // =============================================================================
  // Cache Management
  // =============================================================================

  const refreshCacheStatus = useCallback(async (): Promise<void> => {
    try {
      const newCacheStatus = await swManager.getCacheStatus();
      setCacheStatus(newCacheStatus);
    } catch (error) {
      console.error('[useEnhancedServiceWorker] Failed to refresh cache status:', error);
    }
  }, []);

  const clearCache = useCallback(async (cacheType?: string): Promise<boolean> => {
    try {
      const result = await swManager.clearCache(cacheType);
      if (result) {
        await refreshCacheStatus();
      }
      return result;
    } catch (error) {
      console.error('[useEnhancedServiceWorker] Failed to clear cache:', error);
      return false;
    }
  }, [refreshCacheStatus]);

  // =============================================================================
  // Offline Queue Management
  // =============================================================================

  const refreshOfflineQueue = useCallback(async (): Promise<void> => {
    try {
      const queue = await swManager.getOfflineQueue();
      setOfflineQueue(queue);
    } catch (error) {
      console.error('[useEnhancedServiceWorker] Failed to refresh offline queue:', error);
    }
  }, []);

  // =============================================================================
  // Update Management
  // =============================================================================

  const activateUpdate = useCallback(async (): Promise<boolean> => {
    try {
      return await swManager.activateUpdate();
    } catch (error) {
      console.error('[useEnhancedServiceWorker] Failed to activate update:', error);
      return false;
    }
  }, []);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    try {
      const result = await swManager.checkForUpdates();
      updateStatus();
      return result;
    } catch (error) {
      console.error('[useEnhancedServiceWorker] Failed to check for updates:', error);
      return false;
    }
  }, [updateStatus]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const onUpdateAvailable = useCallback((callback: () => void) => {
    updateCallbackRef.current = callback;
  }, []);

  const onBackgroundSyncSuccess = useCallback((callback: (event: BackgroundSyncEvent) => void) => {
    syncSuccessCallbackRef.current = callback;
  }, []);

  const onBackgroundSyncFailed = useCallback((callback: (event: BackgroundSyncEvent) => void) => {
    syncFailedCallbackRef.current = callback;
  }, []);

  // =============================================================================
  // Effects
  // =============================================================================

  // Initialize service worker
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize, initialize]);

  // Set up service worker event listeners
  useEffect(() => {
    const handleUpdateAvailable = () => {
      updateStatus();
      if (updateCallbackRef.current) {
        updateCallbackRef.current();
      }
    };

    const handleBackgroundSyncSuccess = (event: BackgroundSyncEvent) => {
      refreshOfflineQueue();
      if (syncSuccessCallbackRef.current) {
        syncSuccessCallbackRef.current(event);
      }
    };

    const handleBackgroundSyncFailed = (event: BackgroundSyncEvent) => {
      refreshOfflineQueue();
      if (syncFailedCallbackRef.current) {
        syncFailedCallbackRef.current(event);
      }
    };

    const handleControllerChanged = () => {
      updateStatus();
    };

    const handleCacheCleared = () => {
      refreshCacheStatus();
    };

    // Add event listeners
    swManager.on('updateAvailable', handleUpdateAvailable);
    swManager.on('backgroundSyncSuccess', handleBackgroundSyncSuccess);
    swManager.on('backgroundSyncFailed', handleBackgroundSyncFailed);
    swManager.on('controllerChanged', handleControllerChanged);
    swManager.on('cacheCleared', handleCacheCleared);

    return () => {
      // Remove event listeners
      swManager.off('updateAvailable', handleUpdateAvailable);
      swManager.off('backgroundSyncSuccess', handleBackgroundSyncSuccess);
      swManager.off('backgroundSyncFailed', handleBackgroundSyncFailed);
      swManager.off('controllerChanged', handleControllerChanged);
      swManager.off('cacheCleared', handleCacheCleared);
    };
  }, [updateStatus, refreshCacheStatus, refreshOfflineQueue]);

  // Set up online/offline status tracking
  useEffect(() => {
    if (!enableOnlineStatusTracking) {
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOnlineStatusTracking]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval > 0 && status.isActive) {
      refreshIntervalRef.current = setInterval(() => {
        refreshCacheStatus();
        refreshOfflineQueue();
      }, autoRefreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [autoRefreshInterval, status.isActive, refreshCacheStatus, refreshOfflineQueue]);

  // Initial data load
  useEffect(() => {
    if (status.isActive) {
      refreshCacheStatus();
      refreshOfflineQueue();
    }
  }, [status.isActive, refreshCacheStatus, refreshOfflineQueue]);

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // Status
    status,
    isOnline,
    cacheStatus,
    offlineQueue,
    
    // Actions
    initialize,
    activateUpdate,
    checkForUpdates,
    clearCache,
    refreshCacheStatus,
    refreshOfflineQueue,
    
    // Events
    onUpdateAvailable,
    onBackgroundSyncSuccess,
    onBackgroundSyncFailed,
    
    // Utilities
    isBackgroundSyncSupported: swManager.isBackgroundSyncSupported(),
    isPushNotificationSupported: swManager.isPushNotificationSupported()
  };
}

export default useEnhancedServiceWorker;
