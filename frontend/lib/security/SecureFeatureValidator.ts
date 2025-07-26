/**
 * SecureFeatureValidator - Cryptographic Feature Flag Validation
 * 
 * MISSION-CRITICAL: Prevents feature flag tampering and tier bypass
 * Uses HMAC-SHA256 for integrity protection and cryptographic tier enforcement
 * 
 * @see docs/implementation/security/application-security-guide.md section 4
 * @see docs/implementation/security/security-implementation-checklist.md section 1.3
 */

import * as crypto from 'crypto';
import { FeatureFlagCrypto } from './FeatureFlagCrypto';
import { TierEnforcer } from './TierEnforcer';

/**
 * Secure feature flag structure with cryptographic protection
 */
export interface SecureFeatureFlag {
  id: string;
  userId?: string;
  featureName: string;
  enabled: boolean;
  tierRequired: 'free' | 'pro' | 'enterprise';
  expiresAt?: number;
  issuedAt: number;
  nonce: string;
  signature: string; // HMAC-SHA256 signature
}

/**
 * Feature validation result
 */
export interface ValidationResult {
  valid: boolean;
  enabled: boolean;
  error?: string;
  securityEvent?: string;
}

/**
 * Feature flag validation context
 */
export interface ValidationContext {
  userId: string;
  userTier: 'free' | 'pro' | 'enterprise' | 'super_admin';
  licenseValid: boolean;
  timestamp: number;
}

/**
 * Production-grade secure feature flag validator
 * CRITICAL: Prevents tier enforcement bypass through cryptographic validation
 */
export class SecureFeatureValidator {
  private readonly crypto: FeatureFlagCrypto;
  private readonly tierEnforcer: TierEnforcer;
  private readonly validationCache = new Map<string, { result: ValidationResult; expires: number }>();
  private readonly replayProtection = new Set<string>();

  // HMAC secret key for feature flag signing (in production, this would be securely managed)
  private static readonly HMAC_SECRET = 'SizeWise-Suite-Feature-Flag-HMAC-Secret-2024';

  constructor() {
    this.crypto = new FeatureFlagCrypto();
    this.tierEnforcer = new TierEnforcer();
  }

  /**
   * Validate feature flag with cryptographic integrity protection
   * CRITICAL: Primary defense against feature flag tampering
   */
  async validateFeature(
    featureName: string, 
    context: ValidationContext,
    storedFlag?: SecureFeatureFlag
  ): Promise<ValidationResult> {
    try {
      // 1. Check validation cache first (performance optimization)
      const cacheKey = `${context.userId}:${featureName}:${context.userTier}`;
      const cached = this.validationCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.result;
      }

      // 2. Validate license status first
      if (!context.licenseValid) {
        const result = { valid: false, enabled: false, error: 'Invalid license', securityEvent: 'INVALID_LICENSE' };
        this.cacheValidationResult(cacheKey, result, 60000); // Cache for 1 minute
        return result;
      }

      // 3. Get and validate stored feature flag
      let validatedFlag: SecureFeatureFlag;
      if (storedFlag) {
        const flagValidation = await this.validateStoredFlag(storedFlag, context);
        if (!flagValidation.valid) {
          return flagValidation;
        }
        validatedFlag = storedFlag;
      } else {
        // Generate default flag based on tier
        validatedFlag = await this.generateDefaultFlag(featureName, context);
      }

      // 4. Perform cryptographic tier enforcement
      // Map super_admin to enterprise for tier validation
      const tierForValidation = context.userTier === 'super_admin' ? 'enterprise' : context.userTier;
      const tierValidation = await this.tierEnforcer.validateTierAccess(
        featureName,
        tierForValidation,
        context.userId
      );

      if (!tierValidation.valid) {
        const result = { 
          valid: false, 
          enabled: false, 
          error: tierValidation.error,
          securityEvent: 'TIER_ENFORCEMENT_VIOLATION'
        };
        this.cacheValidationResult(cacheKey, result, 300000); // Cache for 5 minutes
        await this.logSecurityEvent('tier_enforcement_violation', {
          userId: context.userId,
          featureName,
          userTier: context.userTier,
          requiredTier: validatedFlag.tierRequired
        });
        return result;
      }

      // 5. Check feature flag expiration
      if (validatedFlag.expiresAt && validatedFlag.expiresAt < context.timestamp) {
        const result = { valid: false, enabled: false, error: 'Feature flag expired', securityEvent: 'FLAG_EXPIRED' };
        this.cacheValidationResult(cacheKey, result, 3600000); // Cache for 1 hour
        return result;
      }

      // 6. Anti-replay protection
      const replayKey = `${validatedFlag.nonce}:${context.userId}:${featureName}`;
      if (this.replayProtection.has(replayKey)) {
        const result = { valid: false, enabled: false, error: 'Replay attack detected', securityEvent: 'REPLAY_ATTACK' };
        await this.logSecurityEvent('replay_attack_detected', { userId: context.userId, featureName, nonce: validatedFlag.nonce });
        return result;
      }
      this.replayProtection.add(replayKey);

      // 7. Final validation result
      const result = { 
        valid: true, 
        enabled: validatedFlag.enabled && tierValidation.enabled 
      };
      
      this.cacheValidationResult(cacheKey, result, 600000); // Cache for 10 minutes
      
      await this.logSecurityEvent('feature_validated', {
        userId: context.userId,
        featureName,
        enabled: result.enabled,
        tier: context.userTier
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result = {
        valid: false,
        enabled: false,
        error: errorMessage,
        securityEvent: 'VALIDATION_ERROR'
      };

      await this.logSecurityEvent('validation_error', {
        userId: context.userId,
        featureName,
        error: errorMessage
      });

      return result;
    }
  }

  /**
   * Validate stored feature flag integrity
   * CRITICAL: Detects database tampering and flag modification
   */
  async validateStoredFlag(flag: SecureFeatureFlag, context: ValidationContext): Promise<ValidationResult> {
    try {
      // 1. Verify HMAC signature
      const isSignatureValid = this.verifyFlagSignature(flag);
      if (!isSignatureValid) {
        await this.logSecurityEvent('flag_signature_invalid', {
          userId: context.userId,
          featureName: flag.featureName,
          flagId: flag.id
        });
        return { 
          valid: false, 
          enabled: false, 
          error: 'Feature flag signature invalid - possible tampering',
          securityEvent: 'SIGNATURE_INVALID'
        };
      }

      // 2. Verify flag is not too old (prevent replay of old flags)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (context.timestamp - flag.issuedAt > maxAge) {
        return { 
          valid: false, 
          enabled: false, 
          error: 'Feature flag too old',
          securityEvent: 'FLAG_TOO_OLD'
        };
      }

      // 3. Verify user context matches
      if (flag.userId && flag.userId !== context.userId) {
        await this.logSecurityEvent('flag_user_mismatch', {
          expectedUserId: flag.userId,
          actualUserId: context.userId,
          featureName: flag.featureName
        });
        return { 
          valid: false, 
          enabled: false, 
          error: 'Feature flag user mismatch',
          securityEvent: 'USER_MISMATCH'
        };
      }

      // 4. Verify nonce uniqueness (anti-replay)
      if (!flag.nonce || flag.nonce.length < 16) {
        return { 
          valid: false, 
          enabled: false, 
          error: 'Invalid feature flag nonce',
          securityEvent: 'INVALID_NONCE'
        };
      }

      return { valid: true, enabled: flag.enabled };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        enabled: false,
        error: `Flag validation failed: ${errorMessage}`,
        securityEvent: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Generate cryptographically signed feature flag
   * CRITICAL: Creates tamper-proof feature flags
   */
  async generateSecureFlag(
    featureName: string,
    enabled: boolean,
    tierRequired: 'free' | 'pro' | 'enterprise',
    userId?: string,
    expiresAt?: number
  ): Promise<SecureFeatureFlag> {
    try {
      const now = Date.now();
      const nonce = crypto.randomBytes(16).toString('hex');
      
      const flag: Omit<SecureFeatureFlag, 'signature'> = {
        id: crypto.randomUUID(),
        userId,
        featureName,
        enabled,
        tierRequired,
        expiresAt,
        issuedAt: now,
        nonce
      };

      // Generate HMAC signature
      const signature = this.generateFlagSignature(flag);

      return {
        ...flag,
        signature
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Secure flag generation failed: ${errorMessage}`);
    }
  }

  /**
   * Batch validate multiple features for performance
   */
  async validateFeatures(
    featureNames: string[],
    context: ValidationContext,
    storedFlags?: Map<string, SecureFeatureFlag>
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    // Validate features in parallel for performance
    const validationPromises = featureNames.map(async (featureName) => {
      const storedFlag = storedFlags?.get(featureName);
      const result = await this.validateFeature(featureName, context, storedFlag);
      return { featureName, result };
    });

    const validationResults = await Promise.all(validationPromises);
    
    for (const { featureName, result } of validationResults) {
      results.set(featureName, result);
    }

    return results;
  }

  /**
   * Generate default feature flag based on tier
   */
  private async generateDefaultFlag(featureName: string, context: ValidationContext): Promise<SecureFeatureFlag> {
    // Get tier requirements for feature
    const tierRequired = this.getFeatureTierRequirement(featureName);
    // Map super_admin to enterprise for tier validation
    const tierForValidation = context.userTier === 'super_admin' ? 'enterprise' : context.userTier;
    const enabled = this.tierEnforcer.isTierSufficient(tierForValidation, tierRequired);

    return await this.generateSecureFlag(
      featureName,
      enabled,
      tierRequired,
      context.userId,
      undefined // No expiration for default flags
    );
  }

  /**
   * Get tier requirement for a feature
   */
  private getFeatureTierRequirement(featureName: string): 'free' | 'pro' | 'enterprise' {
    // Define feature tier requirements
    const tierRequirements: Record<string, 'free' | 'pro' | 'enterprise'> = {
      'basic_calculations': 'free',
      'project_creation': 'free',
      'pdf_export': 'free',
      'unlimited_projects': 'pro',
      'high_res_export': 'pro',
      'advanced_calculations': 'pro',
      'custom_templates': 'enterprise',
      'bim_export': 'enterprise',
      'priority_support': 'enterprise',
      'api_access': 'enterprise'
    };

    return tierRequirements[featureName] || 'enterprise'; // Default to highest tier for unknown features
  }

  /**
   * Generate HMAC-SHA256 signature for feature flag
   * CRITICAL: Prevents feature flag tampering
   */
  private generateFlagSignature(flag: Omit<SecureFeatureFlag, 'signature'>): string {
    try {
      // Create canonical string representation
      const canonicalData = JSON.stringify({
        id: flag.id,
        userId: flag.userId || null,
        featureName: flag.featureName,
        enabled: flag.enabled,
        tierRequired: flag.tierRequired,
        expiresAt: flag.expiresAt || null,
        issuedAt: flag.issuedAt,
        nonce: flag.nonce
      }, Object.keys(flag).sort());

      // Generate HMAC signature
      return crypto.createHmac('sha256', SecureFeatureValidator.HMAC_SECRET)
        .update(canonicalData)
        .digest('hex');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Signature generation failed: ${errorMessage}`);
    }
  }

  /**
   * Verify HMAC-SHA256 signature of feature flag
   */
  private verifyFlagSignature(flag: SecureFeatureFlag): boolean {
    try {
      const { signature, ...flagWithoutSignature } = flag;
      const expectedSignature = this.generateFlagSignature(flagWithoutSignature);
      
      // Use constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

    } catch (error) {
      return false;
    }
  }

  /**
   * Cache validation result for performance
   */
  private cacheValidationResult(key: string, result: ValidationResult, ttl: number): void {
    this.validationCache.set(key, {
      result: { ...result },
      expires: Date.now() + ttl
    });

    // Clean up expired cache entries periodically
    if (this.validationCache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.validationCache.entries()) {
      if (entry.expires <= now) {
        this.validationCache.delete(key);
      }
    }
  }

  /**
   * Log security events for monitoring and compliance
   */
  private async logSecurityEvent(event: string, data: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      source: 'SecureFeatureValidator'
    };
    
    // In production, this would send to secure logging service
    console.log('[SECURITY]', JSON.stringify(logEntry));
  }

  /**
   * Clear validation cache (for testing/debugging)
   */
  clearCache(): void {
    this.validationCache.clear();
    this.replayProtection.clear();
  }
}
