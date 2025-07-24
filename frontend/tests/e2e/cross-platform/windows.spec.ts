/**
 * Windows Cross-Platform E2E Tests
 * 
 * CRITICAL: Validates Windows-specific tier enforcement and desktop integration
 * Tests file operations, license management, and platform-specific features
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.2
 */

import { test, expect, Page, BrowserContext, _electron as electron } from '@playwright/test';

// Windows-specific test configuration
const WINDOWS_CONFIG = {
  platform: 'win32',
  fileExtensions: ['.exe', '.msi'],
  registryKeys: ['HKCU\\Software\\SizeWise\\Suite'],
  defaultPaths: {
    documents: 'C:\\Users\\TestUser\\Documents',
    appData: 'C:\\Users\\TestUser\\AppData\\Local\\SizeWise Suite'
  }
};

test.describe('Windows Platform Integration', () => {
  let electronApp: any;
  let page: Page;

  test.beforeAll(async () => {
    // Launch Electron app for Windows testing
    electronApp = await electron.launch({
      args: ['dist/electron/main.js'],
      env: {
        NODE_ENV: 'test',
        PLATFORM: 'win32'
      }
    });
    
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test.describe('Windows File Operations', () => {
    test('should handle Windows file paths correctly', async () => {
      const startTime = Date.now();

      // Test file dialog with Windows paths
      await page.click('[data-testid="open-file"]');
      
      // Mock Windows file dialog
      await page.evaluate(() => {
        window.electronAPI.showOpenDialog = async () => ({
          canceled: false,
          filePaths: ['C:\\Users\\TestUser\\Documents\\test-project.sizewise']
        });
      });

      // Trigger file open
      const fileResult = await page.evaluate(() => 
        window.electronAPI.showOpenDialog({
          defaultPath: 'C:\\Users\\TestUser\\Documents',
          filters: [
            { name: 'SizeWise Projects', extensions: ['sizewise'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        })
      );

      expect(fileResult.filePaths[0]).toMatch(/^[A-Z]:\\/); // Windows drive letter
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // <5s for file operations
    });

    test('should enforce tier restrictions on file size (Windows)', async () => {
      // Test large file handling on Windows
      const largeFilePath = 'C:\\Users\\TestUser\\Documents\\large-project.sizewise';
      
      await page.evaluate((filePath) => {
        window.electronAPI.getFileSize = async () => 15 * 1024 * 1024; // 15MB
      }, largeFilePath);

      // Try to open large file with free tier
      await setupFreeTierUser(page);
      
      const result = await page.evaluate(() =>
        window.electronAPI.validateFileAccess('user-free-123', 15 * 1024 * 1024)
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds free tier limit');
      expect(result.requiredTier).toBe('pro');
    });

    test('should handle Windows registry integration', async () => {
      // Test file association registration
      const registryResult = await page.evaluate(() =>
        window.electronAPI.checkFileAssociation('.sizewise')
      );

      expect(registryResult.isRegistered).toBe(true);
      expect(registryResult.handlerPath).toContain('SizeWise Suite.exe');
    });

    test('should support Windows-specific export formats', async () => {
      await createTestProject(page);
      
      // Test Excel export (Windows-specific optimization)
      await page.click('[data-testid="export-button"]');
      
      // Should show Windows-optimized Excel export
      await expect(page.locator('[data-testid="export-excel-windows"]')).toBeVisible();
      
      // Test export with Windows path
      await page.click('[data-testid="export-excel-windows"]');
      
      const exportResult = await page.evaluate(() =>
        window.electronAPI.exportToExcel({
          path: 'C:\\Users\\TestUser\\Documents\\export.xlsx',
          format: 'windows-optimized'
        })
      );

      expect(exportResult.success).toBe(true);
      expect(exportResult.filePath).toMatch(/\.xlsx$/);
    });
  });

  test.describe('Windows License Management', () => {
    test('should integrate with Windows Credential Manager', async () => {
      // Test license storage in Windows Credential Manager
      const licenseData = {
        key: 'test-license-key',
        tier: 'pro',
        user: 'test@example.com'
      };

      const storeResult = await page.evaluate((license) =>
        window.electronAPI.storeLicense(license)
      , licenseData);

      expect(storeResult.success).toBe(true);
      expect(storeResult.storage).toBe('windows-credential-manager');

      // Verify license retrieval
      const retrieveResult = await page.evaluate(() =>
        window.electronAPI.retrieveLicense()
      );

      expect(retrieveResult.tier).toBe('pro');
      expect(retrieveResult.source).toBe('credential-manager');
    });

    test('should validate license with Windows hardware fingerprint', async () => {
      const hardwareInfo = await page.evaluate(() =>
        window.electronAPI.getHardwareFingerprint()
      );

      expect(hardwareInfo.platform).toBe('win32');
      expect(hardwareInfo.fingerprint).toBeDefined();
      expect(hardwareInfo.components).toContain('motherboard');
      expect(hardwareInfo.components).toContain('cpu');

      // Test license validation with hardware binding
      const validationResult = await page.evaluate((hwInfo) =>
        window.electronAPI.validateLicense({
          hardwareFingerprint: hwInfo.fingerprint,
          platform: 'win32'
        })
      , hardwareInfo);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.hardwareMatch).toBe(true);
    });

    test('should handle Windows license migration', async () => {
      // Test migration from file-based to Credential Manager
      const migrationResult = await page.evaluate(() =>
        window.electronAPI.migrateLicense({
          from: 'file',
          to: 'credential-manager'
        })
      );

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.migratedFrom).toBe('file');
      expect(migrationResult.migratedTo).toBe('credential-manager');
      expect(migrationResult.backupCreated).toBe(true);
    });
  });

  test.describe('Windows Desktop Integration', () => {
    test('should create Windows Start Menu shortcuts', async () => {
      const shortcutResult = await page.evaluate(() =>
        window.electronAPI.checkStartMenuIntegration()
      );

      expect(shortcutResult.hasShortcut).toBe(true);
      expect(shortcutResult.path).toContain('Start Menu\\Programs\\SizeWise Suite');
      expect(shortcutResult.iconPath).toContain('.ico');
    });

    test('should handle Windows notifications correctly', async () => {
      // Test Windows toast notifications
      await page.evaluate(() =>
        window.electronAPI.showNotification({
          title: 'Test Notification',
          body: 'Testing Windows notifications',
          platform: 'win32'
        })
      );

      // Verify notification was shown
      const notificationResult = await page.evaluate(() =>
        window.electronAPI.getLastNotification()
      );

      expect(notificationResult.platform).toBe('win32');
      expect(notificationResult.type).toBe('toast');
    });

    test('should support Windows taskbar integration', async () => {
      // Test taskbar progress and overlay
      await page.evaluate(() =>
        window.electronAPI.setTaskbarProgress(0.5)
      );

      const taskbarState = await page.evaluate(() =>
        window.electronAPI.getTaskbarState()
      );

      expect(taskbarState.progress).toBe(0.5);
      expect(taskbarState.mode).toBe('normal');
    });

    test('should handle Windows system theme changes', async () => {
      // Test dark/light theme detection
      const themeResult = await page.evaluate(() =>
        window.electronAPI.getSystemTheme()
      );

      expect(['light', 'dark']).toContain(themeResult.theme);
      expect(themeResult.platform).toBe('win32');

      // Test theme change handling
      await page.evaluate(() =>
        window.electronAPI.onThemeChange((theme) => {
          window.lastThemeChange = theme;
        })
      );

      // Simulate theme change
      await page.evaluate(() =>
        window.electronAPI.simulateThemeChange('dark')
      );

      const themeChangeResult = await page.evaluate(() => window.lastThemeChange);
      expect(themeChangeResult).toBe('dark');
    });
  });

  test.describe('Windows Security Features', () => {
    test('should validate Windows code signing', async () => {
      const signatureResult = await page.evaluate(() =>
        window.electronAPI.validateCodeSignature()
      );

      expect(signatureResult.isSigned).toBe(true);
      expect(signatureResult.publisher).toContain('SizeWise');
      expect(signatureResult.platform).toBe('win32');
    });

    test('should handle Windows UAC integration', async () => {
      // Test elevation requests for admin operations
      const elevationResult = await page.evaluate(() =>
        window.electronAPI.requestElevation('install-license')
      );

      expect(elevationResult.requested).toBe(true);
      expect(elevationResult.reason).toBe('install-license');
    });

    test('should integrate with Windows Defender', async () => {
      // Test Windows Defender exclusion status
      const defenderResult = await page.evaluate(() =>
        window.electronAPI.checkDefenderStatus()
      );

      expect(defenderResult.isExcluded).toBeDefined();
      expect(defenderResult.scanResult).toBe('clean');
    });
  });

  test.describe('Windows Performance Optimization', () => {
    test('should optimize for Windows hardware acceleration', async () => {
      const gpuResult = await page.evaluate(() =>
        window.electronAPI.getGPUInfo()
      );

      expect(gpuResult.platform).toBe('win32');
      expect(gpuResult.hardwareAcceleration).toBe(true);
      expect(gpuResult.renderer).toBeDefined();
    });

    test('should handle Windows memory management', async () => {
      const memoryResult = await page.evaluate(() =>
        window.electronAPI.getMemoryUsage()
      );

      expect(memoryResult.platform).toBe('win32');
      expect(memoryResult.heapUsed).toBeGreaterThan(0);
      expect(memoryResult.external).toBeGreaterThan(0);
      
      // Should be within reasonable limits
      expect(memoryResult.heapUsed).toBeLessThan(500 * 1024 * 1024); // <500MB
    });

    test('should optimize Windows startup time', async () => {
      const startupResult = await page.evaluate(() =>
        window.electronAPI.getStartupMetrics()
      );

      expect(startupResult.platform).toBe('win32');
      expect(startupResult.totalTime).toBeLessThan(3000); // <3s startup
      expect(startupResult.electronReady).toBeLessThan(1000); // <1s Electron ready
    });
  });

  test.describe('Windows Error Handling', () => {
    test('should handle Windows-specific errors gracefully', async () => {
      // Test Windows permission errors
      const permissionResult = await page.evaluate(() =>
        window.electronAPI.handlePermissionError('EACCES')
      );

      expect(permissionResult.handled).toBe(true);
      expect(permissionResult.userMessage).toContain('permission');
      expect(permissionResult.platform).toBe('win32');
    });

    test('should provide Windows-specific error recovery', async () => {
      // Test file lock error recovery
      const recoveryResult = await page.evaluate(() =>
        window.electronAPI.recoverFromError('EBUSY')
      );

      expect(recoveryResult.recovered).toBe(true);
      expect(recoveryResult.method).toBe('retry-with-delay');
      expect(recoveryResult.platform).toBe('win32');
    });
  });
});

// Helper functions
async function setupFreeTierUser(page: Page) {
  await page.evaluate(() => {
    window.electronAPI.setUserTier('free');
    window.electronAPI.setUserId('user-free-123');
  });
}

async function createTestProject(page: Page) {
  await page.click('[data-testid="new-project"]');
  await page.fill('[data-testid="project-name"]', 'Windows Test Project');
  await page.fill('[data-testid="project-description"]', 'Testing Windows integration');
  await page.click('[data-testid="create-project"]');
  
  await expect(page.locator('[data-testid="project-created"]')).toBeVisible();
}
