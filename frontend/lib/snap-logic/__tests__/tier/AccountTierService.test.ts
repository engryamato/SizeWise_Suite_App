/**
 * Account Tier Service Tests
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Comprehensive test suite for tier-based feature gating,
 * usage tracking, and subscription management.
 * 
 * @fileoverview Account tier service tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { AccountTierService, UsageTrackingService } from '../../services/AccountTierService';
import {
  AccountTier,
  FeatureCategory,
  FeatureAccessLevel,
  FeatureAccessResult
} from '../../core/interfaces/IAccountTierService';

// Mock logger
class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

// Mock configuration service
class MockConfigurationService {
  private config = new Map<string, any>();

  async get<T>(key: string): Promise<T> {
    return this.config.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.config.set(key, value);
  }
}

describe('AccountTierService', () => {
  let tierService: AccountTierService;
  let usageTracker: UsageTrackingService;
  let mockLogger: MockLogger;
  let mockConfigService: MockConfigurationService;

  const testUserId = 'test-user-123';

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockConfigService = new MockConfigurationService();
    usageTracker = new UsageTrackingService(mockLogger as any);
    tierService = new AccountTierService(
      usageTracker,
      mockLogger as any,
      mockConfigService as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Tier Management', () => {
    it('should return FREE tier for new user', async () => {
      const tier = await tierService.getUserTier(testUserId);
      expect(tier).toBe(AccountTier.FREE);
    });

    it('should get user subscription details', async () => {
      const subscription = await tierService.getUserSubscription(testUserId);
      
      expect(subscription.userId).toBe(testUserId);
      expect(subscription.tier).toBe(AccountTier.FREE);
      expect(subscription.isActive).toBe(true);
      expect(subscription.billingCycle).toBe('monthly');
    });

    it('should upgrade user tier successfully', async () => {
      const success = await tierService.upgradeUserTier(testUserId, AccountTier.PRO);
      expect(success).toBe(true);
      
      const newTier = await tierService.getUserTier(testUserId);
      expect(newTier).toBe(AccountTier.PRO);
    });

    it('should start free trial successfully', async () => {
      const success = await tierService.startFreeTrial(testUserId, AccountTier.PRO);
      expect(success).toBe(true);
      
      const tier = await tierService.getUserTier(testUserId);
      expect(tier).toBe(AccountTier.PRO);
    });
  });

  describe('Feature Access Control', () => {
    it('should allow basic features for FREE tier', async () => {
      const snapAccess = await tierService.canAccessFeature(testUserId, FeatureCategory.SNAP_DETECTION);
      const drawingAccess = await tierService.canAccessFeature(testUserId, FeatureCategory.DRAWING);
      
      expect(snapAccess.hasAccess).toBe(true);
      expect(snapAccess.accessLevel).toBe(FeatureAccessLevel.LIMITED);
      expect(drawingAccess.hasAccess).toBe(true);
      expect(drawingAccess.accessLevel).toBe(FeatureAccessLevel.LIMITED);
    });

    it('should block 3D visualization for FREE tier', async () => {
      const access = await tierService.canAccessFeature(testUserId, FeatureCategory.VISUALIZATION_3D);
      
      expect(access.hasAccess).toBe(false);
      expect(access.accessLevel).toBe(FeatureAccessLevel.NONE);
      expect(access.upgradeRequired).toBe(true);
    });

    it('should allow all features for PRO tier', async () => {
      await tierService.upgradeUserTier(testUserId, AccountTier.PRO);
      
      const features = [
        FeatureCategory.SNAP_DETECTION,
        FeatureCategory.DRAWING,
        FeatureCategory.VISUALIZATION_3D,
        FeatureCategory.EXPORT,
        FeatureCategory.REPORTS,
        FeatureCategory.SMACNA_VALIDATION
      ];

      for (const feature of features) {
        const access = await tierService.canAccessFeature(testUserId, feature);
        expect(access.hasAccess).toBe(true);
        expect(access.accessLevel).toBe(FeatureAccessLevel.FULL);
      }
    });

    it('should enforce usage limits for FREE tier', async () => {
      // Test snap points limit
      const snapAccess = await tierService.canAccessFeatureWithUsage(
        testUserId,
        FeatureCategory.SNAP_DETECTION,
        150 // Exceeds FREE tier limit of 100
      );
      
      expect(snapAccess.hasAccess).toBe(false);
      expect(snapAccess.upgradeRequired).toBe(true);
      expect(snapAccess.limit).toBe(100);
    });

    it('should allow unlimited usage for PRO tier', async () => {
      await tierService.upgradeUserTier(testUserId, AccountTier.PRO);
      
      const snapAccess = await tierService.canAccessFeatureWithUsage(
        testUserId,
        FeatureCategory.SNAP_DETECTION,
        10000 // Large amount
      );
      
      expect(snapAccess.hasAccess).toBe(true);
      expect(snapAccess.limit).toBe(Infinity);
    });
  });

  describe('Usage Tracking', () => {
    it('should track snap detection usage', async () => {
      await tierService.recordUsage(testUserId, FeatureCategory.SNAP_DETECTION, 10);
      
      const usage = await tierService.getCurrentUsage(testUserId);
      expect(usage.snapPointsUsed).toBe(10);
    });

    it('should track drawing usage', async () => {
      await tierService.recordUsage(testUserId, FeatureCategory.DRAWING, 3);
      
      const usage = await tierService.getCurrentUsage(testUserId);
      expect(usage.centerlinesUsed).toBe(3);
    });

    it('should track export usage', async () => {
      await tierService.recordUsage(testUserId, FeatureCategory.EXPORT, 2);
      
      const usage = await tierService.getCurrentUsage(testUserId);
      expect(usage.exportsUsed).toBe(2);
    });

    it('should calculate remaining usage correctly', async () => {
      await tierService.recordUsage(testUserId, FeatureCategory.SNAP_DETECTION, 50);
      
      const remaining = await tierService.getRemainingUsage(testUserId);
      expect(remaining.maxSnapPoints).toBe(50); // 100 - 50
    });

    it('should handle usage limits enforcement', async () => {
      // Use up the FREE tier limit
      await tierService.recordUsage(testUserId, FeatureCategory.SNAP_DETECTION, 100);
      
      const access = await tierService.canAccessFeatureWithUsage(
        testUserId,
        FeatureCategory.SNAP_DETECTION,
        1 // Even 1 more should be blocked
      );
      
      expect(access.hasAccess).toBe(false);
      expect(access.remainingUsage).toBe(0);
    });
  });

  describe('Usage Limits', () => {
    it('should get correct usage limits for FREE tier', async () => {
      const limits = await tierService.getUsageLimits(testUserId);
      
      expect(limits.maxSnapPoints).toBe(100);
      expect(limits.maxCenterlines).toBe(10);
      expect(limits.maxProjects).toBe(3);
      expect(limits.maxExportsPerMonth).toBe(5);
      expect(limits.maxReportsPerMonth).toBe(2);
    });

    it('should get unlimited usage for PRO tier', async () => {
      await tierService.upgradeUserTier(testUserId, AccountTier.PRO);
      
      const limits = await tierService.getUsageLimits(testUserId);
      
      expect(limits.maxSnapPoints).toBe(Infinity);
      expect(limits.maxCenterlines).toBe(Infinity);
      expect(limits.maxProjects).toBe(Infinity);
      expect(limits.maxExportsPerMonth).toBe(Infinity);
      expect(limits.maxReportsPerMonth).toBe(Infinity);
    });
  });

  describe('Tier Configurations', () => {
    it('should get tier configuration for FREE tier', async () => {
      const config = await tierService.getTierConfiguration(AccountTier.FREE);
      
      expect(config.tier).toBe(AccountTier.FREE);
      expect(config.displayName).toBe('Free');
      expect(config.pricing.monthlyPrice).toBe(0);
      expect(config.features).toContain('Basic snap detection');
      expect(config.restrictions).toContain('Limited to 100 snap points');
    });

    it('should get tier configuration for PRO tier', async () => {
      const config = await tierService.getTierConfiguration(AccountTier.PRO);
      
      expect(config.tier).toBe(AccountTier.PRO);
      expect(config.displayName).toBe('Pro');
      expect(config.pricing.monthlyPrice).toBe(49.99);
      expect(config.features).toContain('Unlimited snap points and centerlines');
      expect(config.restrictions).toHaveLength(0);
    });

    it('should get all tier configurations', async () => {
      const configs = await tierService.getAllTierConfigurations();
      
      expect(configs).toHaveLength(3); // FREE, PRO, ENTERPRISE
      expect(configs.map(c => c.tier)).toContain(AccountTier.FREE);
      expect(configs.map(c => c.tier)).toContain(AccountTier.PRO);
      expect(configs.map(c => c.tier)).toContain(AccountTier.ENTERPRISE);
    });
  });

  describe('Upgrade Prompts', () => {
    it('should get upgrade prompt for 3D visualization', async () => {
      const prompt = await tierService.getUpgradePrompt(FeatureCategory.VISUALIZATION_3D);
      
      expect(prompt.feature).toBe(FeatureCategory.VISUALIZATION_3D);
      expect(prompt.title).toBe('Unlock 3D Visualization');
      expect(prompt.benefits).toContain('Interactive 3D models');
      expect(prompt.ctaText).toBe('Upgrade to Pro');
      expect(prompt.showFreeTrial).toBe(true);
    });

    it('should get upgrade prompt for SMACNA validation', async () => {
      const prompt = await tierService.getUpgradePrompt(FeatureCategory.SMACNA_VALIDATION);
      
      expect(prompt.feature).toBe(FeatureCategory.SMACNA_VALIDATION);
      expect(prompt.title).toBe('Professional SMACNA Compliance');
      expect(prompt.benefits).toContain('Real-time SMACNA validation');
      expect(prompt.ctaText).toBe('Upgrade to Pro');
    });

    it('should get default upgrade prompt for unknown feature', async () => {
      const prompt = await tierService.getUpgradePrompt('unknown_feature' as any);
      
      expect(prompt.title).toBe('Upgrade Required');
      expect(prompt.ctaText).toBe('Upgrade Now');
    });
  });

  describe('Tier Comparison', () => {
    it('should get tier comparison data', async () => {
      const comparison = await tierService.getTierComparison();
      
      expect(comparison.features).toBeDefined();
      expect(comparison.pricing).toBeDefined();
      
      expect(comparison.features.some(f => f.name === 'Snap Points')).toBe(true);
      expect(comparison.features.some(f => f.name === '3D Visualization')).toBe(true);
      
      expect(comparison.pricing.free.price).toBe(0);
      expect(comparison.pricing.pro.price).toBe(49.99);
      expect(comparison.pricing.enterprise.price).toBe(199.99);
    });
  });

  describe('Feature Restrictions', () => {
    it('should get feature restrictions for FREE tier', async () => {
      const restrictions = await tierService.getFeatureRestrictions(testUserId);
      
      expect(restrictions[FeatureCategory.SNAP_DETECTION].accessLevel).toBe(FeatureAccessLevel.LIMITED);
      expect(restrictions[FeatureCategory.SNAP_DETECTION].maxSnapPoints).toBe(100);
      expect(restrictions[FeatureCategory.VISUALIZATION_3D].accessLevel).toBe(FeatureAccessLevel.NONE);
    });

    it('should get feature restrictions for PRO tier', async () => {
      await tierService.upgradeUserTier(testUserId, AccountTier.PRO);
      
      const restrictions = await tierService.getFeatureRestrictions(testUserId);
      
      expect(restrictions[FeatureCategory.SNAP_DETECTION].accessLevel).toBe(FeatureAccessLevel.FULL);
      expect(restrictions[FeatureCategory.VISUALIZATION_3D].accessLevel).toBe(FeatureAccessLevel.FULL);
      expect(restrictions[FeatureCategory.SMACNA_VALIDATION].realTimeValidation).toBe(true);
    });
  });

  describe('Free Trial Eligibility', () => {
    it('should check free trial eligibility', async () => {
      const isEligible = await tierService.isEligibleForFreeTrial(testUserId, AccountTier.PRO);
      expect(isEligible).toBe(true); // Simplified implementation always returns true
    });
  });

  describe('Error Handling', () => {
    it('should handle upgrade failure gracefully', async () => {
      // Mock a failure scenario
      const originalUpgrade = tierService.upgradeUserTier;
      tierService.upgradeUserTier = jest.fn().mockRejectedValue(new Error('Upgrade failed'));
      
      const success = await tierService.upgradeUserTier(testUserId, AccountTier.PRO);
      expect(success).toBe(false);
      
      // Restore original method
      tierService.upgradeUserTier = originalUpgrade;
    });

    it('should handle invalid feature access check', async () => {
      const access = await tierService.canAccessFeature(testUserId, 'invalid_feature' as any);
      
      expect(access.hasAccess).toBe(false);
      expect(access.reason).toContain('Feature not configured');
    });
  });
});

describe('UsageTrackingService', () => {
  let usageTracker: UsageTrackingService;
  let mockLogger: MockLogger;

  const testUserId = 'test-user-456';

  beforeEach(() => {
    mockLogger = new MockLogger();
    usageTracker = new UsageTrackingService(mockLogger as any);
  });

  describe('Usage Tracking', () => {
    it('should track feature usage', async () => {
      await usageTracker.trackUsage(testUserId, FeatureCategory.SNAP_DETECTION, 5);
      
      const analytics = await usageTracker.getUsageAnalytics(testUserId, 'month');
      expect(analytics.snapPoints).toBe(5);
    });

    it('should accumulate usage over multiple calls', async () => {
      await usageTracker.trackUsage(testUserId, FeatureCategory.SNAP_DETECTION, 3);
      await usageTracker.trackUsage(testUserId, FeatureCategory.SNAP_DETECTION, 7);
      
      const analytics = await usageTracker.getUsageAnalytics(testUserId, 'month');
      expect(analytics.snapPoints).toBe(10);
    });

    it('should reset usage counters', async () => {
      await usageTracker.trackUsage(testUserId, FeatureCategory.EXPORT, 5);
      
      await usageTracker.resetUsageCounters(testUserId, 'monthly');
      
      const analytics = await usageTracker.getUsageAnalytics(testUserId, 'month');
      expect(analytics.exports).toBe(0);
    });

    it('should handle non-existent user gracefully', async () => {
      const analytics = await usageTracker.getUsageAnalytics('non-existent-user', 'month');
      expect(analytics).toBeNull();
    });
  });
});
