/**
 * Build Common Utilities - Shared build functionality
 * 
 * MISSION-CRITICAL: Common build utilities for cross-platform deployment
 * Provides shared functionality for Windows, macOS, and Linux builds
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.4
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

/**
 * Build configuration
 */
const BUILD_CONFIG = {
  appName: 'SizeWise Suite',
  appId: 'com.sizewise.suite',
  version: '1.0.0',
  description: 'Professional HVAC duct sizing application',
  author: 'SizeWise Technologies',
  homepage: 'https://sizewise.com',
  copyright: '© 2024 SizeWise Technologies. All rights reserved.',
  
  // Build directories
  sourceDir: path.join(__dirname, '..'),
  buildDir: path.join(__dirname, '..', 'dist'),
  assetsDir: path.join(__dirname, '..', 'assets'),
  
  // Electron configuration
  electronVersion: '28.0.0',
  nodeVersion: '18.17.0',
  
  // Security
  codeSigningEnabled: process.env.NODE_ENV === 'production',
  notarization: process.env.NODE_ENV === 'production',
  
  // Features
  autoUpdater: true,
  crashReporter: true,
  analytics: process.env.NODE_ENV === 'production'
};

/**
 * Platform-specific configurations
 */
const PLATFORM_CONFIGS = {
  win32: {
    target: 'nsis',
    icon: 'assets/icon.ico',
    artifactName: '${productName}-${version}-${arch}.${ext}',
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: BUILD_CONFIG.appName
    },
    publish: {
      provider: 'github',
      owner: 'sizewise',
      repo: 'sizewise-suite'
    }
  },
  
  darwin: {
    target: 'dmg',
    icon: 'assets/icon.icns',
    artifactName: '${productName}-${version}-${arch}.${ext}',
    dmg: {
      title: BUILD_CONFIG.appName,
      icon: 'assets/icon.icns',
      background: 'assets/dmg-background.png',
      contents: [
        { x: 130, y: 220 },
        { x: 410, y: 220, type: 'link', path: '/Applications' }
      ]
    },
    mas: {
      entitlements: 'build/entitlements.mas.plist',
      entitlementsInherit: 'build/entitlements.mas.inherit.plist',
      hardenedRuntime: true
    }
  },
  
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
      { target: 'rpm', arch: ['x64'] }
    ],
    icon: 'assets/icon.png',
    artifactName: '${productName}-${version}-${arch}.${ext}',
    desktop: {
      Name: BUILD_CONFIG.appName,
      Comment: BUILD_CONFIG.description,
      Categories: 'Engineering;Science;',
      Keywords: 'HVAC;Duct;Sizing;Engineering;'
    }
  }
};

/**
 * Utility functions
 */
class BuildUtils {
  /**
   * Log message with timestamp
   */
  static log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level.toUpperCase().padEnd(5);
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Execute command with logging
   */
  static exec(command, options = {}) {
    this.log(`Executing: ${command}`, 'debug');
    try {
      const result = execSync(command, {
        stdio: 'inherit',
        cwd: BUILD_CONFIG.sourceDir,
        ...options
      });
      return result;
    } catch (error) {
      this.log(`Command failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  static fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Create directory if it doesn't exist
   */
  static ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.log(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Copy file
   */
  static copyFile(src, dest) {
    this.ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    this.log(`Copied: ${src} -> ${dest}`);
  }

  /**
   * Read JSON file
   */
  static readJson(filePath) {
    if (!this.fileExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Write JSON file
   */
  static writeJson(filePath, data) {
    this.ensureDir(path.dirname(filePath));
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    this.log(`Written JSON: ${filePath}`);
  }

  /**
   * Generate file hash
   */
  static generateHash(filePath, algorithm = 'sha256') {
    if (!this.fileExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash(algorithm);
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Get file size in bytes
   */
  static getFileSize(filePath) {
    if (!this.fileExists(filePath)) {
      return 0;
    }
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Validate build environment
   */
  static validateEnvironment() {
    this.log('Validating build environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    this.log(`Node.js version: ${nodeVersion}`);
    
    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`npm version: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm not found');
    }
    
    // Check required directories
    const requiredDirs = [
      BUILD_CONFIG.sourceDir,
      BUILD_CONFIG.assetsDir
    ];
    
    for (const dir of requiredDirs) {
      if (!this.fileExists(dir)) {
        throw new Error(`Required directory not found: ${dir}`);
      }
    }
    
    // Check required files
    const requiredFiles = [
      path.join(BUILD_CONFIG.sourceDir, 'package.json'),
      path.join(BUILD_CONFIG.sourceDir, 'electron', 'main.ts')
    ];
    
    for (const file of requiredFiles) {
      if (!this.fileExists(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
    
    this.log('Environment validation passed');
  }

  /**
   * Clean build directory
   */
  static cleanBuild() {
    this.log('Cleaning build directory...');
    
    if (this.fileExists(BUILD_CONFIG.buildDir)) {
      fs.rmSync(BUILD_CONFIG.buildDir, { recursive: true, force: true });
      this.log(`Removed: ${BUILD_CONFIG.buildDir}`);
    }
    
    this.ensureDir(BUILD_CONFIG.buildDir);
  }

  /**
   * Install dependencies
   */
  static installDependencies() {
    this.log('Installing dependencies...');
    this.exec('npm ci');
    this.log('Dependencies installed');
  }

  /**
   * Build frontend
   */
  static buildFrontend() {
    this.log('Building frontend...');
    this.exec('npm run build:frontend');
    this.log('Frontend build completed');
  }

  /**
   * Build backend
   */
  static buildBackend() {
    this.log('Building backend...');
    this.exec('npm run build:backend');
    this.log('Backend build completed');
  }

  /**
   * Compile TypeScript
   */
  static compileTypeScript() {
    this.log('Compiling TypeScript...');
    this.exec('npx tsc');
    this.log('TypeScript compilation completed');
  }

  /**
   * Run tests
   */
  static runTests() {
    this.log('Running tests...');
    this.exec('npm test');
    this.log('Tests completed');
  }

  /**
   * Generate build info
   */
  static generateBuildInfo(platform, arch) {
    const buildInfo = {
      appName: BUILD_CONFIG.appName,
      version: BUILD_CONFIG.version,
      platform,
      arch,
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
      electronVersion: BUILD_CONFIG.electronVersion,
      buildNumber: process.env.BUILD_NUMBER || '1',
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch()
    };
    
    const buildInfoPath = path.join(BUILD_CONFIG.buildDir, 'build-info.json');
    this.writeJson(buildInfoPath, buildInfo);
    
    return buildInfo;
  }

  /**
   * Get git commit hash
   */
  static getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get git branch
   */
  static getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Create checksums file
   */
  static createChecksums(files) {
    this.log('Creating checksums...');
    
    const checksums = {};
    
    for (const file of files) {
      if (this.fileExists(file)) {
        const relativePath = path.relative(BUILD_CONFIG.buildDir, file);
        checksums[relativePath] = {
          sha256: this.generateHash(file, 'sha256'),
          size: this.getFileSize(file),
          sizeFormatted: this.formatFileSize(this.getFileSize(file))
        };
      }
    }
    
    const checksumsPath = path.join(BUILD_CONFIG.buildDir, 'checksums.json');
    this.writeJson(checksumsPath, checksums);
    
    this.log(`Checksums created: ${checksumsPath}`);
    return checksums;
  }

  /**
   * Create release notes
   */
  static createReleaseNotes(version, platform, arch) {
    const releaseNotes = {
      version,
      platform,
      arch,
      releaseDate: new Date().toISOString(),
      features: [
        'Professional HVAC duct sizing calculations',
        'Tier-based feature access (Free/Pro/Enterprise)',
        'Secure license management',
        'Cross-platform desktop application',
        'Native file operations',
        'PDF and CAD import capabilities',
        'Multiple export formats'
      ],
      improvements: [
        'Enhanced performance and stability',
        'Improved user interface',
        'Better error handling',
        'Updated security measures'
      ],
      bugFixes: [
        'Fixed calculation accuracy issues',
        'Resolved file import problems',
        'Improved license validation'
      ],
      requirements: {
        os: this.getOSRequirements(platform),
        memory: '4 GB RAM minimum, 8 GB recommended',
        storage: '500 MB available space',
        display: '1024x768 minimum resolution'
      }
    };
    
    const releaseNotesPath = path.join(BUILD_CONFIG.buildDir, `release-notes-${platform}-${arch}.json`);
    this.writeJson(releaseNotesPath, releaseNotes);
    
    return releaseNotes;
  }

  /**
   * Get OS requirements by platform
   */
  static getOSRequirements(platform) {
    const requirements = {
      win32: 'Windows 10 or later (64-bit)',
      darwin: 'macOS 10.15 Catalina or later',
      linux: 'Ubuntu 18.04 LTS or equivalent'
    };
    
    return requirements[platform] || 'Unknown platform';
  }

  /**
   * Measure build time
   */
  static measureTime(fn, label) {
    const startTime = Date.now();
    this.log(`Starting: ${label}`);
    
    const result = fn();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    this.log(`Completed: ${label} (${duration}ms)`);
    
    return { result, duration };
  }

  /**
   * Create build summary
   */
  static createBuildSummary(buildInfo, checksums, duration) {
    const summary = {
      build: buildInfo,
      artifacts: Object.keys(checksums).map(file => ({
        file,
        ...checksums[file]
      })),
      performance: {
        buildDuration: duration,
        buildDurationFormatted: this.formatDuration(duration)
      },
      timestamp: new Date().toISOString()
    };
    
    const summaryPath = path.join(BUILD_CONFIG.buildDir, 'build-summary.json');
    this.writeJson(summaryPath, summary);
    
    this.log('Build summary created');
    return summary;
  }

  /**
   * Format duration in milliseconds
   */
  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = {
  BUILD_CONFIG,
  PLATFORM_CONFIGS,
  BuildUtils
};
