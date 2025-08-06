/**
 * Fitting Confirmation Dialog Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * User confirmation dialogs for fitting suggestions with visual previews,
 * alternative options, and detailed fabrication notes. Provides comprehensive
 * fitting selection interface with cost estimates and timeline information.
 * 
 * @fileoverview Fitting confirmation dialog with visual previews and alternatives
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  DollarSign, 
  Wrench, 
  Eye, 
  RotateCcw,
  Zap,
  Shield,
  TrendingUp,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FittingRecommendation, ComplexFittingSolution } from '@/lib/snap-logic';

/**
 * Fitting confirmation dialog props
 */
interface FittingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFitting: FittingRecommendation | ComplexFittingSolution) => void;
  onCancel: () => void;
  
  // Fitting data
  primaryRecommendation: FittingRecommendation | ComplexFittingSolution;
  alternativeRecommendations?: (FittingRecommendation | ComplexFittingSolution)[];
  
  // Context information
  intersectionInfo: {
    branchCount: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    location: { x: number; y: number };
    systemPressure: 'low' | 'medium' | 'high';
  };
  
  // Configuration
  showVisualPreview?: boolean;
  showAlternatives?: boolean;
  showFabricationDetails?: boolean;
  showCostEstimates?: boolean;
  allowCustomization?: boolean;
}

/**
 * Fitting preview component
 */
interface FittingPreviewProps {
  fitting: FittingRecommendation | ComplexFittingSolution;
  isSelected?: boolean;
  onSelect?: () => void;
  showDetails?: boolean;
}

const FittingPreview: React.FC<FittingPreviewProps> = ({
  fitting,
  isSelected = false,
  onSelect,
  showDetails = true
}) => {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isComplexSolution = 'components' in fitting;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-blue-500 shadow-lg"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{fitting.name}</CardTitle>
            <CardDescription className="mt-1">{fitting.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant="secondary" 
              className={getComplexityColor(
                isComplexSolution ? fitting.fabrication.complexity : fitting.specifications.fabricationComplexity
              )}
            >
              {isComplexSolution ? fitting.fabrication.complexity : fitting.specifications.fabricationComplexity}
            </Badge>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">Confidence:</span>
              <span className={cn("text-sm font-medium", getConfidenceColor(fitting.confidence))}>
                {(fitting.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          {/* Visual Preview Placeholder */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-center min-h-[120px]">
            <div className="text-center">
              <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Visual Preview</p>
              <p className="text-xs text-gray-400">{fitting.type}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-700">
                {isComplexSolution ? fitting.performance.totalPressureLoss.toFixed(2) : fitting.performance.pressureLoss.toFixed(2)}
              </div>
              <div className="text-xs text-blue-600">Pressure Loss (in. w.g.)</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-700">
                {isComplexSolution ? fitting.performance.energyEfficiency.toFixed(0) : '85'}%
              </div>
              <div className="text-xs text-green-600">Efficiency</div>
            </div>
          </div>

          {/* Fabrication Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fabrication Time:</span>
              <span className="font-medium">
                {isComplexSolution ? fitting.fabrication.fabricationTime : fitting.fabrication.fabricationTime} days
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Estimated Cost:</span>
              <span className="font-medium">
                {isComplexSolution ? fitting.fabrication.estimatedCost.toFixed(1) : fitting.fabrication.estimatedCost.toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">SMACNA Compliant:</span>
              <span className={cn(
                "font-medium",
                fitting.compliance.smacnaCompliant ? "text-green-600" : "text-red-600"
              )}>
                {fitting.compliance.smacnaCompliant ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Fabrication details component
 */
interface FabricationDetailsProps {
  fitting: FittingRecommendation | ComplexFittingSolution;
}

const FabricationDetails: React.FC<FabricationDetailsProps> = ({ fitting }) => {
  const isComplexSolution = 'components' in fitting;
  const fabrication = fitting.fabrication;

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Fabrication Timeline
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Estimated Duration:</span>
            <span className="font-medium">{fabrication.fabricationTime} days</span>
          </div>
          <Progress value={75} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Start</span>
            <span>75% typical completion</span>
            <span>Finish</span>
          </div>
        </div>
      </div>

      {/* Materials */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Materials Required
        </h4>
        <div className="space-y-2">
          {isComplexSolution && fabrication.materialRequirements ? (
            fabrication.materialRequirements.map((material, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{material.material}</span>
                <span className="text-sm font-medium">{material.quantity} {material.unit}</span>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Sheet Metal (22 gauge)</span>
                <span className="text-sm font-medium">15 sq ft</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Reinforcement Strips</span>
                <span className="text-sm font-medium">4 pieces</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tools */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Tools Required
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {(isComplexSolution ? fabrication.toolingRequired : fitting.fabrication.toolingRequired || []).map((tool, index) => (
            <div key={index} className="p-2 bg-blue-50 rounded text-sm text-center">
              {tool}
            </div>
          ))}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Cost Estimate
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Materials:</span>
            <span className="font-medium">${(fabrication.estimatedCost * 100).toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Labor:</span>
            <span className="font-medium">${(fabrication.estimatedCost * 150).toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overhead:</span>
            <span className="font-medium">${(fabrication.estimatedCost * 50).toFixed(0)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between font-semibold">
            <span>Total Estimate:</span>
            <span>${(fabrication.estimatedCost * 300).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compliance information component
 */
interface ComplianceInfoProps {
  fitting: FittingRecommendation | ComplexFittingSolution;
}

const ComplianceInfo: React.FC<ComplianceInfoProps> = ({ fitting }) => {
  const compliance = fitting.compliance;

  return (
    <div className="space-y-4">
      {/* Compliance Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn(
          "p-3 rounded-lg border",
          compliance.smacnaCompliant ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-center gap-2 mb-1">
            {compliance.smacnaCompliant ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span className="font-medium">SMACNA Compliance</span>
          </div>
          <p className="text-sm text-gray-600">
            {compliance.smacnaCompliant ? "Meets all SMACNA standards" : "Requires review for compliance"}
          </p>
        </div>

        <div className={cn(
          "p-3 rounded-lg border",
          compliance.energyCompliant ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
        )}>
          <div className="flex items-center gap-2 mb-1">
            {compliance.energyCompliant ? (
              <Zap className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            )}
            <span className="font-medium">Energy Efficiency</span>
          </div>
          <p className="text-sm text-gray-600">
            {compliance.energyCompliant ? "Energy efficient design" : "Consider efficiency improvements"}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {fitting.warnings && fitting.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Warnings</span>
          </div>
          <ul className="space-y-1">
            {fitting.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-700">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {fitting.notes && fitting.notes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Engineering Notes</span>
          </div>
          <ul className="space-y-1">
            {fitting.notes.map((note, index) => (
              <li key={index} className="text-sm text-blue-700">• {note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Main fitting confirmation dialog component
 */
export const FittingConfirmationDialog: React.FC<FittingConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  primaryRecommendation,
  alternativeRecommendations = [],
  intersectionInfo,
  showVisualPreview = true,
  showAlternatives = true,
  showFabricationDetails = true,
  showCostEstimates = true,
  allowCustomization = false
}) => {
  const [selectedFitting, setSelectedFitting] = useState<FittingRecommendation | ComplexFittingSolution>(primaryRecommendation);
  const [activeTab, setActiveTab] = useState('overview');

  // Update selected fitting when primary recommendation changes
  useEffect(() => {
    setSelectedFitting(primaryRecommendation);
  }, [primaryRecommendation]);

  // All available fittings (primary + alternatives)
  const allFittings = useMemo(() => {
    return [primaryRecommendation, ...alternativeRecommendations];
  }, [primaryRecommendation, alternativeRecommendations]);

  const handleConfirm = () => {
    onConfirm(selectedFitting);
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'simple': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'moderate': return <Info className="w-4 h-4 text-yellow-600" />;
      case 'complex': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'expert': return <Shield className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getComplexityIcon(intersectionInfo.complexity)}
            Fitting Recommendation - {intersectionInfo.branchCount} Branch Intersection
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Location: ({intersectionInfo.location.x}, {intersectionInfo.location.y})</span>
            <span>System Pressure: {intersectionInfo.systemPressure}</span>
            <Badge variant="outline" className="capitalize">
              {intersectionInfo.complexity} Complexity
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alternatives" disabled={!showAlternatives || alternativeRecommendations.length === 0}>
                Alternatives ({alternativeRecommendations.length})
              </TabsTrigger>
              <TabsTrigger value="fabrication" disabled={!showFabricationDetails}>
                Fabrication
              </TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full">
                <ScrollArea className="h-[400px]">
                  <FittingPreview 
                    fitting={selectedFitting} 
                    isSelected={true}
                    showDetails={true}
                  />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="alternatives" className="h-full">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Compare alternative fitting solutions. Click to select a different option.
                    </p>
                    {allFittings.map((fitting, index) => (
                      <FittingPreview
                        key={`${fitting.type}-${index}`}
                        fitting={fitting}
                        isSelected={selectedFitting.id === fitting.id}
                        onSelect={() => setSelectedFitting(fitting)}
                        showDetails={false}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="fabrication" className="h-full">
                <ScrollArea className="h-[400px]">
                  <FabricationDetails fitting={selectedFitting} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="compliance" className="h-full">
                <ScrollArea className="h-[400px]">
                  <ComplianceInfo fitting={selectedFitting} />
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RotateCcw className="w-4 h-4" />
            <span>Selected: {selectedFitting.name}</span>
            <Badge variant="secondary" className="ml-2">
              {(selectedFitting.confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
              Confirm Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FittingConfirmationDialog;
