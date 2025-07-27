/**
 * Super Admin Authentication Test Suite
 *
 * CRITICAL: Tests super administrator authentication system behavior in frontend environment
 * Validates proper error handling when SuperAdminValidator is not available in frontend
 *
 * @see docs/implementation/security/super-admin-architecture.md
 */

import { AuthenticationManager } from '../AuthenticationManager';

describe('Super Admin Authentication System - Frontend Behavior', () => {
  let authManager: AuthenticationManager;

  beforeEach(() => {
    authManager = new AuthenticationManager();
  });

  describe('Frontend Super Admin Authentication', () => {
    const validHardwareKeyRequest = {
      userId: 'admin-user-123',
      hardwareKeyId: 'hardware-key-456',
      challenge: 'test-challenge',
      signature: 'valid-signature',
      clientData: 'client-data'
    };

    test('should handle authentication without initialized validator', async () => {
      // Don't initialize validator - this is the expected frontend behavior
      const result = await authManager.authenticateSuperAdmin(validHardwareKeyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Super admin validator not initialized');
      expect(result.requiresHardwareKey).toBe(true);
    });

    test('should handle authentication errors gracefully', async () => {
      // Test that the frontend properly handles the case where SuperAdminValidator is not available
      try {
        const result = await authManager.authenticateSuperAdmin(validHardwareKeyRequest);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Super admin validator not initialized');
      } catch (error) {
        // If it throws, it should be the expected frontend error
        expect(error.message).toContain('SuperAdminValidator not available in frontend');
      }
    });
  });

  describe('Emergency Access', () => {
    const validEmergencyRequest = {
      reason: 'System lockout - need to recover user access for critical business operations',
      requestedPermissions: ['user_recovery', 'emergency_unlock'],
      hardwareKeyProof: Buffer.from('valid-proof-data').toString('base64'),
      contactInfo: 'admin@company.com'
    };

    test('should handle emergency access request in frontend', async () => {
      // Test that emergency access properly handles frontend limitations
      try {
        const result = await authManager.requestEmergencyAccess(validEmergencyRequest);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Super admin validator not initialized');
      } catch (error) {
        // If it throws, it should be the expected frontend error
        expect(error.message).toContain('SuperAdminValidator not available in frontend');
      }
    });
  });

  describe('Session Management', () => {
    test('should handle session validation in frontend', async () => {
      // Test that session validation properly handles frontend limitations
      try {
        const isValid = await authManager.validateSuperAdminSession('session-123');
        expect(isValid).toBe(false);
      } catch (error) {
        expect(error.message).toContain('SuperAdminValidator not available in frontend');
      }
    });

    test('should get current super admin session', async () => {
      // In frontend, session should be null initially
      const session = authManager.getCurrentSuperAdminSession();
      expect(session).toBeNull();
    });

    test('should check super admin permissions', async () => {
      // In frontend without session, permissions should be false
      expect(authManager.hasSuperAdminPermission('license_reset')).toBe(false);
      expect(authManager.hasSuperAdminPermission('user_recovery')).toBe(false);
      expect(authManager.hasSuperAdminPermission('database_repair')).toBe(false);
    });

    test('should handle session revocation in frontend', async () => {
      // Test that session revocation properly handles frontend limitations
      try {
        const revoked = await authManager.revokeSuperAdminSession('Test revocation');
        expect(revoked).toBe(false);
      } catch (error) {
        expect(error.message).toContain('SuperAdminValidator not available in frontend');
      }
    });
  });

  describe('Hardware Key Registration', () => {
    const validKeyCredential = {
      keyId: 'test-key-id',
      publicKey: 'test-public-key',
      algorithm: 'ES256',
      counter: 0
    };

    test('should handle hardware key registration in frontend', async () => {
      // Test that hardware key registration properly handles frontend limitations
      try {
        const result = await authManager.registerHardwareKey(
          'admin-user-123',
          validKeyCredential
        );
        expect(result.success).toBe(false);
        expect(result.reason).toContain('Super admin validator not initialized');
      } catch (error) {
        expect(error.message).toContain('SuperAdminValidator not available in frontend');
      }
    });
  });

  describe('Security Monitoring', () => {
    test('should provide security statistics in frontend', async () => {
      // In frontend, security stats should return null
      const stats = authManager.getSuperAdminSecurityStats();
      expect(stats).toBeNull();
    });

    test('should provide audit trail in frontend', async () => {
      // In frontend, audit trail should return empty array
      const auditTrail = authManager.getSuperAdminAuditTrail(10);
      expect(auditTrail).toEqual([]);
    });
  });
});
