/**
 * AI-Powered Suggestions System Test Suite
 * SizeWise Suite - AI-Powered Suggestions System
 * 
 * Comprehensive test suite for AI-powered design suggestions, ML architecture,
 * and training data pipeline. Tests include unit tests, integration tests,
 * performance tests, and validation tests for professional HVAC engineering
 * workflows and machine learning model integration.
 * 
 * @fileoverview AI-powered suggestions system test suite
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  MLArchitecture,
  TrainingDataPipeline,
  DesignSuggestions,
  MLModelType,
  TrainingDataCategory,
  SuggestionType,
  ConfidenceLevel,
  DataSourceType
} from '../../ai/MLArchitecture';
import { 
  SuggestionContext,
  AISuggestionResult
} from '../../ai/DesignSuggestions';
import { DuctShape } from '../../standards/SMACNAValidator';
import { Centerline } from '@/types/air-duct-sizer';

describe('AI-Powered Suggestions System', () => {
  let mlArchitecture: MLArchitecture;
  let trainingPipeline: TrainingDataPipeline;
  let designSuggestions: DesignSuggestions;

  beforeEach(() => {
    mlArchitecture = new MLArchitecture();
    trainingPipeline = new TrainingDataPipeline();
    designSuggestions = new DesignSuggestions({
      enabledSuggestionTypes: [
        SuggestionType.LAYOUT_OPTIMIZATION,
        SuggestionType.DUCT_SIZING,
        SuggestionType.EFFICIENCY_ENHANCEMENT
      ],
      confidenceThreshold: 0.7,
      maxSuggestions: 5
    }, mlArchitecture, trainingPipeline);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MLArchitecture', () => {
    it('should initialize with default configuration', () => {
      expect(mlArchitecture).toBeDefined();
      expect(mlArchitecture.getSupportedModelTypes()).toContain(MLModelType.DESIGN_OPTIMIZATION);
      expect(mlArchitecture.getSupportedModelTypes()).toContain(MLModelType.PATTERN_RECOGNITION);
      expect(mlArchitecture.getSupportedModelTypes()).toContain(MLModelType.EFFICIENCY_PREDICTION);
    });

    it('should validate model configurations', () => {
      const validation = mlArchitecture.validateModelConfig(MLModelType.DESIGN_OPTIMIZATION);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should provide architecture summary', () => {
      const summary = mlArchitecture.getArchitectureSummary();
      expect(summary.totalModels).toBeGreaterThan(0);
      expect(summary.modelTypes).toContain(MLModelType.DESIGN_OPTIMIZATION);
      expect(summary.averageAccuracyTarget).toBeGreaterThan(0.5);
      expect(summary.averageInferenceTime).toBeGreaterThan(0);
    });

    it('should update configuration', () => {
      const newConfig = {
        models: {
          [MLModelType.DESIGN_OPTIMIZATION]: {
            ...mlArchitecture.getModelConfig(MLModelType.DESIGN_OPTIMIZATION),
            performance: {
              targetAccuracy: 0.95,
              targetPrecision: 0.90,
              targetRecall: 0.90,
              maxInferenceTime: 300
            }
          }
        }
      };

      mlArchitecture.updateConfig(newConfig);
      const updatedConfig = mlArchitecture.getModelConfig(MLModelType.DESIGN_OPTIMIZATION);
      expect(updatedConfig.performance.targetAccuracy).toBe(0.95);
    });
  });

  describe('TrainingDataPipeline', () => {
    it('should initialize with default configuration', () => {
      expect(trainingPipeline).toBeDefined();
      expect(trainingPipeline.getTrainingDataCategories()).toContain(TrainingDataCategory.PROFESSIONAL_DESIGNS);
      expect(trainingPipeline.getTrainingDataCategories()).toContain(TrainingDataCategory.SMACNA_COMPLIANT);
    });

    it('should collect and process training data', async () => {
      const mockRawData = [
        {
          timestamp: new Date().toISOString(),
          source: 'test',
          centerlines: [
            { id: 'test_1', type: 'straight', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }
          ],
          performanceMetrics: {
            energyEfficiency: 0.85,
            pressureDrop: 0.3
          },
          buildingContext: {
            buildingType: 'office',
            floorArea: 5000,
            ceilingHeight: 9,
            occupancy: 100,
            climateZone: '4A'
          },
          engineerApproval: true
        }
      ];

      const results = await trainingPipeline.collectTrainingData(
        DataSourceType.PROFESSIONAL_PROJECTS,
        mockRawData,
        TrainingDataCategory.PROFESSIONAL_DESIGNS
      );

      expect(results.collected).toBe(1);
      expect(results.processed).toBeGreaterThan(0);
      expect(results.qualityScore).toBeGreaterThan(0);
    });

    it('should calculate data quality metrics', async () => {
      const mockRawData = [{
        timestamp: new Date().toISOString(),
        source: 'professional_project',
        centerlines: [{ id: 'test', type: 'straight', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }],
        engineerApproval: true,
        smacnaCompliance: 0.9
      }];

      const results = await trainingPipeline.collectTrainingData(
        DataSourceType.PROFESSIONAL_PROJECTS,
        mockRawData,
        TrainingDataCategory.PROFESSIONAL_DESIGNS
      );

      expect(results.qualityScore).toBeGreaterThan(0.7);
    });

    it('should provide dataset statistics', async () => {
      const stats = trainingPipeline.getDatasetStatistics();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should export and import training data', async () => {
      const mockData = [{
        id: 'test_data_1',
        category: TrainingDataCategory.PROFESSIONAL_DESIGNS,
        input: {
          designContext: {
            buildingType: 'office',
            floorArea: 5000,
            ceilingHeight: 9,
            occupancy: 100,
            climateZone: '4A'
          },
          constraints: {
            maxPressureDrop: 0.5,
            maxVelocity: 2000,
            budgetConstraints: 50000,
            spaceConstraints: [],
            accessibilityRequirements: []
          },
          existingLayout: {
            rooms: [],
            equipment: [],
            obstacles: []
          }
        },
        output: {
          optimizedDesign: {
            id: 'design_1',
            name: 'Test Design',
            description: 'Test design pattern',
            category: 'supply' as const,
            complexity: 'moderate' as const,
            features: {
              centerlines: [],
              ductDimensions: [],
              ductShapes: [],
              airflows: [],
              pressureDrops: [],
              efficiencyMetrics: {}
            },
            metadata: {
              projectType: 'office',
              buildingSize: 'medium',
              engineerRating: 4.5,
              complianceScore: 0.9,
              costEfficiency: 0.8
            }
          },
          performanceMetrics: {
            energyEfficiency: 0.85,
            costEffectiveness: 0.8,
            installationComplexity: 0.6,
            maintenanceScore: 0.9,
            smacnaCompliance: 0.95
          },
          engineerApproval: true
        },
        timestamp: new Date().toISOString(),
        source: DataSourceType.PROFESSIONAL_PROJECTS,
        quality: 'high' as const
      }];

      const importResults = await trainingPipeline.importTrainingData(
        mockData,
        TrainingDataCategory.PROFESSIONAL_DESIGNS,
        true
      );

      expect(importResults.imported).toBe(1);
      expect(importResults.rejected).toBe(0);

      const exportedData = trainingPipeline.exportTrainingData(TrainingDataCategory.PROFESSIONAL_DESIGNS);
      expect(exportedData).toHaveLength(1);
      expect(exportedData[0].id).toBe('test_data_1');
    });
  });

  describe('DesignSuggestions', () => {
    const mockContext: SuggestionContext = {
      currentDesign: {
        centerlines: [
          {
            id: 'main_trunk',
            type: 'straight',
            points: [{ x: 0, y: 0 }, { x: 200, y: 0 }]
          },
          {
            id: 'branch_1',
            type: 'arc',
            points: [{ x: 100, y: 0 }, { x: 125, y: 25 }, { x: 150, y: 50 }],
            radius: 15
          }
        ] as Centerline[],
        ductDimensions: [
          { width: 24, height: 12 },
          { width: 16, height: 10 }
        ],
        ductShapes: [DuctShape.RECTANGULAR, DuctShape.RECTANGULAR],
        airflows: [2000, 800]
      },
      buildingContext: {
        buildingType: 'office',
        floorArea: 5000,
        ceilingHeight: 9,
        occupancy: 100,
        climateZone: '4A'
      },
      constraints: {
        maxPressureDrop: 0.5,
        maxVelocity: 2000,
        budgetLimit: 50000,
        spaceConstraints: [],
        accessibilityRequirements: []
      },
      preferences: {
        prioritizeEfficiency: true,
        prioritizeCost: false,
        prioritizeCompliance: true,
        prioritizeSimplicity: false
      }
    };

    it('should initialize with configuration', () => {
      expect(designSuggestions).toBeDefined();
      const config = designSuggestions.getConfig();
      expect(config.enabledSuggestionTypes).toContain(SuggestionType.LAYOUT_OPTIMIZATION);
      expect(config.confidenceThreshold).toBe(0.7);
      expect(config.maxSuggestions).toBe(5);
    });

    it('should generate AI suggestions', async () => {
      const suggestions = await designSuggestions.generateSuggestions(mockContext);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);

      // Validate suggestion structure
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('confidenceScore');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('reasoning');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('implementation');
        expect(suggestion).toHaveProperty('validation');
        expect(suggestion).toHaveProperty('mlPrediction');

        // Validate confidence score
        expect(suggestion.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidenceScore).toBeLessThanOrEqual(1);

        // Validate impact metrics
        expect(typeof suggestion.impact.energyEfficiency).toBe('number');
        expect(typeof suggestion.impact.costSavings).toBe('number');
        expect(typeof suggestion.impact.complianceImprovement).toBe('number');
      }
    });

    it('should filter suggestions by confidence threshold', async () => {
      // Set high confidence threshold
      designSuggestions.updateConfig({ confidenceThreshold: 0.95 });
      
      const suggestions = await designSuggestions.generateSuggestions(mockContext);
      
      // All suggestions should meet the threshold
      suggestions.forEach(suggestion => {
        expect(suggestion.confidenceScore).toBeGreaterThanOrEqual(0.95);
      });
    });

    it('should limit suggestions to max count', async () => {
      designSuggestions.updateConfig({ maxSuggestions: 2 });
      
      const suggestions = await designSuggestions.generateSuggestions(mockContext);
      
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('should record and process feedback', () => {
      const suggestionId = 'test_suggestion_1';
      const feedback = {
        helpful: true,
        implemented: false,
        rating: 4,
        comments: 'Very useful suggestion'
      };

      expect(() => {
        designSuggestions.recordFeedback(suggestionId, feedback);
      }).not.toThrow();

      const stats = designSuggestions.getSuggestionStatistics();
      expect(stats.feedbackCount).toBeGreaterThan(0);
    });

    it('should provide suggestion statistics', () => {
      const stats = designSuggestions.getSuggestionStatistics();
      
      expect(stats).toHaveProperty('totalGenerated');
      expect(stats).toHaveProperty('averageConfidence');
      expect(stats).toHaveProperty('feedbackCount');
      expect(stats).toHaveProperty('averageRating');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('performanceMetrics');

      expect(typeof stats.totalGenerated).toBe('number');
      expect(typeof stats.averageConfidence).toBe('number');
      expect(typeof stats.feedbackCount).toBe('number');
      expect(typeof stats.averageRating).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
    });

    it('should update configuration', () => {
      const newConfig = {
        enabledSuggestionTypes: [SuggestionType.DUCT_SIZING],
        confidenceThreshold: 0.8,
        maxSuggestions: 3
      };

      designSuggestions.updateConfig(newConfig);
      const updatedConfig = designSuggestions.getConfig();

      expect(updatedConfig.enabledSuggestionTypes).toEqual([SuggestionType.DUCT_SIZING]);
      expect(updatedConfig.confidenceThreshold).toBe(0.8);
      expect(updatedConfig.maxSuggestions).toBe(3);
    });

    it('should clear cache', () => {
      expect(() => {
        designSuggestions.clearCache();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should integrate ML architecture with design suggestions', async () => {
      const suggestions = await designSuggestions.generateSuggestions({
        currentDesign: {
          centerlines: [
            {
              id: 'test_centerline',
              type: 'straight',
              points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
            }
          ] as Centerline[],
          ductDimensions: [{ width: 20, height: 12 }],
          ductShapes: [DuctShape.RECTANGULAR],
          airflows: [1500]
        },
        buildingContext: {
          buildingType: 'office',
          floorArea: 3000,
          ceilingHeight: 9,
          occupancy: 75,
          climateZone: '4A'
        },
        constraints: {
          maxPressureDrop: 0.4,
          maxVelocity: 1800,
          budgetLimit: 40000,
          spaceConstraints: [],
          accessibilityRequirements: []
        },
        preferences: {
          prioritizeEfficiency: true,
          prioritizeCost: true,
          prioritizeCompliance: true,
          prioritizeSimplicity: false
        }
      });

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);

      // Verify ML prediction integration
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.mlPrediction).toBeDefined();
        expect(suggestion.mlPrediction.modelType).toBeDefined();
        expect(suggestion.mlPrediction.confidence).toBeDefined();
        expect(suggestion.mlPrediction.metadata).toBeDefined();
      }
    });

    it('should handle training data pipeline integration', async () => {
      const mockTrainingData = [{
        timestamp: new Date().toISOString(),
        source: 'integration_test',
        centerlines: [
          { id: 'test', type: 'straight', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }
        ],
        performanceMetrics: { energyEfficiency: 0.9 },
        engineerApproval: true
      }];

      const results = await trainingPipeline.collectTrainingData(
        DataSourceType.USER_DESIGNS,
        mockTrainingData,
        TrainingDataCategory.OPTIMIZED_LAYOUTS
      );

      expect(results.processed).toBeGreaterThan(0);

      // Verify integration with design suggestions
      const suggestions = await designSuggestions.generateSuggestions({
        currentDesign: {
          centerlines: [] as Centerline[],
          ductDimensions: [],
          ductShapes: [],
          airflows: []
        },
        buildingContext: {
          buildingType: 'office',
          floorArea: 1000,
          ceilingHeight: 8,
          occupancy: 25,
          climateZone: '3A'
        },
        constraints: {
          maxPressureDrop: 0.3,
          maxVelocity: 1500,
          budgetLimit: 25000,
          spaceConstraints: [],
          accessibilityRequirements: []
        },
        preferences: {
          prioritizeEfficiency: false,
          prioritizeCost: true,
          prioritizeCompliance: true,
          prioritizeSimplicity: true
        }
      });

      expect(suggestions).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should generate suggestions within performance limits', async () => {
      const startTime = performance.now();
      
      const suggestions = await designSuggestions.generateSuggestions({
        currentDesign: {
          centerlines: Array.from({ length: 10 }, (_, i) => ({
            id: `centerline_${i}`,
            type: 'straight' as const,
            points: [{ x: i * 50, y: 0 }, { x: (i + 1) * 50, y: 0 }]
          })) as Centerline[],
          ductDimensions: Array.from({ length: 10 }, () => ({ width: 20, height: 12 })),
          ductShapes: Array.from({ length: 10 }, () => DuctShape.RECTANGULAR),
          airflows: Array.from({ length: 10 }, () => 1000)
        },
        buildingContext: {
          buildingType: 'office',
          floorArea: 10000,
          ceilingHeight: 10,
          occupancy: 200,
          climateZone: '4A'
        },
        constraints: {
          maxPressureDrop: 0.6,
          maxVelocity: 2500,
          budgetLimit: 100000,
          spaceConstraints: [],
          accessibilityRequirements: []
        },
        preferences: {
          prioritizeEfficiency: true,
          prioritizeCost: true,
          prioritizeCompliance: true,
          prioritizeSimplicity: true
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(suggestions).toBeDefined();
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date().toISOString(),
        source: `performance_test_${i}`,
        centerlines: [
          { id: `test_${i}`, type: 'straight', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }
        ],
        performanceMetrics: { energyEfficiency: Math.random() },
        engineerApproval: Math.random() > 0.5
      }));

      const startTime = performance.now();
      
      const results = await trainingPipeline.collectTrainingData(
        DataSourceType.SIMULATION_RESULTS,
        largeDataset,
        TrainingDataCategory.SIMULATION_DATA
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(results.collected).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid suggestion context gracefully', async () => {
      const invalidContext = {
        currentDesign: {
          centerlines: [],
          ductDimensions: [],
          ductShapes: [],
          airflows: []
        },
        buildingContext: {
          buildingType: '',
          floorArea: -1,
          ceilingHeight: 0,
          occupancy: -5,
          climateZone: ''
        },
        constraints: {
          maxPressureDrop: -1,
          maxVelocity: 0,
          budgetLimit: -1000,
          spaceConstraints: [],
          accessibilityRequirements: []
        },
        preferences: {
          prioritizeEfficiency: true,
          prioritizeCost: true,
          prioritizeCompliance: true,
          prioritizeSimplicity: true
        }
      };

      const suggestions = await designSuggestions.generateSuggestions(invalidContext);
      
      // Should not throw error, but may return empty array
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle training data validation errors', async () => {
      const invalidData = [
        {
          // Missing required fields
          source: 'invalid_test'
        },
        {
          timestamp: 'invalid_date',
          source: 'invalid_test',
          centerlines: 'not_an_array'
        }
      ];

      const results = await trainingPipeline.collectTrainingData(
        DataSourceType.USER_DESIGNS,
        invalidData,
        TrainingDataCategory.USER_DESIGNS
      );

      expect(results.collected).toBe(2);
      expect(results.rejected).toBe(2);
      expect(results.processed).toBe(0);
    });
  });
});
