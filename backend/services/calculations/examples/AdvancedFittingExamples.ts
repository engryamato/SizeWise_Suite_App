/**
 * Advanced Fitting Calculator Integration Examples
 * 
 * Comprehensive examples demonstrating Phase 3 advanced fitting calculations
 * integrated with existing Phase 1/2 components for real-world HVAC scenarios.
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import { AdvancedFittingCalculator } from '../AdvancedFittingCalculator';
import { SystemPressureCalculator } from '../SystemPressureCalculator';
import { AirPropertiesCalculator } from '../AirPropertiesCalculator';
import {
  AdvancedFittingConfiguration,
  FlowConditions,
  SystemContext,
  CalculationMethod
} from '../types/AdvancedFittingTypes';

/**
 * Example 1: Laboratory Exhaust System with Complex Fittings
 * 
 * This example demonstrates a complete laboratory exhaust system calculation
 * including fume hood, transitions, dampers, and sound attenuator.
 */
export function calculateLaboratoryExhaustSystem() {
  console.log('=== Laboratory Exhaust System Analysis ===\n');

  // System design parameters
  const systemFlow = 1200; // CFM
  const systemVelocity = 1800; // FPM
  const designConditions = {
    temperature: 75, // °F
    pressure: 29.85, // in Hg
    humidity: 45,    // %RH
    elevation: 500   // ft
  };

  // Calculate air properties for design conditions
  const airProperties = AirPropertiesCalculator.calculateAirProperties(designConditions);
  console.log('Design Air Properties:');
  console.log(`  Density: ${airProperties.density.toFixed(4)} lb/ft³`);
  console.log(`  Viscosity: ${airProperties.viscosity.toExponential(3)} lb/(ft·s)`);
  console.log(`  Specific Volume: ${airProperties.specificVolume.toFixed(2)} ft³/lb\n`);

  // Common flow conditions for all fittings
  const flowConditions: FlowConditions = {
    velocity: systemVelocity,
    volumeFlow: systemFlow,
    massFlow: systemFlow * airProperties.density / 60, // Convert to lb/min
    reynoldsNumber: (airProperties.density * systemVelocity * (14/12)) / (airProperties.viscosity * 3600), // 14" equivalent diameter
    airDensity: airProperties.density,
    viscosity: airProperties.viscosity,
    temperature: designConditions.temperature,
    pressure: designConditions.pressure,
    turbulenceIntensity: 8
  };

  let totalPressureLoss = 0;
  const fittingResults: any[] = [];

  // 1. Laboratory Fume Hood
  console.log('1. Laboratory Fume Hood Analysis:');
  const fumeHoodConfig = AdvancedFittingCalculator.getFittingConfiguration('spec_exhaust_lab_fume');
  if (fumeHoodConfig) {
    const fumeHoodResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
      fumeHoodConfig,
      flowConditions
    );
    
    console.log(`   Pressure Loss: ${fumeHoodResult.pressureLoss.toFixed(3)} in wg`);
    console.log(`   K-Factor: ${fumeHoodResult.kFactor.toFixed(2)}`);
    console.log(`   Calculation Method: ${fumeHoodResult.calculationMethod}`);
    console.log(`   Efficiency: ${fumeHoodResult.performanceMetrics.efficiency.toFixed(1)}%`);
    console.log(`   Containment Performance: ${fumeHoodResult.performanceMetrics.flowUniformity.toFixed(1)}%`);
    
    if (fumeHoodResult.validationResults.warnings.length > 0) {
      console.log(`   Warnings: ${fumeHoodResult.validationResults.warnings.length}`);
      fumeHoodResult.validationResults.warnings.forEach(w => 
        console.log(`     - ${w.message}`)
      );
    }
    
    totalPressureLoss += fumeHoodResult.pressureLoss;
    fittingResults.push({ name: 'Fume Hood', result: fumeHoodResult });
  }

  // 2. Rectangular to Round Transition
  console.log('\n2. Rectangular to Round Transition:');
  const transitionConfig = AdvancedFittingCalculator.getFittingConfiguration('trans_rect_round_gradual');
  if (transitionConfig) {
    const transitionResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
      transitionConfig,
      flowConditions
    );
    
    console.log(`   Pressure Loss: ${transitionResult.pressureLoss.toFixed(3)} in wg`);
    console.log(`   K-Factor: ${transitionResult.kFactor.toFixed(2)}`);
    console.log(`   Calculation Method: ${transitionResult.calculationMethod}`);
    console.log(`   Flow Uniformity: ${transitionResult.performanceMetrics.flowUniformity.toFixed(1)}%`);
    
    totalPressureLoss += transitionResult.pressureLoss;
    fittingResults.push({ name: 'Transition', result: transitionResult });
  }

  // 3. Fire Damper
  console.log('\n3. Fire Damper:');
  const damperConfig = AdvancedFittingCalculator.getFittingConfiguration('ctrl_fire_damper');
  if (damperConfig) {
    const damperResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
      damperConfig,
      flowConditions
    );
    
    console.log(`   Pressure Loss: ${damperResult.pressureLoss.toFixed(3)} in wg`);
    console.log(`   K-Factor: ${damperResult.kFactor.toFixed(2)}`);
    console.log(`   Calculation Method: ${damperResult.calculationMethod}`);
    
    totalPressureLoss += damperResult.pressureLoss;
    fittingResults.push({ name: 'Fire Damper', result: damperResult });
  }

  // 4. Sound Attenuator
  console.log('\n4. Sound Attenuator:');
  const attenuatorConfig = AdvancedFittingCalculator.getFittingConfiguration('spec_sound_att_parallel');
  if (attenuatorConfig) {
    const attenuatorResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
      attenuatorConfig,
      flowConditions
    );
    
    console.log(`   Pressure Loss: ${attenuatorResult.pressureLoss.toFixed(3)} in wg`);
    console.log(`   K-Factor: ${attenuatorResult.kFactor.toFixed(2)}`);
    console.log(`   Calculation Method: ${attenuatorResult.calculationMethod}`);
    console.log(`   Noise Reduction: ${attenuatorResult.performanceMetrics.pressureRecovery.toFixed(1)}%`);
    console.log(`   Acoustic Performance: ${attenuatorResult.performanceMetrics.flowUniformity.toFixed(1)}%`);
    
    totalPressureLoss += attenuatorResult.pressureLoss;
    fittingResults.push({ name: 'Sound Attenuator', result: attenuatorResult });
  }

  // System Summary
  console.log('\n=== System Summary ===');
  console.log(`Total Fitting Pressure Loss: ${totalPressureLoss.toFixed(3)} in wg`);
  
  const totalEnergyLoss = fittingResults.reduce((sum, fitting) => 
    sum + fitting.result.performanceMetrics.energyLoss, 0
  );
  console.log(`Total Energy Loss: ${totalEnergyLoss.toFixed(0)} BTU/hr`);
  
  const avgEfficiency = fittingResults.reduce((sum, fitting) => 
    sum + fitting.result.performanceMetrics.efficiency, 0
  ) / fittingResults.length;
  console.log(`Average System Efficiency: ${avgEfficiency.toFixed(1)}%`);

  // Recommendations
  console.log('\n=== System Recommendations ===');
  const allRecommendations = fittingResults.flatMap(fitting => 
    fitting.result.recommendations.map((rec: any) => ({
      fitting: fitting.name,
      ...rec
    }))
  );
  
  const highPriorityRecs = allRecommendations.filter(rec => rec.priority === 'high');
  if (highPriorityRecs.length > 0) {
    console.log('High Priority:');
    highPriorityRecs.forEach(rec => 
      console.log(`  ${rec.fitting}: ${rec.description}`)
    );
  }

  return {
    totalPressureLoss,
    totalEnergyLoss,
    avgEfficiency,
    fittingResults,
    recommendations: allRecommendations
  };
}

/**
 * Example 2: VAV System with Variable Performance Analysis
 * 
 * This example demonstrates variable air volume system calculations
 * with performance curves and turndown analysis.
 */
export function calculateVAVSystemPerformance() {
  console.log('\n=== VAV System Performance Analysis ===\n');

  const vavConfig = AdvancedFittingCalculator.getFittingConfiguration('term_vav_single_duct');
  if (!vavConfig) {
    console.log('VAV configuration not found');
    return;
  }

  const designConditions = {
    temperature: 72,
    pressure: 29.92,
    humidity: 50,
    elevation: 0
  };

  const airProperties = AirPropertiesCalculator.calculateAirProperties(designConditions);

  // Test multiple operating points
  const operatingPoints = [
    { flow: 200, description: 'Minimum Flow (20%)' },
    { flow: 500, description: 'Part Load (50%)' },
    { flow: 800, description: 'Design Flow (80%)' },
    { flow: 1000, description: 'Maximum Flow (100%)' }
  ];

  console.log('Operating Point Analysis:');
  console.log('Flow (CFM) | Velocity (FPM) | Pressure Loss (in wg) | K-Factor | Efficiency (%)');
  console.log('-----------|----------------|----------------------|----------|---------------');

  const performanceData: any[] = [];

  operatingPoints.forEach(point => {
    const velocity = point.flow * 144 / (12 * 8); // Assuming 12"x8" duct
    
    const flowConditions: FlowConditions = {
      velocity: velocity,
      volumeFlow: point.flow,
      massFlow: point.flow * airProperties.density / 60,
      reynoldsNumber: (airProperties.density * velocity * (10/12)) / (airProperties.viscosity * 3600),
      airDensity: airProperties.density,
      viscosity: airProperties.viscosity,
      temperature: designConditions.temperature,
      pressure: designConditions.pressure,
      turbulenceIntensity: 5 + (velocity / 500) // Increases with velocity
    };

    try {
      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        vavConfig,
        flowConditions
      );

      console.log(
        `${point.flow.toString().padStart(10)} | ` +
        `${velocity.toFixed(0).padStart(14)} | ` +
        `${result.pressureLoss.toFixed(3).padStart(20)} | ` +
        `${result.kFactor.toFixed(2).padStart(8)} | ` +
        `${result.performanceMetrics.efficiency.toFixed(1).padStart(13)}`
      );

      performanceData.push({
        flow: point.flow,
        velocity: velocity,
        pressureLoss: result.pressureLoss,
        kFactor: result.kFactor,
        efficiency: result.performanceMetrics.efficiency,
        description: point.description
      });

    } catch (error) {
      console.log(`${point.flow.toString().padStart(10)} | Error: ${error}`);
    }
  });

  // Performance curve analysis
  console.log('\n=== Performance Curve Analysis ===');
  if (performanceData.length >= 2) {
    const maxEfficiency = Math.max(...performanceData.map(p => p.efficiency));
    const optimalPoint = performanceData.find(p => p.efficiency === maxEfficiency);
    
    console.log(`Optimal Operating Point: ${optimalPoint?.flow} CFM (${optimalPoint?.description})`);
    console.log(`Maximum Efficiency: ${maxEfficiency.toFixed(1)}%`);
    
    const turndownRatio = Math.max(...performanceData.map(p => p.flow)) / 
                         Math.min(...performanceData.map(p => p.flow));
    console.log(`Turndown Ratio: ${turndownRatio.toFixed(1)}:1`);
  }

  return performanceData;
}

/**
 * Example 3: System Integration with Existing Phase 1/2 Components
 * 
 * This example shows how advanced fittings integrate with the existing
 * SystemPressureCalculator for complete duct system analysis.
 */
export function calculateIntegratedDuctSystem() {
  console.log('\n=== Integrated Duct System Analysis ===\n');

  // Define a complete duct system with both standard and advanced fittings
  const systemSegments = [
    {
      id: 'main_trunk',
      length: 100,
      width: 24,
      height: 16,
      shape: 'rectangular' as const,
      material: 'galvanized_steel',
      roughness: 0.0005,
      airflow: 4000,
      fittings: [
        { type: 'elbow_90_rectangular', quantity: 2, K: 0.25 },
        { type: 'branch_tee_main', quantity: 1, K: 0.15 }
      ],
      elevation: 0,
      temperature: 72,
      humidity: 50,
      pressure: 29.92,
      materialAge: 'new' as const,
      surfaceCondition: 'good' as const
    },
    {
      id: 'branch_1',
      length: 50,
      width: 16,
      height: 12,
      shape: 'rectangular' as const,
      material: 'galvanized_steel',
      roughness: 0.0005,
      airflow: 2000,
      fittings: [
        { type: 'elbow_90_rectangular', quantity: 1, K: 0.25 }
      ],
      elevation: 0,
      temperature: 72,
      humidity: 50,
      pressure: 29.92,
      materialAge: 'new' as const,
      surfaceCondition: 'good' as const
    }
  ];

  // Calculate standard system pressure loss
  const systemResult = SystemPressureCalculator.calculateEnhancedSystemPressure({
    segments: systemSegments,
    systemType: 'supply',
    designConditions: {
      temperature: 72,
      elevation: 0,
      humidity: 50,
      pressure: 29.92
    },
    calculationOptions: {
      includeElevation: true,
      includeFittings: true,
      roundResults: false
    }
  });

  console.log('Standard System Analysis:');
  console.log(`Total System Pressure Loss: ${systemResult.totalPressureLoss.toFixed(3)} in wg`);
  console.log(`Duct Friction Loss: ${systemResult.totalFrictionLoss.toFixed(3)} in wg`);
  console.log(`Standard Fitting Loss: ${systemResult.totalFittingLoss.toFixed(3)} in wg`);

  // Add advanced fittings to the system
  console.log('\nAdvanced Fitting Analysis:');
  
  const airProperties = AirPropertiesCalculator.calculateAirProperties({
    temperature: 72,
    pressure: 29.92,
    humidity: 50
  });

  // Add VAV terminal to branch 1
  const vavFlowConditions: FlowConditions = {
    velocity: 1500,
    volumeFlow: 2000,
    massFlow: 2000 * airProperties.density / 60,
    reynoldsNumber: 75000,
    airDensity: airProperties.density,
    viscosity: airProperties.viscosity,
    temperature: 72,
    pressure: 29.92,
    turbulenceIntensity: 6
  };

  const vavConfig = AdvancedFittingCalculator.getFittingConfiguration('term_vav_single_duct');
  let advancedFittingLoss = 0;

  if (vavConfig) {
    const vavResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
      vavConfig,
      vavFlowConditions
    );
    
    console.log(`VAV Terminal Pressure Loss: ${vavResult.pressureLoss.toFixed(3)} in wg`);
    console.log(`VAV Terminal Efficiency: ${vavResult.performanceMetrics.efficiency.toFixed(1)}%`);
    advancedFittingLoss += vavResult.pressureLoss;
  }

  // Add transition fitting to main trunk
  const transitionFlowConditions: FlowConditions = {
    velocity: 2000,
    volumeFlow: 4000,
    massFlow: 4000 * airProperties.density / 60,
    reynoldsNumber: 100000,
    airDensity: airProperties.density,
    viscosity: airProperties.viscosity,
    temperature: 72,
    pressure: 29.92,
    turbulenceIntensity: 8
  };

  const transitionConfig = AdvancedFittingCalculator.getFittingConfiguration('trans_rect_round_gradual');
  if (transitionConfig) {
    const transitionResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
      transitionConfig,
      transitionFlowConditions
    );
    
    console.log(`Transition Pressure Loss: ${transitionResult.pressureLoss.toFixed(3)} in wg`);
    console.log(`Transition Flow Uniformity: ${transitionResult.performanceMetrics.flowUniformity.toFixed(1)}%`);
    advancedFittingLoss += transitionResult.pressureLoss;
  }

  // Complete system summary
  const totalSystemLoss = systemResult.totalPressureLoss + advancedFittingLoss;
  
  console.log('\n=== Complete System Summary ===');
  console.log(`Standard Components: ${systemResult.totalPressureLoss.toFixed(3)} in wg`);
  console.log(`Advanced Fittings: ${advancedFittingLoss.toFixed(3)} in wg`);
  console.log(`Total System Loss: ${totalSystemLoss.toFixed(3)} in wg`);
  
  const advancedFittingPercentage = (advancedFittingLoss / totalSystemLoss) * 100;
  console.log(`Advanced Fitting Impact: ${advancedFittingPercentage.toFixed(1)}% of total loss`);

  return {
    standardSystemLoss: systemResult.totalPressureLoss,
    advancedFittingLoss: advancedFittingLoss,
    totalSystemLoss: totalSystemLoss,
    advancedFittingPercentage: advancedFittingPercentage
  };
}

// Export all examples for easy execution
export const AdvancedFittingExamples = {
  calculateLaboratoryExhaustSystem,
  calculateVAVSystemPerformance,
  calculateIntegratedDuctSystem
};
