/**
 * Advanced Fitting Types for Phase 3 Duct Physics Implementation
 * 
 * This module defines comprehensive TypeScript interfaces for advanced HVAC fitting
 * configurations, supporting complex multi-parameter calculations, performance curves,
 * and interaction effects.
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import { FittingConfiguration, FittingLossResult } from '../FittingLossCalculator';

// ============================================================================
// Core Advanced Fitting Configuration
// ============================================================================

export interface AdvancedFittingConfiguration extends FittingConfiguration {
  // Core identification
  id: string;
  version: string;
  category: FittingCategory;
  complexity: FittingComplexity;
  
  // Performance characteristics
  performanceClass: PerformanceClass;
  flowCharacteristics: FlowCharacteristics;
  pressureLossProfile: PressureLossProfile;
  
  // Physical properties
  physicalProperties: FittingPhysicalProperties;
  installationRequirements: InstallationRequirements;
  
  // Validation and constraints
  validationRules: ValidationRule[];
  compatibilityMatrix: CompatibilityMatrix;
  
  // Metadata
  manufacturer?: string;
  model?: string;
  certifications: string[];
  lastUpdated: Date;
}

// ============================================================================
// Enumerations
// ============================================================================

export enum FittingCategory {
  TRANSITION = 'transition',
  TERMINAL = 'terminal',
  JUNCTION = 'junction',
  CONTROL = 'control',
  SPECIALTY = 'specialty'
}

export enum FittingComplexity {
  SIMPLE = 'simple',           // Single K-factor
  COMPLEX = 'complex',         // Multiple parameters
  VARIABLE = 'variable',       // Flow-dependent
  CUSTOM = 'custom'            // User-defined
}

export enum PerformanceClass {
  STANDARD = 'standard',       // Standard commercial
  HIGH_VELOCITY = 'high_velocity', // >2500 FPM
  LOW_PRESSURE = 'low_pressure',   // <2" w.g.
  INDUSTRIAL = 'industrial',   // Heavy-duty applications
  PRECISION = 'precision'      // Laboratory/cleanroom
}

export enum AdvancedFittingTypes {
  // Transitions
  TRANSITION_RECT_TO_ROUND = 'transition_rect_to_round',
  TRANSITION_ROUND_TO_RECT = 'transition_round_to_rect',
  TRANSITION_GRADUAL = 'transition_gradual',
  TRANSITION_ABRUPT = 'transition_abrupt',
  
  // Terminals
  VAV_BOX = 'vav_box',
  CAV_BOX = 'cav_box',
  DIFFUSER_LINEAR = 'diffuser_linear',
  DIFFUSER_CEILING = 'diffuser_ceiling',
  GRILLE_RETURN = 'grille_return',
  GRILLE_SUPPLY = 'grille_supply',
  
  // Controls
  FIRE_DAMPER = 'fire_damper',
  SMOKE_DAMPER = 'smoke_damper',
  VOLUME_DAMPER = 'volume_damper',
  BACKDRAFT_DAMPER = 'backdraft_damper',
  
  // Specialty
  EXHAUST_HOOD = 'exhaust_hood',
  SOUND_ATTENUATOR = 'sound_attenuator',
  HEAT_EXCHANGER = 'heat_exchanger',
  FILTER_SECTION = 'filter_section'
}

export enum FlowPattern {
  STRAIGHT_THROUGH = 'straight_through',
  BRANCH_90 = 'branch_90',
  BRANCH_45 = 'branch_45',
  CONVERGING = 'converging',
  DIVERGING = 'diverging',
  SWIRL = 'swirl'
}

export enum CalculationMethod {
  SINGLE_K_FACTOR = 'single_k_factor',
  MULTI_PARAMETER = 'multi_parameter',
  PERFORMANCE_CURVE = 'performance_curve',
  CFD_DERIVED = 'cfd_derived',
  EMPIRICAL = 'empirical'
}

// ============================================================================
// Flow Characteristics
// ============================================================================

export interface FlowCharacteristics {
  nominalFlow: FlowRange;
  operatingRange: FlowRange;
  turndownRatio: number;
  flowPattern: FlowPattern;
  velocityProfile: VelocityProfile;
  turbulenceFactors: TurbulenceFactors;
}

export interface FlowRange {
  minimum: number;    // CFM
  maximum: number;    // CFM
  optimal: number;    // CFM
  units: 'cfm' | 'l/s' | 'm3/h';
}

export interface VelocityProfile {
  uniformityIndex: number;     // 0-1, where 1 is perfectly uniform
  peakVelocityRatio: number;   // Peak velocity / Average velocity
  boundaryLayerThickness: number; // inches
  flowSeparationRisk: 'low' | 'medium' | 'high';
}

export interface TurbulenceFactors {
  turbulenceIntensity: number; // %
  mixingFactor: number;        // 0-1
  pressureRecoveryFactor: number; // 0-1
  downstreamDevelopmentLength: number; // diameters
}

// ============================================================================
// Pressure Loss Profile
// ============================================================================

export interface PressureLossProfile {
  calculationMethod: CalculationMethod;
  kFactorData: KFactorData;
  performanceCurves?: PerformanceCurve[];
  correctionFactors: CorrectionFactors;
  uncertaintyBounds: UncertaintyBounds;
}

export interface KFactorData {
  baseKFactor: number;
  parameterDependencies: ParameterDependency[];
  reynoldsCorrection?: ReynoldsCorrection;
  geometryCorrections: GeometryCorrection[];
}

export interface ParameterDependency {
  parameter: string;
  relationship: 'linear' | 'polynomial' | 'exponential' | 'lookup';
  coefficients: number[];
  validRange: [number, number];
  description: string;
}

export interface ReynoldsCorrection {
  enabled: boolean;
  method: 'colebrook' | 'blasius' | 'custom';
  coefficients: number[];
  validRange: [number, number];
}

export interface GeometryCorrection {
  parameter: string;
  correctionFactor: number;
  applicableRange: [number, number];
  description: string;
}

export interface PerformanceCurve {
  parameter: string;
  units: string;
  dataPoints: DataPoint[];
  interpolationMethod: 'linear' | 'cubic' | 'spline';
  extrapolationAllowed: boolean;
}

export interface DataPoint {
  x: number;
  y: number;
  uncertainty?: number;
}

export interface CorrectionFactors {
  temperatureCorrection: boolean;
  densityCorrection: boolean;
  viscosityCorrection: boolean;
  roughnessCorrection: boolean;
  installationCorrection: boolean;
}

export interface UncertaintyBounds {
  lowerBound: number;  // % below nominal
  upperBound: number;  // % above nominal
  confidenceLevel: number; // %
  basisOfUncertainty: string;
}

// ============================================================================
// Physical Properties and Installation
// ============================================================================

export interface FittingPhysicalProperties {
  dimensions: FittingDimensions;
  materials: MaterialProperties[];
  weight: number; // lbs
  thermalProperties: ThermalProperties;
  acousticProperties: AcousticProperties;
}

export interface FittingDimensions {
  length: number;     // inches
  width: number;      // inches
  height: number;     // inches
  inletDiameter?: number;  // inches
  outletDiameter?: number; // inches
  connectionType: 'flanged' | 'slip' | 'welded' | 'threaded';
}

export interface MaterialProperties {
  material: string;
  thickness: number;  // inches
  roughness: number;  // inches
  corrosionResistance: 'low' | 'medium' | 'high';
  temperatureRating: [number, number]; // [min, max] °F
}

export interface ThermalProperties {
  thermalConductivity: number; // BTU/(hr·ft·°F)
  heatCapacity: number;        // BTU/(lb·°F)
  thermalExpansion: number;    // in/(in·°F)
  insulationRequired: boolean;
}

export interface AcousticProperties {
  insertionLoss: number[];     // dB at octave bands
  transmissionLoss: number[];  // dB at octave bands
  regeneratedNoise: number[];  // dB at octave bands
  octaveBands: number[];       // Hz
}

export interface InstallationRequirements {
  minimumStraightLength: {
    upstream: number;   // diameters
    downstream: number; // diameters
  };
  supportRequirements: SupportRequirement[];
  accessRequirements: AccessRequirement[];
  clearanceRequirements: ClearanceRequirement[];
  specialTools: string[];
}

export interface SupportRequirement {
  location: string;
  loadCapacity: number; // lbs
  supportType: 'hanger' | 'bracket' | 'stand' | 'spring';
}

export interface AccessRequirement {
  purpose: 'maintenance' | 'inspection' | 'adjustment';
  minimumClearance: number; // inches
  frequency: 'daily' | 'weekly' | 'monthly' | 'annual';
}

export interface ClearanceRequirement {
  direction: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
  minimumDistance: number; // inches
  reason: string;
}

// ============================================================================
// Validation and Compatibility
// ============================================================================

export interface ValidationRule {
  ruleId: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  condition: ValidationCondition;
  message: string;
}

export interface ValidationCondition {
  parameter: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'in' | 'not_in';
  value: number | string | number[] | string[];
}

export interface CompatibilityMatrix {
  compatibleWith: string[];      // Fitting IDs
  incompatibleWith: string[];    // Fitting IDs
  requiresSpecialHandling: string[]; // Fitting IDs
  interactionEffects: InteractionEffect[];
}

export interface InteractionEffect {
  adjacentFittingType: string;
  distance: number;              // diameters
  effect: 'increase' | 'decrease' | 'neutral';
  magnitude: number;             // multiplier
  description: string;
}

// ============================================================================
// Flow Conditions and System Context
// ============================================================================

export interface FlowConditions {
  velocity: number;           // FPM
  volumeFlow: number;         // CFM
  massFlow: number;           // lb/min
  reynoldsNumber: number;
  airDensity: number;         // lb/ft³
  viscosity: number;          // lb/(ft·s)
  temperature: number;        // °F
  pressure: number;           // in Hg
  turbulenceIntensity: number; // %
}

export interface SystemContext {
  systemId: string;
  adjacentFittings: Map<string, AdvancedFittingConfiguration>;
  ductGeometry: DuctGeometry;
  flowDistribution: FlowDistribution;
  
  getUpstreamFittings(fittingId: string, distance: number): AdvancedFittingConfiguration[];
  getDownstreamFittings(fittingId: string, distance: number): AdvancedFittingConfiguration[];
  getLocalFlowConditions(fittingId: string): FlowConditions;
}

export interface DuctGeometry {
  shape: 'round' | 'rectangular';
  dimensions: number[];        // [diameter] or [width, height]
  roughness: number;          // inches
  material: string;
}

export interface FlowDistribution {
  totalFlow: number;          // CFM
  branchFlows: Map<string, number>; // branch ID -> CFM
  pressureDistribution: Map<string, number>; // location -> pressure
}

// ============================================================================
// Advanced Calculation Results
// ============================================================================

export interface AdvancedFittingLossResult extends FittingLossResult {
  calculationMethod: CalculationMethod;
  interactionEffects: InteractionEffects;
  performanceMetrics: PerformanceMetrics;
  validationResults: ValidationResults;
  recommendations: Recommendation[];
}

export interface InteractionEffects {
  totalInteractionFactor: number;
  individualInteractions: FittingInteraction[];
  significantInteractions: FittingInteraction[];
}

export interface FittingInteraction {
  adjacentFittingId: string;
  distance: number;           // diameters
  factor: number;             // pressure loss multiplier
  type: 'upstream' | 'downstream';
  significance: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  efficiency: number;         // %
  noiseGeneration: number;    // dB
  energyLoss: number;         // BTU/hr
  flowUniformity: number;     // %
  pressureRecovery: number;   // %
}

export interface ValidationResults {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  complianceStatus: ComplianceStatus;
}

export interface ValidationError {
  code: string;
  message: string;
  parameter: string;
  value: number | string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ComplianceStatus {
  smacnaCompliant: boolean;
  ashraeCompliant: boolean;
  localCodeCompliant: boolean;
  customStandardsCompliant: boolean;
}

export interface Recommendation {
  type: 'optimization' | 'maintenance' | 'replacement' | 'adjustment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedBenefit: string;
  implementationCost: 'low' | 'medium' | 'high';
}
