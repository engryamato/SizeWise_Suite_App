/**
 * Enhanced Friction Calculator
 * 
 * Comprehensive friction calculation service for Phase 3: Advanced Calculation Modules
 * Provides multiple friction factor calculation methods, material aging effects,
 * environmental corrections, and advanced features for HVAC duct systems.
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import { AirPropertiesCalculator, AirConditions } from './AirPropertiesCalculator';

/**
 * Friction calculation method options
 */
export enum FrictionMethod {
  COLEBROOK_WHITE = 'colebrook_white',
  MOODY = 'moody',
  SWAMEE_JAIN = 'swamee_jain',
  HAALAND = 'haaland',
  CHEN = 'chen',
  ZIGRANG_SYLVESTER = 'zigrang_sylvester',
  ENHANCED_DARCY = 'enhanced_darcy'
}

/**
 * Flow regime classification
 */
export enum FlowRegime {
  LAMINAR = 'laminar',
  TRANSITIONAL = 'transitional',
  TURBULENT_SMOOTH = 'turbulent_smooth',
  TURBULENT_ROUGH = 'turbulent_rough',
  FULLY_ROUGH = 'fully_rough'
}

/**
 * Material aging condition
 */
export enum MaterialAge {
  NEW = 'new',
  GOOD = 'good',
  AVERAGE = 'average',
  POOR = 'poor',
  VERY_POOR = 'very_poor'
}

/**
 * Surface condition classification
 */
export enum SurfaceCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  AVERAGE = 'average',
  POOR = 'poor',
  VERY_POOR = 'very_poor'
}

/**
 * Enhanced friction calculation input parameters
 */
export interface FrictionCalculationInput {
  velocity: number;                    // FPM
  hydraulicDiameter: number;           // inches
  length: number;                      // feet
  material: string;                    // Material type
  method?: FrictionMethod;             // Calculation method
  airConditions?: AirConditions;       // Environmental conditions
  materialAge?: MaterialAge;           // Material aging condition
  surfaceCondition?: SurfaceCondition; // Surface condition
  customRoughness?: number;            // Custom roughness value (feet)
  ductShape?: 'round' | 'rectangular' | 'oval'; // Duct shape
  aspectRatio?: number;                // For rectangular ducts (width/height)
  correctionFactors?: {
    installation: number;              // Installation quality factor
    maintenance: number;               // Maintenance factor
    environmental: number;             // Environmental exposure factor
  };
  validationLevel?: 'none' | 'basic' | 'standard' | 'strict';
}

/**
 * Enhanced friction calculation result
 */
export interface FrictionCalculationResult {
  frictionLoss: number;                // inches w.g.
  frictionFactor: number;              // Darcy friction factor
  frictionRate: number;                // inches w.g. per 100 feet
  method: FrictionMethod;              // Method used
  flowRegime: FlowRegime;              // Flow regime classification
  reynoldsNumber: number;              // Reynolds number
  relativeRoughness: number;           // Relative roughness (ε/D)
  materialProperties: {
    baseRoughness: number;             // Base material roughness (feet)
    adjustedRoughness: number;         // Adjusted for aging/condition (feet)
    agingFactor: number;               // Aging adjustment factor
    surfaceFactor: number;             // Surface condition factor
    combinedFactor: number;            // Combined adjustment factor
  };
  environmentalCorrections: {
    temperature: number;               // Temperature correction factor
    pressure: number;                  // Pressure correction factor
    humidity: number;                  // Humidity correction factor
    combined: number;                  // Combined environmental factor
  };
  accuracy: number;                    // Estimated accuracy (0-1)
  uncertaintyBounds?: {
    lower: number;                     // Lower bound (inches w.g.)
    upper: number;                     // Upper bound (inches w.g.)
    confidenceLevel: number;           // Confidence level (0-1)
  };
  warnings: string[];
  recommendations: string[];
  calculationDetails: {
    formula: string;                   // Formula used
    iterations?: number;               // Number of iterations (for iterative methods)
    convergence?: number;              // Convergence criteria achieved
    intermediateValues: Record<string, number>;
    standardReference: string;         // Reference standard
  };
}

/**
 * Enhanced Friction Calculator
 * 
 * Comprehensive friction calculation service providing multiple calculation methods,
 * material aging effects, environmental corrections, and advanced features.
 */
export class EnhancedFrictionCalculator {
  private static readonly VERSION = '3.0.0';
  
  // Standard air properties at 70°F, sea level
  private static readonly STANDARD_AIR = {
    density: 0.075,      // lb/ft³
    viscosity: 1.2e-5    // lb/(ft·s)
  };

  // Reynolds number transition points
  private static readonly REYNOLDS_TRANSITIONS = {
    LAMINAR_MAX: 2300,
    TRANSITIONAL_MAX: 4000,
    TURBULENT_MIN: 4000
  };

  // Method accuracy estimates
  private static readonly METHOD_ACCURACY = {
    [FrictionMethod.COLEBROOK_WHITE]: 0.98,
    [FrictionMethod.MOODY]: 0.95,
    [FrictionMethod.SWAMEE_JAIN]: 0.96,
    [FrictionMethod.HAALAND]: 0.97,
    [FrictionMethod.CHEN]: 0.96,
    [FrictionMethod.ZIGRANG_SYLVESTER]: 0.97,
    [FrictionMethod.ENHANCED_DARCY]: 0.99
  };

  // Material aging factors
  private static readonly AGING_FACTORS = {
    [MaterialAge.NEW]: 1.0,
    [MaterialAge.GOOD]: 1.2,
    [MaterialAge.AVERAGE]: 1.5,
    [MaterialAge.POOR]: 2.0,
    [MaterialAge.VERY_POOR]: 3.0
  };

  // Surface condition factors
  private static readonly SURFACE_FACTORS = {
    [SurfaceCondition.EXCELLENT]: 0.8,
    [SurfaceCondition.GOOD]: 1.0,
    [SurfaceCondition.AVERAGE]: 1.3,
    [SurfaceCondition.POOR]: 1.7,
    [SurfaceCondition.VERY_POOR]: 2.5
  };

  /**
   * Calculate enhanced friction loss with comprehensive corrections
   */
  public static calculateFrictionLoss(input: FrictionCalculationInput): FrictionCalculationResult {
    const {
      velocity,
      hydraulicDiameter,
      length,
      material,
      method = FrictionMethod.ENHANCED_DARCY,
      airConditions,
      materialAge = MaterialAge.GOOD,
      surfaceCondition = SurfaceCondition.GOOD,
      customRoughness,
      ductShape = 'round',
      aspectRatio,
      correctionFactors,
      validationLevel = 'standard'
    } = input;

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate inputs
    this.validateInputs(input, validationLevel, warnings);

    // Get air properties
    const airProps = airConditions ? 
      AirPropertiesCalculator.calculateAirProperties(airConditions) :
      { 
        density: this.STANDARD_AIR.density, 
        viscosity: this.STANDARD_AIR.viscosity,
        warnings: []
      };
    
    warnings.push(...airProps.warnings);

    // Calculate Reynolds number
    const velocityFps = velocity / 60; // Convert FPM to fps
    const diameterFt = hydraulicDiameter / 12; // Convert inches to feet
    const reynoldsNumber = (airProps.density * velocityFps * diameterFt) / airProps.viscosity;

    // Determine flow regime
    const flowRegime = this.classifyFlowRegime(reynoldsNumber);

    // Get material properties
    const materialProperties = this.getMaterialProperties(
      material,
      materialAge,
      surfaceCondition,
      customRoughness,
      warnings
    );

    // Calculate relative roughness
    const relativeRoughness = materialProperties.adjustedRoughness / diameterFt;

    // Calculate friction factor using specified method
    const frictionFactor = this.calculateFrictionFactor(
      method,
      reynoldsNumber,
      relativeRoughness,
      flowRegime,
      warnings
    );

    // Calculate environmental corrections
    const environmentalCorrections = this.calculateEnvironmentalCorrections(
      airConditions,
      airProps.density
    );

    // Apply shape corrections for non-round ducts
    const shapeCorrection = this.calculateShapeCorrection(ductShape, aspectRatio);

    // Apply additional correction factors
    const additionalCorrections = this.calculateAdditionalCorrections(correctionFactors);

    // Calculate friction loss using Darcy-Weisbach equation
    const baseFrictionLoss = frictionFactor * (length / diameterFt) * 
                            (airProps.density * Math.pow(velocityFps, 2)) / (2 * 32.174);

    // Apply all corrections
    const totalCorrection = environmentalCorrections.combined * shapeCorrection * additionalCorrections;
    const correctedFrictionLoss = (baseFrictionLoss / 5.2) * totalCorrection; // Convert to inches w.g.

    // Calculate friction rate
    const frictionRate = (correctedFrictionLoss / length) * 100; // inches w.g. per 100 feet

    // Calculate uncertainty bounds
    const uncertaintyBounds = this.calculateUncertaintyBounds(
      correctedFrictionLoss,
      method,
      flowRegime,
      relativeRoughness
    );

    // Generate recommendations
    this.generateRecommendations(
      velocity,
      reynoldsNumber,
      frictionRate,
      materialProperties,
      recommendations
    );

    return {
      frictionLoss: correctedFrictionLoss,
      frictionFactor,
      frictionRate,
      method,
      flowRegime,
      reynoldsNumber,
      relativeRoughness,
      materialProperties,
      environmentalCorrections,
      accuracy: this.METHOD_ACCURACY[method],
      uncertaintyBounds,
      warnings,
      recommendations,
      calculationDetails: {
        formula: this.getFormulaDescription(method),
        intermediateValues: {
          baseFrictionLoss,
          totalCorrection,
          velocityFps,
          diameterFt
        },
        standardReference: this.getStandardReference(method)
      }
    };
  }

  /**
   * Get optimal friction calculation method for given conditions
   */
  public static getOptimalMethod(
    reynoldsNumber: number,
    relativeRoughness: number,
    accuracy: 'standard' | 'high' | 'maximum' = 'standard'
  ): FrictionMethod {
    // For laminar flow
    if (reynoldsNumber < this.REYNOLDS_TRANSITIONS.LAMINAR_MAX) {
      return FrictionMethod.ENHANCED_DARCY; // Uses analytical solution for laminar flow
    }

    // For turbulent flow, choose based on accuracy requirements
    if (accuracy === 'maximum') {
      return FrictionMethod.COLEBROOK_WHITE; // Most accurate but iterative
    }

    if (accuracy === 'high') {
      return FrictionMethod.HAALAND; // Good accuracy, explicit
    }

    // For standard accuracy, choose based on relative roughness
    if (relativeRoughness < 0.001) {
      return FrictionMethod.SWAMEE_JAIN; // Good for smooth pipes
    } else {
      return FrictionMethod.CHEN; // Good for rough pipes
    }
  }

  /**
   * Validate input parameters
   */
  private static validateInputs(
    input: FrictionCalculationInput,
    validationLevel: string,
    warnings: string[]
  ): void {
    if (validationLevel === 'none') return;

    const { velocity, hydraulicDiameter, length } = input;

    // Basic validation
    if (velocity <= 0) throw new Error('Velocity must be positive');
    if (hydraulicDiameter <= 0) throw new Error('Hydraulic diameter must be positive');
    if (length <= 0) throw new Error('Length must be positive');

    if (validationLevel === 'basic') return;

    // Standard validation
    if (velocity > 6000) {
      warnings.push('High velocity may cause noise and energy efficiency issues');
    }
    if (velocity < 300) {
      warnings.push('Low velocity may indicate oversized ductwork');
    }

    if (validationLevel === 'strict') {
      // Strict validation
      if (hydraulicDiameter < 4 || hydraulicDiameter > 120) {
        warnings.push('Hydraulic diameter outside typical HVAC range (4-120 inches)');
      }
      if (length > 1000) {
        warnings.push('Very long duct run - consider intermediate pressure calculations');
      }
    }
  }

  /**
   * Classify flow regime based on Reynolds number
   */
  private static classifyFlowRegime(reynoldsNumber: number): FlowRegime {
    if (reynoldsNumber < this.REYNOLDS_TRANSITIONS.LAMINAR_MAX) {
      return FlowRegime.LAMINAR;
    } else if (reynoldsNumber < this.REYNOLDS_TRANSITIONS.TRANSITIONAL_MAX) {
      return FlowRegime.TRANSITIONAL;
    } else if (reynoldsNumber < 100000) {
      return FlowRegime.TURBULENT_SMOOTH;
    } else if (reynoldsNumber < 1000000) {
      return FlowRegime.TURBULENT_ROUGH;
    } else {
      return FlowRegime.FULLY_ROUGH;
    }
  }

  /**
   * Get material properties with aging and surface condition adjustments
   */
  private static getMaterialProperties(
    material: string,
    materialAge: MaterialAge,
    surfaceCondition: SurfaceCondition,
    customRoughness?: number,
    warnings: string[] = []
  ) {
    let baseRoughness: number;

    if (customRoughness !== undefined) {
      baseRoughness = customRoughness;
    } else {
      // Get base roughness from material database
      try {
        const materialData = AirPropertiesCalculator.getEnhancedMaterialRoughness(
          material,
          materialAge,
          surfaceCondition
        );
        baseRoughness = materialData.adjustedRoughness;
        warnings.push(...materialData.warnings);
      } catch (error) {
        // Fallback to default values
        baseRoughness = this.getDefaultRoughness(material);
        warnings.push(`Using default roughness for material: ${material}`);
      }
    }

    const agingFactor = this.AGING_FACTORS[materialAge];
    const surfaceFactor = this.SURFACE_FACTORS[surfaceCondition];
    const combinedFactor = agingFactor * surfaceFactor;
    const adjustedRoughness = baseRoughness * combinedFactor;

    return {
      baseRoughness,
      adjustedRoughness,
      agingFactor,
      surfaceFactor,
      combinedFactor
    };
  }

  /**
   * Get default roughness values for common materials
   */
  private static getDefaultRoughness(material: string): number {
    const defaultRoughness: Record<string, number> = {
      'galvanized_steel': 0.0005,
      'stainless_steel': 0.00015,
      'aluminum': 0.00015,
      'pvc': 0.000005,
      'fiberglass': 0.0003,
      'concrete': 0.003,
      'cast_iron': 0.00085,
      'flexible_duct': 0.003
    };

    return defaultRoughness[material] || 0.0005; // Default to galvanized steel
  }

  /**
   * Calculate friction factor using specified method
   */
  private static calculateFrictionFactor(
    method: FrictionMethod,
    reynoldsNumber: number,
    relativeRoughness: number,
    flowRegime: FlowRegime,
    warnings: string[]
  ): number {
    // For laminar flow, use analytical solution regardless of method
    if (flowRegime === FlowRegime.LAMINAR) {
      return 64 / reynoldsNumber;
    }

    switch (method) {
      case FrictionMethod.COLEBROOK_WHITE:
        return this.colebrookWhite(reynoldsNumber, relativeRoughness);
        
      case FrictionMethod.MOODY:
        return this.moodyApproximation(reynoldsNumber, relativeRoughness);
        
      case FrictionMethod.SWAMEE_JAIN:
        return this.swameeJain(reynoldsNumber, relativeRoughness);
        
      case FrictionMethod.HAALAND:
        return this.haaland(reynoldsNumber, relativeRoughness);
        
      case FrictionMethod.CHEN:
        return this.chen(reynoldsNumber, relativeRoughness);
        
      case FrictionMethod.ZIGRANG_SYLVESTER:
        return this.zigrangSylvester(reynoldsNumber, relativeRoughness);
        
      case FrictionMethod.ENHANCED_DARCY:
        return this.enhancedDarcy(reynoldsNumber, relativeRoughness, flowRegime);
        
      default:
        warnings.push(`Unknown method ${method}, using Colebrook-White`);
        return this.colebrookWhite(reynoldsNumber, relativeRoughness);
    }
  }

  /**
   * Colebrook-White equation (iterative solution)
   */
  private static colebrookWhite(reynoldsNumber: number, relativeRoughness: number): number {
    let f = 0.02; // Initial guess
    
    for (let i = 0; i < 20; i++) {
      const fNew = 1 / Math.pow(-2 * Math.log10(
        relativeRoughness / 3.7 + 2.51 / (reynoldsNumber * Math.sqrt(f))
      ), 2);
      
      if (Math.abs(fNew - f) < 0.0001) {
        break;
      }
      f = fNew;
    }
    
    return f;
  }

  /**
   * Swamee-Jain approximation
   */
  private static swameeJain(reynoldsNumber: number, relativeRoughness: number): number {
    const numerator = Math.pow(Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(reynoldsNumber, 0.9)), 2);
    return 0.25 / numerator;
  }

  /**
   * Haaland approximation
   */
  private static haaland(reynoldsNumber: number, relativeRoughness: number): number {
    const term1 = relativeRoughness / 3.7;
    const term2 = 6.9 / reynoldsNumber;
    return 1 / Math.pow(-1.8 * Math.log10(Math.pow(term1, 1.11) + term2), 2);
  }

  /**
   * Chen approximation
   */
  private static chen(reynoldsNumber: number, relativeRoughness: number): number {
    const A = Math.pow(Math.log10(relativeRoughness / 3.7065 - 5.0452 / reynoldsNumber * 
                      Math.log10(Math.pow(relativeRoughness, 1.1098) / 2.8257 + 
                      Math.pow(7.149 / reynoldsNumber, 0.8981))), 2);
    return 1 / (4 * A);
  }

  /**
   * Zigrang-Sylvester approximation
   */
  private static zigrangSylvester(reynoldsNumber: number, relativeRoughness: number): number {
    const A = -2 * Math.log10(relativeRoughness / 3.7 + 5.02 / reynoldsNumber * 
              Math.log10(relativeRoughness / 3.7 + 5.02 / reynoldsNumber * 
              Math.log10(relativeRoughness / 3.7 + 13 / reynoldsNumber)));
    return 1 / Math.pow(A, 2);
  }

  /**
   * Moody diagram approximation
   */
  private static moodyApproximation(reynoldsNumber: number, relativeRoughness: number): number {
    // Simplified Moody approximation
    if (relativeRoughness < 0.0001) {
      // Smooth pipe approximation
      return 0.316 / Math.pow(reynoldsNumber, 0.25);
    } else {
      // Rough pipe approximation
      return this.swameeJain(reynoldsNumber, relativeRoughness);
    }
  }

  /**
   * Enhanced Darcy method with flow regime optimization
   */
  private static enhancedDarcy(
    reynoldsNumber: number, 
    relativeRoughness: number, 
    flowRegime: FlowRegime
  ): number {
    switch (flowRegime) {
      case FlowRegime.LAMINAR:
        return 64 / reynoldsNumber;
        
      case FlowRegime.TRANSITIONAL:
        // Interpolate between laminar and turbulent
        const fLaminar = 64 / reynoldsNumber;
        const fTurbulent = this.colebrookWhite(4000, relativeRoughness);
        const weight = (reynoldsNumber - 2300) / (4000 - 2300);
        return fLaminar * (1 - weight) + fTurbulent * weight;
        
      case FlowRegime.TURBULENT_SMOOTH:
        return this.haaland(reynoldsNumber, relativeRoughness);
        
      case FlowRegime.TURBULENT_ROUGH:
      case FlowRegime.FULLY_ROUGH:
        return this.colebrookWhite(reynoldsNumber, relativeRoughness);
        
      default:
        return this.colebrookWhite(reynoldsNumber, relativeRoughness);
    }
  }

  /**
   * Calculate environmental corrections
   */
  private static calculateEnvironmentalCorrections(
    airConditions?: AirConditions,
    airDensity?: number
  ) {
    const corrections = {
      temperature: 1.0,
      pressure: 1.0,
      humidity: 1.0,
      combined: 1.0
    };

    if (airDensity) {
      const densityRatio = airDensity / this.STANDARD_AIR.density;
      corrections.temperature = densityRatio;
      corrections.pressure = densityRatio;
      corrections.humidity = densityRatio;
      corrections.combined = densityRatio;
    }

    return corrections;
  }

  /**
   * Calculate shape correction for non-round ducts
   */
  private static calculateShapeCorrection(
    ductShape: string,
    aspectRatio?: number
  ): number {
    if (ductShape === 'round') {
      return 1.0;
    }

    if (ductShape === 'rectangular' && aspectRatio) {
      // Correction for rectangular ducts based on aspect ratio
      if (aspectRatio <= 1.5) return 1.0;
      if (aspectRatio <= 2.0) return 1.05;
      if (aspectRatio <= 3.0) return 1.10;
      if (aspectRatio <= 4.0) return 1.15;
      return 1.20; // High aspect ratio penalty
    }

    return 1.05; // Default correction for non-round shapes
  }

  /**
   * Calculate additional correction factors
   */
  private static calculateAdditionalCorrections(
    correctionFactors?: FrictionCalculationInput['correctionFactors']
  ): number {
    if (!correctionFactors) return 1.0;

    const { installation = 1.0, maintenance = 1.0, environmental = 1.0 } = correctionFactors;
    return installation * maintenance * environmental;
  }

  /**
   * Calculate uncertainty bounds
   */
  private static calculateUncertaintyBounds(
    frictionLoss: number,
    method: FrictionMethod,
    flowRegime: FlowRegime,
    relativeRoughness: number
  ) {
    let baseAccuracy = this.METHOD_ACCURACY[method];

    // Adjust accuracy based on flow regime
    if (flowRegime === FlowRegime.TRANSITIONAL) {
      baseAccuracy *= 0.9; // Reduced accuracy in transitional regime
    }

    // Adjust accuracy based on relative roughness
    if (relativeRoughness > 0.05) {
      baseAccuracy *= 0.95; // Reduced accuracy for very rough surfaces
    }

    const uncertainty = frictionLoss * (1 - baseAccuracy);

    return {
      lower: frictionLoss - uncertainty,
      upper: frictionLoss + uncertainty,
      confidenceLevel: baseAccuracy
    };
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    velocity: number,
    reynoldsNumber: number,
    frictionRate: number,
    materialProperties: any,
    recommendations: string[]
  ): void {
    // Velocity recommendations
    if (velocity > 4000) {
      recommendations.push('High velocity detected - consider larger duct size to reduce friction and noise');
    }

    // Friction rate recommendations
    if (frictionRate > 0.15) {
      recommendations.push('High friction rate - consider smoother materials or larger ducts');
    }

    // Material recommendations
    if (materialProperties.combinedFactor > 2.0) {
      recommendations.push('Material aging/condition significantly affects friction - consider cleaning or replacement');
    }

    // Flow regime recommendations
    if (reynoldsNumber < 4000) {
      recommendations.push('Low Reynolds number - verify velocity calculations and consider system optimization');
    }
  }

  /**
   * Get formula description for the method
   */
  private static getFormulaDescription(method: FrictionMethod): string {
    const descriptions: Record<FrictionMethod, string> = {
      [FrictionMethod.COLEBROOK_WHITE]: '1/√f = -2log₁₀(ε/3.7D + 2.51/(Re√f))',
      [FrictionMethod.MOODY]: 'Moody diagram approximation',
      [FrictionMethod.SWAMEE_JAIN]: 'f = 0.25/[log₁₀(ε/3.7D + 5.74/Re^0.9)]²',
      [FrictionMethod.HAALAND]: '1/√f = -1.8log₁₀[(ε/3.7D)^1.11 + 6.9/Re]',
      [FrictionMethod.CHEN]: 'Chen explicit approximation',
      [FrictionMethod.ZIGRANG_SYLVESTER]: 'Zigrang-Sylvester explicit approximation',
      [FrictionMethod.ENHANCED_DARCY]: 'Flow regime optimized Darcy-Weisbach'
    };

    return descriptions[method] || 'Unknown method';
  }

  /**
   * Get standard reference for the method
   */
  private static getStandardReference(method: FrictionMethod): string {
    return 'ASHRAE Fundamentals, Chapter 21 - Duct Design';
  }
}
