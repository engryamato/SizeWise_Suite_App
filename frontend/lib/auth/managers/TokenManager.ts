/**
 * Token Manager for JWT Token Operations
 * 
 * Handles JWT token generation, validation, and refresh operations
 * with secure signing and verification.
 */

import * as crypto from 'crypto';
import { 
  AuthSession, 
  JWTPayload, 
  JWTValidationResult,
  AuthConfig
} from '../types/AuthTypes';
import { SecurityLogger } from '../utils/SecurityLogger';

export class TokenManager {
  private readonly securityLogger: SecurityLogger;
  private readonly jwtSecret: string;
  private readonly tokenExpiry: number;

  constructor(config?: Partial<AuthConfig>) {
    this.securityLogger = SecurityLogger.getInstance();
    this.jwtSecret = config?.jwtSecret || process.env.JWT_SECRET || 'SizeWise-Suite-JWT-Secret-2024';
    this.tokenExpiry = config?.sessionTimeout || 8 * 60 * 60 * 1000; // 8 hours
  }

  /**
   * Generate JWT token from session
   */
  async generateJWTToken(session: AuthSession): Promise<string> {
    try {
      const payload: JWTPayload = {
        sub: session.userId,
        email: session.email,
        tier: session.tier,
        permissions: session.permissions,
        sessionId: session.sessionId,
        iat: Math.floor(session.issuedAt / 1000),
        exp: Math.floor(session.expiresAt / 1000),
        deviceFingerprint: session.deviceFingerprint
      };

      const token = this.createJWT(payload);

      await this.securityLogger.logSecurityEvent('jwt_token_generated', {
        userId: session.userId,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt
      }, 'low');

      return token;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('jwt_generation_error', {
        userId: session.userId,
        sessionId: session.sessionId,
        error: errorMessage
      }, 'high');
      throw new Error(`Failed to generate JWT token: ${errorMessage}`);
    }
  }

  /**
   * Validate JWT token
   */
  async validateJWTToken(token: string): Promise<JWTValidationResult> {
    try {
      if (!token || typeof token !== 'string') {
        return {
          success: false,
          error: 'Invalid token format'
        };
      }

      // Remove Bearer prefix if present
      const cleanToken = token.replace(/^Bearer\s+/, '');

      // Parse and verify JWT
      const payload = this.verifyJWT(cleanToken);
      
      if (!payload) {
        await this.securityLogger.logSecurityEvent('jwt_validation_failed', {
          reason: 'Invalid signature or format'
        }, 'medium');

        return {
          success: false,
          error: 'Invalid token signature'
        };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        await this.securityLogger.logSecurityEvent('jwt_token_expired', {
          userId: payload.sub,
          sessionId: payload.sessionId,
          expiredAt: payload.exp,
          currentTime: now
        }, 'low');

        return {
          success: false,
          error: 'Token expired',
          expired: true
        };
      }

      // Validate required fields
      if (!payload.sub || !payload.email || !payload.sessionId) {
        return {
          success: false,
          error: 'Invalid token payload'
        };
      }

      await this.securityLogger.logSecurityEvent('jwt_validation_success', {
        userId: payload.sub,
        sessionId: payload.sessionId
      }, 'low');

      return {
        success: true,
        payload
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('jwt_validation_error', {
        error: errorMessage
      }, 'medium');

      return {
        success: false,
        error: `Token validation failed: ${errorMessage}`
      };
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshJWTToken(currentToken: string, newSession: AuthSession): Promise<string> {
    try {
      // Validate current token first
      const validation = await this.validateJWTToken(currentToken);
      if (!validation.success || !validation.payload) {
        throw new Error('Current token is invalid');
      }

      // Generate new token with updated session
      const newToken = await this.generateJWTToken(newSession);

      await this.securityLogger.logSecurityEvent('jwt_token_refreshed', {
        userId: newSession.userId,
        oldSessionId: validation.payload.sessionId,
        newSessionId: newSession.sessionId
      }, 'low');

      return newToken;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('jwt_refresh_error', {
        error: errorMessage
      }, 'medium');
      throw new Error(`Failed to refresh JWT token: ${errorMessage}`);
    }
  }

  /**
   * Extract payload from token without validation (for debugging)
   */
  decodeJWTPayload(token: string): JWTPayload | null {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      const parts = cleanToken.split('.');
      
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      return payload;

    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired without full validation
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeJWTPayload(token);
      if (!payload) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;

    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): number | null {
    try {
      const payload = this.decodeJWTPayload(token);
      return payload ? payload.exp * 1000 : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(token: string, reason: string = 'Manual revocation'): Promise<void> {
    try {
      const payload = this.decodeJWTPayload(token);
      
      if (payload) {
        // In production, add to token blacklist/revocation list
        await this.addToBlacklist(token, payload, reason);

        await this.securityLogger.logSecurityEvent('jwt_token_revoked', {
          userId: payload.sub,
          sessionId: payload.sessionId,
          reason
        }, 'medium');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.securityLogger.logSecurityEvent('jwt_revocation_error', {
        error: errorMessage,
        reason
      }, 'medium');
    }
  }

  // ========================================
  // PRIVATE JWT OPERATIONS
  // ========================================

  private createJWT(payload: JWTPayload): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return null;
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      
      // Verify signature
      const expectedSignature = this.createSignature(`${headerB64}.${payloadB64}`);
      
      if (!this.timingSafeEqual(signatureB64, expectedSignature)) {
        return null;
      }

      // Parse payload
      const payload = JSON.parse(this.base64UrlDecode(payloadB64));
      
      return payload;

    } catch (error) {
      return null;
    }
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest('base64url');
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    // Add padding if needed
    const padding = '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
    
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      const bufferA = Buffer.from(a);
      const bufferB = Buffer.from(b);
      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      return false;
    }
  }

  private async addToBlacklist(token: string, payload: JWTPayload, reason: string): Promise<void> {
    try {
      // In production, store in Redis or database
      // For now, store in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const blacklist = JSON.parse(localStorage.getItem('jwt_blacklist') || '[]');
        blacklist.push({
          token: crypto.createHash('sha256').update(token).digest('hex'), // Store hash, not actual token
          userId: payload.sub,
          sessionId: payload.sessionId,
          revokedAt: Date.now(),
          reason,
          expiresAt: payload.exp * 1000
        });
        
        // Keep only non-expired entries
        const now = Date.now();
        const validEntries = blacklist.filter((entry: any) => entry.expiresAt > now);
        
        localStorage.setItem('jwt_blacklist', JSON.stringify(validEntries.slice(-1000)));
      }
    } catch (error) {
      console.error('Failed to add token to blacklist:', error);
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const blacklist = JSON.parse(localStorage.getItem('jwt_blacklist') || '[]');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        return blacklist.some((entry: any) => 
          entry.token === tokenHash && entry.expiresAt > Date.now()
        );
      }
      return false;
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false;
    }
  }
}
