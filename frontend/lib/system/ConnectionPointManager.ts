/**
 * Connection Point Manager
 * Handles connection logic between duct segments, equipment, and fittings
 * SizeWise Suite - Real-time Calculation Connectivity Implementation
 */

import { Vector3 } from 'three';
import { DuctSegment, Equipment, DuctFitting, ConnectionPoint } from '@/components/3d/types/Canvas3DTypes';
import { SystemTopologyManager } from './SystemTopologyManager';
import { createEnhancedDuctFitting } from './SystemDataUtils';

export interface ConnectionValidationResult {
  isValid: boolean;
  canConnect: boolean;
  requiresFitting: boolean;
  suggestedFitting?: DuctFitting;
  validationErrors: string[];
  validationWarnings: string[];
  connectionDistance: number;
  alignmentScore: number; // 0-1, where 1 is perfect alignment
}

export interface ConnectionAttempt {
  fromElementId: string;
  toElementId: string;
  fromConnectionPointId: string;
  toConnectionPointId: string;
  timestamp: Date;
  result: ConnectionValidationResult;
}

export interface AutoConnectionOptions {
  maxDistance: number; // Maximum distance for auto-connection (inches)
  alignmentTolerance: number; // Alignment tolerance in degrees
  enableAutoFitting: boolean; // Automatically insert fittings when needed
  preferDirectConnections: boolean; // Prefer direct connections over fittings
  snapToGrid: boolean; // Snap connection points to grid
  gridSize: number; // Grid size for snapping (inches)
}

/**
 * Connection Point Manager
 * Manages all connection logic and validation for HVAC system elements
 */
export class ConnectionPointManager {
  private topologyManager: SystemTopologyManager;
  private connectionAttempts: ConnectionAttempt[] = [];
  private autoConnectionOptions: AutoConnectionOptions;

  // Event callbacks
  private onConnectionCreated?: (connectionId: string) => void;
  private onConnectionFailed?: (attempt: ConnectionAttempt) => void;
  private onFittingGenerated?: (fitting: DuctFitting) => void;

  constructor(
    topologyManager: SystemTopologyManager,
    options?: Partial<AutoConnectionOptions>,
    callbacks?: {
      onConnectionCreated?: (connectionId: string) => void;
      onConnectionFailed?: (attempt: ConnectionAttempt) => void;
      onFittingGenerated?: (fitting: DuctFitting) => void;
    }
  ) {
    this.topologyManager = topologyManager;
    this.autoConnectionOptions = {
      maxDistance: 12, // 12 inches
      alignmentTolerance: 15, // 15 degrees
      enableAutoFitting: true,
      preferDirectConnections: true,
      snapToGrid: false,
      gridSize: 1, // 1 inch
      ...options
    };
    
    this.onConnectionCreated = callbacks?.onConnectionCreated;
    this.onConnectionFailed = callbacks?.onConnectionFailed;
    this.onFittingGenerated = callbacks?.onFittingGenerated;
  }

  /**
   * Attempt to create a connection between two elements
   */
  attemptConnection(
    fromElementId: string,
    toElementId: string,
    fromConnectionPointId: string,
    toConnectionPointId: string
  ): ConnectionValidationResult {
    const attempt: ConnectionAttempt = {
      fromElementId,
      toElementId,
      fromConnectionPointId,
      toConnectionPointId,
      timestamp: new Date(),
      result: { isValid: false, canConnect: false, requiresFitting: false, validationErrors: [], validationWarnings: [], connectionDistance: 0, alignmentScore: 0 }
    };

    try {
      // Validate the connection
      const validationResult = this.validateConnection(
        fromElementId,
        toElementId,
        fromConnectionPointId,
        toConnectionPointId
      );

      attempt.result = validationResult;

      if (validationResult.isValid && validationResult.canConnect) {
        // Create the connection
        const connection = this.createConnection(
          fromElementId,
          toElementId,
          fromConnectionPointId,
          toConnectionPointId,
          validationResult
        );

        if (connection) {
          this.onConnectionCreated?.(connection.id);
        }
      } else {
        this.onConnectionFailed?.(attempt);
      }

      this.connectionAttempts.push(attempt);
      return validationResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      attempt.result.validationErrors.push(errorMessage);
      this.connectionAttempts.push(attempt);
      this.onConnectionFailed?.(attempt);
      return attempt.result;
    }
  }

  /**
   * Validate a potential connection between two elements
   */
  validateConnection(
    fromElementId: string,
    toElementId: string,
    fromConnectionPointId: string,
    toConnectionPointId: string
  ): ConnectionValidationResult {
    const result: ConnectionValidationResult = {
      isValid: false,
      canConnect: false,
      requiresFitting: false,
      validationErrors: [],
      validationWarnings: [],
      connectionDistance: 0,
      alignmentScore: 0
    };

    // Get elements from topology manager
    const fromNode = this.topologyManager.getNodes().get(fromElementId);
    const toNode = this.topologyManager.getNodes().get(toElementId);

    if (!fromNode || !toNode) {
      result.validationErrors.push('One or both elements not found in system topology');
      return result;
    }

    // Get connection points
    const fromPoint = this.getConnectionPoint(fromNode.element, fromConnectionPointId);
    const toPoint = this.getConnectionPoint(toNode.element, toConnectionPointId);

    if (!fromPoint || !toPoint) {
      result.validationErrors.push('One or both connection points not found');
      return result;
    }

    // Check if connection points are already connected
    if (fromPoint.status === 'connected' || toPoint.status === 'connected') {
      result.validationErrors.push('One or both connection points are already connected');
      return result;
    }

    // Calculate distance between connection points
    result.connectionDistance = fromPoint.position.distanceTo(toPoint.position);

    // Check maximum distance constraint
    if (result.connectionDistance > this.autoConnectionOptions.maxDistance) {
      result.validationErrors.push(
        `Connection distance ${result.connectionDistance.toFixed(2)}" exceeds maximum allowed distance of ${this.autoConnectionOptions.maxDistance}"`
      );
      return result;
    }

    // Calculate alignment score
    result.alignmentScore = this.calculateAlignmentScore(fromPoint, toPoint);

    // Check shape compatibility
    const shapeCompatibility = this.checkShapeCompatibility(fromPoint, toPoint);
    if (!shapeCompatibility.compatible) {
      if (this.autoConnectionOptions.enableAutoFitting) {
        result.requiresFitting = true;
        result.suggestedFitting = this.generateTransitionFitting(fromPoint, toPoint);
        result.validationWarnings.push('Shape mismatch - transition fitting will be inserted');
      } else {
        result.validationErrors.push('Incompatible connection point shapes');
        return result;
      }
    }

    // Check size compatibility
    const sizeCompatibility = this.checkSizeCompatibility(fromPoint, toPoint);
    if (!sizeCompatibility.compatible) {
      if (this.autoConnectionOptions.enableAutoFitting && sizeCompatibility.canTransition) {
        result.requiresFitting = true;
        if (!result.suggestedFitting) {
          result.suggestedFitting = this.generateReducerFitting(fromPoint, toPoint);
        }
        result.validationWarnings.push('Size mismatch - reducer fitting will be inserted');
      } else {
        result.validationErrors.push('Incompatible connection point sizes');
        return result;
      }
    }

    // Check alignment
    if (result.alignmentScore < 0.8) { // 80% alignment threshold
      if (this.autoConnectionOptions.enableAutoFitting) {
        result.requiresFitting = true;
        if (!result.suggestedFitting) {
          result.suggestedFitting = this.generateElbowFitting(fromPoint, toPoint);
        }
        result.validationWarnings.push('Poor alignment - elbow fitting will be inserted');
      } else {
        result.validationWarnings.push('Poor alignment - connection may not be optimal');
      }
    }

    // Check for direct connection possibility
    if (result.connectionDistance <= 1.0 && result.alignmentScore >= 0.9 && !result.requiresFitting) {
      result.canConnect = true;
      result.isValid = true;
    } else if (result.requiresFitting && result.suggestedFitting) {
      result.canConnect = true;
      result.isValid = true;
    } else if (result.connectionDistance <= 6.0 && result.alignmentScore >= 0.7) {
      // Can connect with extension or flexible connector
      result.canConnect = true;
      result.isValid = true;
      result.validationWarnings.push('Connection requires extension or flexible connector');
    }

    return result;
  }

  /**
   * Find nearby connection points for auto-connection
   */
  findNearbyConnectionPoints(
    elementId: string,
    connectionPointId: string,
    maxDistance?: number
  ): Array<{
    elementId: string;
    connectionPointId: string;
    distance: number;
    alignmentScore: number;
    validationResult: ConnectionValidationResult;
  }> {
    const searchDistance = maxDistance || this.autoConnectionOptions.maxDistance;
    const sourceNode = this.topologyManager.getNodes().get(elementId);
    
    if (!sourceNode) return [];

    const sourcePoint = this.getConnectionPoint(sourceNode.element, connectionPointId);
    if (!sourcePoint) return [];

    const nearbyPoints: Array<{
      elementId: string;
      connectionPointId: string;
      distance: number;
      alignmentScore: number;
      validationResult: ConnectionValidationResult;
    }> = [];

    // Search through all nodes
    this.topologyManager.getNodes().forEach((node, nodeId) => {
      if (nodeId === elementId) return; // Skip self

      const connectionPoints = this.getAllConnectionPoints(node.element);
      
      connectionPoints.forEach(point => {
        if (point.status === 'connected') return; // Skip already connected points

        const distance = sourcePoint.position.distanceTo(point.position);
        if (distance <= searchDistance) {
          const alignmentScore = this.calculateAlignmentScore(sourcePoint, point);
          const validationResult = this.validateConnection(elementId, nodeId, connectionPointId, point.id);
          
          nearbyPoints.push({
            elementId: nodeId,
            connectionPointId: point.id,
            distance,
            alignmentScore,
            validationResult
          });
        }
      });
    });

    // Sort by connection quality (distance and alignment)
    return nearbyPoints.sort((a, b) => {
      const scoreA = (1 - a.distance / searchDistance) * 0.5 + a.alignmentScore * 0.5;
      const scoreB = (1 - b.distance / searchDistance) * 0.5 + b.alignmentScore * 0.5;
      return scoreB - scoreA;
    });
  }

  /**
   * Auto-connect elements based on proximity and compatibility
   */
  autoConnect(elementId: string): string[] {
    const connectionIds: string[] = [];
    const node = this.topologyManager.getNodes().get(elementId);
    
    if (!node) return connectionIds;

    const connectionPoints = this.getAllConnectionPoints(node.element);
    
    connectionPoints.forEach(point => {
      if (point.status === 'connected') return;

      const nearbyPoints = this.findNearbyConnectionPoints(elementId, point.id);
      
      // Try to connect to the best nearby point
      if (nearbyPoints.length > 0) {
        const bestMatch = nearbyPoints[0];
        if (bestMatch.validationResult.isValid && bestMatch.validationResult.canConnect) {
          const result = this.attemptConnection(
            elementId,
            bestMatch.elementId,
            point.id,
            bestMatch.connectionPointId
          );
          
          if (result.isValid) {
            connectionIds.push(`${elementId}_${bestMatch.elementId}`);
          }
        }
      }
    });

    return connectionIds;
  }

  // Private helper methods
  private createConnection(
    fromElementId: string,
    toElementId: string,
    fromConnectionPointId: string,
    toConnectionPointId: string,
    validationResult: ConnectionValidationResult
  ) {
    // Insert fitting if required
    if (validationResult.requiresFitting && validationResult.suggestedFitting) {
      const fitting = validationResult.suggestedFitting;
      this.topologyManager.addNode(fitting);
      this.onFittingGenerated?.(fitting);
      
      // Create connections: from -> fitting -> to
      const connection1 = this.topologyManager.createConnection(
        fromElementId,
        fitting.id,
        fromConnectionPointId,
        fitting.inlet.id
      );
      
      const connection2 = this.topologyManager.createConnection(
        fitting.id,
        toElementId,
        fitting.outlet.id,
        toConnectionPointId
      );
      
      return connection1; // Return first connection as primary
    } else {
      // Direct connection
      return this.topologyManager.createConnection(
        fromElementId,
        toElementId,
        fromConnectionPointId,
        toConnectionPointId
      );
    }
  }

  private getConnectionPoint(element: any, pointId: string): ConnectionPoint | null {
    if ('inlet' in element && element.inlet?.id === pointId) return element.inlet;
    if ('outlet' in element && element.outlet?.id === pointId) return element.outlet;
    if ('connectionPoints' in element) {
      return element.connectionPoints.find((cp: ConnectionPoint) => cp.id === pointId) || null;
    }
    return null;
  }

  private getAllConnectionPoints(element: any): ConnectionPoint[] {
    const points: ConnectionPoint[] = [];
    
    if ('inlet' in element && element.inlet) points.push(element.inlet);
    if ('outlet' in element && element.outlet) points.push(element.outlet);
    if ('connectionPoints' in element && Array.isArray(element.connectionPoints)) {
      points.push(...element.connectionPoints);
    }
    
    return points;
  }

  private calculateAlignmentScore(point1: ConnectionPoint, point2: ConnectionPoint): number {
    // Calculate alignment based on direction vectors
    const dot = point1.direction.dot(point2.direction.clone().negate());
    return Math.max(0, dot); // 0 = perpendicular, 1 = perfectly aligned
  }

  private checkShapeCompatibility(point1: ConnectionPoint, point2: ConnectionPoint): {
    compatible: boolean;
    canTransition: boolean;
  } {
    const compatible = point1.shape === point2.shape;
    const canTransition = (point1.shape === 'round' && point2.shape === 'rectangular') ||
                         (point1.shape === 'rectangular' && point2.shape === 'round');
    
    return { compatible, canTransition };
  }

  private checkSizeCompatibility(point1: ConnectionPoint, point2: ConnectionPoint): {
    compatible: boolean;
    canTransition: boolean;
  } {
    const tolerance = 0.5; // 0.5 inch tolerance
    
    if (point1.shape === 'round' && point2.shape === 'round') {
      const diameter1 = point1.diameter || 12;
      const diameter2 = point2.diameter || 12;
      const compatible = Math.abs(diameter1 - diameter2) <= tolerance;
      const canTransition = Math.abs(diameter1 - diameter2) <= 6; // Can transition up to 6" difference
      return { compatible, canTransition };
    } else if (point1.shape === 'rectangular' && point2.shape === 'rectangular') {
      const area1 = (point1.width || 12) * (point1.height || 8);
      const area2 = (point2.width || 12) * (point2.height || 8);
      const compatible = Math.abs(area1 - area2) <= (tolerance * tolerance);
      const canTransition = Math.abs(area1 - area2) <= 36; // Can transition up to 36 sq in difference
      return { compatible, canTransition };
    } else {
      // Different shapes - can transition if sizes are reasonable
      return { compatible: false, canTransition: true };
    }
  }

  private generateTransitionFitting(fromPoint: ConnectionPoint, toPoint: ConnectionPoint): DuctFitting {
    const midpoint = new Vector3().addVectors(fromPoint.position, toPoint.position).multiplyScalar(0.5);
    const fittingId = `transition_${Date.now()}`;
    
    return createEnhancedDuctFitting(
      fittingId,
      'transition',
      midpoint,
      { ...fromPoint, id: `${fittingId}_inlet` },
      { ...toPoint, id: `${fittingId}_outlet` }
    );
  }

  private generateReducerFitting(fromPoint: ConnectionPoint, toPoint: ConnectionPoint): DuctFitting {
    const midpoint = new Vector3().addVectors(fromPoint.position, toPoint.position).multiplyScalar(0.5);
    const fittingId = `reducer_${Date.now()}`;
    
    return createEnhancedDuctFitting(
      fittingId,
      'reducer',
      midpoint,
      { ...fromPoint, id: `${fittingId}_inlet` },
      { ...toPoint, id: `${fittingId}_outlet` }
    );
  }

  private generateElbowFitting(fromPoint: ConnectionPoint, toPoint: ConnectionPoint): DuctFitting {
    const midpoint = new Vector3().addVectors(fromPoint.position, toPoint.position).multiplyScalar(0.5);
    const fittingId = `elbow_${Date.now()}`;
    
    return createEnhancedDuctFitting(
      fittingId,
      'elbow',
      midpoint,
      { ...fromPoint, id: `${fittingId}_inlet` },
      { ...toPoint, id: `${fittingId}_outlet` }
    );
  }

  /**
   * Get connection attempt history
   */
  getConnectionHistory(): ConnectionAttempt[] {
    return [...this.connectionAttempts];
  }

  /**
   * Clear connection attempt history
   */
  clearConnectionHistory(): void {
    this.connectionAttempts = [];
  }

  /**
   * Update auto-connection options
   */
  updateAutoConnectionOptions(options: Partial<AutoConnectionOptions>): void {
    this.autoConnectionOptions = { ...this.autoConnectionOptions, ...options };
  }

  /**
   * Get current auto-connection options
   */
  getAutoConnectionOptions(): AutoConnectionOptions {
    return { ...this.autoConnectionOptions };
  }
}
