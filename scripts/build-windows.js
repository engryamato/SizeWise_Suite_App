#!/usr/bin/env node

/**
 * Windows Build Script - Cross-platform deployment for Windows
 * 
 * MISSION-CRITICAL: Windows-specific build configuration and deployment
 * Generates Windows installers (.exe, .msi) with proper signing and distribution
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.4
 */

const { BUILD_CONFIG, PLATFORM_CONFIGS, BuildUtils } = require('./build-common');
const path = require('path');
const fs = require('fs');

/**
 * Windows-specific configuration
 */
const WINDOWS_CONFIG = {
  ...PLATFORM_CONFIGS.win32,
  
  // Code signing configuration
  codeSigningCertificate: process.env.WINDOWS_CERT_PATH,
  codeSigningPassword: process.env.WINDOWS_CERT_PASSWORD,
  timestampServer: 'http://timestamp.digicert.com',
  
  // Windows-specific features
  autoUpdater: {
    enabled: true,
    provider: 'github',
    updaterCacheDirName: BUILD_CONFIG.appName
  },
  
  // NSIS installer configuration
  nsis: {
    ...PLATFORM_CONFIGS.win32.nsis,
    installerIcon: 'assets/installer-icon.ico',
    uninstallerIcon: 'assets/uninstaller-icon.ico',
    installerHeaderIcon: 'assets/installer-header.ico',
    installerSidebar: 'assets/installer-sidebar.bmp',
    uninstallerSidebar: 'assets/uninstaller-sidebar.bmp',
    license: 'LICENSE.txt',
    language: '1033', // English
    multiLanguageInstaller: false,
    packElevateHelper: true,
    perMachine: false,
    allowElevation: true,
    runAfterFinish: true,
    menuCategory: 'Engineering',
    
    // Custom NSIS script
    include: 'build/installer.nsh',
    
    // Registry entries
    registryKeys: [
      {
        key: 'HKCU\\Software\\SizeWise\\Suite',
        name: 'InstallLocation',
        value: '$INSTDIR'
      },
      {
        key: 'HKCU\\Software\\SizeWise\\Suite',
        name: 'Version',
        value: BUILD_CONFIG.version
      }
    ],
    
    // File associations
    fileAssociations: [
      {
        ext: 'sizewise',
        name: 'SizeWise Project',
        description: 'SizeWise Suite Project File',
        icon: '$INSTDIR\\resources\\app.asar.unpacked\\assets\\file-icon.ico',
        role: 'Editor'
      }
    ]
  },
  
  // MSI installer configuration (alternative)
  msi: {
    enabled: false, // Enable if MSI is preferred
    upgradeCode: '{12345678-1234-1234-1234-123456789012}',
    productCode: '{87654321-4321-4321-4321-210987654321}',
    manufacturer: BUILD_CONFIG.author,
    language: 1033,
    codepage: 1252
  }
};

/**
 * Windows Build Manager
 */
class WindowsBuildManager {
  constructor() {
    this.platform = 'win32';
    this.arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    this.buildStartTime = Date.now();
  }

  /**
   * Main build process
   */
  async build() {
    try {
      BuildUtils.log('🚀 Starting Windows build process...', 'info');
      
      // Pre-build validation
      this.validateWindowsEnvironment();
      
      // Build steps
      await this.prepareBuild();
      await this.buildApplication();
      await this.createInstaller();
      await this.signArtifacts();
      await this.createDistribution();
      
      // Post-build
      const buildDuration = Date.now() - this.buildStartTime;
      await this.finalizeBuild(buildDuration);
      
      BuildUtils.log('✅ Windows build completed successfully!', 'info');
      
    } catch (error) {
      BuildUtils.log(`❌ Windows build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  /**
   * Validate Windows build environment
   */
  validateWindowsEnvironment() {
    BuildUtils.log('Validating Windows build environment...', 'info');
    
    // Base validation
    BuildUtils.validateEnvironment();
    
    // Windows-specific validation
    if (process.platform !== 'win32') {
      BuildUtils.log('Warning: Building Windows app on non-Windows platform', 'warn');
    }
    
    // Check for electron-builder
    try {
      BuildUtils.exec('npx electron-builder --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('electron-builder not found. Run: npm install electron-builder');
    }
    
    // Check code signing certificate
    if (WINDOWS_CONFIG.codeSigningCertificate) {
      if (!BuildUtils.fileExists(WINDOWS_CONFIG.codeSigningCertificate)) {
        BuildUtils.log('Warning: Code signing certificate not found', 'warn');
      } else {
        BuildUtils.log('Code signing certificate found', 'info');
      }
    }
    
    // Check required assets
    const requiredAssets = [
      'assets/icon.ico',
      'assets/installer-icon.ico',
      'assets/installer-sidebar.bmp'
    ];
    
    for (const asset of requiredAssets) {
      const assetPath = path.join(BUILD_CONFIG.sourceDir, asset);
      if (!BuildUtils.fileExists(assetPath)) {
        BuildUtils.log(`Warning: Asset not found: ${asset}`, 'warn');
      }
    }
    
    BuildUtils.log('Windows environment validation completed', 'info');
  }

  /**
   * Prepare build environment
   */
  async prepareBuild() {
    BuildUtils.log('Preparing Windows build...', 'info');
    
    // Clean previous builds
    BuildUtils.cleanBuild();
    
    // Install dependencies
    BuildUtils.installDependencies();
    
    // Build frontend and backend
    BuildUtils.buildFrontend();
    BuildUtils.buildBackend();
    
    // Compile TypeScript
    BuildUtils.compileTypeScript();
    
    // Run tests
    if (process.env.SKIP_TESTS !== 'true') {
      BuildUtils.runTests();
    }
    
    // Create build configuration
    this.createElectronBuilderConfig();
    
    BuildUtils.log('Windows build preparation completed', 'info');
  }

  /**
   * Create electron-builder configuration
   */
  createElectronBuilderConfig() {
    const config = {
      appId: BUILD_CONFIG.appId,
      productName: BUILD_CONFIG.appName,
      copyright: BUILD_CONFIG.copyright,
      
      directories: {
        output: BUILD_CONFIG.buildDir,
        buildResources: 'build'
      },
      
      files: [
        'dist/**/*',
        'assets/**/*',
        'package.json',
        '!node_modules/**/*',
        '!src/**/*',
        '!scripts/**/*',
        '!*.md',
        '!*.log'
      ],
      
      extraResources: [
        {
          from: 'assets',
          to: 'assets'
        }
      ],
      
      win: {
        ...WINDOWS_CONFIG,
        target: [
          {
            target: 'nsis',
            arch: [this.arch]
          }
        ]
      },
      
      nsis: WINDOWS_CONFIG.nsis,
      
      publish: process.env.PUBLISH_BUILD === 'true' ? WINDOWS_CONFIG.publish : null
    };
    
    const configPath = path.join(BUILD_CONFIG.sourceDir, 'electron-builder-windows.json');
    BuildUtils.writeJson(configPath, config);
    
    BuildUtils.log(`Electron-builder config created: ${configPath}`, 'info');
  }

  /**
   * Build Electron application
   */
  async buildApplication() {
    BuildUtils.log('Building Windows Electron application...', 'info');
    
    const configPath = path.join(BUILD_CONFIG.sourceDir, 'electron-builder-windows.json');
    const command = `npx electron-builder --config ${configPath} --win --${this.arch}`;
    
    BuildUtils.exec(command);
    
    BuildUtils.log('Windows Electron application built', 'info');
  }

  /**
   * Create Windows installer
   */
  async createInstaller() {
    BuildUtils.log('Creating Windows installer...', 'info');
    
    // The installer is created by electron-builder in the previous step
    // This method can be used for additional installer customization
    
    const installerPath = path.join(
      BUILD_CONFIG.buildDir,
      `${BUILD_CONFIG.appName} Setup ${BUILD_CONFIG.version}.exe`
    );
    
    if (BuildUtils.fileExists(installerPath)) {
      BuildUtils.log(`Windows installer created: ${installerPath}`, 'info');
      
      // Rename to standard format
      const standardName = `${BUILD_CONFIG.appName}-${BUILD_CONFIG.version}-${this.arch}.exe`;
      const standardPath = path.join(BUILD_CONFIG.buildDir, standardName);
      
      if (installerPath !== standardPath) {
        fs.renameSync(installerPath, standardPath);
        BuildUtils.log(`Installer renamed to: ${standardName}`, 'info');
      }
      
      return standardPath;
    } else {
      throw new Error('Windows installer not found after build');
    }
  }

  /**
   * Sign build artifacts
   */
  async signArtifacts() {
    if (!WINDOWS_CONFIG.codeSigningCertificate || process.env.SKIP_SIGNING === 'true') {
      BuildUtils.log('Skipping code signing (certificate not configured)', 'warn');
      return;
    }
    
    BuildUtils.log('Signing Windows artifacts...', 'info');
    
    // Find all .exe files in build directory
    const exeFiles = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.exe'))
      .map(file => path.join(BUILD_CONFIG.buildDir, file));
    
    for (const exeFile of exeFiles) {
      await this.signFile(exeFile);
    }
    
    BuildUtils.log('Windows artifacts signed', 'info');
  }

  /**
   * Sign individual file
   */
  async signFile(filePath) {
    const command = `signtool sign /f "${WINDOWS_CONFIG.codeSigningCertificate}" ` +
                   `/p "${WINDOWS_CONFIG.codeSigningPassword}" ` +
                   `/t "${WINDOWS_CONFIG.timestampServer}" ` +
                   `/d "${BUILD_CONFIG.appName}" ` +
                   `"${filePath}"`;
    
    try {
      BuildUtils.exec(command, { stdio: 'pipe' });
      BuildUtils.log(`Signed: ${path.basename(filePath)}`, 'info');
    } catch (error) {
      BuildUtils.log(`Failed to sign: ${path.basename(filePath)}`, 'warn');
    }
  }

  /**
   * Create distribution package
   */
  async createDistribution() {
    BuildUtils.log('Creating Windows distribution package...', 'info');
    
    // Find all build artifacts
    const artifacts = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.exe') || file.endsWith('.msi'))
      .map(file => path.join(BUILD_CONFIG.buildDir, file));
    
    // Create checksums
    const checksums = BuildUtils.createChecksums(artifacts);
    
    // Create release notes
    const releaseNotes = BuildUtils.createReleaseNotes(
      BUILD_CONFIG.version,
      this.platform,
      this.arch
    );
    
    // Create distribution info
    const distributionInfo = {
      platform: this.platform,
      arch: this.arch,
      version: BUILD_CONFIG.version,
      artifacts: artifacts.map(file => ({
        name: path.basename(file),
        path: file,
        size: BuildUtils.getFileSize(file),
        sizeFormatted: BuildUtils.formatFileSize(BuildUtils.getFileSize(file)),
        checksum: checksums[path.relative(BUILD_CONFIG.buildDir, file)]?.sha256
      })),
      installer: {
        type: 'nsis',
        features: [
          'One-click installation',
          'Desktop shortcut creation',
          'Start menu integration',
          'File association registration',
          'Automatic updates',
          'Clean uninstallation'
        ]
      },
      requirements: {
        os: 'Windows 10 or later (64-bit)',
        memory: '4 GB RAM minimum',
        storage: '500 MB available space',
        display: '1024x768 minimum resolution',
        network: 'Internet connection for license validation'
      }
    };
    
    const distributionPath = path.join(BUILD_CONFIG.buildDir, 'distribution-windows.json');
    BuildUtils.writeJson(distributionPath, distributionInfo);
    
    BuildUtils.log('Windows distribution package created', 'info');
    return distributionInfo;
  }

  /**
   * Finalize build process
   */
  async finalizeBuild(buildDuration) {
    BuildUtils.log('Finalizing Windows build...', 'info');
    
    // Generate build info
    const buildInfo = BuildUtils.generateBuildInfo(this.platform, this.arch);
    
    // Find all artifacts
    const artifacts = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.exe') || file.endsWith('.msi') || file.endsWith('.json'))
      .map(file => path.join(BUILD_CONFIG.buildDir, file));
    
    // Create final checksums
    const checksums = BuildUtils.createChecksums(artifacts);
    
    // Create build summary
    const summary = BuildUtils.createBuildSummary(buildInfo, checksums, buildDuration);
    
    // Log build results
    BuildUtils.log('📊 Windows Build Summary:', 'info');
    BuildUtils.log(`   Platform: ${this.platform}-${this.arch}`, 'info');
    BuildUtils.log(`   Version: ${BUILD_CONFIG.version}`, 'info');
    BuildUtils.log(`   Duration: ${BuildUtils.formatDuration(buildDuration)}`, 'info');
    BuildUtils.log(`   Artifacts: ${Object.keys(checksums).length}`, 'info');
    
    // List artifacts
    for (const [file, info] of Object.entries(checksums)) {
      BuildUtils.log(`   - ${file} (${info.sizeFormatted})`, 'info');
    }
    
    BuildUtils.log('Windows build finalized', 'info');
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  const buildManager = new WindowsBuildManager();
  buildManager.build().catch(error => {
    BuildUtils.log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = WindowsBuildManager;
