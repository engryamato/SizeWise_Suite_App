/**
 * LocalUserRepository Test Suite
 * 
 * CRITICAL: Validates all user operations and tier management
 * Tests user CRUD operations, tier updates, and license validation
 * 
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 * @see docs/api/repository-interfaces.md section 2
 */

import { LocalUserRepository } from '../LocalUserRepository';
import { DatabaseManager } from '../../../../../backend/database/DatabaseManager';
import { User, UserTier, ValidationError, UserNotFoundError, DatabaseError } from '../../interfaces/UserRepository';

describe('LocalUserRepository', () => {
  let repository: LocalUserRepository;
  let dbManager: DatabaseManager;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
    tier: 'pro',
    company: 'Test Company',
    licenseKey: 'TEST-1234-5678-9ABC',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    // Use in-memory database for testing
    dbManager = new DatabaseManager({ filePath: ':memory:' });
    await dbManager.initialize();
    repository = new LocalUserRepository(dbManager);
  });

  afterEach(async () => {
    await dbManager.close();
  });

  describe('User CRUD Operations', () => {
    describe('saveUser', () => {
      test('should create new user successfully', async () => {
        await repository.saveUser(mockUser);
        
        const retrieved = await repository.getUser(mockUser.id);
        
        expect(retrieved).toBeDefined();
        expect(retrieved!.id).toBe(mockUser.id);
        expect(retrieved!.email).toBe(mockUser.email);
        expect(retrieved!.tier).toBe(mockUser.tier);
        expect(retrieved!.company).toBe(mockUser.company);
        expect(retrieved!.licenseKey).toBe(mockUser.licenseKey);
      });

      test('should update existing user', async () => {
        // Create initial user
        await repository.saveUser(mockUser);
        
        // Update the user
        const updatedUser = { ...mockUser, name: 'Updated Name', company: 'Updated Company' };
        await repository.saveUser(updatedUser);
        
        const retrieved = await repository.getUser(mockUser.id);
        
        expect(retrieved!.name).toBe('Updated Name');
        expect(retrieved!.company).toBe('Updated Company');
        expect(retrieved!.id).toBe(mockUser.id); // Same ID
      });

      test('should validate user data', async () => {
        const invalidUsers = [
          { ...mockUser, id: '' }, // Empty ID
          { ...mockUser, email: '' }, // Empty email
          { ...mockUser, email: 'invalid-email' }, // Invalid email format
          { ...mockUser, tier: 'invalid' as UserTier }, // Invalid tier
          { ...mockUser, id: 'invalid-uuid' } // Invalid UUID format
        ];

        for (const invalidUser of invalidUsers) {
          await expect(repository.saveUser(invalidUser)).rejects.toThrow(ValidationError);
        }
      });
    });

    describe('getUser', () => {
      beforeEach(async () => {
        await repository.saveUser(mockUser);
      });

      test('should retrieve user by ID', async () => {
        const retrieved = await repository.getUser(mockUser.id);
        
        expect(retrieved).toBeDefined();
        expect(retrieved!.id).toBe(mockUser.id);
        expect(retrieved!.email).toBe(mockUser.email);
      });

      test('should return null for non-existent user', async () => {
        const retrieved = await repository.getUser('550e8400-e29b-41d4-a716-446655440999');
        
        expect(retrieved).toBeNull();
      });

      test('should validate UUID format', async () => {
        await expect(repository.getUser('invalid-uuid')).rejects.toThrow(ValidationError);
      });
    });

    describe('getCurrentUser', () => {
      test('should return first user in offline mode', async () => {
        // Create multiple users
        const user1 = { ...mockUser, id: '550e8400-e29b-41d4-a716-446655440001', email: 'user1@example.com' };
        const user2 = { ...mockUser, id: '550e8400-e29b-41d4-a716-446655440002', email: 'user2@example.com' };
        
        await repository.saveUser(user1);
        await repository.saveUser(user2);
        
        const currentUser = await repository.getCurrentUser();
        
        expect(currentUser).toBeDefined();
        expect(currentUser!.email).toBe('user1@example.com'); // First created
      });

      test('should return null when no users exist', async () => {
        const currentUser = await repository.getCurrentUser();
        
        expect(currentUser).toBeNull();
      });
    });
  });

  describe('Tier Management', () => {
    beforeEach(async () => {
      await repository.saveUser(mockUser);
    });

    describe('updateUserTier', () => {
      test('should update user tier successfully', async () => {
        await repository.updateUserTier(mockUser.id, 'enterprise');
        
        const updated = await repository.getUser(mockUser.id);
        
        expect(updated!.tier).toBe('enterprise');
      });

      test('should log tier change for audit', async () => {
        await repository.updateUserTier(mockUser.id, 'free');
        
        // Check change log
        const db = dbManager.getConnection();
        const logs = db.prepare('SELECT * FROM change_log WHERE entity_type = ? AND operation = ?').all('user', 'UPDATE');
        
        expect(logs).toHaveLength(1);
        expect(logs[0].user_id).toBe(mockUser.id);
        
        const changes = JSON.parse(logs[0].changes);
        expect(changes.previousTier).toBe('pro');
        expect(changes.newTier).toBe('free');
      });

      test('should validate tier value', async () => {
        await expect(repository.updateUserTier(mockUser.id, 'invalid' as UserTier)).rejects.toThrow(ValidationError);
      });

      test('should validate user exists', async () => {
        await expect(repository.updateUserTier('550e8400-e29b-41d4-a716-446655440999', 'pro')).rejects.toThrow(UserNotFoundError);
      });

      test('should update feature flags when tier changes', async () => {
        // Downgrade to free tier
        await repository.updateUserTier(mockUser.id, 'free');
        
        // Check that higher-tier features are removed
        const db = dbManager.getConnection();
        const flags = db.prepare('SELECT * FROM feature_flags WHERE user_id = ? AND tier_required > 1').all(mockUser.id);
        
        expect(flags).toHaveLength(0); // No pro/enterprise features should remain
      });
    });
  });

  describe('License Management', () => {
    describe('validateLicense', () => {
      test('should validate correct license format', async () => {
        const validLicenses = [
          'ABCD-1234-EFGH-5678',
          'TEST-0000-DEMO-9999',
          'PROD-ABCD-1234-WXYZ'
        ];

        for (const license of validLicenses) {
          // Create user with license
          const userWithLicense = { ...mockUser, id: `550e8400-e29b-41d4-a716-44665544000${validLicenses.indexOf(license)}`, licenseKey: license };
          await repository.saveUser(userWithLicense);
          
          const isValid = await repository.validateLicense(license);
          expect(isValid).toBe(true);
        }
      });

      test('should reject invalid license formats', async () => {
        const invalidLicenses = [
          '',
          'invalid',
          'ABC-123',
          'ABCD-1234-EFGH',
          'abcd-1234-efgh-5678', // lowercase
          'ABCD-1234-EFGH-567G' // invalid character
        ];

        for (const license of invalidLicenses) {
          const isValid = await repository.validateLicense(license);
          expect(isValid).toBe(false);
        }
      });

      test('should reject non-existent licenses', async () => {
        const isValid = await repository.validateLicense('FAKE-1234-5678-9ABC');
        expect(isValid).toBe(false);
      });
    });

    describe('getLicenseInfo', () => {
      beforeEach(async () => {
        await repository.saveUser(mockUser);
      });

      test('should return license info for valid user', async () => {
        const licenseInfo = await repository.getLicenseInfo(mockUser.id);
        
        expect(licenseInfo).toBeDefined();
        expect(licenseInfo!.tier).toBe(mockUser.tier);
        expect(licenseInfo!.isValid).toBe(true);
        expect(licenseInfo!.features).toBeDefined();
        expect(Array.isArray(licenseInfo!.features)).toBe(true);
      });

      test('should include tier-appropriate features', async () => {
        // Test pro tier features
        const licenseInfo = await repository.getLicenseInfo(mockUser.id);
        
        expect(licenseInfo!.features).toContain('basic_calculations');
        expect(licenseInfo!.features).toContain('unlimited_projects');
        expect(licenseInfo!.features).not.toContain('custom_templates'); // Enterprise only
      });

      test('should validate user exists', async () => {
        await expect(repository.getLicenseInfo('550e8400-e29b-41d4-a716-446655440999')).rejects.toThrow(UserNotFoundError);
      });
    });
  });

  describe('Feature Integration', () => {
    test('should create default features when user tier is set', async () => {
      const enterpriseUser = { ...mockUser, id: '550e8400-e29b-41d4-a716-446655440010', tier: 'enterprise' as UserTier };
      await repository.saveUser(enterpriseUser);
      
      // Trigger feature flag creation by updating tier
      await repository.updateUserTier(enterpriseUser.id, 'enterprise');
      
      // Check that enterprise features are created
      const db = dbManager.getConnection();
      const flags = db.prepare('SELECT * FROM feature_flags WHERE user_id = ?').all(enterpriseUser.id);
      
      expect(flags.length).toBeGreaterThan(0);
      
      const featureNames = flags.map((f: any) => f.feature_name);
      expect(featureNames).toContain('custom_templates');
      expect(featureNames).toContain('bim_export');
    });

    test('should remove features when downgrading tier', async () => {
      const enterpriseUser = { ...mockUser, id: '550e8400-e29b-41d4-a716-446655440011', tier: 'enterprise' as UserTier };
      await repository.saveUser(enterpriseUser);
      
      // Set up enterprise features
      await repository.updateUserTier(enterpriseUser.id, 'enterprise');
      
      // Downgrade to free
      await repository.updateUserTier(enterpriseUser.id, 'free');
      
      // Check that only free tier features remain
      const db = dbManager.getConnection();
      const flags = db.prepare('SELECT * FROM feature_flags WHERE user_id = ? AND tier_required > 1').all(enterpriseUser.id);
      
      expect(flags).toHaveLength(0); // No pro/enterprise features
    });
  });

  describe('Data Validation', () => {
    test('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        ''
      ];

      for (const email of invalidEmails) {
        const invalidUser = { ...mockUser, email };
        await expect(repository.saveUser(invalidUser)).rejects.toThrow(ValidationError);
      }
    });

    test('should validate UUID format', async () => {
      const invalidUUIDs = [
        '',
        'not-a-uuid',
        '123',
        'invalid-uuid-format',
        '550e8400-e29b-41d4-a716' // incomplete
      ];

      for (const id of invalidUUIDs) {
        const invalidUser = { ...mockUser, id };
        await expect(repository.saveUser(invalidUser)).rejects.toThrow(ValidationError);
      }
    });

    test('should validate tier values', async () => {
      const invalidTiers = ['invalid', 'premium', 'basic', ''];

      for (const tier of invalidTiers) {
        const invalidUser = { ...mockUser, tier: tier as UserTier };
        await expect(repository.saveUser(invalidUser)).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close database to simulate error
      await dbManager.close();
      
      await expect(repository.getUser(mockUser.id)).rejects.toThrow(DatabaseError);
    });

    test('should preserve data integrity during errors', async () => {
      await repository.saveUser(mockUser);
      
      // Try to save invalid user (should fail)
      const invalidUser = { ...mockUser, email: 'invalid-email' };
      await expect(repository.saveUser(invalidUser)).rejects.toThrow(ValidationError);
      
      // Original user should still exist and be unchanged
      const retrieved = await repository.getUser(mockUser.id);
      expect(retrieved!.email).toBe(mockUser.email);
    });
  });

  describe('Change Logging', () => {
    test('should log user creation', async () => {
      await repository.saveUser(mockUser);
      
      // Check change log
      const db = dbManager.getConnection();
      const logs = db.prepare('SELECT * FROM change_log WHERE entity_type = ? AND operation = ?').all('user', 'INSERT');
      
      expect(logs).toHaveLength(1);
      expect(logs[0].user_id).toBe(mockUser.id);
      expect(logs[0].entity_id).toBe(mockUser.id);
    });

    test('should log user updates', async () => {
      await repository.saveUser(mockUser);
      
      // Update user
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      await repository.saveUser(updatedUser);
      
      // Check change log
      const db = dbManager.getConnection();
      const logs = db.prepare('SELECT * FROM change_log WHERE entity_type = ? AND operation = ?').all('user', 'UPDATE');
      
      expect(logs).toHaveLength(1);
      expect(logs[0].user_id).toBe(mockUser.id);
    });
  });
});
