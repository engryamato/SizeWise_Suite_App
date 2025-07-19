"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CenteredNavigation } from "./CenteredNavigation";
import LaserBackground from "./LaserBackground";
import { ProjectPropertiesPanel } from "./ProjectPropertiesPanel";
import { useTheme } from "@/lib/hooks/useTheme";
import { useToast } from "@/lib/hooks/useToaster";

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
  const [showProjectProperties, setShowProjectProperties] = useState(false);
  const { toggleTheme, actualTheme } = useTheme();
  const toast = useToast();

  // Check if current route should use minimal layout
  const isMinimalLayout = MINIMAL_LAYOUT_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current route should show laser background
  const shouldShowLaser = !NO_LASER_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Demo toast on mount (remove in production)
  useEffect(() => {
    if (!isMinimalLayout) {
      const timer = setTimeout(() => {
        toast.success(
          "Welcome to SizeWise V1!",
          "New glassmorphism UI with centered navigation is now active.",
          { duration: 4000 }
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMinimalLayout, toast]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Open project properties with Ctrl/Cmd + P
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        setShowProjectProperties(true);
      }

      // Close modals with Escape
      if (event.key === 'Escape') {
        if (showProjectProperties) setShowProjectProperties(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProjectProperties]);

  // Minimal layout for auth pages, onboarding, etc.
  if (isMinimalLayout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {children}
      </div>
    );
  }

  // Full app shell layout with centered navigation
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Laser Background */}
      {shouldShowLaser && <LaserBackground />}

      {/* Centered Navigation */}
      <CenteredNavigation
        user={user}
        onThemeToggle={toggleTheme}
        isDarkMode={actualTheme === 'dark'}
      />

      {/* Main Content */}
      <main
        id="main-content"
        className="relative z-10 pt-24 pb-8"
        role="main"
        aria-label="Main content"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Project Properties Panel */}
      <ProjectPropertiesPanel
        isOpen={showProjectProperties}
        onClose={() => setShowProjectProperties(false)}
        onProjectUpdate={(project) => {
          toast.info("Project Updated", `${project.name} has been updated.`);
        }}
      />
    </div>
  );
};
