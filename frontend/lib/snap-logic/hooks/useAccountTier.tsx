/**
 * Account Tier React Hook
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * React hook for tier-based feature gating, usage tracking,
 * and upgrade prompts in SizeWise Suite components.
 * 
 * @fileoverview Account tier React hook
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  IAccountTierService,
  AccountTier,
  FeatureCategory,
  FeatureAccessResult,
  UsageLimits,
  CurrentUsage,
  UpgradePromptConfig,
  TierComparison
} from '../core/interfaces/IAccountTierService';

/**
 * Account tier context interface
 */
interface AccountTierContextValue {
  tierService: IAccountTierService;
  userId: string;
}

/**
 * Account tier context
 */
const AccountTierContext = createContext<AccountTierContextValue | null>(null);

/**
 * Account tier provider component
 */
export const AccountTierProvider: React.FC<{
  children: React.ReactNode;
  tierService: IAccountTierService;
  userId: string;
}> = ({ children, tierService, userId }) => {
  return (
    <AccountTierContext.Provider value={{ tierService, userId }}>
      {children}
    </AccountTierContext.Provider>
  );
};

/**
 * Hook return type
 */
export interface UseAccountTierReturn {
  // Current tier information
  tier: AccountTier;
  isLoading: boolean;
  error: string | null;

  // Feature access methods
  canAccess: (feature: FeatureCategory) => boolean;
  canAccessWithUsage: (feature: FeatureCategory, amount: number) => Promise<FeatureAccessResult>;
  checkFeatureAccess: (feature: FeatureCategory) => FeatureAccessResult | null;

  // Usage information
  usageLimits: UsageLimits | null;
  currentUsage: CurrentUsage | null;
  remainingUsage: Partial<UsageLimits> | null;

  // Usage tracking
  recordUsage: (feature: FeatureCategory, amount: number) => Promise<void>;

  // Upgrade functionality
  showUpgradePrompt: (feature: FeatureCategory) => void;
  getUpgradePrompt: (feature: FeatureCategory) => Promise<UpgradePromptConfig>;
  upgradeTo: (newTier: AccountTier) => Promise<boolean>;
  startFreeTrial: (tier: AccountTier) => Promise<boolean>;

  // Tier comparison
  getTierComparison: () => Promise<TierComparison>;

  // Utility methods
  isFreeTier: boolean;
  isProTier: boolean;
  isEnterpriseTier: boolean;
  getFeatureLimit: (feature: FeatureCategory) => number;
  getUsagePercentage: (feature: FeatureCategory) => number;

  // Refresh data
  refresh: () => Promise<void>;
}

/**
 * Feature access cache for performance
 */
interface FeatureAccessCache {
  [key: string]: {
    result: FeatureAccessResult;
    timestamp: number;
    ttl: number;
  };
}

/**
 * Main useAccountTier hook
 */
export const useAccountTier = (): UseAccountTierReturn => {
  const context = useContext(AccountTierContext);
  
  if (!context) {
    throw new Error('useAccountTier must be used within an AccountTierProvider');
  }

  const { tierService, userId } = context;

  // State management
  const [tier, setTier] = useState<AccountTier>(AccountTier.FREE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [currentUsage, setCurrentUsage] = useState<CurrentUsage | null>(null);
  const [remainingUsage, setRemainingUsage] = useState<Partial<UsageLimits> | null>(null);
  const [featureAccessCache, setFeatureAccessCache] = useState<FeatureAccessCache>({});

  // Load initial data
  useEffect(() => {
    loadTierData();
  }, [userId]);

  const loadTierData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        userTier,
        limits,
        usage,
        remaining
      ] = await Promise.all([
        tierService.getUserTier(userId),
        tierService.getUsageLimits(userId),
        tierService.getCurrentUsage(userId),
        tierService.getRemainingUsage(userId)
      ]);

      setTier(userTier);
      setUsageLimits(limits);
      setCurrentUsage(usage);
      setRemainingUsage(remaining);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Feature access methods
  const canAccess = useCallback((feature: FeatureCategory): boolean => {
    const cached = getCachedFeatureAccess(feature);
    if (cached) {
      return cached.hasAccess;
    }

    // If not cached, return conservative estimate
    return tier !== AccountTier.FREE || isBasicFeature(feature);
  }, [tier, featureAccessCache]);

  const canAccessWithUsage = useCallback(async (
    feature: FeatureCategory,
    amount: number
  ): Promise<FeatureAccessResult> => {
    try {
      const result = await tierService.canAccessFeatureWithUsage(userId, feature, amount);
      cacheFeatureAccess(feature, result);
      return result;
    } catch (err) {
      throw new Error(`Failed to check feature access: ${(err as Error).message}`);
    }
  }, [tierService, userId]);

  const checkFeatureAccess = useCallback((feature: FeatureCategory): FeatureAccessResult | null => {
    return getCachedFeatureAccess(feature);
  }, [featureAccessCache]);

  // Usage tracking
  const recordUsage = useCallback(async (
    feature: FeatureCategory,
    amount: number
  ): Promise<void> => {
    try {
      await tierService.recordUsage(userId, feature, amount);
      
      // Refresh usage data
      const [usage, remaining] = await Promise.all([
        tierService.getCurrentUsage(userId),
        tierService.getRemainingUsage(userId)
      ]);
      
      setCurrentUsage(usage);
      setRemainingUsage(remaining);

      // Clear feature access cache to force re-evaluation
      setFeatureAccessCache({});

    } catch (err) {
      throw new Error(`Failed to record usage: ${(err as Error).message}`);
    }
  }, [tierService, userId]);

  // Upgrade functionality
  const showUpgradePrompt = useCallback((feature: FeatureCategory): void => {
    // This would typically show a modal or navigate to upgrade page
    tierService.getUpgradePrompt(feature).then(prompt => {
      // Show upgrade prompt UI
      console.log('Show upgrade prompt:', prompt);
      
      // In a real implementation, this would trigger a modal or navigation
      if (typeof window !== 'undefined') {
        window.open(prompt.ctaUrl, '_blank');
      }
    });
  }, [tierService]);

  const getUpgradePrompt = useCallback(async (
    feature: FeatureCategory
  ): Promise<UpgradePromptConfig> => {
    return await tierService.getUpgradePrompt(feature);
  }, [tierService]);

  const upgradeTo = useCallback(async (newTier: AccountTier): Promise<boolean> => {
    try {
      const success = await tierService.upgradeUserTier(userId, newTier);
      if (success) {
        await loadTierData(); // Refresh all data
      }
      return success;
    } catch (err) {
      setError(`Failed to upgrade: ${(err as Error).message}`);
      return false;
    }
  }, [tierService, userId]);

  const startFreeTrial = useCallback(async (tier: AccountTier): Promise<boolean> => {
    try {
      const success = await tierService.startFreeTrial(userId, tier);
      if (success) {
        await loadTierData(); // Refresh all data
      }
      return success;
    } catch (err) {
      setError(`Failed to start free trial: ${(err as Error).message}`);
      return false;
    }
  }, [tierService, userId]);

  // Tier comparison
  const getTierComparison = useCallback(async (): Promise<TierComparison> => {
    return await tierService.getTierComparison();
  }, [tierService]);

  // Utility methods
  const isFreeTier = tier === AccountTier.FREE;
  const isProTier = tier === AccountTier.PRO;
  const isEnterpriseTier = tier === AccountTier.ENTERPRISE;

  const getFeatureLimit = useCallback((feature: FeatureCategory): number => {
    if (!usageLimits) return 0;

    switch (feature) {
      case FeatureCategory.SNAP_DETECTION:
        return usageLimits.maxSnapPoints;
      case FeatureCategory.DRAWING:
        return usageLimits.maxCenterlines;
      case FeatureCategory.EXPORT:
        return usageLimits.maxExportsPerMonth;
      case FeatureCategory.REPORTS:
        return usageLimits.maxReportsPerMonth;
      default:
        return 0;
    }
  }, [usageLimits]);

  const getUsagePercentage = useCallback((feature: FeatureCategory): number => {
    if (!currentUsage || !usageLimits) return 0;

    const limit = getFeatureLimit(feature);
    if (limit === Infinity || limit === 0) return 0;

    let used = 0;
    switch (feature) {
      case FeatureCategory.SNAP_DETECTION:
        used = currentUsage.snapPointsUsed;
        break;
      case FeatureCategory.DRAWING:
        used = currentUsage.centerlinesUsed;
        break;
      case FeatureCategory.EXPORT:
        used = currentUsage.exportsUsed;
        break;
      case FeatureCategory.REPORTS:
        used = currentUsage.reportsUsed;
        break;
    }

    return Math.min(100, (used / limit) * 100);
  }, [currentUsage, usageLimits, getFeatureLimit]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadTierData();
  }, []);

  // Helper functions
  const getCachedFeatureAccess = (feature: FeatureCategory): FeatureAccessResult | null => {
    const cached = featureAccessCache[feature];
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      // Cache expired
      return null;
    }

    return cached.result;
  };

  const cacheFeatureAccess = (feature: FeatureCategory, result: FeatureAccessResult): void => {
    setFeatureAccessCache(prev => ({
      ...prev,
      [feature]: {
        result,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes
      }
    }));
  };

  const isBasicFeature = (feature: FeatureCategory): boolean => {
    const basicFeatures = [
      FeatureCategory.SNAP_DETECTION,
      FeatureCategory.DRAWING,
      FeatureCategory.EXPORT
    ];
    return basicFeatures.includes(feature);
  };

  return {
    // Current tier information
    tier,
    isLoading,
    error,

    // Feature access methods
    canAccess,
    canAccessWithUsage,
    checkFeatureAccess,

    // Usage information
    usageLimits,
    currentUsage,
    remainingUsage,

    // Usage tracking
    recordUsage,

    // Upgrade functionality
    showUpgradePrompt,
    getUpgradePrompt,
    upgradeTo,
    startFreeTrial,

    // Tier comparison
    getTierComparison,

    // Utility methods
    isFreeTier,
    isProTier,
    isEnterpriseTier,
    getFeatureLimit,
    getUsagePercentage,

    // Refresh data
    refresh
  };
};

/**
 * Hook for checking specific feature access
 */
export const useFeatureAccess = (feature: FeatureCategory) => {
  const { canAccess, canAccessWithUsage, showUpgradePrompt, getFeatureLimit, getUsagePercentage } = useAccountTier();

  return {
    hasAccess: canAccess(feature),
    checkUsage: (amount: number) => canAccessWithUsage(feature, amount),
    showUpgrade: () => showUpgradePrompt(feature),
    limit: getFeatureLimit(feature),
    usagePercentage: getUsagePercentage(feature)
  };
};

/**
 * Hook for usage tracking
 */
export const useUsageTracking = () => {
  const { recordUsage, currentUsage, remainingUsage, refresh } = useAccountTier();

  const trackFeatureUsage = useCallback(async (
    feature: FeatureCategory,
    amount: number = 1
  ): Promise<void> => {
    await recordUsage(feature, amount);
  }, [recordUsage]);

  return {
    trackUsage: trackFeatureUsage,
    currentUsage,
    remainingUsage,
    refresh
  };
};
