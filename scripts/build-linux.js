#!/usr/bin/env node

/**
 * Linux Build Script - Cross-platform deployment for Linux
 * 
 * MISSION-CRITICAL: Linux-specific build configuration and deployment
 * Generates Linux packages (.deb, .rpm, .AppImage) with proper distribution
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.4
 */

const { BUILD_CONFIG, PLATFORM_CONFIGS, BuildUtils } = require('./build-common');
const path = require('path');
const fs = require('fs');

/**
 * Linux-specific configuration
 */
const LINUX_CONFIG = {
  ...PLATFORM_CONFIGS.linux,
  
  // Package configuration
  packageName: 'sizewise-suite',
  maintainer: `${BUILD_CONFIG.author} <support@sizewise.com>`,
  vendor: BUILD_CONFIG.author,
  
  // Desktop entry configuration
  desktop: {
    ...PLATFORM_CONFIGS.linux.desktop,
    Exec: 'sizewise-suite %U',
    Icon: 'sizewise-suite',
    MimeType: 'application/x-sizewise;',
    StartupNotify: 'true',
    StartupWMClass: 'SizeWise Suite'
  },
  
  // AppImage configuration
  appImage: {
    systemIntegration: 'ask',
    license: 'LICENSE.txt',
    category: 'Engineering'
  },
  
  // Debian package configuration
  deb: {
    priority: 'optional',
    section: 'science',
    depends: [
      'libgtk-3-0',
      'libnotify4',
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libdrm2',
      'libxcomposite1',
      'libxdamage1',
      'libxrandr2',
      'libgbm1',
      'libxkbcommon0',
      'libasound2'
    ],
    recommends: [
      'libappindicator3-1'
    ]
  },
  
  // RPM package configuration
  rpm: {
    license: 'Commercial',
    group: 'Applications/Engineering',
    requires: [
      'gtk3',
      'libnotify',
      'nss',
      'libXScrnSaver',
      'libXtst',
      'xdg-utils',
      'at-spi2-atk',
      'libdrm',
      'libXcomposite',
      'libXdamage',
      'libXrandr',
      'mesa-libgbm',
      'libxkbcommon',
      'alsa-lib'
    ]
  }
};

/**
 * Linux Build Manager
 */
class LinuxBuildManager {
  constructor() {
    this.platform = 'linux';
    this.arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    this.buildStartTime = Date.now();
  }

  /**
   * Main build process
   */
  async build() {
    try {
      BuildUtils.log('🐧 Starting Linux build process...', 'info');
      
      // Pre-build validation
      this.validateLinuxEnvironment();
      
      // Build steps
      await this.prepareBuild();
      await this.buildApplication();
      await this.createPackages();
      await this.createDistribution();
      
      // Post-build
      const buildDuration = Date.now() - this.buildStartTime;
      await this.finalizeBuild(buildDuration);
      
      BuildUtils.log('✅ Linux build completed successfully!', 'info');
      
    } catch (error) {
      BuildUtils.log(`❌ Linux build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  /**
   * Validate Linux build environment
   */
  validateLinuxEnvironment() {
    BuildUtils.log('Validating Linux build environment...', 'info');
    
    // Base validation
    BuildUtils.validateEnvironment();
    
    // Linux-specific validation
    if (process.platform !== 'linux') {
      BuildUtils.log('Warning: Building Linux app on non-Linux platform', 'warn');
    }
    
    // Check for electron-builder
    try {
      BuildUtils.exec('npx electron-builder --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`electron-builder not found. Run: npm install electron-builder. Error: ${error.message}`);
    }
    
    // Check for required tools
    const requiredTools = ['fakeroot', 'dpkg', 'rpm'];
    for (const tool of requiredTools) {
      try {
        BuildUtils.exec(`which ${tool}`, { stdio: 'pipe' });
        BuildUtils.log(`Found tool: ${tool}`, 'debug');
      } catch (error) {
        BuildUtils.log(`Warning: Tool not found: ${tool} - ${error.message}`, 'warn');
      }
    }
    
    // Check required assets
    const requiredAssets = [
      'assets/icon.png',
      'assets/icon-256x256.png',
      'assets/icon-512x512.png'
    ];
    
    for (const asset of requiredAssets) {
      const assetPath = path.join(BUILD_CONFIG.sourceDir, asset);
      if (!BuildUtils.fileExists(assetPath)) {
        BuildUtils.log(`Warning: Asset not found: ${asset}`, 'warn');
      }
    }
    
    BuildUtils.log('Linux environment validation completed', 'info');
  }

  /**
   * Prepare build environment
   */
  async prepareBuild() {
    BuildUtils.log('Preparing Linux build...', 'info');
    
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
    
    // Create desktop entry
    this.createDesktopEntry();
    
    BuildUtils.log('Linux build preparation completed', 'info');
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
      
      linux: {
        ...LINUX_CONFIG,
        target: [
          { target: 'AppImage', arch: [this.arch] },
          { target: 'deb', arch: [this.arch] },
          { target: 'rpm', arch: [this.arch] }
        ]
      },
      
      deb: LINUX_CONFIG.deb,
      rpm: LINUX_CONFIG.rpm,
      appImage: LINUX_CONFIG.appImage,
      
      publish: process.env.PUBLISH_BUILD === 'true' ? LINUX_CONFIG.publish : null
    };
    
    const configPath = path.join(BUILD_CONFIG.sourceDir, 'electron-builder-linux.json');
    BuildUtils.writeJson(configPath, config);
    
    BuildUtils.log(`Electron-builder config created: ${configPath}`, 'info');
  }

  /**
   * Create desktop entry file
   */
  createDesktopEntry() {
    const desktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=${BUILD_CONFIG.appName}
Comment=${BUILD_CONFIG.description}
Exec=sizewise-suite %U
Icon=sizewise-suite
Categories=${LINUX_CONFIG.desktop.Categories}
Keywords=${LINUX_CONFIG.desktop.Keywords}
MimeType=${LINUX_CONFIG.desktop.MimeType}
StartupNotify=${LINUX_CONFIG.desktop.StartupNotify}
StartupWMClass=${LINUX_CONFIG.desktop.StartupWMClass}
`;
    
    const buildDir = path.join(BUILD_CONFIG.sourceDir, 'build');
    BuildUtils.ensureDir(buildDir);
    
    const desktopPath = path.join(buildDir, 'sizewise-suite.desktop');
    fs.writeFileSync(desktopPath, desktopEntry);
    
    BuildUtils.log('Desktop entry created', 'info');
  }

  /**
   * Build Electron application
   */
  async buildApplication() {
    BuildUtils.log('Building Linux Electron application...', 'info');
    
    const configPath = path.join(BUILD_CONFIG.sourceDir, 'electron-builder-linux.json');
    const command = `npx electron-builder --config ${configPath} --linux --${this.arch}`;
    
    BuildUtils.exec(command);
    
    BuildUtils.log('Linux Electron application built', 'info');
  }

  /**
   * Create Linux packages
   */
  async createPackages() {
    BuildUtils.log('Creating Linux packages...', 'info');
    
    // Packages are created by electron-builder in the previous step
    // This method can be used for additional package customization
    
    const expectedPackages = [
      `${BUILD_CONFIG.appName}-${BUILD_CONFIG.version}-${this.arch}.AppImage`,
      `${LINUX_CONFIG.packageName}_${BUILD_CONFIG.version}_amd64.deb`,
      `${LINUX_CONFIG.packageName}-${BUILD_CONFIG.version}.x86_64.rpm`
    ];
    
    const foundPackages = [];
    
    for (const packageName of expectedPackages) {
      const packagePath = path.join(BUILD_CONFIG.buildDir, packageName);
      if (BuildUtils.fileExists(packagePath)) {
        foundPackages.push(packagePath);
        BuildUtils.log(`Package created: ${packageName}`, 'info');
      }
    }
    
    if (foundPackages.length === 0) {
      throw new Error('No Linux packages found after build');
    }
    
    return foundPackages;
  }

  /**
   * Create distribution package
   */
  async createDistribution() {
    BuildUtils.log('Creating Linux distribution package...', 'info');
    
    // Find all build artifacts
    const artifacts = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.AppImage') || file.endsWith('.deb') || file.endsWith('.rpm'))
      .map(file => path.join(BUILD_CONFIG.buildDir, file));
    
    // Create checksums
    const checksums = BuildUtils.createChecksums(artifacts);
    
    // Create release notes
    BuildUtils.createReleaseNotes(
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
        type: this.getPackageType(file),
        size: BuildUtils.getFileSize(file),
        sizeFormatted: BuildUtils.formatFileSize(BuildUtils.getFileSize(file)),
        checksum: checksums[path.relative(BUILD_CONFIG.buildDir, file)]?.sha256
      })),
      packages: {
        appImage: {
          description: 'Universal Linux application (no installation required)',
          features: ['Portable', 'Self-contained', 'No root required']
        },
        deb: {
          description: 'Debian/Ubuntu package',
          features: ['System integration', 'Dependency management', 'Easy installation']
        },
        rpm: {
          description: 'Red Hat/Fedora/SUSE package',
          features: ['System integration', 'Dependency management', 'Easy installation']
        }
      },
      requirements: {
        os: 'Ubuntu 18.04 LTS or equivalent',
        memory: '4 GB RAM minimum',
        storage: '500 MB available space',
        display: 'X11 or Wayland display server',
        network: 'Internet connection for license validation'
      }
    };
    
    const distributionPath = path.join(BUILD_CONFIG.buildDir, 'distribution-linux.json');
    BuildUtils.writeJson(distributionPath, distributionInfo);
    
    BuildUtils.log('Linux distribution package created', 'info');
    return distributionInfo;
  }

  /**
   * Get package type from filename
   */
  getPackageType(filePath) {
    const fileName = path.basename(filePath);
    if (fileName.endsWith('.AppImage')) return 'appimage';
    if (fileName.endsWith('.deb')) return 'deb';
    if (fileName.endsWith('.rpm')) return 'rpm';
    return 'unknown';
  }

  /**
   * Finalize build process
   */
  async finalizeBuild(buildDuration) {
    BuildUtils.log('Finalizing Linux build...', 'info');
    
    // Generate build info
    const buildInfo = BuildUtils.generateBuildInfo(this.platform, this.arch);
    
    // Find all artifacts
    const artifacts = fs.readdirSync(BUILD_CONFIG.buildDir)
      .filter(file => file.endsWith('.AppImage') || file.endsWith('.deb') || file.endsWith('.rpm') || file.endsWith('.json'))
      .map(file => path.join(BUILD_CONFIG.buildDir, file));
    
    // Create final checksums
    const checksums = BuildUtils.createChecksums(artifacts);
    
    // Create build summary
    BuildUtils.createBuildSummary(buildInfo, checksums, buildDuration);
    
    // Log build results
    BuildUtils.log('📊 Linux Build Summary:', 'info');
    BuildUtils.log(`   Platform: ${this.platform}-${this.arch}`, 'info');
    BuildUtils.log(`   Version: ${BUILD_CONFIG.version}`, 'info');
    BuildUtils.log(`   Duration: ${BuildUtils.formatDuration(buildDuration)}`, 'info');
    BuildUtils.log(`   Artifacts: ${Object.keys(checksums).length}`, 'info');
    
    // List artifacts
    for (const [file, info] of Object.entries(checksums)) {
      BuildUtils.log(`   - ${file} (${info.sizeFormatted})`, 'info');
    }
    
    BuildUtils.log('Linux build finalized', 'info');
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  const buildManager = new LinuxBuildManager();
  buildManager.build().catch(error => {
    BuildUtils.log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = LinuxBuildManager;
