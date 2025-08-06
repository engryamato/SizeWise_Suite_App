/**
 * Enhanced Centerline Utilities with SMACNA Integration
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Enhanced centerline utilities with SMACNA standards integration for professional
 * HVAC design workflows. Includes geometric calculations, validation helpers, and
 * SMACNA compliance checking for engineering-grade ductwork design.
 * 
 * @fileoverview Enhanced centerline utilities with SMACNA integration
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline } from '@/types/air-duct-sizer';
import { 
  SMACNAValidator,
  SMACNAStandard,
  DuctShape,
  PressureClass,
  DuctDimensions,
  SMACNAValidationResult
} from '../standards/SMACNAValidator';
import { ValidationUtils } from './ValidationUtils';

/**
 * Centerline analysis result
 */
export interface CenterlineAnalysis {
  totalLength: number;
  segmentCount: number;
  arcCount: number;
  straightCount: number;
  minRadius: number;
  maxRadius: number;
  averageRadius: number;
  complexityScore: number;
  smacnaCompliance?: SMACNAValidationResult;
}

/**
 * Centerline optimization suggestion
 */
export interface CenterlineOptimization {
  type: 'radius' | 'length' | 'complexity' | 'smacna';
  description: string;
  benefit: string;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImprovement: number; // percentage
}

/**
 * Enhanced centerline utilities class
 */
export class CenterlineUtils {
  private static smacnaValidator: SMACNAValidator = new SMACNAValidator();

  /**
   * Calculate total length of centerline
   */
  static calculateLength(centerline: Centerline): number {
    if (!centerline.points || centerline.points.length < 2) {
      return 0;
    }

    let totalLength = 0;

    if (centerline.type === 'straight' || centerline.type === 'segmented') {
      // Calculate straight line segments
      for (let i = 0; i < centerline.points.length - 1; i++) {
        const p1 = centerline.points[i];
        const p2 = centerline.points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
    } else if (centerline.type === 'arc' && centerline.radius) {
      // Calculate arc length
      if (centerline.points.length >= 3) {
        const startPoint = centerline.points[0];
        const endPoint = centerline.points[centerline.points.length - 1];
        const centerPoint = this.calculateArcCenter(startPoint, endPoint, centerline.radius);
        
        if (centerPoint) {
          const startAngle = Math.atan2(startPoint.y - centerPoint.y, startPoint.x - centerPoint.x);
          const endAngle = Math.atan2(endPoint.y - centerPoint.y, endPoint.x - centerPoint.x);
          let arcAngle = Math.abs(endAngle - startAngle);
          
          // Ensure we take the shorter arc
          if (arcAngle > Math.PI) {
            arcAngle = 2 * Math.PI - arcAngle;
          }
          
          totalLength = centerline.radius * arcAngle;
        }
      }
    }

    return totalLength;
  }

  /**
   * Calculate arc center point
   */
  static calculateArcCenter(start: Point2D, end: Point2D, radius: number): Point2D | null {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2 * radius) {
      return null; // Arc is impossible
    }

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const h = Math.sqrt(radius * radius - (distance / 2) * (distance / 2));
    const perpX = -dy / distance;
    const perpY = dx / distance;

    return {
      x: midX + h * perpX,
      y: midY + h * perpY
    };
  }

  /**
   * Analyze centerline characteristics
   */
  static analyzeCenterline(
    centerline: Centerline,
    ductDimensions?: DuctDimensions,
    ductShape?: DuctShape,
    airflow?: number
  ): CenterlineAnalysis {
    const analysis: CenterlineAnalysis = {
      totalLength: this.calculateLength(centerline),
      segmentCount: Math.max(0, centerline.points.length - 1),
      arcCount: centerline.type === 'arc' ? 1 : 0,
      straightCount: centerline.type === 'straight' ? 1 : centerline.type === 'segmented' ? centerline.points.length - 1 : 0,
      minRadius: 0,
      maxRadius: 0,
      averageRadius: 0,
      complexityScore: 0
    };

    // Calculate radius statistics
    if (centerline.type === 'arc' && centerline.radius) {
      analysis.minRadius = centerline.radius;
      analysis.maxRadius = centerline.radius;
      analysis.averageRadius = centerline.radius;
    }

    // Calculate complexity score (0-100)
    let complexity = 0;
    complexity += analysis.segmentCount * 5; // Base complexity per segment
    complexity += analysis.arcCount * 15; // Arcs are more complex
    
    if (centerline.type === 'segmented') {
      complexity += 10; // Multi-segment complexity
    }
    
    analysis.complexityScore = Math.min(100, complexity);

    // Add SMACNA compliance if duct information is provided
    if (ductDimensions && ductShape) {
      try {
        analysis.smacnaCompliance = this.smacnaValidator.validateCenterline(
          centerline,
          ductDimensions,
          ductShape,
          airflow
        );
      } catch (error) {
        console.warn('SMACNA validation failed:', error);
      }
    }

    return analysis;
  }

  /**
   * Generate optimization suggestions for centerline
   */
  static generateOptimizations(
    centerline: Centerline,
    analysis: CenterlineAnalysis,
    ductDimensions?: DuctDimensions,
    ductShape?: DuctShape
  ): CenterlineOptimization[] {
    const optimizations: CenterlineOptimization[] = [];

    // SMACNA compliance optimizations
    if (analysis.smacnaCompliance) {
      const smacnaResult = analysis.smacnaCompliance;
      
      // Radius ratio optimizations
      if (smacnaResult.violations.some(v => v.code.startsWith('SMACNA-RR'))) {
        optimizations.push({
          type: 'smacna',
          description: 'Increase bend radius to meet SMACNA minimum radius ratio requirements',
          benefit: 'Reduces pressure drop by 15-25% and improves airflow characteristics',
          implementation: 'Modify centerline geometry to increase radius to meet minimum ratio',
          priority: 'high',
          estimatedImprovement: 20
        });
      }

      // Velocity optimizations
      if (smacnaResult.violations.some(v => v.code.startsWith('SMACNA-VEL'))) {
        optimizations.push({
          type: 'smacna',
          description: 'Reduce air velocity to meet SMACNA maximum velocity limits',
          benefit: 'Reduces pressure drop, energy consumption, and noise levels',
          implementation: 'Increase duct size or reduce airflow rate',
          priority: 'high',
          estimatedImprovement: 30
        });
      }

      // Aspect ratio optimizations
      if (smacnaResult.violations.some(v => v.code.startsWith('SMACNA-AR'))) {
        optimizations.push({
          type: 'smacna',
          description: 'Adjust duct dimensions to reduce aspect ratio',
          benefit: 'Improves pressure drop characteristics and reduces noise',
          implementation: 'Make duct dimensions more square',
          priority: 'medium',
          estimatedImprovement: 15
        });
      }
    }

    // Complexity optimizations
    if (analysis.complexityScore > 70) {
      optimizations.push({
        type: 'complexity',
        description: 'Simplify centerline geometry to reduce complexity',
        benefit: 'Easier fabrication, lower cost, and improved maintainability',
        implementation: 'Reduce number of segments or combine adjacent straight sections',
        priority: 'medium',
        estimatedImprovement: 10
      });
    }

    // Length optimizations
    if (analysis.totalLength > 100) { // Arbitrary threshold for demonstration
      optimizations.push({
        type: 'length',
        description: 'Consider shorter routing to reduce duct length',
        benefit: 'Reduces material cost, pressure drop, and installation time',
        implementation: 'Explore alternative routing paths',
        priority: 'low',
        estimatedImprovement: 5
      });
    }

    // Radius optimizations for non-SMACNA issues
    if (centerline.type === 'arc' && centerline.radius && ductDimensions && ductShape) {
      const characteristicDimension = ductShape === DuctShape.ROUND 
        ? ductDimensions.diameter || 0
        : Math.max(ductDimensions.width, ductDimensions.height);
      
      const radiusRatio = centerline.radius / characteristicDimension;
      
      if (radiusRatio < 1.0 && !analysis.smacnaCompliance?.violations.some(v => v.code.startsWith('SMACNA-RR'))) {
        optimizations.push({
          type: 'radius',
          description: 'Increase bend radius for better performance',
          benefit: 'Improves airflow characteristics and reduces turbulence',
          implementation: 'Increase radius to at least 1.0 times the characteristic dimension',
          priority: 'medium',
          estimatedImprovement: 12
        });
      }
    }

    return optimizations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Validate centerline geometry
   */
  static validateGeometry(centerline: Centerline): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate centerline structure
    const centerlineValidation = ValidationUtils.validateCenterline(centerline, 'geometry validation');
    if (!centerlineValidation.isValid) {
      errors.push(...centerlineValidation.errors);
    }

    // Validate points
    if (!centerline.points || centerline.points.length < 2) {
      errors.push('Centerline must have at least 2 points');
    }

    // Validate arc-specific requirements
    if (centerline.type === 'arc') {
      if (!centerline.radius || centerline.radius <= 0) {
        errors.push('Arc centerline must have a positive radius');
      }

      if (centerline.points.length < 3) {
        warnings.push('Arc centerline should have at least 3 points for proper definition');
      }

      // Check if arc is geometrically possible
      if (centerline.points.length >= 2 && centerline.radius) {
        const start = centerline.points[0];
        const end = centerline.points[centerline.points.length - 1];
        const distance = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );

        if (distance > 2 * centerline.radius) {
          errors.push(`Arc radius ${centerline.radius} is too small for distance ${distance.toFixed(2)}`);
        }
      }
    }

    // Check for degenerate segments
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const p1 = centerline.points[i];
      const p2 = centerline.points[i + 1];
      const distance = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );

      if (distance < 0.1) {
        warnings.push(`Very short segment detected between points ${i} and ${i + 1} (${distance.toFixed(3)})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate pressure drop for centerline
   */
  static calculatePressureDrop(
    centerline: Centerline,
    ductDimensions: DuctDimensions,
    ductShape: DuctShape,
    airflow: number,
    standard: SMACNAStandard = SMACNAStandard.HVAC_2019
  ): {
    totalPressureDrop: number;
    straightPressureDrop: number;
    fittingPressureDrop: number;
    details: Record<string, number>;
  } {
    // Create validator with specific standard
    const validator = new SMACNAValidator({ standard });
    
    try {
      const result = validator.validateCenterline(centerline, ductDimensions, ductShape, airflow);
      
      const straightPressureDrop = result.calculatedValues.pressureDropPer100ft || 0;
      const length = this.calculateLength(centerline);
      const straightTotal = (straightPressureDrop * length) / 100;
      
      // Estimate fitting pressure drop for arcs
      let fittingPressureDrop = 0;
      if (centerline.type === 'arc' && centerline.radius) {
        const velocity = result.calculatedValues.velocity || 0;
        const velocityPressure = result.calculatedValues.velocityPressure || 0;
        
        // Simplified fitting loss coefficient for 90-degree elbow
        const lossCoefficient = 0.3; // Typical value for smooth elbow
        fittingPressureDrop = lossCoefficient * velocityPressure;
      }
      
      return {
        totalPressureDrop: straightTotal + fittingPressureDrop,
        straightPressureDrop: straightTotal,
        fittingPressureDrop,
        details: {
          length,
          velocity: result.calculatedValues.velocity || 0,
          velocityPressure: result.calculatedValues.velocityPressure || 0,
          frictionFactor: result.calculatedValues.frictionFactor || 0,
          equivalentDiameter: result.calculatedValues.equivalentDiameter || 0
        }
      };
    } catch (error) {
      console.warn('Pressure drop calculation failed:', error);
      return {
        totalPressureDrop: 0,
        straightPressureDrop: 0,
        fittingPressureDrop: 0,
        details: {}
      };
    }
  }

  /**
   * Update SMACNA validator configuration
   */
  static updateSMACNAConfig(config: Partial<Parameters<typeof SMACNAValidator.prototype.updateConfig>[0]>): void {
    this.smacnaValidator.updateConfig(config);
  }

  /**
   * Get SMACNA validator instance
   */
  static getSMACNAValidator(): SMACNAValidator {
    return this.smacnaValidator;
  }

  /**
   * Calculate equivalent diameter for duct
   */
  static calculateEquivalentDiameter(ductDimensions: DuctDimensions, ductShape: DuctShape): number {
    switch (ductShape) {
      case DuctShape.RECTANGULAR:
        // Equivalent diameter = 1.3 * (a*b)^0.625 / (a+b)^0.25
        const a = ductDimensions.width;
        const b = ductDimensions.height;
        return 1.3 * Math.pow(a * b, 0.625) / Math.pow(a + b, 0.25);
      
      case DuctShape.ROUND:
        return ductDimensions.diameter || 0;
      
      case DuctShape.OVAL:
        const majorAxis = ductDimensions.majorAxis || 0;
        const minorAxis = ductDimensions.minorAxis || 0;
        return Math.sqrt(majorAxis * minorAxis);
      
      default:
        return Math.sqrt(ductDimensions.width * ductDimensions.height);
    }
  }

  /**
   * Calculate cross-sectional area
   */
  static calculateArea(ductDimensions: DuctDimensions, ductShape: DuctShape): number {
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
   * Calculate air velocity
   */
  static calculateVelocity(
    ductDimensions: DuctDimensions,
    ductShape: DuctShape,
    airflow: number // CFM
  ): number {
    const area = this.calculateArea(ductDimensions, ductShape);
    return area > 0 ? airflow / area : 0; // fpm
  }
}
