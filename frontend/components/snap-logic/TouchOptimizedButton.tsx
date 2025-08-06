/**
 * Touch Optimized Button Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Touch-optimized button component with minimum 44px touch targets, haptic feedback,
 * and enhanced visual feedback for professional HVAC design workflows on touch devices.
 * Follows accessibility guidelines and provides seamless touch interaction.
 * 
 * @fileoverview Touch-optimized button component with haptic feedback
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TouchGestureHandler } from '@/lib/snap-logic';

/**
 * Touch button variant types
 */
export type TouchButtonVariant = 
  | 'primary'
  | 'secondary' 
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'success'
  | 'warning';

/**
 * Touch button size types
 */
export type TouchButtonSize = 
  | 'sm'    // 44px minimum
  | 'md'    // 48px standard
  | 'lg'    // 56px large
  | 'xl';   // 64px extra large

/**
 * Haptic feedback pattern types
 */
export type HapticPattern = 
  | 'light'     // Single short pulse
  | 'medium'    // Single medium pulse
  | 'heavy'     // Single strong pulse
  | 'success'   // Success pattern
  | 'warning'   // Warning pattern
  | 'error'     // Error pattern
  | 'custom';   // Custom pattern

/**
 * Touch optimized button props
 */
export interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement> | TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  
  // Styling
  variant?: TouchButtonVariant;
  size?: TouchButtonSize;
  className?: string;
  disabled?: boolean;
  
  // Touch-specific features
  enableHapticFeedback?: boolean;
  hapticPattern?: HapticPattern;
  customHapticPattern?: number | number[];
  enableTouchFeedback?: boolean;
  longPressDelay?: number;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  
  // Visual feedback
  showPressedState?: boolean;
  pressedScale?: number;
  
  // Icon support
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  
  // Loading state
  loading?: boolean;
  loadingText?: string;
}

/**
 * Touch optimized button component
 */
export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  onLongPress,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  enableHapticFeedback = true,
  hapticPattern = 'light',
  customHapticPattern,
  enableTouchFeedback = true,
  longPressDelay = 500,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role = 'button',
  showPressedState = true,
  pressedScale = 0.95,
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText = 'Loading...'
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const touchGestureHandlerRef = useRef<TouchGestureHandler | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPressed, setIsPressed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(TouchGestureHandler.isTouchDevice());
  }, []);

  // Initialize touch gesture handler for long press
  useEffect(() => {
    if (!isTouchDevice || !buttonRef.current || !onLongPress) return;

    const touchHandler = new TouchGestureHandler({
      enableLongPress: true,
      enableTwoFingerGestures: false,
      enableSwipeGestures: false,
      enableMultiFingerTaps: false,
      hapticFeedback: enableHapticFeedback,
      longPressDelay,
      tapMaxDistance: 10
    });

    touchHandler.attachToElement(buttonRef.current);
    touchHandler.on('longPress', handleLongPress);
    touchGestureHandlerRef.current = touchHandler;

    return () => {
      if (touchGestureHandlerRef.current) {
        touchGestureHandlerRef.current.dispose();
        touchGestureHandlerRef.current = null;
      }
    };
  }, [isTouchDevice, onLongPress, enableHapticFeedback, longPressDelay]);

  // Trigger haptic feedback
  const triggerHapticFeedback = useCallback((pattern: HapticPattern = hapticPattern) => {
    if (!enableHapticFeedback || !TouchGestureHandler.supportsHapticFeedback()) return;

    let vibrationPattern: number | number[];

    switch (pattern) {
      case 'light':
        vibrationPattern = 10;
        break;
      case 'medium':
        vibrationPattern = 25;
        break;
      case 'heavy':
        vibrationPattern = 50;
        break;
      case 'success':
        vibrationPattern = [50, 30, 50];
        break;
      case 'warning':
        vibrationPattern = [30, 30, 30, 30, 30];
        break;
      case 'error':
        vibrationPattern = [100, 50, 100, 50, 100];
        break;
      case 'custom':
        vibrationPattern = customHapticPattern || 25;
        break;
      default:
        vibrationPattern = 25;
    }

    navigator.vibrate(vibrationPattern);
  }, [enableHapticFeedback, hapticPattern, customHapticPattern]);

  // Show touch feedback
  const showTouchFeedback = useCallback((event: React.TouchEvent | TouchEvent) => {
    if (!enableTouchFeedback || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const touch = 'touches' in event ? event.touches[0] : event.changedTouches[0];
    
    setTouchFeedback({
      visible: true,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });

    // Hide feedback after animation
    setTimeout(() => {
      setTouchFeedback(prev => ({ ...prev, visible: false }));
    }, 300);
  }, [enableTouchFeedback]);

  // Handle long press
  const handleLongPress = useCallback((event: any) => {
    if (disabled || !onLongPress) return;

    triggerHapticFeedback('heavy');
    onLongPress(event.originalEvent);
  }, [disabled, onLongPress, triggerHapticFeedback]);

  // Handle click
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    triggerHapticFeedback();
    onClick?.(event);
  }, [disabled, loading, onClick, triggerHapticFeedback]);

  // Handle touch start
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled || loading) return;

    setIsPressed(true);
    showTouchFeedback(event);

    // Start long press timer if long press handler exists
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        handleLongPress({ originalEvent: event.nativeEvent });
      }, longPressDelay);
    }
  }, [disabled, loading, showTouchFeedback, onLongPress, longPressDelay, handleLongPress]);

  // Handle touch end
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    setIsPressed(false);

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Trigger click if not disabled
    if (!disabled && !loading && onClick) {
      triggerHapticFeedback();
      onClick(event.nativeEvent as any);
    }
  }, [disabled, loading, onClick, triggerHapticFeedback]);

  // Handle mouse events for non-touch devices
  const handleMouseDown = useCallback(() => {
    if (!isTouchDevice) {
      setIsPressed(true);
    }
  }, [isTouchDevice]);

  const handleMouseUp = useCallback(() => {
    if (!isTouchDevice) {
      setIsPressed(false);
    }
  }, [isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (!isTouchDevice) {
      setIsPressed(false);
    }
  }, [isTouchDevice]);

  // Get variant styles
  const getVariantStyles = (variant: TouchButtonVariant) => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
      outline: 'bg-transparent hover:bg-gray-50 text-gray-900 border-gray-300',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 border-transparent',
      destructive: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
      success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600'
    };
    return variants[variant];
  };

  // Get size styles
  const getSizeStyles = (size: TouchButtonSize) => {
    const sizes = {
      sm: 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm',
      md: 'min-h-[48px] min-w-[48px] px-4 py-2 text-base',
      lg: 'min-h-[56px] min-w-[56px] px-6 py-3 text-lg',
      xl: 'min-h-[64px] min-w-[64px] px-8 py-4 text-xl'
    };
    return sizes[size];
  };

  // Get icon layout styles
  const getIconLayoutStyles = () => {
    const layouts = {
      left: 'flex-row',
      right: 'flex-row-reverse',
      top: 'flex-col',
      bottom: 'flex-col-reverse'
    };
    return layouts[iconPosition];
  };

  // Get icon spacing
  const getIconSpacing = () => {
    const spacing = {
      left: 'mr-2',
      right: 'ml-2',
      top: 'mb-1',
      bottom: 'mt-1'
    };
    return spacing[iconPosition];
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'font-medium rounded-lg border transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'active:transform active:scale-95',
        'select-none touch-manipulation',
        
        // Variant styles
        getVariantStyles(variant),
        
        // Size styles
        getSizeStyles(size),
        
        // Icon layout
        icon && getIconLayoutStyles(),
        
        // Disabled styles
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        
        // Loading styles
        loading && 'cursor-wait',
        
        // Pressed state
        showPressedState && isPressed && 'transform scale-95',
        
        // Custom className
        className
      )}
      style={{
        transform: showPressedState && isPressed ? `scale(${pressedScale})` : undefined,
        WebkitTapHighlightColor: 'transparent'
      }}
      disabled={disabled || loading}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role={role}
      type="button"
    >
      {/* Touch feedback ripple */}
      {touchFeedback.visible && (
        <div
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
          style={{
            left: touchFeedback.x - 10,
            top: touchFeedback.y - 10,
            width: 20,
            height: 20
          }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'flex items-center justify-center',
        getIconLayoutStyles(),
        loading && 'opacity-0'
      )}>
        {icon && (
          <span className={cn('flex-shrink-0', getIconSpacing())}>
            {icon}
          </span>
        )}
        <span className="flex-1">
          {loading ? loadingText : children}
        </span>
      </div>
    </button>
  );
};

export default TouchOptimizedButton;
