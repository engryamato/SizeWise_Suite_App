/**
 * FittingLossCalculator - Modular calculation service for HVAC fitting losses
 * 
 * MISSION-CRITICAL: Pure TypeScript functions for ASHRAE/SMACNA-compliant fitting loss calculations
 * Handles minor losses for elbows, tees, transitions, diffusers, and other HVAC components
 * 
 * @see docs/implementation/duct-physics/fitting-loss-calculations.md
 * @see backend/data/fitting_coefficients.json
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load fitting coefficients data
const loadFittingCoefficients = () => {
  try {
    const dataPath = join(__dirname, '../../data/fitting_coefficients.json');
    const rawData = readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.warn('Could not load fitting coefficients, using fallback data');
    return {
      metadata: { version: '1.0.0', standard: 'ASHRAE/SMACNA' },
      round_fittings: { elbows: {}, tees: {}, transitions: {}, entries_exits: {} },
      rectangular_fittings: { elbows: {}, transitions: {} },
      special_fittings: { dampers: {}, diffusers: {} }
    };
  }
};

const fittingCoefficients = loadFittingCoefficients();

/**
 * Fitting configuration for loss calculations
 */
export interface FittingConfiguration {
  type: string; // e.g., '90deg_round_smooth', 'tee_round_branch_90deg'
  subtype?: string; // e.g., 'radius_to_diameter_ratios', 'flow_patterns'
  parameter?: string | number; // e.g., '1.5', 0.5, 'straight_through'
  ductShape: 'round' | 'rectangular';
  diameter?: number; // inches (for round ducts)
  width?: number; // inches (for rectangular ducts)
  height?: number; // inches (for rectangular ducts)
  additionalParams?: Record<string, any>; // For complex fittings
}

/**
 * Fitting loss calculation result
 */
export interface FittingLossResult {
  kFactor: number; // Loss coefficient
  pressureLoss: number; // inches w.g.
  velocityPressure: number; // inches w.g.
  fittingType: string;
  configuration: string;
  warnings: string[];
  recommendations: string[];
}

/**
 * Velocity pressure calculation input
 */
export interface VelocityPressureInput {
  velocity: number; // FPM
  airDensity?: number; // lb/ft³ (default: 0.075 at standard conditions)
}

/**
 * FittingLossCalculator - Pure calculation functions for fitting losses
 * CRITICAL: No dependencies on UI, storage, or external services
 */
export class FittingLossCalculator {
  
  /**
   * Calculate velocity pressure from air velocity
   * Formula: VP = (V/4005)² for standard air density
   */
  public static calculateVelocityPressure(input: VelocityPressureInput): number {
    const { velocity, airDensity = 0.075 } = input;
    
    // Standard formula: VP = ρV²/(2gc) converted to inches w.g.
    // Simplified for standard conditions: VP = (V/4005)²
    const standardVP = Math.pow(velocity / 4005, 2);
    
    // Adjust for non-standard air density
    const densityRatio = airDensity / 0.075;
    return standardVP * densityRatio;
  }

  /**
   * Calculate fitting loss for a specific fitting configuration
   */
  public static calculateFittingLoss(
    config: FittingConfiguration,
    velocity: number,
    airDensity: number = 0.075
  ): FittingLossResult {
    
    // Calculate velocity pressure
    const velocityPressure = this.calculateVelocityPressure({ velocity, airDensity });
    
    // Get K-factor for the fitting
    const kFactorResult = this.getKFactor(config);
    
    // Calculate pressure loss: ΔP = K × VP
    const pressureLoss = kFactorResult.kFactor * velocityPressure;
    
    return {
      kFactor: kFactorResult.kFactor,
      pressureLoss,
      velocityPressure,
      fittingType: config.type,
      configuration: kFactorResult.configuration,
      warnings: kFactorResult.warnings,
      recommendations: kFactorResult.recommendations
    };
  }

  /**
   * Get K-factor for a specific fitting configuration
   */
  private static getKFactor(config: FittingConfiguration): {
    kFactor: number;
    configuration: string;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const fittingData = this.getFittingData(config);
      
      if (!fittingData) {
        warnings.push(`Fitting type '${config.type}' not found in database`);
        return { kFactor: 0.5, configuration: 'default', warnings, recommendations };
      }

      // Handle different fitting data structures
      let kFactor: number;
      let configDescription: string;

      if (config.type.includes('elbow')) {
        const result = this.handleElbowKFactor(fittingData, config);
        kFactor = result.kFactor;
        configDescription = result.configuration;
        warnings.push(...result.warnings);
        recommendations.push(...result.recommendations);
      } else if (config.type.includes('tee')) {
        const result = this.handleTeeKFactor(fittingData, config);
        kFactor = result.kFactor;
        configDescription = result.configuration;
        warnings.push(...result.warnings);
        recommendations.push(...result.recommendations);
      } else if (config.type.includes('transition')) {
        const result = this.handleTransitionKFactor(fittingData, config);
        kFactor = result.kFactor;
        configDescription = result.configuration;
        warnings.push(...result.warnings);
        recommendations.push(...result.recommendations);
      } else if (config.type.includes('damper')) {
        const result = this.handleDamperKFactor(fittingData, config);
        kFactor = result.kFactor;
        configDescription = result.configuration;
        warnings.push(...result.warnings);
        recommendations.push(...result.recommendations);
      } else {
        // Generic fitting handling
        const result = this.handleGenericKFactor(fittingData, config);
        kFactor = result.kFactor;
        configDescription = result.configuration;
        warnings.push(...result.warnings);
        recommendations.push(...result.recommendations);
      }

      return { kFactor, configuration: configDescription, warnings, recommendations };

    } catch (error) {
      warnings.push(`Error calculating K-factor: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { kFactor: 0.5, configuration: 'error_default', warnings, recommendations };
    }
  }

  /**
   * Get fitting data from the coefficients database
   */
  private static getFittingData(config: FittingConfiguration): any {
    const { type, ductShape } = config;
    
    if (ductShape === 'round') {
      return fittingCoefficients.round_fittings.elbows[type] ||
             fittingCoefficients.round_fittings.tees[type] ||
             fittingCoefficients.round_fittings.transitions[type] ||
             fittingCoefficients.round_fittings.entries_exits[type] ||
             fittingCoefficients.special_fittings.dampers[type] ||
             fittingCoefficients.special_fittings.diffusers[type];
    } else if (ductShape === 'rectangular') {
      return fittingCoefficients.rectangular_fittings.elbows[type] ||
             fittingCoefficients.rectangular_fittings.transitions[type] ||
             fittingCoefficients.special_fittings.dampers[type] ||
             fittingCoefficients.special_fittings.diffusers[type];
    }
    
    return null;
  }

  /**
   * Handle elbow K-factor calculation
   */
  private static handleElbowKFactor(fittingData: any, config: FittingConfiguration): {
    kFactor: number;
    configuration: string;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    if (fittingData.radius_to_diameter_ratios) {
      const ratio = config.parameter?.toString() || '1.0';
      const ratioData = fittingData.radius_to_diameter_ratios[ratio];
      
      if (ratioData) {
        if (parseFloat(ratio) < 1.0) {
          warnings.push('Sharp radius elbow may cause excessive pressure loss');
          recommendations.push('Consider using radius-to-diameter ratio ≥ 1.5 for optimal performance');
        }
        return {
          kFactor: ratioData.K,
          configuration: `R/D = ${ratio}`,
          warnings,
          recommendations
        };
      }
    }
    
    if (fittingData.configurations) {
      const configType = config.parameter?.toString() || 'single_miter';
      const configData = fittingData.configurations[configType];
      
      if (configData) {
        if (configType === 'single_miter') {
          warnings.push('Single miter elbow has high pressure loss');
          recommendations.push('Consider using multiple miters or smooth radius elbow');
        }
        return {
          kFactor: configData.K,
          configuration: configType,
          warnings,
          recommendations
        };
      }
    }
    
    warnings.push('Elbow configuration not found, using default');
    return { kFactor: 0.3, configuration: 'default', warnings, recommendations };
  }

  /**
   * Handle tee K-factor calculation
   */
  private static handleTeeKFactor(fittingData: any, config: FittingConfiguration): {
    kFactor: number;
    configuration: string;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const flowPattern = config.subtype || 'straight_through';
    const areaRatio = config.parameter?.toString() || '0.5';
    
    if (fittingData.flow_patterns?.[flowPattern]?.area_ratios?.[areaRatio]) {
      const kData = fittingData.flow_patterns[flowPattern].area_ratios[areaRatio];
      
      if (parseFloat(areaRatio) > 0.75) {
        warnings.push('Large branch area ratio may cause flow imbalance');
        recommendations.push('Consider flow balancing dampers for large branches');
      }
      
      return {
        kFactor: kData.K,
        configuration: `${flowPattern}, area ratio = ${areaRatio}`,
        warnings,
        recommendations
      };
    }
    
    warnings.push('Tee configuration not found, using default');
    return { kFactor: 0.6, configuration: 'default', warnings, recommendations };
  }

  /**
   * Handle transition K-factor calculation
   */
  private static handleTransitionKFactor(fittingData: any, config: FittingConfiguration): {
    kFactor: number;
    configuration: string;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    if (fittingData.length_to_diameter_ratios) {
      const ratio = config.parameter?.toString() || '1.0';
      const ratioData = fittingData.length_to_diameter_ratios[ratio];
      
      if (ratioData) {
        if (parseFloat(ratio) < 1.5) {
          warnings.push('Short transition may cause flow separation');
          recommendations.push('Consider using length-to-diameter ratio ≥ 2.0 for gradual transition');
        }
        return {
          kFactor: ratioData.K,
          configuration: `L/D = ${ratio}`,
          warnings,
          recommendations
        };
      }
    }
    
    warnings.push('Transition configuration not found, using default');
    return { kFactor: 0.2, configuration: 'default', warnings, recommendations };
  }

  /**
   * Handle damper K-factor calculation
   */
  private static handleDamperKFactor(fittingData: any, config: FittingConfiguration): {
    kFactor: number;
    configuration: string;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const angle = config.parameter?.toString() || '90';
    const angleData = fittingData.opening_angles?.[angle];
    
    if (angleData) {
      const angleNum = parseFloat(angle);
      if (angleNum < 45) {
        warnings.push('Damper significantly restricting flow');
        recommendations.push('Consider opening damper further to reduce pressure loss');
      }
      
      return {
        kFactor: angleData.K,
        configuration: `${angle}° open`,
        warnings,
        recommendations
      };
    }
    
    warnings.push('Damper angle not found, using default');
    return { kFactor: 0.2, configuration: 'default', warnings, recommendations };
  }

  /**
   * Handle generic fitting K-factor calculation
   */
  private static handleGenericKFactor(fittingData: any, config: FittingConfiguration): {
    kFactor: number;
    configuration: string;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Try to find K value in various structures
    if (typeof fittingData.K === 'number') {
      return { kFactor: fittingData.K, configuration: 'direct', warnings, recommendations };
    }
    
    if (fittingData.types) {
      const subtype = config.subtype || Object.keys(fittingData.types)[0];
      const subtypeData = fittingData.types[subtype];
      if (subtypeData?.K) {
        return {
          kFactor: subtypeData.K,
          configuration: subtype,
          warnings,
          recommendations
        };
      }
    }
    
    warnings.push('Generic fitting configuration not found, using default');
    return { kFactor: 0.5, configuration: 'default', warnings, recommendations };
  }

  /**
   * Get available fitting types for a duct shape
   */
  public static getAvailableFittings(ductShape: 'round' | 'rectangular'): string[] {
    if (ductShape === 'round') {
      return [
        ...Object.keys(fittingCoefficients.round_fittings.elbows),
        ...Object.keys(fittingCoefficients.round_fittings.tees),
        ...Object.keys(fittingCoefficients.round_fittings.transitions),
        ...Object.keys(fittingCoefficients.round_fittings.entries_exits),
        ...Object.keys(fittingCoefficients.special_fittings.dampers),
        ...Object.keys(fittingCoefficients.special_fittings.diffusers)
      ];
    } else {
      return [
        ...Object.keys(fittingCoefficients.rectangular_fittings.elbows),
        ...Object.keys(fittingCoefficients.rectangular_fittings.transitions),
        ...Object.keys(fittingCoefficients.special_fittings.dampers),
        ...Object.keys(fittingCoefficients.special_fittings.diffusers)
      ];
    }
  }

  /**
   * Get fitting metadata and description
   */
  public static getFittingMetadata(): typeof fittingCoefficients.metadata {
    return fittingCoefficients.metadata;
  }
}
