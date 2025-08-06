/**
 * Centerline Utilities
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Utilities for creating, manipulating, and validating centerlines
 * with SMACNA compliance checking and arc-based geometry.
 */

import { 
  Centerline, 
  CenterlinePoint, 
  CenterlineType 
} from '@/types/air-duct-sizer';

/**
 * SMACNA standards for centerline validation
 */
const SMACNA_STANDARDS = {
  MIN_RADIUS_RATIO: 1.5, // Minimum radius to diameter ratio for round elbows
  MAX_RADIUS_RATIO: 3.0, // Maximum radius to diameter ratio
  MIN_SEGMENT_LENGTH: 12, // Minimum segment length in inches
  MAX_ANGLE_DEVIATION: 5, // Maximum angle deviation from 90° for elbows (degrees)
  RECTANGULAR_RADIUS_RATIO: 1.0 // Radius to width ratio for rectangular elbows
};

/**
 * Utility class for centerline operations
 */
export class CenterlineUtils {

  /**
   * Create a new centerline
   */
  static createCenterline(
    id: string,
    type: CenterlineType = 'arc',
    initialPoint?: CenterlinePoint
  ): Centerline {
    const centerline: Centerline = {
      id,
      type,
      points: initialPoint ? [initialPoint] : [],
      isComplete: false,
      isSMACNACompliant: true,
      warnings: [],
      metadata: {
        totalLength: 0,
        segmentCount: 0,
        hasArcs: type === 'arc',
        createdAt: new Date(),
        lastModified: new Date()
      }
    };

    return centerline;
  }

  /**
   * Add a point to a centerline
   */
  static addPoint(centerline: Centerline, point: CenterlinePoint): Centerline {
    const updatedCenterline = { ...centerline };
    updatedCenterline.points = [...centerline.points, point];
    updatedCenterline.metadata.lastModified = new Date();
    
    // Recalculate metadata
    updatedCenterline.metadata = this.calculateMetadata(updatedCenterline);
    
    // Validate SMACNA compliance
    const validation = this.validateSMACNACompliance(updatedCenterline);
    updatedCenterline.isSMACNACompliant = validation.isCompliant;
    updatedCenterline.warnings = validation.warnings;

    return updatedCenterline;
  }

  /**
   * Remove the last point from a centerline
   */
  static removeLastPoint(centerline: Centerline): Centerline {
    if (centerline.points.length === 0) return centerline;

    const updatedCenterline = { ...centerline };
    updatedCenterline.points = centerline.points.slice(0, -1);
    updatedCenterline.metadata.lastModified = new Date();
    
    // Recalculate metadata
    updatedCenterline.metadata = this.calculateMetadata(updatedCenterline);
    
    // Validate SMACNA compliance
    const validation = this.validateSMACNACompliance(updatedCenterline);
    updatedCenterline.isSMACNACompliant = validation.isCompliant;
    updatedCenterline.warnings = validation.warnings;

    return updatedCenterline;
  }

  /**
   * Complete a centerline (mark as finished)
   */
  static completeCenterline(centerline: Centerline): Centerline {
    const updatedCenterline = { ...centerline };
    updatedCenterline.isComplete = true;
    updatedCenterline.metadata.lastModified = new Date();
    
    return updatedCenterline;
  }

  /**
   * Calculate centerline metadata
   */
  static calculateMetadata(centerline: Centerline): Centerline['metadata'] {
    const metadata = { ...centerline.metadata };
    
    // Calculate total length
    metadata.totalLength = this.calculateTotalLength(centerline);
    
    // Count segments
    metadata.segmentCount = Math.max(0, centerline.points.length - 1);
    
    // Check for arcs
    metadata.hasArcs = centerline.type === 'arc' || 
      centerline.points.some(point => point.isControlPoint);

    return metadata;
  }

  /**
   * Calculate total length of centerline
   */
  static calculateTotalLength(centerline: Centerline): number {
    if (centerline.points.length < 2) return 0;

    let totalLength = 0;

    for (let i = 0; i < centerline.points.length - 1; i++) {
      const point1 = centerline.points[i];
      const point2 = centerline.points[i + 1];
      
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      totalLength += segmentLength;
    }

    return totalLength;
  }

  /**
   * Validate SMACNA compliance
   */
  static validateSMACNACompliance(centerline: Centerline): {
    isCompliant: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    if (centerline.points.length < 2) {
      return { isCompliant: true, warnings: [] };
    }

    // Check minimum segment lengths
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const point1 = centerline.points[i];
      const point2 = centerline.points[i + 1];
      
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      // Convert pixels to inches (assuming 1 pixel = 1 inch for now)
      if (segmentLength < SMACNA_STANDARDS.MIN_SEGMENT_LENGTH) {
        warnings.push(`Segment ${i + 1} is too short (${segmentLength.toFixed(1)}" < ${SMACNA_STANDARDS.MIN_SEGMENT_LENGTH}")`);
      }
    }

    // Check for sharp angles that might require special fittings
    if (centerline.points.length >= 3) {
      for (let i = 1; i < centerline.points.length - 1; i++) {
        const angle = this.calculateAngle(
          centerline.points[i - 1],
          centerline.points[i],
          centerline.points[i + 1]
        );
        
        const deviationFrom90 = Math.abs(90 - Math.abs(angle));
        if (deviationFrom90 > SMACNA_STANDARDS.MAX_ANGLE_DEVIATION && 
            deviationFrom90 < 85) { // Not a straight line
          warnings.push(`Non-standard angle at point ${i + 1}: ${angle.toFixed(1)}° (consider standard 90° fitting)`);
        }
      }
    }

    // Check for arc-based centerlines
    if (centerline.type === 'arc') {
      const arcValidation = this.validateArcCompliance(centerline);
      warnings.push(...arcValidation.warnings);
    }

    return {
      isCompliant: warnings.length === 0,
      warnings
    };
  }

  /**
   * Validate arc compliance for curved centerlines
   */
  static validateArcCompliance(centerline: Centerline): {
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // For arc-based centerlines, check radius ratios
    // This is a simplified check - in practice, you'd need duct dimensions
    for (let i = 1; i < centerline.points.length - 1; i++) {
      const point1 = centerline.points[i - 1];
      const point2 = centerline.points[i];
      const point3 = centerline.points[i + 1];
      
      const radius = this.calculateArcRadius(point1, point2, point3);
      if (radius && radius > 0) {
        // Assuming a default duct diameter of 12" for validation
        const defaultDiameter = 12;
        const radiusRatio = radius / defaultDiameter;
        
        if (radiusRatio < SMACNA_STANDARDS.MIN_RADIUS_RATIO) {
          warnings.push(`Arc radius too small at point ${i + 1}: R/D = ${radiusRatio.toFixed(2)} (min: ${SMACNA_STANDARDS.MIN_RADIUS_RATIO})`);
        }
        
        if (radiusRatio > SMACNA_STANDARDS.MAX_RADIUS_RATIO) {
          warnings.push(`Arc radius too large at point ${i + 1}: R/D = ${radiusRatio.toFixed(2)} (max: ${SMACNA_STANDARDS.MAX_RADIUS_RATIO})`);
        }
      }
    }

    return { warnings };
  }

  /**
   * Calculate angle between three points
   */
  static calculateAngle(
    point1: CenterlinePoint,
    point2: CenterlinePoint,
    point3: CenterlinePoint
  ): number {
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };
    
    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    return (angle * 180) / Math.PI;
  }

  /**
   * Calculate arc radius for three points
   */
  static calculateArcRadius(
    point1: CenterlinePoint,
    point2: CenterlinePoint,
    point3: CenterlinePoint
  ): number | null {
    // Calculate the circumradius of the triangle formed by the three points
    const a = Math.sqrt(Math.pow(point2.x - point3.x, 2) + Math.pow(point2.y - point3.y, 2));
    const b = Math.sqrt(Math.pow(point1.x - point3.x, 2) + Math.pow(point1.y - point3.y, 2));
    const c = Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    
    const area = Math.abs((point1.x * (point2.y - point3.y) + 
                          point2.x * (point3.y - point1.y) + 
                          point3.x * (point1.y - point2.y)) / 2);
    
    if (area === 0) return null; // Points are collinear
    
    return (a * b * c) / (4 * area);
  }

  /**
   * Convert segmented centerline to arc-based
   */
  static convertToArc(centerline: Centerline): Centerline {
    if (centerline.type === 'arc' || centerline.points.length < 3) {
      return centerline;
    }

    const updatedCenterline = { ...centerline };
    updatedCenterline.type = 'arc';
    updatedCenterline.metadata.hasArcs = true;
    updatedCenterline.metadata.lastModified = new Date();

    // Add control points for smooth curves
    const newPoints: CenterlinePoint[] = [];
    
    for (let i = 0; i < centerline.points.length; i++) {
      newPoints.push(centerline.points[i]);
      
      // Add control points between segments for smooth curves
      if (i < centerline.points.length - 1) {
        const current = centerline.points[i];
        const next = centerline.points[i + 1];
        
        // Calculate tangent for smooth transition
        const tangent = {
          x: (next.x - current.x) * 0.3,
          y: (next.y - current.y) * 0.3
        };
        
        newPoints.push({
          x: current.x + tangent.x,
          y: current.y + tangent.y,
          isControlPoint: true,
          tangent
        });
      }
    }

    updatedCenterline.points = newPoints;
    
    // Recalculate metadata and validation
    updatedCenterline.metadata = this.calculateMetadata(updatedCenterline);
    const validation = this.validateSMACNACompliance(updatedCenterline);
    updatedCenterline.isSMACNACompliant = validation.isCompliant;
    updatedCenterline.warnings = validation.warnings;

    return updatedCenterline;
  }

  /**
   * Convert arc-based centerline to segmented
   */
  static convertToSegmented(centerline: Centerline): Centerline {
    if (centerline.type === 'segmented') {
      return centerline;
    }

    const updatedCenterline = { ...centerline };
    updatedCenterline.type = 'segmented';
    updatedCenterline.metadata.hasArcs = false;
    updatedCenterline.metadata.lastModified = new Date();

    // Remove control points and keep only main points
    updatedCenterline.points = centerline.points.filter(point => !point.isControlPoint);

    // Recalculate metadata and validation
    updatedCenterline.metadata = this.calculateMetadata(updatedCenterline);
    const validation = this.validateSMACNACompliance(updatedCenterline);
    updatedCenterline.isSMACNACompliant = validation.isCompliant;
    updatedCenterline.warnings = validation.warnings;

    return updatedCenterline;
  }

  /**
   * Get centerline bounds
   */
  static getBounds(centerline: Centerline): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    if (centerline.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = centerline.points[0].x;
    let minY = centerline.points[0].y;
    let maxX = centerline.points[0].x;
    let maxY = centerline.points[0].y;

    for (const point of centerline.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Check if a point is on the centerline
   */
  static isPointOnCenterline(
    centerline: Centerline,
    point: { x: number; y: number },
    tolerance: number = 5
  ): boolean {
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const segmentStart = centerline.points[i];
      const segmentEnd = centerline.points[i + 1];
      
      const distance = this.distanceToLineSegment(point, segmentStart, segmentEnd);
      if (distance <= tolerance) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate distance from point to line segment
   */
  static distanceToLineSegment(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Line segment is a point
      return Math.sqrt(A * A + B * B);
    }

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
}
