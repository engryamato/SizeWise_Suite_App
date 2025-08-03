/**
 * Super Admin Manager for SizeWise Suite
 * 
 * Handles super administrator authentication, emergency access,
 * and hardware key validation for elevated privileges.
 */

import * as crypto from 'crypto';
import { 
  SuperAdminSession,
  SuperAdminAuthResult,
  SuperAdminValidationResult,
  HardwareKeyAuthRequest,
  EmergencyAccessRequest,
  EmergencyAccessResult
} from '../types/AuthTypes';
import { SecurityLogger } from '../utils/SecurityLogger';
import { SessionManager } from './SessionManager';

export class SuperAdminManager {
  private readonly securityLogger: SecurityLogger;
  private readonly sessionManager: SessionManager;
  private currentSuperAdminSession: SuperAdminSession | null = null;
  private readonly superAdminTimeout = 30 * 60 * 1000; // 30 minutes
  private readonly emergencyAccessCodes: Set<string> = new Set();

  constructor(sessionManager: SessionManager) {
    this.securityLogger = SecurityLogger.getInstance();
    this.sessionManager = sessionManager;
    this.initializeEmergencyAccessCodes();
  }

  /**
   * Authenticate super admin with credentials
   */
  async authenticateSuperAdmin(email: string, password: string): Promise<SuperAdminAuthResult> {
    try {
      const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@sizewise.com';
      const SUPER_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD || 'SizeWise2024!6EAF4610705941';

      if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
        await this.securityLogger.logSecurityEvent('super_admin_auth_failed', {
          email,
          reason: 'Invalid credentials'
        }, 'high');

        return {
          success: false,
          error: 'Invalid super admin credentials',
          securityEvent: 'INVALID_SUPER_ADMIN_CREDENTIALS'
        };
      }

      // Create super admin session
      const session = await this.createSuperAdminSession(
        'super-admin',
        email,
        ['admin:full_access', 'admin:super_admin_functions'],
        'emergency-access',
        true
      );

      await this.securityLogger.logSuperAdminActivity(
        'super-admin',
        'super_admin_authenticated',
        { email, method: 'credentials' }
      );

      return {
        success: true,
        session,
        token: await this.generateSuperAdminToken(session)
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('super_admin_auth_error', {
        email,
        error: errorMessage
      }, 'critical');

      return {
        success: false,
        error: `Super admin authentication failed: ${errorMessage}`,
        securityEvent: 'SUPER_ADMIN_AUTH_ERROR'
      };
    }
  }

  /**
   * Authenticate super admin with hardware key
   */
  async authenticateWithHardwareKey(request: HardwareKeyAuthRequest): Promise<SuperAdminAuthResult> {
    try {
      // Validate hardware key request
      if (!this.validateHardwareKeyRequest(request)) {
        return {
          success: false,
          error: 'Invalid hardware key request',
          requiresHardwareKey: true
        };
      }

      // In production, this would validate against actual hardware key
      const isValidKey = await this.validateHardwareKey(request);
      
      if (!isValidKey) {
        await this.securityLogger.logSecurityEvent('hardware_key_auth_failed', {
          userId: request.userId,
          hardwareKeyId: request.hardwareKeyId,
          reason: 'Invalid hardware key signature'
        }, 'critical');

        return {
          success: false,
          error: 'Invalid hardware key signature',
          requiresHardwareKey: true,
          securityEvent: 'INVALID_HARDWARE_KEY'
        };
      }

      // Create super admin session
      const session = await this.createSuperAdminSession(
        request.userId,
        'admin@sizewise.com', // Would get from hardware key
        ['admin:full_access', 'admin:super_admin_functions'],
        request.hardwareKeyId,
        false
      );

      await this.securityLogger.logSuperAdminActivity(
        request.userId,
        'hardware_key_authenticated',
        { hardwareKeyId: request.hardwareKeyId }
      );

      return {
        success: true,
        session,
        token: await this.generateSuperAdminToken(session)
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('hardware_key_auth_error', {
        userId: request.userId,
        hardwareKeyId: request.hardwareKeyId,
        error: errorMessage
      }, 'critical');

      return {
        success: false,
        error: `Hardware key authentication failed: ${errorMessage}`,
        requiresHardwareKey: true,
        securityEvent: 'HARDWARE_KEY_AUTH_ERROR'
      };
    }
  }

  /**
   * Request emergency access
   */
  async requestEmergencyAccess(request: EmergencyAccessRequest): Promise<EmergencyAccessResult> {
    try {
      // Validate emergency access request
      if (!this.validateEmergencyAccessRequest(request)) {
        return {
          granted: false,
          error: 'Invalid emergency access request',
          auditId: this.generateAuditId()
        };
      }

      // Validate emergency code
      if (!this.emergencyAccessCodes.has(request.emergencyCode)) {
        await this.securityLogger.logSecurityEvent('emergency_access_denied', {
          userId: request.userId,
          reason: request.reason,
          emergencyCode: request.emergencyCode.substring(0, 4) + '...'
        }, 'critical');

        return {
          granted: false,
          error: 'Invalid emergency access code',
          auditId: this.generateAuditId()
        };
      }

      // Create emergency session
      const sessionId = crypto.randomBytes(32).toString('hex');
      const now = Date.now();
      const expiresAt = now + request.duration;

      const session = await this.createSuperAdminSession(
        request.userId,
        'emergency@sizewise.com',
        ['admin:emergency_access'],
        'emergency-access',
        true
      );

      // Remove used emergency code
      this.emergencyAccessCodes.delete(request.emergencyCode);

      await this.securityLogger.logSuperAdminActivity(
        request.userId,
        'emergency_access_granted',
        {
          reason: request.reason,
          duration: request.duration,
          justification: request.justification,
          expiresAt
        }
      );

      return {
        granted: true,
        sessionId: session.sessionId,
        expiresAt,
        auditId: this.generateAuditId()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const auditId = this.generateAuditId();

      await this.securityLogger.logSecurityEvent('emergency_access_error', {
        userId: request.userId,
        error: errorMessage,
        auditId
      }, 'critical');

      return {
        granted: false,
        error: `Emergency access failed: ${errorMessage}`,
        auditId
      };
    }
  }

  /**
   * Validate super admin session
   */
  async validateSuperAdminSession(sessionId: string): Promise<SuperAdminValidationResult> {
    try {
      const sessionValidation = await this.sessionManager.validateSession(sessionId);
      
      if (!sessionValidation.valid || !sessionValidation.session) {
        return {
          valid: false,
          error: 'Invalid session'
        };
      }

      const session = sessionValidation.session;
      
      // Check if it's a super admin session
      if (!this.isSuperAdminSession(session)) {
        return {
          valid: false,
          error: 'Not a super admin session'
        };
      }

      const superSession = session as SuperAdminSession;
      const now = Date.now();

      // Check super admin expiration
      if (superSession.superAdminExpiresAt < now) {
        await this.securityLogger.logSecurityEvent('super_admin_session_expired', {
          sessionId,
          userId: superSession.userId,
          expiredAt: superSession.superAdminExpiresAt
        }, 'medium');

        return {
          valid: false,
          error: 'Super admin session expired',
          requiresReauth: true
        };
      }

      return {
        valid: true,
        session: superSession
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('super_admin_session_validation_error', {
        sessionId,
        error: errorMessage
      }, 'high');

      return {
        valid: false,
        error: `Session validation failed: ${errorMessage}`
      };
    }
  }

  /**
   * Check if user has super admin permission
   */
  hasSuperAdminPermission(action: string): boolean {
    if (!this.currentSuperAdminSession) {
      return false;
    }

    return this.currentSuperAdminSession.superAdminPermissions.includes(action) ||
           this.currentSuperAdminSession.superAdminPermissions.includes('all');
  }

  /**
   * Get current super admin session
   */
  getCurrentSuperAdminSession(): SuperAdminSession | null {
    return this.currentSuperAdminSession;
  }

  /**
   * Revoke super admin session
   */
  async revokeSuperAdminSession(sessionId: string, reason: string = 'Manual revocation'): Promise<void> {
    try {
      await this.sessionManager.removeSession(sessionId);
      
      if (this.currentSuperAdminSession?.sessionId === sessionId) {
        this.currentSuperAdminSession = null;
      }

      await this.securityLogger.logSuperAdminActivity(
        'system',
        'super_admin_session_revoked',
        { sessionId, reason }
      );

    } catch (error) {
      await this.securityLogger.logSecurityEvent('super_admin_session_revocation_error', {
        sessionId,
        reason,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'high');
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private async createSuperAdminSession(
    userId: string,
    email: string,
    permissions: string[],
    hardwareKeyId: string,
    emergencyAccess: boolean
  ): Promise<SuperAdminSession> {
    const session = await this.sessionManager.createSuperAdminSession(
      userId,
      email,
      permissions,
      hardwareKeyId,
      emergencyAccess
    );

    this.currentSuperAdminSession = session;
    return session;
  }

  private async generateSuperAdminToken(session: SuperAdminSession): Promise<string> {
    // In production, use TokenManager
    const payload = {
      sub: session.userId,
      email: session.email,
      tier: session.tier,
      permissions: session.superAdminPermissions,
      sessionId: session.sessionId,
      superAdminSessionId: session.superAdminSessionId,
      iat: Math.floor(session.issuedAt / 1000),
      exp: Math.floor(session.superAdminExpiresAt / 1000)
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private validateHardwareKeyRequest(request: HardwareKeyAuthRequest): boolean {
    return !!(
      request.userId &&
      request.hardwareKeyId &&
      request.challenge &&
      request.signature &&
      request.clientData
    );
  }

  private async validateHardwareKey(request: HardwareKeyAuthRequest): Promise<boolean> {
    try {
      // In production, this would validate against actual hardware key
      // For demo, accept specific test keys
      const validTestKeys = ['test-hardware-key-1', 'emergency-access'];
      return validTestKeys.includes(request.hardwareKeyId);
    } catch (error) {
      return false;
    }
  }

  private validateEmergencyAccessRequest(request: EmergencyAccessRequest): boolean {
    return !!(
      request.userId &&
      request.reason &&
      request.duration > 0 &&
      request.duration <= 24 * 60 * 60 * 1000 && // Max 24 hours
      request.justification &&
      request.emergencyCode
    );
  }

  private isSuperAdminSession(session: any): session is SuperAdminSession {
    return 'superAdminSessionId' in session;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private initializeEmergencyAccessCodes(): void {
    // In production, these would be securely generated and distributed
    this.emergencyAccessCodes.add('EMERGENCY-2024-001');
    this.emergencyAccessCodes.add('EMERGENCY-2024-002');
    this.emergencyAccessCodes.add('EMERGENCY-2024-003');
  }
}
