/**
 * Touch Snap Indicator Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Touch-optimized snap indicator component with enhanced visibility, haptic feedback,
 * and larger touch targets for professional HVAC design workflows. Provides clear
 * visual feedback for snap points with touch-specific animations and interactions.
 * 
 * @fileoverview Touch-optimized snap indicator with enhanced visibility
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SnapPoint, SnapPointType } from '@/types/air-duct-sizer';
import { TouchGestureHandler } from '@/lib/snap-logic';

/**
 * Touch snap indicator size types
 */
export type TouchSnapSize = 
  | 'sm'    // 24px for dense areas
  | 'md'    // 32px standard
  | 'lg'    // 44px for primary snaps
  | 'xl';   // 56px for important snaps

/**
 * Touch snap indicator props
 */
export interface TouchSnapIndicatorProps {
  snapPoint: SnapPoint;
  position: { x: number; y: number };
  isActive?: boolean;
  isHovered?: boolean;
  size?: TouchSnapSize;
  showLabel?: boolean;
  enableHapticFeedback?: boolean;
  enableTouchFeedback?: boolean;
  onSnapSelect?: (snapPoint: SnapPoint) => void;
  onSnapHover?: (snapPoint: SnapPoint) => void;
  className?: string;
  zoomLevel?: number;
}

/**
 * Touch snap indicator component
 */
export const TouchSnapIndicator: React.FC<TouchSnapIndicatorProps> = ({
  snapPoint,
  position,
  isActive = false,
  isHovered = false,
  size = 'md',
  showLabel = true,
  enableHapticFeedback = true,
  enableTouchFeedback = true,
  onSnapSelect,
  onSnapHover,
  className,
  zoomLevel = 1
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState<{
    visible: boolean;
    scale: number;
  }>({ visible: false, scale: 1 });

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(TouchGestureHandler.isTouchDevice());
  }, []);

  // Trigger haptic feedback
  const triggerHapticFeedback = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !TouchGestureHandler.supportsHapticFeedback()) return;

    const patterns = {
      light: 10,
      medium: 25,
      heavy: 50
    };

    navigator.vibrate(patterns[pattern]);
  }, [enableHapticFeedback]);

  // Show touch feedback
  const showTouchFeedback = useCallback(() => {
    if (!enableTouchFeedback) return;

    setTouchFeedback({ visible: true, scale: 1.3 });
    
    setTimeout(() => {
      setTouchFeedback({ visible: false, scale: 1 });
    }, 200);
  }, [enableTouchFeedback]);

  // Handle touch interaction
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    showTouchFeedback();
    triggerHapticFeedback('light');
    onSnapHover?.(snapPoint);
  }, [showTouchFeedback, triggerHapticFeedback, onSnapHover, snapPoint]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    triggerHapticFeedback('medium');
    onSnapSelect?.(snapPoint);
  }, [triggerHapticFeedback, onSnapSelect, snapPoint]);

  // Handle mouse interaction for non-touch devices
  const handleMouseEnter = useCallback(() => {
    if (!isTouchDevice) {
      onSnapHover?.(snapPoint);
    }
  }, [isTouchDevice, onSnapHover, snapPoint]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!isTouchDevice) {
      event.preventDefault();
      event.stopPropagation();
      onSnapSelect?.(snapPoint);
    }
  }, [isTouchDevice, onSnapSelect, snapPoint]);

  // Get snap type styles
  const getSnapTypeStyles = (type: SnapPointType) => {
    const styles = {
      endpoint: {
        color: 'bg-blue-500',
        border: 'border-blue-600',
        shadow: 'shadow-blue-500/50',
        glow: 'shadow-lg shadow-blue-500/30'
      },
      centerline: {
        color: 'bg-green-500',
        border: 'border-green-600',
        shadow: 'shadow-green-500/50',
        glow: 'shadow-lg shadow-green-500/30'
      },
      midpoint: {
        color: 'bg-yellow-500',
        border: 'border-yellow-600',
        shadow: 'shadow-yellow-500/50',
        glow: 'shadow-lg shadow-yellow-500/30'
      },
      intersection: {
        color: 'bg-red-500',
        border: 'border-red-600',
        shadow: 'shadow-red-500/50',
        glow: 'shadow-lg shadow-red-500/30'
      },
      perpendicular: {
        color: 'bg-purple-500',
        border: 'border-purple-600',
        shadow: 'shadow-purple-500/50',
        glow: 'shadow-lg shadow-purple-500/30'
      },
      grid: {
        color: 'bg-gray-400',
        border: 'border-gray-500',
        shadow: 'shadow-gray-500/50',
        glow: 'shadow-lg shadow-gray-500/30'
      }
    };
    return styles[type] || styles.centerline;
  };

  // Get size styles
  const getSizeStyles = (size: TouchSnapSize) => {
    const baseSize = isTouchDevice ? 1.2 : 1; // 20% larger on touch devices
    
    const sizes = {
      sm: {
        width: Math.max(24 * baseSize, 24),
        height: Math.max(24 * baseSize, 24),
        className: 'w-6 h-6'
      },
      md: {
        width: Math.max(32 * baseSize, 32),
        height: Math.max(32 * baseSize, 32),
        className: 'w-8 h-8'
      },
      lg: {
        width: Math.max(44 * baseSize, 44),
        height: Math.max(44 * baseSize, 44),
        className: 'w-11 h-11'
      },
      xl: {
        width: Math.max(56 * baseSize, 56),
        height: Math.max(56 * baseSize, 56),
        className: 'w-14 h-14'
      }
    };
    return sizes[size];
  };

  // Get label text
  const getLabelText = (type: SnapPointType) => {
    const labels = {
      endpoint: 'End',
      centerline: 'Line',
      midpoint: 'Mid',
      intersection: 'Cross',
      perpendicular: 'Perp',
      grid: 'Grid'
    };
    return labels[type] || 'Snap';
  };

  // Calculate responsive size based on zoom level
  const getResponsiveSize = () => {
    const baseSize = getSizeStyles(size);
    const zoomFactor = Math.max(0.5, Math.min(2, 1 / zoomLevel));
    
    return {
      width: baseSize.width * zoomFactor,
      height: baseSize.height * zoomFactor
    };
  };

  const typeStyles = getSnapTypeStyles(snapPoint.type);
  const sizeStyles = getSizeStyles(size);
  const responsiveSize = getResponsiveSize();

  return (
    <div
      className={cn(
        'absolute pointer-events-auto cursor-pointer',
        'transform -translate-x-1/2 -translate-y-1/2',
        'transition-all duration-150 ease-out',
        'select-none touch-manipulation',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: responsiveSize.width,
        height: responsiveSize.height,
        transform: `translate(-50%, -50%) scale(${touchFeedback.scale})`,
        zIndex: isActive ? 1000 : 900
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {/* Main snap indicator */}
      <div
        className={cn(
          'w-full h-full rounded-full border-2',
          'transition-all duration-150',
          typeStyles.color,
          typeStyles.border,
          
          // Active state
          isActive && [
            'scale-125',
            typeStyles.glow,
            'animate-pulse'
          ],
          
          // Hover state
          isHovered && [
            'scale-110',
            typeStyles.shadow
          ],
          
          // Touch feedback
          touchFeedback.visible && [
            'animate-ping',
            typeStyles.glow
          ]
        )}
      >
        {/* Inner dot for better visibility */}
        <div
          className={cn(
            'absolute inset-1 rounded-full',
            'bg-white/80 backdrop-blur-sm',
            'transition-all duration-150',
            isActive && 'bg-white'
          )}
        />

        {/* Priority indicator for high-priority snaps */}
        {snapPoint.priority <= 2 && (
          <div
            className={cn(
              'absolute -top-1 -right-1',
              'w-3 h-3 rounded-full',
              'bg-orange-500 border border-orange-600',
              'animate-pulse'
            )}
          />
        )}
      </div>

      {/* Touch-optimized label */}
      {showLabel && (isActive || isHovered || isTouchDevice) && (
        <div
          className={cn(
            'absolute top-full left-1/2 transform -translate-x-1/2',
            'mt-1 px-2 py-1 rounded',
            'bg-black/80 text-white text-xs font-medium',
            'whitespace-nowrap pointer-events-none',
            'transition-all duration-150',
            isTouchDevice && 'text-sm px-3 py-1.5' // Larger text on touch devices
          )}
        >
          {getLabelText(snapPoint.type)}
          {snapPoint.distance !== undefined && (
            <span className="ml-1 opacity-75">
              ({snapPoint.distance.toFixed(0)}px)
            </span>
          )}
        </div>
      )}

      {/* Touch ripple effect */}
      {touchFeedback.visible && (
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'border-2 border-white/50',
            'animate-ping pointer-events-none'
          )}
          style={{
            transform: 'scale(1.5)'
          }}
        />
      )}

      {/* Accessibility enhancement for touch */}
      {isTouchDevice && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            minWidth: 44,
            minHeight: 44,
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%'
          }}
          aria-label={`${getLabelText(snapPoint.type)} snap point`}
          role="button"
          tabIndex={0}
        />
      )}
    </div>
  );
};

export default TouchSnapIndicator;
