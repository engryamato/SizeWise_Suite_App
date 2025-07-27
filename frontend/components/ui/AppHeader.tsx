"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Globe,
  Key,
  Menu,
} from "lucide-react";
import { useAuthStore } from '@/stores/auth-store';

interface AppHeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  notifications?: number;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  onMobileMenuToggle?: () => void;
  isMobile?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user = { name: "Demo User", email: "demo@sizewise.com", role: "Engineer" },
  notifications = 0,
  onThemeToggle,
  isDarkMode = false,
  onMobileMenuToggle,
  isMobile = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const authStore = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Logout handler
  const handleLogout = async () => {
    try {
      await authStore.logout();
      // Redirect to login page after logout
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      router.push('/auth/login');
    }
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="h-16 bg-neutral-900 dark:bg-neutral-950 border-b border-neutral-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left Section - Mobile Menu, Logo and Breadcrumbs */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        {isMobile && onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="p-2 text-neutral-400 hover:text-white transition-colors md:hidden"
            aria-label="Toggle mobile menu"
          >
            <Menu size={20} />
          </button>
        )}

        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/sizewise-logo.svg"
            alt="SizeWise Suite"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-semibold text-white hidden sm:block">
            SizeWise Suite
          </span>
        </Link>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href || crumb.label}>
              {index > 0 && (
                <span className="text-neutral-500">/</span>
              )}
              {crumb.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Section - Notifications and User Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-neutral-400 hover:text-white transition-colors group"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {notifications > 99 ? "99+" : notifications}
              </span>
            )}

            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Notifications
            </div>
          </button>

          {/* Notifications Dropdown with animation */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700 z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
                  Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications > 0 ? (
                  <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                    <p>You have {notifications} new notifications</p>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-neutral-500 text-center">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors group"
          >
            <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <User size={16} className="text-neutral-300" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-white">{user.name}</div>
              {user.role && (
                <div className="text-xs text-neutral-400">{user.role}</div>
              )}
            </div>
            <ChevronDown size={16} />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700 z-50">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                  {user.name}
                </div>
                <div className="text-sm text-neutral-500">{user.email}</div>
              </div>
              
              <div className="py-2">
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <Settings size={16} className="mr-3" />
                  Settings
                </Link>
                
                <button
                  type="button"
                  onClick={onThemeToggle}
                  className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {isDarkMode ? (
                    <Sun size={16} className="mr-3" />
                  ) : (
                    <Moon size={16} className="mr-3" />
                  )}
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
                
                <Link
                  href="/settings/language"
                  className="flex items-center px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <Globe size={16} className="mr-3" />
                  Language
                </Link>
                
                <Link
                  href="/settings/api"
                  className="flex items-center px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <Key size={16} className="mr-3" />
                  API Keys
                </Link>
                
                <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
