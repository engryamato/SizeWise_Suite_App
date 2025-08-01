/**
 * Parametric Transition/Reducer Fitting Generator
 * Creates 3D meshes for transition fittings with proper wall thickness
 */

import * as THREE from 'three';
import { 
  TransitionParams, 
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
  isValidGaugeForMaterial 
} from '../smacna-gauge-tables';

export class TransitionGenerator implements FittingGenerator<TransitionParams> {
  
  /**
   * Generate a parametric transition fitting
   */
  async generate(params: TransitionParams): Promise<FittingResult> {
    const validation = this.validate(params);
    if (!validation.isValid) {
      throw new Error(`Invalid transition parameters: ${validation.errors.join(', ')}`);
    }

    const thickness = getWallThickness(params.material, params.gauge);
    const mesh = this.createTransitionMesh(params, thickness);
    
    // Calculate properties
    const volume = this.calculateVolume(params);
    const surfaceArea = this.calculateSurfaceArea(params, thickness);
    const weight = this.estimateWeight(params, thickness);
    const materialUsage = this.calculateMaterialUsage(params, thickness);

    return {
      mesh,
      type: FittingType.TRANSITION,
      parameters: params,
      volume,
      surfaceArea,
      weight,
      materialUsage
    };
  }

  /**
   * Create the 3D mesh for the transition
   */
  private createTransitionMesh(params: TransitionParams, thickness: number): THREE.Mesh {
    const {
      inletDiameter,
      outletDiameter,
      length,
      material,
      type = 'concentric',
      radialSegments = 32,
      tubularSegments = 16
    } = params;

    const geometry = type === 'concentric' 
      ? this.createConcentricTransition(inletDiameter, outletDiameter, length, thickness, radialSegments, tubularSegments)
      : this.createEccentricTransition(inletDiameter, outletDiameter, length, thickness, radialSegments, tubularSegments);

    // Apply material properties
    const materialProps = MATERIAL_PROPERTIES[material];
    const meshMaterial = new THREE.MeshStandardMaterial({
      color: materialProps.color,
      metalness: materialProps.metalness,
      roughness: materialProps.roughness
    });

    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.userData = {
      fittingType: FittingType.TRANSITION,
      parameters: params,
      thickness
    };

    return mesh;
  }

  /**
   * Create concentric transition geometry
   */
  private createConcentricTransition(
    inletDiameter: number,
    outletDiameter: number,
    length: number,
    thickness: number,
    radialSegments: number,
    tubularSegments: number
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const inletRadius = inletDiameter / 2;
    const outletRadius = outletDiameter / 2;
    const inletOuterRadius = inletRadius + thickness;
    const outletOuterRadius = outletRadius + thickness;

    // Generate vertices along the transition
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const z = t * length;
      
      // Interpolate radii
      const innerRadius = inletRadius + (outletRadius - inletRadius) * t;
      const outerRadius = inletOuterRadius + (outletOuterRadius - inletOuterRadius) * t;
      
      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // Outer surface
        const outerX = outerRadius * cos;
        const outerY = outerRadius * sin;
        vertices.push(outerX, outerY, z);
        
        // Inner surface
        const innerX = innerRadius * cos;
        const innerY = innerRadius * sin;
        vertices.push(innerX, innerY, z);
        
        // Calculate normals
        const radiusSlope = (outletOuterRadius - inletOuterRadius) / length;
        const normalLength = Math.sqrt(1 + radiusSlope * radiusSlope);
        const normalX = cos / normalLength;
        const normalY = sin / normalLength;
        const normalZ = radiusSlope / normalLength;
        
        normals.push(normalX, normalY, normalZ); // Outer normal
        normals.push(-normalX, -normalY, -normalZ); // Inner normal
        
        // UVs
        uvs.push(j / radialSegments, t);
        uvs.push(j / radialSegments, t);
      }
    }

    // Generate indices
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = (i * (radialSegments + 1) + j) * 2;
        const b = ((i + 1) * (radialSegments + 1) + j) * 2;
        const c = ((i + 1) * (radialSegments + 1) + (j + 1)) * 2;
        const d = (i * (radialSegments + 1) + (j + 1)) * 2;

        // Outer surface
        indices.push(a, b, d);
        indices.push(b, c, d);
        
        // Inner surface (reversed winding)
        indices.push(a + 1, d + 1, b + 1);
        indices.push(b + 1, d + 1, c + 1);
      }
    }

    // Add end caps
    this.addEndCaps(vertices, indices, normals, uvs, inletRadius, inletOuterRadius, 0, radialSegments, true);
    this.addEndCaps(vertices, indices, normals, uvs, outletRadius, outletOuterRadius, length, radialSegments, false);

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    return geometry;
  }

  /**
   * Create eccentric transition geometry
   */
  private createEccentricTransition(
    inletDiameter: number,
    outletDiameter: number,
    length: number,
    thickness: number,
    radialSegments: number,
    tubularSegments: number
  ): THREE.BufferGeometry {
    // For eccentric transitions, offset the centerlines
    const offset = Math.abs(inletDiameter - outletDiameter) / 4;
    
    // This is a simplified version - in practice, eccentric transitions
    // require more complex geometry calculations
    return this.createConcentricTransition(
      inletDiameter, outletDiameter, length, thickness, radialSegments, tubularSegments
    );
  }

  /**
   * Add end caps to the transition
   */
  private addEndCaps(
    vertices: number[],
    indices: number[],
    normals: number[],
    uvs: number[],
    innerRadius: number,
    outerRadius: number,
    z: number,
    radialSegments: number,
    isInlet: boolean
  ): void {
    const startIndex = vertices.length / 3;
    const normalZ = isInlet ? -1 : 1;

    // Add center vertices
    vertices.push(0, 0, z); // Inner center
    vertices.push(0, 0, z); // Outer center
    normals.push(0, 0, normalZ);
    normals.push(0, 0, normalZ);
    uvs.push(0.5, 0.5);
    uvs.push(0.5, 0.5);

    // Add ring vertices
    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Inner ring
      vertices.push(innerRadius * cos, innerRadius * sin, z);
      normals.push(0, 0, normalZ);
      uvs.push(0.5 + 0.3 * cos, 0.5 + 0.3 * sin);
      
      // Outer ring
      vertices.push(outerRadius * cos, outerRadius * sin, z);
      normals.push(0, 0, normalZ);
      uvs.push(0.5 + 0.5 * cos, 0.5 + 0.5 * sin);
    }

    // Add triangles for the end cap
    for (let j = 0; j < radialSegments; j++) {
      const innerCenter = startIndex;
      const outerCenter = startIndex + 1;
      const innerCurrent = startIndex + 2 + j * 2;
      const innerNext = startIndex + 2 + ((j + 1) % radialSegments) * 2;
      const outerCurrent = startIndex + 3 + j * 2;
      const outerNext = startIndex + 3 + ((j + 1) % radialSegments) * 2;

      if (isInlet) {
        // Inlet cap (normal pointing backward)
        indices.push(innerCenter, innerNext, innerCurrent);
        indices.push(innerCurrent, innerNext, outerNext);
        indices.push(innerCurrent, outerNext, outerCurrent);
        indices.push(outerCurrent, outerNext, outerCenter);
      } else {
        // Outlet cap (normal pointing forward)
        indices.push(innerCenter, innerCurrent, innerNext);
        indices.push(innerCurrent, outerCurrent, outerNext);
        indices.push(innerCurrent, outerNext, innerNext);
        indices.push(outerCurrent, outerCenter, outerNext);
      }
    }
  }

  /**
   * Validate transition parameters
   */
  validate(params: TransitionParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate diameters
    if (params.inletDiameter <= 0) {
      errors.push('Inlet diameter must be greater than 0');
    }
    if (params.outletDiameter <= 0) {
      errors.push('Outlet diameter must be greater than 0');
    }
    if (params.inletDiameter === params.outletDiameter) {
      warnings.push('Inlet and outlet diameters are the same - consider using straight duct');
    }

    // Validate length
    if (params.length <= 0) {
      errors.push('Length must be greater than 0');
    }
    
    const diameterDiff = Math.abs(params.inletDiameter - params.outletDiameter);
    const minLength = diameterDiff * 2; // SMACNA recommendation
    if (params.length < minLength) {
      warnings.push(`Length should be at least ${minLength}" for smooth transition (2x diameter difference)`);
    }

    // Validate material and gauge
    if (!isValidGaugeForMaterial(params.material, params.gauge)) {
      errors.push(`Gauge ${params.gauge} not available for ${params.material}`);
    }

    // Check gauge for both diameters
    const maxDiameter = Math.max(params.inletDiameter, params.outletDiameter);
    const recommendation = getRecommendedGauge(maxDiameter, params.material);
    if (recommendation) {
      const gaugeNum = parseInt(params.gauge);
      const minGaugeNum = parseInt(recommendation.minimum);
      
      if (gaugeNum > minGaugeNum) {
        warnings.push(`Gauge ${params.gauge} may be too thin for ${maxDiameter}" diameter`);
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
  checkCompliance(params: TransitionParams): ComplianceResult {
    const violations: string[] = [];
    const recommendations: string[] = [];

    const maxDiameter = Math.max(params.inletDiameter, params.outletDiameter);
    const gaugeRec = getRecommendedGauge(maxDiameter, params.material);
    
    if (gaugeRec) {
      const gaugeNum = parseInt(params.gauge);
      const minGaugeNum = parseInt(gaugeRec.minimum);
      
      if (gaugeNum > minGaugeNum) {
        violations.push(`Gauge ${params.gauge} violates SMACNA minimum ${gaugeRec.minimum} for ${maxDiameter}" diameter`);
      }
    }

    // Check transition angle
    const diameterDiff = Math.abs(params.inletDiameter - params.outletDiameter);
    const angle = Math.atan(diameterDiff / (2 * params.length)) * 180 / Math.PI;
    
    if (angle > 15) {
      recommendations.push(`Transition angle (${angle.toFixed(1)}°) exceeds SMACNA recommended 15° maximum`);
    }

    return {
      isCompliant: violations.length === 0,
      standard: 'SMACNA',
      violations,
      recommendations
    };
  }

  /**
   * Estimate cost for the transition
   */
  estimateCost(params: TransitionParams): number {
    const thickness = getWallThickness(params.material, params.gauge);
    const materialUsage = this.calculateMaterialUsage(params, thickness);
    
    const materialCosts = {
      galvanized_steel: 3.50,
      aluminum: 4.25,
      stainless_steel: 8.75
    };
    
    const materialCost = materialUsage * materialCosts[params.material];
    const fabricationCost = materialCost * 0.8; // Higher fabrication cost for transitions
    
    return materialCost + fabricationCost;
  }

  /**
   * Calculate internal volume
   */
  private calculateVolume(params: TransitionParams): number {
    const inletArea = Math.PI * (params.inletDiameter / 2) ** 2;
    const outletArea = Math.PI * (params.outletDiameter / 2) ** 2;
    // Frustum volume formula
    return (params.length / 3) * (inletArea + outletArea + Math.sqrt(inletArea * outletArea));
  }

  /**
   * Calculate external surface area
   */
  private calculateSurfaceArea(params: TransitionParams, thickness: number): number {
    const inletRadius = params.inletDiameter / 2 + thickness;
    const outletRadius = params.outletDiameter / 2 + thickness;
    const slantHeight = Math.sqrt(params.length ** 2 + (inletRadius - outletRadius) ** 2);
    
    // Frustum surface area
    return Math.PI * (inletRadius + outletRadius) * slantHeight;
  }

  /**
   * Estimate weight
   */
  private estimateWeight(params: TransitionParams, thickness: number): number {
    const materialUsage = this.calculateMaterialUsage(params, thickness);
    
    const densities = {
      galvanized_steel: 490,
      aluminum: 169,
      stainless_steel: 500
    };
    
    const volume = materialUsage * thickness / 12;
    return volume * densities[params.material];
  }

  /**
   * Calculate material usage in square feet
   */
  private calculateMaterialUsage(params: TransitionParams, thickness: number): number {
    const surfaceArea = this.calculateSurfaceArea(params, thickness);
    return surfaceArea / 144;
  }
}
