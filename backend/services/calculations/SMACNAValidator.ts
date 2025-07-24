/**
 * SMACNAValidator - Pure Validation Functions for SMACNA Standards
 * 
 * MISSION-CRITICAL: Pure TypeScript functions for SMACNA, ASHRAE, and NFPA compliance validation
 * Extracted from UI components for reusability and tier enforcement integration
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.4
 */

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  compliant: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  standardReference: string;
  score: number; // 0-100, higher is better
}

/**
 * Calculation data for validation
 */
export interface CalculationData {
  velocity: number; // FPM
  frictionRate: number; // inches w.g. per 100 feet
  ductType: 'round' | 'rectangular';
  airflow: number; // CFM
  diameter?: number; // inches (for round ducts)
  width?: number; // inches (for rectangular ducts)
  height?: number; // inches (for rectangular ducts)
  aspectRatio?: number;
  area: number; // sq ft
  material?: string;
  location?: 'occupied' | 'unoccupied';
  application?: 'supply' | 'return' | 'exhaust' | 'grease';
  pressure?: number; // inches w.g.
  temperature?: number; // °F
}

/**
 * SMACNA standards configuration
 */
interface SMACNAStandards {
  velocity: {
    supply: { min: number; max: number; optimal: number };
    return: { min: number; max: number; optimal: number };
    exhaust: { min: number; max: number; optimal: number };
  };
  friction: {
    low: number; // inches w.g. per 100 feet
    medium: number;
    high: number;
    maximum: number;
  };
  aspectRatio: {
    maximum: number;
    optimal: number;
    minimum: number;
  };
  minimumArea: number; // sq ft
}

/**
 * ASHRAE standards configuration
 */
interface ASHRAEStandards {
  comfortVelocity: {
    occupiedZone: number; // FPM
    unoccupiedZone: number; // FPM
  };
  noiseVelocity: {
    quiet: number; // FPM
    moderate: number; // FPM
    loud: number; // FPM
  };
}

/**
 * NFPA standards configuration
 */
interface NFPAStandards {
  greaseVelocity: {
    minimum: number; // FPM
    recommended: number; // FPM
  };
  greasePressure: {
    maximum: number; // inches w.g.
  };
}

/**
 * SMACNAValidator - Pure validation functions for HVAC standards
 * CRITICAL: No dependencies on UI, storage, or external services
 */
export class SMACNAValidator {
  // SMACNA standards (2012 edition)
  private static readonly SMACNA_STANDARDS: SMACNAStandards = {
    velocity: {
      supply: { min: 400, max: 2500, optimal: 1500 },
      return: { min: 300, max: 2000, optimal: 1200 },
      exhaust: { min: 500, max: 3000, optimal: 1800 }
    },
    friction: {
      low: 0.05,      // Low pressure systems
      medium: 0.08,   // Medium pressure systems
      high: 0.12,     // High pressure systems
      maximum: 0.20   // Maximum recommended
    },
    aspectRatio: {
      maximum: 4.0,   // SMACNA maximum
      optimal: 2.5,   // Optimal for fabrication
      minimum: 1.0    // Square duct
    },
    minimumArea: 0.1  // Minimum duct area (sq ft)
  };

  // ASHRAE standards (2021 Fundamentals)
  private static readonly ASHRAE_STANDARDS: ASHRAEStandards = {
    comfortVelocity: {
      occupiedZone: 750,    // FPM for occupied spaces
      unoccupiedZone: 1500  // FPM for unoccupied spaces
    },
    noiseVelocity: {
      quiet: 1000,     // Libraries, bedrooms
      moderate: 1500,  // Offices, classrooms
      loud: 2000       // Factories, mechanical rooms
    }
  };

  // NFPA 96 standards (2021 edition)
  private static readonly NFPA_STANDARDS: NFPAStandards = {
    greaseVelocity: {
      minimum: 1500,      // Minimum for grease removal
      recommended: 2000   // Recommended for effective cleaning
    },
    greasePressure: {
      maximum: 2.0        // Maximum static pressure
    }
  };

  /**
   * Validate calculation against SMACNA standards
   * CRITICAL: Pure function with comprehensive validation
   */
  public static validateSMACNACompliance(data: CalculationData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      compliant: true,
      errors: [],
      warnings: [],
      recommendations: [],
      standardReference: 'SMACNA HVAC Duct Construction Standards 2012',
      score: 100
    };

    try {
      // Velocity validation
      this.validateVelocity(data, result);
      
      // Friction rate validation
      this.validateFrictionRate(data, result);
      
      // Aspect ratio validation (for rectangular ducts)
      if (data.ductType === 'rectangular' && data.aspectRatio) {
        this.validateAspectRatio(data, result);
      }
      
      // Area validation
      this.validateArea(data, result);
      
      // Material and construction validation
      this.validateConstruction(data, result);

      // Calculate overall score
      result.score = this.calculateSMACNAScore(data, result);
      
    } catch (error) {
      result.errors.push(`SMACNA validation error: ${error.message}`);
      result.isValid = false;
      result.compliant = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * Validate calculation against ASHRAE standards
   */
  public static validateASHRAECompliance(data: CalculationData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      compliant: true,
      errors: [],
      warnings: [],
      recommendations: [],
      standardReference: 'ASHRAE Fundamentals 2021 Chapter 21',
      score: 100
    };

    try {
      const { velocity, location = 'unoccupied' } = data;
      const standards = this.ASHRAE_STANDARDS;

      // Comfort velocity validation
      if (location === 'occupied') {
        if (velocity > standards.comfortVelocity.occupiedZone) {
          result.warnings.push(
            `Velocity ${velocity} FPM in occupied zone exceeds ASHRAE comfort limit of ${standards.comfortVelocity.occupiedZone} FPM`
          );
          result.score -= 20;
        }
      } else {
        if (velocity > standards.comfortVelocity.unoccupiedZone) {
          result.warnings.push(
            `Velocity ${velocity} FPM exceeds ASHRAE general limit of ${standards.comfortVelocity.unoccupiedZone} FPM`
          );
          result.score -= 10;
        }
      }

      // Noise velocity validation
      if (velocity > standards.noiseVelocity.loud) {
        result.warnings.push(
          `High velocity ${velocity} FPM may cause excessive noise`
        );
        result.recommendations.push('Consider noise attenuation measures');
        result.score -= 15;
      } else if (velocity > standards.noiseVelocity.moderate) {
        result.recommendations.push('Monitor noise levels in occupied spaces');
        result.score -= 5;
      }

    } catch (error) {
      result.errors.push(`ASHRAE validation error: ${error.message}`);
      result.isValid = false;
      result.compliant = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * Validate calculation against NFPA 96 standards (for grease ducts)
   */
  public static validateNFPACompliance(data: CalculationData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      compliant: true,
      errors: [],
      warnings: [],
      recommendations: [],
      standardReference: 'NFPA 96 Standard for Ventilation Control and Fire Protection 2021',
      score: 100
    };

    try {
      if (data.application !== 'grease') {
        result.warnings.push('NFPA 96 validation only applies to grease exhaust systems');
        return result;
      }

      const { velocity, pressure = 0 } = data;
      const standards = this.NFPA_STANDARDS;

      // Velocity validation for grease removal
      if (velocity < standards.greaseVelocity.minimum) {
        result.errors.push(
          `Velocity ${velocity} FPM is below NFPA 96 minimum of ${standards.greaseVelocity.minimum} FPM for grease removal`
        );
        result.compliant = false;
        result.score -= 50;
      } else if (velocity < standards.greaseVelocity.recommended) {
        result.warnings.push(
          `Velocity ${velocity} FPM is below NFPA 96 recommended minimum of ${standards.greaseVelocity.recommended} FPM`
        );
        result.score -= 20;
      }

      // Pressure validation
      if (pressure > standards.greasePressure.maximum) {
        result.warnings.push(
          `Static pressure ${pressure} inches w.g. exceeds NFPA 96 recommended maximum of ${standards.greasePressure.maximum} inches w.g.`
        );
        result.score -= 15;
      }

      // Additional grease duct requirements
      if (data.ductType !== 'round') {
        result.warnings.push('NFPA 96 recommends round ducts for grease exhaust systems');
        result.recommendations.push('Consider using round duct for easier cleaning and maintenance');
        result.score -= 10;
      }

    } catch (error) {
      result.errors.push(`NFPA validation error: ${error.message}`);
      result.isValid = false;
      result.compliant = false;
      result.score = 0;
    }

    return result;
  }

  /**
   * Validate against all applicable standards
   */
  public static validateAllStandards(data: CalculationData): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    // Always validate SMACNA for general ductwork
    results.smacna = this.validateSMACNACompliance(data);

    // Validate ASHRAE for comfort considerations
    results.ashrae = this.validateASHRAECompliance(data);

    // Validate NFPA if it's a grease duct
    if (data.application === 'grease') {
      results.nfpa = this.validateNFPACompliance(data);
    }

    return results;
  }

  /**
   * Validate velocity against SMACNA standards
   */
  private static validateVelocity(data: CalculationData, result: ValidationResult): void {
    const { velocity, application = 'supply' } = data;
    const limits = this.SMACNA_STANDARDS.velocity[application] || this.SMACNA_STANDARDS.velocity.supply;

    if (velocity < limits.min) {
      result.warnings.push(
        `Velocity ${velocity} FPM is below SMACNA minimum of ${limits.min} FPM for ${application} duct`
      );
      result.score -= 15;
    } else if (velocity > limits.max) {
      result.errors.push(
        `Velocity ${velocity} FPM exceeds SMACNA maximum of ${limits.max} FPM for ${application} duct`
      );
      result.compliant = false;
      result.score -= 30;
    } else if (velocity > limits.optimal * 1.2) {
      result.warnings.push(
        `Velocity ${velocity} FPM is above optimal range (${limits.optimal} FPM ±20%) for ${application} duct`
      );
      result.score -= 10;
    } else if (velocity < limits.optimal * 0.8) {
      result.recommendations.push(
        `Consider reducing duct size to achieve optimal velocity of ${limits.optimal} FPM`
      );
      result.score -= 5;
    }
  }

  /**
   * Validate friction rate against SMACNA standards
   */
  private static validateFrictionRate(data: CalculationData, result: ValidationResult): void {
    const { frictionRate } = data;
    const standards = this.SMACNA_STANDARDS.friction;

    if (frictionRate > standards.maximum) {
      result.errors.push(
        `Friction rate ${frictionRate.toFixed(3)} inches w.g./100ft exceeds SMACNA maximum of ${standards.maximum} inches w.g./100ft`
      );
      result.compliant = false;
      result.score -= 25;
    } else if (frictionRate > standards.high) {
      result.warnings.push(
        `High friction rate ${frictionRate.toFixed(3)} inches w.g./100ft may cause excessive pressure loss`
      );
      result.score -= 15;
    } else if (frictionRate < standards.low) {
      result.recommendations.push(
        'Low friction rate indicates oversized duct - consider optimization for cost savings'
      );
      result.score -= 5;
    }
  }

  /**
   * Validate aspect ratio for rectangular ducts
   */
  private static validateAspectRatio(data: CalculationData, result: ValidationResult): void {
    const { aspectRatio } = data;
    if (!aspectRatio) return;

    const standards = this.SMACNA_STANDARDS.aspectRatio;

    if (aspectRatio > standards.maximum) {
      result.errors.push(
        `Aspect ratio ${aspectRatio.toFixed(1)}:1 exceeds SMACNA maximum of ${standards.maximum}:1`
      );
      result.compliant = false;
      result.score -= 20;
      result.recommendations.push('Consider using round duct or reducing aspect ratio');
    } else if (aspectRatio > standards.optimal) {
      result.warnings.push(
        `Aspect ratio ${aspectRatio.toFixed(1)}:1 is above optimal range for fabrication and performance`
      );
      result.score -= 10;
      result.recommendations.push('Aspect ratios between 2:1 and 3:1 are optimal');
    } else if (aspectRatio < standards.minimum + 0.5) {
      result.recommendations.push(
        'Very low aspect ratio may be inefficient - consider increasing for better material utilization'
      );
      result.score -= 3;
    }
  }

  /**
   * Validate duct area
   */
  private static validateArea(data: CalculationData, result: ValidationResult): void {
    const { area } = data;

    if (area < this.SMACNA_STANDARDS.minimumArea) {
      result.warnings.push(
        `Very small duct area ${area.toFixed(2)} sq ft. Consider minimum duct size requirements.`
      );
      result.score -= 10;
    }

    // Check for extremely large areas that might indicate calculation errors
    if (area > 100) {
      result.warnings.push(
        `Very large duct area ${area.toFixed(2)} sq ft. Verify calculation inputs.`
      );
      result.score -= 5;
    }
  }

  /**
   * Validate construction and material considerations
   */
  private static validateConstruction(data: CalculationData, result: ValidationResult): void {
    const { material, ductType, diameter, width, height } = data;

    // Material-specific recommendations
    if (material === 'fiberglass' && data.velocity > 2000) {
      result.warnings.push('High velocity with fiberglass ductwork may cause erosion');
      result.recommendations.push('Consider metallic ductwork for high-velocity applications');
      result.score -= 10;
    }

    // Size-specific recommendations
    if (ductType === 'round' && diameter && diameter < 6) {
      result.recommendations.push('Small round ducts may be difficult to clean and maintain');
    }

    if (ductType === 'rectangular' && width && height) {
      const minDimension = Math.min(width, height);
      if (minDimension < 6) {
        result.warnings.push('Small duct dimensions may restrict airflow and be difficult to clean');
        result.score -= 5;
      }
    }
  }

  /**
   * Calculate overall SMACNA compliance score
   */
  private static calculateSMACNAScore(data: CalculationData, result: ValidationResult): number {
    let score = 100;

    // Deduct points for errors and warnings (already done in individual validations)
    // Additional scoring based on optimization
    const { velocity, application = 'supply' } = data;
    const optimalVelocity = this.SMACNA_STANDARDS.velocity[application]?.optimal || 1500;

    // Bonus points for being close to optimal velocity
    const velocityDeviation = Math.abs(velocity - optimalVelocity) / optimalVelocity;
    if (velocityDeviation < 0.1) {
      score += 5; // Bonus for being very close to optimal
    }

    // Ensure score doesn't go below 0 or above 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get SMACNA standards reference data
   */
  public static getSMACNAStandards(): SMACNAStandards {
    return JSON.parse(JSON.stringify(this.SMACNA_STANDARDS));
  }

  /**
   * Get ASHRAE standards reference data
   */
  public static getASHRAEStandards(): ASHRAEStandards {
    return JSON.parse(JSON.stringify(this.ASHRAE_STANDARDS));
  }

  /**
   * Get NFPA standards reference data
   */
  public static getNFPAStandards(): NFPAStandards {
    return JSON.parse(JSON.stringify(this.NFPA_STANDARDS));
  }

  /**
   * Validate input data completeness
   */
  public static validateInputData(data: CalculationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.velocity || data.velocity <= 0) {
      errors.push('Velocity must be greater than 0');
    }

    if (!data.airflow || data.airflow <= 0) {
      errors.push('Airflow must be greater than 0');
    }

    if (!data.area || data.area <= 0) {
      errors.push('Area must be greater than 0');
    }

    if (!['round', 'rectangular'].includes(data.ductType)) {
      errors.push('Duct type must be "round" or "rectangular"');
    }

    if (data.ductType === 'rectangular') {
      if (!data.width || data.width <= 0) {
        errors.push('Width must be greater than 0 for rectangular ducts');
      }
      if (!data.height || data.height <= 0) {
        errors.push('Height must be greater than 0 for rectangular ducts');
      }
    }

    if (data.ductType === 'round') {
      if (!data.diameter || data.diameter <= 0) {
        errors.push('Diameter must be greater than 0 for round ducts');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default SMACNAValidator;
