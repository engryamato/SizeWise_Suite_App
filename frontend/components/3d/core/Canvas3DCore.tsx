/**
 * Canvas3D Core Component
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Core 3D rendering logic extracted from Canvas3D.tsx
 */

"use client";

import React, { useRef, useCallback, useMemo } from 'react';
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
import * as THREE from 'three';
import { Vector3, Vector2, Raycaster, Quaternion, Euler } from 'three';
import { 
  DuctSegment, 
  Equipment, 
  DuctFitting, 
  PerformanceConfig,
  GridConfig,
  EnvironmentConfig,
  LightingConfig
} from '../types/Canvas3DTypes';

interface Canvas3DCoreProps {
  segments: DuctSegment[];
  equipment: Equipment[];
  fittings: DuctFitting[];
  performanceConfig: PerformanceConfig;
  gridConfig: GridConfig;
  environmentConfig: EnvironmentConfig;
  lightingConfig: LightingConfig;
  onSelectionChange?: (selectedIds: string[]) => void;
  onCameraChange?: (position: Vector3, target: Vector3) => void;
  onCanvasClick?: (event: any) => void;
  onCanvasMouseMove?: (event: any) => void;
  enableDrawing?: boolean;
  children?: React.ReactNode;
}

// Scene content component
const SceneContent: React.FC<{
  segments: DuctSegment[];
  equipment: Equipment[];
  fittings: DuctFitting[];
  gridConfig: GridConfig;
  lightingConfig: LightingConfig;
  onSelectionChange?: (selectedIds: string[]) => void;
}> = ({ 
  segments, 
  equipment, 
  fittings, 
  gridConfig, 
  lightingConfig,
  onSelectionChange 
}) => {
  const { camera, gl, scene } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const mouse = useRef(new Vector2());

  // Handle mouse interactions
  const handlePointerMove = useCallback((event: any) => {
    mouse.current.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
  }, [gl]);

  const handleClick = useCallback((event: any) => {
    raycaster.setFromCamera(mouse.current, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      const selectedId = selectedObject.userData?.id;
      
      if (selectedId && onSelectionChange) {
        onSelectionChange([selectedId]);
      }
    }
  }, [camera, scene, raycaster, onSelectionChange]);

  return (
    <>
      {/* Lighting */}
      <ambientLight
        intensity={lightingConfig.ambient?.intensity || 0.4}
        color={lightingConfig.ambient?.color || '#ffffff'}
      />
      <directionalLight
        position={lightingConfig.directional?.position || [10, 10, 5]}
        intensity={lightingConfig.directional?.intensity || 1.0}
        color={lightingConfig.directional?.color || '#ffffff'}
        castShadow={lightingConfig.directional?.castShadow || true}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight
        position={lightingConfig.point?.position || [0, 10, 0]}
        intensity={lightingConfig.point?.intensity || 0.5}
        color={lightingConfig.point?.color || '#ffffff'}
        distance={lightingConfig.point?.distance || 100}
        decay={lightingConfig.point?.decay || 2}
      />

      {/* Grid */}
      {gridConfig.visible && (
        <Grid
          args={[gridConfig.size, gridConfig.divisions]}
          cellSize={1}
          cellThickness={0.5}
          cellColor={gridConfig.colorGrid}
          sectionSize={10}
          sectionThickness={1}
          sectionColor={gridConfig.colorCenterLine}
          fadeDistance={gridConfig.fadeDistance}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={gridConfig.infiniteGrid}
        />
      )}

      {/* Duct Segments */}
      {segments.map((segment) => (
        <DuctSegmentMesh
          key={segment.id}
          segment={segment}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
        />
      ))}

      {/* Equipment */}
      {equipment.map((item) => (
        <EquipmentMesh
          key={item.id}
          equipment={item}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
        />
      ))}

      {/* Fittings */}
      {fittings.map((fitting) => (
        <FittingMesh
          key={fitting.id}
          fitting={fitting}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
        />
      ))}
    </>
  );
};

// Duct segment mesh component
const DuctSegmentMesh: React.FC<{
  segment: DuctSegment;
  onClick?: (event: any) => void;
  onPointerMove?: (event: any) => void;
}> = ({ segment, onClick, onPointerMove }) => {
  const meshRef = useRef<any>(null);

  const geometry = useMemo(() => {
    const start = segment.start || new Vector3(0, 0, 0);
    const end = segment.end || new Vector3(1, 0, 0);
    const direction = new Vector3().subVectors(end, start);
    const length = direction.length() || 1;

    if (segment.shape === 'round') {
      const radius = (segment.diameter || 12) / 2;
      return { type: 'cylinder', args: [radius, radius, length, 16] };
    } else {
      const width = segment.width || 12;
      const height = segment.height || 8;
      return { type: 'box', args: [width, height, length] };
    }
  }, [segment]);

  const position = useMemo(() => {
    const start = segment.start || new Vector3(0, 0, 0);
    const end = segment.end || new Vector3(1, 0, 0);
    const pos = new Vector3().addVectors(start, end).multiplyScalar(0.5);
    return [pos.x, pos.y, pos.z] as [number, number, number];
  }, [segment]);

  const rotation = useMemo(() => {
    const start = segment.start || new Vector3(0, 0, 0);
    const end = segment.end || new Vector3(1, 0, 0);
    const direction = new Vector3().subVectors(end, start).normalize();
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction);
    const euler = new Euler().setFromQuaternion(quaternion);
    return [euler.x, euler.y, euler.z] as [number, number, number];
  }, [segment]);

  const material = useMemo(() => {
    const color = segment.type === 'supply' ? '#4CAF50' : 
                  segment.type === 'return' ? '#2196F3' : '#FF9800';
    return {
      color,
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.8
    };
  }, [segment.type]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerMove={onPointerMove}
      userData={{ id: segment.id, type: 'duct' }}
    >
      {geometry.type === 'cylinder' ? (
        <cylinderGeometry args={geometry.args.slice(0, 8) as [number?, number?, number?, number?, number?, boolean?, number?, number?]} />
      ) : (
        <boxGeometry args={geometry.args.slice(0, 6) as [number?, number?, number?, number?, number?, number?]} />
      )}
      <meshStandardMaterial {...material} />
    </mesh>
  );
};

// Equipment mesh component
const EquipmentMesh: React.FC<{
  equipment: Equipment;
  onClick?: (event: any) => void;
  onPointerMove?: (event: any) => void;
}> = ({ equipment, onClick, onPointerMove }) => {
  const meshRef = useRef<any>(null);

  const material = useMemo(() => {
    const colorMap = {
      'Fan': '#FF5722',
      'AHU': '#9C27B0',
      'VAV Box': '#3F51B5',
      'Damper': '#607D8B',
      'Filter': '#795548',
      'Coil': '#009688',
      'Custom': '#757575'
    };

    return {
      color: colorMap[equipment.type] || '#757575',
      metalness: 0.5,
      roughness: 0.3
    };
  }, [equipment.type]);

  return (
    <mesh
      ref={meshRef}
      position={equipment.position || [0, 0, 0]}
      rotation={equipment.rotation || [0, 0, 0]}
      onClick={onClick}
      onPointerMove={onPointerMove}
      userData={{ id: equipment.id, type: 'equipment' }}
    >
      <boxGeometry args={[
        equipment.dimensions.width,
        equipment.dimensions.height,
        equipment.dimensions.depth
      ]} />
      <meshStandardMaterial {...material} />
      
      {/* Equipment label */}
      <Text
        position={[0, equipment.dimensions.height / 2 + 1, 0]}
        fontSize={1}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {equipment.type}
      </Text>
    </mesh>
  );
};

// Fitting mesh component
const FittingMesh: React.FC<{
  fitting: DuctFitting;
  onClick?: (event: any) => void;
  onPointerMove?: (event: any) => void;
}> = ({ fitting, onClick, onPointerMove }) => {
  const meshRef = useRef<any>(null);

  const geometry = useMemo(() => {
    if (fitting.type === 'transition') {
      // Simplified transition geometry
      return { type: 'box', args: [6, 6, 12] };
    } else if (fitting.type === 'elbow') {
      // Simplified elbow geometry
      return { type: 'box', args: [8, 8, 8] };
    }
    return { type: 'box', args: [6, 6, 6] };
  }, [fitting.type]);

  const material = useMemo(() => ({
    color: '#FFC107',
    metalness: 0.4,
    roughness: 0.6,
    transparent: true,
    opacity: 0.9
  }), []);

  return (
    <mesh
      ref={meshRef}
      position={fitting.position || [0, 0, 0]}
      rotation={fitting.rotation || [0, 0, 0]}
      onClick={onClick}
      onPointerMove={onPointerMove}
      userData={{ id: fitting.id, type: 'fitting' }}
    >
      <boxGeometry args={geometry.args.slice(0, 6) as [number?, number?, number?, number?, number?, number?]} />
      <meshStandardMaterial {...material} />
    </mesh>
  );
};

// Main Canvas3D Core component
export const Canvas3DCore: React.FC<Canvas3DCoreProps> = ({
  segments,
  equipment,
  fittings,
  performanceConfig,
  gridConfig,
  environmentConfig,
  lightingConfig,
  onSelectionChange,
  onCameraChange,
  onCanvasClick,
  onCanvasMouseMove,
  enableDrawing = false,
  children
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCameraChange = useCallback((state: any) => {
    if (onCameraChange && state?.camera?.position && state?.target) {
      onCameraChange(state.camera.position, state.target);
    }
  }, [onCameraChange]);

  // Handle canvas click for drawing
  const handleCanvasClick = useCallback((event: any) => {
    if (enableDrawing && onCanvasClick) {
      // Get world position from the click event
      const intersectionPoint = event.intersections?.[0]?.point;
      if (intersectionPoint) {
        onCanvasClick({ ...event, point: intersectionPoint });
      } else {
        // If no intersection with geometry, project the click onto a ground plane using raycasting
        raycaster.setFromCamera(mouse.current, camera);

        // Create a ground plane at Y=0
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();

        // Calculate intersection with ground plane
        const ray = raycaster.ray;
        const intersectPoint = ray.intersectPlane(groundPlane, intersectionPoint);

        if (intersectPoint) {
          onCanvasClick({ ...event, point: intersectPoint });
        } else {
          // Fallback: project mouse position to a point in front of camera
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          const distance = 10; // 10 units in front of camera
          const fallbackPoint = camera.position.clone().add(direction.multiplyScalar(distance));
          onCanvasClick({ ...event, point: fallbackPoint });
        }
      }
    }
  }, [enableDrawing, onCanvasClick, raycaster, mouse, camera]);

  // Handle canvas mouse move for drawing preview
  const handleCanvasMouseMove = useCallback((event: any) => {
    if (enableDrawing && onCanvasMouseMove) {
      // Get world position from the mouse move event
      const intersectionPoint = event.intersections?.[0]?.point;
      if (intersectionPoint) {
        onCanvasMouseMove({ ...event, point: intersectionPoint });
      } else {
        // If no intersection with geometry, project the mouse position onto a ground plane using raycasting
        raycaster.setFromCamera(mouse.current, camera);

        // Create a ground plane at Y=0
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();

        // Calculate intersection with ground plane
        const ray = raycaster.ray;
        const intersectPoint = ray.intersectPlane(groundPlane, intersectionPoint);

        if (intersectPoint) {
          onCanvasMouseMove({ ...event, point: intersectPoint });
        } else {
          // Fallback: project mouse position to a point in front of camera
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          const distance = 10; // 10 units in front of camera
          const fallbackPoint = camera.position.clone().add(direction.multiplyScalar(distance));
          onCanvasMouseMove({ ...event, point: fallbackPoint });
        }
      }
    }
  }, [enableDrawing, onCanvasMouseMove, raycaster, mouse, camera]);

  return (
    <div ref={canvasRef} className="w-full h-full">
      <Canvas
        key="sizewise-3d-canvas"
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows={performanceConfig.enableShadows}
        dpr={performanceConfig.pixelRatio}
        frameloop={performanceConfig.frameloop}
        gl={{
          antialias: performanceConfig.enableAntialiasing,
          powerPreference: performanceConfig.powerPreference,
          alpha: true,
          preserveDrawingBuffer: false,
          stencil: false,
          depth: true,
          failIfMajorPerformanceCaveat: false
        }}
        onClick={handleCanvasClick}
        onPointerMove={handleCanvasMouseMove}
      >
        {/* Environment */}
        <Environment
          preset={environmentConfig.preset}
          background={typeof environmentConfig.background === 'boolean' ? environmentConfig.background : false}
          blur={environmentConfig.blur}
        />

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.05}
          onChange={handleCameraChange}
        />

        {/* Gizmo */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport 
            axisColors={['red', 'green', 'blue']} 
            labelColor="black"
          />
        </GizmoHelper>

        {/* Scene Content */}
        <SceneContent
          segments={segments}
          equipment={equipment}
          fittings={fittings}
          gridConfig={gridConfig}
          lightingConfig={lightingConfig}
          onSelectionChange={onSelectionChange}
        />

        {/* Additional children */}
        {children}
      </Canvas>
    </div>
  );
};
