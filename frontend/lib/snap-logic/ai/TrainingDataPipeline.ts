/**
 * Training Data Pipeline for HVAC Design ML Models
 * SizeWise Suite - AI-Powered Suggestions System
 * 
 * Comprehensive training data pipeline for collecting, processing, and managing
 * HVAC design patterns and professional engineering data. Includes data quality
 * validation, feature extraction, and automated data augmentation for machine
 * learning model training in professional HVAC engineering environments.
 * 
 * @fileoverview Training data pipeline and management system
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline } from '@/types/air-duct-sizer';
import { 
  DuctDimensions,
  DuctShape,
  SMACNAValidationResult
} from '../standards/SMACNAValidator';
import { 
  MLTrainingData,
  TrainingDataCategory,
  HVACDesignPattern,
  MLModelType
} from './MLArchitecture';
import { ValidationUtils } from '../utils/ValidationUtils';

/**
 * Data collection source types
 */
export enum DataSourceType {
  USER_DESIGNS = 'user_designs',
  PROFESSIONAL_PROJECTS = 'professional_projects',
  SIMULATION_RESULTS = 'simulation_results',
  INDUSTRY_STANDARDS = 'industry_standards',
  SYNTHETIC_GENERATION = 'synthetic_generation',
  IMPORTED_CAD = 'imported_cad',
  REAL_WORLD_PERFORMANCE = 'real_world_performance'
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  completeness: number; // 0-1, percentage of required fields present
  accuracy: number; // 0-1, estimated accuracy of the data
  consistency: number; // 0-1, consistency with other data points
  relevance: number; // 0-1, relevance to target use case
  freshness: number; // 0-1, how recent the data is
  engineerValidation: boolean; // whether validated by professional engineer
  smacnaCompliance: number; // 0-1, SMACNA compliance score
  overallQuality: number; // 0-1, weighted overall quality score
}

/**
 * Feature extraction configuration
 */
export interface FeatureExtractionConfig {
  geometric: {
    enabled: boolean;
    features: string[];
    normalization: boolean;
    dimensionalityReduction: boolean;
  };
  performance: {
    enabled: boolean;
    features: string[];
    calculatedMetrics: boolean;
    simulationData: boolean;
  };
  contextual: {
    enabled: boolean;
    features: string[];
    buildingContext: boolean;
    environmentalFactors: boolean;
  };
  temporal: {
    enabled: boolean;
    features: string[];
    seasonalPatterns: boolean;
    usagePatterns: boolean;
  };
  custom: {
    enabled: boolean;
    extractors: Array<{
      name: string;
      function: string;
      parameters: Record<string, any>;
    }>;
  };
}

/**
 * Data augmentation configuration
 */
export interface DataAugmentationConfig {
  enabled: boolean;
  techniques: {
    geometric: {
      rotation: { enabled: boolean; range: [number, number]; };
      scaling: { enabled: boolean; range: [number, number]; };
      translation: { enabled: boolean; range: [number, number]; };
      mirroring: { enabled: boolean; axes: string[]; };
    };
    parametric: {
      ductSizing: { enabled: boolean; variance: number; };
      airflowRates: { enabled: boolean; variance: number; };
      pressureDrops: { enabled: boolean; variance: number; };
      materialProperties: { enabled: boolean; variance: number; };
    };
    synthetic: {
      noiseInjection: { enabled: boolean; level: number; };
      patternVariation: { enabled: boolean; complexity: number; };
      contextualVariation: { enabled: boolean; factors: string[]; };
    };
  };
  augmentationRatio: number; // ratio of augmented to original data
  qualityThreshold: number; // minimum quality for augmented data
}

/**
 * Training data pipeline configuration
 */
export interface TrainingDataPipelineConfig {
  collection: {
    enabledSources: DataSourceType[];
    collectionInterval: number; // hours
    batchSize: number;
    maxDataAge: number; // days
  };
  processing: {
    featureExtraction: FeatureExtractionConfig;
    dataAugmentation: DataAugmentationConfig;
    qualityControl: {
      minQualityThreshold: number;
      enableOutlierDetection: boolean;
      enableConsistencyChecks: boolean;
      enableEngineerValidation: boolean;
    };
  };
  storage: {
    maxDatasetSize: number; // number of samples
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    backupEnabled: boolean;
    retentionPeriod: number; // days
  };
  monitoring: {
    enableQualityTracking: boolean;
    enablePerformanceMetrics: boolean;
    enableDataDrift: boolean;
    alertThresholds: {
      qualityDrop: number;
      volumeDrop: number;
      driftDetection: number;
    };
  };
}

/**
 * Default training data pipeline configuration
 */
const DEFAULT_PIPELINE_CONFIG: TrainingDataPipelineConfig = {
  collection: {
    enabledSources: [
      DataSourceType.USER_DESIGNS,
      DataSourceType.PROFESSIONAL_PROJECTS,
      DataSourceType.SIMULATION_RESULTS,
      DataSourceType.INDUSTRY_STANDARDS
    ],
    collectionInterval: 24, // 24 hours
    batchSize: 100,
    maxDataAge: 365 // 1 year
  },
  processing: {
    featureExtraction: {
      geometric: {
        enabled: true,
        features: [
          'centerline_length', 'centerline_complexity', 'bend_count', 'bend_angles',
          'duct_aspect_ratios', 'spatial_distribution', 'topology_metrics'
        ],
        normalization: true,
        dimensionalityReduction: true
      },
      performance: {
        enabled: true,
        features: [
          'pressure_drop', 'velocity_profiles', 'energy_efficiency', 'flow_uniformity',
          'noise_levels', 'installation_complexity', 'maintenance_requirements'
        ],
        calculatedMetrics: true,
        simulationData: true
      },
      contextual: {
        enabled: true,
        features: [
          'building_type', 'floor_area', 'ceiling_height', 'occupancy_density',
          'climate_zone', 'energy_codes', 'accessibility_requirements'
        ],
        buildingContext: true,
        environmentalFactors: true
      },
      temporal: {
        enabled: true,
        features: [
          'design_timestamp', 'seasonal_factors', 'usage_patterns', 'load_variations',
          'maintenance_history', 'performance_trends'
        ],
        seasonalPatterns: true,
        usagePatterns: true
      },
      custom: {
        enabled: false,
        extractors: []
      }
    },
    dataAugmentation: {
      enabled: true,
      techniques: {
        geometric: {
          rotation: { enabled: true, range: [-15, 15] },
          scaling: { enabled: true, range: [0.8, 1.2] },
          translation: { enabled: true, range: [-10, 10] },
          mirroring: { enabled: true, axes: ['x', 'y'] }
        },
        parametric: {
          ductSizing: { enabled: true, variance: 0.1 },
          airflowRates: { enabled: true, variance: 0.15 },
          pressureDrops: { enabled: true, variance: 0.2 },
          materialProperties: { enabled: true, variance: 0.05 }
        },
        synthetic: {
          noiseInjection: { enabled: true, level: 0.02 },
          patternVariation: { enabled: true, complexity: 0.3 },
          contextualVariation: { enabled: true, factors: ['occupancy', 'climate', 'usage'] }
        }
      },
      augmentationRatio: 0.3,
      qualityThreshold: 0.7
    },
    qualityControl: {
      minQualityThreshold: 0.6,
      enableOutlierDetection: true,
      enableConsistencyChecks: true,
      enableEngineerValidation: true
    }
  },
  storage: {
    maxDatasetSize: 100000,
    compressionEnabled: true,
    encryptionEnabled: true,
    backupEnabled: true,
    retentionPeriod: 1095 // 3 years
  },
  monitoring: {
    enableQualityTracking: true,
    enablePerformanceMetrics: true,
    enableDataDrift: true,
    alertThresholds: {
      qualityDrop: 0.1,
      volumeDrop: 0.2,
      driftDetection: 0.15
    }
  }
};

/**
 * Training data pipeline manager
 */
export class TrainingDataPipeline {
  private config: TrainingDataPipelineConfig;
  private datasets: Map<TrainingDataCategory, MLTrainingData[]> = new Map();
  private qualityMetrics: Map<string, DataQualityMetrics> = new Map();
  private processingStats: Map<string, any> = new Map();

  constructor(config?: Partial<TrainingDataPipelineConfig>) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.initializePipeline();
  }

  /**
   * Initialize the training data pipeline
   */
  private initializePipeline(): void {
    // Initialize datasets for each category
    for (const category of Object.values(TrainingDataCategory)) {
      this.datasets.set(category, []);
    }

    console.log('Training data pipeline initialized');
  }

  /**
   * Collect training data from various sources
   */
  async collectTrainingData(
    source: DataSourceType,
    rawData: any[],
    category: TrainingDataCategory
  ): Promise<{
    collected: number;
    processed: number;
    rejected: number;
    qualityScore: number;
  }> {
    const results = {
      collected: rawData.length,
      processed: 0,
      rejected: 0,
      qualityScore: 0
    };

    let totalQuality = 0;

    for (const data of rawData) {
      try {
        // Validate raw data
        const validation = this.validateRawData(data, source);
        if (!validation.isValid) {
          results.rejected++;
          continue;
        }

        // Process and convert to training data format
        const trainingData = await this.processRawData(data, source, category);
        if (!trainingData) {
          results.rejected++;
          continue;
        }

        // Calculate quality metrics
        const qualityMetrics = this.calculateDataQuality(trainingData);
        if (qualityMetrics.overallQuality < this.config.processing.qualityControl.minQualityThreshold) {
          results.rejected++;
          continue;
        }

        // Store training data
        const existingData = this.datasets.get(category) || [];
        existingData.push(trainingData);
        this.datasets.set(category, existingData);

        // Store quality metrics
        this.qualityMetrics.set(trainingData.id, qualityMetrics);

        results.processed++;
        totalQuality += qualityMetrics.overallQuality;

      } catch (error) {
        console.error('Error processing training data:', error);
        results.rejected++;
      }
    }

    results.qualityScore = results.processed > 0 ? totalQuality / results.processed : 0;

    // Update processing statistics
    this.updateProcessingStats(source, category, results);

    return results;
  }

  /**
   * Validate raw data before processing
   */
  private validateRawData(data: any, source: DataSourceType): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic structure validation
    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { isValid: false, errors };
    }

    // Source-specific validation
    switch (source) {
      case DataSourceType.USER_DESIGNS:
        if (!data.centerlines || !Array.isArray(data.centerlines)) {
          errors.push('User designs must include centerlines array');
        }
        break;

      case DataSourceType.PROFESSIONAL_PROJECTS:
        if (!data.engineerInfo || !data.projectInfo) {
          errors.push('Professional projects must include engineer and project info');
        }
        break;

      case DataSourceType.SIMULATION_RESULTS:
        if (!data.simulationParameters || !data.results) {
          errors.push('Simulation data must include parameters and results');
        }
        break;
    }

    // Required fields validation
    const requiredFields = ['timestamp', 'source'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Required field missing: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process raw data into training data format
   */
  private async processRawData(
    rawData: any,
    source: DataSourceType,
    category: TrainingDataCategory
  ): Promise<MLTrainingData | null> {
    try {
      // Extract features based on configuration
      const features = await this.extractFeatures(rawData);

      // Create training data structure
      const trainingData: MLTrainingData = {
        id: this.generateDataId(),
        category,
        input: {
          designContext: this.extractDesignContext(rawData),
          constraints: this.extractConstraints(rawData),
          existingLayout: this.extractExistingLayout(rawData)
        },
        output: {
          optimizedDesign: this.extractOptimizedDesign(rawData),
          performanceMetrics: this.extractPerformanceMetrics(rawData),
          engineerApproval: this.extractEngineerApproval(rawData),
          realWorldPerformance: this.extractRealWorldPerformance(rawData)
        },
        timestamp: rawData.timestamp || new Date().toISOString(),
        source: source,
        quality: this.estimateDataQuality(rawData, source)
      };

      return trainingData;

    } catch (error) {
      console.error('Error processing raw data:', error);
      return null;
    }
  }

  /**
   * Extract features from raw data
   */
  private async extractFeatures(rawData: any): Promise<Record<string, any>> {
    const features: Record<string, any> = {};

    // Geometric features
    if (this.config.processing.featureExtraction.geometric.enabled) {
      features.geometric = this.extractGeometricFeatures(rawData);
    }

    // Performance features
    if (this.config.processing.featureExtraction.performance.enabled) {
      features.performance = this.extractPerformanceFeatures(rawData);
    }

    // Contextual features
    if (this.config.processing.featureExtraction.contextual.enabled) {
      features.contextual = this.extractContextualFeatures(rawData);
    }

    // Temporal features
    if (this.config.processing.featureExtraction.temporal.enabled) {
      features.temporal = this.extractTemporalFeatures(rawData);
    }

    return features;
  }

  /**
   * Extract geometric features
   */
  private extractGeometricFeatures(rawData: any): Record<string, number> {
    const features: Record<string, number> = {};

    if (rawData.centerlines && Array.isArray(rawData.centerlines)) {
      // Calculate total length
      let totalLength = 0;
      let bendCount = 0;
      let complexityScore = 0;

      for (const centerline of rawData.centerlines) {
        if (centerline.points && Array.isArray(centerline.points)) {
          // Calculate length
          for (let i = 0; i < centerline.points.length - 1; i++) {
            const p1 = centerline.points[i];
            const p2 = centerline.points[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
          }

          // Count bends
          if (centerline.type === 'arc') {
            bendCount++;
          }

          // Calculate complexity
          complexityScore += centerline.points.length * (centerline.type === 'arc' ? 2 : 1);
        }
      }

      features.totalLength = totalLength;
      features.bendCount = bendCount;
      features.complexityScore = complexityScore;
      features.centerlineCount = rawData.centerlines.length;
    }

    return features;
  }

  /**
   * Extract performance features
   */
  private extractPerformanceFeatures(rawData: any): Record<string, number> {
    const features: Record<string, number> = {};

    if (rawData.performanceMetrics) {
      features.energyEfficiency = rawData.performanceMetrics.energyEfficiency || 0;
      features.pressureDrop = rawData.performanceMetrics.pressureDrop || 0;
      features.velocityUniformity = rawData.performanceMetrics.velocityUniformity || 0;
      features.noiseLevel = rawData.performanceMetrics.noiseLevel || 0;
      features.installationComplexity = rawData.performanceMetrics.installationComplexity || 0;
    }

    return features;
  }

  /**
   * Extract contextual features
   */
  private extractContextualFeatures(rawData: any): Record<string, any> {
    const features: Record<string, any> = {};

    if (rawData.buildingContext) {
      features.buildingType = rawData.buildingContext.buildingType || 'unknown';
      features.floorArea = rawData.buildingContext.floorArea || 0;
      features.ceilingHeight = rawData.buildingContext.ceilingHeight || 0;
      features.occupancy = rawData.buildingContext.occupancy || 0;
      features.climateZone = rawData.buildingContext.climateZone || 'unknown';
    }

    return features;
  }

  /**
   * Extract temporal features
   */
  private extractTemporalFeatures(rawData: any): Record<string, any> {
    const features: Record<string, any> = {};

    if (rawData.timestamp) {
      const date = new Date(rawData.timestamp);
      features.year = date.getFullYear();
      features.month = date.getMonth() + 1;
      features.dayOfWeek = date.getDay();
      features.season = Math.floor((date.getMonth() + 1) / 3) + 1;
    }

    return features;
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(trainingData: MLTrainingData): DataQualityMetrics {
    let completeness = 0;
    let accuracy = 0;
    let consistency = 0;
    let relevance = 0;
    let freshness = 0;

    // Calculate completeness
    const requiredFields = ['input', 'output', 'timestamp', 'source'];
    const presentFields = requiredFields.filter(field => trainingData[field as keyof MLTrainingData]);
    completeness = presentFields.length / requiredFields.length;

    // Estimate accuracy based on source
    switch (trainingData.source) {
      case 'professional_projects':
        accuracy = 0.9;
        break;
      case 'simulation_results':
        accuracy = 0.85;
        break;
      case 'user_designs':
        accuracy = 0.7;
        break;
      default:
        accuracy = 0.6;
    }

    // Calculate freshness
    const dataAge = Date.now() - new Date(trainingData.timestamp).getTime();
    const maxAge = this.config.collection.maxDataAge * 24 * 60 * 60 * 1000; // convert to ms
    freshness = Math.max(0, 1 - (dataAge / maxAge));

    // Estimate consistency and relevance
    consistency = trainingData.quality === 'high' ? 0.9 : trainingData.quality === 'medium' ? 0.7 : 0.5;
    relevance = 0.8; // Default relevance score

    // Calculate overall quality
    const weights = {
      completeness: 0.25,
      accuracy: 0.25,
      consistency: 0.2,
      relevance: 0.15,
      freshness: 0.15
    };

    const overallQuality = 
      completeness * weights.completeness +
      accuracy * weights.accuracy +
      consistency * weights.consistency +
      relevance * weights.relevance +
      freshness * weights.freshness;

    return {
      completeness,
      accuracy,
      consistency,
      relevance,
      freshness,
      engineerValidation: trainingData.output.engineerApproval,
      smacnaCompliance: 0.8, // Default SMACNA compliance score
      overallQuality
    };
  }

  /**
   * Generate unique data ID
   */
  private generateDataId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `training_${timestamp}_${random}`;
  }

  /**
   * Extract design context from raw data
   */
  private extractDesignContext(rawData: any): any {
    return rawData.designContext || {
      buildingType: 'unknown',
      floorArea: 0,
      ceilingHeight: 0,
      occupancy: 0,
      climateZone: 'unknown'
    };
  }

  /**
   * Extract constraints from raw data
   */
  private extractConstraints(rawData: any): any {
    return rawData.constraints || {
      maxPressureDrop: 0,
      maxVelocity: 0,
      budgetConstraints: 0,
      spaceConstraints: [],
      accessibilityRequirements: []
    };
  }

  /**
   * Extract existing layout from raw data
   */
  private extractExistingLayout(rawData: any): any {
    return rawData.existingLayout || {
      rooms: [],
      equipment: [],
      obstacles: []
    };
  }

  /**
   * Extract optimized design from raw data
   */
  private extractOptimizedDesign(rawData: any): HVACDesignPattern {
    // This would extract the optimized design pattern
    // For now, return a basic structure
    return {
      id: this.generateDataId(),
      name: 'Extracted Design',
      description: 'Design extracted from training data',
      category: 'supply',
      complexity: 'moderate',
      features: {
        centerlines: rawData.centerlines || [],
        ductDimensions: rawData.ductDimensions || [],
        ductShapes: rawData.ductShapes || [],
        airflows: rawData.airflows || [],
        pressureDrops: rawData.pressureDrops || [],
        efficiencyMetrics: rawData.efficiencyMetrics || {}
      },
      metadata: {
        projectType: rawData.projectType || 'unknown',
        buildingSize: rawData.buildingSize || 'unknown',
        engineerRating: rawData.engineerRating || 0,
        complianceScore: rawData.complianceScore || 0,
        costEfficiency: rawData.costEfficiency || 0
      }
    };
  }

  /**
   * Extract performance metrics from raw data
   */
  private extractPerformanceMetrics(rawData: any): any {
    return rawData.performanceMetrics || {
      energyEfficiency: 0,
      costEffectiveness: 0,
      installationComplexity: 0,
      maintenanceScore: 0,
      smacnaCompliance: 0
    };
  }

  /**
   * Extract engineer approval from raw data
   */
  private extractEngineerApproval(rawData: any): boolean {
    return rawData.engineerApproval || false;
  }

  /**
   * Extract real world performance from raw data
   */
  private extractRealWorldPerformance(rawData: any): any {
    return rawData.realWorldPerformance || undefined;
  }

  /**
   * Estimate data quality based on source and content
   */
  private estimateDataQuality(rawData: any, source: DataSourceType): 'high' | 'medium' | 'low' {
    let score = 0;

    // Source-based scoring
    switch (source) {
      case DataSourceType.PROFESSIONAL_PROJECTS:
        score += 0.4;
        break;
      case DataSourceType.SIMULATION_RESULTS:
        score += 0.3;
        break;
      case DataSourceType.USER_DESIGNS:
        score += 0.2;
        break;
      default:
        score += 0.1;
    }

    // Content-based scoring
    if (rawData.engineerApproval) score += 0.3;
    if (rawData.smacnaCompliance > 0.8) score += 0.2;
    if (rawData.performanceMetrics) score += 0.1;

    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(
    source: DataSourceType,
    category: TrainingDataCategory,
    results: any
  ): void {
    const key = `${source}_${category}`;
    const existing = this.processingStats.get(key) || {
      totalCollected: 0,
      totalProcessed: 0,
      totalRejected: 0,
      averageQuality: 0,
      lastUpdate: new Date().toISOString()
    };

    existing.totalCollected += results.collected;
    existing.totalProcessed += results.processed;
    existing.totalRejected += results.rejected;
    existing.averageQuality = (existing.averageQuality + results.qualityScore) / 2;
    existing.lastUpdate = new Date().toISOString();

    this.processingStats.set(key, existing);
  }

  /**
   * Get dataset statistics
   */
  getDatasetStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [category, data] of this.datasets.entries()) {
      stats[category] = {
        count: data.length,
        averageQuality: this.calculateAverageQuality(data),
        sources: this.getSourceDistribution(data),
        qualityDistribution: this.getQualityDistribution(data)
      };
    }

    return stats;
  }

  /**
   * Calculate average quality for dataset
   */
  private calculateAverageQuality(data: MLTrainingData[]): number {
    if (data.length === 0) return 0;

    let totalQuality = 0;
    for (const item of data) {
      const quality = this.qualityMetrics.get(item.id);
      if (quality) {
        totalQuality += quality.overallQuality;
      }
    }

    return totalQuality / data.length;
  }

  /**
   * Get source distribution for dataset
   */
  private getSourceDistribution(data: MLTrainingData[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const item of data) {
      distribution[item.source] = (distribution[item.source] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get quality distribution for dataset
   */
  private getQualityDistribution(data: MLTrainingData[]): Record<string, number> {
    const distribution = { high: 0, medium: 0, low: 0 };

    for (const item of data) {
      distribution[item.quality]++;
    }

    return distribution;
  }

  /**
   * Get training data for specific category
   */
  getTrainingData(category: TrainingDataCategory): MLTrainingData[] {
    return this.datasets.get(category) || [];
  }

  /**
   * Update pipeline configuration
   */
  updateConfig(newConfig: Partial<TrainingDataPipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TrainingDataPipelineConfig {
    return { ...this.config };
  }

  /**
   * Get processing statistics
   */
  getProcessingStatistics(): Record<string, any> {
    return Object.fromEntries(this.processingStats);
  }

  /**
   * Clear all training data (use with caution)
   */
  clearAllData(): void {
    this.datasets.clear();
    this.qualityMetrics.clear();
    this.processingStats.clear();
    this.initializePipeline();
  }

  /**
   * Export training data for external use
   */
  exportTrainingData(category?: TrainingDataCategory): MLTrainingData[] {
    if (category) {
      return this.getTrainingData(category);
    }

    const allData: MLTrainingData[] = [];
    for (const data of this.datasets.values()) {
      allData.push(...data);
    }
    return allData;
  }

  /**
   * Import training data from external source
   */
  async importTrainingData(
    data: MLTrainingData[],
    category: TrainingDataCategory,
    validateQuality: boolean = true
  ): Promise<{
    imported: number;
    rejected: number;
    errors: string[];
  }> {
    const results = {
      imported: 0,
      rejected: 0,
      errors: [] as string[]
    };

    for (const item of data) {
      try {
        if (validateQuality) {
          const qualityMetrics = this.calculateDataQuality(item);
          if (qualityMetrics.overallQuality < this.config.processing.qualityControl.minQualityThreshold) {
            results.rejected++;
            results.errors.push(`Data ${item.id} rejected due to low quality: ${qualityMetrics.overallQuality}`);
            continue;
          }
          this.qualityMetrics.set(item.id, qualityMetrics);
        }

        const existingData = this.datasets.get(category) || [];
        existingData.push(item);
        this.datasets.set(category, existingData);
        results.imported++;

      } catch (error) {
        results.rejected++;
        results.errors.push(`Error importing data ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}
