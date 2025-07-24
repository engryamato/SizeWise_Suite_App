/**
 * AirDuctCalculator - Pure Calculation Functions for Air Duct Sizing
 * 
 * MISSION-CRITICAL: Pure TypeScript functions for SMACNA-compliant air duct calculations
 * Extracted from UI components for reusability and tier enforcement integration
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.4
 */

/**
 * Input parameters for duct sizing calculations
 */
export interface DuctSizingInputs {
  airflow: number; // CFM
  ductType: 'round' | 'rectangular';
  frictionRate: number; // inches w.g. per 100 feet
  units: 'imperial' | 'metric';
  material?: string;
  targetVelocity?: number; // FPM
  maxVelocity?: number; // FPM
  minVelocity?: number; // FPM
}

/**
 * Results from duct sizing calculations
 */
export interface DuctSizingResults {
  // Common properties
  area: number; // sq ft
  velocity: number; // FPM
  pressureLoss: number; // inches w.g. per 100 feet
  reynoldsNumber: number;
  frictionFactor: number;
  
  // Round duct specific
  diameter?: number; // inches
  
  // Rectangular duct specific
  width?: number; // inches
  height?: number; // inches
  equivalentDiameter?: number; // inches
  hydraulicDiameter?: number; // inches
  aspectRatio?: number;
  
  // Validation and recommendations
  isOptimal: boolean;
  warnings: string[];
  recommendations: string[];
  standardsCompliance: {
    smacna: boolean;
    ashrae: boolean;
    velocityCompliant: boolean;
  };
}

/**
 * Material properties for pressure loss calculations
 */
export interface MaterialProperties {
  roughnessFactor: number; // feet
  name: string;
  description: string;
}

/**
 * AirDuctCalculator - Pure calculation functions for air duct sizing
 * CRITICAL: No dependencies on UI, storage, or external services
 */
export class AirDuctCalculator {
  // SMACNA standard round duct sizes (inches)
  private static readonly ROUND_STANDARD_SIZES = [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24,
    26, 28, 30, 32, 36, 40, 42, 48, 54, 60
  ];

  // SMACNA standard rectangular duct sizes (inches)
  private static readonly RECTANGULAR_STANDARD_SIZES = [
    4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24,
    26, 28, 30, 32, 36, 40, 42, 48, 54, 60, 72
  ];

  // Material roughness factors (feet)
  private static readonly MATERIAL_PROPERTIES: Record<string, MaterialProperties> = {
    galvanized_steel: { roughnessFactor: 0.0003, name: 'Galvanized Steel', description: 'Standard HVAC ductwork' },
    aluminum: { roughnessFactor: 0.0002, name: 'Aluminum', description: 'Lightweight ductwork' },
    stainless_steel: { roughnessFactor: 0.0002, name: 'Stainless Steel', description: 'Corrosion resistant' },
    pvc: { roughnessFactor: 0.0001, name: 'PVC', description: 'Plastic ductwork' },
    fiberglass: { roughnessFactor: 0.0005, name: 'Fiberglass', description: 'Insulated ductwork' },
    concrete: { roughnessFactor: 0.003, name: 'Concrete', description: 'Underground ducts' },
    brick: { roughnessFactor: 0.01, name: 'Brick', description: 'Masonry ducts' }
  };

  // SMACNA velocity limits (FPM)
  private static readonly VELOCITY_LIMITS = {
    supply: { min: 400, max: 2500, optimal: 1500 },
    return: { min: 300, max: 2000, optimal: 1200 },
    exhaust: { min: 500, max: 3000, optimal: 1800 }
  };

  /**
   * Calculate air duct sizing based on SMACNA standards
   * CRITICAL: Pure function with no side effects
   */
  public static calculateDuctSizing(inputs: DuctSizingInputs): DuctSizingResults {
    // Validate inputs
    this.validateInputs(inputs);

    // Convert to imperial units if needed
    const imperialInputs = inputs.units === 'metric' 
      ? this.convertToImperial(inputs) 
      : inputs;

    // Perform calculation based on duct type
    if (imperialInputs.ductType === 'round') {
      return this.calculateRoundDuct(imperialInputs);
    } else {
      return this.calculateRectangularDuct(imperialInputs);
    }
  }

  /**
   * Calculate round duct sizing
   */
  private static calculateRoundDuct(inputs: DuctSizingInputs): DuctSizingResults {
    const { airflow, frictionRate, material = 'galvanized_steel' } = inputs;

    // Find optimal diameter using SMACNA friction chart method
    const diameter = this.findOptimalRoundDiameter(airflow, frictionRate);

    // Calculate area and velocity
    const area = Math.PI * Math.pow(diameter / 12, 2) / 4; // sq ft
    const velocity = airflow / area; // FPM

    // Calculate pressure loss
    const pressureLoss = this.calculatePressureLoss(velocity, 100, diameter, material);

    // Calculate Reynolds number and friction factor
    const reynoldsNumber = this.calculateReynoldsNumber(velocity, diameter);
    const frictionFactor = this.calculateFrictionFactor(reynoldsNumber, material, diameter);

    // Validate and generate recommendations
    const validation = this.validateResults({ velocity, diameter, area });
    const recommendations = this.generateRecommendations(inputs, { diameter, velocity, area });

    return {
      diameter,
      area,
      velocity,
      pressureLoss,
      reynoldsNumber,
      frictionFactor,
      isOptimal: validation.isOptimal,
      warnings: validation.warnings,
      recommendations,
      standardsCompliance: {
        smacna: validation.smacnaCompliant,
        ashrae: validation.ashraeCompliant,
        velocityCompliant: validation.velocityCompliant
      }
    };
  }

  /**
   * Calculate rectangular duct sizing
   */
  private static calculateRectangularDuct(inputs: DuctSizingInputs): DuctSizingResults {
    const { airflow, frictionRate, material = 'galvanized_steel' } = inputs;

    // Find optimal dimensions
    const { width, height } = this.findOptimalRectangularDimensions(airflow, frictionRate);

    // Calculate area and velocity
    const area = (width * height) / 144; // sq ft
    const velocity = airflow / area; // FPM

    // Calculate equivalent and hydraulic diameters
    const equivalentDiameter = this.calculateEquivalentDiameter(width, height);
    const hydraulicDiameter = this.calculateHydraulicDiameter(width, height);
    const aspectRatio = this.calculateAspectRatio(width, height);

    // Calculate pressure loss using equivalent diameter
    const pressureLoss = this.calculatePressureLoss(velocity, 100, equivalentDiameter, material);

    // Calculate Reynolds number and friction factor
    const reynoldsNumber = this.calculateReynoldsNumber(velocity, hydraulicDiameter);
    const frictionFactor = this.calculateFrictionFactor(reynoldsNumber, material, hydraulicDiameter);

    // Validate and generate recommendations
    const validation = this.validateResults({ velocity, width, height, aspectRatio, area });
    const recommendations = this.generateRecommendations(inputs, { width, height, velocity, area, aspectRatio });

    return {
      width,
      height,
      area,
      velocity,
      pressureLoss,
      reynoldsNumber,
      frictionFactor,
      equivalentDiameter,
      hydraulicDiameter,
      aspectRatio,
      isOptimal: validation.isOptimal,
      warnings: validation.warnings,
      recommendations,
      standardsCompliance: {
        smacna: validation.smacnaCompliant,
        ashrae: validation.ashraeCompliant,
        velocityCompliant: validation.velocityCompliant
      }
    };
  }

  /**
   * Find optimal round duct diameter using SMACNA friction chart method
   */
  private static findOptimalRoundDiameter(airflow: number, targetFriction: number): number {
    let bestDiameter = this.ROUND_STANDARD_SIZES[0];
    let bestScore = Infinity;

    for (const diameter of this.ROUND_STANDARD_SIZES) {
      const area = Math.PI * Math.pow(diameter / 12, 2) / 4; // sq ft
      const velocity = airflow / area; // FPM

      // Check velocity limits
      if (velocity < this.VELOCITY_LIMITS.supply.min || velocity > this.VELOCITY_LIMITS.supply.max) {
        continue;
      }

      // Calculate actual friction rate
      const actualFriction = this.calculatePressureLoss(velocity, 100, diameter, 'galvanized_steel');
      
      // Score based on how close to target friction and optimal velocity
      const frictionScore = Math.abs(actualFriction - targetFriction) / targetFriction;
      const velocityScore = Math.abs(velocity - this.VELOCITY_LIMITS.supply.optimal) / this.VELOCITY_LIMITS.supply.optimal;
      const totalScore = frictionScore + velocityScore * 0.5; // Weight friction more heavily

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestDiameter = diameter;
      }
    }

    return bestDiameter;
  }

  /**
   * Find optimal rectangular duct dimensions
   */
  private static findOptimalRectangularDimensions(airflow: number, targetFriction: number): { width: number; height: number } {
    let bestWidth = this.RECTANGULAR_STANDARD_SIZES[0];
    let bestHeight = this.RECTANGULAR_STANDARD_SIZES[0];
    let bestScore = Infinity;

    // Try different aspect ratios (SMACNA recommends 1:1 to 4:1)
    const aspectRatios = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

    for (const aspectRatio of aspectRatios) {
      // Calculate estimated dimensions
      const estimatedArea = airflow / this.VELOCITY_LIMITS.supply.optimal; // Target optimal velocity
      const height = Math.sqrt(estimatedArea / aspectRatio) * 12; // inches
      const width = aspectRatio * height;

      // Round to nearest standard sizes
      const heightStd = this.findNearestStandardSize(height, this.RECTANGULAR_STANDARD_SIZES);
      const widthStd = this.findNearestStandardSize(width, this.RECTANGULAR_STANDARD_SIZES);

      // Calculate actual properties
      const area = (widthStd * heightStd) / 144; // sq ft
      const velocity = airflow / area; // FPM

      // Check velocity limits
      if (velocity < this.VELOCITY_LIMITS.supply.min || velocity > this.VELOCITY_LIMITS.supply.max) {
        continue;
      }

      // Calculate equivalent diameter and friction
      const equivalentDiameter = this.calculateEquivalentDiameter(widthStd, heightStd);
      const actualFriction = this.calculatePressureLoss(velocity, 100, equivalentDiameter, 'galvanized_steel');

      // Score based on friction accuracy, velocity optimality, and aspect ratio
      const frictionScore = Math.abs(actualFriction - targetFriction) / targetFriction;
      const velocityScore = Math.abs(velocity - this.VELOCITY_LIMITS.supply.optimal) / this.VELOCITY_LIMITS.supply.optimal;
      const aspectScore = aspectRatio > 3.0 ? (aspectRatio - 3.0) * 0.2 : 0; // Penalty for high aspect ratios
      const totalScore = frictionScore + velocityScore * 0.5 + aspectScore;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestWidth = widthStd;
        bestHeight = heightStd;
      }
    }

    return { width: bestWidth, height: bestHeight };
  }

  /**
   * Calculate equivalent diameter for rectangular ducts (SMACNA formula)
   */
  public static calculateEquivalentDiameter(width: number, height: number): number {
    return 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
  }

  /**
   * Calculate hydraulic diameter for rectangular ducts
   */
  public static calculateHydraulicDiameter(width: number, height: number): number {
    return (4 * width * height) / (2 * (width + height));
  }

  /**
   * Calculate aspect ratio for rectangular ducts
   */
  public static calculateAspectRatio(width: number, height: number): number {
    return Math.max(width, height) / Math.min(width, height);
  }

  /**
   * Calculate pressure loss using Darcy-Weisbach equation
   */
  private static calculatePressureLoss(velocity: number, length: number, diameter: number, material: string): number {
    const materialProps = this.MATERIAL_PROPERTIES[material] || this.MATERIAL_PROPERTIES.galvanized_steel;
    const roughness = materialProps.roughnessFactor;

    // Convert units
    const velocityFps = velocity / 60; // FPM to FPS
    const diameterFt = diameter / 12; // inches to feet

    // Air properties at standard conditions (70°F, 14.7 psia)
    const airDensity = 0.075; // lb/ft³
    const kinematicViscosity = 1.57e-4; // ft²/s

    // Calculate Reynolds number
    const reynolds = (velocityFps * diameterFt) / kinematicViscosity;

    // Calculate friction factor
    const frictionFactor = this.calculateFrictionFactor(reynolds, material, diameter);

    // Darcy-Weisbach equation: ΔP = f * (L/D) * (ρ * V²) / (2 * gc)
    // Convert to inches of water per 100 feet
    const pressureLossPsf = frictionFactor * (length / diameterFt) * (airDensity * Math.pow(velocityFps, 2)) / (2 * 32.174);
    const pressureLossInWg = pressureLossPsf / 5.2; // Convert psf to inches w.g.

    return pressureLossInWg;
  }

  /**
   * Calculate Reynolds number
   */
  private static calculateReynoldsNumber(velocity: number, diameter: number): number {
    const velocityFps = velocity / 60; // FPM to FPS
    const diameterFt = diameter / 12; // inches to feet
    const kinematicViscosity = 1.57e-4; // ft²/s for air at standard conditions

    return (velocityFps * diameterFt) / kinematicViscosity;
  }

  /**
   * Calculate friction factor using Colebrook-White equation
   */
  private static calculateFrictionFactor(reynolds: number, material: string, diameter: number): number {
    const materialProps = this.MATERIAL_PROPERTIES[material] || this.MATERIAL_PROPERTIES.galvanized_steel;
    const roughness = materialProps.roughnessFactor;
    const diameterFt = diameter / 12;
    const relativeRoughness = roughness / diameterFt;

    // For laminar flow (Re < 2300)
    if (reynolds < 2300) {
      return 64 / reynolds;
    }

    // For turbulent flow, use Colebrook-White equation (iterative solution)
    let f = 0.02; // Initial guess
    for (let i = 0; i < 10; i++) {
      const fNew = 1 / Math.pow(-2 * Math.log10(relativeRoughness / 3.7 + 2.51 / (reynolds * Math.sqrt(f))), 2);
      if (Math.abs(fNew - f) < 0.0001) break;
      f = fNew;
    }

    return f;
  }

  /**
   * Validate calculation results
   */
  private static validateResults(results: any): {
    isOptimal: boolean;
    warnings: string[];
    smacnaCompliant: boolean;
    ashraeCompliant: boolean;
    velocityCompliant: boolean;
  } {
    const warnings: string[] = [];
    let smacnaCompliant = true;
    let ashraeCompliant = true;
    let velocityCompliant = true;

    // Velocity validation
    const { velocity } = results;
    if (velocity < this.VELOCITY_LIMITS.supply.min) {
      warnings.push(`Velocity ${velocity.toFixed(0)} FPM is below minimum recommended (${this.VELOCITY_LIMITS.supply.min} FPM)`);
      velocityCompliant = false;
    } else if (velocity > this.VELOCITY_LIMITS.supply.max) {
      warnings.push(`Velocity ${velocity.toFixed(0)} FPM exceeds maximum recommended (${this.VELOCITY_LIMITS.supply.max} FPM)`);
      velocityCompliant = false;
      smacnaCompliant = false;
    }

    // Aspect ratio validation (for rectangular ducts)
    if (results.aspectRatio) {
      if (results.aspectRatio > 4.0) {
        warnings.push(`Aspect ratio ${results.aspectRatio.toFixed(1)}:1 exceeds SMACNA maximum of 4:1`);
        smacnaCompliant = false;
      } else if (results.aspectRatio > 3.0) {
        warnings.push(`Aspect ratio ${results.aspectRatio.toFixed(1)}:1 is high - consider optimization`);
      }
    }

    // Area validation
    if (results.area < 0.1) {
      warnings.push('Very small duct area. Consider minimum duct size requirements.');
    }

    const isOptimal = warnings.length === 0 && 
      velocity >= this.VELOCITY_LIMITS.supply.optimal * 0.8 && 
      velocity <= this.VELOCITY_LIMITS.supply.optimal * 1.2;

    return {
      isOptimal,
      warnings,
      smacnaCompliant,
      ashraeCompliant,
      velocityCompliant
    };
  }

  /**
   * Generate recommendations based on calculation results
   */
  private static generateRecommendations(inputs: DuctSizingInputs, results: any): string[] {
    const recommendations: string[] = [];

    // Velocity recommendations
    if (results.velocity < this.VELOCITY_LIMITS.supply.optimal * 0.8) {
      recommendations.push('Consider reducing duct size to increase velocity for better performance');
    } else if (results.velocity > this.VELOCITY_LIMITS.supply.optimal * 1.2) {
      recommendations.push('Consider increasing duct size to reduce velocity and noise');
    }

    // Aspect ratio recommendations (for rectangular ducts)
    if (results.aspectRatio && results.aspectRatio > 3.0) {
      recommendations.push('Consider using round duct or reducing aspect ratio for better performance');
    }

    // Material recommendations
    if (inputs.material === 'galvanized_steel' && results.velocity > 2000) {
      recommendations.push('Consider using smoother materials like aluminum for high-velocity applications');
    }

    return recommendations;
  }

  /**
   * Find nearest standard size
   */
  private static findNearestStandardSize(target: number, standardSizes: number[]): number {
    return standardSizes.reduce((prev, curr) => 
      Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
  }

  /**
   * Convert metric inputs to imperial
   */
  private static convertToImperial(inputs: DuctSizingInputs): DuctSizingInputs {
    return {
      ...inputs,
      airflow: inputs.airflow * 2.119, // m³/h to CFM
      frictionRate: inputs.frictionRate * 0.249, // Pa/m to inches w.g. per 100 feet
      units: 'imperial'
    };
  }

  /**
   * Validate input parameters
   */
  private static validateInputs(inputs: DuctSizingInputs): void {
    if (inputs.airflow <= 0) {
      throw new Error('Airflow must be greater than 0');
    }
    if (inputs.frictionRate <= 0) {
      throw new Error('Friction rate must be greater than 0');
    }
    if (!['round', 'rectangular'].includes(inputs.ductType)) {
      throw new Error('Duct type must be "round" or "rectangular"');
    }
    if (!['imperial', 'metric'].includes(inputs.units)) {
      throw new Error('Units must be "imperial" or "metric"');
    }
  }

  /**
   * Get available materials
   */
  public static getMaterials(): Record<string, MaterialProperties> {
    return { ...this.MATERIAL_PROPERTIES };
  }

  /**
   * Get velocity limits
   */
  public static getVelocityLimits(): typeof AirDuctCalculator.VELOCITY_LIMITS {
    return { ...this.VELOCITY_LIMITS };
  }

  /**
   * Get standard sizes
   */
  public static getStandardSizes(): { round: number[]; rectangular: number[] } {
    return {
      round: [...this.ROUND_STANDARD_SIZES],
      rectangular: [...this.RECTANGULAR_STANDARD_SIZES]
    };
  }
}

export default AirDuctCalculator;
