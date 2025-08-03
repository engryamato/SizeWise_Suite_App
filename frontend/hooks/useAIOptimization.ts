/**
 * Enhanced AI Optimization Hook
 * 
 * Provides AI-powered HVAC optimization suggestions that work alongside
 * existing calculation logic without modifying core functionality.
 * 
 * Features:
 * - Real-time optimization suggestions
 * - Energy efficiency recommendations
 * - Cost optimization analysis
 * - Performance anomaly detection
 * - Equipment sizing recommendations
 * - Environmental impact assessment
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AIOptimizationService, 
  OptimizationInput, 
  OptimizationResult,
  HVACSystem,
  BuildingData,
  EnvironmentalData,
  OperationalData,
  OptimizationConstraints,
  OptimizationRecommendation,
  PerformanceMetrics
} from '../lib/services/AIOptimizationService';
import { DuctSizingInputs, DuctSizingResults } from '../../backend/services/calculations/AirDuctCalculator';

export interface AIOptimizationHookConfig {
  enableRealTimeOptimization?: boolean;
  enableEnergyPrediction?: boolean;
  enableAnomalyDetection?: boolean;
  enableEnvironmentalAnalysis?: boolean;
  confidenceThreshold?: number;
  updateInterval?: number; // milliseconds
}

export interface OptimizationSuggestion {
  id: string;
  type: 'efficiency' | 'cost' | 'performance' | 'environmental';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  estimatedSavings?: {
    energy?: number; // percentage
    cost?: number; // annual dollars
    emissions?: number; // kg CO2
  };
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  applicableToCurrentCalculation: boolean;
}

export interface AIOptimizationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  suggestions: OptimizationSuggestion[];
  optimizationResult: OptimizationResult | null;
  energyPrediction: number[] | null;
  anomalies: { indices: number[]; confidence: number[] } | null;
  environmentalImpact: {
    carbonFootprint: number;
    sustainabilityScore: number;
    recommendations: string[];
  } | null;
}

export function useAIOptimization(config: AIOptimizationHookConfig = {}) {
  const [state, setState] = useState<AIOptimizationState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    suggestions: [],
    optimizationResult: null,
    energyPrediction: null,
    anomalies: null,
    environmentalImpact: null
  });

  const [aiService, setAiService] = useState<AIOptimizationService | null>(null);

  const defaultConfig = useMemo(() => ({
    enableRealTimeOptimization: true,
    enableEnergyPrediction: true,
    enableAnomalyDetection: true,
    enableEnvironmentalAnalysis: true,
    confidenceThreshold: 0.7,
    updateInterval: 5000,
    ...config
  }), [config]);

  // Initialize AI service
  useEffect(() => {
    const initializeAI = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const service = new AIOptimizationService({
          modelPath: '/models/hvac_optimization.onnx',
          enableGPU: false,
          confidenceThreshold: defaultConfig.confidenceThreshold,
          optimizationGoals: [
            { type: 'energy_efficiency', weight: 0.4 },
            { type: 'cost_reduction', weight: 0.3 },
            { type: 'comfort', weight: 0.2 },
            { type: 'environmental', weight: 0.1 }
          ]
        });

        // Try to initialize - fallback to mock mode if models not available
        try {
          await service.initialize();
        } catch (error) {
          console.warn('AI models not available, using mock optimization service');
          // Continue with mock service for development/testing
        }

        setAiService(service);
        setState(prev => ({ 
          ...prev, 
          isInitialized: true, 
          isLoading: false 
        }));

      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to initialize AI service',
          isLoading: false 
        }));
      }
    };

    initializeAI();
  }, [defaultConfig.confidenceThreshold]);

  // Generate optimization suggestions for HVAC calculations
  const generateOptimizationSuggestions = useCallback(async (
    calculationInputs: DuctSizingInputs,
    calculationResults: DuctSizingResults,
    buildingContext?: Partial<BuildingData>
  ): Promise<OptimizationSuggestion[]> => {
    if (!aiService || !state.isInitialized) {
      return generateMockSuggestions(calculationInputs, calculationResults);
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Convert calculation data to AI optimization input
      const optimizationInput = convertCalculationToOptimizationInput(
        calculationInputs,
        calculationResults,
        buildingContext
      );

      // Get AI optimization result
      const result = await aiService.optimizeSystem(optimizationInput);
      
      // Convert AI recommendations to user-friendly suggestions
      const suggestions = convertRecommendationsToSuggestions(
        result.recommendations,
        calculationInputs,
        calculationResults
      );

      setState(prev => ({ 
        ...prev, 
        suggestions,
        optimizationResult: result,
        isLoading: false 
      }));

      return suggestions;

    } catch (error) {
      console.warn('AI optimization failed, using fallback suggestions:', error);
      const fallbackSuggestions = generateMockSuggestions(calculationInputs, calculationResults);
      
      setState(prev => ({ 
        ...prev, 
        suggestions: fallbackSuggestions,
        error: null, // Don't show error for fallback
        isLoading: false 
      }));

      return fallbackSuggestions;
    }
  }, [aiService, state.isInitialized]);

  // Predict energy consumption
  const predictEnergyConsumption = useCallback(async (
    hvacSystem: HVACSystem,
    environmentalData: EnvironmentalData,
    timeHorizon: number = 24
  ): Promise<number[]> => {
    if (!aiService || !state.isInitialized) {
      return generateMockEnergyPrediction(timeHorizon);
    }

    try {
      const prediction = await aiService.predictEnergyConsumption(
        hvacSystem,
        environmentalData,
        timeHorizon
      );

      setState(prev => ({ ...prev, energyPrediction: prediction }));
      return prediction;

    } catch (error) {
      console.warn('Energy prediction failed, using mock data:', error);
      const mockPrediction = generateMockEnergyPrediction(timeHorizon);
      setState(prev => ({ ...prev, energyPrediction: mockPrediction }));
      return mockPrediction;
    }
  }, [aiService, state.isInitialized]);

  // Detect performance anomalies
  const detectAnomalies = useCallback(async (
    performanceData: PerformanceMetrics[],
    threshold: number = 0.8
  ): Promise<{ indices: number[]; confidence: number[] }> => {
    if (!aiService || !state.isInitialized) {
      return { indices: [], confidence: [] };
    }

    try {
      const result = await aiService.detectAnomalies(performanceData, threshold);
      
      setState(prev => ({ 
        ...prev, 
        anomalies: { indices: result.anomalies, confidence: result.confidence }
      }));

      return { indices: result.anomalies, confidence: result.confidence };

    } catch (error) {
      console.warn('Anomaly detection failed:', error);
      return { indices: [], confidence: [] };
    }
  }, [aiService, state.isInitialized]);

  // Analyze environmental impact
  const analyzeEnvironmentalImpact = useCallback(async (
    hvacSystem: HVACSystem,
    energyConsumption: number[]
  ) => {
    if (!aiService || !state.isInitialized) {
      const mockImpact = generateMockEnvironmentalImpact(energyConsumption);
      setState(prev => ({ ...prev, environmentalImpact: mockImpact }));
      return mockImpact;
    }

    try {
      const impact = await aiService.analyzeEnvironmentalImpact(hvacSystem, energyConsumption);
      
      setState(prev => ({ 
        ...prev, 
        environmentalImpact: {
          carbonFootprint: impact.carbon_footprint,
          sustainabilityScore: impact.sustainability_score,
          recommendations: impact.recommendations
        }
      }));

      return impact;

    } catch (error) {
      console.warn('Environmental analysis failed, using mock data:', error);
      const mockImpact = generateMockEnvironmentalImpact(energyConsumption);
      setState(prev => ({ ...prev, environmentalImpact: mockImpact }));
      return mockImpact;
    }
  }, [aiService, state.isInitialized]);

  // Clear suggestions and reset state
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: [],
      optimizationResult: null,
      energyPrediction: null,
      anomalies: null,
      environmentalImpact: null
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    generateOptimizationSuggestions,
    predictEnergyConsumption,
    detectAnomalies,
    analyzeEnvironmentalImpact,
    clearSuggestions,
    
    // Configuration
    config: defaultConfig,
    
    // Service instance (for advanced usage)
    aiService
  };
}

// Helper function to convert calculation data to optimization input
function convertCalculationToOptimizationInput(
  inputs: DuctSizingInputs,
  results: DuctSizingResults,
  buildingContext?: Partial<BuildingData>
): OptimizationInput {
  return {
    hvacSystem: {
      id: 'current_system',
      type: 'duct_system',
      efficiency: results.isOptimal ? 0.85 : 0.75,
      capacity: inputs.airflow
    },
    buildingData: {
      area: buildingContext?.area || 5000,
      volume: buildingContext?.volume || 50000,
      occupancy: buildingContext?.occupancy || 50,
      insulation: buildingContext?.insulation || 20,
      windows: buildingContext?.windows || [],
      orientation: buildingContext?.orientation || 'south',
      floors: buildingContext?.floors || 2,
      zoneCount: buildingContext?.zoneCount || 4
    },
    environmentalData: {
      outdoorTemperature: Array(24).fill(75),
      humidity: Array(24).fill(45),
      solarRadiation: Array(24).fill(500),
      windSpeed: Array(24).fill(5),
      season: 'summer',
      climate: 'temperate'
    },
    operationalData: {
      currentLoad: inputs.airflow,
      energyConsumption: Array(24).fill(50),
      operatingHours: 12,
      maintenanceHistory: [],
      performanceMetrics: {
        cop: 3.5,
        eer: 12,
        capacity_utilization: 0.8,
        temperature_variance: 2
      }
    },
    constraints: {
      budget: 50000,
      timeline: 90,
      comfort_requirements: {
        temperature_range: [68, 78],
        humidity_range: [30, 60],
        air_quality_min: 0.8,
        noise_max: 45
      },
      regulatory_requirements: ['ASHRAE 90.1', 'SMACNA'],
      existing_equipment: ['ductwork', 'dampers']
    }
  };
}

// Convert AI recommendations to user-friendly suggestions
function convertRecommendationsToSuggestions(
  recommendations: OptimizationRecommendation[],
  inputs: DuctSizingInputs,
  results: DuctSizingResults
): OptimizationSuggestion[] {
  return recommendations.map((rec, index) => ({
    id: rec.id,
    type: rec.impact_areas.includes('energy_efficiency') ? 'efficiency' :
          rec.impact_areas.includes('cost_reduction') ? 'cost' :
          rec.impact_areas.includes('environmental') ? 'environmental' : 'performance',
    title: rec.description.split(' - ')[0] || rec.description,
    description: rec.description,
    impact: rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'medium' : 'low',
    confidence: rec.confidence,
    estimatedSavings: {
      energy: rec.annual_savings > 1000 ? Math.round((rec.annual_savings / 5000) * 100) : undefined,
      cost: rec.annual_savings,
      emissions: rec.annual_savings > 1000 ? Math.round(rec.annual_savings * 0.4) : undefined
    },
    implementationComplexity: rec.implementation_cost > 20000 ? 'complex' :
                             rec.implementation_cost > 5000 ? 'moderate' : 'simple',
    applicableToCurrentCalculation: rec.type === 'equipment_upgrade' || rec.type === 'control_strategy'
  }));
}

// Generate mock suggestions for development/fallback
function generateMockSuggestions(
  inputs: DuctSizingInputs,
  results: DuctSizingResults
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Velocity optimization suggestion
  if (results.velocity && (results.velocity > 2000 || results.velocity < 800)) {
    suggestions.push({
      id: 'velocity_optimization',
      type: 'efficiency',
      title: 'Optimize Air Velocity',
      description: `Current velocity (${Math.round(results.velocity)} FPM) is ${results.velocity > 2000 ? 'too high' : 'too low'}. Consider ${results.velocity > 2000 ? 'increasing duct size' : 'decreasing duct size'} for optimal performance.`,
      impact: results.velocity > 2500 || results.velocity < 600 ? 'high' : 'medium',
      confidence: 0.85,
      estimatedSavings: {
        energy: results.velocity > 2000 ? 15 : 8,
        cost: results.velocity > 2000 ? 1200 : 600
      },
      implementationComplexity: 'moderate',
      applicableToCurrentCalculation: true
    });
  }

  // Friction rate optimization
  if (inputs.frictionRate > 0.15) {
    suggestions.push({
      id: 'friction_optimization',
      type: 'efficiency',
      title: 'Reduce System Friction',
      description: `High friction rate (${inputs.frictionRate.toFixed(3)} in. w.g./100 ft) indicates potential for energy savings through duct optimization.`,
      impact: 'medium',
      confidence: 0.78,
      estimatedSavings: {
        energy: 12,
        cost: 800,
        emissions: 320
      },
      implementationComplexity: 'moderate',
      applicableToCurrentCalculation: true
    });
  }

  // Material optimization
  if (inputs.material && inputs.material !== 'galvanized_steel') {
    suggestions.push({
      id: 'material_optimization',
      type: 'cost',
      title: 'Material Cost Optimization',
      description: 'Consider galvanized steel for better cost-performance balance in most applications.',
      impact: 'low',
      confidence: 0.65,
      estimatedSavings: {
        cost: 400
      },
      implementationComplexity: 'simple',
      applicableToCurrentCalculation: true
    });
  }

  // Environmental suggestion
  suggestions.push({
    id: 'environmental_impact',
    type: 'environmental',
    title: 'Environmental Impact Reduction',
    description: 'Consider implementing variable air volume (VAV) controls to reduce energy consumption during low-demand periods.',
    impact: 'medium',
    confidence: 0.72,
    estimatedSavings: {
      energy: 20,
      cost: 1500,
      emissions: 600
    },
    implementationComplexity: 'complex',
    applicableToCurrentCalculation: false
  });

  return suggestions;
}

// Generate mock energy prediction
function generateMockEnergyPrediction(timeHorizon: number): number[] {
  const baseConsumption = 45; // kWh
  const prediction: number[] = [];

  for (let i = 0; i < timeHorizon; i++) {
    const hour = i % 24;
    const isBusinessHours = hour >= 8 && hour <= 18;
    const variation = Math.sin((hour / 24) * 2 * Math.PI) * 0.3;
    const randomVariation = (Math.random() - 0.5) * 0.2;

    const consumption = baseConsumption *
      (isBusinessHours ? 1.2 : 0.6) *
      (1 + variation + randomVariation);

    prediction.push(Math.max(0, consumption));
  }

  return prediction;
}

// Generate mock environmental impact
function generateMockEnvironmentalImpact(energyConsumption: number[]) {
  const totalEnergy = energyConsumption.reduce((sum, consumption) => sum + consumption, 0);
  const carbonIntensity = 0.4; // kg CO2/kWh

  return {
    carbonFootprint: totalEnergy * carbonIntensity,
    sustainabilityScore: Math.min(0.85, Math.max(0.3, 0.7 - (totalEnergy / 10000))),
    recommendations: [
      'Consider implementing energy recovery ventilation (ERV)',
      'Upgrade to high-efficiency motors and drives',
      'Install smart controls for demand-based ventilation',
      'Evaluate renewable energy integration opportunities'
    ]
  };
}
