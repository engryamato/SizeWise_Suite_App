/**
 * SMACNA Standards and Calculations
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Extracted SMACNA standards from Canvas3D.tsx for better organization
 */

import { Vector3 } from 'three';
import { DuctSegment, TransitionFitting, ElbowFitting, DuctShape } from '../types/Canvas3DTypes';

export class SMACNAStandards {
  // Standard transition slope ratio (2.5:1)
  static readonly TRANSITION_SLOPE_RATIO = 2.5;

  // Standard elbow centerline radius ratios
  static readonly ROUND_ELBOW_RADIUS_RATIO = 1.5; // R/D = 1.5
  static readonly RECTANGULAR_ELBOW_RADIUS_RATIO = 1.0; // R/W = 1.0

  // Velocity standards (ft/min)
  static readonly MIN_DUCT_VELOCITY = 800;
  static readonly MAX_DUCT_VELOCITY = 2500;

  // Standard sheet metal gauges
  static readonly STANDARD_GAUGES = [30, 28, 26, 24, 22, 20, 18, 16, 14];

  // Pressure class standards
  static readonly PRESSURE_CLASSES = {
    LOW: { max: 2, gauge: 30 },
    MEDIUM: { max: 6, gauge: 26 },
    HIGH: { max: 10, gauge: 22 }
  };

  /**
   * Calculate transition length based on SMACNA 2.5:1 slope ratio
   */
  static calculateTransitionLength(
    inlet: { width?: number; height?: number; diameter?: number; shape: DuctShape },
    outlet: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): number {
    const inletEquivalentDiameter = this.getEquivalentDiameter(inlet);
    const outletEquivalentDiameter = this.getEquivalentDiameter(outlet);
    
    const sizeDifference = Math.abs(inletEquivalentDiameter - outletEquivalentDiameter);
    return sizeDifference * this.TRANSITION_SLOPE_RATIO;
  }

  /**
   * Calculate elbow centerline radius based on SMACNA guidelines
   */
  static calculateElbowRadius(
    ductDimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): number {
    if (ductDimensions.shape === 'round' && ductDimensions.diameter) {
      return ductDimensions.diameter * this.ROUND_ELBOW_RADIUS_RATIO;
    } else if (ductDimensions.shape === 'rectangular' && ductDimensions.width) {
      return ductDimensions.width * this.RECTANGULAR_ELBOW_RADIUS_RATIO;
    }
    return 12; // Default 12" radius
  }

  /**
   * Get equivalent diameter for rectangular ducts
   */
  static getEquivalentDiameter(
    dimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): number {
    if (dimensions.shape === 'round' && dimensions.diameter) {
      return dimensions.diameter;
    } else if (dimensions.shape === 'rectangular' && dimensions.width && dimensions.height) {
      // Equivalent diameter formula: De = 1.3 * (a * b)^0.625 / (a + b)^0.25
      const a = dimensions.width;
      const b = dimensions.height;
      return 1.3 * Math.pow(a * b, 0.625) / Math.pow(a + b, 0.25);
    }
    return 12; // Default 12" diameter
  }

  /**
   * Calculate duct velocity based on CFM and dimensions
   */
  static calculateVelocity(
    cfm: number,
    dimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): number {
    const area = this.getDuctArea(dimensions);
    return cfm / area; // ft/min
  }

  /**
   * Get duct cross-sectional area
   */
  static getDuctArea(
    dimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): number {
    if (dimensions.shape === 'round' && dimensions.diameter) {
      const radius = dimensions.diameter / 2;
      return Math.PI * radius * radius / 144; // Convert to sq ft
    } else if (dimensions.shape === 'rectangular' && dimensions.width && dimensions.height) {
      return (dimensions.width * dimensions.height) / 144; // Convert to sq ft
    }
    return 1; // Default 1 sq ft
  }

  /**
   * Determine required sheet metal gauge based on pressure and dimensions
   */
  static getRequiredGauge(
    staticPressure: number,
    dimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): number {
    const maxDimension = this.getMaxDimension(dimensions);
    
    // SMACNA gauge selection based on pressure and size
    if (staticPressure <= 2) {
      return maxDimension <= 30 ? 30 : 28;
    } else if (staticPressure <= 6) {
      return maxDimension <= 24 ? 26 : 24;
    } else if (staticPressure <= 10) {
      return maxDimension <= 18 ? 22 : 20;
    } else {
      return 18; // High pressure applications
    }
  }

  /**
   * Get maximum dimension of duct
   */
  static getMaxDimension(
    dimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): number {
    if (dimensions.shape === 'round' && dimensions.diameter) {
      return dimensions.diameter;
    } else if (dimensions.shape === 'rectangular' && dimensions.width && dimensions.height) {
      return Math.max(dimensions.width, dimensions.height);
    }
    return 12; // Default 12"
  }

  /**
   * Validate duct velocity against SMACNA standards
   */
  static validateVelocity(velocity: number): {
    isValid: boolean;
    message: string;
    recommendation?: string;
  } {
    if (velocity < this.MIN_DUCT_VELOCITY) {
      return {
        isValid: false,
        message: `Velocity ${velocity.toFixed(0)} ft/min is below minimum ${this.MIN_DUCT_VELOCITY} ft/min`,
        recommendation: 'Consider reducing duct size or increasing airflow'
      };
    } else if (velocity > this.MAX_DUCT_VELOCITY) {
      return {
        isValid: false,
        message: `Velocity ${velocity.toFixed(0)} ft/min exceeds maximum ${this.MAX_DUCT_VELOCITY} ft/min`,
        recommendation: 'Consider increasing duct size or reducing airflow'
      };
    } else {
      return {
        isValid: true,
        message: `Velocity ${velocity.toFixed(0)} ft/min is within acceptable range`
      };
    }
  }

  /**
   * Calculate pressure loss for straight duct section
   */
  static calculatePressureLoss(
    length: number,
    velocity: number,
    dimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape },
    roughness: number = 0.0003 // Default galvanized steel roughness
  ): number {
    const equivalentDiameter = this.getEquivalentDiameter(dimensions);
    const reynoldsNumber = (velocity * equivalentDiameter) / 12; // Simplified calculation
    
    // Darcy-Weisbach equation simplified for HVAC applications
    const frictionFactor = 0.02; // Simplified for typical HVAC conditions
    const densityFactor = 0.075; // Standard air density factor
    
    return (frictionFactor * length * densityFactor * Math.pow(velocity, 2)) / 
           (2 * 32.174 * equivalentDiameter);
  }

  /**
   * Get standard duct sizes for given shape
   */
  static getStandardSizes(shape: DuctShape): Array<{ width?: number; height?: number; diameter?: number }> {
    if (shape === 'round') {
      return [
        { diameter: 4 }, { diameter: 5 }, { diameter: 6 }, { diameter: 7 }, { diameter: 8 },
        { diameter: 9 }, { diameter: 10 }, { diameter: 12 }, { diameter: 14 }, { diameter: 16 },
        { diameter: 18 }, { diameter: 20 }, { diameter: 22 }, { diameter: 24 }, { diameter: 26 },
        { diameter: 28 }, { diameter: 30 }, { diameter: 32 }, { diameter: 34 }, { diameter: 36 }
      ];
    } else {
      return [
        { width: 6, height: 4 }, { width: 8, height: 4 }, { width: 10, height: 4 },
        { width: 12, height: 4 }, { width: 14, height: 4 }, { width: 16, height: 4 },
        { width: 8, height: 6 }, { width: 10, height: 6 }, { width: 12, height: 6 },
        { width: 14, height: 6 }, { width: 16, height: 6 }, { width: 18, height: 6 },
        { width: 10, height: 8 }, { width: 12, height: 8 }, { width: 14, height: 8 },
        { width: 16, height: 8 }, { width: 18, height: 8 }, { width: 20, height: 8 },
        { width: 12, height: 10 }, { width: 14, height: 10 }, { width: 16, height: 10 },
        { width: 18, height: 10 }, { width: 20, height: 10 }, { width: 22, height: 10 },
        { width: 14, height: 12 }, { width: 16, height: 12 }, { width: 18, height: 12 },
        { width: 20, height: 12 }, { width: 22, height: 12 }, { width: 24, height: 12 }
      ];
    }
  }

  /**
   * Find nearest standard size for given dimensions
   */
  static findNearestStandardSize(
    dimensions: { width?: number; height?: number; diameter?: number; shape: DuctShape }
  ): { width?: number; height?: number; diameter?: number } {
    const standardSizes = this.getStandardSizes(dimensions.shape);
    
    if (dimensions.shape === 'round' && dimensions.diameter) {
      return standardSizes.reduce((closest, size) => {
        const currentDiff = Math.abs((size.diameter || 0) - dimensions.diameter!);
        const closestDiff = Math.abs((closest.diameter || 0) - dimensions.diameter!);
        return currentDiff < closestDiff ? size : closest;
      });
    } else if (dimensions.shape === 'rectangular' && dimensions.width && dimensions.height) {
      return standardSizes.reduce((closest, size) => {
        const currentArea = (size.width || 0) * (size.height || 0);
        const targetArea = dimensions.width! * dimensions.height!;
        const closestArea = (closest.width || 0) * (closest.height || 0);
        
        const currentDiff = Math.abs(currentArea - targetArea);
        const closestDiff = Math.abs(closestArea - targetArea);
        
        return currentDiff < closestDiff ? size : closest;
      });
    }
    
    return dimensions.shape === 'round' ? { diameter: 12 } : { width: 12, height: 8 };
  }
}
