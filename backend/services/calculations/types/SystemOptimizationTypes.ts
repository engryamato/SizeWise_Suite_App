/**
 * System Optimization Type Definitions for Phase 3 Priority 2
 * 
 * Comprehensive TypeScript interfaces for dynamic system optimization including:
 * - Multi-objective optimization problems
 * - Constraint handling and validation
 * - Optimization algorithms and parameters
 * - System configuration and variables
 * - Performance metrics and results
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

// ============================================================================
// Core Optimization Enums
// ============================================================================

export enum OptimizationObjective {
  MINIMIZE_PRESSURE_LOSS = 'minimize_pressure_loss',
  MINIMIZE_ENERGY_CONSUMPTION = 'minimize_energy_consumption',
  MINIMIZE_TOTAL_COST = 'minimize_total_cost',
  MINIMIZE_NOISE_LEVEL = 'minimize_noise_level',
  MAXIMIZE_EFFICIENCY = 'maximize_efficiency',
  MINIMIZE_SPACE_USAGE = 'minimize_space_usage',
  MINIMIZE_MATERIAL_COST = 'minimize_material_cost',
  MINIMIZE_INSTALLATION_TIME = 'minimize_installation_time'
}

export enum OptimizationAlgorithm {
  GENETIC_ALGORITHM = 'genetic_algorithm',
  SIMULATED_ANNEALING = 'simulated_annealing',
  PARTICLE_SWARM = 'particle_swarm',
  GRADIENT_DESCENT = 'gradient_descent',
  DIFFERENTIAL_EVOLUTION = 'differential_evolution',
  MULTI_OBJECTIVE_GA = 'multi_objective_ga',
  NSGA_II = 'nsga_ii',
  HYBRID_OPTIMIZATION = 'hybrid_optimization'
}

export enum ConstraintType {
  VELOCITY_LIMIT = 'velocity_limit',
  PRESSURE_LIMIT = 'pressure_limit',
  NOISE_LIMIT = 'noise_limit',
  SPACE_CONSTRAINT = 'space_constraint',
  COST_CONSTRAINT = 'cost_constraint',
  CODE_COMPLIANCE = 'code_compliance',
  MATERIAL_AVAILABILITY = 'material_availability',
  INSTALLATION_CONSTRAINT = 'installation_constraint'
}

export enum VariableType {
  DUCT_SIZE = 'duct_size',
  FITTING_TYPE = 'fitting_type',
  MATERIAL_TYPE = 'material_type',
  DAMPER_POSITION = 'damper_position',
  FAN_SPEED = 'fan_speed',
  SYSTEM_CONFIGURATION = 'system_configuration',
  ROUTING_PATH = 'routing_path',
  INSULATION_THICKNESS = 'insulation_thickness'
}

export enum OptimizationStatus {
  NOT_STARTED = 'not_started',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  CONVERGED = 'converged',
  MAX_ITERATIONS = 'max_iterations',
  CONSTRAINT_VIOLATION = 'constraint_violation',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

// ============================================================================
// Optimization Variables and Bounds
// ============================================================================

export interface OptimizationVariable {
  id: string;
  name: string;
  type: VariableType;
  description: string;
  currentValue: number | string;
  bounds: VariableBounds;
  discreteValues?: (number | string)[];
  units?: string;
  precision?: number;
  dependencies?: VariableDependency[];
}

export interface VariableBounds {
  minimum: number | string;
  maximum: number | string;
  step?: number;
  allowedValues?: (number | string)[];
  constraints?: BoundConstraint[];
}

export interface BoundConstraint {
  condition: string;
  minValue?: number | string;
  maxValue?: number | string;
  description: string;
}

export interface VariableDependency {
  dependentVariableId: string;
  relationship: 'linear' | 'inverse' | 'custom';
  coefficient?: number;
  customFunction?: string;
  description: string;
}

// ============================================================================
// Optimization Constraints
// ============================================================================

export interface OptimizationConstraint {
  id: string;
  name: string;
  type: ConstraintType;
  description: string;
  constraintFunction: ConstraintFunction;
  tolerance: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  penalty?: number;
  active: boolean;
}

export interface ConstraintFunction {
  expression: string;
  variables: string[];
  parameters?: { [key: string]: number };
  evaluationMethod: 'analytical' | 'numerical' | 'simulation';
}

export interface ConstraintViolation {
  constraintId: string;
  violationType: 'boundary' | 'equality' | 'inequality';
  currentValue: number;
  requiredValue: number;
  severity: 'minor' | 'major' | 'critical';
  penalty: number;
}

// ============================================================================
// Objective Functions
// ============================================================================

export interface ObjectiveFunction {
  id: string;
  objective: OptimizationObjective;
  weight: number;
  description: string;
  evaluationFunction: (variables: OptimizationVariable[]) => number;
  units: string;
  targetValue?: number;
  tolerance?: number;
}

export interface MultiObjectiveFunction {
  objectives: ObjectiveFunction[];
  aggregationMethod: 'weighted_sum' | 'pareto_optimal' | 'lexicographic' | 'goal_programming';
  weights?: number[];
  paretoSettings?: ParetoSettings;
}

export interface ParetoSettings {
  populationSize: number;
  maxGenerations: number;
  crossoverRate: number;
  mutationRate: number;
  eliteSize: number;
  diversityMaintenance: boolean;
}

// ============================================================================
// System Configuration
// ============================================================================

export interface SystemConfiguration {
  id: string;
  name: string;
  description: string;
  systemType: 'supply' | 'return' | 'exhaust' | 'mixed';
  segments: SystemSegment[];
  designConditions: DesignConditions;
  performanceRequirements: PerformanceRequirements;
  constraints: SystemConstraints;
}

export interface SystemSegment {
  id: string;
  segmentType: 'duct' | 'fitting' | 'equipment' | 'terminal';
  geometry: SegmentGeometry;
  material: MaterialProperties;
  flowConditions: FlowConditions;
  optimizationVariables: string[];
  fixedParameters: { [key: string]: any };
}

export interface SegmentGeometry {
  shape: 'rectangular' | 'round' | 'oval' | 'custom';
  dimensions: DimensionSet;
  length?: number;
  orientation?: number;
  position?: Position3D;
}

export interface DimensionSet {
  width?: number;
  height?: number;
  diameter?: number;
  majorAxis?: number;
  minorAxis?: number;
  customDimensions?: { [key: string]: number };
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface MaterialProperties {
  type: string;
  roughness: number;
  density: number;
  thermalConductivity?: number;
  cost?: number;
  availability?: 'standard' | 'special_order' | 'custom';
}

export interface FlowConditions {
  volumeFlow: number;
  velocity: number;
  pressure: number;
  temperature: number;
  density: number;
  viscosity: number;
}

export interface DesignConditions {
  temperature: number;
  pressure: number;
  humidity: number;
  elevation: number;
  seasonalVariation?: boolean;
  operatingSchedule?: OperatingSchedule;
}

export interface OperatingSchedule {
  dailyProfile: HourlyProfile[];
  weeklyPattern: DailyPattern[];
  seasonalAdjustments: SeasonalAdjustment[];
}

export interface HourlyProfile {
  hour: number;
  loadFactor: number;
  temperatureAdjustment: number;
}

export interface DailyPattern {
  dayOfWeek: number;
  profileId: string;
  specialConditions?: string[];
}

export interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  temperatureRange: [number, number];
  humidityRange: [number, number];
  loadAdjustment: number;
}

export interface PerformanceRequirements {
  maxPressureLoss: number;
  maxVelocity: number;
  maxNoiseLevel: number;
  minEfficiency: number;
  targetFlowRates: { [zoneId: string]: number };
  balancingTolerance: number;
}

export interface SystemConstraints {
  spaceConstraints: SpaceConstraint[];
  codeRequirements: CodeRequirement[];
  budgetConstraints: BudgetConstraint[];
  installationConstraints: InstallationConstraint[];
}

export interface SpaceConstraint {
  area: BoundingBox;
  maxDuctSize: DimensionSet;
  clearanceRequirements: number;
  accessRequirements: AccessRequirement[];
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface AccessRequirement {
  purpose: 'maintenance' | 'inspection' | 'installation';
  minimumClearance: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'annual';
}

export interface CodeRequirement {
  code: 'SMACNA' | 'ASHRAE' | 'IMC' | 'UMC' | 'local';
  section: string;
  requirement: string;
  complianceCheck: (system: SystemConfiguration) => boolean;
}

export interface BudgetConstraint {
  category: 'material' | 'labor' | 'equipment' | 'total';
  maxCost: number;
  currency: string;
  contingency: number;
}

export interface InstallationConstraint {
  sequenceRequirements: string[];
  equipmentRequirements: string[];
  timeConstraints: TimeConstraint[];
  skillRequirements: SkillRequirement[];
}

export interface TimeConstraint {
  phase: string;
  maxDuration: number;
  dependencies: string[];
  criticalPath: boolean;
}

export interface SkillRequirement {
  skill: string;
  level: 'apprentice' | 'journeyman' | 'master';
  certification?: string;
  availability: number;
}

// ============================================================================
// Optimization Problem Definition
// ============================================================================

export interface OptimizationProblem {
  id: string;
  name: string;
  description: string;
  systemConfiguration: SystemConfiguration;
  variables: OptimizationVariable[];
  objectives: MultiObjectiveFunction;
  constraints: OptimizationConstraint[];
  algorithmSettings: AlgorithmSettings;
  convergenceCriteria: ConvergenceCriteria;
  outputRequirements: OutputRequirements;
}

export interface AlgorithmSettings {
  algorithm: OptimizationAlgorithm;
  parameters: AlgorithmParameters;
  parallelization: ParallelizationSettings;
  seedValue?: number;
  restartStrategy?: RestartStrategy;
}

export interface AlgorithmParameters {
  populationSize?: number;
  maxIterations?: number;
  maxEvaluations?: number;
  crossoverRate?: number;
  mutationRate?: number;
  selectionMethod?: string;
  coolingSchedule?: CoolingSchedule;
  inertiaWeight?: number;
  accelerationCoefficients?: number[];
  stepSize?: number;
  gradientTolerance?: number;
  customParameters?: { [key: string]: any };
}

export interface CoolingSchedule {
  initialTemperature: number;
  finalTemperature: number;
  coolingRate: number;
  method: 'linear' | 'exponential' | 'logarithmic' | 'adaptive';
}

export interface ParallelizationSettings {
  enabled: boolean;
  maxWorkers?: number;
  chunkSize?: number;
  loadBalancing?: 'static' | 'dynamic';
}

export interface RestartStrategy {
  enabled: boolean;
  maxRestarts: number;
  restartCondition: 'stagnation' | 'diversity_loss' | 'time_limit';
  restartParameters: { [key: string]: any };
}

export interface ConvergenceCriteria {
  maxIterations: number;
  toleranceValue: number;
  stagnationLimit: number;
  improvementThreshold: number;
  timeLimit?: number;
  customCriteria?: ConvergenceFunction[];
}

export interface ConvergenceFunction {
  name: string;
  function: (history: OptimizationHistory) => boolean;
  description: string;
}

export interface OutputRequirements {
  includeHistory: boolean;
  detailedAnalysis: boolean;
  sensitivityAnalysis: boolean;
  uncertaintyAnalysis: boolean;
  visualizations: VisualizationRequest[];
  reportFormat: 'json' | 'pdf' | 'excel' | 'html';
}

export interface VisualizationRequest {
  type: 'convergence' | 'pareto_front' | 'variable_history' | 'constraint_violations' | 'sensitivity';
  parameters: { [key: string]: any };
}

// ============================================================================
// Optimization Results
// ============================================================================

export interface OptimizationResult {
  problemId: string;
  status: OptimizationStatus;
  bestSolution: OptimizationSolution;
  paretoFront?: OptimizationSolution[];
  statistics: OptimizationStatistics;
  history: OptimizationHistory;
  analysis: ResultAnalysis;
  recommendations: OptimizationRecommendation[];
  warnings: string[];
  errors: string[];
}

export interface OptimizationSolution {
  id: string;
  variables: { [variableId: string]: number | string };
  objectiveValues: { [objectiveId: string]: number };
  constraintViolations: ConstraintViolation[];
  feasible: boolean;
  dominationRank?: number;
  crowdingDistance?: number;
  fitness: number;
  systemConfiguration: SystemConfiguration;
  performanceMetrics: SolutionPerformanceMetrics;
}

export interface SolutionPerformanceMetrics {
  totalPressureLoss: number;
  energyConsumption: number;
  totalCost: number;
  noiseLevel: number;
  efficiency: number;
  spaceUtilization: number;
  installationComplexity: number;
  maintenanceRequirements: number;
}

export interface OptimizationStatistics {
  totalIterations: number;
  totalEvaluations: number;
  convergenceIteration: number;
  executionTime: number;
  bestFitnessHistory: number[];
  averageFitnessHistory: number[];
  diversityHistory: number[];
  constraintViolationHistory: number[];
  algorithmSpecificStats: { [key: string]: any };
}

export interface OptimizationHistory {
  iterations: IterationHistory[];
  populationHistory?: PopulationSnapshot[];
  parameterHistory: ParameterHistory[];
  convergenceMetrics: ConvergenceMetrics[];
}

export interface IterationHistory {
  iteration: number;
  bestFitness: number;
  averageFitness: number;
  worstFitness: number;
  diversity: number;
  constraintViolations: number;
  timestamp: Date;
}

export interface PopulationSnapshot {
  iteration: number;
  population: OptimizationSolution[];
  statistics: PopulationStatistics;
}

export interface PopulationStatistics {
  size: number;
  feasibleSolutions: number;
  averageFitness: number;
  fitnessStandardDeviation: number;
  diversityIndex: number;
}

export interface ParameterHistory {
  iteration: number;
  parameters: { [parameterName: string]: any };
  adaptiveChanges: string[];
}

export interface ConvergenceMetrics {
  iteration: number;
  improvement: number;
  stagnationCount: number;
  convergenceIndicator: number;
  estimatedRemainingIterations?: number;
}

export interface ResultAnalysis {
  sensitivityAnalysis?: SensitivityAnalysis;
  uncertaintyAnalysis?: UncertaintyAnalysis;
  tradeoffAnalysis?: TradeoffAnalysis;
  robustnessAnalysis?: RobustnessAnalysis;
}

export interface SensitivityAnalysis {
  variableSensitivities: VariableSensitivity[];
  parameterSensitivities: ParameterSensitivity[];
  globalSensitivityIndices: { [variableId: string]: number };
}

export interface VariableSensitivity {
  variableId: string;
  sensitivityIndex: number;
  localSensitivity: number;
  interactionEffects: InteractionEffect[];
}

export interface InteractionEffect {
  variableIds: string[];
  interactionStrength: number;
  description: string;
}

export interface ParameterSensitivity {
  parameterId: string;
  sensitivityIndex: number;
  recommendedRange: [number, number];
}

export interface UncertaintyAnalysis {
  inputUncertainties: InputUncertainty[];
  outputUncertainties: OutputUncertainty[];
  confidenceIntervals: ConfidenceInterval[];
  robustnessMeasures: RobustnessMeasure[];
}

export interface InputUncertainty {
  variableId: string;
  uncertaintyType: 'normal' | 'uniform' | 'triangular' | 'custom';
  parameters: { [key: string]: number };
  correlations?: { [variableId: string]: number };
}

export interface OutputUncertainty {
  objectiveId: string;
  mean: number;
  standardDeviation: number;
  distribution: 'normal' | 'lognormal' | 'custom';
  percentiles: { [percentile: string]: number };
}

export interface ConfidenceInterval {
  objectiveId: string;
  confidenceLevel: number;
  lowerBound: number;
  upperBound: number;
}

export interface RobustnessMeasure {
  name: string;
  value: number;
  interpretation: string;
}

export interface TradeoffAnalysis {
  objectivePairs: ObjectivePair[];
  paretoEfficiency: number;
  kneePoints: OptimizationSolution[];
  tradeoffRecommendations: TradeoffRecommendation[];
}

export interface ObjectivePair {
  objective1Id: string;
  objective2Id: string;
  correlationCoefficient: number;
  tradeoffStrength: 'weak' | 'moderate' | 'strong';
  conflictLevel: number;
}

export interface TradeoffRecommendation {
  description: string;
  recommendedSolution: OptimizationSolution;
  tradeoffJustification: string;
  alternativeSolutions: OptimizationSolution[];
}

export interface RobustnessAnalysis {
  robustSolutions: OptimizationSolution[];
  robustnessMetrics: RobustnessMetric[];
  scenarioAnalysis: ScenarioAnalysis[];
}

export interface RobustnessMetric {
  name: string;
  value: number;
  threshold: number;
  passed: boolean;
}

export interface ScenarioAnalysis {
  scenarioName: string;
  scenarioParameters: { [key: string]: any };
  solutionPerformance: SolutionPerformanceMetrics;
  performanceDegradation: number;
}

export interface OptimizationRecommendation {
  type: 'improvement' | 'alternative' | 'caution' | 'validation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  actionItems: string[];
  relatedSolutions?: OptimizationSolution[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type ObjectiveFunctionType = (variables: OptimizationVariable[]) => number;
export type ConstraintFunctionType = (variables: OptimizationVariable[]) => number;
export type FitnessFunction = (solution: OptimizationSolution) => number;
export type SelectionFunction = (population: OptimizationSolution[], count: number) => OptimizationSolution[];
export type CrossoverFunction = (parent1: OptimizationSolution, parent2: OptimizationSolution) => OptimizationSolution[];
export type MutationFunction = (solution: OptimizationSolution, rate: number) => OptimizationSolution;
