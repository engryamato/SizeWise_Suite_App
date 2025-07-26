/**
 * Enhanced Duct Physics Example - Phase 2
 * 
 * This example demonstrates the enhanced capabilities of the duct physics system
 * including environmental corrections, material aging effects, and advanced calculations.
 */

import { SystemPressureCalculator, DuctSegment } from '../SystemPressureCalculator';
import { AirPropertiesCalculator, AirConditions } from '../AirPropertiesCalculator';
import { FittingLossCalculator, FittingConfiguration } from '../FittingLossCalculator';

/**
 * Example 1: Standard vs Enhanced System Calculation
 * Demonstrates the difference between standard and enhanced calculations
 */
export function compareStandardVsEnhanced() {
  console.log('=== STANDARD vs ENHANCED CALCULATION COMPARISON ===\n');

  // Define system segments
  const segments: DuctSegment[] = [
    {
      id: 'segment-1',
      type: 'straight',
      ductShape: 'round',
      length: 10,
      diameter: 10,
      airflow: 1000,
      material: 'galvanized_steel'
    },
    {
      id: 'segment-2',
      type: 'fitting',
      ductShape: 'round',
      diameter: 10,
      airflow: 1000,
      material: 'galvanized_steel',
      fittingConfig: {
        ductShape: 'round',
        fittingType: 'elbow',
        subType: '90deg_round_smooth',
        parameters: { radius_to_diameter_ratio: 1.5 }
      }
    },
    {
      id: 'segment-3',
      type: 'straight',
      ductShape: 'round',
      length: 10,
      diameter: 10,
      airflow: 1000,
      material: 'galvanized_steel'
    }
  ];

  // Standard calculation (sea level, 70°F, new duct)
  const standardInputs = {
    segments,
    systemType: 'supply' as const,
    designConditions: {
      temperature: 70,
      barometricPressure: 29.92,
      humidity: 50
    },
    calculationOptions: {
      includeElevation: false,
      includeFittings: true,
      roundResults: true
    }
  };

  const standardResult = SystemPressureCalculator.calculateSystemPressure(standardInputs);

  console.log('STANDARD CALCULATION (Sea Level, 70°F, New Duct):');
  console.log(`  Total Pressure Loss: ${standardResult.totalPressureLoss} in wg`);
  console.log(`  Friction Loss: ${standardResult.frictionLoss} in wg`);
  console.log(`  Fitting Loss: ${standardResult.fittingLoss} in wg`);

  // Enhanced calculation (Denver altitude, 100°F, 10-year-old duct)
  const enhancedSegments: DuctSegment[] = segments.map(segment => ({
    ...segment,
    temperature: 100,
    elevation: 5000,
    humidity: 30,
    materialAge: 10,
    surfaceCondition: 'good' as const
  }));

  const enhancedInputs = {
    segments: enhancedSegments,
    systemType: 'supply' as const,
    designConditions: {
      temperature: 100,
      barometricPressure: 24.89, // Denver pressure
      altitude: 5000,
      humidity: 30
    },
    calculationOptions: {
      includeElevation: true,
      includeFittings: true,
      roundResults: true
    }
  };

  const enhancedResult = SystemPressureCalculator.calculateEnhancedSystemPressure(enhancedInputs);

  console.log('\nENHANCED CALCULATION (Denver, 100°F, 10-year-old duct):');
  console.log(`  Total Pressure Loss: ${enhancedResult.totalPressureLoss} in wg`);
  console.log(`  Friction Loss: ${enhancedResult.frictionLoss} in wg`);
  console.log(`  Fitting Loss: ${enhancedResult.fittingLoss} in wg`);
  console.log(`  Elevation Loss: ${enhancedResult.elevationLoss} in wg`);

  // Calculate the difference
  const pressureDifference = enhancedResult.totalPressureLoss - standardResult.totalPressureLoss;
  const percentIncrease = (pressureDifference / standardResult.totalPressureLoss * 100);

  console.log('\nCOMPARISON:');
  console.log(`  Pressure Difference: ${pressureDifference.toFixed(4)} in wg`);
  console.log(`  Percent Increase: ${percentIncrease.toFixed(1)}%`);
  console.log(`  Environmental Impact: ${enhancedResult.systemMetrics.environmentalImpact}%`);

  if (enhancedResult.warnings.length > 0) {
    console.log('\nWARNINGS:');
    enhancedResult.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  return { standardResult, enhancedResult };
}

/**
 * Example 2: Air Properties Calculation
 * Demonstrates environmental corrections for different conditions
 */
export function demonstrateAirProperties() {
  console.log('\n=== AIR PROPERTIES DEMONSTRATION ===\n');

  const conditions: AirConditions[] = [
    { temperature: 70, altitude: 0, humidity: 50 },      // Standard conditions
    { temperature: 100, altitude: 0, humidity: 50 },     // High temperature
    { temperature: 70, altitude: 5000, humidity: 50 },   // High altitude
    { temperature: 70, altitude: 0, humidity: 90 },      // High humidity
    { temperature: 150, altitude: 8000, humidity: 20 }   // Extreme conditions
  ];

  conditions.forEach((condition, index) => {
    const airProps = AirPropertiesCalculator.calculateAirProperties(condition);
    
    console.log(`CONDITION ${index + 1}: ${condition.temperature}°F, ${condition.altitude} ft, ${condition.humidity}% RH`);
    console.log(`  Air Density: ${airProps.density.toFixed(4)} lb/ft³`);
    console.log(`  Temperature Correction: ${airProps.correctionFactors.temperature.toFixed(3)}`);
    console.log(`  Altitude Correction: ${airProps.correctionFactors.altitude.toFixed(3)}`);
    console.log(`  Humidity Correction: ${airProps.correctionFactors.humidity.toFixed(3)}`);
    console.log(`  Combined Correction: ${airProps.correctionFactors.combined.toFixed(3)}`);
    
    if (airProps.warnings.length > 0) {
      console.log(`  Warnings: ${airProps.warnings.join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Example 3: Material Aging Effects
 * Shows how material aging affects pressure calculations
 */
export function demonstrateMaterialAging() {
  console.log('\n=== MATERIAL AGING EFFECTS ===\n');

  const materials = ['galvanized_steel', 'aluminum', 'stainless_steel', 'flexible_duct'];
  const ages = [0, 5, 10, 15, 20];

  materials.forEach(material => {
    console.log(`MATERIAL: ${material.toUpperCase()}`);
    
    ages.forEach(age => {
      const roughness = AirPropertiesCalculator.getEnhancedMaterialRoughness(
        material, 
        age, 
        'good'
      );
      
      const ageLabel = age === 0 ? 'New' : `${age} years`;
      console.log(`  ${ageLabel}: ${roughness.effectiveRoughness.toFixed(6)} ft (factor: ${roughness.agingFactor.toFixed(2)})`);
    });
    console.log('');
  });
}

/**
 * Example 4: Velocity Pressure Optimization
 * Compares table lookup vs formula calculation
 */
export function demonstrateVelocityPressureOptimization() {
  console.log('\n=== VELOCITY PRESSURE OPTIMIZATION ===\n');

  const velocities = [500, 1000, 1500, 2000, 2500, 3000];
  const conditions: AirConditions = {
    temperature: 85,
    altitude: 2500,
    humidity: 40
  };

  console.log('VELOCITY PRESSURE COMPARISON (Table vs Formula):');
  console.log('Velocity (FPM) | Table (in wg) | Formula (in wg) | Difference');
  console.log('---------------|---------------|-----------------|----------');

  velocities.forEach(velocity => {
    // Table lookup method
    const tableResult = AirPropertiesCalculator.calculateVelocityPressure({
      velocity,
      airConditions: conditions,
      useTable: true
    });

    // Formula calculation method
    const formulaResult = AirPropertiesCalculator.calculateVelocityPressure({
      velocity,
      airConditions: conditions,
      useTable: false
    });

    const difference = Math.abs(tableResult.velocityPressure - formulaResult.velocityPressure);
    
    console.log(
      `${velocity.toString().padStart(14)} | ` +
      `${tableResult.velocityPressure.toFixed(4).padStart(13)} | ` +
      `${formulaResult.velocityPressure.toFixed(4).padStart(15)} | ` +
      `${difference.toFixed(6)}`
    );
  });

  console.log('\nPerformance benefits of table lookup:');
  console.log('- Faster calculation (pre-computed values)');
  console.log('- Consistent precision across velocity range');
  console.log('- Reduced computational overhead for large systems');
}

/**
 * Main demonstration function
 */
export function runEnhancedDuctPhysicsDemo() {
  console.log('ENHANCED DUCT PHYSICS DEMONSTRATION - PHASE 2');
  console.log('==============================================\n');

  try {
    // Run all demonstrations
    compareStandardVsEnhanced();
    demonstrateAirProperties();
    demonstrateMaterialAging();
    demonstrateVelocityPressureOptimization();

    console.log('\n==============================================');
    console.log('DEMONSTRATION COMPLETED SUCCESSFULLY');
    console.log('==============================================');

  } catch (error) {
    console.error('Error in demonstration:', error);
  }
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  runEnhancedDuctPhysicsDemo();
}
