/**
 * FeatureManager Test Suite
 * 
 * CRITICAL: Validates all tier combinations and performance requirements
 * Tests integration with Phase 1.5 security foundation
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 1.4
 */

import { FeatureManager } from '../FeatureManager';
import { DatabaseManager } from '../../../../backend/database/DatabaseManager';
import { LocalUserRepository } from '../../repositories/local/LocalUserRepository';

// Mock dependencies for testing
jest.mock('../../../../backend/database/DatabaseManager');
jest.mock('../../repositories/local/LocalUserRepository');
jest.mock('../../repositories/local/LocalFeatureFlagRepository');
jest.mock('../../security/SecureFeatureValidator');

describe('FeatureManager', () => {
  let featureManager: FeatureManager;
  let mockDbManager: jest.Mocked<DatabaseManager>;
  let mockUserRepository: jest.Mocked<LocalUserRepository>;

  const mockUsers = {
    free: {
      id: 'user-free-123',
      email: 'free@test.com',
      tier: 'free' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    pro: {
      id: 'user-pro-456',
      email: 'pro@test.com',
      tier: 'pro' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    enterprise: {
      id: 'user-enterprise-789',
      email: 'enterprise@test.com',
      tier: 'enterprise' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbManager = new DatabaseManager({ filePath: ':memory:' }) as jest.Mocked<DatabaseManager>;
    featureManager = new FeatureManager(mockDbManager);
    
    // Mock user repository
    mockUserRepository = require('../../repositories/local/LocalUserRepository').LocalUserRepository.mock.instances[0];
  });

  describe('Tier-Based Feature Access', () => {
    describe('Free Tier Features', () => {
      beforeEach(() => {
        mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.free);
      });

      test('should allow access to free tier features', async () => {
        const freeFeatures = [
          'air_duct_sizer'
        ];

        for (const feature of freeFeatures) {
          const result = await featureManager.isEnabled(feature, mockUsers.free.id);
          expect(result.enabled).toBe(true);
          expect(result.tier).toBe('free');
          expect(result.responseTime).toBeLessThan(50); // Performance requirement
        }
      });

      test('should deny access to pro tier features', async () => {
        const proFeatures = [
          'boiler_vent_sizer',
          'unlimited_projects',
          'cloud_sync',
          'high_res_pdf_export'
        ];

        for (const feature of proFeatures) {
          const result = await featureManager.isEnabled(feature, mockUsers.free.id);
          expect(result.enabled).toBe(false);
          expect(result.tier).toBe('free');
          expect(result.reason).toContain('tier');
        }
      });

      test('should deny access to enterprise tier features', async () => {
        const enterpriseFeatures = [
          'custom_templates',
          'bim_export',
          'sso_integration',
          'advanced_rbac'
        ];

        for (const feature of enterpriseFeatures) {
          const result = await featureManager.isEnabled(feature, mockUsers.free.id);
          expect(result.enabled).toBe(false);
          expect(result.tier).toBe('free');
          expect(result.reason).toContain('tier');
        }
      });
    });

    describe('Pro Tier Features', () => {
      beforeEach(() => {
        mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
      });

      test('should allow access to free and pro tier features', async () => {
        const allowedFeatures = [
          'air_duct_sizer', // free
          'boiler_vent_sizer', // pro
          'unlimited_projects', // pro
          'cloud_sync', // pro
          'high_res_pdf_export' // pro
        ];

        for (const feature of allowedFeatures) {
          const result = await featureManager.isEnabled(feature, mockUsers.pro.id);
          expect(result.enabled).toBe(true);
          expect(result.tier).toBe('pro');
          expect(result.responseTime).toBeLessThan(50); // Performance requirement
        }
      });

      test('should deny access to enterprise tier features', async () => {
        const enterpriseFeatures = [
          'custom_templates',
          'bim_export',
          'sso_integration',
          'advanced_rbac'
        ];

        for (const feature of enterpriseFeatures) {
          const result = await featureManager.isEnabled(feature, mockUsers.pro.id);
          expect(result.enabled).toBe(false);
          expect(result.tier).toBe('pro');
          expect(result.reason).toContain('tier');
        }
      });
    });

    describe('Enterprise Tier Features', () => {
      beforeEach(() => {
        mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.enterprise);
      });

      test('should allow access to all tier features', async () => {
        const allFeatures = [
          'air_duct_sizer', // free
          'boiler_vent_sizer', // pro
          'unlimited_projects', // pro
          'custom_templates', // enterprise
          'bim_export', // enterprise
          'sso_integration', // enterprise
          'advanced_rbac' // enterprise
        ];

        for (const feature of allFeatures) {
          const result = await featureManager.isEnabled(feature, mockUsers.enterprise.id);
          expect(result.enabled).toBe(true);
          expect(result.tier).toBe('enterprise');
          expect(result.responseTime).toBeLessThan(50); // Performance requirement
        }
      });
    });
  });

  describe('Performance Requirements', () => {
    beforeEach(() => {
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
    });

    test('should respond within 50ms for single feature check', async () => {
      const startTime = Date.now();
      const result = await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(50);
      expect(result.responseTime).toBeLessThan(50);
    });

    test('should use caching for improved performance', async () => {
      // First call - not cached
      const result1 = await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      expect(result1.cached).toBe(false);

      // Second call - should be cached
      const result2 = await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      expect(result2.cached).toBe(true);
      expect(result2.responseTime).toBeLessThan(result1.responseTime);
    });

    test('should handle batch feature checks efficiently', async () => {
      const features = [
        'air_duct_sizer',
        'boiler_vent_sizer',
        'unlimited_projects',
        'cloud_sync',
        'high_res_pdf_export'
      ];

      const startTime = Date.now();
      const batchResult = await featureManager.checkFeatures(features, mockUsers.pro.id);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(100); // Batch should be faster than individual calls
      expect(batchResult.features.size).toBe(features.length);
      expect(batchResult.totalResponseTime).toBeLessThan(100);
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
    });

    test('should cache feature results', async () => {
      await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      
      const cacheStats = featureManager.getCacheStatistics();
      expect(cacheStats.size).toBeGreaterThan(0);
    });

    test('should clear cache when requested', async () => {
      await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      
      featureManager.clearCache();
      
      const cacheStats = featureManager.getCacheStatistics();
      expect(cacheStats.size).toBe(0);
    });

    test('should track cache hit rate', async () => {
      // Make multiple calls to same feature
      await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      
      const cacheStats = featureManager.getCacheStatistics();
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('Usage Statistics', () => {
    beforeEach(() => {
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
    });

    test('should track feature usage statistics', async () => {
      await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      await featureManager.isEnabled('boiler_vent_sizer', mockUsers.pro.id);
      
      const stats = featureManager.getUsageStatistics();
      expect(stats.length).toBeGreaterThan(0);
      
      const airDuctStats = stats.find(s => s.featureName === 'air_duct_sizer');
      expect(airDuctStats).toBeDefined();
      expect(airDuctStats!.accessCount).toBe(1);
    });

    test('should track average response times', async () => {
      await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      
      const stats = featureManager.getUsageStatistics();
      const airDuctStats = stats.find(s => s.featureName === 'air_duct_sizer');
      
      expect(airDuctStats!.averageResponseTime).toBeGreaterThan(0);
      expect(airDuctStats!.averageResponseTime).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    test('should handle user not authenticated', async () => {
      mockUserRepository.getCurrentUser.mockResolvedValue(null);
      
      const result = await featureManager.isEnabled('air_duct_sizer', 'invalid-user');
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('authenticated');
    });

    test('should handle database errors gracefully', async () => {
      mockUserRepository.getCurrentUser.mockRejectedValue(new Error('Database error'));
      
      const result = await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('failed');
    });

    test('should handle unknown features', async () => {
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
      
      const result = await featureManager.isEnabled('unknown_feature', mockUsers.pro.id);
      
      expect(result.enabled).toBe(false);
    });
  });

  describe('Security Integration', () => {
    test('should integrate with SecureFeatureValidator', async () => {
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
      
      // Mock SecureFeatureValidator to return specific result
      const mockValidator = require('../../security/SecureFeatureValidator').SecureFeatureValidator.mock.instances[0];
      mockValidator.validateFeature.mockResolvedValue({
        valid: true,
        enabled: true
      });
      
      const result = await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      
      expect(mockValidator.validateFeature).toHaveBeenCalled();
      expect(result.enabled).toBe(true);
    });

    test('should respect security validation failures', async () => {
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
      
      // Mock SecureFeatureValidator to return security failure
      const mockValidator = require('../../security/SecureFeatureValidator').SecureFeatureValidator.mock.instances[0];
      mockValidator.validateFeature.mockResolvedValue({
        valid: false,
        enabled: false,
        error: 'Security validation failed'
      });
      
      const result = await featureManager.isEnabled('air_duct_sizer', mockUsers.pro.id);
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Security validation failed');
    });
  });

  describe('Tier Boundaries Compliance', () => {
    test('should enforce exact tier boundaries from specification', async () => {
      // Test specific tier boundaries from docs/implementation/tier-system/tier-boundaries-specification.md
      
      // Free tier: Only air_duct_sizer allowed
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.free);
      
      const freeResult = await featureManager.isEnabled('air_duct_sizer', mockUsers.free.id);
      expect(freeResult.enabled).toBe(true);
      
      const proFeatureResult = await featureManager.isEnabled('boiler_vent_sizer', mockUsers.free.id);
      expect(proFeatureResult.enabled).toBe(false);
      
      // Pro tier: Should have access to pro features
      mockUserRepository.getCurrentUser.mockResolvedValue(mockUsers.pro);
      
      const proResult = await featureManager.isEnabled('boiler_vent_sizer', mockUsers.pro.id);
      expect(proResult.enabled).toBe(true);
      
      const enterpriseFeatureResult = await featureManager.isEnabled('custom_templates', mockUsers.pro.id);
      expect(enterpriseFeatureResult.enabled).toBe(false);
    });
  });
});
