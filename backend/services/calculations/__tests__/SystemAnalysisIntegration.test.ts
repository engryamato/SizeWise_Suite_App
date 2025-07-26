/**
 * System Analysis Integration Tests
 * 
 * Comprehensive integration tests for Phase 3 Priority 3: Advanced System Analysis Tools
 * Tests the integration between SystemPerformanceAnalysisEngine, EnergyEfficiencyAnalysisEngine,
 * LifecycleCostAnalysisEngine, EnvironmentalImpactAssessmentEngine, and ComplianceCheckingEngine
 * with existing Phase 1/2/3 Priority 1/2 components.
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { SystemPerformanceAnalysisEngine } from '../SystemPerformanceAnalysisEngine';
import { EnergyEfficiencyAnalysisEngine } from '../EnergyEfficiencyAnalysisEngine';
import { LifecycleCostAnalysisEngine } from '../LifecycleCostAnalysisEngine';
import { EnvironmentalImpactAssessmentEngine } from '../EnvironmentalImpactAssessmentEngine';
import { ComplianceCheckingEngine } from '../ComplianceCheckingEngine';
import { SystemPressureCalculator } from '../SystemPressureCalculator';
import { FittingLossCalculator } from '../FittingLossCalculator';
import { AdvancedFittingCalculator } from '../AdvancedFittingCalculator';
import { SystemOptimizationEngine } from '../SystemOptimizationEngine';
import { AirPropertiesCalculator } from '../AirPropertiesCalculator';
import {
  SystemConfiguration,
  AnalysisType,
  AnalysisScope,
  TimeHorizon,
  CostAnalysisMethod,
  UncertaintyLevel,
  ComplianceStatus
} from '../types/SystemAnalysisTypes';

describe('System Analysis Integration Tests', () => {
  let testSystemConfiguration: SystemConfiguration;

  beforeEach(() => {
    // Create a comprehensive test system configuration
    testSystemConfiguration = {
      id: 'test_system_001',
      name: 'Test Office Building HVAC System',
      systemType: 'supply_air',
      designParameters: {
        designAirflow: 10000, // CFM
        designPressure: 3.5, // in. w.g.
        designTemperature: 75, // °F
        designHumidity: 50, // % RH
        elevation: 1000, // ft
        airDensity: 0.075 // lb/ft³
      },
      ductConfiguration: {
        shape: 'rectangular',
        material: 'galvanized_steel',
        insulation: {
          type: 'fiberglass',
          thickness: 2, // inches
          rValue: 6.0
        },
        sealingClass: 'class_a'
      },
      operatingConditions: {
        operatingHours: 2500, // hours/year
        loadFactor: 0.75,
        seasonalVariation: 0.2,
        maintenanceSchedule: 'standard'
      },
      location: {
        climateZone: '4A',
        region: 'US-NY',
        jurisdiction: 'New York City'
      }
    };
  });

  describe('Complete System Analysis Workflow', () => {
    test('should perform comprehensive system analysis from design to compliance', async () => {
      // Step 1: Calculate system performance metrics using existing Phase 1/2 components
      const systemPressureResult = await SystemPressureCalculator.calculateSystemPressure({
        airflow: testSystemConfiguration.designParameters.designAirflow,
        ductSections: [
          {
            id: 'main_supply',
            length: 100,
            hydraulicDiameter: 1.5,
            roughness: 0.0003,
            area: 2.25,
            velocity: testSystemConfiguration.designParameters.designAirflow / 2.25 / 60
          }
        ],
        fittings: [
          {
            id: 'supply_elbow',
            type: 'elbow_90_rectangular',
            kFactor: 0.25,
            airflow: testSystemConfiguration.designParameters.designAirflow
          }
        ],
        airProperties: {
          density: testSystemConfiguration.designParameters.airDensity,
          viscosity: 1.2e-5,
          temperature: testSystemConfiguration.designParameters.designTemperature
        }
      });

      expect(systemPressureResult.totalPressureLoss).toBeGreaterThan(0);
      expect(systemPressureResult.totalPressureLoss).toBeLessThan(10);

      // Step 2: Perform system performance analysis
      const performanceAnalysis = await SystemPerformanceAnalysisEngine.analyzeSystemPerformance(
        testSystemConfiguration,
        {
          totalSystemPressure: {
            value: systemPressureResult.totalPressureLoss,
            units: 'in_wg',
            accuracy: 0.95,
            measurementSource: 'calculated',
            timestamp: new Date()
          },
          airflowEfficiency: {
            value: 85,
            units: 'percent',
            accuracy: 0.9,
            measurementSource: 'calculated',
            timestamp: new Date()
          },
          fanPerformance: {
            value: 80,
            units: 'percent',
            accuracy: 0.85,
            measurementSource: 'estimated',
            timestamp: new Date()
          },
          systemEfficiency: {
            value: 82,
            units: 'percent',
            accuracy: 0.9,
            measurementSource: 'calculated',
            timestamp: new Date()
          },
          environmentalMetrics: {
            value: 75,
            units: 'score',
            accuracy: 0.8,
            measurementSource: 'calculated',
            timestamp: new Date()
          },
          systemBalance: {
            value: 90,
            units: 'percent',
            accuracy: 0.85,
            measurementSource: 'calculated',
            timestamp: new Date()
          }
        }
      );

      expect(performanceAnalysis.id).toBeDefined();
      expect(performanceAnalysis.performanceMetrics).toBeDefined();
      expect(performanceAnalysis.trendAnalysis).toBeDefined();
      expect(performanceAnalysis.benchmarkComparison).toBeDefined();
      expect(performanceAnalysis.recommendations).toHaveLength(expect.any(Number));

      // Step 3: Perform energy efficiency analysis
      const energyAnalysis = await EnergyEfficiencyAnalysisEngine.analyzeEnergyEfficiency(
        testSystemConfiguration,
        performanceAnalysis.performanceMetrics
      );

      expect(energyAnalysis.id).toBeDefined();
      expect(energyAnalysis.energyConsumption.totalConsumption.value).toBeGreaterThan(0);
      expect(energyAnalysis.efficiencyMetrics.specificFanPower).toBeGreaterThan(0);
      expect(energyAnalysis.energyCosts.currentCosts.totalCost).toBeGreaterThan(0);
      expect(energyAnalysis.carbonFootprint.totalEmissions.value).toBeGreaterThan(0);

      // Step 4: Perform lifecycle cost analysis
      const costAnalysis = await LifecycleCostAnalysisEngine.analyzeLifecycleCosts(
        testSystemConfiguration,
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

      expect(costAnalysis.id).toBeDefined();
      expect(costAnalysis.initialCosts.totalInitialCost).toBeGreaterThan(0);
      expect(costAnalysis.operatingCosts.totalPresentValue).toBeGreaterThan(0);
      expect(costAnalysis.totalCostOfOwnership.totalPresentValue).toBeGreaterThan(0);
      expect(costAnalysis.recommendations).toHaveLength(expect.any(Number));

      // Step 5: Perform environmental impact assessment
      const environmentalAnalysis = await EnvironmentalImpactAssessmentEngine.assessEnvironmentalImpact(
        testSystemConfiguration,
        energyAnalysis,
        {
          annualOperatingHours: 2500,
          loadProfile: 'variable',
          seasonalVariation: 20,
          futureGrowth: 2
        },
        {
          region: 'US-NY',
          climateZone: '4A',
          gridMix: {
            renewable: 30,
            nuclear: 25,
            naturalGas: 35,
            coal: 8,
            other: 2
          },
          localRegulations: ['NYC Energy Code', 'Local Law 97']
        }
      );

      expect(environmentalAnalysis.id).toBeDefined();
      expect(environmentalAnalysis.carbonFootprint.totalEmissions.value).toBeGreaterThan(0);
      expect(environmentalAnalysis.sustainabilityMetrics.environmentalScore.overallScore).toBeGreaterThan(0);
      expect(environmentalAnalysis.greenBuildingCompliance).toBeDefined();

      // Step 6: Perform compliance checking
      const complianceAnalysis = await ComplianceCheckingEngine.performComplianceAnalysis(
        testSystemConfiguration,
        performanceAnalysis.performanceMetrics,
        energyAnalysis,
        environmentalAnalysis,
        ['ASHRAE 90.1', 'SMACNA', 'IECC 2021'],
        {
          country: 'US',
          state: 'NY',
          city: 'New York',
          climateZone: '4A',
          jurisdiction: 'New York City'
        }
      );

      expect(complianceAnalysis.id).toBeDefined();
      expect(complianceAnalysis.overallCompliance.compliancePercentage).toBeGreaterThanOrEqual(0);
      expect(complianceAnalysis.overallCompliance.compliancePercentage).toBeLessThanOrEqual(100);
      expect(complianceAnalysis.ashraeCompliance.checks).toHaveLength(expect.any(Number));
      expect(complianceAnalysis.smacnaCompliance.checks).toHaveLength(expect.any(Number));

      // Verify integration between components
      expect(energyAnalysis.systemId).toBe(testSystemConfiguration.id);
      expect(costAnalysis.systemId).toBe(testSystemConfiguration.id);
      expect(environmentalAnalysis.systemId).toBe(testSystemConfiguration.id);
      expect(complianceAnalysis.systemId).toBe(testSystemConfiguration.id);

      // Verify data consistency across analyses
      expect(costAnalysis.operatingCosts.energyCosts.annual).toBeCloseTo(
        energyAnalysis.energyCosts.currentCosts.totalCost,
        -2 // Within $100
      );

      expect(environmentalAnalysis.carbonFootprint.operationalEmissions.value).toBeGreaterThan(0);
      expect(complianceAnalysis.overallCompliance.checks.length).toBeGreaterThan(5);
    });

    test('should handle optimization integration with system analysis', async () => {
      // Create optimization problem for the test system
      const optimizationProblem = {
        id: 'test_optimization_001',
        name: 'System Analysis Optimization',
        systemConfiguration: testSystemConfiguration,
        objectives: [
          {
            name: 'minimize_pressure_loss',
            type: 'minimize' as const,
            weight: 0.4,
            target: 2.5,
            priority: 'high' as const
          },
          {
            name: 'minimize_energy_cost',
            type: 'minimize' as const,
            weight: 0.3,
            target: 15000,
            priority: 'high' as const
          },
          {
            name: 'minimize_carbon_emissions',
            type: 'minimize' as const,
            weight: 0.3,
            target: 1000,
            priority: 'medium' as const
          }
        ],
        constraints: [
          {
            name: 'min_airflow',
            type: 'greater_than_equal',
            value: 9000,
            tolerance: 0.05
          },
          {
            name: 'max_pressure',
            type: 'less_than_equal',
            value: 4.0,
            tolerance: 0.1
          }
        ],
        variables: [
          {
            name: 'duct_diameter',
            type: 'continuous',
            min: 12,
            max: 48,
            step: 1,
            current: 24
          }
        ]
      };

      // Run optimization (simplified for testing)
      const optimizationResult = await SystemOptimizationEngine.optimizeSystem(optimizationProblem);

      expect(optimizationResult.id).toBeDefined();
      expect(optimizationResult.bestSolution).toBeDefined();
      expect(optimizationResult.convergenceHistory).toHaveLength(expect.any(Number));

      // Analyze optimized system
      const optimizedConfig = {
        ...testSystemConfiguration,
        id: 'optimized_system_001'
      };

      const optimizedPerformance = await SystemPerformanceAnalysisEngine.analyzeSystemPerformance(
        optimizedConfig,
        {
          totalSystemPressure: {
            value: optimizationResult.bestSolution.objectiveValues[0],
            units: 'in_wg',
            accuracy: 0.95,
            measurementSource: 'optimized',
            timestamp: new Date()
          },
          airflowEfficiency: {
            value: 88,
            units: 'percent',
            accuracy: 0.9,
            measurementSource: 'optimized',
            timestamp: new Date()
          },
          fanPerformance: {
            value: 85,
            units: 'percent',
            accuracy: 0.85,
            measurementSource: 'optimized',
            timestamp: new Date()
          },
          systemEfficiency: {
            value: 87,
            units: 'percent',
            accuracy: 0.9,
            measurementSource: 'optimized',
            timestamp: new Date()
          },
          environmentalMetrics: {
            value: 82,
            units: 'score',
            accuracy: 0.8,
            measurementSource: 'optimized',
            timestamp: new Date()
          },
          systemBalance: {
            value: 95,
            units: 'percent',
            accuracy: 0.85,
            measurementSource: 'optimized',
            timestamp: new Date()
          }
        }
      );

      expect(optimizedPerformance.performanceMetrics.systemEfficiency.value).toBeGreaterThan(82);
      expect(optimizedPerformance.recommendations).toHaveLength(expect.any(Number));
    });

    test('should validate cross-component data consistency', async () => {
      // Perform all analyses
      const performanceAnalysis = await SystemPerformanceAnalysisEngine.analyzeSystemPerformance(
        testSystemConfiguration,
        {
          totalSystemPressure: { value: 3.2, units: 'in_wg', accuracy: 0.95, measurementSource: 'calculated', timestamp: new Date() },
          airflowEfficiency: { value: 85, units: 'percent', accuracy: 0.9, measurementSource: 'calculated', timestamp: new Date() },
          fanPerformance: { value: 80, units: 'percent', accuracy: 0.85, measurementSource: 'estimated', timestamp: new Date() },
          systemEfficiency: { value: 82, units: 'percent', accuracy: 0.9, measurementSource: 'calculated', timestamp: new Date() },
          environmentalMetrics: { value: 75, units: 'score', accuracy: 0.8, measurementSource: 'calculated', timestamp: new Date() },
          systemBalance: { value: 90, units: 'percent', accuracy: 0.85, measurementSource: 'calculated', timestamp: new Date() }
        }
      );

      const energyAnalysis = await EnergyEfficiencyAnalysisEngine.analyzeEnergyEfficiency(
        testSystemConfiguration,
        performanceAnalysis.performanceMetrics
      );

      const costAnalysis = await LifecycleCostAnalysisEngine.analyzeLifecycleCosts(
        testSystemConfiguration,
        energyAnalysis
      );

      const environmentalAnalysis = await EnvironmentalImpactAssessmentEngine.assessEnvironmentalImpact(
        testSystemConfiguration,
        energyAnalysis
      );

      // Validate system ID consistency
      expect(performanceAnalysis.systemId).toBe(testSystemConfiguration.id);
      expect(energyAnalysis.systemId).toBe(testSystemConfiguration.id);
      expect(costAnalysis.systemId).toBe(testSystemConfiguration.id);
      expect(environmentalAnalysis.systemId).toBe(testSystemConfiguration.id);

      // Validate energy consumption consistency
      const energyConsumptionFromEnergy = energyAnalysis.energyConsumption.totalConsumption.value;
      const energyConsumptionFromCost = costAnalysis.operatingCosts.energyCosts.annual / 0.12; // Assuming $0.12/kWh

      expect(Math.abs(energyConsumptionFromEnergy - energyConsumptionFromCost) / energyConsumptionFromEnergy)
        .toBeLessThan(0.1); // Within 10%

      // Validate carbon emissions consistency
      const carbonFromEnergy = energyAnalysis.carbonFootprint.totalEmissions.value;
      const carbonFromEnvironmental = environmentalAnalysis.carbonFootprint.totalEmissions.value;

      expect(Math.abs(carbonFromEnergy - carbonFromEnvironmental) / carbonFromEnergy)
        .toBeLessThan(0.05); // Within 5%

      // Validate performance metrics consistency
      expect(energyAnalysis.efficiencyMetrics.systemEfficiency)
        .toBeCloseTo(performanceAnalysis.performanceMetrics.systemEfficiency.value, 1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid system configurations gracefully', async () => {
      const invalidConfig = {
        ...testSystemConfiguration,
        designParameters: {
          ...testSystemConfiguration.designParameters,
          designAirflow: -1000 // Invalid negative airflow
        }
      };

      await expect(SystemPerformanceAnalysisEngine.analyzeSystemPerformance(
        invalidConfig,
        {
          totalSystemPressure: { value: 3.2, units: 'in_wg', accuracy: 0.95, measurementSource: 'calculated', timestamp: new Date() },
          airflowEfficiency: { value: 85, units: 'percent', accuracy: 0.9, measurementSource: 'calculated', timestamp: new Date() },
          fanPerformance: { value: 80, units: 'percent', accuracy: 0.85, measurementSource: 'estimated', timestamp: new Date() },
          systemEfficiency: { value: 82, units: 'percent', accuracy: 0.9, measurementSource: 'calculated', timestamp: new Date() },
          environmentalMetrics: { value: 75, units: 'score', accuracy: 0.8, measurementSource: 'calculated', timestamp: new Date() },
          systemBalance: { value: 90, units: 'percent', accuracy: 0.85, measurementSource: 'calculated', timestamp: new Date() }
        }
      )).rejects.toThrow();
    });

    test('should handle missing optional parameters', async () => {
      const minimalConfig = {
        id: 'minimal_system',
        name: 'Minimal Test System',
        systemType: 'supply_air' as const,
        designParameters: {
          designAirflow: 5000,
          designPressure: 2.5,
          designTemperature: 75,
          designHumidity: 50,
          elevation: 0,
          airDensity: 0.075
        }
      };

      const result = await SystemPerformanceAnalysisEngine.analyzeSystemPerformance(
        minimalConfig,
        {
          totalSystemPressure: { value: 2.5, units: 'in_wg', accuracy: 0.95, measurementSource: 'calculated', timestamp: new Date() },
          airflowEfficiency: { value: 80, units: 'percent', accuracy: 0.9, measurementSource: 'calculated', timestamp: new Date() },
          fanPerformance: { value: 75, units: 'percent', accuracy: 0.85, measurementSource: 'estimated', timestamp: new Date() },
          systemEfficiency: { value: 78, units: 'percent', accuracy: 0.9, measurementSource: 'calculated', timestamp: new Date() },
          environmentalMetrics: { value: 70, units: 'score', accuracy: 0.8, measurementSource: 'calculated', timestamp: new Date() },
          systemBalance: { value: 85, units: 'percent', accuracy: 0.85, measurementSource: 'calculated', timestamp: new Date() }
        }
      );

      expect(result.id).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
    });
  });
});
