/**
 * LocalFeatureFlagRepository Test Suite
 * 
 * CRITICAL: Validates all CRUD operations and security integration
 * Tests feature flag database operations with tier-based validation
 * 
 * @see docs/implementation/tier-system/feature-flag-implementation.md
 * @see docs/api/repository-interfaces.md section 3
 */

import { LocalFeatureFlagRepository } from '../LocalFeatureFlagRepository';
import { DatabaseManager } from '../../../../__mocks__/backend/database/DatabaseManager';
import { FeatureFlag, UserTier, ValidationError, UserNotFoundError, DatabaseError } from '../../interfaces/FeatureFlagRepository';

describe('LocalFeatureFlagRepository', () => {
  let repository: LocalFeatureFlagRepository;
  let dbManager: DatabaseManager;
  let testUserId: string;

  const mockFeatureFlag: FeatureFlag = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    featureName: 'test_feature',
    enabled: true,
    tierRequired: 'pro',
    createdAt: new Date()
  };

  beforeEach(async () => {
    // Use in-memory database for testing
    dbManager = new DatabaseManager({ filePath: ':memory:' });
    await dbManager.initialize();
    repository = new LocalFeatureFlagRepository(dbManager);
    
    testUserId = '550e8400-e29b-41d4-a716-446655440001';
    
    // Create test user
    const db = dbManager.getConnection();
    db.prepare(`
      INSERT INTO users (id, email, tier, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, 'test@example.com', 'pro', new Date().toISOString(), new Date().toISOString());
  });

  afterEach(async () => {
    await dbManager.close();
  });

  describe('Feature Flag CRUD Operations', () => {
    describe('setFeatureFlag', () => {
      test('should create new feature flag successfully', async () => {
        await repository.setFeatureFlag(mockFeatureFlag);
        
        const retrieved = await repository.getFeatureFlag(mockFeatureFlag.userId!, mockFeatureFlag.featureName);
        
        expect(retrieved).toBeDefined();
        expect(retrieved!.id).toBe(mockFeatureFlag.id);
        expect(retrieved!.featureName).toBe(mockFeatureFlag.featureName);
        expect(retrieved!.enabled).toBe(mockFeatureFlag.enabled);
        expect(retrieved!.tierRequired).toBe(mockFeatureFlag.tierRequired);
      });

      test('should update existing feature flag', async () => {
        // Create initial flag
        await repository.setFeatureFlag(mockFeatureFlag);
        
        // Update the flag
        const updatedFlag = { ...mockFeatureFlag, enabled: false };
        await repository.setFeatureFlag(updatedFlag);
        
        const retrieved = await repository.getFeatureFlag(mockFeatureFlag.userId!, mockFeatureFlag.featureName);
        
        expect(retrieved!.enabled).toBe(false);
        expect(retrieved!.id).toBe(mockFeatureFlag.id); // Same ID
      });

      test('should validate feature flag data', async () => {
        const invalidFlag = { ...mockFeatureFlag, id: 'invalid-uuid' };
        
        await expect(repository.setFeatureFlag(invalidFlag)).rejects.toThrow(ValidationError);
      });

      test('should validate user exists', async () => {
        const flagWithInvalidUser = { ...mockFeatureFlag, userId: '550e8400-e29b-41d4-a716-446655440999' };
        
        await expect(repository.setFeatureFlag(flagWithInvalidUser)).rejects.toThrow(UserNotFoundError);
      });
    });

    describe('getFeatureFlag', () => {
      beforeEach(async () => {
        await repository.setFeatureFlag(mockFeatureFlag);
      });

      test('should retrieve user-specific feature flag', async () => {
        const retrieved = await repository.getFeatureFlag(mockFeatureFlag.userId!, mockFeatureFlag.featureName);
        
        expect(retrieved).toBeDefined();
        expect(retrieved!.featureName).toBe(mockFeatureFlag.featureName);
        expect(retrieved!.userId).toBe(mockFeatureFlag.userId);
      });

      test('should return null for non-existent feature flag', async () => {
        const retrieved = await repository.getFeatureFlag(testUserId, 'non_existent_feature');
        
        expect(retrieved).toBeNull();
      });

      test('should retrieve global feature flag when user-specific not found', async () => {
        // Create global flag
        const globalFlag = { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440002', userId: undefined };
        await repository.setFeatureFlag(globalFlag);
        
        // Try to get flag for different user
        const otherUserId = '550e8400-e29b-41d4-a716-446655440003';
        const retrieved = await repository.getFeatureFlag(otherUserId, mockFeatureFlag.featureName);
        
        expect(retrieved).toBeDefined();
        expect(retrieved!.userId).toBeUndefined(); // Global flag
      });

      test('should validate UUID format', async () => {
        await expect(repository.getFeatureFlag('invalid-uuid', 'test_feature')).rejects.toThrow(ValidationError);
      });

      test('should validate feature name', async () => {
        await expect(repository.getFeatureFlag(testUserId, '')).rejects.toThrow(ValidationError);
        await expect(repository.getFeatureFlag(testUserId, 'Invalid-Feature-Name')).rejects.toThrow(ValidationError);
      });
    });

    describe('getUserFlags', () => {
      beforeEach(async () => {
        // Create multiple flags for user
        const flags = [
          { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440010', featureName: 'feature_a' },
          { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440011', featureName: 'feature_b' },
          { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440012', featureName: 'feature_c' }
        ];
        
        for (const flag of flags) {
          await repository.setFeatureFlag(flag);
        }
      });

      test('should retrieve all user flags', async () => {
        const flags = await repository.getUserFlags(testUserId);
        
        expect(flags).toHaveLength(3);
        expect(flags.map(f => f.featureName).sort((a, b) => a.localeCompare(b))).toEqual(['feature_a', 'feature_b', 'feature_c']);
      });

      test('should return empty array for user with no flags', async () => {
        const otherUserId = '550e8400-e29b-41d4-a716-446655440003';
        
        // Create other user
        const db = dbManager.getConnection();
        db.prepare(`
          INSERT INTO users (id, email, tier, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(otherUserId, 'other@example.com', 'free', new Date().toISOString(), new Date().toISOString());
        
        const flags = await repository.getUserFlags(otherUserId);
        
        expect(flags).toHaveLength(0);
      });

      test('should validate user exists', async () => {
        await expect(repository.getUserFlags('550e8400-e29b-41d4-a716-446655440999')).rejects.toThrow(UserNotFoundError);
      });
    });

    describe('removeFeatureFlag', () => {
      beforeEach(async () => {
        await repository.setFeatureFlag(mockFeatureFlag);
      });

      test('should remove feature flag successfully', async () => {
        await repository.removeFeatureFlag(mockFeatureFlag.userId!, mockFeatureFlag.featureName);
        
        const retrieved = await repository.getFeatureFlag(mockFeatureFlag.userId!, mockFeatureFlag.featureName);
        
        expect(retrieved).toBeNull();
      });

      test('should not throw error when removing non-existent flag', async () => {
        await expect(repository.removeFeatureFlag(testUserId, 'non_existent_feature')).resolves.not.toThrow();
      });

      test('should validate user exists', async () => {
        await expect(repository.removeFeatureFlag('550e8400-e29b-41d4-a716-446655440999', 'test_feature')).rejects.toThrow(UserNotFoundError);
      });
    });
  });

  describe('Global Feature Flags', () => {
    test('should create and retrieve global feature flags', async () => {
      const globalFlag = { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440020', userId: undefined };
      
      await repository.setFeatureFlag(globalFlag);
      
      const globalFlags = await repository.getGlobalFlags();
      
      expect(globalFlags).toHaveLength(1);
      expect(globalFlags[0].featureName).toBe(globalFlag.featureName);
      expect(globalFlags[0].userId).toBeUndefined();
    });

    test('should retrieve multiple global flags', async () => {
      const globalFlags = [
        { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440021', userId: undefined, featureName: 'global_a' },
        { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440022', userId: undefined, featureName: 'global_b' }
      ];
      
      for (const flag of globalFlags) {
        await repository.setFeatureFlag(flag);
      }
      
      const retrieved = await repository.getGlobalFlags();
      
      expect(retrieved).toHaveLength(2);
      expect(retrieved.map(f => f.featureName).sort((a, b) => a.localeCompare(b))).toEqual(['global_a', 'global_b']);
    });
  });

  describe('Tier-Based Feature Flags', () => {
    beforeEach(async () => {
      // Create flags for different tiers
      const tierFlags = [
        { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440030', featureName: 'free_feature', tierRequired: 'free' as UserTier },
        { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440031', featureName: 'pro_feature', tierRequired: 'pro' as UserTier },
        { ...mockFeatureFlag, id: '550e8400-e29b-41d4-a716-446655440032', featureName: 'enterprise_feature', tierRequired: 'enterprise' as UserTier }
      ];
      
      for (const flag of tierFlags) {
        await repository.setFeatureFlag(flag);
      }
    });

    test('should retrieve flags for free tier', async () => {
      const flags = await repository.getFlagsForTier('free');
      
      expect(flags).toHaveLength(1);
      expect(flags[0].featureName).toBe('free_feature');
    });

    test('should retrieve flags for pro tier (includes free)', async () => {
      const flags = await repository.getFlagsForTier('pro');
      
      expect(flags).toHaveLength(2);
      expect(flags.map(f => f.featureName).sort((a, b) => a.localeCompare(b))).toEqual(['free_feature', 'pro_feature']);
    });

    test('should retrieve flags for enterprise tier (includes all)', async () => {
      const flags = await repository.getFlagsForTier('enterprise');
      
      expect(flags).toHaveLength(3);
      expect(flags.map(f => f.featureName).sort((a, b) => a.localeCompare(b))).toEqual(['enterprise_feature', 'free_feature', 'pro_feature']);
    });

    test('should validate tier parameter', async () => {
      await expect(repository.getFlagsForTier('invalid' as UserTier)).rejects.toThrow(ValidationError);
    });
  });

  describe('Feature Flag Expiration', () => {
    test('should not return expired feature flags', async () => {
      const expiredFlag = {
        ...mockFeatureFlag,
        id: '550e8400-e29b-41d4-a716-446655440040',
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      };
      
      await repository.setFeatureFlag(expiredFlag);
      
      const retrieved = await repository.getFeatureFlag(expiredFlag.userId!, expiredFlag.featureName);
      
      expect(retrieved).toBeNull();
    });

    test('should return non-expired feature flags', async () => {
      const futureFlag = {
        ...mockFeatureFlag,
        id: '550e8400-e29b-41d4-a716-446655440041',
        expiresAt: new Date(Date.now() + 60000) // Expires in 1 minute
      };
      
      await repository.setFeatureFlag(futureFlag);
      
      const retrieved = await repository.getFeatureFlag(futureFlag.userId!, futureFlag.featureName);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.featureName).toBe(futureFlag.featureName);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close database to simulate error
      await dbManager.close();
      
      await expect(repository.getFeatureFlag(testUserId, 'test_feature')).rejects.toThrow(DatabaseError);
    });

    test('should validate feature name format', async () => {
      const invalidNames = ['', 'Feature-Name', 'feature name', 'FEATURE_NAME', 'feature.name'];
      
      for (const name of invalidNames) {
        await expect(repository.getFeatureFlag(testUserId, name)).rejects.toThrow(ValidationError);
      }
    });

    test('should validate UUID format', async () => {
      const invalidUUIDs = ['', 'not-a-uuid', '123', 'invalid-uuid-format'];
      
      for (const uuid of invalidUUIDs) {
        await expect(repository.getFeatureFlag(uuid, 'test_feature')).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('Change Logging', () => {
    test('should log feature flag changes for cloud sync', async () => {
      await repository.setFeatureFlag(mockFeatureFlag);
      
      // Check change log
      const db = dbManager.getConnection();
      const logs = db.prepare('SELECT * FROM change_log WHERE entity_type = ?').all('feature_flag');
      
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('INSERT');
      expect(logs[0].user_id).toBe(mockFeatureFlag.userId);
    });

    test('should log feature flag removal', async () => {
      await repository.setFeatureFlag(mockFeatureFlag);
      await repository.removeFeatureFlag(mockFeatureFlag.userId!, mockFeatureFlag.featureName);
      
      // Check change log
      const db = dbManager.getConnection();
      const logs = db.prepare('SELECT * FROM change_log WHERE operation = ?').all('DELETE');
      
      expect(logs).toHaveLength(1);
      expect(logs[0].entity_type).toBe('feature_flag');
    });
  });
});
