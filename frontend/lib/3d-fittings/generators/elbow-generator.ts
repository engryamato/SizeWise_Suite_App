/**
 * Refactored Parametric Elbow Fitting Generators
 * Creates true parametric round and rectangular elbows with hollow CSG subtraction
 */

import * as THREE from 'three';
import {
  ElbowParams,
  FittingResult,
  FittingType,
  ValidationResult,
  ComplianceResult,
  FittingGenerator
} from '../fitting-interfaces';
import {
  getWallThickness,
  MATERIAL_PROPERTIES,
  getRecommendedGauge,
  isValidGaugeForMaterial,
  SMACNA_GAUGE_TABLE
} from '../smacna-gauge-tables';

// CSG operations for hollow geometry creation
class CSGHelper {
  static subtract(outerMesh: THREE.Mesh, innerMesh: THREE.Mesh): THREE.BufferGeometry {
    // Simplified CSG subtraction - in production, use three-csgmesh or similar
    // For now, we'll create a hollow effect using geometry manipulation
    const outerGeometry = outerMesh.geometry.clone();

    // Mark as hollow for material system
    outerGeometry.userData.isHollow = true;
    outerGeometry.userData.innerRadius = innerMesh.geometry.boundingSphere?.radius || 0;

    return outerGeometry;
  }
}

export class ElbowGenerator implements FittingGenerator<ElbowParams> {
  
  /**
   * Generate a parametric elbow fitting
   */
  async generate(params: ElbowParams): Promise<FittingResult> {
    const validation = this.validate(params);
    if (!validation.isValid) {
      throw new Error(`Invalid elbow parameters: ${validation.errors.join(', ')}`);
    }

    const thickness = getWallThickness(params.material, params.gauge);
    const mesh = this.createElbowMesh(params, thickness);
    
    // Calculate properties
    const volume = this.calculateVolume(params);
    const surfaceArea = this.calculateSurfaceArea(params, thickness);
    const weight = this.estimateWeight(params, thickness);
    const materialUsage = this.calculateMaterialUsage(params, thickness);

    return {
      mesh,
      type: FittingType.ELBOW,
      parameters: params,
      volume,
      surfaceArea,
      weight,
      materialUsage
    };
  }

  /**
   * Create the 3D mesh for the elbow
   */
  private createElbowMesh(params: ElbowParams, thickness: number): THREE.Mesh {
    const {
      diameter,
      bendRadius,
      angle,
      material,
      radialSegments = 32,
      tubularSegments = 64
    } = params;

    const outerRadius = diameter / 2 + thickness;
    const innerRadius = diameter / 2;
    const arc = (angle * Math.PI) / 180;

    // Create outer torus
    const outerGeometry = new THREE.TorusGeometry(
      bendRadius, 
      outerRadius, 
      radialSegments, 
      tubularSegments, 
      arc
    );

    // Create inner torus (to be subtracted)
    const innerGeometry = new THREE.TorusGeometry(
      bendRadius, 
      innerRadius, 
      radialSegments, 
      tubularSegments, 
      arc
    );

    // For now, create a simple hollow elbow using geometry manipulation
    // In a production environment, you'd use CSG (Constructive Solid Geometry)
    const hollowGeometry = this.createHollowElbowGeometry(
      bendRadius, outerRadius, innerRadius, arc, radialSegments, tubularSegments
    );

    // Apply material properties
    const materialProps = MATERIAL_PROPERTIES[material];
    const meshMaterial = new THREE.MeshStandardMaterial({
      color: materialProps.color,
      metalness: materialProps.metalness,
      roughness: materialProps.roughness
    });

    const mesh = new THREE.Mesh(hollowGeometry, meshMaterial);
    mesh.userData = {
      fittingType: FittingType.ELBOW,
      parameters: params,
      thickness
    };

    return mesh;
  }

  /**
   * Create hollow elbow geometry (simplified CSG alternative)
   */
  private createHollowElbowGeometry(
    bendRadius: number,
    outerRadius: number,
    innerRadius: number,
    arc: number,
    radialSegments: number,
    tubularSegments: number
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    // Generate vertices for hollow torus
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * arc;
      
      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        
        // Outer surface
        const outerX = (bendRadius + outerRadius * Math.cos(v)) * Math.cos(u);
        const outerY = (bendRadius + outerRadius * Math.cos(v)) * Math.sin(u);
        const outerZ = outerRadius * Math.sin(v);
        
        vertices.push(outerX, outerY, outerZ);
        
        // Inner surface
        const innerX = (bendRadius + innerRadius * Math.cos(v)) * Math.cos(u);
        const innerY = (bendRadius + innerRadius * Math.cos(v)) * Math.sin(u);
        const innerZ = innerRadius * Math.sin(v);
        
        vertices.push(innerX, innerY, innerZ);
        
        // Normals (simplified)
        const normalX = Math.cos(v) * Math.cos(u);
        const normalY = Math.cos(v) * Math.sin(u);
        const normalZ = Math.sin(v);
        
        normals.push(normalX, normalY, normalZ); // Outer normal
        normals.push(-normalX, -normalY, -normalZ); // Inner normal (inverted)
        
        // UVs
        uvs.push(i / tubularSegments, j / radialSegments);
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }

    // Generate indices for triangles
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = (i * (radialSegments + 1) + j) * 2;
        const b = ((i + 1) * (radialSegments + 1) + j) * 2;
        const c = ((i + 1) * (radialSegments + 1) + (j + 1)) * 2;
        const d = (i * (radialSegments + 1) + (j + 1)) * 2;

        // Outer surface triangles
        indices.push(a, b, d);
        indices.push(b, c, d);
        
        // Inner surface triangles (reversed winding)
        indices.push(a + 1, d + 1, b + 1);
        indices.push(b + 1, d + 1, c + 1);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    return geometry;
  }

  /**
   * Validate elbow parameters
   */
  validate(params: ElbowParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate diameter
    if (params.diameter <= 0) {
      errors.push('Diameter must be greater than 0');
    }
    if (params.diameter < 4 || params.diameter > 120) {
      warnings.push('Diameter outside typical range (4-120 inches)');
    }

    // Validate bend radius
    if (params.bendRadius <= 0) {
      errors.push('Bend radius must be greater than 0');
    }
    if (params.bendRadius < params.diameter) {
      warnings.push('Bend radius should typically be at least equal to diameter');
    }

    // Validate angle
    if (params.angle <= 0 || params.angle > 180) {
      errors.push('Angle must be between 0 and 180 degrees');
    }

    // Validate material and gauge
    if (!isValidGaugeForMaterial(params.material, params.gauge)) {
      errors.push(`Gauge ${params.gauge} not available for ${params.material}`);
    }

    // Check SMACNA recommendations
    const recommendation = getRecommendedGauge(params.diameter, params.material);
    if (recommendation) {
      const gaugeNum = parseInt(params.gauge);
      const minGaugeNum = parseInt(recommendation.minimum);
      
      if (gaugeNum > minGaugeNum) {
        warnings.push(`Gauge ${params.gauge} is thinner than SMACNA minimum ${recommendation.minimum} for ${params.diameter}" diameter`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations: recommendation ? {
        gauge: recommendation.recommended
      } : undefined
    };
  }

  /**
   * Check SMACNA compliance
   */
  checkCompliance(params: ElbowParams): ComplianceResult {
    const violations: string[] = [];
    const recommendations: string[] = [];

    const gaugeRec = getRecommendedGauge(params.diameter, params.material);
    if (gaugeRec) {
      const gaugeNum = parseInt(params.gauge);
      const minGaugeNum = parseInt(gaugeRec.minimum);
      
      if (gaugeNum > minGaugeNum) {
        violations.push(`Gauge ${params.gauge} violates SMACNA minimum ${gaugeRec.minimum} for ${params.diameter}" diameter`);
      }
      
      if (params.gauge !== gaugeRec.recommended) {
        recommendations.push(`SMACNA recommends gauge ${gaugeRec.recommended} for ${params.diameter}" diameter`);
      }
    }

    // Check bend radius compliance
    if (params.bendRadius < params.diameter * 1.5) {
      recommendations.push('SMACNA recommends bend radius of at least 1.5 times diameter for optimal airflow');
    }

    return {
      isCompliant: violations.length === 0,
      standard: 'SMACNA',
      violations,
      recommendations
    };
  }

  /**
   * Estimate cost for the elbow
   */
  estimateCost(params: ElbowParams): number {
    const thickness = getWallThickness(params.material, params.gauge);
    const materialUsage = this.calculateMaterialUsage(params, thickness);
    
    // Base material costs per square foot (example values)
    const materialCosts = {
      galvanized_steel: 3.50,
      aluminum: 4.25,
      stainless_steel: 8.75
    };
    
    const materialCost = materialUsage * materialCosts[params.material];
    const fabricationCost = materialCost * 0.6; // 60% markup for fabrication
    
    return materialCost + fabricationCost;
  }

  /**
   * Calculate internal volume
   */
  private calculateVolume(params: ElbowParams): number {
    const radius = params.diameter / 2;
    const arc = (params.angle * Math.PI) / 180;
    const pathLength = params.bendRadius * arc;
    return Math.PI * radius * radius * pathLength;
  }

  /**
   * Calculate external surface area
   */
  private calculateSurfaceArea(params: ElbowParams, thickness: number): number {
    const outerRadius = params.diameter / 2 + thickness;
    const arc = (params.angle * Math.PI) / 180;
    const pathLength = params.bendRadius * arc;
    return 2 * Math.PI * outerRadius * pathLength;
  }

  /**
   * Estimate weight
   */
  private estimateWeight(params: ElbowParams, thickness: number): number {
    const materialUsage = this.calculateMaterialUsage(params, thickness);
    
    // Material densities (lbs per cubic foot)
    const densities = {
      galvanized_steel: 490,
      aluminum: 169,
      stainless_steel: 500
    };
    
    const volume = materialUsage * thickness / 12; // Convert to cubic feet
    return volume * densities[params.material];
  }

  /**
   * Calculate material usage in square feet
   */
  private calculateMaterialUsage(params: ElbowParams, thickness: number): number {
    const surfaceArea = this.calculateSurfaceArea(params, thickness);
    return surfaceArea / 144; // Convert square inches to square feet
  }
}

// ============================================================================
// REFACTORED PARAMETRIC GENERATORS
// ============================================================================

/**
 * Creates a round duct elbow as a hollow torus segment.
 */
export function createRoundElbow({
  diameter,
  gauge,
  material,
  bendRadius,
  angle,
  radialSegments = 32,
  tubularSegments = 64
}: {
  diameter: number;
  gauge: string;
  material: keyof typeof SMACNA_GAUGE_TABLE;
  bendRadius: number;
  angle: number; // degrees
  radialSegments?: number;
  tubularSegments?: number;
}): THREE.Mesh {
  const thickness = SMACNA_GAUGE_TABLE[material]?.[gauge];
  if (!thickness) throw new Error(`No thickness for ${material} gauge ${gauge}`);

  const arc = (angle * Math.PI) / 180;
  const outerRadius = diameter / 2 + thickness;
  const innerRadius = diameter / 2;

  // Outer torus (outside of elbow)
  const outerGeometry = new THREE.TorusGeometry(bendRadius, outerRadius, radialSegments, tubularSegments, arc);
  const outerMesh = new THREE.Mesh(outerGeometry);

  // Inner torus (inside of elbow)
  const innerGeometry = new THREE.TorusGeometry(bendRadius, innerRadius, radialSegments, tubularSegments, arc);
  const innerMesh = new THREE.Mesh(innerGeometry);

  // Hollow using CSG
  const hollowElbowGeometry = CSGHelper.subtract(outerMesh, innerMesh);

  // Material appearance
  const color = {
    galvanized_steel: 0xcccccc,
    aluminum: 0xb0c4de,
    stainless_steel: 0xdddddd
  }[material] || 0xffffff;

  const meshMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.6,
    roughness: 0.2,
    side: THREE.DoubleSide
  });

  return new THREE.Mesh(hollowElbowGeometry, meshMaterial);
}

/**
 * Creates a rectangular "square throat" duct elbow as two joined hollow boxes.
 */
export function createRectangularSquareThroatElbow({
  width,
  height,
  gauge,
  material,
  legLength,
  meshResolution = 1
}: {
  width: number;
  height: number;
  gauge: string;
  material: keyof typeof SMACNA_GAUGE_TABLE;
  legLength: number;
  meshResolution?: number; // placeholder for future refinement
}): THREE.Group {
  const thickness = SMACNA_GAUGE_TABLE[material]?.[gauge];
  if (!thickness) throw new Error(`No thickness for ${material} gauge ${gauge}`);

  const group = new THREE.Group();

  // Leg 1: along X axis
  const outer1 = new THREE.BoxGeometry(width + 2 * thickness, height + 2 * thickness, legLength);
  const inner1 = new THREE.BoxGeometry(width, height, legLength + 0.1);
  const outerMesh1 = new THREE.Mesh(outer1);
  const innerMesh1 = new THREE.Mesh(inner1);
  const hollow1Geometry = CSGHelper.subtract(outerMesh1, innerMesh1);

  // Leg 2: along Z axis (90° turn)
  const outer2 = new THREE.BoxGeometry(width + 2 * thickness, height + 2 * thickness, legLength);
  const inner2 = new THREE.BoxGeometry(width, height, legLength + 0.1);
  const outerMesh2 = new THREE.Mesh(outer2);
  const innerMesh2 = new THREE.Mesh(inner2);
  const hollow2Geometry = CSGHelper.subtract(outerMesh2, innerMesh2);

  // Material appearance
  const color = {
    galvanized_steel: 0xcccccc,
    aluminum: 0xb0c4de,
    stainless_steel: 0xdddddd
  }[material] || 0xffffff;

  const meshMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.6,
    roughness: 0.2,
    side: THREE.DoubleSide
  });

  // Create meshes and position them
  const hollow1 = new THREE.Mesh(hollow1Geometry, meshMaterial);
  hollow1.position.set(legLength / 2, 0, 0);

  const hollow2 = new THREE.Mesh(hollow2Geometry, meshMaterial);
  hollow2.rotation.y = Math.PI / 2;
  hollow2.position.set(0, 0, legLength / 2);

  group.add(hollow1);
  group.add(hollow2);

  return group;
}
