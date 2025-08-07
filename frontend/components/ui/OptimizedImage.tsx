/**
 * Optimized Image Components
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * High-performance image components with automatic optimization
 */

'use client';

import React, { useState, useCallback, forwardRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { useOptimizedImage, useResponsiveImages, useAssetMetrics } from '@/lib/hooks/useAssetOptimization';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'svg';
  progressive?: boolean;
  lazy?: boolean;
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  showErrorState?: boolean;
  showCompressionInfo?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  containerClassName?: string;
}

export interface ResponsiveImageProps extends OptimizedImageProps {
  responsive?: boolean;
  breakpoints?: { width: number; height?: number }[];
}

/**
 * Optimized Image Component with automatic compression and format optimization
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  quality = 85,
  format = 'webp',
  progressive = true,
  lazy = true,
  fallbackSrc,
  showLoadingSpinner = true,
  showErrorState = true,
  showCompressionInfo = false,
  onLoadComplete,
  onError,
  className,
  containerClassName,
  priority = false,
  ...props
}, ref) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    src: optimizedSrc,
    metadata,
    optimizationResult,
    isLoading: isOptimizing,
    error: optimizationError,
    compressionRatio
  } = useOptimizedImage(src, {
    quality,
    format,
    progressive,
    lazy,
    width: props.width as number,
    height: props.height as number
  });

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    setIsLoading(false);
    if (optimizationError) {
      onError?.(optimizationError);
    } else {
      const error = new Error(`Failed to load image: ${src}`);
      onError?.(error);
    }
  }, [optimizationError, onError, src]);

  const displaySrc = imageError && fallbackSrc ? fallbackSrc : optimizedSrc;

  return (
    <div className={cn('relative', containerClassName)}>
      {/* Loading Spinner */}
      {showLoadingSpinner && (isLoading || isOptimizing) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {showErrorState && imageError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Optimized Image */}
      <Image
        ref={ref}
        src={displaySrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleImageError}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          (isLoading || isOptimizing) && 'opacity-0',
          className
        )}
        {...props}
      />

      {/* Compression Info */}
      {showCompressionInfo && optimizationResult && !isLoading && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {(compressionRatio * 100).toFixed(1)}% saved
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Responsive Image Component with multiple breakpoints
 */
export const ResponsiveImage = forwardRef<HTMLImageElement, ResponsiveImageProps>(({
  src,
  alt,
  responsive = true,
  breakpoints,
  quality = 85,
  format = 'webp',
  className,
  containerClassName,
  onError,
  ...props
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const {
    responsiveImages,
    srcSet,
    sizes,
    isLoading: isGenerating,
    error,
    totalCompressionRatio
  } = useResponsiveImages(src, {
    quality,
    format,
    responsive
  });

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleResponsiveImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    setIsLoading(false);
    // Call original onError if provided
    if (onError) {
      const error = new Error(`Image failed to load: ${src}`);
      onError(error);
    }
  }, [onError, src]);


  if (!responsive) {
    return (
      <OptimizedImage
        ref={ref}
        src={src}
        alt={alt}
        quality={quality}
        format={format}
        className={className}
        containerClassName={containerClassName}
        {...props}
      />
    );
  }

  return (
    <div className={cn('relative', containerClassName)}>
      {/* Loading State */}
      {(isLoading || isGenerating) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Failed to load responsive image</p>
          </div>
        </div>
      )}

      {/* Responsive Image */}
      {srcSet && (
        <Image
          ref={ref}
          src={responsiveImages[0]?.optimizedUrl || src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleResponsiveImageError}
          {...(srcSet && {
            // @ts-ignore - Next.js Image doesn't have srcSet in types but supports it
            srcSet
          })}
          {...(sizes && { sizes })}
          className={cn(
            'transition-opacity duration-300',
            (isLoading || isGenerating) && 'opacity-0',
            className
          )}
          {...props}
        />
      )}

      {/* Compression Info */}
      {responsiveImages.length > 0 && !isLoading && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {responsiveImages.length} sizes • {(totalCompressionRatio * 100).toFixed(1)}% saved
        </div>
      )}
    </div>
  );
});

ResponsiveImage.displayName = 'ResponsiveImage';

/**
 * HVAC Icon Component with optimization
 */
export interface HVACIconProps {
  icon: 'duct' | 'fitting' | 'calculator' | 'system' | 'fan' | 'damper';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  optimized?: boolean;
}

export function HVACIcon({ 
  icon, 
  size = 'md', 
  className, 
  optimized = true 
}: HVACIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const iconPaths = {
    duct: '/icons/hvac/duct.svg',
    fitting: '/icons/hvac/fitting.svg',
    calculator: '/icons/hvac/calculator.svg',
    system: '/icons/hvac/system.svg',
    fan: '/icons/hvac/fan.svg',
    damper: '/icons/hvac/damper.svg'
  };

  const iconSrc = iconPaths[icon] || iconPaths.system;

  if (optimized) {
    return (
      <OptimizedImage
        src={iconSrc}
        alt={`HVAC ${icon} icon`}
        width={size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48}
        height={size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48}
        format="svg"
        className={cn(sizeClasses[size], className)}
        priority={true}
      />
    );
  }

  return (
    <Image
      src={iconSrc}
      alt={`HVAC ${icon} icon`}
      width={size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48}
      height={size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 48}
      className={cn(sizeClasses[size], className)}
    />
  );
}

/**
 * Progressive Image Component with blur-up effect
 */
export interface ProgressiveImageProps extends OptimizedImageProps {
  blurDataURL?: string;
  placeholder?: 'blur' | 'empty';
}

export const ProgressiveImage = forwardRef<HTMLImageElement, ProgressiveImageProps>(({
  src,
  alt,
  blurDataURL,
  placeholder = 'blur',
  className,
  ...props
}, ref) => {
  return (
    <OptimizedImage
      ref={ref}
      src={src}
      alt={alt}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      className={cn('transition-all duration-500', className)}
      {...props}
    />
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';

/**
 * Asset Optimization Metrics Display Component
 */
export interface AssetMetricsDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export function AssetMetricsDisplay({
  className,
  showDetails = false
}: AssetMetricsDisplayProps) {
  const { metrics, isInitialized } = useAssetMetrics();

  if (!isInitialized || !metrics) {
    return (
      <div className={cn('p-4 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
        <p className="text-sm text-gray-500">Loading optimization metrics...</p>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border', className)}>
      <h3 className="text-lg font-semibold mb-3">Asset Optimization</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{metrics.totalAssets}</p>
          <p className="text-sm text-gray-500">Assets</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{metrics.compressionRatio}</p>
          <p className="text-sm text-gray-500">Saved</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{metrics.originalSize}</p>
          <p className="text-sm text-gray-500">Original</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{metrics.optimizedSize}</p>
          <p className="text-sm text-gray-500">Optimized</p>
        </div>
      </div>

      {showDetails && metrics.optimizationsByType.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">By Asset Type</h4>
          <div className="space-y-2">
            {metrics.optimizationsByType.map((type) => (
              <div key={type.type} className="flex justify-between items-center text-sm">
                <span className="capitalize">{type.type} ({type.count})</span>
                <span className="font-medium text-green-600">{type.compressionRatio}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
