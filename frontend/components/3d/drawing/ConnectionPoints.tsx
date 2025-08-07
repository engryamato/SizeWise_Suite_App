"use client";

import React, { useMemo, useRef, useCallback } from 'react';
import { Vector3 } from 'three';
import { DuctSegment } from '@/components/3d/types/Canvas3DTypes';

// Local interface for connection points specific to drawing
interface DrawingConnectionPoint {
  id: string;
  position: Vector3;
  segmentId: string;
  type: 'start' | 'end';
  isOccupied: boolean;
}

interface ConnectionPointsProps {
  segments: DuctSegment[];
  enableDrawing: boolean;
  hoveredPoint?: string | null;
  onConnectionPointHover?: (pointId: string | null) => void;
  onConnectionPointClick?: (pointId: string, position: Vector3) => void;
}

export const ConnectionPoints: React.FC<ConnectionPointsProps> = ({
  segments,
  enableDrawing,
  hoveredPoint,
  onConnectionPointHover,
  onConnectionPointClick
}) => {
  // Generate connection points from segments
  const connectionPoints = useMemo((): DrawingConnectionPoint[] => {
    const points: DrawingConnectionPoint[] = [];
    const seenIds = new Set<string>();
    const positionMap = new Map<string, number>(); // Track positions for occupancy detection

    segments.forEach((segment, index) => {
      // Ensure unique segment IDs to prevent duplicate keys
      const segmentId = segment.id || `segment-${index}`;

      // Helper function to create position key for occupancy detection
      const getPositionKey = (pos: Vector3) =>
        `${Math.round(pos.x * 100)},${Math.round(pos.y * 100)},${Math.round(pos.z * 100)}`;

      // Start point
      const startId = `${segmentId}-start`;
      if (!seenIds.has(startId)) {
        seenIds.add(startId);
        const startPosKey = getPositionKey(segment.start);
        const startOccupancy = (positionMap.get(startPosKey) || 0) + 1;
        positionMap.set(startPosKey, startOccupancy);

        points.push({
          id: startId,
          position: segment.start.clone(),
          segmentId: segmentId,
          type: 'start',
          isOccupied: startOccupancy > 1 // Occupied if multiple segments share this position
        });
      }

      // End point
      const endId = `${segmentId}-end`;
      if (!seenIds.has(endId)) {
        seenIds.add(endId);
        const endPosKey = getPositionKey(segment.end);
        const endOccupancy = (positionMap.get(endPosKey) || 0) + 1;
        positionMap.set(endPosKey, endOccupancy);

        points.push({
          id: endId,
          position: segment.end.clone(),
          segmentId: segmentId,
          type: 'end',
          isOccupied: endOccupancy > 1 // Occupied if multiple segments share this position
        });
      }
    });

    return points;
  }, [segments]);

  if (!enableDrawing) {
    return null;
  }

  return (
    <group name="connection-points">
      {connectionPoints.map(point => (
        <ConnectionPointMesh
          key={point.id}
          point={point}
          isHovered={hoveredPoint === point.id}
          onHover={onConnectionPointHover}
          onClick={onConnectionPointClick}
        />
      ))}
    </group>
  );
};

interface ConnectionPointMeshProps {
  point: DrawingConnectionPoint;
  isHovered: boolean;
  onHover?: (pointId: string | null) => void;
  onClick?: (pointId: string, position: Vector3) => void;
}

const ConnectionPointMesh: React.FC<ConnectionPointMeshProps> = ({
  point,
  isHovered,
  onHover,
  onClick
}) => {
  const meshRef = useRef<any>(null);

  const handlePointerEnter = useCallback(() => {
    onHover?.(point.id);
  }, [onHover, point.id]);

  const handlePointerLeave = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    onClick?.(point.id, point.position);
  }, [onClick, point.id, point.position]);

  // Convert position from inches to feet for Three.js
  const position = useMemo(() => {
    return [
      point.position.x / 12,
      point.position.y / 12,
      point.position.z / 12
    ] as const;
  }, [point.position]);

  // Visual properties based on state
  const color = useMemo(() => {
    if (isHovered) return '#00ff00'; // Green when hovered
    if (point.isOccupied) return '#ff0000'; // Red when occupied
    return '#ffff00'; // Yellow when available
  }, [isHovered, point.isOccupied]);

  const scale = isHovered ? 1.5 : 1.0;

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, scale]}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      userData={{ id: point.id, type: 'connection-point' }}
    >
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent={true}
        opacity={0.8}
      />
      
      {/* Outer ring for better visibility */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <ringGeometry args={[0.15, 0.18, 8]} />
        <meshBasicMaterial 
          color={color}
          transparent={true}
          opacity={0.4}
          side={2} // DoubleSide
        />
      </mesh>
    </mesh>
  );
};

// Utility function to find nearest connection point
export const findNearestConnectionPoint = (
  position: Vector3,
  connectionPoints: DrawingConnectionPoint[],
  snapDistance: number = 24 // inches
): DrawingConnectionPoint | null => {
  let nearest: DrawingConnectionPoint | null = null;
  let minDistance = snapDistance;

  connectionPoints.forEach(point => {
    const distance = position.distanceTo(point.position);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  });

  return nearest;
};

// Utility function to snap position to nearest connection point
export const snapToConnectionPoint = (
  position: Vector3,
  connectionPoints: DrawingConnectionPoint[],
  snapDistance: number = 24 // inches
): Vector3 => {
  const nearest = findNearestConnectionPoint(position, connectionPoints, snapDistance);
  return nearest ? nearest.position.clone() : position;
};
