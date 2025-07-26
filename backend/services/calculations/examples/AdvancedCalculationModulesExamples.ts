/**
 * Advanced Calculation Modules Examples
 * 
 * Comprehensive examples demonstrating the usage of VelocityPressureCalculator
 * and EnhancedFrictionCalculator for Phase 3: Advanced Calculation Modules
 * 
 * @version 3.0.0
 */

import { 
  VelocityPressureCalculator, 
  VelocityPressureMethod, 
  ValidationLevel 
} from '../VelocityPressureCalculator';

import { 
  EnhancedFrictionCalculator, 
  FrictionMethod, 
  MaterialAge,
  SurfaceCondition 
} from '../EnhancedFrictionCalculator';

/**
 * Example 1: Basic Velocity Pressure Calculations
 * Demonstrates different calculation methods and their applications
 */
export function basicVelocityPressureExample() {
  console.log('=== BASIC VELOCITY PRESSURE CALCULATIONS ===\n');

  const velocity = 2000; // FPM

  // Method 1: Standard formula calculation
  const formulaResult = VelocityPressureCalculator.calculateVelocityPressure({
    velocity,
    method: VelocityPressureMethod.FORMULA
  });

  console.log('Formula Method:');
  console.log(`  Velocity: ${formulaResult.velocity} FPM`);
  console.log(`  Velocity Pressure: ${formulaResult.velocityPressure.toFixed(4)} in. w.g.`);
  console.log(`  Method: ${formulaResult.method}`);
  console.log(`  Accuracy: ${(formulaResult.accuracy * 100).toFixed(1)}%`);
  console.log(`  Formula: ${formulaResult.calculationDetails.formula}\n`);

  // Method 2: Enhanced formula with corrections
  const enhancedResult = VelocityPressureCalculator.calculateVelocityPressure({
    velocity,
    method: VelocityPressureMethod.ENHANCED_FORMULA,
    airConditions: {
      temperature: 85,  // Higher temperature
      altitude: 3000,   // Higher altitude
      humidity: 60      // Moderate humidity
    }
  });

  console.log('Enhanced Formula Method with Environmental Conditions:');
  console.log(`  Velocity: ${enhancedResult.velocity} FPM`);
  console.log(`  Velocity Pressure: ${enhancedResult.velocityPressure.toFixed(4)} in. w.g.`);
  console.log(`  Air Density: ${enhancedResult.airDensity.toFixed(4)} lb/ft³`);
  console.log(`  Density Ratio: ${enhancedResult.densityRatio.toFixed(3)}`);
  console.log(`  Combined Correction: ${enhancedResult.corrections.combined.toFixed(3)}`);
  console.log(`  Uncertainty: ±${((enhancedResult.uncertaintyBounds!.upper - enhancedResult.uncertaintyBounds!.lower) / 2).toFixed(4)} in. w.g.`);
  
  if (enhancedResult.warnings.length > 0) {
    console.log(`  Warnings: ${enhancedResult.warnings.join(', ')}`);
  }
  
  if (enhancedResult.recommendations.length > 0) {
    console.log(`  Recommendations: ${enhancedResult.recommendations.join(', ')}`);
  }
  console.log();

  // Method 3: Optimal method selection
  const optimalMethod = VelocityPressureCalculator.getOptimalMethod(velocity, undefined, 'high');
  const optimalResult = VelocityPressureCalculator.calculateVelocityPressure({
    velocity,
    method: optimalMethod
  });

  console.log('Optimal Method Selection:');
  console.log(`  Recommended Method: ${optimalMethod}`);
  console.log(`  Velocity Pressure: ${optimalResult.velocityPressure.toFixed(4)} in. w.g.`);
  console.log(`  Accuracy: ${(optimalResult.accuracy * 100).toFixed(1)}%\n`);
}

/**
 * Example 2: Inverse Velocity Pressure Calculations
 * Demonstrates calculating velocity from known velocity pressure
 */
export function inverseVelocityPressureExample() {
  console.log('=== INVERSE VELOCITY PRESSURE CALCULATIONS ===\n');

  const targetVelocityPressure = 0.25; // in. w.g.

  // Calculate velocity from velocity pressure
  const inverseResult = VelocityPressureCalculator.calculateVelocityFromPressure(
    targetVelocityPressure
  );

  console.log('Standard Conditions:');
  console.log(`  Target Velocity Pressure: ${targetVelocityPressure} in. w.g.`);
  console.log(`  Calculated Velocity: ${inverseResult.velocity.toFixed(0)} FPM`);
  console.log(`  Accuracy: ${(inverseResult.accuracy * 100).toFixed(1)}%\n`);

  // Calculate velocity with environmental conditions
  const inverseWithConditions = VelocityPressureCalculator.calculateVelocityFromPressure(
    targetVelocityPressure,
    {
      temperature: 90,
      altitude: 5000,
      humidity: 70
    }
  );

  console.log('With Environmental Conditions:');
  console.log(`  Target Velocity Pressure: ${targetVelocityPressure} in. w.g.`);
  console.log(`  Calculated Velocity: ${inverseWithConditions.velocity.toFixed(0)} FPM`);
  console.log(`  Accuracy: ${(inverseWithConditions.accuracy * 100).toFixed(1)}%`);
  
  if (inverseWithConditions.warnings.length > 0) {
    console.log(`  Warnings: ${inverseWithConditions.warnings.join(', ')}`);
  }
  console.log();
}

/**
 * Example 3: Enhanced Friction Calculations
 * Demonstrates different friction calculation methods and material effects
 */
export function enhancedFrictionExample() {
  console.log('=== ENHANCED FRICTION CALCULATIONS ===\n');

  const baseInput = {
    velocity: 2000,           // FPM
    hydraulicDiameter: 12,    // inches
    length: 100,              // feet
    material: 'galvanized_steel'
  };

  // Method 1: Colebrook-White (most accurate)
  const colebrookResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    ...baseInput,
    method: FrictionMethod.COLEBROOK_WHITE
  });

  console.log('Colebrook-White Method (Most Accurate):');
  console.log(`  Friction Loss: ${colebrookResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Friction Rate: ${colebrookResult.frictionRate.toFixed(4)} in. w.g./100 ft`);
  console.log(`  Friction Factor: ${colebrookResult.frictionFactor.toFixed(6)}`);
  console.log(`  Reynolds Number: ${colebrookResult.reynoldsNumber.toFixed(0)}`);
  console.log(`  Flow Regime: ${colebrookResult.flowRegime}`);
  console.log(`  Accuracy: ${(colebrookResult.accuracy * 100).toFixed(1)}%`);
  console.log(`  Formula: ${colebrookResult.calculationDetails.formula}\n`);

  // Method 2: Enhanced Darcy (optimized for flow regime)
  const enhancedDarcyResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    ...baseInput,
    method: FrictionMethod.ENHANCED_DARCY
  });

  console.log('Enhanced Darcy Method (Flow Regime Optimized):');
  console.log(`  Friction Loss: ${enhancedDarcyResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Friction Rate: ${enhancedDarcyResult.frictionRate.toFixed(4)} in. w.g./100 ft`);
  console.log(`  Flow Regime: ${enhancedDarcyResult.flowRegime}`);
  console.log(`  Accuracy: ${(enhancedDarcyResult.accuracy * 100).toFixed(1)}%\n`);

  // Method 3: Swamee-Jain (explicit approximation)
  const swameeJainResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    ...baseInput,
    method: FrictionMethod.SWAMEE_JAIN
  });

  console.log('Swamee-Jain Method (Explicit Approximation):');
  console.log(`  Friction Loss: ${swameeJainResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Friction Rate: ${swameeJainResult.frictionRate.toFixed(4)} in. w.g./100 ft`);
  console.log(`  Accuracy: ${(swameeJainResult.accuracy * 100).toFixed(1)}%\n`);
}

/**
 * Example 4: Material Aging and Surface Condition Effects
 * Demonstrates how material aging and surface conditions affect friction
 */
export function materialAgingExample() {
  console.log('=== MATERIAL AGING AND SURFACE CONDITION EFFECTS ===\n');

  const baseInput = {
    velocity: 2000,
    hydraulicDiameter: 12,
    length: 100,
    material: 'galvanized_steel',
    method: FrictionMethod.ENHANCED_DARCY
  };

  // New duct in excellent condition
  const newDuctResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    ...baseInput,
    materialAge: MaterialAge.NEW,
    surfaceCondition: SurfaceCondition.EXCELLENT
  });

  console.log('New Duct - Excellent Condition:');
  console.log(`  Friction Loss: ${newDuctResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Base Roughness: ${newDuctResult.materialProperties.baseRoughness.toFixed(6)} ft`);
  console.log(`  Aging Factor: ${newDuctResult.materialProperties.agingFactor.toFixed(2)}`);
  console.log(`  Surface Factor: ${newDuctResult.materialProperties.surfaceFactor.toFixed(2)}`);
  console.log(`  Combined Factor: ${newDuctResult.materialProperties.combinedFactor.toFixed(2)}\n`);

  // Average aged duct
  const averageAgedResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    ...baseInput,
    materialAge: MaterialAge.AVERAGE,
    surfaceCondition: SurfaceCondition.AVERAGE
  });

  console.log('Average Aged Duct - Average Condition:');
  console.log(`  Friction Loss: ${averageAgedResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Aging Factor: ${averageAgedResult.materialProperties.agingFactor.toFixed(2)}`);
  console.log(`  Surface Factor: ${averageAgedResult.materialProperties.surfaceFactor.toFixed(2)}`);
  console.log(`  Combined Factor: ${averageAgedResult.materialProperties.combinedFactor.toFixed(2)}`);
  console.log(`  Increase vs New: ${((averageAgedResult.frictionLoss / newDuctResult.frictionLoss - 1) * 100).toFixed(1)}%\n`);

  // Poor condition duct
  const poorConditionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    ...baseInput,
    materialAge: MaterialAge.POOR,
    surfaceCondition: SurfaceCondition.POOR
  });

  console.log('Poor Condition Duct:');
  console.log(`  Friction Loss: ${poorConditionResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Aging Factor: ${poorConditionResult.materialProperties.agingFactor.toFixed(2)}`);
  console.log(`  Surface Factor: ${poorConditionResult.materialProperties.surfaceFactor.toFixed(2)}`);
  console.log(`  Combined Factor: ${poorConditionResult.materialProperties.combinedFactor.toFixed(2)}`);
  console.log(`  Increase vs New: ${((poorConditionResult.frictionLoss / newDuctResult.frictionLoss - 1) * 100).toFixed(1)}%`);
  
  if (poorConditionResult.recommendations.length > 0) {
    console.log(`  Recommendations: ${poorConditionResult.recommendations.join(', ')}`);
  }
  console.log();
}

/**
 * Example 5: Environmental Corrections
 * Demonstrates how environmental conditions affect friction calculations
 */
export function environmentalCorrectionsExample() {
  console.log('=== ENVIRONMENTAL CORRECTIONS ===\n');

  const baseInput = {
    velocity: 2000,
    hydraulicDiameter: 12,
    length: 100,
    material: 'galvanized_steel',
    method: FrictionMethod.ENHANCED_DARCY
  };

  // Standard conditions
  const standardResult = EnhancedFrictionCalculator.calculateFrictionLoss(baseInput);

  console.log('Standard Conditions (70°F, Sea Level):');
  console.log(`  Friction Loss: ${standardResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Environmental Correction: ${standardResult.environmentalCorrections.combined.toFixed(3)}\n`);

  // High temperature, high altitude conditions
  const extremeConditionsResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    ...baseInput,
    airConditions: {
      temperature: 120,  // High temperature
      altitude: 8000,    // High altitude
      humidity: 90       // High humidity
    }
  });

  console.log('Extreme Conditions (120°F, 8000 ft altitude, 90% RH):');
  console.log(`  Friction Loss: ${extremeConditionsResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Environmental Correction: ${extremeConditionsResult.environmentalCorrections.combined.toFixed(3)}`);
  console.log(`  Change vs Standard: ${((extremeConditionsResult.frictionLoss / standardResult.frictionLoss - 1) * 100).toFixed(1)}%`);
  
  if (extremeConditionsResult.warnings.length > 0) {
    console.log(`  Warnings: ${extremeConditionsResult.warnings.join(', ')}`);
  }
  console.log();
}

/**
 * Example 6: Complete Duct System Analysis
 * Demonstrates integrated use of both calculators for complete system analysis
 */
export function completeSystemAnalysisExample() {
  console.log('=== COMPLETE DUCT SYSTEM ANALYSIS ===\n');

  const systemParameters = {
    velocity: 2500,           // FPM
    hydraulicDiameter: 14,    // inches
    length: 150,              // feet
    material: 'galvanized_steel',
    materialAge: MaterialAge.GOOD,
    surfaceCondition: SurfaceCondition.GOOD,
    airConditions: {
      temperature: 75,
      altitude: 2000,
      humidity: 55
    }
  };

  console.log('System Parameters:');
  console.log(`  Velocity: ${systemParameters.velocity} FPM`);
  console.log(`  Hydraulic Diameter: ${systemParameters.hydraulicDiameter} inches`);
  console.log(`  Length: ${systemParameters.length} feet`);
  console.log(`  Material: ${systemParameters.material}`);
  console.log(`  Conditions: ${systemParameters.airConditions.temperature}°F, ${systemParameters.airConditions.altitude} ft, ${systemParameters.airConditions.humidity}% RH\n`);

  // Calculate velocity pressure
  const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
    velocity: systemParameters.velocity,
    method: VelocityPressureMethod.ENHANCED_FORMULA,
    airConditions: systemParameters.airConditions
  });

  console.log('Velocity Pressure Analysis:');
  console.log(`  Velocity Pressure: ${vpResult.velocityPressure.toFixed(4)} in. w.g.`);
  console.log(`  Air Density: ${vpResult.airDensity.toFixed(4)} lb/ft³`);
  console.log(`  Method: ${vpResult.method}`);
  console.log(`  Accuracy: ${(vpResult.accuracy * 100).toFixed(1)}%\n`);

  // Calculate friction loss
  const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
    velocity: systemParameters.velocity,
    hydraulicDiameter: systemParameters.hydraulicDiameter,
    length: systemParameters.length,
    material: systemParameters.material,
    materialAge: systemParameters.materialAge,
    surfaceCondition: systemParameters.surfaceCondition,
    airConditions: systemParameters.airConditions,
    method: FrictionMethod.ENHANCED_DARCY
  });

  console.log('Friction Loss Analysis:');
  console.log(`  Friction Loss: ${frictionResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Friction Rate: ${frictionResult.frictionRate.toFixed(4)} in. w.g./100 ft`);
  console.log(`  Friction Factor: ${frictionResult.frictionFactor.toFixed(6)}`);
  console.log(`  Reynolds Number: ${frictionResult.reynoldsNumber.toFixed(0)}`);
  console.log(`  Flow Regime: ${frictionResult.flowRegime}`);
  console.log(`  Method: ${frictionResult.method}`);
  console.log(`  Accuracy: ${(frictionResult.accuracy * 100).toFixed(1)}%\n`);

  // Calculate total system pressure loss
  const totalPressureLoss = vpResult.velocityPressure + frictionResult.frictionLoss;
  const frictionPercentage = (frictionResult.frictionLoss / totalPressureLoss) * 100;

  console.log('System Summary:');
  console.log(`  Velocity Pressure: ${vpResult.velocityPressure.toFixed(4)} in. w.g.`);
  console.log(`  Friction Loss: ${frictionResult.frictionLoss.toFixed(4)} in. w.g.`);
  console.log(`  Total Pressure Loss: ${totalPressureLoss.toFixed(4)} in. w.g.`);
  console.log(`  Friction Percentage: ${frictionPercentage.toFixed(1)}%`);

  // Combined recommendations
  const allRecommendations = [...vpResult.recommendations, ...frictionResult.recommendations];
  if (allRecommendations.length > 0) {
    console.log(`  Recommendations: ${allRecommendations.join('; ')}`);
  }

  // Combined warnings
  const allWarnings = [...vpResult.warnings, ...frictionResult.warnings];
  if (allWarnings.length > 0) {
    console.log(`  Warnings: ${allWarnings.join('; ')}`);
  }
  console.log();
}

/**
 * Example 7: Method Comparison and Optimization
 * Demonstrates comparing different calculation methods for optimization
 */
export function methodComparisonExample() {
  console.log('=== METHOD COMPARISON AND OPTIMIZATION ===\n');

  const testConditions = {
    velocity: 2000,
    hydraulicDiameter: 12,
    length: 100,
    material: 'galvanized_steel'
  };

  console.log('Friction Method Comparison:');
  console.log('Method                    | Friction Loss | Accuracy | Formula Type');
  console.log('--------------------------|---------------|----------|-------------');

  const methods = [
    FrictionMethod.COLEBROOK_WHITE,
    FrictionMethod.SWAMEE_JAIN,
    FrictionMethod.HAALAND,
    FrictionMethod.CHEN,
    FrictionMethod.ENHANCED_DARCY
  ];

  methods.forEach(method => {
    const result = EnhancedFrictionCalculator.calculateFrictionLoss({
      ...testConditions,
      method
    });

    const methodName = method.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()).padEnd(25);
    const frictionLoss = result.frictionLoss.toFixed(4).padStart(13);
    const accuracy = `${(result.accuracy * 100).toFixed(1)}%`.padStart(8);
    const formulaType = result.calculationDetails.formula.includes('iterative') ? 'Iterative' : 'Explicit';

    console.log(`${methodName}| ${frictionLoss} | ${accuracy} | ${formulaType}`);
  });

  console.log();

  // Optimal method recommendation
  const optimalMethod = EnhancedFrictionCalculator.getOptimalMethod(50000, 0.001, 'high');
  console.log(`Optimal Method Recommendation: ${optimalMethod}`);
  console.log('(Based on Reynolds number: 50,000, Relative roughness: 0.001, High accuracy requirement)\n');
}

/**
 * Run all examples
 */
export function runAllAdvancedCalculationExamples() {
  console.log('ADVANCED CALCULATION MODULES - COMPREHENSIVE EXAMPLES\n');
  console.log('=====================================================\n');

  basicVelocityPressureExample();
  inverseVelocityPressureExample();
  enhancedFrictionExample();
  materialAgingExample();
  environmentalCorrectionsExample();
  completeSystemAnalysisExample();
  methodComparisonExample();

  console.log('All examples completed successfully!');
  console.log('These examples demonstrate the comprehensive capabilities of the Advanced Calculation Modules.');
}

// Export individual examples for selective usage
export {
  basicVelocityPressureExample,
  inverseVelocityPressureExample,
  enhancedFrictionExample,
  materialAgingExample,
  environmentalCorrectionsExample,
  completeSystemAnalysisExample,
  methodComparisonExample
};
