'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Vector3 } from 'three'
import { Canvas3D } from '@/components/3d/Canvas3D'
import { useToast } from '@/lib/hooks/useToaster'

// V1 Components
import { ProjectPropertiesPanel, ProjectPropertiesTrigger } from '@/components/ui/ProjectPropertiesPanel'
import { DrawingToolFAB, DrawingTool } from '@/components/ui/DrawingToolFAB'
import { ContextPropertyPanel, ElementProperties } from '@/components/ui/ContextPropertyPanel'
import { ModelSummaryPanel } from '@/components/ui/ModelSummaryPanel'
import { StatusBar } from '@/components/ui/StatusBar'

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
interface ProjectInfo {
  name: string;
  number: string;
  description: string;
  location: string;
  clientName: string;
  estimatorName: string;
  dateCreated: string;
  lastModified: string;
  version: string;
}

interface CodeStandards {
  smacna: boolean;
  ashrae: boolean;
  ul: boolean;
  imc: boolean;
  nfpa: boolean;
}

interface GlobalDefaults {
  units: 'Imperial' | 'Metric';
  defaultDuctSize: { width: number; height: number };
  defaultMaterial: string;
  defaultInsulation: string;
  defaultFitting: string;
  calibrationMode: 'Auto' | 'Manual';
  defaultVelocity: number;
  pressureClass: string;
  altitude: number;
  frictionRate: number;
}

export default function AirDuctSizerV1Page() {
  // Panel visibility state
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [showModelSummary, setShowModelSummary] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [contextPanelPosition, setContextPanelPosition] = useState({ x: 0, y: 0 });

  // Drawing and selection state
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null);
  const [ductSegments, setDuctSegments] = useState<DuctSegment[]>([]);

  // Grid and view state
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Project data state
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: 'New Air Duct Project',
    number: 'ADS-001',
    description: 'HVAC duct sizing project',
    location: 'Not specified',
    clientName: 'Demo Client',
    estimatorName: 'Demo User',
    dateCreated: new Date().toLocaleDateString(),
    lastModified: new Date().toLocaleDateString(),
    version: '1.0.0'
  });

  const [codeStandards, setCodeStandards] = useState<CodeStandards>({
    smacna: true,
    ashrae: true,
    ul: false,
    imc: false,
    nfpa: false
  });

  const [globalDefaults, setGlobalDefaults] = useState<GlobalDefaults>({
    units: 'Imperial',
    defaultDuctSize: { width: 8, height: 8 },
    defaultMaterial: 'galvanized_steel',
    defaultInsulation: 'none',
    defaultFitting: 'standard',
    calibrationMode: 'Auto',
    defaultVelocity: 1200,
    pressureClass: 'Low',
    altitude: 0,
    frictionRate: 0.08
  });

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

  // Demo data
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

  // Initialize with demo data
  useEffect(() => {
    setDuctSegments(demoSegments);
    toast.info('Demo Data Loaded', 'Sample duct segments have been loaded for demonstration.');
  }, [toast]);

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

  // Event handlers
  const handleProjectInfoChange = useCallback((info: Partial<ProjectInfo>) => {
    setProjectInfo(prev => ({ ...prev, ...info }));
    setSaveStatus('unsaved');
  }, []);

  const handleCodeStandardsChange = useCallback((standards: Partial<CodeStandards>) => {
    setCodeStandards(prev => ({ ...prev, ...standards }));
    setSaveStatus('unsaved');
  }, []);

  const handleGlobalDefaultsChange = useCallback((defaults: Partial<GlobalDefaults>) => {
    setGlobalDefaults(prev => ({ ...prev, ...defaults }));
    setSaveStatus('unsaved');
  }, []);

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
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
      setSelectedElement(prev => prev ? { ...prev, ...properties } : null);
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
      
      // Mock warnings
      const mockWarnings = [
        {
          id: 'w1',
          type: 'warning' as const,
          severity: 'medium' as const,
          title: 'Velocity Exceeds Recommended Range',
          message: 'Duct segment DS-001 has a velocity of 1,350 FPM, which exceeds the recommended maximum of 1,200 FPM for supply ducts.',
          elementId: 'duct-2',
          elementName: 'Branch Duct A',
          suggestion: 'Consider increasing duct size to reduce velocity.',
          standard: 'SMACNA'
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
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Project Properties Trigger */}
      <ProjectPropertiesTrigger
        onClick={() => setShowProjectPanel(true)}
        isActive={showProjectPanel}
      />

      {/* Project Properties Panel */}
      <ProjectPropertiesPanel
        isOpen={showProjectPanel}
        onClose={() => setShowProjectPanel(false)}
        projectInfo={projectInfo}
        codeStandards={codeStandards}
        globalDefaults={globalDefaults}
        onProjectInfoChange={handleProjectInfoChange}
        onCodeStandardsChange={handleCodeStandardsChange}
        onGlobalDefaultsChange={handleGlobalDefaultsChange}
      />

      {/* Main 3D Canvas Workspace */}
      <div className="absolute inset-0">
        <Canvas3D
          segments={ductSegments}
          onSegmentAdd={handleSegmentAdd}
          onSegmentUpdate={handleSegmentUpdate}
          onSegmentDelete={handleSegmentDelete}
          showGrid={gridEnabled}
          showGizmo={true}
        />
      </div>

      {/* Drawing Tool FAB */}
      <DrawingToolFAB
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onPropertyPanelOpen={() => {
          // Handle property panel opening if needed
        }}
      />

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
        userName={projectInfo.estimatorName}
        projectName={projectInfo.name}
        currentBranch="main"
        hasUnsavedChanges={saveStatus === 'unsaved'}
        calculationStatus={isCalculating ? 'running' : calculationResults.length > 0 ? 'complete' : 'idle'}
        warningCount={warnings.filter(w => w.type === 'warning').length}
        errorCount={warnings.filter(w => w.type === 'error').length}
      />

      {/* Model Summary Trigger Button (floating) */}
      <motion.button
        type="button"
        onClick={() => setShowModelSummary(true)}
        className="fixed top-4 right-4 z-40 flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-colors"
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
        {warnings.length > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            {warnings.length}
          </span>
        )}
      </motion.button>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6 z-30 max-w-md text-center"
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
    </div>
  );
}
