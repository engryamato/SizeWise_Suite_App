"use client";

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface TransitionGeometryProps {
  inletShape: 'rectangular' | 'round';
  outletShape: 'rectangular' | 'round';
  inletWidth?: number;
  inletHeight?: number;
  inletDiameter?: number;
  outletWidth?: number;
  outletHeight?: number;
  outletDiameter?: number;
  length: number;
  wallThickness?: number;
}

/**
 * Enhanced 3D Geometry Utilities for HVAC Transition Fittings
 * Extracted and enhanced from Canvas3D.tsx GeometryUtils class
 */
class TransitionGeometryUtils {
  /**
   * Create rectangular cross-section points
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
   * Create circular cross-section points
   */
  static createCircularCrossSection(diameter: number, segments: number = 16): THREE.Vector2[] {
    const radius = diameter / 2;
    const points: THREE.Vector2[] = [];
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      points.push(new THREE.Vector2(x, y));
    }
    
    return points;
  }

  /**
   * Interpolate between two cross-sections for lofted geometry
   */
  static interpolateCrossSections(
    section1: THREE.Vector2[],
    section2: THREE.Vector2[],
    t: number
  ): THREE.Vector2[] {
    const result: THREE.Vector2[] = [];
    const maxLength = Math.max(section1.length, section2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const p1 = section1[i % section1.length];
      const p2 = section2[i % section2.length];
      
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      
      result.push(new THREE.Vector2(x, y));
    }
    
    return result;
  }

  /**
   * Create lofted geometry by transitioning between cross-sections
   */
  static createLoftedGeometry(
    startSection: THREE.Vector2[],
    endSection: THREE.Vector2[],
    length: number,
    segments: number = 16
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    
    // Generate vertices along the transition
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = t * length - length / 2; // Center the transition
      
      // Interpolate cross-section at this position
      const currentSection = this.interpolateCrossSections(startSection, endSection, t);
      
      // Add vertices for this cross-section
      for (const point2D of currentSection) {
        vertices.push(point2D.x, point2D.y, z);
        
        // Calculate normal (simplified - pointing outward)
        const normal = new THREE.Vector3(point2D.x, point2D.y, 0).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    
    // Generate indices for faces
    const crossSectionSize = Math.max(startSection.length, endSection.length);
    for (let i = 0; i < segments; i++) {
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
   * Create rectangular to rectangular transition geometry
   */
  static createRectToRectTransitionGeometry(
    inletWidth: number,
    inletHeight: number,
    outletWidth: number,
    outletHeight: number,
    length: number
  ): THREE.BufferGeometry {
    const inletSection = this.createRectangularCrossSection(inletWidth, inletHeight);
    const outletSection = this.createRectangularCrossSection(outletWidth, outletHeight);
    
    return this.createLoftedGeometry(inletSection, outletSection, length);
  }

  /**
   * Create rectangular to round transition geometry
   */
  static createRectToRoundTransitionGeometry(
    inletWidth: number,
    inletHeight: number,
    outletDiameter: number,
    length: number
  ): THREE.BufferGeometry {
    const inletSection = this.createRectangularCrossSection(inletWidth, inletHeight);
    const outletSection = this.createCircularCrossSection(outletDiameter);
    
    return this.createLoftedGeometry(inletSection, outletSection, length);
  }

  /**
   * Create round to rectangular transition geometry
   */
  static createRoundToRectTransitionGeometry(
    inletDiameter: number,
    outletWidth: number,
    outletHeight: number,
    length: number
  ): THREE.BufferGeometry {
    const inletSection = this.createCircularCrossSection(inletDiameter);
    const outletSection = this.createRectangularCrossSection(outletWidth, outletHeight);
    
    return this.createLoftedGeometry(inletSection, outletSection, length);
  }
}

/**
 * TransitionGeometry Component - Renders proper 3D geometry for transition fittings
 * Uses advanced lofted geometry for accurate shape morphing between different duct shapes/sizes
 */
export const TransitionGeometry: React.FC<TransitionGeometryProps> = ({
  inletShape,
  outletShape,
  inletWidth = 12,
  inletHeight = 8,
  inletDiameter = 12,
  outletWidth = 10,
  outletHeight = 6,
  outletDiameter = 10,
  length,
  wallThickness = 0.05 // Default wall thickness in scene units (~0.6 inches)
}) => {
  // Convert dimensions to scene units
  const sceneInletWidth = inletWidth / 12;
  const sceneInletHeight = inletHeight / 12;
  const sceneInletDiameter = inletDiameter / 12;
  const sceneOutletWidth = outletWidth / 12;
  const sceneOutletHeight = outletHeight / 12;
  const sceneOutletDiameter = outletDiameter / 12;
  const sceneLength = length;

  // Create proper transition geometry using TransitionGeometryUtils with wall thickness
  const geometry = useMemo(() => {
    if (inletShape === 'round' && outletShape === 'round') {
      // Round to round transition - use tapered cylinder with adjusted dimensions
      const adjustedInletRadius = Math.max(sceneInletDiameter / 2, wallThickness);
      const adjustedOutletRadius = Math.max(sceneOutletDiameter / 2, wallThickness);
      return new THREE.CylinderGeometry(
        adjustedOutletRadius,
        adjustedInletRadius,
        sceneLength,
        16
      );
    } else if (inletShape === 'rectangular' && outletShape === 'rectangular') {
      // Rectangular to rectangular transition - use proper lofted geometry with adjusted dimensions
      const adjustedInletWidth = Math.max(sceneInletWidth, wallThickness * 2);
      const adjustedInletHeight = Math.max(sceneInletHeight, wallThickness * 2);
      const adjustedOutletWidth = Math.max(sceneOutletWidth, wallThickness * 2);
      const adjustedOutletHeight = Math.max(sceneOutletHeight, wallThickness * 2);
      return TransitionGeometryUtils.createRectToRectTransitionGeometry(
        adjustedInletWidth,
        adjustedInletHeight,
        adjustedOutletWidth,
        adjustedOutletHeight,
        sceneLength
      );
    } else if (inletShape === 'rectangular' && outletShape === 'round') {
      // Rectangular to round transition - use proper lofted geometry with adjusted dimensions
      const adjustedInletWidth = Math.max(sceneInletWidth, wallThickness * 2);
      const adjustedInletHeight = Math.max(sceneInletHeight, wallThickness * 2);
      const adjustedOutletDiameter = Math.max(sceneOutletDiameter, wallThickness * 2);
      return TransitionGeometryUtils.createRectToRoundTransitionGeometry(
        adjustedInletWidth,
        adjustedInletHeight,
        adjustedOutletDiameter,
        sceneLength
      );
    } else {
      // Round to rectangular transition - use proper lofted geometry with adjusted dimensions
      const adjustedInletDiameter = Math.max(sceneInletDiameter, wallThickness * 2);
      const adjustedOutletWidth = Math.max(sceneOutletWidth, wallThickness * 2);
      const adjustedOutletHeight = Math.max(sceneOutletHeight, wallThickness * 2);
      return TransitionGeometryUtils.createRoundToRectTransitionGeometry(
        adjustedInletDiameter,
        adjustedOutletWidth,
        adjustedOutletHeight,
        sceneLength
      );
    }
  }, [
    inletShape,
    outletShape,
    sceneInletWidth,
    sceneInletHeight,
    sceneInletDiameter,
    sceneOutletWidth,
    sceneOutletHeight,
    sceneOutletDiameter,
    sceneLength,
    wallThickness
  ]);

  // Return the geometry as a primitive object
  return <primitive object={geometry} />;
};

export default TransitionGeometry;
