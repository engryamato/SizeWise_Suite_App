/**
 * Universal Form Validator
 * 
 * Consolidates form validation logic that was duplicated across
 * authentication components and HVAC validation modules.
 */

export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export interface FormValidatorConfig {
  rules: Record<string, ValidationRule>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showWarnings?: boolean;
}

/**
 * Form Validator Instance for managing form state and validation
 */
export class FormValidatorInstance {
  private rules: Record<string, ValidationRule>;
  private errors: Record<string, string> = {};
  private warnings: Record<string, string> = {};
  private config: FormValidatorConfig;

  constructor(config: FormValidatorConfig) {
    this.rules = config.rules;
    this.config = config;
  }

  /**
   * Validate a single field
   */
  validateField(field: string, value: any): string | null {
    const rule = this.rules[field];
    if (!rule) return null;

    const error = FormValidator.validateField(field, value, rule);
    
    if (error) {
      this.errors[field] = error;
    } else {
      delete this.errors[field];
    }

    return error;
  }

  /**
   * Validate entire form
   */
  validateForm(data: Record<string, any>): ValidationResult {
    const result = FormValidator.validateForm(data, this.rules);
    this.errors = result.errors;
    if (result.warnings) {
      this.warnings = result.warnings;
    }
    return result;
  }

  /**
   * Get current errors
   */
  getErrors(): Record<string, string> {
    return { ...this.errors };
  }

  /**
   * Get current warnings
   */
  getWarnings(): Record<string, string> {
    return { ...this.warnings };
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = {};
    this.warnings = {};
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return Object.keys(this.errors).length === 0;
  }
}

/**
 * Static Form Validator with utility methods
 */
export class FormValidator {
  
  /**
   * Validate a single field against a rule
   */
  static validateField(field: string, value: any, rule: ValidationRule): string | null {
    // Handle null/undefined values
    const isEmpty = value === null || value === undefined || value === '';
    
    // Required validation
    if (rule.required && isEmpty) {
      return rule.message || `${this.formatFieldName(field)} is required`;
    }

    // Skip other validations if field is empty and not required
    if (isEmpty && !rule.required) {
      return null;
    }

    // Convert value to string for string-based validations
    const stringValue = String(value);

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return rule.message || `${this.formatFieldName(field)} format is invalid`;
    }

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      return rule.message || `${this.formatFieldName(field)} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return rule.message || `${this.formatFieldName(field)} must be no more than ${rule.maxLength} characters`;
    }

    // Numeric validations
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      if (rule.min !== undefined && numericValue < rule.min) {
        return rule.message || `${this.formatFieldName(field)} must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && numericValue > rule.max) {
        return rule.message || `${this.formatFieldName(field)} must be no more than ${rule.max}`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }

  /**
   * Validate entire form data against rules
   */
  static validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];
      const error = this.validateField(field, value, rule);
      
      if (error) {
        errors[field] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a form validator instance
   */
  static createValidator(config: FormValidatorConfig): FormValidatorInstance {
    return new FormValidatorInstance(config);
  }

  /**
   * Format field name for user-friendly error messages
   */
  private static formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

/**
 * Pre-defined validation rules for common use cases
 */
export const ValidationRules = {
  // Email validation
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },

  // Password validation
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters long';
      return null;
    }
  },

  // Strong password validation
  strongPassword: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  },

  // HVAC-specific validations
  hvac: {
    ductSize: {
      required: true,
      pattern: /^\d{1,3}x\d{1,3}$|^\d{1,3}$/,
      message: 'Duct size must be in format "12x8" or "12"'
    },
    
    material: {
      required: true,
      pattern: /^[a-zA-Z_]+$/,
      message: 'Material must contain only letters and underscores'
    },
    
    units: {
      required: true,
      pattern: /^(imperial|metric)$/,
      message: 'Units must be either "imperial" or "metric"'
    },
    
    ductType: {
      required: true,
      pattern: /^(rectangular|round|oval)$/,
      message: 'Duct type must be rectangular, round, or oval'
    },
    
    airflow: {
      required: true,
      min: 0,
      max: 100000,
      custom: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return 'Airflow must be a number';
        if (num <= 0) return 'Airflow must be greater than 0';
        if (num > 100000) return 'Airflow seems unusually high, please verify';
        return null;
      }
    },
    
    velocity: {
      required: false,
      min: 0,
      max: 6000,
      custom: (value: any) => {
        if (!value) return null;
        const num = Number(value);
        if (isNaN(num)) return 'Velocity must be a number';
        if (num < 0) return 'Velocity cannot be negative';
        if (num > 6000) return 'Velocity exceeds recommended limits';
        return null;
      }
    }
  },

  // Common field validations
  required: {
    required: true
  },

  numeric: {
    custom: (value: any) => {
      if (!value) return null;
      if (isNaN(Number(value))) return 'Must be a number';
      return null;
    }
  },

  positiveNumber: {
    min: 0,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return 'Must be a number';
      if (num < 0) return 'Must be a positive number';
      return null;
    }
  },

  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number'
  },

  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Please enter a valid URL starting with http:// or https://'
  }
};

/**
 * Validation utilities for common patterns
 */
export const ValidationUtils = {
  /**
   * Combine multiple validation rules
   */
  combineRules: (...rules: ValidationRule[]): ValidationRule => {
    return rules.reduce((combined, rule) => ({
      ...combined,
      ...rule,
      custom: (value: any) => {
        for (const r of rules) {
          if (r.custom) {
            const error = r.custom(value);
            if (error) return error;
          }
        }
        return null;
      }
    }), {});
  },

  /**
   * Create conditional validation rule
   */
  conditionalRule: (
    condition: (data: Record<string, any>) => boolean,
    rule: ValidationRule
  ): ValidationRule => ({
    custom: (value: any, data?: Record<string, any>) => {
      if (data && condition(data)) {
        return FormValidator.validateField('field', value, rule);
      }
      return null;
    }
  }),

  /**
   * Debounced validation for real-time feedback
   */
  createDebouncedValidator: (
    validator: FormValidatorInstance,
    delay: number = 300
  ) => {
    let timeoutId: NodeJS.Timeout;
    
    return (field: string, value: any, callback: (error: string | null) => void) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const error = validator.validateField(field, value);
        callback(error);
      }, delay);
    };
  }
};
