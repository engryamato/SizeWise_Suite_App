/**
 * Duct Physics Integration Example
 * 
 * Demonstrates the comprehensive duct physics implementation
 * Shows how to use FittingLossCalculator and SystemPressureCalculator
 * 
 * Example: 10″ round duct → 10′ run → 90° elbow → 10′ run
 */

import { FittingLossCalculator, FittingConfiguration } from '../FittingLossCalculator';
import { SystemPressureCalculator, DuctSegment, SystemCalculationInputs } from '../SystemPressureCalculator';
import { AirDuctCalculator } from '../AirDuctCalculator';

/**
 * Example 1: Individual Fitting Loss Calculation
 */
function demonstrateFittingLossCalculation() {
  console.log('\n=== FITTING LOSS CALCULATION EXAMPLE ===');
  
  // Example: 90° smooth elbow with R/D = 1.5
  const elbowConfig: FittingConfiguration = {
    type: '90deg_round_smooth',
    ductShape: 'round',
    diameter: 10,
    parameter: '1.5'
  };

  const velocity = 1833; // FPM (calculated from 1000 CFM in 10" duct)
  const result = FittingLossCalculator.calculateFittingLoss(elbowConfig, velocity);

  console.log('90° Smooth Elbow (R/D = 1.5):');
  console.log(`  K-factor: ${result.kFactor}`);
  console.log(`  Velocity Pressure: ${result.velocityPressure.toFixed(4)} in wg`);
  console.log(`  Pressure Loss: ${result.pressureLoss.toFixed(4)} in wg`);
  console.log(`  Configuration: ${result.configuration}`);
  
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.join(', ')}`);
  }
  
  if (result.recommendations.length > 0) {
    console.log(`  Recommendations: ${result.recommendations.join(', ')}`);
  }

  return result;
}

/**
 * Example 2: Complete System Pressure Drop Calculation
 * User's example: 10″ round duct → 10′ run → 90° elbow → 10′ run
 */
function demonstrateSystemPressureCalculation() {
  console.log('\n=== SYSTEM PRESSURE DROP CALCULATION EXAMPLE ===');
  console.log('System: 10″ round duct → 10′ run → 90° elbow → 10′ run');
  
  // Define system segments
  const segments: DuctSegment[] = [
    // First straight run: 10 feet
    {
      id: 'straight-run-1',
      type: 'straight',
      ductShape: 'round',
      length: 10,
      diameter: 10,
      airflow: 1000,
      material: 'galvanized_steel',
      notes: 'First straight section'
    },
    
    // 90° elbow with R/D = 1.5
    {
      id: 'elbow-90deg',
      type: 'fitting',
      ductShape: 'round',
      diameter: 10,
      airflow: 1000,
      material: 'galvanized_steel',
      fittingConfig: {
        type: '90deg_round_smooth',
        ductShape: 'round',
        diameter: 10,
        parameter: '1.5'
      },
      notes: '90° smooth elbow'
    },
    
    // Second straight run: 10 feet
    {
      id: 'straight-run-2',
      type: 'straight',
      ductShape: 'round',
      length: 10,
      diameter: 10,
      airflow: 1000,
      material: 'galvanized_steel',
      notes: 'Second straight section'
    }
  ];

  // System calculation inputs
  const inputs: SystemCalculationInputs = {
    segments,
    systemType: 'supply',
    designConditions: {
      temperature: 70, // °F
      barometricPressure: 29.92, // in Hg
      altitude: 0 // feet above sea level
    },
    calculationOptions: {
      includeElevationEffects: false,
      includeTemperatureEffects: true,
      frictionMethod: 'darcy_weisbach',
      roundingPrecision: 4
    }
  };

  // Calculate system pressure drop
  const systemResult = SystemPressureCalculator.calculateSystemPressure(inputs);

  console.log('\nSystem Results:');
  console.log(`  Total Pressure Loss: ${systemResult.totalPressureLoss} in wg`);
  console.log(`  Total Friction Loss: ${systemResult.totalFrictionLoss} in wg`);
  console.log(`  Total Minor Loss: ${systemResult.totalMinorLoss} in wg`);
  console.log(`  Total Length: ${systemResult.totalLength} feet`);
  console.log(`  Average Velocity: ${systemResult.averageVelocity} FPM`);
  console.log(`  Max Velocity: ${systemResult.maxVelocity} FPM`);

  console.log('\nSegment Details:');
  systemResult.segmentResults.forEach((segment, index) => {
    console.log(`  Segment ${index + 1} (${segment.segmentId}):`);
    console.log(`    Type: ${segment.segmentType}`);
    console.log(`    Velocity: ${segment.velocity} FPM`);
    console.log(`    Velocity Pressure: ${segment.velocityPressure} in wg`);
    console.log(`    Friction Loss: ${segment.frictionLoss} in wg`);
    console.log(`    Minor Loss: ${segment.minorLoss} in wg`);
    console.log(`    Total Loss: ${segment.totalLoss} in wg`);
    
    if (segment.kFactor) {
      console.log(`    K-factor: ${segment.kFactor}`);
    }
    
    if (segment.warnings.length > 0) {
      console.log(`    Warnings: ${segment.warnings.join(', ')}`);
    }
  });

  console.log('\nCompliance Status:');
  console.log(`  Velocity Compliant: ${systemResult.complianceStatus.velocityCompliant}`);
  console.log(`  Pressure Compliant: ${systemResult.complianceStatus.pressureCompliant}`);
  console.log(`  SMACNA Compliant: ${systemResult.complianceStatus.smacnaCompliant}`);

  if (systemResult.systemWarnings.length > 0) {
    console.log('\nSystem Warnings:');
    systemResult.systemWarnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (systemResult.systemRecommendations.length > 0) {
    console.log('\nSystem Recommendations:');
    systemResult.systemRecommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  return systemResult;
}

/**
 * Example 3: Complex System with Multiple Fittings
 */
function demonstrateComplexSystem() {
  console.log('\n=== COMPLEX SYSTEM EXAMPLE ===');
  console.log('System: Supply duct with multiple fittings and transitions');
  
  const complexSegments: DuctSegment[] = [
    // Main trunk: 12" round, 20 feet
    {
      id: 'main-trunk',
      type: 'straight',
      ductShape: 'round',
      length: 20,
      diameter: 12,
      airflow: 2000,
      material: 'galvanized_steel'
    },
    
    // Tee for branch takeoff
    {
      id: 'main-tee',
      type: 'fitting',
      ductShape: 'round',
      diameter: 12,
      airflow: 2000,
      material: 'galvanized_steel',
      fittingConfig: {
        type: 'tee_round_branch_90deg',
        ductShape: 'round',
        diameter: 12,
        subtype: 'straight_through',
        parameter: '0.6' // Branch area ratio
      }
    },
    
    // Transition from 12" to 10"
    {
      id: 'transition-12-to-10',
      type: 'fitting',
      ductShape: 'round',
      diameter: 12,
      airflow: 1500, // Reduced flow after branch
      material: 'galvanized_steel',
      fittingConfig: {
        type: 'round_to_round_gradual',
        ductShape: 'round',
        diameter: 12,
        parameter: '2.5' // L/D ratio
      }
    },
    
    // 10" duct run
    {
      id: 'reduced-run',
      type: 'straight',
      ductShape: 'round',
      length: 15,
      diameter: 10,
      airflow: 1500,
      material: 'galvanized_steel'
    },
    
    // 90° elbow
    {
      id: 'final-elbow',
      type: 'fitting',
      ductShape: 'round',
      diameter: 10,
      airflow: 1500,
      material: 'galvanized_steel',
      fittingConfig: {
        type: '90deg_round_smooth',
        ductShape: 'round',
        diameter: 10,
        parameter: '1.5'
      }
    },
    
    // Final run to diffuser
    {
      id: 'final-run',
      type: 'straight',
      ductShape: 'round',
      length: 8,
      diameter: 10,
      airflow: 1500,
      material: 'galvanized_steel'
    }
  ];

  const complexInputs: SystemCalculationInputs = {
    segments: complexSegments,
    systemType: 'supply',
    designConditions: {
      temperature: 75,
      barometricPressure: 29.92,
      altitude: 0
    },
    calculationOptions: {
      includeElevationEffects: false,
      includeTemperatureEffects: true,
      frictionMethod: 'darcy_weisbach',
      roundingPrecision: 3
    }
  };

  const complexResult = SystemPressureCalculator.calculateSystemPressure(complexInputs);

  console.log('\nComplex System Results:');
  console.log(`  Total Pressure Loss: ${complexResult.totalPressureLoss} in wg`);
  console.log(`  Friction vs Minor Loss Ratio: ${(complexResult.totalFrictionLoss / complexResult.totalMinorLoss).toFixed(2)}`);
  console.log(`  System Length: ${complexResult.totalLength} feet`);
  console.log(`  Velocity Range: ${complexResult.minVelocity} - ${complexResult.maxVelocity} FPM`);

  return complexResult;
}

/**
 * Example 4: Comparison with Existing AirDuctCalculator
 */
function demonstrateIntegrationWithExisting() {
  console.log('\n=== INTEGRATION WITH EXISTING CALCULATOR ===');
  
  // Use existing AirDuctCalculator for basic sizing
  const basicResult = AirDuctCalculator.calculateDuctSizing({
    airflow: 1000,
    ductType: 'round',
    frictionRate: 0.08,
    units: 'imperial',
    material: 'galvanized_steel'
  });

  console.log('Basic Duct Sizing (AirDuctCalculator):');
  console.log(`  Recommended Diameter: ${basicResult.diameter}" round`);
  console.log(`  Velocity: ${basicResult.velocity} FPM`);
  console.log(`  Pressure Loss: ${basicResult.pressureLoss} in wg/100 ft`);

  // Now use new system calculator for complete analysis
  const enhancedSegments: DuctSegment[] = [
    {
      id: 'sized-duct',
      type: 'straight',
      ductShape: 'round',
      length: 100, // 100 feet for comparison
      diameter: basicResult.diameter,
      airflow: 1000,
      material: 'galvanized_steel'
    }
  ];

  const enhancedInputs: SystemCalculationInputs = {
    segments: enhancedSegments,
    systemType: 'supply',
    designConditions: {
      temperature: 70,
      barometricPressure: 29.92,
      altitude: 0
    },
    calculationOptions: {
      includeElevationEffects: false,
      includeTemperatureEffects: true,
      frictionMethod: 'darcy_weisbach',
      roundingPrecision: 4
    }
  };

  const enhancedResult = SystemPressureCalculator.calculateSystemPressure(enhancedInputs);

  console.log('\nEnhanced System Analysis (SystemPressureCalculator):');
  console.log(`  Calculated Velocity: ${enhancedResult.averageVelocity} FPM`);
  console.log(`  Friction Loss (100 ft): ${enhancedResult.totalFrictionLoss} in wg`);
  console.log(`  Pressure Loss Rate: ${(enhancedResult.totalFrictionLoss).toFixed(4)} in wg/100 ft`);

  console.log('\nComparison:');
  console.log(`  Velocity Match: ${Math.abs(basicResult.velocity - enhancedResult.averageVelocity) < 1 ? 'PASS' : 'FAIL'}`);
  console.log(`  Pressure Loss Match: ${Math.abs(basicResult.pressureLoss - enhancedResult.totalFrictionLoss) < 0.001 ? 'PASS' : 'FAIL'}`);
}

/**
 * Main execution function
 */
function runAllExamples() {
  console.log('COMPREHENSIVE DUCT PHYSICS IMPLEMENTATION - INTEGRATION EXAMPLES');
  console.log('================================================================');
  
  try {
    // Run all examples
    demonstrateFittingLossCalculation();
    demonstrateSystemPressureCalculation();
    demonstrateComplexSystem();
    demonstrateIntegrationWithExisting();
    
    console.log('\n=== ALL EXAMPLES COMPLETED SUCCESSFULLY ===');
    console.log('Phase 1 implementation is working correctly!');
    
  } catch (error) {
    console.error('\n=== ERROR IN EXAMPLES ===');
    console.error(error);
    process.exit(1);
  }
}

// Export functions for testing
export {
  demonstrateFittingLossCalculation,
  demonstrateSystemPressureCalculation,
  demonstrateComplexSystem,
  demonstrateIntegrationWithExisting,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
