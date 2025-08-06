/**
 * Edge Case Handler System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive edge case handling for overlapping snap points, invalid centerlines,
 * degenerate geometry, and other exceptional scenarios. Provides robust error recovery
 * and graceful degradation for professional HVAC design workflows.
 * 
 * @fileoverview Edge case detection and handling system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline, SnapPoint, SnapResult } from '@/types/air-duct-sizer';
import { 
  SnapLogicError, 
  ErrorCategory, 
  ErrorSeverity,
  SnapLogicValidationError,
  CenterlineError
} from './SnapLogicError';
import { ErrorHandler } from './ErrorHandler';

/**
 * Edge case types
 */
export enum EdgeCaseType {
  OVERLAPPING_SNAP_POINTS = 'overlapping_snap_points',
  INVALID_CENTERLINE = 'invalid_centerline',
  DEGENERATE_GEOMETRY = 'degenerate_geometry',
  DUPLICATE_POINTS = 'duplicate_points',
  ZERO_LENGTH_SEGMENT = 'zero_length_segment',
  SELF_INTERSECTING_CENTERLINE = 'self_intersecting_centerline',
  INVALID_RADIUS = 'invalid_radius',
  EXTREME_COORDINATES = 'extreme_coordinates',
  NUMERICAL_PRECISION = 'numerical_precision',
  MEMORY_OVERFLOW = 'memory_overflow',
  INFINITE_LOOP = 'infinite_loop',
  STACK_OVERFLOW = 'stack_overflow'
}

/**
 * Edge case severity levels
 */
export enum EdgeCaseSeverity {
  MINOR = 'minor',           // Can be ignored or auto-corrected
  MODERATE = 'moderate',     // Requires user notification but system continues
  SEVERE = 'severe',         // Requires user intervention
  CRITICAL = 'critical'      // System cannot continue safely
}

/**
 * Edge case detection result
 */
export interface EdgeCaseDetectionResult {
  detected: boolean;
  type: EdgeCaseType;
  severity: EdgeCaseSeverity;
  description: string;
  affectedData: any;
  suggestedAction: string;
  autoCorrectible: boolean;
  context: Record<string, any>;
}

/**
 * Edge case handling result
 */
export interface EdgeCaseHandlingResult {
  handled: boolean;
  corrected: boolean;
  fallbackUsed: boolean;
  resultData?: any;
  warnings: string[];
  errors: string[];
  performance: {
    detectionTime: number;
    handlingTime: number;
    totalTime: number;
  };
}

/**
 * Edge case handler configuration
 */
export interface EdgeCaseHandlerConfig {
  enableAutoCorrection: boolean;
  enableFallbackStrategies: boolean;
  toleranceSettings: {
    pointDistance: number;        // Minimum distance between points
    angleThreshold: number;       // Minimum angle for valid geometry
    radiusThreshold: number;      // Minimum radius for arcs
    coordinateLimit: number;      // Maximum coordinate value
    precisionDigits: number;      // Decimal precision for calculations
  };
  performanceThresholds: {
    maxDetectionTime: number;     // Maximum time for edge case detection
    maxHandlingTime: number;      // Maximum time for edge case handling
    maxMemoryUsage: number;       // Maximum memory usage in MB
  };
  enableVerboseLogging: boolean;
}

/**
 * Default edge case handler configuration
 */
const DEFAULT_EDGE_CASE_CONFIG: EdgeCaseHandlerConfig = {
  enableAutoCorrection: true,
  enableFallbackStrategies: true,
  toleranceSettings: {
    pointDistance: 0.1,           // 0.1 pixels minimum distance
    angleThreshold: 0.01,         // ~0.57 degrees minimum angle
    radiusThreshold: 1.0,         // 1 pixel minimum radius
    coordinateLimit: 1000000,     // 1 million pixel limit
    precisionDigits: 6            // 6 decimal places
  },
  performanceThresholds: {
    maxDetectionTime: 10,         // 10ms max detection time
    maxHandlingTime: 50,          // 50ms max handling time
    maxMemoryUsage: 100           // 100MB max memory usage
  },
  enableVerboseLogging: false
};

/**
 * Edge case handler class
 */
export class EdgeCaseHandler {
  private config: EdgeCaseHandlerConfig;
  private errorHandler: ErrorHandler | null = null;
  private detectionCache: Map<string, EdgeCaseDetectionResult> = new Map();
  private handlingStats: Map<EdgeCaseType, number> = new Map();

  constructor(config?: Partial<EdgeCaseHandlerConfig>) {
    this.config = { ...DEFAULT_EDGE_CASE_CONFIG, ...config };
  }

  /**
   * Set error handler for integration
   */
  setErrorHandler(errorHandler: ErrorHandler): void {
    this.errorHandler = errorHandler;
  }

  /**
   * Detect and handle edge cases in snap points
   */
  async handleSnapPointEdgeCases(snapPoints: SnapPoint[]): Promise<{
    snapPoints: SnapPoint[];
    edgeCases: EdgeCaseDetectionResult[];
    handlingResults: EdgeCaseHandlingResult[];
  }> {
    const startTime = performance.now();
    const edgeCases: EdgeCaseDetectionResult[] = [];
    const handlingResults: EdgeCaseHandlingResult[] = [];
    let processedSnapPoints = [...snapPoints];

    try {
      // Detect overlapping snap points
      const overlappingResult = this.detectOverlappingSnapPoints(snapPoints);
      if (overlappingResult.detected) {
        edgeCases.push(overlappingResult);
        const handlingResult = await this.handleOverlappingSnapPoints(snapPoints, overlappingResult);
        handlingResults.push(handlingResult);
        if (handlingResult.resultData) {
          processedSnapPoints = handlingResult.resultData;
        }
      }

      // Detect extreme coordinates
      const extremeCoordinatesResult = this.detectExtremeCoordinates(processedSnapPoints);
      if (extremeCoordinatesResult.detected) {
        edgeCases.push(extremeCoordinatesResult);
        const handlingResult = await this.handleExtremeCoordinates(processedSnapPoints, extremeCoordinatesResult);
        handlingResults.push(handlingResult);
        if (handlingResult.resultData) {
          processedSnapPoints = handlingResult.resultData;
        }
      }

      // Detect numerical precision issues
      const precisionResult = this.detectNumericalPrecisionIssues(processedSnapPoints);
      if (precisionResult.detected) {
        edgeCases.push(precisionResult);
        const handlingResult = await this.handleNumericalPrecisionIssues(processedSnapPoints, precisionResult);
        handlingResults.push(handlingResult);
        if (handlingResult.resultData) {
          processedSnapPoints = handlingResult.resultData;
        }
      }

    } catch (error) {
      this.logError('Edge case handling failed', error, {
        component: 'EdgeCaseHandler',
        operation: 'handleSnapPointEdgeCases',
        snapPointCount: snapPoints.length
      });
    }

    const totalTime = performance.now() - startTime;
    this.logPerformance('handleSnapPointEdgeCases', totalTime);

    return {
      snapPoints: processedSnapPoints,
      edgeCases,
      handlingResults
    };
  }

  /**
   * Detect and handle edge cases in centerlines
   */
  async handleCenterlineEdgeCases(centerline: Centerline): Promise<{
    centerline: Centerline;
    edgeCases: EdgeCaseDetectionResult[];
    handlingResults: EdgeCaseHandlingResult[];
  }> {
    const startTime = performance.now();
    const edgeCases: EdgeCaseDetectionResult[] = [];
    const handlingResults: EdgeCaseHandlingResult[] = [];
    let processedCenterline = { ...centerline };

    try {
      // Detect invalid centerline
      const invalidResult = this.detectInvalidCenterline(centerline);
      if (invalidResult.detected) {
        edgeCases.push(invalidResult);
        const handlingResult = await this.handleInvalidCenterline(centerline, invalidResult);
        handlingResults.push(handlingResult);
        if (handlingResult.resultData) {
          processedCenterline = handlingResult.resultData;
        }
      }

      // Detect degenerate geometry
      const degenerateResult = this.detectDegenerateGeometry(processedCenterline);
      if (degenerateResult.detected) {
        edgeCases.push(degenerateResult);
        const handlingResult = await this.handleDegenerateGeometry(processedCenterline, degenerateResult);
        handlingResults.push(handlingResult);
        if (handlingResult.resultData) {
          processedCenterline = handlingResult.resultData;
        }
      }

      // Detect self-intersecting centerline
      const selfIntersectingResult = this.detectSelfIntersectingCenterline(processedCenterline);
      if (selfIntersectingResult.detected) {
        edgeCases.push(selfIntersectingResult);
        const handlingResult = await this.handleSelfIntersectingCenterline(processedCenterline, selfIntersectingResult);
        handlingResults.push(handlingResult);
        if (handlingResult.resultData) {
          processedCenterline = handlingResult.resultData;
        }
      }

      // Detect zero-length segments
      const zeroLengthResult = this.detectZeroLengthSegments(processedCenterline);
      if (zeroLengthResult.detected) {
        edgeCases.push(zeroLengthResult);
        const handlingResult = await this.handleZeroLengthSegments(processedCenterline, zeroLengthResult);
        handlingResults.push(handlingResult);
        if (handlingResult.resultData) {
          processedCenterline = handlingResult.resultData;
        }
      }

    } catch (error) {
      this.logError('Centerline edge case handling failed', error, {
        component: 'EdgeCaseHandler',
        operation: 'handleCenterlineEdgeCases',
        centerlineId: centerline.id
      });
    }

    const totalTime = performance.now() - startTime;
    this.logPerformance('handleCenterlineEdgeCases', totalTime);

    return {
      centerline: processedCenterline,
      edgeCases,
      handlingResults
    };
  }

  /**
   * Detect overlapping snap points
   */
  private detectOverlappingSnapPoints(snapPoints: SnapPoint[]): EdgeCaseDetectionResult {
    const overlapping: Array<{ point1: SnapPoint; point2: SnapPoint; distance: number }> = [];
    const threshold = this.config.toleranceSettings.pointDistance;

    for (let i = 0; i < snapPoints.length; i++) {
      for (let j = i + 1; j < snapPoints.length; j++) {
        const point1 = snapPoints[i];
        const point2 = snapPoints[j];
        const distance = this.calculateDistance(point1.position, point2.position);

        if (distance < threshold) {
          overlapping.push({ point1, point2, distance });
        }
      }
    }

    return {
      detected: overlapping.length > 0,
      type: EdgeCaseType.OVERLAPPING_SNAP_POINTS,
      severity: overlapping.length > 10 ? EdgeCaseSeverity.SEVERE : EdgeCaseSeverity.MODERATE,
      description: `Found ${overlapping.length} overlapping snap point pairs`,
      affectedData: overlapping,
      suggestedAction: 'Merge overlapping snap points or increase snap distance threshold',
      autoCorrectible: true,
      context: {
        threshold,
        totalSnapPoints: snapPoints.length,
        overlappingPairs: overlapping.length
      }
    };
  }

  /**
   * Handle overlapping snap points
   */
  private async handleOverlappingSnapPoints(
    snapPoints: SnapPoint[], 
    detection: EdgeCaseDetectionResult
  ): Promise<EdgeCaseHandlingResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];
    let corrected = false;
    let resultSnapPoints = [...snapPoints];

    try {
      if (this.config.enableAutoCorrection && detection.autoCorrectible) {
        const overlapping = detection.affectedData as Array<{ point1: SnapPoint; point2: SnapPoint; distance: number }>;
        const toRemove = new Set<string>();

        // Merge overlapping points by keeping the higher priority one
        for (const { point1, point2 } of overlapping) {
          if (point1.priority <= point2.priority) {
            toRemove.add(point2.id);
          } else {
            toRemove.add(point1.id);
          }
        }

        resultSnapPoints = snapPoints.filter(point => !toRemove.has(point.id));
        corrected = true;
        warnings.push(`Merged ${toRemove.size} overlapping snap points`);
      }
    } catch (error) {
      errors.push(`Failed to handle overlapping snap points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const handlingTime = performance.now() - startTime;

    return {
      handled: true,
      corrected,
      fallbackUsed: false,
      resultData: resultSnapPoints,
      warnings,
      errors,
      performance: {
        detectionTime: 0,
        handlingTime,
        totalTime: handlingTime
      }
    };
  }

  /**
   * Detect invalid centerline
   */
  private detectInvalidCenterline(centerline: Centerline): EdgeCaseDetectionResult {
    const issues: string[] = [];

    // Check for minimum points
    if (centerline.points.length < 2) {
      issues.push('Centerline has fewer than 2 points');
    }

    // Check for duplicate consecutive points
    for (let i = 1; i < centerline.points.length; i++) {
      const distance = this.calculateDistance(centerline.points[i - 1], centerline.points[i]);
      if (distance < this.config.toleranceSettings.pointDistance) {
        issues.push(`Duplicate consecutive points at index ${i}`);
      }
    }

    // Check for invalid coordinates
    for (let i = 0; i < centerline.points.length; i++) {
      const point = centerline.points[i];
      if (!isFinite(point.x) || !isFinite(point.y)) {
        issues.push(`Invalid coordinates at point ${i}: (${point.x}, ${point.y})`);
      }
    }

    return {
      detected: issues.length > 0,
      type: EdgeCaseType.INVALID_CENTERLINE,
      severity: issues.length > 3 ? EdgeCaseSeverity.SEVERE : EdgeCaseSeverity.MODERATE,
      description: `Invalid centerline detected: ${issues.join(', ')}`,
      affectedData: { centerlineId: centerline.id, issues },
      suggestedAction: 'Fix centerline geometry or recreate centerline',
      autoCorrectible: issues.length <= 2,
      context: {
        pointCount: centerline.points.length,
        issueCount: issues.length
      }
    };
  }

  /**
   * Handle invalid centerline
   */
  private async handleInvalidCenterline(
    centerline: Centerline,
    detection: EdgeCaseDetectionResult
  ): Promise<EdgeCaseHandlingResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];
    let corrected = false;
    let resultCenterline = { ...centerline };

    try {
      if (this.config.enableAutoCorrection && detection.autoCorrectible) {
        // Remove duplicate consecutive points
        const cleanedPoints: Point2D[] = [centerline.points[0]];
        
        for (let i = 1; i < centerline.points.length; i++) {
          const distance = this.calculateDistance(centerline.points[i - 1], centerline.points[i]);
          if (distance >= this.config.toleranceSettings.pointDistance) {
            cleanedPoints.push(centerline.points[i]);
          }
        }

        // Filter out invalid coordinates
        const validPoints = cleanedPoints.filter(point => 
          isFinite(point.x) && isFinite(point.y) &&
          Math.abs(point.x) < this.config.toleranceSettings.coordinateLimit &&
          Math.abs(point.y) < this.config.toleranceSettings.coordinateLimit
        );

        if (validPoints.length >= 2) {
          resultCenterline = {
            ...centerline,
            points: validPoints
          };
          corrected = true;
          warnings.push(`Cleaned centerline: removed ${centerline.points.length - validPoints.length} invalid points`);
        } else {
          errors.push('Cannot correct centerline: insufficient valid points remaining');
        }
      }
    } catch (error) {
      errors.push(`Failed to handle invalid centerline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const handlingTime = performance.now() - startTime;

    return {
      handled: true,
      corrected,
      fallbackUsed: false,
      resultData: resultCenterline,
      warnings,
      errors,
      performance: {
        detectionTime: 0,
        handlingTime,
        totalTime: handlingTime
      }
    };
  }

  /**
   * Detect degenerate geometry
   */
  private detectDegenerateGeometry(centerline: Centerline): EdgeCaseDetectionResult {
    const issues: string[] = [];

    // Check for zero-length centerline
    const totalLength = this.calculateCenterlineLength(centerline);
    if (totalLength < this.config.toleranceSettings.pointDistance) {
      issues.push('Centerline has zero or near-zero length');
    }

    // Check for invalid angles in arc segments
    if (centerline.type === 'arc' && centerline.radius !== undefined) {
      if (centerline.radius < this.config.toleranceSettings.radiusThreshold) {
        issues.push('Arc radius is too small');
      }

      // Check for invalid arc angles
      const arcAngle = this.calculateArcAngle(centerline);
      if (arcAngle < this.config.toleranceSettings.angleThreshold) {
        issues.push('Arc angle is too small');
      }
    }

    return {
      detected: issues.length > 0,
      type: EdgeCaseType.DEGENERATE_GEOMETRY,
      severity: EdgeCaseSeverity.MODERATE,
      description: `Degenerate geometry detected: ${issues.join(', ')}`,
      affectedData: { centerlineId: centerline.id, issues, totalLength },
      suggestedAction: 'Adjust centerline geometry or remove degenerate segments',
      autoCorrectible: false,
      context: {
        totalLength,
        centerlineType: centerline.type,
        radius: centerline.radius
      }
    };
  }

  /**
   * Handle degenerate geometry
   */
  private async handleDegenerateGeometry(
    centerline: Centerline,
    detection: EdgeCaseDetectionResult
  ): Promise<EdgeCaseHandlingResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    // For degenerate geometry, we typically cannot auto-correct
    // This requires user intervention
    warnings.push('Degenerate geometry detected - user intervention required');
    
    const handlingTime = performance.now() - startTime;

    return {
      handled: true,
      corrected: false,
      fallbackUsed: false,
      resultData: centerline,
      warnings,
      errors,
      performance: {
        detectionTime: 0,
        handlingTime,
        totalTime: handlingTime
      }
    };
  }

  /**
   * Utility methods
   */
  private calculateDistance(point1: Point2D, point2: Point2D): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateCenterlineLength(centerline: Centerline): number {
    let totalLength = 0;
    for (let i = 1; i < centerline.points.length; i++) {
      totalLength += this.calculateDistance(centerline.points[i - 1], centerline.points[i]);
    }
    return totalLength;
  }

  private calculateArcAngle(centerline: Centerline): number {
    if (centerline.type !== 'arc' || centerline.points.length < 2) {
      return 0;
    }
    
    // Simplified arc angle calculation
    const start = centerline.points[0];
    const end = centerline.points[centerline.points.length - 1];
    const distance = this.calculateDistance(start, end);
    const radius = centerline.radius || 1;
    
    // Use chord length to estimate arc angle
    return 2 * Math.asin(Math.min(1, distance / (2 * radius)));
  }

  private detectExtremeCoordinates(snapPoints: SnapPoint[]): EdgeCaseDetectionResult {
    const limit = this.config.toleranceSettings.coordinateLimit;
    const extremePoints = snapPoints.filter(point => 
      Math.abs(point.position.x) > limit || Math.abs(point.position.y) > limit
    );

    return {
      detected: extremePoints.length > 0,
      type: EdgeCaseType.EXTREME_COORDINATES,
      severity: EdgeCaseSeverity.MODERATE,
      description: `Found ${extremePoints.length} snap points with extreme coordinates`,
      affectedData: extremePoints,
      suggestedAction: 'Clamp coordinates to valid range or adjust coordinate system',
      autoCorrectible: true,
      context: { limit, extremePointCount: extremePoints.length }
    };
  }

  private async handleExtremeCoordinates(
    snapPoints: SnapPoint[],
    detection: EdgeCaseDetectionResult
  ): Promise<EdgeCaseHandlingResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];
    let corrected = false;
    let resultSnapPoints = [...snapPoints];

    try {
      if (this.config.enableAutoCorrection) {
        const limit = this.config.toleranceSettings.coordinateLimit;
        resultSnapPoints = snapPoints.map(point => ({
          ...point,
          position: {
            x: Math.max(-limit, Math.min(limit, point.position.x)),
            y: Math.max(-limit, Math.min(limit, point.position.y))
          }
        }));
        corrected = true;
        warnings.push(`Clamped ${detection.affectedData.length} snap points to coordinate limits`);
      }
    } catch (error) {
      errors.push(`Failed to handle extreme coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const handlingTime = performance.now() - startTime;

    return {
      handled: true,
      corrected,
      fallbackUsed: false,
      resultData: resultSnapPoints,
      warnings,
      errors,
      performance: {
        detectionTime: 0,
        handlingTime,
        totalTime: handlingTime
      }
    };
  }

  private detectNumericalPrecisionIssues(snapPoints: SnapPoint[]): EdgeCaseDetectionResult {
    const precision = this.config.toleranceSettings.precisionDigits;
    const factor = Math.pow(10, precision);
    
    const precisionIssues = snapPoints.filter(point => {
      const roundedX = Math.round(point.position.x * factor) / factor;
      const roundedY = Math.round(point.position.y * factor) / factor;
      return Math.abs(point.position.x - roundedX) > Number.EPSILON ||
             Math.abs(point.position.y - roundedY) > Number.EPSILON;
    });

    return {
      detected: precisionIssues.length > 0,
      type: EdgeCaseType.NUMERICAL_PRECISION,
      severity: EdgeCaseSeverity.MINOR,
      description: `Found ${precisionIssues.length} snap points with precision issues`,
      affectedData: precisionIssues,
      suggestedAction: 'Round coordinates to appropriate precision',
      autoCorrectible: true,
      context: { precision, issueCount: precisionIssues.length }
    };
  }

  private async handleNumericalPrecisionIssues(
    snapPoints: SnapPoint[],
    detection: EdgeCaseDetectionResult
  ): Promise<EdgeCaseHandlingResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];
    let corrected = false;
    let resultSnapPoints = [...snapPoints];

    try {
      if (this.config.enableAutoCorrection) {
        const precision = this.config.toleranceSettings.precisionDigits;
        const factor = Math.pow(10, precision);
        
        resultSnapPoints = snapPoints.map(point => ({
          ...point,
          position: {
            x: Math.round(point.position.x * factor) / factor,
            y: Math.round(point.position.y * factor) / factor
          }
        }));
        corrected = true;
        warnings.push(`Rounded ${detection.affectedData.length} snap points to ${precision} decimal places`);
      }
    } catch (error) {
      errors.push(`Failed to handle precision issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const handlingTime = performance.now() - startTime;

    return {
      handled: true,
      corrected,
      fallbackUsed: false,
      resultData: resultSnapPoints,
      warnings,
      errors,
      performance: {
        detectionTime: 0,
        handlingTime,
        totalTime: handlingTime
      }
    };
  }

  private detectSelfIntersectingCenterline(centerline: Centerline): EdgeCaseDetectionResult {
    // Simplified self-intersection detection
    const intersections: Array<{ segment1: number; segment2: number }> = [];
    
    for (let i = 0; i < centerline.points.length - 1; i++) {
      for (let j = i + 2; j < centerline.points.length - 1; j++) {
        if (this.segmentsIntersect(
          centerline.points[i], centerline.points[i + 1],
          centerline.points[j], centerline.points[j + 1]
        )) {
          intersections.push({ segment1: i, segment2: j });
        }
      }
    }

    return {
      detected: intersections.length > 0,
      type: EdgeCaseType.SELF_INTERSECTING_CENTERLINE,
      severity: EdgeCaseSeverity.SEVERE,
      description: `Self-intersecting centerline with ${intersections.length} intersections`,
      affectedData: { centerlineId: centerline.id, intersections },
      suggestedAction: 'Modify centerline to remove self-intersections',
      autoCorrectible: false,
      context: { intersectionCount: intersections.length }
    };
  }

  private async handleSelfIntersectingCenterline(
    centerline: Centerline,
    detection: EdgeCaseDetectionResult
  ): Promise<EdgeCaseHandlingResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    
    // Self-intersecting centerlines typically require user intervention
    warnings.push('Self-intersecting centerline detected - user intervention required');
    
    const handlingTime = performance.now() - startTime;

    return {
      handled: true,
      corrected: false,
      fallbackUsed: false,
      resultData: centerline,
      warnings,
      errors: [],
      performance: {
        detectionTime: 0,
        handlingTime,
        totalTime: handlingTime
      }
    };
  }

  private detectZeroLengthSegments(centerline: Centerline): EdgeCaseDetectionResult {
    const zeroLengthSegments: number[] = [];
    const threshold = this.config.toleranceSettings.pointDistance;

    for (let i = 1; i < centerline.points.length; i++) {
      const distance = this.calculateDistance(centerline.points[i - 1], centerline.points[i]);
      if (distance < threshold) {
        zeroLengthSegments.push(i - 1);
      }
    }

    return {
      detected: zeroLengthSegments.length > 0,
      type: EdgeCaseType.ZERO_LENGTH_SEGMENT,
      severity: EdgeCaseSeverity.MODERATE,
      description: `Found ${zeroLengthSegments.length} zero-length segments`,
      affectedData: { centerlineId: centerline.id, segments: zeroLengthSegments },
      suggestedAction: 'Remove zero-length segments',
      autoCorrectible: true,
      context: { segmentCount: zeroLengthSegments.length, threshold }
    };
  }

  private async handleZeroLengthSegments(
    centerline: Centerline,
    detection: EdgeCaseDetectionResult
  ): Promise<EdgeCaseHandlingResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];
    let corrected = false;
    let resultCenterline = { ...centerline };

    try {
      if (this.config.enableAutoCorrection) {
        const threshold = this.config.toleranceSettings.pointDistance;
        const cleanedPoints: Point2D[] = [centerline.points[0]];

        for (let i = 1; i < centerline.points.length; i++) {
          const distance = this.calculateDistance(centerline.points[i - 1], centerline.points[i]);
          if (distance >= threshold) {
            cleanedPoints.push(centerline.points[i]);
          }
        }

        if (cleanedPoints.length >= 2) {
          resultCenterline = {
            ...centerline,
            points: cleanedPoints
          };
          corrected = true;
          warnings.push(`Removed ${centerline.points.length - cleanedPoints.length} zero-length segments`);
        } else {
          errors.push('Cannot remove zero-length segments: would result in invalid centerline');
        }
      }
    } catch (error) {
      errors.push(`Failed to handle zero-length segments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const handlingTime = performance.now() - startTime;

    return {
      handled: true,
      corrected,
      fallbackUsed: false,
      resultData: resultCenterline,
      warnings,
      errors,
      performance: {
        detectionTime: 0,
        handlingTime,
        totalTime: handlingTime
      }
    };
  }

  private segmentsIntersect(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): boolean {
    // Simplified line segment intersection test
    const d1 = this.orientation(p3, p4, p1);
    const d2 = this.orientation(p3, p4, p2);
    const d3 = this.orientation(p1, p2, p3);
    const d4 = this.orientation(p1, p2, p4);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }

    return false;
  }

  private orientation(p: Point2D, q: Point2D, r: Point2D): number {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  }

  private logError(message: string, error: any, context: Record<string, any>): void {
    if (this.errorHandler) {
      this.errorHandler.handleError(
        new SnapLogicError(
          message,
          ErrorCategory.VALIDATION,
          ErrorSeverity.MEDIUM,
          context,
          { cause: error instanceof Error ? error : undefined }
        )
      );
    } else if (this.config.enableVerboseLogging) {
      console.error('[EdgeCaseHandler]', message, error, context);
    }
  }

  private logPerformance(operation: string, duration: number): void {
    if (this.config.enableVerboseLogging) {
      console.log(`[EdgeCaseHandler] ${operation} took ${duration.toFixed(2)}ms`);
    }

    if (duration > this.config.performanceThresholds.maxHandlingTime) {
      this.logError(
        `Edge case handling exceeded time threshold: ${duration}ms > ${this.config.performanceThresholds.maxHandlingTime}ms`,
        null,
        { operation, duration, threshold: this.config.performanceThresholds.maxHandlingTime }
      );
    }
  }

  /**
   * Get edge case handling statistics
   */
  getHandlingStatistics(): Record<EdgeCaseType, number> {
    return Object.fromEntries(this.handlingStats);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EdgeCaseHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.detectionCache.clear();
  }

  /**
   * Dispose of the edge case handler
   */
  dispose(): void {
    this.detectionCache.clear();
    this.handlingStats.clear();
    this.errorHandler = null;
  }
}
