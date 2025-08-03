/**
 * Connection Point Utilities for System Integration
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Extracted connection point utilities from Canvas3D.tsx
 */

import { Vector3, Euler } from 'three';
import { 
  ConnectionPoint, 
  DuctSegment, 
  Equipment,
  DuctFitting,
  DuctShape 
} from '../types/Canvas3DTypes';

export class ConnectionPointUtils {
  /**
   * Create connection points for a duct segment
   */
  static createDuctConnectionPoints(segment: DuctSegment): { inlet: ConnectionPoint; outlet: ConnectionPoint } {
    const direction = new Vector3().subVectors(segment.end, segment.start).normalize();
    const reverseDirection = direction.clone().negate();

    const inlet: ConnectionPoint = {
      id: `${segment.id}_inlet`,
      position: segment.start.clone(),
      direction: reverseDirection,
      shape: segment.shape,
      width: segment.width,
      height: segment.height,
      diameter: segment.diameter,
      status: 'available',
    };

    const outlet: ConnectionPoint = {
      id: `${segment.id}_outlet`,
      position: segment.end.clone(),
      direction: direction,
      shape: segment.shape,
      width: segment.width,
      height: segment.height,
      diameter: segment.diameter,
      status: 'available',
    };

    return { inlet, outlet };
  }

  /**
   * Create connection points for equipment
   */
  static createEquipmentConnectionPoints(equipment: Equipment): ConnectionPoint[] {
    const connectionPoints: ConnectionPoint[] = [];
    const { position, dimensions, type } = equipment;

    // Define connection point configurations based on equipment type
    const configs = this.getEquipmentConnectionConfig(type);

    configs.forEach((config, index) => {
      const pointPosition = position.clone().add(
        new Vector3(
          config.offset.x * dimensions.width,
          config.offset.y * dimensions.height,
          config.offset.z * dimensions.depth
        )
      );

      const connectionPoint: ConnectionPoint = {
        id: `${equipment.id}_connection_${index}`,
        position: pointPosition,
        direction: config.direction.clone(),
        shape: config.shape,
        width: config.width,
        height: config.height,
        diameter: config.diameter,
        status: 'available',
      };

      connectionPoints.push(connectionPoint);
    });

    return connectionPoints;
  }

  /**
   * Get connection configuration for different equipment types
   */
  private static getEquipmentConnectionConfig(type: Equipment['type']): Array<{
    offset: Vector3;
    direction: Vector3;
    shape: DuctShape;
    width?: number;
    height?: number;
    diameter?: number;
  }> {
    switch (type) {
      case 'Fan':
        return [
          {
            offset: new Vector3(-0.5, 0, 0), // Inlet side
            direction: new Vector3(-1, 0, 0),
            shape: 'round',
            diameter: 12
          },
          {
            offset: new Vector3(0.5, 0, 0), // Outlet side
            direction: new Vector3(1, 0, 0),
            shape: 'round',
            diameter: 12
          }
        ];

      case 'AHU':
        return [
          {
            offset: new Vector3(-0.5, 0, 0.3), // Return air inlet
            direction: new Vector3(-1, 0, 0),
            shape: 'rectangular',
            width: 24,
            height: 18
          },
          {
            offset: new Vector3(0.5, 0, 0.3), // Supply air outlet
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: 20,
            height: 16
          },
          {
            offset: new Vector3(0, 0, -0.5), // Outside air inlet
            direction: new Vector3(0, 0, -1),
            shape: 'rectangular',
            width: 16,
            height: 12
          },
          {
            offset: new Vector3(0, -0.5, 0), // Exhaust air outlet
            direction: new Vector3(0, -1, 0),
            shape: 'rectangular',
            width: 18,
            height: 14
          }
        ];

      case 'VAV Box':
        return [
          {
            offset: new Vector3(-0.5, 0, 0), // Primary air inlet
            direction: new Vector3(-1, 0, 0),
            shape: 'round',
            diameter: 10
          },
          {
            offset: new Vector3(0.5, 0, 0), // Conditioned air outlet
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: 12,
            height: 8
          }
        ];

      case 'Damper':
        return [
          {
            offset: new Vector3(-0.5, 0, 0), // Inlet
            direction: new Vector3(-1, 0, 0),
            shape: 'rectangular',
            width: 12,
            height: 8
          },
          {
            offset: new Vector3(0.5, 0, 0), // Outlet
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: 12,
            height: 8
          }
        ];

      case 'Filter':
        return [
          {
            offset: new Vector3(-0.5, 0, 0), // Dirty air inlet
            direction: new Vector3(-1, 0, 0),
            shape: 'rectangular',
            width: 16,
            height: 12
          },
          {
            offset: new Vector3(0.5, 0, 0), // Clean air outlet
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: 16,
            height: 12
          }
        ];

      case 'Coil':
        return [
          {
            offset: new Vector3(-0.5, 0, 0), // Air inlet
            direction: new Vector3(-1, 0, 0),
            shape: 'rectangular',
            width: 18,
            height: 14
          },
          {
            offset: new Vector3(0.5, 0, 0), // Air outlet
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: 18,
            height: 14
          }
        ];

      default:
        return [
          {
            offset: new Vector3(-0.5, 0, 0),
            direction: new Vector3(-1, 0, 0),
            shape: 'rectangular',
            width: 12,
            height: 8
          },
          {
            offset: new Vector3(0.5, 0, 0),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: 12,
            height: 8
          }
        ];
    }
  }

  /**
   * Create connection points for duct fittings
   */
  static createFittingConnectionPoints(fitting: DuctFitting): { inlet: ConnectionPoint; outlet: ConnectionPoint } {
    const inlet: ConnectionPoint = {
      id: `${fitting.id}_inlet`,
      position: fitting.inlet.position.clone(),
      direction: fitting.inlet.direction.clone(),
      shape: fitting.inlet.shape,
      width: fitting.inlet.width,
      height: fitting.inlet.height,
      diameter: fitting.inlet.diameter,
      status: 'available',
    };

    const outlet: ConnectionPoint = {
      id: `${fitting.id}_outlet`,
      position: fitting.outlet.position.clone(),
      direction: fitting.outlet.direction.clone(),
      shape: fitting.outlet.shape,
      width: fitting.outlet.width,
      height: fitting.outlet.height,
      diameter: fitting.outlet.diameter,
      status: 'available',
    };

    return { inlet, outlet };
  }

  /**
   * Update connection point status
   */
  static updateConnectionStatus(
    point: ConnectionPoint,
    status: 'available' | 'connected' | 'blocked',
    connectedTo?: string
  ): ConnectionPoint {
    return {
      ...point,
      status,
      connectedTo: status === 'connected' ? connectedTo : undefined
    };
  }

  /**
   * Find connection points within a radius
   */
  static findNearbyConnectionPoints(
    targetPoint: ConnectionPoint,
    allPoints: ConnectionPoint[],
    radius: number = 2.0
  ): ConnectionPoint[] {
    return allPoints.filter(point => {
      if (point.id === targetPoint.id) return false;
      const distance = targetPoint.position.distanceTo(point.position);
      return distance <= radius;
    });
  }

  /**
   * Snap connection point to grid
   */
  static snapToGrid(point: ConnectionPoint, gridSize: number = 1.0): ConnectionPoint {
    const snappedPosition = new Vector3(
      Math.round(point.position.x / gridSize) * gridSize,
      Math.round(point.position.y / gridSize) * gridSize,
      Math.round(point.position.z / gridSize) * gridSize
    );

    return {
      ...point,
      position: snappedPosition
    };
  }

  /**
   * Calculate optimal connection point placement
   */
  static calculateOptimalPlacement(
    sourcePoint: ConnectionPoint,
    targetPoint: ConnectionPoint,
    constraints: {
      minDistance?: number;
      maxDistance?: number;
      preferredDirection?: Vector3;
      avoidObstacles?: Vector3[];
    } = {}
  ): Vector3 {
    const {
      minDistance = 0.5,
      maxDistance = 12.0,
      preferredDirection,
      avoidObstacles = []
    } = constraints;

    // Calculate direct path
    const direction = new Vector3().subVectors(targetPoint.position, sourcePoint.position).normalize();
    const distance = sourcePoint.position.distanceTo(targetPoint.position);

    // Clamp distance to constraints
    const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distance));

    // Calculate base position
    let optimalPosition = sourcePoint.position.clone().add(
      direction.multiplyScalar(clampedDistance)
    );

    // Adjust for preferred direction if specified
    if (preferredDirection) {
      const preferredInfluence = 0.3; // 30% influence
      const adjustedDirection = direction.clone()
        .lerp(preferredDirection.normalize(), preferredInfluence)
        .normalize();
      
      optimalPosition = sourcePoint.position.clone().add(
        adjustedDirection.multiplyScalar(clampedDistance)
      );
    }

    // Avoid obstacles
    avoidObstacles.forEach(obstacle => {
      const obstacleDistance = optimalPosition.distanceTo(obstacle);
      const minObstacleDistance = 2.0; // Minimum 2" clearance
      
      if (obstacleDistance < minObstacleDistance) {
        const avoidDirection = new Vector3()
          .subVectors(optimalPosition, obstacle)
          .normalize();
        
        optimalPosition.add(
          avoidDirection.multiplyScalar(minObstacleDistance - obstacleDistance)
        );
      }
    });

    return optimalPosition;
  }

  /**
   * Generate connection path between two points
   */
  static generateConnectionPath(
    startPoint: ConnectionPoint,
    endPoint: ConnectionPoint,
    pathType: 'direct' | 'orthogonal' | 'smooth' = 'orthogonal'
  ): Vector3[] {
    const path: Vector3[] = [startPoint.position.clone()];

    switch (pathType) {
      case 'direct':
        path.push(endPoint.position.clone());
        break;

      case 'orthogonal':
        // Create orthogonal path with intermediate points
        const start = startPoint.position;
        const end = endPoint.position;
        const midX = start.x + (end.x - start.x) * 0.5;
        
        path.push(new Vector3(midX, start.y, start.z));
        path.push(new Vector3(midX, end.y, end.z));
        path.push(end.clone());
        break;

      case 'smooth':
        // Create smooth curved path
        const controlPoint1 = startPoint.position.clone().add(
          startPoint.direction.clone().multiplyScalar(2)
        );
        const controlPoint2 = endPoint.position.clone().add(
          endPoint.direction.clone().multiplyScalar(-2)
        );
        
        // Generate bezier curve points
        for (let t = 0.25; t <= 0.75; t += 0.25) {
          const point = this.calculateBezierPoint(
            startPoint.position,
            controlPoint1,
            controlPoint2,
            endPoint.position,
            t
          );
          path.push(point);
        }
        
        path.push(endPoint.position.clone());
        break;
    }

    return path;
  }

  /**
   * Calculate point on cubic bezier curve
   */
  private static calculateBezierPoint(
    p0: Vector3,
    p1: Vector3,
    p2: Vector3,
    p3: Vector3,
    t: number
  ): Vector3 {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const point = p0.clone().multiplyScalar(uuu);
    point.add(p1.clone().multiplyScalar(3 * uu * t));
    point.add(p2.clone().multiplyScalar(3 * u * tt));
    point.add(p3.clone().multiplyScalar(ttt));

    return point;
  }

  /**
   * Validate connection point geometry
   */
  static validateConnectionGeometry(point: ConnectionPoint): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate dimensions
    if (point.shape === 'round') {
      if (!point.diameter || point.diameter <= 0) {
        errors.push('Round connection point must have valid diameter');
      } else if (point.diameter < 3 || point.diameter > 48) {
        warnings.push(`Diameter ${point.diameter}" is outside typical range (3"-48")`);
      }
    } else if (point.shape === 'rectangular') {
      if (!point.width || !point.height || point.width <= 0 || point.height <= 0) {
        errors.push('Rectangular connection point must have valid width and height');
      } else {
        if (point.width < 4 || point.width > 60) {
          warnings.push(`Width ${point.width}" is outside typical range (4"-60")`);
        }
        if (point.height < 3 || point.height > 48) {
          warnings.push(`Height ${point.height}" is outside typical range (3"-48")`);
        }
      }
    }

    // Validate direction vector
    if (point.direction.length() === 0) {
      errors.push('Connection point direction vector cannot be zero');
    } else if (Math.abs(point.direction.length() - 1) > 0.01) {
      warnings.push('Direction vector should be normalized');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
