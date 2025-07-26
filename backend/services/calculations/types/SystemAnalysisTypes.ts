/**
 * System Analysis Type Definitions
 * 
 * Comprehensive TypeScript interfaces for Phase 3 Priority 3: Advanced System Analysis Tools
 * Includes system performance analysis, energy efficiency metrics, lifecycle cost analysis,
 * environmental impact assessment, and compliance checking frameworks.
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

// ============================================================================
// CORE SYSTEM ANALYSIS INTERFACES
// ============================================================================

/**
 * Main system analysis configuration and results interface
 */
export interface SystemAnalysis {
  id: string;
  name: string;
  description: string;
  systemConfiguration: SystemConfiguration;
  analysisType: AnalysisType;
  analysisScope: AnalysisScope;
  performanceAnalysis?: PerformanceAnalysis;
  energyAnalysis?: EnergyAnalysis;
  costAnalysis?: LifecycleCostAnalysis;
  environmentalAnalysis?: EnvironmentalImpactAnalysis;
  complianceAnalysis?: ComplianceAnalysis;
  timestamp: Date;
  analysisVersion: string;
}

/**
 * Types of system analysis that can be performed
 */
export enum AnalysisType {
  PERFORMANCE_ONLY = 'performance_only',
  ENERGY_ONLY = 'energy_only',
  COST_ONLY = 'cost_only',
  ENVIRONMENTAL_ONLY = 'environmental_only',
  COMPLIANCE_ONLY = 'compliance_only',
  COMPREHENSIVE = 'comprehensive',
  CUSTOM = 'custom'
}

/**
 * Scope of analysis - what parts of the system to analyze
 */
export interface AnalysisScope {
  includePerformance: boolean;
  includeEnergy: boolean;
  includeCost: boolean;
  includeEnvironmental: boolean;
  includeCompliance: boolean;
  timeHorizon: TimeHorizon;
  analysisDepth: AnalysisDepth;
  customParameters?: CustomAnalysisParameters;
}

export enum TimeHorizon {
  INSTANTANEOUS = 'instantaneous',
  DAILY = 'daily',
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  LIFECYCLE = 'lifecycle',
  CUSTOM = 'custom'
}

export enum AnalysisDepth {
  BASIC = 'basic',
  DETAILED = 'detailed',
  COMPREHENSIVE = 'comprehensive',
  RESEARCH_GRADE = 'research_grade'
}

// ============================================================================
// SYSTEM PERFORMANCE ANALYSIS
// ============================================================================

/**
 * Comprehensive system performance analysis results
 */
export interface PerformanceAnalysis {
  id: string;
  systemId: string;
  analysisTimestamp: Date;
  performanceMetrics: PerformanceMetrics;
  trendAnalysis: TrendAnalysis;
  benchmarkComparison: BenchmarkComparison;
  efficiencyAnalysis: EfficiencyAnalysis;
  alertsAndWarnings: PerformanceAlert[];
  recommendations: PerformanceRecommendation[];
  uncertaintyAnalysis: UncertaintyAnalysis;
}

/**
 * Core performance metrics for HVAC systems
 */
export interface PerformanceMetrics {
  // Pressure and Flow Metrics
  totalSystemPressure: Measurement;
  staticPressure: Measurement;
  velocityPressure: Measurement;
  totalAirflow: Measurement;
  designAirflow: Measurement;
  airflowEfficiency: Measurement;
  
  // Fan Performance
  fanPower: Measurement;
  fanEfficiency: Measurement;
  fanSpeed: Measurement;
  fanCurvePosition: FanCurvePosition;
  
  // System Efficiency
  systemEfficiency: Measurement;
  transportEfficiency: Measurement;
  distributionEfficiency: Measurement;
  
  // Environmental Metrics
  noiseLevel: Measurement;
  vibrationLevel: Measurement;
  temperatureRise: Measurement;
  
  // Filter and Component Performance
  filterPressureDrop: Measurement;
  coilPressureDrop: Measurement;
  dampersPosition: DamperPosition[];
  
  // System Balance
  balanceQuality: BalanceQuality;
  flowDistribution: FlowDistribution;
}

/**
 * Measurement interface with value, units, and quality indicators
 */
export interface Measurement {
  value: number;
  units: string;
  accuracy: number;
  timestamp: Date;
  source: MeasurementSource;
  qualityIndicator: QualityIndicator;
  uncertaintyBounds?: UncertaintyBounds;
}

export enum MeasurementSource {
  CALCULATED = 'calculated',
  MEASURED = 'measured',
  ESTIMATED = 'estimated',
  MANUFACTURER_DATA = 'manufacturer_data',
  SIMULATION = 'simulation'
}

export enum QualityIndicator {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  UNCERTAIN = 'uncertain'
}

/**
 * Fan curve position and operating point analysis
 */
export interface FanCurvePosition {
  operatingPoint: OperatingPoint;
  designPoint: OperatingPoint;
  efficiencyAtOperating: number;
  efficiencyAtDesign: number;
  surgeMargin: number;
  stallMargin: number;
  recommendedOperatingRange: OperatingRange;
}

export interface OperatingPoint {
  airflow: number;
  pressure: number;
  power: number;
  efficiency: number;
  speed: number;
}

/**
 * System balance quality assessment
 */
export interface BalanceQuality {
  overallScore: number; // 0-100
  flowVariation: number; // Coefficient of variation
  pressureVariation: number;
  balanceGrade: BalanceGrade;
  criticalZones: string[];
  balanceRecommendations: string[];
}

export enum BalanceGrade {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  POOR = 'poor',
  CRITICAL = 'critical'
}

/**
 * Trend analysis for performance monitoring
 */
export interface TrendAnalysis {
  timeRange: TimeRange;
  trendDirection: TrendDirection;
  trendMagnitude: number;
  seasonalPatterns: SeasonalPattern[];
  anomalies: PerformanceAnomaly[];
  predictiveAnalysis: PredictiveAnalysis;
  degradationRate: DegradationRate;
}

export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DEGRADING = 'degrading',
  FLUCTUATING = 'fluctuating',
  UNKNOWN = 'unknown'
}

export interface SeasonalPattern {
  season: Season;
  averagePerformance: number;
  performanceVariation: number;
  typicalIssues: string[];
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter'
}

/**
 * Performance alerts and warnings system
 */
export interface PerformanceAlert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  recommendedActions: string[];
}

export enum AlertType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  TREND_DEGRADATION = 'trend_degradation',
  ANOMALY_DETECTED = 'anomaly_detected',
  EFFICIENCY_DROP = 'efficiency_drop',
  BALANCE_ISSUE = 'balance_issue',
  MAINTENANCE_DUE = 'maintenance_due'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

// ============================================================================
// ENERGY EFFICIENCY ANALYSIS
// ============================================================================

/**
 * Comprehensive energy efficiency analysis
 */
export interface EnergyAnalysis {
  id: string;
  systemId: string;
  analysisTimestamp: Date;
  energyConsumption: EnergyConsumption;
  efficiencyMetrics: EnergyEfficiencyMetrics;
  energyCosts: EnergyCosts;
  carbonFootprint: CarbonFootprint;
  benchmarkComparison: EnergyBenchmark;
  optimizationOpportunities: EnergyOptimizationOpportunity[];
  seasonalAnalysis: SeasonalEnergyAnalysis;
}

/**
 * Energy consumption breakdown and analysis
 */
export interface EnergyConsumption {
  totalConsumption: EnergyMeasurement;
  fanConsumption: EnergyMeasurement;
  auxiliaryConsumption: EnergyMeasurement;
  heatingConsumption?: EnergyMeasurement;
  coolingConsumption?: EnergyMeasurement;
  consumptionByTimeOfDay: TimeOfDayConsumption[];
  loadProfile: LoadProfile;
  peakDemand: PeakDemand;
}

export interface EnergyMeasurement {
  value: number;
  units: EnergyUnits;
  timeFrame: TimeFrame;
  accuracy: number;
  source: MeasurementSource;
}

export enum EnergyUnits {
  KWH = 'kWh',
  BTU = 'BTU',
  THERMS = 'therms',
  JOULES = 'joules',
  KW = 'kW'
}

export enum TimeFrame {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUALLY = 'annually'
}

/**
 * Energy efficiency metrics and calculations
 */
export interface EnergyEfficiencyMetrics {
  overallEfficiency: number; // %
  fanEfficiency: number; // %
  systemEfficiency: number; // %
  transportEfficiency: number; // %
  specificFanPower: number; // W/CFM
  energyUtilizationIndex: number; // EUI
  powerDensity: number; // W/sq ft
  efficiencyTrend: EfficiencyTrend;
  benchmarkComparison: EfficiencyBenchmark;
}

/**
 * Energy cost analysis and projections
 */
export interface EnergyCosts {
  currentCosts: CostBreakdown;
  projectedCosts: CostProjection[];
  costSavingOpportunities: CostSavingOpportunity[];
  utilityRateStructure: UtilityRateStructure;
  demandCharges: DemandCharges;
  timeOfUsePricing: TimeOfUsePricing;
}

export interface CostBreakdown {
  totalCost: number;
  energyCost: number;
  demandCost: number;
  fixedCost: number;
  currency: string;
  timeFrame: TimeFrame;
}

// ============================================================================
// LIFECYCLE COST ANALYSIS
// ============================================================================

/**
 * Comprehensive lifecycle cost analysis
 */
export interface LifecycleCostAnalysis {
  id: string;
  systemId: string;
  analysisTimestamp: Date;
  analysisParameters: CostAnalysisParameters;
  initialCosts: InitialCosts;
  operatingCosts: OperatingCosts;
  maintenanceCosts: MaintenanceCosts;
  replacementCosts: ReplacementCosts;
  totalCostOfOwnership: TotalCostOfOwnership;
  costComparison: CostComparison;
  sensitivityAnalysis: CostSensitivityAnalysis;
  recommendations: CostRecommendation[];
}

/**
 * Parameters for lifecycle cost analysis
 */
export interface CostAnalysisParameters {
  analysisHorizon: number; // years
  discountRate: number; // %
  inflationRate: number; // %
  energyEscalationRate: number; // %
  currency: string;
  analysisMethod: CostAnalysisMethod;
  uncertaintyLevel: UncertaintyLevel;
}

export enum CostAnalysisMethod {
  NET_PRESENT_VALUE = 'net_present_value',
  LIFE_CYCLE_COST = 'life_cycle_cost',
  PAYBACK_PERIOD = 'payback_period',
  INTERNAL_RATE_OF_RETURN = 'internal_rate_of_return'
}

export enum UncertaintyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Initial system costs breakdown
 */
export interface InitialCosts {
  equipmentCosts: EquipmentCosts;
  installationCosts: InstallationCosts;
  designCosts: DesignCosts;
  permitsCosts: PermitsCosts;
  totalInitialCost: number;
  costPerCFM: number;
  costPerSquareFoot: number;
}

export interface EquipmentCosts {
  fans: number;
  ductwork: number;
  fittings: number;
  dampers: number;
  controls: number;
  accessories: number;
  total: number;
}

// ============================================================================
// ENVIRONMENTAL IMPACT ANALYSIS
// ============================================================================

/**
 * Environmental impact assessment
 */
export interface EnvironmentalImpactAnalysis {
  id: string;
  systemId: string;
  analysisTimestamp: Date;
  carbonFootprint: CarbonFootprint;
  sustainabilityMetrics: SustainabilityMetrics;
  greenBuildingCompliance: GreenBuildingCompliance;
  environmentalCertifications: EnvironmentalCertification[];
  lifecycleAssessment: LifecycleAssessment;
  recommendations: EnvironmentalRecommendation[];
}

/**
 * Carbon footprint calculation and analysis
 */
export interface CarbonFootprint {
  totalEmissions: EmissionMeasurement;
  operationalEmissions: EmissionMeasurement;
  embodiedEmissions: EmissionMeasurement;
  emissionsBySource: EmissionSource[];
  emissionsTrend: EmissionsTrend;
  offsetOpportunities: OffsetOpportunity[];
  benchmarkComparison: EmissionsBenchmark;
}

export interface EmissionMeasurement {
  value: number;
  units: EmissionUnits;
  timeFrame: TimeFrame;
  scope: EmissionScope;
  accuracy: number;
}

export enum EmissionUnits {
  KG_CO2E = 'kg_CO2e',
  TONS_CO2E = 'tons_CO2e',
  LBS_CO2E = 'lbs_CO2e'
}

export enum EmissionScope {
  SCOPE_1 = 'scope_1', // Direct emissions
  SCOPE_2 = 'scope_2', // Indirect emissions from electricity
  SCOPE_3 = 'scope_3'  // Other indirect emissions
}

// ============================================================================
// COMPLIANCE ANALYSIS
// ============================================================================

/**
 * Compliance checking and validation
 */
export interface ComplianceAnalysis {
  id: string;
  systemId: string;
  analysisTimestamp: Date;
  complianceStandards: ComplianceStandard[];
  complianceResults: ComplianceResult[];
  overallComplianceStatus: ComplianceStatus;
  nonComplianceIssues: NonComplianceIssue[];
  recommendations: ComplianceRecommendation[];
  certificationStatus: CertificationStatus;
}

/**
 * Compliance standards and codes
 */
export interface ComplianceStandard {
  id: string;
  name: string;
  version: string;
  type: StandardType;
  jurisdiction: string;
  applicability: StandardApplicability;
  requirements: ComplianceRequirement[];
}

export enum StandardType {
  SMACNA = 'smacna',
  ASHRAE = 'ashrae',
  LOCAL_CODE = 'local_code',
  INTERNATIONAL_CODE = 'international_code',
  INDUSTRY_STANDARD = 'industry_standard',
  GREEN_BUILDING = 'green_building'
}

export interface ComplianceResult {
  standardId: string;
  requirementId: string;
  status: ComplianceStatus;
  actualValue: number;
  requiredValue: number;
  units: string;
  margin: number;
  notes: string;
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  MARGINAL = 'marginal',
  NOT_APPLICABLE = 'not_applicable',
  REQUIRES_REVIEW = 'requires_review'
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  duration: number;
  units: TimeUnits;
}

export enum TimeUnits {
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years'
}

export interface UncertaintyBounds {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // %
  distributionType: DistributionType;
}

export enum DistributionType {
  NORMAL = 'normal',
  UNIFORM = 'uniform',
  TRIANGULAR = 'triangular',
  LOGNORMAL = 'lognormal'
}

export interface CustomAnalysisParameters {
  [key: string]: any;
}

// ============================================================================
// SYSTEM CONFIGURATION (EXTENDED)
// ============================================================================

export interface SystemConfiguration {
  id: string;
  name: string;
  description: string;
  systemType: SystemType;
  designParameters: DesignParameters;
  operatingConditions: OperatingConditions;
  components: SystemComponent[];
  controlStrategy: ControlStrategy;
  maintenanceSchedule: MaintenanceSchedule;
}

export enum SystemType {
  SUPPLY_AIR = 'supply_air',
  RETURN_AIR = 'return_air',
  EXHAUST_AIR = 'exhaust_air',
  MIXED_AIR = 'mixed_air',
  DEDICATED_OUTDOOR_AIR = 'dedicated_outdoor_air'
}

export interface DesignParameters {
  designAirflow: number; // CFM
  designPressure: number; // in wg
  designTemperature: number; // °F
  designHumidity: number; // %RH
  designElevation: number; // ft
  safetyFactors: SafetyFactors;
}

export interface SafetyFactors {
  pressureSafetyFactor: number;
  airflowSafetyFactor: number;
  powerSafetyFactor: number;
}

// ============================================================================
// ADDITIONAL INTERFACES FOR COMPREHENSIVE ANALYSIS
// ============================================================================

/**
 * Performance recommendations with priority and impact assessment
 */
export interface PerformanceRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  expectedImpact: ExpectedImpact;
  implementationCost: number;
  paybackPeriod: number; // months
  implementationComplexity: ImplementationComplexity;
  requiredActions: string[];
  timeline: string;
}

export enum RecommendationType {
  OPTIMIZATION = 'optimization',
  MAINTENANCE = 'maintenance',
  UPGRADE = 'upgrade',
  OPERATIONAL_CHANGE = 'operational_change',
  DESIGN_MODIFICATION = 'design_modification'
}

export enum RecommendationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface ExpectedImpact {
  energySavings: number; // %
  costSavings: number; // $/year
  performanceImprovement: number; // %
  emissionReduction: number; // kg CO2e/year
  reliabilityImprovement: number; // %
}

export enum ImplementationComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very_complex'
}

/**
 * Benchmark comparison for performance analysis
 */
export interface BenchmarkComparison {
  benchmarkType: BenchmarkType;
  benchmarkSource: string;
  systemPerformance: number;
  benchmarkValue: number;
  percentile: number;
  performanceGap: number;
  improvementPotential: number;
  similarSystems: SimilarSystemComparison[];
}

export enum BenchmarkType {
  INDUSTRY_AVERAGE = 'industry_average',
  BEST_IN_CLASS = 'best_in_class',
  REGULATORY_MINIMUM = 'regulatory_minimum',
  DESIGN_TARGET = 'design_target',
  HISTORICAL_PERFORMANCE = 'historical_performance'
}

export interface SimilarSystemComparison {
  systemId: string;
  systemName: string;
  performanceMetric: number;
  systemCharacteristics: SystemCharacteristics;
  performanceDifference: number;
}

export interface SystemCharacteristics {
  size: SystemSize;
  age: number; // years
  buildingType: BuildingType;
  climateZone: string;
  operatingHours: number; // hours/year
}

export enum SystemSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export enum BuildingType {
  OFFICE = 'office',
  RETAIL = 'retail',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  INDUSTRIAL = 'industrial',
  RESIDENTIAL = 'residential',
  HOSPITALITY = 'hospitality',
  OTHER = 'other'
}

/**
 * Efficiency analysis with detailed breakdown
 */
export interface EfficiencyAnalysis {
  overallEfficiency: EfficiencyMetric;
  componentEfficiencies: ComponentEfficiency[];
  efficiencyTrends: EfficiencyTrend[];
  efficiencyLosses: EfficiencyLoss[];
  improvementOpportunities: EfficiencyImprovement[];
  benchmarkComparison: EfficiencyBenchmark;
}

export interface EfficiencyMetric {
  value: number;
  units: string;
  calculationMethod: EfficiencyCalculationMethod;
  accuracy: number;
  timestamp: Date;
}

export enum EfficiencyCalculationMethod {
  MEASURED = 'measured',
  CALCULATED = 'calculated',
  ESTIMATED = 'estimated',
  MANUFACTURER_RATED = 'manufacturer_rated'
}

export interface ComponentEfficiency {
  componentId: string;
  componentType: ComponentType;
  efficiency: number;
  ratedEfficiency: number;
  degradationFactor: number;
  maintenanceStatus: MaintenanceStatus;
}

export enum ComponentType {
  FAN = 'fan',
  MOTOR = 'motor',
  VFD = 'vfd',
  DAMPER = 'damper',
  FILTER = 'filter',
  COIL = 'coil',
  DUCTWORK = 'ductwork'
}

export enum MaintenanceStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical'
}

/**
 * Predictive analysis for performance forecasting
 */
export interface PredictiveAnalysis {
  forecastHorizon: number; // months
  predictedPerformance: PredictedMetric[];
  confidenceInterval: ConfidenceInterval;
  predictionModel: PredictionModel;
  keyFactors: PredictionFactor[];
  scenarios: PredictionScenario[];
}

export interface PredictedMetric {
  metric: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  timeToTarget: number; // months
}

export interface ConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // %
}

export interface PredictionModel {
  modelType: ModelType;
  accuracy: number; // %
  lastTrainingDate: Date;
  dataPoints: number;
  validationScore: number;
}

export enum ModelType {
  LINEAR_REGRESSION = 'linear_regression',
  POLYNOMIAL_REGRESSION = 'polynomial_regression',
  TIME_SERIES = 'time_series',
  MACHINE_LEARNING = 'machine_learning',
  PHYSICS_BASED = 'physics_based'
}

/**
 * Performance anomaly detection and analysis
 */
export interface PerformanceAnomaly {
  id: string;
  detectionTimestamp: Date;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  affectedMetrics: string[];
  deviationMagnitude: number;
  duration: number; // hours
  possibleCauses: PossibleCause[];
  recommendedActions: string[];
  resolved: boolean;
  resolutionDate?: Date;
}

export enum AnomalyType {
  SUDDEN_CHANGE = 'sudden_change',
  GRADUAL_DRIFT = 'gradual_drift',
  CYCLIC_ANOMALY = 'cyclic_anomaly',
  OUTLIER = 'outlier',
  PATTERN_BREAK = 'pattern_break'
}

export enum AnomalySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface PossibleCause {
  cause: string;
  probability: number; // %
  category: CauseCategory;
  diagnosticSteps: string[];
}

export enum CauseCategory {
  EQUIPMENT_FAILURE = 'equipment_failure',
  MAINTENANCE_ISSUE = 'maintenance_issue',
  OPERATIONAL_CHANGE = 'operational_change',
  ENVIRONMENTAL_FACTOR = 'environmental_factor',
  CONTROL_SYSTEM = 'control_system',
  UNKNOWN = 'unknown'
}

/**
 * Degradation rate analysis
 */
export interface DegradationRate {
  overallDegradationRate: number; // %/year
  componentDegradation: ComponentDegradation[];
  degradationFactors: DegradationFactor[];
  maintenanceImpact: MaintenanceImpact;
  projectedLifespan: ProjectedLifespan;
}

export interface ComponentDegradation {
  componentId: string;
  componentType: ComponentType;
  degradationRate: number; // %/year
  currentCondition: number; // % of original performance
  estimatedRemainingLife: number; // years
  replacementThreshold: number; // % performance
}

export interface DegradationFactor {
  factor: string;
  impact: number; // % contribution to degradation
  controllable: boolean;
  mitigationStrategies: string[];
}

export interface MaintenanceImpact {
  preventiveMaintenance: MaintenanceEffect;
  correctiveMaintenance: MaintenanceEffect;
  deferredMaintenance: MaintenanceEffect;
}

export interface MaintenanceEffect {
  performanceImpact: number; // %
  lifespanImpact: number; // years
  costImpact: number; // $/year
}

export interface ProjectedLifespan {
  currentAge: number; // years
  designLife: number; // years
  projectedLife: number; // years
  confidenceLevel: number; // %
  keyAssumptions: string[];
}

// Export all types for external use
export * from './SystemOptimizationTypes';
