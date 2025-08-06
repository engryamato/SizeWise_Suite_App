/**
 * SMACNA Standards Validator
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive SMACNA (Sheet Metal and Air Conditioning Contractors' National Association)
 * standards validation for professional HVAC design compliance. Includes detailed radius
 * ratios, pressure drop calculations, and code compliance checking for engineering-grade
 * ductwork design validation.
 * 
 * @fileoverview SMACNA standards validation system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline } from '@/types/air-duct-sizer';
import { 
  SnapLogicError, 
  SMACNAValidationError,
  ErrorCategory, 
  ErrorSeverity 
} from '../system/SnapLogicError';
import { ValidationUtils, ValidationResult } from '../utils/ValidationUtils';

/**
 * SMACNA standard versions
 */
export enum SMACNAStandard {
  HVAC_2019 = 'HVAC-2019',
  HVAC_2016 = 'HVAC-2016',
  HVAC_2012 = 'HVAC-2012',
  RECTANGULAR_2017 = 'RECTANGULAR-2017',
  ROUND_2015 = 'ROUND-2015'
}

/**
 * Duct shape types
 */
export enum DuctShape {
  RECTANGULAR = 'rectangular',
  ROUND = 'round',
  OVAL = 'oval',
  FLAT_OVAL = 'flat_oval'
}

/**
 * Pressure class types
 */
export enum PressureClass {
  LOW = 'low',           // Up to 2" w.g.
  MEDIUM = 'medium',     // 2" to 6" w.g.
  HIGH = 'high'          // 6" to 10" w.g.
}

/**
 * Duct dimensions interface
 */
export interface DuctDimensions {
  width: number;         // Width in inches
  height: number;        // Height in inches (for rectangular)
  diameter?: number;     // Diameter in inches (for round)
  majorAxis?: number;    // Major axis for oval
  minorAxis?: number;    // Minor axis for oval
}

/**
 * SMACNA validation result
 */
export interface SMACNAValidationResult {
  isCompliant: boolean;
  violations: SMACNAViolation[];
  warnings: SMACNAWarning[];
  recommendations: SMACNARecommendation[];
  calculatedValues: Record<string, number>;
  standardsApplied: SMACNAStandard[];
}

/**
 * SMACNA violation interface
 */
export interface SMACNAViolation {
  code: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  standardReference: string;
  currentValue: number;
  requiredValue: number;
  location?: Point2D;
  centerlineId?: string;
}

/**
 * SMACNA warning interface
 */
export interface SMACNAWarning {
  code: string;
  description: string;
  recommendation: string;
  standardReference: string;
  location?: Point2D;
}

/**
 * SMACNA recommendation interface
 */
export interface SMACNARecommendation {
  type: 'optimization' | 'compliance' | 'efficiency';
  description: string;
  benefit: string;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * SMACNA validator configuration
 */
export interface SMACNAValidatorConfig {
  standard: SMACNAStandard;
  pressureClass: PressureClass;
  enableStrictMode: boolean;
  enableOptimizationRecommendations: boolean;
  enablePressureDropCalculations: boolean;
  enableRadiusRatioValidation: boolean;
  enableVelocityValidation: boolean;
  enableAspectRatioValidation: boolean;
  customTolerances?: {
    radiusRatioTolerance: number;
    velocityTolerance: number;
    pressureDropTolerance: number;
  };
}

/**
 * Default SMACNA validator configuration
 */
const DEFAULT_SMACNA_CONFIG: SMACNAValidatorConfig = {
  standard: SMACNAStandard.HVAC_2019,
  pressureClass: PressureClass.LOW,
  enableStrictMode: false,
  enableOptimizationRecommendations: true,
  enablePressureDropCalculations: true,
  enableRadiusRatioValidation: true,
  enableVelocityValidation: true,
  enableAspectRatioValidation: true,
  customTolerances: {
    radiusRatioTolerance: 0.05,
    velocityTolerance: 50,
    pressureDropTolerance: 0.1
  }
};

/**
 * SMACNA standards data
 */
const SMACNA_STANDARDS = {
  [SMACNAStandard.HVAC_2019]: {
    minRadiusRatio: {
      [DuctShape.RECTANGULAR]: 0.5,
      [DuctShape.ROUND]: 1.0,
      [DuctShape.OVAL]: 0.75,
      [DuctShape.FLAT_OVAL]: 0.6
    },
    maxVelocity: {
      [PressureClass.LOW]: 2000,    // fpm
      [PressureClass.MEDIUM]: 2500, // fpm
      [PressureClass.HIGH]: 3000    // fpm
    },
    maxAspectRatio: {
      [DuctShape.RECTANGULAR]: 4.0,
      [DuctShape.FLAT_OVAL]: 3.0
    },
    minDuctSize: {
      [DuctShape.RECTANGULAR]: 6,   // inches
      [DuctShape.ROUND]: 4,         // inches diameter
      [DuctShape.OVAL]: 6           // inches minor axis
    },
    maxDuctSize: {
      [DuctShape.RECTANGULAR]: 120, // inches
      [DuctShape.ROUND]: 60,        // inches diameter
      [DuctShape.OVAL]: 84          // inches major axis
    }
  }
};

/**
 * SMACNA validator class
 */
export class SMACNAValidator {
  private config: SMACNAValidatorConfig;
  private standards: typeof SMACNA_STANDARDS;

  constructor(config?: Partial<SMACNAValidatorConfig>) {
    this.config = { ...DEFAULT_SMACNA_CONFIG, ...config };
    this.standards = SMACNA_STANDARDS;
  }

  /**
   * Validate centerline against SMACNA standards
   */
  validateCenterline(
    centerline: Centerline,
    ductDimensions: DuctDimensions,
    ductShape: DuctShape,
    airflow?: number // CFM
  ): SMACNAValidationResult {
    const violations: SMACNAViolation[] = [];
    const warnings: SMACNAWarning[] = [];
    const recommendations: SMACNARecommendation[] = [];
    const calculatedValues: Record<string, number> = {};

    try {
      // Validate input parameters
      this.validateInputParameters(centerline, ductDimensions, ductShape);

      // Get current standards
      const currentStandards = this.standards[this.config.standard];

      // Validate radius ratios for curved sections
      if (this.config.enableRadiusRatioValidation && centerline.type === 'arc') {
        const radiusRatioResult = this.validateRadiusRatio(centerline, ductDimensions, ductShape);
        violations.push(...radiusRatioResult.violations);
        warnings.push(...radiusRatioResult.warnings);
        Object.assign(calculatedValues, radiusRatioResult.calculatedValues);
      }

      // Validate duct dimensions
      const dimensionResult = this.validateDuctDimensions(ductDimensions, ductShape);
      violations.push(...dimensionResult.violations);
      warnings.push(...dimensionResult.warnings);

      // Validate aspect ratio for rectangular ducts
      if (this.config.enableAspectRatioValidation && ductShape === DuctShape.RECTANGULAR) {
        const aspectRatioResult = this.validateAspectRatio(ductDimensions);
        violations.push(...aspectRatioResult.violations);
        warnings.push(...aspectRatioResult.warnings);
        Object.assign(calculatedValues, aspectRatioResult.calculatedValues);
      }

      // Validate velocity if airflow is provided
      if (this.config.enableVelocityValidation && airflow) {
        const velocityResult = this.validateVelocity(ductDimensions, ductShape, airflow);
        violations.push(...velocityResult.violations);
        warnings.push(...velocityResult.warnings);
        Object.assign(calculatedValues, velocityResult.calculatedValues);
      }

      // Calculate pressure drop if enabled
      if (this.config.enablePressureDropCalculations && airflow) {
        const pressureDropResult = this.calculatePressureDrop(centerline, ductDimensions, ductShape, airflow);
        Object.assign(calculatedValues, pressureDropResult.calculatedValues);
        warnings.push(...pressureDropResult.warnings);
      }

      // Generate optimization recommendations
      if (this.config.enableOptimizationRecommendations) {
        const optimizationRecommendations = this.generateOptimizationRecommendations(
          centerline, ductDimensions, ductShape, violations, warnings
        );
        recommendations.push(...optimizationRecommendations);
      }

      return {
        isCompliant: violations.filter(v => v.severity === 'critical' || v.severity === 'major').length === 0,
        violations,
        warnings,
        recommendations,
        calculatedValues,
        standardsApplied: [this.config.standard]
      };

    } catch (error) {
      throw new SMACNAValidationError(
        `SMACNA validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          component: 'SMACNAValidator',
          operation: 'validateCenterline',
          metadata: {
            centerlineId: centerline.id,
            ductShape,
            standard: this.config.standard
          }
        }
      );
    }
  }

  /**
   * Validate radius ratio for curved sections
   */
  private validateRadiusRatio(
    centerline: Centerline,
    ductDimensions: DuctDimensions,
    ductShape: DuctShape
  ): {
    violations: SMACNAViolation[];
    warnings: SMACNAWarning[];
    calculatedValues: Record<string, number>;
  } {
    const violations: SMACNAViolation[] = [];
    const warnings: SMACNAWarning[] = [];
    const calculatedValues: Record<string, number> = {};

    if (centerline.type !== 'arc' || !centerline.radius) {
      return { violations, warnings, calculatedValues };
    }

    const radius = centerline.radius;
    const standards = this.standards[this.config.standard];
    const minRadiusRatio = standards.minRadiusRatio[ductShape];

    // Calculate characteristic dimension
    let characteristicDimension: number;
    switch (ductShape) {
      case DuctShape.RECTANGULAR:
        characteristicDimension = Math.max(ductDimensions.width, ductDimensions.height);
        break;
      case DuctShape.ROUND:
        characteristicDimension = ductDimensions.diameter || 0;
        break;
      case DuctShape.OVAL:
        characteristicDimension = ductDimensions.majorAxis || 0;
        break;
      case DuctShape.FLAT_OVAL:
        characteristicDimension = ductDimensions.majorAxis || 0;
        break;
      default:
        characteristicDimension = Math.max(ductDimensions.width, ductDimensions.height);
    }

    const radiusRatio = radius / characteristicDimension;
    calculatedValues.radiusRatio = radiusRatio;
    calculatedValues.minRequiredRadiusRatio = minRadiusRatio;
    calculatedValues.characteristicDimension = characteristicDimension;

    // Check radius ratio compliance
    if (radiusRatio < minRadiusRatio) {
      const tolerance = this.config.customTolerances?.radiusRatioTolerance || 0.05;
      const severity = radiusRatio < (minRadiusRatio - tolerance) ? 'critical' : 'major';

      violations.push({
        code: 'SMACNA-RR-001',
        severity,
        description: `Radius ratio ${radiusRatio.toFixed(2)} is below minimum required ${minRadiusRatio.toFixed(2)}`,
        standardReference: `${this.config.standard} Section 4.2.1`,
        currentValue: radiusRatio,
        requiredValue: minRadiusRatio,
        centerlineId: centerline.id
      });
    } else if (radiusRatio < (minRadiusRatio + 0.1)) {
      warnings.push({
        code: 'SMACNA-RR-W001',
        description: `Radius ratio ${radiusRatio.toFixed(2)} is close to minimum limit`,
        recommendation: 'Consider increasing radius for better airflow characteristics',
        standardReference: `${this.config.standard} Section 4.2.1`
      });
    }

    return { violations, warnings, calculatedValues };
  }

  /**
   * Validate duct dimensions
   */
  private validateDuctDimensions(
    ductDimensions: DuctDimensions,
    ductShape: DuctShape
  ): {
    violations: SMACNAViolation[];
    warnings: SMACNAWarning[];
  } {
    const violations: SMACNAViolation[] = [];
    const warnings: SMACNAWarning[] = [];
    const standards = this.standards[this.config.standard];

    const minSize = standards.minDuctSize[ductShape];
    const maxSize = standards.maxDuctSize[ductShape];

    switch (ductShape) {
      case DuctShape.RECTANGULAR:
        // Check minimum dimensions
        if (ductDimensions.width < minSize || ductDimensions.height < minSize) {
          violations.push({
            code: 'SMACNA-DIM-001',
            severity: 'major',
            description: `Duct dimension below minimum ${minSize}" required`,
            standardReference: `${this.config.standard} Section 3.1.1`,
            currentValue: Math.min(ductDimensions.width, ductDimensions.height),
            requiredValue: minSize
          });
        }

        // Check maximum dimensions
        if (ductDimensions.width > maxSize || ductDimensions.height > maxSize) {
          violations.push({
            code: 'SMACNA-DIM-002',
            severity: 'major',
            description: `Duct dimension exceeds maximum ${maxSize}" allowed`,
            standardReference: `${this.config.standard} Section 3.1.2`,
            currentValue: Math.max(ductDimensions.width, ductDimensions.height),
            requiredValue: maxSize
          });
        }
        break;

      case DuctShape.ROUND:
        const diameter = ductDimensions.diameter || 0;
        if (diameter < minSize) {
          violations.push({
            code: 'SMACNA-DIM-003',
            severity: 'major',
            description: `Round duct diameter ${diameter}" below minimum ${minSize}"`,
            standardReference: `${this.config.standard} Section 3.2.1`,
            currentValue: diameter,
            requiredValue: minSize
          });
        }

        if (diameter > maxSize) {
          violations.push({
            code: 'SMACNA-DIM-004',
            severity: 'major',
            description: `Round duct diameter ${diameter}" exceeds maximum ${maxSize}"`,
            standardReference: `${this.config.standard} Section 3.2.2`,
            currentValue: diameter,
            requiredValue: maxSize
          });
        }
        break;
    }

    return { violations, warnings };
  }

  /**
   * Validate aspect ratio for rectangular ducts
   */
  private validateAspectRatio(
    ductDimensions: DuctDimensions
  ): {
    violations: SMACNAViolation[];
    warnings: SMACNAWarning[];
    calculatedValues: Record<string, number>;
  } {
    const violations: SMACNAViolation[] = [];
    const warnings: SMACNAWarning[] = [];
    const calculatedValues: Record<string, number> = {};

    const aspectRatio = Math.max(ductDimensions.width, ductDimensions.height) / 
                       Math.min(ductDimensions.width, ductDimensions.height);
    
    calculatedValues.aspectRatio = aspectRatio;

    const standards = this.standards[this.config.standard];
    const maxAspectRatio = standards.maxAspectRatio[DuctShape.RECTANGULAR];

    if (aspectRatio > maxAspectRatio) {
      violations.push({
        code: 'SMACNA-AR-001',
        severity: 'major',
        description: `Aspect ratio ${aspectRatio.toFixed(2)} exceeds maximum ${maxAspectRatio.toFixed(2)}`,
        standardReference: `${this.config.standard} Section 3.3.1`,
        currentValue: aspectRatio,
        requiredValue: maxAspectRatio
      });
    } else if (aspectRatio > (maxAspectRatio * 0.8)) {
      warnings.push({
        code: 'SMACNA-AR-W001',
        description: `High aspect ratio ${aspectRatio.toFixed(2)} may cause pressure drop issues`,
        recommendation: 'Consider using more square dimensions for better performance',
        standardReference: `${this.config.standard} Section 3.3.1`
      });
    }

    return { violations, warnings, calculatedValues };
  }

  /**
   * Validate air velocity
   */
  private validateVelocity(
    ductDimensions: DuctDimensions,
    ductShape: DuctShape,
    airflow: number // CFM
  ): {
    violations: SMACNAViolation[];
    warnings: SMACNAWarning[];
    calculatedValues: Record<string, number>;
  } {
    const violations: SMACNAViolation[] = [];
    const warnings: SMACNAWarning[] = [];
    const calculatedValues: Record<string, number> = {};

    // Calculate cross-sectional area
    let area: number; // square feet
    switch (ductShape) {
      case DuctShape.RECTANGULAR:
        area = (ductDimensions.width * ductDimensions.height) / 144; // convert to sq ft
        break;
      case DuctShape.ROUND:
        const diameter = ductDimensions.diameter || 0;
        area = (Math.PI * diameter * diameter / 4) / 144; // convert to sq ft
        break;
      case DuctShape.OVAL:
        const majorAxis = ductDimensions.majorAxis || 0;
        const minorAxis = ductDimensions.minorAxis || 0;
        area = (Math.PI * majorAxis * minorAxis / 4) / 144; // convert to sq ft
        break;
      default:
        area = (ductDimensions.width * ductDimensions.height) / 144;
    }

    const velocity = airflow / area; // fpm (feet per minute)
    calculatedValues.velocity = velocity;
    calculatedValues.area = area;

    const standards = this.standards[this.config.standard];
    const maxVelocity = standards.maxVelocity[this.config.pressureClass];

    if (velocity > maxVelocity) {
      const tolerance = this.config.customTolerances?.velocityTolerance || 50;
      const severity = velocity > (maxVelocity + tolerance) ? 'critical' : 'major';

      violations.push({
        code: 'SMACNA-VEL-001',
        severity,
        description: `Air velocity ${velocity.toFixed(0)} fpm exceeds maximum ${maxVelocity} fpm for ${this.config.pressureClass} pressure class`,
        standardReference: `${this.config.standard} Section 5.1.1`,
        currentValue: velocity,
        requiredValue: maxVelocity
      });
    } else if (velocity > (maxVelocity * 0.9)) {
      warnings.push({
        code: 'SMACNA-VEL-W001',
        description: `Air velocity ${velocity.toFixed(0)} fpm is approaching maximum limit`,
        recommendation: 'Consider increasing duct size to reduce velocity',
        standardReference: `${this.config.standard} Section 5.1.1`
      });
    }

    return { violations, warnings, calculatedValues };
  }

  /**
   * Calculate pressure drop
   */
  private calculatePressureDrop(
    centerline: Centerline,
    ductDimensions: DuctDimensions,
    ductShape: DuctShape,
    airflow: number
  ): {
    calculatedValues: Record<string, number>;
    warnings: SMACNAWarning[];
  } {
    const calculatedValues: Record<string, number> = {};
    const warnings: SMACNAWarning[] = [];

    // Simplified pressure drop calculation
    // In a real implementation, this would use detailed SMACNA pressure drop tables

    // Calculate equivalent diameter for non-round ducts
    let equivalentDiameter: number;
    switch (ductShape) {
      case DuctShape.RECTANGULAR:
        // Equivalent diameter = 1.3 * (a*b)^0.625 / (a+b)^0.25
        const a = ductDimensions.width;
        const b = ductDimensions.height;
        equivalentDiameter = 1.3 * Math.pow(a * b, 0.625) / Math.pow(a + b, 0.25);
        break;
      case DuctShape.ROUND:
        equivalentDiameter = ductDimensions.diameter || 0;
        break;
      default:
        equivalentDiameter = Math.sqrt(ductDimensions.width * ductDimensions.height);
    }

    // Calculate velocity pressure
    const area = this.calculateArea(ductDimensions, ductShape);
    const velocity = airflow / area; // fpm
    const velocityPressure = Math.pow(velocity / 4005, 2); // inches w.g.

    // Calculate friction factor (simplified)
    const reynoldsNumber = (velocity * equivalentDiameter) / 12 / 1.5e-4; // approximate
    const frictionFactor = 0.0055 * (1 + (20000 / reynoldsNumber + 1000000 / Math.pow(reynoldsNumber, 2)));

    // Calculate pressure drop per 100 feet
    const pressureDropPer100ft = frictionFactor * velocityPressure * (100 * 12) / equivalentDiameter;

    calculatedValues.equivalentDiameter = equivalentDiameter;
    calculatedValues.velocity = velocity;
    calculatedValues.velocityPressure = velocityPressure;
    calculatedValues.frictionFactor = frictionFactor;
    calculatedValues.pressureDropPer100ft = pressureDropPer100ft;

    // Check if pressure drop is excessive
    if (pressureDropPer100ft > 0.1) {
      warnings.push({
        code: 'SMACNA-PD-W001',
        description: `High pressure drop ${pressureDropPer100ft.toFixed(3)}" w.g. per 100 ft`,
        recommendation: 'Consider increasing duct size to reduce pressure drop',
        standardReference: `${this.config.standard} Section 6.1.1`
      });
    }

    return { calculatedValues, warnings };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    centerline: Centerline,
    ductDimensions: DuctDimensions,
    ductShape: DuctShape,
    violations: SMACNAViolation[],
    warnings: SMACNAWarning[]
  ): SMACNARecommendation[] {
    const recommendations: SMACNARecommendation[] = [];

    // Radius ratio optimization
    if (violations.some(v => v.code.startsWith('SMACNA-RR'))) {
      recommendations.push({
        type: 'compliance',
        description: 'Increase bend radius to meet SMACNA minimum radius ratio requirements',
        benefit: 'Reduces pressure drop and improves airflow characteristics',
        implementation: 'Modify centerline geometry to increase radius',
        priority: 'high'
      });
    }

    // Aspect ratio optimization
    if (violations.some(v => v.code.startsWith('SMACNA-AR'))) {
      recommendations.push({
        type: 'compliance',
        description: 'Adjust duct dimensions to reduce aspect ratio',
        benefit: 'Improves pressure drop characteristics and reduces noise',
        implementation: 'Make duct dimensions more square',
        priority: 'high'
      });
    }

    // Velocity optimization
    if (violations.some(v => v.code.startsWith('SMACNA-VEL'))) {
      recommendations.push({
        type: 'efficiency',
        description: 'Increase duct size to reduce air velocity',
        benefit: 'Reduces pressure drop, energy consumption, and noise',
        implementation: 'Increase duct cross-sectional area',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Calculate cross-sectional area
   */
  private calculateArea(ductDimensions: DuctDimensions, ductShape: DuctShape): number {
    switch (ductShape) {
      case DuctShape.RECTANGULAR:
        return (ductDimensions.width * ductDimensions.height) / 144; // sq ft
      case DuctShape.ROUND:
        const diameter = ductDimensions.diameter || 0;
        return (Math.PI * diameter * diameter / 4) / 144; // sq ft
      case DuctShape.OVAL:
        const majorAxis = ductDimensions.majorAxis || 0;
        const minorAxis = ductDimensions.minorAxis || 0;
        return (Math.PI * majorAxis * minorAxis / 4) / 144; // sq ft
      default:
        return (ductDimensions.width * ductDimensions.height) / 144;
    }
  }

  /**
   * Validate input parameters
   */
  private validateInputParameters(
    centerline: Centerline,
    ductDimensions: DuctDimensions,
    ductShape: DuctShape
  ): void {
    // Validate centerline
    const centerlineValidation = ValidationUtils.validateCenterline(centerline, 'SMACNA validation');
    if (!centerlineValidation.isValid) {
      throw new Error(`Invalid centerline: ${centerlineValidation.errors.join(', ')}`);
    }

    // Validate duct dimensions
    if (ductDimensions.width <= 0 || ductDimensions.height <= 0) {
      throw new Error('Duct dimensions must be positive values');
    }

    if (ductShape === DuctShape.ROUND && (!ductDimensions.diameter || ductDimensions.diameter <= 0)) {
      throw new Error('Round duct must have valid diameter');
    }
  }

  /**
   * Update validator configuration
   */
  updateConfig(newConfig: Partial<SMACNAValidatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SMACNAValidatorConfig {
    return { ...this.config };
  }

  /**
   * Get available standards
   */
  getAvailableStandards(): SMACNAStandard[] {
    return Object.values(SMACNAStandard);
  }
}
