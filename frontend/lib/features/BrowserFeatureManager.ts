/**
 * Browser Feature Manager
 * 
 * Browser-compatible feature management for offline desktop mode.
 * Simplified version that works with IndexedDB and DataService.
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 */

import { DataService } from '../data/DataService';

/**
 * Feature check result
 */
export interface FeatureCheckResult {
  enabled: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  reason?: string;
  responseTime: number;
  cached: boolean;
}

/**
 * Browser-compatible feature manager
 */
export class BrowserFeatureManager {
  private cache: Map<string, { result: FeatureCheckResult; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(private dataService: DataService) {}

  /**
   * Check if feature is enabled for user
   */
  async isEnabled(featureName: string, userId?: string): Promise<FeatureCheckResult> {
    const startTime = Date.now();
    const cacheKey = `${featureName}:${userId || 'global'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return {
        ...cached.result,
        responseTime: Date.now() - startTime,
        cached: true
      };
    }

    try {
      // Get feature flag from DataService
      const flag = await this.dataService.getFeatureFlag(featureName, userId);
      
      let enabled = false;
      let tier: 'free' | 'pro' | 'enterprise' = 'free';
      let reason = '';

      if (flag) {
        enabled = flag.enabled;
        tier = flag.tierRequired;
        
        // Check if user has required tier
        if (enabled && userId) {
          const user = await this.dataService.getUser(userId);
          if (user) {
            const userTier = user.tier;
            const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
            
            if (tierHierarchy[userTier] >= tierHierarchy[tier]) {
              enabled = true;
              reason = `Feature enabled for ${userTier} tier`;
            } else {
              enabled = false;
              reason = `Feature requires ${tier} tier, user has ${userTier}`;
            }
          }
        }
      } else {
        enabled = false;
        reason = 'Feature flag not found';
      }

      const result: FeatureCheckResult = {
        enabled,
        tier,
        reason,
        responseTime: Date.now() - startTime,
        cached: false
      };

      // Cache the result
      this.cache.set(cacheKey, {
        result: { ...result, cached: true },
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Failed to check feature ${featureName}:`, error);
      return {
        enabled: false,
        tier: 'free',
        reason: `Error checking feature: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Check multiple features at once
   */
  async checkFeatures(featureNames: string[], userId?: string): Promise<Map<string, FeatureCheckResult>> {
    const results = new Map<string, FeatureCheckResult>();
    
    // Check features in parallel
    const promises = featureNames.map(async (featureName) => {
      const result = await this.isEnabled(featureName, userId);
      return { featureName, result };
    });

    const resolvedResults = await Promise.all(promises);
    
    resolvedResults.forEach(({ featureName, result }) => {
      results.set(featureName, result);
    });

    return results;
  }

  /**
   * Enable feature for user
   */
  async enableFeature(featureName: string, userId?: string): Promise<void> {
    try {
      const existingFlag = await this.dataService.getFeatureFlag(featureName, userId);
      
      if (existingFlag) {
        existingFlag.enabled = true;
        existingFlag.updatedAt = new Date();
        await this.dataService.saveFeatureFlag(existingFlag);
      } else {
        // Create new feature flag
        const newFlag = {
          id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId || null,
          organizationId: null,
          featureName,
          enabled: true,
          tierRequired: 'free' as const,
          expiresAt: null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          sync: {
            version: 1,
            lastModified: new Date(),
            lastModifiedBy: userId || 'system',
            syncStatus: 'local' as const,
            changeLog: [],
            isDeleted: false
          },
          feature: {
            config: {},
            usage: {
              usageCount: 0
            }
          }
        };
        await this.dataService.saveFeatureFlag(newFlag);
      }

      // Clear cache
      this.clearCache(featureName, userId);
    } catch (error) {
      console.error(`Failed to enable feature ${featureName}:`, error);
      throw error;
    }
  }

  /**
   * Disable feature for user
   */
  async disableFeature(featureName: string, userId?: string): Promise<void> {
    try {
      const existingFlag = await this.dataService.getFeatureFlag(featureName, userId);
      
      if (existingFlag) {
        existingFlag.enabled = false;
        existingFlag.updatedAt = new Date();
        await this.dataService.saveFeatureFlag(existingFlag);
        
        // Clear cache
        this.clearCache(featureName, userId);
      }
    } catch (error) {
      console.error(`Failed to disable feature ${featureName}:`, error);
      throw error;
    }
  }

  /**
   * Get feature configuration
   */
  async getFeatureConfig(featureName: string, userId?: string): Promise<any> {
    try {
      const flag = await this.dataService.getFeatureFlag(featureName, userId);
      return flag?.feature?.config || {};
    } catch (error) {
      console.error(`Failed to get feature config for ${featureName}:`, error);
      return {};
    }
  }

  /**
   * Clear cache for specific feature
   */
  private clearCache(featureName: string, userId?: string): void {
    const cacheKey = `${featureName}:${userId || 'global'}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }
}

/**
 * Create browser feature manager
 */
export function createBrowserFeatureManager(dataService: DataService): BrowserFeatureManager {
  return new BrowserFeatureManager(dataService);
}
