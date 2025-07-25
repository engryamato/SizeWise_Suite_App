/**
 * Authentication Components Test Suite
 * 
 * Comprehensive tests for all authentication components,
 * hooks, and validation logic
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Components
import LoginPage from '../LoginPage';
import FormInput, { EmailInput, PasswordInput } from '../FormInput';
import SocialButton, { SocialButtonGroup } from '../SocialButton';
import ToggleSwitch, { RememberMeToggle } from '../ToggleSwitch';
import VideoBackground from '../VideoBackground';

// Hooks and utilities
import { useAuthForm, useFormValidation } from '../hooks';
import { validateEmail, validatePassword, FormValidator } from '../validation';
import { AUTH_CONFIG, BRAND_CONFIG } from '../config';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock auth store
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    token: null,
    login: jest.fn().mockResolvedValue(true),
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
}));

// Mock React Icons
jest.mock('react-icons/fa', () => ({
  FaGoogle: () => <div data-testid="google-icon">Google</div>,
  FaMicrosoft: () => <div data-testid="microsoft-icon">Microsoft</div>,
  FaYahoo: () => <div data-testid="yahoo-icon">Yahoo</div>,
}));

describe('Authentication Components', () => {
  // =============================================================================
  // FormInput Component Tests
  // =============================================================================

  describe('FormInput', () => {
    it('renders with label and placeholder', () => {
      render(
        <FormInput
          name="test"
          value=""
          onChange={jest.fn()}
          label="Test Label"
          placeholder="Test placeholder"
        />
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('shows error message when error prop is provided', () => {
      render(
        <FormInput
          name="test"
          value=""
          onChange={jest.fn()}
          label="Test Label"
          error="Test error message"
        />
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('calls onChange when input value changes', async () => {
      const handleChange = jest.fn();
      render(
        <FormInput
          name="test"
          value=""
          onChange={handleChange}
          label="Test Label"
        />
      );

      const input = screen.getByLabelText('Test Label');
      await userEvent.type(input, 'test value');

      expect(handleChange).toHaveBeenCalledWith('test value');
    });

    it('shows required indicator when required prop is true', () => {
      render(
        <FormInput
          name="test"
          value=""
          onChange={jest.fn()}
          label="Test Label"
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('EmailInput', () => {
    it('renders with email type and autocomplete', () => {
      render(
        <EmailInput
          name="email"
          value=""
          onChange={jest.fn()}
          label="Email"
        />
      );

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('autocomplete', 'username');
    });
  });

  describe('PasswordInput', () => {
    it('renders with password type and toggle button', () => {
      render(
        <PasswordInput
          name="password"
          value=""
          onChange={jest.fn()}
          label="Password"
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('toggles password visibility when toggle button is clicked', async () => {
      render(
        <PasswordInput
          name="password"
          value=""
          onChange={jest.fn()}
          label="Password"
        />
      );

      const input = screen.getByLabelText('Password');
      const toggleButton = screen.getByRole('button');

      expect(input).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // SocialButton Component Tests
  // =============================================================================

  describe('SocialButton', () => {
    it('renders with provider icon and label', () => {
      render(
        <SocialButton
          provider="google"
          icon={<div data-testid="test-icon">Icon</div>}
          label="Sign in with Google"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(
        <SocialButton
          provider="google"
          icon={<div>Icon</div>}
          label="Sign in with Google"
          onClick={handleClick}
        />
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('shows loading state when processing', async () => {
      const handleClick = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(
        <SocialButton
          provider="google"
          icon={<div>Icon</div>}
          label="Sign in with Google"
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // ToggleSwitch Component Tests
  // =============================================================================

  describe('ToggleSwitch', () => {
    it('renders with label', () => {
      render(
        <ToggleSwitch
          checked={false}
          onChange={jest.fn()}
          label="Remember me"
        />
      );

      expect(screen.getByText('Remember me')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('calls onChange when clicked', async () => {
      const handleChange = jest.fn();
      render(
        <ToggleSwitch
          checked={false}
          onChange={handleChange}
          label="Remember me"
        />
      );

      await userEvent.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('supports keyboard navigation', async () => {
      const handleChange = jest.fn();
      render(
        <ToggleSwitch
          checked={false}
          onChange={handleChange}
          label="Remember me"
        />
      );

      const toggle = screen.getByRole('switch');
      toggle.focus();
      await userEvent.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('RememberMeToggle', () => {
    it('renders with correct label and id', () => {
      render(
        <RememberMeToggle
          checked={false}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Remember me')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute('aria-labelledby');
    });
  });

  // =============================================================================
  // Validation Tests
  // =============================================================================

  describe('Validation', () => {
    describe('validateEmail', () => {
      it('validates correct email addresses', () => {
        expect(validateEmail('test@example.com')).toBeNull();
        expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull();
      });

      it('rejects invalid email addresses', () => {
        expect(validateEmail('')).toBe('Email address is required');
        expect(validateEmail('invalid')).toBe('Please enter a valid email address');
        expect(validateEmail('test@')).toBe('Please enter a valid email address');
        expect(validateEmail('@domain.com')).toBe('Please enter a valid email address');
      });

      it('suggests corrections for common typos', () => {
        const result = validateEmail('test@gmial.com');
        expect(result).toContain('gmail.com');
      });
    });

    describe('validatePassword', () => {
      it('validates correct passwords', () => {
        expect(validatePassword('password123')).toBeNull();
        expect(validatePassword('mySecurePass')).toBeNull();
      });

      it('rejects invalid passwords', () => {
        expect(validatePassword('')).toBe('Password is required');
        expect(validatePassword('123')).toBe('Password must be at least 8 characters long');
        expect(validatePassword('password')).toBe('This password is too common. Please choose a stronger password');
      });
    });

    describe('FormValidator', () => {
      it('validates form fields correctly', () => {
        const validator = new FormValidator();
        
        const emailError = validator.validateField('email', 'invalid');
        expect(emailError).toBe('Please enter a valid email address');

        const passwordError = validator.validateField('password', '123');
        expect(passwordError).toBe('Password must be at least 8 characters long');
      });

      it('tracks touched fields', () => {
        const validator = new FormValidator();
        
        validator.touch('email');
        validator.validateField('email', 'invalid');
        
        const touchedErrors = validator.getTouchedErrors();
        expect(touchedErrors.email).toBe('Please enter a valid email address');
      });
    });
  });
});
