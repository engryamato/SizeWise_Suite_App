/**
 * Build Scripts Test Suite
 * 
 * CRITICAL: Validates cross-platform build scripts and configurations
 * Tests Windows, macOS, and Linux build processes and utilities
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.4
 */

import { BUILD_CONFIG, PLATFORM_CONFIGS, BuildUtils } from '../build-common';
import WindowsBuildManager from '../build-windows';
import MacOSBuildManager from '../build-macos';
import LinuxBuildManager from '../build-linux';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');

describe('Build Scripts', () => {
  let mockExecSync: jest.MockedFunction<typeof execSync>;
  let mockFs: jest.Mocked<typeof fs>;
  let mockPath: jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock execSync
    mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
    mockExecSync.mockReturnValue(Buffer.from('success'));

    // Mock fs
    mockFs = fs as jest.Mocked<typeof fs>;
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue('{}');
    mockFs.writeFileSync = jest.fn();
    mockFs.mkdirSync = jest.fn();
    mockFs.rmSync = jest.fn();
    mockFs.readdirSync = jest.fn().mockReturnValue([]);
    mockFs.statSync = jest.fn().mockReturnValue({
      size: 1024,
      birthtime: new Date(),
      mtime: new Date()
    } as any);

    // Mock path
    mockPath = path as jest.Mocked<typeof path>;
    mockPath.join = jest.fn((...args) => args.join('/'));
    mockPath.dirname = jest.fn((p) => p.split('/').slice(0, -1).join('/'));
    mockPath.basename = jest.fn((p) => p.split('/').pop() || '');
    mockPath.extname = jest.fn((p) => {
      const parts = p.split('.');
      return parts.length > 1 ? `.${parts.pop()}` : '';
    });
    mockPath.relative = jest.fn((from, to) => to);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('Build Configuration', () => {
    test('should have valid build configuration', () => {
      expect(BUILD_CONFIG.appName).toBe('SizeWise Suite');
      expect(BUILD_CONFIG.appId).toBe('com.sizewise.suite');
      expect(BUILD_CONFIG.version).toBe('1.0.0');
      expect(BUILD_CONFIG.electronVersion).toBe('28.0.0');
    });

    test('should have platform-specific configurations', () => {
      expect(PLATFORM_CONFIGS.win32).toBeDefined();
      expect(PLATFORM_CONFIGS.darwin).toBeDefined();
      expect(PLATFORM_CONFIGS.linux).toBeDefined();

      expect(PLATFORM_CONFIGS.win32.target).toBe('nsis');
      expect(PLATFORM_CONFIGS.darwin.target).toBe('dmg');
      expect(PLATFORM_CONFIGS.linux.target).toBeInstanceOf(Array);
    });

    test('should have correct file paths', () => {
      expect(BUILD_CONFIG.sourceDir).toContain('..');
      expect(BUILD_CONFIG.buildDir).toContain('dist');
      expect(BUILD_CONFIG.assetsDir).toContain('assets');
    });
  });

  describe('BuildUtils', () => {
    test('should log messages with timestamps', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      BuildUtils.log('Test message', 'info');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO  Test message/)
      );
    });

    test('should execute commands successfully', () => {
      const result = BuildUtils.exec('npm --version');
      
      expect(mockExecSync).toHaveBeenCalledWith('npm --version', {
        stdio: 'inherit',
        cwd: BUILD_CONFIG.sourceDir
      });
      expect(result).toBeDefined();
    });

    test('should handle command execution errors', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      expect(() => BuildUtils.exec('invalid-command')).toThrow('Command failed');
    });

    test('should check file existence', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const exists = BuildUtils.fileExists('/mock/path');
      
      expect(exists).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/mock/path');
    });

    test('should create directories', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      BuildUtils.ensureDir('/mock/new/dir');
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/new/dir', { recursive: true });
    });

    test('should copy files', () => {
      BuildUtils.copyFile('/src/file.txt', '/dest/file.txt');
      
      expect(mockFs.copyFileSync).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    test('should read and write JSON files', () => {
      const testData = { name: 'test', version: '1.0.0' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testData));
      
      const data = BuildUtils.readJson('/mock/file.json');
      expect(data).toEqual(testData);
      
      BuildUtils.writeJson('/mock/output.json', testData);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/mock/output.json',
        JSON.stringify(testData, null, 2),
        'utf8'
      );
    });

    test('should generate file hashes', () => {
      const hash = BuildUtils.generateHash('/mock/file.txt');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    test('should format file sizes', () => {
      expect(BuildUtils.formatFileSize(1024)).toBe('1.00 KB');
      expect(BuildUtils.formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(BuildUtils.formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    test('should validate build environment', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockExecSync.mockReturnValue(Buffer.from('8.0.0'));
      
      expect(() => BuildUtils.validateEnvironment()).not.toThrow();
    });

    test('should handle environment validation failures', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      expect(() => BuildUtils.validateEnvironment()).toThrow();
    });

    test('should clean build directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      BuildUtils.cleanBuild();
      
      expect(mockFs.rmSync).toHaveBeenCalledWith(BUILD_CONFIG.buildDir, {
        recursive: true,
        force: true
      });
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(BUILD_CONFIG.buildDir, { recursive: true });
    });

    test('should generate build info', () => {
      mockExecSync.mockReturnValueOnce(Buffer.from('abc123'));
      mockExecSync.mockReturnValueOnce(Buffer.from('main'));
      
      const buildInfo = BuildUtils.generateBuildInfo('win32', 'x64');
      
      expect(buildInfo.platform).toBe('win32');
      expect(buildInfo.arch).toBe('x64');
      expect(buildInfo.version).toBe(BUILD_CONFIG.version);
      expect(buildInfo.gitCommit).toBe('abc123');
      expect(buildInfo.gitBranch).toBe('main');
    });

    test('should create checksums', () => {
      const files = ['/mock/file1.exe', '/mock/file2.dmg'];
      mockFs.existsSync.mockReturnValue(true);
      
      const checksums = BuildUtils.createChecksums(files);
      
      expect(checksums).toBeDefined();
      expect(Object.keys(checksums)).toHaveLength(2);
    });

    test('should measure execution time', () => {
      const testFunction = jest.fn(() => 'result');
      
      const { result, duration } = BuildUtils.measureTime(testFunction, 'Test Function');
      
      expect(result).toBe('result');
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(testFunction).toHaveBeenCalled();
    });

    test('should format duration correctly', () => {
      expect(BuildUtils.formatDuration(1000)).toBe('1s');
      expect(BuildUtils.formatDuration(61000)).toBe('1m 1s');
      expect(BuildUtils.formatDuration(3661000)).toBe('1h 1m 1s');
    });
  });

  describe('Windows Build Manager', () => {
    let windowsBuildManager: WindowsBuildManager;

    beforeEach(() => {
      windowsBuildManager = new WindowsBuildManager();
    });

    test('should initialize with correct platform', () => {
      expect(windowsBuildManager['platform']).toBe('win32');
      expect(windowsBuildManager['arch']).toMatch(/^(x64|arm64)$/);
    });

    test('should validate Windows environment', () => {
      mockExecSync.mockReturnValue(Buffer.from('1.0.0'));
      
      expect(() => windowsBuildManager['validateWindowsEnvironment']()).not.toThrow();
    });

    test('should create electron-builder configuration', () => {
      windowsBuildManager['createElectronBuilderConfig']();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('electron-builder-windows.json'),
        expect.any(String),
        'utf8'
      );
    });

    test('should handle build process', async () => {
      // Mock all required methods
      jest.spyOn(windowsBuildManager as any, 'validateWindowsEnvironment').mockImplementation();
      jest.spyOn(windowsBuildManager as any, 'prepareBuild').mockResolvedValue(undefined);
      jest.spyOn(windowsBuildManager as any, 'buildApplication').mockResolvedValue(undefined);
      jest.spyOn(windowsBuildManager as any, 'createInstaller').mockResolvedValue('/mock/installer.exe');
      jest.spyOn(windowsBuildManager as any, 'signArtifacts').mockResolvedValue(undefined);
      jest.spyOn(windowsBuildManager as any, 'createDistribution').mockResolvedValue({});
      jest.spyOn(windowsBuildManager as any, 'finalizeBuild').mockResolvedValue(undefined);

      await expect(windowsBuildManager.build()).resolves.not.toThrow();
    });
  });

  describe('macOS Build Manager', () => {
    let macosBuildManager: MacOSBuildManager;

    beforeEach(() => {
      macosBuildManager = new MacOSBuildManager();
    });

    test('should initialize with correct platform', () => {
      expect(macosBuildManager['platform']).toBe('darwin');
      expect(macosBuildManager['arch']).toMatch(/^(x64|arm64)$/);
    });

    test('should validate macOS environment', () => {
      mockExecSync.mockReturnValue(Buffer.from('1.0.0'));
      
      expect(() => macosBuildManager['validateMacOSEnvironment']()).not.toThrow();
    });

    test('should create entitlements files', () => {
      macosBuildManager['createEntitlements']();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('entitlements.mas.plist'),
        expect.stringContaining('<?xml version="1.0"'),
        'utf8'
      );
    });

    test('should handle build process', async () => {
      // Mock all required methods
      jest.spyOn(macosBuildManager as any, 'validateMacOSEnvironment').mockImplementation();
      jest.spyOn(macosBuildManager as any, 'prepareBuild').mockResolvedValue(undefined);
      jest.spyOn(macosBuildManager as any, 'buildApplication').mockResolvedValue(undefined);
      jest.spyOn(macosBuildManager as any, 'createDMG').mockResolvedValue('/mock/app.dmg');
      jest.spyOn(macosBuildManager as any, 'signAndNotarize').mockResolvedValue(undefined);
      jest.spyOn(macosBuildManager as any, 'createDistribution').mockResolvedValue({});
      jest.spyOn(macosBuildManager as any, 'finalizeBuild').mockResolvedValue(undefined);

      await expect(macosBuildManager.build()).resolves.not.toThrow();
    });
  });

  describe('Linux Build Manager', () => {
    let linuxBuildManager: LinuxBuildManager;

    beforeEach(() => {
      linuxBuildManager = new LinuxBuildManager();
    });

    test('should initialize with correct platform', () => {
      expect(linuxBuildManager['platform']).toBe('linux');
      expect(linuxBuildManager['arch']).toMatch(/^(x64|arm64)$/);
    });

    test('should validate Linux environment', () => {
      mockExecSync.mockReturnValue(Buffer.from('1.0.0'));
      
      expect(() => linuxBuildManager['validateLinuxEnvironment']()).not.toThrow();
    });

    test('should create desktop entry', () => {
      linuxBuildManager['createDesktopEntry']();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('sizewise-suite.desktop'),
        expect.stringContaining('[Desktop Entry]')
      );
    });

    test('should get package type correctly', () => {
      expect(linuxBuildManager['getPackageType']('/path/app.AppImage')).toBe('appimage');
      expect(linuxBuildManager['getPackageType']('/path/app.deb')).toBe('deb');
      expect(linuxBuildManager['getPackageType']('/path/app.rpm')).toBe('rpm');
      expect(linuxBuildManager['getPackageType']('/path/app.unknown')).toBe('unknown');
    });

    test('should handle build process', async () => {
      // Mock all required methods
      jest.spyOn(linuxBuildManager as any, 'validateLinuxEnvironment').mockImplementation();
      jest.spyOn(linuxBuildManager as any, 'prepareBuild').mockResolvedValue(undefined);
      jest.spyOn(linuxBuildManager as any, 'buildApplication').mockResolvedValue(undefined);
      jest.spyOn(linuxBuildManager as any, 'createPackages').mockResolvedValue(['/mock/app.AppImage']);
      jest.spyOn(linuxBuildManager as any, 'createDistribution').mockResolvedValue({});
      jest.spyOn(linuxBuildManager as any, 'finalizeBuild').mockResolvedValue(undefined);

      await expect(linuxBuildManager.build()).resolves.not.toThrow();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should handle different platforms correctly', () => {
      const originalPlatform = process.platform;

      // Test Windows
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const windowsManager = new WindowsBuildManager();
      expect(windowsManager['platform']).toBe('win32');

      // Test macOS
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const macosManager = new MacOSBuildManager();
      expect(macosManager['platform']).toBe('darwin');

      // Test Linux
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const linuxManager = new LinuxBuildManager();
      expect(linuxManager['platform']).toBe('linux');

      // Restore original platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should handle different architectures', () => {
      const originalArch = process.arch;

      // Test x64
      Object.defineProperty(process, 'arch', { value: 'x64' });
      const manager1 = new WindowsBuildManager();
      expect(manager1['arch']).toBe('x64');

      // Test arm64
      Object.defineProperty(process, 'arch', { value: 'arm64' });
      const manager2 = new WindowsBuildManager();
      expect(manager2['arch']).toBe('arm64');

      // Restore original architecture
      Object.defineProperty(process, 'arch', { value: originalArch });
    });
  });

  describe('Error Handling', () => {
    test('should handle build failures gracefully', async () => {
      const windowsManager = new WindowsBuildManager();
      
      jest.spyOn(windowsManager as any, 'validateWindowsEnvironment').mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(windowsManager.build()).rejects.toThrow('Validation failed');
    });

    test('should handle missing dependencies', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      expect(() => BuildUtils.exec('missing-command')).toThrow('Command not found');
    });

    test('should handle file system errors', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => BuildUtils.readJson('/nonexistent.json')).toThrow('File not found');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete build operations efficiently', () => {
      const startTime = Date.now();
      
      // Simulate build operations
      BuildUtils.validateEnvironment();
      BuildUtils.generateBuildInfo('win32', 'x64');
      BuildUtils.createChecksums([]);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });

    test('should handle large file operations', () => {
      const largeFileList = Array.from({ length: 100 }, (_, i) => `/mock/file${i}.exe`);
      
      const startTime = Date.now();
      BuildUtils.createChecksums(largeFileList);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should handle large lists efficiently
    });
  });
});
