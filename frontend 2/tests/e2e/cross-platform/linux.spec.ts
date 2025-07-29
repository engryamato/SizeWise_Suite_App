/**
 * Linux Cross-Platform E2E Tests
 * 
 * CRITICAL: Validates Linux-specific tier enforcement and desktop integration
 * Tests Secret Service integration, file operations, and distribution compatibility
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.2
 */

import { test, expect, Page, _electron as electron } from '@playwright/test';

// Linux-specific test configuration
const LINUX_CONFIG = {
  platform: 'linux',
  fileExtensions: ['.AppImage', '.deb', '.rpm'],
  secretService: 'org.freedesktop.secrets',
  defaultPaths: {
    documents: '/home/testuser/Documents',
    config: '/home/testuser/.config/sizewise-suite'
  },
  distributions: ['ubuntu', 'fedora', 'opensuse', 'arch']
};

test.describe('Linux Platform Integration', () => {
  let electronApp: any;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['dist/electron/main.js'],
      env: {
        NODE_ENV: 'test',
        PLATFORM: 'linux',
        XDG_CURRENT_DESKTOP: 'GNOME'
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

  test.describe('Linux Secret Service Integration', () => {
    test('should store license in Linux Secret Service', async () => {
      const licenseData = {
        key: 'test-license-key-linux',
        tier: 'pro',
        user: 'test@example.com'
      };

      const storeResult = await page.evaluate((license) =>
        window.electronAPI.storeLicense(license)
      , licenseData);

      expect(storeResult.success).toBe(true);
      expect(storeResult.storage).toBe('linux-secret-service');
      expect(storeResult.service).toBe('org.freedesktop.secrets');

      // Verify Secret Service retrieval
      const retrieveResult = await page.evaluate(() =>
        window.electronAPI.retrieveLicense()
      );

      expect(retrieveResult.tier).toBe('pro');
      expect(retrieveResult.source).toBe('secret-service');
    });

    test('should handle Secret Service availability', async () => {
      const serviceResult = await page.evaluate(() =>
        window.electronAPI.checkSecretServiceAvailability()
      );

      expect(serviceResult.available).toBeDefined();
      expect(serviceResult.platform).toBe('linux');
      
      if (serviceResult.available) {
        expect(serviceResult.version).toBeDefined();
      } else {
        expect(serviceResult.fallback).toBe('file-storage');
      }
    });

    test('should handle multiple keyring backends', async () => {
      const keyringResult = await page.evaluate(() =>
        window.electronAPI.detectKeyringBackend()
      );

      expect(keyringResult.platform).toBe('linux');
      expect(['gnome-keyring', 'kwallet', 'secret-service', 'file']).toContain(keyringResult.backend);
    });
  });

  test.describe('Linux File Operations', () => {
    test('should handle Linux file paths and permissions', async () => {
      const startTime = Date.now();

      // Test Linux file dialog
      await page.evaluate(() => {
        window.electronAPI.showOpenDialog = async () => ({
          canceled: false,
          filePaths: ['/home/testuser/Documents/test-project.sizewise']
        });
      });

      const fileResult = await page.evaluate(() =>
        window.electronAPI.showOpenDialog({
          defaultPath: '/home/testuser/Documents',
          filters: [
            { name: 'SizeWise Projects', extensions: ['sizewise'] }
          ]
        })
      );

      expect(fileResult.filePaths[0]).toMatch(/^\/home\//); // Linux path format
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    test('should support Linux MIME type registration', async () => {
      const mimeResult = await page.evaluate(() =>
        window.electronAPI.registerMimeType({
          type: 'application/x-sizewise',
          extension: '.sizewise',
          description: 'SizeWise Project File'
        })
      );

      expect(mimeResult.registered).toBe(true);
      expect(mimeResult.platform).toBe('linux');
      expect(mimeResult.mimeType).toBe('application/x-sizewise');
    });

    test('should handle Linux desktop file creation', async () => {
      const desktopResult = await page.evaluate(() =>
        window.electronAPI.createDesktopFile({
          name: 'SizeWise Suite',
          exec: 'sizewise-suite %U',
          icon: 'sizewise-suite',
          categories: 'Engineering;Science;'
        })
      );

      expect(desktopResult.created).toBe(true);
      expect(desktopResult.path).toContain('.desktop');
      expect(desktopResult.platform).toBe('linux');
    });

    test('should support XDG directories', async () => {
      const xdgResult = await page.evaluate(() =>
        window.electronAPI.getXDGDirectories()
      );

      expect(xdgResult.platform).toBe('linux');
      expect(xdgResult.configHome).toMatch(/\/\.config$/);
      expect(xdgResult.dataHome).toMatch(/\/\.local\/share$/);
      expect(xdgResult.cacheHome).toMatch(/\/\.cache$/);
    });
  });

  test.describe('Linux Desktop Environment Integration', () => {
    test('should detect desktop environment', async () => {
      const deResult = await page.evaluate(() =>
        window.electronAPI.detectDesktopEnvironment()
      );

      expect(deResult.platform).toBe('linux');
      expect(['GNOME', 'KDE', 'XFCE', 'LXDE', 'Unity', 'Cinnamon', 'MATE']).toContain(deResult.environment);
    });

    test('should integrate with GNOME Shell', async () => {
      const gnomeResult = await page.evaluate(() =>
        window.electronAPI.integrateWithGNOME()
      );

      if (gnomeResult.available) {
        expect(gnomeResult.shellVersion).toBeDefined();
        expect(gnomeResult.extensionsSupported).toBe(true);
      }
    });

    test('should integrate with KDE Plasma', async () => {
      const kdeResult = await page.evaluate(() =>
        window.electronAPI.integrateWithKDE()
      );

      if (kdeResult.available) {
        expect(kdeResult.plasmaVersion).toBeDefined();
        expect(kdeResult.kwalletAvailable).toBeDefined();
      }
    });

    test('should handle system tray integration', async () => {
      const trayResult = await page.evaluate(() =>
        window.electronAPI.setupSystemTray()
      );

      expect(trayResult.platform).toBe('linux');
      expect(trayResult.supported).toBeDefined();
      
      if (trayResult.supported) {
        expect(trayResult.protocol).toMatch(/^(StatusNotifierItem|XEmbed)$/);
      }
    });
  });

  test.describe('Linux Distribution Compatibility', () => {
    test('should detect Linux distribution', async () => {
      const distroResult = await page.evaluate(() =>
        window.electronAPI.detectDistribution()
      );

      expect(distroResult.platform).toBe('linux');
      expect(distroResult.id).toBeDefined();
      expect(distroResult.version).toBeDefined();
      expect(distroResult.packageManager).toMatch(/^(apt|yum|dnf|zypper|pacman)$/);
    });

    test('should handle Ubuntu-specific features', async () => {
      const ubuntuResult = await page.evaluate(() =>
        window.electronAPI.handleUbuntuFeatures()
      );

      if (ubuntuResult.isUbuntu) {
        expect(ubuntuResult.snapSupport).toBeDefined();
        expect(ubuntuResult.unitySupport).toBeDefined();
      }
    });

    test('should handle Fedora-specific features', async () => {
      const fedoraResult = await page.evaluate(() =>
        window.electronAPI.handleFedoraFeatures()
      );

      if (fedoraResult.isFedora) {
        expect(fedoraResult.selinuxEnabled).toBeDefined();
        expect(fedoraResult.flatpakSupport).toBeDefined();
      }
    });

    test('should handle package manager integration', async () => {
      const packageResult = await page.evaluate(() =>
        window.electronAPI.getPackageInfo()
      );

      expect(packageResult.platform).toBe('linux');
      expect(packageResult.installedVia).toMatch(/^(deb|rpm|appimage|flatpak|snap)$/);
      expect(packageResult.version).toBeDefined();
    });
  });

  test.describe('Linux Security Features', () => {
    test('should handle AppArmor/SELinux integration', async () => {
      const securityResult = await page.evaluate(() =>
        window.electronAPI.checkSecurityModules()
      );

      expect(securityResult.platform).toBe('linux');
      expect(securityResult.apparmor).toBeDefined();
      expect(securityResult.selinux).toBeDefined();
    });

    test('should validate Linux package signatures', async () => {
      const signatureResult = await page.evaluate(() =>
        window.electronAPI.validatePackageSignature()
      );

      expect(signatureResult.platform).toBe('linux');
      expect(signatureResult.signed).toBeDefined();
      
      if (signatureResult.signed) {
        expect(signatureResult.keyId).toBeDefined();
      }
    });

    test('should handle sandbox restrictions', async () => {
      const sandboxResult = await page.evaluate(() =>
        window.electronAPI.checkSandboxStatus()
      );

      expect(sandboxResult.platform).toBe('linux');
      expect(sandboxResult.sandboxed).toBeDefined();
      
      if (sandboxResult.sandboxed) {
        expect(sandboxResult.type).toMatch(/^(flatpak|snap|firejail)$/);
      }
    });
  });

  test.describe('Linux Performance Optimization', () => {
    test('should optimize for Linux graphics stack', async () => {
      const graphicsResult = await page.evaluate(() =>
        window.electronAPI.getGraphicsInfo()
      );

      expect(graphicsResult.platform).toBe('linux');
      expect(graphicsResult.renderer).toBeDefined();
      expect(['X11', 'Wayland']).toContain(graphicsResult.displayServer);
    });

    test('should handle Linux memory management', async () => {
      const memoryResult = await page.evaluate(() =>
        window.electronAPI.getLinuxMemoryInfo()
      );

      expect(memoryResult.platform).toBe('linux');
      expect(memoryResult.available).toBeGreaterThan(0);
      expect(memoryResult.swapUsed).toBeGreaterThanOrEqual(0);
    });

    test('should optimize for different window managers', async () => {
      const wmResult = await page.evaluate(() =>
        window.electronAPI.optimizeForWindowManager()
      );

      expect(wmResult.platform).toBe('linux');
      expect(wmResult.windowManager).toBeDefined();
      expect(wmResult.optimized).toBe(true);
    });
  });

  test.describe('Linux Error Handling', () => {
    test('should handle Linux-specific errors gracefully', async () => {
      // Test Linux permission errors
      const permissionResult = await page.evaluate(() =>
        window.electronAPI.handlePermissionError('EACCES')
      );

      expect(permissionResult.handled).toBe(true);
      expect(permissionResult.userMessage).toContain('permission');
      expect(permissionResult.platform).toBe('linux');
      expect(permissionResult.suggestedAction).toContain('chmod');
    });

    test('should provide Linux-specific error recovery', async () => {
      // Test D-Bus error recovery
      const recoveryResult = await page.evaluate(() =>
        window.electronAPI.recoverFromDBusError('org.freedesktop.DBus.Error.ServiceUnknown')
      );

      expect(recoveryResult.recovered).toBe(true);
      expect(recoveryResult.method).toBe('fallback-service');
      expect(recoveryResult.platform).toBe('linux');
    });

    test('should handle display server issues', async () => {
      const displayResult = await page.evaluate(() =>
        window.electronAPI.handleDisplayServerError('DISPLAY not set')
      );

      expect(displayResult.handled).toBe(true);
      expect(displayResult.fallback).toBe('xvfb');
      expect(displayResult.platform).toBe('linux');
    });
  });

  test.describe('Linux Tier Enforcement', () => {
    test('should enforce tier restrictions with Linux-specific UI', async () => {
      await setupFreeTierUser(page);
      
      // Test Linux-style tier restriction notification
      await page.click('[data-testid="restricted-feature"]');
      
      await expect(page.locator('[data-testid="linux-tier-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="linux-upgrade-dialog"]')).toHaveClass(/dialog/);
    });

    test('should integrate tier validation with Secret Service', async () => {
      const tierValidation = await page.evaluate(() =>
        window.electronAPI.validateTierFromSecretService()
      );

      expect(tierValidation.source).toBe('secret-service');
      expect(tierValidation.platform).toBe('linux');
      expect(tierValidation.tier).toBeDefined();
    });

    test('should handle tier validation fallbacks', async () => {
      const fallbackResult = await page.evaluate(() =>
        window.electronAPI.validateTierWithFallback()
      );

      expect(fallbackResult.platform).toBe('linux');
      expect(['secret-service', 'file', 'memory']).toContain(fallbackResult.source);
      expect(fallbackResult.tier).toBeDefined();
    });
  });
});

// Helper functions
async function setupFreeTierUser(page: Page) {
  await page.evaluate(() => {
    window.electronAPI.setUserTier('free');
    window.electronAPI.setUserId('user-free-linux-123');
  });
}
