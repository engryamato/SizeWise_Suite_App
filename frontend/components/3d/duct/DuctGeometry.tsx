/**
 * Duct Geometry Utilities
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Specialized duct geometry calculations extracted from Canvas3D.tsx
 */

import { Vector3, Euler, Quaternion, BufferGeometry, Float32BufferAttribute, CylinderGeometry, BoxGeometry } from 'three';
import { DuctSegment, DuctShape, TransitionFitting, ElbowFitting } from '../types/Canvas3DTypes';
import { SMACNAStandards } from '../utils/SMACNAStandards';

export class DuctGeometry {
  /**
   * Create geometry for a duct segment
   */
  static createDuctGeometry(segment: DuctSegment): BufferGeometry {
    const length = segment.start.distanceTo(segment.end);
    
    if (segment.shape === 'round') {
      return this.createRoundDuctGeometry(
        segment.diameter || 12,
        length,
        16 // segments
      );
    } else {
      return this.createRectangularDuctGeometry(
        segment.width || 12,
        segment.height || 8,
        length
      );
    }
  }

  /**
   * Create round duct geometry with proper wall thickness
   */
  static createRoundDuctGeometry(
    diameter: number,
    length: number,
    segments: number = 16,
    wallThickness: number = 0.05
  ): BufferGeometry {
    const outerRadius = diameter / 2;
    const innerRadius = outerRadius - wallThickness;
    
    // Create hollow cylinder geometry
    const geometry = new BufferGeometry();
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    
    // Generate vertices for outer and inner cylinders
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Outer cylinder vertices (top and bottom)
      vertices.push(
        outerRadius * cos, outerRadius * sin, length / 2,  // Top outer
        outerRadius * cos, outerRadius * sin, -length / 2, // Bottom outer
        innerRadius * cos, innerRadius * sin, length / 2,  // Top inner
        innerRadius * cos, innerRadius * sin, -length / 2  // Bottom inner
      );
      
      // Normals
      normals.push(
        cos, sin, 0,  // Outer normal
        cos, sin, 0,  // Outer normal
        -cos, -sin, 0, // Inner normal (inverted)
        -cos, -sin, 0  // Inner normal (inverted)
      );
      
      // UVs
      const u = i / segments;
      uvs.push(u, 1, u, 0, u, 1, u, 0);
    }
    
    // Generate indices for the hollow cylinder
    for (let i = 0; i < segments; i++) {
      const base = i * 4;
      const next = ((i + 1) % (segments + 1)) * 4;
      
      // Outer wall
      indices.push(base, base + 1, next);
      indices.push(next, base + 1, next + 1);
      
      // Inner wall
      indices.push(base + 2, next + 2, base + 3);
      indices.push(next + 2, next + 3, base + 3);
      
      // Top ring
      indices.push(base, next, base + 2);
      indices.push(next, next + 2, base + 2);
      
      // Bottom ring
      indices.push(base + 1, base + 3, next + 1);
      indices.push(next + 1, base + 3, next + 3);
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    
    return geometry;
  }

  /**
   * Create rectangular duct geometry with proper wall thickness
   */
  static createRectangularDuctGeometry(
    width: number,
    height: number,
    length: number,
    wallThickness: number = 0.05
  ): BufferGeometry {
    const geometry = new BufferGeometry();
    
    const outerWidth = width;
    const outerHeight = height;
    const innerWidth = width - 2 * wallThickness;
    const innerHeight = height - 2 * wallThickness;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    
    // Define the 8 corners of outer box
    const outerCorners = [
      [-outerWidth/2, -outerHeight/2, -length/2], // 0
      [outerWidth/2, -outerHeight/2, -length/2],  // 1
      [outerWidth/2, outerHeight/2, -length/2],   // 2
      [-outerWidth/2, outerHeight/2, -length/2],  // 3
      [-outerWidth/2, -outerHeight/2, length/2],  // 4
      [outerWidth/2, -outerHeight/2, length/2],   // 5
      [outerWidth/2, outerHeight/2, length/2],    // 6
      [-outerWidth/2, outerHeight/2, length/2]    // 7
    ];
    
    // Define the 8 corners of inner box
    const innerCorners = [
      [-innerWidth/2, -innerHeight/2, -length/2], // 8
      [innerWidth/2, -innerHeight/2, -length/2],  // 9
      [innerWidth/2, innerHeight/2, -length/2],   // 10
      [-innerWidth/2, innerHeight/2, -length/2],  // 11
      [-innerWidth/2, -innerHeight/2, length/2],  // 12
      [innerWidth/2, -innerHeight/2, length/2],   // 13
      [innerWidth/2, innerHeight/2, length/2],    // 14
      [-innerWidth/2, innerHeight/2, length/2]    // 15
    ];
    
    // Add all vertices
    [...outerCorners, ...innerCorners].forEach(corner => {
      vertices.push(...corner);
    });
    
    // Define faces for hollow rectangular duct
    const faces = [
      // Outer faces
      [0, 1, 2, 3], // Bottom outer
      [4, 7, 6, 5], // Top outer
      [0, 4, 5, 1], // Front outer
      [2, 6, 7, 3], // Back outer
      [0, 3, 7, 4], // Left outer
      [1, 5, 6, 2], // Right outer
      
      // Inner faces (reversed winding)
      [8, 11, 10, 9], // Bottom inner
      [12, 13, 14, 15], // Top inner
      [8, 9, 13, 12], // Front inner
      [10, 15, 14, 11], // Back inner
      [8, 12, 15, 11], // Left inner
      [9, 10, 14, 13], // Right inner
      
      // Wall thickness faces
      // Bottom wall
      [0, 8, 9, 1], [1, 9, 10, 2], [2, 10, 11, 3], [3, 11, 8, 0],
      // Top wall
      [4, 5, 13, 12], [5, 6, 14, 13], [6, 7, 15, 14], [7, 4, 12, 15]
    ];
    
    // Convert faces to triangles and add to indices
    faces.forEach(face => {
      if (face.length === 4) {
        // Quad to triangles
        indices.push(face[0], face[1], face[2]);
        indices.push(face[0], face[2], face[3]);
      }
    });
    
    // Calculate normals (simplified)
    const normalArray = new Array(vertices.length).fill(0);
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;
      
      const v1 = new Vector3(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
      const v2 = new Vector3(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);
      const v3 = new Vector3(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
      
      const normal = new Vector3().crossVectors(
        v2.clone().sub(v1),
        v3.clone().sub(v1)
      ).normalize();
      
      normalArray[i1] += normal.x;
      normalArray[i1 + 1] += normal.y;
      normalArray[i1 + 2] += normal.z;
      normalArray[i2] += normal.x;
      normalArray[i2 + 1] += normal.y;
      normalArray[i2 + 2] += normal.z;
      normalArray[i3] += normal.x;
      normalArray[i3 + 1] += normal.y;
      normalArray[i3 + 2] += normal.z;
    }
    
    // Generate UVs (simplified)
    const uvArray: number[] = [];
    for (let i = 0; i < vertices.length / 3; i++) {
      uvArray.push(0, 0); // Simplified UV mapping
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normalArray, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvArray, 2));
    
    return geometry;
  }

  /**
   * Create transition fitting geometry
   */
  static createTransitionGeometry(fitting: TransitionFitting): BufferGeometry {
    const { inlet, outlet, length } = fitting;
    
    // Simplified transition geometry - linear interpolation between inlet and outlet
    const geometry = new BufferGeometry();
    const segments = 16;
    const vertices: number[] = [];
    const indices: number[] = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Interpolate dimensions
      let width1, height1, width2, height2;
      
      if (inlet.shape === 'round') {
        const radius = (inlet.diameter || 12) / 2;
        width1 = height1 = radius;
      } else {
        width1 = (inlet.width || 12) / 2;
        height1 = (inlet.height || 8) / 2;
      }
      
      if (outlet.shape === 'round') {
        const radius = (outlet.diameter || 12) / 2;
        width2 = height2 = radius;
      } else {
        width2 = (outlet.width || 12) / 2;
        height2 = (outlet.height || 8) / 2;
      }
      
      const currentWidth = width1 + (width2 - width1) * t;
      const currentHeight = height1 + (height2 - height1) * t;
      const z = -length / 2 + length * t;
      
      // Create cross-section vertices
      if (fitting.transitionType.includes('round')) {
        // Round cross-section
        for (let j = 0; j < 16; j++) {
          const angle = (j / 16) * Math.PI * 2;
          vertices.push(
            currentWidth * Math.cos(angle),
            currentHeight * Math.sin(angle),
            z
          );
        }
      } else {
        // Rectangular cross-section
        vertices.push(
          -currentWidth, -currentHeight, z,
          currentWidth, -currentHeight, z,
          currentWidth, currentHeight, z,
          -currentWidth, currentHeight, z
        );
      }
    }
    
    // Generate indices for the transition surface
    const pointsPerSection = fitting.transitionType.includes('round') ? 16 : 4;
    
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < pointsPerSection; j++) {
        const current = i * pointsPerSection + j;
        const next = i * pointsPerSection + ((j + 1) % pointsPerSection);
        const currentNext = (i + 1) * pointsPerSection + j;
        const nextNext = (i + 1) * pointsPerSection + ((j + 1) % pointsPerSection);
        
        // Create quad
        indices.push(current, next, nextNext);
        indices.push(current, nextNext, currentNext);
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Create elbow fitting geometry
   */
  static createElbowGeometry(fitting: ElbowFitting): BufferGeometry {
    const { angle, centerlineRadius, elbowType } = fitting;
    const angleRad = (angle * Math.PI) / 180;
    
    const geometry = new BufferGeometry();
    const segments = Math.max(8, Math.floor(angle / 5)); // More segments for larger angles
    const vertices: number[] = [];
    const indices: number[] = [];
    
    if (elbowType === 'round') {
      const radius = (fitting.inlet.diameter || 12) / 2;
      
      // Generate vertices along the elbow curve
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const currentAngle = angleRad * t;
        
        // Center of the duct cross-section
        const centerX = centerlineRadius * Math.sin(currentAngle);
        const centerZ = centerlineRadius * (1 - Math.cos(currentAngle));
        
        // Generate circular cross-section
        for (let j = 0; j < 16; j++) {
          const circleAngle = (j / 16) * Math.PI * 2;
          const localX = radius * Math.cos(circleAngle);
          const localY = radius * Math.sin(circleAngle);
          
          // Transform to elbow coordinate system
          vertices.push(
            centerX + localX * Math.cos(currentAngle),
            localY,
            centerZ - localX * Math.sin(currentAngle)
          );
        }
      }
      
      // Generate indices
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < 16; j++) {
          const current = i * 16 + j;
          const next = i * 16 + ((j + 1) % 16);
          const currentNext = (i + 1) * 16 + j;
          const nextNext = (i + 1) * 16 + ((j + 1) % 16);
          
          indices.push(current, next, nextNext);
          indices.push(current, nextNext, currentNext);
        }
      }
    } else {
      // Rectangular elbow
      const width = (fitting.inlet.width || 12) / 2;
      const height = (fitting.inlet.height || 8) / 2;
      
      // Generate vertices along the elbow curve
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const currentAngle = angleRad * t;
        
        const centerX = centerlineRadius * Math.sin(currentAngle);
        const centerZ = centerlineRadius * (1 - Math.cos(currentAngle));
        
        // Generate rectangular cross-section
        const corners = [
          [-width, -height], [width, -height],
          [width, height], [-width, height]
        ];
        
        corners.forEach(([localX, localY]) => {
          vertices.push(
            centerX + localX * Math.cos(currentAngle),
            localY,
            centerZ - localX * Math.sin(currentAngle)
          );
        });
      }
      
      // Generate indices for rectangular elbow
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < 4; j++) {
          const current = i * 4 + j;
          const next = i * 4 + ((j + 1) % 4);
          const currentNext = (i + 1) * 4 + j;
          const nextNext = (i + 1) * 4 + ((j + 1) % 4);
          
          indices.push(current, next, nextNext);
          indices.push(current, nextNext, currentNext);
        }
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Calculate duct centerline path
   */
  static calculateCenterlinePath(segment: DuctSegment, resolution: number = 10): Vector3[] {
    const path: Vector3[] = [];
    const start = segment.start;
    const end = segment.end;
    
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      const point = start.clone().lerp(end, t);
      path.push(point);
    }
    
    return path;
  }

  /**
   * Calculate duct volume
   */
  static calculateDuctVolume(segment: DuctSegment): number {
    const length = segment.start.distanceTo(segment.end);
    
    if (segment.shape === 'round') {
      const radius = (segment.diameter || 12) / 2;
      return Math.PI * radius * radius * length / 1728; // Convert to cubic feet
    } else {
      const width = segment.width || 12;
      const height = segment.height || 8;
      return (width * height * length) / 1728; // Convert to cubic feet
    }
  }

  /**
   * Calculate duct weight based on material and gauge
   */
  static calculateDuctWeight(segment: DuctSegment, gauge: number = 26): number {
    const surfaceArea = this.calculateSurfaceArea(segment);
    
    // Weight per square foot for different gauges (galvanized steel)
    const weightPerSqFt = {
      30: 0.5, 28: 0.625, 26: 0.75, 24: 0.9375,
      22: 1.25, 20: 1.5, 18: 2.0, 16: 2.5
    };
    
    return surfaceArea * (weightPerSqFt[gauge as keyof typeof weightPerSqFt] || 0.75);
  }

  /**
   * Calculate duct surface area
   */
  static calculateSurfaceArea(segment: DuctSegment): number {
    const length = segment.start.distanceTo(segment.end);
    
    if (segment.shape === 'round') {
      const diameter = segment.diameter || 12;
      return Math.PI * diameter * length / 144; // Convert to square feet
    } else {
      const width = segment.width || 12;
      const height = segment.height || 8;
      const perimeter = 2 * (width + height);
      return perimeter * length / 144; // Convert to square feet
    }
  }

  /**
   * Optimize duct geometry for performance
   */
  static optimizeGeometry(geometry: BufferGeometry, lodLevel: number = 0): BufferGeometry {
    // Reduce geometry complexity based on LOD level
    const reductionFactor = Math.pow(0.5, lodLevel);
    
    if (reductionFactor < 1) {
      // Simplify geometry by reducing vertex count
      // This is a simplified implementation - in practice, you'd use a proper mesh simplification algorithm
      const positions = geometry.getAttribute('position');
      const originalCount = positions.count;
      const targetCount = Math.floor(originalCount * reductionFactor);
      
      if (targetCount < originalCount) {
        // Create simplified geometry with reduced vertex count
        const simplifiedPositions = new Float32Array(targetCount * 3);
        const step = Math.floor(originalCount / targetCount);
        
        for (let i = 0; i < targetCount; i++) {
          const sourceIndex = i * step * 3;
          const targetIndex = i * 3;
          
          if (sourceIndex < positions.array.length - 2) {
            simplifiedPositions[targetIndex] = positions.array[sourceIndex];
            simplifiedPositions[targetIndex + 1] = positions.array[sourceIndex + 1];
            simplifiedPositions[targetIndex + 2] = positions.array[sourceIndex + 2];
          }
        }
        
        const simplifiedGeometry = new BufferGeometry();
        simplifiedGeometry.setAttribute('position', new Float32BufferAttribute(simplifiedPositions, 3));
        simplifiedGeometry.computeVertexNormals();
        
        return simplifiedGeometry;
      }
    }
    
    return geometry;
  }
}
