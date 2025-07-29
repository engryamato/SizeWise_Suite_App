/**
 * Advanced Security Service for SizeWise Suite
 * Handles authentication, MFA, RBAC, and security monitoring
 */

import { z } from 'zod';

// Types and Interfaces
export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin?: Date;
  sessionId?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  mfaRequired?: boolean;
  sessionId?: string;
}

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface SecurityEvent {
  eventId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordMaxAgeDays: number;
  sessionTimeoutMinutes: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  mfaRequired: boolean;
}

// Validation Schemas
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letters')
  .regex(/[a-z]/, 'Password must contain lowercase letters')
  .regex(/[0-9]/, 'Password must contain numbers')
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'Password must contain special characters');

const mfaTokenSchema = z.string()
  .length(6, 'MFA token must be 6 digits')
  .regex(/^\d{6}$/, 'MFA token must contain only numbers');

export class SecurityService {
  private baseUrl: string;
  private currentUser: User | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private securityPolicy: SecurityPolicy;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.securityPolicy = {
      passwordMinLength: 12,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      passwordMaxAgeDays: 90,
      sessionTimeoutMinutes: 480, // 8 hours
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30,
      mfaRequired: true
    };

    // Initialize session monitoring
    this.initializeSessionMonitoring();
  }

  /**
   * Authenticate user with password and optional MFA
   */
  async authenticate(email: string, password: string, mfaToken?: string): Promise<AuthenticationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          mfaToken,
          userAgent: navigator.userAgent,
          ipAddress: await this.getClientIP()
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        this.startSessionTimeout();
        
        // Log successful authentication
        await this.logSecurityEvent({
          action: 'authentication_success',
          resourceType: 'user',
          resourceId: result.user.id,
          details: { method: 'password_mfa' },
          riskLevel: 'LOW'
        });

        return result;
      } else {
        // Log failed authentication
        await this.logSecurityEvent({
          action: 'authentication_failed',
          resourceType: 'user',
          details: { email, error: result.error },
          riskLevel: 'MEDIUM'
        });

        return result;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(): Promise<MFASetupResult> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        await this.logSecurityEvent({
          action: 'mfa_setup_initiated',
          resourceType: 'user',
          resourceId: this.currentUser?.id,
          details: { method: 'totp' },
          riskLevel: 'LOW'
        });
      }

      return result;
    } catch (error) {
      console.error('MFA setup error:', error);
      throw new Error('Failed to setup MFA');
    }
  }

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(token: string): Promise<boolean> {
    try {
      mfaTokenSchema.parse(token);

      const response = await fetch(`${this.baseUrl}/auth/mfa/verify-setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      await this.logSecurityEvent({
        action: 'mfa_setup_verified',
        resourceType: 'user',
        resourceId: this.currentUser?.id,
        details: { success: result.success },
        riskLevel: result.success ? 'LOW' : 'MEDIUM'
      });

      return result.success;
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasRole(roles: string | string[]): boolean {
    if (!this.currentUser) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some(role => this.currentUser!.roles.includes(role));
  }

  /**
   * Validate password against security policy
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    try {
      passwordSchema.parse(password);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => e.message)
        };
      }
      return { valid: false, errors: ['Password validation failed'] };
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const validation = this.validatePassword(newPassword);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const response = await fetch(`${this.baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });

      const result = await response.json();

      await this.logSecurityEvent({
        action: 'password_changed',
        resourceType: 'user',
        resourceId: this.currentUser?.id,
        details: { success: result.success },
        riskLevel: 'MEDIUM'
      });

      return result.success;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      await this.logSecurityEvent({
        action: 'logout',
        resourceType: 'user',
        resourceId: this.currentUser?.id,
        details: { method: 'manual' },
        riskLevel: 'LOW'
      });

      this.clearSession();
    } catch (error) {
      console.error('Logout error:', error);
      this.clearSession();
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Get security events for current user
   */
  async getSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/security/events?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      return [];
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: Partial<SecurityEvent>): Promise<void> {
    try {
      const fullEvent: SecurityEvent = {
        eventId: this.generateEventId(),
        userId: this.currentUser?.id || 'anonymous',
        timestamp: new Date(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        ...event
      } as SecurityEvent;

      await fetch(`${this.baseUrl}/security/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(fullEvent),
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Initialize session monitoring
   */
  private initializeSessionMonitoring(): void {
    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.resetSessionTimeout();
      }, true);
    });

    // Monitor page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSessionTimeout();
      } else {
        this.resumeSessionTimeout();
      }
    });
  }

  /**
   * Start session timeout
   */
  private startSessionTimeout(): void {
    this.clearSessionTimeout();
    
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.securityPolicy.sessionTimeoutMinutes * 60 * 1000);
  }

  /**
   * Reset session timeout
   */
  private resetSessionTimeout(): void {
    if (this.isAuthenticated()) {
      this.startSessionTimeout();
    }
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Pause session timeout
   */
  private pauseSessionTimeout(): void {
    this.clearSessionTimeout();
  }

  /**
   * Resume session timeout
   */
  private resumeSessionTimeout(): void {
    if (this.isAuthenticated()) {
      this.startSessionTimeout();
    }
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(): Promise<void> {
    await this.logSecurityEvent({
      action: 'session_timeout',
      resourceType: 'session',
      details: { reason: 'inactivity' },
      riskLevel: 'LOW'
    });

    this.clearSession();
    
    // Redirect to login or show session expired modal
    window.location.href = '/login?reason=session_expired';
  }

  /**
   * Clear session data
   */
  private clearSession(): void {
    this.currentUser = null;
    this.clearSessionTimeout();
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
  }

  /**
   * Get authentication token
   */
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const securityService = new SecurityService();
