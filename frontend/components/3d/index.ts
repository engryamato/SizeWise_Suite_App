/**
 * 3D Components Export Index
 * SizeWise Suite - Comprehensive Refactoring
 * 
 * Centralized exports for all 3D drawing system components
 */

// Main Canvas3D Component
export { Canvas3D } from './Canvas3D';

// Core Components
export { Canvas3DCore } from './core/Canvas3DCore';
export { Canvas3DControls } from './core/Canvas3DControls';
export { Canvas3DPerformance, PerformanceUtils } from './core/Canvas3DPerformance';

// Drawing Components
export { ConnectionPoints, findNearestConnectionPoint, snapToConnectionPoint } from './drawing/ConnectionPoints';
export { DrawingPreview } from './drawing/DrawingPreview';

// Duct Components
export { DuctRenderer, DuctRendererUtils } from './duct/DuctRenderer';
export { DuctGeometry } from './duct/DuctGeometry';

// Geometry Components
export { ElbowGeometry } from './geometry/ElbowGeometry';
export { TransitionGeometry } from './geometry/TransitionGeometry';

// Utility Components
export { ConnectionPointUtils } from './utils/ConnectionPointUtils';
export { ConnectionValidator } from './utils/ConnectionValidator';
export { SMACNAStandards } from './utils/SMACNAStandards';

// Validation Components
export { SystemValidationOverlay } from './validation/SystemValidationOverlay';

// Type Definitions
export type {
  Canvas3DProps,
  DuctSegment,
  Equipment,
  DuctFitting,
  ConnectionPoint,
  MaterialConfig,
  PerformanceConfig,
  GridConfig,
  EnvironmentConfig,
  LightingConfig,
  SelectionState,
  FlowProperties,
  ConnectionRelationships,
  CalculationState,
  TransitionFitting,
  ElbowFitting,
  ConnectionValidationResult,
  DuctShape
} from './types/Canvas3DTypes';

// Specialized Components
export { FittingSelector } from './FittingSelector';
export { FittingViewer } from './FittingViewer';
export { default as Optimized3DModel, HVAC3DModel } from './Optimized3DModel';
export type { Optimized3DModelProps, HVAC3DModelProps } from './Optimized3DModel';
