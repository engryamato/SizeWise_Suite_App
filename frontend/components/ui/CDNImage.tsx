/**
 * CDN-Optimized Image Component
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Enhanced image component with CDN optimization and performance features
 */

'use client';

import React, { useState, useCallback, forwardRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { useCDNImage } from '@/lib/hooks/useCDN';
import { cn } from '@/lib/utils';

export interface CDNImageProps extends Omit<ImageProps, 'src' | 'onLoad' | 'onError' | 'sizes'> {
  src: string;
  alt: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  responsive?: boolean;
  sizes?: string | { width: number; height?: number }[];
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  showErrorState?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  containerClassName?: string;
}

export const CDNImage = forwardRef<HTMLImageElement, CDNImageProps>(({
  src,
  alt,
  quality = 85,
  format = 'webp',
  responsive = false,
  sizes,
  fallbackSrc,
  showLoadingSpinner = true,
  showErrorState = true,
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
    srcSet,
    isLoaded,
    error,
    onLoad,
    onError: onCDNError
  } = useCDNImage(src, {
    quality,
    format,
    responsive,
    sizes: typeof sizes === 'string' ? undefined : sizes,
    width: props.width as number,
    height: props.height as number
  });

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad();
    onLoadComplete?.();
  }, [onLoad, onLoadComplete]);

  const handleError = useCallback((errorEvent: any) => {
    setIsLoading(false);
    setImageError(true);
    
    const error = new Error(`Failed to load image: ${src}`);
    onCDNError(error);
    onError?.(error);
  }, [src, onCDNError, onError]);

  // Use fallback if there's an error and fallback is provided
  const finalSrc = imageError && fallbackSrc ? fallbackSrc : optimizedSrc;

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {/* Loading Spinner */}
      {isLoading && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && showErrorState && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Optimized Image */}
      <Image
        ref={ref}
        src={finalSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...(srcSet && { 
          // @ts-ignore - Next.js Image doesn't have srcSet in types but supports it
          srcSet 
        })}
        {...props}
      />
    </div>
  );
});

CDNImage.displayName = 'CDNImage';

/**
 * CDN-Optimized Background Image Component
 */
export interface CDNBackgroundImageProps {
  src: string;
  alt?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function CDNBackgroundImage({
  src,
  alt = '',
  quality = 85,
  format = 'webp',
  className,
  children,
  overlay = false,
  overlayOpacity = 0.5
}: CDNBackgroundImageProps) {
  const { src: optimizedSrc } = useCDNImage(src, { quality, format });

  return (
    <div 
      className={cn('relative bg-cover bg-center bg-no-repeat', className)}
      style={{ backgroundImage: `url(${optimizedSrc})` }}
      role="img"
      aria-label={alt}
    >
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * CDN-Optimized Avatar Component
 */
export interface CDNAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export function CDNAvatar({
  src,
  alt,
  size = 'md',
  fallback,
  className
}: CDNAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const sizePixels = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  if (!src) {
    return (
      <div className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium',
        sizeClasses[size],
        className
      )}>
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <CDNImage
      src={src}
      alt={alt}
      width={sizePixels[size]}
      height={sizePixels[size]}
      quality={90}
      format="webp"
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
      showLoadingSpinner={false}
      fallbackSrc={fallback}
    />
  );
}

/**
 * CDN-Optimized Gallery Component
 */
export interface CDNGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  quality?: number;
  className?: string;
}

export function CDNGallery({
  images,
  columns = 3,
  gap = 4,
  quality = 80,
  className
}: CDNGalleryProps) {
  return (
    <div 
      className={cn('grid', className)}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {images.map((image, index) => (
        <div key={index} className="relative group">
          <CDNImage
            src={image.src}
            alt={image.alt}
            width={400}
            height={300}
            quality={quality}
            format="webp"
            className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
          />
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
              <p className="text-sm">{image.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * CDN-Optimized Hero Image Component
 */
export interface CDNHeroImageProps {
  src: string;
  alt: string;
  quality?: number;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean;
}

export function CDNHeroImage({
  src,
  alt,
  quality = 90,
  className,
  children,
  priority = true
}: CDNHeroImageProps) {
  const responsiveSizes = [
    { width: 640 },
    { width: 768 },
    { width: 1024 },
    { width: 1280 },
    { width: 1536 },
    { width: 1920 }
  ];

  return (
    <div className={cn('relative w-full h-screen overflow-hidden', className)}>
      <CDNImage
        src={src}
        alt={alt}
        fill
        quality={quality}
        format="webp"
        responsive
        sizes={responsiveSizes}
        priority={priority}
        className="object-cover"
        containerClassName="absolute inset-0"
      />
      {children && (
        <div className="relative z-10 h-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
