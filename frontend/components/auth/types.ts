/**
 * Authentication Component Types
 * 
 * TypeScript interfaces and types for authentication components
 * following SizeWise Suite patterns and offline-first architecture
 */

import { ReactNode } from 'react';

// =============================================================================
// Authentication State Types
// =============================================================================

export interface AuthFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthFormErrors {
  email?: string;
  password?: string;
  rememberMe?: string;
  general?: string;
}

export interface AuthFormState {
  data: AuthFormData;
  errors: AuthFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface LoginPageProps {
  onLoginSuccess?: (user: any) => void;
  onLoginError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
  showSuperAdminHint?: boolean;
  returnUrl?: string;
  videoUrl?: string;
  fallbackImage?: string;
}

export interface VideoBackgroundProps {
  videoUrl: string;
  fallbackImage?: string;
  className?: string;
  overlayOpacity?: number;
}

export interface SocialButtonProps {
  provider: 'google' | 'microsoft' | 'yahoo';
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface FormInputProps {
  type: 'email' | 'password' | 'text';
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  showPasswordToggle?: boolean;
}

// =============================================================================
// Validation Types
// =============================================================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationRules {
  email: ValidationRule;
  password: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: AuthFormErrors;
}

// =============================================================================
// Authentication Configuration Types
// =============================================================================

export interface BrandingConfig {
  title: string;
  subtitle: string;
  logoUrl?: string;
  iconComponent?: ReactNode;
}

export interface SocialProvider {
  id: 'google' | 'microsoft' | 'yahoo';
  name: string;
  icon: ReactNode;
  enabled: boolean;
  onClick?: () => void;
}

export interface AuthConfig {
  branding: BrandingConfig;
  socialProviders: SocialProvider[];
  features: {
    rememberMe: boolean;
    forgotPassword: boolean;
    socialLogin: boolean;
    createAccount: boolean;
  };
  validation: ValidationRules;
  redirects: {
    afterLogin: string;
    forgotPassword: string;
    createAccount: string;
  };
}

// =============================================================================
// Authentication Service Types
// =============================================================================

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
  redirectTo?: string;
}

export interface SocialAuthResult {
  success: boolean;
  provider: string;
  user?: any;
  token?: string;
  error?: string;
}

// =============================================================================
// Component State Types
// =============================================================================

export interface LoginComponentState {
  formData: AuthFormData;
  errors: AuthFormErrors;
  isSubmitting: boolean;
  showPassword: boolean;
  socialLoading: string | null; // provider id if loading
}

// =============================================================================
// Event Handler Types
// =============================================================================

export type FormSubmitHandler = (data: AuthFormData) => Promise<void>;
export type SocialLoginHandler = (provider: string) => Promise<void>;
export type FormFieldChangeHandler = (field: keyof AuthFormData, value: any) => void;
export type ValidationHandler = (data: AuthFormData) => ValidationResult;

// =============================================================================
// Accessibility Types
// =============================================================================

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  role?: string;
  tabIndex?: number;
}

// =============================================================================
// Animation and Styling Types
// =============================================================================

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface ThemeVariant {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  error: string;
  success: string;
}
