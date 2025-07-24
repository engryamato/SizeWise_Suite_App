/**
 * SuperAdminValidator Test Suite - Comprehensive Security Testing
 * 
 * CRITICAL: Validates super administrator security system
 * Tests hardware key authentication, emergency access, and audit logging
 * 
 * @see docs/implementation/security/super-admin-architecture.md
 */

import { SuperAdminValidator } from '../SuperAdminValidator';
import { SecurityManager } from '../SecurityManager';
import { CryptoUtils } from '../CryptoUtils';
import { 
  HardwareKeyCredential, 
  SuperAdminPermission, 
  EmergencyAccessRequest,
  SuperAdminValidationResult 
} from '../SuperAdminValidator';

// Mock dependencies
jest.mock('../SecurityManager');
jest.mock('../CryptoUtils');

describe('SuperAdminValidator - Comprehensive Security Testing', () => {
  let superAdminValidator: SuperAdminValidator;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  let mockCryptoUtils: jest.Mocked<CryptoUtils>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SecurityManager
    mockSecurityManager = {
      encrypt: jest.fn().mockResolvedValue('encrypted-data'),
      decrypt: jest.fn().mockResolvedValue('decrypted-data'),
      hash: jest.fn().mockResolvedValue('hashed-data'),
      validateSignature: jest.fn().mockResolvedValue(true)
    } as any;

    // Mock CryptoUtils
    mockCryptoUtils = {
      generateSecureId: jest.fn().mockResolvedValue('secure-id-123'),
      validatePublicKey: jest.fn().mockResolvedValue(true),
      verifySignature: jest.fn().mockResolvedValue(true)
    } as any;

    (SecurityManager as jest.MockedClass<typeof SecurityManager>).mockImplementation(() => mockSecurityManager);
    (CryptoUtils as jest.MockedClass<typeof CryptoUtils>).mockImplementation(() => mockCryptoUtils);

    superAdminValidator = new SuperAdminValidator(mockSecurityManager);
  });

  describe('Hardware Key Registration', () => {
    const validKeyCredential: HardwareKeyCredential = {
      keyId: 'test-key-id',
      publicKey: 'test-public-key',
      algorithm: 'ES256',
      counter: 0
    };

    test('should register valid hardware key successfully', async () => {
      const result = await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        validKeyCredential
      );

      expect(result.success).toBe(true);
      expect(result.keyId).toBe('secure-id-123');
      expect(mockCryptoUtils.validatePublicKey).toHaveBeenCalledWith('test-public-key');
      expect(mockSecurityManager.encrypt).toHaveBeenCalled();
    });

    test('should reject hardware key with invalid format', async () => {
      const invalidCredential = {
        ...validKeyCredential,
        publicKey: ''
      };

      const result = await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        invalidCredential
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid credential format');
    });

    test('should reject hardware key with unsupported algorithm', async () => {
      const invalidCredential = {
        ...validKeyCredential,
        algorithm: 'INVALID' as any
      };

      const result = await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        invalidCredential
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Unsupported algorithm');
    });

    test('should validate attestation data when provided', async () => {
      const attestationData = new ArrayBuffer(64);
      const attestationView = new Uint8Array(attestationData);
      attestationView[0] = 0x58; // Valid header

      const result = await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        validKeyCredential,
        attestationData
      );

      expect(result.success).toBe(true);
    });

    test('should reject invalid attestation data', async () => {
      const invalidAttestationData = new ArrayBuffer(16); // Too small

      const result = await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        validKeyCredential,
        invalidAttestationData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid attestation data');
    });
  });

  describe('Super Admin Authentication', () => {
    beforeEach(async () => {
      // Register a hardware key first
      await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        {
          keyId: 'test-key-id',
          publicKey: 'test-public-key',
          algorithm: 'ES256',
          counter: 0
        }
      );
    });

    test('should authenticate super admin with valid hardware key', async () => {
      const result = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );

      expect(result.valid).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.permissions).toHaveLength(5); // Full super admin permissions
      expect(result.emergencyAccess).toBe(false);
      expect(mockCryptoUtils.verifySignature).toHaveBeenCalled();
    });

    test('should reject authentication with unregistered hardware key', async () => {
      const result = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'unregistered-key-id',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Hardware key not registered');
    });

    test('should reject authentication with invalid signature', async () => {
      mockCryptoUtils.verifySignature.mockResolvedValue(false);

      const result = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'invalid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid hardware key signature');
    });

    test('should enforce concurrent session limits', async () => {
      // Create first session
      const firstAuth = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );
      expect(firstAuth.valid).toBe(true);

      // Create second session
      const secondAuth = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );
      expect(secondAuth.valid).toBe(true);

      // Third session should be rejected
      const thirdAuth = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );
      expect(thirdAuth.valid).toBe(false);
      expect(thirdAuth.reason).toContain('Maximum concurrent sessions exceeded');
    });
  });

  describe('Emergency Access', () => {
    const validEmergencyRequest: EmergencyAccessRequest = {
      reason: 'System lockout - need to recover user access for critical business operations',
      requestedPermissions: ['user_recovery', 'emergency_unlock'],
      hardwareKeyProof: Buffer.from('valid-proof-data').toString('base64'),
      contactInfo: 'admin@company.com'
    };

    test('should grant emergency access with valid request', async () => {
      const result = await superAdminValidator.requestEmergencyAccess(
        validEmergencyRequest,
        '192.168.1.1',
        'Emergency User Agent'
      );

      expect(result.valid).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.emergencyAccess).toBe(true);
      expect(result.permissions).toHaveLength(2); // Limited emergency permissions
    });

    test('should reject emergency access with insufficient reason', async () => {
      const invalidRequest = {
        ...validEmergencyRequest,
        reason: 'short' // Too short
      };

      const result = await superAdminValidator.requestEmergencyAccess(
        invalidRequest,
        '192.168.1.1',
        'Emergency User Agent'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Emergency reason must be 10-500 characters');
    });

    test('should reject emergency access with invalid permissions', async () => {
      const invalidRequest = {
        ...validEmergencyRequest,
        requestedPermissions: ['invalid_permission']
      };

      const result = await superAdminValidator.requestEmergencyAccess(
        invalidRequest,
        '192.168.1.1',
        'Emergency User Agent'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid permissions');
    });

    test('should reject emergency access with invalid hardware key proof', async () => {
      const invalidRequest = {
        ...validEmergencyRequest,
        hardwareKeyProof: 'short' // Too short
      };

      const result = await superAdminValidator.requestEmergencyAccess(
        invalidRequest,
        '192.168.1.1',
        'Emergency User Agent'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid hardware key proof');
    });
  });

  describe('Session Management', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Register hardware key and authenticate
      await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        {
          keyId: 'test-key-id',
          publicKey: 'test-public-key',
          algorithm: 'ES256',
          counter: 0
        }
      );

      const authResult = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );

      sessionId = authResult.sessionId!;
    });

    test('should validate active session', async () => {
      const result = await superAdminValidator.validateSession(sessionId);

      expect(result.valid).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.permissions).toHaveLength(5);
    });

    test('should reject validation of non-existent session', async () => {
      const result = await superAdminValidator.validateSession('non-existent-session');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Session not found');
    });

    test('should revoke session successfully', async () => {
      const revokeResult = await superAdminValidator.revokeSession(sessionId, 'Manual revocation');
      expect(revokeResult).toBe(true);

      // Session should no longer be valid
      const validateResult = await superAdminValidator.validateSession(sessionId);
      expect(validateResult.valid).toBe(false);
    });

    test('should handle session expiration', async () => {
      // Mock expired session by manipulating time
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60 * 1000); // 31 minutes later

      const result = await superAdminValidator.validateSession(sessionId);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Session expired');
    });
  });

  describe('Audit Logging', () => {
    test('should maintain comprehensive audit trail', async () => {
      // Perform various operations
      await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        {
          keyId: 'test-key-id',
          publicKey: 'test-public-key',
          algorithm: 'ES256',
          counter: 0
        }
      );

      await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );

      const auditTrail = superAdminValidator.getAuditTrail(10);

      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0]).toHaveProperty('timestamp');
      expect(auditTrail[0]).toHaveProperty('action');
      expect(auditTrail[0]).toHaveProperty('userId');
      expect(auditTrail[0]).toHaveProperty('success');
    });

    test('should provide security statistics', () => {
      const stats = superAdminValidator.getSecurityStatistics();

      expect(stats).toHaveProperty('activeSessionCount');
      expect(stats).toHaveProperty('registeredKeyCount');
      expect(stats).toHaveProperty('auditLogSize');
      expect(stats).toHaveProperty('recentFailedAttempts');
      expect(stats).toHaveProperty('emergencyAccessCount');
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle concurrent authentication attempts', async () => {
      await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        {
          keyId: 'test-key-id',
          publicKey: 'test-public-key',
          algorithm: 'ES256',
          counter: 0
        }
      );

      // Simulate concurrent authentication attempts
      const authPromises = Array.from({ length: 5 }, () =>
        superAdminValidator.authenticateSuperAdmin(
          'admin-user-123',
          'secure-id-123',
          'valid-signature',
          'challenge-data',
          'client-data',
          '192.168.1.1',
          'Test User Agent'
        )
      );

      const results = await Promise.all(authPromises);
      const successfulAuths = results.filter(result => result.valid);

      // Should respect concurrent session limits
      expect(successfulAuths.length).toBeLessThanOrEqual(2);
    });

    test('should handle malformed input gracefully', async () => {
      // Test with null/undefined inputs
      const result = await superAdminValidator.authenticateSuperAdmin(
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });

    test('should prevent session hijacking attempts', async () => {
      // Create legitimate session
      await superAdminValidator.registerHardwareKey(
        'admin-user-123',
        {
          keyId: 'test-key-id',
          publicKey: 'test-public-key',
          algorithm: 'ES256',
          counter: 0
        }
      );

      const authResult = await superAdminValidator.authenticateSuperAdmin(
        'admin-user-123',
        'secure-id-123',
        'valid-signature',
        'challenge-data',
        'client-data',
        '192.168.1.1',
        'Test User Agent'
      );

      // Attempt to validate with modified session ID
      const hijackAttempt = await superAdminValidator.validateSession(
        authResult.sessionId + 'modified'
      );

      expect(hijackAttempt.valid).toBe(false);
    });
  });
});
