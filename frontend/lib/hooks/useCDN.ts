/**
 * CDN Hook
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * React hook for CDN asset management and optimization
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { CDNManager, CDNConfig, CDNPerformanceMetrics } from '@/lib/cdn/cdn-manager';

export interface CDNHookOptions {
  enabled?: boolean;
  preloadCriticalAssets?: boolean;
  enablePerformanceMonitoring?: boolean;
  autoOptimizeImages?: boolean;
}

export interface CDNAssetOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  lazy?: boolean;
}

export function useCDN(options: CDNHookOptions = {}) {
  const {
    enabled = true,
    preloadCriticalAssets = true,
    enablePerformanceMonitoring = true,
    autoOptimizeImages = true
  } = options;

  const [cdnManager, setCdnManager] = useState<CDNManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<CDNPerformanceMetrics | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // CDN Configuration
  const cdnConfig: CDNConfig = useMemo(() => ({
    enabled,
    baseUrl: process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.sizewise.app',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    fallbackUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    assetTypes: {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
      models: ['glb', 'gltf', 'obj', 'fbx', 'dae'],
      documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
      fonts: ['woff', 'woff2', 'ttf', 'otf', 'eot'],
      scripts: ['js', 'mjs', 'ts'],
      styles: ['css', 'scss', 'sass']
    },
    cacheHeaders: {
      images: { maxAge: 31536000, immutable: true, public: true }, // 1 year
      models: { maxAge: 2592000, immutable: true, public: true },  // 30 days
      documents: { maxAge: 86400, immutable: false, public: false }, // 1 day
      fonts: { maxAge: 31536000, immutable: true, public: true },  // 1 year
      scripts: { maxAge: 31536000, immutable: true, public: true }, // 1 year
      styles: { maxAge: 31536000, immutable: true, public: true }   // 1 year
    },
    versioning: {
      strategy: 'hash',
      prefix: 'v'
    }
  }), [enabled]);

  // Initialize CDN Manager
  useEffect(() => {
    try {
      const manager = CDNManager.getInstance(cdnConfig);
      setCdnManager(manager);
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize CDN'));
      setIsInitialized(false);
    }
  }, [cdnConfig]);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring || !cdnManager) return;

    const updateMetrics = () => {
      const metrics = cdnManager.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [enablePerformanceMonitoring, cdnManager]);

  // Preload critical assets
  useEffect(() => {
    if (!preloadCriticalAssets || !cdnManager) return;

    const criticalAssets = [
      '/images/logo.svg',
      '/images/icons/hvac-icon.svg',
      '/fonts/inter-var.woff2',
      '/images/backgrounds/hero-bg.webp'
    ];

    cdnManager.preloadAssets(criticalAssets).catch(error => {
      console.warn('Failed to preload critical assets:', error);
    });
  }, [preloadCriticalAssets, cdnManager]);

  /**
   * Get optimized asset URL
   */
  const getAssetUrl = useCallback((
    assetPath: string,
    options: CDNAssetOptions = {}
  ): string => {
    if (!cdnManager) {
      return assetPath;
    }

    const cdnOptions: any = {};

    // Auto-optimize images if enabled
    if (autoOptimizeImages && isImageAsset(assetPath)) {
      cdnOptions.format = options.format || 'webp';
      cdnOptions.quality = options.quality || 85;
      
      if (options.width) cdnOptions.width = options.width;
      if (options.height) cdnOptions.height = options.height;
    }

    return cdnManager.getAssetUrl(assetPath, cdnOptions);
  }, [cdnManager, autoOptimizeImages]);

  /**
   * Get optimized image URL with responsive sizing
   */
  const getImageUrl = useCallback((
    imagePath: string,
    options: CDNAssetOptions & {
      sizes?: { width: number; height?: number }[];
      srcSet?: boolean;
    } = {}
  ): string | { src: string; srcSet?: string } => {
    if (!cdnManager) {
      return imagePath;
    }

    const { sizes, srcSet, ...cdnOptions } = options;

    if (srcSet && sizes) {
      // Generate srcSet for responsive images
      const srcSetEntries = sizes.map(size => {
        const url = cdnManager.getAssetUrl(imagePath, {
          ...cdnOptions,
          width: size.width,
          height: size.height
        });
        return `${url} ${size.width}w`;
      });

      return {
        src: getAssetUrl(imagePath, cdnOptions),
        srcSet: srcSetEntries.join(', ')
      };
    }

    return getAssetUrl(imagePath, cdnOptions);
  }, [cdnManager, getAssetUrl]);

  /**
   * Get optimized 3D model URL
   */
  const get3DModelUrl = useCallback((
    modelPath: string,
    options: {
      lod?: 'high' | 'medium' | 'low';
      compression?: 'gzip' | 'brotli' | 'none';
      format?: 'gltf' | 'glb' | 'obj';
    } = {}
  ): string => {
    if (!cdnManager) {
      return modelPath;
    }

    return cdnManager.get3DModelUrl(modelPath, options);
  }, [cdnManager]);

  /**
   * Preload specific assets
   */
  const preloadAssets = useCallback(async (assetPaths: string[]): Promise<void> => {
    if (!cdnManager) {
      throw new Error('CDN not initialized');
    }

    await cdnManager.preloadAssets(assetPaths);
  }, [cdnManager]);

  /**
   * Purge asset from CDN cache
   */
  const purgeAsset = useCallback(async (assetPath: string): Promise<boolean> => {
    if (!cdnManager) {
      return false;
    }

    return cdnManager.purgeAsset(assetPath);
  }, [cdnManager]);

  /**
   * Warm CDN cache
   */
  const warmCache = useCallback(async (assetPaths: string[]): Promise<void> => {
    if (!cdnManager) {
      throw new Error('CDN not initialized');
    }

    await cdnManager.warmCache(assetPaths);
  }, [cdnManager]);

  /**
   * Get CDN performance metrics
   */
  const getMetrics = useCallback((): CDNPerformanceMetrics | null => {
    return performanceMetrics;
  }, [performanceMetrics]);

  return {
    // State
    isInitialized,
    error,
    performanceMetrics,

    // Asset URL generation
    getAssetUrl,
    getImageUrl,
    get3DModelUrl,

    // Cache management
    preloadAssets,
    purgeAsset,
    warmCache,

    // Monitoring
    getMetrics
  };
}

/**
 * Hook for optimized image loading with CDN
 */
export function useCDNImage(
  imagePath: string,
  options: CDNAssetOptions & {
    responsive?: boolean;
    sizes?: { width: number; height?: number }[];
  } = {}
) {
  const { getImageUrl } = useCDN();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const imageData = useMemo(() => {
    if (options.responsive && options.sizes) {
      return getImageUrl(imagePath, {
        ...options,
        srcSet: true
      });
    }
    return { src: getImageUrl(imagePath, options) as string };
  }, [imagePath, options, getImageUrl]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    setIsLoaded(false);
    setError(err);
  }, []);

  return {
    ...(typeof imageData === 'object' && imageData !== null ? imageData : {}),
    isLoaded,
    error,
    onLoad: handleLoad,
    onError: handleError
  };
}

/**
 * Hook for 3D model loading with CDN optimization
 */
export function useCDN3DModel(
  modelPath: string,
  options: {
    lod?: 'high' | 'medium' | 'low';
    preload?: boolean;
  } = {}
) {
  const { get3DModelUrl, preloadAssets } = useCDN();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const modelUrl = useMemo(() => {
    return get3DModelUrl(modelPath, options);
  }, [modelPath, options, get3DModelUrl]);

  // Preload if requested
  useEffect(() => {
    if (options.preload && modelUrl) {
      preloadAssets([modelPath]).catch(err => {
        setError(err);
      });
    }
  }, [options.preload, modelPath, modelUrl, preloadAssets]);

  return {
    modelUrl,
    isLoaded,
    error,
    setIsLoaded,
    setError
  };
}

// Helper function to detect image assets
function isImageAsset(assetPath: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];
  const extension = assetPath.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(extension || '');
}
