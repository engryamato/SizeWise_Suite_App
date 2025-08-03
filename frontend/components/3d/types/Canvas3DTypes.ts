/**
 * Canvas3D Type Definitions
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Extracted type definitions from Canvas3D.tsx for better organization
 */

import { Vector3, Euler } from 'three';

// Core duct segment interface
export interface DuctSegment {
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
export interface ConnectionPoint {
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
export interface DuctFitting {
  id: string;
  type: 'transition' | 'elbow';
  position: Vector3;
  rotation: Euler;
  inlet: ConnectionPoint;
  outlet: ConnectionPoint;
  material: string;
}

// Equipment interface for HVAC components
export interface Equipment {
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
export interface TransitionFitting extends DuctFitting {
  type: 'transition';
  transitionType: 'rect-to-rect' | 'round-to-round' | 'rect-to-round' | 'round-to-rect';
  length: number; // Calculated from SMACNA 2.5:1 slope ratio
  slopeRatio: number;
}

// Elbow fitting for direction changes
export interface ElbowFitting extends DuctFitting {
  type: 'elbow';
  elbowType: 'rectangular' | 'round';
  angle: 30 | 45 | 90; // Restricted angles for snapping
  centerlineRadius: number; // Based on SMACNA guidelines
}

// Main Canvas3D component props
export interface Canvas3DProps {
  segments: DuctSegment[];
  onSegmentAdd?: (segment: DuctSegment) => void;
  onSegmentUpdate?: (id: string, segment: Partial<DuctSegment>) => void;
  onSegmentDelete?: (id: string) => void;
  className?: string;
  showGrid?: boolean;
  showGizmo?: boolean;
  enableControls?: boolean;
  performanceMode?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  onCameraChange?: (position: Vector3, target: Vector3) => void;
}

// Drawing tool types
export interface DrawingTool {
  id: string;
  label: string;
  icon: React.ComponentType;
  active: boolean;
  onClick: () => void;
}

// Camera control types
export interface CameraState {
  position: Vector3;
  target: Vector3;
  zoom: number;
}

// Performance configuration
export interface PerformanceConfig {
  enableShadows: boolean;
  enableAntialiasing: boolean;
  pixelRatio: number;
  frameloop: 'always' | 'demand' | 'never';
  powerPreference: 'default' | 'high-performance' | 'low-power';
}

// Selection state
export interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
  selectionBox: {
    start: Vector3 | null;
    end: Vector3 | null;
    active: boolean;
  };
}

// Measurement types
export interface Measurement {
  id: string;
  type: 'distance' | 'area' | 'volume';
  points: Vector3[];
  value: number;
  unit: string;
  label?: string;
}

// Grid configuration
export interface GridConfig {
  visible: boolean;
  size: number;
  divisions: number;
  colorCenterLine: string;
  colorGrid: string;
  fadeDistance: number;
  infiniteGrid: boolean;
}

// Environment settings
export interface EnvironmentConfig {
  preset: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby';
  background: boolean;
  blur: number;
  intensity: number;
}

// Lighting configuration
export interface LightingConfig {
  ambient: {
    intensity: number;
    color: string;
  };
  directional: {
    intensity: number;
    color: string;
    position: Vector3;
    castShadow: boolean;
  };
  point: {
    intensity: number;
    color: string;
    position: Vector3;
    distance: number;
    decay: number;
  };
}

// Material properties
export interface MaterialConfig {
  metalness: number;
  roughness: number;
  color: string;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
}

// Animation state
export interface AnimationState {
  isAnimating: boolean;
  duration: number;
  easing: string;
  target: {
    position?: Vector3;
    rotation?: Euler;
    scale?: Vector3;
  };
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Connection validation result
export interface ConnectionValidationResult extends ValidationResult {
  compatibilityScore: number;
  requiredFittings: DuctFitting[];
}

// SMACNA standards constants
export interface SMACNAStandards {
  TRANSITION_SLOPE_RATIO: number;
  ROUND_ELBOW_RADIUS_RATIO: number;
  RECTANGULAR_ELBOW_RADIUS_RATIO: number;
  MIN_DUCT_VELOCITY: number;
  MAX_DUCT_VELOCITY: number;
  STANDARD_GAUGES: number[];
}

// Export utility types
export type DuctShape = 'rectangular' | 'round';
export type DuctType = 'supply' | 'return' | 'exhaust';
export type FittingType = 'transition' | 'elbow';
export type EquipmentType = 'Fan' | 'AHU' | 'VAV Box' | 'Damper' | 'Filter' | 'Coil' | 'Custom';
export type ConnectionStatus = 'available' | 'connected' | 'blocked';
export type TransitionType = 'rect-to-rect' | 'round-to-round' | 'rect-to-round' | 'round-to-rect';
export type ElbowType = 'rectangular' | 'round';
export type ElbowAngle = 30 | 45 | 90;
