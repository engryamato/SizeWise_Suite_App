/**
 * System Analysis Examples
 * 
 * Practical examples demonstrating the use of Phase 3 Priority 3: Advanced System Analysis Tools
 * Shows real-world usage patterns and integration with existing SizeWise Suite components.
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import { SystemPerformanceAnalysisEngine } from '../SystemPerformanceAnalysisEngine';
import { EnergyEfficiencyAnalysisEngine } from '../EnergyEfficiencyAnalysisEngine';
import { LifecycleCostAnalysisEngine } from '../LifecycleCostAnalysisEngine';
import { EnvironmentalImpactAssessmentEngine } from '../EnvironmentalImpactAssessmentEngine';
import { ComplianceCheckingEngine } from '../ComplianceCheckingEngine';
import { SystemPressureCalculator } from '../SystemPressureCalculator';
import { FittingLossCalculator } from '../FittingLossCalculator';
import { AirPropertiesCalculator } from '../AirPropertiesCalculator';
import {
  SystemConfiguration,
  PerformanceMetrics,
  CostAnalysisMethod,
  UncertaintyLevel
} from '../types/SystemAnalysisTypes';

/**
 * Example 1: Complete Office Building HVAC Analysis
 * 
 * This example demonstrates a complete analysis workflow for a typical
 * office building HVAC system, from initial design through compliance checking.
 */
export async function completeOfficeAnalysisExample(): Promise<void> {
  console.log('=== Complete Office Building HVAC Analysis Example ===\n');

  // Step 1: Define the system configuration
  const officeSystem: SystemConfiguration = {
    id: 'office_building_001',
    name: '50,000 sq ft Office Building HVAC System',
    systemType: 'supply_air',
    designParameters: {
      designAirflow: 25000, // CFM
      designPressure: 4.2, // in. w.g.
      designTemperature: 75, // °F
      designHumidity: 50, // % RH
      elevation: 500, // ft above sea level
      airDensity: 0.075 // lb/ft³
    },
    ductConfiguration: {
      shape: 'rectangular',
      material: 'galvanized_steel',
      insulation: {
        type: 'fiberglass',
        thickness: 2,
        rValue: 6.0
      },
      sealingClass: 'class_a'
    },
    operatingConditions: {
      operatingHours: 2800, // hours/year
      loadFactor: 0.8,
      seasonalVariation: 0.25,
      maintenanceSchedule: 'standard'
    },
    location: {
      climateZone: '4A',
      region: 'US-IL',
      jurisdiction: 'Chicago'
    }
  };

  console.log(`Analyzing system: ${officeSystem.name}`);
  console.log(`Design airflow: ${officeSystem.designParameters.designAirflow.toLocaleString()} CFM`);
  console.log(`Design pressure: ${officeSystem.designParameters.designPressure} in. w.g.\n`);

  // Step 2: Calculate system pressure using existing Phase 1 components
  const systemPressureResult = await SystemPressureCalculator.calculateSystemPressure({
    airflow: officeSystem.designParameters.designAirflow,
    ductSections: [
      {
        id: 'main_supply_trunk',
        length: 200,
        hydraulicDiameter: 2.0,
        roughness: 0.0003,
        area: 4.0,
        velocity: officeSystem.designParameters.designAirflow / 4.0 / 60
      },
      {
        id: 'branch_duct_1',
        length: 80,
        hydraulicDiameter: 1.2,
        roughness: 0.0003,
        area: 1.44,
        velocity: 8000 / 1.44 / 60
      }
    ],
    fittings: [
      {
        id: 'main_elbow',
        type: 'elbow_90_rectangular',
        kFactor: 0.25,
        airflow: officeSystem.designParameters.designAirflow
      },
      {
        id: 'branch_tee',
        type: 'tee_branch',
        kFactor: 0.4,
        airflow: 8000
      }
    ],
    airProperties: {
      density: officeSystem.designParameters.airDensity,
      viscosity: 1.2e-5,
      temperature: officeSystem.designParameters.designTemperature
    }
  });

  console.log('System Pressure Calculation Results:');
  console.log(`Total pressure loss: ${systemPressureResult.totalPressureLoss.toFixed(2)} in. w.g.`);
  console.log(`Friction losses: ${systemPressureResult.frictionLosses.toFixed(2)} in. w.g.`);
  console.log(`Fitting losses: ${systemPressureResult.fittingLosses.toFixed(2)} in. w.g.\n`);

  // Step 3: Create performance metrics from calculated results
  const performanceMetrics: PerformanceMetrics = {
    totalSystemPressure: {
      value: systemPressureResult.totalPressureLoss,
      units: 'in_wg',
      accuracy: 0.95,
      measurementSource: 'calculated',
      timestamp: new Date()
    },
    airflowEfficiency: {
      value: 87,
      units: 'percent',
      accuracy: 0.9,
      measurementSource: 'calculated',
      timestamp: new Date()
    },
    fanPerformance: {
      value: 82,
      units: 'percent',
      accuracy: 0.85,
      measurementSource: 'estimated',
      timestamp: new Date()
    },
    systemEfficiency: {
      value: 84,
      units: 'percent',
      accuracy: 0.9,
      measurementSource: 'calculated',
      timestamp: new Date()
    },
    environmentalMetrics: {
      value: 78,
      units: 'score',
      accuracy: 0.8,
      measurementSource: 'calculated',
      timestamp: new Date()
    },
    systemBalance: {
      value: 92,
      units: 'percent',
      accuracy: 0.85,
      measurementSource: 'calculated',
      timestamp: new Date()
    }
  };

  // Step 4: Perform system performance analysis
  const performanceAnalysis = await SystemPerformanceAnalysisEngine.analyzeSystemPerformance(
    officeSystem,
    performanceMetrics
  );

  console.log('System Performance Analysis Results:');
  console.log(`Analysis ID: ${performanceAnalysis.id}`);
  console.log(`Overall system efficiency: ${performanceAnalysis.performanceMetrics.systemEfficiency.value}%`);
  console.log(`Performance trend: ${performanceAnalysis.trendAnalysis.trendDirection}`);
  console.log(`Benchmark percentile: ${performanceAnalysis.benchmarkComparison.percentile}th percentile`);
  console.log(`Performance alerts: ${performanceAnalysis.alerts.length} alerts generated`);
  console.log(`Recommendations: ${performanceAnalysis.recommendations.length} recommendations\n`);

  // Step 5: Perform energy efficiency analysis
  const energyAnalysis = await EnergyEfficiencyAnalysisEngine.analyzeEnergyEfficiency(
    officeSystem,
    performanceMetrics
  );

  console.log('Energy Efficiency Analysis Results:');
  console.log(`Annual energy consumption: ${energyAnalysis.energyConsumption.totalConsumption.value.toLocaleString()} kWh`);
  console.log(`Specific fan power: ${energyAnalysis.efficiencyMetrics.specificFanPower.toFixed(2)} W/CFM`);
  console.log(`Annual energy cost: $${energyAnalysis.energyCosts.currentCosts.totalCost.toLocaleString()}`);
  console.log(`Carbon footprint: ${energyAnalysis.carbonFootprint.totalEmissions.value.toLocaleString()} kg CO2e/year`);
  console.log(`Energy benchmark: ${energyAnalysis.benchmarkComparison.benchmarkType} - ${energyAnalysis.benchmarkComparison.percentile}th percentile\n`);

  // Step 6: Perform lifecycle cost analysis
  const costAnalysis = await LifecycleCostAnalysisEngine.analyzeLifecycleCosts(
    officeSystem,
    energyAnalysis,
    {
      analysisHorizon: 20,
      discountRate: 0.06,
      inflationRate: 0.025,
      energyEscalationRate: 0.03,
      currency: 'USD',
      analysisMethod: CostAnalysisMethod.NET_PRESENT_VALUE,
      uncertaintyLevel: UncertaintyLevel.MEDIUM
    }
  );

  console.log('Lifecycle Cost Analysis Results:');
  console.log(`Initial cost: $${costAnalysis.initialCosts.totalInitialCost.toLocaleString()}`);
  console.log(`20-year operating costs (PV): $${costAnalysis.operatingCosts.totalPresentValue.toLocaleString()}`);
  console.log(`20-year maintenance costs (PV): $${costAnalysis.maintenanceCosts.totalPresentValue.toLocaleString()}`);
  console.log(`Total cost of ownership (PV): $${costAnalysis.totalCostOfOwnership.totalPresentValue.toLocaleString()}`);
  console.log(`Cost per CFM: $${costAnalysis.totalCostOfOwnership.costPerCFM.toFixed(2)}`);
  console.log(`Simple payback period: ${costAnalysis.totalCostOfOwnership.paybackPeriod.toFixed(1)} years`);
  console.log(`Cost optimization recommendations: ${costAnalysis.recommendations.length} recommendations\n`);

  // Step 7: Perform environmental impact assessment
  const environmentalAnalysis = await EnvironmentalImpactAssessmentEngine.assessEnvironmentalImpact(
    officeSystem,
    energyAnalysis,
    {
      annualOperatingHours: 2800,
      loadProfile: 'variable',
      seasonalVariation: 25,
      futureGrowth: 1.5
    },
    {
      region: 'US-IL',
      climateZone: '4A',
      gridMix: {
        renewable: 25,
        nuclear: 35,
        naturalGas: 30,
        coal: 8,
        other: 2
      },
      localRegulations: ['Chicago Energy Code', 'Illinois Energy Efficiency Standards']
    }
  );

  console.log('Environmental Impact Assessment Results:');
  console.log(`Total carbon emissions: ${environmentalAnalysis.carbonFootprint.totalEmissions.value.toLocaleString()} kg CO2e/year`);
  console.log(`Operational emissions: ${environmentalAnalysis.carbonFootprint.operationalEmissions.value.toLocaleString()} kg CO2e/year`);
  console.log(`Embodied emissions: ${environmentalAnalysis.carbonFootprint.embodiedEmissions.value.toLocaleString()} kg CO2e/year`);
  console.log(`Environmental score: ${environmentalAnalysis.sustainabilityMetrics.environmentalScore.overallScore.toFixed(1)}/100`);
  console.log(`LEED readiness: ${environmentalAnalysis.sustainabilityMetrics.certificationReadiness.leedReadiness}`);
  console.log(`Carbon offset opportunities: ${environmentalAnalysis.carbonFootprint.offsetOpportunities.length} opportunities\n`);

  // Step 8: Perform compliance checking
  const complianceAnalysis = await ComplianceCheckingEngine.performComplianceAnalysis(
    officeSystem,
    performanceMetrics,
    energyAnalysis,
    environmentalAnalysis,
    ['ASHRAE 90.1', 'SMACNA', 'IECC 2021'],
    {
      country: 'US',
      state: 'IL',
      city: 'Chicago',
      climateZone: '4A',
      jurisdiction: 'Chicago'
    }
  );

  console.log('Compliance Analysis Results:');
  console.log(`Overall compliance: ${complianceAnalysis.overallCompliance.compliancePercentage.toFixed(1)}%`);
  console.log(`ASHRAE 90.1 compliance: ${complianceAnalysis.ashraeCompliance.overallStatus}`);
  console.log(`SMACNA compliance: ${complianceAnalysis.smacnaCompliance.overallStatus}`);
  console.log(`Energy code compliance: ${complianceAnalysis.energyCodeCompliance.overallStatus}`);
  console.log(`Critical issues: ${complianceAnalysis.overallCompliance.criticalIssues}`);
  console.log(`Warnings: ${complianceAnalysis.overallCompliance.warnings}`);
  console.log(`Compliance recommendations: ${complianceAnalysis.recommendations.length} recommendations\n`);

  // Step 9: Generate summary report
  console.log('=== ANALYSIS SUMMARY ===');
  console.log(`System: ${officeSystem.name}`);
  console.log(`Performance Score: ${performanceAnalysis.performanceMetrics.systemEfficiency.value}%`);
  console.log(`Energy Efficiency: ${energyAnalysis.efficiencyMetrics.specificFanPower.toFixed(2)} W/CFM`);
  console.log(`20-Year Total Cost: $${costAnalysis.totalCostOfOwnership.totalPresentValue.toLocaleString()}`);
  console.log(`Environmental Score: ${environmentalAnalysis.sustainabilityMetrics.environmentalScore.overallScore.toFixed(1)}/100`);
  console.log(`Compliance: ${complianceAnalysis.overallCompliance.compliancePercentage.toFixed(1)}%`);
  
  const totalRecommendations = performanceAnalysis.recommendations.length + 
                              costAnalysis.recommendations.length + 
                              complianceAnalysis.recommendations.length;
  console.log(`Total Recommendations: ${totalRecommendations}`);
  console.log('=== END ANALYSIS ===\n');
}

/**
 * Example 2: High-Performance System Optimization
 * 
 * This example shows how to use the analysis tools to evaluate and optimize
 * a high-performance HVAC system for maximum efficiency and compliance.
 */
export async function highPerformanceOptimizationExample(): Promise<void> {
  console.log('=== High-Performance System Optimization Example ===\n');

  const highPerformanceSystem: SystemConfiguration = {
    id: 'high_performance_001',
    name: 'LEED Platinum Office Building System',
    systemType: 'supply_air',
    designParameters: {
      designAirflow: 15000,
      designPressure: 2.8, // Lower pressure for efficiency
      designTemperature: 75,
      designHumidity: 50,
      elevation: 1200,
      airDensity: 0.074
    },
    ductConfiguration: {
      shape: 'round', // More efficient shape
      material: 'galvanized_steel',
      insulation: {
        type: 'high_performance_foam',
        thickness: 3,
        rValue: 12.0 // Higher R-value
      },
      sealingClass: 'class_a_plus' // Enhanced sealing
    },
    operatingConditions: {
      operatingHours: 2200, // Optimized schedule
      loadFactor: 0.7, // Variable load operation
      seasonalVariation: 0.3,
      maintenanceSchedule: 'enhanced'
    },
    location: {
      climateZone: '5A',
      region: 'US-CO',
      jurisdiction: 'Denver'
    }
  };

  // Simulate high-performance metrics
  const highPerformanceMetrics: PerformanceMetrics = {
    totalSystemPressure: {
      value: 2.6,
      units: 'in_wg',
      accuracy: 0.98,
      measurementSource: 'measured',
      timestamp: new Date()
    },
    airflowEfficiency: {
      value: 94,
      units: 'percent',
      accuracy: 0.95,
      measurementSource: 'measured',
      timestamp: new Date()
    },
    fanPerformance: {
      value: 89,
      units: 'percent',
      accuracy: 0.9,
      measurementSource: 'measured',
      timestamp: new Date()
    },
    systemEfficiency: {
      value: 91,
      units: 'percent',
      accuracy: 0.95,
      measurementSource: 'measured',
      timestamp: new Date()
    },
    environmentalMetrics: {
      value: 88,
      units: 'score',
      accuracy: 0.9,
      measurementSource: 'calculated',
      timestamp: new Date()
    },
    systemBalance: {
      value: 97,
      units: 'percent',
      accuracy: 0.9,
      measurementSource: 'measured',
      timestamp: new Date()
    }
  };

  // Perform comprehensive analysis
  const performanceAnalysis = await SystemPerformanceAnalysisEngine.analyzeSystemPerformance(
    highPerformanceSystem,
    highPerformanceMetrics
  );

  const energyAnalysis = await EnergyEfficiencyAnalysisEngine.analyzeEnergyEfficiency(
    highPerformanceSystem,
    highPerformanceMetrics
  );

  const environmentalAnalysis = await EnvironmentalImpactAssessmentEngine.assessEnvironmentalImpact(
    highPerformanceSystem,
    energyAnalysis
  );

  console.log('High-Performance System Results:');
  console.log(`System efficiency: ${performanceAnalysis.performanceMetrics.systemEfficiency.value}%`);
  console.log(`Specific fan power: ${energyAnalysis.efficiencyMetrics.specificFanPower.toFixed(2)} W/CFM`);
  console.log(`Environmental score: ${environmentalAnalysis.sustainabilityMetrics.environmentalScore.overallScore.toFixed(1)}/100`);
  console.log(`LEED readiness: ${environmentalAnalysis.sustainabilityMetrics.certificationReadiness.leedReadiness}`);
  console.log(`Energy Star readiness: ${environmentalAnalysis.sustainabilityMetrics.certificationReadiness.energyStarReadiness}\n`);

  // Compare with baseline system
  console.log('Performance Comparison vs. Standard System:');
  console.log(`Efficiency improvement: +${(91 - 84).toFixed(1)}%`);
  console.log(`Energy savings: ~${((1.25 - energyAnalysis.efficiencyMetrics.specificFanPower) / 1.25 * 100).toFixed(1)}%`);
  console.log(`Environmental score improvement: +${(88 - 78).toFixed(1)} points`);
  console.log('=== END OPTIMIZATION EXAMPLE ===\n');
}

/**
 * Example 3: Retrofit Analysis and Comparison
 * 
 * This example demonstrates how to analyze and compare different retrofit
 * options for an existing HVAC system.
 */
export async function retrofitAnalysisExample(): Promise<void> {
  console.log('=== Retrofit Analysis and Comparison Example ===\n');

  // Define existing system
  const existingSystem: SystemConfiguration = {
    id: 'existing_system_001',
    name: 'Existing 1990s Office Building System',
    systemType: 'supply_air',
    designParameters: {
      designAirflow: 20000,
      designPressure: 5.5, // High pressure - inefficient
      designTemperature: 75,
      designHumidity: 50,
      elevation: 800,
      airDensity: 0.075
    },
    ductConfiguration: {
      shape: 'rectangular',
      material: 'galvanized_steel',
      insulation: {
        type: 'fiberglass',
        thickness: 1, // Minimal insulation
        rValue: 3.0
      },
      sealingClass: 'class_c' // Poor sealing
    },
    operatingConditions: {
      operatingHours: 3200, // Inefficient operation
      loadFactor: 0.9, // Constant high load
      seasonalVariation: 0.1,
      maintenanceSchedule: 'minimal'
    }
  };

  // Define retrofit options
  const retrofitOption1: SystemConfiguration = {
    ...existingSystem,
    id: 'retrofit_option_1',
    name: 'Retrofit Option 1: Duct Sealing + Controls',
    designParameters: {
      ...existingSystem.designParameters,
      designPressure: 4.8 // Improved with sealing
    },
    ductConfiguration: {
      ...existingSystem.ductConfiguration,
      sealingClass: 'class_a' // Improved sealing
    },
    operatingConditions: {
      ...existingSystem.operatingConditions,
      operatingHours: 2800, // Better controls
      loadFactor: 0.75
    }
  };

  const retrofitOption2: SystemConfiguration = {
    ...existingSystem,
    id: 'retrofit_option_2',
    name: 'Retrofit Option 2: Complete System Upgrade',
    designParameters: {
      ...existingSystem.designParameters,
      designPressure: 3.2 // New ductwork design
    },
    ductConfiguration: {
      shape: 'round', // More efficient
      material: 'galvanized_steel',
      insulation: {
        type: 'high_performance_foam',
        thickness: 2.5,
        rValue: 10.0
      },
      sealingClass: 'class_a_plus'
    },
    operatingConditions: {
      operatingHours: 2400, // VFD and advanced controls
      loadFactor: 0.65,
      seasonalVariation: 0.25,
      maintenanceSchedule: 'standard'
    }
  };

  console.log('Analyzing retrofit options...\n');

  // Analyze each option (simplified for example)
  const options = [
    { config: existingSystem, name: 'Existing System' },
    { config: retrofitOption1, name: 'Retrofit Option 1' },
    { config: retrofitOption2, name: 'Retrofit Option 2' }
  ];

  for (const option of options) {
    console.log(`--- ${option.name} ---`);
    
    // Simulate performance metrics based on system characteristics
    const sfp = option.config.designPressure * 0.3; // Simplified SFP calculation
    const efficiency = Math.max(60, 100 - option.config.designPressure * 8);
    
    console.log(`Estimated SFP: ${sfp.toFixed(2)} W/CFM`);
    console.log(`Estimated efficiency: ${efficiency.toFixed(1)}%`);
    console.log(`Operating hours: ${option.config.operatingConditions?.operatingHours || 'N/A'}`);
    console.log(`Sealing class: ${option.config.ductConfiguration?.sealingClass || 'N/A'}`);
    console.log('');
  }

  console.log('Retrofit Comparison Summary:');
  console.log('Option 1 (Sealing + Controls): Moderate cost, good ROI');
  console.log('Option 2 (Complete Upgrade): High cost, excellent performance');
  console.log('Recommendation: Start with Option 1, plan Option 2 for future');
  console.log('=== END RETROFIT EXAMPLE ===\n');
}

// Export all examples for easy execution
export const SystemAnalysisExamples = {
  completeOfficeAnalysisExample,
  highPerformanceOptimizationExample,
  retrofitAnalysisExample
};
