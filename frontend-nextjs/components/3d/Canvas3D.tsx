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
import { Vector3, BufferGeometry, Float32BufferAttribute } from 'three';
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

  return (
    <mesh
      ref={meshRef}
      position={center}
      onClick={onSelect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[segment.width, segment.height, length]} />
      <meshStandardMaterial 
        color={getColor()} 
        transparent 
        opacity={isSelected ? 0.8 : 0.7}
        wireframe={isSelected}
      />
      
      {/* Duct label */}
      {(isSelected || hovered) && (
        <Text
          position={[0, segment.height / 2 + 0.5, 0]}
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
}> = ({ segments, selectedSegmentId, onSegmentSelect, showGrid, activeTool, onSegmentAdd, onElementSelect }) => {
  const { camera, raycaster, scene } = useThree();
  const [drawingState, setDrawingState] = useState<{
    isDrawing: boolean;
    startPoint?: Vector3;
    currentPoint?: Vector3;
  }>({ isDrawing: false });

  // Handle canvas clicks for drawing
  const handleCanvasClick = useCallback((event: any) => {
    // For drawing tools, always project to ground plane (ignore existing segments)
    if (activeTool && activeTool !== 'select') {
      // Project click to y=0 plane for drawing new segments
      const planeNormal = new Vector3(0, 1, 0);
      const distance = 0; // y=0 plane
      const ray = raycaster.ray;
      const t = -(ray.origin.dot(planeNormal) + distance) / ray.direction.dot(planeNormal);
      const clickPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));

      if (activeTool === 'line') {
        if (!drawingState.isDrawing) {
          // Start drawing
          setDrawingState({
            isDrawing: true,
            startPoint: clickPoint,
            currentPoint: clickPoint
          });
        } else {
          // Finish drawing - create duct segment
          if (drawingState.startPoint && onSegmentAdd) {
            const newSegment: DuctSegment = {
              id: `duct-${Date.now()}`,
              start: drawingState.startPoint,
              end: clickPoint,
              width: 12, // Default 12 inches
              height: 8,  // Default 8 inches
              type: 'supply',
              material: 'Galvanized Steel'
            };
            onSegmentAdd(newSegment);
          }

          // Reset drawing state
          setDrawingState({ isDrawing: false });
        }
      }
    }
  }, [activeTool, drawingState, raycaster, onSegmentAdd]);

  // Handle mouse move for drawing preview
  const handleMouseMove = useCallback((event: any) => {
    if (!drawingState.isDrawing || !drawingState.startPoint) return;

    // Always project to ground plane for drawing preview
    const planeNormal = new Vector3(0, 1, 0);
    const distance = 0;
    const ray = raycaster.ray;
    const t = -(ray.origin.dot(planeNormal) + distance) / ray.direction.dot(planeNormal);
    const currentPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));

    setDrawingState(prev => ({
      ...prev,
      currentPoint
    }));
  }, [drawingState.isDrawing, drawingState.startPoint, raycaster]);

  // Reset camera to home position
  const resetCamera = useCallback(() => {
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <group onClick={handleCanvasClick} onPointerMove={handleMouseMove}>
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
    </group>
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
        shadows
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
