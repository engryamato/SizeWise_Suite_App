/**
 * License Validator for SizeWise Suite
 * 
 * Handles license key validation, user extraction, and offline license verification
 * for the hybrid authentication system.
 */

import * as crypto from 'crypto';
import { 
  LicenseInfo, 
  LicenseValidationResult,
  UserTier,
  Permission,
  PermissionSet
} from '../types/AuthTypes';
import { SecurityLogger } from '../utils/SecurityLogger';

export class LicenseValidator {
  private readonly securityLogger: SecurityLogger;
  private readonly licenseCache: Map<string, LicenseInfo> = new Map();
  private readonly validationCache: Map<string, LicenseValidationResult> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.securityLogger = SecurityLogger.getInstance();
  }

  /**
   * Validate license key format
   */
  validateLicenseFormat(licenseKey: string): boolean {
    try {
      if (!licenseKey || typeof licenseKey !== 'string') {
        return false;
      }

      // SizeWise license format: SW-XXXX-XXXX-XXXX-XXXX (20 characters + 4 hyphens)
      const licensePattern = /^SW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      return licensePattern.test(licenseKey.toUpperCase());

    } catch (error) {
      return false;
    }
  }

  /**
   * Validate license key and extract user information
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      // Check cache first
      const cacheKey = this.hashLicenseKey(licenseKey);
      const cached = this.validationCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Validate format
      if (!this.validateLicenseFormat(licenseKey)) {
        const result: LicenseValidationResult = {
          valid: false,
          error: 'Invalid license key format'
        };
        
        await this.securityLogger.logSecurityEvent('license_format_invalid', {
          licenseKey: licenseKey.substring(0, 8) + '...'
        }, 'medium');

        return result;
      }

      // Extract and validate license information
      const licenseInfo = await this.extractLicenseInfo(licenseKey);
      
      if (!licenseInfo) {
        const result: LicenseValidationResult = {
          valid: false,
          error: 'Invalid license key'
        };

        await this.securityLogger.logSecurityEvent('license_validation_failed', {
          licenseKey: licenseKey.substring(0, 8) + '...',
          reason: 'License extraction failed'
        }, 'medium');

        return result;
      }

      // Check expiration
      const now = Date.now();
      if (licenseInfo.expiresAt < now) {
        const result: LicenseValidationResult = {
          valid: false,
          error: 'License expired',
          expired: true,
          licenseInfo
        };

        await this.securityLogger.logSecurityEvent('license_expired', {
          licenseKey: licenseKey.substring(0, 8) + '...',
          userId: licenseInfo.userId,
          expiredAt: licenseInfo.expiresAt
        }, 'medium');

        return result;
      }

      // Check device limit (in production, this would check against a device registry)
      const deviceCount = await this.getDeviceCount(licenseInfo.userId);
      if (deviceCount >= licenseInfo.maxDevices) {
        const result: LicenseValidationResult = {
          valid: false,
          error: 'Device limit exceeded',
          deviceLimitExceeded: true,
          licenseInfo
        };

        await this.securityLogger.logSecurityEvent('license_device_limit_exceeded', {
          licenseKey: licenseKey.substring(0, 8) + '...',
          userId: licenseInfo.userId,
          deviceCount,
          maxDevices: licenseInfo.maxDevices
        }, 'high');

        return result;
      }

      // License is valid
      const result: LicenseValidationResult = {
        valid: true,
        licenseInfo
      };

      // Cache the result
      this.validationCache.set(cacheKey, {
        ...result,
        timestamp: now
      } as any);

      await this.securityLogger.logSecurityEvent('license_validation_success', {
        licenseKey: licenseKey.substring(0, 8) + '...',
        userId: licenseInfo.userId,
        tier: licenseInfo.tier
      }, 'low');

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: LicenseValidationResult = {
        valid: false,
        error: `License validation failed: ${errorMessage}`
      };

      await this.securityLogger.logSecurityEvent('license_validation_error', {
        licenseKey: licenseKey.substring(0, 8) + '...',
        error: errorMessage
      }, 'high');

      return result;
    }
  }

  /**
   * Extract user information from license key
   */
  async extractLicenseInfo(licenseKey: string): Promise<LicenseInfo | null> {
    try {
      // In production, this would decode an encrypted license
      // For now, generate mock data based on license pattern
      
      const licenseHash = crypto.createHash('sha256').update(licenseKey).digest('hex');
      const userId = `user_${licenseHash.substring(0, 16)}`;
      
      // Determine tier based on license pattern
      const tier = this.determineTierFromLicense(licenseKey);
      const permissions = this.getPermissionsForTier(tier);
      const features = this.getFeaturesForTier(tier);
      
      const now = Date.now();
      const licenseInfo: LicenseInfo = {
        licenseKey,
        userId,
        email: `user${userId.substring(5, 10)}@example.com`,
        tier,
        permissions,
        issuedAt: now - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        expiresAt: now + (365 * 24 * 60 * 60 * 1000), // 1 year from now
        maxDevices: this.getMaxDevicesForTier(tier),
        features
      };

      // Cache the license info
      this.licenseCache.set(licenseKey, licenseInfo);

      return licenseInfo;

    } catch (error) {
      console.error('Failed to extract license info:', error);
      return null;
    }
  }

  /**
   * Get permission set for a tier
   */
  getPermissionSet(tier: UserTier): PermissionSet {
    const permissionSets: Record<UserTier, PermissionSet> = {
      free: {
        tier: 'free',
        permissions: ['basic_calculations'],
        features: ['basic_hvac_calculations', 'limited_projects'],
        limits: {
          maxProjects: 3,
          maxCalculations: 50,
          maxTeamMembers: 1,
          storageLimit: 1024, // 1GB in MB
          maxApiCalls: 100,
          maxStorageGB: 1
        }
      },
      pro: {
        tier: 'pro',
        permissions: ['basic_calculations', 'unlimited_projects', 'high_res_export', 'advanced_analytics'],
        features: ['advanced_hvac_calculations', 'unlimited_projects', 'high_res_export', 'basic_analytics'],
        limits: {
          maxProjects: -1, // unlimited
          maxCalculations: -1, // unlimited
          maxTeamMembers: 5,
          storageLimit: 51200, // 50GB in MB
          maxApiCalls: 10000,
          maxStorageGB: 50
        }
      },
      enterprise: {
        tier: 'enterprise',
        permissions: ['basic_calculations', 'unlimited_projects', 'high_res_export', 'advanced_analytics', 'team_collaboration', 'api_access'],
        features: ['all_hvac_calculations', 'unlimited_projects', 'high_res_export', 'advanced_analytics', 'team_collaboration', 'api_access', 'priority_support'],
        limits: {
          maxProjects: -1, // unlimited
          maxCalculations: -1, // unlimited
          maxTeamMembers: 50,
          storageLimit: 512000, // 500GB in MB
          maxApiCalls: 100000,
          maxStorageGB: 500
        }
      },
      super_admin: {
        tier: 'super_admin',
        permissions: ['basic_calculations', 'unlimited_projects', 'high_res_export', 'advanced_analytics', 'team_collaboration', 'api_access', 'admin:user_management', 'admin:system_settings', 'admin:audit_logs', 'admin:full_access', 'admin:super_admin_functions'],
        features: ['all_features', 'admin_panel', 'system_management', 'audit_logs', 'user_management'],
        limits: {
          maxProjects: -1, // unlimited
          maxCalculations: -1, // unlimited
          maxTeamMembers: -1, // unlimited
          storageLimit: -1, // unlimited
          maxApiCalls: -1, // unlimited
          maxStorageGB: -1 // unlimited
        }
      }
    };

    return permissionSets[tier];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(licenseInfo: LicenseInfo, permission: Permission): boolean {
    return licenseInfo.permissions.includes(permission);
  }

  /**
   * Check if user has access to feature
   */
  hasFeature(licenseInfo: LicenseInfo, feature: string): boolean {
    return licenseInfo.features.includes(feature);
  }

  /**
   * Register device for license
   */
  async registerDevice(licenseKey: string, deviceId: string): Promise<boolean> {
    try {
      const validation = await this.validateLicense(licenseKey);
      
      if (!validation.valid || !validation.licenseInfo) {
        return false;
      }

      // In production, store device registration in database
      const deviceKey = `devices_${validation.licenseInfo.userId}`;
      const devices = this.getStoredDevices(deviceKey);
      
      if (!devices.includes(deviceId)) {
        if (devices.length >= validation.licenseInfo.maxDevices) {
          return false; // Device limit exceeded
        }
        
        devices.push(deviceId);
        this.storeDevices(deviceKey, devices);
      }

      await this.securityLogger.logSecurityEvent('device_registered', {
        licenseKey: licenseKey.substring(0, 8) + '...',
        userId: validation.licenseInfo.userId,
        deviceId: deviceId.substring(0, 8) + '...',
        deviceCount: devices.length
      }, 'low');

      return true;

    } catch (error) {
      await this.securityLogger.logSecurityEvent('device_registration_error', {
        licenseKey: licenseKey.substring(0, 8) + '...',
        deviceId: deviceId.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'medium');

      return false;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private hashLicenseKey(licenseKey: string): string {
    return crypto.createHash('sha256').update(licenseKey).digest('hex');
  }

  private isCacheValid(cached: any): boolean {
    const now = Date.now();
    return cached.timestamp && (now - cached.timestamp) < this.cacheTimeout;
  }

  private determineTierFromLicense(licenseKey: string): UserTier {
    // In production, this would be encoded in the license
    // For demo, determine based on license pattern
    const parts = licenseKey.split('-');
    if (parts.length >= 2) {
      const firstPart = parts[1];
      if (firstPart.startsWith('ENT')) return 'enterprise';
      if (firstPart.startsWith('PRO')) return 'pro';
      if (firstPart.startsWith('ADM')) return 'super_admin';
    }
    return 'free';
  }

  private getPermissionsForTier(tier: UserTier): Permission[] {
    return this.getPermissionSet(tier).permissions;
  }

  private getFeaturesForTier(tier: UserTier): string[] {
    return this.getPermissionSet(tier).features;
  }

  private getMaxDevicesForTier(tier: UserTier): number {
    const limits = this.getPermissionSet(tier).limits;
    return limits.maxTeamMembers === -1 ? 10 : Math.min(limits.maxTeamMembers, 10);
  }

  private async getDeviceCount(userId: string): Promise<number> {
    try {
      const deviceKey = `devices_${userId}`;
      const devices = this.getStoredDevices(deviceKey);
      return devices.length;
    } catch (error) {
      return 0;
    }
  }

  private getStoredDevices(deviceKey: string): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(deviceKey);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  private storeDevices(deviceKey: string, devices: string[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(deviceKey, JSON.stringify(devices));
      }
    } catch (error) {
      console.error('Failed to store devices:', error);
    }
  }
}
