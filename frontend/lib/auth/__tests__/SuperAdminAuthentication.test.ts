/**
 * Super Admin Authentication Test Suite
 * 
 * CRITICAL: Validates super administrator authentication system
 * Tests hardware key authentication, emergency access, and session management
 * 
 * @see docs/implementation/security/super-admin-architecture.md
 */

import { AuthenticationManager, HardwareKeyAuthRequest, SuperAdminAuthResult } from '../AuthenticationManager';
import { SuperAdminValidator, HardwareKeyCredential, EmergencyAccessRequest } from '../../../../backend/security/SuperAdminValidator';
import { SecurityManager } from '../../../../backend/security/SecurityManager';

// Mock dependencies
jest.mock('../../../../backend/security/SuperAdminValidator');
jest.mock('../../../../backend/security/SecurityManager');
jest.mock('../../../electron/license/KeystoreManager');

describe('Super Admin Authentication System', () => {
  let authManager: AuthenticationManager;
  let mockSuperAdminValidator: jest.Mocked<SuperAdminValidator>;
  let mockSecurityManager: jest.Mocked<SecurityManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SecurityManager
    mockSecurityManager = {
      encrypt: jest.fn().mockResolvedValue('encrypted-data'),
      decrypt: jest.fn().mockResolvedValue('decrypted-data'),
      hash: jest.fn().mockResolvedValue('hashed-data'),
      validateSignature: jest.fn().mockResolvedValue(true)
    } as any;

    // Mock SuperAdminValidator
    mockSuperAdminValidator = {
      authenticateSuperAdmin: jest.fn(),
      requestEmergencyAccess: jest.fn(),
      validateSession: jest.fn(),
      revokeSession: jest.fn(),
      registerHardwareKey: jest.fn(),
      getSecurityStatistics: jest.fn(),
      getAuditTrail: jest.fn()
    } as any;

    (SuperAdminValidator as jest.MockedClass<typeof SuperAdminValidator>).mockImplementation(() => mockSuperAdminValidator);

    authManager = new AuthenticationManager();
  });

  describe('Hardware Key Authentication', () => {
    const validHardwareKeyRequest: HardwareKeyAuthRequest = {
      userId: 'admin-user-123',
      hardwareKeyId: 'hardware-key-456',
      challenge: 'test-challenge',
      signature: 'valid-signature',
      clientData: 'client-data'
    };

    test('should authenticate super admin with valid hardware key', async () => {
      // Initialize super admin validator
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      // Mock successful authentication
      mockSuperAdminValidator.authenticateSuperAdmin.mockResolvedValue({
        valid: true,
        sessionId: 'super-admin-session-123',
        permissions: [
          { action: 'license_reset', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' },
          { action: 'user_recovery', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' }
        ],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        emergencyAccess: false,
        auditId: 'audit-123'
      });

      const result = await authManager.authenticateSuperAdmin(validHardwareKeyRequest);

      expect(result.success).toBe(true);
      expect(result.superAdminSession).toBeDefined();
      expect(result.superAdminSession?.superAdminSessionId).toBe('super-admin-session-123');
      expect(result.superAdminSession?.hardwareKeyId).toBe('hardware-key-456');
      expect(result.superAdminSession?.emergencyAccess).toBe(false);
      expect(result.superAdminSession?.superAdminPermissions).toContain('license_reset');
      expect(result.superAdminSession?.superAdminPermissions).toContain('user_recovery');

      expect(mockSuperAdminValidator.authenticateSuperAdmin).toHaveBeenCalledWith(
        'admin-user-123',
        'hardware-key-456',
        'valid-signature',
        'test-challenge',
        'client-data',
        '127.0.0.1',
        'SizeWise Suite Desktop'
      );
    });

    test('should reject authentication with invalid hardware key', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      mockSuperAdminValidator.authenticateSuperAdmin.mockResolvedValue({
        valid: false,
        permissions: [],
        emergencyAccess: false,
        reason: 'Invalid hardware key signature',
        auditId: 'audit-456'
      });

      const result = await authManager.authenticateSuperAdmin(validHardwareKeyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid hardware key signature');
      expect(result.requiresHardwareKey).toBe(true);
      expect(result.superAdminSession).toBeUndefined();
    });

    test('should handle authentication without initialized validator', async () => {
      // Don't initialize validator
      const result = await authManager.authenticateSuperAdmin(validHardwareKeyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Super admin validator not initialized');
      expect(result.requiresHardwareKey).toBe(true);
    });

    test('should handle authentication errors gracefully', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      mockSuperAdminValidator.authenticateSuperAdmin.mockRejectedValue(new Error('Hardware key validation failed'));

      const result = await authManager.authenticateSuperAdmin(validHardwareKeyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Super admin authentication failed');
      expect(result.requiresHardwareKey).toBe(true);
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
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      mockSuperAdminValidator.requestEmergencyAccess.mockResolvedValue({
        valid: true,
        sessionId: 'emergency-session-789',
        permissions: [
          { action: 'user_recovery', scope: 'user', granted: true, grantedAt: new Date(), grantedBy: 'emergency_system' },
          { action: 'emergency_unlock', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'emergency_system' }
        ],
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        emergencyAccess: true,
        auditId: 'emergency-audit-789'
      });

      const result = await authManager.requestEmergencyAccess(validEmergencyRequest);

      expect(result.success).toBe(true);
      expect(result.superAdminSession).toBeDefined();
      expect(result.superAdminSession?.emergencyAccess).toBe(true);
      expect(result.superAdminSession?.userId).toBe('emergency');
      expect(result.superAdminSession?.hardwareKeyId).toBe('emergency');
      expect(result.superAdminSession?.superAdminPermissions).toContain('user_recovery');
      expect(result.superAdminSession?.superAdminPermissions).toContain('emergency_unlock');
    });

    test('should reject emergency access with invalid request', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      mockSuperAdminValidator.requestEmergencyAccess.mockResolvedValue({
        valid: false,
        permissions: [],
        emergencyAccess: false,
        reason: 'Invalid emergency access request',
        auditId: 'emergency-audit-failed'
      });

      const result = await authManager.requestEmergencyAccess(validEmergencyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid emergency access request');
      expect(result.superAdminSession).toBeUndefined();
    });
  });

  describe('Session Management', () => {
    test('should validate active super admin session', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      // Create a session first
      mockSuperAdminValidator.authenticateSuperAdmin.mockResolvedValue({
        valid: true,
        sessionId: 'session-123',
        permissions: [{ action: 'license_reset', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' }],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        emergencyAccess: false,
        auditId: 'audit-123'
      });

      await authManager.authenticateSuperAdmin({
        userId: 'admin-user-123',
        hardwareKeyId: 'hardware-key-456',
        challenge: 'test-challenge',
        signature: 'valid-signature',
        clientData: 'client-data'
      });

      // Test session validation
      mockSuperAdminValidator.validateSession.mockResolvedValue({
        valid: true,
        sessionId: 'session-123',
        permissions: [{ action: 'license_reset', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' }],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        emergencyAccess: false,
        auditId: 'audit-123'
      });

      const isValid = await authManager.validateSuperAdminSession('session-123');
      expect(isValid).toBe(true);
    });

    test('should get current super admin session', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      // Create a session first
      mockSuperAdminValidator.authenticateSuperAdmin.mockResolvedValue({
        valid: true,
        sessionId: 'session-456',
        permissions: [{ action: 'user_recovery', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' }],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        emergencyAccess: false,
        auditId: 'audit-456'
      });

      await authManager.authenticateSuperAdmin({
        userId: 'admin-user-123',
        hardwareKeyId: 'hardware-key-456',
        challenge: 'test-challenge',
        signature: 'valid-signature',
        clientData: 'client-data'
      });

      const session = authManager.getCurrentSuperAdminSession();
      expect(session).toBeDefined();
      expect(session?.superAdminSessionId).toBe('session-456');
      expect(session?.userId).toBe('admin-user-123');
    });

    test('should check super admin permissions', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      // Create a session with specific permissions
      mockSuperAdminValidator.authenticateSuperAdmin.mockResolvedValue({
        valid: true,
        sessionId: 'session-789',
        permissions: [
          { action: 'license_reset', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' },
          { action: 'user_recovery', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' }
        ],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        emergencyAccess: false,
        auditId: 'audit-789'
      });

      await authManager.authenticateSuperAdmin({
        userId: 'admin-user-123',
        hardwareKeyId: 'hardware-key-456',
        challenge: 'test-challenge',
        signature: 'valid-signature',
        clientData: 'client-data'
      });

      expect(authManager.hasSuperAdminPermission('license_reset')).toBe(true);
      expect(authManager.hasSuperAdminPermission('user_recovery')).toBe(true);
      expect(authManager.hasSuperAdminPermission('database_repair')).toBe(false);
    });

    test('should revoke super admin session', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      // Create a session first
      mockSuperAdminValidator.authenticateSuperAdmin.mockResolvedValue({
        valid: true,
        sessionId: 'session-revoke',
        permissions: [{ action: 'license_reset', scope: 'global', granted: true, grantedAt: new Date(), grantedBy: 'system' }],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        emergencyAccess: false,
        auditId: 'audit-revoke'
      });

      await authManager.authenticateSuperAdmin({
        userId: 'admin-user-123',
        hardwareKeyId: 'hardware-key-456',
        challenge: 'test-challenge',
        signature: 'valid-signature',
        clientData: 'client-data'
      });

      // Mock successful revocation
      mockSuperAdminValidator.revokeSession.mockResolvedValue(true);

      const revoked = await authManager.revokeSuperAdminSession('Test revocation');
      expect(revoked).toBe(true);

      // Session should be cleared
      const session = authManager.getCurrentSuperAdminSession();
      expect(session).toBeNull();
    });
  });

  describe('Hardware Key Registration', () => {
    const validKeyCredential: HardwareKeyCredential = {
      keyId: 'test-key-id',
      publicKey: 'test-public-key',
      algorithm: 'ES256',
      counter: 0
    };

    test('should register hardware key successfully', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      mockSuperAdminValidator.registerHardwareKey.mockResolvedValue({
        success: true,
        keyId: 'registered-key-123'
      });

      const result = await authManager.registerHardwareKey(
        'admin-user-123',
        validKeyCredential
      );

      expect(result.success).toBe(true);
      expect(result.keyId).toBe('registered-key-123');
      expect(mockSuperAdminValidator.registerHardwareKey).toHaveBeenCalledWith(
        'admin-user-123',
        validKeyCredential,
        undefined
      );
    });

    test('should handle hardware key registration failure', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      mockSuperAdminValidator.registerHardwareKey.mockResolvedValue({
        success: false,
        keyId: '',
        reason: 'Invalid key format'
      });

      const result = await authManager.registerHardwareKey(
        'admin-user-123',
        validKeyCredential
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid key format');
    });
  });

  describe('Security Monitoring', () => {
    test('should provide security statistics', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      const mockStats = {
        activeSessionCount: 1,
        registeredKeyCount: 2,
        auditLogSize: 50,
        recentFailedAttempts: 0,
        emergencyAccessCount: 0
      };

      mockSuperAdminValidator.getSecurityStatistics.mockReturnValue(mockStats);

      const stats = authManager.getSuperAdminSecurityStats();
      expect(stats).toEqual(mockStats);
    });

    test('should provide audit trail', async () => {
      await authManager.initializeSuperAdminValidator(mockSecurityManager);

      const mockAuditTrail = [
        {
          timestamp: new Date(),
          action: 'super_admin_authenticated',
          userId: 'admin-user-123',
          hardwareKeyId: 'hardware-key-456',
          ipAddress: '127.0.0.1',
          userAgent: 'SizeWise Suite Desktop',
          success: true,
          details: { sessionId: 'session-123' }
        }
      ];

      mockSuperAdminValidator.getAuditTrail.mockReturnValue(mockAuditTrail);

      const auditTrail = authManager.getSuperAdminAuditTrail(10);
      expect(auditTrail).toEqual(mockAuditTrail);
      expect(mockSuperAdminValidator.getAuditTrail).toHaveBeenCalledWith(10);
    });
  });
});
