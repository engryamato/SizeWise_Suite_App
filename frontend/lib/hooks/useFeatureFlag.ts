/**
 * useFeatureFlag - React Hook for Feature Flag Management
 * 
 * MISSION-CRITICAL: High-performance React hook for tier-based feature gating
 * Integrates with FeatureManager and Phase 1.5 security foundation
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.1
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FeatureManager, FeatureCheckResult, BatchFeatureResult } from '../features/FeatureManager';
import { BrowserDatabaseManager, initializeBrowserDatabase } from '../database/BrowserDatabaseManager';

/**
 * User tier type alias
 */
export type UserTier = 'free' | 'pro' | 'enterprise' | 'super_admin';

/**
 * Feature flag hook result
 */
export interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  tier: UserTier | null;
  responseTime: number;
  cached: boolean;
  refresh: () => Promise<void>;
}

/**
 * Batch feature flag hook result
 */
export interface UseBatchFeatureFlagResult {
  features: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  responseTime: number;
  cacheHitRate: number;
  refresh: () => Promise<void>;
}

/**
 * Hook options for customization
 */
export interface UseFeatureFlagOptions {
  userId?: string;
  refreshInterval?: number; // Auto-refresh interval in ms
  enableCache?: boolean;
  onError?: (error: string) => void;
  onPerformanceWarning?: (responseTime: number) => void;
}

// Global feature manager instance (singleton pattern)
let globalFeatureManager: FeatureManager | null = null;
let globalDbManager: BrowserDatabaseManager | null = null;

/**
 * Initialize global feature manager
 */
const initializeFeatureManager = async (): Promise<FeatureManager> => {
  if (!globalFeatureManager) {
    if (!globalDbManager) {
      globalDbManager = await initializeBrowserDatabase();
    }
    globalFeatureManager = new FeatureManager(globalDbManager);
  }
  return globalFeatureManager;
};

/**
 * React hook for single feature flag checking
 * CRITICAL: <50ms performance requirement with caching
 */
export function useFeatureFlag(
  featureName: string,
  options: UseFeatureFlagOptions = {}
): UseFeatureFlagResult {
  const {
    userId,
    refreshInterval,
    enableCache = true,
    onError,
    onPerformanceWarning
  } = options;

  // State management
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<UserTier | null>(null);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [cached, setCached] = useState<boolean>(false);

  // Refs for cleanup and performance
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastCheckRef = useRef<number>(0);

  /**
   * Check feature flag with performance monitoring
   */
  const checkFeature = useCallback(async (forceRefresh = false): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Performance optimization: avoid rapid successive calls
      const now = Date.now();
      if (!forceRefresh && enableCache && (now - lastCheckRef.current) < 100) {
        setLoading(false);
        return;
      }
      lastCheckRef.current = now;

      // Initialize feature manager
      const featureManager = await initializeFeatureManager();

      // Get current user if not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const userRepo = featureManager['userRepository']; // Access private property for current user
        const currentUser = await userRepo.getCurrentUser();
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }
        currentUserId = currentUser.id;
      }

      // Check feature flag
      const result: FeatureCheckResult = await featureManager.isEnabled(featureName, currentUserId);

      // Update state only if component is still mounted
      if (mountedRef.current) {
        setEnabled(result.enabled);
        setTier(result.tier);
        setResponseTime(result.responseTime);
        setCached(result.cached);

        // Performance monitoring
        if (result.responseTime > 50 && onPerformanceWarning) {
          onPerformanceWarning(result.responseTime);
        }

        // Error handling
        if (result.reason && !result.enabled) {
          const errorMessage = `Feature '${featureName}' disabled: ${result.reason}`;
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
        }
      }

    } catch (err) {
      const errorMessage = `Failed to check feature '${featureName}': ${err instanceof Error ? err.message : 'Unknown error'}`;

      if (mountedRef.current) {
        setError(errorMessage);
        setEnabled(false);
        setTier(null);

        if (onError) {
          onError(errorMessage);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [featureName, userId, enableCache, onError, onPerformanceWarning]);

  /**
   * Refresh feature flag manually
   */
  const refresh = useCallback(async (): Promise<void> => {
    await checkFeature(true);
  }, [checkFeature]);

  // Initial load and setup
  useEffect(() => {
    mountedRef.current = true;
    checkFeature();

    // Setup auto-refresh if specified
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        checkFeature();
      }, refreshInterval);
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [checkFeature, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    enabled,
    loading,
    error,
    tier,
    responseTime,
    cached,
    refresh
  };
}

/**
 * React hook for batch feature flag checking
 * CRITICAL: Optimized for components that need multiple feature checks
 */
export function useBatchFeatureFlag(
  featureNames: string[],
  options: UseFeatureFlagOptions = {}
): UseBatchFeatureFlagResult {
  const {
    userId,
    refreshInterval,
    enableCache = true,
    onError,
    onPerformanceWarning
  } = options;

  // State management
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [cacheHitRate, setCacheHitRate] = useState<number>(0);

  // Refs for cleanup and performance
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastCheckRef = useRef<number>(0);

  /**
   * Check multiple feature flags with performance monitoring
   */
  const checkFeatures = useCallback(async (forceRefresh = false): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Performance optimization: avoid rapid successive calls
      const now = Date.now();
      if (!forceRefresh && enableCache && (now - lastCheckRef.current) < 100) {
        setLoading(false);
        return;
      }
      lastCheckRef.current = now;

      // Initialize feature manager
      const featureManager = await initializeFeatureManager();

      // Get current user if not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const userRepo = featureManager['userRepository']; // Access private property for current user
        const currentUser = await userRepo.getCurrentUser();
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }
        currentUserId = currentUser.id;
      }

      // Check feature flags in batch
      const result: BatchFeatureResult = await featureManager.checkFeatures(featureNames, currentUserId);

      // Convert result to simple boolean map
      const featureMap: Record<string, boolean> = {};
      for (const [name, checkResult] of result.features.entries()) {
        featureMap[name] = checkResult.enabled;
      }

      // Update state only if component is still mounted
      if (mountedRef.current) {
        setFeatures(featureMap);
        setResponseTime(result.totalResponseTime);
        setCacheHitRate(result.cacheHitRate);

        // Performance monitoring
        if (result.totalResponseTime > 100 && onPerformanceWarning) { // Higher threshold for batch
          onPerformanceWarning(result.totalResponseTime);
        }
      }

    } catch (err) {
      const errorMessage = `Failed to check features [${featureNames.join(', ')}]: ${err instanceof Error ? err.message : 'Unknown error'}`;

      if (mountedRef.current) {
        setError(errorMessage);
        setFeatures({});

        if (onError) {
          onError(errorMessage);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [featureNames, userId, enableCache, onError, onPerformanceWarning]);

  /**
   * Refresh feature flags manually
   */
  const refresh = useCallback(async (): Promise<void> => {
    await checkFeatures(true);
  }, [checkFeatures]);

  // Initial load and setup
  useEffect(() => {
    mountedRef.current = true;
    
    if (featureNames.length > 0) {
      checkFeatures();
    }

    // Setup auto-refresh if specified
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        checkFeatures();
      }, refreshInterval);
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [checkFeatures, refreshInterval, featureNames]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    features,
    loading,
    error,
    responseTime,
    cacheHitRate,
    refresh
  };
}

/**
 * Utility hook for checking if user has access to specific tier
 */
export function useUserTier(options: UseFeatureFlagOptions = {}): {
  tier: UserTier | null;
  loading: boolean;
  error: string | null;
  hasAccess: (requiredTier: UserTier) => boolean;
} {
  const { userId, onError } = options;
  
  const [tier, setTier] = useState<UserTier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUserTier = async () => {
      try {
        setLoading(true);
        setError(null);

        const featureManager = await initializeFeatureManager();
        
        const userRepo = featureManager['userRepository'];

        if (!userId) {
          const currentUser = await userRepo.getCurrentUser();
          if (!currentUser) {
            throw new Error('No authenticated user found');
          }
          setTier(currentUser.tier);
        } else {
          const user = await userRepo.getUser(userId);
          if (user) {
            setTier(user.tier);
          }
        }
      } catch (err) {
        const errorMessage = `Failed to get user tier: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    getUserTier();
  }, [userId, onError]);

  const hasAccess = useCallback((requiredTier: UserTier): boolean => {
    if (!tier) return false;
    
    const tierHierarchy = { free: 1, pro: 2, enterprise: 3, super_admin: 4 };
    return tierHierarchy[tier] >= tierHierarchy[requiredTier];
  }, [tier]);

  return {
    tier,
    loading,
    error,
    hasAccess
  };
}

/**
 * Cleanup function for global resources
 */
export const cleanupFeatureHooks = async (): Promise<void> => {
  if (globalDbManager) {
    await globalDbManager.close();
    globalDbManager = null;
  }
  globalFeatureManager = null;
};
