/**
 * Touch Optimized Toggle Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Touch-optimized toggle switch component with minimum 44px touch targets,
 * haptic feedback, and enhanced visual feedback for professional HVAC design
 * workflows on touch devices. Provides accessible toggle interactions.
 * 
 * @fileoverview Touch-optimized toggle switch with haptic feedback
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TouchGestureHandler } from '@/lib/snap-logic';

/**
 * Touch toggle size types
 */
export type TouchToggleSize = 
  | 'sm'    // 32px width, 18px height
  | 'md'    // 44px width, 24px height
  | 'lg';   // 56px width, 32px height

/**
 * Touch optimized toggle props
 */
export interface TouchOptimizedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  
  // Styling
  size?: TouchToggleSize;
  className?: string;
  disabled?: boolean;
  
  // Touch-specific features
  enableHapticFeedback?: boolean;
  enableTouchFeedback?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  id?: string;
  
  // Visual customization
  checkedColor?: string;
  uncheckedColor?: string;
  thumbColor?: string;
  
  // Labels
  label?: string;
  description?: string;
}

/**
 * Touch optimized toggle component
 */
export const TouchOptimizedToggle: React.FC<TouchOptimizedToggleProps> = ({
  checked,
  onChange,
  size = 'md',
  className,
  disabled = false,
  enableHapticFeedback = true,
  enableTouchFeedback = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  id,
  checkedColor = 'bg-blue-500',
  uncheckedColor = 'bg-gray-300',
  thumbColor = 'bg-white',
  label,
  description
}) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(TouchGestureHandler.isTouchDevice());
  }, []);

  // Trigger haptic feedback
  const triggerHapticFeedback = useCallback((pattern: 'light' | 'medium' = 'light') => {
    if (!enableHapticFeedback || !TouchGestureHandler.supportsHapticFeedback()) return;

    const patterns = {
      light: 10,
      medium: 25
    };

    navigator.vibrate(patterns[pattern]);
  }, [enableHapticFeedback]);

  // Show touch feedback
  const showTouchFeedback = useCallback((event: React.TouchEvent) => {
    if (!enableTouchFeedback || !toggleRef.current) return;

    const rect = toggleRef.current.getBoundingClientRect();
    const touch = event.touches[0];
    
    setTouchFeedback({
      visible: true,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });

    // Hide feedback after animation
    setTimeout(() => {
      setTouchFeedback(prev => ({ ...prev, visible: false }));
    }, 200);
  }, [enableTouchFeedback]);

  // Handle toggle
  const handleToggle = useCallback(() => {
    if (disabled) return;

    const newChecked = !checked;
    triggerHapticFeedback(newChecked ? 'medium' : 'light');
    onChange(newChecked);
  }, [disabled, checked, onChange, triggerHapticFeedback]);

  // Handle touch events
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    setIsPressed(true);
    showTouchFeedback(event);
  }, [disabled, showTouchFeedback]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    handleToggle();
  }, [handleToggle]);

  // Handle mouse events for non-touch devices
  const handleMouseDown = useCallback(() => {
    if (!isTouchDevice && !disabled) {
      setIsPressed(true);
    }
  }, [isTouchDevice, disabled]);

  const handleMouseUp = useCallback(() => {
    if (!isTouchDevice) {
      setIsPressed(false);
    }
  }, [isTouchDevice]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!isTouchDevice) {
      event.preventDefault();
      handleToggle();
    }
  }, [isTouchDevice, handleToggle]);

  // Get size styles
  const getSizeStyles = (size: TouchToggleSize) => {
    const baseSize = isTouchDevice ? 1.1 : 1; // 10% larger on touch devices
    
    const sizes = {
      sm: {
        width: Math.max(32 * baseSize, 32),
        height: Math.max(18 * baseSize, 18),
        thumbSize: Math.max(14 * baseSize, 14),
        className: 'w-8 h-4.5'
      },
      md: {
        width: Math.max(44 * baseSize, 44),
        height: Math.max(24 * baseSize, 24),
        thumbSize: Math.max(20 * baseSize, 20),
        className: 'w-11 h-6'
      },
      lg: {
        width: Math.max(56 * baseSize, 56),
        height: Math.max(32 * baseSize, 32),
        thumbSize: Math.max(28 * baseSize, 28),
        className: 'w-14 h-8'
      }
    };
    return sizes[size];
  };

  const sizeStyles = getSizeStyles(size);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Toggle switch */}
      <button
        ref={toggleRef}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        aria-describedby={ariaDescribedBy}
        id={id}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'select-none touch-manipulation',
          checked ? checkedColor : uncheckedColor,
          disabled && 'opacity-50 cursor-not-allowed',
          isPressed && 'scale-95'
        )}
        style={{
          width: sizeStyles.width,
          height: sizeStyles.height,
          minWidth: isTouchDevice ? 44 : sizeStyles.width,
          minHeight: isTouchDevice ? 24 : sizeStyles.height,
          WebkitTapHighlightColor: 'transparent'
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Touch feedback ripple */}
        {touchFeedback.visible && (
          <div
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
            style={{
              left: touchFeedback.x - 8,
              top: touchFeedback.y - 8,
              width: 16,
              height: 16
            }}
          />
        )}

        {/* Toggle thumb */}
        <div
          className={cn(
            'absolute rounded-full shadow-lg transition-all duration-200',
            thumbColor,
            checked ? 'translate-x-full' : 'translate-x-0',
            isPressed && 'scale-110'
          )}
          style={{
            width: sizeStyles.thumbSize,
            height: sizeStyles.thumbSize,
            left: checked ? 
              `calc(100% - ${sizeStyles.thumbSize}px - 2px)` : 
              '2px',
            top: '50%',
            transform: `translateY(-50%) ${isPressed ? 'scale(1.1)' : 'scale(1)'}`
          }}
        />

        {/* Active indicator */}
        {checked && (
          <div
            className="absolute inset-0 rounded-full bg-white/20 animate-pulse"
            style={{ animationDuration: '2s' }}
          />
        )}
      </button>

      {/* Label and description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'font-medium cursor-pointer',
                isTouchDevice ? 'text-sm' : 'text-xs',
                disabled ? 'text-gray-400' : 'text-gray-700'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span
              className={cn(
                'text-xs text-gray-500',
                isTouchDevice && 'text-sm'
              )}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TouchOptimizedToggle;
