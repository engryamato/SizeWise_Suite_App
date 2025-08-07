/**
 * Snap Point Generator
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Generates snap points for various HVAC elements including rooms, segments,
 * equipment, and centerlines according to the snap logic specifications.
 */

import { 
  SnapPoint, 
  SnapPointType,
  Room,
  Segment,
  Equipment,
  Centerline,
  CenterlinePoint
} from '@/types/air-duct-sizer';

/**
 * Utility class for generating snap points from HVAC elements
 */
export class SnapPointGenerator {
  
  /**
   * Generate snap points for a room element
   */
  static generateRoomSnapPoints(room: Room): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (!room.x || !room.y || !room.dimensions) {
      return snapPoints;
    }

    const { x, y, dimensions } = room;
    const { length, width } = dimensions;

    // Corner endpoints (highest priority)
    const corners = [
      { x, y }, // Top-left
      { x: x + length, y }, // Top-right
      { x: x + length, y: y + width }, // Bottom-right
      { x, y: y + width } // Bottom-left
    ];

    corners.forEach((corner, index) => {
      snapPoints.push({
        id: `${room.room_id}_corner_${index}`,
        type: 'endpoint',
        position: corner,
        priority: 1,
        elementId: room.room_id,
        elementType: 'room',
        metadata: {
          isStart: index === 0,
          isEnd: index === corners.length - 1
        }
      });
    });

    // Midpoints on each side
    const midpoints = [
      { x: x + length / 2, y }, // Top side
      { x: x + length, y: y + width / 2 }, // Right side
      { x: x + length / 2, y: y + width }, // Bottom side
      { x, y: y + width / 2 } // Left side
    ];

    midpoints.forEach((midpoint, index) => {
      snapPoints.push({
        id: `${room.room_id}_midpoint_${index}`,
        type: 'midpoint',
        position: midpoint,
        priority: 3,
        elementId: room.room_id,
        elementType: 'room'
      });
    });

    // Center point
    snapPoints.push({
      id: `${room.room_id}_center`,
      type: 'centerline',
      position: { x: x + length / 2, y: y + width / 2 },
      priority: 2,
      elementId: room.room_id,
      elementType: 'room'
    });

    return snapPoints;
  }

  /**
   * Generate snap points for a duct segment
   */
  static generateSegmentSnapPoints(segment: Segment): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (!segment.points || segment.points.length < 4) {
      return snapPoints;
    }

    const [x1, y1, x2, y2] = segment.points;

    // Endpoints
    snapPoints.push({
      id: `${segment.segment_id}_start`,
      type: 'endpoint',
      position: { x: x1, y: y1 },
      priority: 1,
      elementId: segment.segment_id,
      elementType: 'segment',
      metadata: {
        isStart: true
      }
    });

    snapPoints.push({
      id: `${segment.segment_id}_end`,
      type: 'endpoint',
      position: { x: x2, y: y2 },
      priority: 1,
      elementId: segment.segment_id,
      elementType: 'segment',
      metadata: {
        isEnd: true
      }
    });

    // Midpoint
    snapPoints.push({
      id: `${segment.segment_id}_midpoint`,
      type: 'midpoint',
      position: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
      priority: 3,
      elementId: segment.segment_id,
      elementType: 'segment'
    });

    // Centerline points along the segment (for longer segments)
    const segmentLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    if (segmentLength > 100) { // Only for segments longer than 100 pixels
      const numCenterlinePoints = Math.floor(segmentLength / 50); // Every 50 pixels
      
      for (let i = 1; i < numCenterlinePoints; i++) {
        const t = i / numCenterlinePoints;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        
        snapPoints.push({
          id: `${segment.segment_id}_centerline_${i}`,
          type: 'centerline',
          position: { x, y },
          priority: 2,
          elementId: segment.segment_id,
          elementType: 'segment',
          metadata: {
            segmentIndex: i
          }
        });
      }
    }

    return snapPoints;
  }

  /**
   * Generate snap points for equipment
   */
  static generateEquipmentSnapPoints(equipment: Equipment): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (!equipment.position?.x || !equipment.position?.y || !equipment.dimensions) {
      return snapPoints;
    }

    const { position, dimensions } = equipment;
    const { x, y } = position;
    const { depth: length, width } = dimensions;

    // Equipment connection points (endpoints)
    const connectionPoints = [
      { x: x + length / 2, y }, // Top center
      { x: x + length, y: y + width / 2 }, // Right center
      { x: x + length / 2, y: y + width }, // Bottom center
      { x, y: y + width / 2 } // Left center
    ];

    connectionPoints.forEach((point, index) => {
      snapPoints.push({
        id: `${equipment.id}_connection_${index}`,
        type: 'endpoint',
        position: point,
        priority: 1,
        elementId: equipment.id,
        elementType: 'equipment'
      });
    });

    return snapPoints;
  }

  /**
   * Generate snap points for a centerline
   */
  static generateCenterlineSnapPoints(centerline: Centerline): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (!centerline.points || centerline.points.length === 0) {
      return snapPoints;
    }

    // Endpoints
    const firstPoint = centerline.points[0];
    const lastPoint = centerline.points[centerline.points.length - 1];

    snapPoints.push({
      id: `${centerline.id}_start`,
      type: 'endpoint',
      position: { x: firstPoint.x, y: firstPoint.y },
      priority: 1,
      elementId: centerline.id,
      elementType: 'centerline',
      metadata: {
        isStart: true
      }
    });

    if (centerline.points.length > 1) {
      snapPoints.push({
        id: `${centerline.id}_end`,
        type: 'endpoint',
        position: { x: lastPoint.x, y: lastPoint.y },
        priority: 1,
        elementId: centerline.id,
        elementType: 'centerline',
        metadata: {
          isEnd: true
        }
      });
    }

    // All centerline points
    centerline.points.forEach((point, index) => {
      if (index > 0 && index < centerline.points.length - 1) { // Skip endpoints
        snapPoints.push({
          id: `${centerline.id}_point_${index}`,
          type: 'centerline',
          position: { x: point.x, y: point.y },
          priority: 2,
          elementId: centerline.id,
          elementType: 'centerline',
          metadata: {
            segmentIndex: index
          }
        });
      }
    });

    // Midpoints between consecutive points
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const point1 = centerline.points[i];
      const point2 = centerline.points[i + 1];
      
      snapPoints.push({
        id: `${centerline.id}_midpoint_${i}`,
        type: 'midpoint',
        position: {
          x: (point1.x + point2.x) / 2,
          y: (point1.y + point2.y) / 2
        },
        priority: 3,
        elementId: centerline.id,
        elementType: 'centerline',
        metadata: {
          segmentIndex: i
        }
      });
    }

    return snapPoints;
  }

  /**
   * Find intersection points between two line segments
   */
  static findLineIntersection(
    line1: { start: { x: number; y: number }, end: { x: number; y: number } },
    line2: { start: { x: number; y: number }, end: { x: number; y: number } }
  ): { x: number; y: number } | null {
    const { start: p1, end: p2 } = line1;
    const { start: p3, end: p4 } = line2;

    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    
    if (Math.abs(denom) < 1e-10) {
      return null; // Lines are parallel
    }

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
    }

    return null; // No intersection within line segments
  }

  /**
   * Generate intersection snap points between multiple elements
   */
  static generateIntersectionSnapPoints(
    segments: Segment[],
    centerlines: Centerline[]
  ): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    const intersectionId = (id1: string, id2: string) => `intersection_${id1}_${id2}`;

    // Segment-to-segment intersections
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i];
        const seg2 = segments[j];
        
        if (seg1.points && seg1.points.length >= 4 && seg2.points && seg2.points.length >= 4) {
          const line1 = {
            start: { x: seg1.points[0], y: seg1.points[1] },
            end: { x: seg1.points[2], y: seg1.points[3] }
          };
          const line2 = {
            start: { x: seg2.points[0], y: seg2.points[1] },
            end: { x: seg2.points[2], y: seg2.points[3] }
          };

          const intersection = this.findLineIntersection(line1, line2);
          if (intersection) {
            snapPoints.push({
              id: intersectionId(seg1.segment_id, seg2.segment_id),
              type: 'intersection',
              position: intersection,
              priority: 4,
              elementId: `${seg1.segment_id}_${seg2.segment_id}`,
              elementType: 'segment',
              metadata: {
                intersectionElements: [seg1.segment_id, seg2.segment_id]
              }
            });
          }
        }
      }
    }

    // Centerline-to-centerline intersections
    for (let i = 0; i < centerlines.length; i++) {
      for (let j = i + 1; j < centerlines.length; j++) {
        const cl1 = centerlines[i];
        const cl2 = centerlines[j];
        
        // Check intersections between all segments of both centerlines
        for (let k = 0; k < cl1.points.length - 1; k++) {
          for (let l = 0; l < cl2.points.length - 1; l++) {
            const line1 = {
              start: cl1.points[k],
              end: cl1.points[k + 1]
            };
            const line2 = {
              start: cl2.points[l],
              end: cl2.points[l + 1]
            };

            const intersection = this.findLineIntersection(line1, line2);
            if (intersection) {
              snapPoints.push({
                id: intersectionId(`${cl1.id}_${k}`, `${cl2.id}_${l}`),
                type: 'intersection',
                position: intersection,
                priority: 4,
                elementId: `${cl1.id}_${cl2.id}`,
                elementType: 'centerline',
                metadata: {
                  intersectionElements: [cl1.id, cl2.id]
                }
              });
            }
          }
        }
      }
    }

    return snapPoints;
  }
}
