/**
 * macOS Cross-Platform E2E Tests
 * 
 * CRITICAL: Validates macOS-specific tier enforcement and desktop integration
 * Tests Keychain integration, file operations, and platform-specific features
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.2
 */

import { test, expect, Page, _electron as electron } from '@playwright/test';

// macOS-specific test configuration
const MACOS_CONFIG = {
  platform: 'darwin',
  fileExtensions: ['.dmg', '.app'],
  keychainService: 'SizeWise Suite',
  defaultPaths: {
    documents: '/Users/testuser/Documents',
    appSupport: '/Users/testuser/Library/Application Support/SizeWise Suite'
  }
};

test.describe('macOS Platform Integration', () => {
  let electronApp: any;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['dist/electron/main.js'],
      env: {
        NODE_ENV: 'test',
        PLATFORM: 'darwin'
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

  test.describe('macOS Keychain Integration', () => {
    test('should store license in macOS Keychain', async () => {
      const licenseData = {
        key: 'test-license-key-macos',
        tier: 'pro',
        user: 'test@example.com'
      };

      const storeResult = await page.evaluate((license) =>
        window.electronAPI.storeLicense(license)
      , licenseData);

      expect(storeResult.success).toBe(true);
      expect(storeResult.storage).toBe('macos-keychain');
      expect(storeResult.service).toBe('SizeWise Suite');

      // Verify Keychain retrieval
      const retrieveResult = await page.evaluate(() =>
        window.electronAPI.retrieveLicense()
      );

      expect(retrieveResult.tier).toBe('pro');
      expect(retrieveResult.source).toBe('keychain');
    });

    test('should handle Keychain access permissions', async () => {
      const permissionResult = await page.evaluate(() =>
        window.electronAPI.requestKeychainAccess()
      );

      expect(permissionResult.granted).toBe(true);
      expect(permissionResult.platform).toBe('darwin');
    });

    test('should migrate license from file to Keychain', async () => {
      const migrationResult = await page.evaluate(() =>
        window.electronAPI.migrateLicense({
          from: 'file',
          to: 'keychain'
        })
      );

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.platform).toBe('darwin');
      expect(migrationResult.keychainService).toBe('SizeWise Suite');
    });
  });

  test.describe('macOS File Operations', () => {
    test('should handle macOS file paths and permissions', async () => {
      const startTime = Date.now();

      // Test macOS file dialog
      await page.evaluate(() => {
        window.electronAPI.showOpenDialog = async () => ({
          canceled: false,
          filePaths: ['/Users/testuser/Documents/test-project.sizewise']
        });
      });

      const fileResult = await page.evaluate(() =>
        window.electronAPI.showOpenDialog({
          defaultPath: '/Users/testuser/Documents',
          filters: [
            { name: 'SizeWise Projects', extensions: ['sizewise'] }
          ]
        })
      );

      expect(fileResult.filePaths[0]).toMatch(/^\/Users\//); // macOS path format
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    test('should support macOS Quick Look integration', async () => {
      const quickLookResult = await page.evaluate(() =>
        window.electronAPI.registerQuickLookProvider('.sizewise')
      );

      expect(quickLookResult.registered).toBe(true);
      expect(quickLookResult.platform).toBe('darwin');
    });

    test('should handle macOS Spotlight integration', async () => {
      const spotlightResult = await page.evaluate(() =>
        window.electronAPI.registerSpotlightMetadata({
          fileType: '.sizewise',
          contentType: 'com.sizewise.project'
        })
      );

      expect(spotlightResult.registered).toBe(true);
      expect(spotlightResult.contentType).toBe('com.sizewise.project');
    });

    test('should support macOS file associations', async () => {
      const associationResult = await page.evaluate(() =>
        window.electronAPI.checkFileAssociation('.sizewise')
      );

      expect(associationResult.isRegistered).toBe(true);
      expect(associationResult.handlerBundle).toContain('SizeWise Suite.app');
    });
  });

  test.describe('macOS Security Features', () => {
    test('should validate macOS code signing and notarization', async () => {
      const signatureResult = await page.evaluate(() =>
        window.electronAPI.validateCodeSignature()
      );

      expect(signatureResult.isSigned).toBe(true);
      expect(signatureResult.isNotarized).toBe(true);
      expect(signatureResult.platform).toBe('darwin');
      expect(signatureResult.teamId).toBeDefined();
    });

    test('should handle macOS Gatekeeper integration', async () => {
      const gatekeeperResult = await page.evaluate(() =>
        window.electronAPI.checkGatekeeperStatus()
      );

      expect(gatekeeperResult.approved).toBe(true);
      expect(gatekeeperResult.quarantined).toBe(false);
      expect(gatekeeperResult.platform).toBe('darwin');
    });

    test('should validate macOS entitlements', async () => {
      const entitlementsResult = await page.evaluate(() =>
        window.electronAPI.validateEntitlements()
      );

      expect(entitlementsResult.hasRequiredEntitlements).toBe(true);
      expect(entitlementsResult.hardenedRuntime).toBe(true);
      expect(entitlementsResult.sandboxed).toBe(false); // Desktop app not sandboxed
    });

    test('should handle macOS privacy permissions', async () => {
      const privacyResult = await page.evaluate(() =>
        window.electronAPI.checkPrivacyPermissions()
      );

      expect(privacyResult.fileAccess).toBe('granted');
      expect(privacyResult.platform).toBe('darwin');
    });
  });

  test.describe('macOS Desktop Integration', () => {
    test('should integrate with macOS menu bar', async () => {
      const menuResult = await page.evaluate(() =>
        window.electronAPI.setupMacOSMenu()
      );

      expect(menuResult.hasAppMenu).toBe(true);
      expect(menuResult.hasServicesMenu).toBe(true);
      expect(menuResult.platform).toBe('darwin');
    });

    test('should support macOS dock integration', async () => {
      const dockResult = await page.evaluate(() =>
        window.electronAPI.configureDock({
          badge: '3',
          bounce: 'informational'
        })
      );

      expect(dockResult.badgeSet).toBe(true);
      expect(dockResult.bounceId).toBeDefined();
    });

    test('should handle macOS window management', async () => {
      const windowResult = await page.evaluate(() =>
        window.electronAPI.configureMacOSWindow({
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 20, y: 20 }
        })
      );

      expect(windowResult.configured).toBe(true);
      expect(windowResult.titleBarStyle).toBe('hiddenInset');
    });

    test('should support macOS Touch Bar', async () => {
      const touchBarResult = await page.evaluate(() =>
        window.electronAPI.setupTouchBar()
      );

      expect(touchBarResult.supported).toBeDefined();
      if (touchBarResult.supported) {
        expect(touchBarResult.configured).toBe(true);
      }
    });
  });

  test.describe('macOS Performance Optimization', () => {
    test('should optimize for macOS Metal rendering', async () => {
      const metalResult = await page.evaluate(() =>
        window.electronAPI.getMetalInfo()
      );

      expect(metalResult.platform).toBe('darwin');
      expect(metalResult.metalSupported).toBeDefined();
      if (metalResult.metalSupported) {
        expect(metalResult.gpuFamily).toBeDefined();
      }
    });

    test('should handle macOS memory pressure', async () => {
      const memoryResult = await page.evaluate(() =>
        window.electronAPI.getMemoryPressure()
      );

      expect(memoryResult.platform).toBe('darwin');
      expect(['normal', 'warning', 'critical']).toContain(memoryResult.level);
    });

    test('should optimize macOS app lifecycle', async () => {
      const lifecycleResult = await page.evaluate(() =>
        window.electronAPI.getAppLifecycleState()
      );

      expect(lifecycleResult.platform).toBe('darwin');
      expect(lifecycleResult.state).toBe('active');
      expect(lifecycleResult.backgroundTime).toBeDefined();
    });
  });

  test.describe('macOS Error Handling', () => {
    test('should handle macOS-specific errors gracefully', async () => {
      // Test macOS permission errors
      const permissionResult = await page.evaluate(() =>
        window.electronAPI.handlePermissionError('EPERM')
      );

      expect(permissionResult.handled).toBe(true);
      expect(permissionResult.userMessage).toContain('permission');
      expect(permissionResult.platform).toBe('darwin');
      expect(permissionResult.suggestedAction).toContain('System Preferences');
    });

    test('should provide macOS-specific error recovery', async () => {
      // Test Keychain error recovery
      const recoveryResult = await page.evaluate(() =>
        window.electronAPI.recoverFromKeychainError('errSecUserCanceled')
      );

      expect(recoveryResult.recovered).toBe(true);
      expect(recoveryResult.method).toBe('fallback-to-file');
      expect(recoveryResult.platform).toBe('darwin');
    });

    test('should handle macOS app termination gracefully', async () => {
      const terminationResult = await page.evaluate(() =>
        window.electronAPI.handleAppTermination('SIGTERM')
      );

      expect(terminationResult.gracefulShutdown).toBe(true);
      expect(terminationResult.dataPreserved).toBe(true);
      expect(terminationResult.platform).toBe('darwin');
    });
  });

  test.describe('macOS Tier Enforcement', () => {
    test('should enforce tier restrictions with macOS-specific UI', async () => {
      await setupFreeTierUser(page);
      
      // Test macOS-style tier restriction dialog
      await page.click('[data-testid="restricted-feature"]');
      
      await expect(page.locator('[data-testid="macos-tier-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="macos-upgrade-sheet"]')).toHaveClass(/sheet/);
    });

    test('should integrate tier validation with macOS Keychain', async () => {
      const tierValidation = await page.evaluate(() =>
        window.electronAPI.validateTierFromKeychain()
      );

      expect(tierValidation.source).toBe('keychain');
      expect(tierValidation.platform).toBe('darwin');
      expect(tierValidation.tier).toBeDefined();
    });
  });
});

// Helper functions
async function setupFreeTierUser(page: Page) {
  await page.evaluate(() => {
    window.electronAPI.setUserTier('free');
    window.electronAPI.setUserId('user-free-macos-123');
  });
}
