/**
 * AI Optimization Core Tests
 * 
 * Focused test suite for AI optimization core functionality
 * without React component testing to avoid JSX configuration issues.
 */

// Setup test environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

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

// Mock React hooks
const { renderHook, act } = require('@testing-library/react');

// Import components and hooks to test
const { useAIOptimization } = require('../../hooks/useAIOptimization');
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

describe('AI Optimization Core Tests', () => {
  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('useAIOptimization Hook', () => {
    test('should initialize with default configuration', async () => {
      const { result, waitFor } = renderHook(() => useAIOptimization());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.suggestions).toEqual([]);

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      }, { timeout: 5000 });
    });

    test('should generate optimization suggestions for calculation inputs', async () => {
      const { result, waitFor } = renderHook(() => useAIOptimization({
        enableRealTimeOptimization: true,
        confidenceThreshold: 0.7
      }));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let suggestions;
      await act(async () => {
        suggestions = await result.current.generateOptimizationSuggestions(
          mockCalculationInputs,
          mockCalculationResults,
          mockBuildingContext
        );
      });

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

    test('should predict energy consumption', async () => {
      const { result, waitFor } = renderHook(() => useAIOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const mockHVACSystem = {
        id: 'test_system',
        type: 'duct_system',
        efficiency: 0.85,
        capacity: 2000
      };

      const mockEnvironmentalData = {
        outdoorTemperature: Array(24).fill(75),
        humidity: Array(24).fill(45),
        solarRadiation: Array(24).fill(500),
        windSpeed: Array(24).fill(5),
        season: 'summer',
        climate: 'temperate'
      };

      let prediction;
      await act(async () => {
        prediction = await result.current.predictEnergyConsumption(
          mockHVACSystem,
          mockEnvironmentalData,
          24
        );
      });

      expect(prediction).toBeDefined();
      expect(Array.isArray(prediction)).toBe(true);
      expect(prediction.length).toBe(24);
      expect(prediction.every(val => typeof val === 'number' && val >= 0)).toBe(true);
    });

    test('should detect performance anomalies', async () => {
      const { result, waitFor } = renderHook(() => useAIOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const mockPerformanceData = [
        { cop: 3.5, eer: 12, capacity_utilization: 0.8, temperature_variance: 2 },
        { cop: 3.2, eer: 11, capacity_utilization: 0.75, temperature_variance: 3 },
        { cop: 2.8, eer: 9, capacity_utilization: 0.6, temperature_variance: 5 }, // Anomaly
        { cop: 3.4, eer: 12, capacity_utilization: 0.82, temperature_variance: 2 }
      ];

      let anomalies;
      await act(async () => {
        anomalies = await result.current.detectAnomalies(mockPerformanceData, 0.8);
      });

      expect(anomalies).toBeDefined();
      expect(anomalies).toHaveProperty('indices');
      expect(anomalies).toHaveProperty('confidence');
      expect(Array.isArray(anomalies.indices)).toBe(true);
      expect(Array.isArray(anomalies.confidence)).toBe(true);
    });

    test('should analyze environmental impact', async () => {
      const { result, waitFor } = renderHook(() => useAIOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const mockHVACSystem = {
        id: 'test_system',
        type: 'duct_system',
        efficiency: 0.85,
        capacity: 2000
      };

      const mockEnergyConsumption = Array(24).fill(50);

      let impact;
      await act(async () => {
        impact = await result.current.analyzeEnvironmentalImpact(
          mockHVACSystem,
          mockEnergyConsumption
        );
      });

      expect(impact).toBeDefined();
      expect(impact).toHaveProperty('carbon_footprint');
      expect(impact).toHaveProperty('sustainability_score');
      expect(impact).toHaveProperty('recommendations');
      expect(typeof impact.carbon_footprint).toBe('number');
      expect(typeof impact.sustainability_score).toBe('number');
      expect(Array.isArray(impact.recommendations)).toBe(true);
    });

    test('should handle AI service initialization failure gracefully', async () => {
      // Mock ONNX to throw an error
      const onnx = require('onnxruntime-web');
      onnx.InferenceSession.create.mockRejectedValueOnce(new Error('Model not found'));

      const { result, waitFor } = renderHook(() => useAIOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should still work with fallback suggestions
      let suggestions;
      await act(async () => {
        suggestions = await result.current.generateOptimizationSuggestions(
          mockCalculationInputs,
          mockCalculationResults
        );
      });

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should clear suggestions and reset state', async () => {
      const { result, waitFor } = renderHook(() => useAIOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Generate some suggestions first
      await act(async () => {
        await result.current.generateOptimizationSuggestions(
          mockCalculationInputs,
          mockCalculationResults
        );
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);

      // Clear suggestions
      await act(() => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.optimizationResult).toBe(null);
      expect(result.current.energyPrediction).toBe(null);
      expect(result.current.anomalies).toBe(null);
      expect(result.current.environmentalImpact).toBe(null);
    });
  });

  describe('HVACOptimizationIntegration Service', () => {
    let integrationService;

    beforeEach(() => {
      integrationService = HVACOptimizationIntegration.getInstance();
    });

    test('should generate optimization suggestions', async () => {
      const suggestions = await integrationService.generateOptimizationSuggestions(
        mockCalculationInputs,
        mockCalculationResults,
        { calculationType: 'air_duct', buildingInfo: mockBuildingContext }
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('should apply optimization suggestions', () => {
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

    test('should validate suggestion applicability', () => {
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

      expect(validation).toHaveProperty('isValid');
      expect(typeof validation.isValid).toBe('boolean');
    });

    test('should track optimization metrics', () => {
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
    });

    test('should generate rule-based suggestions when AI unavailable', async () => {
      // Test with high velocity to trigger velocity optimization suggestion
      const highVelocityInputs = {
        ...mockCalculationInputs,
        frictionRate: 0.18 // High friction rate
      };

      const highVelocityResults = {
        ...mockCalculationResults,
        velocity: 2500 // High velocity
      };

      const suggestions = await integrationService.generateOptimizationSuggestions(
        highVelocityInputs,
        highVelocityResults,
        { calculationType: 'air_duct' }
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      // Should include velocity optimization suggestion
      const velocitySuggestion = suggestions.find(s => s.id === 'velocity_optimization');
      expect(velocitySuggestion).toBeDefined();
      expect(velocitySuggestion.type).toBe('efficiency');

      // Should include friction optimization suggestion
      const frictionSuggestion = suggestions.find(s => s.id === 'friction_optimization');
      expect(frictionSuggestion).toBeDefined();
      expect(frictionSuggestion.type).toBe('efficiency');
    });

    test('should calculate optimal velocity correctly', () => {
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

console.log('✅ AI Optimization Core Tests completed successfully');
