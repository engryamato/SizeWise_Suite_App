/**
 * Authentication Form Validation
 * 
 * Comprehensive form validation with real-time feedback,
 * error states, and accessibility announcements
 */

import { AuthFormData, AuthFormErrors, ValidationResult } from './types';

// =============================================================================
// Validation Rules
// =============================================================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// =============================================================================
// Individual Field Validators
// =============================================================================

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'Email address is required';
  }

  if (email.length > 254) {
    return 'Email address is too long';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain) {
    // Check for common typos like "gmial.com" instead of "gmail.com"
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
};

export const validatePassword = (password: string, strengthCheck = false): string | null => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (password.length > 128) {
    return 'Password is too long (maximum 128 characters)';
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'This password is too common. Please choose a stronger password';
  }

  // Enhanced strength check for Phase 2
  if (strengthCheck) {
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
  }

  return null;
};

// =============================================================================
// Form Validation
// =============================================================================

export const validateAuthForm = (data: AuthFormData, options: {
  strengthCheck?: boolean;
  realTime?: boolean;
} = {}): ValidationResult => {
  const errors: AuthFormErrors = {};
  let isValid = true;

  // Validate email
  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
    isValid = false;
  }

  // Validate password
  const passwordError = validatePassword(data.password, options.strengthCheck);
  if (passwordError) {
    errors.password = passwordError;
    isValid = false;
  }

  return { isValid, errors };
};

// =============================================================================
// Real-time Validation
// =============================================================================

export class FormValidator {
  private errors: AuthFormErrors = {};
  private readonly touched: Set<keyof AuthFormData> = new Set();
  private readonly options: {
    strengthCheck: boolean;
    debounceMs: number;
  };

  constructor(options: { strengthCheck?: boolean; debounceMs?: number } = {}) {
    this.options = {
      strengthCheck: options.strengthCheck ?? false,
      debounceMs: options.debounceMs ?? 300,
    };
  }

  // Mark field as touched
  touch(field: keyof AuthFormData): void {
    this.touched.add(field);
  }

  // Validate single field
  validateField(field: keyof AuthFormData, value: any): string | null {
    let error: string | null = null;

    switch (field) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value, this.options.strengthCheck);
        break;
      case 'rememberMe':
        // rememberMe doesn't need validation
        return null;
    }

    // Update errors only for fields that can have errors
    if (field === 'email' || field === 'password') {
      if (error) {
        this.errors[field] = error;
      } else {
        delete this.errors[field];
      }
    }

    return error;
  }

  // Validate entire form
  validateForm(data: AuthFormData): ValidationResult {
    const result = validateAuthForm(data, { strengthCheck: this.options.strengthCheck });
    this.errors = result.errors;
    return result;
  }

  // Get current errors
  getErrors(): AuthFormErrors {
    return { ...this.errors };
  }

  // Get errors for touched fields only
  getTouchedErrors(): AuthFormErrors {
    const touchedErrors: AuthFormErrors = {};

    for (const field of this.touched) {
      // Only check fields that can have errors
      if ((field === 'email' || field === 'password') && this.errors[field]) {
        touchedErrors[field] = this.errors[field];
      }
    }

    return touchedErrors;
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = {};
  }

  // Clear specific field error
  clearFieldError(field: keyof AuthFormData): void {
    // Only clear errors for fields that can have errors
    if (field === 'email' || field === 'password') {
      delete this.errors[field];
    }
  }

  // Reset validator
  reset(): void {
    this.errors = {};
    this.touched.clear();
  }
}

// =============================================================================
// Password Strength Checker
// =============================================================================

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  suggestions: string[];
  isStrong: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add uppercase letters');

  if (/\d/.test(password)) score++;
  else suggestions.push('Add numbers');

  if (/[@$!%*?&]/.test(password)) score++;
  else suggestions.push('Add special characters');

  // Additional checks
  if (password.length >= 12) {
    feedback.push('Good length');
  }

  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid repeated characters');
  }

  // Score interpretation
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthLabel = strengthLabels[score] || 'Very Weak';
  
  feedback.unshift(`Password strength: ${strengthLabel}`);

  return {
    score,
    feedback,
    suggestions,
    isStrong: score >= 3,
  };
};

// =============================================================================
// Accessibility Announcements
// =============================================================================

export const createAccessibilityAnnouncement = (errors: AuthFormErrors): string => {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 0) {
    return 'Form is valid and ready to submit';
  }
  
  if (errorCount === 1) {
    const field = Object.keys(errors)[0];
    return `Error in ${field}: ${errors[field as keyof AuthFormErrors]}`;
  }
  
  return `Form has ${errorCount} errors. Please review and correct them.`;
};

// =============================================================================
// Utility Functions
// =============================================================================

// Calculate Levenshtein distance for typo detection
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// Debounce function for real-time validation
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// =============================================================================
// Export Main Functions
// =============================================================================

export {
  validateAuthForm as default,
};
