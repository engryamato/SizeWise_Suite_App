/**
 * SystemPressureCalculator - Modular calculation service for complete HVAC system pressure analysis
 * 
 * MISSION-CRITICAL: Pure TypeScript functions for system-level pressure drop calculations
 * Combines friction losses (straight runs) with minor losses (fittings) for complete system analysis
 * 
 * @see docs/implementation/duct-physics/system-pressure-calculations.md
 * @see backend/services/calculations/AirDuctCalculator.ts
 * @see backend/services/calculations/FittingLossCalculator.ts
 */

import { AirDuctCalculator, DuctSizingInputs } from './AirDuctCalculator';
import { FittingLossCalculator, FittingConfiguration, FittingLossResult } from './FittingLossCalculator';
import { AirPropertiesCalculator, AirConditions, AirProperties, VelocityPressureParams } from './AirPropertiesCalculator';

/**
 * Duct segment for system calculations
 */
export interface DuctSegment {
  id: string;
  type: 'straight' | 'fitting';
  ductShape: 'round' | 'rectangular';
  
  // Geometry
  length?: number; // feet (for straight segments)
  diameter?: number; // inches (for round ducts)
  width?: number; // inches (for rectangular ducts)
  height?: number; // inches (for rectangular ducts)
  
  // Flow properties
  airflow: number; // CFM
  material: string; // e.g., 'galvanized_steel'
  
  // Fitting properties (for fitting segments)
  fittingConfig?: FittingConfiguration;
  
  // Environmental conditions
  elevation?: number; // feet (for elevation pressure calculations)
  temperature?: number; // °F (for air density corrections)
  humidity?: number; // % RH (for air density corrections)
  pressure?: number; // in Hg (for air density corrections)

  // Material aging and condition
  materialAge?: number; // years (for roughness corrections)
  surfaceCondition?: 'excellent' | 'good' | 'fair' | 'poor'; // for roughness corrections

  notes?: string;
}

/**
 * System calculation inputs
 */
export interface SystemCalculationInputs {
  segments: DuctSegment[];
  systemType: 'supply' | 'return' | 'exhaust';
  designConditions: {
    temperature: number; // °F
    barometricPressure: number; // in Hg
    altitude: number; // feet above sea level
  };
  calculationOptions: {
    includeElevationEffects: boolean;
    includeTemperatureEffects: boolean;
    frictionMethod: 'darcy_weisbach' | 'colebrook_white';
    roundingPrecision: number; // decimal places
  };
}

/**
 * Segment calculation result
 */
export interface SegmentResult {
  segmentId: string;
  segmentType: 'straight' | 'fitting';
  
  // Flow properties
  velocity: number; // FPM
  velocityPressure: number; // inches w.g.
  reynoldsNumber?: number;
  
  // Pressure losses
  frictionLoss: number; // inches w.g. (for straight segments)
  minorLoss: number; // inches w.g. (for fitting segments)
  totalLoss: number; // inches w.g.
  
  // Additional data
  frictionFactor?: number;
  kFactor?: number;
  fittingDetails?: FittingLossResult;
  
  // Validation
  warnings: string[];
  recommendations: string[];
}

/**
 * System calculation result
 */
export interface SystemCalculationResult {
  // Summary
  totalPressureLoss: number; // inches w.g.
  totalFrictionLoss: number; // inches w.g.
  totalMinorLoss: number; // inches w.g.
  
  // System properties
  totalLength: number; // feet
  averageVelocity: number; // FPM
  maxVelocity: number; // FPM
  minVelocity: number; // FPM
  
  // Detailed results
  segmentResults: SegmentResult[];
  
  // System validation
  systemWarnings: string[];
  systemRecommendations: string[];
  complianceStatus: {
    velocityCompliant: boolean;
    pressureCompliant: boolean;
    smacnaCompliant: boolean;
  };
  
  // Calculation metadata
  calculationMethod: string;
  calculationDate: Date;
  designConditions: SystemCalculationInputs['designConditions'];
}

/**
 * SystemPressureCalculator - Pure calculation functions for system pressure analysis
 * CRITICAL: No dependencies on UI, storage, or external services
 */
export class SystemPressureCalculator {
  
  // SMACNA system pressure limits (inches w.g.)
  private static readonly SYSTEM_PRESSURE_LIMITS = {
    supply: { max: 6.0, recommended: 4.0 },
    return: { max: 4.0, recommended: 2.5 },
    exhaust: { max: 8.0, recommended: 5.0 }
  };

  // SMACNA velocity limits by system type (FPM)
  private static readonly SYSTEM_VELOCITY_LIMITS = {
    supply: { min: 400, max: 2500, recommended: 1500 },
    return: { min: 300, max: 2000, recommended: 1200 },
    exhaust: { min: 500, max: 3000, recommended: 1800 }
  };

  /**
   * Calculate complete system pressure drop
   */
  public static calculateSystemPressure(inputs: SystemCalculationInputs): SystemCalculationResult {
    const { segments, systemType, designConditions, calculationOptions } = inputs;
    
    // Validate inputs
    this.validateSystemInputs(inputs);
    
    // Calculate air density for design conditions
    const airDensity = this.calculateAirDensity(designConditions);
    
    // Process each segment
    const segmentResults: SegmentResult[] = [];
    let totalFrictionLoss = 0;
    let totalMinorLoss = 0;
    let totalLength = 0;
    const velocities: number[] = [];
    
    for (const segment of segments) {
      const segmentResult = this.calculateSegmentPressure(segment, airDensity, calculationOptions);
      segmentResults.push(segmentResult);
      
      totalFrictionLoss += segmentResult.frictionLoss;
      totalMinorLoss += segmentResult.minorLoss;
      
      if (segment.length) {
        totalLength += segment.length;
      }
      
      velocities.push(segmentResult.velocity);
    }
    
    const totalPressureLoss = totalFrictionLoss + totalMinorLoss;
    
    // Calculate system statistics
    const averageVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const maxVelocity = Math.max(...velocities);
    const minVelocity = Math.min(...velocities);
    
    // System validation
    const validation = this.validateSystemResults({
      totalPressureLoss,
      averageVelocity,
      maxVelocity,
      minVelocity,
      systemType,
      segmentResults
    });
    
    return {
      totalPressureLoss: this.roundToPrecision(totalPressureLoss, calculationOptions.roundingPrecision),
      totalFrictionLoss: this.roundToPrecision(totalFrictionLoss, calculationOptions.roundingPrecision),
      totalMinorLoss: this.roundToPrecision(totalMinorLoss, calculationOptions.roundingPrecision),
      totalLength,
      averageVelocity: this.roundToPrecision(averageVelocity, calculationOptions.roundingPrecision),
      maxVelocity: this.roundToPrecision(maxVelocity, calculationOptions.roundingPrecision),
      minVelocity: this.roundToPrecision(minVelocity, calculationOptions.roundingPrecision),
      segmentResults,
      systemWarnings: validation.warnings,
      systemRecommendations: validation.recommendations,
      complianceStatus: validation.compliance,
      calculationMethod: `${calculationOptions.frictionMethod}_with_fitting_losses`,
      calculationDate: new Date(),
      designConditions
    };
  }

  /**
   * Calculate pressure drop for a single segment
   */
  private static calculateSegmentPressure(
    segment: DuctSegment,
    airDensity: number,
    options: SystemCalculationInputs['calculationOptions']
  ): SegmentResult {
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Calculate velocity and velocity pressure
    const area = this.calculateDuctArea(segment);
    const velocity = segment.airflow / area; // FPM
    const velocityPressure = FittingLossCalculator.calculateVelocityPressure({ velocity, airDensity });
    
    let frictionLoss = 0;
    let minorLoss = 0;
    let reynoldsNumber: number | undefined;
    let frictionFactor: number | undefined;
    let kFactor: number | undefined;
    let fittingDetails: FittingLossResult | undefined;
    
    if (segment.type === 'straight' && segment.length) {
      // Calculate friction loss for straight segment
      const ductInputs: DuctSizingInputs = {
        airflow: segment.airflow,
        ductType: segment.ductShape,
        frictionRate: 0.08, // Will be recalculated
        units: 'imperial',
        material: segment.material
      };
      
      // Use existing AirDuctCalculator for friction calculations
      const diameter = segment.diameter || this.calculateEquivalentDiameter(segment.width!, segment.height!);
      frictionLoss = this.calculateFrictionLoss(velocity, segment.length, diameter, segment.material, airDensity);
      
      // Calculate Reynolds number and friction factor for reference
      reynoldsNumber = this.calculateReynoldsNumber(velocity, diameter, airDensity);
      frictionFactor = this.calculateFrictionFactor(reynoldsNumber, segment.material, diameter);
      
    } else if (segment.type === 'fitting' && segment.fittingConfig) {
      // Calculate minor loss for fitting
      fittingDetails = FittingLossCalculator.calculateFittingLoss(
        segment.fittingConfig,
        velocity,
        airDensity
      );
      
      minorLoss = fittingDetails.pressureLoss;
      kFactor = fittingDetails.kFactor;
      warnings.push(...fittingDetails.warnings);
      recommendations.push(...fittingDetails.recommendations);
    }
    
    const totalLoss = frictionLoss + minorLoss;
    
    // Segment-level validation
    if (velocity > 3000) {
      warnings.push(`High velocity (${velocity.toFixed(0)} FPM) may cause noise issues`);
      recommendations.push('Consider increasing duct size to reduce velocity');
    }
    
    if (velocity < 300) {
      warnings.push(`Low velocity (${velocity.toFixed(0)} FPM) may cause poor air distribution`);
      recommendations.push('Consider decreasing duct size to increase velocity');
    }
    
    return {
      segmentId: segment.id,
      segmentType: segment.type,
      velocity: this.roundToPrecision(velocity, options.roundingPrecision),
      velocityPressure: this.roundToPrecision(velocityPressure, options.roundingPrecision),
      reynoldsNumber,
      frictionLoss: this.roundToPrecision(frictionLoss, options.roundingPrecision),
      minorLoss: this.roundToPrecision(minorLoss, options.roundingPrecision),
      totalLoss: this.roundToPrecision(totalLoss, options.roundingPrecision),
      frictionFactor,
      kFactor,
      fittingDetails,
      warnings,
      recommendations
    };
  }

  /**
   * Calculate duct cross-sectional area
   */
  private static calculateDuctArea(segment: DuctSegment): number {
    if (segment.ductShape === 'round' && segment.diameter) {
      return Math.PI * Math.pow(segment.diameter / 12, 2) / 4; // sq ft
    } else if (segment.ductShape === 'rectangular' && segment.width && segment.height) {
      return (segment.width * segment.height) / 144; // sq ft
    }
    
    throw new Error(`Invalid duct geometry for segment ${segment.id}`);
  }

  /**
   * Calculate equivalent diameter for rectangular ducts
   */
  private static calculateEquivalentDiameter(width: number, height: number): number {
    // Equivalent diameter formula: De = 1.30 * (a*b)^0.625 / (a+b)^0.25
    return 1.30 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
  }

  /**
   * Calculate air density based on design conditions
   */
  private static calculateAirDensity(conditions: SystemCalculationInputs['designConditions']): number {
    const { temperature, barometricPressure, altitude } = conditions;
    
    // Standard air density at 70°F, 29.92 in Hg, sea level
    const standardDensity = 0.075; // lb/ft³
    
    // Temperature correction (assuming ideal gas)
    const tempRatio = (459.67 + 70) / (459.67 + temperature);
    
    // Pressure correction
    const pressureRatio = barometricPressure / 29.92;
    
    // Altitude correction (approximate)
    const altitudeRatio = Math.exp(-altitude / 26000);
    
    return standardDensity * tempRatio * pressureRatio * altitudeRatio;
  }

  /**
   * Calculate friction loss using Darcy-Weisbach equation
   */
  private static calculateFrictionLoss(
    velocity: number,
    length: number,
    diameter: number,
    material: string,
    airDensity: number
  ): number {
    // Use AirDuctCalculator's existing method but adjust for air density
    const standardLoss = AirDuctCalculator['calculatePressureLoss'](velocity, length, diameter, material);
    const densityRatio = airDensity / 0.075;
    return standardLoss * densityRatio;
  }

  /**
   * Calculate Reynolds number
   */
  private static calculateReynoldsNumber(velocity: number, diameter: number, airDensity: number): number {
    const velocityFps = velocity / 60; // FPM to FPS
    const diameterFt = diameter / 12; // inches to feet
    const kinematicViscosity = 1.57e-4; // ft²/s at standard conditions
    
    return (velocityFps * diameterFt) / kinematicViscosity;
  }

  /**
   * Calculate friction factor
   */
  private static calculateFrictionFactor(reynolds: number, material: string, diameter: number): number {
    // Use AirDuctCalculator's existing method
    return AirDuctCalculator['calculateFrictionFactor'](reynolds, material, diameter);
  }

  /**
   * Validate system inputs
   */
  private static validateSystemInputs(inputs: SystemCalculationInputs): void {
    if (!inputs.segments || inputs.segments.length === 0) {
      throw new Error('System must contain at least one segment');
    }
    
    for (const segment of inputs.segments) {
      if (segment.airflow <= 0) {
        throw new Error(`Invalid airflow for segment ${segment.id}`);
      }
      
      if (segment.type === 'straight' && (!segment.length || segment.length <= 0)) {
        throw new Error(`Straight segment ${segment.id} must have positive length`);
      }
      
      if (segment.type === 'fitting' && !segment.fittingConfig) {
        throw new Error(`Fitting segment ${segment.id} must have fitting configuration`);
      }
    }
  }

  /**
   * Validate system results
   */
  private static validateSystemResults(data: {
    totalPressureLoss: number;
    averageVelocity: number;
    maxVelocity: number;
    minVelocity: number;
    systemType: string;
    segmentResults: SegmentResult[];
  }): {
    warnings: string[];
    recommendations: string[];
    compliance: { velocityCompliant: boolean; pressureCompliant: boolean; smacnaCompliant: boolean };
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const velocityLimits = this.SYSTEM_VELOCITY_LIMITS[data.systemType];
    const pressureLimits = this.SYSTEM_PRESSURE_LIMITS[data.systemType];
    
    // Velocity compliance
    const velocityCompliant = data.maxVelocity <= velocityLimits.max && data.minVelocity >= velocityLimits.min;
    if (!velocityCompliant) {
      warnings.push(`System velocities outside SMACNA limits (${velocityLimits.min}-${velocityLimits.max} FPM)`);
      recommendations.push('Resize ducts to achieve compliant velocities');
    }
    
    // Pressure compliance
    const pressureCompliant = data.totalPressureLoss <= pressureLimits.max;
    if (!pressureCompliant) {
      warnings.push(`System pressure loss (${data.totalPressureLoss.toFixed(2)} in wg) exceeds SMACNA limit (${pressureLimits.max} in wg)`);
      recommendations.push('Reduce system pressure loss by optimizing duct sizes and minimizing fittings');
    }
    
    // Overall SMACNA compliance
    const smacnaCompliant = velocityCompliant && pressureCompliant;
    
    // Additional system-level checks
    if (data.totalPressureLoss > pressureLimits.recommended) {
      recommendations.push(`Consider reducing pressure loss below ${pressureLimits.recommended} in wg for optimal efficiency`);
    }
    
    if (data.averageVelocity > velocityLimits.recommended) {
      recommendations.push(`Consider reducing average velocity below ${velocityLimits.recommended} FPM for noise control`);
    }
    
    return {
      warnings,
      recommendations,
      compliance: { velocityCompliant, pressureCompliant, smacnaCompliant }
    };
  }

  /**
   * Round number to specified precision
   */
  private static roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Get system pressure limits for a system type
   */
  public static getSystemLimits(systemType: string): {
    velocity: { min: number; max: number; recommended: number };
    pressure: { max: number; recommended: number };
  } {
    return {
      velocity: this.SYSTEM_VELOCITY_LIMITS[systemType] || this.SYSTEM_VELOCITY_LIMITS.supply,
      pressure: this.SYSTEM_PRESSURE_LIMITS[systemType] || this.SYSTEM_PRESSURE_LIMITS.supply
    };
  }

  /**
   * Calculate enhanced system pressure with environmental corrections
   */
  public static calculateEnhancedSystemPressure(inputs: SystemCalculationInputs): SystemCalculationResult {
    const { segments, systemType, designConditions, calculationOptions } = inputs;

    // Validate inputs
    this.validateSystemInputs(inputs);

    const results: SegmentResult[] = [];
    let totalPressureLoss = 0;
    let totalFrictionLoss = 0;
    let totalFittingLoss = 0;
    let totalElevationLoss = 0;
    const warnings: string[] = [];
    const notes: string[] = [];

    // Process each segment with enhanced calculations
    for (const segment of segments) {
      const segmentResult = this.calculateEnhancedSegmentPressure(segment, designConditions);

      results.push(segmentResult);
      totalPressureLoss += segmentResult.pressureLoss;

      if (segmentResult.type === 'friction') {
        totalFrictionLoss += segmentResult.pressureLoss;
      } else if (segmentResult.type === 'fitting') {
        totalFittingLoss += segmentResult.pressureLoss;
      }

      // Add elevation effects if present
      if (segment.elevation !== undefined) {
        const elevationEffect = this.calculateElevationPressure(segment);
        totalElevationLoss += elevationEffect.pressureChange;
        if (elevationEffect.warnings.length > 0) {
          warnings.push(...elevationEffect.warnings);
        }
      }

      // Collect warnings and notes
      if (segmentResult.warnings) {
        warnings.push(...segmentResult.warnings);
      }
      if (segmentResult.notes) {
        notes.push(...segmentResult.notes);
      }
    }

    // Calculate system-level metrics
    const totalAirflow = Math.max(...segments.map(s => s.airflow));
    const averageVelocity = this.calculateAverageVelocity(segments);

    // Add environmental condition warnings
    const envWarnings = this.validateEnvironmentalConditions(designConditions);
    warnings.push(...envWarnings);

    // Performance analysis with enhanced data
    const analysis = this.analyzeEnhancedSystemPerformance(
      results,
      totalPressureLoss,
      totalAirflow,
      systemType,
      designConditions
    );

    return {
      totalPressureLoss: this.roundToPrecision(totalPressureLoss + totalElevationLoss, 4),
      frictionLoss: this.roundToPrecision(totalFrictionLoss, 4),
      fittingLoss: this.roundToPrecision(totalFittingLoss, 4),
      elevationLoss: this.roundToPrecision(totalElevationLoss, 4),
      segments: results,
      systemMetrics: {
        totalAirflow,
        averageVelocity: this.roundToPrecision(averageVelocity, 1),
        frictionPercentage: this.roundToPrecision((totalFrictionLoss / totalPressureLoss) * 100, 1),
        fittingPercentage: this.roundToPrecision((totalFittingLoss / totalPressureLoss) * 100, 1),
        elevationPercentage: this.roundToPrecision((totalElevationLoss / totalPressureLoss) * 100, 1),
        systemEfficiency: this.calculateSystemEfficiency(totalFrictionLoss, totalFittingLoss)
      },
      analysis,
      warnings,
      notes,
      calculationMethod: 'Enhanced with environmental corrections',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate enhanced segment pressure with environmental corrections
   */
  private static calculateEnhancedSegmentPressure(
    segment: DuctSegment,
    designConditions: any
  ): SegmentResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    // Determine air conditions for this segment
    const airConditions: AirConditions = {
      temperature: segment.temperature || designConditions.temperature || 70,
      pressure: segment.pressure || designConditions.barometricPressure,
      altitude: segment.elevation || designConditions.altitude || 0,
      humidity: segment.humidity || designConditions.humidity || 50
    };

    // Get enhanced air properties
    const airProps = AirPropertiesCalculator.calculateAirProperties(airConditions);
    warnings.push(...airProps.warnings);
    notes.push(...airProps.notes);

    if (segment.type === 'straight' && segment.length) {
      // Enhanced friction loss calculation
      return this.calculateEnhancedFrictionLoss(segment, airProps, warnings, notes);
    } else if (segment.type === 'fitting' && segment.fittingConfig) {
      // Enhanced fitting loss calculation
      return this.calculateEnhancedFittingLoss(segment, airProps, warnings, notes);
    }

    // Fallback to basic calculation
    return {
      segmentId: segment.id,
      type: 'unknown',
      pressureLoss: 0,
      velocity: 0,
      warnings: ['Unknown segment type'],
      notes: []
    };
  }

  /**
   * Calculate enhanced friction loss with material aging and environmental corrections
   */
  private static calculateEnhancedFrictionLoss(
    segment: DuctSegment,
    airProps: AirProperties,
    warnings: string[],
    notes: string[]
  ): SegmentResult {
    // Get enhanced material roughness
    const materialData = AirPropertiesCalculator.getEnhancedMaterialRoughness(
      segment.material,
      segment.materialAge,
      segment.surfaceCondition
    );

    warnings.push(...materialData.warnings);
    notes.push(...materialData.notes);

    // Calculate velocity
    const area = segment.ductShape === 'round'
      ? Math.PI * Math.pow((segment.diameter || 12) / 12, 2) / 4
      : ((segment.width || 12) * (segment.height || 12)) / 144;
    const velocity = segment.airflow / area;

    // Enhanced pressure loss calculation using corrected air properties
    const diameter = segment.ductShape === 'round'
      ? segment.diameter || 12
      : AirDuctCalculator.calculateEquivalentDiameter(segment.width || 12, segment.height || 12);

    // Use enhanced calculation with corrected air density and viscosity
    const pressureLoss = this.calculateCorrectedPressureLoss(
      velocity,
      segment.length || 0,
      diameter,
      materialData.roughness,
      airProps
    );

    return {
      segmentId: segment.id,
      type: 'friction',
      pressureLoss: this.roundToPrecision(pressureLoss, 4),
      velocity: this.roundToPrecision(velocity, 1),
      equivalentDiameter: this.roundToPrecision(diameter, 2),
      materialRoughness: materialData.roughness,
      airDensity: airProps.density,
      correctionFactors: airProps.correctionFactors,
      warnings,
      notes
    };
  }

  /**
   * Calculate enhanced fitting loss with environmental corrections
   */
  private static calculateEnhancedFittingLoss(
    segment: DuctSegment,
    airProps: AirProperties,
    warnings: string[],
    notes: string[]
  ): SegmentResult {
    // Calculate velocity
    const area = segment.ductShape === 'round'
      ? Math.PI * Math.pow((segment.diameter || 12) / 12, 2) / 4
      : ((segment.width || 12) * (segment.height || 12)) / 144;
    const velocity = segment.airflow / area;

    // Calculate velocity pressure with environmental corrections
    const vpParams: VelocityPressureParams = {
      velocity,
      airConditions: {
        temperature: segment.temperature || 70,
        pressure: segment.pressure,
        altitude: segment.elevation || 0,
        humidity: segment.humidity || 50
      }
    };

    const vpResult = AirPropertiesCalculator.calculateVelocityPressure(vpParams);
    warnings.push(...vpResult.warnings);

    // Calculate fitting loss using enhanced velocity pressure
    const fittingResult = FittingLossCalculator.calculateFittingLoss(
      segment.fittingConfig!,
      velocity,
      airProps.density
    );

    // Apply velocity pressure correction
    const correctedPressureLoss = fittingResult.pressureLoss *
      (vpResult.velocityPressure / Math.pow(velocity / 4005, 2));

    return {
      segmentId: segment.id,
      type: 'fitting',
      pressureLoss: this.roundToPrecision(correctedPressureLoss, 4),
      velocity: this.roundToPrecision(velocity, 1),
      kFactor: fittingResult.kFactor,
      velocityPressure: vpResult.velocityPressure,
      airDensity: airProps.density,
      correctionFactors: vpResult.correctionFactors,
      warnings,
      notes
    };
  }

  /**
   * Calculate elevation pressure effects
   */
  private static calculateElevationPressure(segment: DuctSegment): {
    pressureChange: number;
    warnings: string[];
  } {
    const warnings: string[] = [];

    if (!segment.elevation) {
      return { pressureChange: 0, warnings };
    }

    // Calculate elevation effects using enhanced air properties
    const elevationEffects = AirPropertiesCalculator.calculateElevationEffects(segment.elevation);
    warnings.push(...elevationEffects.warnings);

    // Pressure change due to elevation (simplified)
    // ΔP = ρ × g × Δh / gc (converted to inches w.g.)
    const airDensity = 0.075; // lb/ft³ at standard conditions
    const pressureChange = (airDensity * segment.elevation) / 5.2; // Convert to inches w.g.

    return {
      pressureChange: pressureChange * elevationEffects.densityRatio,
      warnings
    };
  }

  /**
   * Calculate average velocity across all segments
   */
  private static calculateAverageVelocity(segments: DuctSegment[]): number {
    let totalVelocity = 0;
    let count = 0;

    for (const segment of segments) {
      const area = segment.ductShape === 'round'
        ? Math.PI * Math.pow((segment.diameter || 12) / 12, 2) / 4
        : ((segment.width || 12) * (segment.height || 12)) / 144;

      const velocity = segment.airflow / area;
      totalVelocity += velocity;
      count++;
    }

    return count > 0 ? totalVelocity / count : 0;
  }

  /**
   * Validate environmental conditions
   */
  private static validateEnvironmentalConditions(designConditions: any): string[] {
    const warnings: string[] = [];

    if (designConditions.temperature < 32 || designConditions.temperature > 200) {
      warnings.push(`Temperature ${designConditions.temperature}°F is outside normal HVAC range`);
    }

    if (designConditions.altitude && designConditions.altitude > 5000) {
      warnings.push(`High altitude (${designConditions.altitude} ft) requires density corrections`);
    }

    if (designConditions.humidity && designConditions.humidity > 80) {
      warnings.push(`High humidity (${designConditions.humidity}% RH) may cause condensation`);
    }

    return warnings;
  }

  /**
   * Analyze enhanced system performance
   */
  private static analyzeEnhancedSystemPerformance(
    results: SegmentResult[],
    totalPressureLoss: number,
    totalAirflow: number,
    systemType: string,
    designConditions: any
  ): SystemAnalysis {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Enhanced performance analysis
    const limits = this.getSystemLimits(systemType);
    const averageVelocity = results.reduce((sum, r) => sum + (r.velocity || 0), 0) / results.length;

    // Velocity compliance check
    const velocityCompliant = averageVelocity >= limits.velocity.min &&
                             averageVelocity <= limits.velocity.max;

    if (!velocityCompliant) {
      warnings.push(`Average velocity ${averageVelocity.toFixed(0)} FPM is outside recommended range`);
    }

    // Pressure compliance check
    const pressureCompliant = totalPressureLoss <= limits.pressure.max;

    if (!pressureCompliant) {
      warnings.push(`Total pressure loss ${totalPressureLoss.toFixed(3)} in wg exceeds maximum`);
    }

    // Environmental impact analysis
    const hasEnvironmentalCorrections = results.some(r =>
      r.correctionFactors && Math.abs(r.correctionFactors.combined - 1.0) > 0.05
    );

    if (hasEnvironmentalCorrections) {
      recommendations.push('Environmental conditions significantly affect system performance');
    }

    // Material aging analysis
    const hasAgingEffects = results.some(r => r.materialRoughness && r.materialRoughness > 0.0005);

    if (hasAgingEffects) {
      recommendations.push('Consider duct cleaning or replacement for aged materials');
    }

    return {
      warnings,
      recommendations,
      compliance: {
        velocityCompliant,
        pressureCompliant,
        smacnaCompliant: velocityCompliant && pressureCompliant
      }
    };
  }

  /**
   * Calculate corrected pressure loss with enhanced air properties
   */
  private static calculateCorrectedPressureLoss(
    velocity: number,
    length: number,
    diameter: number,
    roughness: number,
    airProps: AirProperties
  ): number {
    // Convert units
    const velocityFps = velocity / 60; // FPM to FPS
    const diameterFt = diameter / 12; // inches to feet

    // Calculate Reynolds number with corrected viscosity
    const reynolds = (velocityFps * diameterFt * airProps.density) / airProps.viscosity;

    // Calculate friction factor using enhanced roughness
    const relativeRoughness = roughness / diameterFt;
    const frictionFactor = this.calculateEnhancedFrictionFactor(reynolds, relativeRoughness);

    // Darcy-Weisbach equation with corrected air density
    const pressureLossPsf = frictionFactor * (length / diameterFt) *
                           (airProps.density * Math.pow(velocityFps, 2)) / (2 * 32.174);

    // Convert to inches w.g.
    return pressureLossPsf / 5.2;
  }

  /**
   * Enhanced friction factor calculation
   */
  private static calculateEnhancedFrictionFactor(reynolds: number, relativeRoughness: number): number {
    // For laminar flow
    if (reynolds < 2300) {
      return 64 / reynolds;
    }

    // For turbulent flow - Colebrook-White equation (iterative solution)
    let f = 0.02; // Initial guess

    for (let i = 0; i < 10; i++) {
      const fNew = 1 / Math.pow(-2 * Math.log10(relativeRoughness / 3.7 + 2.51 / (reynolds * Math.sqrt(f))), 2);

      if (Math.abs(fNew - f) < 0.0001) {
        break;
      }
      f = fNew;
    }

    return f;
  }
}
