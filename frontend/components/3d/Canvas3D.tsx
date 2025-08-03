"use client";

import React, { Suspense, useRef, useState, useCallback, useMemo } from 'react';
import { Vector3 } from 'three';
import { motion } from 'framer-motion';
import {
  Move3D,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Home,
  Grid3X3,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { defaultPerformanceConfig } from '@/lib/utils/performance';
import { DuctProperties } from '@/components/ui/DrawingToolFAB';
import { useRealTimeCalculations, useSystemCalculationStatus } from '@/lib/hooks/useRealTimeCalculations';
import { SystemValidationOverlay } from './validation/SystemValidationOverlay';

// Import modular components
import { Canvas3DCore } from './core/Canvas3DCore';
import { Canvas3DControls, CAMERA_PRESETS } from './core/Canvas3DControls';
import { Canvas3DPerformance, PerformanceUtils } from './core/Canvas3DPerformance';
import { DuctRenderer } from './duct/DuctRenderer';
import {
  Canvas3DProps,
  DuctSegment,
  Equipment,
  DuctFitting,
  PerformanceConfig,
  GridConfig,
  EnvironmentConfig,
  LightingConfig,
  SelectionState,
  DrawingTool
} from './types/Canvas3DTypes';

// Default configurations
const defaultGridConfig: GridConfig = {
  size: 100,
  divisions: 50,
  color: '#888888',
  visible: true,
  fadeDistance: 100,
  infiniteGrid: false
};

const defaultEnvironmentConfig: EnvironmentConfig = {
  preset: 'warehouse',
  background: '#f0f0f0',
  environmentIntensity: 0.5,
  backgroundBlurriness: 0.1
};

const defaultLightingConfig: LightingConfig = {
  ambientIntensity: 0.4,
  directionalIntensity: 1.0,
  directionalPosition: new Vector3(10, 10, 5),
  enableShadows: true,
  shadowMapSize: 2048
};

// Main Canvas3D Component - Refactored to use modular architecture
export const Canvas3D: React.FC<Canvas3DProps> = ({
  segments = [],
  equipment = [],
  fittings = [],
  selectedIds = [],
  onSelectionChange,
  onSegmentAdd,
  onEquipmentAdd,
  onFittingAdd,
  showGrid = true,
  showLabels = true,
  showDimensions = false,
  enableDrawing = false,
  drawingTool = null,
  className
}) => {
  // State management
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [performanceConfig, setPerformanceConfig] = useState<PerformanceConfig>(
    PerformanceUtils.getOptimalConfig()
  );
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedIds,
    hoveredId: null,
    multiSelect: false
  });

  // Real-time calculation integration
  const [calculationState, calculationActions] = useRealTimeCalculations({
    autoCalculate: true,
    debounceDelay: 300,
    enableValidation: true,
    onCalculationStart: (elementId) => {
      console.log(`Starting calculation for element: ${elementId}`);
    },
    onCalculationComplete: (result) => {
      console.log(`Calculation complete for ${result.elementId}:`, result);
    },
    onSystemCalculationComplete: (results) => {
      console.log('System calculation complete:', results);
    },
    onCalculationError: (elementId, error) => {
      console.error(`Calculation error for ${elementId}:`, error);
    },
    onValidationUpdate: (errors, warnings) => {
      if (errors.length > 0) {
        console.warn('Validation errors:', errors);
      }
      if (warnings.length > 0) {
        console.warn('Validation warnings:', warnings);
      }
    }
  });

  // System calculation status
  const systemStatus = useSystemCalculationStatus(calculationState);

  // Sync segments with real-time calculation system
  useEffect(() => {
    // Add existing segments to the calculation system
    segments.forEach(segment => {
      calculationActions.addSegment(segment);
    });

    // Add existing equipment to the calculation system
    equipment.forEach(equip => {
      calculationActions.addEquipment(equip);
    });

    // Add existing fittings to the calculation system
    fittings.forEach(fitting => {
      calculationActions.addFitting(fitting);
    });

    // Trigger initial system calculation
    if (segments.length > 0 || equipment.length > 0 || fittings.length > 0) {
      calculationActions.triggerSystemCalculation();
    }
  }, [segments, equipment, fittings, calculationActions]);

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    renderTime: 0
  });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Event handlers
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectionState(prev => ({ ...prev, selectedIds: ids }));
    onSelectionChange?.(ids);
  }, [onSelectionChange]);

  const handleSegmentClick = useCallback((segmentId: string, event: any) => {
    if (enableDrawing) return;

    const newSelection = selectionState.multiSelect
      ? selectionState.selectedIds.includes(segmentId)
        ? selectionState.selectedIds.filter(id => id !== segmentId)
        : [...selectionState.selectedIds, segmentId]
      : [segmentId];

    handleSelectionChange(newSelection);

    // Trigger calculation for the clicked segment
    calculationActions.triggerCalculation(segmentId);
  }, [enableDrawing, selectionState, handleSelectionChange, calculationActions]);

  const handleSegmentHover = useCallback((segmentId: string | null, event: any) => {
    setHoveredId(segmentId);
    setSelectionState(prev => ({ ...prev, hoveredId: segmentId }));
  }, []);

  const handleCameraChange = useCallback((camera: any) => {
    // Handle camera state changes for performance optimization
  }, []);

  const handlePerformanceUpdate = useCallback((config: Partial<PerformanceConfig>) => {
    setPerformanceConfig(prev => ({ ...prev, ...config }));
  }, []);

  const handleMetricsUpdate = useCallback((metrics: any) => {
    setPerformanceMetrics(metrics);
  }, []);

  // Render function
  return (
    <div className={cn("relative w-full h-full", className)}>
      <Canvas3DCore
        segments={segments}
        equipment={equipment}
        fittings={fittings}
        performanceConfig={performanceConfig}
        gridConfig={defaultGridConfig}
        environmentConfig={defaultEnvironmentConfig}
        lightingConfig={defaultLightingConfig}
        onSelectionChange={handleSelectionChange}
        onCameraChange={handleCameraChange}
      >
        {/* Performance monitoring */}
        <Canvas3DPerformance
          config={performanceConfig}
          onMetricsUpdate={handleMetricsUpdate}
          enableMonitoring={true}
          adaptiveQuality={true}
          targetFPS={60}
        />

        {/* Camera controls */}
        <Canvas3DControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          dampingFactor={0.1}
          onCameraChange={handleCameraChange}
        />

        {/* Duct rendering */}
        <DuctRenderer
          segments={segments}
          selectedIds={selectionState.selectedIds}
          hoveredId={selectionState.hoveredId}
          showLabels={showLabels}
          showDimensions={showDimensions}
          showConnectionPoints={enableDrawing}
          onSegmentClick={handleSegmentClick}
          onSegmentHover={handleSegmentHover}
        />
      </Canvas3DCore>

      {/* System Validation Overlay */}
      <SystemValidationOverlay
        calculationState={calculationState}
        systemAnalysis={calculationState.systemAnalysis}
        position="top-left"
        displayOptions={{
          showCalculationStatus: true,
          showFlowAnalysis: true,
          showValidationErrors: true,
          showValidationWarnings: true,
          autoHide: false
        }}
        onValidationClick={(elementId) => {
          console.log('Validation clicked for element:', elementId);
          // Could highlight the element in the 3D view
        }}
      />

      {/* Performance overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
          <div>FPS: {performanceMetrics.fps}</div>
          <div>Frame Time: {performanceMetrics.frameTime}ms</div>
          <div>Draw Calls: {performanceMetrics.drawCalls}</div>
          <div>Triangles: {performanceMetrics.triangles}</div>
        </div>
      )}
    </div>
  );
};

// Export the main component
export default Canvas3D;
