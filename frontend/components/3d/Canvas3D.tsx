"use client";

import React, { Suspense, useRef, useState, useCallback, useMemo } from 'react';
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
import {
  Vector3,
  Vector2,
  Raycaster,
  Quaternion,
  Euler,
  BufferGeometry,
  Float32BufferAttribute
} from 'three';
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
import { DuctProperties } from '@/components/ui/DrawingToolFAB';

interface DuctSegment {
  id: string;
  start: Vector3;
  end: Vector3;
  width?: number; // Optional for round ducts
  height?: number; // Optional for round ducts
  diameter?: number; // For round ducts
  shape: 'rectangular' | 'round';
  type: 'supply' | 'return' | 'exhaust';
  material: string;
  // Connection points for HVAC system connectivity
  inlet?: ConnectionPoint;
  outlet?: ConnectionPoint;
}

// Enhanced connection point for duct fittings and system connectivity
interface ConnectionPoint {
  id: string;
  position: Vector3;
  direction: Vector3;
  shape: 'rectangular' | 'round';
  width?: number;
  height?: number;
  diameter?: number;
  // Connection status for system validation
  status: 'available' | 'connected' | 'blocked';
  connectedTo?: string; // ID of connected element
}

// Base fitting interface
interface DuctFitting {
  id: string;
  type: 'transition' | 'elbow';
  position: Vector3;
  rotation: Euler;
  inlet: ConnectionPoint;
  outlet: ConnectionPoint;
  material: string;
}

interface Equipment {
  id: string;
  type: 'Fan' | 'AHU' | 'VAV Box' | 'Damper' | 'Filter' | 'Coil' | 'Custom';
  position: Vector3;
  rotation: Euler;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  properties: {
    cfmCapacity: number;
    staticPressureCapacity: number;
    model?: string;
    manufacturer?: string;
    powerConsumption?: number;
  };
  material: string;
  // Connection points for HVAC system integration
  connectionPoints: ConnectionPoint[];
}

// Transition fitting for size/shape changes
interface TransitionFitting extends DuctFitting {
  type: 'transition';
  transitionType: 'rect-to-rect' | 'round-to-round' | 'rect-to-round' | 'round-to-rect';
  length: number; // Calculated from SMACNA 2.5:1 slope ratio
  slopeRatio: number;
}

// Elbow fitting for direction changes
interface ElbowFitting extends DuctFitting {
  type: 'elbow';
  elbowType: 'rectangular' | 'round' | 'rect-to-round' | 'round-to-rect';
  angle: 30 | 45 | 90; // Restricted angles for snapping
  centerlineRadius: number; // Based on SMACNA guidelines
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
  // Duct properties for new segments
  ductProperties?: DuctProperties;
  // Fitting callbacks
  onFittingAdd?: (fitting: DuctFitting) => void;
  fittings?: DuctFitting[];
  // Equipment callbacks
  onEquipmentAdd?: (equipment: Equipment) => void;
  equipment?: Equipment[];
  // Equipment placement functionality
  onEquipmentPlace?: (position: { x: number; y: number; z: number }) => void;
}

// Connection Validation and Management System
class ConnectionValidator {
  /**
   * Check if two connection points are compatible for connection
   */
  static areCompatible(point1: ConnectionPoint, point2: ConnectionPoint): boolean {
    // Check if both points are available
    if (point1.status !== 'available' || point2.status !== 'available') {
      return false;
    }

    // Check shape compatibility
    if (point1.shape !== point2.shape) {
      // Allow round-to-rectangular connections with transitions
      return true;
    }

    // Check dimensional compatibility
    if (point1.shape === 'round' && point2.shape === 'round') {
      const diameter1 = point1.diameter || 12;
      const diameter2 = point2.diameter || 12;
      // Allow up to 25% size difference for direct connection
      return Math.abs(diameter1 - diameter2) / Math.max(diameter1, diameter2) <= 0.25;
    }

    if (point1.shape === 'rectangular' && point2.shape === 'rectangular') {
      const area1 = (point1.width || 12) * (point1.height || 8);
      const area2 = (point2.width || 12) * (point2.height || 8);
      // Allow up to 25% area difference for direct connection
      return Math.abs(area1 - area2) / Math.max(area1, area2) <= 0.25;
    }

    return true;
  }

  /**
   * Calculate connection distance between two points
   */
  static getConnectionDistance(point1: ConnectionPoint, point2: ConnectionPoint): number {
    return point1.position.distanceTo(point2.position);
  }

  /**
   * Check if connection points are within connection range
   */
  static isWithinConnectionRange(point1: ConnectionPoint, point2: ConnectionPoint, maxDistance: number = 2.0): boolean {
    return this.getConnectionDistance(point1, point2) <= maxDistance;
  }
}

// Connection Point Utilities for System Integration
class ConnectionPointUtils {
  /**
   * Create connection points for a duct segment
   */
  static createDuctConnectionPoints(segment: DuctSegment): { inlet: ConnectionPoint; outlet: ConnectionPoint } {
    const direction = new Vector3().subVectors(segment.end, segment.start).normalize();

    return {
      inlet: {
        id: `${segment.id}-inlet`,
        position: segment.start.clone(),
        direction: direction.clone().negate(),
        shape: segment.shape,
        width: segment.width,
        height: segment.height,
        diameter: segment.diameter,
        status: 'available'
      },
      outlet: {
        id: `${segment.id}-outlet`,
        position: segment.end.clone(),
        direction: direction.clone(),
        shape: segment.shape,
        width: segment.width,
        height: segment.height,
        diameter: segment.diameter,
        status: 'available'
      }
    };
  }

  /**
   * Create connection points for equipment based on type
   */
  static createEquipmentConnectionPoints(equipment: Equipment): ConnectionPoint[] {
    const points: ConnectionPoint[] = [];
    const { position, dimensions, type } = equipment;

    switch (type) {
      case 'Fan':
        // Fan has inlet and outlet
        points.push(
          {
            id: `${equipment.id}-inlet`,
            position: new Vector3(position.x - dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'round',
            diameter: Math.min(dimensions.width, dimensions.height) * 0.8,
            status: 'available'
          },
          {
            id: `${equipment.id}-outlet`,
            position: new Vector3(position.x + dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'round',
            diameter: Math.min(dimensions.width, dimensions.height) * 0.8,
            status: 'available'
          }
        );
        break;

      case 'AHU':
        // AHU has multiple connection points
        points.push(
          {
            id: `${equipment.id}-supply`,
            position: new Vector3(position.x + dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width * 0.6,
            height: dimensions.height * 0.4,
            status: 'available'
          },
          {
            id: `${equipment.id}-return`,
            position: new Vector3(position.x - dimensions.width / 2, position.y, position.z),
            direction: new Vector3(-1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width * 0.6,
            height: dimensions.height * 0.4,
            status: 'available'
          }
        );
        break;

      case 'VAV Box':
        // VAV has inlet and outlet
        points.push(
          {
            id: `${equipment.id}-inlet`,
            position: new Vector3(position.x, position.y, position.z - dimensions.depth / 2),
            direction: new Vector3(0, 0, 1),
            shape: 'rectangular',
            width: dimensions.width * 0.8,
            height: dimensions.height * 0.6,
            status: 'available'
          },
          {
            id: `${equipment.id}-outlet`,
            position: new Vector3(position.x, position.y, position.z + dimensions.depth / 2),
            direction: new Vector3(0, 0, 1),
            shape: 'rectangular',
            width: dimensions.width * 0.6,
            height: dimensions.height * 0.4,
            status: 'available'
          }
        );
        break;

      default:
        // Generic equipment with single connection point
        points.push({
          id: `${equipment.id}-connection`,
          position: new Vector3(position.x, position.y, position.z + dimensions.depth / 2),
          direction: new Vector3(0, 0, 1),
          shape: 'rectangular',
          width: dimensions.width * 0.5,
          height: dimensions.height * 0.5,
          status: 'available'
        });
        break;
    }

    return points;
  }
}

// SMACNA Standards and Calculations
class SMACNAStandards {
  // Standard transition slope ratio (2.5:1)
  static readonly TRANSITION_SLOPE_RATIO = 2.5;

  // Standard elbow centerline radius ratios
  static readonly ROUND_ELBOW_RADIUS_RATIO = 1.5; // R/D = 1.5
  static readonly RECT_ELBOW_RADIUS_RATIO = 1.0; // R/W = 1.0 for rectangular

  // Restricted angles for snapping (degrees)
  static readonly ALLOWED_ANGLES = [30, 45, 90] as const;

  /**
   * Calculate transition length based on size difference
   */
  static calculateTransitionLength(sizeDiff: number): number {
    return Math.max(sizeDiff * this.TRANSITION_SLOPE_RATIO, 6); // Minimum 6 inches
  }

  /**
   * Calculate elbow centerline radius
   */
  static calculateElbowRadius(shape: 'rectangular' | 'round', size: number): number {
    if (shape === 'round') {
      return size * this.ROUND_ELBOW_RADIUS_RATIO;
    } else {
      return size * this.RECT_ELBOW_RADIUS_RATIO;
    }
  }

  /**
   * Snap angle to nearest allowed angle
   */
  static snapAngle(angle: number): 30 | 45 | 90 {
    const angleDeg = Math.abs(angle * 180 / Math.PI);

    // Find closest allowed angle
    let closest = this.ALLOWED_ANGLES[0];
    let minDiff = Math.abs(angleDeg - closest);

    for (const allowedAngle of this.ALLOWED_ANGLES) {
      const diff = Math.abs(angleDeg - allowedAngle);
      if (diff < minDiff) {
        minDiff = diff;
        closest = allowedAngle;
      }
    }

    return closest;
  }
}

// Connectivity Analysis Utilities
class ConnectivityAnalyzer {
  /**
   * Analyze if two segments need a transition fitting
   */
  static needsTransition(segment1: DuctSegment, segment2: DuctSegment): boolean {
    // Check if shapes are different
    if (segment1.shape !== segment2.shape) {
      return true;
    }

    // Check if sizes are different
    if (segment1.shape === 'round' && segment2.shape === 'round') {
      return Math.abs((segment1.diameter || 0) - (segment2.diameter || 0)) > 0.5; // 0.5" tolerance
    }

    if (segment1.shape === 'rectangular' && segment2.shape === 'rectangular') {
      const width1 = segment1.width || 0;
      const height1 = segment1.height || 0;
      const width2 = segment2.width || 0;
      const height2 = segment2.height || 0;

      return Math.abs(width1 - width2) > 0.5 || Math.abs(height1 - height2) > 0.5;
    }

    return false;
  }

  /**
   * Analyze if two segments need an elbow fitting
   */
  static needsElbow(segment1: DuctSegment, segment2: DuctSegment): boolean {
    const dir1 = new Vector3().subVectors(segment1.end, segment1.start).normalize();
    const dir2 = new Vector3().subVectors(segment2.end, segment2.start).normalize();

    // Calculate angle between directions
    const angle = Math.acos(Math.max(-1, Math.min(1, dir1.dot(dir2))));
    const angleDeg = angle * 180 / Math.PI;

    // Need elbow if not straight (allow 5° tolerance)
    return angleDeg > 5 && angleDeg < 175;
  }

  /**
   * Calculate the angle between two segments
   */
  static calculateAngle(segment1: DuctSegment, segment2: DuctSegment): number {
    const dir1 = new Vector3().subVectors(segment1.end, segment1.start).normalize();
    const dir2 = new Vector3().subVectors(segment2.end, segment2.start).normalize();

    return Math.acos(Math.max(-1, Math.min(1, dir1.dot(dir2))));
  }
}

// Fitting Generation Utilities
class FittingGenerator {
  /**
   * Generate transition fitting between two segments
   */
  static generateTransition(
    segment1: DuctSegment,
    segment2: DuctSegment,
    connectionPoint: Vector3
  ): TransitionFitting {
    // Determine transition type
    let transitionType: TransitionFitting['transitionType'];
    if (segment1.shape === 'rectangular' && segment2.shape === 'rectangular') {
      transitionType = 'rect-to-rect';
    } else if (segment1.shape === 'round' && segment2.shape === 'round') {
      transitionType = 'round-to-round';
    } else if (segment1.shape === 'rectangular' && segment2.shape === 'round') {
      transitionType = 'rect-to-round';
    } else {
      transitionType = 'round-to-rect';
    }

    // Calculate size difference for transition length
    const sizeDiff = this.calculateSizeDifference(segment1, segment2);
    const length = SMACNAStandards.calculateTransitionLength(sizeDiff);

    // Calculate position and rotation
    const direction = new Vector3().subVectors(segment2.start, segment1.end).normalize();
    const position = new Vector3().addVectors(connectionPoint, direction.clone().multiplyScalar(length / 2));
    const rotation = new Euler().setFromQuaternion(
      new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction)
    );

    return {
      id: `transition-${Date.now()}`,
      type: 'transition',
      transitionType,
      position,
      rotation,
      length,
      slopeRatio: SMACNAStandards.TRANSITION_SLOPE_RATIO,
      material: segment1.material,
      inlet: this.createConnectionPoint(segment1, connectionPoint, direction.clone().negate()),
      outlet: this.createConnectionPoint(segment2, connectionPoint, direction)
    };
  }

  /**
   * Generate elbow fitting between two segments
   */
  static generateElbow(
    segment1: DuctSegment,
    segment2: DuctSegment,
    connectionPoint: Vector3
  ): ElbowFitting {
    const angle = ConnectivityAnalyzer.calculateAngle(segment1, segment2);
    const snappedAngle = SMACNAStandards.snapAngle(angle);

    // Use the larger duct size for elbow sizing
    const elbowSize = this.getLargerDuctSize(segment1, segment2);
    const centerlineRadius = SMACNAStandards.calculateElbowRadius(segment1.shape, elbowSize);

    // Calculate elbow position and rotation
    const dir1 = new Vector3().subVectors(segment1.end, segment1.start).normalize();
    const dir2 = new Vector3().subVectors(segment2.end, segment2.start).normalize();
    const bisector = new Vector3().addVectors(dir1, dir2).normalize();

    const rotation = new Euler().setFromQuaternion(
      new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), bisector)
    );

    let elbowType: ElbowFitting['elbowType'];
    if (segment1.shape === 'rectangular' && segment2.shape === 'round') {
      elbowType = 'rect-to-round';
    } else if (segment1.shape === 'round' && segment2.shape === 'rectangular') {
      elbowType = 'round-to-rect';
    } else if (segment1.shape === 'round') {
      elbowType = 'round';
    } else {
      elbowType = 'rectangular';
    }

    return {
      id: `elbow-${Date.now()}`,
      type: 'elbow',
      elbowType,
      angle: snappedAngle,
      centerlineRadius,
      position: connectionPoint,
      rotation,
      material: segment1.material,
      inlet: this.createConnectionPoint(segment1, connectionPoint, dir1.clone().negate()),
      outlet: this.createConnectionPoint(segment2, connectionPoint, dir2)
    };
  }

  /**
   * Calculate size difference between two segments
   */
  private static calculateSizeDifference(segment1: DuctSegment, segment2: DuctSegment): number {
    if (segment1.shape === 'round' && segment2.shape === 'round') {
      return Math.abs((segment1.diameter || 0) - (segment2.diameter || 0));
    }

    if (segment1.shape === 'rectangular' && segment2.shape === 'rectangular') {
      const area1 = (segment1.width || 0) * (segment1.height || 0);
      const area2 = (segment2.width || 0) * (segment2.height || 0);
      return Math.abs(Math.sqrt(area1) - Math.sqrt(area2));
    }

    // For mixed shapes, use equivalent diameter
    const equiv1 = this.getEquivalentDiameter(segment1);
    const equiv2 = this.getEquivalentDiameter(segment2);
    return Math.abs(equiv1 - equiv2);
  }

  /**
   * Get equivalent diameter for any duct shape
   */
  private static getEquivalentDiameter(segment: DuctSegment): number {
    if (segment.shape === 'round') {
      return segment.diameter || 0;
    } else {
      // Equivalent diameter for rectangular: 4*Area/Perimeter
      const width = segment.width || 0;
      const height = segment.height || 0;
      return (4 * width * height) / (2 * (width + height));
    }
  }

  /**
   * Get the larger duct size for elbow sizing
   */
  private static getLargerDuctSize(segment1: DuctSegment, segment2: DuctSegment): number {
    const size1 = this.getEquivalentDiameter(segment1);
    const size2 = this.getEquivalentDiameter(segment2);
    return Math.max(size1, size2);
  }

  /**
   * Create connection point for fitting
   */
  private static createConnectionPoint(
    segment: DuctSegment,
    position: Vector3,
    direction: Vector3
  ): ConnectionPoint {
    return {
      position,
      direction,
      shape: segment.shape,
      width: segment.width,
      height: segment.height,
      diameter: segment.diameter
    };
  }
}

// Enhanced 3D Transition Fitting Component with Proper Dimension Handling
const TransitionMesh: React.FC<{
  fitting: TransitionFitting;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ fitting, isSelected, onSelect }) => {
  const meshRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  // Enhanced dimension validation and calculation
  const validateAndGetDimensions = () => {
    // Log inlet and outlet dimensions for debugging
    console.log('TransitionMesh - Inlet dimensions:', {
      shape: fitting.inlet.shape,
      width: fitting.inlet.width,
      height: fitting.inlet.height,
      diameter: fitting.inlet.diameter
    });
    console.log('TransitionMesh - Outlet dimensions:', {
      shape: fitting.outlet.shape,
      width: fitting.outlet.width,
      height: fitting.outlet.height,
      diameter: fitting.outlet.diameter
    });

    // Validate inlet dimensions
    let inletSize: number;
    let inletWidth: number;
    let inletHeight: number;

    if (fitting.inlet.shape === 'round') {
      if (!fitting.inlet.diameter) {
        console.warn('TransitionMesh - Missing inlet diameter for round duct, using default 12');
        inletSize = 12;
      } else {
        inletSize = fitting.inlet.diameter;
      }
      inletWidth = inletSize;
      inletHeight = inletSize;
    } else {
      if (!fitting.inlet.width || !fitting.inlet.height) {
        console.warn('TransitionMesh - Missing inlet width/height for rectangular duct, using defaults');
        inletWidth = fitting.inlet.width || 12;
        inletHeight = fitting.inlet.height || 8;
      } else {
        inletWidth = fitting.inlet.width;
        inletHeight = fitting.inlet.height;
      }
      inletSize = Math.max(inletWidth, inletHeight);
    }

    // Validate outlet dimensions
    let outletSize: number;
    let outletWidth: number;
    let outletHeight: number;

    if (fitting.outlet.shape === 'round') {
      if (!fitting.outlet.diameter) {
        console.warn('TransitionMesh - Missing outlet diameter for round duct, using default 12');
        outletSize = 12;
      } else {
        outletSize = fitting.outlet.diameter;
      }
      outletWidth = outletSize;
      outletHeight = outletSize;
    } else {
      if (!fitting.outlet.width || !fitting.outlet.height) {
        console.warn('TransitionMesh - Missing outlet width/height for rectangular duct, using defaults');
        outletWidth = fitting.outlet.width || 12;
        outletHeight = fitting.outlet.height || 8;
      } else {
        outletWidth = fitting.outlet.width;
        outletHeight = fitting.outlet.height;
      }
      outletSize = Math.max(outletWidth, outletHeight);
    }

    console.log('TransitionMesh - Calculated dimensions:', {
      inletSize, inletWidth, inletHeight,
      outletSize, outletWidth, outletHeight
    });

    return {
      inletSize, inletWidth, inletHeight,
      outletSize, outletWidth, outletHeight
    };
  };

  const dimensions = validateAndGetDimensions();

  const getColor = () => {
    if (isSelected) return '#3b82f6'; // Blue when selected
    if (hovered) return '#6366f1'; // Indigo when hovered
    return '#595959'; // Match duct color for visual consistency
  };

  return (
    <mesh
      ref={meshRef}
      position={fitting.position}
      rotation={fitting.rotation}
      onClick={onSelect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Enhanced transition geometry using validated dimensions */}
      {fitting.inlet.shape === 'round' && fitting.outlet.shape === 'round' ? (
        // Round to round transition - tapered cylinder with actual dimensions
        <cylinderGeometry args={[dimensions.outletSize / 2, dimensions.inletSize / 2, fitting.length, 16]} />
      ) : fitting.inlet.shape === 'rectangular' && fitting.outlet.shape === 'rectangular' ? (
        // Rectangular to rectangular transition - use box geometry with actual dimensions
        <boxGeometry args={[
          (dimensions.inletWidth + dimensions.outletWidth) / 2,
          (dimensions.inletHeight + dimensions.outletHeight) / 2,
          fitting.length
        ]} />
      ) : (
        // Mixed transitions - use cylinder with validated average dimensions
        <cylinderGeometry args={[dimensions.outletSize / 2, dimensions.inletSize / 2, fitting.length, 16]} />
      )}
      <meshStandardMaterial
        color={getColor()}
        transparent={false}
        opacity={1.0}
        wireframe={isSelected}
        metalness={0.2}
        roughness={0.7}
      />

      {/* Fitting label */}
      {(isSelected || hovered) && (
        <Text
          position={[0, 0, fitting.length / 2 + 0.5]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${fitting.transitionType.toUpperCase()}`}
        </Text>
      )}
    </mesh>
  );
};

// Enhanced 3D Elbow Fitting Component with Proper Dimension Handling
const ElbowMesh: React.FC<{
  fitting: ElbowFitting;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ fitting, isSelected, onSelect }) => {
  const meshRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  const createRectRoundElbowGeometry = (
    width: number,
    height: number,
    diameter: number,
    radius: number,
    angle: number
  ) => {
    const radialSegments = 8;
    const tubularSegments = 16;
    const angleRad = (angle * Math.PI) / 180;
    const positions: number[] = [];
    const indices: number[] = [];

    const rectRadius = (phi: number) =>
      1 /
      (Math.abs(Math.cos(phi)) / (width / 2) +
        Math.abs(Math.sin(phi)) / (height / 2));

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const theta = angleRad * t;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const cx = radius * cosT;
      const cy = radius * sinT;
      for (let j = 0; j <= radialSegments; j++) {
        const phi = (j / radialSegments) * Math.PI * 2;
        const r0 = rectRadius(phi);
        const r1 = diameter / 2;
        const r = r0 * (1 - t) + r1 * t;
        const x = r * Math.cos(phi);
        const y = r * Math.sin(phi);
        const px = cx + x * cosT;
        const py = cy + x * sinT;
        const pz = y;
        positions.push(px, py, pz);
      }
    }

    const segCount = radialSegments + 1;
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * segCount + j;
        const b = a + segCount;
        const c = b + 1;
        const d = a + 1;
        indices.push(a, b, d, b, c, d);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

  // Enhanced dimension validation and calculation for elbow - simplified approach
  let ductSize: number = 12;
  let ductWidth: number = 12;
  let ductHeight: number = 12;

  if (fitting.inlet.shape === 'rectangular' || fitting.outlet.shape === 'rectangular') {
    const rect = fitting.inlet.shape === 'rectangular' ? fitting.inlet : fitting.outlet;
    ductWidth = rect.width || 12;
    ductHeight = rect.height || 8;
  }

  if (fitting.inlet.shape === 'round' || fitting.outlet.shape === 'round') {
    const round = fitting.inlet.shape === 'round' ? fitting.inlet : fitting.outlet;
    ductSize = round.diameter || 12;
    if (fitting.inlet.shape !== 'rectangular' && fitting.outlet.shape !== 'rectangular') {
      ductWidth = ductSize;
      ductHeight = ductSize;
    }
  }

  ductSize = Math.max(ductSize, ductWidth, ductHeight);

  const elbowDimensions = { ductSize, ductWidth, ductHeight };

  const getColor = () => {
    if (isSelected) return '#3b82f6'; // Blue when selected
    if (hovered) return '#6366f1'; // Indigo when hovered
    return '#595959'; // Match duct color for visual consistency
  };

  return (
    <mesh
      ref={meshRef}
      position={fitting.position}
      rotation={fitting.rotation}
      onClick={onSelect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Enhanced elbow geometry using validated dimensions */}
      {fitting.inlet.shape === 'round' && fitting.outlet.shape === 'round' ? (
        // Round elbow - torus segment with actual diameter
        <torusGeometry
          args={[
            fitting.centerlineRadius,
            elbowDimensions.ductSize / 2,
            8,
            16,
            (fitting.angle * Math.PI) / 180,
          ]}
        />
      ) : fitting.inlet.shape === 'rectangular' &&
        fitting.outlet.shape === 'rectangular' ? (
        // Rectangular elbow - box geometry with actual width and height
        <boxGeometry
          args={[
            elbowDimensions.ductWidth,
            elbowDimensions.ductHeight,
            fitting.centerlineRadius * 0.5,
          ]}
        />
      ) : (
        // Rect-to-round elbow using custom lofted geometry
        <primitive
          object={useMemo(
            () =>
              createRectRoundElbowGeometry(
                elbowDimensions.ductWidth,
                elbowDimensions.ductHeight,
                fitting.outlet.diameter || elbowDimensions.ductSize,
                fitting.centerlineRadius,
                fitting.angle,
              ),
            [
              elbowDimensions.ductWidth,
              elbowDimensions.ductHeight,
              fitting.outlet.diameter,
              fitting.centerlineRadius,
              fitting.angle,
            ],
          )}
          attach="geometry"
        />
      )}
      <meshStandardMaterial
        color={getColor()}
        transparent={false}
        opacity={1.0}
        wireframe={isSelected}
        metalness={0.2}
        roughness={0.7}
      />

      {/* Fitting label */}
      {(isSelected || hovered) && (
        <Text
          position={[0, 0, ductSize / 2 + 0.5]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${fitting.angle}° ELBOW`}
        </Text>
      )}
    </mesh>
  );
};

// Connection Point Visual Indicator Component
const ConnectionPointIndicator: React.FC<{
  connectionPoint: ConnectionPoint;
  isVisible?: boolean;
  onConnectionPointClick?: (connectionPoint: ConnectionPoint) => void;
}> = ({ connectionPoint, isVisible = true, onConnectionPointClick }) => {
  const [hovered, setHovered] = useState(false);

  if (!isVisible) return null;

  const getIndicatorColor = () => {
    switch (connectionPoint.status) {
      case 'available':
        return hovered ? '#10b981' : '#059669'; // Green for available
      case 'connected':
        return '#3b82f6'; // Blue for connected
      case 'blocked':
        return '#ef4444'; // Red for blocked
      default:
        return '#6b7280'; // Gray for unknown
    }
  };

  const getIndicatorSize = () => {
    if (connectionPoint.shape === 'round') {
      const diameter = connectionPoint.diameter || 12;
      return diameter * 0.1; // Scale indicator to 10% of duct size
    } else {
      const avgSize = ((connectionPoint.width || 12) + (connectionPoint.height || 8)) / 2;
      return avgSize * 0.1;
    }
  };

  return (
    <mesh
      position={connectionPoint.position}
      onClick={() => onConnectionPointClick?.(connectionPoint)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Connection point indicator sphere */}
      <sphereGeometry args={[getIndicatorSize(), 8, 8]} />
      <meshStandardMaterial
        color={getIndicatorColor()}
        transparent={true}
        opacity={0.8}
        emissive={getIndicatorColor()}
        emissiveIntensity={hovered ? 0.3 : 0.1}
      />

      {/* Direction indicator arrow */}
      <mesh position={[0, 0, getIndicatorSize() * 1.5]}>
        <coneGeometry args={[getIndicatorSize() * 0.5, getIndicatorSize() * 2, 8]} />
        <meshStandardMaterial
          color={getIndicatorColor()}
          transparent={true}
          opacity={0.6}
        />
      </mesh>

      {/* Connection point label */}
      {hovered && (
        <Text
          position={[0, getIndicatorSize() * 3, 0]}
          fontSize={getIndicatorSize() * 2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${connectionPoint.shape} - ${connectionPoint.status}`}
        </Text>
      )}
    </mesh>
  );
};

// 3D Duct Component
const DuctMesh: React.FC<{
  segment: DuctSegment;
  isSelected?: boolean;
  onSelect?: () => void;
  onElementSelect?: (elementId: string, position: { x: number; y: number }) => void;
}> = ({ segment, isSelected, onSelect, onElementSelect }) => {
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

  // Professional color scheme for HVAC design
  const getColor = () => {
    if (isSelected) return '#3b82f6'; // Blue when selected
    if (hovered) return '#6366f1'; // Indigo when hovered
    return '#595959'; // Professional darker grey for all ducts
  };

  // Convert inches to scene units (assuming 1 scene unit = 12 inches)
  // Handle undefined values for round vs rectangular ducts
  const sceneWidth = segment.width ? segment.width / 12 : 0;
  const sceneHeight = segment.height ? segment.height / 12 : 0;
  const sceneDiameter = segment.diameter ? segment.diameter / 12 : 0;

  // Calculate label position based on shape
  const labelPosition: [number, number, number] = segment.shape === 'round'
    ? [0, sceneDiameter / 2 + 0.5, 0]
    : [0, sceneHeight / 2 + 0.5, 0];

  // Create label text based on shape with safe handling of undefined values
  const labelText = segment.shape === 'round'
    ? `Ø${segment.diameter || 12}"`
    : `${segment.width || 12}" x ${segment.height || 8}"`;

  // For round ducts, we need to rotate the cylinder to align with the direction
  const cylinderRotation = React.useMemo(() => {
    if (segment.shape === 'round' && length > 0) {
      // Cylinder default orientation is along Y-axis, we need to align with our direction
      const normalizedDirection = direction.clone().normalize();

      // Calculate rotation to align cylinder with direction vector
      const yRotation = Math.atan2(normalizedDirection.x, normalizedDirection.z);
      const xRotation = -Math.asin(normalizedDirection.y) + Math.PI / 2; // Add 90 degrees to align with direction

      return [xRotation, yRotation, 0] as [number, number, number];
    }
    return rotation;
  }, [segment.shape, direction, length, rotation]);

  return (
    <mesh
      ref={meshRef}
      position={center}
      rotation={segment.shape === 'round' ? cylinderRotation : rotation}
      onClick={(event) => {
        onSelect?.();
        if (onElementSelect) {
          onElementSelect(segment.id, { x: event.clientX, y: event.clientY });
        }
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Geometry based on duct shape */}
      {segment.shape === 'round' ? (
        <cylinderGeometry args={[sceneDiameter / 2, sceneDiameter / 2, length, 16]} />
      ) : (
        <boxGeometry args={[sceneWidth, sceneHeight, length]} />
      )}
      <meshStandardMaterial
        color={getColor()}
        transparent={false}
        opacity={1.0}
        wireframe={isSelected}
        metalness={0.1}
        roughness={0.8}
      />

      {/* Duct label */}
      {(isSelected || hovered) && (
        <Text
          position={labelPosition}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {labelText}
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

// Equipment Mesh Component
const EquipmentMesh: React.FC<{
  equipment: Equipment;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ equipment, isSelected, onSelect }) => {
  const meshRef = useRef<any>();
  const [hovered, setHovered] = useState(false);

  // Professional color scheme for HVAC equipment
  const getColor = () => {
    if (isSelected) return '#3b82f6'; // Blue when selected
    if (hovered) return '#6366f1'; // Indigo when hovered
    return '#404040'; // Much darker grey to distinguish from ducts
  };

  const labelText = `${equipment.type} - ${equipment.properties.cfmCapacity} CFM`;

  return (
    <mesh
      ref={meshRef}
      position={equipment.position}
      rotation={equipment.rotation}
      onClick={onSelect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Equipment geometry - rectangular box */}
      <boxGeometry args={[equipment.dimensions.width, equipment.dimensions.height, equipment.dimensions.depth]} />
      <meshStandardMaterial
        color={getColor()}
        transparent={false}
        opacity={1.0}
        wireframe={isSelected}
        metalness={0.3}
        roughness={0.6}
      />

      {/* Equipment label */}
      {(isSelected || hovered) && (
        <Text
          position={[0, equipment.dimensions.height / 2 + 0.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {labelText}
        </Text>
      )}
    </mesh>
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
  ductProperties?: DuctProperties;
  onFittingAdd?: (fitting: DuctFitting) => void;
  fittings?: DuctFitting[];
  onEquipmentAdd?: (equipment: Equipment) => void;
  equipment?: Equipment[];
  onEquipmentPlace?: (position: { x: number; y: number; z: number }) => void;
}> = ({ segments, selectedSegmentId, onSegmentSelect, showGrid, activeTool, onSegmentAdd, onElementSelect, onCameraReady, ductProperties, onFittingAdd, fittings = [], onEquipmentAdd, equipment = [], onEquipmentPlace }) => {
  const { camera, raycaster, scene } = useThree();
  const { grid } = useUIStore();

  // State for selected fitting and equipment
  const [selectedFittingId, setSelectedFittingId] = useState<string>();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>();
  const [showConnectionPoints, setShowConnectionPoints] = useState<boolean>(false);

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

            // Create segment with proper properties based on shape
            const isRound = ductProperties?.shape === 'round';

            // Generate auto-incremented duct ID based on existing segments
            // Find the highest existing duct number to ensure uniqueness
            const existingDuctNumbers = segments
              .map(seg => seg.id)
              .filter(id => id.startsWith('Duct-'))
              .map(id => parseInt(id.replace('Duct-', ''), 10))
              .filter(num => !isNaN(num));

            const nextDuctNumber = existingDuctNumbers.length > 0
              ? Math.max(...existingDuctNumbers) + 1
              : 1;

            const autoGeneratedId = `Duct-${nextDuctNumber.toString().padStart(3, '0')}`;

            const newSegment: DuctSegment = {
              id: autoGeneratedId,
              start: segmentStart,
              end: segmentEnd,
              // For round ducts, use diameter; for rectangular, use width/height
              width: isRound ? undefined : (ductProperties?.width || 12),
              height: isRound ? undefined : (ductProperties?.height || 8),
              diameter: isRound ? (ductProperties?.diameter || 12) : undefined,
              shape: ductProperties?.shape || 'rectangular',
              type: 'supply',
              material: ductProperties?.material || 'Galvanized Steel'
            };

            // Enhanced: Automatically add connection points to new segment
            const connectionPoints = ConnectionPointUtils.createDuctConnectionPoints(newSegment);
            const enhancedSegment: DuctSegment = {
              ...newSegment,
              inlet: connectionPoints.inlet,
              outlet: connectionPoints.outlet
            };

            console.log('Creating new segment with connection points:', enhancedSegment);
            console.log('Segment dimensions:', {
              width: enhancedSegment.width,
              height: enhancedSegment.height,
              diameter: enhancedSegment.diameter,
              shape: enhancedSegment.shape
            });
            onSegmentAdd(enhancedSegment);

            // Analyze connectivity and generate fittings if needed
            if (segments.length > 0 && onFittingAdd) {
              const lastSegment = segments[segments.length - 1];

              // Check if we need a transition fitting
              if (ConnectivityAnalyzer.needsTransition(lastSegment, newSegment)) {
                const transition = FittingGenerator.generateTransition(
                  lastSegment,
                  newSegment,
                  segmentStart
                );
                console.log('Generated transition fitting:', transition);
                onFittingAdd(transition);
              }

              // Check if we need an elbow fitting
              if (ConnectivityAnalyzer.needsElbow(lastSegment, newSegment)) {
                const elbow = FittingGenerator.generateElbow(
                  lastSegment,
                  newSegment,
                  segmentStart
                );
                console.log('Generated elbow fitting:', elbow);
                onFittingAdd(elbow);
              }
            }

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

    // Handle equipment placement - only when not in line drawing mode
    if (activeTool === 'select' && onEquipmentPlace) {
      let clickPoint = event.point ? event.point.clone() : new Vector3(0, 0, 0);

      // Ensure the point is on the ground plane (y=0)
      clickPoint.y = 0;

      // Apply grid snapping
      clickPoint = snapToGrid(clickPoint);

      console.log('Equipment placement at:', clickPoint);
      onEquipmentPlace({ x: clickPoint.x, y: clickPoint.y, z: clickPoint.z });
    }
  }, [activeTool, drawingState, onSegmentAdd, onEquipmentPlace, snapToGrid]);

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
          onElementSelect={onElementSelect}
        />
      ))}

      {/* Duct Fittings */}
      {fittings.map((fitting) => {
        if (fitting.type === 'transition') {
          return (
            <TransitionMesh
              key={fitting.id}
              fitting={fitting as TransitionFitting}
              isSelected={selectedFittingId === fitting.id}
              onSelect={() => setSelectedFittingId(fitting.id)}
            />
          );
        } else if (fitting.type === 'elbow') {
          return (
            <ElbowMesh
              key={fitting.id}
              fitting={fitting as ElbowFitting}
              isSelected={selectedFittingId === fitting.id}
              onSelect={() => setSelectedFittingId(fitting.id)}
            />
          );
        }
        return null;
      })}

      {/* Equipment */}
      {equipment.map((equip) => (
        <EquipmentMesh
          key={equip.id}
          equipment={equip}
          isSelected={selectedEquipmentId === equip.id}
          onSelect={() => setSelectedEquipmentId(equip.id)}
        />
      ))}

      {/* Connection Point Indicators */}
      {/* Render connection points for duct segments */}
      {segments.map((segment) => (
        <React.Fragment key={`${segment.id}-connections`}>
          {segment.inlet && (
            <ConnectionPointIndicator
              key={`${segment.id}-inlet`}
              connectionPoint={segment.inlet}
              isVisible={selectedSegmentId === segment.id || showConnectionPoints}
              onConnectionPointClick={(cp) => console.log('Connection point clicked:', cp)}
            />
          )}
          {segment.outlet && (
            <ConnectionPointIndicator
              key={`${segment.id}-outlet`}
              connectionPoint={segment.outlet}
              isVisible={selectedSegmentId === segment.id || showConnectionPoints}
              onConnectionPointClick={(cp) => console.log('Connection point clicked:', cp)}
            />
          )}
        </React.Fragment>
      ))}

      {/* Render connection points for equipment */}
      {equipment.map((equip) => (
        <React.Fragment key={`${equip.id}-connections`}>
          {equip.connectionPoints?.map((connectionPoint) => (
            <ConnectionPointIndicator
              key={connectionPoint.id}
              connectionPoint={connectionPoint}
              isVisible={selectedEquipmentId === equip.id || showConnectionPoints}
              onConnectionPointClick={(cp) => console.log('Equipment connection point clicked:', cp)}
            />
          ))}
        </React.Fragment>
      ))}

      {/* Render connection points for fittings */}
      {fittings.map((fitting) => (
        <React.Fragment key={`${fitting.id}-connections`}>
          <ConnectionPointIndicator
            key={`${fitting.id}-inlet`}
            connectionPoint={fitting.inlet}
            isVisible={selectedFittingId === fitting.id || showConnectionPoints}
            onConnectionPointClick={(cp) => console.log('Fitting inlet clicked:', cp)}
          />
          <ConnectionPointIndicator
            key={`${fitting.id}-outlet`}
            connectionPoint={fitting.outlet}
            isVisible={selectedFittingId === fitting.id || showConnectionPoints}
            onConnectionPointClick={(cp) => console.log('Fitting outlet clicked:', cp)}
          />
        </React.Fragment>
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
  ductProperties,
  onFittingAdd,
  fittings = [],
  onEquipmentAdd,
  equipment = [],
  onEquipmentPlace,
}) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>();
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [showGizmo, setShowGizmo] = useState(initialShowGizmo);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Internal fitting state if no external fitting management is provided
  const [internalFittings, setInternalFittings] = useState<DuctFitting[]>([]);
  const effectiveFittings = fittings.length > 0 ? fittings : internalFittings;
  const effectiveOnFittingAdd = onFittingAdd || ((fitting: DuctFitting) => {
    setInternalFittings(prev => [...prev, fitting]);
  });

  // Internal equipment state if no external equipment management is provided
  const [internalEquipment, setInternalEquipment] = useState<Equipment[]>([]);
  const effectiveEquipment = equipment.length > 0 ? equipment : internalEquipment;
  const effectiveOnEquipmentAdd = onEquipmentAdd || ((equip: Equipment) => {
    setInternalEquipment(prev => [...prev, equip]);
  });

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
            ductProperties={ductProperties}
            onFittingAdd={effectiveOnFittingAdd}
            fittings={effectiveFittings}
            onEquipmentAdd={effectiveOnEquipmentAdd}
            equipment={effectiveEquipment}
            onEquipmentPlace={onEquipmentPlace}
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
            <span>Equipment: {effectiveEquipment.length}</span>
            {selectedSegmentId && <span>Selected: {selectedSegmentId}</span>}
            <span>Grid: {showGrid ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
