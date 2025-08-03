/**
 * API Versioning for Next.js Frontend
 * 
 * Provides client-side API versioning support with automatic
 * version negotiation and backward compatibility handling.
 */

import { ApiVersion, ApiVersionManager, VersionUtils, defaultApiVersionConfig } from '@/shared/api/ApiVersioning';

// =============================================================================
// Client Configuration
// =============================================================================

export interface ApiClientConfig {
  baseUrl: string;
  defaultVersion: ApiVersion;
  versioningStrategy: 'url' | 'header' | 'query' | 'content-type';
  strictVersioning: boolean;
  retryOnVersionMismatch: boolean;
  fallbackToLatest: boolean;
}

// =============================================================================
// API Client with Versioning
// =============================================================================

export class VersionedApiClient {
  private config: ApiClientConfig;
  private versionManager: ApiVersionManager;
  
  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      defaultVersion: VersionUtils.parseVersion('1.0.0'),
      versioningStrategy: 'url',
      strictVersioning: false,
      retryOnVersionMismatch: true,
      fallbackToLatest: true,
      ...config
    };
    
    this.versionManager = new ApiVersionManager(defaultApiVersionConfig);
  }
  
  /**
   * Make a versioned API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit & {
      version?: ApiVersion;
      method?: string;
    } = {}
  ): Promise<{
    data: T;
    version: ApiVersion;
    deprecated?: boolean;
    deprecationInfo?: any;
  }> {
    const version = options.version || this.config.defaultVersion;
    const method = options.method || 'GET';
    
    // Build versioned URL and headers
    const { url, headers } = this.buildVersionedRequest(endpoint, version, options.headers);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers
        }
      });
      
      // Extract version information from response
      const responseVersion = this.extractVersionFromResponse(response);
      const deprecationInfo = this.extractDeprecationInfo(response);
      
      if (!response.ok) {
        // Handle version-specific errors
        if (response.status === 400 && this.isVersionError(response)) {
          if (this.config.retryOnVersionMismatch && this.config.fallbackToLatest) {
            // Retry with latest supported version
            const supportedVersions = this.extractSupportedVersions(response);
            if (supportedVersions.length > 0) {
              const latestVersion = VersionUtils.getLatestVersion(supportedVersions);
              return this.request(endpoint, { ...options, version: latestVersion });
            }
          }
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        data,
        version: responseVersion || version,
        deprecated: deprecationInfo?.deprecated,
        deprecationInfo
      };
      
    } catch (error) {
      console.error('Versioned API request failed:', error);
      throw error;
    }
  }
  
  /**
   * Get API information including supported versions
   */
  async getApiInfo(): Promise<{
    name: string;
    version: string;
    supportedVersions: string[];
    endpoints: Record<string, string>;
  }> {
    const response = await this.request('/api/info');
    return response.data;
  }
  
  /**
   * Check if a specific version is supported
   */
  async isVersionSupported(version: ApiVersion): Promise<boolean> {
    try {
      const apiInfo = await this.getApiInfo();
      return apiInfo.supportedVersions.includes(VersionUtils.versionToString(version));
    } catch {
      return false;
    }
  }
  
  /**
   * Get migration guide for version upgrade
   */
  async getMigrationGuide(fromVersion: ApiVersion, toVersion: ApiVersion): Promise<string | null> {
    try {
      const response = await this.request(`/api/migration/${VersionUtils.versionToString(fromVersion)}/to/${VersionUtils.versionToString(toVersion)}`);
      return response.data.migrationGuide;
    } catch {
      return null;
    }
  }
  
  // =============================================================================
  // Private Methods
  // =============================================================================
  
  private buildVersionedRequest(
    endpoint: string,
    version: ApiVersion,
    existingHeaders?: HeadersInit
  ): { url: string; headers: Record<string, string> } {
    const headers: Record<string, string> = {};
    let url = `${this.config.baseUrl}${endpoint}`;
    
    switch (this.config.versioningStrategy) {
      case 'url':
        // Insert version into URL path
        url = url.replace('/api/', `/api/v${version.major}/`);
        break;
        
      case 'header':
        headers['API-Version'] = VersionUtils.versionToString(version);
        break;
        
      case 'query':
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}version=${VersionUtils.versionToString(version)}`;
        break;
        
      case 'content-type':
        headers['Content-Type'] = `application/vnd.sizewise.v${version.major}.${version.minor}.${version.patch}+json`;
        break;
    }
    
    return { url, headers };
  }
  
  private extractVersionFromResponse(response: Response): ApiVersion | null {
    const versionHeader = response.headers.get('API-Version');
    if (versionHeader) {
      try {
        return VersionUtils.parseVersion(versionHeader);
      } catch {
        return null;
      }
    }
    return null;
  }
  
  private extractDeprecationInfo(response: Response): {
    deprecated: boolean;
    deprecationDate?: Date;
    removalDate?: Date;
    replacedBy?: string;
    warningMessage?: string;
  } {
    const deprecated = response.headers.get('API-Deprecation') === 'true';
    
    if (!deprecated) {
      return { deprecated: false };
    }
    
    const deprecationDate = response.headers.get('API-Deprecation-Date');
    const removalDate = response.headers.get('API-Removal-Date');
    const replacedBy = response.headers.get('API-Replaced-By');
    
    let warningMessage = 'This API version is deprecated.';
    if (removalDate) {
      warningMessage += ` It will be removed on ${new Date(removalDate).toDateString()}.`;
    }
    if (replacedBy) {
      warningMessage += ` Please use ${replacedBy} instead.`;
    }
    
    return {
      deprecated: true,
      deprecationDate: deprecationDate ? new Date(deprecationDate) : undefined,
      removalDate: removalDate ? new Date(removalDate) : undefined,
      replacedBy: replacedBy || undefined,
      warningMessage
    };
  }
  
  private extractSupportedVersions(response: Response): ApiVersion[] {
    const supportedVersionsHeader = response.headers.get('API-Supported-Versions');
    if (supportedVersionsHeader) {
      return supportedVersionsHeader
        .split(',')
        .map(v => v.trim())
        .map(v => {
          try {
            return VersionUtils.parseVersion(v);
          } catch {
            return null;
          }
        })
        .filter((v): v is ApiVersion => v !== null);
    }
    return [];
  }
  
  private async isVersionError(response: Response): Promise<boolean> {
    try {
      const data = await response.clone().json();
      return data.error && data.error.includes('version');
    } catch {
      return false;
    }
  }
}

// =============================================================================
// React Hooks for API Versioning
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useVersionedApi(config?: Partial<ApiClientConfig>) {
  const [client] = useState(() => new VersionedApiClient(config));
  const [apiInfo, setApiInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchApiInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const info = await client.getApiInfo();
      setApiInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API info');
    } finally {
      setLoading(false);
    }
  }, [client]);
  
  useEffect(() => {
    fetchApiInfo();
  }, [fetchApiInfo]);
  
  const request = useCallback(async <T = any>(
    endpoint: string,
    options?: RequestInit & { version?: ApiVersion }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.request<T>(endpoint, options);
      
      // Log deprecation warnings
      if (result.deprecated && result.deprecationInfo?.warningMessage) {
        console.warn('API Deprecation Warning:', result.deprecationInfo.warningMessage);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);
  
  return {
    client,
    apiInfo,
    loading,
    error,
    request,
    refetchApiInfo: fetchApiInfo
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

export function createVersionedApiClient(config?: Partial<ApiClientConfig>): VersionedApiClient {
  return new VersionedApiClient(config);
}

export function getDefaultApiVersion(): ApiVersion {
  return VersionUtils.parseVersion(process.env.NEXT_PUBLIC_API_VERSION || '1.0.0');
}

export function isVersionDeprecated(deprecationInfo: any): boolean {
  return deprecationInfo?.deprecated === true;
}

export function getVersionMismatchError(requestedVersion: ApiVersion, supportedVersions: ApiVersion[]): string {
  return `API version ${VersionUtils.versionToString(requestedVersion)} is not supported. ` +
         `Supported versions: ${supportedVersions.map(v => VersionUtils.versionToString(v)).join(', ')}`;
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  VersionedApiClient,
  useVersionedApi,
  createVersionedApiClient,
  getDefaultApiVersion,
  isVersionDeprecated,
  getVersionMismatchError
};
