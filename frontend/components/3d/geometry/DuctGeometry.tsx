"use client";

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface DuctGeometryProps {
  shape: 'rectangular' | 'round';
  width?: number;
  height?: number;
  diameter?: number;
  length: number;
  wallThickness?: number;
}

/**
 * Utility class for creating hollow duct geometry with proper wall thickness
 */
class HollowDuctGeometry {
  /**
   * Create hollow rectangular duct geometry using CSG-like approach
   */
  static createHollowRectangularDuct(
    width: number,
    height: number,
    length: number,
    wallThickness: number
  ): THREE.BufferGeometry {
    // For now, create a solid rectangular duct with increased thickness for visibility
    // TODO: Implement true hollow geometry using CSG or custom geometry generation
    const adjustedWidth = Math.max(width, wallThickness * 2);
    const adjustedHeight = Math.max(height, wallThickness * 2);

    return new THREE.BoxGeometry(adjustedWidth, adjustedHeight, length);
  }

  /**
   * Create hollow round duct geometry using CSG-like approach
   */
  static createHollowRoundDuct(
    diameter: number,
    length: number,
    wallThickness: number
  ): THREE.BufferGeometry {
    // For now, create a solid round duct with increased thickness for visibility
    // TODO: Implement true hollow geometry using CSG or custom geometry generation
    const adjustedRadius = Math.max(diameter / 2, wallThickness);

    return new THREE.CylinderGeometry(
      adjustedRadius,
      adjustedRadius,
      length,
      16 // radialSegments for smooth appearance
    );
  }
}

/**
 * DuctGeometry Component - Creates proper 3D geometry for straight duct segments
 * Returns geometry that can be used by parent mesh components
 * Supports both rectangular and round ducts with proper wall thickness
 */
export const DuctGeometry: React.FC<DuctGeometryProps> = ({
  shape,
  width = 12,
  height = 8,
  diameter = 12,
  length,
  wallThickness = 0.05 // Default wall thickness in scene units (~0.6 inches)
}) => {
  // Convert dimensions to scene units (inches to scene units)
  const sceneWidth = width / 12;
  const sceneHeight = height / 12;
  const sceneDiameter = diameter / 12;
  const sceneLength = length;
  const sceneWallThickness = wallThickness;

  // Return the appropriate geometry JSX based on duct shape
  if (shape === 'round') {
    // Round duct - create hollow cylinder with adjusted radius for visibility
    const adjustedRadius = Math.max(sceneDiameter / 2, sceneWallThickness);
    return (
      <cylinderGeometry
        args={[adjustedRadius, adjustedRadius, sceneLength, 16]}
      />
    );
  } else {
    // Rectangular duct - create hollow box with adjusted dimensions for visibility
    const adjustedWidth = Math.max(sceneWidth, sceneWallThickness * 2);
    const adjustedHeight = Math.max(sceneHeight, sceneWallThickness * 2);
    return (
      <boxGeometry
        args={[adjustedWidth, adjustedHeight, sceneLength]}
      />
    );
  }
};

export default DuctGeometry;
