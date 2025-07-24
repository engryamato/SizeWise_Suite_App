'use client';

import { useState, useEffect } from 'react';

/**
 * Device types based on screen size and capabilities
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Device capabilities for tool access
 */
export interface DeviceCapabilities {
  canAccessTools: boolean;
  canAccessDashboard: boolean;
  canAccessProjects: boolean;
  canAccessReports: boolean;
  screenCategory: 'small' | 'medium' | 'large';
}

/**
 * Device information including type, capabilities, and screen details
 */
export interface DeviceInfo {
  type: DeviceType;
  capabilities: DeviceCapabilities;
  screenWidth: number;
  screenHeight: number;
  isTouchDevice: boolean;
  userAgent: string;
  isOnline: boolean;
}

/**
 * Device detection breakpoints
 * Based on SizeWise Suite requirements:
 * - Mobile phones (< 768px): Dashboard, projects, reports only
 * - Tablets & larger (≥ 768px): Full tool access
 */
const BREAKPOINTS = {
  mobile: 768, // Below this = mobile phone (restricted)
  tablet: 1024, // 768-1023 = tablet (full access)
  desktop: 1024, // 1024+ = desktop (full access)
} as const;

/**
 * Determine device type based on screen width
 */
function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}

/**
 * Determine device capabilities based on type and screen size
 */
function getDeviceCapabilities(type: DeviceType, width: number): DeviceCapabilities {
  const isMobile = type === 'mobile';
  
  return {
    // Mobile phones cannot access engineering tools
    canAccessTools: !isMobile,
    // All devices can access dashboard
    canAccessDashboard: true,
    // All devices can access projects
    canAccessProjects: true,
    // All devices can access reports
    canAccessReports: true,
    // Screen category for UI adjustments
    screenCategory: width < BREAKPOINTS.mobile ? 'small' : 
                   width < BREAKPOINTS.desktop ? 'medium' : 'large',
  };
}

/**
 * Check if device is touch-enabled
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get user agent string safely
 */
function getUserAgent(): string {
  if (typeof window === 'undefined') return '';
  return navigator.userAgent || '';
}

/**
 * Check online status
 */
function getOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Custom hook for device detection and capabilities
 * 
 * This hook provides comprehensive device information including:
 * - Device type (mobile/tablet/desktop)
 * - Tool access capabilities
 * - Screen dimensions and category
 * - Touch device detection
 * - Online status
 * 
 * Used throughout the app to enforce device-specific access restrictions
 * for professional HVAC engineering tools.
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Server-side rendering safe defaults
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        capabilities: {
          canAccessTools: true,
          canAccessDashboard: true,
          canAccessProjects: true,
          canAccessReports: true,
          screenCategory: 'large',
        },
        screenWidth: 1920,
        screenHeight: 1080,
        isTouchDevice: false,
        userAgent: '',
        isOnline: true,
      };
    }

    // Client-side initial values
    const width = window.innerWidth;
    const height = window.innerHeight;
    const type = getDeviceType(width);
    const capabilities = getDeviceCapabilities(type, width);

    return {
      type,
      capabilities,
      screenWidth: width,
      screenHeight: height,
      isTouchDevice: isTouchDevice(),
      userAgent: getUserAgent(),
      isOnline: getOnlineStatus(),
    };
  });

  useEffect(() => {
    // Update device info on window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const type = getDeviceType(width);
      const capabilities = getDeviceCapabilities(type, width);

      setDeviceInfo(prev => ({
        ...prev,
        type,
        capabilities,
        screenWidth: width,
        screenHeight: height,
      }));
    };

    // Update online status
    const handleOnline = () => {
      setDeviceInfo(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setDeviceInfo(prev => ({ ...prev, isOnline: false }));
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial update to ensure correct values
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return deviceInfo;
}

/**
 * Utility function to check if current device can access tools
 */
export function useCanAccessTools(): boolean {
  const { capabilities } = useDeviceDetection();
  return capabilities.canAccessTools;
}

/**
 * Utility function to get device type
 */
export function useDeviceType(): DeviceType {
  const { type } = useDeviceDetection();
  return type;
}

/**
 * Utility function to check if device is mobile
 */
export function useIsMobile(): boolean {
  const { type } = useDeviceDetection();
  return type === 'mobile';
}

/**
 * Constants for use in components
 */
export const DEVICE_REQUIREMENTS = {
  TOOLS_MIN_WIDTH: BREAKPOINTS.mobile,
  MOBILE_MAX_WIDTH: BREAKPOINTS.mobile - 1,
  TABLET_MIN_WIDTH: BREAKPOINTS.mobile,
  DESKTOP_MIN_WIDTH: BREAKPOINTS.desktop,
} as const;

/**
 * Helper function to get device requirement message
 */
export function getDeviceRequirementMessage(currentWidth: number): string {
  const requiredWidth = DEVICE_REQUIREMENTS.TOOLS_MIN_WIDTH;
  
  return `Professional HVAC engineering tools require a screen width of at least ${requiredWidth}px for optimal workflow. Your current screen is ${currentWidth}px wide. Please use a tablet, laptop, or desktop computer to access these tools.`;
}
