'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Vector3 } from 'three'
import { Canvas3D } from '@/components/3d/Canvas3D'
import { PDFImport } from '@/components/pdf/PDFImport'
import { DrawingTools, DrawingMode, DrawingElement } from '@/components/drawing/DrawingTools'
import { useCalculations, DuctSizingRequest, DuctSegment as APIDuctSegment } from '@/lib/api/calculations'
import { useToast } from '@/lib/hooks/useToaster'

// V1 Components
import { ProjectPropertiesPanel, ProjectPropertiesTrigger } from '@/components/ui/ProjectPropertiesPanel'
import { DrawingToolFAB, DrawingTool } from '@/components/ui/DrawingToolFAB'
import { ContextPropertyPanel, ElementType, ElementProperties } from '@/components/ui/ContextPropertyPanel'
import { ModelSummaryPanel } from '@/components/ui/ModelSummaryPanel'
import { StatusBar } from '@/components/ui/StatusBar'

import { cn } from '@/lib/utils'

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
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);

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
  const { calculateDuctSizing } = useCalculations();
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
  React.useEffect(() => {
    setDuctSegments(demoSegments);
    toast.info('Demo Data Loaded', 'Sample duct segments have been loaded for demonstration.');
  }, [toast]);

  // Handle drawing mode change
  const handleModeChange = useCallback((mode: DrawingMode) => {
    setDrawingMode(mode);
    toast.info('Tool Changed', `Switched to ${mode} tool.`);
  }, [toast]);

  // Handle element operations
  const handleElementAdd = useCallback((element: DrawingElement) => {
    setDrawingElements(prev => [...prev, element]);
    toast.success('Element Added', `${element.type} added to drawing.`);
  }, [toast]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<DrawingElement>) => {
    setDrawingElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  }, []);

  const handleElementDelete = useCallback((id: string) => {
    setDrawingElements(prev => prev.filter(el => el.id !== id));
    setSelectedElements(prev => prev.filter(elId => elId !== id));
  }, []);

  // Handle duct segment operations
  const handleSegmentAdd = useCallback((segment: DuctSegment) => {
    setDuctSegments(prev => [...prev, segment]);
    toast.success('Duct Added', 'New duct segment added to the system.');
  }, [toast]);

  const handleSegmentUpdate = useCallback((id: string, updates: Partial<DuctSegment>) => {
    setDuctSegments(prev => 
      prev.map(seg => seg.id === id ? { ...seg, ...updates } : seg)
    );
  }, []);

  const handleSegmentDelete = useCallback((id: string) => {
    setDuctSegments(prev => prev.filter(seg => seg.id !== id));
    toast.info('Duct Removed', 'Duct segment removed from the system.');
  }, [toast]);

  // Handle calculations
  const handleCalculate = useCallback(async () => {
    if (ductSegments.length === 0) {
      toast.warning('No Ducts', 'Add some duct segments before calculating.');
      return;
    }

    setIsCalculating(true);
    toast.info('Calculating...', 'Running HVAC calculations for all duct segments.');

    try {
      // Convert to API format
      const apiSegments: APIDuctSegment[] = ductSegments.map(seg => ({
        id: seg.id,
        startPoint: { x: seg.start.x, y: seg.start.y, z: seg.start.z },
        endPoint: { x: seg.end.x, y: seg.end.y, z: seg.end.z },
        cfm: 1000, // Demo value
        velocity: 800, // Demo value
        width: seg.width,
        height: seg.height,
        length: seg.start.distanceTo(seg.end),
        type: seg.type,
        material: seg.material as any,
        insulation: false,
        pressureLoss: 0,
        equivalentLength: 0,
      }));

      const request: DuctSizingRequest = {
        projectId: 'demo-project',
        rooms: [],
        segments: apiSegments,
        equipment: [],
        standards: {
          ductSizing: 'SMACNA',
          material: 'galvanized_steel',
          velocityLimits: {
            supply: { min: 500, max: 1200 },
            return: { min: 400, max: 800 },
            exhaust: { min: 600, max: 1500 },
          },
          pressureLimits: {
            maxStaticPressure: 2.0,
            maxVelocityPressure: 0.5,
          },
        },
        units: 'Imperial',
        designConditions: {
          outdoorTemp: 95,
          indoorTemp: 75,
          altitude: 0,
        },
      };

      const results = await calculateDuctSizing(request);
      if (results) {
        setCalculationResults(results);
        toast.success('Calculation Complete', 
          `Processed ${results.calculations.length} segments with ${results.warnings.length} warnings.`
        );
      }
    } catch (err) {
      toast.error('Calculation Failed', 'Unable to complete HVAC calculations.');
    } finally {
      setIsCalculating(false);
    }
  }, [ductSegments, calculateDuctSizing, toast]);

  // Handle PDF import
  const handlePDFLoad = useCallback((pdf: any) => {
    setShowPDF(true);
    toast.success('PDF Loaded', `${pdf.name} loaded as background plan.`);
  }, [toast]);

  const handlePDFRemove = useCallback(() => {
    setShowPDF(false);
    toast.info('PDF Removed', 'Background plan has been removed.');
  }, [toast]);

  // Handle save
  const handleSave = useCallback(() => {
    // In a real implementation, this would save to backend
    toast.success('Project Saved', 'All changes have been saved successfully.');
  }, [toast]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-16 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-white/20 dark:border-neutral-700/50 flex items-center justify-between px-6 relative z-20"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Air Duct Sizer V1
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-300">
            <span>Segments: {ductSegments.length}</span>
            <span>•</span>
            <span>Mode: {drawingMode}</span>
            {calculationResults && (
              <>
                <span>•</span>
                <span className="text-green-600 dark:text-green-400">
                  ✓ Calculated
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowPDF(!showPDF)}
            className={cn(
              "px-3 py-2 rounded-lg transition-colors",
              showPDF 
                ? "bg-blue-500 text-white" 
                : "bg-white/40 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/20"
            )}
            title="Toggle PDF Background"
          >
            {showPDF ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="ml-2 hidden sm:inline">PDF</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              "px-3 py-2 rounded-lg transition-colors",
              showGrid 
                ? "bg-green-500 text-white" 
                : "bg-white/40 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/20"
            )}
            title="Toggle Grid"
          >
            <Layers size={16} />
            <span className="ml-2 hidden sm:inline">Grid</span>
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Save Project"
          >
            <Save size={16} />
            <span className="ml-2 hidden sm:inline">Save</span>
          </button>
          
          <button
            type="button"
            onClick={handleCalculate}
            disabled={isCalculating || ductSegments.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Run Calculations"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span className="ml-2 hidden sm:inline">Calculating...</span>
              </>
            ) : (
              <>
                <Calculator size={16} />
                <span className="ml-2 hidden sm:inline">Calculate</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* PDF Import Layer */}
        {showPDF && (
          <div className="absolute inset-0 z-10">
            <PDFImport
              onPDFLoad={handlePDFLoad}
              onPDFRemove={handlePDFRemove}
              showAsBackground={true}
              backgroundOpacity={0.3}
              maxFileSize={50}
            />
          </div>
        )}

        {/* 3D Canvas */}
        <div className="absolute inset-0 z-20">
          <Canvas3D
            segments={ductSegments}
            onSegmentAdd={handleSegmentAdd}
            onSegmentUpdate={handleSegmentUpdate}
            onSegmentDelete={handleSegmentDelete}
            showGrid={showGrid}
            showGizmo={true}
          />
        </div>

        {/* Drawing Tools */}
        <DrawingTools
          mode={drawingMode}
          onModeChange={handleModeChange}
          onElementAdd={handleElementAdd}
          onElementUpdate={handleElementUpdate}
          onElementDelete={handleElementDelete}
          selectedElements={selectedElements}
          onSelectionChange={setSelectedElements}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={() => {/* Implement undo */}}
          onRedo={() => {/* Implement redo */}}
        />

        {/* Results Panel */}
        {calculationResults && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute top-4 right-4 w-80 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-neutral-700/50 shadow-lg p-4 z-30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Calculation Results
              </h3>
              <button
                type="button"
                onClick={() => setCalculationResults(null)}
                className="p-1 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Total Segments:</span>
                <span className="font-medium">{calculationResults.summary?.totalSegments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Compliant:</span>
                <span className="font-medium text-green-600">
                  {calculationResults.summary?.compliantSegments || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Warnings:</span>
                <span className="font-medium text-amber-600">
                  {calculationResults.warnings?.length || 0}
                </span>
              </div>
              
              {calculationResults.warnings?.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle size={16} />
                    <span className="font-medium">Warnings</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-amber-600 dark:text-amber-400">
                    {calculationResults.warnings.slice(0, 3).map((warning: any, index: number) => (
                      <li key={index}>• {warning.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-neutral-700/50 shadow-lg p-4 z-30 max-w-md text-center"
        >
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-neutral-900 dark:text-white">
              Welcome to SizeWise V1!
            </h4>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Use the drawing tools on the left to create duct segments, import PDF plans, and run HVAC calculations.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
