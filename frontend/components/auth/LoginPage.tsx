/**
 * LoginPage Component
 * 
 * Main login page component that orchestrates all authentication subcomponents
 * with form state management, validation, and user experience features
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { LoginPageProps } from './types';
import { useAuthForm, useAuthentication, useRememberMe } from './hooks';
import { EmailInput, PasswordInput, InputGroup } from './FormInput';
import { SocialButtonGroup, SocialDivider } from './SocialButton';
import { RememberMeToggle } from './ToggleSwitch';
import Particles from './Particles';
import { 
  BRAND_CONFIG, 
  SOCIAL_PROVIDERS, 
  AUTH_FEATURES, 
  AUTH_REDIRECTS,
  A11Y_CONFIG,
  ERROR_MESSAGES 
} from './config';
import { cn } from '@/lib/utils';

// =============================================================================
// LoginPage Component
// =============================================================================

export const LoginPage: React.FC<LoginPageProps> = ({
  className = '',
  onLoginSuccess,
  onLoginError,
  showSuperAdminHint = false,
  returnUrl = '/',
}) => {
  const router = useRouter();
  const { rememberMe, setRememberMe } = useRememberMe();
  const { user, isAuthenticated, login, socialLogin, socialLoading } = useAuthentication();
  // Password visibility is handled by PasswordInput component

  // Form management
  const { formState, updateField, handleSubmit, setErrors } = useAuthForm(async (data) => {
    const result = await login(data);
    
    if (result.success) {
      onLoginSuccess?.(result);
      router.push(AUTH_REDIRECTS.afterLogin);
    } else {
      const error = result.error || ERROR_MESSAGES.unknownError;
      setErrors({ general: error });
      onLoginError?.(error);
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(AUTH_REDIRECTS.afterLogin);
    }
  }, [isAuthenticated, user, router]);

  // Handle social login
  const handleSocialLogin = async (provider: string) => {
    await socialLogin(provider);

    // For Phase 1, social login is not implemented
    // Just show a message that it will be available in Phase 2
    setErrors({ general: `${provider} authentication will be available in Phase 2` });
    onLoginError?.(`${provider} authentication will be available in Phase 2`);
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    // Phase 2 implementation
    console.log('Forgot password - Phase 2 feature');
    router.push(AUTH_REDIRECTS.forgotPassword);
  };

  // Handle create account
  const handleCreateAccount = () => {
    // Phase 2 implementation
    console.log('Create account - Phase 2 feature');
    router.push(AUTH_REDIRECTS.createAccount);
  };

  return (
    <div className={cn('min-h-screen relative flex items-center justify-center p-4', className)}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#ffffff', '#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              {BRAND_CONFIG.iconComponent}
            </div>

            {/* Brand Title */}
            <h1 className="text-3xl font-bold text-white mb-2">
              {BRAND_CONFIG.title}
            </h1>
            
            {/* Subtitle */}
            <p className="text-white/70 text-sm">
              {BRAND_CONFIG.subtitle}
            </p>
          </div>

          {/* Social Login */}
          {AUTH_FEATURES.socialLogin && (
            <div className="mb-6">
              <SocialButtonGroup
                providers={SOCIAL_PROVIDERS.map(provider => ({
                  provider: provider.id,
                  icon: provider.icon,
                  label: provider.name,
                  onClick: () => handleSocialLogin(provider.id),
                  enabled: provider.enabled,
                }))}
                orientation="horizontal"
                spacing="md"
                showLabels={false}
              />
              <SocialDivider text="or continue with email" className="mt-6" />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {formState.errors.general && (
              <div
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                role="alert"
                aria-live="polite"
              >
                <span className="font-medium">Error:</span> {formState.errors.general}
              </div>
            )}

            {/* Form Fields */}
            <InputGroup spacing="md">
              {/* Email Input */}
              <EmailInput
                name="email"
                value={formState.data.email}
                onChange={(value) => updateField('email', value)}
                label={A11Y_CONFIG.labels.emailInput}
                placeholder="Enter your email address"
                icon={<Mail size={20} />}
                error={formState.errors.email}
                disabled={formState.isSubmitting}
                required
                autoComplete="username"
              />

              {/* Password Input */}
              <PasswordInput
                name="password"
                value={formState.data.password}
                onChange={(value) => updateField('password', value)}
                label={A11Y_CONFIG.labels.passwordInput}
                placeholder="Enter your password"
                icon={<Lock size={20} />}
                error={formState.errors.password}
                disabled={formState.isSubmitting}
                required
                autoComplete="current-password"
              />
            </InputGroup>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              {AUTH_FEATURES.rememberMe && (
                <RememberMeToggle
                  checked={rememberMe}
                  onChange={setRememberMe}
                  disabled={formState.isSubmitting}
                />
              )}

              {AUTH_FEATURES.forgotPassword && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:underline"
                  disabled={formState.isSubmitting}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formState.isSubmitting || !formState.isValid}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              aria-label={A11Y_CONFIG.labels.loginButton}
            >
              {formState.isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Super Admin Hint */}
          {showSuperAdminHint && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center space-x-2 text-amber-400 text-sm">
                <Lock className="w-4 h-4" />
                <span className="font-medium">Super Administrator Access</span>
              </div>
              <p className="text-amber-300/80 text-xs mt-1">
                Use super admin credentials for full system access
              </p>
            </div>
          )}

          {/* Create Account Link */}
          {AUTH_FEATURES.createAccount && (
            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className="text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:underline font-medium"
                  disabled={formState.isSubmitting}
                >
                  Create one here
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs">
            © 2024 SizeWise Suite. All rights reserved.
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {socialLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">
              Connecting to {socialLoading}...
            </p>
          </div>
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {formState.isSubmitting && A11Y_CONFIG.announcements.loginStart}
        {formState.errors.general && A11Y_CONFIG.announcements.loginError}
      </div>
    </div>
  );
};

// =============================================================================
// Export Component
// =============================================================================

export default LoginPage;
