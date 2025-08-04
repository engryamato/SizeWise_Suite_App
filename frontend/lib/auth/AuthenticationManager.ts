/**
 * AuthenticationManager - Secure Session Management
 *
 * MISSION-CRITICAL: Secure authentication foundation for SaaS transition
 * Manages secure sessions, token validation, and authentication state
 *
 * Refactored to use modular architecture with specialized managers:
 * - SessionManager: Session lifecycle and validation
 * - TokenManager: JWT token operations
 * - LicenseValidator: License key validation
 * - SuperAdminManager: Super admin authentication
 * - SecurityLogger: Security event logging
 *
 * @see docs/implementation/security/application-security-guide.md section 5
 * @see docs/implementation/security/security-implementation-checklist.md section 1.4
 */

import { KeystoreManager } from './KeystoreManager';
import { SessionManager } from './managers/SessionManager';
import { TokenManager } from './managers/TokenManager';
import { LicenseValidator } from './validators/LicenseValidator';
import { SuperAdminManager } from './managers/SuperAdminManager';
import { SecurityLogger } from './utils/SecurityLogger';
import {
  AuthSession,
  SuperAdminSession,
  AuthResult,
  SuperAdminAuthResult,
  HardwareKeyAuthRequest,
  EmergencyAccessRequest,
  EmergencyAccessResult,
  JWTValidationResult,
  LicenseValidationResult,
  UserTier,
  Permission,
  PermissionSet
} from './types/AuthTypes';

// Re-export types from the modular type definitions
export * from './types/AuthTypes';

/**
 * Production-grade authentication manager with modular architecture
 * CRITICAL: Secure session management and token validation
 *
 * Refactored to use specialized managers for better maintainability:
 * - SessionManager: Session lifecycle and validation
 * - TokenManager: JWT token operations
 * - LicenseValidator: License key validation
 * - SuperAdminManager: Super admin authentication
 * - SecurityLogger: Security event logging
 */
export class AuthenticationManager {
  private readonly keystore: KeystoreManager;
  private readonly sessionManager: SessionManager;
  private readonly tokenManager: TokenManager;
  private readonly licenseValidator: LicenseValidator;
  private readonly superAdminManager: SuperAdminManager;
  private readonly securityLogger: SecurityLogger;

  constructor() {
    this.keystore = new KeystoreManager();
    this.sessionManager = new SessionManager();
    this.tokenManager = new TokenManager();
    this.licenseValidator = new LicenseValidator();
    this.superAdminManager = new SuperAdminManager(this.sessionManager);
    this.securityLogger = SecurityLogger.getInstance();
  }

  /**
   * Authenticate user with email and password
   * BRIDGE: Provides compatibility for hybrid authentication system
   * Supports both super admin credentials and license-based authentication
   */
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    try {
      // Delegate to SuperAdminManager for super admin authentication
      const superAdminResult = await this.superAdminManager.authenticateSuperAdmin(email, password);

      if (superAdminResult.success && superAdminResult.session) {
        // Generate JWT token for super admin session
        const token = await this.tokenManager.generateJWTToken(superAdminResult.session);

        return {
          success: true,
          session: superAdminResult.session,
          token
        };
      }

      // For non-super admin users, return authentication failure
      // In production, this could integrate with other authentication methods
      await this.securityLogger.logSecurityEvent('authentication_failed', {
        email: email,
        reason: 'Invalid credentials'
      }, 'medium');

      return {
        success: false,
        error: 'Invalid email or password. Please try again.',
        securityEvent: 'INVALID_CREDENTIALS'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('authentication_error', {
        email: email,
        error: errorMessage
      }, 'high');

      return {
        success: false,
        error: `Authentication failed: ${errorMessage}`,
        securityEvent: 'AUTHENTICATION_ERROR'
      };
    }
  }

  /**
   * Authenticate user with license validation
   * CRITICAL: Primary authentication method for offline mode
   */
  async authenticateWithLicense(licenseKey: string): Promise<AuthResult> {
    try {
      // Delegate to LicenseValidator for license validation
      const licenseValidation = await this.licenseValidator.validateLicense(licenseKey);

      if (!licenseValidation.valid || !licenseValidation.licenseInfo) {
        return {
          success: false,
          error: licenseValidation.error || 'License validation failed',
          securityEvent: 'LICENSE_VALIDATION_FAILED'
        };
      }

      const licenseInfo = licenseValidation.licenseInfo;

      // Create secure session using SessionManager
      const session = await this.sessionManager.createSession(
        licenseInfo.userId,
        licenseInfo.email,
        licenseInfo.tier,
        licenseInfo.permissions,
        'license'
      );

      // Generate JWT token using TokenManager
      const token = await this.tokenManager.generateJWTToken(session);

      await this.securityLogger.logSecurityEvent('authentication_success', {
        userId: session.userId,
        tier: session.tier,
        sessionId: session.sessionId,
        method: 'license'
      }, 'low');

      return {
        success: true,
        session,
        token
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('authentication_error', {
        error: errorMessage,
        method: 'license'
      }, 'high');

      return {
        success: false,
        error: `Authentication failed: ${errorMessage}`,
        securityEvent: 'AUTHENTICATION_ERROR'
      };
    }
  }

  /**
   * Validate JWT token
   * CRITICAL: Token validation for API requests
   */
  async validateJWTToken(token: string): Promise<JWTValidationResult> {
    try {
      // Delegate to TokenManager for JWT validation
      const validation = await this.tokenManager.validateJWTToken(token);

      if (!validation.success) {
        return validation;
      }

      // Additional session validation if needed
      if (validation.payload?.sessionId) {
        const sessionValidation = await this.sessionManager.validateSession(validation.payload.sessionId);
        if (!sessionValidation.valid) {
          return {
            success: false,
            error: 'Session no longer valid',
            expired: true
          };
        }
      }

      return validation;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('jwt_validation_error', {
        error: errorMessage
      }, 'medium');
      return {
        success: false,
        error: `JWT validation failed: ${errorMessage}`
      };
    }
  }

  /**
   * Get current authenticated session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      // Delegate to SessionManager - it handles session restoration and validation
      return await this.sessionManager.getCurrentSession();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('session_retrieval_error', {
        error: errorMessage
      }, 'medium');
      return null;
    }
  }

  /**
   * Refresh authentication session
   */
  async refreshSession(): Promise<AuthResult> {
    try {
      const currentSession = await this.getCurrentSession();
      if (!currentSession) {
        return {
          success: false,
          error: 'No active session to refresh',
          securityEvent: 'NO_ACTIVE_SESSION'
        };
      }

      // Delegate to SessionManager for session refresh
      const refreshResult = await this.sessionManager.refreshSession(currentSession.sessionId);

      if (!refreshResult.valid || !refreshResult.session) {
        return {
          success: false,
          error: refreshResult.error || 'Session refresh failed',
          securityEvent: 'SESSION_REFRESH_FAILED'
        };
      }

      // Generate new JWT token for refreshed session
      const token = await this.tokenManager.generateJWTToken(refreshResult.session);

      return {
        success: true,
        session: refreshResult.session,
        token
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('session_refresh_error', {
        error: errorMessage
      }, 'medium');

      return {
        success: false,
        error: `Session refresh failed: ${errorMessage}`,
        securityEvent: 'SESSION_REFRESH_ERROR'
      };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      const currentSession = await this.getCurrentSession();
      if (currentSession) {
        await this.securityLogger.logSecurityEvent('user_logout', {
          userId: currentSession.userId,
          sessionId: currentSession.sessionId
        }, 'low');

        // Delegate to SessionManager for session cleanup
        await this.sessionManager.removeSession(currentSession.sessionId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('logout_error', {
        error: errorMessage
      }, 'medium');
    }
  }

  // ========================================
  // SUPER ADMIN AUTHENTICATION METHODS
  // ========================================

  /**
   * Authenticate super admin with hardware key
   */
  async authenticateWithHardwareKey(request: HardwareKeyAuthRequest): Promise<SuperAdminAuthResult> {
    return await this.superAdminManager.authenticateWithHardwareKey(request);
  }

  /**
   * Request emergency access
   */
  async requestEmergencyAccess(request: EmergencyAccessRequest): Promise<EmergencyAccessResult> {
    return await this.superAdminManager.requestEmergencyAccess(request);
  }

  /**
   * Validate super admin session
   */
  async validateSuperAdminSession(sessionId: string): Promise<SuperAdminValidationResult> {
    const validation = await this.superAdminManager.validateSuperAdminSession(sessionId);
    return {
      isValid: validation.valid,
      sessionId: validation.session?.sessionId,
      permissions: validation.session?.superAdminPermissions,
      emergencyAccess: validation.session?.emergencyAccess,
      error: validation.error
    };
  }

  /**
   * Get current super admin session
   */
  getCurrentSuperAdminSession(): SuperAdminSession | null {
    return this.superAdminManager.getCurrentSuperAdminSession();
  }

  /**
   * Revoke super admin session
   */
  async revokeSuperAdminSession(sessionId: string, reason?: string): Promise<void> {
    await this.superAdminManager.revokeSuperAdminSession(sessionId, reason);
  }

  // ========================================
  // LICENSE VALIDATION METHODS
  // ========================================

  /**
   * Validate license key format
   */
  validateLicenseFormat(licenseKey: string): boolean {
    return this.licenseValidator.validateLicenseFormat(licenseKey);
  }

  /**
   * Validate license and get license information
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    return await this.licenseValidator.validateLicense(licenseKey);
  }

  /**
   * Get permission set for a tier
   */
  getPermissionSet(tier: UserTier): PermissionSet {
    return this.licenseValidator.getPermissionSet(tier);
  }

  /**
   * Check if license has specific permission
   */
  async hasPermission(licenseKey: string, permission: Permission): Promise<boolean> {
    const validation = await this.licenseValidator.validateLicense(licenseKey);
    if (!validation.valid || !validation.licenseInfo) {
      return false;
    }
    return this.licenseValidator.hasPermission(validation.licenseInfo, permission);
  }

  /**
   * Register device for license
   */
  async registerDevice(licenseKey: string, deviceId: string): Promise<boolean> {
    return await this.licenseValidator.registerDevice(licenseKey, deviceId);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Check if user has specific permission
   */
  async hasUserPermission(permission: Permission): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session) {
      return false;
    }
    return session.permissions.includes(permission);
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics(): any {
    return this.securityLogger.getSecurityStatistics();
  }

  /**
   * Get audit trail
   */
  getAuditTrail(limit: number = 100): any[] {
    return this.securityLogger.getAuditTrail(limit);
  }

  /**
   * Generate JWT token (delegated to TokenManager)
   */
  async generateJWTToken(session: AuthSession): Promise<string> {
    return await this.tokenManager.generateJWTToken(session);
  }

  /**
   * Refresh JWT token (delegated to TokenManager)
   */
  async refreshJWTToken(token: string): Promise<string | null> {
    return await this.tokenManager.refreshJWTToken(token, {} as any); // TODO: Fix token manager interface
  }

  /**
   * Authenticate super admin user
   */
  async authenticateSuperAdmin(request: any): Promise<any> {
    // TODO: Implement super admin authentication
    return { success: false, error: 'Super admin authentication not implemented' };
  }

  /**
   * Check if user has super admin permission
   */
  hasSuperAdminPermission(permission: string): boolean {
    // TODO: Implement super admin permission check
    return false;
  }



  /**
   * Get super admin audit trail
   */
  getSuperAdminAuditTrail(limit?: number): any[] {
    // TODO: Implement audit trail retrieval
    return [];
  }

}


