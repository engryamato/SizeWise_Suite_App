/**
 * Snap Logic with Status Bar Integration
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Complete integration component that combines SnapLogicCanvas with the enhanced
 * SnapLogicStatusBar, replacing the floating Build Ductwork button with integrated
 * Results/Warnings Bar functionality.
 * 
 * @fileoverview Complete snap logic integration with status bar
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * return (
 *   <SnapLogicWithStatusBar
 *     rooms={rooms}
 *     segments={segments}
 *     equipment={equipment}
 *     onCanvasClick={handleCanvasClick}
 *     systemSummary={systemSummary}
 *     warnings={warnings}
 *   />
 * );
 * ```
 */

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { SnapLogicCanvas } from './SnapLogicCanvas';
import { SnapLogicStatusBar, SystemSummary } from './SnapLogicStatusBar';
import { DebugModeIntegration } from './DebugModeIntegration';
import { useSnapLogic } from '@/lib/hooks/useSnapLogic';
import { ValidationWarning } from '@/components/ui/WarningPanel';
import { Room, Segment, Equipment } from '@/types/air-duct-sizer';

/**
 * Props for SnapLogicWithStatusBar component
 */
interface SnapLogicWithStatusBarProps {
  // Project data
  rooms: Room[];
  segments: Segment[];
  equipment: Equipment[];
  
  // Event handlers
  onCanvasClick?: (position: { x: number; y: number }) => void;
  onBuildComplete?: (result: any) => void;
  onWarningClick?: (warning: ValidationWarning) => void;
  
  // System data
  systemSummary?: SystemSummary;
  warnings?: ValidationWarning[];
  selectedElement?: any;
  
  // UI configuration
  showDebugButton?: boolean;
  className?: string;
}

/**
 * Complete snap logic integration with status bar
 */
export const SnapLogicWithStatusBar: React.FC<SnapLogicWithStatusBarProps> = ({
  rooms,
  segments,
  equipment,
  onCanvasClick,
  onBuildComplete,
  onWarningClick,
  systemSummary,
  warnings = [],
  selectedElement,
  showDebugButton = true,
  className
}) => {
  const snapLogic = useSnapLogic();
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });

  // Handle Build Ductwork with progress tracking
  const handleBuildDuctwork = useCallback(async () => {
    try {
      const result = await snapLogic.buildDuctworkWithProgress();
      
      if (result.success) {
        // Success notification - could integrate with toast system
        console.log('Ductwork built successfully:', result);
        onBuildComplete?.(result);
        
        // Could show success toast here
        if (typeof window !== 'undefined' && 'alert' in window) {
          alert(`Ductwork built successfully!\n\nStats:\n- ${result.stats.segmentCount} segments\n- ${result.stats.fittingCount} fittings\n- ${result.stats.totalLength.toFixed(1)} total length`);
        }
      } else {
        // Error notification
        console.error('Build ductwork failed:', result.errors);
        
        if (typeof window !== 'undefined' && 'alert' in window) {
          alert(`Failed to build ductwork:\n\n${result.errors.join('\n')}`);
        }
      }
    } catch (error) {
      console.error('Build ductwork error:', error);
      
      if (typeof window !== 'undefined' && 'alert' in window) {
        alert('An error occurred while building ductwork. Please try again.');
      }
    }
  }, [snapLogic, onBuildComplete]);

  // Handle viewport changes (for debug overlay)
  const handleViewportChange = useCallback((newViewport: { x: number; y: number; scale: number }) => {
    setViewport(newViewport);
  }, []);

  // Default system summary if not provided
  const defaultSystemSummary: SystemSummary = {
    totalRooms: rooms.length,
    totalDucts: segments.length,
    totalEquipment: equipment.length,
    totalAirflow: 0,
    totalPressureDrop: 0,
    maxVelocity: 0,
    energyConsumption: 0,
    complianceStatus: snapLogic.centerlines.length > 0 ? 'pending' : 'compliant',
    systemEfficiency: 85.5,
    totalElements: rooms.length + segments.length + equipment.length,
    lastCalculation: new Date(),
    compliance: {
      smacna: true,
      ashrae: true,
      local: true
    }
  };

  const effectiveSystemSummary = systemSummary || defaultSystemSummary;

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {/* Main Canvas */}
      <SnapLogicCanvas
        rooms={rooms}
        segments={segments}
        equipment={equipment}
        onCanvasClick={onCanvasClick}
        onViewportChange={handleViewportChange}
        className="pb-16" // Add padding for status bar
      />

      {/* Enhanced Status Bar */}
      <SnapLogicStatusBar
        snapLogic={snapLogic}
        systemSummary={effectiveSystemSummary}
        warnings={warnings}
        selectedElement={selectedElement}
        buildProgress={snapLogic.buildProgress}
        onBuildDuctwork={handleBuildDuctwork}
        onWarningClick={onWarningClick}
      />

      {/* Debug Mode Integration */}
      {showDebugButton && (
        <DebugModeIntegration
          snapLogic={snapLogic}
          viewport={viewport}
          showDebugButton={showDebugButton}
        />
      )}
    </div>
  );
};

/**
 * Hook for managing snap logic with status bar integration
 */
export const useSnapLogicWithStatusBar = () => {
  const snapLogic = useSnapLogic();
  const [systemSummary, setSystemSummary] = useState<SystemSummary>({
    totalRooms: 0,
    totalDucts: 0,
    totalEquipment: 0,
    totalAirflow: 0,
    totalPressureDrop: 0,
    maxVelocity: 0,
    energyConsumption: 0,
    complianceStatus: 'compliant',
    systemEfficiency: 85.5,
    totalElements: 0,
    lastCalculation: new Date(),
    compliance: {
      smacna: true,
      ashrae: true,
      local: true
    }
  });

  // Update system summary based on snap logic state
  useEffect(() => {
    setSystemSummary(prev => ({
      ...prev,
      complianceStatus: snapLogic.centerlines.length > 0 ? 'pending' : 'compliant',
      totalElements: snapLogic.centerlines.length + snapLogic.branchPoints.length,
      lastCalculation: new Date()
    }));
  }, [snapLogic.centerlines.length, snapLogic.branchPoints.length]);

  return {
    snapLogic,
    systemSummary,
    setSystemSummary
  };
};

/**
 * Example usage component
 */
export const SnapLogicExample: React.FC = () => {
  const { snapLogic, systemSummary } = useSnapLogicWithStatusBar();
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);

  // Mock data
  const rooms: Room[] = [];
  const segments: Segment[] = [];
  const equipment: Equipment[] = [];

  const handleCanvasClick = useCallback((position: { x: number; y: number }) => {
    console.log('Canvas clicked at:', position);
  }, []);

  const handleBuildComplete = useCallback((result: any) => {
    console.log('Build completed:', result);
    
    // Add success message to warnings (as info)
    setWarnings(prev => [...prev, {
      id: `build-success-${Date.now()}`,
      type: 'info',
      category: 'SMACNA',
      title: 'Build Completed',
      message: `Successfully built ${result.stats.segmentCount} segments and ${result.stats.fittingCount} fittings`,
      severity: 'low',
      timestamp: new Date()
    }]);
  }, []);

  const handleWarningClick = useCallback((warning: ValidationWarning) => {
    console.log('Warning clicked:', warning);
    // Could open warning details modal here
  }, []);

  return (
    <div className="w-full h-screen">
      <SnapLogicWithStatusBar
        rooms={rooms}
        segments={segments}
        equipment={equipment}
        onCanvasClick={handleCanvasClick}
        onBuildComplete={handleBuildComplete}
        onWarningClick={handleWarningClick}
        systemSummary={systemSummary}
        warnings={warnings}
        showDebugButton={true}
      />
    </div>
  );
};

/**
 * Status bar integration utilities
 */
export const StatusBarUtils = {
  /**
   * Create validation warning from snap logic warning
   */
  createSnapLogicWarning: (message: string, severity: 'critical' | 'high' | 'medium' | 'low' = 'medium'): ValidationWarning => ({
    id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: severity === 'critical' ? 'error' : 'warning',
    category: 'SMACNA',
    title: 'Snap Logic Validation',
    message,
    severity,
    timestamp: new Date()
  }),

  /**
   * Merge snap logic warnings with system warnings
   */
  mergeWarnings: (systemWarnings: ValidationWarning[], snapWarnings: string[]): ValidationWarning[] => {
    const snapValidationWarnings = snapWarnings.map(warning => 
      StatusBarUtils.createSnapLogicWarning(warning)
    );
    return [...systemWarnings, ...snapValidationWarnings];
  },

  /**
   * Calculate system compliance based on warnings
   */
  calculateCompliance: (warnings: ValidationWarning[]): SystemSummary['complianceStatus'] => {
    const criticalWarnings = warnings.filter(w => w.severity === 'critical');
    const highWarnings = warnings.filter(w => w.severity === 'high');
    
    if (criticalWarnings.length > 0) return 'non-compliant';
    if (highWarnings.length > 0) return 'pending';
    return 'compliant';
  }
};
