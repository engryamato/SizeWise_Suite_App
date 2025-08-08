/**
 * AI-Powered Suggestions Integration Example
 * SizeWise Suite - AI-Powered Suggestions System
 * 
 * Comprehensive example showing how to integrate AI-powered design suggestions
 * with the snap logic system for professional HVAC design optimization.
 * Demonstrates ML model integration, training data pipeline, and real-time
 * suggestion generation for engineering-grade design assistance.
 * 
 * @fileoverview AI-powered suggestions integration example
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  DesignSuggestions,
  MLArchitecture,
  TrainingDataPipeline,
  SuggestionType,
  ConfidenceLevel,
  MLModelType,
  TrainingDataCategory,
  DataSourceType
} from '@/lib/snap-logic';
import { 
  SuggestionContext,
  AISuggestionResult,
  DesignSuggestionsConfig
} from '@/lib/snap-logic';
import { DuctShape } from '@/lib/snap-logic';
import { Centerline } from '@/types/air-duct-sizer';

/**
 * Example component showing comprehensive AI-powered suggestions integration
 */
export const AIPoweredSuggestionsExample: React.FC = () => {
  const [designSuggestions, setDesignSuggestions] = useState<DesignSuggestions | null>(null);
  const [mlArchitecture, setMLArchitecture] = useState<MLArchitecture | null>(null);
  const [trainingPipeline, setTrainingPipeline] = useState<TrainingDataPipeline | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestionResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestionTypes, setSelectedSuggestionTypes] = useState<SuggestionType[]>([
    SuggestionType.LAYOUT_OPTIMIZATION,
    SuggestionType.DUCT_SIZING,
    SuggestionType.EFFICIENCY_ENHANCEMENT
  ]);

  // Initialize AI systems
  useEffect(() => {
    const mlArch = new MLArchitecture();
    const trainPipeline = new TrainingDataPipeline();
    const designSugg = new DesignSuggestions({
      enabledSuggestionTypes: selectedSuggestionTypes,
      confidenceThreshold: 0.7,
      maxSuggestions: 8,
      realTimeUpdates: true
    }, mlArch, trainPipeline);

    setMLArchitecture(mlArch);
    setTrainingPipeline(trainPipeline);
    setDesignSuggestions(designSugg);
  }, [selectedSuggestionTypes]);

  // Example design context
  const exampleContext: SuggestionContext = {
    currentDesign: {
      centerlines: [
        {
          id: 'main_trunk_1',
          type: 'straight',
          points: [{ x: 0, y: 0 }, { x: 200, y: 0 }]
        },
        {
          id: 'branch_1',
          type: 'arc',
          points: [{ x: 100, y: 0 }, { x: 125, y: 25 }, { x: 150, y: 50 }],
          radius: 15
        },
        {
          id: 'return_duct',
          type: 'straight',
          points: [{ x: 200, y: 100 }, { x: 0, y: 100 }]
        }
      ] as Centerline[],
      ductDimensions: [
        { width: 24, height: 12 },
        { width: 16, height: 10 },
        { width: 20, height: 14 }
      ],
      ductShapes: [DuctShape.RECTANGULAR, DuctShape.RECTANGULAR, DuctShape.RECTANGULAR],
      airflows: [2000, 800, 1500]
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
      spaceConstraints: [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 150, y: 150 },
        { x: 50, y: 150 }
      ],
      accessibilityRequirements: ['ADA_compliant', 'maintenance_access']
    },
    preferences: {
      prioritizeEfficiency: true,
      prioritizeCost: false,
      prioritizeCompliance: true,
      prioritizeSimplicity: false
    }
  };

  // Generate AI suggestions
  const generateSuggestions = useCallback(async () => {
    if (!designSuggestions) return;

    setIsGenerating(true);
    try {
      const results = await designSuggestions.generateSuggestions(exampleContext);
      setSuggestions(results);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [designSuggestions]);

  // Handle suggestion feedback
  const handleSuggestionFeedback = useCallback((
    suggestionId: string,
    helpful: boolean,
    implemented: boolean,
    rating: number
  ) => {
    if (!designSuggestions) return;

    designSuggestions.recordFeedback(suggestionId, {
      helpful,
      implemented,
      rating,
      comments: helpful ? 'Useful suggestion' : 'Not applicable to current design'
    });
  }, [designSuggestions]);

  // Update suggestion types
  const updateSuggestionTypes = useCallback((types: SuggestionType[]) => {
    setSelectedSuggestionTypes(types);
    if (designSuggestions) {
      designSuggestions.updateConfig({ enabledSuggestionTypes: types });
    }
  }, [designSuggestions]);

  // Get confidence color
  const getConfidenceColor = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case ConfidenceLevel.HIGH: return 'text-green-800 bg-green-100';
      case ConfidenceLevel.MEDIUM: return 'text-yellow-800 bg-yellow-100';
      case ConfidenceLevel.LOW: return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  // Get suggestion type color
  const getSuggestionTypeColor = (type: SuggestionType) => {
    const colors = {
      [SuggestionType.LAYOUT_OPTIMIZATION]: 'bg-blue-100 text-blue-800',
      [SuggestionType.DUCT_SIZING]: 'bg-purple-100 text-purple-800',
      [SuggestionType.ROUTING_IMPROVEMENT]: 'bg-indigo-100 text-indigo-800',
      [SuggestionType.EFFICIENCY_ENHANCEMENT]: 'bg-green-100 text-green-800',
      [SuggestionType.COMPLIANCE_CORRECTION]: 'bg-red-100 text-red-800',
      [SuggestionType.COST_REDUCTION]: 'bg-orange-100 text-orange-800',
      [SuggestionType.PATTERN_RECOGNITION]: 'bg-pink-100 text-pink-800',
      [SuggestionType.BEST_PRACTICES]: 'bg-cyan-100 text-cyan-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI-Powered Design Suggestions Example</h1>
      
      {/* Configuration Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">AI Configuration</h2>
        
        {/* Suggestion Types Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enabled Suggestion Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.values(SuggestionType).map(type => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedSuggestionTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateSuggestionTypes([...selectedSuggestionTypes, type]);
                    } else {
                      updateSuggestionTypes(selectedSuggestionTypes.filter(t => t !== type));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-xs">{type.replace('_', ' ').toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border">
            <h3 className="font-medium text-sm mb-2">ML Architecture</h3>
            <div className="text-xs text-gray-600">
              <div>Status: {mlArchitecture ? '✅ Active' : '❌ Not initialized'}</div>
              {mlArchitecture && (
                <div>Models: {mlArchitecture.getSupportedModelTypes().length}</div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <h3 className="font-medium text-sm mb-2">Training Pipeline</h3>
            <div className="text-xs text-gray-600">
              <div>Status: {trainingPipeline ? '✅ Active' : '❌ Not initialized'}</div>
              {trainingPipeline && (
                <div>Categories: {trainingPipeline.getTrainingDataCategories().length}</div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <h3 className="font-medium text-sm mb-2">Design Suggestions</h3>
            <div className="text-xs text-gray-600">
              <div>Status: {designSuggestions ? '✅ Active' : '❌ Not initialized'}</div>
              {designSuggestions && (
                <div>Generated: {suggestions.length}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Example Design Context */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Example Design Context</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Building Context</h3>
            <div className="space-y-1 text-gray-600">
              <div>Type: {exampleContext.buildingContext.buildingType}</div>
              <div>Area: {exampleContext.buildingContext.floorArea.toLocaleString()} sq ft</div>
              <div>Height: {exampleContext.buildingContext.ceilingHeight} ft</div>
              <div>Occupancy: {exampleContext.buildingContext.occupancy} people</div>
              <div>Climate: Zone {exampleContext.buildingContext.climateZone}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Current Design</h3>
            <div className="space-y-1 text-gray-600">
              <div>Centerlines: {exampleContext.currentDesign.centerlines.length}</div>
              <div>Total Airflow: {exampleContext.currentDesign.airflows.reduce((a, b) => a + b, 0).toLocaleString()} CFM</div>
              <div>Duct Shapes: {exampleContext.currentDesign.ductShapes.length} rectangular</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Constraints</h3>
            <div className="space-y-1 text-gray-600">
              <div>Max Pressure Drop: {exampleContext.constraints.maxPressureDrop}{"\""} w.g.</div>
              <div>Max Velocity: {exampleContext.constraints.maxVelocity.toLocaleString()} fpm</div>
              <div>Budget: ${exampleContext.constraints.budgetLimit.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Suggestions */}
      <div className="mb-6">
        <button
          type="button"
          onClick={generateSuggestions}
          disabled={isGenerating || !designSuggestions}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-medium"
        >
          {isGenerating ? 'Generating AI Suggestions...' : 'Generate AI Suggestions'}
        </button>
      </div>

      {/* AI Suggestions Results */}
      {suggestions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">AI-Generated Suggestions</h2>
          
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Suggestion Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSuggestionTypeColor(suggestion.type)}`}>
                      {suggestion.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {suggestion.confidence.toUpperCase()} ({(suggestion.confidenceScore * 100).toFixed(0)}%)
                    </span>
                    <span className="text-xs text-gray-500">
                      Difficulty: {suggestion.implementation.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                  <p className="text-gray-600 mt-1">{suggestion.description}</p>
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">+{suggestion.impact.energyEfficiency}%</div>
                  <div className="text-xs text-green-800">Energy Efficiency</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">+{suggestion.impact.costSavings}%</div>
                  <div className="text-xs text-blue-800">Cost Savings</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-lg font-bold text-purple-600">+{suggestion.impact.complianceImprovement}%</div>
                  <div className="text-xs text-purple-800">Compliance</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-lg font-bold text-orange-600">{suggestion.impact.installationComplexity > 0 ? '+' : ''}{suggestion.impact.installationComplexity}%</div>
                  <div className="text-xs text-orange-800">Complexity</div>
                </div>
                <div className="text-center p-3 bg-cyan-50 rounded">
                  <div className="text-lg font-bold text-cyan-600">+{suggestion.impact.maintenanceReduction}%</div>
                  <div className="text-xs text-cyan-800">Maintenance</div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">AI Reasoning</h4>
                <ul className="space-y-1">
                  {suggestion.reasoning.map((reason, rIndex) => (
                    <li key={rIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Implementation Guide */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Implementation ({suggestion.implementation.estimatedTime}h estimated)</h4>
                <ol className="space-y-1">
                  {suggestion.implementation.stepByStepGuide.map((step, sIndex) => (
                    <li key={sIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-gray-400 mr-2 font-medium">{sIndex + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Validation Requirements */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Validation Requirements</h4>
                <div className="flex space-x-4 text-sm">
                  <span className={`px-2 py-1 rounded ${suggestion.validation.smacnaCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    SMACNA: {suggestion.validation.smacnaCompliant ? 'Compliant' : 'Review Required'}
                  </span>
                  <span className={`px-2 py-1 rounded ${suggestion.validation.engineerReviewRequired ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    Engineer Review: {suggestion.validation.engineerReviewRequired ? 'Required' : 'Not Required'}
                  </span>
                  <span className={`px-2 py-1 rounded ${suggestion.validation.simulationRecommended ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    Simulation: {suggestion.validation.simulationRecommended ? 'Recommended' : 'Optional'}
                  </span>
                </div>
              </div>

              {/* Feedback Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Generated by {suggestion.mlPrediction.metadata.modelVersion} • 
                  Inference time: {suggestion.mlPrediction.metadata.inferenceTime}ms
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSuggestionFeedback(suggestion.id, true, false, 4)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                  >
                    👍 Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSuggestionFeedback(suggestion.id, false, false, 2)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                  >
                    👎 Not Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSuggestionFeedback(suggestion.id, true, true, 5)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                  >
                    ✅ Implemented
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Statistics */}
          {designSuggestions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">AI System Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {(() => {
                  const stats = designSuggestions.getSuggestionStatistics();
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{suggestions.length}</div>
                        <div className="text-gray-600">Suggestions Generated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{(stats.averageConfidence * 100).toFixed(0)}%</div>
                        <div className="text-gray-600">Average Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{stats.feedbackCount}</div>
                        <div className="text-gray-600">Feedback Received</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{stats.averageRating.toFixed(1)}/5</div>
                        <div className="text-gray-600">Average Rating</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIPoweredSuggestionsExample;
