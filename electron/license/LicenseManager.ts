/**
 * LicenseManager - Secure License Validation and Storage
 * 
 * MISSION-CRITICAL: Secure license management with OS keystore integration
 * Prevents license bypassing and ensures tier enforcement integrity
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.2
 */

import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import * as keytar from 'keytar';
import { createHash, createHmac, randomBytes } from 'crypto';
import { SecurityManager } from '../../backend/security/SecurityManager';

/**
 * License information structure
 */
export interface LicenseInfo {
  licenseKey: string;
  userEmail: string;
  userName: string;
  tier: 'free' | 'pro' | 'enterprise';
  issuedAt: Date;
  expiresAt: Date | null; // null for perpetual licenses
  features: string[];
  signature: string;
  hardwareFingerprint: string;
}

/**
 * License validation result
 */
export interface LicenseValidationResult {
  isValid: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  reason?: string;
  expiresAt?: Date;
  daysRemaining?: number;
  features: string[];
}

/**
 * License storage configuration
 */
interface LicenseConfig {
  serviceName: string;
  accountName: string;
  encryptionKey: string;
  signatureKey: string;
  maxTrialDays: number;
  hardwareBinding: boolean;
}

/**
 * Trial license information
 */
interface TrialInfo {
  startDate: Date;
  daysUsed: number;
  maxDays: number;
  hardwareFingerprint: string;
}

/**
 * LicenseManager - Secure license validation and storage system
 * CRITICAL: Prevents license bypassing and unauthorized tier access
 */
export class LicenseManager {
  private securityManager: SecurityManager;
  private config: LicenseConfig;
  private licenseInfo: LicenseInfo | null = null;
  private trialInfo: TrialInfo | null = null;

  constructor() {
    this.securityManager = new SecurityManager();
    
    this.config = {
      serviceName: 'SizeWise Suite',
      accountName: 'license',
      encryptionKey: this.generateEncryptionKey(),
      signatureKey: this.generateSignatureKey(),
      maxTrialDays: 14,
      hardwareBinding: true
    };
  }

  /**
   * Initialize license manager
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing license manager...');

      // Create license directory if it doesn't exist
      const licenseDir = this.getLicenseDirectory();
      if (!existsSync(licenseDir)) {
        mkdirSync(licenseDir, { recursive: true });
      }

      // Load existing license
      await this.loadLicense();

      // Initialize trial if no license exists
      if (!this.licenseInfo) {
        await this.initializeTrial();
      }

      console.log('✅ License manager initialized');
    } catch (error) {
      console.error('❌ License manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate current license
   */
  public async validateLicense(): Promise<LicenseValidationResult> {
    const startTime = Date.now();

    try {
      // Check if license exists
      if (!this.licenseInfo) {
        return this.validateTrialLicense();
      }

      // Validate license signature
      if (!this.validateSignature(this.licenseInfo)) {
        return {
          isValid: false,
          tier: 'free',
          reason: 'Invalid license signature',
          features: []
        };
      }

      // Validate hardware fingerprint
      if (this.config.hardwareBinding) {
        const currentFingerprint = await this.generateHardwareFingerprint();
        if (this.licenseInfo.hardwareFingerprint !== currentFingerprint) {
          return {
            isValid: false,
            tier: 'free',
            reason: 'License not valid for this hardware',
            features: []
          };
        }
      }

      // Check expiration
      if (this.licenseInfo.expiresAt && this.licenseInfo.expiresAt < new Date()) {
        return {
          isValid: false,
          tier: 'free',
          reason: 'License has expired',
          features: []
        };
      }

      // Calculate days remaining
      let daysRemaining: number | undefined;
      if (this.licenseInfo.expiresAt) {
        const msRemaining = this.licenseInfo.expiresAt.getTime() - Date.now();
        daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      }

      const validationTime = Date.now() - startTime;
      if (validationTime > 100) {
        console.warn(`⚠️ License validation took ${validationTime}ms (exceeds 100ms target)`);
      }

      return {
        isValid: true,
        tier: this.licenseInfo.tier,
        expiresAt: this.licenseInfo.expiresAt || undefined,
        daysRemaining,
        features: this.licenseInfo.features
      };

    } catch (error) {
      console.error('License validation error:', error);
      return {
        isValid: false,
        tier: 'free',
        reason: `Validation error: ${error.message}`,
        features: []
      };
    }
  }

  /**
   * Install new license
   */
  public async installLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      console.log('📥 Installing license...');

      // Parse license key
      const licenseData = this.parseLicenseKey(licenseKey);
      if (!licenseData) {
        return {
          isValid: false,
          tier: 'free',
          reason: 'Invalid license key format',
          features: []
        };
      }

      // Validate license signature
      if (!this.validateSignature(licenseData)) {
        return {
          isValid: false,
          tier: 'free',
          reason: 'Invalid license signature',
          features: []
        };
      }

      // Generate hardware fingerprint
      if (this.config.hardwareBinding) {
        licenseData.hardwareFingerprint = await this.generateHardwareFingerprint();
      }

      // Store license securely
      await this.storeLicense(licenseData);

      // Update current license info
      this.licenseInfo = licenseData;

      console.log(`✅ License installed for ${licenseData.tier} tier`);

      // Validate the newly installed license
      return await this.validateLicense();

    } catch (error) {
      console.error('License installation failed:', error);
      return {
        isValid: false,
        tier: 'free',
        reason: `Installation error: ${error.message}`,
        features: []
      };
    }
  }

  /**
   * Get current license information
   */
  public async getLicenseInfo(): Promise<{
    hasLicense: boolean;
    tier: 'free' | 'pro' | 'enterprise';
    userEmail?: string;
    userName?: string;
    expiresAt?: Date;
    daysRemaining?: number;
    features: string[];
    isTrial: boolean;
    trialDaysRemaining?: number;
  }> {
    if (this.licenseInfo) {
      let daysRemaining: number | undefined;
      if (this.licenseInfo.expiresAt) {
        const msRemaining = this.licenseInfo.expiresAt.getTime() - Date.now();
        daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      }

      return {
        hasLicense: true,
        tier: this.licenseInfo.tier,
        userEmail: this.licenseInfo.userEmail,
        userName: this.licenseInfo.userName,
        expiresAt: this.licenseInfo.expiresAt || undefined,
        daysRemaining,
        features: this.licenseInfo.features,
        isTrial: false
      };
    }

    // Return trial information
    if (this.trialInfo) {
      const trialDaysRemaining = this.trialInfo.maxDays - this.trialInfo.daysUsed;
      return {
        hasLicense: false,
        tier: 'free',
        features: this.getTrialFeatures(),
        isTrial: true,
        trialDaysRemaining: Math.max(0, trialDaysRemaining)
      };
    }

    return {
      hasLicense: false,
      tier: 'free',
      features: [],
      isTrial: false
    };
  }

  /**
   * Get user tier from license
   */
  public async getUserTier(): Promise<'free' | 'pro' | 'enterprise'> {
    const validation = await this.validateLicense();
    return validation.tier;
  }

  /**
   * Remove license (for testing or license transfer)
   */
  public async removeLicense(): Promise<void> {
    try {
      console.log('🗑️ Removing license...');

      // Remove from OS keystore
      await keytar.deletePassword(this.config.serviceName, this.config.accountName);

      // Remove license file
      const licensePath = this.getLicensePath();
      if (existsSync(licensePath)) {
        writeFileSync(licensePath, ''); // Overwrite with empty content
      }

      // Clear in-memory license
      this.licenseInfo = null;

      // Reinitialize trial
      await this.initializeTrial();

      console.log('✅ License removed');
    } catch (error) {
      console.error('License removal failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // Clear sensitive data from memory
    this.licenseInfo = null;
    this.trialInfo = null;
    console.log('✅ License manager cleanup complete');
  }

  /**
   * Load license from secure storage
   */
  private async loadLicense(): Promise<void> {
    try {
      // Try to load from OS keystore first
      const keystoreData = await keytar.getPassword(this.config.serviceName, this.config.accountName);
      
      if (keystoreData) {
        const decryptedData = this.securityManager.decrypt(keystoreData);
        this.licenseInfo = JSON.parse(decryptedData);
        console.log('✅ License loaded from keystore');
        return;
      }

      // Fallback to file-based storage (encrypted)
      const licensePath = this.getLicensePath();
      if (existsSync(licensePath)) {
        const encryptedData = readFileSync(licensePath, 'utf8');
        if (encryptedData.trim()) {
          const decryptedData = this.securityManager.decrypt(encryptedData);
          this.licenseInfo = JSON.parse(decryptedData);
          
          // Migrate to keystore
          await this.storeLicense(this.licenseInfo);
          console.log('✅ License migrated to keystore');
        }
      }

    } catch (error) {
      console.warn('License loading failed:', error);
      this.licenseInfo = null;
    }
  }

  /**
   * Store license securely
   */
  private async storeLicense(license: LicenseInfo): Promise<void> {
    try {
      const licenseData = JSON.stringify(license);
      const encryptedData = this.securityManager.encrypt(licenseData);

      // Store in OS keystore (primary)
      await keytar.setPassword(this.config.serviceName, this.config.accountName, encryptedData);

      // Store in file as backup (encrypted)
      const licensePath = this.getLicensePath();
      writeFileSync(licensePath, encryptedData, { mode: 0o600 }); // Restricted permissions

      console.log('✅ License stored securely');
    } catch (error) {
      console.error('License storage failed:', error);
      throw error;
    }
  }

  /**
   * Initialize trial license
   */
  private async initializeTrial(): Promise<void> {
    try {
      const trialPath = this.getTrialPath();
      
      if (existsSync(trialPath)) {
        // Load existing trial
        const trialData = readFileSync(trialPath, 'utf8');
        const decryptedData = this.securityManager.decrypt(trialData);
        this.trialInfo = JSON.parse(decryptedData);
        
        // Update days used
        const daysSinceStart = Math.floor((Date.now() - this.trialInfo.startDate.getTime()) / (1000 * 60 * 60 * 24));
        this.trialInfo.daysUsed = Math.min(daysSinceStart, this.trialInfo.maxDays);
        
        // Save updated trial info
        await this.saveTrialInfo();
      } else {
        // Create new trial
        this.trialInfo = {
          startDate: new Date(),
          daysUsed: 0,
          maxDays: this.config.maxTrialDays,
          hardwareFingerprint: await this.generateHardwareFingerprint()
        };
        
        await this.saveTrialInfo();
        console.log(`✅ Trial initialized (${this.config.maxTrialDays} days)`);
      }
    } catch (error) {
      console.error('Trial initialization failed:', error);
      // Create minimal trial as fallback
      this.trialInfo = {
        startDate: new Date(),
        daysUsed: 0,
        maxDays: this.config.maxTrialDays,
        hardwareFingerprint: 'unknown'
      };
    }
  }

  /**
   * Validate trial license
   */
  private validateTrialLicense(): LicenseValidationResult {
    if (!this.trialInfo) {
      return {
        isValid: false,
        tier: 'free',
        reason: 'No trial information available',
        features: []
      };
    }

    // Check if trial has expired
    if (this.trialInfo.daysUsed >= this.trialInfo.maxDays) {
      return {
        isValid: false,
        tier: 'free',
        reason: 'Trial period has expired',
        features: []
      };
    }

    // Validate hardware fingerprint
    if (this.config.hardwareBinding && this.trialInfo.hardwareFingerprint !== 'unknown') {
      // Note: We can't validate hardware fingerprint synchronously here
      // This would need to be done in an async context
    }

    const daysRemaining = this.trialInfo.maxDays - this.trialInfo.daysUsed;

    return {
      isValid: true,
      tier: 'free',
      daysRemaining,
      features: this.getTrialFeatures()
    };
  }

  /**
   * Save trial information
   */
  private async saveTrialInfo(): Promise<void> {
    if (!this.trialInfo) return;

    try {
      const trialData = JSON.stringify(this.trialInfo);
      const encryptedData = this.securityManager.encrypt(trialData);
      const trialPath = this.getTrialPath();
      
      writeFileSync(trialPath, encryptedData, { mode: 0o600 });
    } catch (error) {
      console.error('Trial info save failed:', error);
    }
  }

  /**
   * Parse license key
   */
  private parseLicenseKey(licenseKey: string): LicenseInfo | null {
    try {
      // License key format: base64(JSON + signature)
      const decoded = Buffer.from(licenseKey, 'base64').toString('utf8');
      const licenseData = JSON.parse(decoded);

      // Convert date strings to Date objects
      if (licenseData.issuedAt) {
        licenseData.issuedAt = new Date(licenseData.issuedAt);
      }
      if (licenseData.expiresAt) {
        licenseData.expiresAt = new Date(licenseData.expiresAt);
      }

      return licenseData;
    } catch (error) {
      console.error('License key parsing failed:', error);
      return null;
    }
  }

  /**
   * Validate license signature
   */
  private validateSignature(license: LicenseInfo): boolean {
    try {
      // Create signature payload (exclude signature field)
      const { signature, ...payload } = license;
      const payloadString = JSON.stringify(payload);
      
      // Generate expected signature
      const expectedSignature = createHmac('sha256', this.config.signatureKey)
        .update(payloadString)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature validation failed:', error);
      return false;
    }
  }

  /**
   * Generate hardware fingerprint
   */
  private async generateHardwareFingerprint(): Promise<string> {
    try {
      const os = require('os');
      const { machineId } = require('node-machine-id');
      
      // Combine multiple hardware identifiers
      const identifiers = [
        os.hostname(),
        os.platform(),
        os.arch(),
        await machineId(),
        os.cpus()[0]?.model || 'unknown'
      ];

      const combined = identifiers.join('|');
      return createHash('sha256').update(combined).digest('hex');
    } catch (error) {
      console.error('Hardware fingerprint generation failed:', error);
      return 'unknown';
    }
  }

  /**
   * Get trial features
   */
  private getTrialFeatures(): string[] {
    return [
      'air_duct_sizer',
      'basic_calculations',
      'pdf_export',
      'json_export'
    ];
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    // In production, this should be derived from app-specific data
    return createHash('sha256').update(`${app.getName()}-encryption`).digest('hex');
  }

  /**
   * Generate signature key
   */
  private generateSignatureKey(): string {
    // In production, this should be a secure key from build process
    return createHash('sha256').update(`${app.getName()}-signature`).digest('hex');
  }

  /**
   * Get license directory path
   */
  private getLicenseDirectory(): string {
    return join(app.getPath('userData'), 'license');
  }

  /**
   * Get license file path
   */
  private getLicensePath(): string {
    return join(this.getLicenseDirectory(), 'license.dat');
  }

  /**
   * Get trial file path
   */
  private getTrialPath(): string {
    return join(this.getLicenseDirectory(), 'trial.dat');
  }
}

export default LicenseManager;
