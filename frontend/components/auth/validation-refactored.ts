/**
 * Authentication Form Validation - Refactored
 * 
 * Refactored to use the consolidated FormValidator utility
 * to eliminate duplicate validation logic while maintaining
 * all existing functionality and enhanced features.
 */

import { AuthFormData, AuthFormErrors, ValidationResult } from './types';
import { FormValidator, ValidationRules, FormValidatorInstance, ValidationUtils } from '@/lib/validation/FormValidator';

// =============================================================================
// Enhanced Authentication Validation Rules
// =============================================================================

// Levenshtein distance function for typo detection
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[b.length][a.length];
}

// Enhanced email validation with typo detection
const enhancedEmailValidation = ValidationUtils.combineRules(
  ValidationRules.email,
  {
    custom: (email: string) => {
      if (!email || email.trim() === '') return 'Email address is required';
      
      if (email.length > 254) return 'Email address is too long';
      
      if (!ValidationRules.email.pattern!.test(email)) {
        return 'Please enter a valid email address';
      }
      
      // Check for common typos
      const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const domain = email.split('@')[1]?.toLowerCase();
      
      if (domain) {
        const suggestions = commonDomains.filter(d => 
          Math.abs(d.length - domain.length) <= 2 && 
          d !== domain &&
          levenshteinDistance(d, domain) <= 2
        );
        
        if (suggestions.length > 0) {
          return `Did you mean ${suggestions[0]}?`;
        }
      }
      
      return null;
    }
  }
);

// Enhanced password validation with common password detection
const enhancedPasswordValidation = ValidationUtils.combineRules(
  ValidationRules.password,
  {
    custom: (password: string) => {
      if (!password || password.trim() === '') return 'Password is required';
      
      if (password.length < 8) return 'Password must be at least 8 characters long';
      
      if (password.length > 128) return 'Password is too long (maximum 128 characters)';
      
      // Check for common weak passwords
      const commonPasswords = [
        'password', '12345678', 'qwerty', 'abc123', 'password123',
        'admin', 'letmein', 'welcome', 'monkey', '1234567890'
      ];
      
      if (commonPasswords.includes(password.toLowerCase())) {
        return 'This password is too common. Please choose a stronger password';
      }
      
      return null;
    }
  }
);

// Strong password validation with detailed requirements
const strongPasswordValidation = ValidationUtils.combineRules(
  enhancedPasswordValidation,
  {
    custom: (password: string) => {
      if (!password) return 'Password is required';
      
      if (!/(?=.*[a-z])/.test(password)) {
        return 'Password must contain at least one lowercase letter';
      }
      
      if (!/(?=.*[A-Z])/.test(password)) {
        return 'Password must contain at least one uppercase letter';
      }
      
      if (!/(?=.*\d)/.test(password)) {
        return 'Password must contain at least one number';
      }
      
      if (!/(?=.*[@$!%*?&])/.test(password)) {
        return 'Password must contain at least one special character (@$!%*?&)';
      }
      
      return null;
    }
  }
);

// Confirm password validation
const confirmPasswordValidation = {
  required: true,
  custom: (value: string, data?: Record<string, any>) => {
    if (!value || value.trim() === '') return 'Please confirm your password';
    if (data && data.password !== value) return 'Passwords do not match';
    return null;
  }
};

// =============================================================================
// Validation Rule Sets
// =============================================================================

export const AUTH_VALIDATION_RULES = {
  email: enhancedEmailValidation,
  password: enhancedPasswordValidation,
  confirmPassword: confirmPasswordValidation
};

export const STRONG_AUTH_VALIDATION_RULES = {
  email: enhancedEmailValidation,
  password: strongPasswordValidation,
  confirmPassword: confirmPasswordValidation
};

// =============================================================================
// Legacy API Compatibility
// =============================================================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const validateEmail = (email: string): string | null => {
  return FormValidator.validateField('email', email, enhancedEmailValidation);
};

export const validatePassword = (password: string, strengthCheck: boolean = false): string | null => {
  const rule = strengthCheck ? strongPasswordValidation : enhancedPasswordValidation;
  return FormValidator.validateField('password', password, rule);
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  return FormValidator.validateField('confirmPassword', confirmPassword, {
    ...confirmPasswordValidation,
    custom: (value: string) => confirmPasswordValidation.custom!(value, { password })
  });
};

// =============================================================================
// Enhanced Form Validation
// =============================================================================

export const validateAuthForm = (data: AuthFormData, options: {
  strengthCheck?: boolean;
  realTime?: boolean;
} = {}): ValidationResult => {
  const rules = options.strengthCheck ? STRONG_AUTH_VALIDATION_RULES : AUTH_VALIDATION_RULES;
  
  // Use the consolidated FormValidator
  const result = FormValidator.validateForm(data, rules);
  
  // Convert to legacy format for compatibility
  return {
    isValid: result.isValid,
    errors: result.errors as AuthFormErrors
  };
};

// =============================================================================
// Real-time Validation Class
// =============================================================================

export class AuthFormValidator {
  private validator: FormValidatorInstance;
  private options: { strengthCheck?: boolean; realTime?: boolean };

  constructor(options: { strengthCheck?: boolean; realTime?: boolean } = {}) {
    this.options = options;
    const rules = options.strengthCheck ? STRONG_AUTH_VALIDATION_RULES : AUTH_VALIDATION_RULES;
    
    this.validator = FormValidator.createValidator({
      rules,
      validateOnChange: options.realTime,
      validateOnBlur: true,
      showWarnings: true
    });
  }

  validateField(field: keyof AuthFormData, value: any): string | null {
    return this.validator.validateField(field, value);
  }

  validateForm(data: AuthFormData): ValidationResult {
    const result = this.validator.validateForm(data);
    return {
      isValid: result.isValid,
      errors: result.errors as AuthFormErrors
    };
  }

  getErrors(): AuthFormErrors {
    return this.validator.getErrors() as AuthFormErrors;
  }

  clearErrors(): void {
    this.validator.clear();
  }

  isValid(): boolean {
    return this.validator.isValid();
  }
}

// =============================================================================
// Password Strength Analyzer
// =============================================================================

export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
    notCommon: boolean;
  };
}

export const analyzePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[@$!%*?&]/.test(password),
    notCommon: !['password', '12345678', 'qwerty', 'abc123'].includes(password.toLowerCase())
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const score = Math.min(100, (metRequirements / 6) * 100 + (password.length - 8) * 2);

  let level: PasswordStrength['level'] = 'weak';
  if (score >= 80) level = 'strong';
  else if (score >= 60) level = 'good';
  else if (score >= 40) level = 'fair';

  const feedback: string[] = [];
  if (!requirements.length) feedback.push('Use at least 8 characters');
  if (!requirements.lowercase) feedback.push('Add lowercase letters');
  if (!requirements.uppercase) feedback.push('Add uppercase letters');
  if (!requirements.numbers) feedback.push('Add numbers');
  if (!requirements.symbols) feedback.push('Add special characters');
  if (!requirements.notCommon) feedback.push('Avoid common passwords');

  return { score, level, feedback, requirements };
};

// =============================================================================
// Accessibility Helpers
// =============================================================================

export const getFieldAriaDescribedBy = (field: keyof AuthFormData, hasError: boolean): string => {
  const baseId = `${field}-help`;
  const errorId = `${field}-error`;
  
  if (hasError) {
    return `${baseId} ${errorId}`;
  }
  
  return baseId;
};

export const getFieldAriaInvalid = (field: keyof AuthFormData, errors: AuthFormErrors): boolean => {
  return !!errors[field];
};

// =============================================================================
// Export consolidated validator instance
// =============================================================================

export const createAuthValidator = (strengthCheck: boolean = false): AuthFormValidator => {
  return new AuthFormValidator({ strengthCheck, realTime: true });
};
