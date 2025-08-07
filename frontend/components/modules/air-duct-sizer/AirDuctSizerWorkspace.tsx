'use client'

import React, { useState, useCallback, useEffect, Suspense, lazy, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Vector3, Euler } from 'three'
import { useToast } from '@/lib/hooks/useToaster'
import { Equipment } from '@/utils/EquipmentFactory'
import { EnhancedProjectService } from '@/lib/services/EnhancedProjectService'
import { useProjectStore } from '@/stores/project-store'
import { SizeWiseDatabase } from '@/lib/database/DexieDatabase'

// Direct import for debugging
import { Canvas3D } from '@/components/3d/Canvas3D';

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
  const { currentProject, updateProject } = useProjectStore();
  const projectService = useMemo(() => {
    const db = new SizeWiseDatabase();
    return new EnhancedProjectService(db, 'current-user'); // TODO: Get actual user ID
  }, []);

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
    complianceStatus: 'pending' as 'compliant' | 'non-compliant' | 'pending',
    totalRooms: 0,
    totalDucts: 0,
    totalEquipment: 0,
    maxVelocity: 0,
    avgVelocity: 0,
    totalLength: 0,
    energyConsumption: 0,
    compliance: {
      smacna: false,
      ashrae: false,
      local: false
    }
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

  // Enhanced segment handlers with database persistence
  const handleSegmentAdd = useCallback(async (segment: DuctSegment) => {
    try {
      // Calculate segment length from start/end points
      const segmentLength = segment.start.distanceTo(segment.end);

      // Update local state immediately for responsive UI
      setDuctSegments(prev => [...prev, segment]);

      // Update system summary counts
      setSystemSummary(prev => ({
        ...prev,
        totalDucts: prev.totalDucts + 1,
        totalLength: prev.totalLength + segmentLength
      }));

      // Persist to database if we have a current project
      if (currentProject && projectService) {
        // Convert DuctSegment to EnhancedDuctSegment for database storage
        const enhancedSegment = {
          segment_id: segment.id,
          type: 'straight' as const,
          material: segment.material || 'galvanized_steel',
          size: segment.shape === 'round'
            ? { diameter: segment.diameter || 12 }
            : { width: segment.width || 12, height: segment.height || 8 },
          length: segmentLength,
          airflow: segment.flowProperties?.airflow || 0,
          velocity: segment.velocity || 0,
          pressure_loss: segment.pressureDrop || 0,
          warnings: [],
          points: [segment.start.x, segment.start.y, segment.end.x, segment.end.y],
          ductNode: null, // Will be created by the service
          material3D: {
            type: (segment.material === 'aluminum' || segment.material === 'stainless_steel')
              ? segment.material as 'aluminum' | 'stainless_steel'
              : 'galvanized_steel' as const,
            gauge: '26' as const,
            finish: 'standard' as const
          },
          geometry3D: {
            position: { x: segment.start.x, y: segment.start.y, z: segment.start.z },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          connections: {}
        };

        await projectService.addDuctSegment(enhancedSegment);

        // Update project in store
        updateProject(currentProject.id, {
          ...currentProject,
          last_modified: new Date().toISOString()
        });

        toast({
          type: 'success',
          title: "Duct Added",
          message: `Duct segment added and saved to project`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to add duct segment:', error);
      toast({
        type: 'error',
        title: "Error Adding Duct",
        message: `Failed to save duct segment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000,
      });

      // Revert local state on error
      const revertLength = segment.start.distanceTo(segment.end);
      setDuctSegments(prev => prev.filter(s => s.id !== segment.id));
      setSystemSummary(prev => ({
        ...prev,
        totalDucts: Math.max(0, prev.totalDucts - 1),
        totalLength: Math.max(0, prev.totalLength - revertLength)
      }));
    }
  }, [currentProject, projectService, updateProject, toast]);

  const handleEquipmentAdd = useCallback(async (equipment: Equipment) => {
    try {
      // Update local state immediately
      setEquipment(prev => [...prev, equipment]);

      // Update system summary counts
      setSystemSummary(prev => ({
        ...prev,
        totalEquipment: prev.totalEquipment + 1
      }));

      // Persist to database if we have a current project
      if (currentProject && projectService) {
        // TODO: Implement equipment persistence
        toast({
          type: 'success',
          title: "Equipment Added",
          message: `Equipment added to project`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to add equipment:', error);
      toast({
        type: 'error',
        title: "Error Adding Equipment",
        message: `Failed to save equipment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000,
      });

      // Revert local state on error
      setEquipment(prev => prev.filter(e => e.id !== equipment.id));
      setSystemSummary(prev => ({
        ...prev,
        totalEquipment: Math.max(0, prev.totalEquipment - 1)
      }));
    }
  }, [currentProject, projectService, updateProject, toast]);

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
          // Create a properly typed update object for Equipment
          const equipmentUpdate: Partial<Equipment> = {};

          // Handle position conversion
          if (updates.position) {
            const pos = updates.position;
            equipmentUpdate.position = new Vector3(pos.x, pos.y, pos.z || 0);
          }

          // Handle other compatible properties
          if (updates.name) equipmentUpdate.name = updates.name;
          if (updates.dimensions) {
            equipmentUpdate.dimensions = {
              width: updates.dimensions.width,
              height: updates.dimensions.height,
              depth: updates.dimensions.depth || 1
            };
          }

          return { ...eq, ...equipmentUpdate };
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
          name: segment.id,
          position: { x: segment.start.x, y: segment.start.y, z: segment.start.z },
          dimensions: { width: segment.width || 8, height: segment.height || 8 },
          ductType: segment.ductType || 'supply',
          velocity: segment.velocity,
          pressureDrop: segment.pressureDrop
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

    const velocities = ductSegments.map(segment => segment.velocity || 0).filter(v => v > 0);
    const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0;
    const avgVelocity = velocities.length > 0 ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length : 0;

    const totalLength = ductSegments.reduce((sum, segment) => {
      const start = segment.start;
      const end = segment.end;
      const length = Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2) +
        Math.pow(end.z - start.z, 2)
      );
      return sum + length;
    }, 0);

    return {
      totalAirflow,
      totalPressureDrop,
      systemEfficiency: totalAirflow > 0 ? (totalAirflow / (totalPressureDrop + 1)) * 100 : 0,
      complianceStatus: 'pending' as const,
      totalRooms: 0, // TODO: Calculate from room data when available
      totalDucts: ductSegments.length,
      totalEquipment: equipment.length,
      maxVelocity,
      avgVelocity,
      totalLength,
      energyConsumption: totalAirflow * 0.001, // Rough estimate: 1W per CFM
      compliance: {
        smacna: maxVelocity <= 2500, // Basic SMACNA velocity check
        ashrae: totalPressureDrop <= 1.0, // Basic pressure drop check
        local: true // Assume local compliance for now
      }
    };
  }, [ductSegments, equipment]);

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
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading 3D Canvas...</p>
            </div>
          </div>
        }>
          <Canvas3D
            segments={ductSegments}
            equipment={equipment}
            selectedIds={selectedElement?.id ? [selectedElement.id] : []}
            onSegmentAdd={handleSegmentAdd}
            onSegmentUpdate={(id, updates) => {
              setDuctSegments(prev => prev.map(seg =>
                seg.id === id ? { ...seg, ...updates } : seg
              ));
            }}
            onSegmentDelete={(id) => {
              setDuctSegments(prev => prev.filter(seg => seg.id !== id));
            }}
            onEquipmentAdd={handleEquipmentAdd}
            enableDrawing={drawingMode !== 'off'}
            drawingTool={drawingMode === 'duct' ? 'duct' : null}
            onSelectionChange={(ids) => {
              if (ids.length > 0) {
                const segment = ductSegments.find(s => s.id === ids[0]);
                const eq = equipment.find(e => e.id === ids[0]);

                if (segment) {
                  setSelectedElement({
                    id: segment.id,
                    type: 'duct',
                    name: segment.id,
                    position: { x: segment.start.x, y: segment.start.y, z: segment.start.z },
                    dimensions: { width: segment.width || 8, height: segment.height || 8 },
                    ductType: segment.ductType || 'supply',
                    velocity: segment.velocity,
                    pressureDrop: segment.pressureDrop
                  });

                  // Set context panel position near the center of the screen for now
                  // TODO: Get actual click position from Canvas3D
                  setContextPanelPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                  });
                  setShowContextPanel(true);
                } else if (eq) {
                  setSelectedElement({
                    id: eq.id,
                    type: 'equipment',
                    name: eq.name || eq.type,
                    position: { x: eq.position.x, y: eq.position.y, z: eq.position.z },
                    dimensions: eq.dimensions ? { width: eq.dimensions.width, height: eq.dimensions.height } : { width: 2, height: 2 },
                    equipmentType: eq.type,
                    capacity: eq.capacity,
                    power: eq.power,
                    efficiency: eq.efficiency
                  });

                  // Set context panel position near the center of the screen for now
                  // TODO: Get actual click position from Canvas3D
                  setContextPanelPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                  });
                  setShowContextPanel(true);
                }
              } else {
                setSelectedElement(null);
                setShowContextPanel(false);
              }
            }}
            onCameraChange={(position) => {
              setCameraPosition(position);
            }}
            showGrid={true}
            showLabels={true}
            enableControls={true}
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
