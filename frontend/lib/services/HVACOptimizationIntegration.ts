/**
 * HVAC Optimization Integration Service
 * 
 * Bridges AI optimization suggestions with existing HVAC calculation workflows
 * without modifying core calculation logic. Provides seamless integration
 * between AI recommendations and user interactions.
 * 
 * Features:
 * - Non-destructive integration with existing calculators
 * - Automatic optimization suggestion generation
 * - Suggestion application and validation
 * - Performance tracking and analytics
 * - Fallback to rule-based optimization when AI unavailable
 */

import { DuctSizingInputs, DuctSizingResults } from '../../../backend/services/calculations/AirDuctCalculator';
import { OptimizationSuggestion } from '../../hooks/useAIOptimization';
import { AIOptimizationService } from './AIOptimizationService';

export interface OptimizationContext {
  projectId?: string;
  calculationType: 'air_duct' | 'grease_duct' | 'boiler_vent' | 'engine_exhaust';
  buildingInfo?: {
    area?: number;
    volume?: number;
    occupancy?: number;
    floors?: number;
    climate?: string;
    location?: string;
  };
  designConstraints?: {
    budget?: number;
    timeline?: number;
    efficiency_target?: number;
    noise_limit?: number;
  };
  userPreferences?: {
    prioritize_cost?: boolean;
    prioritize_efficiency?: boolean;
    prioritize_environmental?: boolean;
  };
}

export interface OptimizationResult {
  originalInputs: DuctSizingInputs;
  originalResults: DuctSizingResults;
  optimizedInputs?: DuctSizingInputs;
  optimizedResults?: DuctSizingResults;
  suggestions: OptimizationSuggestion[];
  appliedSuggestions: string[];
  performanceImprovement: {
    efficiency_gain?: number;
    cost_savings?: number;
    energy_reduction?: number;
    emissions_reduction?: number;
  };
  confidence: number;
  timestamp: Date;
}

export interface OptimizationMetrics {
  total_optimizations: number;
  successful_applications: number;
  average_efficiency_gain: number;
  average_cost_savings: number;
  user_satisfaction_score: number;
  most_applied_suggestions: string[];
}

export class HVACOptimizationIntegration {
  private static instance: HVACOptimizationIntegration;
  private aiService: AIOptimizationService | null = null;
  private optimizationHistory: OptimizationResult[] = [];
  private metrics: OptimizationMetrics = {
    total_optimizations: 0,
    successful_applications: 0,
    average_efficiency_gain: 0,
    average_cost_savings: 0,
    user_satisfaction_score: 0,
    most_applied_suggestions: []
  };

  private constructor() {
    this.initializeAIService();
  }

  public static getInstance(): HVACOptimizationIntegration {
    if (!HVACOptimizationIntegration.instance) {
      HVACOptimizationIntegration.instance = new HVACOptimizationIntegration();
    }
    return HVACOptimizationIntegration.instance;
  }

  private async initializeAIService(): Promise<void> {
    try {
      this.aiService = new AIOptimizationService({
        modelPath: '/models/hvac_optimization.onnx',
        enableGPU: false,
        confidenceThreshold: 0.7
      });
      
      await this.aiService.initialize();
      console.log('HVAC Optimization Integration: AI service initialized');
    } catch (error) {
      console.warn('HVAC Optimization Integration: AI service unavailable, using rule-based optimization');
      this.aiService = null;
    }
  }

  /**
   * Generate optimization suggestions for HVAC calculations
   */
  public async generateOptimizationSuggestions(
    inputs: DuctSizingInputs,
    results: DuctSizingResults,
    context: OptimizationContext = { calculationType: 'air_duct' }
  ): Promise<OptimizationSuggestion[]> {
    try {
      // Try AI-powered optimization first
      if (this.aiService) {
        return await this.generateAISuggestions(inputs, results, context);
      }
      
      // Fallback to rule-based optimization
      return this.generateRuleBasedSuggestions(inputs, results, context);
      
    } catch (error) {
      console.warn('Optimization suggestion generation failed:', error);
      return this.generateRuleBasedSuggestions(inputs, results, context);
    }
  }

  /**
   * Apply optimization suggestion to calculation inputs
   */
  public applySuggestion(
    suggestion: OptimizationSuggestion,
    originalInputs: DuctSizingInputs,
    context: OptimizationContext
  ): DuctSizingInputs {
    const optimizedInputs = { ...originalInputs };

    switch (suggestion.id) {
      case 'velocity_optimization':
        optimizedInputs.targetVelocity = this.calculateOptimalVelocity(originalInputs);
        break;
        
      case 'friction_optimization':
        optimizedInputs.frictionRate = Math.max(0.08, originalInputs.frictionRate * 0.8);
        break;
        
      case 'material_optimization':
        optimizedInputs.material = 'galvanized_steel';
        break;
        
      case 'duct_type_optimization':
        optimizedInputs.ductType = suggestion.description.includes('round') ? 'round' : 'rectangular';
        break;
        
      default:
        console.warn(`Unknown suggestion type: ${suggestion.id}`);
        break;
    }

    return optimizedInputs;
  }

  /**
   * Validate optimization suggestion applicability
   */
  public validateSuggestion(
    suggestion: OptimizationSuggestion,
    inputs: DuctSizingInputs,
    results: DuctSizingResults,
    context: OptimizationContext
  ): { isValid: boolean; reason?: string } {
    // Check budget constraints
    if (context.designConstraints?.budget && 
        suggestion.estimatedSavings?.cost && 
        suggestion.estimatedSavings.cost > context.designConstraints.budget) {
      return { 
        isValid: false, 
        reason: 'Exceeds budget constraints' 
      };
    }

    // Check timeline constraints
    if (context.designConstraints?.timeline && 
        suggestion.implementationComplexity === 'complex' && 
        context.designConstraints.timeline < 30) {
      return { 
        isValid: false, 
        reason: 'Implementation time exceeds project timeline' 
      };
    }

    // Check technical feasibility
    if (suggestion.id === 'velocity_optimization' && 
        (inputs.maxVelocity && inputs.maxVelocity < 1000)) {
      return { 
        isValid: false, 
        reason: 'Velocity constraints prevent optimization' 
      };
    }

    return { isValid: true };
  }

  /**
   * Track optimization performance and user feedback
   */
  public recordOptimizationResult(
    result: OptimizationResult,
    userFeedback?: {
      satisfaction: number; // 1-5 scale
      applied_suggestions: string[];
      comments?: string;
    }
  ): void {
    this.optimizationHistory.push(result);
    this.updateMetrics(result, userFeedback);
    
    // Store in local storage for persistence
    try {
      localStorage.setItem(
        'hvac_optimization_history', 
        JSON.stringify(this.optimizationHistory.slice(-50)) // Keep last 50 results
      );
      localStorage.setItem('hvac_optimization_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to store optimization history:', error);
    }
  }

  /**
   * Get optimization analytics and insights
   */
  public getOptimizationAnalytics(): {
    metrics: OptimizationMetrics;
    trends: {
      efficiency_trend: number[];
      cost_savings_trend: number[];
      suggestion_popularity: Record<string, number>;
    };
    recommendations: string[];
  } {
    const recentResults = this.optimizationHistory.slice(-20);
    
    return {
      metrics: this.metrics,
      trends: {
        efficiency_trend: recentResults.map(r => r.performanceImprovement.efficiency_gain || 0),
        cost_savings_trend: recentResults.map(r => r.performanceImprovement.cost_savings || 0),
        suggestion_popularity: this.calculateSuggestionPopularity()
      },
      recommendations: this.generateAnalyticsRecommendations()
    };
  }

  private async generateAISuggestions(
    inputs: DuctSizingInputs,
    results: DuctSizingResults,
    context: OptimizationContext
  ): Promise<OptimizationSuggestion[]> {
    if (!this.aiService) {
      throw new Error('AI service not available');
    }

    // Convert to AI optimization input format
    const optimizationInput = {
      hvacSystem: {
        id: context.projectId || 'current_system',
        type: context.calculationType,
        efficiency: results.isOptimal ? 0.85 : 0.75,
        capacity: inputs.airflow
      },
      buildingData: {
        area: context.buildingInfo?.area || 5000,
        volume: context.buildingInfo?.volume || 50000,
        occupancy: context.buildingInfo?.occupancy || 50,
        insulation: 20,
        windows: [],
        orientation: 'south',
        floors: context.buildingInfo?.floors || 2,
        zoneCount: 4
      },
      environmentalData: {
        outdoorTemperature: Array(24).fill(75),
        humidity: Array(24).fill(45),
        solarRadiation: Array(24).fill(500),
        windSpeed: Array(24).fill(5),
        season: 'summer' as const,
        climate: context.buildingInfo?.climate || 'temperate'
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
        budget: context.designConstraints?.budget || 50000,
        timeline: context.designConstraints?.timeline || 90,
        comfort_requirements: {
          temperature_range: [68, 78] as [number, number],
          humidity_range: [30, 60] as [number, number],
          air_quality_min: 0.8,
          noise_max: context.designConstraints?.noise_limit || 45
        },
        regulatory_requirements: ['ASHRAE 90.1', 'SMACNA'],
        existing_equipment: ['ductwork', 'dampers']
      }
    };

    const aiResult = await this.aiService.optimizeSystem(optimizationInput);
    
    // Convert AI recommendations to optimization suggestions
    return aiResult.recommendations.map(rec => ({
      id: rec.id,
      type: rec.impact_areas.includes('energy_efficiency') ? 'efficiency' as const : 
            rec.impact_areas.includes('cost_reduction') ? 'cost' as const : 
            rec.impact_areas.includes('environmental') ? 'environmental' as const : 'performance' as const,
      title: rec.description.split(' - ')[0] || rec.description,
      description: rec.description,
      impact: rec.priority === 'high' ? 'high' as const : 
              rec.priority === 'medium' ? 'medium' as const : 'low' as const,
      confidence: rec.confidence,
      estimatedSavings: {
        energy: rec.annual_savings > 1000 ? Math.round((rec.annual_savings / 5000) * 100) : undefined,
        cost: rec.annual_savings,
        emissions: rec.annual_savings > 1000 ? Math.round(rec.annual_savings * 0.4) : undefined
      },
      implementationComplexity: rec.implementation_cost > 20000 ? 'complex' as const : 
                               rec.implementation_cost > 5000 ? 'moderate' as const : 'simple' as const,
      applicableToCurrentCalculation: rec.type === 'equipment_upgrade' || rec.type === 'control_strategy'
    }));
  }

  private generateRuleBasedSuggestions(
    inputs: DuctSizingInputs,
    results: DuctSizingResults,
    context: OptimizationContext
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Velocity optimization
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

    // Duct type optimization
    if (inputs.ductType === 'rectangular' && inputs.airflow < 2000) {
      suggestions.push({
        id: 'duct_type_optimization',
        type: 'cost',
        title: 'Consider Round Ductwork',
        description: 'For lower airflow applications, round ductwork often provides better cost-performance ratio.',
        impact: 'low',
        confidence: 0.65,
        estimatedSavings: {
          cost: 600
        },
        implementationComplexity: 'simple',
        applicableToCurrentCalculation: true
      });
    }

    return suggestions;
  }

  private calculateOptimalVelocity(inputs: DuctSizingInputs): number {
    // Rule-based optimal velocity calculation
    if (inputs.airflow < 1000) return 1200;
    if (inputs.airflow < 3000) return 1500;
    if (inputs.airflow < 6000) return 1800;
    return 2000;
  }

  private updateMetrics(
    result: OptimizationResult,
    userFeedback?: { satisfaction: number; applied_suggestions: string[]; comments?: string }
  ): void {
    this.metrics.total_optimizations++;
    
    if (userFeedback?.applied_suggestions.length) {
      this.metrics.successful_applications++;
      
      // Update average gains
      const efficiencyGain = result.performanceImprovement.efficiency_gain || 0;
      const costSavings = result.performanceImprovement.cost_savings || 0;
      
      this.metrics.average_efficiency_gain = 
        (this.metrics.average_efficiency_gain * (this.metrics.successful_applications - 1) + efficiencyGain) / 
        this.metrics.successful_applications;
        
      this.metrics.average_cost_savings = 
        (this.metrics.average_cost_savings * (this.metrics.successful_applications - 1) + costSavings) / 
        this.metrics.successful_applications;
    }
    
    if (userFeedback?.satisfaction) {
      this.metrics.user_satisfaction_score = 
        (this.metrics.user_satisfaction_score * (this.metrics.total_optimizations - 1) + userFeedback.satisfaction) / 
        this.metrics.total_optimizations;
    }
  }

  private calculateSuggestionPopularity(): Record<string, number> {
    const popularity: Record<string, number> = {};
    
    this.optimizationHistory.forEach(result => {
      result.appliedSuggestions.forEach(suggestionId => {
        popularity[suggestionId] = (popularity[suggestionId] || 0) + 1;
      });
    });
    
    return popularity;
  }

  private generateAnalyticsRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.average_efficiency_gain < 10) {
      recommendations.push('Consider more aggressive optimization strategies to improve efficiency gains');
    }
    
    if (this.metrics.user_satisfaction_score < 3.5) {
      recommendations.push('Review suggestion quality and relevance to improve user satisfaction');
    }
    
    if (this.metrics.successful_applications / this.metrics.total_optimizations < 0.3) {
      recommendations.push('Focus on more actionable and practical optimization suggestions');
    }
    
    return recommendations;
  }
}
