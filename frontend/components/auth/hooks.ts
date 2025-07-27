/**
 * Authentication Hooks
 * 
 * Custom React hooks for authentication functionality,
 * form validation, and state management
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  AuthFormData,
  AuthFormErrors,
  AuthFormState,
  ValidationResult,
  FormSubmitHandler,
  SocialLoginHandler,
  AuthResult,
} from './types';
import { VALIDATION_RULES, ERROR_MESSAGES } from './config';

// =============================================================================
// Form Validation Hook
// =============================================================================

export const useFormValidation = () => {
  const validateField = useCallback((field: keyof AuthFormData, value: any): string | null => {
    // Skip validation for fields that don't have rules (like rememberMe)
    if (field === 'rememberMe') return null;

    const rules = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES];
    if (!rules) return null;

    // Check required
    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    // Check custom validation
    if (rules.custom && value) {
      return rules.custom(value.toString());
    }

    return null;
  }, []);

  const validateForm = useCallback((data: AuthFormData): ValidationResult => {
    const errors: AuthFormErrors = {};
    let isValid = true;

    // Validate email
    const emailError = validateField('email', data.email);
    if (emailError) {
      errors.email = emailError;
      isValid = false;
    }

    // Validate password
    const passwordError = validateField('password', data.password);
    if (passwordError) {
      errors.password = passwordError;
      isValid = false;
    }

    return { isValid, errors };
  }, [validateField]);

  return { validateField, validateForm };
};

// =============================================================================
// Authentication Form Hook
// =============================================================================

export const useAuthForm = (onSubmit?: FormSubmitHandler) => {
  const [formState, setFormState] = useState<AuthFormState>({
    data: {
      email: '',
      password: '',
      rememberMe: false,
    },
    errors: {},
    isSubmitting: false,
    isValid: false,
  });

  const { validateForm, validateField } = useFormValidation();

  // Update form data
  const updateField = useCallback((field: keyof AuthFormData, value: any) => {
    setFormState(prev => {
      const newData = { ...prev.data, [field]: value };

      // Clear field error when user starts typing
      const newErrors = { ...prev.errors };
      if (field !== 'rememberMe' && newErrors[field as keyof AuthFormErrors]) {
        delete newErrors[field as keyof AuthFormErrors];
      }

      // Validate form
      const validation = validateForm(newData);

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isValid: validation.isValid,
      };
    });
  }, [validateForm]);

  // Validate single field
  const validateSingleField = useCallback((field: keyof AuthFormData) => {
    const error = validateField(field, formState.data[field]);
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error || undefined,
      },
    }));
    return !error;
  }, [validateField, formState.data]);

  // Submit form
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate form
    const validation = validateForm(formState.data);

    if (!validation.isValid) {
      setFormState(prev => ({
        ...prev,
        errors: validation.errors,
        isValid: false,
      }));
      return;
    }

    // Submit form
    setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

    try {
      if (onSubmit) {
        await onSubmit(formState.data);
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        errors: { general: error instanceof Error ? error.message : ERROR_MESSAGES.unknownError },
      }));
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.data, validateForm, onSubmit]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState({
      data: {
        email: '',
        password: '',
        rememberMe: false,
      },
      errors: {},
      isSubmitting: false,
      isValid: false,
    });
  }, []);

  // Set form errors
  const setErrors = useCallback((errors: AuthFormErrors) => {
    setFormState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }));
  }, []);

  return {
    formState,
    updateField,
    validateSingleField,
    handleSubmit,
    resetForm,
    setErrors,
  };
};

// =============================================================================
// Authentication Hook
// =============================================================================

export const useAuthentication = () => {
  const authStore = useAuthStore();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Login handler
  const login = useCallback(async (credentials: AuthFormData): Promise<AuthResult> => {
    try {
      const success = await authStore.login(credentials.email, credentials.password);
      
      if (success) {
        return {
          success: true,
          user: authStore.user,
          token: authStore.token || undefined,
        };
      } else {
        return {
          success: false,
          error: ERROR_MESSAGES.invalidCredentials,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.unknownError,
      };
    }
  }, [authStore]);

  // Social login handler
  const socialLogin: SocialLoginHandler = useCallback(async (provider: string) => {
    setSocialLoading(provider);
    
    try {
      // Placeholder for social login - Phase 2 implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, just show a message
      console.log(`Social login with ${provider} - Phase 2 feature`);
      
      console.log(`${provider} authentication will be available in Phase 2`);
    } catch (error) {
      console.error(`Social login error for ${provider}:`, error);
      console.error('Social login failed:', ERROR_MESSAGES.socialAuthError);
    } finally {
      setSocialLoading(null);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await authStore.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [authStore]);

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    socialLoading,
    login,
    socialLogin,
    logout,
  };
};

// =============================================================================
// Password Visibility Hook
// =============================================================================

export const usePasswordVisibility = (initialVisible = false) => {
  const [isVisible, setIsVisible] = useState(initialVisible);

  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    toggle,
    show,
    hide,
  };
};

// =============================================================================
// Remember Me Hook
// =============================================================================

export const useRememberMe = () => {
  const [rememberMe, setRememberMe] = useState(false);

  // Load remember me preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sizewise-remember-me');
      if (saved) {
        setRememberMe(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load remember me preference:', error);
    }
  }, []);

  // Save remember me preference
  const updateRememberMe = useCallback((value: boolean) => {
    setRememberMe(value);
    try {
      localStorage.setItem('sizewise-remember-me', JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save remember me preference:', error);
    }
  }, []);

  return {
    rememberMe,
    setRememberMe: updateRememberMe,
  };
};

// =============================================================================
// Form Auto-save Hook
// =============================================================================

export const useFormAutoSave = (formData: AuthFormData, enabled = true) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(() => {
      try {
        // Only save email, not password for security
        const dataToSave = {
          email: formData.email,
          rememberMe: formData.rememberMe,
        };
        localStorage.setItem('sizewise-form-draft', JSON.stringify(dataToSave));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Failed to auto-save form data:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.email, formData.rememberMe, enabled]);

  // Load saved form data
  const loadSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem('sizewise-form-draft');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
    return null;
  }, []);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem('sizewise-form-draft');
      setLastSaved(null);
    } catch (error) {
      console.warn('Failed to clear saved form data:', error);
    }
  }, []);

  return {
    lastSaved,
    loadSavedData,
    clearSavedData,
  };
};
