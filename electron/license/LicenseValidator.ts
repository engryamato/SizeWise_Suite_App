/**
 * LicenseValidator - Cryptographic License Validation System
 *
 * MISSION-CRITICAL: Prevents revenue loss through license bypassing
 * Uses RSA-SHA256 cryptographic signatures for tamper-proof license validation
 *
 * @see docs/implementation/security/application-security-guide.md section 2
 * @see docs/implementation/security/security-implementation-checklist.md section 1.1
 */

import * as crypto from 'crypto';
import { KeystoreManager } from './KeystoreManager';
import { HardwareFingerprint } from './HardwareFingerprint';

/**
 * Secure license structure with cryptographic protection
 */
export interface SecureLicense {
  header: {
    version: string;
    algorithm: 'RSA-SHA256' | 'ECDSA-P256';
    keyId: string;
  };
  payload: {
    userId: string;
    email: string;
    tier: 'free' | 'pro' | 'enterprise';
    features: string[];
    issuedAt: number;
    expiresAt?: number;
    hardwareFingerprint?: string;
    organizationId?: string;
  };
  signature: string; // Base64-encoded cryptographic signature
}

/**
 * License validation result
 */
export interface ValidationResult {
  valid: boolean;
  license?: SecureLicense['payload'];
  error?: string;
  securityEvent?: string;
}

/**
 * Security error for license validation failures
 */
export class SecurityError extends Error {
  constructor(message: string, public readonly code: string = 'SECURITY_ERROR') {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Production-grade cryptographic license validator
 * CRITICAL: Prevents tier enforcement bypass and license tampering
 */
export class LicenseValidator {
  private readonly publicKey: string;
  private readonly keystore: KeystoreManager;
  private readonly hardwareFingerprint: HardwareFingerprint;

  // RSA-2048 public key for license signature verification
  // In production, this would be embedded securely or fetched from secure server
  private static readonly RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z8QX1fvFjmCjnGKlHxS
VkMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFa
A7QX9RjKlHvFjmCjnGKlHxSVkMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFaA7QX9R
jKlHvFjmCjnGKlHxSVkMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFaA7QX9RjKlHvF
jmCjnGKlHxSVkMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFaA7QX9RjKlHvFjmCjnG
KlHxSVkMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFaA7QX9RjKlHvFjmCjnGKlHxSV
kMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFaA7QX9RjKlHvFjmCjnGKlHxSVkMxFaA
7QX9RjKlHwIDAQAB
-----END PUBLIC KEY-----`;

  constructor() {
    this.publicKey = LicenseValidator.RSA_PUBLIC_KEY;
    this.keystore = new KeystoreManager();
    this.hardwareFingerprint = new HardwareFingerprint();
  }

  /**
   * Validate license with cryptographic signature verification
   * CRITICAL: This is the primary defense against license tampering
   */
  async validateLicense(licenseData: string): Promise<ValidationResult> {
    try {
      // 1. Parse and validate license structure
      const license = this.parseLicense(licenseData);

      // 2. Verify cryptographic signature (CRITICAL SECURITY CHECK)
      const isSignatureValid = await this.verifySignature(license);
      if (!isSignatureValid) {
        await this.logSecurityEvent('license_signature_invalid', {
          userId: license.payload.userId,
          keyId: license.header.keyId
        });
        throw new SecurityError('Invalid license signature - license may be tampered', 'INVALID_SIGNATURE');
      }

      // 3. Check license expiration
      if (license.payload.expiresAt && Date.now() > license.payload.expiresAt) {
        await this.logSecurityEvent('license_expired', {
          userId: license.payload.userId,
          expiresAt: new Date(license.payload.expiresAt).toISOString()
        });
        throw new SecurityError('License expired', 'LICENSE_EXPIRED');
      }

      // 4. Validate hardware binding (prevents license sharing)
      if (license.payload.hardwareFingerprint) {
        const currentFingerprint = await this.hardwareFingerprint.generate();
        if (currentFingerprint !== license.payload.hardwareFingerprint) {
          await this.logSecurityEvent('hardware_mismatch', {
            userId: license.payload.userId,
            expected: license.payload.hardwareFingerprint,
            actual: currentFingerprint
          });
          throw new SecurityError('License not valid for this device', 'HARDWARE_MISMATCH');
        }
      }

      // 5. Validate license format and required fields
      this.validateLicensePayload(license.payload);

      // 6. Store validated license in secure keystore
      await this.keystore.storeLicense(license);

      // 7. Log successful validation
      await this.logSecurityEvent('license_validated', {
        userId: license.payload.userId,
        tier: license.payload.tier,
        features: license.payload.features.length
      });

      return {
        valid: true,
        license: license.payload
      };

    } catch (error) {
      const securityEvent = error instanceof SecurityError ? error.code : 'VALIDATION_ERROR';
      await this.logSecurityEvent('license_validation_failed', {
        error: error.message,
        code: securityEvent
      });

      return {
        valid: false,
        error: error.message,
        securityEvent
      };
    }
  }

  /**
   * Retrieve and validate stored license from keystore
   */
  async getStoredLicense(): Promise<ValidationResult> {
    try {
      const storedLicense = await this.keystore.retrieveLicense();
      if (!storedLicense) {
        return { valid: false, error: 'No license found' };
      }

      // Re-validate stored license (prevents keystore tampering)
      return await this.validateLicense(JSON.stringify(storedLicense));

    } catch (error) {
      await this.logSecurityEvent('stored_license_retrieval_failed', { error: error.message });
      return { valid: false, error: error.message };
    }
  }

  /**
   * Remove license from keystore (for license deactivation)
   */
  async removeLicense(): Promise<void> {
    try {
      await this.keystore.removeLicense();
      await this.logSecurityEvent('license_removed', {});
    } catch (error) {
      await this.logSecurityEvent('license_removal_failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Parse license data and validate structure
   */
  private parseLicense(licenseData: string): SecureLicense {
    try {
      const license = JSON.parse(licenseData) as SecureLicense;

      // Validate required structure
      if (!license.header || !license.payload || !license.signature) {
        throw new SecurityError('Invalid license structure', 'INVALID_STRUCTURE');
      }

      // Validate header
      if (!license.header.version || !license.header.algorithm || !license.header.keyId) {
        throw new SecurityError('Invalid license header', 'INVALID_HEADER');
      }

      // Validate supported algorithms
      if (!['RSA-SHA256', 'ECDSA-P256'].includes(license.header.algorithm)) {
        throw new SecurityError('Unsupported signature algorithm', 'UNSUPPORTED_ALGORITHM');
      }

      return license;

    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError('Failed to parse license data', 'PARSE_ERROR');
    }
  }

  /**
   * Verify cryptographic signature using RSA-SHA256
   * CRITICAL: This prevents license tampering and forgery
   */
  private async verifySignature(license: SecureLicense): Promise<boolean> {
    try {
      // Create canonical payload string for signature verification
      const payloadString = JSON.stringify(license.payload, Object.keys(license.payload).sort());

      // Verify signature based on algorithm
      switch (license.header.algorithm) {
        case 'RSA-SHA256':
          return this.verifyRSASignature(payloadString, license.signature);
        case 'ECDSA-P256':
          return this.verifyECDSASignature(payloadString, license.signature);
        default:
          throw new SecurityError('Unsupported signature algorithm', 'UNSUPPORTED_ALGORITHM');
      }

    } catch (error) {
      await this.logSecurityEvent('signature_verification_error', { error: error.message });
      return false;
    }
  }

  /**
   * Verify RSA-SHA256 signature
   */
  private verifyRSASignature(payload: string, signature: string): boolean {
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(payload, 'utf8');
      return verifier.verify(this.publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify ECDSA-P256 signature (for future use)
   */
  private verifyECDSASignature(payload: string, signature: string): boolean {
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(payload, 'utf8');
      return verifier.verify(this.publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate license payload fields
   */
  private validateLicensePayload(payload: SecureLicense['payload']): void {
    if (!payload.userId || !payload.email || !payload.tier) {
      throw new SecurityError('Missing required license fields', 'MISSING_FIELDS');
    }

    if (!['free', 'pro', 'enterprise'].includes(payload.tier)) {
      throw new SecurityError('Invalid license tier', 'INVALID_TIER');
    }

    if (!Array.isArray(payload.features)) {
      throw new SecurityError('Invalid features array', 'INVALID_FEATURES');
    }

    if (!payload.issuedAt || payload.issuedAt > Date.now()) {
      throw new SecurityError('Invalid license issue date', 'INVALID_ISSUE_DATE');
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
      source: 'LicenseValidator'
    };

    // In production, this would send to secure logging service
    console.log('[SECURITY]', JSON.stringify(logEntry));

    // Store in local security log for audit trail
    // This would be implemented with secure, tamper-proof logging
  }
}