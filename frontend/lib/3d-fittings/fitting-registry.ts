/**
 * Central Fitting Registry
 * Maps duct shape and fitting type to the correct generator function
 */

import * as THREE from 'three';
import { createRoundElbow, createRectangularSquareThroatElbow } from './generators/elbow-generator';
import { FittingType, BaseFittingParams } from './fitting-interfaces';
import { GaugeType, MaterialType } from './smacna-gauge-tables';
// Import future fittings as needed

export type DuctShapeType = 'round' | 'rectangular' | 'oval';

// Round fitting parameters
export interface RoundFittingParams extends BaseFittingParams {
  diameter: number;
}

// Rectangular fitting parameters
export interface RectangularFittingParams extends BaseFittingParams {
  width: number;
  height: number;
}

// Elbow-specific parameters
export interface RoundElbowParams extends RoundFittingParams {
  bendRadius: number;
  angle: number;
  radialSegments?: number;
  tubularSegments?: number;
}

export interface RectangularElbowParams extends RectangularFittingParams {
  legLength: number;
  meshResolution?: number;
}

// Generator function types
export type RoundElbowGenerator = (params: RoundElbowParams) => THREE.Mesh;
export type RectangularElbowGenerator = (params: RectangularElbowParams) => THREE.Group;

// The fitting registry maps shape+fitting to the right generator
export const fittingRegistry: {
  [shape in DuctShapeType]?: {
    [fitting in FittingType]?: Function
  }
} = {
  round: {
    [FittingType.ELBOW]: createRoundElbow,
    // Add round->transition, round->wye etc as needed
  },
  rectangular: {
    [FittingType.ELBOW]: createRectangularSquareThroatElbow,
    // Add rectangular->transition, rectangular->wye etc as needed
  },
  // oval: {...} - future implementation
};

/**
 * Get available fitting types for a given duct shape
 */
export function getAvailableFittings(shapeType: DuctShapeType): FittingType[] {
  const shapeRegistry = fittingRegistry[shapeType];
  if (!shapeRegistry) return [];
  
  return Object.keys(shapeRegistry) as FittingType[];
}

/**
 * Check if a fitting generator exists for the given shape and fitting type
 */
export function hasFittingGenerator(shapeType: DuctShapeType, fittingType: FittingType): boolean {
  return !!(fittingRegistry[shapeType]?.[fittingType]);
}

/**
 * Get the generator function for a specific shape and fitting type
 */
export function getFittingGenerator(shapeType: DuctShapeType, fittingType: FittingType): Function | null {
  return fittingRegistry[shapeType]?.[fittingType] || null;
}

/**
 * Register a new fitting generator
 */
export function registerFittingGenerator(
  shapeType: DuctShapeType, 
  fittingType: FittingType, 
  generator: Function
): void {
  if (!fittingRegistry[shapeType]) {
    fittingRegistry[shapeType] = {};
  }
  fittingRegistry[shapeType]![fittingType] = generator;
}

/**
 * Get all registered shape types
 */
export function getRegisteredShapes(): DuctShapeType[] {
  return Object.keys(fittingRegistry) as DuctShapeType[];
}

/**
 * Get registry statistics
 */
export function getRegistryStats(): {
  totalShapes: number;
  totalFittings: number;
  shapeBreakdown: Record<DuctShapeType, number>;
} {
  const shapes = getRegisteredShapes();
  const shapeBreakdown: Record<DuctShapeType, number> = {} as any;
  let totalFittings = 0;

  shapes.forEach(shape => {
    const fittings = getAvailableFittings(shape);
    shapeBreakdown[shape] = fittings.length;
    totalFittings += fittings.length;
  });

  return {
    totalShapes: shapes.length,
    totalFittings,
    shapeBreakdown
  };
}
