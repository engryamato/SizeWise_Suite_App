/**
 * AI Optimization Panel Component
 * 
 * Displays AI-powered HVAC optimization suggestions alongside calculation results
 * without modifying existing calculation logic.
 * 
 * Features:
 * - Real-time optimization suggestions
 * - Energy efficiency recommendations
 * - Cost optimization analysis
 * - Environmental impact insights
 * - Implementation guidance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Lightbulb, 
  TrendingUp, 
  DollarSign, 
  Leaf, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';
import { useAIOptimization, OptimizationSuggestion } from '../../hooks/useAIOptimization';
import { DuctSizingInputs, DuctSizingResults } from '../../../backend/services/calculations/AirDuctCalculator';

interface AIOptimizationPanelProps {
  calculationInputs: DuctSizingInputs;
  calculationResults: DuctSizingResults;
  buildingContext?: {
    area?: number;
    volume?: number;
    occupancy?: number;
    floors?: number;
  };
  onApplySuggestion?: (suggestion: OptimizationSuggestion) => void;
  className?: string;
}

export function AIOptimizationPanel({
  calculationInputs,
  calculationResults,
  buildingContext,
  onApplySuggestion,
  className = ''
}: AIOptimizationPanelProps) {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const {
    isInitialized,
    isLoading,
    error,
    suggestions,
    energyPrediction,
    environmentalImpact,
    generateOptimizationSuggestions,
    predictEnergyConsumption,
    analyzeEnvironmentalImpact
  } = useAIOptimization({
    enableRealTimeOptimization: true,
    enableEnergyPrediction: true,
    enableEnvironmentalAnalysis: true,
    confidenceThreshold: 0.7
  });

  // Generate suggestions when inputs change
  useEffect(() => {
    if (isInitialized && calculationInputs && calculationResults) {
      generateOptimizationSuggestions(calculationInputs, calculationResults, buildingContext);
    }
  }, [isInitialized, calculationInputs, calculationResults, buildingContext, generateOptimizationSuggestions]);

  // Generate energy prediction and environmental analysis
  useEffect(() => {
    if (isInitialized && calculationInputs) {
      const mockHVACSystem = {
        id: 'current_system',
        type: 'duct_system',
        efficiency: calculationResults?.isOptimal ? 0.85 : 0.75,
        capacity: calculationInputs.airflow
      };

      const mockEnvironmentalData = {
        outdoorTemperature: Array(24).fill(75),
        humidity: Array(24).fill(45),
        solarRadiation: Array(24).fill(500),
        windSpeed: Array(24).fill(5),
        season: 'summer' as const,
        climate: 'temperate'
      };

      predictEnergyConsumption(mockHVACSystem, mockEnvironmentalData, 24);
      
      if (energyPrediction) {
        analyzeEnvironmentalImpact(mockHVACSystem, energyPrediction);
      }
    }
  }, [isInitialized, calculationInputs, calculationResults, predictEnergyConsumption, analyzeEnvironmentalImpact, energyPrediction]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'efficiency': return <Zap className="h-4 w-4" />;
      case 'cost': return <DollarSign className="h-4 w-4" />;
      case 'environmental': return <Leaf className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'complex': return 'bg-red-50 text-red-700';
      case 'moderate': return 'bg-yellow-50 text-yellow-700';
      case 'simple': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (!isInitialized && !error) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 animate-spin" />
            Initializing AI Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Loading AI models for optimization analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-yellow-200 bg-yellow-50`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            AI Optimization Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            AI optimization features are currently unavailable. Using fallback optimization suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          AI-Powered Optimization
        </CardTitle>
        <p className="text-sm text-gray-600">
          Intelligent suggestions to improve your HVAC system design
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="energy" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Energy
            </TabsTrigger>
            <TabsTrigger value="environmental" className="flex items-center gap-1">
              <Leaf className="h-4 w-4" />
              Environmental
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-gray-600">
                  <Settings className="h-4 w-4 animate-spin" />
                  Analyzing system for optimization opportunities...
                </div>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">Your current design is well optimized!</p>
                <p className="text-sm text-gray-500">No significant improvements detected.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={getImpactColor(suggestion.impact)}
                            >
                              {suggestion.impact} impact
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={getComplexityColor(suggestion.implementationComplexity)}
                            >
                              {suggestion.implementationComplexity}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {suggestion.description}
                          </p>

                          {suggestion.estimatedSavings && (
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                              {suggestion.estimatedSavings.energy && (
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {suggestion.estimatedSavings.energy}% energy
                                </span>
                              )}
                              {suggestion.estimatedSavings.cost && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${suggestion.estimatedSavings.cost}/year
                                </span>
                              )}
                              {suggestion.estimatedSavings.emissions && (
                                <span className="flex items-center gap-1">
                                  <Leaf className="h-3 w-3" />
                                  {suggestion.estimatedSavings.emissions}kg CO₂/year
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                              {suggestion.applicableToCurrentCalculation && (
                                <Badge variant="outline" className="text-xs">
                                  Applicable Now
                                </Badge>
                              )}
                            </div>
                            
                            {onApplySuggestion && suggestion.applicableToCurrentCalculation && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onApplySuggestion(suggestion)}
                                className="text-xs"
                              >
                                Apply Suggestion
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="energy" className="space-y-4">
            {energyPrediction ? (
              <div>
                <h4 className="font-medium mb-3">24-Hour Energy Consumption Forecast</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-6 gap-2 text-xs">
                    {energyPrediction.slice(0, 24).map((consumption, index) => (
                      <div key={index} className="text-center">
                        <div className="text-gray-500">{index}:00</div>
                        <div className="font-medium">{consumption.toFixed(1)} kWh</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span>Total Daily Consumption:</span>
                      <span className="font-medium">
                        {energyPrediction.slice(0, 24).reduce((sum, val) => sum + val, 0).toFixed(1)} kWh
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Peak Hour:</span>
                      <span className="font-medium">
                        {energyPrediction.indexOf(Math.max(...energyPrediction.slice(0, 24)))}:00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Energy prediction data not available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="environmental" className="space-y-4">
            {environmentalImpact ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Carbon Footprint</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {environmentalImpact.carbonFootprint.toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-700">kg CO₂ annually</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Sustainability Score</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {Math.round(environmentalImpact.sustainabilityScore * 100)}%
                    </div>
                    <div className="text-xs text-green-700">Overall rating</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Environmental Recommendations</h4>
                  <div className="space-y-2">
                    {environmentalImpact.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Leaf className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Leaf className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Environmental analysis not available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
