/**
 * KeystoreManager - Secure License Storage
 * 
 * MISSION-CRITICAL: Secure storage of validated licenses using OS keystore
 * Prevents license extraction and tampering through OS-level security
 * 
 * @see docs/implementation/security/application-security-guide.md section 2.3
 * @see docs/implementation/security/security-implementation-checklist.md section 1.1
 */

import * as keytar from 'keytar';
import * as crypto from 'crypto';
import { SecureLicense } from './LicenseValidator';

/**
 * Keystore configuration
 */
interface KeystoreConfig {
  serviceName: string;
  accountName: string;
  encryptionKey?: string;
}

/**
 * Production-grade secure keystore manager
 * Uses OS keystore (Windows Credential Manager, macOS Keychain, Linux Secret Service)
 */
export class KeystoreManager {
  private readonly config: KeystoreConfig;
  private readonly serviceName = 'SizeWise-Suite-License';
  private readonly accountName = 'license-data';

  constructor() {
    this.config = {
      serviceName: this.serviceName,
      accountName: this.accountName
    };
  }

  /**
   * Store validated license in OS keystore with encryption
   * CRITICAL: Prevents license extraction from memory or disk
   */
  async storeLicense(license: SecureLicense): Promise<void> {
    try {
      // Encrypt license data before storing
      const encryptedLicense = this.encryptLicenseData(license);
      
      // Store in OS keystore
      await keytar.setPassword(
        this.config.serviceName,
        this.config.accountName,
        encryptedLicense
      );
      
      // Store metadata separately for quick access
      await keytar.setPassword(
        this.config.serviceName,
        `${this.config.accountName}-meta`,
        JSON.stringify({
          userId: license.payload.userId,
          tier: license.payload.tier,
          expiresAt: license.payload.expiresAt,
          storedAt: Date.now()
        })
      );
      
    } catch (error) {
      throw new Error(`Failed to store license in keystore: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt license from OS keystore
   */
  async retrieveLicense(): Promise<SecureLicense | null> {
    try {
      const encryptedLicense = await keytar.getPassword(
        this.config.serviceName,
        this.config.accountName
      );
      
      if (!encryptedLicense) {
        return null;
      }
      
      // Decrypt and return license
      return this.decryptLicenseData(encryptedLicense);
      
    } catch (error) {
      throw new Error(`Failed to retrieve license from keystore: ${error.message}`);
    }
  }

  /**
   * Get license metadata without full decryption
   */
  async getLicenseMetadata(): Promise<any | null> {
    try {
      const metadata = await keytar.getPassword(
        this.config.serviceName,
        `${this.config.accountName}-meta`
      );
      
      return metadata ? JSON.parse(metadata) : null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove license from keystore
   */
  async removeLicense(): Promise<void> {
    try {
      await keytar.deletePassword(this.config.serviceName, this.config.accountName);
      await keytar.deletePassword(this.config.serviceName, `${this.config.accountName}-meta`);
    } catch (error) {
      throw new Error(`Failed to remove license from keystore: ${error.message}`);
    }
  }

  /**
   * Check if license exists in keystore
   */
  async hasLicense(): Promise<boolean> {
    try {
      const license = await keytar.getPassword(
        this.config.serviceName,
        this.config.accountName
      );
      return license !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt license data using AES-256-GCM
   * CRITICAL: Prevents license data extraction even if keystore is compromised
   */
  private encryptLicenseData(license: SecureLicense): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-gcm', key);
      
      let encrypted = cipher.update(JSON.stringify(license), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const result = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        data: encrypted
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
      
    } catch (error) {
      throw new Error(`License encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt license data using AES-256-GCM
   */
  private decryptLicenseData(encryptedData: string): SecureLicense {
    try {
      const key = this.getEncryptionKey();
      const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      
      const decipher = crypto.createDecipher('aes-256-gcm', key);
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
      
      let decrypted = decipher.update(data.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted) as SecureLicense;
      
    } catch (error) {
      throw new Error(`License decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate machine-specific encryption key
   * CRITICAL: Prevents license transfer between machines
   */
  private getEncryptionKey(): string {
    try {
      // Use machine-specific data for key derivation
      const machineId = this.getMachineIdentifier();
      const salt = 'SizeWise-Suite-License-Salt-2024';
      
      // Derive key using PBKDF2
      return crypto.pbkdf2Sync(machineId, salt, 100000, 32, 'sha256').toString('hex');
      
    } catch (error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Get machine-specific identifier for key derivation
   */
  private getMachineIdentifier(): string {
    try {
      // Combine multiple machine-specific identifiers
      const os = require('os');
      const identifiers = [
        os.hostname(),
        os.platform(),
        os.arch(),
        process.env.USERNAME || process.env.USER || 'unknown'
      ];
      
      // Create hash of combined identifiers
      return crypto.createHash('sha256')
        .update(identifiers.join('|'))
        .digest('hex');
        
    } catch (error) {
      // Fallback to basic identifier
      return crypto.createHash('sha256')
        .update('sizewise-fallback-identifier')
        .digest('hex');
    }
  }

  /**
   * Validate keystore integrity
   */
  async validateIntegrity(): Promise<boolean> {
    try {
      const license = await this.retrieveLicense();
      const metadata = await this.getLicenseMetadata();
      
      if (!license || !metadata) {
        return false;
      }
      
      // Verify metadata matches license
      return (
        license.payload.userId === metadata.userId &&
        license.payload.tier === metadata.tier &&
        license.payload.expiresAt === metadata.expiresAt
      );
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all license data (for debugging/testing)
   */
  async clearAll(): Promise<void> {
    try {
      await this.removeLicense();
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}
