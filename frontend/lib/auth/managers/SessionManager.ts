/**
 * Session Manager for SizeWise Suite Authentication
 * 
 * Handles session creation, validation, storage, and lifecycle management
 * with secure storage and device fingerprinting.
 */

import * as crypto from 'crypto';
import { 
  AuthSession, 
  SuperAdminSession, 
  SessionConfig, 
  SessionValidationResult,
  DeviceFingerprint,
  SessionMetadata,
  AuthenticationMethod
} from '../types/AuthTypes';
import { SecurityLogger } from '../utils/SecurityLogger';

export class SessionManager {
  private readonly securityLogger: SecurityLogger;
  private readonly config: SessionConfig;
  private activeSessions: Map<string, AuthSession> = new Map();

  constructor(config?: Partial<SessionConfig>) {
    this.securityLogger = SecurityLogger.getInstance();
    this.config = {
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
      activityTimeout: 30 * 60 * 1000, // 30 minutes
      superAdminTimeout: 30 * 60 * 1000, // 30 minutes
      maxConcurrentSessions: 5,
      requireDeviceFingerprint: true,
      ...config
    };
  }

  /**
   * Create a new secure session
   */
  async createSession(
    userId: string,
    email: string,
    tier: 'free' | 'pro' | 'enterprise' | 'super_admin',
    permissions: string[],
    authMethod: AuthenticationMethod = 'password'
  ): Promise<AuthSession> {
    try {
      const sessionId = this.generateSessionId();
      const now = Date.now();
      const deviceFingerprint = await this.generateDeviceFingerprint();

      const session: AuthSession = {
        sessionId,
        userId,
        email,
        tier,
        issuedAt: now,
        expiresAt: now + this.config.sessionTimeout,
        lastActivity: now,
        deviceFingerprint,
        permissions
      };

      // Store session
      this.activeSessions.set(sessionId, session);
      await this.storeSessionSecurely(session);

      // Log session creation
      await this.securityLogger.logSessionActivity(
        sessionId,
        userId,
        'session_created',
        { 
          tier, 
          authMethod,
          expiresAt: session.expiresAt,
          deviceFingerprint: deviceFingerprint.substring(0, 8) + '...'
        }
      );

      return session;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('session_creation_error', {
        userId,
        error: errorMessage
      }, 'high');
      throw error;
    }
  }

  /**
   * Create a super admin session
   */
  async createSuperAdminSession(
    userId: string,
    email: string,
    permissions: string[],
    hardwareKeyId: string,
    emergencyAccess: boolean = false
  ): Promise<SuperAdminSession> {
    try {
      const sessionId = this.generateSessionId();
      const superAdminSessionId = this.generateSessionId();
      const now = Date.now();
      const deviceFingerprint = await this.generateDeviceFingerprint();

      const session: SuperAdminSession = {
        sessionId,
        userId,
        email,
        tier: 'super_admin',
        issuedAt: now,
        expiresAt: now + this.config.sessionTimeout,
        lastActivity: now,
        deviceFingerprint,
        permissions,
        superAdminSessionId,
        hardwareKeyId,
        emergencyAccess,
        superAdminPermissions: permissions,
        superAdminExpiresAt: now + this.config.superAdminTimeout
      };

      // Store session
      this.activeSessions.set(sessionId, session);
      await this.storeSessionSecurely(session);

      // Log super admin session creation
      await this.securityLogger.logSuperAdminActivity(
        userId,
        'super_admin_session_created',
        { 
          hardwareKeyId,
          emergencyAccess,
          expiresAt: session.superAdminExpiresAt
        }
      );

      return session;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('super_admin_session_creation_error', {
        userId,
        error: errorMessage
      }, 'critical');
      throw error;
    }
  }

  /**
   * Validate a session
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    try {
      // Get session from memory or storage
      let session = this.activeSessions.get(sessionId);
      if (!session) {
        session = await this.restoreSessionFromStorage(sessionId);
        if (session) {
          this.activeSessions.set(sessionId, session);
        }
      }

      if (!session) {
        return {
          valid: false,
          error: 'Session not found'
        };
      }

      const now = Date.now();

      // Check session expiration
      if (session.expiresAt < now) {
        await this.removeSession(sessionId);
        return {
          valid: false,
          error: 'Session expired',
          expired: true
        };
      }

      // Check activity timeout
      if (session.lastActivity + this.config.activityTimeout < now) {
        await this.removeSession(sessionId);
        return {
          valid: false,
          error: 'Session inactive too long',
          expired: true
        };
      }

      // Check super admin session expiration
      if (this.isSuperAdminSession(session)) {
        const superSession = session as SuperAdminSession;
        if (superSession.superAdminExpiresAt < now) {
          await this.removeSession(sessionId);
          return {
            valid: false,
            error: 'Super admin session expired',
            expired: true
          };
        }
      }

      // Validate device fingerprint if required
      if (this.config.requireDeviceFingerprint) {
        const currentFingerprint = await this.generateDeviceFingerprint();
        if (session.deviceFingerprint !== currentFingerprint) {
          await this.securityLogger.logSecurityEvent('device_fingerprint_mismatch', {
            sessionId,
            userId: session.userId,
            storedFingerprint: session.deviceFingerprint.substring(0, 8) + '...',
            currentFingerprint: currentFingerprint.substring(0, 8) + '...'
          }, 'high');

          await this.removeSession(sessionId);
          return {
            valid: false,
            error: 'Device fingerprint mismatch'
          };
        }
      }

      return {
        valid: true,
        session
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('session_validation_error', {
        sessionId,
        error: errorMessage
      }, 'medium');

      return {
        valid: false,
        error: `Session validation failed: ${errorMessage}`
      };
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return false;
      }

      session.lastActivity = Date.now();
      this.activeSessions.set(sessionId, session);
      await this.storeSessionSecurely(session);

      return true;

    } catch (error) {
      await this.securityLogger.logSecurityEvent('session_activity_update_error', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'low');
      return false;
    }
  }

  /**
   * Remove a session
   */
  async removeSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      
      // Remove from memory
      this.activeSessions.delete(sessionId);
      
      // Remove from storage
      await this.removeSessionFromStorage(sessionId);

      // Log session removal
      if (session) {
        await this.securityLogger.logSessionActivity(
          sessionId,
          session.userId,
          'session_removed'
        );
      }

    } catch (error) {
      await this.securityLogger.logSecurityEvent('session_removal_error', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'medium');
    }
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(sessionId: string): SessionMetadata | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      createdAt: session.issuedAt,
      lastActivity: session.lastActivity,
      ipAddress: '127.0.0.1', // Would be actual IP in production
      userAgent: this.getUserAgent(),
      deviceFingerprint: session.deviceFingerprint,
      authenticationMethod: 'password' // Would track actual method
    };
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): AuthSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }

  /**
   * Clear all sessions for a user
   */
  async clearUserSessions(userId: string): Promise<void> {
    const userSessions = this.getUserSessions(userId);
    
    for (const session of userSessions) {
      await this.removeSession(session.sessionId);
    }

    await this.securityLogger.logSecurityEvent('user_sessions_cleared', {
      userId,
      sessionCount: userSessions.length
    }, 'medium');
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async generateDeviceFingerprint(): Promise<string> {
    try {
      const fingerprint: DeviceFingerprint = {
        userAgent: this.getUserAgent(),
        screen: this.getScreenInfo(),
        timezone: this.getTimezone(),
        language: this.getLanguage(),
        platform: this.getPlatform(),
        hash: ''
      };

      // Create hash of fingerprint components
      const fingerprintString = JSON.stringify(fingerprint);
      fingerprint.hash = crypto.createHash('sha256')
        .update(fingerprintString)
        .digest('hex');

      return fingerprint.hash;

    } catch (error) {
      // Fallback fingerprint
      return crypto.createHash('sha256')
        .update(`fallback_${Date.now()}_${Math.random()}`)
        .digest('hex');
    }
  }

  private getUserAgent(): string {
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator.userAgent;
    }
    return 'Unknown';
  }

  private getScreenInfo(): string {
    if (typeof window !== 'undefined' && window.screen) {
      return `${window.screen.width}x${window.screen.height}`;
    }
    return 'Unknown';
  }

  private getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'Unknown';
    }
  }

  private getLanguage(): string {
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator.language;
    }
    return 'Unknown';
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined' && window.navigator) {
      return (window.navigator as any).platform || 'Unknown';
    }
    return 'Unknown';
  }

  private isSuperAdminSession(session: AuthSession): session is SuperAdminSession {
    return 'superAdminSessionId' in session;
  }

  private async storeSessionSecurely(session: AuthSession): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sessionData = JSON.stringify(session);
        localStorage.setItem(`session_${session.sessionId}`, sessionData);
      }
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  private async restoreSessionFromStorage(sessionId: string): Promise<AuthSession | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sessionData = localStorage.getItem(`session_${sessionId}`);
        if (sessionData) {
          return JSON.parse(sessionData);
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  }

  private async removeSessionFromStorage(sessionId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(`session_${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to remove session from storage:', error);
    }
  }
}
