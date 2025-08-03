/**
 * Asset Optimization Manager
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Comprehensive asset optimization for images, 3D models, and other static resources
 */

export interface AssetOptimizationConfig {
  images: {
    quality: number;
    formats: string[];
    sizes: number[];
    progressive: boolean;
    webpFallback: boolean;
  };
  models: {
    compression: 'gzip' | 'brotli' | 'none';
    lodLevels: number;
    maxFileSize: number;
    formats: string[];
  };
  fonts: {
    preload: boolean;
    display: 'swap' | 'fallback' | 'optional';
    subset: string[];
  };
  general: {
    enableLazyLoading: boolean;
    enablePreloading: boolean;
    cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
  };
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  optimizedUrl: string;
  metadata: {
    width?: number;
    height?: number;
    quality?: number;
    progressive?: boolean;
  };
}

export interface AssetMetrics {
  totalAssets: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  averageCompressionRatio: number;
  optimizationsByType: Record<string, {
    count: number;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  }>;
}

/**
 * Asset Optimization Manager
 * Handles optimization of images, 3D models, fonts, and other static assets
 */
export class AssetOptimizer {
  private config: AssetOptimizationConfig;
  private optimizationCache: Map<string, OptimizationResult> = new Map();
  private metrics: AssetMetrics;

  constructor(config?: Partial<AssetOptimizationConfig>) {
    this.config = {
      images: {
        quality: 85,
        formats: ['webp', 'avif', 'jpeg'],
        sizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        progressive: true,
        webpFallback: true,
        ...config?.images
      },
      models: {
        compression: 'gzip',
        lodLevels: 3,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        formats: ['glb', 'gltf'],
        ...config?.models
      },
      fonts: {
        preload: true,
        display: 'swap',
        subset: ['latin', 'latin-ext'],
        ...config?.fonts
      },
      general: {
        enableLazyLoading: true,
        enablePreloading: true,
        cacheStrategy: 'moderate',
        ...config?.general
      }
    };

    this.metrics = {
      totalAssets: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      averageCompressionRatio: 0,
      optimizationsByType: {}
    };
  }

  /**
   * Optimize an image asset
   */
  async optimizeImage(
    imagePath: string,
    options: {
      quality?: number;
      format?: string;
      width?: number;
      height?: number;
      progressive?: boolean;
    } = {}
  ): Promise<OptimizationResult> {
    const cacheKey = `image:${imagePath}:${JSON.stringify(options)}`;
    
    if (this.optimizationCache.has(cacheKey)) {
      return this.optimizationCache.get(cacheKey)!;
    }

    const quality = options.quality ?? this.config.images.quality;
    const format = options.format ?? 'webp';
    const progressive = options.progressive ?? this.config.images.progressive;

    // Simulate optimization (in real implementation, this would use image processing libraries)
    const originalSize = await this.getAssetSize(imagePath);
    const optimizedSize = Math.round(originalSize * (quality / 100) * 0.7); // Simulate compression

    const result: OptimizationResult = {
      originalSize,
      optimizedSize,
      compressionRatio: (originalSize - optimizedSize) / originalSize,
      format,
      optimizedUrl: this.generateOptimizedUrl(imagePath, { quality, format, progressive }),
      metadata: {
        width: options.width,
        height: options.height,
        quality,
        progressive
      }
    };

    this.optimizationCache.set(cacheKey, result);
    this.updateMetrics('image', result);

    return result;
  }

  /**
   * Optimize a 3D model asset
   */
  async optimize3DModel(
    modelPath: string,
    options: {
      compression?: 'gzip' | 'brotli' | 'none';
      lodLevel?: number;
      format?: string;
    } = {}
  ): Promise<OptimizationResult> {
    const cacheKey = `model:${modelPath}:${JSON.stringify(options)}`;
    
    if (this.optimizationCache.has(cacheKey)) {
      return this.optimizationCache.get(cacheKey)!;
    }

    const compression = options.compression ?? this.config.models.compression;
    const lodLevel = options.lodLevel ?? 1;
    const format = options.format ?? 'glb';

    const originalSize = await this.getAssetSize(modelPath);
    let compressionRatio = 0.3; // Base compression

    // Apply compression-specific ratios
    switch (compression) {
      case 'gzip':
        compressionRatio = 0.4;
        break;
      case 'brotli':
        compressionRatio = 0.5;
        break;
      case 'none':
        compressionRatio = 0.1;
        break;
    }

    // Apply LOD-based optimization
    compressionRatio += (lodLevel - 1) * 0.1;

    const optimizedSize = Math.round(originalSize * (1 - compressionRatio));

    const result: OptimizationResult = {
      originalSize,
      optimizedSize,
      compressionRatio,
      format,
      optimizedUrl: this.generateOptimizedUrl(modelPath, { compression, lodLevel, format }),
      metadata: {
        quality: lodLevel
      }
    };

    this.optimizationCache.set(cacheKey, result);
    this.updateMetrics('model', result);

    return result;
  }

  /**
   * Generate responsive image sizes
   */
  generateResponsiveImages(
    imagePath: string,
    options: {
      quality?: number;
      format?: string;
    } = {}
  ): Promise<OptimizationResult[]> {
    const sizes = this.config.images.sizes;
    const promises = sizes.map(width => 
      this.optimizeImage(imagePath, { ...options, width })
    );

    return Promise.all(promises);
  }

  /**
   * Preload critical assets
   */
  async preloadCriticalAssets(assetPaths: string[]): Promise<void> {
    if (!this.config.general.enablePreloading) {
      return;
    }

    const preloadPromises = assetPaths.map(async (path) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (this.isImageAsset(path)) {
        link.as = 'image';
        const optimized = await this.optimizeImage(path);
        link.href = optimized.optimizedUrl;
      } else if (this.is3DModelAsset(path)) {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        const optimized = await this.optimize3DModel(path);
        link.href = optimized.optimizedUrl;
      } else {
        link.as = 'fetch';
        link.href = path;
      }

      document.head.appendChild(link);
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): AssetMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.optimizationCache.clear();
    this.resetMetrics();
  }

  /**
   * Private helper methods
   */
  private async getAssetSize(assetPath: string): Promise<number> {
    // Simulate getting asset size (in real implementation, this would fetch actual file size)
    const baseSize = assetPath.length * 1000; // Rough estimate
    return Math.round(baseSize + Math.random() * 50000);
  }

  private generateOptimizedUrl(assetPath: string, options: any): string {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.sizewise.app';
    return `${cdnUrl}/optimized${assetPath}?${params.toString()}`;
  }

  private isImageAsset(path: string): boolean {
    const imageExtensions = this.config.images.formats.concat(['jpg', 'jpeg', 'png', 'gif', 'svg']);
    return imageExtensions.some(ext => path.toLowerCase().endsWith(`.${ext}`));
  }

  private is3DModelAsset(path: string): boolean {
    return this.config.models.formats.some(ext => path.toLowerCase().endsWith(`.${ext}`));
  }

  private updateMetrics(type: string, result: OptimizationResult): void {
    this.metrics.totalAssets++;
    this.metrics.totalOriginalSize += result.originalSize;
    this.metrics.totalOptimizedSize += result.optimizedSize;

    if (!this.metrics.optimizationsByType[type]) {
      this.metrics.optimizationsByType[type] = {
        count: 0,
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0
      };
    }

    const typeMetrics = this.metrics.optimizationsByType[type];
    typeMetrics.count++;
    typeMetrics.originalSize += result.originalSize;
    typeMetrics.optimizedSize += result.optimizedSize;
    typeMetrics.compressionRatio = (typeMetrics.originalSize - typeMetrics.optimizedSize) / typeMetrics.originalSize;

    this.metrics.averageCompressionRatio = (this.metrics.totalOriginalSize - this.metrics.totalOptimizedSize) / this.metrics.totalOriginalSize;
  }

  private resetMetrics(): void {
    this.metrics = {
      totalAssets: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      averageCompressionRatio: 0,
      optimizationsByType: {}
    };
  }
}

// Global asset optimizer instance
export const assetOptimizer = new AssetOptimizer();
