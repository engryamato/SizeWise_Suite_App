/**
 * VideoBackground Component
 * 
 * Reusable video background component with proper video handling,
 * fallbacks, and performance optimizations for authentication screens
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoBackgroundProps } from './types';
import { VIDEO_CONFIG } from './config';
import { cn } from '@/lib/utils';

// =============================================================================
// VideoBackground Component
// =============================================================================

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoUrl,
  fallbackImage,
  className = '',
  overlayOpacity = VIDEO_CONFIG.overlayOpacity,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle video load success
  const handleVideoLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  // Handle video load error
  const handleVideoError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    console.warn('Video background failed to load, falling back to image or gradient');
  }, []);

  // Handle video play state
  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Handle video pause state
  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Attempt to play video
  const playVideo = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
      } catch (error) {
        console.warn('Video autoplay failed:', error);
        // Autoplay failed, but this is expected in many browsers
        // The video will still be available for user interaction
      }
    }
  }, []);

  // Initialize video when component mounts
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const video = videoRef.current;
      
      // Set up event listeners
      video.addEventListener('loadeddata', handleVideoLoad);
      video.addEventListener('error', handleVideoError);
      video.addEventListener('play', handleVideoPlay);
      video.addEventListener('pause', handleVideoPause);
      
      // Attempt to play video
      playVideo();
      
      // Cleanup event listeners
      return () => {
        video.removeEventListener('loadeddata', handleVideoLoad);
        video.removeEventListener('error', handleVideoError);
        video.removeEventListener('play', handleVideoPlay);
        video.removeEventListener('pause', handleVideoPause);
      };
    }
  }, [videoUrl, handleVideoLoad, handleVideoError, handleVideoPlay, handleVideoPause, playVideo]);

  // Handle intersection observer for performance optimization
  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playVideo();
          } else if (videoRef.current) {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, [playVideo]);

  // Render fallback background
  const renderFallback = () => {
    if (fallbackImage) {
      return (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
          role="img"
          aria-label="Background image"
        />
      );
    }

    // Default gradient fallback
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900" />
    );
  };

  return (
    <div className={cn('absolute inset-0 w-full h-full overflow-hidden z-0', className)}>
      {/* Video Element */}
      {videoUrl && !hasError && (
        <video
          ref={videoRef}
          className={cn(
            'absolute inset-0 min-w-full min-h-full object-cover w-auto h-auto transition-opacity duration-1000',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          autoPlay={VIDEO_CONFIG.autoPlay}
          loop={VIDEO_CONFIG.loop}
          muted={VIDEO_CONFIG.muted}
          playsInline={VIDEO_CONFIG.playsInline}
          preload="metadata"
          aria-hidden="true"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl.replace('.mp4', '.webm')} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Fallback Background */}
      {(!videoUrl || hasError || !isLoaded) && renderFallback()}

      {/* Overlay */}
      <div
        className="absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
        }}
        aria-hidden="true"
      />

      {/* Loading State */}
      {videoUrl && !isLoaded && !hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Animated Background Component (Alternative)
// =============================================================================

interface AnimatedBackgroundProps {
  className?: string;
  variant?: 'gradient' | 'particles' | 'waves';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className = '',
  variant = 'gradient',
}) => {
  const renderVariant = () => {
    switch (variant) {
      case 'particles':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated particles - simplified for Phase 1 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      
      case 'waves':
        return (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
            <div className="absolute inset-0 opacity-30">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1200 800"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                    <stop offset="100%" stopColor="rgba(147, 51, 234, 0.3)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,400 C300,300 600,500 1200,400 L1200,800 L0,800 Z"
                  fill="url(#wave-gradient)"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 animate-gradient-x" />
        );
    }
  };

  return (
    <div className={cn('absolute inset-0 w-full h-full overflow-hidden z-0', className)}>
      {renderVariant()}
      <div className="absolute inset-0 bg-black/40 z-10" />
    </div>
  );
};

// =============================================================================
// Export Components
// =============================================================================

export default VideoBackground;
