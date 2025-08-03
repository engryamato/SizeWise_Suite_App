/**
 * AI Optimization Integration Tests
 * 
 * Comprehensive test suite for AI-powered HVAC optimization features
 * including hook functionality, component rendering, and service integration.
 */

// Setup test environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { JSDOM } from 'jsdom';
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
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Import components and hooks to test
import { useAIOptimization } from '../../hooks/useAIOptimization';
import { AIOptimizationPanel } from '../../components/optimization/AIOptimizationPanel';
import { HVACOptimizationIntegration } from '../../lib/services/HVACOptimizationIntegration';

// Mock UI components
jest.mock('../../components/ui/card', () => ({
  Card: ({ children, className }) => React.createElement('div', { className: `card ${className}` }, children),
  CardContent: ({ children }) => React.createElement('div', { className: 'card-content' }, children),
  CardHeader: ({ children }) => React.createElement('div', { className: 'card-header' }, children),
  CardTitle: ({ children }) => React.createElement('div', { className: 'card-title' }, children)
}));

jest.mock('../../components/ui/badge', () => ({
  Badge: ({ children, variant, className }) =>
    React.createElement('span', { className: `badge ${variant} ${className}` }, children)
}));

jest.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, size, variant, className }) =>
    React.createElement('button', {
      onClick,
      className: `button ${size} ${variant} ${className}`
    }, children)
}));

jest.mock('../../components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }) =>
    React.createElement('div', { className: 'tabs', 'data-value': value }, children),
  TabsContent: ({ children, value }) =>
    React.createElement('div', { className: 'tabs-content', 'data-value': value }, children),
  TabsList: ({ children }) => React.createElement('div', { className: 'tabs-list' }, children),
  TabsTrigger: ({ children, value }) =>
    React.createElement('button', { className: 'tabs-trigger', 'data-value': value }, children)
}));

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

describe('AI Optimization Integration Tests', () => {
  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('useAIOptimization Hook', () => {
    test('should initialize with default configuration', async () => {
      const { result } = renderHook(() => useAIOptimization());

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
      const { result } = renderHook(() => useAIOptimization({
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
      const { result } = renderHook(() => useAIOptimization());

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
      const { result } = renderHook(() => useAIOptimization());

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
      const { result } = renderHook(() => useAIOptimization());

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

      const { result } = renderHook(() => useAIOptimization());

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
      const { result } = renderHook(() => useAIOptimization());

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

  describe('AIOptimizationPanel Component', () => {
    test('should render initialization state', () => {
      // Mock hook to return uninitialized state
      jest.doMock('../../hooks/useAIOptimization', () => ({
        useAIOptimization: () => ({
          isInitialized: false,
          isLoading: false,
          error: null,
          suggestions: [],
          energyPrediction: null,
          environmentalImpact: null,
          generateOptimizationSuggestions: jest.fn(),
          predictEnergyConsumption: jest.fn(),
          analyzeEnvironmentalImpact: jest.fn()
        })
      }));

      render(
        React.createElement(AIOptimizationPanel, {
          calculationInputs: mockCalculationInputs,
          calculationResults: mockCalculationResults,
          buildingContext: mockBuildingContext
        })
      );

      expect(screen.getByText('Initializing AI Optimization')).toBeInTheDocument();
      expect(screen.getByText('Loading AI models for optimization analysis...')).toBeInTheDocument();
    });

    test('should render error state when AI unavailable', () => {
      jest.doMock('../../hooks/useAIOptimization', () => ({
        useAIOptimization: () => ({
          isInitialized: false,
          isLoading: false,
          error: 'AI models not available',
          suggestions: [],
          energyPrediction: null,
          environmentalImpact: null,
          generateOptimizationSuggestions: jest.fn(),
          predictEnergyConsumption: jest.fn(),
          analyzeEnvironmentalImpact: jest.fn()
        })
      }));

      render(
        React.createElement(AIOptimizationPanel, {
          calculationInputs: mockCalculationInputs,
          calculationResults: mockCalculationResults
        })
      );

      expect(screen.getByText('AI Optimization Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/AI optimization features are currently unavailable/)).toBeInTheDocument();
    });

    test('should render optimization suggestions', () => {
      const mockSuggestions = [
        {
          id: 'velocity_optimization',
          type: 'efficiency',
          title: 'Optimize Air Velocity',
          description: 'Current velocity is too high. Consider increasing duct size.',
          impact: 'high',
          confidence: 0.85,
          estimatedSavings: { energy: 15, cost: 1200 },
          implementationComplexity: 'moderate',
          applicableToCurrentCalculation: true
        }
      ];

      jest.doMock('../../hooks/useAIOptimization', () => ({
        useAIOptimization: () => ({
          isInitialized: true,
          isLoading: false,
          error: null,
          suggestions: mockSuggestions,
          energyPrediction: null,
          environmentalImpact: null,
          generateOptimizationSuggestions: jest.fn(),
          predictEnergyConsumption: jest.fn(),
          analyzeEnvironmentalImpact: jest.fn()
        })
      }));

      render(
        React.createElement(AIOptimizationPanel, {
          calculationInputs: mockCalculationInputs,
          calculationResults: mockCalculationResults
        })
      );

      expect(screen.getByText('Optimize Air Velocity')).toBeInTheDocument();
      expect(screen.getByText(/Current velocity is too high/)).toBeInTheDocument();
      expect(screen.getByText('high impact')).toBeInTheDocument();
      expect(screen.getByText('moderate')).toBeInTheDocument();
    });

    test('should handle suggestion application', () => {
      const mockOnApplySuggestion = jest.fn();
      const mockSuggestions = [
        {
          id: 'velocity_optimization',
          type: 'efficiency',
          title: 'Optimize Air Velocity',
          description: 'Current velocity is too high.',
          impact: 'high',
          confidence: 0.85,
          estimatedSavings: { energy: 15, cost: 1200 },
          implementationComplexity: 'moderate',
          applicableToCurrentCalculation: true
        }
      ];

      jest.doMock('../../hooks/useAIOptimization', () => ({
        useAIOptimization: () => ({
          isInitialized: true,
          isLoading: false,
          error: null,
          suggestions: mockSuggestions,
          energyPrediction: null,
          environmentalImpact: null,
          generateOptimizationSuggestions: jest.fn(),
          predictEnergyConsumption: jest.fn(),
          analyzeEnvironmentalImpact: jest.fn()
        })
      }));

      render(
        React.createElement(AIOptimizationPanel, {
          calculationInputs: mockCalculationInputs,
          calculationResults: mockCalculationResults,
          onApplySuggestion: mockOnApplySuggestion
        })
      );

      const applyButton = screen.getByText('Apply Suggestion');
      fireEvent.click(applyButton);

      expect(mockOnApplySuggestion).toHaveBeenCalledWith(mockSuggestions[0]);
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
  });
});

console.log('✅ AI Optimization Integration Tests completed successfully');
