/**
 * Duct Renderer Component
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Specialized duct rendering logic extracted from Canvas3D.tsx
 */

"use client";

import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Euler, Quaternion, BufferGeometry, Float32BufferAttribute } from 'three';
import { Text, Line } from '@react-three/drei';
import { DuctSegment, ConnectionPoint, MaterialConfig } from '../types/Canvas3DTypes';
import { SMACNAStandards } from '../utils/SMACNAStandards';

interface DuctRendererProps {
  segments: DuctSegment[];
  selectedIds: string[];
  hoveredId: string | null;
  showLabels?: boolean;
  showDimensions?: boolean;
  showConnectionPoints?: boolean;
  materialConfig?: MaterialConfig;
  onSegmentClick?: (segmentId: string, event: any) => void;
  onSegmentHover?: (segmentId: string | null, event: any) => void;
  onConnectionPointClick?: (pointId: string, event: any) => void;
}

// Individual duct segment component
const DuctSegmentMesh: React.FC<{
  segment: DuctSegment;
  isSelected: boolean;
  isHovered: boolean;
  showLabels: boolean;
  showDimensions: boolean;
  showConnectionPoints: boolean;
  materialConfig: MaterialConfig;
  onSegmentClick?: (segmentId: string, event: any) => void;
  onSegmentHover?: (segmentId: string | null, event: any) => void;
  onConnectionPointClick?: (pointId: string, event: any) => void;
}> = ({
  segment,
  isSelected,
  isHovered,
  showLabels,
  showDimensions,
  showConnectionPoints,
  materialConfig,
  onSegmentClick,
  onSegmentHover,
  onConnectionPointClick
}) => {
  const meshRef = useRef<any>();
  const groupRef = useRef<any>();

  // Calculate geometry based on duct shape
  const geometry = useMemo(() => {
    const start = segment.start;
    const end = segment.end;
    const direction = new Vector3().subVectors(end, start);
    const length = direction.length();
    
    if (segment.shape === 'round') {
      const radius = (segment.diameter || 12) / 2 / 12; // Convert to feet
      return {
        type: 'cylinder',
        args: [radius, radius, length / 12, 16] as const,
        length: length / 12
      };
    } else {
      const width = (segment.width || 12) / 12; // Convert to feet
      const height = (segment.height || 8) / 12; // Convert to feet
      return {
        type: 'box',
        args: [width, height, length / 12] as const,
        length: length / 12
      };
    }
  }, [segment]);

  // Calculate position and rotation
  const { position, rotation } = useMemo(() => {
    const pos = new Vector3().addVectors(segment.start, segment.end).multiplyScalar(0.5);
    const direction = new Vector3().subVectors(segment.end, segment.start).normalize();
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction);
    const rot = new Euler().setFromQuaternion(quaternion);
    
    return {
      position: pos.divideScalar(12), // Convert to feet
      rotation: rot
    };
  }, [segment.start, segment.end]);

  // Material properties based on duct type and state
  const material = useMemo(() => {
    let baseColor = '#4CAF50'; // Default supply color
    
    switch (segment.type) {
      case 'supply':
        baseColor = '#4CAF50'; // Green
        break;
      case 'return':
        baseColor = '#2196F3'; // Blue
        break;
      case 'exhaust':
        baseColor = '#FF9800'; // Orange
        break;
    }

    return {
      color: isSelected ? '#FFD700' : isHovered ? '#FFA500' : baseColor,
      metalness: materialConfig.metalness,
      roughness: materialConfig.roughness,
      transparent: true,
      opacity: isSelected ? 0.9 : isHovered ? 0.85 : materialConfig.opacity,
      wireframe: materialConfig.wireframe
    };
  }, [segment.type, isSelected, isHovered, materialConfig]);

  // Handle interactions
  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    if (onSegmentClick) {
      onSegmentClick(segment.id, event);
    }
  }, [segment.id, onSegmentClick]);

  const handlePointerEnter = useCallback((event: any) => {
    event.stopPropagation();
    if (onSegmentHover) {
      onSegmentHover(segment.id, event);
    }
  }, [segment.id, onSegmentHover]);

  const handlePointerLeave = useCallback((event: any) => {
    event.stopPropagation();
    if (onSegmentHover) {
      onSegmentHover(null, event);
    }
  }, [onSegmentHover]);

  // Calculate label position
  const labelPosition = useMemo(() => {
    return [0, geometry.args[1] / 2 + 0.5, 0] as const;
  }, [geometry]);

  // Calculate dimension lines
  const dimensionLines = useMemo(() => {
    if (!showDimensions) return [];
    
    const lines = [];
    const length = geometry.length;
    
    if (segment.shape === 'rectangular') {
      const width = segment.width || 12;
      const height = segment.height || 8;
      
      lines.push({
        points: [
          new Vector3(-width/24, -height/24, -length/2),
          new Vector3(width/24, -height/24, -length/2)
        ],
        label: `${width}"`
      });
      
      lines.push({
        points: [
          new Vector3(-width/24, -height/24, -length/2),
          new Vector3(-width/24, height/24, -length/2)
        ],
        label: `${height}"`
      });
    } else {
      const diameter = segment.diameter || 12;
      lines.push({
        points: [
          new Vector3(-diameter/24, 0, -length/2),
          new Vector3(diameter/24, 0, -length/2)
        ],
        label: `⌀${diameter}"`
      });
    }
    
    lines.push({
      points: [
        new Vector3(0, 0, -length/2),
        new Vector3(0, 0, length/2)
      ],
      label: `${Math.round(length * 12)}"`
    });
    
    return lines;
  }, [segment, geometry, showDimensions]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main duct mesh */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        userData={{ id: segment.id, type: 'duct' }}
      >
        {geometry.type === 'cylinder' ? (
          <cylinderGeometry args={geometry.args} />
        ) : (
          <boxGeometry args={geometry.args} />
        )}
        <meshStandardMaterial {...material} />
      </mesh>

      {/* Labels */}
      {showLabels && (
        <Text
          position={labelPosition}
          fontSize={0.3}
          color="black"
          anchorX="center"
          anchorY="middle"
          billboard
        >
          {segment.type.toUpperCase()}
        </Text>
      )}

      {/* Dimension lines */}
      {dimensionLines.map((line, index) => (
        <group key={index}>
          <Line
            points={line.points}
            color="yellow"
            lineWidth={2}
          />
          <Text
            position={line.points[0].clone().lerp(line.points[1], 0.5)}
            fontSize={0.2}
            color="yellow"
            anchorX="center"
            anchorY="middle"
            billboard
          >
            {line.label}
          </Text>
        </group>
      ))}

      {/* Connection points */}
      {showConnectionPoints && segment.inlet && (
        <ConnectionPointMesh
          connectionPoint={segment.inlet}
          onClick={onConnectionPointClick}
        />
      )}
      {showConnectionPoints && segment.outlet && (
        <ConnectionPointMesh
          connectionPoint={segment.outlet}
          onClick={onConnectionPointClick}
        />
      )}
    </group>
  );
};

// Connection point visualization
const ConnectionPointMesh: React.FC<{
  connectionPoint: ConnectionPoint;
  onClick?: (pointId: string, event: any) => void;
}> = ({ connectionPoint, onClick }) => {
  const meshRef = useRef<any>();

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    if (onClick) {
      onClick(connectionPoint.id, event);
    }
  }, [connectionPoint.id, onClick]);

  const material = useMemo(() => {
    const colorMap = {
      available: '#00FF00',
      connected: '#0000FF',
      blocked: '#FF0000'
    };
    
    return {
      color: colorMap[connectionPoint.status],
      transparent: true,
      opacity: 0.7
    };
  }, [connectionPoint.status]);

  const size = useMemo(() => {
    if (connectionPoint.shape === 'round') {
      const radius = (connectionPoint.diameter || 6) / 24; // Convert to feet
      return [radius, radius, 0.1] as const;
    } else {
      const width = (connectionPoint.width || 6) / 12;
      const height = (connectionPoint.height || 4) / 12;
      return [width, height, 0.1] as const;
    }
  }, [connectionPoint]);

  return (
    <mesh
      ref={meshRef}
      position={connectionPoint.position.clone().divideScalar(12)}
      onClick={handleClick}
      userData={{ id: connectionPoint.id, type: 'connection' }}
    >
      {connectionPoint.shape === 'round' ? (
        <cylinderGeometry args={size} />
      ) : (
        <boxGeometry args={size} />
      )}
      <meshBasicMaterial {...material} />
    </mesh>
  );
};

// Main duct renderer component
export const DuctRenderer: React.FC<DuctRendererProps> = ({
  segments,
  selectedIds,
  hoveredId,
  showLabels = true,
  showDimensions = false,
  showConnectionPoints = false,
  materialConfig = {
    metalness: 0.3,
    roughness: 0.7,
    color: '#4CAF50',
    opacity: 0.8,
    transparent: true,
    wireframe: false
  },
  onSegmentClick,
  onSegmentHover,
  onConnectionPointClick
}) => {
  return (
    <group name="duct-renderer">
      {segments.map((segment) => (
        <DuctSegmentMesh
          key={segment.id}
          segment={segment}
          isSelected={selectedIds.includes(segment.id)}
          isHovered={hoveredId === segment.id}
          showLabels={showLabels}
          showDimensions={showDimensions}
          showConnectionPoints={showConnectionPoints}
          materialConfig={materialConfig}
          onSegmentClick={onSegmentClick}
          onSegmentHover={onSegmentHover}
          onConnectionPointClick={onConnectionPointClick}
        />
      ))}
    </group>
  );
};

// Duct renderer utilities
export const DuctRendererUtils = {
  /**
   * Calculate duct color based on type and properties
   */
  getDuctColor: (segment: DuctSegment): string => {
    const colorMap = {
      supply: '#4CAF50',
      return: '#2196F3',
      exhaust: '#FF9800'
    };
    return colorMap[segment.type] || '#757575';
  },

  /**
   * Calculate duct opacity based on material and gauge
   */
  getDuctOpacity: (segment: DuctSegment): number => {
    // Thicker gauge = more opaque
    const baseOpacity = 0.8;
    if (segment.material === 'galvanized_steel') {
      return baseOpacity;
    } else if (segment.material === 'aluminum') {
      return baseOpacity * 0.9;
    } else if (segment.material === 'stainless_steel') {
      return baseOpacity * 1.1;
    }
    return baseOpacity;
  },

  /**
   * Generate duct label text
   */
  getDuctLabel: (segment: DuctSegment): string => {
    const type = segment.type.toUpperCase();
    if (segment.shape === 'round') {
      return `${type} ⌀${segment.diameter || 12}"`;
    } else {
      return `${type} ${segment.width || 12}"×${segment.height || 8}"`;
    }
  },

  /**
   * Calculate duct surface area for material estimation
   */
  getDuctSurfaceArea: (segment: DuctSegment): number => {
    const length = segment.start.distanceTo(segment.end);
    
    if (segment.shape === 'round') {
      const diameter = segment.diameter || 12;
      const radius = diameter / 2;
      return Math.PI * diameter * length / 144; // Convert to sq ft
    } else {
      const width = segment.width || 12;
      const height = segment.height || 8;
      const perimeter = 2 * (width + height);
      return perimeter * length / 144; // Convert to sq ft
    }
  },

  /**
   * Validate duct dimensions against SMACNA standards
   */
  validateDuctDimensions: (segment: DuctSegment): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } => {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (segment.shape === 'round') {
      const diameter = segment.diameter || 12;
      if (diameter < 4) {
        warnings.push('Diameter below minimum recommended size (4")');
        recommendations.push('Consider increasing diameter for better airflow');
      } else if (diameter > 48) {
        warnings.push('Diameter above typical range (48")');
        recommendations.push('Verify structural support requirements');
      }
    } else {
      const width = segment.width || 12;
      const height = segment.height || 8;
      
      if (width < 4 || height < 3) {
        warnings.push('Dimensions below minimum recommended size');
        recommendations.push('Increase duct size for proper airflow');
      }
      
      const aspectRatio = Math.max(width, height) / Math.min(width, height);
      if (aspectRatio > 4) {
        warnings.push('High aspect ratio may cause pressure loss');
        recommendations.push('Consider more balanced dimensions');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }
};
