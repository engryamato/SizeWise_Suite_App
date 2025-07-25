/**
 * SocialButton Component
 * 
 * Reusable social authentication button component with proper accessibility,
 * hover states, and loading indicators for OAuth providers
 */

'use client';

import React, { useState } from 'react';
import { SocialButtonProps } from './types';
import { AUTH_STYLES, A11Y_CONFIG } from './config';
import { cn } from '@/lib/utils';

// =============================================================================
// SocialButton Component
// =============================================================================

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  icon,
  label,
  onClick,
  disabled = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle button click with loading state
  const handleClick = async () => {
    if (disabled || isLoading || !onClick) return;

    setIsLoading(true);
    try {
      const result = onClick();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error(`${provider} authentication error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get provider-specific styling
  const getProviderStyles = () => {
    const baseStyles = AUTH_STYLES.button.social;
    
    switch (provider) {
      case 'google':
        return cn(
          baseStyles,
          'hover:bg-red-500/10 hover:border-red-500/30 focus:ring-red-500/50'
        );
      case 'microsoft':
        return cn(
          baseStyles,
          'hover:bg-blue-500/10 hover:border-blue-500/30 focus:ring-blue-500/50'
        );
      case 'yahoo':
        return cn(
          baseStyles,
          'hover:bg-purple-500/10 hover:border-purple-500/30 focus:ring-purple-500/50'
        );
      default:
        return baseStyles;
    }
  };

  // Get accessibility label
  const getAriaLabel = () => {
    return `${A11Y_CONFIG.labels.socialLogin} ${label}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || isLoading}
      className={cn(
        getProviderStyles(),
        'relative group focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200',
        disabled && 'opacity-50 cursor-not-allowed',
        isLoading && 'cursor-wait',
        className
      )}
      aria-label={getAriaLabel()}
      aria-disabled={disabled || isLoading ? 'true' : 'false'}
      title={label}
    >
      {/* Button Content */}
      <div className="flex items-center justify-center space-x-2">
        {/* Icon or Loading Spinner */}
        <div className="flex items-center justify-center w-5 h-5">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          ) : (
            <div className={cn(
              'transition-transform duration-200',
              isHovered && 'scale-110'
            )}>
              {icon}
            </div>
          )}
        </div>

        {/* Label (hidden on mobile, visible on larger screens) */}
        <span className="hidden sm:inline-block text-sm font-medium">
          {isLoading ? 'Connecting...' : label}
        </span>
      </div>

      {/* Hover Effect Overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg transition-opacity duration-200 pointer-events-none',
          isHovered && !disabled && !isLoading
            ? 'bg-white/5 opacity-100'
            : 'opacity-0'
        )}
      />

      {/* Focus Ring */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-focus:ring-current opacity-50" />
    </button>
  );
};

// =============================================================================
// SocialButtonGroup Component
// =============================================================================

interface SocialButtonGroupProps {
  providers: Array<{
    provider: 'google' | 'microsoft' | 'yahoo';
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    enabled?: boolean;
  }>;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const SocialButtonGroup: React.FC<SocialButtonGroupProps> = ({
  providers,
  className = '',
  orientation = 'horizontal',
  spacing = 'md',
  showLabels = true,
}) => {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'gap-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'gap-3' : 'space-y-3',
    lg: orientation === 'horizontal' ? 'gap-4' : 'space-y-4',
  };

  const containerClasses = cn(
    'w-full',
    orientation === 'horizontal' 
      ? `grid grid-cols-${providers.length} ${spacingClasses[spacing]}`
      : `flex flex-col ${spacingClasses[spacing]}`,
    className
  );

  return (
    <div className={containerClasses}>
      {providers.map((provider) => (
        <SocialButton
          key={provider.provider}
          provider={provider.provider}
          icon={provider.icon}
          label={showLabels ? provider.label : ''}
          onClick={provider.onClick}
          disabled={!provider.enabled}
        />
      ))}
    </div>
  );
};

// =============================================================================
// Social Divider Component
// =============================================================================

interface SocialDividerProps {
  text?: string;
  className?: string;
}

export const SocialDivider: React.FC<SocialDividerProps> = ({
  text = 'or continue with',
  className = '',
}) => {
  return (
    <div className={cn('relative flex items-center justify-center w-full', className)}>
      <div className="border-t border-white/10 absolute w-full" />
      <span className="bg-black/70 px-4 relative z-10 text-white/60 text-sm">
        {text}
      </span>
    </div>
  );
};

// =============================================================================
// Compact Social Login Component
// =============================================================================

interface CompactSocialLoginProps {
  providers: Array<{
    provider: 'google' | 'microsoft' | 'yahoo';
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    enabled?: boolean;
  }>;
  title?: string;
  className?: string;
}

export const CompactSocialLogin: React.FC<CompactSocialLoginProps> = ({
  providers,
  title = 'Quick access via',
  className = '',
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Title */}
      {title && (
        <SocialDivider text={title} className="mb-6" />
      )}

      {/* Social Buttons */}
      <SocialButtonGroup
        providers={providers}
        orientation="horizontal"
        spacing="md"
        showLabels={false}
      />
    </div>
  );
};

// =============================================================================
// Export Components
// =============================================================================

export default SocialButton;
