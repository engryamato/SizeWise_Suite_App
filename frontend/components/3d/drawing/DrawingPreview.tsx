"use client";

import React, { useRef, useMemo } from 'react';
import { Vector3 } from 'three';
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

  if (!isDrawing || !startPoint || !currentPoint || drawingTool !== 'duct') {
    return null;
  }

  return (
    <group name="drawing-preview">
      {/* Preview line */}
      <Line
        ref={lineRef}
        points={previewPoints}
        color="#ff6b35"
        lineWidth={3}
        dashed={true}
        dashSize={0.2}
        gapSize={0.1}
      />
      
      {/* Distance label */}
      <Text
        position={[midpoint.x, midpoint.y + 0.5, midpoint.z]}
        fontSize={0.3}
        color="#ff6b35"
        anchorX="center"
        anchorY="middle"
      >
        {distance.toFixed(1)}'
      </Text>

      {/* Start point indicator */}
      <mesh position={[startPoint.x / 12, startPoint.y / 12, startPoint.z / 12]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>

      {/* End point indicator */}
      <mesh position={[currentPoint.x / 12, currentPoint.y / 12, currentPoint.z / 12]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
};
