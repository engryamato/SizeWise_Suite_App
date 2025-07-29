/**
 * ToggleSwitch Component
 * 
 * Custom toggle switch component for the 'Remember Me' functionality
 * with proper accessibility, animations, and keyboard support
 */

'use client';

import React, { useId, useRef } from 'react';
import { ToggleSwitchProps } from './types';
import { AUTH_STYLES } from './config';
import { cn } from '@/lib/utils';

// =============================================================================
// ToggleSwitch Component
// =============================================================================

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  id,
  label,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const switchId = id || generatedId;
  const labelId = `${switchId}-label`;

  // Handle toggle change
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          track: 'w-8 h-4',
          thumb: 'w-3 h-3 left-0.5 top-0.5',
          thumbChecked: 'translate-x-4',
        };
      case 'lg':
        return {
          track: 'w-12 h-6',
          thumb: 'w-5 h-5 left-0.5 top-0.5',
          thumbChecked: 'translate-x-6',
        };
      default: // md
        return {
          track: 'w-10 h-5',
          thumb: 'w-4 h-4 left-0.5 top-0.5',
          thumbChecked: 'translate-x-5',
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <div className={cn('flex items-center', className)}>
      {/* Toggle Switch */}
      <div className="relative inline-block">
        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="checkbox"
          id={switchId}
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={label ? `${switchId}-description` : undefined}
        />

        {/* Switch Track */}
        <div
          className={cn(
            'relative cursor-pointer transition-all duration-200 ease-in-out rounded-full',
            'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50',
            sizeStyles.track,
            checked 
              ? AUTH_STYLES.toggle.checked 
              : AUTH_STYLES.toggle.unchecked,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="switch"
          aria-checked={checked ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : 'false'}
          aria-labelledby={label ? labelId : undefined}
        >
          {/* Switch Thumb */}
          <div
            className={cn(
              'absolute rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
              sizeStyles.thumb,
              checked ? sizeStyles.thumbChecked : 'translate-x-0',
              disabled && 'shadow-none'
            )}
          />

          {/* Focus Ring */}
          <div className="absolute inset-0 rounded-full ring-2 ring-transparent focus-within:ring-blue-500 focus-within:ring-opacity-50" />
        </div>
      </div>

      {/* Label */}
      {label && (
        <label
          id={labelId}
          htmlFor={switchId}
          className={cn(
            'ml-3 text-sm cursor-pointer transition-colors',
            disabled 
              ? 'text-white/40 cursor-not-allowed' 
              : 'text-white/80 hover:text-white',
            size === 'sm' && 'text-xs',
            size === 'lg' && 'text-base'
          )}
          onClick={disabled ? undefined : handleChange}
          onKeyDown={disabled ? undefined : (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleChange();
            }
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

// =============================================================================
// ToggleGroup Component for Multiple Toggles
// =============================================================================

interface ToggleOption {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  onChange: (id: string, checked: boolean) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  onChange,
  orientation = 'vertical',
  size = 'md',
  className = '',
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'gap-3' : 'space-y-2',
    md: orientation === 'horizontal' ? 'gap-4' : 'space-y-3',
    lg: orientation === 'horizontal' ? 'gap-6' : 'space-y-4',
  };

  const containerClasses = cn(
    orientation === 'horizontal' ? `flex ${spacingClasses[spacing]}` : spacingClasses[spacing],
    className
  );

  return (
    <div className={containerClasses}>
      {options.map((option) => (
        <ToggleSwitch
          key={option.id}
          id={option.id}
          checked={option.checked}
          onChange={(checked) => onChange(option.id, checked)}
          label={option.label}
          disabled={option.disabled}
          size={size}
        />
      ))}
    </div>
  );
};

// =============================================================================
// RememberMeToggle - Specialized Component
// =============================================================================

interface RememberMeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const RememberMeToggle: React.FC<RememberMeToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <ToggleSwitch
      id="remember-me"
      checked={checked}
      onChange={onChange}
      label="Remember me"
      disabled={disabled}
      size="md"
      className={className}
    />
  );
};

// =============================================================================
// Animated Toggle Switch with Enhanced Visual Feedback
// =============================================================================

interface AnimatedToggleSwitchProps extends ToggleSwitchProps {
  showCheckmark?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'red';
}

export const AnimatedToggleSwitch: React.FC<AnimatedToggleSwitchProps> = ({
  showCheckmark = false,
  color = 'blue',
  ...props
}) => {
  // Color styles for future use in Phase 2
  // const colorStyles = {
  //   blue: 'bg-blue-600',
  //   green: 'bg-green-600',
  //   purple: 'bg-purple-600',
  //   red: 'bg-red-600',
  // };

  return (
    <div className="relative">
      <ToggleSwitch {...props} />
      
      {/* Checkmark Animation */}
      {showCheckmark && props.checked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200">
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Export Components
// =============================================================================

export default ToggleSwitch;
