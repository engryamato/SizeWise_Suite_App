'use client'







<<<<<<<
import React, { useState, useCallback, useEffect } from 'react'

=======
// Simplified Air Duct Sizer V1 Page (Placeholder for build fix)

function AirDuctSizerV1Page() {

  return (

    <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-3xl font-bold text-gray-900 mb-4">

          Air Duct Sizer V1

        </h1>

        <p className="text-gray-600 mb-8">

          Professional HVAC duct sizing tool with 3D visualization

        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">

          <p className="text-yellow-800 text-sm">

            🚧 This tool is currently under development. 

            Please check back later for the full experience.

          </p>

        </div>

      </div>

    </div>

  );

}

>>>>>>>


import { motion, AnimatePresence } from 'framer-motion'



<<<<<<<
import { Vector3 } from 'three'



import { Canvas3D } from '@/components/3d/Canvas3D'



import { useToast } from '@/lib/hooks/useToaster'



import { withAirDuctSizerAccess } from '@/components/hoc/withToolAccess'







// V1 Components



import { ProjectPropertiesManager } from '@/components/managers/ProjectPropertiesManager'



import { DrawingToolFAB, DrawingMode } from '@/components/ui/DrawingToolFAB'



import { ContextPropertyPanel, ElementProperties } from '@/components/ui/ContextPropertyPanel'



import { ModelSummaryPanel } from '@/components/ui/ModelSummaryPanel'



import { StatusBar } from '@/components/ui/StatusBar'







// Priority 5-7 Components



import { WarningPanel, ValidationWarning } from '@/components/ui/WarningPanel'



import { ViewCube, ViewType } from '@/components/ui/ViewCube'







// 3D Duct Segment interface for Canvas3D



interface DuctSegment {



  id: string;



  start: Vector3;



  end: Vector3;



  width: number;



  height: number;



  type: 'supply' | 'return' | 'exhaust';



  material: string;



}







// Project data interfaces











function AirDuctSizerV1Page() {



  // Panel visibility state



  const [showModelSummary, setShowModelSummary] = useState(false);



  const [showContextPanel, setShowContextPanel] = useState(false);



  const [contextPanelPosition, setContextPanelPosition] = useState({ x: 0, y: 0 });







  // Priority 5-7 Component state



  const [warningPanelOpen, setWarningPanelOpen] = useState(false);



  const [currentView, setCurrentView] = useState<ViewType>('isometric');



  const [cameraController, setCameraController] = useState<any>(null);



  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);







  // Drawing and selection state



  const [drawingMode, setDrawingMode] = useState<DrawingMode>('off');



  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null);



  const [ductSegments, setDuctSegments] = useState<DuctSegment[]>([]);







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







  // Connection state



  const [isOnline, setIsOnline] = useState(true);



  const [isConnectedToServer, setIsConnectedToServer] = useState(true);







  // Hooks



  const toast = useToast();







  // Initialize with demo data (only once on mount)



  useEffect(() => {



    // Demo data - defined inside useEffect to avoid dependency issues



    const demoSegments: DuctSegment[] = [



      {



        id: 'demo-1',



        start: new Vector3(0, 0, 0),



        end: new Vector3(5, 0, 0),



        width: 12,



        height: 8,



        type: 'supply',



        material: 'galvanized_steel',



      },



      {



        id: 'demo-2',



        start: new Vector3(5, 0, 0),



        end: new Vector3(5, 0, 5),



        width: 10,



        height: 6,



        type: 'supply',



        material: 'galvanized_steel',



      },



      {



        id: 'demo-3',



        start: new Vector3(0, 0, 0),



        end: new Vector3(-3, 0, 0),



        width: 14,



        height: 10,



        type: 'return',



        material: 'galvanized_steel',



      },



    ];







    setDuctSegments(demoSegments);



    toast.info('Demo Data Loaded', 'Sample duct segments have been loaded for demonstration.');



  }, [toast]); // Only depend on toast, not demoSegments







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







  const handleElementSelect = useCallback((elementId: string, position: { x: number; y: number }) => {



    // Create mock element data for demonstration



    const mockElement: ElementProperties = {



      id: elementId,



      type: 'duct',



      name: `Duct ${elementId.slice(0, 8)}`,



      position: { x: position.x, y: position.y, z: 0 },



      dimensions: { width: 8, height: 8 },



      ductType: 'supply',



      velocity: 1200,



      pressureDrop: 0.1



    };



    



    setSelectedElement(mockElement);



    setContextPanelPosition(position);



    setShowContextPanel(true);



  }, []);







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







  const handleRunCalculation = useCallback(async () => {



    setIsCalculating(true);



    



    try {



      // Simulate calculation



      await new Promise(resolve => setTimeout(resolve, 2000));



      



      // Mock calculation results



      const mockResults = [



        {



          id: '1',



          elementId: 'duct-1',



          elementName: 'Main Supply Duct',



          type: 'duct' as const,



          status: 'pass' as const,



          value: 1150,



          unit: 'FPM',



          target: 1200,



          tolerance: 50



        },



        {



          id: '2',



          elementId: 'duct-2',



          elementName: 'Branch Duct A',



          type: 'duct' as const,



          status: 'warning' as const,



          value: 1350,



          unit: 'FPM',



          target: 1200,



          tolerance: 50



        }



      ];



      



      setCalculationResults(mockResults);



      



      // Mock warnings - Updated to match ValidationWarning interface



      const mockWarnings: ValidationWarning[] = [



        {



          id: 'w1',



          type: 'warning' as const,



          category: 'SMACNA' as const,



          severity: 'medium' as const,



          title: 'Velocity Exceeds Recommended Range',



          message: 'Duct segment DS-001 has a velocity of 1,350 FPM, which exceeds the recommended maximum of 1,200 FPM for supply ducts.',



          elementId: 'duct-2',



          elementType: 'duct',



          suggestion: 'Consider increasing duct size to reduce velocity.',



          standard: 'SMACNA',



          timestamp: new Date(),



          codeReference: 'SMACNA-2005 Table 5-1',



          resolved: false



        },



        {



          id: 'w2',



          type: 'error' as const,



          category: 'Safety' as const,



          severity: 'critical' as const,



          title: 'Critical Pressure Drop Exceeded',



          message: 'System pressure drop of 2.5" WC exceeds maximum allowable limit of 2.0" WC.',



          elementId: 'system-main',



          elementType: 'system',



          suggestion: 'Redesign duct layout or increase duct sizes to reduce pressure drop.',



          standard: 'ASHRAE',



          timestamp: new Date(),



          codeReference: 'ASHRAE 90.1-2019 Section 6.5.3',



          resolved: false



        },



        {



          id: 'w3',



          type: 'info' as const,



          category: 'Performance' as const,



          severity: 'low' as const,



          title: 'Energy Efficiency Opportunity',



          message: 'Current system design has potential for 15% energy savings with optimized duct sizing.',



          suggestion: 'Consider implementing variable air volume (VAV) system.',



          standard: 'ASHRAE',



          timestamp: new Date(),



          codeReference: 'ASHRAE 90.1-2019 Section 6.4',



          resolved: false



        }



      ];



      



      setWarnings(mockWarnings);



      toast.success('Calculation complete', 'System analysis completed successfully');



    } catch (error) {



      toast.error('Calculation failed', 'Please check your inputs and try again');



    } finally {



      setIsCalculating(false);



    }



  }, [toast]);







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







  const handleViewChange = useCallback((view: ViewType) => {



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



    totalEquipment: 0,



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







  return (



    <div className="h-screen w-full relative overflow-hidden">



      {/* Unified Project Properties Manager */}



      <ProjectPropertiesManager />







      {/* Main 3D Canvas Workspace */}



      <div className="absolute inset-0 top-20">



        <Canvas3D



          segments={ductSegments}



          onSegmentAdd={handleSegmentAdd}



          onSegmentUpdate={handleSegmentUpdate}



          onSegmentDelete={handleSegmentDelete}



          showGrid={gridEnabled}



          showGizmo={true}



          activeTool={drawingMode === 'on' || drawingMode === 'drawing' ? 'line' : 'select'}



          onElementSelect={handleElementSelect}



          onCameraReady={handleCameraReady}



        />



      </div>







      {/* Drawing Tool FAB */}



      <DrawingToolFAB



        drawingMode={drawingMode}



        onDrawingModeChange={handleDrawingModeChange}



        onPropertyPanelOpen={() => {



          // Handle property panel opening if needed



        }}



      />







      {/* Chat & Help elements removed from tool interface - only on main page */}







      {/* Context Property Panel */}



      <ContextPropertyPanel



        isVisible={showContextPanel}



        selectedElement={selectedElement}



        position={contextPanelPosition}



        onClose={() => setShowContextPanel(false)}



        onElementUpdate={handleElementUpdate}



        onElementDelete={handleElementDelete}



        onElementCopy={handleElementCopy}



      />







      {/* Model Summary Panel */}



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







      {/* Status Bar */}



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



        projectName="Air Duct Sizer V1"



        currentBranch="main"



        hasUnsavedChanges={saveStatus === 'unsaved'}



        calculationStatus={isCalculating ? 'running' : calculationResults.length > 0 ? 'complete' : 'idle'}



        warningCount={warnings.filter(w => w.type === 'warning' && !w.resolved).length}



        errorCount={warnings.filter(w => w.type === 'error' && !w.resolved).length}



      />







      {/* Priority 5: Warning Panel */}



      <WarningPanel



        warnings={warnings}



        onWarningClick={handleWarningClick}



        onWarningResolve={handleWarningResolve}



        onWarningDismiss={handleWarningDismiss}



        className="fixed right-6 top-1/2 -translate-y-1/2 z-40"



      />







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



      <ViewCube



        currentView={currentView}



        onViewChange={handleViewChange}



        onResetView={handleResetView}



        onFitToScreen={handleFitToScreen}



        className="fixed top-20 right-6 z-30"



      />







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



                Welcome to Air Duct Sizer V1!



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



export default withAirDuctSizerAccess(AirDuctSizerV1Page);



=======
// Temporarily disable HOC to fix build issues

// export default withAirDuctSizerAccess(AirDuctSizerV1Page)

export default AirDuctSizerV1Page

>>>>>>>
