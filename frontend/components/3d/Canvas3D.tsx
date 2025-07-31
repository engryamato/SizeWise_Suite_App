"use client";

import React, { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Environment,
  Text,
  Line,
  Box
} from '@react-three/drei';
import { Vector3, Vector2, Raycaster, Quaternion, Euler } from 'three';
import { useCameraController } from '@/lib/hooks/useCameraController';
import { useUIStore } from '@/stores/ui-store';
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

interface DuctSegment {
  id: string;
  start: Vector3;
  end: Vector3;
  width: number;
  height: number;
  type: 'supply' | 'return' | 'exhaust';
  material: string;
}

interface Canvas3DProps {
  segments: DuctSegment[];
  onSegmentAdd?: (segment: DuctSegment) => void;
  onSegmentUpdate?: (id: string, segment: Partial<DuctSegment>) => void;
  onSegmentDelete?: (id: string) => void;
  className?: string;
  showGrid?: boolean;
  showGizmo?: boolean;
  // Drawing functionality
  activeTool?: 'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'move' | 'rotate' | 'delete' | 'copy';
  onElementSelect?: (elementId: string, position: { x: number; y: number }) => void;
  // Camera control integration
  onCameraReady?: (cameraController: any) => void;
}

// 3D Duct Component
const DuctMesh: React.FC<{ 
  segment: DuctSegment; 
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ segment, isSelected, onSelect }) => {
  const meshRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate duct position and rotation
  const direction = new Vector3().subVectors(segment.end, segment.start);
  const length = direction.length();
  const center = new Vector3().addVectors(segment.start, segment.end).multiplyScalar(0.5);

  // Calculate rotation to align duct with direction vector
  // Default box geometry is aligned along Z-axis, so we need to rotate to align with our direction
  const rotation = React.useMemo(() => {
    if (length > 0) {
      // Normalize direction vector
      const normalizedDirection = direction.clone().normalize();

      // Calculate rotation angles
      // Y rotation (around Y-axis) for horizontal direction
      const yRotation = Math.atan2(normalizedDirection.x, normalizedDirection.z);

      // X rotation (around X-axis) for vertical direction
      const xRotation = -Math.asin(normalizedDirection.y);

      return [xRotation, yRotation, 0] as [number, number, number];
    }
    return [0, 0, 0] as [number, number, number];
  }, [direction, length]);

  // Color based on duct type
  const getColor = () => {
    if (isSelected) return '#3b82f6'; // Blue when selected
    if (hovered) return '#6366f1'; // Indigo when hovered

    switch (segment.type) {
      case 'supply': return '#10b981'; // Green
      case 'return': return '#f59e0b'; // Amber
      case 'exhaust': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  // Convert inches to scene units (assuming 1 scene unit = 12 inches)
  const sceneWidth = segment.width / 12;
  const sceneHeight = segment.height / 12;

  return (
    <mesh
      ref={meshRef}
      position={center}
      rotation={rotation}
      onClick={onSelect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Box geometry: width (X), height (Y), length (Z) */}
      <boxGeometry args={[sceneWidth, sceneHeight, length]} />
      <meshStandardMaterial
        color={getColor()}
        transparent
        opacity={isSelected ? 0.8 : 0.7}
        wireframe={isSelected}
      />

      {/* Duct label */}
      {(isSelected || hovered) && (
        <Text
          position={[0, sceneHeight / 2 + 0.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${segment.width}" x ${segment.height}"`}
        </Text>
      )}
    </mesh>
  );
};

// Stick Line Drawing Component
const StickLine: React.FC<{
  points: Vector3[];
  color?: string;
  lineWidth?: number;
}> = ({ points, color = '#3b82f6', lineWidth = 2 }) => {
  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={0.8}
    />
  );
};

// Drawing Preview Component
const DrawingPreview: React.FC<{
  startPoint?: Vector3;
  currentPoint?: Vector3;
  activeTool?: string;
}> = ({ startPoint, currentPoint, activeTool }) => {
  if (!startPoint || !currentPoint || activeTool !== 'line') return null;

  return (
    <Line
      points={[startPoint, currentPoint]}
      color="#3b82f6"
      lineWidth={3}
      transparent
      opacity={0.6}
      dashed
    />
  );
};

// 3D Scene Component
const Scene3D: React.FC<{
  segments: DuctSegment[];
  selectedSegmentId?: string;
  onSegmentSelect?: (id: string) => void;
  showGrid: boolean;
  activeTool?: string;
  onSegmentAdd?: (segment: DuctSegment) => void;
  onElementSelect?: (elementId: string, position: { x: number; y: number }) => void;
  onCameraReady?: (cameraController: any) => void;
}> = ({ segments, selectedSegmentId, onSegmentSelect, showGrid, activeTool, onSegmentAdd, onElementSelect, onCameraReady }) => {
  const { camera, raycaster, scene } = useThree();
  const { grid } = useUIStore();

  // Initialize camera controller
  const cameraController = useCameraController(camera);

  // Grid snapping helper function
  const snapToGrid = useCallback((point: Vector3): Vector3 => {
    if (!grid.snapEnabled) return point;

    // Convert grid size from 2D pixels to 3D scene units
    // Assuming 1 scene unit = 1 foot, and grid.size is in pixels (typically 20px = 1 foot)
    const gridSize = 1; // 1 scene unit per grid cell

    return new Vector3(
      Math.round(point.x / gridSize) * gridSize,
      point.y, // Keep Y at 0 for ground plane
      Math.round(point.z / gridSize) * gridSize
    );
  }, [grid.snapEnabled]);

  // Expose camera controller to parent component (only once when ready)
  const [cameraReadyNotified, setCameraReadyNotified] = React.useState(false);

  React.useEffect(() => {
    if (onCameraReady && cameraController && !cameraReadyNotified) {
      onCameraReady(cameraController);
      setCameraReadyNotified(true);
    }
  }, [onCameraReady, cameraController, cameraReadyNotified]);
  const [drawingState, setDrawingState] = useState<{
    isDrawing: boolean;
    startPoint?: Vector3;
    currentPoint?: Vector3;
  }>({ isDrawing: false });

  // Debug: Log when activeTool changes
  React.useEffect(() => {
    console.log('activeTool changed to:', activeTool);
  }, [activeTool]);

  // Handle canvas clicks for drawing
  const handleCanvasClick = useCallback((event: any) => {
    console.log('Canvas click detected, activeTool:', activeTool, 'drawingState:', drawingState);
    console.log('Event details:', event);

    // For drawing tools, always project to ground plane (ignore existing segments)
    if (activeTool && activeTool !== 'select') {
      // Use the event's point directly (React Three Fiber provides world coordinates)
      let clickPoint = event.point ? event.point.clone() : new Vector3(0, 0, 0);

      // Ensure the point is on the ground plane (y=0)
      clickPoint.y = 0;

      // Apply grid snapping
      clickPoint = snapToGrid(clickPoint);

      console.log('Click point calculated (after snapping):', clickPoint);
      console.log('Click point coordinates:', { x: clickPoint.x, y: clickPoint.y, z: clickPoint.z });

      if (activeTool === 'line') {
        if (!drawingState.isDrawing) {
          // Start drawing - create a new Vector3 to avoid reference issues
          const startPoint = new Vector3(clickPoint.x, clickPoint.y, clickPoint.z);
          console.log('Starting drawing at point:', startPoint);
          console.log('Start point coordinates:', { x: startPoint.x, y: startPoint.y, z: startPoint.z });
          setDrawingState({
            isDrawing: true,
            startPoint: startPoint,
            currentPoint: startPoint.clone()
          });
        } else {
          // Finish drawing - create duct segment with proper coordinate precision
          if (drawingState.startPoint && onSegmentAdd) {
            // Create new Vector3 instances to ensure no reference sharing
            const segmentStart = new Vector3(
              drawingState.startPoint.x,
              drawingState.startPoint.y,
              drawingState.startPoint.z
            );
            const segmentEnd = new Vector3(clickPoint.x, clickPoint.y, clickPoint.z);

            console.log('Finishing drawing from', segmentStart, 'to', segmentEnd);
            console.log('Segment start coordinates:', { x: segmentStart.x, y: segmentStart.y, z: segmentStart.z });
            console.log('Segment end coordinates:', { x: segmentEnd.x, y: segmentEnd.y, z: segmentEnd.z });

            const newSegment: DuctSegment = {
              id: `duct-${Date.now()}`,
              start: segmentStart,
              end: segmentEnd,
              width: 12, // Default 12 inches
              height: 8,  // Default 8 inches
              type: 'supply',
              material: 'Galvanized Steel'
            };
            console.log('Creating new segment:', newSegment);
            onSegmentAdd(newSegment);

            // Continue drawing: start next segment from this end point (exact same coordinates)
            const nextStartPoint = new Vector3(segmentEnd.x, segmentEnd.y, segmentEnd.z);
            console.log('Next segment will start at:', nextStartPoint);
            console.log('Next start coordinates:', { x: nextStartPoint.x, y: nextStartPoint.y, z: nextStartPoint.z });
            setDrawingState({
              isDrawing: true,
              startPoint: nextStartPoint,
              currentPoint: nextStartPoint.clone()
            });
          }
        }
      }
    }
  }, [activeTool, drawingState, onSegmentAdd]);

  // Handle mouse move for drawing preview
  const handleMouseMove = useCallback((event: any) => {
    if (!drawingState.isDrawing || !drawingState.startPoint) return;

    // Use the event's point directly and project to ground plane
    let currentPoint = event.point ? event.point.clone() : new Vector3(0, 0, 0);
    currentPoint.y = 0; // Keep on ground plane

    // Apply grid snapping for preview
    currentPoint = snapToGrid(currentPoint);

    // Create a new Vector3 to avoid reference issues
    const previewPoint = new Vector3(currentPoint.x, currentPoint.y, currentPoint.z);

    setDrawingState(prev => ({
      ...prev,
      currentPoint: previewPoint
    }));
  }, [drawingState.isDrawing, drawingState.startPoint, snapToGrid]);

  // Reset camera to home position
  const resetCamera = useCallback(() => {
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Invisible plane for click detection */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleCanvasClick}
        onPointerMove={handleMouseMove}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Environment */}
      <Environment preset="studio" />

      {/* Drawing Preview */}
      <DrawingPreview
        startPoint={drawingState.startPoint}
        currentPoint={drawingState.currentPoint}
        activeTool={activeTool}
      />

      {/* Grid */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#374151"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Coordinate System Origin */}
      <group>
        {/* X-axis (Red) */}
        <Line points={[[0, 0, 0], [2, 0, 0]]} color="red" lineWidth={3} />
        <Text position={[2.2, 0, 0]} fontSize={0.3} color="red">X</Text>
        
        {/* Y-axis (Green) */}
        <Line points={[[0, 0, 0], [0, 2, 0]]} color="green" lineWidth={3} />
        <Text position={[0, 2.2, 0]} fontSize={0.3} color="green">Y</Text>
        
        {/* Z-axis (Blue) */}
        <Line points={[[0, 0, 0], [0, 0, 2]]} color="blue" lineWidth={3} />
        <Text position={[0, 0, 2.2]} fontSize={0.3} color="blue">Z</Text>
      </group>

      {/* Duct Segments */}
      {segments.map((segment) => (
        <DuctMesh
          key={segment.id}
          segment={segment}
          isSelected={selectedSegmentId === segment.id}
          onSelect={() => onSegmentSelect?.(segment.id)}
        />
      ))}

      {/* Controls */}
      <OrbitControls
        enablePan={activeTool === 'select'}
        enableZoom={true}
        enableRotate={activeTool === 'select'}
        dampingFactor={0.05}
        screenSpacePanning={false}
        minDistance={1}
        maxDistance={100}
      />
    </>
  );
};

// Loading Component
const CanvasLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-neutral-600 dark:text-neutral-300">Loading 3D Canvas...</p>
    </div>
  </div>
);

// Toolbar Component
const Canvas3DToolbar: React.FC<{
  onResetCamera: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showGizmo: boolean;
  onToggleGizmo: () => void;
}> = ({ onResetCamera, showGrid, onToggleGrid, showGizmo, onToggleGizmo }) => {
  const tools = [
    {
      id: 'home',
      icon: Home,
      label: 'Reset View',
      onClick: onResetCamera,
    },
    {
      id: 'grid',
      icon: showGrid ? Grid3X3 : Grid3X3,
      label: showGrid ? 'Hide Grid' : 'Show Grid',
      onClick: onToggleGrid,
      active: showGrid,
    },
    {
      id: 'gizmo',
      icon: showGizmo ? Eye : EyeOff,
      label: showGizmo ? 'Hide Gizmo' : 'Show Gizmo',
      onClick: onToggleGizmo,
      active: showGizmo,
    },
  ];

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-lg border border-white/20 dark:border-neutral-700/50 shadow-lg p-2">
        <div className="flex space-x-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={tool.onClick}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  "hover:bg-white/40 dark:hover:bg-white/10",
                  tool.active && "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                )}
                title={tool.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Main Canvas3D Component
export const Canvas3D: React.FC<Canvas3DProps> = ({
  segments = [],
  onSegmentAdd,
  onSegmentUpdate,
  onSegmentDelete,
  className,
  showGrid: initialShowGrid = true,
  showGizmo: initialShowGizmo = true,
  activeTool = 'select',
  onElementSelect,
  onCameraReady,
}) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>();
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [showGizmo, setShowGizmo] = useState(initialShowGizmo);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleResetCamera = useCallback(() => {
    // This will be handled by the Scene3D component
  }, []);

  return (
    <div className={cn("relative w-full h-full min-h-[600px]", className)} ref={canvasRef}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows={process.env.NODE_ENV !== 'development'} // Disable shadows in development
        frameloop="demand" // Render on demand for better performance
        dpr={Math.min(window.devicePixelRatio, 2)} // Limit pixel ratio
        performance={{ min: 0.5 }} // Allow quality reduction
        className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"

      >
        <Suspense fallback={null}>
          <Scene3D
            segments={segments}
            selectedSegmentId={selectedSegmentId}
            onSegmentSelect={setSelectedSegmentId}
            showGrid={showGrid}
            activeTool={activeTool}
            onSegmentAdd={onSegmentAdd}
            onElementSelect={onElementSelect}
            onCameraReady={onCameraReady}
          />
          
          {/* Gizmo Helper */}
          {showGizmo && (
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport 
                axisColors={['red', 'green', 'blue']} 
                labelColor="black"
              />
            </GizmoHelper>
          )}
        </Suspense>
      </Canvas>

      {/* Loading Fallback */}
      <Suspense fallback={<CanvasLoader />}>
        <div />
      </Suspense>

      {/* Toolbar */}
      <Canvas3DToolbar
        onResetCamera={handleResetCamera}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showGizmo={showGizmo}
        onToggleGizmo={() => setShowGizmo(!showGizmo)}
      />

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-lg border border-white/20 dark:border-neutral-700/50 shadow-lg px-3 py-2">
          <div className="flex items-center space-x-4 text-sm text-neutral-600 dark:text-neutral-300">
            <span>Segments: {segments.length}</span>
            {selectedSegmentId && <span>Selected: {selectedSegmentId}</span>}
            <span>Grid: {showGrid ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
