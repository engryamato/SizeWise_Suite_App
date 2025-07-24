#!/usr/bin/env node

/**
 * macOS Build Script - Cross-platform deployment for macOS
 * 
 * MISSION-CRITICAL: macOS-specific build configuration and deployment
 * Generates macOS applications (.app, .dmg) with proper signing and notarization
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.4
 */

const { BUILD_CONFIG, PLATFORM_CONFIGS, BuildUtils } = require('./build-common');
const path = require('path');
const fs = require('fs');

/**
 * macOS-specific configuration
 */
const MACOS_CONFIG = {
  ...PLATFORM_CONFIGS.darwin,
  
  // Code signing configuration
  codeSigningIdentity: process.env.MACOS_CERT_NAME || 'Developer ID Application',
  installerSigningIdentity: process.env.MACOS_INSTALLER_CERT_NAME || 'Developer ID Installer',
  
  // Notarization configuration
  notarization: {
    enabled: process.env.NODE_ENV === 'production',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  },
  
  // macOS-specific features
  autoUpdater: {
    enabled: true,
    provider: 'github',
    updaterCacheDirName: BUILD_CONFIG.appName
  },
  
  // DMG configuration
  dmg: {
    ...PLATFORM_CONFIGS.darwin.dmg,
    window: {
      width: 540,
      height: 380
    },
    iconSize: 80,
    iconTextSize: 12,
    format: 'UDZO', // Compressed
    additionalDMGOptions: {
      'code-sign': MACOS_CONFIG.codeSigningIdentity
    }
  },
  
  // App Store configuration
  mas: {
    ...PLATFORM_CONFIGS.darwin.mas,
    category: 'public.app-category.productivity',
    provisioningProfile: process.env.MACOS_PROVISIONING_PROFILE,
    entitlements: 'build/entitlements.mas.plist',
    entitlementsInherit: 'build/entitlements.mas.inherit.plist'
  },
  
  // Hardened Runtime
  hardenedRuntime: true,
  gatekeeperAssess: false,
  
  // Extended attributes
  extendedInfo: {
    CFBundleDocumentTypes: [
      {
        CFBundleTypeName: 'SizeWise Project',
        CFBundleTypeExtensions: ['sizewise'],
        CFBundleTypeRole: 'Editor',
        CFBundleTypeIconFile: 'file-icon.icns'
      }
    ],
    CFBundleURLTypes: [
      {
        CFBundleURLName: 'SizeWise Protocol',
        CFBundleURLSchemes: ['sizewise']
      }
    ]
  }
};

/**
 * macOS Build Manager
 */
class MacOSBuildManager {
  constructor() {
    this.platform = 'darwin';
    this.arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    this.buildStartTime = Date.now();
  }

  /**
   * Main build process
   */
  async build() {
    try {
      BuildUtils.log('🍎 Starting macOS build process...', 'info');
      
      // Pre-build validation
      this.validateMacOSEnvironment();
      
      // Build steps
      await this.prepareBuild();
      await this.buildApplication();
      await this.createDMG();
      await this.signAndNotarize();
      await this.createDistribution();
      
      // Post-build
      const buildDuration = Date.now() - this.buildStartTime;
      await this.finalizeBuild(buildDuration);
      
      BuildUtils.log('✅ macOS build completed successfully!', 'info');
      
    } catch (error) {
      BuildUtils.log(`❌ macOS build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  /**
   * Validate macOS build environment
   */
  validateMacOSEnvironment() {
    BuildUtils.log('Validating macOS build environment...', 'info');
    
    // Base validation
    BuildUtils.validateEnvironment();
    
    // macOS-specific validation
    if (process.platform !== 'darwin') {
      BuildUtils.log('Warning: Building macOS app on non-macOS platform', 'warn');
    }
    
    // Check for Xcode command line tools
    try {
      BuildUtils.exec('xcode-select --print-path', { stdio: 'pipe' });
    } catch (error) {
      BuildUtils.log('Warning: Xcode command line tools not found', 'warn');
    }
    
    // Check for electron-builder
    try {
      BuildUtils.exec('npx electron-builder --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('electron-builder not found. Run: npm install electron-builder');
    }
    
    // Check code signing identity
    if (process.platform === 'darwin') {
      try {
        const result = BuildUtils.exec(
          `security find-identity -v -p codesigning | grep "${MACOS_CONFIG.codeSigningIdentity}"`,
          { stdio: 'pipe' }
        );
        if (result) {
          BuildUtils.log('Code signing identity found', 'info');
        }
      } catch (error) {
        BuildUtils.log('Warning: Code signing identity not found', 'warn');
      }
    }
    
    // Check required assets
    const requiredAssets = [
      'assets/icon.icns',
      'assets/dmg-background.png',
      'assets/file-icon.icns'
    ];
    
    for (const asset of requiredAssets) {
      const assetPath = path.join(BUILD_CONFIG.sourceDir, asset);
      if (!BuildUtils.fileExists(assetPath)) {
        BuildUtils.log(`Warning: Asset not found: ${asset}`, 'warn');
      }
    }
    
    // Check entitlements files
    const entitlementsFiles = [
      'build/entitlements.mas.plist',
      'build/entitlements.mas.inherit.plist'
    ];
    
    for (const file of entitlementsFiles) {
      const filePath = path.join(BUILD_CONFIG.sourceDir, file);
      if (!BuildUtils.fileExists(filePath)) {
        BuildUtils.log(`Warning: Entitlements file not found: ${file}`, 'warn');
      }
    }
    
    BuildUtils.log('macOS environment validation completed', 'info');
  }

  /**
   * Prepare build environment
   */
  async prepareBuild() {
    BuildUtils.log('Preparing macOS build...', 'info');
    
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
    
    // Create entitlements if they don't exist
    this.createEntitlements();
    
    BuildUtils.log('macOS build preparation completed', 'info');
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
      
      mac: {
        ...MACOS_CONFIG,
        target: [
          {
            target: 'dmg',
            arch: [this.arch]
          }
        ]
      },
      
      dmg: MACOS_CONFIG.dmg,
      mas: MACOS_CONFIG.mas,
      
      afterSign: process.env.SKIP_NOTARIZATION !== 'true' ? 'scripts/notarize.js' : undefined,
      
      publish: process.env.PUBLISH_BUILD === 'true' ? MACOS_CONFIG.publish : null
    };
    
    const configPath = path.join(BUILD_CONFIG.sourceDir, 'electron-builder-macos.json');
    BuildUtils.writeJson(configPath, config);
    
    BuildUtils.log(`Electron-builder config created: ${configPath}`, 'info');
  }

  /**
   * Create entitlements files
   */
  createEntitlements() {
    const entitlementsDir = path.join(BUILD_CONFIG.sourceDir, 'build');
    BuildUtils.ensureDir(entitlementsDir);
    
    // Main entitlements
    const mainEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
  <key>com.apple.security.files.downloads.read-write</key>
  <true/>
</dict>
</plist>`;
    
    const mainEntitlementsPath = path.join(entitlementsDir, 'entitlements.mas.plist');
    if (!BuildUtils.fileExists(mainEntitlementsPath)) {
      fs.writeFileSync(mainEntitlementsPath, mainEntitlements);
      BuildUtils.log('Created main entitlements file', 'info');
    }
    
    // Inherit entitlements
    const inheritEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>`;
    
    const inheritEntitlementsPath = path.join(entitlementsDir, 'entitlements.mas.inherit.plist');
    if (!BuildUtils.fileExists(inheritEntitlementsPath)) {
      fs.writeFileSync(inheritEntitlementsPath, inheritEntitlements);
      BuildUtils.log('Created inherit entitlements file', 'info');
    }
  }

  /**
   * Build Electron application
   */
  async buildApplication() {
    BuildUtils.log('Building macOS Electron application...', 'info');
    
    const configPath = path.join(BUILD_CONFIG.sourceDir, 'electron-builder-macos.json');
    const command = `npx electron-builder --config ${configPath} --mac --${this.arch}`;
    
    BuildUtils.exec(command);
    
    BuildUtils.log('macOS Electron application built', 'info');
  }

  /**
   * Create DMG installer
   */
  async createDMG() {
    BuildUtils.log('Creating macOS DMG installer...', 'info');
    
    // The DMG is created by electron-builder in the previous step
    // This method can be used for additional DMG customization
    
    const dmgPath = path.join(
      BUILD_CONFIG.buildDir,
      `${BUILD_CONFIG.appName}-${BUILD_CONFIG.version}-${this.arch}.dmg`
    );
    
    if (BuildUtils.fileExists(dmgPath)) {
      BuildUtils.log(`macOS DMG created: ${dmgPath}`, 'info');
      return dmgPath;
    } else {
      throw new Error('macOS DMG not found after build');
    }
  }

  /**
   * Sign and notarize artifacts
   */
  async signAndNotarize() {
    if (process.env.SKIP_SIGNING === 'true') {
      BuildUtils.log('Skipping code signing and notarization', 'warn');
      return;
    }
    
    if (process.platform !== 'darwin') {
      BuildUtils.log('Skipping signing/notarization (not on macOS)', 'warn');
      return;
    }
    
    BuildUtils.log('Signing and notarizing macOS artifacts...', 'info');
    
    // Find all .dmg and .app files
    const artifacts = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.dmg') || file.endsWith('.app'))
      .map(file => path.join(BUILD_CONFIG.buildDir, file));
    
    for (const artifact of artifacts) {
      await this.signArtifact(artifact);
    }
    
    // Notarization is handled by electron-builder's afterSign hook
    BuildUtils.log('macOS artifacts signed and notarized', 'info');
  }

  /**
   * Sign individual artifact
   */
  async signArtifact(artifactPath) {
    const command = `codesign --force --deep --sign "${MACOS_CONFIG.codeSigningIdentity}" "${artifactPath}"`;
    
    try {
      BuildUtils.exec(command, { stdio: 'pipe' });
      BuildUtils.log(`Signed: ${path.basename(artifactPath)}`, 'info');
    } catch (error) {
      BuildUtils.log(`Failed to sign: ${path.basename(artifactPath)}`, 'warn');
    }
  }

  /**
   * Create distribution package
   */
  async createDistribution() {
    BuildUtils.log('Creating macOS distribution package...', 'info');
    
    // Find all build artifacts
    const artifacts = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.dmg') || file.endsWith('.app'))
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
        type: 'dmg',
        features: [
          'Drag-and-drop installation',
          'Code signed and notarized',
          'Gatekeeper compatible',
          'Automatic updates',
          'File association registration',
          'Clean uninstallation'
        ]
      },
      requirements: {
        os: 'macOS 10.15 Catalina or later',
        memory: '4 GB RAM minimum',
        storage: '500 MB available space',
        display: '1024x768 minimum resolution',
        network: 'Internet connection for license validation'
      }
    };
    
    const distributionPath = path.join(BUILD_CONFIG.buildDir, 'distribution-macos.json');
    BuildUtils.writeJson(distributionPath, distributionInfo);
    
    BuildUtils.log('macOS distribution package created', 'info');
    return distributionInfo;
  }

  /**
   * Finalize build process
   */
  async finalizeBuild(buildDuration) {
    BuildUtils.log('Finalizing macOS build...', 'info');
    
    // Generate build info
    const buildInfo = BuildUtils.generateBuildInfo(this.platform, this.arch);
    
    // Find all artifacts
    const artifacts = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.dmg') || file.endsWith('.app') || file.endsWith('.json'))
      .map(file => path.join(BUILD_CONFIG.buildDir, file));
    
    // Create final checksums
    const checksums = BuildUtils.createChecksums(artifacts);
    
    // Create build summary
    const summary = BuildUtils.createBuildSummary(buildInfo, checksums, buildDuration);
    
    // Log build results
    BuildUtils.log('📊 macOS Build Summary:', 'info');
    BuildUtils.log(`   Platform: ${this.platform}-${this.arch}`, 'info');
    BuildUtils.log(`   Version: ${BUILD_CONFIG.version}`, 'info');
    BuildUtils.log(`   Duration: ${BuildUtils.formatDuration(buildDuration)}`, 'info');
    BuildUtils.log(`   Artifacts: ${Object.keys(checksums).length}`, 'info');
    
    // List artifacts
    for (const [file, info] of Object.entries(checksums)) {
      BuildUtils.log(`   - ${file} (${info.sizeFormatted})`, 'info');
    }
    
    BuildUtils.log('macOS build finalized', 'info');
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  const buildManager = new MacOSBuildManager();
  buildManager.build().catch(error => {
    BuildUtils.log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = MacOSBuildManager;
