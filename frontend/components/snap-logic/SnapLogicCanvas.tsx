/**
 * Snap Logic Canvas Integration
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Canvas component that integrates snap logic with existing drawing functionality.
 * Handles mouse events, rendering, and coordinate transformations.
 */

"use client";

import React, { useRef, useCallback, useEffect } from 'react';
import { useSnapLogic } from '@/lib/hooks/useSnapLogic';
import { useUIStore } from '@/stores/ui-store';
import { SnapVisualFeedback, SnapLegend, SnapContextMenu } from './SnapVisualFeedback';
import { FittingConfirmationDialog } from './FittingConfirmationDialog';
import { Room, Segment, Equipment } from '@/types/air-duct-sizer';
import { FittingRecommendation, ComplexFittingSolution, TouchGestureEvent } from '@/lib/snap-logic';
import { TouchGestureHandler } from '@/lib/snap-logic/system/TouchGestureHandler';

/**
 * Props for SnapLogicCanvas component
 */
interface SnapLogicCanvasProps {
  rooms: Room[];
  segments: Segment[];
  equipment: Equipment[];
  viewport?: {
    x: number;
    y: number;
    scale: number;
  };
  onCursorMove?: (position: { x: number; y: number }) => void;
  onCanvasClick?: (position: { x: number; y: number }) => void;
  onCanvasRightClick?: () => void;
  onViewportChange?: (viewport: { x: number; y: number; scale: number }) => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Canvas integration component for snap logic
 */
export const SnapLogicCanvas: React.FC<SnapLogicCanvasProps> = ({
  rooms,
  segments,
  equipment,
  viewport = { x: 0, y: 0, scale: 1 },
  onCursorMove,
  onCanvasClick,
  onCanvasRightClick,
  onViewportChange,
  children,
  className
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [contextMenuState, setContextMenuState] = React.useState<{
    visible: boolean;
    position: { x: number; y: number };
    snapPoints: any[];
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    snapPoints: []
  });

  // Touch gesture state
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [touchOverrideActive, setTouchOverrideActive] = React.useState(false);

  // Touch event processing state
  const [touchState, setTouchState] = React.useState<{
    isProcessingTouch: boolean;
    activeGesture: string | null;
    touchStartPosition: { x: number; y: number } | null;
    lastTouchPosition: { x: number; y: number } | null;
    touchStartTime: number;
    gestureStarted: boolean;
    preventMouseEvents: boolean;
    touchFeedback: {
      visible: boolean;
      position: { x: number; y: number };
      type: 'tap' | 'longPress' | 'pan' | 'zoom' | 'swipe';
      intensity: number;
    } | null;
  }>({
    isProcessingTouch: false,
    activeGesture: null,
    touchStartPosition: null,
    lastTouchPosition: null,
    touchStartTime: 0,
    gestureStarted: false,
    preventMouseEvents: false,
    touchFeedback: null
  });

  // Touch gesture handler reference
  const touchGestureHandlerRef = React.useRef<TouchGestureHandler | null>(null);

  // Touch device detection
  React.useEffect(() => {
    const detectTouchDevice = () => {
      const hasTouch = TouchGestureHandler.isTouchDevice();
      setIsTouchDevice(hasTouch);

      // Initialize touch gesture handler for touch devices
      if (hasTouch && canvasRef.current && !touchGestureHandlerRef.current) {
        initializeTouchGestureHandler();
      }
    };

    detectTouchDevice();

    // Listen for orientation changes on mobile devices
    window.addEventListener('orientationchange', detectTouchDevice);
    window.addEventListener('resize', detectTouchDevice);

    return () => {
      window.removeEventListener('orientationchange', detectTouchDevice);
      window.removeEventListener('resize', detectTouchDevice);
    };
  }, []);

  // Fitting confirmation dialog state
  const [fittingDialogState, setFittingDialogState] = React.useState<{
    isOpen: boolean;
    primaryRecommendation: FittingRecommendation | ComplexFittingSolution | null;
    alternativeRecommendations: (FittingRecommendation | ComplexFittingSolution)[];
    intersectionInfo: {
      branchCount: number;
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
      location: { x: number; y: number };
      systemPressure: 'low' | 'medium' | 'high';
    } | null;
  }>({
    isOpen: false,
    primaryRecommendation: null,
    alternativeRecommendations: [],
    intersectionInfo: null
  });

  // UI store
  const { drawingState } = useUIStore();

  // Snap logic hook
  const {
    isActive,
    allSnapPoints,
    snapResult,
    previewPoint,
    updateProjectElements,
    handleCursorMovement,
    handleClick,
    handleRightClick
  } = useSnapLogic({
    snap: {
      enabled: drawingState.snapLogicEnabled,
      showVisualFeedback: drawingState.showSnapIndicators
    }
  });

  // Update project elements when they change
  useEffect(() => {
    updateProjectElements(rooms, segments, equipment);
  }, [rooms, segments, equipment, updateProjectElements]);

  // Initialize touch gesture support
  useEffect(() => {
    // Check if device supports touch
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touchSupported);

    if (!canvasRef.current || !touchSupported) return;

    // Attach touch gesture handler to canvas element
    // This will be handled by the snap logic system internally
    const canvas = canvasRef.current;

    // Setup custom touch event listeners
    const handleTouchViewportPan = (event: CustomEvent) => {
      // Handle viewport panning from two-finger gestures
      const { deltaX, deltaY } = event.detail;
      // Emit to parent component or handle viewport update
      console.debug('Touch viewport pan:', { deltaX, deltaY });
    };

    const handleTouchUndo = (event: CustomEvent) => {
      // Handle undo from swipe gesture
      console.debug('Touch undo triggered');
      // Emit undo event or call undo function
    };

    const handleTouchRedo = (event: CustomEvent) => {
      // Handle redo from swipe gesture
      console.debug('Touch redo triggered');
      // Emit redo event or call redo function
    };

    const handleTouchClick = (event: CustomEvent) => {
      // Handle touch click with snap override state
      const { position, isSnapOverrideActive } = event.detail;
      setTouchOverrideActive(isSnapOverrideActive);

      // Convert to world coordinates and handle as regular click
      const worldPos = screenToWorld(position.x, position.y);
      const handled = handleClick(worldPos);

      if (!handled) {
        onCanvasClick?.(worldPos);
      }
    };

    // Add event listeners
    canvas.addEventListener('touch-viewport-pan', handleTouchViewportPan as EventListener);
    canvas.addEventListener('touch-undo', handleTouchUndo as EventListener);
    canvas.addEventListener('touch-redo', handleTouchRedo as EventListener);
    canvas.addEventListener('touch-click', handleTouchClick as EventListener);

    return () => {
      // Cleanup event listeners
      canvas.removeEventListener('touch-viewport-pan', handleTouchViewportPan as EventListener);
      canvas.removeEventListener('touch-undo', handleTouchUndo as EventListener);
      canvas.removeEventListener('touch-redo', handleTouchRedo as EventListener);
      canvas.removeEventListener('touch-click', handleTouchClick as EventListener);
    };
  }, [canvasRef, handleClick, onCanvasClick]);

  /**
   * Convert screen coordinates to world coordinates
   */
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale
    };
  }, [viewport]);

  /**
   * Convert world coordinates to screen coordinates
   */
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: worldX * viewport.scale + viewport.x,
      y: worldY * viewport.scale + viewport.y
    };
  }, [viewport]);

  /**
   * Handle mouse move events
   */
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    const worldPos = screenToWorld(screenPos.x, screenPos.y);

    // Process through snap logic
    const result = handleCursorMovement(worldPos, viewport);

    // Notify parent component
    onCursorMove?.(result.attractedPosition);
  }, [screenToWorld, handleCursorMovement, viewport, onCursorMove]);

  /**
   * Handle mouse click events
   */
  const handleMouseClick = useCallback((event: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    const worldPos = screenToWorld(screenPos.x, screenPos.y);

    // Check for ambiguous snap points
    if (snapResult?.snapPoint) {
      // Find all snap points at the same location
      const ambiguousPoints = allSnapPoints.filter(point => {
        const distance = Math.sqrt(
          Math.pow(point.position.x - worldPos.x, 2) +
          Math.pow(point.position.y - worldPos.y, 2)
        );
        return distance <= 5; // 5 pixel tolerance
      });

      if (ambiguousPoints.length > 1) {
        // Show context menu for ambiguous snap points
        setContextMenuState({
          visible: true,
          position: screenPos,
          snapPoints: ambiguousPoints
        });
        return;
      }
    }

    // Process through snap logic
    const handled = handleClick(worldPos);

    // Notify parent component if not handled by snap logic
    if (!handled) {
      onCanvasClick?.(worldPos);
    }
  }, [screenToWorld, snapResult, allSnapPoints, handleClick, onCanvasClick]);

  /**
   * Handle right click events
   */
  const handleMouseRightClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();

    // Process through snap logic first
    const handled = handleRightClick();

    // Notify parent component if not handled by snap logic
    if (!handled) {
      onCanvasRightClick?.();
    }
  }, [handleRightClick, onCanvasRightClick]);

  /**
   * Handle context menu selection
   */
  const handleContextMenuSelect = useCallback((snapPoint: any) => {
    // Force snap to the selected point
    const worldPos = snapPoint.position;
    handleClick(worldPos);
    setContextMenuState(prev => ({ ...prev, visible: false }));
  }, [handleClick]);

  /**
   * Close context menu
   */
  const handleContextMenuClose = useCallback(() => {
    setContextMenuState(prev => ({ ...prev, visible: false }));
  }, []);

  /**
   * Render centerline preview
   */
  const renderCenterlinePreview = () => {
    if (!previewPoint || !isActive) return null;

    const screenPos = worldToScreen(previewPoint.x, previewPoint.y);

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: screenPos.x - 3,
          top: screenPos.y - 3,
          zIndex: 1000
        }}
      >
        <div className="w-6 h-6 border-2 border-blue-500 border-dashed rounded-full bg-blue-100/50" />
      </div>
    );
  };

  // Fitting confirmation dialog handlers
  const showFittingConfirmationDialog = useCallback((
    primaryRecommendation: FittingRecommendation | ComplexFittingSolution,
    alternativeRecommendations: (FittingRecommendation | ComplexFittingSolution)[] = [],
    intersectionInfo: {
      branchCount: number;
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
      location: { x: number; y: number };
      systemPressure: 'low' | 'medium' | 'high';
    }
  ) => {
    setFittingDialogState({
      isOpen: true,
      primaryRecommendation,
      alternativeRecommendations,
      intersectionInfo
    });
  }, []);

  const handleFittingConfirm = useCallback((selectedFitting: FittingRecommendation | ComplexFittingSolution) => {
    // Apply the selected fitting to the intersection
    console.log('Applying fitting:', selectedFitting);

    // Here you would integrate with the actual fitting application logic
    // This could involve:
    // 1. Creating the fitting geometry
    // 2. Updating the centerline network
    // 3. Triggering 3D conversion if needed
    // 4. Updating the project state

    // Close the dialog
    setFittingDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleFittingCancel = useCallback(() => {
    console.log('Fitting selection cancelled');
    setFittingDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const closeFittingDialog = useCallback(() => {
    setFittingDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Initialize touch gesture handler
  const initializeTouchGestureHandler = useCallback(() => {
    if (!canvasRef.current || touchGestureHandlerRef.current) return;

    const touchHandler = new TouchGestureHandler({
      enableLongPress: true,
      enableTwoFingerGestures: true,
      enableSwipeGestures: true,
      enableMultiFingerTaps: true,
      hapticFeedback: true,
      visualFeedback: true,
      longPressDelay: 500,
      tapMaxDistance: 15,
      swipeMinDistance: 50,
      panMinDistance: 5,
      preventDefaultBehavior: true
    });

    // Attach to canvas element
    touchHandler.attachToElement(canvasRef.current);

    // Set up gesture event listeners
    touchHandler.on('longPress', handleTouchLongPress);
    touchHandler.on('twoFingerPan', handleTouchTwoFingerPan);
    touchHandler.on('pinch', handleTouchPinch);
    touchHandler.on('tap', handleTouchTap);
    touchHandler.on('doubleTap', handleTouchDoubleTap);
    touchHandler.on('threeFingerTap', handleTouchThreeFingerTap);

    touchGestureHandlerRef.current = touchHandler;
  }, []);

  // Touch gesture event handlers
  const handleTouchLongPress = useCallback((event: TouchGestureEvent) => {
    console.log('Touch long press - activating snap override');

    setTouchOverrideActive(true);
    setTouchState(prev => ({
      ...prev,
      activeGesture: 'longPress',
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'longPress',
        intensity: 1.0
      }
    }));

    // Disable snapping temporarily
    // This would integrate with the snap logic system

    // Hide feedback after delay
    setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        touchFeedback: null
      }));
    }, 1000);
  }, []);

  const handleTouchTwoFingerPan = useCallback((event: TouchGestureEvent) => {
    if (!event.deltaPosition) return;

    console.log('Touch two finger pan - viewport navigation');

    setTouchState(prev => ({
      ...prev,
      activeGesture: 'twoFingerPan',
      preventMouseEvents: true,
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'pan',
        intensity: 0.7
      }
    }));

    // Handle viewport panning
    // This would integrate with the viewport/camera system
    const panDelta = {
      x: event.deltaPosition.x,
      y: event.deltaPosition.y
    };

    // Apply pan transformation
    // viewport.pan(panDelta.x, panDelta.y);

    // Handle zoom if scale is provided
    if (event.scale && event.scale !== 1) {
      console.log('Touch pinch zoom:', event.scale);
      // viewport.zoom(event.scale, event.position);
    }
  }, []);

  const handleTouchPinch = useCallback((event: TouchGestureEvent) => {
    if (!event.scale) return;

    console.log('Touch pinch zoom:', event.scale);

    setTouchState(prev => ({
      ...prev,
      activeGesture: 'pinch',
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'zoom',
        intensity: Math.abs(event.scale - 1)
      }
    }));

    // Handle zoom
    // viewport.zoom(event.scale, event.position);
  }, []);

  const handleTouchSwipeLeft = useCallback((event: TouchGestureEvent) => {
    console.log('Touch swipe left - undo');

    setTouchState(prev => ({
      ...prev,
      activeGesture: 'swipeLeft',
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'swipe',
        intensity: 0.8
      }
    }));

    // Trigger undo action
    // undoRedoManager.undo();

    // Hide feedback after delay
    setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        touchFeedback: null
      }));
    }, 500);
  }, []);

  const handleTouchSwipeRight = useCallback((event: TouchGestureEvent) => {
    console.log('Touch swipe right - redo');

    setTouchState(prev => ({
      ...prev,
      activeGesture: 'swipeRight',
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'swipe',
        intensity: 0.8
      }
    }));

    // Trigger redo action
    // undoRedoManager.redo();

    // Hide feedback after delay
    setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        touchFeedback: null
      }));
    }, 500);
  }, []);

  const handleTouchTap = useCallback((event: TouchGestureEvent) => {
    console.log('Touch tap');

    setTouchState(prev => ({
      ...prev,
      activeGesture: 'tap',
      preventMouseEvents: true,
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'tap',
        intensity: 0.5
      }
    }));

    // Convert touch position to world coordinates
    const worldPos = screenToWorld(event.position.x, event.position.y);

    // Handle tap as click
    handleClick(worldPos);

    // Hide feedback after short delay
    setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        touchFeedback: null,
        preventMouseEvents: false
      }));
    }, 200);
  }, [handleClick, screenToWorld]);

  const handleTouchDoubleTap = useCallback((event: TouchGestureEvent) => {
    console.log('Touch double tap - zoom to fit or tool selection');

    setTouchState(prev => ({
      ...prev,
      activeGesture: 'doubleTap',
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'tap',
        intensity: 1.0
      }
    }));

    // Handle double tap action (zoom to fit, tool selection, etc.)
    // viewport.zoomToFit();

    // Hide feedback after delay
    setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        touchFeedback: null
      }));
    }, 300);
  }, []);

  const handleTouchThreeFingerTap = useCallback((event: TouchGestureEvent) => {
    console.log('Touch three finger tap - toggle debug mode');

    setTouchState(prev => ({
      ...prev,
      activeGesture: 'threeFingerTap',
      touchFeedback: {
        visible: true,
        position: event.position,
        type: 'tap',
        intensity: 1.0
      }
    }));

    // Toggle debug mode
    // debugManager.toggleDebugMode();

    // Hide feedback after delay
    setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        touchFeedback: null
      }));
    }, 500);
  }, []);

  // Touch event cleanup
  React.useEffect(() => {
    return () => {
      if (touchGestureHandlerRef.current) {
        touchGestureHandlerRef.current.dispose();
        touchGestureHandlerRef.current = null;
      }
    };
  }, []);

  // Touch-specific visual feedback component
  const renderTouchFeedback = () => {
    if (!touchState.touchFeedback?.visible) return null;

    const { position, type, intensity } = touchState.touchFeedback;

    const feedbackStyles = {
      tap: {
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgb(59, 130, 246)',
        size: 30
      },
      longPress: {
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderColor: 'rgb(239, 68, 68)',
        size: 50
      },
      pan: {
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
        borderColor: 'rgb(34, 197, 94)',
        size: 40
      },
      zoom: {
        backgroundColor: 'rgba(168, 85, 247, 0.3)',
        borderColor: 'rgb(168, 85, 247)',
        size: 60
      },
      swipe: {
        backgroundColor: 'rgba(245, 158, 11, 0.3)',
        borderColor: 'rgb(245, 158, 11)',
        size: 35
      }
    };

    const style = feedbackStyles[type];
    const size = style.size * intensity;

    return (
      <div
        className="absolute pointer-events-none rounded-full border-2 animate-ping"
        style={{
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
          height: size,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          zIndex: 1000,
          animationDuration: type === 'longPress' ? '2s' : '0.5s'
        }}
      />
    );
  };

  // Enhanced mouse event handlers with touch compatibility
  const handleMouseMoveWithTouch = useCallback((event: React.MouseEvent) => {
    // Prevent mouse events if touch is active
    if (touchState.preventMouseEvents || touchState.isProcessingTouch) {
      return;
    }
    handleMouseMove(event);
  }, [handleMouseMove, touchState.preventMouseEvents, touchState.isProcessingTouch]);

  const handleMouseClickWithTouch = useCallback((event: React.MouseEvent) => {
    // Prevent mouse events if touch is active
    if (touchState.preventMouseEvents || touchState.isProcessingTouch) {
      return;
    }
    handleMouseClick(event);
  }, [handleMouseClick, touchState.preventMouseEvents, touchState.isProcessingTouch]);

  const handleMouseRightClickWithTouch = useCallback((event: React.MouseEvent) => {
    // Prevent mouse events if touch is active
    if (touchState.preventMouseEvents || touchState.isProcessingTouch) {
      return;
    }
    handleMouseRightClick(event);
  }, [handleMouseRightClick, touchState.preventMouseEvents, touchState.isProcessingTouch]);

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full ${className || ''}`}
      onMouseMove={handleMouseMoveWithTouch}
      onClick={handleMouseClickWithTouch}
      onContextMenu={handleMouseRightClickWithTouch}
      style={{
        cursor: isActive ? 'crosshair' : 'default',
        touchAction: isTouchDevice ? 'none' : 'auto', // Prevent default touch behaviors
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* Touch-specific visual feedback */}
      {renderTouchFeedback()}

      {/* Touch override indicator */}
      {isTouchDevice && touchOverrideActive && (
        <div className="absolute top-4 left-4 z-50 bg-orange-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium">
          Snap Override Active
        </div>
      )}

      {/* Touch device instructions */}
      {isTouchDevice && isActive && (
        <div className="absolute bottom-20 left-4 z-50 bg-black/90 text-white px-4 py-3 rounded-lg shadow-lg text-xs max-w-72">
          <div className="font-medium mb-2 text-blue-300">Touch Gestures:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              <span>Long press: Override snap</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Two fingers: Pan/zoom view</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span>Swipe left/right: Undo/redo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Tap: Select/draw</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>Double tap: Zoom to fit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span>Three fingers: Debug mode</span>
            </div>
          </div>
          {touchState.activeGesture && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <span className="text-blue-300 font-medium">Active: </span>
              <span className="capitalize">{touchState.activeGesture}</span>
            </div>
          )}
        </div>
      )}

      {/* Original canvas content */}
      {children}

      {/* Snap visual feedback */}
      {drawingState.snapLogicEnabled && drawingState.showSnapIndicators && (
        <SnapVisualFeedback
          snapPoints={allSnapPoints}
          activeSnapResult={snapResult}
          viewport={viewport}
          config={{
            showIndicators: true,
            showLabels: snapResult?.isSnapped || false,
            adaptToZoom: true
          }}
        />
      )}

      {/* Centerline preview */}
      {renderCenterlinePreview()}

      {/* Snap legend */}
      {drawingState.snapLogicEnabled && drawingState.showSnapLegend && (
        <SnapLegend
          visible={true}
          position="top-right"
        />
      )}

      {/* Context menu for ambiguous snap points */}
      <SnapContextMenu
        snapPoints={contextMenuState.snapPoints}
        position={contextMenuState.position}
        visible={contextMenuState.visible}
        onSelect={handleContextMenuSelect}
        onClose={handleContextMenuClose}
      />

      {/* Build Ductwork Button moved to SnapLogicStatusBar */}

      {/* Fitting Confirmation Dialog */}
      {fittingDialogState.isOpen && fittingDialogState.primaryRecommendation && fittingDialogState.intersectionInfo && (
        <FittingConfirmationDialog
          isOpen={fittingDialogState.isOpen}
          onClose={closeFittingDialog}
          onConfirm={handleFittingConfirm}
          onCancel={handleFittingCancel}
          primaryRecommendation={fittingDialogState.primaryRecommendation}
          alternativeRecommendations={fittingDialogState.alternativeRecommendations}
          intersectionInfo={fittingDialogState.intersectionInfo}
          showVisualPreview={true}
          showAlternatives={true}
          showFabricationDetails={true}
          showCostEstimates={true}
          allowCustomization={false}
        />
      )}
    </div>
  );
};

/**
 * Build Ductwork functionality has been moved to SnapLogicStatusBar
 * for better UI integration with the Results/Warnings Bar
 */
