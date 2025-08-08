"use client";

import React, { useRef, useMemo } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import { DuctProperties } from '@/components/ui/DrawingToolFAB';

interface DrawingPreviewProps {
  startPoint: Vector3 | null;
  currentPoint: Vector3 | null;
  isDrawing: boolean;
  ductProperties?: DuctProperties;
  drawingTool?: string;
}

export const DrawingPreview: React.FC<DrawingPreviewProps> = ({
  startPoint,
  currentPoint,
  isDrawing,
  ductProperties,
  drawingTool
}) => {
  const lineRef = useRef<any>(null);

  // Calculate preview line points
  const previewPoints = useMemo(() => {
    if (!startPoint || !currentPoint || !isDrawing) return [];

    return [
      startPoint.x / 12, startPoint.y / 12, startPoint.z / 12, // Convert inches to feet
      currentPoint.x / 12, currentPoint.y / 12, currentPoint.z / 12
    ];
  }, [startPoint, currentPoint, isDrawing]);

  // Calculate line geometry for cylinder-based centerline
  const lineGeometry = useMemo(() => {
    if (!startPoint || !currentPoint || !isDrawing) return null;

    const start = new Vector3(startPoint.x / 12, startPoint.y / 12, startPoint.z / 12);
    const end = new Vector3(currentPoint.x / 12, currentPoint.y / 12, currentPoint.z / 12);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const center = start.clone().add(end).multiplyScalar(0.5);

    // Calculate rotation to align cylinder with the line direction
    const up = new Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize());
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    return {
      position: center,
      rotation: euler,
      length
    };
  }, [startPoint, currentPoint, isDrawing]);

  // Calculate distance for label
  const distance = useMemo(() => {
    if (!startPoint || !currentPoint) return 0;
    return startPoint.distanceTo(currentPoint) / 12; // Convert to feet
  }, [startPoint, currentPoint]);

  // Calculate midpoint for label
  const midpoint = useMemo(() => {
    if (!startPoint || !currentPoint) return new Vector3();
    return new Vector3()
      .addVectors(startPoint, currentPoint)
      .multiplyScalar(0.5)
      .divideScalar(12); // Convert to feet
  }, [startPoint, currentPoint]);

  // Debug logging
  console.log('DrawingPreview render:', {
    isDrawing,
    hasStartPoint: !!startPoint,
    hasCurrentPoint: !!currentPoint,
    drawingTool,
    startPoint: startPoint?.toArray(),
    currentPoint: currentPoint?.toArray(),
    previewPointsLength: previewPoints.length
  });

  if (!isDrawing || !startPoint || !currentPoint || drawingTool !== 'duct') {
    return null;
  }

  return (
    <group name="drawing-preview">
      {/* Cylinder-based centerline for better visibility */}
      {lineGeometry && (
        <mesh
          position={[lineGeometry.position.x, lineGeometry.position.y, lineGeometry.position.z] as unknown as any}
          rotation={[lineGeometry.rotation.x, lineGeometry.rotation.y, lineGeometry.rotation.z] as unknown as any}
        >
          <cylinderGeometry args={[0.02, 0.02, lineGeometry.length, 8] as unknown as any} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}

      {/* Fallback Line component */}
      <Line
        ref={lineRef}
        points={previewPoints}
        color="#ff0000"
        lineWidth={10}
        dashed={true}
        dashSize={0.5}
        gapSize={0.2}
      />
      
      {/* Distance label */}
      <Text
        position={[midpoint.x, midpoint.y + 0.5, midpoint.z]}
        fontSize={0.3}
        color="#ff6b35"
        anchorX="center"
        anchorY="middle"
      >
        {distance.toFixed(1)}{"'"}
      </Text>

      {/* Start point indicator - Enhanced visibility */}
      <mesh position={[startPoint.x / 12, startPoint.y / 12, startPoint.z / 12] as [number, number, number]}>
        <sphereGeometry args={[0.3, 16, 16] as [number, number, number]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>

      {/* End point indicator - Enhanced visibility */}
      <mesh position={[currentPoint.x / 12, currentPoint.y / 12, currentPoint.z / 12] as [number, number, number]}>
        <sphereGeometry args={[0.3, 16, 16] as [number, number, number]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
};
