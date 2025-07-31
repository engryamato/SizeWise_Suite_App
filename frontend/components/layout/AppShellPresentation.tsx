/**
 * AppShell Presentation Component
 * 
 * Pure presentation component for the application shell layout.
 * Receives all data via props and focuses solely on rendering the UI.
 * No business logic or state management - only presentation concerns.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CenteredNavigation } from '../ui/CenteredNavigation';
import LaserBackground from '../ui/LaserBackground';
import { Sidebar } from '../ui/Sidebar';
import { StatusBar } from '../ui/StatusBar';

import { ToolRouteGuard } from '../guards/ToolRouteGuard';
import { User, Notification } from '../../types/air-duct-sizer';
import { UserTier } from '../../lib/repositories/interfaces/UserRepository';

// =============================================================================
// Presentation Component Props
// =============================================================================

export interface AppShellPresentationProps {
  // Layout configuration
  isMinimalLayout: boolean;
  shouldShowLaser: boolean;
  isToolPage?: boolean;

  // User and authentication
  user?: User;
  isAuthenticated: boolean;
  userTier: UserTier;
  
  // UI state
  sidebarOpen: boolean;
  activePanel: 'project' | 'room' | 'segment' | 'equipment' | null;
  selectedObjects: string[];
  mobileMenuOpen: boolean;
  
  // Theme
  isDarkMode: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Event handlers
  onThemeToggle: () => void;
  onSidebarToggle: () => void;
  onMobileMenuToggle: () => void;
  onNotificationDismiss: (id: string) => void;
  onPanelChange: (panel: 'project' | 'room' | 'segment' | 'equipment' | null) => void;
  
  // Content and styling
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// Presentation Component
// =============================================================================

/**
 * AppShell presentation component
 * Pure UI component with no business logic
 */
export const AppShellPresentation: React.FC<AppShellPresentationProps> = ({
  // Layout configuration
  isMinimalLayout,
  shouldShowLaser,
  isToolPage = false,

  // User and authentication
  user,
  isAuthenticated,
  userTier,

  // UI state
  sidebarOpen,
  activePanel,
  selectedObjects,
  mobileMenuOpen,

  // Theme
  isDarkMode,

  // Notifications
  notifications,

  // Event handlers
  onThemeToggle,
  onSidebarToggle,
  onMobileMenuToggle,
  onNotificationDismiss,
  onPanelChange,

  // Content and styling
  children,
  className = ''
}) => {
  // Minimal layout for auth pages
  if (isMinimalLayout) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}>
        {shouldShowLaser && <LaserBackground />}
        <main id="main-content" className="relative z-10">
          {children}
        </main>

      </div>
    );
  }

  // Full application layout
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden ${className}`}>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Laser Background */}
      {shouldShowLaser && <LaserBackground />}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onMobileMenuToggle}
          />
        )}
      </AnimatePresence>

      {/* Header Navigation */}
      <header className="relative z-30">
        <CenteredNavigation
          user={user}
          onThemeToggle={onThemeToggle}
          isDarkMode={isDarkMode}
        />
      </header>

      {/* Main Layout Container */}
      <div className="flex h-[calc(100vh-4rem)] relative z-20">
        {/* Sidebar - Hidden on tool pages */}
        <AnimatePresence>
          {sidebarOpen && !isToolPage && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50 shadow-lg"
            >
              <Sidebar />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main
          id="main-content"
          className={`flex-1 relative transition-all duration-300 ${
            sidebarOpen ? 'ml-0' : 'ml-0'
          }`}
        >
          {/* Content with Tool Route Protection */}
          <div className="h-full overflow-hidden">
            <ToolRouteGuard>
              {children}
            </ToolRouteGuard>
          </div>

          {/* Sidebar Toggle Button (when sidebar is closed and not on tool pages) */}
          {!sidebarOpen && !isToolPage && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onSidebarToggle}
              className="absolute top-4 left-4 z-10 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-900/90 transition-colors"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          )}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="relative z-30">
        <StatusBar
          isOnline={true} // This would come from actual connection status
          isConnectedToServer={true}
          saveStatus="saved"
          gridEnabled={true}
          snapEnabled={true}
          zoomLevel={1}
          onGridToggle={() => {}} // These would be connected to actual handlers
          onSnapToggle={() => {}}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onZoomReset={() => {}}
          summaryOpen={false}
          onSummaryToggle={() => {}}
          userName={user?.name}
          projectName="Current Project" // This would come from project state
          calculationStatus="idle"
          warningCount={0}
          errorCount={0}
        />
      </footer>





      {/* Tier Badge removed for clean UX - users don't need constant subscription reminders */}
    </div>
  );
};

/**
 * Default export for convenience
 */
export default AppShellPresentation;
