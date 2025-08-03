/**
 * CDN Manager
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Centralized CDN management for static assets and global performance optimization
 */

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  regions: string[];
  fallbackUrl: string;
  assetTypes: {
    images: string[];
    models: string[];
    documents: string[];
    fonts: string[];
    scripts: string[];
    styles: string[];
  };
  cacheHeaders: {
    [key: string]: {
      maxAge: number;
      immutable: boolean;
      public: boolean;
    };
  };
  versioning: {
    strategy: 'hash' | 'timestamp' | 'semver';
    prefix: string;
  };
}

export interface AssetMetadata {
  url: string;
  size: number;
  type: string;
  hash: string;
  lastModified: number;
  cacheControl: string;
  region?: string;
}

export interface CDNPerformanceMetrics {
  loadTimes: Record<string, number>;
  hitRates: Record<string, number>;
  errorRates: Record<string, number>;
  bandwidthSaved: number;
  globalLatency: Record<string, number>;
}

export class CDNManager {
  private static instance: CDNManager;
  private config: CDNConfig;
  private assetCache: Map<string, AssetMetadata> = new Map();
  private performanceMetrics: CDNPerformanceMetrics;
  private userRegion: string = 'us-east-1';

  private constructor(config: CDNConfig) {
    this.config = config;
    this.performanceMetrics = {
      loadTimes: {},
      hitRates: {},
      errorRates: {},
      bandwidthSaved: 0,
      globalLatency: {}
    };
    
    this.detectUserRegion();
    this.initializePerformanceMonitoring();
  }

  static getInstance(config?: CDNConfig): CDNManager {
    if (!CDNManager.instance) {
      if (!config) {
        throw new Error('CDN configuration required for first initialization');
      }
      CDNManager.instance = new CDNManager(config);
    }
    return CDNManager.instance;
  }

  /**
   * Get optimized URL for an asset
   */
  getAssetUrl(
    assetPath: string, 
    options: {
      type?: string;
      quality?: number;
      width?: number;
      height?: number;
      format?: string;
      region?: string;
    } = {}
  ): string {
    if (!this.config.enabled) {
      return this.config.fallbackUrl + assetPath;
    }

    const assetType = this.detectAssetType(assetPath, options.type);
    const region = options.region || this.userRegion;
    const version = this.getAssetVersion(assetPath);
    
    // Build CDN URL with optimizations
    let cdnUrl = `${this.config.baseUrl}/${region}/${version}${assetPath}`;
    
    // Add image optimization parameters
    if (assetType === 'image' && (options.quality || options.width || options.height || options.format)) {
      const params = new URLSearchParams();
      
      if (options.quality) params.set('q', options.quality.toString());
      if (options.width) params.set('w', options.width.toString());
      if (options.height) params.set('h', options.height.toString());
      if (options.format) params.set('f', options.format);
      
      cdnUrl += `?${params.toString()}`;
    }

    // Track asset request
    this.trackAssetRequest(assetPath, assetType, region);
    
    return cdnUrl;
  }

  /**
   * Get optimized URL for 3D models with compression
   */
  get3DModelUrl(
    modelPath: string,
    options: {
      compression?: 'gzip' | 'brotli' | 'none';
      lod?: 'high' | 'medium' | 'low';
      format?: 'gltf' | 'glb' | 'obj';
    } = {}
  ): string {
    const { compression = 'gzip', lod = 'medium', format = 'glb' } = options;
    
    if (!this.config.enabled) {
      return this.config.fallbackUrl + modelPath;
    }

    const version = this.getAssetVersion(modelPath);
    const region = this.userRegion;
    
    // Build optimized 3D model URL
    let modelUrl = `${this.config.baseUrl}/${region}/${version}/models/${lod}${modelPath}`;
    
    if (format !== 'glb') {
      modelUrl = modelUrl.replace(/\.(glb|gltf|obj)$/, `.${format}`);
    }
    
    if (compression !== 'none') {
      modelUrl += `.${compression}`;
    }

    this.trackAssetRequest(modelPath, 'model', region);
    
    return modelUrl;
  }

  /**
   * Preload critical assets
   */
  async preloadAssets(assetPaths: string[]): Promise<void> {
    const preloadPromises = assetPaths.map(async (assetPath) => {
      try {
        const assetType = this.detectAssetType(assetPath);
        const url = this.getAssetUrl(assetPath);
        
        // Create appropriate preload element
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        
        switch (assetType) {
          case 'image':
            link.as = 'image';
            break;
          case 'font':
            link.as = 'font';
            link.crossOrigin = 'anonymous';
            break;
          case 'script':
            link.as = 'script';
            break;
          case 'style':
            link.as = 'style';
            break;
          default:
            link.as = 'fetch';
            link.crossOrigin = 'anonymous';
        }
        
        document.head.appendChild(link);
        
        // Track preload performance
        const startTime = performance.now();
        
        return new Promise<void>((resolve, reject) => {
          link.onload = () => {
            const loadTime = performance.now() - startTime;
            this.recordLoadTime(assetPath, loadTime);
            resolve();
          };
          link.onerror = () => {
            this.recordError(assetPath);
            reject(new Error(`Failed to preload ${assetPath}`));
          };
        });
        
      } catch (error) {
        console.error(`Error preloading asset ${assetPath}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Detect user's geographic region for optimal CDN edge
   */
  private async detectUserRegion(): Promise<void> {
    try {
      // Try to detect region from various sources
      const region = await this.detectRegionFromAPI() || 
                    this.detectRegionFromTimezone() || 
                    'us-east-1'; // fallback
      
      this.userRegion = region;
      console.log(`CDN: Detected user region as ${region}`);
    } catch (error) {
      console.warn('CDN: Failed to detect user region, using default');
      this.userRegion = 'us-east-1';
    }
  }

  private async detectRegionFromAPI(): Promise<string | null> {
    try {
      const response = await fetch('/api/user/region', {
        method: 'GET',
        cache: 'force-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.region;
      }
    } catch (error) {
      // Silently fail and try other methods
    }
    return null;
  }

  private detectRegionFromTimezone(): string | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map timezones to CDN regions
      const timezoneRegionMap: Record<string, string> = {
        'America/New_York': 'us-east-1',
        'America/Chicago': 'us-central-1',
        'America/Denver': 'us-west-1',
        'America/Los_Angeles': 'us-west-2',
        'Europe/London': 'eu-west-1',
        'Europe/Paris': 'eu-central-1',
        'Asia/Tokyo': 'ap-northeast-1',
        'Asia/Singapore': 'ap-southeast-1',
        'Australia/Sydney': 'ap-southeast-2'
      };
      
      return timezoneRegionMap[timezone] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect asset type from file extension or explicit type
   */
  private detectAssetType(assetPath: string, explicitType?: string): string {
    if (explicitType) return explicitType;
    
    const extension = assetPath.split('.').pop()?.toLowerCase() || '';
    
    for (const [type, extensions] of Object.entries(this.config.assetTypes)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }
    
    return 'unknown';
  }

  /**
   * Get versioned asset path
   */
  private getAssetVersion(assetPath: string): string {
    const { strategy, prefix } = this.config.versioning;
    
    switch (strategy) {
      case 'hash':
        // In production, this would come from a build manifest
        return `${prefix}${this.generateAssetHash(assetPath)}`;
      case 'timestamp':
        return `${prefix}${Date.now()}`;
      case 'semver':
        return `${prefix}${process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}`;
      default:
        return prefix;
    }
  }

  private generateAssetHash(assetPath: string): string {
    // Simple hash for demo - in production, use actual file hash
    let hash = 0;
    for (let i = 0; i < assetPath.length; i++) {
      const char = assetPath.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Track asset request for analytics
   */
  private trackAssetRequest(assetPath: string, assetType: string, region: string): void {
    // Update metrics
    if (!this.performanceMetrics.hitRates[assetType]) {
      this.performanceMetrics.hitRates[assetType] = 0;
    }
    
    // In a real implementation, this would track actual CDN hits/misses
    this.performanceMetrics.hitRates[assetType] += 1;
  }

  /**
   * Record asset load time
   */
  private recordLoadTime(assetPath: string, loadTime: number): void {
    const assetType = this.detectAssetType(assetPath);
    
    if (!this.performanceMetrics.loadTimes[assetType]) {
      this.performanceMetrics.loadTimes[assetType] = 0;
    }
    
    // Calculate rolling average
    const currentAvg = this.performanceMetrics.loadTimes[assetType];
    this.performanceMetrics.loadTimes[assetType] = (currentAvg + loadTime) / 2;
  }

  /**
   * Record asset loading error
   */
  private recordError(assetPath: string): void {
    const assetType = this.detectAssetType(assetPath);
    
    if (!this.performanceMetrics.errorRates[assetType]) {
      this.performanceMetrics.errorRates[assetType] = 0;
    }
    
    this.performanceMetrics.errorRates[assetType] += 1;
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor navigation timing for CDN performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.performanceMetrics.globalLatency[this.userRegion] = navigation.loadEventEnd - navigation.fetchStart;
          }
        }, 1000);
      });
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): CDNPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update CDN configuration
   */
  updateConfig(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }

  /**
   * Purge asset from CDN cache
   */
  async purgeAsset(assetPath: string): Promise<boolean> {
    if (!this.config.enabled) {
      return true;
    }

    try {
      const response = await fetch('/api/cdn/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetPath })
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to purge asset ${assetPath}:`, error);
      return false;
    }
  }

  /**
   * Warm CDN cache with critical assets
   */
  async warmCache(assetPaths: string[]): Promise<void> {
    const warmPromises = assetPaths.map(async (assetPath) => {
      try {
        const url = this.getAssetUrl(assetPath);
        await fetch(url, { method: 'HEAD' });
      } catch (error) {
        console.warn(`Failed to warm cache for ${assetPath}:`, error);
      }
    });

    await Promise.allSettled(warmPromises);
  }
}
