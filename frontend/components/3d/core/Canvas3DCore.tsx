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
        intensity={lightingConfig.ambient.intensity} 
        color={lightingConfig.ambient.color} 
      />
      <directionalLight
        position={lightingConfig.directional.position}
        intensity={lightingConfig.directional.intensity}
        color={lightingConfig.directional.color}
        castShadow={lightingConfig.directional.castShadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight
        position={lightingConfig.point.position}
        intensity={lightingConfig.point.intensity}
        color={lightingConfig.point.color}
        distance={lightingConfig.point.distance}
        decay={lightingConfig.point.decay}
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
  const meshRef = useRef<any>();

  const geometry = useMemo(() => {
    const start = segment.start;
    const end = segment.end;
    const direction = new Vector3().subVectors(end, start);
    const length = direction.length();
    
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
    return new Vector3().addVectors(segment.start, segment.end).multiplyScalar(0.5);
  }, [segment.start, segment.end]);

  const rotation = useMemo(() => {
    const direction = new Vector3().subVectors(segment.end, segment.start).normalize();
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction);
    return new Euler().setFromQuaternion(quaternion);
  }, [segment.start, segment.end]);

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
        <cylinderGeometry args={geometry.args} />
      ) : (
        <boxGeometry args={geometry.args} />
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
  const meshRef = useRef<any>();

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
      position={equipment.position}
      rotation={equipment.rotation}
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
  const meshRef = useRef<any>();

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
      position={fitting.position}
      rotation={fitting.rotation}
      onClick={onClick}
      onPointerMove={onPointerMove}
      userData={{ id: fitting.id, type: 'fitting' }}
    >
      <boxGeometry args={geometry.args} />
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
  children
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCameraChange = useCallback((state: any) => {
    if (onCameraChange) {
      onCameraChange(state.camera.position, state.target);
    }
  }, [onCameraChange]);

  return (
    <div ref={canvasRef} className="w-full h-full">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows={performanceConfig.enableShadows}
        dpr={performanceConfig.pixelRatio}
        frameloop={performanceConfig.frameloop}
        gl={{ 
          antialias: performanceConfig.enableAntialiasing,
          powerPreference: performanceConfig.powerPreference
        }}
      >
        {/* Environment */}
        <Environment
          preset={environmentConfig.preset}
          background={environmentConfig.background}
          blur={environmentConfig.blur}
          intensity={environmentConfig.intensity}
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
