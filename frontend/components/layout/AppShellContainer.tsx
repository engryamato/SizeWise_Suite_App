/**
 * AppShell Container Component
 * 
 * Refactored container component that separates layout logic from presentation.
 * Integrates with service layer and manages application-level state while
 * delegating rendering to presentation components.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AppShellProps } from '../../types/component-interfaces';
import { useServiceContext } from '../../lib/providers/ServiceProvider';
import { useServices } from '../../lib/hooks/useServiceIntegration';
import { useUIStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../../lib/hooks/useTheme';
import { useToast } from '../../lib/hooks/useToaster';
import AppShellPresentation from './AppShellPresentation';

// Routes that should use minimal layout
const MINIMAL_LAYOUT_ROUTES = [
  '/login',
  '/signup',
  '/onboarding',
  '/auth',
];

// Routes that should not show laser background
const NO_LASER_ROUTES = [
  '/login',
  '/signup',
  '/onboarding',
  '/auth',
  '/export',
  '/preview',
  '/air-duct-sizer-v1', // Tool pages should have clean background
];

// Routes that are tool pages (should not show sidebar by default)
const TOOL_ROUTES = [
  '/air-duct-sizer-v1',
  '/air-duct-sizer',
];

/**
 * AppShell container component
 * Manages state and business logic, delegates rendering to presentation component
 */
export const AppShellContainer: React.FC<AppShellProps> = ({
  children,
  user,
  minimal = false,
  className = '',
  ...props
}) => {
  const pathname = usePathname();
  const { services, loading: servicesLoading, error: servicesError } = useServiceContext();
  const { tier } = useServices();
  const { toggleTheme, actualTheme } = useTheme();
  const toast = useToast();

  // UI state from stores
  const {
    sidebarOpen,
    setSidebarOpen,
    activePanel,
    setActivePanel,
    selectedObjects,
    notifications,
    addNotification,
    removeNotification
  } = useUIStore();

  const { user: currentUser, isAuthenticated } = useAuthStore();

  // Local component state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'enterprise' | 'super_admin'>('free');

  // Determine layout configuration
  const isMinimalLayout = minimal || MINIMAL_LAYOUT_ROUTES.some(route =>
    pathname.startsWith(route)
  );
  const shouldShowLaser = !NO_LASER_ROUTES.some(route =>
    pathname.startsWith(route)
  );
  const isToolPage = TOOL_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Load user tier information
  useEffect(() => {
    if (isAuthenticated && tier.service) {
      tier.getCurrentTier()
        .then(setUserTier)
        .catch(error => {
          console.error('Failed to load user tier:', error);
          toast.error('Failed to load user information');
        });
    }
  }, [isAuthenticated, tier, toast]);

  // Handle service errors
  useEffect(() => {
    if (servicesError) {
      toast.error(`Service error: ${servicesError}`);
    }
  }, [servicesError, toast]);

  // Event handlers
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
    toast.success(`Switched to ${actualTheme === 'dark' ? 'light' : 'dark'} theme`);
  }, [toggleTheme, actualTheme, toast]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen, setSidebarOpen]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(!mobileMenuOpen);
  }, [mobileMenuOpen]);

  const handleNotificationDismiss = useCallback((notificationId: string) => {
    removeNotification(notificationId);
  }, [removeNotification]);

  const handlePanelChange = useCallback((panel: 'project' | 'room' | 'segment' | 'equipment' | null) => {
    setActivePanel(panel);
  }, [setActivePanel]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        handleSidebarToggle();
      }

      // Escape to close panels
      if (event.key === 'Escape') {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSidebarToggle, mobileMenuOpen]);

  // Show loading state while services initialize
  if (servicesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading SizeWise Suite...</p>
        </div>
      </div>
    );
  }

  // Prepare props for presentation component
  const presentationProps = {
    // Layout configuration
    isMinimalLayout,
    shouldShowLaser,
    isToolPage,

    // User and authentication
    user: (user || currentUser) || undefined,
    isAuthenticated,
    userTier,

    // UI state
    sidebarOpen: isToolPage ? false : sidebarOpen, // Hide sidebar on tool pages
    activePanel,
    selectedObjects,
    mobileMenuOpen,

    // Theme
    isDarkMode: actualTheme === 'dark',

    // Notifications
    notifications,

    // Event handlers
    onThemeToggle: handleThemeToggle,
    onSidebarToggle: handleSidebarToggle,
    onMobileMenuToggle: handleMobileMenuToggle,
    onNotificationDismiss: handleNotificationDismiss,
    onPanelChange: handlePanelChange,

    // Content
    children,

    // Styling
    className,
    ...props
  };

  return <AppShellPresentation {...presentationProps} />;
};

/**
 * Default export for backward compatibility
 */
export default AppShellContainer;
