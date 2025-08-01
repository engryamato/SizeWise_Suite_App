'use client';

/**
 * Fitting Selector Component
 * UI for selecting fitting type, size, gauge, and material
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FittingType, 
  ElbowParams, 
  TransitionParams,
  StandardDuctSize,
  StandardElbowAngle,
  STANDARD_DUCT_SIZES,
  STANDARD_ELBOW_ANGLES
} from '../../lib/3d-fittings/fitting-interfaces';
import {
  MaterialType,
  GaugeType,
  AVAILABLE_MATERIALS,
  AVAILABLE_GAUGES,
  MATERIAL_DISPLAY_NAMES,
  getRecommendedGauge,
  getAvailableGaugesForMaterial
} from '../../lib/3d-fittings/smacna-gauge-tables';
import {
  filterMaterialsForApplication,
  filterGaugesForMaterial,
  validateMaterialGaugeCombination,
  getRecommendedCombination,
  FilterOptions
} from '../../lib/3d-fittings/smacna-filtering';

interface FittingSelectorProps {
  onFittingGenerate: (type: FittingType, params: any) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FittingSelector({ 
  onFittingGenerate, 
  onValidationChange,
  disabled = false,
  className = '' 
}: FittingSelectorProps) {
  const [selectedType, setSelectedType] = useState<FittingType>(FittingType.ELBOW);
  const [material, setMaterial] = useState<MaterialType>('galvanized_steel');
  const [gauge, setGauge] = useState<GaugeType>('26');
  
  // Elbow parameters
  const [elbowDiameter, setElbowDiameter] = useState<number>(12);
  const [elbowBendRadius, setElbowBendRadius] = useState<number>(18);
  const [elbowAngle, setElbowAngle] = useState<number>(90);
  
  // Transition parameters
  const [transitionInletDiameter, setTransitionInletDiameter] = useState<number>(12);
  const [transitionOutletDiameter, setTransitionOutletDiameter] = useState<number>(8);
  const [transitionLength, setTransitionLength] = useState<number>(12);
  const [transitionType, setTransitionType] = useState<'concentric' | 'eccentric'>('concentric');

  // Available gauges for selected material with SMACNA filtering
  const availableGauges = useMemo(() => {
    const diameter = selectedType === FittingType.ELBOW
      ? elbowDiameter
      : Math.max(transitionInletDiameter, transitionOutletDiameter);

    const filterOptions: FilterOptions = {
      diameter,
      application: 'standard',
      includeNonStandard: false
    };

    const filteredGauges = filterGaugesForMaterial(material, filterOptions);
    return filteredGauges.map(fg => fg.gauge);
  }, [material, selectedType, elbowDiameter, transitionInletDiameter, transitionOutletDiameter]);

  // Enhanced gauge recommendation with validation
  const gaugeRecommendation = useMemo(() => {
    const diameter = selectedType === FittingType.ELBOW
      ? elbowDiameter
      : Math.max(transitionInletDiameter, transitionOutletDiameter);

    const filterOptions: FilterOptions = {
      diameter,
      application: 'standard'
    };

    const validation = validateMaterialGaugeCombination(material, gauge, filterOptions);
    const smacnaRec = getRecommendedGauge(diameter, material);

    return {
      ...smacnaRec,
      validation,
      isCurrentValid: validation.isValid,
      isCurrentRecommended: validation.isRecommended
    };
  }, [selectedType, elbowDiameter, transitionInletDiameter, transitionOutletDiameter, material, gauge]);

  // Enhanced validation with SMACNA compliance
  const validation = useMemo(() => {
    const errors: string[] = [];

    // Basic parameter validation
    if (selectedType === FittingType.ELBOW) {
      if (elbowDiameter <= 0) errors.push('Diameter must be greater than 0');
      if (elbowBendRadius <= 0) errors.push('Bend radius must be greater than 0');
      if (elbowAngle <= 0 || elbowAngle > 180) errors.push('Angle must be between 0 and 180 degrees');
    } else if (selectedType === FittingType.TRANSITION) {
      if (transitionInletDiameter <= 0) errors.push('Inlet diameter must be greater than 0');
      if (transitionOutletDiameter <= 0) errors.push('Outlet diameter must be greater than 0');
      if (transitionLength <= 0) errors.push('Length must be greater than 0');
      if (transitionInletDiameter === transitionOutletDiameter) {
        errors.push('Inlet and outlet diameters should be different for transitions');
      }
    }

    // SMACNA compliance validation
    if (gaugeRecommendation?.validation) {
      errors.push(...gaugeRecommendation.validation.errors);
    }
    
    return { isValid: errors.length === 0, errors };
  }, [selectedType, elbowDiameter, elbowBendRadius, elbowAngle, transitionInletDiameter, transitionOutletDiameter, transitionLength]);

  // Update validation callback
  React.useEffect(() => {
    onValidationChange?.(validation.isValid, validation.errors);
  }, [validation, onValidationChange]);

  // Handle material change
  const handleMaterialChange = useCallback((newMaterial: MaterialType) => {
    setMaterial(newMaterial);
    
    // Reset gauge to first available for new material
    const newAvailableGauges = getAvailableGaugesForMaterial(newMaterial);
    if (newAvailableGauges.length > 0 && !newAvailableGauges.includes(gauge)) {
      setGauge(newAvailableGauges[0]);
    }
  }, [gauge]);

  // Generate fitting
  const handleGenerate = useCallback(() => {
    if (!validation.isValid || disabled) return;

    let params: any;
    
    if (selectedType === FittingType.ELBOW) {
      params = {
        diameter: elbowDiameter,
        bendRadius: elbowBendRadius,
        angle: elbowAngle,
        material,
        gauge
      } as ElbowParams;
    } else if (selectedType === FittingType.TRANSITION) {
      params = {
        inletDiameter: transitionInletDiameter,
        outletDiameter: transitionOutletDiameter,
        length: transitionLength,
        type: transitionType,
        material,
        gauge
      } as TransitionParams;
    }

    onFittingGenerate(selectedType, params);
  }, [
    validation.isValid, disabled, selectedType, material, gauge,
    elbowDiameter, elbowBendRadius, elbowAngle,
    transitionInletDiameter, transitionOutletDiameter, transitionLength, transitionType,
    onFittingGenerate
  ]);

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle>Fitting Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fitting Type Selection */}
        <div className="space-y-2">
          <Label>Fitting Type</Label>
          <SelectTrigger value={selectedType} onValueChange={(value) => setSelectedType(value as FittingType)}>
            <SelectItem value={FittingType.ELBOW}>Elbow</SelectItem>
            <SelectItem value={FittingType.TRANSITION}>Transition</SelectItem>
            <SelectItem value={FittingType.REDUCER}>Reducer</SelectItem>
          </SelectTrigger>
        </div>

        {/* Material and Gauge Selection */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Material</Label>
            <SelectTrigger value={material} onValueChange={(value) => handleMaterialChange(value as MaterialType)}>
              {AVAILABLE_MATERIALS.map((mat) => (
                <SelectItem key={mat} value={mat}>
                  {MATERIAL_DISPLAY_NAMES[mat]}
                </SelectItem>
              ))}
            </SelectTrigger>
          </div>
          
          <div className="space-y-2">
            <Label>Gauge</Label>
            <SelectTrigger value={gauge} onValueChange={(value) => setGauge(value as GaugeType)}>
              {availableGauges.map((g) => (
                <SelectItem key={g} value={g}>
                  {g} ga
                </SelectItem>
              ))}
            </SelectTrigger>
          </div>
        </div>

        {/* Enhanced Gauge Recommendation with Validation */}
        {gaugeRecommendation && (
          <div className="space-y-2">
            {/* SMACNA Recommendation */}
            <Alert variant={gaugeRecommendation.isCurrentRecommended ? "default" : "destructive"}>
              <AlertDescription>
                SMACNA recommends {gaugeRecommendation.recommended} gauge
                (minimum {gaugeRecommendation.minimum}) for this diameter.
                {gauge !== gaugeRecommendation.recommended && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto ml-2"
                    onClick={() => setGauge(gaugeRecommendation.recommended)}
                  >
                    Use recommended
                  </Button>
                )}
              </AlertDescription>
            </Alert>

            {/* Validation Warnings */}
            {gaugeRecommendation.validation?.warnings.length > 0 && (
              <Alert variant="warning">
                <AlertDescription>
                  <div className="space-y-1">
                    {gaugeRecommendation.validation.warnings.map((warning, index) => (
                      <div key={index} className="text-sm">{warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Suggestions */}
            {gaugeRecommendation.validation?.suggestions.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Suggestions:</div>
                    {gaugeRecommendation.validation.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm">{suggestion}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Fitting-Specific Parameters */}
        <Tabs value={selectedType} className="w-full">
          <TabsContent value={FittingType.ELBOW} className="space-y-4">
            <div className="space-y-2">
              <Label>Diameter (inches)</Label>
              <SelectTrigger
                value={elbowDiameter.toString()}
                onValueChange={(value) => setElbowDiameter(Number(value))}
              >
                {STANDARD_DUCT_SIZES.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}&quot;
                  </SelectItem>
                ))}
              </SelectTrigger>
            </div>
            
            <div className="space-y-2">
              <Label>Bend Radius (inches)</Label>
              <Input
                type="number"
                value={elbowBendRadius}
                onChange={(e) => setElbowBendRadius(Number(e.target.value))}
                min="1"
                step="0.5"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Angle (degrees)</Label>
              <SelectTrigger
                value={elbowAngle.toString()}
                onValueChange={(value) => setElbowAngle(Number(value))}
              >
                {STANDARD_ELBOW_ANGLES.map((angle) => (
                  <SelectItem key={angle} value={angle.toString()}>
                    {angle}°
                  </SelectItem>
                ))}
              </SelectTrigger>
            </div>
          </TabsContent>

          <TabsContent value={FittingType.TRANSITION} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Inlet Diameter</Label>
                <SelectTrigger
                  value={transitionInletDiameter.toString()}
                  onValueChange={(value) => setTransitionInletDiameter(Number(value))}
                >
                  {STANDARD_DUCT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}&quot;
                    </SelectItem>
                  ))}
                </SelectTrigger>
              </div>
              
              <div className="space-y-2">
                <Label>Outlet Diameter</Label>
                <SelectTrigger
                  value={transitionOutletDiameter.toString()}
                  onValueChange={(value) => setTransitionOutletDiameter(Number(value))}
                >
                  {STANDARD_DUCT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}&quot;
                    </SelectItem>
                  ))}
                </SelectTrigger>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Length (inches)</Label>
              <Input
                type="number"
                value={transitionLength}
                onChange={(e) => setTransitionLength(Number(e.target.value))}
                min="1"
                step="0.5"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <SelectTrigger value={transitionType} onValueChange={(value) => setTransitionType(value as 'concentric' | 'eccentric')}>
                <SelectItem value="concentric">Concentric</SelectItem>
                <SelectItem value="eccentric">Eccentric</SelectItem>
              </SelectTrigger>
            </div>
          </TabsContent>
        </Tabs>

        {/* Validation Errors */}
        {!validation.isValid && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate}
          disabled={!validation.isValid || disabled}
          className="w-full"
        >
          Generate Fitting
        </Button>
      </CardContent>
    </Card>
  );
}
