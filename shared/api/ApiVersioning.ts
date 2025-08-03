/**
 * API Versioning System for SizeWise Suite
 * 
 * Provides comprehensive API versioning with backward compatibility,
 * deprecation management, and migration support.
 */

// =============================================================================
// Version Types and Interfaces
// =============================================================================

export interface ApiVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export interface VersionedEndpoint {
  path: string;
  version: ApiVersion;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  deprecated?: boolean;
  deprecationDate?: Date;
  removalDate?: Date;
  replacedBy?: string;
  description: string;
  changes?: string[];
}

export interface ApiVersionConfig {
  currentVersion: ApiVersion;
  supportedVersions: ApiVersion[];
  deprecationPolicy: {
    warningPeriodMonths: number;
    supportPeriodMonths: number;
    notificationMethods: ('header' | 'response' | 'email')[];
  };
  versioningStrategy: 'url' | 'header' | 'query' | 'content-type';
  defaultVersion: ApiVersion;
  strictVersioning: boolean;
}

export interface VersionCompatibility {
  fromVersion: ApiVersion;
  toVersion: ApiVersion;
  compatible: boolean;
  breakingChanges: string[];
  migrationGuide?: string;
  autoMigration?: boolean;
}

// =============================================================================
// Version Utilities
// =============================================================================

export class VersionUtils {
  /**
   * Parse version string to ApiVersion object
   */
  static parseVersion(versionString: string): ApiVersion {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
    const match = versionString.match(regex);
    
    if (!match) {
      throw new Error(`Invalid version format: ${versionString}`);
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5]
    };
  }
  
  /**
   * Convert ApiVersion to string
   */
  static versionToString(version: ApiVersion): string {
    let versionString = `${version.major}.${version.minor}.${version.patch}`;
    
    if (version.prerelease) {
      versionString += `-${version.prerelease}`;
    }
    
    if (version.build) {
      versionString += `+${version.build}`;
    }
    
    return versionString;
  }
  
  /**
   * Compare two versions
   */
  static compareVersions(a: ApiVersion, b: ApiVersion): number {
    // Compare major
    if (a.major !== b.major) {
      return a.major - b.major;
    }
    
    // Compare minor
    if (a.minor !== b.minor) {
      return a.minor - b.minor;
    }
    
    // Compare patch
    if (a.patch !== b.patch) {
      return a.patch - b.patch;
    }
    
    // Compare prerelease
    if (a.prerelease && !b.prerelease) return -1;
    if (!a.prerelease && b.prerelease) return 1;
    if (a.prerelease && b.prerelease) {
      return a.prerelease.localeCompare(b.prerelease);
    }
    
    return 0;
  }
  
  /**
   * Check if version is compatible
   */
  static isCompatible(requestedVersion: ApiVersion, availableVersion: ApiVersion): boolean {
    // Major version must match for compatibility
    if (requestedVersion.major !== availableVersion.major) {
      return false;
    }
    
    // Minor version can be backward compatible
    if (requestedVersion.minor > availableVersion.minor) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get latest version from array
   */
  static getLatestVersion(versions: ApiVersion[]): ApiVersion {
    if (versions.length === 0) {
      throw new Error('No versions provided');
    }
    
    return versions.reduce((latest, current) => 
      this.compareVersions(current, latest) > 0 ? current : latest
    );
  }
}

// =============================================================================
// API Version Manager
// =============================================================================

export class ApiVersionManager {
  private config: ApiVersionConfig;
  private endpoints: Map<string, VersionedEndpoint[]> = new Map();
  private compatibilityMatrix: VersionCompatibility[] = [];
  
  constructor(config: ApiVersionConfig) {
    this.config = config;
    this.initializeCompatibilityMatrix();
  }
  
  /**
   * Register a versioned endpoint
   */
  registerEndpoint(endpoint: VersionedEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    const existing = this.endpoints.get(key) || [];
    
    // Check for duplicate versions
    const duplicateVersion = existing.find(e => 
      VersionUtils.compareVersions(e.version, endpoint.version) === 0
    );
    
    if (duplicateVersion) {
      throw new Error(`Endpoint ${key} already registered for version ${VersionUtils.versionToString(endpoint.version)}`);
    }
    
    existing.push(endpoint);
    existing.sort((a, b) => VersionUtils.compareVersions(b.version, a.version)); // Latest first
    this.endpoints.set(key, existing);
  }
  
  /**
   * Get endpoint for specific version
   */
  getEndpoint(method: string, path: string, requestedVersion?: ApiVersion): VersionedEndpoint | null {
    const key = `${method}:${path}`;
    const endpoints = this.endpoints.get(key);
    
    if (!endpoints || endpoints.length === 0) {
      return null;
    }
    
    const targetVersion = requestedVersion || this.config.defaultVersion;
    
    // Find exact match first
    const exactMatch = endpoints.find(e => 
      VersionUtils.compareVersions(e.version, targetVersion) === 0
    );
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // Find compatible version (backward compatibility)
    const compatibleEndpoint = endpoints.find(e => 
      VersionUtils.isCompatible(targetVersion, e.version)
    );
    
    if (compatibleEndpoint) {
      return compatibleEndpoint;
    }
    
    // Return latest if no compatible version found and strict versioning is disabled
    if (!this.config.strictVersioning) {
      return endpoints[0]; // Latest version (sorted)
    }
    
    return null;
  }
  
  /**
   * Get all supported versions for an endpoint
   */
  getSupportedVersions(method: string, path: string): ApiVersion[] {
    const key = `${method}:${path}`;
    const endpoints = this.endpoints.get(key) || [];
    return endpoints.map(e => e.version);
  }
  
  /**
   * Check if endpoint is deprecated
   */
  isDeprecated(method: string, path: string, version: ApiVersion): boolean {
    const endpoint = this.getEndpoint(method, path, version);
    return endpoint?.deprecated || false;
  }
  
  /**
   * Get deprecation info
   */
  getDeprecationInfo(method: string, path: string, version: ApiVersion): {
    deprecated: boolean;
    deprecationDate?: Date;
    removalDate?: Date;
    replacedBy?: string;
    warningMessage?: string;
  } {
    const endpoint = this.getEndpoint(method, path, version);
    
    if (!endpoint || !endpoint.deprecated) {
      return { deprecated: false };
    }
    
    const warningMessage = this.generateDeprecationWarning(endpoint);
    
    return {
      deprecated: true,
      deprecationDate: endpoint.deprecationDate,
      removalDate: endpoint.removalDate,
      replacedBy: endpoint.replacedBy,
      warningMessage
    };
  }
  
  /**
   * Extract version from request
   */
  extractVersionFromRequest(request: {
    url?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  }): ApiVersion | null {
    switch (this.config.versioningStrategy) {
      case 'url':
        return this.extractVersionFromUrl(request.url || '');
      case 'header':
        return this.extractVersionFromHeader(request.headers || {});
      case 'query':
        return this.extractVersionFromQuery(request.query || {});
      case 'content-type':
        return this.extractVersionFromContentType(request.headers || {});
      default:
        return null;
    }
  }
  
  /**
   * Generate version response headers
   */
  generateVersionHeaders(endpoint: VersionedEndpoint): Record<string, string> {
    const headers: Record<string, string> = {
      'API-Version': VersionUtils.versionToString(endpoint.version),
      'API-Supported-Versions': this.config.supportedVersions
        .map(v => VersionUtils.versionToString(v))
        .join(', ')
    };
    
    if (endpoint.deprecated) {
      headers['API-Deprecation'] = 'true';
      
      if (endpoint.deprecationDate) {
        headers['API-Deprecation-Date'] = endpoint.deprecationDate.toISOString();
      }
      
      if (endpoint.removalDate) {
        headers['API-Removal-Date'] = endpoint.removalDate.toISOString();
      }
      
      if (endpoint.replacedBy) {
        headers['API-Replaced-By'] = endpoint.replacedBy;
      }
    }
    
    return headers;
  }
  
  // =============================================================================
  // Private Methods
  // =============================================================================
  
  private initializeCompatibilityMatrix(): void {
    // Initialize compatibility matrix for SizeWise Suite versions
    this.compatibilityMatrix = [
      {
        fromVersion: VersionUtils.parseVersion('1.0.0'),
        toVersion: VersionUtils.parseVersion('1.1.0'),
        compatible: true,
        breakingChanges: [],
        autoMigration: true
      },
      {
        fromVersion: VersionUtils.parseVersion('1.1.0'),
        toVersion: VersionUtils.parseVersion('2.0.0'),
        compatible: false,
        breakingChanges: [
          'Authentication endpoint moved from /auth to /api/auth',
          'Response format changed for calculation endpoints',
          'New required fields in project creation'
        ],
        migrationGuide: '/docs/migration/v1-to-v2'
      }
    ];
  }
  
  private extractVersionFromUrl(url: string): ApiVersion | null {
    const versionMatch = url.match(/\/v(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (versionMatch) {
      return {
        major: parseInt(versionMatch[1], 10),
        minor: parseInt(versionMatch[2] || '0', 10),
        patch: parseInt(versionMatch[3] || '0', 10)
      };
    }
    return null;
  }
  
  private extractVersionFromHeader(headers: Record<string, string>): ApiVersion | null {
    const versionHeader = headers['API-Version'] || headers['api-version'];
    if (versionHeader) {
      try {
        return VersionUtils.parseVersion(versionHeader);
      } catch {
        return null;
      }
    }
    return null;
  }
  
  private extractVersionFromQuery(query: Record<string, string>): ApiVersion | null {
    const version = query.version || query.v;
    if (version) {
      try {
        return VersionUtils.parseVersion(version);
      } catch {
        return null;
      }
    }
    return null;
  }
  
  private extractVersionFromContentType(headers: Record<string, string>): ApiVersion | null {
    const contentType = headers['Content-Type'] || headers['content-type'];
    if (contentType) {
      const versionMatch = contentType.match(/application\/vnd\.sizewise\.v(\d+)(?:\.(\d+))?(?:\.(\d+))?\+json/);
      if (versionMatch) {
        return {
          major: parseInt(versionMatch[1], 10),
          minor: parseInt(versionMatch[2] || '0', 10),
          patch: parseInt(versionMatch[3] || '0', 10)
        };
      }
    }
    return null;
  }
  
  private generateDeprecationWarning(endpoint: VersionedEndpoint): string {
    let warning = `API endpoint ${endpoint.method} ${endpoint.path} version ${VersionUtils.versionToString(endpoint.version)} is deprecated.`;
    
    if (endpoint.removalDate) {
      warning += ` It will be removed on ${endpoint.removalDate.toDateString()}.`;
    }
    
    if (endpoint.replacedBy) {
      warning += ` Please use ${endpoint.replacedBy} instead.`;
    }
    
    return warning;
  }
}

// =============================================================================
// Migration System
// =============================================================================

export interface ApiMigration {
  fromVersion: ApiVersion;
  toVersion: ApiVersion;
  description: string;
  breakingChanges: string[];
  migrationSteps: MigrationStep[];
  autoMigration: boolean;
  migrationGuideUrl?: string;
}

export interface MigrationStep {
  step: number;
  title: string;
  description: string;
  codeExample?: string;
  required: boolean;
  estimatedTime?: string;
}

export class ApiMigrationManager {
  private migrations: Map<string, ApiMigration> = new Map();

  /**
   * Register a migration path
   */
  registerMigration(migration: ApiMigration): void {
    const key = `${VersionUtils.versionToString(migration.fromVersion)}->${VersionUtils.versionToString(migration.toVersion)}`;
    this.migrations.set(key, migration);
  }

  /**
   * Get migration for version upgrade
   */
  getMigration(fromVersion: ApiVersion, toVersion: ApiVersion): ApiMigration | null {
    const key = `${VersionUtils.versionToString(fromVersion)}->${VersionUtils.versionToString(toVersion)}`;
    return this.migrations.get(key) || null;
  }

  /**
   * Get all available migrations
   */
  getAllMigrations(): ApiMigration[] {
    return Array.from(this.migrations.values());
  }

  /**
   * Check if migration is available
   */
  hasMigration(fromVersion: ApiVersion, toVersion: ApiVersion): boolean {
    return this.getMigration(fromVersion, toVersion) !== null;
  }

  /**
   * Get migration path (multi-step migrations)
   */
  getMigrationPath(fromVersion: ApiVersion, toVersion: ApiVersion): ApiMigration[] {
    const path: ApiMigration[] = [];
    let currentVersion = fromVersion;

    while (VersionUtils.compareVersions(currentVersion, toVersion) < 0) {
      let nextMigration: ApiMigration | null = null;

      // Find the next migration step
      for (const migration of this.migrations.values()) {
        if (VersionUtils.compareVersions(migration.fromVersion, currentVersion) === 0 &&
            VersionUtils.compareVersions(migration.toVersion, toVersion) <= 0) {
          if (!nextMigration ||
              VersionUtils.compareVersions(migration.toVersion, nextMigration.toVersion) < 0) {
            nextMigration = migration;
          }
        }
      }

      if (!nextMigration) {
        break; // No migration path found
      }

      path.push(nextMigration);
      currentVersion = nextMigration.toVersion;
    }

    return path;
  }
}

// =============================================================================
// Default Configuration
// =============================================================================

export const defaultApiVersionConfig: ApiVersionConfig = {
  currentVersion: VersionUtils.parseVersion('1.0.0'),
  supportedVersions: [
    VersionUtils.parseVersion('1.0.0')
  ],
  deprecationPolicy: {
    warningPeriodMonths: 3,
    supportPeriodMonths: 6,
    notificationMethods: ['header', 'response']
  },
  versioningStrategy: 'url',
  defaultVersion: VersionUtils.parseVersion('1.0.0'),
  strictVersioning: false
};

// =============================================================================
// SizeWise Suite Migration Definitions
// =============================================================================

export const sizeWiseMigrations: ApiMigration[] = [
  {
    fromVersion: VersionUtils.parseVersion('1.0.0'),
    toVersion: VersionUtils.parseVersion('1.1.0'),
    description: 'Minor update with enhanced HVAC calculations and new validation endpoints',
    breakingChanges: [],
    autoMigration: true,
    migrationSteps: [
      {
        step: 1,
        title: 'Update API calls to use new validation endpoints',
        description: 'New validation endpoints provide enhanced error reporting',
        codeExample: `
// Before
POST /api/calculations/validate

// After (optional, backward compatible)
POST /api/validation/hvac-parameters
        `,
        required: false,
        estimatedTime: '5 minutes'
      }
    ]
  },
  {
    fromVersion: VersionUtils.parseVersion('1.1.0'),
    toVersion: VersionUtils.parseVersion('2.0.0'),
    description: 'Major update with restructured authentication and enhanced project management',
    breakingChanges: [
      'Authentication endpoints moved from /auth to /api/auth',
      'Project creation requires additional metadata fields',
      'Response format changed for calculation endpoints',
      'New required authentication headers'
    ],
    autoMigration: false,
    migrationGuideUrl: '/docs/migration/v1-to-v2',
    migrationSteps: [
      {
        step: 1,
        title: 'Update authentication endpoints',
        description: 'All authentication endpoints have been moved to /api/auth prefix',
        codeExample: `
// Before
POST /auth/login
POST /auth/register

// After
POST /api/auth/login
POST /api/auth/register
        `,
        required: true,
        estimatedTime: '15 minutes'
      },
      {
        step: 2,
        title: 'Update project creation calls',
        description: 'Project creation now requires additional metadata',
        codeExample: `
// Before
{
  "name": "Project Name",
  "description": "Description"
}

// After
{
  "name": "Project Name",
  "description": "Description",
  "metadata": {
    "created_by": "user_id",
    "project_type": "hvac_design",
    "version": "2.0.0"
  }
}
        `,
        required: true,
        estimatedTime: '30 minutes'
      },
      {
        step: 3,
        title: 'Update calculation response handling',
        description: 'Calculation responses now include additional validation data',
        codeExample: `
// Before
{
  "result": { ... },
  "success": true
}

// After
{
  "result": { ... },
  "success": true,
  "validation": {
    "warnings": [...],
    "compliance": {...}
  },
  "metadata": {
    "calculation_time": "2024-01-01T00:00:00Z",
    "version": "2.0.0"
  }
}
        `,
        required: true,
        estimatedTime: '20 minutes'
      }
    ]
  }
];

// Initialize migration manager with default migrations
export const defaultMigrationManager = new ApiMigrationManager();
sizeWiseMigrations.forEach(migration => {
  defaultMigrationManager.registerMigration(migration);
});
