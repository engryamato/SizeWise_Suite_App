/**
 * Parametric 3D Fitting Factory
 * Central factory for generating all types of duct fittings
 */

import { 
  FittingType, 
  FittingParams, 
  FittingResult, 
  ElbowParams,
  TransitionParams,
  WyeParams,
  TeeParams,
  StraightDuctParams,
  CapParams,
  ValidationResult,
  ComplianceResult,
  FittingLibraryConfig,
  MeshGenerationOptions
} from './fitting-interfaces';

import { ElbowGenerator } from './generators/elbow-generator';
import { TransitionGenerator } from './generators/transition-generator';
import { PerformanceOptimizer, OptimizationOptions, PerformanceMetrics } from './performance-optimizer';
// Import other generators as they're created
// import { WyeGenerator } from './generators/wye-generator';
// import { TeeGenerator } from './generators/tee-generator';
// import { StraightDuctGenerator } from './generators/straight-duct-generator';
// import { CapGenerator } from './generators/cap-generator';

export class FittingFactory {
  private config: FittingLibraryConfig;
  private generators: Map<FittingType, any> = new Map();
  private performanceOptimizer: PerformanceOptimizer;

  constructor(config?: Partial<FittingLibraryConfig>) {
    this.config = {
      defaultMaterial: 'galvanized_steel',
      defaultGauge: '26',
      defaultSegments: {
        radial: 32,
        tubular: 64
      },
      meshOptions: {
        highQuality: false,
        optimize: true,
        generateUVs: true,
        mergeVertices: true,
        computeNormals: true
      },
      enableValidation: true,
      enableCompliance: true,
      ...config
    };

    this.performanceOptimizer = PerformanceOptimizer.getInstance();
    this.initializeGenerators();
  }

  /**
   * Initialize all fitting generators
   */
  private initializeGenerators(): void {
    this.generators = new Map();
    
    // Register available generators
    this.generators.set(FittingType.ELBOW, new ElbowGenerator());
    this.generators.set(FittingType.TRANSITION, new TransitionGenerator());
    this.generators.set(FittingType.REDUCER, new TransitionGenerator()); // Reducer uses transition generator
    
    // TODO: Add other generators as they're implemented
    // this.generators.set(FittingType.WYE, new WyeGenerator());
    // this.generators.set(FittingType.TEE, new TeeGenerator());
    // this.generators.set(FittingType.STRAIGHT, new StraightDuctGenerator());
    // this.generators.set(FittingType.CAP, new CapGenerator());
  }

  /**
   * Generate a fitting based on type and parameters
   */
  async generateFitting(
    type: FittingType,
    params: FittingParams,
    optimizationOptions?: OptimizationOptions
  ): Promise<FittingResult & { performanceMetrics?: PerformanceMetrics }> {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`No generator available for fitting type: ${type}`);
    }

    // Apply default values if not specified
    let enhancedParams = this.applyDefaults(params);

    // Apply performance optimizations
    if (optimizationOptions) {
      enhancedParams = this.performanceOptimizer.optimizeMeshGeneration(
        enhancedParams,
        type,
        optimizationOptions
      );
    }

    // Validate if enabled
    if (this.config.enableValidation) {
      const validation = generator.validate(enhancedParams);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const startTime = performance.now();
    const result = await generator.generate(enhancedParams);
    const endTime = performance.now();

    // Calculate performance metrics before optimization
    const performanceMetrics = this.performanceOptimizer.calculateMetrics(
      result.mesh,
      endTime - startTime
    );

    // Apply mesh optimizations if enabled
    if (optimizationOptions && this.config.meshOptions.optimize) {
      const optimizedMesh = this.performanceOptimizer.optimizeMesh(result.mesh, optimizationOptions);

      // Only replace if optimization succeeded and returned a valid mesh
      if (optimizedMesh && optimizedMesh.geometry) {
        result.mesh = optimizedMesh;
      }
    }

    return {
      ...result,
      performanceMetrics
    };
  }

  /**
   * Generate an elbow fitting
   */
  async generateElbow(params: Partial<ElbowParams>): Promise<FittingResult> {
    const fullParams: ElbowParams = {
      material: this.config.defaultMaterial,
      gauge: this.config.defaultGauge,
      radialSegments: this.config.defaultSegments.radial,
      tubularSegments: this.config.defaultSegments.tubular,
      diameter: 12,
      bendRadius: 18,
      angle: 90,
      ...params
    };

    return this.generateFitting(FittingType.ELBOW, fullParams);
  }

  /**
   * Generate a transition fitting
   */
  async generateTransition(params: Partial<TransitionParams>): Promise<FittingResult> {
    const fullParams: TransitionParams = {
      material: this.config.defaultMaterial,
      gauge: this.config.defaultGauge,
      radialSegments: this.config.defaultSegments.radial,
      tubularSegments: this.config.defaultSegments.tubular,
      inletDiameter: 12,
      outletDiameter: 8,
      length: 12,
      type: 'concentric',
      ...params
    };

    return this.generateFitting(FittingType.TRANSITION, fullParams);
  }

  /**
   * Generate a reducer fitting (alias for transition)
   */
  async generateReducer(params: Partial<TransitionParams>): Promise<FittingResult> {
    return this.generateTransition(params);
  }

  /**
   * Validate fitting parameters without generating
   */
  validateFitting(type: FittingType, params: FittingParams): ValidationResult {
    const generator = this.generators.get(type);
    if (!generator) {
      return {
        isValid: false,
        errors: [`No generator available for fitting type: ${type}`],
        warnings: []
      };
    }

    const enhancedParams = this.applyDefaults(params);
    return generator.validate(enhancedParams);
  }

  /**
   * Check SMACNA compliance for fitting
   */
  checkCompliance(type: FittingType, params: FittingParams): ComplianceResult {
    const generator = this.generators.get(type);
    if (!generator) {
      return {
        isCompliant: false,
        standard: 'SMACNA',
        violations: [`No generator available for fitting type: ${type}`],
        recommendations: []
      };
    }

    const enhancedParams = this.applyDefaults(params);
    return generator.checkCompliance(enhancedParams);
  }

  /**
   * Estimate cost for fitting
   */
  estimateCost(type: FittingType, params: FittingParams): number {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`No generator available for fitting type: ${type}`);
    }

    const enhancedParams = this.applyDefaults(params);
    return generator.estimateCost(enhancedParams);
  }

  /**
   * Get available fitting types
   */
  getAvailableFittingTypes(): FittingType[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Apply default values to parameters
   */
  private applyDefaults(params: FittingParams): FittingParams {
    return {
      ...params,
      material: params.material || this.config.defaultMaterial,
      gauge: params.gauge || this.config.defaultGauge,
      radialSegments: params.radialSegments || this.config.defaultSegments.radial,
      tubularSegments: params.tubularSegments || this.config.defaultSegments.tubular
    };
  }

  /**
   * Update factory configuration
   */
  updateConfig(newConfig: Partial<FittingLibraryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): FittingLibraryConfig {
    return { ...this.config };
  }

  /**
   * Generate multiple fittings in batch
   */
  async generateBatch(requests: Array<{
    type: FittingType;
    params: FittingParams;
    id?: string;
  }>): Promise<Array<{
    id?: string;
    result?: FittingResult;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          const result = await this.generateFitting(request.type, request.params);
          return { id: request.id, result };
        } catch (error) {
          return { 
            id: request.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: requests[index].id,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
      }
    });
  }

  /**
   * Generate optimized fitting with performance options
   */
  async generateOptimizedFitting(
    type: FittingType,
    params: FittingParams,
    qualityLevel: 'draft' | 'standard' | 'high' | 'ultra' = 'standard'
  ): Promise<FittingResult & { performanceMetrics: PerformanceMetrics }> {
    const optimizationOptions: OptimizationOptions = {
      qualityLevel,
      enableLOD: qualityLevel !== 'ultra',
      enableGeometryMerging: true,
      memoryBudget: qualityLevel === 'draft' ? 50 : qualityLevel === 'standard' ? 100 : 200
    };

    const result = await this.generateFitting(type, params, optimizationOptions);

    // Ensure performance metrics are always present for optimized fittings
    if (!result.performanceMetrics) {
      throw new Error('Performance metrics not available for optimized fitting generation');
    }

    return result as FittingResult & { performanceMetrics: PerformanceMetrics };
  }

  /**
   * Get performance optimizer instance
   */
  getPerformanceOptimizer(): PerformanceOptimizer {
    return this.performanceOptimizer;
  }

  /**
   * Clear performance caches
   */
  clearPerformanceCaches(): void {
    this.performanceOptimizer.clearCaches();
  }

  /**
   * Get performance cache statistics
   */
  getPerformanceStats(): { geometries: number; materials: number; instances: number } {
    return this.performanceOptimizer.getCacheStats();
  }

  /**
   * Create a fitting library with common configurations
   */
  static createStandardLibrary(): FittingFactory {
    return new FittingFactory({
      defaultMaterial: 'galvanized_steel',
      defaultGauge: '26',
      defaultSegments: {
        radial: 32,
        tubular: 64
      },
      meshOptions: {
        highQuality: true,
        optimize: true,
        generateUVs: true,
        mergeVertices: true,
        computeNormals: true
      },
      enableValidation: true,
      enableCompliance: true
    });
  }

  /**
   * Create a high-performance fitting library
   */
  static createPerformanceLibrary(): FittingFactory {
    return new FittingFactory({
      defaultMaterial: 'galvanized_steel',
      defaultGauge: '26',
      defaultSegments: {
        radial: 16,
        tubular: 32
      },
      meshOptions: {
        highQuality: false,
        optimize: true,
        generateUVs: false,
        mergeVertices: true,
        computeNormals: false
      },
      enableValidation: false,
      enableCompliance: false
    });
  }

  /**
   * Create a high-quality fitting library for visualization
   */
  static createVisualizationLibrary(): FittingFactory {
    return new FittingFactory({
      defaultMaterial: 'galvanized_steel',
      defaultGauge: '26',
      defaultSegments: {
        radial: 64,
        tubular: 128
      },
      meshOptions: {
        highQuality: true,
        optimize: false,
        generateUVs: true,
        mergeVertices: true,
        computeNormals: true
      },
      enableValidation: true,
      enableCompliance: true
    });
  }
}

// Export singleton instance for convenience
export const fittingFactory = FittingFactory.createStandardLibrary();
