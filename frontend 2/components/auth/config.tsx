/**
 * Authentication Configuration
 * 
 * Centralized configuration for authentication components
 * following SizeWise Suite branding and offline-first architecture
 */

import React from 'react';
import { FaGoogle, FaMicrosoft, FaYahoo } from 'react-icons/fa';
import { AuthConfig, ValidationRules, SocialProvider } from './types';

// =============================================================================
// Brand Configuration
// =============================================================================

export const BRAND_CONFIG = {
  title: 'SizeWise',
  subtitle: 'Powerful Sizing, Effortless Workflow',
  logoUrl: '/sizewise-logo.svg',
  iconComponent: (
    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center animate-pulse shadow-md">
      <span className="text-white font-bold text-sm">SW</span>
    </div>
  ),
} as const;

// =============================================================================
// Social Provider Configuration
// =============================================================================

export const SOCIAL_PROVIDERS = [
  {
    id: 'google' as const,
    name: 'Google',
    icon: <FaGoogle size={20} />,
    enabled: true,
    onClick: () => {
      // Placeholder for Google OAuth integration
      console.log('Google OAuth integration - Phase 2 SaaS feature');
    },
  },
  {
    id: 'microsoft' as const,
    name: 'Microsoft',
    icon: <FaMicrosoft size={20} />,
    enabled: true,
    onClick: () => {
      // Placeholder for Microsoft OAuth integration
      console.log('Microsoft OAuth integration - Phase 2 SaaS feature');
    },
  },
  {
    id: 'yahoo' as const,
    name: 'Yahoo',
    icon: <FaYahoo size={20} />,
    enabled: true,
    onClick: () => {
      // Placeholder for Yahoo OAuth integration
      console.log('Yahoo OAuth integration - Phase 2 SaaS feature');
    },
  },
] as const;

// =============================================================================
// Validation Rules Configuration
// =============================================================================

export const VALIDATION_RULES: ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return 'Email is required';
      if (!VALIDATION_RULES.email.pattern?.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    },
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      // Additional password strength validation for Phase 2
      // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      //   return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      // }
      return null;
    },
  },
};

// =============================================================================
// Feature Flags Configuration
// =============================================================================

export const AUTH_FEATURES = {
  rememberMe: true,
  forgotPassword: true,
  socialLogin: true, // Enabled for UI, actual functionality in Phase 2
  createAccount: true,
  passwordStrengthIndicator: false, // Phase 2 feature
  twoFactorAuth: false, // Phase 2 feature
  biometricAuth: false, // Phase 2 feature
} as const;

// =============================================================================
// Redirect Configuration
// =============================================================================

export const AUTH_REDIRECTS = {
  afterLogin: '/dashboard',
  forgotPassword: '/auth/forgot-password', // Phase 2 route
  createAccount: '/auth/register', // Phase 2 route
  afterLogout: '/auth/login',
} as const;

// =============================================================================
// Animation Configuration
// =============================================================================

export const ANIMATION_CONFIG = {
  formTransition: {
    duration: 0.3,
    easing: 'ease-in-out',
  },
  buttonHover: {
    duration: 0.2,
    easing: 'ease-out',
  },
  errorShake: {
    duration: 0.5,
    easing: 'ease-in-out',
  },
  loadingPulse: {
    duration: 1.5,
    easing: 'ease-in-out',
  },
} as const;

// =============================================================================
// Styling Configuration
// =============================================================================

export const AUTH_STYLES = {
  glassmorphism: {
    background: 'bg-black/70',
    backdrop: 'backdrop-blur-md',
    border: 'border border-white/10',
    shadow: 'shadow-2xl',
  },
  input: {
    base: 'w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-500 transition-colors',
    error: 'border-red-500 focus:border-red-500',
    success: 'border-green-500 focus:border-green-500',
  },
  button: {
    primary: 'w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40',
    social: 'flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors',
  },
  toggle: {
    track: 'absolute inset-0 rounded-full transition-colors duration-200 ease-in-out',
    thumb: 'absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out',
    checked: 'bg-blue-600',
    unchecked: 'bg-white/20',
  },
} as const;

// =============================================================================
// Main Authentication Configuration
// =============================================================================

export const AUTH_CONFIG: AuthConfig = {
  branding: BRAND_CONFIG,
  socialProviders: SOCIAL_PROVIDERS as unknown as SocialProvider[],
  features: AUTH_FEATURES,
  validation: VALIDATION_RULES,
  redirects: AUTH_REDIRECTS,
};

// =============================================================================
// Video Background Configuration
// =============================================================================

export const VIDEO_CONFIG = {
  defaultVideoUrl: '/auth/background-video.mp4', // Placeholder - to be added in Phase 2
  fallbackImage: '/auth/background-fallback.jpg', // Placeholder - to be added in Phase 2
  overlayOpacity: 0.4,
  autoPlay: true,
  loop: true,
  muted: true,
  playsInline: true,
} as const;

// =============================================================================
// Accessibility Configuration
// =============================================================================

export const A11Y_CONFIG = {
  announcements: {
    loginStart: 'Signing in...',
    loginSuccess: 'Successfully signed in',
    loginError: 'Sign in failed. Please check your credentials.',
    validationError: 'Please correct the errors in the form',
    socialLoginStart: 'Redirecting to social login...',
  },
  labels: {
    emailInput: 'Email address',
    passwordInput: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    rememberMe: 'Remember me',
    loginButton: 'Sign in to SizeWise',
    socialLogin: 'Sign in with',
    forgotPassword: 'Forgot your password?',
    createAccount: 'Create a new account',
  },
} as const;

// =============================================================================
// Error Messages Configuration
// =============================================================================

export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  invalidCredentials: 'Invalid email or password. Please try again.',
  accountLocked: 'Account temporarily locked. Please try again later.',
  serverError: 'Server error. Please try again later.',
  socialAuthError: 'Social authentication failed. Please try again.',
  validationFailed: 'Please correct the errors below.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  unknownError: 'An unexpected error occurred. Please try again.',
} as const;

// =============================================================================
// Export Default Configuration
// =============================================================================

export default AUTH_CONFIG;
