'use client'

import React, { useState, useCallback, useEffect, Suspense, lazy, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Vector3, Euler } from 'three'
import { useToast } from '@/lib/hooks/useToaster'
import { Equipment } from '@/utils/EquipmentFactory'

// Dynamic imports for heavy components
const Canvas3D = lazy(() => import('@/components/3d/Canvas3D').then(module => ({
  default: module.Canvas3D
})));

// Loading component for Canvas3D
const Canvas3DLoader = () => (
  <div className="absolute inset-0 top-20 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
    <div className="text-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 mx-auto border-4 border-blue-500 border-t-transparent rounded-full"
      />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Loading 3D workspace...
      </p>
    </div>
  </div>
);

// Dynamic imports for Air Duct Sizer specific components
const AirDuctSizerToolbar = lazy(() =>
  import('./components/AirDuctSizerToolbar').then(module => ({
    default: module.AirDuctSizerToolbar
  }))
);

const AirDuctSizerPanels = lazy(() =>
  import('./components/AirDuctSizerPanels').then(module => ({
    default: module.AirDuctSizerPanels
  }))
);

const AirDuctSizerStatusBar = lazy(() =>
  import('./components/AirDuctSizerStatusBar').then(module => ({
    default: module.AirDuctSizerStatusBar
  }))
);

// Import types
import type { DrawingMode, DuctProperties } from '@/components/ui/DrawingToolFAB'
import type { ElementProperties } from '@/components/ui/ContextPropertyPanel'
import type { ValidationWarning } from '@/components/ui/WarningPanel'
import type { ViewCubeOrientation } from '@/components/ui/ViewCube'
import type { DuctSegment } from '@/components/3d/types/Canvas3DTypes'

export interface AirDuctSizerWorkspaceProps {
  className?: string;
}

export const AirDuctSizerWorkspace: React.FC<AirDuctSizerWorkspaceProps> = ({
  className = ""
}) => {
  const { toast } = useToast();

  // Core state management
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('off');
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [contextPanelPosition, setContextPanelPosition] = useState({ x: 0, y: 0 });
  const [showModelSummary, setShowModelSummary] = useState(false);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);

  // 3D Canvas state
  const [cameraPosition, setCameraPosition] = useState<Vector3>(new Vector3(10, 10, 10));
  const [cameraRotation, setCameraRotation] = useState<Euler>(new Euler(0, 0, 0));
  const [viewCubeOrientation, setViewCubeOrientation] = useState<ViewCubeOrientation>('front');

  // Project data state
  const [ductSegments, setDuctSegments] = useState<DuctSegment[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // Calculation state
  const [systemSummary, setSystemSummary] = useState({
    totalAirflow: 0,
    totalPressureDrop: 0,
    systemEfficiency: 0,
    complianceStatus: 'pending' as 'compliant' | 'non-compliant' | 'pending'
  });

  const [calculationResults, setCalculationResults] = useState({
    segments: new Map(),
    equipment: new Map(),
    systemMetrics: {}
  });

  // Event handlers
  const handleDrawingModeChange = useCallback((mode: DrawingMode) => {
    setDrawingMode(mode);
    toast({
      type: 'info',
      title: "Drawing Mode Changed",
      message: `Switched to ${mode} mode`,
      duration: 2000,
    });
  }, [toast]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<ElementProperties>) => {
    // Handle element updates
    console.log('Element updated:', elementId, updates);
    
    // Update the appropriate state based on element type
    if (updates.type === 'duct') {
      setDuctSegments(prev => prev.map(segment => {
        if (segment.id === elementId) {
          // Only apply compatible updates to DuctSegment
          const { type, ...compatibleUpdates } = updates;
          return { ...segment, ...compatibleUpdates };
        }
        return segment;
      }));
    } else if (updates.type === 'equipment') {
      setEquipment(prev => prev.map(eq => {
        if (eq.id === elementId) {
          // Only apply compatible updates to Equipment
          const { type, ...compatibleUpdates } = updates;
          return { ...eq, ...compatibleUpdates };
        }
        return eq;
      }));
    }

    toast({
      type: 'success',
      title: "Element Updated",
      message: `${updates.type || 'Element'} properties updated`,
      duration: 2000,
    });
  }, [toast]);

  const handleSegmentSelect = useCallback((segmentId: string | null) => {
    if (segmentId) {
      const segment = ductSegments.find(s => s.id === segmentId);
      if (segment) {
        setSelectedElement({
          id: segment.id,
          type: 'duct',
          name: `Duct ${segment.id.slice(0, 8)}`,
          position: { x: segment.start.x, y: segment.start.y, z: segment.start.z },
          dimensions: { width: segment.width || 8, height: segment.height || 8 },
          ductType: segment.type,
          velocity: segment.flowProperties?.velocity || 0,
          pressureDrop: segment.flowProperties?.pressureDrop || 0
        });
      }
    } else {
      setSelectedElement(null);
    }
  }, [ductSegments]);

  const handleSegmentHover = useCallback((segmentId: string | null) => {
    // Handle segment hover for highlighting
    console.log('Segment hover:', segmentId);
  }, []);

  const handleContextMenu = useCallback((event: React.MouseEvent, elementId?: string) => {
    event.preventDefault();
    
    if (elementId) {
      setContextPanelPosition({ x: event.clientX, y: event.clientY });
      setShowContextPanel(true);
      
      // Set selected element for context panel
      const segment = ductSegments.find(s => s.id === elementId);
      if (segment) {
        setSelectedElement({
          id: segment.id,
          type: 'duct',
          properties: segment
        });
      }
    }
  }, [ductSegments]);

  // Memoized calculations
  const memoizedSystemSummary = useMemo(() => {
    // Recalculate system summary when segments or equipment change
    const totalAirflow = ductSegments.reduce((sum, segment) => {
      return sum + (segment.flowProperties?.airflow || 0);
    }, 0);

    const totalPressureDrop = ductSegments.reduce((sum, segment) => {
      return sum + (segment.flowProperties?.pressureDrop || 0);
    }, 0);

    return {
      totalAirflow,
      totalPressureDrop,
      systemEfficiency: totalAirflow > 0 ? (totalAirflow / (totalPressureDrop + 1)) * 100 : 0,
      complianceStatus: 'pending' as const
    };
  }, [ductSegments]);

  // Update system summary when calculations change
  useEffect(() => {
    setSystemSummary(memoizedSystemSummary);
  }, [memoizedSystemSummary]);

  return (
    <div className={`h-screen w-full relative overflow-hidden ${className}`}>
      {/* Air Duct Sizer Toolbar */}
      <Suspense fallback={
        <div className="fixed top-0 left-0 w-full h-20 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 animate-pulse" />
      }>
        <AirDuctSizerToolbar
          drawingMode={drawingMode}
          onDrawingModeChange={handleDrawingModeChange}
          onToggleModelSummary={() => setShowModelSummary(!showModelSummary)}
          systemSummary={systemSummary}
        />
      </Suspense>

      {/* Main 3D Canvas Workspace */}
      <div className="absolute inset-0 top-20">
        <Suspense fallback={<Canvas3DLoader />}>
          <Canvas3D
            drawingMode={drawingMode}
            onSegmentSelect={handleSegmentSelect}
            onSegmentHover={handleSegmentHover}
            onContextMenu={handleContextMenu}
            cameraPosition={cameraPosition}
            cameraRotation={cameraRotation}
            onCameraChange={(position, rotation) => {
              setCameraPosition(position);
              setCameraRotation(rotation);
            }}
            ductSegments={ductSegments}
            equipment={equipment}
            selectedElementId={selectedElement?.id || null}
          />
        </Suspense>
      </div>

      {/* Air Duct Sizer Panels */}
      <Suspense fallback={null}>
        <AirDuctSizerPanels
          showContextPanel={showContextPanel}
          selectedElement={selectedElement}
          contextPanelPosition={contextPanelPosition}
          onCloseContextPanel={() => setShowContextPanel(false)}
          onElementUpdate={handleElementUpdate}
          showModelSummary={showModelSummary}
          onCloseModelSummary={() => setShowModelSummary(false)}
          systemSummary={systemSummary}
          calculationResults={calculationResults}
          warnings={warnings}
          drawingMode={drawingMode}
          onDrawingModeChange={handleDrawingModeChange}
        />
      </Suspense>

      {/* Status Bar */}
      <Suspense fallback={null}>
        <AirDuctSizerStatusBar
          systemSummary={systemSummary}
          calculationResults={calculationResults}
          warnings={warnings}
          selectedElement={selectedElement}
        />
      </Suspense>
    </div>
  );
};
