/**
 * PWA React Hook
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * React hook for offline-first PWA capabilities, service worker management,
 * intelligent caching, and offline operation queues.
 * 
 * @fileoverview PWA React hook
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  IPWAService,
  PWAConfig,
  OfflineOperation,
  OfflineOperationType,
  SyncResult,
  NetworkInfo,
  NetworkStatus,
  CacheStats,
  PWAInstallPrompt,
  ServiceWorkerUpdate
} from '../core/interfaces/IPWAService';

/**
 * PWA context interface
 */
interface PWAContextValue {
  pwaService: IPWAService;
}

/**
 * PWA context
 */
const PWAContext = createContext<PWAContextValue | null>(null);

/**
 * PWA provider component
 */
export const PWAProvider: React.FC<{
  children: React.ReactNode;
  pwaService: IPWAService;
  config?: PWAConfig;
}> = ({ children, pwaService, config }) => {
  useEffect(() => {
    pwaService.initialize(config);
  }, [pwaService, config]);

  return (
    <PWAContext.Provider value={{ pwaService }}>
      {children}
    </PWAContext.Provider>
  );
};

/**
 * Hook return type
 */
export interface UsePWAReturn {
  // Service access
  service: IPWAService;

  // Network status
  networkInfo: NetworkInfo | null;
  isOnline: boolean;
  isOffline: boolean;
  isSlowConnection: boolean;

  // Offline operations
  pendingOperations: OfflineOperation[];
  addOfflineOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>) => Promise<string>;
  syncOperations: () => Promise<SyncResult[]>;
  clearSyncedOperations: () => Promise<number>;

  // Cache management
  cacheStats: CacheStats | null;
  clearCache: (cacheName?: string) => Promise<boolean>;
  preloadResources: (urls: string[]) => Promise<void>;

  // Service worker
  serviceWorkerUpdate: ServiceWorkerUpdate | null;
  updateServiceWorker: () => Promise<void>;

  // Installation
  installPrompt: PWAInstallPrompt | null;
  showInstallPrompt: () => Promise<boolean>;
  dismissInstallPrompt: () => void;

  // Offline mode
  isOfflineModeEnabled: boolean;
  enableOfflineMode: () => Promise<void>;
  disableOfflineMode: () => Promise<void>;
  toggleOfflineMode: () => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Main usePWA hook
 */
export const usePWA = (): UsePWAReturn => {
  const context = useContext(PWAContext);
  
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }

  const { pwaService } = context;

  // State management
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [serviceWorkerUpdate, setServiceWorkerUpdate] = useState<ServiceWorkerUpdate | null>(null);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadPWAData();
  }, []);

  // Setup network status monitoring
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await pwaService.getNetworkStatus();
        setNetworkInfo(status);
      } catch (err) {
        console.warn('Failed to get network status:', err);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [pwaService]);

  // Setup periodic data refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPendingOperations();
      refreshCacheStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadPWAData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        networkStatus,
        operations,
        stats,
        swUpdate,
        prompt,
        offlineMode
      ] = await Promise.all([
        pwaService.getNetworkStatus(),
        pwaService.getPendingOperations(),
        pwaService.getCacheStats(),
        pwaService.getServiceWorkerUpdate(),
        pwaService.getInstallPrompt(),
        pwaService.isOfflineModeEnabled()
      ]);

      setNetworkInfo(networkStatus);
      setPendingOperations(operations);
      setCacheStats(stats);
      setServiceWorkerUpdate(swUpdate);
      setInstallPrompt(prompt);
      setIsOfflineModeEnabled(offlineMode);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPendingOperations = async (): Promise<void> => {
    try {
      const operations = await pwaService.getPendingOperations();
      setPendingOperations(operations);
    } catch (err) {
      console.warn('Failed to refresh pending operations:', err);
    }
  };

  const refreshCacheStats = async (): Promise<void> => {
    try {
      const stats = await pwaService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      console.warn('Failed to refresh cache stats:', err);
    }
  };

  // Network status derived values
  const isOnline = networkInfo?.status === NetworkStatus.ONLINE;
  const isOffline = networkInfo?.status === NetworkStatus.OFFLINE;
  const isSlowConnection = networkInfo?.status === NetworkStatus.SLOW;

  // Offline operations
  const addOfflineOperation = useCallback(async (
    operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>
  ): Promise<string> => {
    try {
      const operationId = await pwaService.addOfflineOperation(operation);
      await refreshPendingOperations();
      return operationId;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  const syncOperations = useCallback(async (): Promise<SyncResult[]> => {
    try {
      const results = await pwaService.syncOfflineOperations();
      await refreshPendingOperations();
      return results;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  const clearSyncedOperations = useCallback(async (): Promise<number> => {
    try {
      const count = await pwaService.clearSyncedOperations();
      await refreshPendingOperations();
      return count;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  // Cache management
  const clearCache = useCallback(async (cacheName?: string): Promise<boolean> => {
    try {
      const result = await pwaService.clearCache(cacheName);
      await refreshCacheStats();
      return result;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  const preloadResources = useCallback(async (urls: string[]): Promise<void> => {
    try {
      await pwaService.preloadCriticalResources(urls);
      await refreshCacheStats();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  // Service worker
  const updateServiceWorker = useCallback(async (): Promise<void> => {
    try {
      await pwaService.updateServiceWorker();
      const swUpdate = await pwaService.getServiceWorkerUpdate();
      setServiceWorkerUpdate(swUpdate);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  // Installation
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (installPrompt?.canInstall) {
      try {
        const result = await installPrompt.prompt();
        if (result) {
          setInstallPrompt(null);
        }
        return result;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    }
    return false;
  }, [installPrompt]);

  const dismissInstallPrompt = useCallback((): void => {
    if (installPrompt) {
      installPrompt.dismiss();
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  // Offline mode
  const enableOfflineMode = useCallback(async (): Promise<void> => {
    try {
      await pwaService.enableOfflineMode();
      setIsOfflineModeEnabled(true);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  const disableOfflineMode = useCallback(async (): Promise<void> => {
    try {
      await pwaService.disableOfflineMode();
      setIsOfflineModeEnabled(false);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [pwaService]);

  const toggleOfflineMode = useCallback(async (): Promise<void> => {
    if (isOfflineModeEnabled) {
      await disableOfflineMode();
    } else {
      await enableOfflineMode();
    }
  }, [isOfflineModeEnabled, enableOfflineMode, disableOfflineMode]);

  return {
    // Service access
    service: pwaService,

    // Network status
    networkInfo,
    isOnline,
    isOffline,
    isSlowConnection,

    // Offline operations
    pendingOperations,
    addOfflineOperation,
    syncOperations,
    clearSyncedOperations,

    // Cache management
    cacheStats,
    clearCache,
    preloadResources,

    // Service worker
    serviceWorkerUpdate,
    updateServiceWorker,

    // Installation
    installPrompt,
    showInstallPrompt,
    dismissInstallPrompt,

    // Offline mode
    isOfflineModeEnabled,
    enableOfflineMode,
    disableOfflineMode,
    toggleOfflineMode,

    // State
    isLoading,
    error
  };
};

/**
 * Hook for offline operations
 */
export const useOfflineOperations = () => {
  const { addOfflineOperation, syncOperations, pendingOperations, isOnline } = usePWA();

  const queueOperation = useCallback(async (
    type: OfflineOperationType,
    data: any,
    userId: string,
    maxRetries: number = 3
  ): Promise<string> => {
    return await addOfflineOperation({
      type,
      data,
      userId,
      maxRetries
    });
  }, [addOfflineOperation]);

  const syncWhenOnline = useCallback(async (): Promise<SyncResult[]> => {
    if (isOnline && pendingOperations.length > 0) {
      return await syncOperations();
    }
    return [];
  }, [isOnline, pendingOperations, syncOperations]);

  return {
    queueOperation,
    syncWhenOnline,
    pendingCount: pendingOperations.length,
    hasPendingOperations: pendingOperations.length > 0
  };
};

/**
 * Hook for network status
 */
export const useNetworkStatus = () => {
  const { networkInfo, isOnline, isOffline, isSlowConnection } = usePWA();

  return {
    networkInfo,
    isOnline,
    isOffline,
    isSlowConnection,
    connectionType: networkInfo?.effectiveType || 'unknown',
    downlink: networkInfo?.downlink || 0,
    rtt: networkInfo?.rtt || 0,
    saveData: networkInfo?.saveData || false
  };
};
