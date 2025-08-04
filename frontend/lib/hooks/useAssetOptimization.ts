/**
 * Asset Optimization Hooks
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * React hooks for asset optimization functionality
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { assetOptimizer, AssetOptimizer, OptimizationResult, AssetMetrics } from '@/lib/optimization/asset-optimizer';

export interface UseAssetOptimizationOptions {
  enableAutoOptimization?: boolean;
  preloadCritical?: boolean;
  trackMetrics?: boolean;
}

export interface UseOptimizedImageOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'svg';
  width?: number;
  height?: number;
  progressive?: boolean;
  responsive?: boolean;
  lazy?: boolean;
}

export interface UseOptimized3DModelOptions {
  compression?: 'gzip' | 'brotli' | 'none';
  lodLevel?: number;
  format?: 'glb' | 'gltf' | 'obj' | 'fbx';
  preload?: boolean;
}

/**
 * Main asset optimization hook
 */
export function useAssetOptimization(options: UseAssetOptimizationOptions = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState<AssetMetrics | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const {
    enableAutoOptimization = true,
    preloadCritical = true,
    trackMetrics = true
  } = options;

  // Initialize asset optimization
  useEffect(() => {
    const initialize = async () => {
      try {
        if (preloadCritical) {
          // Preload critical assets for HVAC applications
          const criticalAssets = [
            '/icons/hvac-system.svg',
            '/icons/duct-fitting.svg',
            '/icons/calculator.svg',
            '/models/duct-elbow.glb',
            '/models/duct-tee.glb'
          ];
          
          await assetOptimizer.preloadCriticalAssets(criticalAssets);
        }

        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Asset optimization initialization failed'));
      }
    };

    initialize();
  }, [preloadCritical]);

  // Update metrics periodically
  useEffect(() => {
    if (!trackMetrics || !isInitialized) return;

    const updateMetrics = () => {
      setMetrics(assetOptimizer.getMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [trackMetrics, isInitialized]);

  const optimizeImage = useCallback(async (
    imagePath: string,
    options: UseOptimizedImageOptions = {}
  ): Promise<OptimizationResult> => {
    try {
      const result = await assetOptimizer.optimizeImage(imagePath, options);
      if (trackMetrics) {
        setMetrics(assetOptimizer.getMetrics());
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Image optimization failed');
      setError(error);
      throw error;
    }
  }, [trackMetrics]);

  const optimize3DModel = useCallback(async (
    modelPath: string,
    options: UseOptimized3DModelOptions = {}
  ): Promise<OptimizationResult> => {
    try {
      const result = await assetOptimizer.optimize3DModel(modelPath, options);
      if (trackMetrics) {
        setMetrics(assetOptimizer.getMetrics());
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('3D model optimization failed');
      setError(error);
      throw error;
    }
  }, [trackMetrics]);

  const generateResponsiveImages = useCallback(async (
    imagePath: string,
    options: UseOptimizedImageOptions = {}
  ): Promise<OptimizationResult[]> => {
    try {
      const results = await assetOptimizer.generateResponsiveImages(imagePath, options);
      if (trackMetrics) {
        setMetrics(assetOptimizer.getMetrics());
      }
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Responsive image generation failed');
      setError(error);
      throw error;
    }
  }, [trackMetrics]);

  const clearCache = useCallback(() => {
    assetOptimizer.clearCache();
    if (trackMetrics) {
      setMetrics(assetOptimizer.getMetrics());
    }
  }, [trackMetrics]);

  return {
    isInitialized,
    metrics,
    error,
    optimizeImage,
    optimize3DModel,
    generateResponsiveImages,
    clearCache
  };
}

/**
 * Hook for optimized image loading
 */
export function useOptimizedImage(
  imagePath: string,
  options: UseOptimizedImageOptions = {}
) {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { optimizeImage } = useAssetOptimization();

  useEffect(() => {
    if (!imagePath) {
      setIsLoading(false);
      return;
    }

    const optimize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await optimizeImage(imagePath, options);
        setOptimizationResult(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Image optimization failed'));
      } finally {
        setIsLoading(false);
      }
    };

    optimize();
  }, [imagePath, optimizeImage, JSON.stringify(options)]);

  const src = optimizationResult?.optimizedUrl || imagePath;
  const metadata = optimizationResult?.metadata;

  return {
    src,
    metadata,
    optimizationResult,
    isLoading,
    error,
    compressionRatio: optimizationResult?.compressionRatio || 0
  };
}

/**
 * Hook for optimized 3D model loading
 */
export function useOptimized3DModel(
  modelPath: string,
  options: UseOptimized3DModelOptions = {}
) {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { optimize3DModel } = useAssetOptimization();

  useEffect(() => {
    if (!modelPath) {
      setIsLoading(false);
      return;
    }

    const optimize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await optimize3DModel(modelPath, options);
        setOptimizationResult(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('3D model optimization failed'));
      } finally {
        setIsLoading(false);
      }
    };

    optimize();
  }, [modelPath, optimize3DModel, JSON.stringify(options)]);

  const url = optimizationResult?.optimizedUrl || modelPath;
  const metadata = optimizationResult?.metadata;

  return {
    url,
    metadata,
    optimizationResult,
    isLoading,
    error,
    compressionRatio: optimizationResult?.compressionRatio || 0
  };
}

/**
 * Hook for responsive image sets
 */
export function useResponsiveImages(
  imagePath: string,
  options: UseOptimizedImageOptions = {}
) {
  const [responsiveImages, setResponsiveImages] = useState<OptimizationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { generateResponsiveImages } = useAssetOptimization();

  useEffect(() => {
    if (!imagePath) {
      setIsLoading(false);
      return;
    }

    const generate = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const results = await generateResponsiveImages(imagePath, options);
        setResponsiveImages(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Responsive image generation failed'));
      } finally {
        setIsLoading(false);
      }
    };

    generate();
  }, [imagePath, generateResponsiveImages, JSON.stringify(options)]);

  const srcSet = useMemo(() => {
    return responsiveImages
      .map(result => `${result.optimizedUrl} ${result.metadata.width}w`)
      .join(', ');
  }, [responsiveImages]);

  const sizes = useMemo(() => {
    // Generate responsive sizes string
    const breakpoints = [
      '(max-width: 640px) 100vw',
      '(max-width: 1024px) 50vw',
      '33vw'
    ];
    return breakpoints.join(', ');
  }, []);

  return {
    responsiveImages,
    srcSet,
    sizes,
    isLoading,
    error,
    totalCompressionRatio: responsiveImages.length > 0 
      ? responsiveImages.reduce((sum, img) => sum + img.compressionRatio, 0) / responsiveImages.length 
      : 0
  };
}

/**
 * Hook for asset optimization metrics
 */
export function useAssetMetrics() {
  const { metrics, isInitialized } = useAssetOptimization({ trackMetrics: true });

  const formattedMetrics = useMemo(() => {
    if (!metrics) return null;

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatPercentage = (ratio: number) => {
      return `${(ratio * 100).toFixed(1)}%`;
    };

    return {
      totalAssets: metrics.totalAssets,
      originalSize: formatBytes(metrics.totalOriginalSize),
      optimizedSize: formatBytes(metrics.totalOptimizedSize),
      savedSize: formatBytes(metrics.totalOriginalSize - metrics.totalOptimizedSize),
      compressionRatio: formatPercentage(metrics.averageCompressionRatio),
      optimizationsByType: Object.entries(metrics.optimizationsByType).map(([type, data]) => ({
        type,
        count: data.count,
        originalSize: formatBytes(data.originalSize),
        optimizedSize: formatBytes(data.optimizedSize),
        compressionRatio: formatPercentage(data.compressionRatio)
      }))
    };
  }, [metrics]);

  return {
    metrics: formattedMetrics,
    rawMetrics: metrics,
    isInitialized
  };
}
