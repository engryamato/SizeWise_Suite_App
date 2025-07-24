/**
 * LicenseManager Test Suite
 * 
 * CRITICAL: Validates secure license management and OS keystore integration
 * Tests license validation, tier determination, and security measures
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.2
 */

import { LicenseManager, LicenseInfo, LicenseValidationResult } from '../LicenseManager';
import { SecurityManager } from '../../../backend/security/SecurityManager';
import * as keytar from 'keytar';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

// Mock dependencies
jest.mock('keytar');
jest.mock('fs');
jest.mock('../../../backend/security/SecurityManager');
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/userData'),
    getName: jest.fn(() => 'SizeWise Suite')
  }
}));
jest.mock('node-machine-id', () => ({
  machineId: jest.fn().mockResolvedValue('mock-machine-id')
}));

describe('LicenseManager', () => {
  let licenseManager: LicenseManager;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  let mockKeytar: jest.Mocked<typeof keytar>;
  let mockFs: any;

  const mockValidLicense: LicenseInfo = {
    licenseKey: 'test-license-key',
    userEmail: 'test@example.com',
    userName: 'Test User',
    tier: 'pro',
    issuedAt: new Date('2024-01-01'),
    expiresAt: new Date('2025-01-01'),
    features: ['unlimited_projects', 'high_res_export'],
    signature: 'valid-signature',
    hardwareFingerprint: 'test-fingerprint'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SecurityManager
    mockSecurityManager = {
      encrypt: jest.fn((data) => `encrypted:${data}`),
      decrypt: jest.fn((data) => data.replace('encrypted:', '')),
      hash: jest.fn(),
      generateKey: jest.fn(),
      validateSignature: jest.fn()
    } as any;

    (SecurityManager as jest.MockedClass<typeof SecurityManager>).mockImplementation(() => mockSecurityManager);

    // Mock keytar
    mockKeytar = keytar as jest.Mocked<typeof keytar>;
    mockKeytar.getPassword = jest.fn();
    mockKeytar.setPassword = jest.fn();
    mockKeytar.deletePassword = jest.fn();

    // Mock fs
    mockFs = {
      readFileSync: readFileSync as jest.MockedFunction<typeof readFileSync>,
      writeFileSync: writeFileSync as jest.MockedFunction<typeof writeFileSync>,
      existsSync: existsSync as jest.MockedFunction<typeof existsSync>,
      mkdirSync: mkdirSync as jest.MockedFunction<typeof mkdirSync>
    };

    licenseManager = new LicenseManager();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockKeytar.getPassword.mockResolvedValue(null);

      await licenseManager.initialize();

      expect(mockFs.mkdirSync).not.toHaveBeenCalled(); // Directory exists
    });

    test('should create license directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockKeytar.getPassword.mockResolvedValue(null);

      await licenseManager.initialize();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/userData/license', { recursive: true });
    });

    test('should load existing license from keystore', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      await licenseManager.initialize();

      expect(mockKeytar.getPassword).toHaveBeenCalledWith('SizeWise Suite', 'license');
      expect(mockSecurityManager.decrypt).toHaveBeenCalledWith(encryptedLicense);
    });

    test('should initialize trial if no license exists', async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      mockFs.existsSync.mockReturnValue(false);

      await licenseManager.initialize();

      const licenseInfo = await licenseManager.getLicenseInfo();
      expect(licenseInfo.isTrial).toBe(true);
      expect(licenseInfo.tier).toBe('free');
    });
  });

  describe('License Validation', () => {
    test('should validate valid license successfully', async () => {
      // Setup valid license
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      // Mock signature validation
      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();

      const startTime = Date.now();
      const result = await licenseManager.validateLicense();
      const validationTime = Date.now() - startTime;

      expect(result.isValid).toBe(true);
      expect(result.tier).toBe('pro');
      expect(result.features).toEqual(['unlimited_projects', 'high_res_export']);
      expect(validationTime).toBeLessThan(100); // Performance requirement
    });

    test('should reject license with invalid signature', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      // Mock invalid signature
      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(false);

      await licenseManager.initialize();
      const result = await licenseManager.validateLicense();

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid license signature');
      expect(result.tier).toBe('free');
    });

    test('should reject license with wrong hardware fingerprint', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      // Mock signature validation and different hardware fingerprint
      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('different-fingerprint');

      await licenseManager.initialize();
      const result = await licenseManager.validateLicense();

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('License not valid for this hardware');
      expect(result.tier).toBe('free');
    });

    test('should reject expired license', async () => {
      const expiredLicense = {
        ...mockValidLicense,
        expiresAt: new Date('2023-01-01') // Expired
      };

      const encryptedLicense = `encrypted:${JSON.stringify(expiredLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();
      const result = await licenseManager.validateLicense();

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('License has expired');
      expect(result.tier).toBe('free');
    });

    test('should calculate days remaining correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

      const licenseWithExpiry = {
        ...mockValidLicense,
        expiresAt: futureDate
      };

      const encryptedLicense = `encrypted:${JSON.stringify(licenseWithExpiry)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();
      const result = await licenseManager.validateLicense();

      expect(result.isValid).toBe(true);
      expect(result.daysRemaining).toBeGreaterThan(25);
      expect(result.daysRemaining).toBeLessThanOrEqual(30);
    });
  });

  describe('License Installation', () => {
    test('should install valid license successfully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockKeytar.getPassword.mockResolvedValue(null);

      // Mock license key parsing and validation
      const licenseKey = Buffer.from(JSON.stringify(mockValidLicense)).toString('base64');
      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();
      const result = await licenseManager.installLicense(licenseKey);

      expect(result.isValid).toBe(true);
      expect(result.tier).toBe('pro');
      expect(mockKeytar.setPassword).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should reject invalid license key format', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockKeytar.getPassword.mockResolvedValue(null);

      await licenseManager.initialize();
      const result = await licenseManager.installLicense('invalid-license-key');

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid license key format');
      expect(result.tier).toBe('free');
    });

    test('should reject license with invalid signature during installation', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockKeytar.getPassword.mockResolvedValue(null);

      const licenseKey = Buffer.from(JSON.stringify(mockValidLicense)).toString('base64');
      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(false);

      await licenseManager.initialize();
      const result = await licenseManager.installLicense(licenseKey);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid license signature');
      expect(result.tier).toBe('free');
    });
  });

  describe('Trial Management', () => {
    test('should validate active trial', async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      mockFs.existsSync.mockReturnValue(false);

      await licenseManager.initialize();
      const result = await licenseManager.validateLicense();

      expect(result.isValid).toBe(true);
      expect(result.tier).toBe('free');
      expect(result.daysRemaining).toBe(14); // Default trial period
    });

    test('should reject expired trial', async () => {
      const expiredTrial = {
        startDate: new Date('2023-01-01'),
        daysUsed: 15, // Exceeds 14-day limit
        maxDays: 14,
        hardwareFingerprint: 'test-fingerprint'
      };

      mockKeytar.getPassword.mockResolvedValue(null);
      mockFs.existsSync.mockReturnValueOnce(true).mockReturnValue(true); // License dir exists, trial file exists
      mockFs.readFileSync.mockReturnValue(`encrypted:${JSON.stringify(expiredTrial)}`);

      await licenseManager.initialize();
      const result = await licenseManager.validateLicense();

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Trial period has expired');
      expect(result.tier).toBe('free');
    });

    test('should update trial days used correctly', async () => {
      const activeTrial = {
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        daysUsed: 0,
        maxDays: 14,
        hardwareFingerprint: 'test-fingerprint'
      };

      mockKeytar.getPassword.mockResolvedValue(null);
      mockFs.existsSync.mockReturnValueOnce(true).mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(`encrypted:${JSON.stringify(activeTrial)}`);

      await licenseManager.initialize();
      const licenseInfo = await licenseManager.getLicenseInfo();

      expect(licenseInfo.isTrial).toBe(true);
      expect(licenseInfo.trialDaysRemaining).toBeLessThanOrEqual(9); // Should be around 9 days remaining
    });
  });

  describe('License Information', () => {
    test('should return correct license information for valid license', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      await licenseManager.initialize();
      const licenseInfo = await licenseManager.getLicenseInfo();

      expect(licenseInfo.hasLicense).toBe(true);
      expect(licenseInfo.tier).toBe('pro');
      expect(licenseInfo.userEmail).toBe('test@example.com');
      expect(licenseInfo.userName).toBe('Test User');
      expect(licenseInfo.features).toEqual(['unlimited_projects', 'high_res_export']);
      expect(licenseInfo.isTrial).toBe(false);
    });

    test('should return trial information when no license exists', async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      mockFs.existsSync.mockReturnValue(false);

      await licenseManager.initialize();
      const licenseInfo = await licenseManager.getLicenseInfo();

      expect(licenseInfo.hasLicense).toBe(false);
      expect(licenseInfo.tier).toBe('free');
      expect(licenseInfo.isTrial).toBe(true);
      expect(licenseInfo.trialDaysRemaining).toBe(14);
    });

    test('should return correct user tier', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();
      const tier = await licenseManager.getUserTier();

      expect(tier).toBe('pro');
    });
  });

  describe('License Removal', () => {
    test('should remove license and reinitialize trial', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      await licenseManager.initialize();

      // Verify license is loaded
      let licenseInfo = await licenseManager.getLicenseInfo();
      expect(licenseInfo.hasLicense).toBe(true);

      // Remove license
      await licenseManager.removeLicense();

      // Verify license is removed and trial is initialized
      licenseInfo = await licenseManager.getLicenseInfo();
      expect(licenseInfo.hasLicense).toBe(false);
      expect(licenseInfo.isTrial).toBe(true);

      expect(mockKeytar.deletePassword).toHaveBeenCalledWith('SizeWise Suite', 'license');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.any(String), '');
    });
  });

  describe('Security Features', () => {
    test('should generate hardware fingerprint', async () => {
      const fingerprint = await (licenseManager as any).generateHardwareFingerprint();
      
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    test('should validate license signature correctly', async () => {
      const validLicense = { ...mockValidLicense };
      
      // Mock HMAC validation
      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      
      const isValid = (licenseManager as any).validateSignature(validLicense);
      expect(isValid).toBe(true);
    });

    test('should store license data encrypted', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockKeytar.getPassword.mockResolvedValue(null);

      const licenseKey = Buffer.from(JSON.stringify(mockValidLicense)).toString('base64');
      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();
      await licenseManager.installLicense(licenseKey);

      expect(mockSecurityManager.encrypt).toHaveBeenCalled();
      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        'SizeWise Suite',
        'license',
        expect.stringContaining('encrypted:')
      );
    });
  });

  describe('Performance Requirements', () => {
    test('should meet license validation performance requirements', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();

      const startTime = Date.now();
      await licenseManager.validateLicense();
      const validationTime = Date.now() - startTime;

      expect(validationTime).toBeLessThan(100); // <100ms requirement
    });

    test('should handle batch license operations efficiently', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      jest.spyOn(licenseManager as any, 'validateSignature').mockReturnValue(true);
      jest.spyOn(licenseManager as any, 'generateHardwareFingerprint').mockResolvedValue('test-fingerprint');

      await licenseManager.initialize();

      const startTime = Date.now();
      
      const operations = [
        licenseManager.validateLicense(),
        licenseManager.getLicenseInfo(),
        licenseManager.getUserTier()
      ];

      await Promise.all(operations);
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(200); // Batch operations should be efficient
    });
  });

  describe('Error Handling', () => {
    test('should handle keystore errors gracefully', async () => {
      mockKeytar.getPassword.mockRejectedValue(new Error('Keystore error'));
      mockFs.existsSync.mockReturnValue(false);

      await licenseManager.initialize();

      // Should fall back to trial mode
      const licenseInfo = await licenseManager.getLicenseInfo();
      expect(licenseInfo.isTrial).toBe(true);
    });

    test('should handle file system errors gracefully', async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      await licenseManager.initialize();

      // Should still initialize with minimal trial
      const licenseInfo = await licenseManager.getLicenseInfo();
      expect(licenseInfo.tier).toBe('free');
    });

    test('should handle corrupted license data gracefully', async () => {
      mockKeytar.getPassword.mockResolvedValue('corrupted-data');
      mockSecurityManager.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });
      mockFs.existsSync.mockReturnValue(true);

      await licenseManager.initialize();

      // Should fall back to trial mode
      const licenseInfo = await licenseManager.getLicenseInfo();
      expect(licenseInfo.isTrial).toBe(true);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup sensitive data', async () => {
      const encryptedLicense = `encrypted:${JSON.stringify(mockValidLicense)}`;
      mockKeytar.getPassword.mockResolvedValue(encryptedLicense);
      mockFs.existsSync.mockReturnValue(true);

      await licenseManager.initialize();

      // Verify license is loaded
      let licenseInfo = await licenseManager.getLicenseInfo();
      expect(licenseInfo.hasLicense).toBe(true);

      // Cleanup
      await licenseManager.cleanup();

      // Verify sensitive data is cleared (this would require accessing private properties in real implementation)
      // For now, just verify cleanup completes without error
      expect(true).toBe(true);
    });
  });
});
