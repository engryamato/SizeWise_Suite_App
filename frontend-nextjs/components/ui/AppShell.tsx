"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import LaserBackground from "./LaserBackground";
import { ChatButton } from "./ChatButton";
import { HelpPanel } from "./HelpPanel";
import { OnboardingOverlay } from "./OnboardingOverlay";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: "admin" | "user";
  };
}

// Routes that should NOT show the app shell (minimal layout)
const MINIMAL_LAYOUT_ROUTES = [
  "/login",
  "/signup",
  "/onboarding",
  "/auth",
];

// Routes that should NOT show the laser background
const NO_LASER_ROUTES = [
  "/login",
  "/signup",
  "/onboarding",
  "/auth",
  "/export",
  "/preview",
];

export const AppShell: React.FC<AppShellProps> = ({
  children,
  user = { name: "Demo User", email: "demo@sizewise.com", role: "user" },
}) => {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Check if current route should use minimal layout
  const isMinimalLayout = MINIMAL_LAYOUT_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current route should show laser background
  const shouldShowLaser = !NO_LASER_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth < 1024;
      setIsMobile(mobile);

      // Auto-collapse sidebar on mobile and tablet
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        handleSidebarToggle();
      }

      // Open help with F1 or Ctrl/Cmd + ?
      if (event.key === 'F1' || ((event.ctrlKey || event.metaKey) && event.key === '?')) {
        event.preventDefault();
        setIsHelpOpen(true);
      }

      // Close modals with Escape
      if (event.key === 'Escape') {
        if (isHelpOpen) setIsHelpOpen(false);
        if (isOnboardingOpen) setIsOnboardingOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, isOnboardingOpen]);

  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, this would persist to localStorage/user preferences
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Handle reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    
    if (prefersReducedMotion) {
      // Could disable laser animations here if needed
      console.log("User prefers reduced motion - consider disabling animations");
    }
  }, []);

  // Minimal layout for auth pages, onboarding, etc.
  if (isMinimalLayout) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
        <div className="min-h-screen bg-white dark:bg-neutral-900">
          {children}
        </div>
      </div>
    );
  }

  // Full app shell layout
  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Laser Background */}
      {shouldShowLaser && <LaserBackground />}

      {/* App Shell */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <AppHeader
          user={user}
          notifications={5}
          onThemeToggle={handleThemeToggle}
          isDarkMode={isDarkMode}
          onMobileMenuToggle={handleSidebarToggle}
          isMobile={isMobile}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <AppSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
            userRole={user.role}
            onHelpClick={() => setIsHelpOpen(true)}
          />

          {/* Main Content */}
          <main
            id="main-content"
            className="flex-1 overflow-auto bg-white dark:bg-neutral-900"
            role="main"
            aria-label="Main content"
          >
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Interactive Components */}
      <ChatButton />
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <OnboardingOverlay
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false);
          // In a real app, this would save completion status to localStorage/user preferences
          console.log("Onboarding completed!");
        }}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobile && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsSidebarCollapsed(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
};
