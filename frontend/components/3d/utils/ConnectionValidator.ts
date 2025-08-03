/**
 * Connection Validation and Management System
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Extracted connection validation logic from Canvas3D.tsx
 */

import { Vector3, Euler } from 'three';
import { 
  ConnectionPoint, 
  DuctSegment, 
  ConnectionValidationResult,
  DuctFitting,
  TransitionFitting,
  ElbowFitting 
} from '../types/Canvas3DTypes';
import { SMACNAStandards } from './SMACNAStandards';

export class ConnectionValidator {
  /**
   * Check if two connection points are compatible for connection
   */
  static areCompatible(point1: ConnectionPoint, point2: ConnectionPoint): boolean {
    // Check if both points are available
    if (point1.status !== 'available' || point2.status !== 'available') {
      return false;
    }

    // Check if shapes are compatible (same shape or transition possible)
    const shapesCompatible = point1.shape === point2.shape || 
                           this.isTransitionPossible(point1, point2);

    // Check if directions are roughly opposite (for proper connection)
    const directionsOpposite = point1.direction.dot(point2.direction) < -0.8;

    return shapesCompatible && directionsOpposite;
  }

  /**
   * Check if a transition is possible between two connection points
   */
  static isTransitionPossible(point1: ConnectionPoint, point2: ConnectionPoint): boolean {
    // All shape transitions are possible with appropriate fittings
    return true;
  }

  /**
   * Calculate connection distance between two points
   */
  static getConnectionDistance(point1: ConnectionPoint, point2: ConnectionPoint): number {
    return point1.position.distanceTo(point2.position);
  }

  /**
   * Validate if connection distance is within acceptable range
   */
  static isDistanceAcceptable(distance: number): boolean {
    // Acceptable connection distance: 0.1" to 6" (in model units)
    return distance >= 0.1 && distance <= 6.0;
  }

  /**
   * Get size difference between two connection points
   */
  static getSizeDifference(point1: ConnectionPoint, point2: ConnectionPoint): number {
    const size1 = this.getConnectionSize(point1);
    const size2 = this.getConnectionSize(point2);
    return Math.abs(size1 - size2);
  }

  /**
   * Get effective size of a connection point
   */
  static getConnectionSize(point: ConnectionPoint): number {
    if (point.shape === 'round' && point.diameter) {
      return point.diameter;
    } else if (point.shape === 'rectangular' && point.width && point.height) {
      return SMACNAStandards.getEquivalentDiameter({
        width: point.width,
        height: point.height,
        shape: 'rectangular'
      });
    }
    return 12; // Default size
  }

  /**
   * Comprehensive connection validation
   */
  static validateConnection(
    point1: ConnectionPoint, 
    point2: ConnectionPoint
  ): ConnectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const requiredFittings: DuctFitting[] = [];

    // Check basic compatibility
    if (!this.areCompatible(point1, point2)) {
      errors.push('Connection points are not compatible');
    }

    // Check availability
    if (point1.status !== 'available') {
      errors.push(`Point 1 is ${point1.status}`);
    }
    if (point2.status !== 'available') {
      errors.push(`Point 2 is ${point2.status}`);
    }

    // Check distance
    const distance = this.getConnectionDistance(point1, point2);
    if (!this.isDistanceAcceptable(distance)) {
      if (distance < 0.1) {
        errors.push('Connection points are too close (overlap)');
      } else {
        warnings.push(`Connection distance ${distance.toFixed(2)}" may require additional ductwork`);
      }
    }

    // Check size compatibility
    const sizeDifference = this.getSizeDifference(point1, point2);
    if (sizeDifference > 0.5) {
      warnings.push(`Size difference ${sizeDifference.toFixed(2)}" may require transition fitting`);
      
      // Generate required transition fitting
      const transition = this.generateRequiredTransition(point1, point2);
      if (transition) {
        requiredFittings.push(transition);
        suggestions.push('Add transition fitting to accommodate size difference');
      }
    }

    // Check shape compatibility
    if (point1.shape !== point2.shape) {
      warnings.push('Different shapes require transition fitting');
      
      const transition = this.generateRequiredTransition(point1, point2);
      if (transition) {
        requiredFittings.push(transition);
        suggestions.push(`Add ${point1.shape}-to-${point2.shape} transition fitting`);
      }
    }

    // Check direction alignment
    const directionDot = point1.direction.dot(point2.direction);
    if (directionDot > -0.8) {
      warnings.push('Connection directions are not properly aligned');
      if (directionDot > 0) {
        suggestions.push('Consider adding elbow fitting to change direction');
      }
    }

    // Calculate compatibility score
    let compatibilityScore = 100;
    compatibilityScore -= errors.length * 30;
    compatibilityScore -= warnings.length * 10;
    compatibilityScore = Math.max(0, compatibilityScore);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      compatibilityScore,
      requiredFittings
    };
  }

  /**
   * Generate required transition fitting for connection
   */
  private static generateRequiredTransition(
    point1: ConnectionPoint, 
    point2: ConnectionPoint
  ): TransitionFitting | null {
    if (point1.shape === point2.shape && this.getSizeDifference(point1, point2) < 0.5) {
      return null; // No transition needed
    }

    const midpoint = new Vector3().addVectors(point1.position, point2.position).multiplyScalar(0.5);
    const direction = new Vector3().subVectors(point2.position, point1.position).normalize();

    // Determine transition type
    let transitionType: 'rect-to-rect' | 'round-to-round' | 'rect-to-round' | 'round-to-rect';
    if (point1.shape === 'rectangular' && point2.shape === 'rectangular') {
      transitionType = 'rect-to-rect';
    } else if (point1.shape === 'round' && point2.shape === 'round') {
      transitionType = 'round-to-round';
    } else if (point1.shape === 'rectangular' && point2.shape === 'round') {
      transitionType = 'rect-to-round';
    } else {
      transitionType = 'round-to-rect';
    }

    // Calculate transition length
    const length = SMACNAStandards.calculateTransitionLength(
      {
        width: point1.width,
        height: point1.height,
        diameter: point1.diameter,
        shape: point1.shape
      },
      {
        width: point2.width,
        height: point2.height,
        diameter: point2.diameter,
        shape: point2.shape
      }
    );

    return {
      id: `transition_${Date.now()}`,
      type: 'transition',
      position: midpoint,
      rotation: new Euler(0, 0, 0),
      inlet: { ...point1 },
      outlet: { ...point2 },
      material: 'galvanized_steel',
      transitionType,
      length,
      slopeRatio: SMACNAStandards.TRANSITION_SLOPE_RATIO
    };
  }

  /**
   * Find all possible connections for a given connection point
   */
  static findPossibleConnections(
    targetPoint: ConnectionPoint,
    availablePoints: ConnectionPoint[],
    maxDistance: number = 12
  ): Array<{
    point: ConnectionPoint;
    validation: ConnectionValidationResult;
    distance: number;
  }> {
    return availablePoints
      .filter(point => point.id !== targetPoint.id)
      .map(point => ({
        point,
        validation: this.validateConnection(targetPoint, point),
        distance: this.getConnectionDistance(targetPoint, point)
      }))
      .filter(result => result.distance <= maxDistance)
      .sort((a, b) => b.validation.compatibilityScore - a.validation.compatibilityScore);
  }

  /**
   * Auto-connect compatible points within tolerance
   */
  static autoConnect(
    points: ConnectionPoint[],
    tolerance: number = 1.0
  ): Array<{
    point1: ConnectionPoint;
    point2: ConnectionPoint;
    validation: ConnectionValidationResult;
  }> {
    const connections: Array<{
      point1: ConnectionPoint;
      point2: ConnectionPoint;
      validation: ConnectionValidationResult;
    }> = [];

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const point1 = points[i];
        const point2 = points[j];
        
        if (point1.status !== 'available' || point2.status !== 'available') {
          continue;
        }

        const distance = this.getConnectionDistance(point1, point2);
        if (distance <= tolerance) {
          const validation = this.validateConnection(point1, point2);
          if (validation.isValid || validation.compatibilityScore > 70) {
            connections.push({ point1, point2, validation });
          }
        }
      }
    }

    return connections.sort((a, b) => b.validation.compatibilityScore - a.validation.compatibilityScore);
  }

  /**
   * Validate system connectivity
   */
  static validateSystemConnectivity(segments: DuctSegment[]): {
    isConnected: boolean;
    isolatedSegments: string[];
    connectionGaps: Array<{
      segment1: string;
      segment2: string;
      distance: number;
      requiredFittings: DuctFitting[];
    }>;
  } {
    const isolatedSegments: string[] = [];
    const connectionGaps: Array<{
      segment1: string;
      segment2: string;
      distance: number;
      requiredFittings: DuctFitting[];
    }> = [];

    // Build connection graph
    const connections = new Map<string, string[]>();
    
    segments.forEach(segment => {
      connections.set(segment.id, []);
    });

    // Find actual connections
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i];
        const seg2 = segments[j];
        
        // Check if segments are connected
        const connected = this.areSegmentsConnected(seg1, seg2);
        if (connected) {
          connections.get(seg1.id)?.push(seg2.id);
          connections.get(seg2.id)?.push(seg1.id);
        } else {
          // Check for potential connections
          const gap = this.findConnectionGap(seg1, seg2);
          if (gap && gap.distance < 12) {
            connectionGaps.push({
              segment1: seg1.id,
              segment2: seg2.id,
              distance: gap.distance,
              requiredFittings: gap.requiredFittings
            });
          }
        }
      }
    }

    // Find isolated segments using DFS
    const visited = new Set<string>();
    let componentCount = 0;

    segments.forEach(segment => {
      if (!visited.has(segment.id)) {
        const component = this.dfsComponent(segment.id, connections, visited);
        componentCount++;
        
        if (component.length === 1) {
          isolatedSegments.push(segment.id);
        }
      }
    });

    return {
      isConnected: componentCount <= 1,
      isolatedSegments,
      connectionGaps
    };
  }

  /**
   * Check if two segments are connected
   */
  private static areSegmentsConnected(seg1: DuctSegment, seg2: DuctSegment): boolean {
    if (!seg1.outlet || !seg2.inlet) return false;
    
    const distance = seg1.outlet.position.distanceTo(seg2.inlet.position);
    return distance < 0.5; // Connected if within 0.5" tolerance
  }

  /**
   * Find connection gap between two segments
   */
  private static findConnectionGap(seg1: DuctSegment, seg2: DuctSegment): {
    distance: number;
    requiredFittings: DuctFitting[];
  } | null {
    if (!seg1.outlet || !seg2.inlet) return null;
    
    const distance = seg1.outlet.position.distanceTo(seg2.inlet.position);
    const validation = this.validateConnection(seg1.outlet, seg2.inlet);
    
    return {
      distance,
      requiredFittings: validation.requiredFittings
    };
  }

  /**
   * Depth-first search for connected components
   */
  private static dfsComponent(
    nodeId: string,
    connections: Map<string, string[]>,
    visited: Set<string>
  ): string[] {
    if (visited.has(nodeId)) return [];
    
    visited.add(nodeId);
    const component = [nodeId];
    
    const neighbors = connections.get(nodeId) || [];
    neighbors.forEach(neighborId => {
      component.push(...this.dfsComponent(neighborId, connections, visited));
    });
    
    return component;
  }
}
