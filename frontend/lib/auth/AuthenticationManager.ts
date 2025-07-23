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
import { KeystoreManager } from '../../../electron/license/KeystoreManager';

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
 * Production-grade authentication manager
 * CRITICAL: Secure session management and token validation
 */
export class AuthenticationManager {
  private readonly keystore: KeystoreManager;
  private currentSession: AuthSession | null = null;
  private readonly sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
  private readonly activityTimeout = 30 * 60 * 1000; // 30 minutes
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
}
