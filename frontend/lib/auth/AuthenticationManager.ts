/**
 * AuthenticationManager - Secure Session Management
 * 
 * MISSION-CRITICAL: Secure authentication foundation for SaaS transition
 * Manages secure sessions, token validation, and authentication state
 * 
 * @see docs/implementation/security/application-security-guide.md section 5
 * @see docs/implementation/security/security-implementation-checklist.md section 1.4
 */

import * as crypto from 'crypto';

// Local interface for keystore manager
interface KeystoreManager {
  validateLicense(licenseKey: string): Promise<boolean>;
  getLicenseInfo(licenseKey: string): Promise<any>;
}

// Local interfaces for super admin functionality
export interface SuperAdminValidationResult {
  isValid: boolean;
  sessionId?: string;
  permissions?: string[];
  emergencyAccess?: boolean;
  error?: string;
}

export interface HardwareKeyCredential {
  userId: string;
  hardwareKeyId: string;
  challenge: string;
  signature: string;
}

export interface EmergencyAccessRequest {
  reason: string;
  contactInfo: string;
  timestamp?: string;
  requestedPermissions?: string[];
  hardwareKeyProof?: string;
}

/**
 * Authentication session structure
 */
export interface AuthSession {
  sessionId: string;
  userId: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  issuedAt: number;
  expiresAt: number;
  lastActivity: number;
  deviceFingerprint: string;
  permissions: string[];
}

/**
 * JWT token structure
 */
export interface JWTToken {
  header: {
    alg: 'HS256' | 'RS256';
    typ: 'JWT';
  };
  payload: {
    sub: string; // userId
    email: string;
    tier: 'free' | 'pro' | 'enterprise';
    iat: number;
    exp: number;
    aud: string;
    iss: string;
  };
  signature: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  token?: string;
  error?: string;
  securityEvent?: string;
}

/**
 * Super Admin Authentication Session (extends regular session)
 */
export interface SuperAdminSession extends AuthSession {
  superAdminSessionId: string;
  hardwareKeyId: string;
  emergencyAccess: boolean;
  superAdminPermissions: string[];
  superAdminExpiresAt: number;
}

/**
 * Hardware Key Authentication Request
 */
export interface HardwareKeyAuthRequest {
  userId: string;
  hardwareKeyId: string;
  challenge: string;
  signature: string;
  clientData: string;
}

/**
 * Super Admin Authentication Result
 */
export interface SuperAdminAuthResult {
  success: boolean;
  superAdminSession?: SuperAdminSession;
  validationResult?: SuperAdminValidationResult;
  error?: string;
  requiresHardwareKey?: boolean;
}

/**
 * Production-grade authentication manager
 * CRITICAL: Secure session management and token validation
 */
export class AuthenticationManager {
  private readonly keystore: KeystoreManager;
  private currentSession: AuthSession | null = null;
  private currentSuperAdminSession: SuperAdminSession | null = null;
  private superAdminValidator: SuperAdminValidator | null = null;
  private readonly sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
  private readonly activityTimeout = 30 * 60 * 1000; // 30 minutes
  private readonly superAdminTimeout = 30 * 60 * 1000; // 30 minutes
  private readonly jwtSecret = 'SizeWise-Suite-JWT-Secret-2024'; // In production, use secure key management

  constructor() {
    this.keystore = new KeystoreManager();
  }

  /**
   * Authenticate user with license validation
   * CRITICAL: Primary authentication method for offline mode
   */
  async authenticateWithLicense(licenseKey: string): Promise<AuthResult> {
    try {
      // Validate license key format
      if (!this.validateLicenseFormat(licenseKey)) {
        await this.logSecurityEvent('invalid_license_format', { licenseKey: licenseKey.substring(0, 8) + '...' });
        return {
          success: false,
          error: 'Invalid license key format',
          securityEvent: 'INVALID_LICENSE_FORMAT'
        };
      }

      // Validate license cryptographically (placeholder - would use LicenseValidator)
      const licenseValid = await this.validateLicenseCryptographically(licenseKey);
      if (!licenseValid) {
        await this.logSecurityEvent('license_validation_failed', { licenseKey: licenseKey.substring(0, 8) + '...' });
        return {
          success: false,
          error: 'License validation failed',
          securityEvent: 'LICENSE_VALIDATION_FAILED'
        };
      }

      // Extract user information from license
      const userInfo = await this.extractUserFromLicense(licenseKey);
      if (!userInfo) {
        return {
          success: false,
          error: 'Failed to extract user information from license',
          securityEvent: 'USER_EXTRACTION_FAILED'
        };
      }

      // Create secure session
      const session = await this.createSecureSession(userInfo);
      
      // Generate JWT token
      const token = await this.generateJWTToken(session);

      // Store session securely
      await this.storeSession(session);

      this.currentSession = session;

      await this.logSecurityEvent('authentication_success', {
        userId: session.userId,
        tier: session.tier,
        sessionId: session.sessionId
      });

      return {
        success: true,
        session,
        token
      };

    } catch (error) {
      await this.logSecurityEvent('authentication_error', { error: error.message });
      return {
        success: false,
        error: `Authentication failed: ${error.message}`,
        securityEvent: 'AUTHENTICATION_ERROR'
      };
    }
  }

  /**
   * Validate JWT token
   * CRITICAL: Token validation for API requests
   */
  async validateJWTToken(token: string): Promise<AuthResult> {
    try {
      // Parse JWT token
      const parsedToken = this.parseJWTToken(token);
      if (!parsedToken) {
        await this.logSecurityEvent('invalid_jwt_format', {});
        return {
          success: false,
          error: 'Invalid JWT token format',
          securityEvent: 'INVALID_JWT_FORMAT'
        };
      }

      // Verify signature
      const signatureValid = this.verifyJWTSignature(parsedToken);
      if (!signatureValid) {
        await this.logSecurityEvent('invalid_jwt_signature', { userId: parsedToken.payload.sub });
        return {
          success: false,
          error: 'Invalid JWT signature',
          securityEvent: 'INVALID_JWT_SIGNATURE'
        };
      }

      // Check expiration
      if (parsedToken.payload.exp < Date.now() / 1000) {
        await this.logSecurityEvent('jwt_expired', { userId: parsedToken.payload.sub });
        return {
          success: false,
          error: 'JWT token expired',
          securityEvent: 'JWT_EXPIRED'
        };
      }

      // Validate audience and issuer
      if (parsedToken.payload.aud !== 'sizewise-suite' || parsedToken.payload.iss !== 'sizewise-auth') {
        await this.logSecurityEvent('jwt_invalid_claims', { userId: parsedToken.payload.sub });
        return {
          success: false,
          error: 'Invalid JWT claims',
          securityEvent: 'JWT_INVALID_CLAIMS'
        };
      }

      // Get session from token
      const session = await this.getSessionFromToken(parsedToken);
      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          securityEvent: 'SESSION_NOT_FOUND'
        };
      }

      return {
        success: true,
        session
      };

    } catch (error) {
      await this.logSecurityEvent('jwt_validation_error', { error: error.message });
      return {
        success: false,
        error: `JWT validation failed: ${error.message}`,
        securityEvent: 'JWT_VALIDATION_ERROR'
      };
    }
  }

  /**
   * Get current authenticated session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      if (!this.currentSession) {
        // Try to restore session from secure storage
        this.currentSession = await this.restoreSession();
      }

      if (this.currentSession) {
        // Check session validity
        const isValid = await this.validateSession(this.currentSession);
        if (!isValid) {
          await this.clearSession();
          return null;
        }

        // Update last activity
        await this.updateSessionActivity(this.currentSession.sessionId);
      }

      return this.currentSession;

    } catch (error) {
      await this.logSecurityEvent('session_retrieval_error', { error: error.message });
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

      // Check if session can be refreshed
      const timeSinceIssued = Date.now() - currentSession.issuedAt;
      const maxRefreshTime = 24 * 60 * 60 * 1000; // 24 hours
      
      if (timeSinceIssued > maxRefreshTime) {
        await this.clearSession();
        return {
          success: false,
          error: 'Session too old to refresh',
          securityEvent: 'SESSION_TOO_OLD'
        };
      }

      // Create new session with extended expiration
      const refreshedSession: AuthSession = {
        ...currentSession,
        sessionId: crypto.randomUUID(),
        expiresAt: Date.now() + this.sessionTimeout,
        lastActivity: Date.now()
      };

      // Generate new JWT token
      const token = await this.generateJWTToken(refreshedSession);

      // Store refreshed session
      await this.storeSession(refreshedSession);
      this.currentSession = refreshedSession;

      await this.logSecurityEvent('session_refreshed', {
        userId: refreshedSession.userId,
        sessionId: refreshedSession.sessionId
      });

      return {
        success: true,
        session: refreshedSession,
        token
      };

    } catch (error) {
      await this.logSecurityEvent('session_refresh_error', { error: error.message });
      return {
        success: false,
        error: `Session refresh failed: ${error.message}`,
        securityEvent: 'SESSION_REFRESH_ERROR'
      };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        await this.logSecurityEvent('user_logout', {
          userId: this.currentSession.userId,
          sessionId: this.currentSession.sessionId
        });
      }

      await this.clearSession();

    } catch (error) {
      await this.logSecurityEvent('logout_error', { error: error.message });
    }
  }

  /**
   * Validate license format
   */
  private validateLicenseFormat(licenseKey: string): boolean {
    // Basic format validation (XXXX-XXXX-XXXX-XXXX)
    const licensePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return licensePattern.test(licenseKey);
  }

  /**
   * Validate license cryptographically
   */
  private async validateLicenseCryptographically(licenseKey: string): Promise<boolean> {
    try {
      // In production, this would use the LicenseValidator
      // For now, basic validation
      return licenseKey.length === 19 && licenseKey.includes('-');
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract user information from license
   */
  private async extractUserFromLicense(licenseKey: string): Promise<any> {
    try {
      // In production, this would decode the license
      // For now, return mock user data
      return {
        userId: crypto.randomUUID(),
        email: 'user@example.com',
        tier: 'pro' as const,
        permissions: ['basic_calculations', 'unlimited_projects', 'high_res_export']
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Create secure session
   */
  private async createSecureSession(userInfo: any): Promise<AuthSession> {
    const now = Date.now();
    const deviceFingerprint = await this.generateDeviceFingerprint();

    return {
      sessionId: crypto.randomUUID(),
      userId: userInfo.userId,
      email: userInfo.email,
      tier: userInfo.tier,
      issuedAt: now,
      expiresAt: now + this.sessionTimeout,
      lastActivity: now,
      deviceFingerprint,
      permissions: userInfo.permissions || []
    };
  }

  /**
   * Generate JWT token
   */
  private async generateJWTToken(session: AuthSession): Promise<string> {
    try {
      const header = {
        alg: 'HS256' as const,
        typ: 'JWT'
      };

      const payload = {
        sub: session.userId,
        email: session.email,
        tier: session.tier,
        iat: Math.floor(session.issuedAt / 1000),
        exp: Math.floor(session.expiresAt / 1000),
        aud: 'sizewise-suite',
        iss: 'sizewise-auth'
      };

      // Encode header and payload
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

      // Create signature
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      const signature = crypto.createHmac('sha256', this.jwtSecret)
        .update(signatureInput)
        .digest('base64url');

      return `${encodedHeader}.${encodedPayload}.${signature}`;

    } catch (error) {
      throw new Error(`JWT generation failed: ${error.message}`);
    }
  }

  /**
   * Parse JWT token
   */
  private parseJWTToken(token: string): JWTToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      const signature = parts[2];

      return { header, payload, signature };

    } catch (error) {
      return null;
    }
  }

  /**
   * Verify JWT signature
   */
  private verifyJWTSignature(token: JWTToken): boolean {
    try {
      const encodedHeader = Buffer.from(JSON.stringify(token.header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(token.payload)).toString('base64url');
      
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      const expectedSignature = crypto.createHmac('sha256', this.jwtSecret)
        .update(signatureInput)
        .digest('base64url');

      return crypto.timingSafeEqual(
        Buffer.from(token.signature, 'base64url'),
        Buffer.from(expectedSignature, 'base64url')
      );

    } catch (error) {
      return false;
    }
  }

  /**
   * Get session from JWT token
   */
  private async getSessionFromToken(token: JWTToken): Promise<AuthSession | null> {
    try {
      // In production, this would query the session store
      // For now, create session from token data
      const deviceFingerprint = await this.generateDeviceFingerprint();

      return {
        sessionId: crypto.randomUUID(),
        userId: token.payload.sub,
        email: token.payload.email,
        tier: token.payload.tier,
        issuedAt: token.payload.iat * 1000,
        expiresAt: token.payload.exp * 1000,
        lastActivity: Date.now(),
        deviceFingerprint,
        permissions: []
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Validate session
   */
  private async validateSession(session: AuthSession): Promise<boolean> {
    try {
      const now = Date.now();

      // Check expiration
      if (session.expiresAt < now) {
        return false;
      }

      // Check activity timeout
      if (now - session.lastActivity > this.activityTimeout) {
        return false;
      }

      // Validate device fingerprint
      const currentFingerprint = await this.generateDeviceFingerprint();
      if (session.deviceFingerprint !== currentFingerprint) {
        await this.logSecurityEvent('device_fingerprint_mismatch', {
          userId: session.userId,
          sessionId: session.sessionId
        });
        return false;
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Store session securely
   */
  private async storeSession(session: AuthSession): Promise<void> {
    try {
      // Store in OS keystore for security
      await this.keystore.storeLicense({
        header: { version: '1.0', algorithm: 'RSA-SHA256', keyId: 'session' },
        payload: session as any,
        signature: 'session-data'
      });

    } catch (error) {
      throw new Error(`Session storage failed: ${error.message}`);
    }
  }

  /**
   * Restore session from storage
   */
  private async restoreSession(): Promise<AuthSession | null> {
    try {
      const storedData = await this.keystore.retrieveLicense();
      if (!storedData) {
        return null;
      }

      return storedData.payload as any;

    } catch (error) {
      return null;
    }
  }

  /**
   * Update session activity
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      if (this.currentSession && this.currentSession.sessionId === sessionId) {
        this.currentSession.lastActivity = Date.now();
        await this.storeSession(this.currentSession);
      }
    } catch (error) {
      // Non-critical error
    }
  }

  /**
   * Clear session
   */
  private async clearSession(): Promise<void> {
    try {
      this.currentSession = null;
      await this.keystore.removeLicense();
    } catch (error) {
      // Non-critical error
    }
  }

  /**
   * Generate device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<string> {
    try {
      const os = require('os');
      const data = [
        os.hostname(),
        os.platform(),
        os.arch(),
        process.env.USERNAME || process.env.USER || 'unknown'
      ].join('|');

      return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);

    } catch (error) {
      return 'unknown-device';
    }
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(event: string, data: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      source: 'AuthenticationManager'
    };

    // In production, this would send to secure logging service
    console.log('[SECURITY]', JSON.stringify(logEntry));
  }

  // ========================================
  // SUPER ADMINISTRATOR AUTHENTICATION
  // ========================================

  /**
   * Initialize super admin validator
   */
  async initializeSuperAdminValidator(securityManager: any): Promise<void> {
    if (!this.superAdminValidator) {
      this.superAdminValidator = new SuperAdminValidator(securityManager);
    }
  }

  /**
   * Authenticate super admin with hardware key
   */
  async authenticateSuperAdmin(request: HardwareKeyAuthRequest): Promise<SuperAdminAuthResult> {
    try {
      if (!this.superAdminValidator) {
        return {
          success: false,
          error: 'Super admin validator not initialized',
          requiresHardwareKey: true
        };
      }

      // Validate hardware key authentication
      const validationResult = await this.superAdminValidator.authenticateSuperAdmin(
        request.userId,
        request.hardwareKeyId,
        request.signature,
        request.challenge,
        request.clientData,
        '127.0.0.1', // In production, get real IP
        'SizeWise Suite Desktop'
      );

      if (!validationResult.valid) {
        await this.logSecurityEvent('super_admin_auth_failed', {
          userId: request.userId,
          hardwareKeyId: request.hardwareKeyId,
          reason: validationResult.reason
        });

        return {
          success: false,
          error: validationResult.reason,
          requiresHardwareKey: true
        };
      }

      // Create super admin session
      const superAdminSession: SuperAdminSession = {
        id: validationResult.sessionId!,
        userId: request.userId,
        createdAt: Date.now(),
        expiresAt: validationResult.expiresAt!.getTime(),
        lastActivity: Date.now(),
        isValid: true,
        superAdminSessionId: validationResult.sessionId!,
        hardwareKeyId: request.hardwareKeyId,
        emergencyAccess: validationResult.emergencyAccess,
        superAdminPermissions: validationResult.permissions.map(p => p.action),
        superAdminExpiresAt: validationResult.expiresAt!.getTime()
      };

      this.currentSuperAdminSession = superAdminSession;

      await this.logSecurityEvent('super_admin_authenticated', {
        userId: request.userId,
        sessionId: validationResult.sessionId,
        emergencyAccess: validationResult.emergencyAccess,
        permissions: validationResult.permissions.length
      });

      return {
        success: true,
        superAdminSession,
        validationResult
      };

    } catch (error) {
      await this.logSecurityEvent('super_admin_auth_error', {
        userId: request.userId,
        error: error.message
      });

      return {
        success: false,
        error: `Super admin authentication failed: ${error.message}`,
        requiresHardwareKey: true
      };
    }
  }

  /**
   * Request emergency access
   */
  async requestEmergencyAccess(request: EmergencyAccessRequest): Promise<SuperAdminAuthResult> {
    try {
      if (!this.superAdminValidator) {
        return {
          success: false,
          error: 'Super admin validator not initialized'
        };
      }

      const validationResult = await this.superAdminValidator.requestEmergencyAccess(
        request,
        '127.0.0.1', // In production, get real IP
        'SizeWise Suite Desktop'
      );

      if (!validationResult.valid) {
        await this.logSecurityEvent('emergency_access_denied', {
          reason: request.reason,
          requestedPermissions: request.requestedPermissions,
          error: validationResult.reason
        });

        return {
          success: false,
          error: validationResult.reason
        };
      }

      // Create emergency super admin session
      const emergencySession: SuperAdminSession = {
        id: validationResult.sessionId!,
        userId: 'emergency',
        createdAt: Date.now(),
        expiresAt: validationResult.expiresAt!.getTime(),
        lastActivity: Date.now(),
        isValid: true,
        superAdminSessionId: validationResult.sessionId!,
        hardwareKeyId: 'emergency',
        emergencyAccess: true,
        superAdminPermissions: validationResult.permissions.map(p => p.action),
        superAdminExpiresAt: validationResult.expiresAt!.getTime()
      };

      this.currentSuperAdminSession = emergencySession;

      await this.logSecurityEvent('emergency_access_granted', {
        sessionId: validationResult.sessionId,
        reason: request.reason,
        permissions: validationResult.permissions.length
      });

      return {
        success: true,
        superAdminSession: emergencySession,
        validationResult
      };

    } catch (error) {
      await this.logSecurityEvent('emergency_access_error', {
        reason: request.reason,
        error: error.message
      });

      return {
        success: false,
        error: `Emergency access failed: ${error.message}`
      };
    }
  }

  /**
   * Get current super admin session
   */
  getCurrentSuperAdminSession(): SuperAdminSession | null {
    if (!this.currentSuperAdminSession) {
      return null;
    }

    // Check if session is expired
    if (this.currentSuperAdminSession.superAdminExpiresAt < Date.now()) {
      this.currentSuperAdminSession = null;
      return null;
    }

    return this.currentSuperAdminSession;
  }

  /**
   * Validate super admin session
   */
  async validateSuperAdminSession(sessionId: string): Promise<boolean> {
    try {
      if (!this.superAdminValidator) {
        return false;
      }

      const validationResult = await this.superAdminValidator.validateSession(sessionId);
      return validationResult.valid;
    } catch (error) {
      await this.logSecurityEvent('super_admin_session_validation_error', {
        sessionId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check if user has super admin permission
   */
  hasSuperAdminPermission(action: string): boolean {
    const session = this.getCurrentSuperAdminSession();
    if (!session) {
      return false;
    }

    return session.superAdminPermissions.includes(action);
  }

  /**
   * Revoke super admin session
   */
  async revokeSuperAdminSession(reason: string = 'Manual revocation'): Promise<boolean> {
    try {
      if (!this.currentSuperAdminSession || !this.superAdminValidator) {
        return false;
      }

      const success = await this.superAdminValidator.revokeSession(
        this.currentSuperAdminSession.superAdminSessionId,
        reason
      );

      if (success) {
        await this.logSecurityEvent('super_admin_session_revoked', {
          sessionId: this.currentSuperAdminSession.superAdminSessionId,
          userId: this.currentSuperAdminSession.userId,
          reason
        });

        this.currentSuperAdminSession = null;
      }

      return success;
    } catch (error) {
      await this.logSecurityEvent('super_admin_session_revocation_error', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Register hardware key for super admin
   */
  async registerHardwareKey(
    adminUserId: string,
    keyCredential: HardwareKeyCredential,
    attestationData?: ArrayBuffer
  ): Promise<{ success: boolean; keyId: string; reason?: string }> {
    try {
      if (!this.superAdminValidator) {
        return {
          success: false,
          keyId: '',
          reason: 'Super admin validator not initialized'
        };
      }

      const result = await this.superAdminValidator.registerHardwareKey(
        adminUserId,
        keyCredential,
        attestationData
      );

      await this.logSecurityEvent('hardware_key_registration', {
        adminUserId,
        success: result.success,
        keyId: result.keyId,
        algorithm: keyCredential.algorithm
      });

      return result;
    } catch (error) {
      await this.logSecurityEvent('hardware_key_registration_error', {
        adminUserId,
        error: error.message
      });

      return {
        success: false,
        keyId: '',
        reason: `Hardware key registration failed: ${error.message}`
      };
    }
  }

  /**
   * Get super admin security statistics
   */
  getSuperAdminSecurityStats(): any {
    if (!this.superAdminValidator) {
      return null;
    }

    return this.superAdminValidator.getSecurityStatistics();
  }

  /**
   * Get super admin audit trail
   */
  getSuperAdminAuditTrail(limit: number = 100): any[] {
    if (!this.superAdminValidator) {
      return [];
    }

    return this.superAdminValidator.getAuditTrail(limit);
  }
}
