/**
 * AI Fitting Recommendations System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Intelligent fitting suggestion engine using rule-based AI for complex HVAC
 * scenarios including double wye, cross fittings, and custom fabrication
 * recommendations. Provides professional-grade fitting analysis and suggestions.
 * 
 * @fileoverview AI-powered fitting recommendation engine
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const fittingAI = new FittingAI({
 *   enableAdvancedAnalysis: true,
 *   smacnaCompliance: true,
 *   customFabrication: true
 * });
 * 
 * // Analyze intersection for fitting recommendations
 * const recommendations = fittingAI.analyzeFittingRequirements({
 *   mainCenterline: mainLine,
 *   branchCenterlines: branches,
 *   intersectionPoint: point,
 *   systemPressure: 'medium',
 *   airflowRates: flowRates
 * });
 * 
 * // Get best fitting recommendation
 * const bestFitting = recommendations[0];
 * console.log(`Recommended: ${bestFitting.type} - ${bestFitting.description}`);
 * ```
 */

import { Centerline, Point2D } from '@/types/air-duct-sizer';

/**
 * HVAC fitting types supported by the AI system
 */
export type FittingType = 
  | 'straight_tee'
  | 'reducing_tee'
  | 'wye'
  | 'reducing_wye'
  | 'double_wye'
  | 'cross'
  | 'reducing_cross'
  | 'lateral'
  | 'reducing_lateral'
  | 'custom_fabrication'
  | 'transition'
  | 'offset'
  | 'elbow'
  | 'reducer';

/**
 * System pressure classifications
 */
export type SystemPressure = 'low' | 'medium' | 'high';

/**
 * Airflow direction analysis
 */
export interface AirflowAnalysis {
  direction: 'supply' | 'return' | 'exhaust';
  velocity: number;           // ft/min
  volume: number;            // CFM
  pressure: number;          // in. w.g.
  temperature: number;       // °F
}

/**
 * Ductwork sizing information
 */
export interface DuctSizing {
  width: number;             // inches
  height: number;            // inches
  diameter?: number;         // inches (for round ducts)
  shape: 'rectangular' | 'round' | 'oval';
  gauge: number;             // sheet metal gauge
}

/**
 * Fitting analysis input
 */
export interface FittingAnalysisInput {
  mainCenterline: Centerline;
  branchCenterlines: Centerline[];
  intersectionPoint: Point2D;
  systemPressure: SystemPressure;
  airflowRates: AirflowAnalysis[];
  ductSizing: DuctSizing[];
  constraints?: {
    spaceRestrictions?: {
      maxHeight: number;
      maxWidth: number;
      maxDepth: number;
    };
    fabricationLimits?: {
      maxCustomAngle: number;
      standardSizesOnly: boolean;
      preferredManufacturer?: string;
    };
    codeRequirements?: {
      smacnaCompliance: boolean;
      localCodes: string[];
      energyEfficiency: boolean;
    };
  };
}

/**
 * AI fitting recommendation
 */
export interface FittingRecommendation {
  id: string;
  type: FittingType;
  name: string;
  description: string;
  confidence: number;        // 0-1 confidence score
  priority: number;          // 1-10 priority ranking
  
  // Technical specifications
  specifications: {
    dimensions: DuctSizing;
    angles: number[];        // Branch angles in degrees
    pressureLoss: number;    // Pressure loss coefficient
    velocityRatio: number;   // Velocity ratio
    fabricationComplexity: 'simple' | 'moderate' | 'complex' | 'custom';
  };
  
  // Compliance and standards
  compliance: {
    smacnaCompliant: boolean;
    energyEfficient: boolean;
    codeCompliant: boolean;
    standardSizes: boolean;
  };
  
  // Cost and fabrication
  fabrication: {
    estimatedCost: number;   // Relative cost factor
    fabricationTime: number; // Hours
    materialWaste: number;   // Percentage
    customFabrication: boolean;
    toolingRequired: string[];
  };
  
  // Performance characteristics
  performance: {
    pressureLoss: number;    // Total pressure loss
    noiseGeneration: number; // Noise level (dB)
    airflowDistribution: number; // Distribution quality (0-1)
    maintenanceAccess: number;   // Maintenance accessibility (0-1)
  };
  
  // Installation considerations
  installation: {
    difficulty: 'easy' | 'moderate' | 'difficult' | 'expert';
    spaceRequired: DuctSizing;
    supportRequirements: string[];
    accessRequirements: string[];
  };
  
  // Alternative options
  alternatives?: string[];  // Alternative fitting IDs
  warnings?: string[];      // Installation or performance warnings
  notes?: string[];         // Additional engineering notes
}

/**
 * AI analysis configuration
 */
export interface FittingAIConfig {
  enableAdvancedAnalysis: boolean;    // Enable complex fitting analysis
  smacnaCompliance: boolean;          // Enforce SMACNA compliance
  customFabrication: boolean;         // Allow custom fabrication suggestions
  energyOptimization: boolean;        // Optimize for energy efficiency
  costOptimization: boolean;          // Consider cost in recommendations
  
  // Analysis parameters
  maxBranches: number;                // Maximum branches to analyze
  minConfidence: number;              // Minimum confidence threshold
  maxRecommendations: number;         // Maximum recommendations to return
  
  // Performance weights
  weights: {
    pressureLoss: number;             // Weight for pressure loss (0-1)
    cost: number;                     // Weight for cost considerations (0-1)
    fabrication: number;              // Weight for fabrication complexity (0-1)
    maintenance: number;              // Weight for maintenance access (0-1)
    compliance: number;               // Weight for code compliance (0-1)
  };
}

/**
 * Default AI configuration
 */
const DEFAULT_AI_CONFIG: FittingAIConfig = {
  enableAdvancedAnalysis: true,
  smacnaCompliance: true,
  customFabrication: true,
  energyOptimization: true,
  costOptimization: false,
  
  maxBranches: 6,
  minConfidence: 0.6,
  maxRecommendations: 5,
  
  weights: {
    pressureLoss: 0.3,
    cost: 0.2,
    fabrication: 0.2,
    maintenance: 0.15,
    compliance: 0.15
  }
};

/**
 * AI-powered fitting recommendation engine
 */
export class FittingAI {
  private config: FittingAIConfig;
  private knowledgeBase: Map<string, any> = new Map();
  private fittingDatabase: Map<FittingType, any> = new Map();

  constructor(config?: Partial<FittingAIConfig>) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.initializeKnowledgeBase();
    this.initializeFittingDatabase();
  }

  /**
   * Analyze fitting requirements and generate recommendations
   */
  analyzeFittingRequirements(input: FittingAnalysisInput): FittingRecommendation[] {
    // Validate input
    this.validateInput(input);

    // Analyze intersection geometry
    const geometryAnalysis = this.analyzeIntersectionGeometry(input);

    // Analyze airflow characteristics
    const airflowAnalysis = this.analyzeAirflowCharacteristics(input);

    // Generate fitting candidates
    const candidates = this.generateFittingCandidates(geometryAnalysis, airflowAnalysis, input);

    // Evaluate and rank candidates
    const evaluatedCandidates = this.evaluateFittingCandidates(candidates, input);

    // Apply AI scoring and filtering
    const recommendations = this.applyAIScoring(evaluatedCandidates, input);

    // Sort by priority and confidence
    return recommendations
      .filter(rec => rec.confidence >= this.config.minConfidence)
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.confidence - a.confidence;
      })
      .slice(0, this.config.maxRecommendations);
  }

  /**
   * Get fitting specifications for a specific type
   */
  getFittingSpecifications(fittingType: FittingType, sizing: DuctSizing[]): any {
    const specs = this.fittingDatabase.get(fittingType);
    if (!specs) {
      throw new Error(`Unknown fitting type: ${fittingType}`);
    }

    // Customize specifications based on sizing
    return this.customizeSpecifications(specs, sizing);
  }

  /**
   * Validate custom fitting design
   */
  validateCustomFitting(design: any): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate geometry
    if (design.angles?.some((angle: number) => angle < 15 || angle > 165)) {
      warnings.push('Extreme branch angles may cause excessive pressure loss');
      recommendations.push('Consider using multiple fittings for sharp turns');
    }

    // Validate sizing
    if (design.velocityRatio > 1.5) {
      warnings.push('High velocity ratio may cause noise and pressure loss');
      recommendations.push('Consider larger branch sizing');
    }

    // Validate fabrication
    if (design.fabricationComplexity === 'custom') {
      warnings.push('Custom fabrication required - verify with fabricator');
      recommendations.push('Consider standard fitting alternatives');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  /**
   * Generate fabrication instructions
   */
  generateFabricationInstructions(recommendation: FittingRecommendation): {
    materials: string[];
    tools: string[];
    steps: string[];
    drawings: string[];
    notes: string[];
  } {
    const materials: string[] = [];
    const tools: string[] = [];
    const steps: string[] = [];
    const drawings: string[] = [];
    const notes: string[] = [];

    // Generate based on fitting type and specifications
    switch (recommendation.type) {
      case 'double_wye':
        materials.push('Sheet metal (gauge ' + recommendation.specifications.dimensions.gauge + ')');
        materials.push('Reinforcement strips');
        tools.push('Plasma cutter or shears');
        tools.push('Brake press');
        tools.push('Welding equipment');
        steps.push('Cut main trunk opening');
        steps.push('Form branch connections');
        steps.push('Weld seams and reinforce');
        drawings.push('Double wye layout drawing');
        notes.push('Ensure smooth transitions for airflow');
        break;

      case 'cross':
        materials.push('Sheet metal (gauge ' + recommendation.specifications.dimensions.gauge + ')');
        materials.push('Corner reinforcements');
        tools.push('Cutting tools');
        tools.push('Forming equipment');
        steps.push('Cut intersecting openings');
        steps.push('Form cross structure');
        steps.push('Install reinforcements');
        drawings.push('Cross fitting assembly drawing');
        notes.push('Balance airflow distribution');
        break;

      case 'custom_fabrication':
        materials.push('Custom sheet metal');
        materials.push('Specialized reinforcements');
        tools.push('Custom tooling');
        tools.push('Precision cutting equipment');
        steps.push('Create custom templates');
        steps.push('Cut and form components');
        steps.push('Assemble and test fit');
        drawings.push('Custom fabrication drawings');
        notes.push('Verify dimensions before fabrication');
        break;

      default:
        materials.push('Standard sheet metal');
        tools.push('Standard HVAC tools');
        steps.push('Follow standard fabrication procedures');
        drawings.push('Standard fitting drawings');
        notes.push('Use standard SMACNA guidelines');
    }

    return { materials, tools, steps, drawings, notes };
  }

  /**
   * Update AI configuration
   */
  updateConfig(newConfig: Partial<FittingAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): FittingAIConfig {
    return { ...this.config };
  }

  /**
   * Validate analysis input
   */
  private validateInput(input: FittingAnalysisInput): void {
    if (!input.mainCenterline) {
      throw new Error('Main centerline is required');
    }

    if (!input.branchCenterlines || input.branchCenterlines.length === 0) {
      throw new Error('At least one branch centerline is required');
    }

    if (input.branchCenterlines.length > this.config.maxBranches) {
      throw new Error(`Too many branches (max: ${this.config.maxBranches})`);
    }

    if (!input.intersectionPoint) {
      throw new Error('Intersection point is required');
    }

    if (!input.airflowRates || input.airflowRates.length === 0) {
      throw new Error('Airflow rates are required');
    }

    if (!input.ductSizing || input.ductSizing.length === 0) {
      throw new Error('Duct sizing information is required');
    }
  }

  /**
   * Analyze intersection geometry
   */
  private analyzeIntersectionGeometry(input: FittingAnalysisInput): any {
    const { mainCenterline, branchCenterlines, intersectionPoint } = input;

    // Calculate branch angles
    const branchAngles = branchCenterlines.map(branch => {
      return this.calculateBranchAngle(mainCenterline, branch, intersectionPoint);
    });

    // Analyze spatial configuration
    const spatialConfig = this.analyzeSpatialConfiguration(branchCenterlines, intersectionPoint);

    // Determine complexity
    const complexity = this.determineGeometricComplexity(branchAngles, spatialConfig);

    return {
      branchCount: branchCenterlines.length,
      branchAngles,
      spatialConfig,
      complexity,
      symmetry: this.analyzeSymmetry(branchAngles),
      accessibility: this.analyzeAccessibility(input)
    };
  }

  /**
   * Analyze airflow characteristics
   */
  private analyzeAirflowCharacteristics(input: FittingAnalysisInput): any {
    const { airflowRates, systemPressure } = input;

    // Calculate flow ratios
    const totalFlow = airflowRates.reduce((sum, flow) => sum + flow.volume, 0);
    const flowRatios = airflowRates.map(flow => flow.volume / totalFlow);

    // Analyze velocity distribution
    const velocities = airflowRates.map(flow => flow.velocity);
    const maxVelocity = Math.max(...velocities);
    const velocityRatios = velocities.map(v => v / maxVelocity);

    // Determine flow balance
    const flowBalance = this.analyzeFlowBalance(flowRatios);

    return {
      totalFlow,
      flowRatios,
      velocityRatios,
      flowBalance,
      systemPressure,
      pressureRequirements: this.calculatePressureRequirements(airflowRates, systemPressure)
    };
  }

  /**
   * Generate fitting candidates based on analysis
   */
  private generateFittingCandidates(geometryAnalysis: any, airflowAnalysis: any, input: FittingAnalysisInput): FittingRecommendation[] {
    const candidates: FittingRecommendation[] = [];

    // Generate candidates based on branch count and configuration
    switch (geometryAnalysis.branchCount) {
      case 1:
        candidates.push(...this.generateSingleBranchCandidates(geometryAnalysis, airflowAnalysis, input));
        break;
      case 2:
        candidates.push(...this.generateDualBranchCandidates(geometryAnalysis, airflowAnalysis, input));
        break;
      case 3:
        candidates.push(...this.generateTripleBranchCandidates(geometryAnalysis, airflowAnalysis, input));
        break;
      case 4:
        candidates.push(...this.generateQuadBranchCandidates(geometryAnalysis, airflowAnalysis, input));
        break;
      default:
        candidates.push(...this.generateComplexBranchCandidates(geometryAnalysis, airflowAnalysis, input));
    }

    return candidates;
  }

  /**
   * Generate single branch fitting candidates
   */
  private generateSingleBranchCandidates(geometryAnalysis: any, airflowAnalysis: any, input: FittingAnalysisInput): FittingRecommendation[] {
    const candidates: FittingRecommendation[] = [];

    // Straight tee
    candidates.push(this.createFittingRecommendation('straight_tee', geometryAnalysis, airflowAnalysis, input));

    // Reducing tee (if sizes differ)
    if (this.requiresReducing(input.ductSizing)) {
      candidates.push(this.createFittingRecommendation('reducing_tee', geometryAnalysis, airflowAnalysis, input));
    }

    // Wye fitting
    candidates.push(this.createFittingRecommendation('wye', geometryAnalysis, airflowAnalysis, input));

    // Reducing wye (if sizes differ)
    if (this.requiresReducing(input.ductSizing)) {
      candidates.push(this.createFittingRecommendation('reducing_wye', geometryAnalysis, airflowAnalysis, input));
    }

    // Lateral (for angled branches)
    if (geometryAnalysis.branchAngles[0] !== 90) {
      candidates.push(this.createFittingRecommendation('lateral', geometryAnalysis, airflowAnalysis, input));
    }

    return candidates;
  }

  /**
   * Generate dual branch fitting candidates
   */
  private generateDualBranchCandidates(geometryAnalysis: any, airflowAnalysis: any, input: FittingAnalysisInput): FittingRecommendation[] {
    const candidates: FittingRecommendation[] = [];

    // Double wye
    candidates.push(this.createFittingRecommendation('double_wye', geometryAnalysis, airflowAnalysis, input));

    // Cross fitting (if branches are opposite)
    if (this.areBranchesOpposite(geometryAnalysis.branchAngles)) {
      candidates.push(this.createFittingRecommendation('cross', geometryAnalysis, airflowAnalysis, input));
    }

    // Custom fabrication for complex configurations
    if (this.config.customFabrication && geometryAnalysis.complexity === 'high') {
      candidates.push(this.createFittingRecommendation('custom_fabrication', geometryAnalysis, airflowAnalysis, input));
    }

    return candidates;
  }

  /**
   * Generate triple branch fitting candidates
   */
  private generateTripleBranchCandidates(geometryAnalysis: any, airflowAnalysis: any, input: FittingAnalysisInput): FittingRecommendation[] {
    const candidates: FittingRecommendation[] = [];

    // Custom fabrication is typically required for 3+ branches
    if (this.config.customFabrication) {
      candidates.push(this.createFittingRecommendation('custom_fabrication', geometryAnalysis, airflowAnalysis, input));
    }

    // Multiple standard fittings alternative
    candidates.push(this.createMultipleFittingRecommendation(geometryAnalysis, airflowAnalysis, input));

    return candidates;
  }

  /**
   * Generate quad branch fitting candidates
   */
  private generateQuadBranchCandidates(geometryAnalysis: any, airflowAnalysis: any, input: FittingAnalysisInput): FittingRecommendation[] {
    const candidates: FittingRecommendation[] = [];

    // Custom fabrication for complex multi-branch
    if (this.config.customFabrication) {
      candidates.push(this.createFittingRecommendation('custom_fabrication', geometryAnalysis, airflowAnalysis, input));
    }

    return candidates;
  }

  /**
   * Generate complex branch fitting candidates
   */
  private generateComplexBranchCandidates(geometryAnalysis: any, airflowAnalysis: any, input: FittingAnalysisInput): FittingRecommendation[] {
    const candidates: FittingRecommendation[] = [];

    // Only custom fabrication for 5+ branches
    if (this.config.customFabrication) {
      candidates.push(this.createFittingRecommendation('custom_fabrication', geometryAnalysis, airflowAnalysis, input));
    }

    return candidates;
  }

  /**
   * Create fitting recommendation
   */
  private createFittingRecommendation(
    type: FittingType, 
    geometryAnalysis: any, 
    airflowAnalysis: any, 
    input: FittingAnalysisInput
  ): FittingRecommendation {
    const baseSpec = this.fittingDatabase.get(type) || {};
    
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: this.getFittingName(type),
      description: this.getFittingDescription(type, geometryAnalysis, airflowAnalysis),
      confidence: this.calculateConfidence(type, geometryAnalysis, airflowAnalysis, input),
      priority: this.calculatePriority(type, geometryAnalysis, airflowAnalysis, input),
      
      specifications: this.generateSpecifications(type, geometryAnalysis, airflowAnalysis, input),
      compliance: this.evaluateCompliance(type, input),
      fabrication: this.evaluateFabrication(type, geometryAnalysis, input),
      performance: this.evaluatePerformance(type, geometryAnalysis, airflowAnalysis, input),
      installation: this.evaluateInstallation(type, geometryAnalysis, input),
      
      alternatives: this.findAlternatives(type, geometryAnalysis, airflowAnalysis),
      warnings: this.generateWarnings(type, geometryAnalysis, airflowAnalysis, input),
      notes: this.generateNotes(type, geometryAnalysis, airflowAnalysis, input)
    };
  }

  /**
   * Initialize knowledge base with HVAC fitting rules
   */
  private initializeKnowledgeBase(): void {
    // SMACNA guidelines
    this.knowledgeBase.set('smacna_pressure_loss', {
      straight_tee: 0.2,
      reducing_tee: 0.3,
      wye: 0.15,
      reducing_wye: 0.25,
      double_wye: 0.4,
      cross: 0.5,
      lateral: 0.3
    });

    // Velocity recommendations
    this.knowledgeBase.set('velocity_limits', {
      supply: { min: 800, max: 2500 },
      return: { min: 600, max: 1800 },
      exhaust: { min: 1000, max: 3000 }
    });

    // Angle recommendations
    this.knowledgeBase.set('angle_guidelines', {
      optimal_wye: 45,
      max_lateral: 60,
      min_branch: 15,
      max_branch: 165
    });
  }

  /**
   * Initialize fitting database
   */
  private initializeFittingDatabase(): void {
    // Standard fitting specifications
    this.fittingDatabase.set('straight_tee', {
      pressureLoss: 0.2,
      fabricationComplexity: 'simple',
      standardSizes: true,
      smacnaCompliant: true
    });

    this.fittingDatabase.set('wye', {
      pressureLoss: 0.15,
      fabricationComplexity: 'simple',
      standardSizes: true,
      smacnaCompliant: true
    });

    this.fittingDatabase.set('double_wye', {
      pressureLoss: 0.4,
      fabricationComplexity: 'moderate',
      standardSizes: false,
      smacnaCompliant: true
    });

    this.fittingDatabase.set('cross', {
      pressureLoss: 0.5,
      fabricationComplexity: 'moderate',
      standardSizes: false,
      smacnaCompliant: true
    });

    this.fittingDatabase.set('custom_fabrication', {
      pressureLoss: 0.3, // Variable
      fabricationComplexity: 'custom',
      standardSizes: false,
      smacnaCompliant: false // Depends on design
    });
  }

  // Helper methods for calculations and analysis
  private calculateBranchAngle(main: Centerline, branch: Centerline, intersection: Point2D): number {
    // Calculate angle between main and branch centerlines
    // Simplified implementation - would use vector math in production
    return 90; // Placeholder
  }

  private analyzeSpatialConfiguration(branches: Centerline[], intersection: Point2D): any {
    // Analyze 3D spatial configuration of branches
    return { configuration: 'standard' }; // Placeholder
  }

  private determineGeometricComplexity(angles: number[], spatial: any): 'low' | 'medium' | 'high' {
    // Determine complexity based on angles and spatial configuration
    if (angles.length <= 2 && angles.every(a => a === 90)) return 'low';
    if (angles.length <= 3) return 'medium';
    return 'high';
  }

  private analyzeSymmetry(angles: number[]): boolean {
    // Check if branch configuration is symmetric
    return angles.length === 2 && Math.abs(angles[0] - angles[1]) < 5;
  }

  private analyzeAccessibility(input: FittingAnalysisInput): 'good' | 'limited' | 'poor' {
    // Analyze maintenance accessibility
    return 'good'; // Placeholder
  }

  private analyzeFlowBalance(ratios: number[]): 'balanced' | 'unbalanced' {
    // Analyze if flow is balanced between branches
    const maxRatio = Math.max(...ratios);
    const minRatio = Math.min(...ratios);
    return (maxRatio / minRatio) < 2 ? 'balanced' : 'unbalanced';
  }

  private calculatePressureRequirements(flows: AirflowAnalysis[], pressure: SystemPressure): any {
    // Calculate pressure requirements for the fitting
    return { requirement: 'standard' }; // Placeholder
  }

  private requiresReducing(sizing: DuctSizing[]): boolean {
    // Check if different sizes require reducing fitting
    return sizing.length > 1 && !sizing.every(s => 
      s.width === sizing[0].width && s.height === sizing[0].height
    );
  }

  private areBranchesOpposite(angles: number[]): boolean {
    // Check if branches are opposite each other (for cross fitting)
    return angles.length === 2 && Math.abs(angles[0] - angles[1]) > 170;
  }

  private createMultipleFittingRecommendation(geometry: any, airflow: any, input: FittingAnalysisInput): FittingRecommendation {
    // Create recommendation for multiple standard fittings
    return this.createFittingRecommendation('straight_tee', geometry, airflow, input);
  }

  private evaluateFittingCandidates(candidates: FittingRecommendation[], input: FittingAnalysisInput): FittingRecommendation[] {
    // Evaluate and score candidates
    return candidates; // Placeholder
  }

  private applyAIScoring(candidates: FittingRecommendation[], input: FittingAnalysisInput): FittingRecommendation[] {
    // Apply AI-based scoring and ranking
    return candidates; // Placeholder
  }

  private customizeSpecifications(specs: any, sizing: DuctSizing[]): any {
    // Customize specifications based on sizing
    return specs; // Placeholder
  }

  private getFittingName(type: FittingType): string {
    const names: Record<FittingType, string> = {
      straight_tee: 'Straight Tee',
      reducing_tee: 'Reducing Tee',
      wye: 'Wye Fitting',
      reducing_wye: 'Reducing Wye',
      double_wye: 'Double Wye',
      cross: 'Cross Fitting',
      reducing_cross: 'Reducing Cross',
      lateral: 'Lateral',
      reducing_lateral: 'Reducing Lateral',
      custom_fabrication: 'Custom Fabrication',
      transition: 'Transition',
      offset: 'Offset',
      elbow: 'Elbow',
      reducer: 'Reducer'
    };
    return names[type];
  }

  private getFittingDescription(type: FittingType, geometry: any, airflow: any): string {
    // Generate description based on type and analysis
    return `${this.getFittingName(type)} for ${geometry.branchCount} branch configuration`;
  }

  private calculateConfidence(type: FittingType, geometry: any, airflow: any, input: FittingAnalysisInput): number {
    // Calculate confidence score based on analysis
    let confidence = 0.8; // Base confidence

    // Adjust based on complexity
    if (geometry.complexity === 'low') confidence += 0.1;
    if (geometry.complexity === 'high') confidence -= 0.2;

    // Adjust based on flow balance
    if (airflow.flowBalance === 'balanced') confidence += 0.1;

    // Adjust based on compliance
    if (this.config.smacnaCompliance && type !== 'custom_fabrication') confidence += 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  private calculatePriority(type: FittingType, geometry: any, airflow: any, input: FittingAnalysisInput): number {
    // Calculate priority ranking (1 = highest priority)
    let priority = 5; // Base priority

    // Prefer standard fittings
    if (['straight_tee', 'wye'].includes(type)) priority -= 2;

    // Prefer simpler solutions
    if (geometry.complexity === 'low') priority -= 1;

    // Prefer balanced flow solutions
    if (airflow.flowBalance === 'balanced') priority -= 1;

    return Math.max(1, Math.min(10, priority));
  }

  private generateSpecifications(type: FittingType, geometry: any, airflow: any, input: FittingAnalysisInput): any {
    // Generate technical specifications
    return {
      dimensions: input.ductSizing[0],
      angles: geometry.branchAngles,
      pressureLoss: this.knowledgeBase.get('smacna_pressure_loss')?.[type] || 0.3,
      velocityRatio: 1.0,
      fabricationComplexity: this.fittingDatabase.get(type)?.fabricationComplexity || 'moderate'
    };
  }

  private evaluateCompliance(type: FittingType, input: FittingAnalysisInput): any {
    // Evaluate compliance with standards
    const baseCompliance = this.fittingDatabase.get(type) || {};
    return {
      smacnaCompliant: baseCompliance.smacnaCompliant || false,
      energyEfficient: true,
      codeCompliant: true,
      standardSizes: baseCompliance.standardSizes || false
    };
  }

  private evaluateFabrication(type: FittingType, geometry: any, input: FittingAnalysisInput): any {
    // Evaluate fabrication requirements
    const complexity = this.fittingDatabase.get(type)?.fabricationComplexity || 'moderate';
    
    return {
      estimatedCost: this.calculateFabricationCost(type, geometry),
      fabricationTime: this.calculateFabricationTime(type, geometry),
      materialWaste: this.calculateMaterialWaste(type, geometry),
      customFabrication: type === 'custom_fabrication',
      toolingRequired: this.getRequiredTooling(type)
    };
  }

  private evaluatePerformance(type: FittingType, geometry: any, airflow: any, input: FittingAnalysisInput): any {
    // Evaluate performance characteristics
    return {
      pressureLoss: this.knowledgeBase.get('smacna_pressure_loss')?.[type] || 0.3,
      noiseGeneration: this.calculateNoiseGeneration(type, airflow),
      airflowDistribution: this.calculateAirflowDistribution(type, geometry, airflow),
      maintenanceAccess: this.calculateMaintenanceAccess(type, geometry)
    };
  }

  private evaluateInstallation(type: FittingType, geometry: any, input: FittingAnalysisInput): any {
    // Evaluate installation requirements
    return {
      difficulty: this.calculateInstallationDifficulty(type, geometry),
      spaceRequired: this.calculateSpaceRequirements(type, input.ductSizing[0]),
      supportRequirements: this.getSupportRequirements(type),
      accessRequirements: this.getAccessRequirements(type)
    };
  }

  private findAlternatives(type: FittingType, geometry: any, airflow: any): string[] {
    // Find alternative fitting types
    const alternatives: string[] = [];
    
    switch (type) {
      case 'straight_tee':
        alternatives.push('wye', 'reducing_tee');
        break;
      case 'wye':
        alternatives.push('straight_tee', 'lateral');
        break;
      case 'double_wye':
        alternatives.push('cross', 'custom_fabrication');
        break;
    }
    
    return alternatives;
  }

  private generateWarnings(type: FittingType, geometry: any, airflow: any, input: FittingAnalysisInput): string[] {
    const warnings: string[] = [];
    
    // Check for high pressure loss
    const pressureLoss = this.knowledgeBase.get('smacna_pressure_loss')?.[type] || 0;
    if (pressureLoss > 0.4) {
      warnings.push('High pressure loss - consider alternative fitting');
    }
    
    // Check for complex fabrication
    if (type === 'custom_fabrication') {
      warnings.push('Custom fabrication required - verify with fabricator');
    }
    
    // Check for extreme angles
    if (geometry.branchAngles?.some((angle: number) => angle < 20 || angle > 160)) {
      warnings.push('Extreme branch angles may cause turbulence');
    }
    
    return warnings;
  }

  private generateNotes(type: FittingType, geometry: any, airflow: any, input: FittingAnalysisInput): string[] {
    const notes: string[] = [];
    
    // Add SMACNA compliance notes
    if (this.config.smacnaCompliance) {
      notes.push('Design follows SMACNA guidelines');
    }
    
    // Add energy efficiency notes
    if (this.config.energyOptimization) {
      notes.push('Optimized for energy efficiency');
    }
    
    // Add fabrication notes
    if (type === 'custom_fabrication') {
      notes.push('Requires detailed fabrication drawings');
      notes.push('Verify dimensions before fabrication');
    }
    
    return notes;
  }

  // Additional helper methods for calculations
  private calculateFabricationCost(type: FittingType, geometry: any): number {
    // Calculate relative fabrication cost
    const baseCosts: Record<string, number> = {
      straight_tee: 1.0,
      wye: 1.2,
      double_wye: 2.5,
      cross: 3.0,
      custom_fabrication: 5.0
    };
    return baseCosts[type] || 2.0;
  }

  private calculateFabricationTime(type: FittingType, geometry: any): number {
    // Calculate fabrication time in hours
    const baseTimes: Record<string, number> = {
      straight_tee: 2,
      wye: 3,
      double_wye: 8,
      cross: 12,
      custom_fabrication: 20
    };
    return baseTimes[type] || 6;
  }

  private calculateMaterialWaste(type: FittingType, geometry: any): number {
    // Calculate material waste percentage
    const wasteFactors: Record<string, number> = {
      straight_tee: 10,
      wye: 15,
      double_wye: 25,
      cross: 30,
      custom_fabrication: 40
    };
    return wasteFactors[type] || 20;
  }

  private getRequiredTooling(type: FittingType): string[] {
    // Get required tooling for fabrication
    const tooling: Record<string, string[]> = {
      straight_tee: ['Shears', 'Brake', 'Welder'],
      wye: ['Shears', 'Brake', 'Welder', 'Plasma cutter'],
      double_wye: ['Shears', 'Brake', 'Welder', 'Plasma cutter', 'Forming tools'],
      cross: ['Shears', 'Brake', 'Welder', 'Plasma cutter', 'Forming tools'],
      custom_fabrication: ['Custom tooling', 'Precision equipment', 'Specialized jigs']
    };
    return tooling[type] || ['Standard HVAC tools'];
  }

  private calculateNoiseGeneration(type: FittingType, airflow: any): number {
    // Calculate noise generation in dB
    const baseNoise: Record<string, number> = {
      straight_tee: 35,
      wye: 30,
      double_wye: 45,
      cross: 50,
      custom_fabrication: 40
    };
    return baseNoise[type] || 35;
  }

  private calculateAirflowDistribution(type: FittingType, geometry: any, airflow: any): number {
    // Calculate airflow distribution quality (0-1)
    const distribution: Record<string, number> = {
      straight_tee: 0.7,
      wye: 0.9,
      double_wye: 0.6,
      cross: 0.5,
      custom_fabrication: 0.8
    };
    return distribution[type] || 0.7;
  }

  private calculateMaintenanceAccess(type: FittingType, geometry: any): number {
    // Calculate maintenance accessibility (0-1)
    const access: Record<string, number> = {
      straight_tee: 0.8,
      wye: 0.9,
      double_wye: 0.6,
      cross: 0.5,
      custom_fabrication: 0.7
    };
    return access[type] || 0.7;
  }

  private calculateInstallationDifficulty(type: FittingType, geometry: any): 'easy' | 'moderate' | 'difficult' | 'expert' {
    const difficulty: Record<string, 'easy' | 'moderate' | 'difficult' | 'expert'> = {
      straight_tee: 'easy',
      wye: 'easy',
      double_wye: 'moderate',
      cross: 'difficult',
      custom_fabrication: 'expert'
    };
    return difficulty[type] || 'moderate';
  }

  private calculateSpaceRequirements(type: FittingType, sizing: DuctSizing): DuctSizing {
    // Calculate space requirements for installation
    return {
      width: sizing.width * 1.5,
      height: sizing.height * 1.5,
      shape: sizing.shape,
      gauge: sizing.gauge
    };
  }

  private getSupportRequirements(type: FittingType): string[] {
    // Get support requirements
    const supports: Record<string, string[]> = {
      straight_tee: ['Standard hangers'],
      wye: ['Standard hangers'],
      double_wye: ['Reinforced hangers', 'Additional supports'],
      cross: ['Heavy-duty hangers', 'Multiple support points'],
      custom_fabrication: ['Custom support design']
    };
    return supports[type] || ['Standard hangers'];
  }

  private getAccessRequirements(type: FittingType): string[] {
    // Get access requirements for installation and maintenance
    const access: Record<string, string[]> = {
      straight_tee: ['Standard access'],
      wye: ['Standard access'],
      double_wye: ['Extended access', 'Lifting equipment'],
      cross: ['Full access', 'Specialized equipment'],
      custom_fabrication: ['Custom access plan']
    };
    return access[type] || ['Standard access'];
  }
}
