/**
 * Canvas System Container Component
 * 
 * Refactored container component that manages canvas state and business logic
 * while delegating rendering to presentation components. Integrates with
 * service layer for calculations and validation.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { CanvasContainerProps } from '../../types/component-interfaces';
import { useServices } from '../../lib/hooks/useServiceIntegration';
import { useUIStore } from '../../stores/ui-store';
import { useProjectStore } from '../../stores/project-store';
import { 
  Room, 
  Segment, 
  Equipment, 
  CanvasViewport, 
  DrawingTool,
  CalculationInput,
  CalculationResult 
} from '../../types/air-duct-sizer';
// import { CanvasSystemPresentation } from './CanvasSystemPresentation';

/**
 * Canvas system container component
 * Manages canvas state, interactions, and business logic
 */
export const CanvasSystemContainer: React.FC<CanvasContainerProps> = ({
  width,
  height,
  viewport: initialViewport,
  grid: initialGrid,
  drawingState: initialDrawingState,
  selectedObjects: initialSelectedObjects,
  onViewportChange,
  onObjectSelect,
  onObjectUpdate,
  onDrawingToolChange,
  className = '',
  ...props
}) => {
  const { calculation, project } = useServices();
  const canvasRef = useRef<HTMLDivElement>(null);

  // UI state from stores
  const {
    viewport,
    grid,
    drawingState,
    selectedObjects,
    setViewport,
    setGrid,
    setDrawingTool,
    setSelectedObjects,
    planScale
  } = useUIStore();

  // Project state from stores
  const {
    currentProject,
    getRoomById,
    getSegmentById,
    getEquipmentById,
    updateRoom,
    updateSegment,
    updateEquipment,
    addRoom,
    addSegment,
    addEquipment
  } = useProjectStore();

  // Local component state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPreview, setDrawingPreview] = useState<any>(null);
  const [calculationResults, setCalculationResults] = useState<Map<string, CalculationResult>>(new Map());
  const [validationWarnings, setValidationWarnings] = useState<Map<string, string[]>>(new Map());

  // Use provided props or fall back to store state
  const currentViewport = initialViewport || viewport;
  const currentGrid = initialGrid || grid;
  const currentDrawingState = initialDrawingState || drawingState;
  const currentSelectedObjects = initialSelectedObjects || selectedObjects;

  // Get canvas objects from project
  const rooms = currentProject?.rooms || [];
  const segments = currentProject?.segments || [];
  const equipment = currentProject?.equipment || [];

  // =============================================================================
  // Viewport Management
  // =============================================================================

  const handleViewportChange = useCallback((newViewport: CanvasViewport) => {
    setViewport(newViewport);
    onViewportChange?.(newViewport);
  }, [setViewport, onViewportChange]);

  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    const newScale = Math.max(0.1, Math.min(5, currentViewport.scale + delta));
    const newViewport = {
      ...currentViewport,
      scale: newScale
    };
    
    // Zoom to center point if provided
    if (centerX !== undefined && centerY !== undefined) {
      const scaleDiff = newScale - currentViewport.scale;
      newViewport.x = currentViewport.x - (centerX * scaleDiff);
      newViewport.y = currentViewport.y - (centerY * scaleDiff);
    }
    
    handleViewportChange(newViewport);
  }, [currentViewport, handleViewportChange]);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    const newViewport = {
      ...currentViewport,
      x: currentViewport.x + deltaX,
      y: currentViewport.y + deltaY
    };
    handleViewportChange(newViewport);
  }, [currentViewport, handleViewportChange]);

  const resetViewport = useCallback(() => {
    const newViewport = { x: 0, y: 0, scale: 1 };
    handleViewportChange(newViewport);
  }, [handleViewportChange]);

  // =============================================================================
  // Object Selection and Manipulation
  // =============================================================================

  const handleObjectSelect = useCallback((ids: string[], multiSelect = false) => {
    let newSelection: string[];
    
    if (multiSelect) {
      // Toggle selection for multi-select
      newSelection = currentSelectedObjects.includes(ids[0])
        ? currentSelectedObjects.filter(id => id !== ids[0])
        : [...currentSelectedObjects, ...ids.filter(id => !currentSelectedObjects.includes(id))];
    } else {
      // Single selection
      newSelection = ids;
    }
    
    setSelectedObjects(newSelection);
    onObjectSelect?.(newSelection);
  }, [currentSelectedObjects, setSelectedObjects, onObjectSelect]);

  const handleObjectUpdate = useCallback((id: string, updates: any) => {
    // Determine object type and update accordingly
    const room = getRoomById(id);
    const segment = getSegmentById(id);
    const equipmentItem = getEquipmentById(id);

    if (room) {
      updateRoom(id, updates);
      // Trigger recalculation if airflow-related properties changed
      if (updates.airflow || updates.dimensions) {
        triggerCalculation(id, 'room');
      }
    } else if (segment) {
      updateSegment(id, updates);
      // Trigger recalculation if sizing-related properties changed
      if (updates.airflow || updates.size) {
        triggerCalculation(id, 'segment');
      }
    } else if (equipmentItem) {
      updateEquipment(id, updates);
    }

    onObjectUpdate?.(id, updates);
  }, [getRoomById, getSegmentById, getEquipmentById, updateRoom, updateSegment, updateEquipment, onObjectUpdate]);

  // =============================================================================
  // Drawing Operations
  // =============================================================================

  const handleDrawingStart = useCallback((point: { x: number; y: number }) => {
    setIsDrawing(true);
    setDrawingPreview({
      tool: currentDrawingState.tool,
      startPoint: point,
      endPoint: point
    });
  }, [currentDrawingState.tool]);

  const handleDrawingMove = useCallback((point: { x: number; y: number }) => {
    if (isDrawing && drawingPreview) {
      setDrawingPreview({
        ...drawingPreview,
        endPoint: point
      });
    }
  }, [isDrawing, drawingPreview]);

  const handleDrawingEnd = useCallback((point: { x: number; y: number }) => {
    if (!isDrawing || !drawingPreview) return;

    const { tool, startPoint } = drawingPreview;
    
    // Create object based on drawing tool
    switch (tool) {
      case 'room':
        createRoom(startPoint, point);
        break;
      case 'duct':
        createSegment(startPoint, point);
        break;
      case 'equipment':
        createEquipment(point);
        break;
    }

    setIsDrawing(false);
    setDrawingPreview(null);
  }, [isDrawing, drawingPreview]);

  const createRoom = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    if (width < 10 || height < 10) return; // Minimum size check

    const newRoom: Partial<Room> = {
      name: `Room ${rooms.length + 1}`,
      dimensions: {
        length: width / planScale,
        width: height / planScale,
        height: 10 // Default ceiling height
      },
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y)
    };

    addRoom(newRoom);
  }, [rooms.length, planScale, addRoom]);

  const createSegment = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    
    if (length < 20) return; // Minimum length check

    const newSegment: Partial<Segment> = {
      type: 'straight',
      material: 'Galvanized Steel',
      size: { width: 12, height: 8 }, // Default size
      length: length / planScale,
      points: [start.x, start.y, end.x, end.y],
      warnings: []
    };

    addSegment(newSegment);
  }, [planScale, addSegment]);

  const createEquipment = useCallback((point: { x: number; y: number }) => {
    const newEquipment: Partial<Equipment> = {
      type: 'Air Handler',
      airflow: 1000, // Default airflow
      x: point.x,
      y: point.y
    };

    addEquipment(newEquipment);
  }, [addEquipment]);

  // =============================================================================
  // Calculations and Validation
  // =============================================================================

  const triggerCalculation = useCallback(async (objectId: string, objectType: 'room' | 'segment' | 'equipment') => {
    if (!calculation.service) return;

    try {
      if (objectType === 'segment') {
        const segment = getSegmentById(objectId);
        if (!segment || !segment.airflow) return;

        const inputs: CalculationInput = {
          airflow: segment.airflow,
          duct_type: segment.size.diameter ? 'round' : 'rectangular',
          friction_rate: currentProject?.computational_properties?.friction_rate || 0.1,
          units: 'imperial',
          material: segment.material
        };

        const result = await calculation.calculateDuctSizing(inputs);
        setCalculationResults(prev => new Map(prev).set(objectId, result));

        // Update segment with calculation results
        if (result.success && result.results) {
          updateSegment(objectId, {
            velocity: result.results.velocity,
            pressure_loss: result.results.pressure_loss
          });
        }
      }
    } catch (error) {
      console.error('Calculation failed:', error);
      setValidationWarnings(prev => 
        new Map(prev).set(objectId, [`Calculation failed: ${error.message}`])
      );
    }
  }, [calculation.service, getSegmentById, currentProject, updateSegment]);

  // =============================================================================
  // Keyboard Shortcuts
  // =============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return; // Only handle when not in input

      switch (event.key) {
        case 'Escape':
          setSelectedObjects([]);
          setDrawingTool('select');
          break;
        case 'Delete':
        case 'Backspace':
          if (currentSelectedObjects.length > 0) {
            // Handle object deletion
            currentSelectedObjects.forEach(id => {
              // This would integrate with actual deletion logic
              console.log('Delete object:', id);
            });
            setSelectedObjects([]);
          }
          break;
        case 'r':
          if (!event.ctrlKey && !event.metaKey) {
            setDrawingTool('room');
            onDrawingToolChange?.('room');
          }
          break;
        case 'd':
          if (!event.ctrlKey && !event.metaKey) {
            setDrawingTool('duct');
            onDrawingToolChange?.('duct');
          }
          break;
        case 'e':
          if (!event.ctrlKey && !event.metaKey) {
            setDrawingTool('equipment');
            onDrawingToolChange?.('equipment');
          }
          break;
        case 's':
          if (!event.ctrlKey && !event.metaKey) {
            setDrawingTool('select');
            onDrawingToolChange?.('select');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSelectedObjects, setSelectedObjects, setDrawingTool, onDrawingToolChange]);

  // =============================================================================
  // Render
  // =============================================================================

  // Placeholder return - would use CanvasSystemPresentation component
  return (
    <div
      ref={canvasRef}
      className={`canvas-system-container w-full h-full ${className}`}
    >
      <div className="text-center p-8 text-gray-500">
        Canvas System Container - Presentation component would render here
        <br />
        Selected: {currentSelectedObjects.length} objects
        <br />
        Tool: {currentDrawingState.tool}
        <br />
        Zoom: {Math.round(currentViewport.scale * 100)}%
      </div>
    </div>
  );
};

/**
 * Default export for convenience
 */
export default CanvasSystemContainer;
