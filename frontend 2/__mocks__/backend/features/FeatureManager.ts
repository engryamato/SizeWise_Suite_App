/**
 * Mock FeatureManager for Jest testing
 * Provides mock implementations for feature flag management
 */

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  tier: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TierFeatures {
  [featureName: string]: boolean;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  totalRequests: number;
  errorRate: number;
}

export class FeatureManager {
  private static instance: FeatureManager;
  private cache: Map<string, boolean> = new Map();
  private metrics: PerformanceMetrics = {
    averageResponseTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    errorRate: 0,
  };

  constructor() {
    // Mock constructor
  }

  static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager();
    }
    return FeatureManager.instance;
  }

  async isFeatureEnabled(featureName: string, userTier: string): Promise<boolean> {
    // Mock feature flag logic based on tier
    const tierFeatures: Record<string, string[]> = {
      free: ['basic_calculations', 'pdf_import', 'basic_export'],
      pro: ['basic_calculations', 'pdf_import', 'basic_export', 'advanced_calculations', 'high_res_export'],
      enterprise: ['basic_calculations', 'pdf_import', 'basic_export', 'advanced_calculations', 'high_res_export', 'api_access', 'bulk_operations'],
      super_admin: ['basic_calculations', 'pdf_import', 'basic_export', 'advanced_calculations', 'high_res_export', 'api_access', 'bulk_operations', 'admin_panel'],
    };

    const allowedFeatures = tierFeatures[userTier] || [];
    return allowedFeatures.includes(featureName);
  }

  async isEnabled(featureName: string, userId: string): Promise<{ enabled: boolean; tier: string; reason?: string }> {
    // Mock implementation that returns the expected format
    const tierFeatures: Record<string, string[]> = {
      free: ['air_duct_sizer', 'basic_calculations', 'pdf_export'],
      pro: ['air_duct_sizer', 'basic_calculations', 'pdf_export', 'unlimited_projects', 'high_res_export', 'excel_export', 'advanced_calculations', 'pdf_import'],
      enterprise: ['air_duct_sizer', 'basic_calculations', 'pdf_export', 'unlimited_projects', 'high_res_export', 'excel_export', 'advanced_calculations', 'pdf_import', 'cad_import', 'api_access', 'custom_branding', 'bulk_operations'],
      super_admin: ['air_duct_sizer', 'basic_calculations', 'pdf_export', 'unlimited_projects', 'high_res_export', 'excel_export', 'advanced_calculations', 'pdf_import', 'cad_import', 'api_access', 'custom_branding', 'bulk_operations', 'admin_panel'],
    };

    // Feature tier requirements
    const featureTierRequirements: Record<string, string> = {
      'air_duct_sizer': 'free',
      'basic_calculations': 'free',
      'pdf_export': 'free',
      'unlimited_projects': 'pro',
      'high_res_export': 'pro',
      'excel_export': 'pro',
      'advanced_calculations': 'pro',
      'pdf_import': 'pro',
      'cad_import': 'enterprise',
      'api_access': 'enterprise',
      'custom_branding': 'enterprise',
      'bulk_operations': 'enterprise',
      'admin_panel': 'super_admin',
    };

    // Determine user tier based on userId (mock logic)
    let userTier = 'free';
    if (userId.includes('pro')) userTier = 'pro';
    else if (userId.includes('enterprise')) userTier = 'enterprise';
    else if (userId.includes('super')) userTier = 'super_admin';

    // Check security validation if SecureFeatureValidator is mocked
    try {
      const { SecureFeatureValidator } = require('../../security/SecureFeatureValidator');
      if (SecureFeatureValidator && SecureFeatureValidator.mock && SecureFeatureValidator.mock.instances.length > 0) {
        const mockValidator = SecureFeatureValidator.mock.instances[0];
        if (mockValidator.validateFeature && mockValidator.validateFeature.mock) {
          const securityResult = await mockValidator.validateFeature(featureName, userId);
          if (securityResult && !securityResult.valid) {
            return {
              enabled: false,
              tier: userTier,
              reason: securityResult.error || 'Security validation failed'
            };
          }
        }
      }
    } catch (error) {
      // Security validator not available or not mocked, continue with tier-based logic
    }

    const allowedFeatures = tierFeatures[userTier] || [];
    const enabled = allowedFeatures.includes(featureName);
    const requiredTier = featureTierRequirements[featureName] || 'free';

    const result: { enabled: boolean; tier: string; reason?: string } = { enabled, tier: userTier };

    if (!enabled) {
      result.reason = `${featureName} requires ${requiredTier} tier`;
    }

    return result;
  }

  async checkMultipleFeatures(featureNames: string[], userTier: string): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const featureName of featureNames) {
      results[featureName] = await this.isFeatureEnabled(featureName, userTier);
    }
    return results;
  }

  async setFeatureFlag(featureFlag: FeatureFlag): Promise<void> {
    // Mock implementation
    this.cache.set(`${featureFlag.name}_${featureFlag.tier}`, featureFlag.enabled);
  }

  async getFeatureFlag(name: string, tier: string): Promise<FeatureFlag | null> {
    const enabled = this.cache.get(`${name}_${tier}`) || false;
    return {
      id: `mock-${name}-${tier}`,
      name,
      enabled,
      tier,
      description: `Mock feature flag for ${name}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    // Mock implementation returning common feature flags
    return [
      {
        id: 'mock-basic-calc',
        name: 'basic_calculations',
        enabled: true,
        tier: 'free',
        description: 'Basic HVAC calculations',
      },
      {
        id: 'mock-advanced-calc',
        name: 'advanced_calculations',
        enabled: true,
        tier: 'pro',
        description: 'Advanced HVAC calculations',
      },
      {
        id: 'mock-api-access',
        name: 'api_access',
        enabled: true,
        tier: 'enterprise',
        description: 'API access for integrations',
      },
    ];
  }

  clearCache(): void {
    this.cache.clear();
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  async trackUsage(featureName: string, userTier: string): Promise<void> {
    // Mock usage tracking
    this.metrics.totalRequests++;
  }

  async validateSecurityConstraints(featureName: string, userTier: string): Promise<boolean> {
    // Mock security validation - always pass for testing
    return true;
  }

  async enforceTierBoundaries(userTier: string): Promise<TierFeatures> {
    const features = await this.checkMultipleFeatures([
      'basic_calculations',
      'advanced_calculations',
      'pdf_import',
      'high_res_export',
      'api_access',
      'bulk_operations',
      'admin_panel',
    ], userTier);

    return features;
  }

  async handleDatabaseError(error: Error): Promise<boolean> {
    // Mock error handling - return false for database errors
    this.metrics.errorRate++;
    return false;
  }

  async batchCheckFeatures(requests: Array<{ feature: string; tier: string }>): Promise<Array<{ feature: string; tier: string; enabled: boolean }>> {
    const results = [];
    for (const request of requests) {
      const enabled = await this.isFeatureEnabled(request.feature, request.tier);
      results.push({ ...request, enabled });
    }
    return results;
  }

  async updateFeatureFlag(featureName: string, enabled: boolean, tier: string, adminUserId?: string): Promise<void> {
    // Mock implementation for updateFeatureFlag
    // Validate tier requirement
    const validTiers = ['free', 'pro', 'enterprise', 'super_admin'];
    if (!validTiers.includes(tier)) {
      throw new Error('Invalid tier requirement');
    }

    // Update the cache to reflect the change
    this.cache.set(`${featureName}_${tier}`, enabled);

    // Mock database operations would happen here
    // This is just a mock so we don't actually update anything
  }
}

// Export default for compatibility
export default FeatureManager;
