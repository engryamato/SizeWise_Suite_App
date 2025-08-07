"use client";

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ElbowGeometryProps {
  shape: 'rectangular' | 'round';
  width?: number;
  height?: number;
  diameter?: number;
  centerlineRadius: number;
  angle: number;
  throatType?: 'square' | 'radius';
  wallThickness?: number;
}

/**
 * Enhanced 3D Geometry Utilities for HVAC Fittings
 * Extracted from Canvas3D.tsx GeometryUtils class
 */
class GeometryUtils {
  /**
   * Create rectangular cross-section points for lofted geometry
   */
  static createRectangularCrossSection(width: number, height: number): THREE.Vector2[] {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    return [
      new THREE.Vector2(-halfWidth, -halfHeight),
      new THREE.Vector2(halfWidth, -halfHeight),
      new THREE.Vector2(halfWidth, halfHeight),
      new THREE.Vector2(-halfWidth, halfHeight)
    ];
  }

  /**
   * Create lofted geometry by extruding cross-sections along a path
   */
  static createLoftedGeometry(
    pathPoints: THREE.Vector3[],
    crossSectionPoints: THREE.Vector2[]
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    
    // Generate vertices along the path
    for (let i = 0; i < pathPoints.length; i++) {
      const pathPoint = pathPoints[i];
      
      // Calculate local coordinate system at this point
      let tangent: THREE.Vector3;
      if (i === 0) {
        tangent = new THREE.Vector3().subVectors(pathPoints[1], pathPoints[0]).normalize();
      } else if (i === pathPoints.length - 1) {
        tangent = new THREE.Vector3().subVectors(pathPoints[i], pathPoints[i - 1]).normalize();
      } else {
        tangent = new THREE.Vector3().subVectors(pathPoints[i + 1], pathPoints[i - 1]).normalize();
      }
      
      // Create local coordinate system
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const localUp = new THREE.Vector3().crossVectors(right, tangent).normalize();
      
      // Add vertices for this cross-section
      for (const point2D of crossSectionPoints) {
        const localPoint = new THREE.Vector3()
          .addScaledVector(right, point2D.x)
          .addScaledVector(localUp, point2D.y)
          .add(pathPoint);
        
        vertices.push(localPoint.x, localPoint.y, localPoint.z);
        
        // Calculate normal (simplified)
        const normal = new THREE.Vector3().crossVectors(right, localUp).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    
    // Generate indices for faces
    const crossSectionSize = crossSectionPoints.length;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      for (let j = 0; j < crossSectionSize; j++) {
        const current = i * crossSectionSize + j;
        const next = i * crossSectionSize + ((j + 1) % crossSectionSize);
        const currentNext = (i + 1) * crossSectionSize + j;
        const nextNext = (i + 1) * crossSectionSize + ((j + 1) % crossSectionSize);
        
        // Two triangles per quad
        indices.push(current, next, currentNext);
        indices.push(next, nextNext, currentNext);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Create proper rectangular elbow geometry using curved path
   */
  static createRectangularElbowGeometry(
    width: number,
    height: number,
    radius: number,
    angle: number,
    throatType: 'square' | 'radius' = 'radius'
  ): THREE.BufferGeometry {
    const angleRad = (angle * Math.PI) / 180;
    const segments = 32;
    
    // Create curved path points
    const pathPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const currentAngle = t * angleRad;
      const x = Math.cos(currentAngle) * radius;
      const y = Math.sin(currentAngle) * radius;
      pathPoints.push(new THREE.Vector3(x, y, 0));
    }
    
    // Create rectangular cross-section points
    const crossSectionPoints = this.createRectangularCrossSection(width, height);
    
    // Generate geometry using lofted surfaces
    return this.createLoftedGeometry(pathPoints, crossSectionPoints);
  }

  /**
   * Create proper round elbow geometry using torus
   */
  static createRoundElbowGeometry(
    diameter: number,
    radius: number,
    angle: number
  ): THREE.BufferGeometry {
    const angleRad = (angle * Math.PI) / 180;
    return new THREE.TorusGeometry(
      radius,           // radius of the torus
      diameter / 2,     // tube radius
      8,                // radial segments
      16,               // tubular segments
      angleRad          // arc angle
    );
  }
}

/**
 * ElbowGeometry Component - Renders proper 3D geometry for elbow fittings
 * Uses advanced GeometryUtils for accurate curved geometry instead of simple boxes
 */
export const ElbowGeometry: React.FC<ElbowGeometryProps> = ({
  shape,
  width = 12,
  height = 8,
  diameter = 12,
  centerlineRadius,
  angle,
  throatType = 'radius',
  wallThickness = 0.05 // Default wall thickness in scene units (~0.6 inches)
}) => {
  // Convert dimensions to scene units
  const sceneWidth = width / 12;
  const sceneHeight = height / 12;
  const sceneDiameter = diameter / 12;
  const sceneRadius = centerlineRadius / 12;

  // Create proper elbow geometry using GeometryUtils with wall thickness
  const geometry = useMemo(() => {
    if (shape === 'round') {
      // For round elbows, increase the tube radius slightly for better visibility
      const adjustedDiameter = Math.max(sceneDiameter, wallThickness * 2);
      return GeometryUtils.createRoundElbowGeometry(
        adjustedDiameter,
        sceneRadius,
        angle
      );
    } else {
      // For rectangular elbows, ensure minimum thickness for visibility
      const adjustedWidth = Math.max(sceneWidth, wallThickness * 2);
      const adjustedHeight = Math.max(sceneHeight, wallThickness * 2);
      return GeometryUtils.createRectangularElbowGeometry(
        adjustedWidth,
        adjustedHeight,
        sceneRadius,
        angle,
        throatType as 'square' | 'radius'
      );
    }
  }, [shape, sceneWidth, sceneHeight, sceneDiameter, sceneRadius, angle, throatType, wallThickness]);

  // Return the geometry as a primitive object
  return <primitive object={geometry} />;
};

export default ElbowGeometry;
