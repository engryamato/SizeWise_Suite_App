'use client'

import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Vector3, Euler } from 'three'
import { useToast } from '@/lib/hooks/useToaster'
import { withAirDuctSizerAccess } from '@/components/hoc/withToolAccess'
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

// Dynamic imports for V1 Components
const ProjectPropertiesManager = lazy(() =>
  import('@/components/managers/ProjectPropertiesManager').then(module => ({
    default: module.ProjectPropertiesManager
  }))
);
const DrawingToolFAB = lazy(() =>
  import('@/components/ui/DrawingToolFAB').then(module => ({
    default: module.DrawingToolFAB
  }))
);
const ContextPropertyPanel = lazy(() =>
  import('@/components/ui/ContextPropertyPanel').then(module => ({
    default: module.ContextPropertyPanel
  }))
);
const ModelSummaryPanel = lazy(() =>
  import('@/components/ui/ModelSummaryPanel').then(module => ({
    default: module.ModelSummaryPanel
  }))
);
const StatusBar = lazy(() =>
  import('@/components/ui/StatusBar').then(module => ({
    default: module.StatusBar
  }))
);

// Dynamic imports for Priority 5-7 Components
const WarningPanel = lazy(() =>
  import('@/components/ui/WarningPanel').then(module => ({
    default: module.WarningPanel
  }))
);

// Import types separately (not lazy loaded)
import type { DrawingMode, DuctProperties } from '@/components/ui/DrawingToolFAB'
import type { ElementProperties } from '@/constants/MockDataConstants'
import type { ValidationWarning } from '@/components/ui/WarningPanel'

// Dynamic import for ViewCube (3D navigation component)
const ViewCube = lazy(() => import('@/components/ui/ViewCube').then(module => ({
  default: module.ViewCube
})));

// Import ViewCubeOrientation type separately
import type { ViewCubeOrientation } from '@/components/ui/ViewCube'

// Shared hooks and utilities
import { useEquipmentPlacement } from '@/hooks/useEquipmentPlacement'
import { useElementSelection } from '@/hooks/useElementSelection'
import { useMockCalculations } from '@/hooks/useMockCalculations'
import { useUIStore } from '@/stores/ui-store'

import { BottomRightCorner } from '@/components/ui/BottomRightCorner'

// 3D Duct Segment interface for Canvas3D
interface DuctSegment {
  id: string;
  start: Vector3;
  end: Vector3;
  width?: number; // Optional for round ducts
  height?: number; // Optional for round ducts
  diameter?: number; // For round ducts
  shape: 'rectangular' | 'round';
  type: 'supply' | 'return' | 'exhaust';
  material: string;
}

// Import fitting types from Canvas3D - matching Canvas3D interface
interface ConnectionPoint {
  id: string;
  position: Vector3;
  direction: Vector3;
  shape: 'rectangular' | 'round';
  width?: number;
  height?: number;
  diameter?: number;
  status: 'available' | 'connected' | 'blocked';
  connectedTo?: string;
}

interface DuctFitting {
  id: string;
  type: 'transition' | 'elbow';
  position: Vector3;
  rotation: Euler;
  inlet: ConnectionPoint;
  outlet: ConnectionPoint;
  material: string;
}

// Project data interfaces


function AirDuctSizerPage() {
  // Panel visibility state
  const [showModelSummary, setShowModelSummary] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [contextPanelPosition, setContextPanelPosition] = useState({ x: 0, y: 0 });

  // Priority 5-7 Component state
  const [currentView, setCurrentView] = useState<ViewCubeOrientation>('isometric');
  const [cameraController, setCameraController] = useState<any>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

  // Drawing and selection state
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('off');
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null);
  const [ductSegments, setDuctSegments] = useState<DuctSegment[]>([]);
  const [ductFittings, setDuctFittings] = useState<DuctFitting[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // Grid and view state
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);



  // Calculation and validation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResults, setCalculationResults] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  // UI store for units selection
  const { units, setUnits } = useUIStore();

  // Connection state
  const [isOnline, setIsOnline] = useState(true);
  const [isConnectedToServer] = useState(true);

  // Duct properties state
  const [ductProperties, setDuctProperties] = useState<DuctProperties>({
    shape: 'rectangular',
    width: 12,
    height: 8,
    diameter: 12,
    material: 'Galvanized Steel',
    insulation: false,
    name: '' // Auto-generated, will be set when creating segments
  });

  // Hooks
  const toast = useToast();

  // Application starts with clean, empty 3D canvas (no demo data auto-loading)
  // Demo data constants are preserved in MockDataConstants.ts for manual calculations

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (saveStatus === 'unsaved') {
        setSaveStatus('saving');
        // Simulate save
        setTimeout(() => {
          setSaveStatus('saved');
          setLastSaved(new Date());
        }, 1000);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [saveStatus]);

  // Hide welcome message after 2 seconds
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 2000);

    return () => clearTimeout(welcomeTimer);
  }, []);

  // Event handlers

  const handleDrawingModeChange = useCallback((mode: DrawingMode) => {
    setDrawingMode(mode);
  }, []);

  // Use shared equipment placement hook
  const { handleEquipmentPlace } = useEquipmentPlacement(setEquipment);

  // Use shared element selection hook
  const { handleElementSelect } = useElementSelection(
    setSelectedElement,
    setContextPanelPosition,
    setShowContextPanel
  );

  const handleElementUpdate = useCallback((id: string, properties: Partial<ElementProperties>) => {
    if (selectedElement && selectedElement.id === id) {
      setSelectedElement((prev: ElementProperties | null) => prev ? { ...prev, ...properties } : null);
    }
    setSaveStatus('unsaved');
  }, [selectedElement]);

  const handleElementDelete = useCallback((id: string) => {
    setShowContextPanel(false);
    setSelectedElement(null);
    toast.success('Element deleted', 'Element removed from canvas');
    setSaveStatus('unsaved');
  }, [toast]);

  const handleElementCopy = useCallback((id: string) => {
    toast.success('Element copied', 'Element copied to clipboard');
  }, [toast]);

  // Use shared mock calculations hook
  const { handleCalculate: handleRunCalculation } = useMockCalculations(
    setCalculationResults,
    setWarnings,
    setIsCalculating,
    toast
  );

  const handleJumpToElement = useCallback((elementId: string) => {
    toast.info('Jumping to element', `Navigating to ${elementId}`);
    // In a real implementation, this would pan/zoom the canvas to the element
  }, [toast]);

  // Grid and zoom controls
  const handleGridToggle = useCallback(() => {
    setGridEnabled(prev => !prev);
  }, []);

  const handleSnapToggle = useCallback(() => {
    setSnapEnabled(prev => !prev);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Duct segment handlers
  const handleSegmentAdd = useCallback((segment: DuctSegment) => {
    setDuctSegments(prev => [...prev, segment]);
    setSaveStatus('unsaved');
    toast.success('Duct Added', 'New duct segment added to the system.');
  }, [toast]);

  const handleSegmentUpdate = useCallback((id: string, updates: Partial<DuctSegment>) => {
    setDuctSegments(prev =>
      prev.map(seg => seg.id === id ? { ...seg, ...updates } : seg)
    );
    setSaveStatus('unsaved');
  }, []);

  const handleSegmentDelete = useCallback((id: string) => {
    setDuctSegments(prev => prev.filter(seg => seg.id !== id));
    setSaveStatus('unsaved');
    toast.info('Duct Removed', 'Duct segment removed from the system.');
  }, [toast]);

  // Duct fitting handlers
  const handleFittingAdd = useCallback((fitting: DuctFitting) => {
    setDuctFittings(prev => [...prev, fitting]);
    setSaveStatus('unsaved');
    toast.success('Fitting Added', `${fitting.type === 'transition' ? 'Transition' : 'Elbow'} fitting automatically generated.`);
  }, [toast]);

  // Equipment handlers - using shared hook functionality
  const handleEquipmentAdd = useCallback((equip: Equipment) => {
    setEquipment(prev => [...prev, equip]);
    setSaveStatus('unsaved');
  }, []);

  // Priority 5-7 Component handlers
  const handleWarningClick = useCallback((warning: ValidationWarning) => {
    if (warning.elementId) {
      handleJumpToElement(warning.elementId);
    }
    toast.info('Warning Selected', `Navigating to ${warning.title}`);
  }, [handleJumpToElement, toast]);

  const handleWarningResolve = useCallback((warningId: string) => {
    setWarnings(prev => prev.map(w =>
      w.id === warningId ? { ...w, resolved: true } : w
    ));
    toast.success('Warning Resolved', 'Warning has been marked as resolved');
  }, [toast]);

  const handleWarningDismiss = useCallback((warningId: string) => {
    setWarnings(prev => prev.filter(w => w.id !== warningId));
    toast.info('Warning Dismissed', 'Warning has been dismissed');
  }, [toast]);

  const handleViewChange = useCallback((view: ViewCubeOrientation) => {
    setCurrentView(view);
    if (cameraController) {
      cameraController.setView(view, true);
      toast.info('View Changed', `Switched to ${view} view`);
    } else {
      toast.warning('Camera Not Ready', 'Camera controller is not yet initialized');
    }
  }, [cameraController, toast]);

  const handleResetView = useCallback(() => {
    setCurrentView('isometric');
    if (cameraController) {
      cameraController.resetView();
      toast.info('View Reset', 'Camera view reset to default isometric');
    } else {
      toast.warning('Camera Not Ready', 'Camera controller is not yet initialized');
    }
  }, [cameraController, toast]);

  const handleFitToScreen = useCallback(() => {
    if (cameraController) {
      cameraController.fitToScreen();
      toast.info('Fit to Screen', 'Camera adjusted to fit all elements');
    } else {
      toast.warning('Camera Not Ready', 'Camera controller is not yet initialized');
    }
  }, [cameraController, toast]);

  // Camera controller ready handler
  const handleCameraReady = useCallback((controller: any) => {
    setCameraController(controller);
    toast.success('Camera Ready', '3D navigation controls are now active');
  }, [toast]);

  // System summary data
  const systemSummary = {
    totalRooms: 0,
    totalDucts: ductSegments.length,
    totalEquipment: equipment.length,
    totalAirflow: 5000,
    totalPressureDrop: 1.2,
    maxVelocity: 1350,
    energyConsumption: 15.5,
    compliance: {
      smacna: true,
      ashrae: true,
      local: false
    }
  };

  // Calculate status for StatusBar
  const getCalculationStatus = () => {
    if (isCalculating) return 'running';
    if (calculationResults.length > 0) return 'complete';
    return 'idle';
  };
  const calculationStatus = getCalculationStatus();

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Unified Project Properties Manager */}
      <Suspense fallback={
        <div className="fixed top-0 left-0 w-full h-20 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 animate-pulse" />
      }>
        <ProjectPropertiesManager />
      </Suspense>

      {/* Main 3D Canvas Workspace */}
      <div className="absolute inset-0 top-20">
        <Suspense fallback={<Canvas3DLoader />}>
          <Canvas3D
            segments={ductSegments}
            onSegmentAdd={handleSegmentAdd}
            onSegmentUpdate={handleSegmentUpdate}
            onSegmentDelete={handleSegmentDelete}
            showGrid={gridEnabled}
            showGizmo={true}
            activeTool={drawingMode === 'duct' || drawingMode === 'drawing' ? 'line' : 'select'}
            onElementSelect={handleElementSelect}
            onCameraReady={handleCameraReady}
            ductProperties={ductProperties}
            fittings={ductFittings}
            onFittingAdd={handleFittingAdd}
            equipment={equipment}
            onEquipmentAdd={handleEquipmentAdd}
            onEquipmentPlace={drawingMode === 'equipment' ? handleEquipmentPlace : undefined}
          />
        </Suspense>
      </div>

      {/* Drawing Tool FAB */}
      <Suspense fallback={
        <div className="fixed bottom-6 left-6 w-16 h-16 bg-blue-500/20 rounded-full animate-pulse" />
      }>
        <DrawingToolFAB
          drawingMode={drawingMode}
          onDrawingModeChange={handleDrawingModeChange}
          onPropertyPanelOpen={() => {
            // Handle property panel opening if needed
          }}
          ductProperties={ductProperties}
          onDuctPropertiesChange={setDuctProperties}
          onEquipmentPlace={handleEquipmentPlace}
        />
      </Suspense>

      {/* Context Property Panel */}
      <Suspense fallback={
        showContextPanel ? (
          <div className="fixed bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 animate-pulse w-80 h-96"
               style={{ left: contextPanelPosition.x, top: contextPanelPosition.y }} />
        ) : null
      }>
        <ContextPropertyPanel
          isVisible={showContextPanel}
          selectedElement={selectedElement}
          position={contextPanelPosition}
          onClose={() => setShowContextPanel(false)}
          onElementUpdate={handleElementUpdate}
          onElementDelete={handleElementDelete}
          onElementCopy={handleElementCopy}
        />
      </Suspense>

      {/* Model Summary Panel */}
      <Suspense fallback={
        showModelSummary ? (
          <div className="fixed inset-y-0 right-0 w-96 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-l border-neutral-200 dark:border-neutral-700 animate-pulse" />
        ) : null
      }>
        <ModelSummaryPanel
          isOpen={showModelSummary}
          onClose={() => setShowModelSummary(false)}
          systemSummary={systemSummary}
          calculationResults={calculationResults}
          warnings={warnings}
          isCalculating={isCalculating}
          onRunCalculation={handleRunCalculation}
          onJumpToElement={handleJumpToElement}
        />
      </Suspense>

      {/* Status Bar */}
      <Suspense fallback={
        <div className="fixed bottom-0 left-0 w-full h-8 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-700 animate-pulse" />
      }>
        <StatusBar
          isOnline={isOnline}
          isConnectedToServer={isConnectedToServer}
          saveStatus={saveStatus}
          lastSaved={lastSaved}
          gridEnabled={gridEnabled}
          snapEnabled={snapEnabled}
          zoomLevel={zoomLevel}
          onGridToggle={handleGridToggle}
          onSnapToggle={handleSnapToggle}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          userName="Demo User"
          projectName="Air Duct Sizer"
          currentBranch="main"
          hasUnsavedChanges={saveStatus === 'unsaved'}
          calculationStatus={calculationStatus}
          warningCount={warnings.filter(w => w.type === 'warning' && !w.resolved).length}
          errorCount={warnings.filter(w => w.type === 'error' && !w.resolved).length}
          currentUnits={units}
          onUnitsChange={setUnits}
        />
      </Suspense>

      {/* Priority 5: Warning Panel */}
      <Suspense fallback={
        warnings.length > 0 ? (
          <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 w-80 h-32 bg-yellow-500/10 border border-yellow-500/20 rounded-lg animate-pulse" />
        ) : null
      }>
        <WarningPanel
          warnings={warnings}
          onWarningClick={handleWarningClick}
          onWarningResolve={handleWarningResolve}
          onWarningDismiss={handleWarningDismiss}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-40"
        />
      </Suspense>

      {/* Priority 6: Bottom Right Corner - Chat & Help */}
      <BottomRightCorner className="fixed bottom-6 right-6 z-50" />

      {/* Model Summary Trigger Button (floating) */}
      <motion.button
        type="button"
        onClick={() => setShowModelSummary(!showModelSummary)}
        className="fixed top-20 left-4 z-[60] flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isCalculating ? 360 : 0 }}
          transition={{ duration: 1, repeat: isCalculating ? Infinity : 0, ease: "linear" }}
        >
          📊
        </motion.div>
        <span className="text-sm font-medium">Model Summary</span>
        {warnings.filter(w => !w.resolved).length > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            {warnings.filter(w => !w.resolved).length}
          </span>
        )}
      </motion.button>

      {/* Priority 7: ViewCube 3D Navigation */}
      <Suspense fallback={
        <div className="fixed top-20 right-6 z-[70] w-16 h-16 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 rounded-xl animate-pulse" />
      }>
        <ViewCube
          currentView={currentView}
          onViewChange={handleViewChange}
          onResetView={handleResetView}
          onFitToScreen={handleFitToScreen}
          className="fixed top-20 right-6 z-[70]"
        />
      </Suspense>

      {/* Welcome Message - Positioned to not interfere with canvas */}
      <AnimatePresence>
        {showWelcomeMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="fixed top-40 right-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-4 z-30 max-w-sm text-center pointer-events-none"
          >
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">🏗️</span>
              <h4 className="font-semibold text-neutral-900 dark:text-white">
                Welcome to Air Duct Sizer!
              </h4>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
              Professional HVAC duct sizing with 3D visualization, real-time calculations, and SMACNA compliance checking.
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span>📐 3D Design</span>
              <span>⚡ Live Calc</span>
              <span>✅ SMACNA</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export with device access control
export default withAirDuctSizerAccess(AirDuctSizerPage);
