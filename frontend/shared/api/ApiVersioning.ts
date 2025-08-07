/**
 * API Versioning System
 * 
 * Provides version management for API endpoints with backward compatibility
 * and automatic version negotiation.
 */

export type ApiVersion = string;

export interface ApiVersionConfig {
  supportedVersions: ApiVersion[];
  defaultVersion: ApiVersion;
  deprecatedVersions: ApiVersion[];
  versioningStrategy: 'url' | 'header' | 'query' | 'content-type';
  strictVersioning: boolean;
  retryOnVersionMismatch: boolean;
  fallbackToLatest: boolean;
}

export const defaultApiVersionConfig: ApiVersionConfig = {
  supportedVersions: ['v1', 'v2'],
  defaultVersion: 'v2',
  deprecatedVersions: ['v1'],
  versioningStrategy: 'url',
  strictVersioning: false,
  retryOnVersionMismatch: true,
  fallbackToLatest: true
};

export class ApiVersionManager {
  private config: ApiVersionConfig;

  constructor(config: Partial<ApiVersionConfig> = {}) {
    this.config = { ...defaultApiVersionConfig, ...config };
  }

  /**
   * Get the current API version
   */
  getCurrentVersion(): ApiVersion {
    return this.config.defaultVersion;
  }

  /**
   * Check if a version is supported
   */
  isVersionSupported(version: ApiVersion): boolean {
    return this.config.supportedVersions.includes(version);
  }

  /**
   * Check if a version is deprecated
   */
  isVersionDeprecated(version: ApiVersion): boolean {
    return this.config.deprecatedVersions.includes(version);
  }

  /**
   * Get the latest supported version
   */
  getLatestVersion(): ApiVersion {
    return this.config.supportedVersions[this.config.supportedVersions.length - 1];
  }

  /**
   * Negotiate version based on client request
   */
  negotiateVersion(requestedVersion?: ApiVersion): ApiVersion {
    if (!requestedVersion) {
      return this.config.defaultVersion;
    }

    if (this.isVersionSupported(requestedVersion)) {
      return requestedVersion;
    }

    if (this.config.fallbackToLatest) {
      return this.getLatestVersion();
    }

    return this.config.defaultVersion;
  }
}

export class VersionUtils {
  /**
   * Parse version string
   */
  static parseVersion(version: string): { major: number; minor: number; patch: number } {
    const match = version.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2] || '0', 10),
      patch: parseInt(match[3] || '0', 10)
    };
  }

  /**
   * Compare two versions
   */
  static compareVersions(version1: string, version2: string): number {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);

    if (v1.major !== v2.major) {
      return v1.major - v2.major;
    }
    if (v1.minor !== v2.minor) {
      return v1.minor - v2.minor;
    }
    return v1.patch - v2.patch;
  }

  /**
   * Check if version is compatible
   */
  static isCompatible(requestedVersion: string, supportedVersion: string): boolean {
    const requested = this.parseVersion(requestedVersion);
    const supported = this.parseVersion(supportedVersion);

    // Major version must match for compatibility
    return requested.major === supported.major;
  }
}
