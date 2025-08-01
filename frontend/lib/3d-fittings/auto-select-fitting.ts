/**
 * Auto-Selection System for Duct Fittings
 * Automatically selects and generates the correct fitting based on duct node properties
 */

import * as THREE from 'three';
import { DuctNode } from './duct-node';
import {
  fittingRegistry,
  getFittingGenerator,
  hasFittingGenerator,
  DuctShapeType,
  RoundElbowParams,
  RectangularElbowParams
} from './fitting-registry';
import { FittingType } from './fitting-interfaces';

// Base parameters for all fittings
export interface BaseFittingGenerationParams {
  fittingType: FittingType;
  angle?: number; // for elbows
  bendRadius?: number; // for round elbows
  legLength?: number; // for rectangular elbows
  meshResolution?: number;
}

// Result of fitting generation
export interface FittingGenerationResult {
  mesh: THREE.Object3D;
  fittingType: FittingType;
  shapeType: DuctShapeType;
  parameters: any;
  metadata: {
    generatedAt: Date;
    nodeId: string;
    generatorUsed: string;
  };
}

/**
 * Auto-select and generate an elbow fitting based on the start node
 */
export function autoSelectElbow(
  startNode: DuctNode,
  params: {
    angle?: number;
    bendRadius?: number;
    legLength?: number;
    radialSegments?: number;
    tubularSegments?: number;
    meshResolution?: number;
  } = {}
): FittingGenerationResult {
  const generator = getFittingGenerator(startNode.shapeType, FittingType.ELBOW);
  if (!generator) {
    throw new Error(`No elbow generator available for shape: ${startNode.shapeType}`);
  }

  let mesh: THREE.Object3D;
  let generatedParams: any;

  switch (startNode.shapeType) {
    case 'round':
      if (!startNode.dimensions.diameter) {
        throw new Error('Round duct node missing diameter');
      }
      
      const roundParams: RoundElbowParams = {
        diameter: startNode.dimensions.diameter,
        gauge: startNode.material.gauge,
        material: startNode.material.type,
        bendRadius: params.bendRadius || startNode.dimensions.diameter * 1.5, // Default to 1.5D
        angle: params.angle || 90, // Default to 90°
        radialSegments: params.radialSegments,
        tubularSegments: params.tubularSegments
      };
      
      mesh = generator(roundParams);
      generatedParams = roundParams;
      break;

    case 'rectangular':
      if (!startNode.dimensions.width || !startNode.dimensions.height) {
        throw new Error('Rectangular duct node missing width or height');
      }
      
      const rectParams: RectangularElbowParams = {
        width: startNode.dimensions.width,
        height: startNode.dimensions.height,
        gauge: startNode.material.gauge,
        material: startNode.material.type,
        legLength: params.legLength || Math.max(startNode.dimensions.width, startNode.dimensions.height) * 2, // Default to 2x larger dimension
        meshResolution: params.meshResolution
      };
      
      mesh = generator(rectParams);
      generatedParams = rectParams;
      break;

    default:
      throw new Error(`Unsupported duct shape for elbow: ${startNode.shapeType}`);
  }

  return {
    mesh,
    fittingType: FittingType.ELBOW,
    shapeType: startNode.shapeType,
    parameters: generatedParams,
    metadata: {
      generatedAt: new Date(),
      nodeId: startNode.id,
      generatorUsed: `${startNode.shapeType}_elbow`
    }
  };
}

/**
 * Auto-select and generate any fitting type based on the start node
 */
export function autoSelectFitting(
  startNode: DuctNode,
  params: BaseFittingGenerationParams
): FittingGenerationResult {
  if (!hasFittingGenerator(startNode.shapeType, params.fittingType)) {
    throw new Error(`No ${params.fittingType} generator available for shape: ${startNode.shapeType}`);
  }

  switch (params.fittingType) {
    case FittingType.ELBOW:
      return autoSelectElbow(startNode, params);

    // Future fitting types can be added here
    case FittingType.TRANSITION:
      throw new Error('Transition fitting auto-selection not yet implemented');

    case FittingType.WYE:
      throw new Error('Wye fitting auto-selection not yet implemented');

    case FittingType.TEE:
      throw new Error('Tee fitting auto-selection not yet implemented');

    case FittingType.REDUCER:
      throw new Error('Reducer fitting auto-selection not yet implemented');

    default:
      throw new Error(`Unknown fitting type: ${params.fittingType}`);
  }
}

/**
 * Get recommended fitting parameters based on duct node properties
 */
export function getRecommendedFittingParams(
  startNode: DuctNode,
  fittingType: FittingType
): Partial<BaseFittingGenerationParams> {
  const recommendations: Partial<BaseFittingGenerationParams> = {
    fittingType
  };

  switch (fittingType) {
    case FittingType.ELBOW:
      if (startNode.shapeType === 'round') {
        // For round elbows, recommend bend radius based on diameter and system properties
        const diameter = startNode.dimensions.diameter!;
        const velocity = startNode.systemProperties?.velocity || 1000; // Default 1000 FPM
        
        // Higher velocities need larger bend radii to reduce pressure loss
        if (velocity > 2000) {
          recommendations.bendRadius = diameter * 2.0; // 2D for high velocity
        } else if (velocity > 1500) {
          recommendations.bendRadius = diameter * 1.75; // 1.75D for medium velocity
        } else {
          recommendations.bendRadius = diameter * 1.5; // 1.5D for low velocity
        }
      } else if (startNode.shapeType === 'rectangular') {
        // For rectangular elbows, recommend leg length based on dimensions
        const maxDim = Math.max(startNode.dimensions.width!, startNode.dimensions.height!);
        recommendations.legLength = maxDim * 2; // 2x larger dimension
      }
      
      recommendations.angle = 90; // Default to 90° elbow
      break;

    // Add recommendations for other fitting types as they're implemented
  }

  return recommendations;
}

/**
 * Validate fitting compatibility between two nodes
 */
export function validateFittingCompatibility(
  node1: DuctNode,
  node2: DuctNode,
  fittingType: FittingType
): {
  isCompatible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check basic compatibility
  if (!node1.isCompatibleWith(node2)) {
    issues.push('Nodes have incompatible shapes, materials, or dimensions');
  }

  // Check if fitting generator exists for both nodes
  if (!hasFittingGenerator(node1.shapeType, fittingType)) {
    issues.push(`No ${fittingType} generator available for ${node1.shapeType} ducts`);
  }

  // Fitting-specific validation
  switch (fittingType) {
    case 'elbow':
      // Check system properties for elbow recommendations
      if (node1.systemProperties?.velocity && node1.systemProperties.velocity > 2500) {
        recommendations.push('Consider using a larger bend radius for high velocity applications');
      }
      
      if (node1.systemProperties?.pressure && node1.systemProperties.pressure > 4) {
        recommendations.push('High pressure system - ensure adequate structural support');
      }
      break;
  }

  return {
    isCompatible: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Batch generate multiple fittings for a duct run
 */
export function batchGenerateFittings(
  nodes: DuctNode[],
  fittingConfigs: Array<{
    nodeIndex: number;
    fittingType: FittingType;
    params?: Partial<BaseFittingGenerationParams>;
  }>
): FittingGenerationResult[] {
  const results: FittingGenerationResult[] = [];

  for (const config of fittingConfigs) {
    if (config.nodeIndex >= nodes.length) {
      throw new Error(`Node index ${config.nodeIndex} out of range`);
    }

    const node = nodes[config.nodeIndex];
    const params = {
      fittingType: config.fittingType,
      ...getRecommendedFittingParams(node, config.fittingType),
      ...config.params
    };

    const result = autoSelectFitting(node, params);
    results.push(result);
  }

  return results;
}
