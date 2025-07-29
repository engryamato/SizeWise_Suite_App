/**
 * Authentication Guard Component
 * 
 * Protects routes by requiring authentication before access.
 * Redirects unauthenticated users to the login page.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { motion } from 'framer-motion';
import { Loader2, Shield, Lock } from 'lucide-react';

// =============================================================================
// Types and Interfaces
// =============================================================================

interface AuthGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

interface LoadingScreenProps {
  message?: string;
}

// =============================================================================
// Loading Screen Component
// =============================================================================

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Checking authentication...' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 w-12 h-12 text-blue-400"
          >
            <Loader2 className="w-full h-full" />
          </motion.div>
          
          <h2 className="text-xl font-semibold text-white mb-2">
            SizeWise Suite
          </h2>
          
          <p className="text-gray-300 text-sm">
            {message}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// =============================================================================
// Unauthorized Screen Component
// =============================================================================

const UnauthorizedScreen: React.FC<{ requireSuperAdmin?: boolean }> = ({ 
  requireSuperAdmin = false 
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto px-6"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="mx-auto mb-4 w-16 h-16 text-red-400">
            {requireSuperAdmin ? (
              <Shield className="w-full h-full" />
            ) : (
              <Lock className="w-full h-full" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {requireSuperAdmin ? 'Super Admin Required' : 'Authentication Required'}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {requireSuperAdmin 
              ? 'This area requires super administrator privileges to access.'
              : 'You must be logged in to access SizeWise Suite.'
            }
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/auth/login')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Go to Login
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// =============================================================================
// Main Auth Guard Component
// =============================================================================

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireSuperAdmin = false,
  fallback,
  redirectTo = '/auth/login'
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // =============================================================================
  // Authentication Check Effect
  // =============================================================================

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Allow some time for auth store to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we're on a public route that doesn't need protection
        const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
        if (publicRoutes.includes(pathname)) {
          setIsChecking(false);
          return;
        }

        // If still loading, wait a bit more
        if (isLoading) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setIsChecking(false);

        // Redirect if not authenticated
        if (!isAuthenticated || !user) {
          const returnUrl = encodeURIComponent(pathname);
          router.push(`${redirectTo}?returnUrl=${returnUrl}`);
          return;
        }

        // Check super admin requirement
        if (requireSuperAdmin) {
          const isSuperAdmin = user.tier === 'super_admin' || user.is_super_admin === true;
          if (!isSuperAdmin) {
            router.push('/'); // Redirect to home if not super admin
            return;
          }
        }

      } catch (error) {
        console.error('Authentication check error:', error);
        setIsChecking(false);
        router.push(redirectTo);
      }
    };

    checkAuthentication();
  }, [isAuthenticated, user, isLoading, pathname, router, redirectTo, requireSuperAdmin]);

  // =============================================================================
  // Render Logic
  // =============================================================================

  // Show loading screen while checking authentication
  if (isChecking || isLoading) {
    return fallback || <LoadingScreen />;
  }

  // Show unauthorized screen if not authenticated
  if (!isAuthenticated || !user) {
    return <UnauthorizedScreen requireSuperAdmin={requireSuperAdmin} />;
  }

  // Check super admin requirement
  if (requireSuperAdmin) {
    const isSuperAdmin = user.tier === 'super_admin' || user.is_super_admin === true;
    if (!isSuperAdmin) {
      return <UnauthorizedScreen requireSuperAdmin={true} />;
    }
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
};

// =============================================================================
// Higher-Order Component for Route Protection
// =============================================================================

export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireSuperAdmin?: boolean;
    redirectTo?: string;
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <AuthGuard
        requireSuperAdmin={options.requireSuperAdmin}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// =============================================================================
// Hook for Authentication Status
// =============================================================================

export function useAuthGuard() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  
  const isSuperAdmin = user?.tier === 'super_admin' || user?.is_super_admin === true;
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true; // Super admin has all permissions
    return user.permissions?.includes(permission) || false;
  };

  const canAccessAdmin = (): boolean => {
    return hasPermission('admin:full_access');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isSuperAdmin,
    hasPermission,
    canAccessAdmin,
  };
}

// =============================================================================
// Export Default
// =============================================================================

export default AuthGuard;
