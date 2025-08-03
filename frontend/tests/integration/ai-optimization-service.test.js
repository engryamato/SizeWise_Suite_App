/**
 * AI Optimization Service Tests
 * 
 * Test suite for HVAC optimization integration service functionality
 * focusing on core business logic without React dependencies.
 */

// Setup test environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock ONNX runtime
jest.mock('onnxruntime-web', () => ({
  InferenceSession: {
    create: jest.fn().mockResolvedValue({
      run: jest.fn().mockResolvedValue({
        output: {
          data: new Float32Array([0.8, 0.7, 1200, 15000, 2.5, 0.6, 0.9])
        }
      })
    })
  },
  Tensor: jest.fn().mockImplementation((type, data, dims) => ({
    type,
    data,
    dims
  })),
  env: {
    wasm: {
      numThreads: 4,
      simd: true
    }
  }
}));

// Import service to test
const { HVACOptimizationIntegration } = require('../../lib/services/HVACOptimizationIntegration');

// Test data
const mockCalculationInputs = {
  airflow: 2000,
  ductType: 'round',
  frictionRate: 0.12,
  units: 'imperial',
  material: 'galvanized_steel',
  targetVelocity: 1500
};

const mockCalculationResults = {
  diameter: 16,
  area: 1.4,
  velocity: 1429,
  pressureLoss: 0.12,
  reynoldsNumber: 150000,
  frictionFactor: 0.018,
  isOptimal: true,
  warnings: [],
  recommendations: [],
  standardsCompliance: {
    smacna: true,
    ashrae: true,
    velocityCompliant: true
  }
};

const mockBuildingContext = {
  area: 8000,
  volume: 80000,
  occupancy: 100,
  floors: 3
};

describe('AI Optimization Service Tests', () => {
  let integrationService;

  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
    localStorage.clear();
    integrationService = HVACOptimizationIntegration.getInstance();
  });

  describe('Optimization Suggestion Generation', () => {
    test('should generate optimization suggestions for valid inputs', async () => {
      const suggestions = await integrationService.generateOptimizationSuggestions(
        mockCalculationInputs,
        mockCalculationResults,
        { calculationType: 'air_duct', buildingInfo: mockBuildingContext }
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      // Verify suggestion structure
      const suggestion = suggestions[0];
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('description');
      expect(suggestion).toHaveProperty('impact');
      expect(suggestion).toHaveProperty('confidence');
      expect(suggestion).toHaveProperty('implementationComplexity');
      expect(suggestion).toHaveProperty('applicableToCurrentCalculation');
    });

    test('should generate velocity optimization for high velocity systems', async () => {
      const highVelocityResults = {
        ...mockCalculationResults,
        velocity: 2500 // High velocity
      };

      const suggestions = await integrationService.generateOptimizationSuggestions(
        mockCalculationInputs,
        highVelocityResults,
        { calculationType: 'air_duct' }
      );

      const velocitySuggestion = suggestions.find(s => s.id === 'velocity_optimization');
      expect(velocitySuggestion).toBeDefined();
      expect(velocitySuggestion.type).toBe('efficiency');
      expect(velocitySuggestion.impact).toBe('high');
      expect(velocitySuggestion.applicableToCurrentCalculation).toBe(true);
    });

    test('should generate friction optimization for high friction systems', async () => {
      const highFrictionInputs = {
        ...mockCalculationInputs,
        frictionRate: 0.18 // High friction rate
      };

      const suggestions = await integrationService.generateOptimizationSuggestions(
        highFrictionInputs,
        mockCalculationResults,
        { calculationType: 'air_duct' }
      );

      const frictionSuggestion = suggestions.find(s => s.id === 'friction_optimization');
      expect(frictionSuggestion).toBeDefined();
      expect(frictionSuggestion.type).toBe('efficiency');
      expect(frictionSuggestion.impact).toBe('medium');
    });

    test('should generate duct type optimization for low airflow rectangular ducts', async () => {
      const lowAirflowInputs = {
        ...mockCalculationInputs,
        airflow: 1500,
        ductType: 'rectangular'
      };

      const suggestions = await integrationService.generateOptimizationSuggestions(
        lowAirflowInputs,
        mockCalculationResults,
        { calculationType: 'air_duct' }
      );

      const ductTypeSuggestion = suggestions.find(s => s.id === 'duct_type_optimization');
      expect(ductTypeSuggestion).toBeDefined();
      expect(ductTypeSuggestion.type).toBe('cost');
      expect(ductTypeSuggestion.description).toContain('round ductwork');
    });
  });

  describe('Suggestion Application', () => {
    test('should apply velocity optimization suggestion correctly', () => {
      const suggestion = {
        id: 'velocity_optimization',
        type: 'efficiency',
        title: 'Optimize Air Velocity',
        description: 'Reduce velocity for better efficiency',
        impact: 'medium',
        confidence: 0.8,
        implementationComplexity: 'moderate',
        applicableToCurrentCalculation: true
      };

      const optimizedInputs = integrationService.applySuggestion(
        suggestion,
        mockCalculationInputs,
        { calculationType: 'air_duct' }
      );

      expect(optimizedInputs).toBeDefined();
      expect(optimizedInputs.targetVelocity).toBeDefined();
      expect(optimizedInputs.targetVelocity).not.toBe(mockCalculationInputs.targetVelocity);
    });

    test('should apply friction optimization suggestion correctly', () => {
      const suggestion = {
        id: 'friction_optimization',
        type: 'efficiency',
        title: 'Reduce System Friction',
        description: 'Lower friction rate for energy savings',
        impact: 'medium',
        confidence: 0.8,
        implementationComplexity: 'moderate',
        applicableToCurrentCalculation: true
      };

      const optimizedInputs = integrationService.applySuggestion(
        suggestion,
        mockCalculationInputs,
        { calculationType: 'air_duct' }
      );

      expect(optimizedInputs.frictionRate).toBeLessThan(mockCalculationInputs.frictionRate);
      expect(optimizedInputs.frictionRate).toBeGreaterThanOrEqual(0.08); // Minimum threshold
    });

    test('should apply material optimization suggestion correctly', () => {
      const inputsWithDifferentMaterial = {
        ...mockCalculationInputs,
        material: 'stainless_steel'
      };

      const suggestion = {
        id: 'material_optimization',
        type: 'cost',
        title: 'Material Cost Optimization',
        description: 'Consider galvanized steel',
        impact: 'low',
        confidence: 0.65,
        implementationComplexity: 'simple',
        applicableToCurrentCalculation: true
      };

      const optimizedInputs = integrationService.applySuggestion(
        suggestion,
        inputsWithDifferentMaterial,
        { calculationType: 'air_duct' }
      );

      expect(optimizedInputs.material).toBe('galvanized_steel');
    });

    test('should handle unknown suggestion types gracefully', () => {
      const unknownSuggestion = {
        id: 'unknown_optimization',
        type: 'efficiency',
        title: 'Unknown Optimization',
        description: 'Unknown optimization type',
        impact: 'medium',
        confidence: 0.8,
        implementationComplexity: 'moderate',
        applicableToCurrentCalculation: true
      };

      const optimizedInputs = integrationService.applySuggestion(
        unknownSuggestion,
        mockCalculationInputs,
        { calculationType: 'air_duct' }
      );

      // Should return unchanged inputs for unknown suggestion types
      expect(optimizedInputs).toEqual(mockCalculationInputs);
    });
  });

  describe('Suggestion Validation', () => {
    test('should validate suggestions within budget constraints', () => {
      const suggestion = {
        id: 'velocity_optimization',
        type: 'efficiency',
        title: 'Optimize Air Velocity',
        description: 'Test suggestion',
        impact: 'medium',
        confidence: 0.8,
        estimatedSavings: { cost: 1000 },
        implementationComplexity: 'simple',
        applicableToCurrentCalculation: true
      };

      const validation = integrationService.validateSuggestion(
        suggestion,
        mockCalculationInputs,
        mockCalculationResults,
        { 
          calculationType: 'air_duct',
          designConstraints: { budget: 5000, timeline: 60 }
        }
      );

      expect(validation.isValid).toBe(true);
    });

    test('should reject suggestions exceeding budget constraints', () => {
      const expensiveSuggestion = {
        id: 'velocity_optimization',
        type: 'efficiency',
        title: 'Expensive Optimization',
        description: 'Test suggestion',
        impact: 'high',
        confidence: 0.8,
        estimatedSavings: { cost: 10000 },
        implementationComplexity: 'complex',
        applicableToCurrentCalculation: true
      };

      const validation = integrationService.validateSuggestion(
        expensiveSuggestion,
        mockCalculationInputs,
        mockCalculationResults,
        { 
          calculationType: 'air_duct',
          designConstraints: { budget: 5000, timeline: 60 }
        }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('budget');
    });

    test('should reject complex suggestions with tight timeline constraints', () => {
      const complexSuggestion = {
        id: 'velocity_optimization',
        type: 'efficiency',
        title: 'Complex Optimization',
        description: 'Test suggestion',
        impact: 'high',
        confidence: 0.8,
        estimatedSavings: { cost: 1000 },
        implementationComplexity: 'complex',
        applicableToCurrentCalculation: true
      };

      const validation = integrationService.validateSuggestion(
        complexSuggestion,
        mockCalculationInputs,
        mockCalculationResults,
        { 
          calculationType: 'air_duct',
          designConstraints: { budget: 5000, timeline: 20 } // Tight timeline
        }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('timeline');
    });
  });

  describe('Optimization Metrics and Analytics', () => {
    test('should track optimization results and metrics', () => {
      const optimizationResult = {
        originalInputs: mockCalculationInputs,
        originalResults: mockCalculationResults,
        suggestions: [],
        appliedSuggestions: ['velocity_optimization'],
        performanceImprovement: {
          efficiency_gain: 15,
          cost_savings: 1200
        },
        confidence: 0.85,
        timestamp: new Date()
      };

      const userFeedback = {
        satisfaction: 4,
        applied_suggestions: ['velocity_optimization'],
        comments: 'Great suggestion!'
      };

      integrationService.recordOptimizationResult(optimizationResult, userFeedback);

      const analytics = integrationService.getOptimizationAnalytics();
      expect(analytics).toHaveProperty('metrics');
      expect(analytics).toHaveProperty('trends');
      expect(analytics).toHaveProperty('recommendations');
      expect(analytics.metrics.total_optimizations).toBeGreaterThan(0);
      expect(analytics.metrics.successful_applications).toBeGreaterThan(0);
    });

    test('should calculate suggestion popularity correctly', () => {
      // Record multiple optimization results
      const results = [
        {
          originalInputs: mockCalculationInputs,
          originalResults: mockCalculationResults,
          suggestions: [],
          appliedSuggestions: ['velocity_optimization'],
          performanceImprovement: { efficiency_gain: 10, cost_savings: 800 },
          confidence: 0.8,
          timestamp: new Date()
        },
        {
          originalInputs: mockCalculationInputs,
          originalResults: mockCalculationResults,
          suggestions: [],
          appliedSuggestions: ['velocity_optimization', 'friction_optimization'],
          performanceImprovement: { efficiency_gain: 15, cost_savings: 1200 },
          confidence: 0.85,
          timestamp: new Date()
        }
      ];

      results.forEach(result => {
        integrationService.recordOptimizationResult(result, {
          satisfaction: 4,
          applied_suggestions: result.appliedSuggestions
        });
      });

      const analytics = integrationService.getOptimizationAnalytics();
      expect(analytics.trends.suggestion_popularity['velocity_optimization']).toBe(2);
      expect(analytics.trends.suggestion_popularity['friction_optimization']).toBe(1);
    });

    test('should generate analytics recommendations based on performance', () => {
      // Record a result with low efficiency gain
      const lowPerformanceResult = {
        originalInputs: mockCalculationInputs,
        originalResults: mockCalculationResults,
        suggestions: [],
        appliedSuggestions: ['velocity_optimization'],
        performanceImprovement: { efficiency_gain: 5, cost_savings: 200 }, // Low gains
        confidence: 0.6,
        timestamp: new Date()
      };

      integrationService.recordOptimizationResult(lowPerformanceResult, {
        satisfaction: 2, // Low satisfaction
        applied_suggestions: ['velocity_optimization']
      });

      const analytics = integrationService.getOptimizationAnalytics();
      expect(analytics.recommendations.length).toBeGreaterThan(0);
      expect(analytics.recommendations.some(rec => 
        rec.includes('efficiency') || rec.includes('satisfaction')
      )).toBe(true);
    });
  });

  describe('Optimal Velocity Calculation', () => {
    test('should calculate optimal velocity based on airflow ranges', () => {
      const testCases = [
        { airflow: 500, expectedVelocity: 1200 },
        { airflow: 2000, expectedVelocity: 1500 },
        { airflow: 4000, expectedVelocity: 1800 },
        { airflow: 8000, expectedVelocity: 2000 }
      ];

      testCases.forEach(({ airflow, expectedVelocity }) => {
        const inputs = { ...mockCalculationInputs, airflow };
        const suggestion = {
          id: 'velocity_optimization',
          type: 'efficiency',
          title: 'Optimize Air Velocity',
          description: 'Test',
          impact: 'medium',
          confidence: 0.8,
          implementationComplexity: 'moderate',
          applicableToCurrentCalculation: true
        };

        const optimizedInputs = integrationService.applySuggestion(
          suggestion,
          inputs,
          { calculationType: 'air_duct' }
        );

        expect(optimizedInputs.targetVelocity).toBe(expectedVelocity);
      });
    });
  });
});

console.log('✅ AI Optimization Service Tests completed successfully');
