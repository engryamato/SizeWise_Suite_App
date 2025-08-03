/**
 * Comprehensive Validation System for 3D Duct Fittings
 * SMACNA-compliant validation with detailed error reporting
 */

import { 
  FittingParams, 
  ElbowParams, 
  TransitionParams, 
  WyeParams, 
  TeeParams,
  ValidationResult,
  ComplianceResult,
  FittingType
} from './fitting-interfaces';
import {
  MaterialType,
  GaugeType,
  getWallThickness,
  getRecommendedGauge,
  isValidGaugeForMaterial,
  SMACNA_GAUGE_RECOMMENDATIONS,
  SMACNA_GAUGE_TABLE
} from './smacna-gauge-tables';

export interface ValidationRule {
  name: string;
  description: string;
  validate: (params: FittingParams) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  standard?: string;
}

export interface ValidationContext {
  enableSMACNACompliance: boolean;
  enablePerformanceChecks: boolean;
  enableCostOptimization: boolean;
  customRules?: ValidationRule[];
}

export class ValidationSystem {
  private rules: Map<string, ValidationRule>;
  private context: ValidationContext;

  constructor(context: ValidationContext = {
    enableSMACNACompliance: true,
    enablePerformanceChecks: true,
    enableCostOptimization: false
  }) {
    this.context = context;
    this.rules = new Map();
    this.initializeStandardRules();
    
    if (context.customRules) {
      context.customRules.forEach(rule => this.addRule(rule));
    }
  }

  /**
   * Initialize standard validation rules
   */
  private initializeStandardRules(): void {
    // Basic parameter validation
    this.addRule({
      name: 'positive_dimensions',
      description: 'All dimensions must be positive',
      severity: 'error',
      validate: (params) => this.validatePositiveDimensions(params)
    });

    this.addRule({
      name: 'material_gauge_compatibility',
      description: 'Gauge must be available for selected material',
      severity: 'error',
      validate: (params) => this.validateMaterialGaugeCompatibility(params)
    });

    // SMACNA compliance rules
    if (this.context.enableSMACNACompliance) {
      this.addRule({
        name: 'smacna_gauge_minimum',
        description: 'Gauge must meet SMACNA minimum requirements',
        severity: 'warning',
        standard: 'SMACNA',
        validate: (params) => this.validateSMACNAGaugeMinimum(params)
      });

      this.addRule({
        name: 'smacna_transition_angle',
        description: 'Transition angle should not exceed SMACNA recommendations',
        severity: 'warning',
        standard: 'SMACNA',
        validate: (params) => this.validateSMACNATransitionAngle(params)
      });

      this.addRule({
        name: 'smacna_bend_radius',
        description: 'Bend radius should meet SMACNA recommendations',
        severity: 'warning',
        standard: 'SMACNA',
        validate: (params) => this.validateSMACNABendRadius(params)
      });

      this.addRule({
        name: 'smacna_diameter_limits',
        description: 'Diameter should be within SMACNA standard ranges',
        severity: 'warning',
        standard: 'SMACNA',
        validate: (params) => this.validateSMACNADiameterLimits(params)
      });

      this.addRule({
        name: 'smacna_material_compatibility',
        description: 'Material and gauge combination should follow SMACNA standards',
        severity: 'error',
        standard: 'SMACNA',
        validate: (params) => this.validateSMACNAMaterialCompatibility(params)
      });
    }

    // Performance optimization rules
    if (this.context.enablePerformanceChecks) {
      this.addRule({
        name: 'airflow_optimization',
        description: 'Check for optimal airflow characteristics',
        severity: 'info',
        validate: (params) => this.validateAirflowOptimization(params)
      });

      this.addRule({
        name: 'pressure_drop_estimation',
        description: 'Estimate pressure drop characteristics',
        severity: 'info',
        validate: (params) => this.validatePressureDrop(params)
      });
    }

    // Cost optimization rules
    if (this.context.enableCostOptimization) {
      this.addRule({
        name: 'material_cost_optimization',
        description: 'Suggest cost-effective material alternatives',
        severity: 'info',
        validate: (params) => this.validateCostOptimization(params)
      });
    }
  }

  /**
   * Add a validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.name, rule);
  }

  /**
   * Remove a validation rule
   */
  removeRule(name: string): void {
    this.rules.delete(name);
  }

  /**
   * Validate fitting parameters against all rules
   */
  validateFitting(params: FittingParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];
    const recommendations: any = {};

    // Run all validation rules
    for (const rule of this.rules.values()) {
      try {
        const result = rule.validate(params);
        
        if (!result.isValid) {
          switch (rule.severity) {
            case 'error':
              errors.push(...result.errors);
              break;
            case 'warning':
              warnings.push(...result.errors);
              break;
            case 'info':
              info.push(...result.errors);
              break;
          }
        }

        // Merge recommendations
        if (result.recommendations) {
          Object.assign(recommendations, result.recommendations);
        }
      } catch (error) {
        console.warn(`Validation rule ${rule.name} failed:`, error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations: Object.keys(recommendations).length > 0 ? recommendations : undefined
    };
  }

  /**
   * Check SMACNA compliance specifically
   */
  checkSMACNACompliance(params: FittingParams): ComplianceResult {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Run SMACNA-specific rules
    for (const rule of this.rules.values()) {
      if (rule.standard === 'SMACNA') {
        try {
          const result = rule.validate(params);
          if (!result.isValid) {
            violations.push(...result.errors);
          }
          if (result.warnings) {
            recommendations.push(...result.warnings);
          }
        } catch (error) {
          console.warn(`SMACNA compliance check ${rule.name} failed:`, error);
        }
      }
    }

    return {
      isCompliant: violations.length === 0,
      standard: 'SMACNA',
      violations,
      recommendations
    };
  }

  // Individual validation methods

  private validatePositiveDimensions(params: FittingParams): ValidationResult {
    const errors: string[] = [];

    if ('diameter' in params && params.diameter <= 0) {
      errors.push('Diameter must be greater than 0');
    }
    if ('inletDiameter' in params && params.inletDiameter <= 0) {
      errors.push('Inlet diameter must be greater than 0');
    }
    if ('outletDiameter' in params && params.outletDiameter <= 0) {
      errors.push('Outlet diameter must be greater than 0');
    }
    if ('length' in params && params.length <= 0) {
      errors.push('Length must be greater than 0');
    }
    if ('bendRadius' in params && params.bendRadius <= 0) {
      errors.push('Bend radius must be greater than 0');
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private validateMaterialGaugeCompatibility(params: FittingParams): ValidationResult {
    const errors: string[] = [];

    if (!isValidGaugeForMaterial(params.material, params.gauge)) {
      errors.push(`Gauge ${params.gauge} is not available for ${params.material}`);
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private validateSMACNAGaugeMinimum(params: FittingParams): ValidationResult {
    const errors: string[] = [];
    const recommendations: any = {};

    // Determine the critical diameter for gauge selection
    let diameter = 0;
    if ('diameter' in params) {
      diameter = params.diameter;
    } else if ('inletDiameter' in params && 'outletDiameter' in params) {
      diameter = Math.max(params.inletDiameter, params.outletDiameter);
    } else if ('mainDiameter' in params) {
      diameter = params.mainDiameter;
    }

    if (diameter > 0) {
      const gaugeRec = getRecommendedGauge(diameter, params.material);
      if (gaugeRec) {
        const currentGaugeNum = parseInt(params.gauge);
        const minGaugeNum = parseInt(gaugeRec.minimum);
        
        if (currentGaugeNum > minGaugeNum) {
          errors.push(`Gauge ${params.gauge} is thinner than SMACNA minimum ${gaugeRec.minimum} for ${diameter}" diameter`);
        }
        
        if (params.gauge !== gaugeRec.recommended) {
          recommendations.gauge = gaugeRec.recommended;
        }
      }
    }

    return { 
      isValid: errors.length === 0, 
      errors, 
      warnings: [],
      recommendations: Object.keys(recommendations).length > 0 ? recommendations : undefined
    };
  }

  private validateSMACNATransitionAngle(params: FittingParams): ValidationResult {
    const errors: string[] = [];

    if ('inletDiameter' in params && 'outletDiameter' in params && 'length' in params) {
      const diameterDiff = Math.abs(params.inletDiameter - params.outletDiameter);
      const angle = Math.atan(diameterDiff / (2 * params.length)) * 180 / Math.PI;
      
      if (angle > 15) {
        errors.push(`Transition angle (${angle.toFixed(1)}°) exceeds SMACNA recommended maximum of 15°`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private validateSMACNABendRadius(params: FittingParams): ValidationResult {
    const errors: string[] = [];

    if ('diameter' in params && 'bendRadius' in params) {
      const minRadius = params.diameter * 1.5; // SMACNA recommendation
      if (params.bendRadius < minRadius) {
        errors.push(`Bend radius (${params.bendRadius}") should be at least 1.5 times diameter (${minRadius}") for optimal airflow`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private validateAirflowOptimization(params: FittingParams): ValidationResult {
    const errors: string[] = [];

    // Check for common airflow optimization issues
    if ('diameter' in params && 'bendRadius' in params) {
      const radiusRatio = params.bendRadius / params.diameter;
      if (radiusRatio < 2.0) {
        errors.push(`Consider increasing bend radius to at least 2x diameter for better airflow (current: ${radiusRatio.toFixed(1)}x)`);
      }
    }

    if ('inletDiameter' in params && 'outletDiameter' in params) {
      const reductionRatio = params.outletDiameter / params.inletDiameter;
      if (reductionRatio < 0.5) {
        errors.push(`Large diameter reduction (${(reductionRatio * 100).toFixed(0)}%) may cause significant pressure drop`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private validatePressureDrop(params: FittingParams): ValidationResult {
    const errors: string[] = [];

    // Simplified pressure drop estimation
    if ('diameter' in params && 'angle' in params) {
      // Elbow pressure drop estimation
      const angleFactor = params.angle / 90; // Normalize to 90-degree elbow
      const estimatedPressureDrop = angleFactor * 0.25; // Simplified calculation
      
      if (estimatedPressureDrop > 0.5) {
        errors.push(`Estimated pressure drop (${estimatedPressureDrop.toFixed(2)} in. w.g.) may be high for this configuration`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private validateCostOptimization(params: FittingParams): ValidationResult {
    const errors: string[] = [];
    const recommendations: any = {};

    // Suggest cost-effective alternatives
    if (params.material === 'stainless_steel') {
      errors.push('Consider galvanized steel for cost savings if corrosion resistance is not critical');
      recommendations.material = 'galvanized_steel';
    }

    // Gauge optimization
    const diameter = this.extractDiameter(params);
    if (diameter > 0) {
      const gaugeRec = getRecommendedGauge(diameter, params.material);
      if (gaugeRec && params.gauge !== gaugeRec.recommended) {
        const currentGaugeNum = parseInt(params.gauge);
        const recGaugeNum = parseInt(gaugeRec.recommended);
        
        if (currentGaugeNum < recGaugeNum) {
          errors.push(`Consider using recommended gauge ${gaugeRec.recommended} instead of ${params.gauge} for cost optimization`);
          recommendations.gauge = gaugeRec.recommended;
        }
      }
    }

    return { 
      isValid: errors.length === 0, 
      errors, 
      warnings: [],
      recommendations: Object.keys(recommendations).length > 0 ? recommendations : undefined
    };
  }

  private extractDiameter(params: FittingParams): number {
    if ('diameter' in params) return params.diameter;
    if ('inletDiameter' in params && 'outletDiameter' in params) {
      return Math.max(params.inletDiameter, params.outletDiameter);
    }
    if ('mainDiameter' in params) return params.mainDiameter;
    return 0;
  }

  private validateSMACNADiameterLimits(params: FittingParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const diameter = this.extractDiameter(params);

    if (diameter > 0) {
      // SMACNA standard diameter limits
      if (diameter < 4) {
        warnings.push(`Diameter ${diameter}" is below typical SMACNA minimum of 4"`);
      }

      if (diameter > 120) {
        warnings.push(`Diameter ${diameter}" exceeds typical SMACNA maximum of 120"`);
      }

      // Check for non-standard sizes
      const standardSizes = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 42, 44, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120];
      const isStandardSize = standardSizes.some(size => Math.abs(diameter - size) < 0.1);

      if (!isStandardSize) {
        warnings.push(`Diameter ${diameter}" is not a standard SMACNA size. Consider using nearest standard size.`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateSMACNAMaterialCompatibility(params: FittingParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if gauge is available for the selected material
    if (!isValidGaugeForMaterial(params.material, params.gauge)) {
      errors.push(`Gauge ${params.gauge} is not available for ${params.material}. Available gauges: ${SMACNA_GAUGE_TABLE[params.material] ? Object.keys(SMACNA_GAUGE_TABLE[params.material]).join(', ') : 'none'}`);
    }

    // Check material-specific recommendations
    const diameter = this.extractDiameter(params);
    if (diameter > 0) {
      // Stainless steel recommendations
      if (params.material === 'stainless_steel' && diameter > 48) {
        warnings.push('Stainless steel is typically not cost-effective for diameters over 48". Consider galvanized steel.');
      }

      // Aluminum recommendations
      if (params.material === 'aluminum' && diameter < 8) {
        warnings.push('Aluminum is typically not used for small diameters under 8". Consider galvanized steel.');
      }

      // High-pressure applications
      if (params.material === 'aluminum' && parseInt(params.gauge) > 22) {
        warnings.push('Aluminum with thin gauge (>22) may not be suitable for high-pressure applications.');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Update validation context
   */
  updateContext(newContext: Partial<ValidationContext>): void {
    this.context = { ...this.context, ...newContext };
    
    // Reinitialize rules with new context
    this.rules.clear();
    this.initializeStandardRules();
    
    if (this.context.customRules) {
      this.context.customRules.forEach(rule => this.addRule(rule));
    }
  }

  /**
   * Get current validation context
   */
  getContext(): ValidationContext {
    return { ...this.context };
  }

  /**
   * Get all available validation rules
   */
  getAvailableRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }
}

// Export singleton instance
export const validationSystem = new ValidationSystem();
