/**
 * HVAC Calculations Utility
 * 
 * Consolidates HVAC calculation logic that was duplicated across
 * frontend utilities, backend services, and validation modules.
 */

export interface DuctDimensions {
  width?: number;
  height?: number;
  diameter?: number;
  shape: 'rectangular' | 'round' | 'oval';
}

export interface PressureLossParams {
  velocity: number;
  ductLength: number;
  roughness: number;
  diameter: number;
  airDensity?: number;
}

export interface HVACParams {
  airflow: number;
  velocity?: number;
  temperature?: number;
  pressure?: number;
  humidity?: number;
  elevation?: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface VelocityLimits {
  supply: { min: number; max: number };
  return: { min: number; max: number };
  exhaust: { min: number; max: number };
}

export interface SMACNAStandards {
  maxVelocity: VelocityLimits;
  transitionSlopeRatio: number;
  elbowRadiusRatio: number;
  standardGauges: number[];
  materialRoughness: Record<string, number>;
}

/**
 * Comprehensive HVAC Calculations Class
 * Consolidates calculation logic from multiple sources
 */
export class HVACCalculations {
  
  // Standard constants
  static readonly STANDARD_AIR_DENSITY = 0.075; // lb/ft³ at standard conditions
  static readonly STANDARD_TEMPERATURE = 70; // °F
  static readonly STANDARD_PRESSURE = 14.7; // psia
  static readonly VELOCITY_PRESSURE_CONSTANT = 4005; // for imperial units

  // SMACNA Standards
  static readonly SMACNA: SMACNAStandards = {
    maxVelocity: {
      supply: { min: 500, max: 2500 },
      return: { min: 300, max: 2000 },
      exhaust: { min: 1000, max: 4000 }
    },
    transitionSlopeRatio: 2.5,
    elbowRadiusRatio: 1.5,
    standardGauges: [30, 28, 26, 24, 22, 20, 18, 16, 14],
    materialRoughness: {
      galvanized_steel: 0.0005,
      stainless_steel: 0.0002,
      aluminum: 0.0003,
      pvc: 0.0001,
      fiberglass: 0.003
    }
  };

  /**
   * Calculate velocity pressure from air velocity
   * Formula: VP = (V/4005)² for standard air density
   */
  static calculateVelocityPressure(velocity: number, airDensity: number = this.STANDARD_AIR_DENSITY): number {
    if (velocity <= 0) return 0;
    
    // Standard formula: VP = ρV²/(2gc) converted to inches w.g.
    // Simplified for standard conditions: VP = (V/4005)²
    const standardVP = Math.pow(velocity / this.VELOCITY_PRESSURE_CONSTANT, 2);
    
    // Adjust for non-standard air density
    const densityRatio = airDensity / this.STANDARD_AIR_DENSITY;
    return standardVP * densityRatio;
  }

  /**
   * Calculate equivalent diameter for rectangular ducts
   * Formula: De = 1.3 * (a*b)^0.625 / (a+b)^0.25
   */
  static calculateEquivalentDiameter(dimensions: DuctDimensions): number {
    if (dimensions.shape === 'round') {
      return dimensions.diameter || 0;
    }

    if (dimensions.shape === 'rectangular' && dimensions.width && dimensions.height) {
      const { width, height } = dimensions;
      // ASHRAE equivalent diameter formula
      return 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
    }

    if (dimensions.shape === 'oval' && dimensions.width && dimensions.height) {
      // Approximate oval as equivalent round duct
      const area = Math.PI * (dimensions.width / 2) * (dimensions.height / 2);
      return 2 * Math.sqrt(area / Math.PI);
    }

    return 0;
  }

  /**
   * Calculate pressure loss using Darcy-Weisbach equation
   * Formula: ΔP = f * (L/D) * (ρV²/2)
   */
  static calculatePressureLoss(params: PressureLossParams): number {
    const { velocity, ductLength, roughness, diameter, airDensity = this.STANDARD_AIR_DENSITY } = params;
    
    if (velocity <= 0 || diameter <= 0 || ductLength <= 0) return 0;

    // Calculate Reynolds number
    const kinematicViscosity = 1.57e-4; // ft²/s for air at standard conditions
    const reynoldsNumber = (velocity * diameter) / (kinematicViscosity * 12); // Convert diameter to feet

    // Calculate friction factor using Colebrook-White equation (approximation)
    const relativeRoughness = roughness / (diameter / 12); // Convert to feet
    const frictionFactor = this.calculateFrictionFactor(reynoldsNumber, relativeRoughness);

    // Calculate pressure loss in inches w.g.
    const velocityPressure = this.calculateVelocityPressure(velocity, airDensity);
    return frictionFactor * (ductLength / (diameter / 12)) * velocityPressure;
  }

  /**
   * Calculate friction factor using Swamee-Jain approximation
   */
  private static calculateFrictionFactor(reynoldsNumber: number, relativeRoughness: number): number {
    if (reynoldsNumber < 2300) {
      // Laminar flow
      return 64 / reynoldsNumber;
    } else {
      // Turbulent flow - Swamee-Jain approximation
      const term1 = Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(reynoldsNumber, 0.9));
      return 0.25 / Math.pow(term1, 2);
    }
  }

  /**
   * Calculate air density based on temperature, pressure, and humidity
   */
  static calculateAirDensity(
    temperature: number = this.STANDARD_TEMPERATURE, // °F
    pressure: number = this.STANDARD_PRESSURE, // psia
    humidity: number = 0 // relative humidity (0-1)
  ): number {
    // Convert temperature to Rankine
    const tempRankine = temperature + 459.67;
    
    // Calculate dry air density
    const gasConstant = 53.35; // ft·lbf/(lbm·°R) for dry air
    const dryAirDensity = (pressure * 144) / (gasConstant * tempRankine); // Convert psia to psf
    
    // Adjust for humidity (simplified)
    const humidityCorrection = 1 - (0.378 * humidity * this.getSaturationPressure(temperature) / pressure);
    
    return dryAirDensity * humidityCorrection;
  }

  /**
   * Get saturation pressure for humidity calculations
   */
  private static getSaturationPressure(temperature: number): number {
    // Antoine equation approximation for water vapor pressure (psia)
    const tempCelsius = (temperature - 32) * 5/9;
    return Math.exp(16.7 - 4060 / (tempCelsius + 235)) * 0.145; // Convert from Pa to psia
  }

  /**
   * Calculate duct sizing based on airflow and velocity
   */
  static calculateDuctSize(airflow: number, velocity: number, shape: 'rectangular' | 'round' = 'round'): DuctDimensions {
    if (airflow <= 0 || velocity <= 0) {
      return { shape, diameter: 0, width: 0, height: 0 };
    }

    const area = airflow / velocity; // ft²

    if (shape === 'round') {
      const diameter = 2 * Math.sqrt(area / Math.PI) * 12; // Convert to inches
      return { shape, diameter: Math.round(diameter) };
    } else {
      // For rectangular, assume aspect ratio of 2:1 (width:height)
      const height = Math.sqrt(area / 2) * 12; // Convert to inches
      const width = height * 2;
      return { 
        shape, 
        width: Math.round(width), 
        height: Math.round(height) 
      };
    }
  }

  /**
   * Validate HVAC parameters against standards
   */
  static validateHVACParameters(params: HVACParams, ductType: 'supply' | 'return' | 'exhaust' = 'supply'): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Validate airflow
    if (params.airflow <= 0) {
      errors.push('Airflow must be greater than 0');
    } else if (params.airflow > 50000) {
      warnings.push('Airflow is unusually high, please verify');
    }

    // Validate velocity if provided
    if (params.velocity !== undefined) {
      const limits = this.SMACNA.maxVelocity[ductType];
      
      if (params.velocity < limits.min) {
        warnings.push(`Velocity ${params.velocity} FPM is below recommended minimum of ${limits.min} FPM for ${ductType} ducts`);
      } else if (params.velocity > limits.max) {
        if (params.velocity > limits.max * 1.2) {
          errors.push(`Velocity ${params.velocity} FPM significantly exceeds maximum of ${limits.max} FPM for ${ductType} ducts`);
        } else {
          warnings.push(`Velocity ${params.velocity} FPM exceeds recommended maximum of ${limits.max} FPM for ${ductType} ducts`);
        }
      }
    }

    // Validate temperature
    if (params.temperature !== undefined) {
      if (params.temperature < -20 || params.temperature > 200) {
        warnings.push('Temperature is outside typical HVAC range (-20°F to 200°F)');
      }
    }

    // Validate pressure
    if (params.pressure !== undefined) {
      if (params.pressure < 10 || params.pressure > 20) {
        warnings.push('Pressure is outside typical atmospheric range (10-20 psia)');
      }
    }

    // Generate recommendations
    if (params.velocity && params.velocity > this.SMACNA.maxVelocity[ductType].max * 0.8) {
      recommendations.push('Consider increasing duct size to reduce velocity and noise');
    }

    if (params.airflow > 10000 && !params.velocity) {
      recommendations.push('High airflow detected - specify target velocity for optimal duct sizing');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      recommendations
    };
  }

  /**
   * Calculate transition length for duct size changes
   */
  static calculateTransitionLength(inlet: DuctDimensions, outlet: DuctDimensions): number {
    const inletEquivalentDiameter = this.calculateEquivalentDiameter(inlet);
    const outletEquivalentDiameter = this.calculateEquivalentDiameter(outlet);
    const sizeDifference = Math.abs(inletEquivalentDiameter - outletEquivalentDiameter);
    
    return sizeDifference * this.SMACNA.transitionSlopeRatio;
  }

  /**
   * Calculate elbow radius for round ducts
   */
  static calculateElbowRadius(diameter: number): number {
    return diameter * this.SMACNA.elbowRadiusRatio;
  }

  /**
   * Get recommended gauge for duct material and size
   */
  static getRecommendedGauge(diameter: number, material: string = 'galvanized_steel'): number {
    // SMACNA gauge selection based on duct size
    if (diameter <= 12) return 30;
    if (diameter <= 18) return 28;
    if (diameter <= 24) return 26;
    if (diameter <= 30) return 24;
    if (diameter <= 42) return 22;
    if (diameter <= 60) return 20;
    return 18; // For larger ducts
  }

  /**
   * Convert between imperial and metric units
   */
  static convertUnits = {
    // Airflow conversions
    cfmToLps: (cfm: number): number => cfm * 0.47195,
    lpsToCfm: (lps: number): number => lps / 0.47195,
    
    // Velocity conversions
    fpmToMps: (fpm: number): number => fpm * 0.00508,
    mpsToFpm: (mps: number): number => mps / 0.00508,
    
    // Pressure conversions
    inWgToPa: (inWg: number): number => inWg * 248.84,
    paToInWg: (pa: number): number => pa / 248.84,
    
    // Length conversions
    inchesToMm: (inches: number): number => inches * 25.4,
    mmToInches: (mm: number): number => mm / 25.4
  };
}
