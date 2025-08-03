/**
 * Performance Optimizer for 3D Mesh Generation
 * Optimizes mesh generation algorithms for better performance and memory usage
 */

import * as THREE from 'three';
import { FittingParams, FittingResult, FittingType } from './fitting-interfaces';

export interface PerformanceMetrics {
  generationTime: number;
  vertexCount: number;
  triangleCount: number;
  memoryUsage: number;
  optimizationLevel: 'low' | 'medium' | 'high';
}

export interface OptimizationOptions {
  targetVertexCount?: number;
  targetTriangleCount?: number;
  enableLOD?: boolean;
  enableInstancing?: boolean;
  enableGeometryMerging?: boolean;
  qualityLevel?: 'draft' | 'standard' | 'high' | 'ultra';
  memoryBudget?: number; // MB
}

export interface LODLevel {
  distance: number;
  vertexReduction: number;
  qualityLevel: 'draft' | 'standard' | 'high';
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  
  private defaultLODLevels: LODLevel[] = [
    { distance: 0, vertexReduction: 0, qualityLevel: 'high' },
    { distance: 50, vertexReduction: 0.3, qualityLevel: 'standard' },
    { distance: 100, vertexReduction: 0.6, qualityLevel: 'draft' },
    { distance: 200, vertexReduction: 0.8, qualityLevel: 'draft' }
  ];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Optimize mesh generation based on performance requirements
   */
  optimizeMeshGeneration(
    params: FittingParams,
    type: FittingType,
    options: OptimizationOptions = {}
  ): FittingParams {
    const optimizedParams = { ...params };
    
    // Determine quality level based on options
    const qualityLevel = options.qualityLevel || 'standard';
    
    // Adjust segment counts based on quality level
    const segmentMultipliers = this.getSegmentMultipliers(qualityLevel);
    
    if ('radialSegments' in optimizedParams) {
      optimizedParams.radialSegments = Math.max(
        8,
        Math.floor((optimizedParams.radialSegments || 32) * segmentMultipliers.radial)
      );
    }
    
    if ('tubularSegments' in optimizedParams) {
      optimizedParams.tubularSegments = Math.max(
        16,
        Math.floor((optimizedParams.tubularSegments || 64) * segmentMultipliers.tubular)
      );
    }

    // Apply diameter-based optimization
    if ('diameter' in optimizedParams) {
      const diameter = optimizedParams.diameter as number;
      const diameterOptimization = this.getDiameterOptimization(diameter, qualityLevel);
      
      if ('radialSegments' in optimizedParams && optimizedParams.radialSegments !== undefined) {
        optimizedParams.radialSegments = Math.max(
          8,
          Math.floor(optimizedParams.radialSegments * diameterOptimization.segmentMultiplier)
        );
      }
    }

    return optimizedParams;
  }

  /**
   * Optimize generated mesh for performance
   */
  optimizeMesh(
    mesh: THREE.Mesh,
    options: OptimizationOptions = {}
  ): THREE.Mesh {
    const startTime = performance.now();
    
    // Clone the mesh to avoid modifying the original
    const optimizedMesh = mesh.clone();
    const geometry = optimizedMesh.geometry.clone();
    
    // Apply geometry optimizations
    if (options.enableGeometryMerging !== false) {
      this.mergeVertices(geometry);
    }
    
    // Compute normals if needed
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }
    
    // Apply vertex reduction if needed
    if (options.targetVertexCount) {
      this.reduceVertices(geometry, options.targetVertexCount);
    }
    
    // Create LOD if enabled
    if (options.enableLOD) {
      return this.createLODMesh(optimizedMesh, options);
    }
    
    optimizedMesh.geometry = geometry;
    
    const endTime = performance.now();
    console.log(`Mesh optimization completed in ${endTime - startTime}ms`);
    
    return optimizedMesh;
  }

  /**
   * Create Level of Detail (LOD) mesh
   */
  private createLODMesh(mesh: THREE.Mesh, options: OptimizationOptions): THREE.Mesh {
    const lod = new THREE.LOD();
    
    for (const level of this.defaultLODLevels) {
      const lodGeometry = mesh.geometry.clone();
      
      if (level.vertexReduction > 0) {
        const targetVertices = Math.floor(
          lodGeometry.attributes.position.count * (1 - level.vertexReduction)
        );
        this.reduceVertices(lodGeometry, targetVertices);
      }
      
      const lodMesh = new THREE.Mesh(lodGeometry, mesh.material);
      lod.addLevel(lodMesh, level.distance);
    }
    
    return lod as any; // LOD extends Object3D, compatible with Mesh usage
  }

  /**
   * Reduce vertex count in geometry
   */
  private reduceVertices(geometry: THREE.BufferGeometry, targetCount: number): void {
    const currentCount = geometry.attributes.position.count;
    
    if (currentCount <= targetCount) {
      return;
    }
    
    const reductionRatio = targetCount / currentCount;
    
    // Simple vertex reduction - in production, use more sophisticated algorithms
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    const uvs = geometry.attributes.uv?.array;
    
    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newUVs: number[] = [];
    
    for (let i = 0; i < currentCount; i++) {
      if (Math.random() < reductionRatio) {
        newPositions.push(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2]
        );
        
        if (normals) {
          newNormals.push(
            normals[i * 3],
            normals[i * 3 + 1],
            normals[i * 3 + 2]
          );
        }
        
        if (uvs) {
          newUVs.push(uvs[i * 2], uvs[i * 2 + 1]);
        }
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    
    if (newNormals.length > 0) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
    }
    
    if (newUVs.length > 0) {
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2));
    }
  }

  /**
   * Merge duplicate vertices
   */
  private mergeVertices(geometry: THREE.BufferGeometry): void {
    // Use BufferGeometryUtils for vertex merging in newer Three.js versions
    try {
      // Try to use mergeVertices if available
      if (typeof (geometry as any).mergeVertices === 'function') {
        (geometry as any).mergeVertices();
      } else {
        // Fallback: Simple vertex deduplication
        this.deduplicateVertices(geometry);
      }
    } catch (error) {
      console.warn('Vertex merging failed, using fallback method:', error);
      this.deduplicateVertices(geometry);
    }
  }

  /**
   * Fallback method for vertex deduplication
   */
  private deduplicateVertices(geometry: THREE.BufferGeometry): void {
    // Simple vertex deduplication - in production, use BufferGeometryUtils.mergeVertices
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    const uvs = geometry.attributes.uv?.array;

    const vertexMap = new Map<string, number>();
    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newUVs: number[] = [];
    const indexMap: number[] = [];

    for (let i = 0; i < positions.length; i += 3) {
      const key = `${positions[i].toFixed(6)},${positions[i + 1].toFixed(6)},${positions[i + 2].toFixed(6)}`;

      if (!vertexMap.has(key)) {
        const newIndex = newPositions.length / 3;
        vertexMap.set(key, newIndex);

        newPositions.push(positions[i], positions[i + 1], positions[i + 2]);

        if (normals) {
          newNormals.push(normals[i], normals[i + 1], normals[i + 2]);
        }

        if (uvs) {
          const uvIndex = (i / 3) * 2;
          newUVs.push(uvs[uvIndex], uvs[uvIndex + 1]);
        }
      }

      indexMap.push(vertexMap.get(key)!);
    }

    // Update geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));

    if (newNormals.length > 0) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
    }

    if (newUVs.length > 0) {
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2));
    }

    // Set index if we have fewer vertices now
    if (newPositions.length < positions.length) {
      geometry.setIndex(indexMap);
    }
  }

  /**
   * Get segment multipliers based on quality level
   */
  private getSegmentMultipliers(qualityLevel: string): { radial: number; tubular: number } {
    switch (qualityLevel) {
      case 'draft':
        return { radial: 0.5, tubular: 0.5 };
      case 'standard':
        return { radial: 0.75, tubular: 0.75 };
      case 'high':
        return { radial: 1.0, tubular: 1.0 };
      case 'ultra':
        return { radial: 1.5, tubular: 1.5 };
      default:
        return { radial: 0.75, tubular: 0.75 };
    }
  }

  /**
   * Get diameter-based optimization settings
   */
  private getDiameterOptimization(diameter: number, qualityLevel: string): { segmentMultiplier: number } {
    // Smaller diameters need fewer segments, larger diameters need more
    let baseMultiplier = 1.0;
    
    if (diameter < 6) {
      baseMultiplier = 0.6;
    } else if (diameter < 12) {
      baseMultiplier = 0.8;
    } else if (diameter > 36) {
      baseMultiplier = 1.2;
    } else if (diameter > 60) {
      baseMultiplier = 1.4;
    }
    
    // Adjust based on quality level
    const qualityMultipliers = this.getSegmentMultipliers(qualityLevel);
    
    return {
      segmentMultiplier: baseMultiplier * qualityMultipliers.radial
    };
  }

  /**
   * Calculate performance metrics for a mesh
   */
  calculateMetrics(mesh: THREE.Mesh, generationTime: number): PerformanceMetrics {
    if (!mesh || !mesh.geometry) {
      return {
        generationTime,
        vertexCount: 0,
        triangleCount: 0,
        memoryUsage: 0,
        optimizationLevel: 'low'
      };
    }

    const geometry = mesh.geometry;
    const vertexCount = geometry.attributes?.position?.count || 0;
    const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = this.estimateMemoryUsage(geometry);
    
    // Determine optimization level based on metrics
    let optimizationLevel: 'low' | 'medium' | 'high' = 'medium';
    
    if (vertexCount < 1000 && generationTime < 100) {
      optimizationLevel = 'high';
    } else if (vertexCount > 10000 || generationTime > 1000) {
      optimizationLevel = 'low';
    }
    
    return {
      generationTime,
      vertexCount,
      triangleCount,
      memoryUsage,
      optimizationLevel
    };
  }

  /**
   * Estimate memory usage of geometry
   */
  private estimateMemoryUsage(geometry: THREE.BufferGeometry): number {
    let memoryBytes = 0;
    
    // Position attribute (3 floats per vertex)
    memoryBytes += geometry.attributes.position.count * 3 * 4;
    
    // Normal attribute (3 floats per vertex)
    if (geometry.attributes.normal) {
      memoryBytes += geometry.attributes.normal.count * 3 * 4;
    }
    
    // UV attribute (2 floats per vertex)
    if (geometry.attributes.uv) {
      memoryBytes += geometry.attributes.uv.count * 2 * 4;
    }
    
    // Index buffer (if present)
    if (geometry.index) {
      memoryBytes += geometry.index.count * 4; // Assuming 32-bit indices
    }
    
    return memoryBytes / (1024 * 1024); // Convert to MB
  }

  /**
   * Clear caches to free memory
   */
  clearCaches(): void {
    this.geometryCache.clear();
    this.materialCache.clear();
    this.instancedMeshes.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { geometries: number; materials: number; instances: number } {
    return {
      geometries: this.geometryCache.size,
      materials: this.materialCache.size,
      instances: this.instancedMeshes.size
    };
  }
}
