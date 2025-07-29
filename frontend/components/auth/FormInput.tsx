/**
 * FormInput Component
 * 
 * Reusable form input component with floating labels, icons, validation states,
 * and accessibility features for authentication flows
 */

'use client';

import React, { useState, useId, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormInputProps } from './types';
import { AUTH_STYLES, A11Y_CONFIG } from './config';
import { cn } from '@/lib/utils';

// =============================================================================
// FormInput Component
// =============================================================================

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      type,
      name,
      value,
      onChange,
      placeholder,
      label,
      icon,
      error,
      disabled = false,
      required = false,
      autoComplete,
      className = '',
      showPasswordToggle = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = useId();
    const errorId = useId();
    const descriptionId = useId();

    // Determine actual input type based on password visibility
    const actualType = type === 'password' && showPassword ? 'text' : type;

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Determine input styles based on state
    const getInputStyles = () => {
      let styles: string = AUTH_STYLES.input.base;

      if (error) {
        styles = cn(styles, AUTH_STYLES.input.error);
      }

      if (disabled) {
        styles = cn(styles, 'opacity-50 cursor-not-allowed');
      }
      
      return cn(styles, className);
    };

    // Determine if label should float
    const shouldFloatLabel = isFocused || value.length > 0;

    return (
      <div className="relative w-full">
        {/* Input Container */}
        <div className="relative">
          {/* Leading Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <div className="text-white/60">
                {icon}
              </div>
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            name={name}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? placeholder : ''}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            className={getInputStyles()}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            aria-required={required ? 'true' : 'false'}
            aria-label={label || placeholder}
            {...props}
          />

          {/* Floating Label */}
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-10 transition-all duration-200 ease-in-out pointer-events-none',
                shouldFloatLabel
                  ? 'top-2 text-xs text-white/80 font-medium'
                  : 'top-1/2 -translate-y-1/2 text-white/60'
              )}
            >
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}

          {/* Password Toggle Button */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none focus:text-white transition-colors"
              aria-label={
                showPassword 
                  ? A11Y_CONFIG.labels.hidePassword 
                  : A11Y_CONFIG.labels.showPassword
              }
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            id={errorId}
            className="mt-2 text-sm text-red-400 flex items-center animate-in slide-in-from-left-1 duration-200"
            role="alert"
            aria-live="polite"
          >
            <span className="mr-1">⚠</span>
            {error}
          </div>
        )}

        {/* Helper Text (for future use) */}
        {!error && placeholder && isFocused && (
          <div
            id={descriptionId}
            className="mt-2 text-sm text-white/50"
            aria-live="polite"
          >
            {placeholder}
          </div>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

// =============================================================================
// Specialized Input Components
// =============================================================================

export const EmailInput = forwardRef<HTMLInputElement, Omit<FormInputProps, 'type'>>(
  (props, ref) => (
    <FormInput
      ref={ref}
      type="email"
      autoComplete="username"
      {...props}
    />
  )
);

EmailInput.displayName = 'EmailInput';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<FormInputProps, 'type' | 'showPasswordToggle'>>(
  (props, ref) => (
    <FormInput
      ref={ref}
      type="password"
      autoComplete="current-password"
      showPasswordToggle={true}
      {...props}
    />
  )
);

PasswordInput.displayName = 'PasswordInput';

// =============================================================================
// Input Group Component for Related Fields
// =============================================================================

interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export const InputGroup: React.FC<InputGroupProps> = ({
  children,
  className = '',
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return (
    <div className={cn('w-full', spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

// =============================================================================
// Export Components
// =============================================================================

export default FormInput;
