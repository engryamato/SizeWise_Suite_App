/**
 * Authentication Components Index
 * 
 * Central export file for all authentication-related components,
 * hooks, types, and utilities
 */

// =============================================================================
// Main Components
// =============================================================================

export { default as LoginPage } from './LoginPage';
export { default as VideoBackground, AnimatedBackground } from './VideoBackground';
export { default as FormInput, EmailInput, PasswordInput, InputGroup } from './FormInput';
export { default as SocialButton, SocialButtonGroup, SocialDivider, CompactSocialLogin } from './SocialButton';
export { default as ToggleSwitch, ToggleGroup, RememberMeToggle, AnimatedToggleSwitch } from './ToggleSwitch';

// =============================================================================
// Hooks
// =============================================================================

export {
  useFormValidation,
  useAuthForm,
  useAuthentication,
  usePasswordVisibility,
  useRememberMe,
  useFormAutoSave,
} from './hooks';

// =============================================================================
// Validation
// =============================================================================

export {
  default as validateAuthForm,
  FormValidator,
  checkPasswordStrength,
  createAccessibilityAnnouncement,
  validateEmail,
  validatePassword,
  debounce,
} from './validation';

// =============================================================================
// Configuration
// =============================================================================

export {
  AUTH_CONFIG,
  BRAND_CONFIG,
  SOCIAL_PROVIDERS,
  VALIDATION_RULES,
  AUTH_FEATURES,
  AUTH_REDIRECTS,
  ANIMATION_CONFIG,
  AUTH_STYLES,
  VIDEO_CONFIG,
  A11Y_CONFIG,
  ERROR_MESSAGES,
} from './config';

// Import types for utility functions
import type { AuthFormData, AuthFormErrors, AuthFormState } from './types';

// =============================================================================
// Types
// =============================================================================

export type {
  // Form Types
  AuthFormData,
  AuthFormErrors,
  AuthFormState,
  ValidationResult,
  ValidationRule,
  ValidationRules,
  FormSubmitHandler,
  SocialLoginHandler,
  AuthResult,

  // Component Props
  LoginPageProps,
  FormInputProps,
  SocialButtonProps,
  ToggleSwitchProps,
  VideoBackgroundProps,

  // Configuration Types
  AuthConfig,
  BrandingConfig,
  SocialProvider,

  // Utility Types
  AccessibilityProps,
} from './types';

// =============================================================================
// Utility Functions
// =============================================================================

export const createAuthFormData = (
  email = '',
  password = '',
  rememberMe = false
): AuthFormData => ({
  email,
  password,
  rememberMe,
});

export const createEmptyAuthErrors = (): AuthFormErrors => ({});

export const isFormValid = (errors: AuthFormErrors): boolean => {
  return Object.keys(errors).length === 0;
};

export const hasFieldError = (errors: AuthFormErrors, field: keyof AuthFormData): boolean => {
  if (field === 'rememberMe') return false; // rememberMe doesn't have errors
  return !!errors[field as keyof AuthFormErrors];
};

export const getFieldError = (errors: AuthFormErrors, field: keyof AuthFormData): string | undefined => {
  if (field === 'rememberMe') return undefined; // rememberMe doesn't have errors
  return errors[field as keyof AuthFormErrors];
};

// =============================================================================
// Constants
// =============================================================================

export const AUTH_COMPONENT_NAMES = {
  LOGIN_PAGE: 'LoginPage',
  FORM_INPUT: 'FormInput',
  EMAIL_INPUT: 'EmailInput',
  PASSWORD_INPUT: 'PasswordInput',
  SOCIAL_BUTTON: 'SocialButton',
  TOGGLE_SWITCH: 'ToggleSwitch',
  VIDEO_BACKGROUND: 'VideoBackground',
} as const;

export const AUTH_FIELD_NAMES = {
  EMAIL: 'email',
  PASSWORD: 'password',
  REMEMBER_ME: 'rememberMe',
} as const;

export const SOCIAL_PROVIDER_IDS = {
  GOOGLE: 'google',
  MICROSOFT: 'microsoft',
  YAHOO: 'yahoo',
} as const;

// =============================================================================
// Default Exports for Common Use Cases
// =============================================================================

// Default login page configuration
export const DEFAULT_LOGIN_CONFIG = {
  videoUrl: undefined,
  fallbackImage: undefined,
  enableSocialLogin: true,
  enableRememberMe: true,
  enableForgotPassword: true,
  enableCreateAccount: true,
  strengthCheck: false,
  autoSave: true,
};

// Default form validation options
export const DEFAULT_VALIDATION_OPTIONS = {
  strengthCheck: false,
  realTime: true,
  debounceMs: 300,
};

// Default accessibility configuration
export const DEFAULT_A11Y_OPTIONS = {
  announceErrors: true,
  announceSuccess: true,
  announceLoading: true,
  focusManagement: true,
};

// =============================================================================
// Version Information
// =============================================================================

export const AUTH_COMPONENTS_VERSION = '1.0.0';
export const AUTH_COMPONENTS_BUILD_DATE = new Date().toISOString();

// =============================================================================
// Feature Flags for Phase 1/2 Compatibility
// =============================================================================

export const PHASE_FLAGS = {
  PHASE_1_OFFLINE: true,
  PHASE_2_SAAS: false,
  SOCIAL_LOGIN_UI: true,
  SOCIAL_LOGIN_FUNCTIONAL: false,
  PASSWORD_STRENGTH: false,
  TWO_FACTOR_AUTH: false,
  BIOMETRIC_AUTH: false,
  FORGOT_PASSWORD_UI: true,
  FORGOT_PASSWORD_FUNCTIONAL: false,
  CREATE_ACCOUNT_UI: true,
  CREATE_ACCOUNT_FUNCTIONAL: false,
} as const;

// =============================================================================
// Development Helpers
// =============================================================================

export const DEV_HELPERS = {
  // Mock user data for development
  mockUser: {
    id: 'dev-user-123',
    email: 'developer@sizewise.com',
    name: 'Development User',
    tier: 'professional' as const,
  },

  // Mock form data for testing
  mockFormData: {
    valid: createAuthFormData('test@example.com', 'password123', true),
    invalid: createAuthFormData('invalid-email', '123', false),
  },

  // Development utilities
  logFormState: (state: AuthFormState) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('Auth Form State');
      console.log('Data:', state.data);
      console.log('Errors:', state.errors);
      console.log('Is Valid:', state.isValid);
      console.log('Is Submitting:', state.isSubmitting);
      console.groupEnd();
    }
  },
} as const;
