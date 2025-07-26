/**
 * 3D Canvas Integration Helper for SizeWise Suite
 * 
 * Provides data transformation and formatting services to prepare calculation
 * results for 3D canvas visualization and interaction.
 * 
 * @version 5.0.0
 * @author SizeWise Suite Development Team
 */

import { SystemPressureCalculator } from './SystemPressureCalculator';
import { VelocityPressureCalculator, VelocityPressureMethod } from './VelocityPressureCalculator';
import { EnhancedFrictionCalculator, FrictionMethod } from './EnhancedFrictionCalculator';
import { AirPropertiesCalculator } from './AirPropertiesCalculator';

import type {
  SystemPressureInput,
  SystemPressureResult,
  VelocityPressureInput,
  FrictionCalculationInput,
  AirConditions
} from './types';

/**
 * 3D Visualization Data Structures
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface DuctSegment3D {
  id: string;
  startPoint: Point3D;
  endPoint: Point3D;
  diameter: number;
  crossSection: 'circular' | 'rectangular';
  dimensions?: {
    width?: number;
    height?: number;
    diameter?: number;
  };
  material: string;
  velocity: number;
  pressureLoss: number;
  frictionRate: number;
  reynoldsNumber: number;
  flowRegime: string;
  visualProperties: {
    color: string;
    opacity: number;
    highlighted: boolean;
  };
}

export interface Fitting3D {
  id: string;
  type: string;
  position: Point3D;
  orientation: {
    rotation: Point3D;
    direction: Point3D;
  };
  connections: string[]; // Connected segment IDs
  pressureLoss: number;
  kFactor: number;
  visualProperties: {
    color: string;
    opacity: number;
    highlighted: boolean;
    model: string; // 3D model reference
  };
}

export interface SystemVisualization3D {
  segments: DuctSegment3D[];
  fittings: Fitting3D[];
  airflow: {
    direction: Point3D[];
    velocity: number[];
    pressure: number[];
  };
  performance: {
    totalPressureLoss: number;
    systemEfficiency: number;
    energyConsumption: number;
  };
  colorMaps: {
    pressure: ColorMap;
    velocity: ColorMap;
    efficiency: ColorMap;
    temperature: ColorMap;
  };
  metadata: {
    calculationTime: string;
    accuracy: number;
    version: string;
    units: {
      length: string;
      pressure: string;
      velocity: string;
      temperature: string;
    };
  };
}

export interface ColorMap {
  min: number;
  max: number;
  colors: {
    value: number;
    color: string;
  }[];
}

/**
 * Canvas 3D Integration Helper Service
 */
export class Canvas3DIntegrationHelper {
  private static readonly VERSION = '5.0.0';

  /**
   * Convert system calculation results to 3D visualization format
   */
  static async prepareSystemVisualization(
    systemInput: SystemPressureInput,
    layoutPoints?: Point3D[]
  ): Promise<SystemVisualization3D> {
    // Calculate system pressure and performance
    const systemResult = SystemPressureCalculator.calculateSystemPressure(systemInput);
    
    // Calculate detailed component results
    const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
      velocity: systemInput.velocity,
      method: VelocityPressureMethod.ENHANCED_FORMULA,
      airConditions: systemInput.airConditions
    });

    const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
      velocity: systemInput.velocity,
      hydraulicDiameter: systemInput.hydraulicDiameter,
      length: systemInput.length,
      material: systemInput.material,
      method: FrictionMethod.ENHANCED_DARCY,
      airConditions: systemInput.airConditions
    });

    // Generate 3D segments
    const segments = this.generateDuctSegments(systemInput, frictionResult, layoutPoints);
    
    // Generate 3D fittings
    const fittings = this.generateFittings3D(systemInput.fittings || [], segments);
    
    // Generate airflow visualization data
    const airflow = this.generateAirflowVisualization(segments, systemInput.velocity);
    
    // Generate performance data
    const performance = {
      totalPressureLoss: systemResult.totalPressureLoss,
      systemEfficiency: this.calculateSystemEfficiency(systemResult),
      energyConsumption: this.estimateEnergyConsumption(systemResult, systemInput.airflow)
    };

    // Generate color maps
    const colorMaps = this.generateColorMaps(segments, fittings);

    return {
      segments,
      fittings,
      airflow,
      performance,
      colorMaps,
      metadata: {
        calculationTime: new Date().toISOString(),
        accuracy: Math.min(vpResult.accuracy, frictionResult.accuracy),
        version: this.VERSION,
        units: {
          length: 'inches',
          pressure: 'in. w.g.',
          velocity: 'FPM',
          temperature: '°F'
        }
      }
    };
  }

  /**
   * Generate 3D duct segments from system input
   */
  private static generateDuctSegments(
    systemInput: SystemPressureInput,
    frictionResult: any,
    layoutPoints?: Point3D[]
  ): DuctSegment3D[] {
    const segments: DuctSegment3D[] = [];
    
    // Default linear layout if no points provided
    const points = layoutPoints || this.generateDefaultLayout(systemInput.length);
    
    // Create segments between consecutive points
    for (let i = 0; i < points.length - 1; i++) {
      const segment: DuctSegment3D = {
        id: `segment_${i}`,
        startPoint: points[i],
        endPoint: points[i + 1],
        diameter: systemInput.hydraulicDiameter,
        crossSection: 'circular',
        dimensions: {
          diameter: systemInput.hydraulicDiameter
        },
        material: systemInput.material,
        velocity: systemInput.velocity,
        pressureLoss: frictionResult.frictionLoss / points.length,
        frictionRate: frictionResult.frictionRate,
        reynoldsNumber: frictionResult.reynoldsNumber,
        flowRegime: frictionResult.flowRegime,
        visualProperties: {
          color: this.getSegmentColor(systemInput.velocity),
          opacity: 0.8,
          highlighted: false
        }
      };
      segments.push(segment);
    }

    return segments;
  }

  /**
   * Generate 3D fittings from fitting input
   */
  private static generateFittings3D(
    fittings: any[],
    segments: DuctSegment3D[]
  ): Fitting3D[] {
    const fittings3D: Fitting3D[] = [];
    
    fittings.forEach((fitting, index) => {
      // Place fitting at segment connection points
      const segmentIndex = Math.min(index, segments.length - 1);
      const position = segments[segmentIndex]?.endPoint || { x: 0, y: 0, z: 0 };
      
      const fitting3D: Fitting3D = {
        id: `fitting_${index}`,
        type: fitting.type,
        position,
        orientation: {
          rotation: { x: 0, y: 0, z: 0 },
          direction: { x: 1, y: 0, z: 0 }
        },
        connections: [`segment_${segmentIndex}`, `segment_${segmentIndex + 1}`].filter(Boolean),
        pressureLoss: fitting.pressureLoss || 0,
        kFactor: fitting.kFactor || 0,
        visualProperties: {
          color: this.getFittingColor(fitting.type),
          opacity: 0.9,
          highlighted: false,
          model: this.getFittingModel(fitting.type)
        }
      };
      fittings3D.push(fitting3D);
    });

    return fittings3D;
  }

  /**
   * Generate airflow visualization data
   */
  private static generateAirflowVisualization(
    segments: DuctSegment3D[],
    velocity: number
  ): SystemVisualization3D['airflow'] {
    const direction: Point3D[] = [];
    const velocityArray: number[] = [];
    const pressure: number[] = [];

    segments.forEach(segment => {
      // Calculate flow direction vector
      const dx = segment.endPoint.x - segment.startPoint.x;
      const dy = segment.endPoint.y - segment.startPoint.y;
      const dz = segment.endPoint.z - segment.startPoint.z;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      direction.push({
        x: dx / length,
        y: dy / length,
        z: dz / length
      });
      
      velocityArray.push(velocity);
      pressure.push(segment.pressureLoss);
    });

    return {
      direction,
      velocity: velocityArray,
      pressure
    };
  }

  /**
   * Generate color maps for visualization
   */
  private static generateColorMaps(
    segments: DuctSegment3D[],
    fittings: Fitting3D[]
  ): SystemVisualization3D['colorMaps'] {
    const pressureValues = [...segments.map(s => s.pressureLoss), ...fittings.map(f => f.pressureLoss)];
    const velocityValues = segments.map(s => s.velocity);
    
    return {
      pressure: this.createColorMap(pressureValues, 'pressure'),
      velocity: this.createColorMap(velocityValues, 'velocity'),
      efficiency: this.createColorMap([0.7, 0.8, 0.9, 1.0], 'efficiency'),
      temperature: this.createColorMap([60, 70, 80, 90], 'temperature')
    };
  }

  /**
   * Helper methods
   */
  private static generateDefaultLayout(length: number): Point3D[] {
    const segments = Math.max(2, Math.floor(length / 10));
    const points: Point3D[] = [];
    
    for (let i = 0; i <= segments; i++) {
      points.push({
        x: (i * length) / segments,
        y: 0,
        z: 0
      });
    }
    
    return points;
  }

  private static getSegmentColor(velocity: number): string {
    if (velocity < 1000) return '#4CAF50'; // Green - low velocity
    if (velocity < 2500) return '#FFC107'; // Yellow - medium velocity
    if (velocity < 4000) return '#FF9800'; // Orange - high velocity
    return '#F44336'; // Red - very high velocity
  }

  private static getFittingColor(type: string): string {
    const colorMap: Record<string, string> = {
      'elbow_90_smooth': '#2196F3',
      'elbow_90_mitered': '#3F51B5',
      'tee_branch': '#9C27B0',
      'tee_straight': '#673AB7',
      'damper_butterfly': '#FF5722',
      'damper_blade': '#795548',
      'transition': '#607D8B',
      'diffuser': '#009688',
      'default': '#757575'
    };
    return colorMap[type] || colorMap.default;
  }

  private static getFittingModel(type: string): string {
    const modelMap: Record<string, string> = {
      'elbow_90_smooth': 'elbow_90_smooth.obj',
      'elbow_90_mitered': 'elbow_90_mitered.obj',
      'tee_branch': 'tee_branch.obj',
      'tee_straight': 'tee_straight.obj',
      'damper_butterfly': 'damper_butterfly.obj',
      'damper_blade': 'damper_blade.obj',
      'transition': 'transition.obj',
      'diffuser': 'diffuser.obj',
      'default': 'generic_fitting.obj'
    };
    return modelMap[type] || modelMap.default;
  }

  private static createColorMap(values: number[], type: string): ColorMap {
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const colorSchemes: Record<string, string[]> = {
      pressure: ['#4CAF50', '#FFC107', '#FF9800', '#F44336'],
      velocity: ['#2196F3', '#00BCD4', '#4CAF50', '#FFC107'],
      efficiency: ['#F44336', '#FF9800', '#FFC107', '#4CAF50'],
      temperature: ['#2196F3', '#00BCD4', '#FFC107', '#FF5722']
    };
    
    const colors = colorSchemes[type] || colorSchemes.pressure;
    
    return {
      min,
      max,
      colors: colors.map((color, index) => ({
        value: min + (max - min) * (index / (colors.length - 1)),
        color
      }))
    };
  }

  private static calculateSystemEfficiency(systemResult: SystemPressureResult): number {
    // Simple efficiency calculation based on pressure losses
    const idealPressure = systemResult.velocityPressure;
    const actualPressure = systemResult.totalPressureLoss;
    return Math.max(0.1, Math.min(1.0, idealPressure / actualPressure));
  }

  private static estimateEnergyConsumption(
    systemResult: SystemPressureResult,
    airflow: number
  ): number {
    // Estimate fan power in watts
    const fanEfficiency = 0.7; // Typical fan efficiency
    const motorEfficiency = 0.9; // Typical motor efficiency
    
    // Power = (CFM × Total Pressure) / (6356 × Fan Efficiency × Motor Efficiency)
    return (airflow * systemResult.totalPressureLoss) / (6356 * fanEfficiency * motorEfficiency);
  }
}
