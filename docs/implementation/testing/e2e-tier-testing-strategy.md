# E2E Tier Testing Strategy

**Source Document:** `docs/developer-guide/Tier and Feature Separation.md` section 5 ("Testing & Maintenance")  
**Purpose:** Comprehensive testing strategy covering all tier enforcement scenarios and security requirements

---

## 1. Testing Strategy Overview

### 1.1 Testing Principles

- **Tier × Feature Matrix Coverage**: Test every tier and feature combination
- **Cross-Platform Validation**: Identical behavior across Windows, macOS, and Linux
- **Security-First Testing**: Validate all security measures before functional testing
- **Performance Requirements**: Feature flags <50ms, security overhead validation

### 1.2 Testing Pyramid

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Tests (30%)                          │
│  Cross-platform, tier enforcement, security validation     │
├─────────────────────────────────────────────────────────────┤
│                Integration Tests (40%)                      │
│  Service layer, repository pattern, feature flag system    │
├─────────────────────────────────────────────────────────────┤
│                   Unit Tests (30%)                          │
│  Pure functions, calculations, validation logic             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tier × Feature Test Matrix

### 2.1 Free Tier Enforcement Tests

```typescript
// tests/e2e/tier-features/free-tier.spec.ts
describe('Free Tier Enforcement', () => {
  beforeEach(async () => {
    await setupFreeTierLicense();
    await launchApplication();
  });

  describe('Project Limits', () => {
    it('should allow creating up to 3 projects', async () => {
      // Create 3 projects successfully
      for (let i = 1; i <= 3; i++) {
        await createProject(`Project ${i}`);
        await expect(page.locator('[data-testid="project-list"]')).toContainText(`Project ${i}`);
      }
      
      // Verify project count
      const projectCount = await page.locator('[data-testid="project-count"]').textContent();
      expect(projectCount).toBe('3 of 3 projects');
    });

    it('should block 4th project creation with upgrade prompt', async () => {
      // Create 3 projects first
      await createMaxProjects(3);
      
      // Attempt to create 4th project
      await page.click('[data-testid="create-project-btn"]');
      
      // Should show upgrade prompt instead of project form
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toContainText('Upgrade to Pro for unlimited projects');
      
      // Verify project creation is blocked
      await expect(page.locator('[data-testid="project-form"]')).not.toBeVisible();
    });

    it('should show project limit warning at 2 projects', async () => {
      await createMaxProjects(2);
      
      await expect(page.locator('[data-testid="project-limit-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-limit-warning"]')).toContainText('1 project remaining');
    });
  });

  describe('Segment Limits', () => {
    it('should allow up to 25 segments per project', async () => {
      await createProject('Test Project');
      await openProject('Test Project');
      
      // Add 25 segments
      for (let i = 1; i <= 25; i++) {
        await addSegment(`Segment ${i}`);
      }
      
      // Verify all segments created
      const segmentCount = await page.locator('[data-testid="segment-count"]').textContent();
      expect(segmentCount).toBe('25 of 25 segments');
    });

    it('should block 26th segment with upgrade prompt', async () => {
      await createProject('Test Project');
      await openProject('Test Project');
      await addMaxSegments(25);
      
      // Attempt to add 26th segment
      await page.click('[data-testid="add-segment-btn"]');
      
      // Should show upgrade prompt
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toContainText('Upgrade to Pro for unlimited segments');
    });
  });

  describe('Export Restrictions', () => {
    it('should apply watermark to PDF exports', async () => {
      await createProjectWithSegments('Test Project', 5);
      await openProject('Test Project');
      
      // Export as PDF
      await page.click('[data-testid="export-btn"]');
      await page.selectOption('[data-testid="export-format"]', 'pdf');
      await page.click('[data-testid="export-confirm"]');
      
      // Wait for export completion
      await page.waitForSelector('[data-testid="export-complete"]');
      
      // Verify watermark is applied
      const exportInfo = await page.locator('[data-testid="export-info"]').textContent();
      expect(exportInfo).toContain('Watermark applied');
    });

    it('should block high-resolution export option', async () => {
      await createProjectWithSegments('Test Project', 5);
      await openProject('Test Project');
      
      await page.click('[data-testid="export-btn"]');
      
      // High-res option should be disabled with upgrade prompt
      await expect(page.locator('[data-testid="high-res-option"]')).toBeDisabled();
      await expect(page.locator('[data-testid="high-res-upgrade-hint"]')).toContainText('Pro feature');
    });
  });
});
```

### 2.2 Pro Tier Feature Tests

```typescript
// tests/e2e/tier-features/pro-tier.spec.ts
describe('Pro Tier Features', () => {
  beforeEach(async () => {
    await setupProTierLicense();
    await launchApplication();
  });

  describe('Unlimited Projects', () => {
    it('should allow creating more than 3 projects', async () => {
      // Create 5 projects (exceeds free tier limit)
      for (let i = 1; i <= 5; i++) {
        await createProject(`Project ${i}`);
      }
      
      // Verify all projects created
      const projectCount = await page.locator('[data-testid="project-count"]').textContent();
      expect(projectCount).toBe('5 projects');
      
      // No upgrade prompts should appear
      await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();
    });
  });

  describe('Unlimited Segments', () => {
    it('should allow creating more than 25 segments', async () => {
      await createProject('Large Project');
      await openProject('Large Project');
      
      // Add 30 segments (exceeds free tier limit)
      for (let i = 1; i <= 30; i++) {
        await addSegment(`Segment ${i}`);
      }
      
      const segmentCount = await page.locator('[data-testid="segment-count"]').textContent();
      expect(segmentCount).toBe('30 segments');
    });
  });

  describe('High-Resolution Exports', () => {
    it('should enable high-resolution PDF exports without watermark', async () => {
      await createProjectWithSegments('Test Project', 10);
      await openProject('Test Project');
      
      await page.click('[data-testid="export-btn"]');
      await page.selectOption('[data-testid="export-format"]', 'pdf');
      
      // High-res option should be available
      await expect(page.locator('[data-testid="high-res-option"]')).toBeEnabled();
      await page.check('[data-testid="high-res-option"]');
      
      await page.click('[data-testid="export-confirm"]');
      await page.waitForSelector('[data-testid="export-complete"]');
      
      // Verify no watermark applied
      const exportInfo = await page.locator('[data-testid="export-info"]').textContent();
      expect(exportInfo).not.toContain('Watermark applied');
      expect(exportInfo).toContain('High resolution');
    });
  });

  describe('Cloud Sync Features', () => {
    it('should enable cloud backup option', async () => {
      await page.click('[data-testid="settings-btn"]');
      
      // Cloud backup should be available
      await expect(page.locator('[data-testid="cloud-backup-option"]')).toBeEnabled();
      await expect(page.locator('[data-testid="cloud-backup-option"]')).not.toHaveClass(/disabled/);
    });
  });
});
```

### 2.3 Enterprise Tier Feature Tests

```typescript
// tests/e2e/tier-features/enterprise-tier.spec.ts
describe('Enterprise Tier Features', () => {
  beforeEach(async () => {
    await setupEnterpriseTierLicense();
    await launchApplication();
  });

  describe('Custom Templates', () => {
    it('should enable custom report templates', async () => {
      await createProjectWithSegments('Enterprise Project', 15);
      await openProject('Enterprise Project');
      
      await page.click('[data-testid="export-btn"]');
      await page.selectOption('[data-testid="export-format"]', 'pdf');
      
      // Custom template option should be available
      await expect(page.locator('[data-testid="custom-template-option"]')).toBeEnabled();
      
      await page.click('[data-testid="custom-template-option"]');
      await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();
    });
  });

  describe('BIM Export', () => {
    it('should enable BIM export formats', async () => {
      await createProjectWithSegments('BIM Project', 20);
      await openProject('BIM Project');
      
      await page.click('[data-testid="export-btn"]');
      
      // BIM formats should be available
      const formatOptions = await page.locator('[data-testid="export-format"] option').allTextContents();
      expect(formatOptions).toContain('IFC');
      expect(formatOptions).toContain('Revit');
    });
  });

  describe('Advanced Analytics', () => {
    it('should show advanced project analytics', async () => {
      await createProjectWithSegments('Analytics Project', 25);
      await openProject('Analytics Project');
      
      await page.click('[data-testid="analytics-tab"]');
      
      // Advanced analytics should be visible
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="compliance-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="cost-analysis"]')).toBeVisible();
    });
  });
});
```

---

## 3. Security Testing Requirements

### 3.1 License Validation Tests

```typescript
// tests/e2e/security/license-validation.spec.ts
describe('License Validation Security', () => {
  describe('License Tampering Detection', () => {
    it('should detect and reject tampered license signatures', async () => {
      // Create valid license file
      await createValidLicense('pro');
      
      // Tamper with license signature
      await tamperLicenseSignature();
      
      // Launch application
      const result = await launchApplication();
      
      // Should reject tampered license
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid license signature');
      
      // Security event should be logged
      const securityLogs = await readSecurityLogs();
      expect(securityLogs).toContainEqual(
        expect.objectContaining({
          type: 'license_validation_failed',
          severity: 'HIGH'
        })
      );
    });

    it('should reject expired licenses', async () => {
      await createExpiredLicense('pro');
      
      const result = await launchApplication();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('License expired');
    });

    it('should enforce hardware binding', async () => {
      // Create license bound to different hardware
      await createHardwareBoundLicense('different-machine-id');
      
      const result = await launchApplication();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('License not valid for this device');
    });
  });

  describe('License Storage Security', () => {
    it('should store license securely in OS keystore', async () => {
      await createValidLicense('pro');
      await launchApplication();
      
      // Verify license is stored in OS keystore, not plain text
      const keystoreEntries = await getKeystoreEntries();
      expect(keystoreEntries).toContain('sizewise-license');
      
      // Verify license file is encrypted
      const licenseData = await getKeystoreValue('sizewise-license');
      expect(licenseData).not.toContain('pro'); // Should be encrypted
    });
  });
});
```

### 3.2 Feature Flag Security Tests

```typescript
// tests/e2e/security/feature-flag-security.spec.ts
describe('Feature Flag Security', () => {
  describe('Tampering Detection', () => {
    it('should detect feature flag database tampering', async () => {
      await setupFreeTierLicense();
      await launchApplication();
      
      // Tamper with feature flags in database
      await modifyFeatureFlagInDatabase('unlimited_projects', true);
      
      // Attempt to create 4th project
      await createMaxProjects(3);
      const result = await attemptCreateProject('4th Project');
      
      // Should still be blocked despite database tampering
      expect(result.success).toBe(false);
      expect(result.error).toContain('Project limit reached');
      
      // Security event should be logged
      const securityLogs = await readSecurityLogs();
      expect(securityLogs).toContainEqual(
        expect.objectContaining({
          type: 'feature_flag_tampering',
          severity: 'CRITICAL'
        })
      );
    });

    it('should validate feature flag HMAC integrity', async () => {
      await setupProTierLicense();
      await launchApplication();
      
      // Corrupt feature flag HMAC
      await corruptFeatureFlagHMAC('high_res_export');
      
      // Attempt high-res export
      await createProjectWithSegments('Test', 5);
      const result = await attemptHighResExport();
      
      // Should be blocked due to HMAC validation failure
      expect(result.success).toBe(false);
      expect(result.error).toContain('Feature validation failed');
    });
  });
});
```

### 3.3 Database Encryption Tests

```typescript
// tests/e2e/security/database-encryption.spec.ts
describe('Database Encryption Security', () => {
  it('should encrypt database files at rest', async () => {
    await setupValidLicense('pro');
    await launchApplication();
    
    // Create some data
    await createProjectWithSegments('Encrypted Project', 10);
    await closeApplication();
    
    // Verify database file is encrypted
    const dbPath = await getDatabasePath();
    const rawContent = await fs.readFile(dbPath);
    
    // Should not contain readable project data
    expect(rawContent.toString()).not.toContain('Encrypted Project');
    
    // Should not be readable by standard SQLite tools
    const sqliteResult = await attemptStandardSQLiteRead(dbPath);
    expect(sqliteResult.success).toBe(false);
  });

  it('should detect database corruption', async () => {
    await setupValidLicense('pro');
    await launchApplication();
    await createProjectWithSegments('Test Project', 5);
    await closeApplication();
    
    // Corrupt database file
    await corruptDatabaseFile();
    
    // Launch application
    const result = await launchApplication();
    
    // Should detect corruption and handle gracefully
    expect(result.success).toBe(false);
    expect(result.error).toContain('Database integrity check failed');
  });
});
```

---

## 4. Cross-Platform Testing

### 4.1 Platform-Specific Test Configuration

```typescript
// tests/config/platform-config.ts
export const platformConfigs = {
  windows: {
    keystorePath: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    dbPath: '%APPDATA%\\SizeWise\\projects.db',
    licenseStorage: 'windows-credential-manager'
  },
  macos: {
    keystorePath: '~/Library/Keychains/login.keychain',
    dbPath: '~/Library/Application Support/SizeWise/projects.db',
    licenseStorage: 'macos-keychain'
  },
  linux: {
    keystorePath: '~/.local/share/keyrings/default',
    dbPath: '~/.local/share/SizeWise/projects.db',
    licenseStorage: 'linux-secret-service'
  }
};

// tests/e2e/cross-platform/platform-compatibility.spec.ts
describe('Cross-Platform Compatibility', () => {
  const currentPlatform = process.platform;
  const config = platformConfigs[currentPlatform];

  it('should store license in platform-appropriate keystore', async () => {
    await setupValidLicense('pro');
    await launchApplication();
    
    // Verify license stored in correct platform keystore
    const licenseExists = await checkPlatformKeystore(config.licenseStorage);
    expect(licenseExists).toBe(true);
  });

  it('should create database in platform-appropriate location', async () => {
    await setupValidLicense('pro');
    await launchApplication();
    await createProject('Platform Test');
    
    // Verify database created in correct location
    const dbExists = await fs.pathExists(config.dbPath);
    expect(dbExists).toBe(true);
  });

  it('should maintain identical tier enforcement across platforms', async () => {
    await setupFreeTierLicense();
    await launchApplication();
    
    // Test project limits (should be identical on all platforms)
    await createMaxProjects(3);
    const result = await attemptCreateProject('4th Project');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Project limit reached');
  });
});
```

### 4.2 Platform-Specific Security Tests

```typescript
// tests/e2e/cross-platform/platform-security.spec.ts
describe('Platform-Specific Security', () => {
  describe('Windows Security', () => {
    it('should use Windows Credential Manager securely', async () => {
      if (process.platform !== 'win32') return;
      
      await setupValidLicense('enterprise');
      await launchApplication();
      
      // Verify credential stored securely
      const credential = await getWindowsCredential('sizewise-license');
      expect(credential.encrypted).toBe(true);
      expect(credential.userScope).toBe(true);
    });
  });

  describe('macOS Security', () => {
    it('should use macOS Keychain securely', async () => {
      if (process.platform !== 'darwin') return;
      
      await setupValidLicense('enterprise');
      await launchApplication();
      
      // Verify keychain item created securely
      const keychainItem = await getMacOSKeychainItem('sizewise-license');
      expect(keychainItem.accessControl).toBe('kSecAttrAccessibleWhenUnlockedThisDeviceOnly');
    });
  });

  describe('Linux Security', () => {
    it('should use Secret Service securely', async () => {
      if (process.platform !== 'linux') return;
      
      await setupValidLicense('enterprise');
      await launchApplication();
      
      // Verify secret stored securely
      const secret = await getLinuxSecret('sizewise-license');
      expect(secret.encrypted).toBe(true);
      expect(secret.sessionOnly).toBe(false);
    });
  });
});
```

---

## 5. Performance Testing

### 5.1 Feature Flag Performance Tests

```typescript
// tests/performance/feature-flag-performance.spec.ts
describe('Feature Flag Performance', () => {
  it('should evaluate feature flags in under 50ms', async () => {
    await setupProTierLicense();
    await launchApplication();
    
    const startTime = performance.now();
    
    // Test multiple feature flag evaluations
    const results = await Promise.all([
      checkFeatureFlag('unlimited_projects'),
      checkFeatureFlag('high_res_export'),
      checkFeatureFlag('cloud_sync'),
      checkFeatureFlag('custom_templates'),
      checkFeatureFlag('bim_export')
    ]);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should complete all checks in under 50ms
    expect(totalTime).toBeLessThan(50);
    
    // All Pro tier features should be enabled
    expect(results.every(r => r === true)).toBe(true);
  });

  it('should cache feature flag results efficiently', async () => {
    await setupProTierLicense();
    await launchApplication();
    
    // First evaluation (cache miss)
    const firstEvalTime = await measureFeatureFlagEvaluation('unlimited_projects');
    
    // Second evaluation (cache hit)
    const secondEvalTime = await measureFeatureFlagEvaluation('unlimited_projects');
    
    // Cache hit should be significantly faster
    expect(secondEvalTime).toBeLessThan(firstEvalTime * 0.1);
    expect(secondEvalTime).toBeLessThan(5); // Under 5ms for cache hits
  });
});
```

### 5.2 Security Overhead Tests

```typescript
// tests/performance/security-overhead.spec.ts
describe('Security Performance Overhead', () => {
  it('should maintain acceptable database performance with encryption', async () => {
    await setupValidLicense('pro');
    await launchApplication();
    
    // Measure encrypted database operations
    const encryptedTimes = await measureDatabaseOperations(1000);
    
    // Setup unencrypted database for comparison
    await setupUnencryptedDatabase();
    const unencryptedTimes = await measureDatabaseOperations(1000);
    
    // Encryption overhead should be under 20%
    const overhead = (encryptedTimes.average - unencryptedTimes.average) / unencryptedTimes.average;
    expect(overhead).toBeLessThan(0.20);
  });

  it('should validate licenses quickly on startup', async () => {
    await setupValidLicense('enterprise');
    
    const startTime = performance.now();
    await launchApplication();
    const endTime = performance.now();
    
    const startupTime = endTime - startTime;
    
    // License validation should add less than 500ms to startup
    expect(startupTime).toBeLessThan(3000); // Total startup under 3 seconds
    
    // Verify license validation completed
    const licenseStatus = await getLicenseValidationStatus();
    expect(licenseStatus.valid).toBe(true);
  });
});
```

---

## 6. Test Automation & CI/CD

### 6.1 Automated Test Execution

```yaml
# .github/workflows/tier-testing.yml
name: Tier Feature Testing

on: [push, pull_request]

jobs:
  tier-testing:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
        tier: [free, pro, enterprise]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test license
        run: npm run setup-test-license -- --tier=${{ matrix.tier }}
        
      - name: Run tier-specific tests
        run: npm run test:e2e:tier -- --tier=${{ matrix.tier }}
        
      - name: Run security tests
        run: npm run test:e2e:security
        
      - name: Run performance tests
        run: npm run test:performance
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.os }}-${{ matrix.tier }}
          path: test-results/
```

### 6.2 Test Reporting

```typescript
// tests/utils/test-reporter.ts
export class TierTestReporter {
  generateReport(results: TestResults[]): TierTestReport {
    return {
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
      },
      tierCoverage: this.calculateTierCoverage(results),
      securityValidation: this.validateSecurityTests(results),
      performanceMetrics: this.extractPerformanceMetrics(results),
      crossPlatformCompatibility: this.validateCrossPlatform(results)
    };
  }

  private calculateTierCoverage(results: TestResults[]): TierCoverage {
    const tierTests = results.filter(r => r.category === 'tier-enforcement');
    
    return {
      free: this.calculateCoverageForTier(tierTests, 'free'),
      pro: this.calculateCoverageForTier(tierTests, 'pro'),
      enterprise: this.calculateCoverageForTier(tierTests, 'enterprise')
    };
  }
}
```

---

## 7. Test Maintenance Strategy

### 7.1 Regular Test Updates

```typescript
// tests/maintenance/test-maintenance.ts
export class TestMaintenanceManager {
  async validateTestCoverage(): Promise<CoverageReport> {
    // Ensure all tier boundaries are tested
    const tierBoundaries = await this.loadTierBoundaries();
    const testCoverage = await this.analyzeTestCoverage();
    
    const missingTests = tierBoundaries.filter(
      boundary => !testCoverage.includes(boundary.feature)
    );
    
    if (missingTests.length > 0) {
      throw new Error(`Missing tests for features: ${missingTests.map(t => t.feature).join(', ')}`);
    }
    
    return testCoverage;
  }

  async cleanupObsoleteTests(): Promise<void> {
    // Remove tests for deprecated features
    const currentFeatures = await this.loadCurrentFeatures();
    const testFiles = await this.findTestFiles();
    
    for (const testFile of testFiles) {
      const testedFeatures = await this.extractTestedFeatures(testFile);
      const obsoleteFeatures = testedFeatures.filter(
        feature => !currentFeatures.includes(feature)
      );
      
      if (obsoleteFeatures.length > 0) {
        await this.removeObsoleteTests(testFile, obsoleteFeatures);
      }
    }
  }
}
```

---

**Status**: ✅ **COMPLETE** - Comprehensive testing strategy covering all tier enforcement scenarios  
**Next Step**: Complete remaining Phase 0 documentation tasks (0.8, 0.9, 0.10)
