/**
 * useSnapLogic Hook
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * React hook for integrating snap logic system with UI components.
 * Provides state management and event handling for snap logic functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SnapLogicSystem, 
  SnapLogicSystemConfig, 
  SnapLogicSystemState,
  BuildDuctworkResult
} from '../snap-logic/SnapLogicSystem';
import { 
  SnapPoint, 
  SnapResult, 
  DrawingTool,
  Centerline,
  Room,
  Segment,
  Equipment
} from '@/types/air-duct-sizer';
import { BranchPoint } from '../snap-logic/MidSpanBranchingManager';
import { BuildDuctworkProgressTracker } from '../snap-logic/system/BuildDuctworkProgressTracker';
import { BuildDuctworkProgress } from '../../components/snap-logic/SnapLogicStatusBar';

/**
 * Hook configuration
 */
interface UseSnapLogicConfig extends SnapLogicSystemConfig {
  autoActivateOnPencil?: boolean;
  enableKeyboardShortcuts?: boolean;
}

/**
 * Hook return type
 */
interface UseSnapLogicReturn {
  // System state
  isActive: boolean;
  isDrawing: boolean;
  currentTool: DrawingTool;
  currentCenterline: Centerline | null;
  snapResult: SnapResult | null;
  centerlines: Centerline[];
  branchPoints: BranchPoint[];

  // Snap points
  allSnapPoints: SnapPoint[];

  // Drawing preview
  previewPoint: { x: number; y: number } | null;

  // Touch gesture state
  isTouchDevice: boolean;
  touchOverrideActive: boolean;

  // Debug mode state
  debugModeEnabled: boolean;

  // Build progress state
  buildProgress: BuildDuctworkProgress | null;

  // Actions
  setCurrentTool: (tool: DrawingTool) => void;
  updateProjectElements: (rooms: Room[], segments: Segment[], equipment: Equipment[]) => void;
  handleCursorMovement: (position: { x: number; y: number }, viewport: { x: number; y: number; scale: number }) => {
    attractedPosition: { x: number; y: number };
    snapResult: SnapResult | null;
  };
  handleClick: (position: { x: number; y: number }) => boolean;
  handleRightClick: () => boolean;
  addBranchPoint: (centerlineId: string, position: { x: number; y: number }, angle?: number) => BranchPoint | null;
  buildDuctwork: () => BuildDuctworkResult;
  buildDuctworkWithProgress: () => Promise<BuildDuctworkResult>;
  clearCenterlines: () => void;

  // Touch gesture methods
  attachTouchGestures: (element: HTMLElement) => void;
  detachTouchGestures: () => void;
  isTouchGestureSupported: () => boolean;

  // Debug mode methods
  enableDebugMode: () => void;
  disableDebugMode: () => void;
  getDebugData: () => any;
  exportDebugData: () => string;

  // System control
  activate: () => void;
  deactivate: () => void;

  // Configuration
  updateConfig: (config: Partial<SnapLogicSystemConfig>) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: UseSnapLogicConfig = {
  autoActivateOnPencil: true,
  enableKeyboardShortcuts: true,
  snap: {
    enabled: true,
    snapThreshold: 15,
    magneticThreshold: 25,
    showVisualFeedback: true
  },
  drawing: {
    defaultType: 'arc',
    autoSnap: true,
    showPreview: true,
    validateSMACNA: true
  }
};

/**
 * useSnapLogic hook
 */
export const useSnapLogic = (config: UseSnapLogicConfig = {}): UseSnapLogicReturn => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const systemRef = useRef<SnapLogicSystem | null>(null);
  
  // State
  const [systemState, setSystemState] = useState<SnapLogicSystemState>({
    isActive: false,
    currentTool: 'select',
    isDrawing: false,
    currentCenterline: null,
    snapResult: null,
    branchPoints: [],
    centerlines: []
  });

  const [allSnapPoints, setAllSnapPoints] = useState<SnapPoint[]>([]);
  const [previewPoint, setPreviewPoint] = useState<{ x: number; y: number } | null>(null);

  // Touch gesture state
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchOverrideActive, setTouchOverrideActive] = useState(false);

  // Debug mode state
  const [debugModeEnabled, setDebugModeEnabled] = useState(false);

  // Build progress state
  const [buildProgress, setBuildProgress] = useState<BuildDuctworkProgress | null>(null);
  const progressTrackerRef = useRef<BuildDuctworkProgressTracker | null>(null);

  // Initialize system
  useEffect(() => {
    systemRef.current = new SnapLogicSystem(mergedConfig);

    // Check for touch device support
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touchSupported);

    // Setup event listeners
    const system = systemRef.current;

    const updateState = () => {
      setSystemState(system.getState());
      setAllSnapPoints(system.getAllSnapPoints());

      const preview = system.getDrawingPreview();
      setPreviewPoint(preview.previewPoint ? { x: preview.previewPoint.x, y: preview.previewPoint.y } : null);

      // Update touch override state if available
      const magneticIntegration = system['magneticIntegration'];
      if (magneticIntegration && typeof magneticIntegration.isSnapOverrideActiveFromTouch === 'function') {
        setTouchOverrideActive(magneticIntegration.isSnapOverrideActiveFromTouch());
      }
    };

    // System events
    system.on('system_activated', updateState);
    system.on('system_deactivated', updateState);
    system.on('drawing_started', updateState);
    system.on('drawing_completed', updateState);
    system.on('drawing_cancelled', updateState);
    system.on('centerlines_cleared', updateState);
    system.on('branch_added', updateState);

    // Initial state update
    updateState();

    // Initialize progress tracker
    progressTrackerRef.current = new BuildDuctworkProgressTracker();
    progressTrackerRef.current.onProgress((progress) => {
      setBuildProgress(progress);
    });

    return () => {
      system.destroy();
      if (progressTrackerRef.current) {
        progressTrackerRef.current.destroy();
      }
    };
  }, []);

  // Keyboard event handler
  useEffect(() => {
    if (!mergedConfig.enableKeyboardShortcuts || !systemRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (systemRef.current?.handleKeyDown(event)) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mergedConfig.enableKeyboardShortcuts]);

  // Actions
  const setCurrentTool = useCallback((tool: DrawingTool) => {
    if (!systemRef.current) return;
    
    systemRef.current.setCurrentTool(tool);
    
    // Auto-activate on pencil tool
    if (mergedConfig.autoActivateOnPencil && tool === 'pencil') {
      systemRef.current.activate();
    }
    
    setSystemState(systemRef.current.getState());
  }, [mergedConfig.autoActivateOnPencil]);

  const updateProjectElements = useCallback((
    rooms: Room[],
    segments: Segment[],
    equipment: Equipment[]
  ) => {
    if (!systemRef.current) return;
    
    systemRef.current.updateProjectElements(rooms, segments, equipment);
    setAllSnapPoints(systemRef.current.getAllSnapPoints());
  }, []);

  const handleCursorMovement = useCallback((
    position: { x: number; y: number },
    viewport: { x: number; y: number; scale: number }
  ) => {
    if (!systemRef.current) {
      return { attractedPosition: position, snapResult: null };
    }
    
    const result = systemRef.current.handleCursorMovement(position, viewport);
    
    // Update state
    setSystemState(systemRef.current.getState());
    const preview = systemRef.current.getDrawingPreview();
    setPreviewPoint(preview.previewPoint ? { x: preview.previewPoint.x, y: preview.previewPoint.y } : null);
    
    return result;
  }, []);

  const handleClick = useCallback((position: { x: number; y: number }) => {
    if (!systemRef.current) return false;
    
    const result = systemRef.current.handleClick(position);
    setSystemState(systemRef.current.getState());
    
    const preview = systemRef.current.getDrawingPreview();
    setPreviewPoint(preview.previewPoint ? { x: preview.previewPoint.x, y: preview.previewPoint.y } : null);
    
    return result;
  }, []);

  const handleRightClick = useCallback(() => {
    if (!systemRef.current) return false;
    
    const result = systemRef.current.handleRightClick();
    setSystemState(systemRef.current.getState());
    
    const preview = systemRef.current.getDrawingPreview();
    setPreviewPoint(preview.previewPoint ? { x: preview.previewPoint.x, y: preview.previewPoint.y } : null);
    
    return result;
  }, []);

  const addBranchPoint = useCallback((
    centerlineId: string,
    position: { x: number; y: number },
    angle: number = 45
  ) => {
    if (!systemRef.current) return null;
    
    const branchPoint = systemRef.current.addBranchPoint(centerlineId, position, angle);
    setSystemState(systemRef.current.getState());
    
    return branchPoint;
  }, []);

  const buildDuctwork = useCallback(() => {
    if (!systemRef.current) {
      return {
        success: false,
        ductSegments: [],
        fittings: [],
        warnings: ['Snap logic system not initialized'],
        errors: [],
        stats: { totalLength: 0, segmentCount: 0, fittingCount: 0 }
      };
    }

    return systemRef.current.buildDuctwork();
  }, []);

  const buildDuctworkWithProgress = useCallback(async (): Promise<BuildDuctworkResult> => {
    if (!systemRef.current || !progressTrackerRef.current) {
      return {
        success: false,
        ductSegments: [],
        fittings: [],
        warnings: [],
        errors: ['System not initialized'],
        stats: { totalLength: 0, segmentCount: 0, fittingCount: 0 }
      };
    }

    const progressTracker = progressTrackerRef.current;

    return await progressTracker.trackBuildOperation(async (tracker) => {
      // Step 1: Validation
      tracker.updateStep('Validating Centerlines', 0);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate validation time

      // Step 2: Preprocessing
      tracker.updateStep('Preprocessing Data', 15);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 3: Segmentation
      tracker.updateStep('Creating Segments', 30);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Fittings
      tracker.updateStep('Generating Fittings', 60);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 5: Optimization
      tracker.updateStep('Optimizing Geometry', 80);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 6: Finalization
      tracker.updateStep('Finalizing Build', 95);

      // Perform actual build
      const result = systemRef.current!.buildDuctwork();

      // Complete
      tracker.updateStep('Complete', 100);

      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }

      return result;
    });
  }, []);

  const clearCenterlines = useCallback(() => {
    if (!systemRef.current) return;
    
    systemRef.current.clearCenterlines();
    setSystemState(systemRef.current.getState());
    setAllSnapPoints(systemRef.current.getAllSnapPoints());
    setPreviewPoint(null);
  }, []);

  const activate = useCallback(() => {
    if (!systemRef.current) return;
    
    systemRef.current.activate();
    setSystemState(systemRef.current.getState());
  }, []);

  const deactivate = useCallback(() => {
    if (!systemRef.current) return;
    
    systemRef.current.deactivate();
    setSystemState(systemRef.current.getState());
    setPreviewPoint(null);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<SnapLogicSystemConfig>) => {
    // This would require updating the system configuration
    // For now, we'll just log it as this would require system restart
    console.warn('Dynamic config updates not yet implemented. Restart component to apply changes.');
  }, []);

  // Touch-specific methods
  const attachTouchGestures = useCallback((element: HTMLElement) => {
    if (!systemRef.current) return;

    const magneticIntegration = systemRef.current['magneticIntegration'];
    if (magneticIntegration && typeof magneticIntegration.attachToElement === 'function') {
      magneticIntegration.attachToElement(element);
    }
  }, []);

  const detachTouchGestures = useCallback(() => {
    if (!systemRef.current) return;

    const magneticIntegration = systemRef.current['magneticIntegration'];
    if (magneticIntegration && typeof magneticIntegration.detachFromElement === 'function') {
      magneticIntegration.detachFromElement();
    }
  }, []);

  const isTouchGestureSupported = useCallback(() => {
    if (!systemRef.current) return false;

    const magneticIntegration = systemRef.current['magneticIntegration'];
    if (magneticIntegration && typeof magneticIntegration.isTouchGestureSupported === 'function') {
      return magneticIntegration.isTouchGestureSupported();
    }
    return false;
  }, []);

  // Debug mode methods
  const enableDebugMode = useCallback(() => {
    if (!systemRef.current) return;

    systemRef.current.enableDebugMode();
    setDebugModeEnabled(true);
  }, []);

  const disableDebugMode = useCallback(() => {
    if (!systemRef.current) return;

    systemRef.current.disableDebugMode();
    setDebugModeEnabled(false);
  }, []);

  const getDebugData = useCallback(() => {
    if (!systemRef.current) return null;

    return systemRef.current.getDebugData();
  }, []);

  const exportDebugData = useCallback(() => {
    if (!systemRef.current) return '';

    return systemRef.current.exportDebugData();
  }, []);

  return {
    // State
    isActive: systemState.isActive,
    isDrawing: systemState.isDrawing,
    currentTool: systemState.currentTool,
    currentCenterline: systemState.currentCenterline,
    snapResult: systemState.snapResult,
    centerlines: systemState.centerlines,
    branchPoints: systemState.branchPoints,
    allSnapPoints,
    previewPoint,

    // Touch gesture state
    isTouchDevice,
    touchOverrideActive,

    // Debug mode state
    debugModeEnabled,

    // Build progress state
    buildProgress,

    // Actions
    setCurrentTool,
    updateProjectElements,
    handleCursorMovement,
    handleClick,
    handleRightClick,
    addBranchPoint,
    buildDuctwork,
    buildDuctworkWithProgress,
    clearCenterlines,

    // Touch gesture methods
    attachTouchGestures,
    detachTouchGestures,
    isTouchGestureSupported,

    // Debug mode methods
    enableDebugMode,
    disableDebugMode,
    getDebugData,
    exportDebugData,

    // System control
    activate,
    deactivate,

    // Configuration
    updateConfig
  };
};
