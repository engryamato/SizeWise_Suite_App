/**
 * FeatureManager Test Suite - Comprehensive Feature Flag Testing
 * 
 * CRITICAL: Validates all tier × feature combinations and performance
 * Tests feature flag system, caching, security, and integration
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.3
 */

import { FeatureManager } from '../../lib/features/FeatureManager';
import { DatabaseManager } from '../../__mocks__/backend/database/DatabaseManager';
import { SecurityManager } from '../../__mocks__/backend/security/SecurityManager';
import {
  TEST_TIERS,
  TEST_USERS,
  TEST_FEATURE_FLAGS,
  measureAsyncPerformance,
  expectPerformanceWithin,
  mockFeatureFlag,
  mockTierValidation
} from '../utils/test-helpers';

// Mock dependencies
jest.mock('../../backend/database/DatabaseManager', () => ({
  DatabaseManager: jest.fn()
}));
jest.mock('../../backend/security/SecurityManager', () => ({
  SecurityManager: jest.fn()
}));

describe('FeatureManager - Comprehensive Feature Flag Testing', () => {
  let featureManager: FeatureManager;
  let mockDatabaseManager: jest.Mocked<DatabaseManager>;
  let mockSecurityManager: jest.Mocked<SecurityManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock user data for getCurrentUser() calls
    const mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      tier: 'pro',
      company: 'Test Company',
      license_key: 'test-license-key',
      organization_id: null,
      settings: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create mock database connection with prepare method
    const mockConnection = {
      prepare: jest.fn().mockImplementation((sql: string) => {
        // Return different mocks based on SQL query
        if (sql.includes('FROM users') && sql.includes('ORDER BY created_at ASC')) {
          // This is getCurrentUser() query
          return {
            get: jest.fn().mockReturnValue(mockUser),
            all: jest.fn().mockReturnValue([mockUser]),
            run: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 })
          };
        }
        // Default mock for other queries
        return {
          get: jest.fn().mockReturnValue(null),
          all: jest.fn().mockReturnValue([]),
          run: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 })
        };
      }),
      transaction: jest.fn().mockImplementation((fn) => () => fn()),
      exec: jest.fn(),
      close: jest.fn()
    };

    // Mock DatabaseManager
    mockDatabaseManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
      query: jest.fn(),
      transaction: jest.fn(),
      close: jest.fn()
    } as any;

    // Mock SecurityManager
    mockSecurityManager = {
      encrypt: jest.fn((data) => `encrypted:${data}`),
      decrypt: jest.fn((data) => data.replace('encrypted:', '')),
      hash: jest.fn((data) => `hash:${data}`),
      validateSignature: jest.fn().mockReturnValue(true)
    } as any;

    (DatabaseManager as jest.MockedClass<typeof DatabaseManager>).mockImplementation(() => mockDatabaseManager);
    (SecurityManager as jest.MockedClass<typeof SecurityManager>).mockImplementation(() => mockSecurityManager);

    featureManager = new FeatureManager(mockDatabaseManager);
  });

  describe('Tier × Feature Matrix Testing', () => {
    describe('Free Tier Features', () => {
      const freeTierFeatures = ['air_duct_sizer', 'basic_calculations', 'pdf_export'];

      test.each(freeTierFeatures)('should allow %s for free tier', async (feature) => {
        mockDatabaseManager.query.mockResolvedValue([{
          feature_name: feature,
          enabled: true,
          tier_requirement: 'free'
        }]);

        const startTime = performance.now();
        const result = await featureManager.isEnabled(feature, TEST_USERS.freeUser.id);
        const duration = performance.now() - startTime;

        expect(result.enabled).toBe(true);
        expect(result.tier).toBe('free');
        expectPerformanceWithin(duration, 100); // <100ms requirement
      });

      test('should deny pro-tier features for free tier', async () => {
        const proFeatures = ['unlimited_projects', 'high_res_export', 'excel_export'];
        
        for (const feature of proFeatures) {
          mockDatabaseManager.query.mockResolvedValue([{
            feature_name: feature,
            enabled: true,
            tier_requirement: 'pro'
          }]);

          const result = await featureManager.isEnabled(feature, TEST_USERS.freeUser.id);
          
          expect(result.enabled).toBe(false);
          expect(result.reason).toContain('requires pro tier');
        }
      });

      test('should deny enterprise features for free tier', async () => {
        const enterpriseFeatures = ['cad_import', 'api_access', 'custom_branding'];
        
        for (const feature of enterpriseFeatures) {
          mockDatabaseManager.query.mockResolvedValue([{
            feature_name: feature,
            enabled: true,
            tier_requirement: 'enterprise'
          }]);

          const result = await featureManager.isEnabled(feature, TEST_USERS.freeUser.id);
          
          expect(result.enabled).toBe(false);
          expect(result.reason).toContain('requires enterprise tier');
        }
      });
    });

    describe('Pro Tier Features', () => {
      const proTierFeatures = [
        'air_duct_sizer', 'basic_calculations', 'advanced_calculations',
        'unlimited_projects', 'high_res_export', 'excel_export', 'pdf_import'
      ];

      test.each(proTierFeatures)('should allow %s for pro tier', async (feature) => {
        const tierRequirement = TEST_FEATURE_FLAGS[feature]?.tier || 'free';
        
        mockDatabaseManager.query.mockResolvedValue([{
          feature_name: feature,
          enabled: true,
          tier_requirement: tierRequirement
        }]);

        const startTime = performance.now();
        const result = await featureManager.isEnabled(feature, TEST_USERS.proUser.id);
        const duration = performance.now() - startTime;

        expect(result.enabled).toBe(true);
        expectPerformanceWithin(duration, 100); // <100ms requirement
      });

      test('should deny enterprise-only features for pro tier', async () => {
        const enterpriseOnlyFeatures = ['cad_import', 'api_access', 'custom_branding'];
        
        for (const feature of enterpriseOnlyFeatures) {
          mockDatabaseManager.query.mockResolvedValue([{
            feature_name: feature,
            enabled: true,
            tier_requirement: 'enterprise'
          }]);

          const result = await featureManager.isEnabled(feature, TEST_USERS.proUser.id);
          
          expect(result.enabled).toBe(false);
          expect(result.reason).toContain('requires enterprise tier');
        }
      });
    });

    describe('Enterprise Tier Features', () => {
      const allFeatures = Object.keys(TEST_FEATURE_FLAGS);

      test.each(allFeatures)('should allow %s for enterprise tier', async (feature) => {
        const tierRequirement = TEST_FEATURE_FLAGS[feature]?.tier || 'free';
        
        mockDatabaseManager.query.mockResolvedValue([{
          feature_name: feature,
          enabled: true,
          tier_requirement: tierRequirement
        }]);

        const startTime = performance.now();
        const result = await featureManager.isEnabled(feature, TEST_USERS.enterpriseUser.id);
        const duration = performance.now() - startTime;

        expect(result.enabled).toBe(true);
        expectPerformanceWithin(duration, 100); // <100ms requirement
      });
    });
  });

  describe('Feature Flag Caching', () => {
    test('should cache feature flag results for performance', async () => {
      const feature = 'air_duct_sizer';
      const userId = TEST_USERS.proUser.id;

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'free'
      }]);

      // First call - should hit database
      const { duration: firstCallDuration } = await measureAsyncPerformance(
        () => featureManager.isEnabled(feature, userId),
        100
      );

      // Second call - should hit cache
      const { duration: secondCallDuration } = await measureAsyncPerformance(
        () => featureManager.isEnabled(feature, userId),
        50
      );

      expect(firstCallDuration).toBeGreaterThan(0);
      expect(secondCallDuration).toBeLessThan(firstCallDuration);
      expectPerformanceWithin(secondCallDuration, 50); // Cache should be faster
      
      // Database should only be called once
      expect(mockDatabaseManager.query).toHaveBeenCalledTimes(1);
    });

    test('should invalidate cache when feature flags are updated', async () => {
      const feature = 'unlimited_projects';
      const userId = TEST_USERS.proUser.id;

      // Initial state - feature enabled
      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'pro'
      }]);

      const initialResult = await featureManager.isEnabled(feature, userId);
      expect(initialResult.enabled).toBe(true);

      // Update feature flag
      await featureManager.updateFeatureFlag(feature, false, 'pro');

      // Updated state - feature disabled
      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: false,
        tier_requirement: 'pro'
      }]);

      const updatedResult = await featureManager.isEnabled(feature, userId);
      expect(updatedResult.enabled).toBe(false);
    });

    test('should handle cache expiration correctly', async () => {
      const feature = 'high_res_export';
      const userId = TEST_USERS.proUser.id;

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'pro'
      }]);

      // First call
      await featureManager.isEnabled(feature, userId);

      // Mock cache expiration (simulate time passing)
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000); // 6 minutes later

      // Second call after cache expiration
      await featureManager.isEnabled(feature, userId);

      // Should have called database twice due to cache expiration
      expect(mockDatabaseManager.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Requirements', () => {
    test('should meet <100ms performance requirement for feature checks', async () => {
      const features = Object.keys(TEST_FEATURE_FLAGS);
      const userId = TEST_USERS.proUser.id;

      for (const feature of features) {
        mockDatabaseManager.query.mockResolvedValue([{
          feature_name: feature,
          enabled: true,
          tier_requirement: TEST_FEATURE_FLAGS[feature].tier
        }]);

        const { duration } = await measureAsyncPerformance(
          () => featureManager.isEnabled(feature, userId),
          100
        );

        expectPerformanceWithin(duration, 100);
      }
    });

    test('should handle batch feature checks efficiently', async () => {
      const features = ['air_duct_sizer', 'basic_calculations', 'unlimited_projects'];
      const userId = TEST_USERS.proUser.id;

      mockDatabaseManager.query.mockImplementation((query) => {
        if (query.includes('WHERE feature_name IN')) {
          return Promise.resolve(features.map(feature => ({
            feature_name: feature,
            enabled: true,
            tier_requirement: TEST_FEATURE_FLAGS[feature].tier
          })));
        }
        return Promise.resolve([]);
      });

      const { duration } = await measureAsyncPerformance(
        () => featureManager.getBatchFeatures(features, userId),
        200
      );

      expectPerformanceWithin(duration, 200); // Batch should be efficient
    });

    test('should handle concurrent feature checks', async () => {
      const feature = 'excel_export';
      const userIds = [TEST_USERS.freeUser.id, TEST_USERS.proUser.id, TEST_USERS.enterpriseUser.id];

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'pro'
      }]);

      const { duration } = await measureAsyncPerformance(
        () => Promise.all(userIds.map(userId => featureManager.isEnabled(feature, userId))),
        300
      );

      expectPerformanceWithin(duration, 300); // Concurrent calls should be efficient
    });
  });

  describe('Security and Integrity', () => {
    test('should validate feature flag signatures', async () => {
      const feature = 'api_access';
      const userId = TEST_USERS.enterpriseUser.id;

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'enterprise',
        signature: 'valid-signature'
      }]);

      const result = await featureManager.isEnabled(feature, userId);

      expect(result.enabled).toBe(true);
      expect(mockSecurityManager.validateSignature).toHaveBeenCalledWith(
        expect.stringContaining(feature),
        'valid-signature'
      );
    });

    test('should reject tampered feature flags', async () => {
      const feature = 'unlimited_projects';
      const userId = TEST_USERS.freeUser.id;

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'free', // Tampered - should be 'pro'
        signature: 'invalid-signature'
      }]);

      mockSecurityManager.validateSignature.mockReturnValue(false);

      const result = await featureManager.isEnabled(feature, userId);

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Invalid signature');
    });

    test('should encrypt sensitive feature data', async () => {
      const feature = 'custom_branding';
      const config = { brandColor: '#ff0000', logo: 'custom-logo.png' };

      await featureManager.updateFeatureConfig(feature, config);

      expect(mockSecurityManager.encrypt).toHaveBeenCalledWith(
        JSON.stringify(config)
      );
    });

    test('should audit feature flag access', async () => {
      const feature = 'cad_import';
      const userId = TEST_USERS.enterpriseUser.id;

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'enterprise'
      }]);

      await featureManager.isEnabled(feature, userId);

      // Should log audit entry
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO feature_audit'),
        expect.arrayContaining([userId, feature])
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      mockDatabaseManager.query.mockRejectedValue(new Error('Database connection failed'));

      const result = await featureManager.isEnabled('air_duct_sizer', TEST_USERS.freeUser.id);

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Database error');
    });

    test('should handle invalid user IDs', async () => {
      const result = await featureManager.isEnabled('basic_calculations', 'invalid-user-id');

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Invalid user');
    });

    test('should handle unknown features gracefully', async () => {
      mockDatabaseManager.query.mockResolvedValue([]);

      const result = await featureManager.isEnabled('unknown_feature', TEST_USERS.proUser.id);

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Feature not found');
    });

    test('should handle malformed feature data', async () => {
      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: 'malformed_feature',
        enabled: 'invalid', // Should be boolean
        tier_requirement: null // Should be string
      }]);

      const result = await featureManager.isEnabled('malformed_feature', TEST_USERS.proUser.id);

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Invalid feature data');
    });
  });

  describe('Integration Testing', () => {
    test('should integrate with Phase 1 repository pattern', async () => {
      const feature = 'pdf_export';
      const userId = TEST_USERS.proUser.id;

      // Mock repository-style database interaction
      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'free'
      }]);

      const result = await featureManager.isEnabled(feature, userId);

      expect(result.enabled).toBe(true);
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([feature, userId])
      );
    });

    test('should integrate with Phase 1.5 security measures', async () => {
      const feature = 'high_res_export';
      const userId = TEST_USERS.proUser.id;

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'pro',
        encrypted_config: 'encrypted:config-data'
      }]);

      await featureManager.isEnabled(feature, userId);

      expect(mockSecurityManager.decrypt).toHaveBeenCalledWith('encrypted:config-data');
    });

    test('should integrate with Phase 2 tier enforcement', async () => {
      const feature = 'unlimited_projects';
      const userId = TEST_USERS.freeUser.id;

      mockDatabaseManager.query.mockResolvedValue([{
        feature_name: feature,
        enabled: true,
        tier_requirement: 'pro'
      }]);

      const result = await featureManager.isEnabled(feature, userId);

      expect(result.enabled).toBe(false);
      expect(result.requiredTier).toBe('pro');
      expect(result.currentTier).toBe('free');
    });

    test('should integrate with Phase 3 desktop features', async () => {
      const desktopFeatures = ['file_operations', 'license_management', 'offline_mode'];

      for (const feature of desktopFeatures) {
        mockDatabaseManager.query.mockResolvedValue([{
          feature_name: feature,
          enabled: true,
          tier_requirement: 'free',
          platform_specific: true
        }]);

        const result = await featureManager.isEnabled(feature, TEST_USERS.proUser.id);
        expect(result.enabled).toBe(true);
      }
    });
  });

  describe('Feature Flag Administration', () => {
    test('should allow feature flag updates with proper authorization', async () => {
      const feature = 'beta_feature';
      const adminUserId = 'admin-user-123';

      mockDatabaseManager.query.mockResolvedValue([{ success: true }]);

      await featureManager.updateFeatureFlag(feature, true, 'pro', adminUserId);

      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE feature_flags'),
        expect.arrayContaining([true, 'pro', feature])
      );
    });

    test('should create audit trail for feature flag changes', async () => {
      const feature = 'new_feature';
      const adminUserId = 'admin-user-123';

      await featureManager.updateFeatureFlag(feature, true, 'enterprise', adminUserId);

      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO feature_audit'),
        expect.arrayContaining([adminUserId, feature, 'UPDATE'])
      );
    });

    test('should validate tier requirements when updating features', async () => {
      const feature = 'invalid_tier_feature';
      const adminUserId = 'admin-user-123';

      await expect(
        featureManager.updateFeatureFlag(feature, true, 'invalid_tier', adminUserId)
      ).rejects.toThrow('Invalid tier requirement');
    });
  });
});
