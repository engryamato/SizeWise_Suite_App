'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDeviceDetection } from '@/lib/hooks/useDeviceDetection';
import { MobileToolRestriction } from '@/components/ui/MobileToolRestriction';

/**
 * Tool route configuration
 */
interface ToolRoute {
  path: string;
  toolName: string;
  toolDescription: string;
  requiresDesktop?: boolean;
  customMinWidth?: number;
}

/**
 * Predefined tool routes that require device restrictions
 */
const TOOL_ROUTES: ToolRoute[] = [
  {
    path: '/air-duct-sizer-v1',
    toolName: 'Air Duct Sizer V1',
    toolDescription: 'Professional HVAC duct sizing with 3D visualization, real-time calculations, and SMACNA compliance checking',
  },
  {
    path: '/air-duct-sizer',
    toolName: 'Air Duct Sizer',
    toolDescription: 'Professional HVAC duct sizing tools',
  },
  {
    path: '/combustion-vent-sizer',
    toolName: 'Combustion Vent Sizer',
    toolDescription: 'Professional combustion vent sizing and calculation tools',
  },
  {
    path: '/grease-duct-sizer',
    toolName: 'Grease Duct Sizer',
    toolDescription: 'Commercial kitchen grease duct sizing and design tools',
  },
  {
    path: '/generator-exhaust-sizer',
    toolName: 'Generator Exhaust Sizer',
    toolDescription: 'Generator exhaust system sizing and design tools',
  },
  {
    path: '/estimating',
    toolName: 'Estimating App',
    toolDescription: 'Professional HVAC project estimation and costing tools',
  },
  {
    path: '/tools',
    toolName: 'HVAC Tools',
    toolDescription: 'Professional HVAC engineering and design tools',
  },
];

/**
 * Props for ToolRouteGuard component
 */
interface ToolRouteGuardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Tool Route Guard Component
 * 
 * Automatically detects if the current route is a tool route and enforces
 * device restrictions. Mobile devices are redirected to a restriction screen
 * for professional HVAC engineering tools.
 * 
 * This component should be placed high in the component tree to catch
 * tool route access attempts early.
 * 
 * Features:
 * - Automatic tool route detection
 * - Device capability checking
 * - Informative restriction screens
 * - Seamless pass-through for allowed devices
 * - Support for custom tool configurations
 */
export const ToolRouteGuard: React.FC<ToolRouteGuardProps> = ({
  children,
  className = ''
}) => {
  const pathname = usePathname();
  const { capabilities, screenWidth, type } = useDeviceDetection();

  // Check if current route is a tool route
  const currentToolRoute = TOOL_ROUTES.find(route => 
    pathname.startsWith(route.path)
  );

  // If not a tool route, render children normally
  if (!currentToolRoute) {
    return <>{children}</>;
  }

  // Check if device meets requirements for this tool
  const meetsRequirements = (() => {
    // Custom width requirement
    if (currentToolRoute.customMinWidth) {
      return screenWidth >= currentToolRoute.customMinWidth;
    }
    
    // Desktop-only requirement
    if (currentToolRoute.requiresDesktop) {
      return type === 'desktop';
    }
    
    // Default: tablet and desktop allowed
    return capabilities.canAccessTools;
  })();

  // Show restriction screen for devices that don't meet requirements
  if (!meetsRequirements) {
    return (
      <div className={className}>
        <MobileToolRestriction
          toolName={currentToolRoute.toolName}
          toolDescription={currentToolRoute.toolDescription}
        />
      </div>
    );
  }

  // Device meets requirements, render children
  return <>{children}</>;
};

/**
 * Hook to check if current route is a tool route
 */
export function useIsToolRoute(): {
  isToolRoute: boolean;
  toolRoute?: ToolRoute;
  canAccess: boolean;
} {
  const pathname = usePathname();
  const { capabilities, screenWidth, type } = useDeviceDetection();

  const toolRoute = TOOL_ROUTES.find(route => 
    pathname.startsWith(route.path)
  );

  const isToolRoute = !!toolRoute;

  const canAccess = !isToolRoute || (() => {
    if (!toolRoute) return true;
    
    // Custom width requirement
    if (toolRoute.customMinWidth) {
      return screenWidth >= toolRoute.customMinWidth;
    }
    
    // Desktop-only requirement
    if (toolRoute.requiresDesktop) {
      return type === 'desktop';
    }
    
    // Default: tablet and desktop allowed
    return capabilities.canAccessTools;
  })();

  return {
    isToolRoute,
    toolRoute,
    canAccess,
  };
}

/**
 * Utility function to add a new tool route
 */
export function addToolRoute(route: ToolRoute): void {
  // Check if route already exists
  const existingIndex = TOOL_ROUTES.findIndex(r => r.path === route.path);
  
  if (existingIndex >= 0) {
    // Update existing route
    TOOL_ROUTES[existingIndex] = route;
  } else {
    // Add new route
    TOOL_ROUTES.push(route);
  }
}

/**
 * Utility function to check if a path is a tool route
 */
export function isToolRoutePath(path: string): boolean {
  return TOOL_ROUTES.some(route => path.startsWith(route.path));
}

/**
 * Utility function to get tool route configuration
 */
export function getToolRoute(path: string): ToolRoute | undefined {
  return TOOL_ROUTES.find(route => path.startsWith(route.path));
}

/**
 * Constants for external use
 */
export const TOOL_ROUTE_PATHS = TOOL_ROUTES.map(route => route.path);

export default ToolRouteGuard;
