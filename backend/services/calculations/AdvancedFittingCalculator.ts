/**
 * Advanced Fitting Calculator for Phase 3 Duct Physics Implementation
 * 
 * This service extends the basic FittingLossCalculator with advanced capabilities including:
 * - Multi-parameter K-factor calculations
 * - Performance curve interpolation
 * - Interaction effects between adjacent fittings
 * - Method selection algorithms
 * - Complex fitting configurations
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import * as fs from 'fs';
import * as path from 'path';
import { FittingLossCalculator } from './FittingLossCalculator';
import {
  AdvancedFittingConfiguration,
  FlowConditions,
  SystemContext,
  AdvancedFittingLossResult,
  CalculationMethod,
  InteractionEffects,
  FittingInteraction,
  PerformanceMetrics,
  ValidationResults,
  ValidationError,
  ValidationWarning,
  ComplianceStatus,
  Recommendation,
  ParameterDependency,
  PerformanceCurve
} from './types/AdvancedFittingTypes';

export class AdvancedFittingCalculator extends FittingLossCalculator {
  private static advancedFittingsData: any = null;
  private static readonly DATA_FILE_PATH = path.join(__dirname, '../../data/advanced_fittings.json');

  /**
   * Load advanced fittings database
   */
  private static loadAdvancedFittingsData(): any {
    if (!this.advancedFittingsData) {
      try {
        const dataContent = fs.readFileSync(this.DATA_FILE_PATH, 'utf8');
        this.advancedFittingsData = JSON.parse(dataContent);
      } catch (error) {
        console.error('Error loading advanced fittings data:', error);
        throw new Error('Failed to load advanced fittings database');
      }
    }
    return this.advancedFittingsData;
  }

  /**
   * Calculate pressure loss for advanced fitting configurations
   */
  public static calculateAdvancedFittingLoss(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    systemContext?: SystemContext
  ): AdvancedFittingLossResult {
    
    // Validate configuration and conditions
    this.validateAdvancedConfiguration(config, flowConditions);
    
    // Select appropriate calculation method
    const method = this.selectCalculationMethod(config, flowConditions);
    
    // Calculate base pressure loss
    const baseLoss = this.calculateBasePressureLoss(config, flowConditions, method);
    
    // Apply correction factors
    const correctedLoss = this.applyCorrectionFactors(baseLoss, config, flowConditions);
    
    // Calculate interaction effects if system context provided
    const interactionEffects = systemContext 
      ? this.calculateInteractionEffects(config, systemContext)
      : this.getDefaultInteractionEffects();
    
    // Apply interaction effects
    const finalPressureLoss = correctedLoss * interactionEffects.totalInteractionFactor;
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(config, flowConditions, finalPressureLoss);
    
    // Validate results
    const validationResults = this.validateResults(config, flowConditions, finalPressureLoss);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(config, flowConditions, performanceMetrics, validationResults);
    
    // Generate comprehensive result
    return {
      pressureLoss: finalPressureLoss,
      velocityPressure: this.calculateVelocityPressure(flowConditions.velocity, flowConditions.airDensity),
      kFactor: finalPressureLoss / this.calculateVelocityPressure(flowConditions.velocity, flowConditions.airDensity),
      warnings: validationResults.warnings.map(w => w.message),
      calculationMethod: method,
      interactionEffects: interactionEffects,
      performanceMetrics: performanceMetrics,
      validationResults: validationResults,
      recommendations: recommendations
    };
  }

  /**
   * Select optimal calculation method based on fitting and flow conditions
   */
  private static selectCalculationMethod(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions
  ): CalculationMethod {
    
    // High Reynolds number flows - use CFD-derived data if available
    if (flowConditions.reynoldsNumber > 100000 && 
        config.pressureLossProfile.calculationMethod === CalculationMethod.CFD_DERIVED) {
      return CalculationMethod.CFD_DERIVED;
    }
    
    // Complex geometry fittings - use multi-parameter approach
    if (config.complexity === 'complex' && 
        config.pressureLossProfile.kFactorData.parameterDependencies.length > 0) {
      return CalculationMethod.MULTI_PARAMETER;
    }
    
    // Variable performance fittings - use performance curves
    if (config.complexity === 'variable' && 
        config.pressureLossProfile.performanceCurves && 
        config.pressureLossProfile.performanceCurves.length > 0) {
      return CalculationMethod.PERFORMANCE_CURVE;
    }
    
    // Default to single K-factor for simple fittings
    return CalculationMethod.SINGLE_K_FACTOR;
  }

  /**
   * Calculate base pressure loss using selected method
   */
  private static calculateBasePressureLoss(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    method: CalculationMethod
  ): number {
    
    const velocityPressure = this.calculateVelocityPressure(flowConditions.velocity, flowConditions.airDensity);
    
    switch (method) {
      case CalculationMethod.SINGLE_K_FACTOR:
        return this.calculateSingleKFactorLoss(config, velocityPressure);
        
      case CalculationMethod.MULTI_PARAMETER:
        return this.calculateMultiParameterLoss(config, flowConditions, velocityPressure);
        
      case CalculationMethod.PERFORMANCE_CURVE:
        return this.calculatePerformanceCurveLoss(config, flowConditions, velocityPressure);
        
      case CalculationMethod.CFD_DERIVED:
        return this.calculateCFDDerivedLoss(config, flowConditions, velocityPressure);
        
      default:
        throw new Error(`Unsupported calculation method: ${method}`);
    }
  }

  /**
   * Calculate single K-factor pressure loss
   */
  private static calculateSingleKFactorLoss(
    config: AdvancedFittingConfiguration,
    velocityPressure: number
  ): number {
    return config.pressureLossProfile.kFactorData.baseKFactor * velocityPressure;
  }

  /**
   * Calculate multi-parameter pressure loss
   */
  private static calculateMultiParameterLoss(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    velocityPressure: number
  ): number {
    
    let kFactor = config.pressureLossProfile.kFactorData.baseKFactor;
    
    // Apply parameter dependencies
    for (const dependency of config.pressureLossProfile.kFactorData.parameterDependencies) {
      const parameterValue = this.getParameterValue(dependency.parameter, config, flowConditions);
      const correction = this.calculateParameterCorrection(dependency, parameterValue);
      kFactor *= correction;
    }
    
    // Apply Reynolds number correction if enabled
    if (config.pressureLossProfile.kFactorData.reynoldsCorrection?.enabled) {
      const reynoldsCorrection = this.calculateReynoldsCorrection(
        config.pressureLossProfile.kFactorData.reynoldsCorrection,
        flowConditions.reynoldsNumber
      );
      kFactor *= reynoldsCorrection;
    }
    
    // Apply geometry corrections
    for (const correction of config.pressureLossProfile.kFactorData.geometryCorrections) {
      kFactor *= correction.correctionFactor;
    }
    
    return kFactor * velocityPressure;
  }

  /**
   * Calculate performance curve-based pressure loss
   */
  private static calculatePerformanceCurveLoss(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    velocityPressure: number
  ): number {
    
    if (!config.pressureLossProfile.performanceCurves || config.pressureLossProfile.performanceCurves.length === 0) {
      throw new Error('No performance curves available for fitting');
    }
    
    // Find the most appropriate performance curve
    const curve = this.selectPerformanceCurve(config.pressureLossProfile.performanceCurves, flowConditions);
    
    // Get parameter value for interpolation
    const parameterValue = this.getParameterValue(curve.parameter, config, flowConditions);
    
    // Interpolate pressure loss from curve
    const pressureLoss = this.interpolatePerformanceCurve(curve, parameterValue);
    
    return pressureLoss;
  }

  /**
   * Calculate CFD-derived pressure loss
   */
  private static calculateCFDDerivedLoss(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    velocityPressure: number
  ): number {
    
    // For CFD-derived data, use multi-parameter approach with higher accuracy
    return this.calculateMultiParameterLoss(config, flowConditions, velocityPressure);
  }

  /**
   * Calculate parameter correction factor
   */
  private static calculateParameterCorrection(
    dependency: ParameterDependency,
    parameterValue: number
  ): number {
    
    // Validate parameter is within valid range
    if (parameterValue < dependency.validRange[0] || parameterValue > dependency.validRange[1]) {
      console.warn(`Parameter ${dependency.parameter} value ${parameterValue} outside valid range [${dependency.validRange[0]}, ${dependency.validRange[1]}]`);
    }
    
    switch (dependency.relationship) {
      case 'linear':
        return dependency.coefficients[0] + dependency.coefficients[1] * parameterValue;
        
      case 'polynomial': {
        let result = 0;
        for (let i = 0; i < dependency.coefficients.length; i++) {
          result += dependency.coefficients[i] * Math.pow(parameterValue, i);
        }
        return result;
      }
        
      case 'exponential':
        return dependency.coefficients[0] * Math.exp(dependency.coefficients[1] * parameterValue);
        
      case 'lookup':
        // For lookup tables, would need additional data structure
        // For now, return base correction
        return 1.0;
        
      default:
        throw new Error(`Unsupported relationship type: ${dependency.relationship}`);
    }
  }

  /**
   * Get parameter value from configuration or flow conditions
   */
  private static getParameterValue(
    parameter: string,
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions
  ): number {
    
    switch (parameter) {
      case 'velocity':
        return flowConditions.velocity;
      case 'reynolds_number':
        return flowConditions.reynoldsNumber;
      case 'volume_flow':
        return flowConditions.volumeFlow;
      case 'temperature':
        return flowConditions.temperature;
      case 'pressure':
        return flowConditions.pressure;
      case 'length_to_diameter_ratio':
        return config.physicalProperties.dimensions.length / (config.physicalProperties.dimensions.inletDiameter || 12);
      case 'area_ratio': {
        const inletArea = Math.PI * Math.pow((config.physicalProperties.dimensions.inletDiameter || 12) / 2, 2);
        const outletArea = Math.PI * Math.pow((config.physicalProperties.dimensions.outletDiameter || 12) / 2, 2);
        return outletArea / inletArea;
      }
      case 'aspect_ratio':
        return config.physicalProperties.dimensions.width / config.physicalProperties.dimensions.height;
      default:
        console.warn(`Unknown parameter: ${parameter}, using default value 1.0`);
        return 1.0;
    }
  }

  /**
   * Calculate Reynolds number correction
   */
  private static calculateReynoldsCorrection(
    correction: any,
    reynoldsNumber: number
  ): number {
    
    if (reynoldsNumber < correction.validRange[0] || reynoldsNumber > correction.validRange[1]) {
      return 1.0; // No correction outside valid range
    }
    
    switch (correction.method) {
      case 'colebrook':
        // Simplified Colebrook-White correction
        return 1.0 + correction.coefficients[0] * Math.log10(reynoldsNumber) + correction.coefficients[1];
        
      case 'blasius':
        // Blasius equation correction
        return Math.pow(reynoldsNumber, correction.coefficients[0]) * correction.coefficients[1];
        
      case 'custom': {
        // Custom polynomial correction
        let result = 0;
        for (let i = 0; i < correction.coefficients.length; i++) {
          result += correction.coefficients[i] * Math.pow(reynoldsNumber, i);
        }
        return result;
      }
        
      default:
        return 1.0;
    }
  }

  /**
   * Select appropriate performance curve
   */
  private static selectPerformanceCurve(
    curves: PerformanceCurve[],
    flowConditions: FlowConditions
  ): PerformanceCurve {
    
    // For now, select the first available curve
    // In a more sophisticated implementation, would select based on current conditions
    return curves[0];
  }

  /**
   * Interpolate value from performance curve
   */
  private static interpolatePerformanceCurve(
    curve: PerformanceCurve,
    parameterValue: number
  ): number {
    
    const points = curve.dataPoints.sort((a, b) => a.x - b.x);
    
    // Check if value is outside curve range
    if (parameterValue <= points[0].x) {
      return points[0].y;
    }
    if (parameterValue >= points[points.length - 1].x) {
      if (curve.extrapolationAllowed) {
        // Simple linear extrapolation
        const lastTwo = points.slice(-2);
        const slope = (lastTwo[1].y - lastTwo[0].y) / (lastTwo[1].x - lastTwo[0].x);
        return lastTwo[1].y + slope * (parameterValue - lastTwo[1].x);
      } else {
        return points[points.length - 1].y;
      }
    }
    
    // Find surrounding points for interpolation
    for (let i = 0; i < points.length - 1; i++) {
      if (parameterValue >= points[i].x && parameterValue <= points[i + 1].x) {
        // Linear interpolation
        const ratio = (parameterValue - points[i].x) / (points[i + 1].x - points[i].x);
        return points[i].y + ratio * (points[i + 1].y - points[i].y);
      }
    }
    
    return points[0].y; // Fallback
  }

  /**
   * Apply correction factors to pressure loss
   */
  private static applyCorrectionFactors(
    baseLoss: number,
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions
  ): number {
    
    let correctedLoss = baseLoss;
    const corrections = config.pressureLossProfile.correctionFactors;
    
    // Temperature correction
    if (corrections.temperatureCorrection) {
      const tempCorrection = this.calculateTemperatureCorrection(flowConditions.temperature);
      correctedLoss *= tempCorrection;
    }
    
    // Density correction
    if (corrections.densityCorrection) {
      const densityCorrection = flowConditions.airDensity / 0.075; // Standard air density
      correctedLoss *= densityCorrection;
    }
    
    // Installation correction (simplified)
    if (corrections.installationCorrection) {
      correctedLoss *= 1.1; // 10% installation factor
    }
    
    return correctedLoss;
  }

  /**
   * Calculate temperature correction factor
   */
  private static calculateTemperatureCorrection(temperature: number): number {
    // Standard temperature is 70°F
    const standardTemp = 70;
    const tempRatio = (temperature + 459.67) / (standardTemp + 459.67); // Convert to absolute temperature
    return Math.sqrt(tempRatio);
  }

  /**
   * Calculate interaction effects between adjacent fittings
   */
  private static calculateInteractionEffects(
    config: AdvancedFittingConfiguration,
    systemContext: SystemContext
  ): InteractionEffects {
    
    const upstreamFittings = systemContext.getUpstreamFittings(config.id, 10); // 10 diameters
    const downstreamFittings = systemContext.getDownstreamFittings(config.id, 10);
    
    let interactionFactor = 1.0;
    const interactions: FittingInteraction[] = [];
    
    // Upstream interactions
    for (const upstream of upstreamFittings) {
      const interaction = this.calculateUpstreamInteraction(upstream, config);
      interactionFactor *= interaction.factor;
      interactions.push(interaction);
    }
    
    // Downstream interactions
    for (const downstream of downstreamFittings) {
      const interaction = this.calculateDownstreamInteraction(config, downstream);
      interactionFactor *= interaction.factor;
      interactions.push(interaction);
    }
    
    return {
      totalInteractionFactor: interactionFactor,
      individualInteractions: interactions,
      significantInteractions: interactions.filter(i => Math.abs(i.factor - 1.0) > 0.05)
    };
  }

  /**
   * Get default interaction effects when no system context provided
   */
  private static getDefaultInteractionEffects(): InteractionEffects {
    return {
      totalInteractionFactor: 1.0,
      individualInteractions: [],
      significantInteractions: []
    };
  }

  /**
   * Calculate upstream fitting interaction
   */
  private static calculateUpstreamInteraction(
    upstreamFitting: AdvancedFittingConfiguration,
    currentFitting: AdvancedFittingConfiguration
  ): FittingInteraction {
    
    // Simplified interaction calculation
    // In practice, would use more sophisticated models
    let factor = 1.0;
    let significance: 'low' | 'medium' | 'high' = 'low';
    
    // Check for known interaction effects
    for (const effect of currentFitting.compatibilityMatrix.interactionEffects) {
      if (effect.adjacentFittingType === upstreamFitting.type) {
        factor = effect.magnitude;
        if (effect.magnitude > 1.2) {
          significance = 'high';
        } else if (effect.magnitude > 1.1) {
          significance = 'medium';
        } else {
          significance = 'low';
        }
        break;
      }
    }
    
    return {
      adjacentFittingId: upstreamFitting.id,
      distance: 5, // Simplified distance
      factor: factor,
      type: 'upstream',
      significance: significance
    };
  }

  /**
   * Calculate downstream fitting interaction
   */
  private static calculateDownstreamInteraction(
    currentFitting: AdvancedFittingConfiguration,
    downstreamFitting: AdvancedFittingConfiguration
  ): FittingInteraction {

    // Downstream interactions typically have less effect
    return {
      adjacentFittingId: downstreamFitting.id,
      distance: 5,
      factor: 1.0, // Minimal downstream effect for most fittings
      type: 'downstream',
      significance: 'low'
    };
  }

  /**
   * Calculate performance metrics for the fitting
   */
  private static calculatePerformanceMetrics(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    pressureLoss: number
  ): PerformanceMetrics {

    const velocityPressure = this.calculateVelocityPressure(flowConditions.velocity, flowConditions.airDensity);

    // Calculate efficiency (inverse of pressure loss coefficient)
    const efficiency = Math.max(0, Math.min(100, 100 * (1 - pressureLoss / (velocityPressure * 5))));

    // Estimate noise generation based on velocity and fitting type
    const noiseGeneration = this.calculateNoiseGeneration(config, flowConditions);

    // Calculate energy loss
    const energyLoss = this.calculateEnergyLoss(flowConditions.volumeFlow, pressureLoss);

    // Calculate flow uniformity based on fitting characteristics
    const flowUniformity = config.flowCharacteristics.velocityProfile.uniformityIndex * 100;

    // Calculate pressure recovery
    const pressureRecovery = config.flowCharacteristics.turbulenceFactors.pressureRecoveryFactor * 100;

    return {
      efficiency: efficiency,
      noiseGeneration: noiseGeneration,
      energyLoss: energyLoss,
      flowUniformity: flowUniformity,
      pressureRecovery: pressureRecovery
    };
  }

  /**
   * Calculate noise generation for the fitting
   */
  private static calculateNoiseGeneration(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions
  ): number {

    // Base noise calculation using velocity and fitting characteristics
    const velocityNoise = 20 * Math.log10(flowConditions.velocity / 1000); // Reference 1000 FPM
    const turbulenceNoise = config.flowCharacteristics.turbulenceFactors.turbulenceIntensity * 0.5;
    let fittingNoise = 1;
    if (config.complexity === 'complex') {
      fittingNoise = 5;
    } else if (config.complexity === 'variable') {
      fittingNoise = 3;
    }

    return Math.max(0, velocityNoise + turbulenceNoise + fittingNoise);
  }

  /**
   * Calculate energy loss in BTU/hr
   */
  private static calculateEnergyLoss(volumeFlow: number, pressureLoss: number): number {
    // Energy loss = (CFM × Pressure Loss in in wg × 4.5) / Fan Efficiency
    // Assuming 70% fan efficiency
    const fanEfficiency = 0.70;
    return (volumeFlow * pressureLoss * 4.5) / fanEfficiency;
  }

  /**
   * Validate advanced configuration and flow conditions
   */
  private static validateAdvancedConfiguration(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions
  ): void {

    // Validate flow is within fitting's operating range
    const operatingRange = config.flowCharacteristics.operatingRange;
    if (flowConditions.volumeFlow < operatingRange.minimum ||
        flowConditions.volumeFlow > operatingRange.maximum) {
      throw new Error(`Flow ${flowConditions.volumeFlow} CFM outside fitting operating range [${operatingRange.minimum}, ${operatingRange.maximum}] CFM`);
    }

    // Validate velocity is reasonable
    if (flowConditions.velocity < 100 || flowConditions.velocity > 6000) {
      throw new Error(`Velocity ${flowConditions.velocity} FPM outside reasonable range [100, 6000] FPM`);
    }

    // Validate Reynolds number
    if (flowConditions.reynoldsNumber < 1000) {
      throw new Error(`Reynolds number ${flowConditions.reynoldsNumber} too low for turbulent flow calculations`);
    }
  }

  /**
   * Validate calculation results
   */
  private static validateResults(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    pressureLoss: number
  ): ValidationResults {

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for unreasonable pressure loss
    const velocityPressure = this.calculateVelocityPressure(flowConditions.velocity, flowConditions.airDensity);
    const kFactor = pressureLoss / velocityPressure;

    if (kFactor > 10) {
      errors.push({
        code: 'E001',
        message: 'Pressure loss coefficient unreasonably high',
        parameter: 'k_factor',
        value: kFactor
      });
    }

    if (kFactor < 0) {
      errors.push({
        code: 'E002',
        message: 'Negative pressure loss calculated',
        parameter: 'pressure_loss',
        value: pressureLoss
      });
    }

    // Apply validation rules from configuration
    for (const rule of config.validationRules) {
      const parameterValue = this.getParameterValue(rule.condition.parameter, config, flowConditions);
      const isViolated = this.checkValidationCondition(rule.condition, parameterValue);

      if (isViolated) {
        if (rule.severity === 'error') {
          errors.push({
            code: rule.ruleId,
            message: rule.message,
            parameter: rule.condition.parameter,
            value: parameterValue
          });
        } else if (rule.severity === 'warning') {
          warnings.push({
            code: rule.ruleId,
            message: rule.message,
            severity: 'medium',
            recommendation: 'Review operating conditions'
          });
        }
      }
    }

    // Check uncertainty bounds
    const uncertaintyBounds = config.pressureLossProfile.uncertaintyBounds;
    const uncertaintyRange = pressureLoss * (uncertaintyBounds.upperBound - uncertaintyBounds.lowerBound) / 100;

    if (uncertaintyRange > pressureLoss * 0.3) {
      warnings.push({
        code: 'W001',
        message: 'High uncertainty in pressure loss calculation',
        severity: 'medium',
        recommendation: 'Consider using more accurate calculation method'
      });
    }

    const complianceStatus: ComplianceStatus = {
      smacnaCompliant: errors.length === 0,
      ashraeCompliant: errors.length === 0,
      localCodeCompliant: true,
      customStandardsCompliant: true
    };

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      complianceStatus: complianceStatus
    };
  }

  /**
   * Check validation condition
   */
  private static checkValidationCondition(condition: any, value: number | string): boolean {
    switch (condition.operator) {
      case '>':
        return Number(value) > Number(condition.value);
      case '<':
        return Number(value) < Number(condition.value);
      case '>=':
        return Number(value) >= Number(condition.value);
      case '<=':
        return Number(value) <= Number(condition.value);
      case '=':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Generate recommendations based on calculation results
   */
  private static generateRecommendations(
    config: AdvancedFittingConfiguration,
    flowConditions: FlowConditions,
    performanceMetrics: PerformanceMetrics,
    validationResults: ValidationResults
  ): Recommendation[] {

    const recommendations: Recommendation[] = [];

    // Performance-based recommendations
    if (performanceMetrics.efficiency < 70) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: 'Consider using a more efficient fitting design to reduce pressure loss',
        expectedBenefit: 'Reduced energy consumption and improved system performance',
        implementationCost: 'medium'
      });
    }

    if (performanceMetrics.noiseGeneration > 50) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: 'Consider adding sound attenuation to reduce noise levels',
        expectedBenefit: 'Improved acoustic comfort',
        implementationCost: 'medium'
      });
    }

    // Flow-based recommendations
    const operatingRange = config.flowCharacteristics.operatingRange;
    const flowRatio = flowConditions.volumeFlow / operatingRange.optimal;

    if (flowRatio < 0.5) {
      recommendations.push({
        type: 'adjustment',
        priority: 'low',
        description: 'Flow is significantly below optimal range - consider resizing fitting',
        expectedBenefit: 'Better performance and efficiency',
        implementationCost: 'high'
      });
    }

    if (flowRatio > 1.5) {
      recommendations.push({
        type: 'adjustment',
        priority: 'high',
        description: 'Flow exceeds optimal range - fitting may be undersized',
        expectedBenefit: 'Reduced pressure loss and noise',
        implementationCost: 'high'
      });
    }

    // Maintenance recommendations
    if (config.category === 'control' || config.category === 'terminal') {
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        description: 'Regular inspection and calibration recommended for control devices',
        expectedBenefit: 'Maintained performance and reliability',
        implementationCost: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Get fitting configuration by ID from database
   */
  public static getFittingConfiguration(fittingId: string): AdvancedFittingConfiguration | null {
    const data = this.loadAdvancedFittingsData();

    // Search through all categories for the fitting
    for (const categoryName of Object.keys(data.categories)) {
      const category = data.categories[categoryName];
      for (const typeName of Object.keys(category)) {
        const type = category[typeName];
        for (const configName of Object.keys(type)) {
          const config = type[configName];
          if (config.id === fittingId) {
            return config as AdvancedFittingConfiguration;
          }
        }
      }
    }

    return null;
  }

  /**
   * List all available fitting configurations
   */
  public static listAvailableFittings(): { id: string; description: string; category: string }[] {
    const data = this.loadAdvancedFittingsData();
    const fittings: { id: string; description: string; category: string }[] = [];

    for (const categoryName of Object.keys(data.categories)) {
      const category = data.categories[categoryName];
      for (const typeName of Object.keys(category)) {
        const type = category[typeName];
        for (const configName of Object.keys(type)) {
          const config = type[configName];
          fittings.push({
            id: config.id,
            description: config.description,
            category: config.category
          });
        }
      }
    }

    return fittings.sort((a, b) => a.category.localeCompare(b.category) || a.description.localeCompare(b.description));
  }
}
