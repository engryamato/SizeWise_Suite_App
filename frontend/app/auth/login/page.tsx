/**
 * Login Page
 * 
 * Main authentication page for SizeWise Suite
 * Integrates with the new authentication system and super admin functionality
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { LoginPage } from '@/components/auth/LoginPage';
import { AUTH_REDIRECTS } from '@/components/auth/config';
import { motion } from 'framer-motion';

// =============================================================================
// Login Page Component
// =============================================================================

export default function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  // Get return URL from query parameters
  const returnUrlParam = searchParams.get('returnUrl');
  const returnUrl = returnUrlParam && returnUrlParam !== '/' ? returnUrlParam : AUTH_REDIRECTS.afterLogin;

  // =============================================================================
  // Authentication Check Effect
  // =============================================================================

  useEffect(() => {
    // If user is already authenticated, redirect to return URL or dashboard
    if (isAuthenticated && user && !isRedirecting) {
      console.log('User already authenticated, redirecting to:', returnUrl);
      setIsRedirecting(true);
      router.push(returnUrl);
    }
  }, [isAuthenticated, user, router, returnUrl, isRedirecting]);

  // =============================================================================
  // Login Success Handler
  // =============================================================================

  const handleLoginSuccess = (user: any) => {
    console.log('Login successful:', user);

    // Redirect to return URL or appropriate page based on user type
    if (user.tier === 'super_admin' || user.is_super_admin) {
      // Super admin can go to admin panel or return URL
      const adminReturnUrl = returnUrl.startsWith('/admin') ? returnUrl : '/admin';
      router.push(adminReturnUrl);
    } else {
      // Regular users go to return URL or dashboard
      router.push(returnUrl);
    }
  };

  // =============================================================================
  // Login Error Handler
  // =============================================================================

  const handleLoginError = (error: string) => {
    console.error('Login error:', error);
    // Error handling is managed by the LoginPage component
  };

  // =============================================================================
  // Render
  // =============================================================================

  // Don't render login page if already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-white"
        >
          <p>Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
        showSuperAdminHint={true}
        returnUrl={returnUrl}
      />
    </div>
  );
}
