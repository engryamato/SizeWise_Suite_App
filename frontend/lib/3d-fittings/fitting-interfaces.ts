/**
 * Parametric 3D Fitting Interfaces
 * Type definitions for all duct fitting generators
 */

import { MaterialType, GaugeType } from './smacna-gauge-tables';

/**
 * Base parameters for all fittings
 */
export interface BaseFittingParams {
  material: MaterialType;
  gauge: GaugeType;
  radialSegments?: number;
  tubularSegments?: number;
}

/**
 * Elbow fitting parameters
 */
export interface ElbowParams extends BaseFittingParams {
  diameter: number;        // Duct diameter in inches
  bendRadius: number;      // Bend radius in inches
  angle: number;          // Bend angle in degrees (0-180)
}

/**
 * Transition/Reducer fitting parameters
 */
export interface TransitionParams extends BaseFittingParams {
  inletDiameter: number;   // Inlet diameter in inches
  outletDiameter: number;  // Outlet diameter in inches
  length: number;          // Transition length in inches
  type?: 'concentric' | 'eccentric'; // Transition type
}

/**
 * Wye fitting parameters
 */
export interface WyeParams extends BaseFittingParams {
  mainDiameter: number;    // Main duct diameter in inches
  branchDiameter: number;  // Branch duct diameter in inches
  angle: number;           // Branch angle in degrees (15-90)
  mainLength?: number;     // Main duct length in inches
  branchLength?: number;   // Branch duct length in inches
}

/**
 * Tee fitting parameters
 */
export interface TeeParams extends BaseFittingParams {
  mainDiameter: number;    // Main duct diameter in inches
  branchDiameter: number;  // Branch duct diameter in inches
  mainLength?: number;     // Main duct length in inches
  branchLength?: number;   // Branch duct length in inches
}

/**
 * Straight duct parameters
 */
export interface StraightDuctParams extends BaseFittingParams {
  diameter: number;        // Duct diameter in inches
  length: number;          // Duct length in inches
}

/**
 * Cap/End fitting parameters
 */
export interface CapParams extends BaseFittingParams {
  diameter: number;        // Duct diameter in inches
  type?: 'flat' | 'rounded'; // Cap type
}

/**
 * Fitting types enumeration
 */
export enum FittingType {
  ELBOW = 'elbow',
  TRANSITION = 'transition',
  REDUCER = 'reducer',
  WYE = 'wye',
  TEE = 'tee',
  STRAIGHT = 'straight',
  CAP = 'cap'
}

/**
 * Union type for all fitting parameters
 */
export type FittingParams = 
  | ElbowParams 
  | TransitionParams 
  | WyeParams 
  | TeeParams 
  | StraightDuctParams 
  | CapParams;

/**
 * Fitting generation result
 */
export interface FittingResult {
  mesh: any; // THREE.Mesh
  type: FittingType;
  parameters: FittingParams;
  volume: number;          // Internal volume in cubic inches
  surfaceArea: number;     // External surface area in square inches
  weight: number;          // Estimated weight in pounds
  materialUsage: number;   // Material usage in square feet
}

/**
 * Validation result for fitting parameters
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations?: {
    gauge?: GaugeType;
    material?: MaterialType;
    dimensions?: string[];
  };
}

/**
 * SMACNA compliance check result
 */
export interface ComplianceResult {
  isCompliant: boolean;
  standard: string;
  violations: string[];
  recommendations: string[];
}

/**
 * Fitting generator interface
 */
export interface FittingGenerator<T extends FittingParams> {
  generate(params: T): Promise<FittingResult>;
  validate(params: T): ValidationResult;
  checkCompliance(params: T): ComplianceResult;
  estimateCost(params: T): number;
}

/**
 * 3D mesh generation options
 */
export interface MeshGenerationOptions {
  highQuality?: boolean;   // Use high-quality mesh generation
  optimize?: boolean;      // Optimize mesh for performance
  generateUVs?: boolean;   // Generate UV coordinates for texturing
  mergeVertices?: boolean; // Merge duplicate vertices
  computeNormals?: boolean; // Compute vertex normals
}

/**
 * Material appearance options
 */
export interface MaterialAppearance {
  color: number;
  metalness: number;
  roughness: number;
  emissive?: number;
  opacity?: number;
  transparent?: boolean;
}

/**
 * Fitting library configuration
 */
export interface FittingLibraryConfig {
  defaultMaterial: MaterialType;
  defaultGauge: GaugeType;
  defaultSegments: {
    radial: number;
    tubular: number;
  };
  meshOptions: MeshGenerationOptions;
  enableValidation: boolean;
  enableCompliance: boolean;
}

/**
 * Standard fitting sizes (common diameters in inches)
 */
export const STANDARD_DUCT_SIZES = [
  4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36,
  38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72,
  74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106,
  108, 110, 112, 114, 116, 118, 120
] as const;

/**
 * Standard elbow angles (degrees)
 */
export const STANDARD_ELBOW_ANGLES = [15, 30, 45, 60, 90, 120, 135, 180] as const;

/**
 * Standard wye/tee angles (degrees)
 */
export const STANDARD_BRANCH_ANGLES = [15, 30, 45, 60, 90] as const;

export type StandardDuctSize = typeof STANDARD_DUCT_SIZES[number];
export type StandardElbowAngle = typeof STANDARD_ELBOW_ANGLES[number];
export type StandardBranchAngle = typeof STANDARD_BRANCH_ANGLES[number];
