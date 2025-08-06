/**
 * Centerline to 3D Converter
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Converts centerlines to 3D ductwork geometry with HVAC calculation integration,
 * automatic fitting insertion, and validation warnings for system integrity.
 */

import { Vector3, Euler } from 'three';
import { 
  Centerline, 
  CenterlinePoint,
  Segment
} from '@/types/air-duct-sizer';
import { 
  DuctSegment, 
  DuctFitting, 
  ConnectionPoint,
  FlowProperties,
  ConnectionRelationships,
  CalculationState
} from '@/components/3d/types/Canvas3DTypes';
import { BranchPoint, BranchFittingType } from './MidSpanBranchingManager';

/**
 * 3D conversion configuration
 */
interface ConversionConfig {
  defaultDuctShape: 'rectangular' | 'round';
  defaultDimensions: {
    rectangular: { width: number; height: number };
    round: { diameter: number };
  };
  defaultMaterial: string;
  defaultElevation: number; // Z-coordinate for 2D to 3D conversion
  autoInsertFittings: boolean;
  validateConnections: boolean;
  generateFlowProperties: boolean;
}

/**
 * Conversion result
 */
interface ConversionResult {
  success: boolean;
  ductSegments: DuctSegment[];
  fittings: DuctFitting[];
  validationWarnings: string[];
  validationErrors: string[];
  openConnections: ConnectionPoint[];
  systemStats: {
    totalLength: number;
    segmentCount: number;
    fittingCount: number;
    connectionCount: number;
  };
}

/**
 * Fitting insertion point
 */
interface FittingInsertionPoint {
  position: Vector3;
  type: BranchFittingType | 'elbow' | 'transition';
  angle: number;
  connectingSegments: string[];
  isRequired: boolean;
  reason: string;
}

/**
 * Default conversion configuration
 */
const DEFAULT_CONVERSION_CONFIG: ConversionConfig = {
  defaultDuctShape: 'rectangular',
  defaultDimensions: {
    rectangular: { width: 12, height: 8 },
    round: { diameter: 10 }
  },
  defaultMaterial: 'galvanized_steel',
  defaultElevation: 0,
  autoInsertFittings: true,
  validateConnections: true,
  generateFlowProperties: true
};

/**
 * Centerline to 3D converter
 */
export class CenterlineTo3DConverter {
  private config: ConversionConfig;
  private segmentCounter = 0;
  private fittingCounter = 0;

  constructor(config?: Partial<ConversionConfig>) {
    this.config = { ...DEFAULT_CONVERSION_CONFIG, ...config };
  }

  /**
   * Convert centerlines to 3D ductwork
   */
  convertCenterlinesToDuctwork(
    centerlines: Centerline[],
    branchPoints: BranchPoint[] = []
  ): ConversionResult {
    const result: ConversionResult = {
      success: true,
      ductSegments: [],
      fittings: [],
      validationWarnings: [],
      validationErrors: [],
      openConnections: [],
      systemStats: {
        totalLength: 0,
        segmentCount: 0,
        fittingCount: 0,
        connectionCount: 0
      }
    };

    try {
      // Convert each centerline to duct segments
      for (const centerline of centerlines) {
        const conversionResult = this.convertSingleCenterline(centerline, branchPoints);
        
        result.ductSegments.push(...conversionResult.segments);
        result.fittings.push(...conversionResult.fittings);
        result.validationWarnings.push(...conversionResult.warnings);
        result.validationErrors.push(...conversionResult.errors);
      }

      // Insert fittings at connection points
      if (this.config.autoInsertFittings) {
        const fittingResult = this.insertAutomaticFittings(result.ductSegments, branchPoints);
        result.fittings.push(...fittingResult.fittings);
        result.validationWarnings.push(...fittingResult.warnings);
      }

      // Validate connections
      if (this.config.validateConnections) {
        const validationResult = this.validateSystemConnections(result.ductSegments, result.fittings);
        result.openConnections = validationResult.openConnections;
        result.validationWarnings.push(...validationResult.warnings);
        result.validationErrors.push(...validationResult.errors);
      }

      // Calculate system statistics
      result.systemStats = this.calculateSystemStats(result.ductSegments, result.fittings);

      // Check for critical errors
      if (result.validationErrors.length > 0) {
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.validationErrors.push(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Convert a single centerline to duct segments
   */
  private convertSingleCenterline(
    centerline: Centerline,
    branchPoints: BranchPoint[]
  ): {
    segments: DuctSegment[];
    fittings: DuctFitting[];
    warnings: string[];
    errors: string[];
  } {
    const segments: DuctSegment[] = [];
    const fittings: DuctFitting[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    if (centerline.points.length < 2) {
      warnings.push(`Centerline ${centerline.id} has insufficient points for conversion`);
      return { segments, fittings, warnings, errors };
    }

    // Convert each segment between consecutive points
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const startPoint = centerline.points[i];
      const endPoint = centerline.points[i + 1];

      const segment = this.createDuctSegment(
        centerline.id,
        startPoint,
        endPoint,
        i
      );

      segments.push(segment);
    }

    // Add SMACNA compliance warnings
    if (!centerline.isSMACNACompliant) {
      warnings.push(...centerline.warnings);
    }

    return { segments, fittings, warnings, errors };
  }

  /**
   * Create a duct segment from two centerline points
   */
  private createDuctSegment(
    centerlineId: string,
    startPoint: CenterlinePoint,
    endPoint: CenterlinePoint,
    segmentIndex: number
  ): DuctSegment {
    const segmentId = `${centerlineId}_segment_${segmentIndex}_${++this.segmentCounter}`;

    // Convert 2D points to 3D vectors
    const start = new Vector3(startPoint.x, startPoint.y, this.config.defaultElevation);
    const end = new Vector3(endPoint.x, endPoint.y, this.config.defaultElevation);

    // Create connection points
    const direction = new Vector3().subVectors(end, start).normalize();
    const reverseDirection = direction.clone().negate();

    const inlet: ConnectionPoint = {
      id: `${segmentId}_inlet`,
      position: start.clone(),
      direction: reverseDirection,
      shape: this.config.defaultDuctShape,
      status: 'available'
    };

    const outlet: ConnectionPoint = {
      id: `${segmentId}_outlet`,
      position: end.clone(),
      direction: direction,
      shape: this.config.defaultDuctShape,
      status: 'available'
    };

    // Set dimensions based on shape
    if (this.config.defaultDuctShape === 'rectangular') {
      inlet.width = this.config.defaultDimensions.rectangular.width;
      inlet.height = this.config.defaultDimensions.rectangular.height;
      outlet.width = this.config.defaultDimensions.rectangular.width;
      outlet.height = this.config.defaultDimensions.rectangular.height;
    } else {
      inlet.diameter = this.config.defaultDimensions.round.diameter;
      outlet.diameter = this.config.defaultDimensions.round.diameter;
    }

    // Create flow properties
    const flowProperties: FlowProperties = this.config.generateFlowProperties 
      ? this.createDefaultFlowProperties()
      : this.createEmptyFlowProperties();

    // Create connection relationships
    const connectionRelationships: ConnectionRelationships = {
      upstreamSegments: [],
      downstreamSegments: [],
      connectedEquipment: [],
      connectedFittings: [],
      flowPath: [],
      branchLevel: 0
    };

    // Create calculation state
    const calculationState: CalculationState = {
      needsRecalculation: true,
      isCalculating: false,
      lastCalculated: null,
      calculationDependencies: [],
      calculationOrder: 0,
      validationWarnings: [],
      calculationErrors: []
    };

    const segment: DuctSegment = {
      id: segmentId,
      start,
      end,
      shape: this.config.defaultDuctShape,
      type: 'supply', // Default type
      material: this.config.defaultMaterial,
      flowProperties,
      connectionRelationships,
      calculationState,
      inlet,
      outlet
    };

    // Set dimensions
    if (this.config.defaultDuctShape === 'rectangular') {
      segment.width = this.config.defaultDimensions.rectangular.width;
      segment.height = this.config.defaultDimensions.rectangular.height;
    } else {
      segment.diameter = this.config.defaultDimensions.round.diameter;
    }

    return segment;
  }

  /**
   * Insert automatic fittings at connection points
   */
  private insertAutomaticFittings(
    segments: DuctSegment[],
    branchPoints: BranchPoint[]
  ): {
    fittings: DuctFitting[];
    warnings: string[];
  } {
    const fittings: DuctFitting[] = [];
    const warnings: string[] = [];

    // Find fitting insertion points
    const insertionPoints = this.findFittingInsertionPoints(segments, branchPoints);

    for (const insertionPoint of insertionPoints) {
      try {
        const fitting = this.createFitting(insertionPoint, segments);
        fittings.push(fitting);
      } catch (error) {
        warnings.push(`Failed to create fitting at ${insertionPoint.position.toArray()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { fittings, warnings };
  }

  /**
   * Find points where fittings should be inserted
   */
  private findFittingInsertionPoints(
    segments: DuctSegment[],
    branchPoints: BranchPoint[]
  ): FittingInsertionPoint[] {
    const insertionPoints: FittingInsertionPoint[] = [];

    // Add fittings for branch points
    for (const branchPoint of branchPoints) {
      insertionPoints.push({
        position: new Vector3(branchPoint.position.x, branchPoint.position.y, this.config.defaultElevation),
        type: branchPoint.suggestedFitting,
        angle: branchPoint.angle,
        connectingSegments: [branchPoint.parentCenterlineId],
        isRequired: true,
        reason: 'Branch connection'
      });
    }

    // Add elbows for direction changes
    for (let i = 0; i < segments.length - 1; i++) {
      const currentSegment = segments[i];
      const nextSegment = segments[i + 1];

      // Check if segments are connected and have direction change
      const currentDirection = new Vector3().subVectors(currentSegment.end, currentSegment.start).normalize();
      const nextDirection = new Vector3().subVectors(nextSegment.end, nextSegment.start).normalize();

      const angle = currentDirection.angleTo(nextDirection) * (180 / Math.PI);

      if (angle > 5) { // Significant direction change
        insertionPoints.push({
          position: currentSegment.end.clone(),
          type: 'elbow',
          angle,
          connectingSegments: [currentSegment.id, nextSegment.id],
          isRequired: angle > 15,
          reason: `Direction change: ${angle.toFixed(1)}°`
        });
      }
    }

    return insertionPoints;
  }

  /**
   * Create a fitting at an insertion point
   */
  private createFitting(
    insertionPoint: FittingInsertionPoint,
    segments: DuctSegment[]
  ): DuctFitting {
    const fittingId = `fitting_${insertionPoint.type}_${++this.fittingCounter}`;

    // Create inlet and outlet connection points
    const inlet: ConnectionPoint = {
      id: `${fittingId}_inlet`,
      position: insertionPoint.position.clone(),
      direction: new Vector3(-1, 0, 0), // Default direction
      shape: this.config.defaultDuctShape,
      status: 'available'
    };

    const outlet: ConnectionPoint = {
      id: `${fittingId}_outlet`,
      position: insertionPoint.position.clone(),
      direction: new Vector3(1, 0, 0), // Default direction
      shape: this.config.defaultDuctShape,
      status: 'available'
    };

    // Set dimensions
    if (this.config.defaultDuctShape === 'rectangular') {
      inlet.width = this.config.defaultDimensions.rectangular.width;
      inlet.height = this.config.defaultDimensions.rectangular.height;
      outlet.width = this.config.defaultDimensions.rectangular.width;
      outlet.height = this.config.defaultDimensions.rectangular.height;
    } else {
      inlet.diameter = this.config.defaultDimensions.round.diameter;
      outlet.diameter = this.config.defaultDimensions.round.diameter;
    }

    const fitting: DuctFitting = {
      id: fittingId,
      type: insertionPoint.type as any, // Type conversion needed
      position: insertionPoint.position.clone(),
      rotation: new Euler(0, 0, 0),
      inlet,
      outlet,
      material: this.config.defaultMaterial,
      flowProperties: this.config.generateFlowProperties 
        ? this.createDefaultFlowProperties()
        : this.createEmptyFlowProperties(),
      connectionRelationships: {
        upstreamSegments: [],
        downstreamSegments: [],
        connectedEquipment: [],
        connectedFittings: [],
        flowPath: [],
        branchLevel: 0
      },
      calculationState: {
        needsRecalculation: true,
        isCalculating: false,
        lastCalculated: null,
        calculationDependencies: [],
        calculationOrder: 0,
        validationWarnings: [],
        calculationErrors: []
      }
    };

    return fitting;
  }

  /**
   * Validate system connections
   */
  private validateSystemConnections(
    segments: DuctSegment[],
    fittings: DuctFitting[]
  ): {
    openConnections: ConnectionPoint[];
    warnings: string[];
    errors: string[];
  } {
    const openConnections: ConnectionPoint[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for unconnected segment endpoints
    for (const segment of segments) {
      if (segment.inlet?.status === 'available') {
        openConnections.push(segment.inlet);
      }
      if (segment.outlet?.status === 'available') {
        openConnections.push(segment.outlet);
      }
    }

    // Check for unconnected fitting endpoints
    for (const fitting of fittings) {
      if (fitting.inlet?.status === 'available') {
        openConnections.push(fitting.inlet);
      }
      if (fitting.outlet?.status === 'available') {
        openConnections.push(fitting.outlet);
      }
    }

    // Generate warnings for open connections
    if (openConnections.length > 0) {
      warnings.push(`System has ${openConnections.length} unconnected endpoints`);
    }

    // Check for isolated segments
    const isolatedSegments = segments.filter(segment => 
      segment.connectionRelationships.upstreamSegments.length === 0 &&
      segment.connectionRelationships.downstreamSegments.length === 0
    );

    if (isolatedSegments.length > 0) {
      warnings.push(`Found ${isolatedSegments.length} isolated duct segments`);
    }

    return { openConnections, warnings, errors };
  }

  /**
   * Calculate system statistics
   */
  private calculateSystemStats(
    segments: DuctSegment[],
    fittings: DuctFitting[]
  ): ConversionResult['systemStats'] {
    const totalLength = segments.reduce((sum, segment) => {
      const length = segment.start.distanceTo(segment.end);
      return sum + length;
    }, 0);

    const connectionCount = segments.length * 2 + fittings.length * 2; // Each segment/fitting has 2 connections

    return {
      totalLength,
      segmentCount: segments.length,
      fittingCount: fittings.length,
      connectionCount
    };
  }

  /**
   * Create default flow properties
   */
  private createDefaultFlowProperties(): FlowProperties {
    return {
      airflow: 1000, // CFM
      velocity: 800, // FPM
      pressureDrop: 0.1, // inches w.g.
      frictionRate: 0.08, // inches w.g. per 100 ft
      reynoldsNumber: 50000,
      temperature: 70, // °F
      density: 0.075, // lb/ft³
      isCalculated: false,
      lastUpdated: new Date()
    };
  }

  /**
   * Create empty flow properties
   */
  private createEmptyFlowProperties(): FlowProperties {
    return {
      airflow: 0,
      velocity: 0,
      pressureDrop: 0,
      frictionRate: 0,
      reynoldsNumber: 0,
      temperature: 70,
      density: 0.075,
      isCalculated: false,
      lastUpdated: new Date()
    };
  }

  /**
   * Update conversion configuration
   */
  updateConfig(newConfig: Partial<ConversionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ConversionConfig {
    return { ...this.config };
  }
}
