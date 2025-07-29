'use client';

import React, { ComponentType } from 'react';
import { useDeviceDetection } from '@/lib/hooks/useDeviceDetection';
import { MobileToolRestriction } from '@/components/ui/MobileToolRestriction';

/**
 * Props for tool access configuration
 */
interface ToolAccessConfig {
  toolName: string;
  toolDescription: string;
  requiresDesktop?: boolean; // If true, requires desktop (not just tablet+)
  customMinWidth?: number; // Custom minimum width requirement
}

/**
 * Higher-Order Component for Tool Access Control
 * 
 * Wraps tool components to enforce device-specific access restrictions.
 * Mobile devices (< 768px) are blocked from accessing professional HVAC tools.
 * 
 * Usage:
 * ```tsx
 * const ProtectedAirDuctSizer = withToolAccess(AirDuctSizerComponent, {
 *   toolName: 'Air Duct Sizer V1',
 *   toolDescription: 'Professional HVAC duct sizing with 3D visualization'
 * });
 * ```
 * 
 * @param WrappedComponent - The tool component to protect
 * @param config - Tool configuration including name and description
 * @returns Protected component that enforces device restrictions
 */
export function withToolAccess<P extends object>(
  WrappedComponent: ComponentType<P>,
  config: ToolAccessConfig
) {
  const ProtectedComponent: React.FC<P> = (props) => {
    const { capabilities, screenWidth, type } = useDeviceDetection();
    
    // Check if device meets requirements
    const meetsRequirements = (() => {
      // Custom width requirement
      if (config.customMinWidth) {
        return screenWidth >= config.customMinWidth;
      }
      
      // Desktop-only requirement
      if (config.requiresDesktop) {
        return type === 'desktop';
      }
      
      // Default: tablet and desktop allowed
      return capabilities.canAccessTools;
    })();

    // Show restriction screen for mobile devices
    if (!meetsRequirements) {
      return (
        <MobileToolRestriction
          toolName={config.toolName}
          toolDescription={config.toolDescription}
        />
      );
    }

    // Render the protected tool component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  ProtectedComponent.displayName = `withToolAccess(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ProtectedComponent;
}

/**
 * Predefined tool configurations for common SizeWise Suite tools
 */
export const TOOL_CONFIGS = {
  AIR_DUCT_SIZER: {
    toolName: 'Air Duct Sizer V1',
    toolDescription: 'Professional HVAC duct sizing with 3D visualization, real-time calculations, and SMACNA compliance checking',
  },
  LOAD_CALCULATOR: {
    toolName: 'Load Calculator',
    toolDescription: 'HVAC load calculation tools for heating and cooling requirements',
  },
  EQUIPMENT_SELECTOR: {
    toolName: 'Equipment Selector',
    toolDescription: 'Professional HVAC equipment selection and sizing tools',
  },
  DRAWING_TOOLS: {
    toolName: 'Drawing Tools',
    toolDescription: 'CAD-style drawing and design tools for HVAC system layouts',
  },
  SIMULATION_TOOLS: {
    toolName: 'Simulation Tools',
    toolDescription: 'Advanced HVAC system simulation and analysis tools',
    requiresDesktop: true, // Simulation tools require desktop for performance
  },
} as const;

/**
 * Convenience function to create protected Air Duct Sizer component
 */
export function withAirDuctSizerAccess<P extends object>(component: ComponentType<P>) {
  return withToolAccess(component, TOOL_CONFIGS.AIR_DUCT_SIZER);
}

/**
 * Convenience function to create protected Load Calculator component
 */
export function withLoadCalculatorAccess<P extends object>(component: ComponentType<P>) {
  return withToolAccess(component, TOOL_CONFIGS.LOAD_CALCULATOR);
}

/**
 * Convenience function to create protected Equipment Selector component
 */
export function withEquipmentSelectorAccess<P extends object>(component: ComponentType<P>) {
  return withToolAccess(component, TOOL_CONFIGS.EQUIPMENT_SELECTOR);
}

/**
 * Convenience function to create protected Drawing Tools component
 */
export function withDrawingToolsAccess<P extends object>(component: ComponentType<P>) {
  return withToolAccess(component, TOOL_CONFIGS.DRAWING_TOOLS);
}

/**
 * Convenience function to create protected Simulation Tools component
 */
export function withSimulationToolsAccess<P extends object>(component: ComponentType<P>) {
  return withToolAccess(component, TOOL_CONFIGS.SIMULATION_TOOLS);
}

export default withToolAccess;
