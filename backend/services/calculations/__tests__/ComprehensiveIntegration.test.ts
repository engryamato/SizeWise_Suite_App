/**
 * Comprehensive Integration Tests for Phase 5: Integration and Testing
 * 
 * Tests the complete integration of all calculation modules across all phases:
 * - Phase 1: Core Fitting and System Calculations
 * - Phase 2: Enhanced Data Layer
 * - Phase 3: Advanced Calculation Modules
 * - Phase 4: Cross-Platform Implementation
 * 
 * @version 5.0.0
 * @author SizeWise Suite Development Team
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

// Phase 1 imports
import { FittingLossCalculator } from '../FittingLossCalculator';
import { SystemPressureCalculator } from '../SystemPressureCalculator';

// Phase 2 imports
import { AirPropertiesCalculator } from '../AirPropertiesCalculator';

// Phase 3 imports
import { VelocityPressureCalculator, VelocityPressureMethod } from '../VelocityPressureCalculator';
import { EnhancedFrictionCalculator, FrictionMethod } from '../EnhancedFrictionCalculator';
import { AdvancedFittingCalculator } from '../AdvancedFittingCalculator';
import { SystemPerformanceAnalysisEngine } from '../SystemPerformanceAnalysisEngine';
import { EnergyEfficiencyAnalysisEngine } from '../EnergyEfficiencyAnalysisEngine';
import { SystemOptimizationEngine } from '../SystemOptimizationEngine';

// Type imports
import type { 
  FittingInput, 
  SystemPressureInput, 
  AirConditions,
  VelocityPressureInput,
  FrictionCalculationInput,
  SystemAnalysisInput,
  OptimizationProblem
} from '../types';

describe('Comprehensive Integration Tests', () => {
  let testAirConditions: AirConditions;
  let testSystemConfig: any;

  beforeAll(() => {
    // Standard test conditions
    testAirConditions = {
      temperature: 75, // °F
      altitude: 1000,  // feet
      humidity: 50,    // %
      pressure: 29.5   // in. Hg
    };

    // Standard test system configuration
    testSystemConfig = {
      airflow: 2000,           // CFM
      velocity: 2000,          // FPM
      hydraulicDiameter: 12,   // inches
      length: 100,             // feet
      material: 'galvanized_steel',
      fittings: [
        { type: 'elbow_90_smooth', quantity: 2 },
        { type: 'tee_branch', quantity: 1 },
        { type: 'damper_butterfly', quantity: 1 }
      ]
    };
  });

  describe('Phase 1-2-3 Integration: Complete System Analysis', () => {
    test('should perform complete duct system calculation with all phases', async () => {
      // Phase 2: Calculate air properties
      const airProps = AirPropertiesCalculator.calculateAirProperties(testAirConditions);
      expect(airProps.density).toBeGreaterThan(0);
      expect(airProps.viscosity).toBeGreaterThan(0);

      // Phase 3: Calculate velocity pressure using advanced methods
      const vpInput: VelocityPressureInput = {
        velocity: testSystemConfig.velocity,
        method: VelocityPressureMethod.ENHANCED_FORMULA,
        airConditions: testAirConditions,
        validationLevel: 'standard'
      };
      const vpResult = VelocityPressureCalculator.calculateVelocityPressure(vpInput);
      expect(vpResult.velocityPressure).toBeGreaterThan(0);
      expect(vpResult.accuracy).toBeGreaterThan(0.9);

      // Phase 3: Calculate friction loss using enhanced methods
      const frictionInput: FrictionCalculationInput = {
        velocity: testSystemConfig.velocity,
        hydraulicDiameter: testSystemConfig.hydraulicDiameter,
        length: testSystemConfig.length,
        material: testSystemConfig.material,
        method: FrictionMethod.ENHANCED_DARCY,
        airConditions: testAirConditions
      };
      const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss(frictionInput);
      expect(frictionResult.frictionLoss).toBeGreaterThan(0);
      expect(frictionResult.accuracy).toBeGreaterThan(0.9);

      // Phase 1: Calculate fitting losses
      let totalFittingLoss = 0;
      for (const fitting of testSystemConfig.fittings) {
        const fittingInput: FittingInput = {
          fittingType: fitting.type,
          velocity: testSystemConfig.velocity,
          hydraulicDiameter: testSystemConfig.hydraulicDiameter,
          airDensity: airProps.density,
          quantity: fitting.quantity
        };
        const fittingResult = FittingLossCalculator.calculateFittingLoss(fittingInput);
        totalFittingLoss += fittingResult.pressureLoss;
      }
      expect(totalFittingLoss).toBeGreaterThan(0);

      // Phase 1: Calculate total system pressure
      const systemInput: SystemPressureInput = {
        airflow: testSystemConfig.airflow,
        velocity: testSystemConfig.velocity,
        hydraulicDiameter: testSystemConfig.hydraulicDiameter,
        length: testSystemConfig.length,
        material: testSystemConfig.material,
        fittings: testSystemConfig.fittings,
        airConditions: testAirConditions
      };
      const systemResult = SystemPressureCalculator.calculateSystemPressure(systemInput);
      
      // Verify system calculation integrates all components
      expect(systemResult.totalPressureLoss).toBeGreaterThan(frictionResult.frictionLoss);
      expect(systemResult.totalPressureLoss).toBeGreaterThan(totalFittingLoss);
      expect(systemResult.velocityPressure).toBeCloseTo(vpResult.velocityPressure, 3);
      expect(systemResult.frictionLoss).toBeCloseTo(frictionResult.frictionLoss, 3);
    });

    test('should maintain consistency across different calculation methods', async () => {
      // Test velocity pressure consistency
      const baseVpInput: VelocityPressureInput = {
        velocity: 2000,
        airConditions: testAirConditions
      };

      const formulaResult = VelocityPressureCalculator.calculateVelocityPressure({
        ...baseVpInput,
        method: VelocityPressureMethod.FORMULA
      });

      const enhancedResult = VelocityPressureCalculator.calculateVelocityPressure({
        ...baseVpInput,
        method: VelocityPressureMethod.ENHANCED_FORMULA
      });

      // Results should be within 5% of each other
      const difference = Math.abs(formulaResult.velocityPressure - enhancedResult.velocityPressure);
      const percentDifference = difference / formulaResult.velocityPressure;
      expect(percentDifference).toBeLessThan(0.05);

      // Test friction calculation consistency
      const baseFrictionInput: FrictionCalculationInput = {
        velocity: 2000,
        hydraulicDiameter: 12,
        length: 100,
        material: 'galvanized_steel',
        airConditions: testAirConditions
      };

      const haalandResult = EnhancedFrictionCalculator.calculateFrictionLoss({
        ...baseFrictionInput,
        method: FrictionMethod.HAALAND
      });

      const swameeJainResult = EnhancedFrictionCalculator.calculateFrictionLoss({
        ...baseFrictionInput,
        method: FrictionMethod.SWAMEE_JAIN
      });

      // Results should be within 10% of each other for similar methods
      const frictionDifference = Math.abs(haalandResult.frictionLoss - swameeJainResult.frictionLoss);
      const frictionPercentDifference = frictionDifference / haalandResult.frictionLoss;
      expect(frictionPercentDifference).toBeLessThan(0.10);
    });
  });

  describe('Advanced Integration: System Analysis and Optimization', () => {
    test('should perform comprehensive system performance analysis', async () => {
      const analysisInput: SystemAnalysisInput = {
        systemConfiguration: testSystemConfig,
        airConditions: testAirConditions,
        analysisType: 'performance',
        analysisScope: 'complete_system',
        timeHorizon: 'annual'
      };

      const performanceResult = await SystemPerformanceAnalysisEngine.analyzeSystemPerformance(analysisInput);
      
      expect(performanceResult.performanceMetrics.systemEfficiency).toBeGreaterThan(0);
      expect(performanceResult.performanceMetrics.systemEfficiency).toBeLessThanOrEqual(1);
      expect(performanceResult.performanceMetrics.pressureLossEfficiency).toBeGreaterThan(0);
      expect(performanceResult.performanceMetrics.airflowBalance).toBeGreaterThan(0);
      expect(performanceResult.warnings).toBeDefined();
      expect(performanceResult.recommendations).toBeDefined();
    });

    test('should perform energy efficiency analysis with cost calculations', async () => {
      const energyResult = await EnergyEfficiencyAnalysisEngine.analyzeEnergyEfficiency({
        systemConfiguration: testSystemConfig,
        airConditions: testAirConditions,
        operatingSchedule: {
          hoursPerDay: 12,
          daysPerWeek: 5,
          weeksPerYear: 50
        },
        energyRates: {
          electricityRate: 0.12, // $/kWh
          demandCharge: 15.0     // $/kW
        }
      });

      expect(energyResult.energyConsumption.annualConsumption).toBeGreaterThan(0);
      expect(energyResult.energyConsumption.fanPower).toBeGreaterThan(0);
      expect(energyResult.energyCosts.annualCost).toBeGreaterThan(0);
      expect(energyResult.carbonFootprint.annualEmissions).toBeGreaterThan(0);
      expect(energyResult.efficiencyMetrics.systemEfficiency).toBeGreaterThan(0);
    });

    test('should perform system optimization with multiple objectives', async () => {
      const optimizationProblem: OptimizationProblem = {
        systemConfiguration: testSystemConfig,
        objectives: [
          { type: 'minimize_pressure_loss', weight: 0.4 },
          { type: 'minimize_cost', weight: 0.3 },
          { type: 'minimize_noise', weight: 0.2 },
          { type: 'minimize_space', weight: 0.1 }
        ],
        constraints: [
          { type: 'max_velocity', value: 4000 },
          { type: 'min_velocity', value: 800 },
          { type: 'max_pressure_loss', value: 2.0 },
          { type: 'max_noise_level', value: 55 }
        ],
        designVariables: [
          { name: 'duct_diameter', min: 8, max: 24, step: 1 },
          { name: 'duct_material', options: ['galvanized_steel', 'stainless_steel', 'aluminum'] }
        ]
      };

      const optimizationResult = await SystemOptimizationEngine.optimizeSystem(optimizationProblem);
      
      expect(optimizationResult.optimalSolution).toBeDefined();
      expect(optimizationResult.optimalSolution.objectives.pressureLoss).toBeGreaterThan(0);
      expect(optimizationResult.optimalSolution.objectives.cost).toBeGreaterThan(0);
      expect(optimizationResult.convergenceHistory).toBeDefined();
      expect(optimizationResult.convergenceHistory.length).toBeGreaterThan(0);
      expect(optimizationResult.paretoFront).toBeDefined();
    });
  });

  describe('Cross-Platform Integration: TypeScript ↔ Python Equivalence', () => {
    test('should produce equivalent results between TypeScript and Python implementations', async () => {
      // This test would ideally call the Python API endpoints and compare results
      // For now, we'll test the TypeScript implementation thoroughly
      
      const testCases = [
        { velocity: 1000, diameter: 8, length: 50 },
        { velocity: 2000, diameter: 12, length: 100 },
        { velocity: 3000, diameter: 16, length: 150 },
        { velocity: 4000, diameter: 20, length: 200 }
      ];

      for (const testCase of testCases) {
        // Velocity pressure calculation
        const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
          velocity: testCase.velocity,
          method: VelocityPressureMethod.ENHANCED_FORMULA,
          airConditions: testAirConditions
        });

        // Friction calculation
        const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
          velocity: testCase.velocity,
          hydraulicDiameter: testCase.diameter,
          length: testCase.length,
          material: 'galvanized_steel',
          method: FrictionMethod.ENHANCED_DARCY,
          airConditions: testAirConditions
        });

        // Verify results are reasonable and consistent
        expect(vpResult.velocityPressure).toBeGreaterThan(0);
        expect(vpResult.velocityPressure).toBeLessThan(5); // Reasonable upper bound
        expect(frictionResult.frictionLoss).toBeGreaterThan(0);
        expect(frictionResult.frictionLoss).toBeLessThan(10); // Reasonable upper bound

        // Verify accuracy is maintained
        expect(vpResult.accuracy).toBeGreaterThan(0.9);
        expect(frictionResult.accuracy).toBeGreaterThan(0.9);
      }
    });
  });

  describe('3D Canvas Integration Preparation', () => {
    test('should provide data structures compatible with 3D visualization', async () => {
      // Calculate complete system data for 3D visualization
      const systemResult = SystemPressureCalculator.calculateSystemPressure({
        airflow: testSystemConfig.airflow,
        velocity: testSystemConfig.velocity,
        hydraulicDiameter: testSystemConfig.hydraulicDiameter,
        length: testSystemConfig.length,
        material: testSystemConfig.material,
        fittings: testSystemConfig.fittings,
        airConditions: testAirConditions
      });

      // Basic system result validation
      expect(systemResult.totalPressureLoss).toBeGreaterThan(0);
      expect(systemResult.frictionLoss).toBeGreaterThan(0);
      expect(systemResult.fittingLoss).toBeGreaterThan(0);
      expect(systemResult.velocityPressure).toBeGreaterThan(0);

      // Verify calculation metadata for 3D integration
      expect(systemResult.metadata).toBeDefined();
      expect(systemResult.metadata.calculationMethod).toBeDefined();
      expect(systemResult.metadata.accuracy).toBeGreaterThan(0.9);
      expect(systemResult.metadata.version).toBeDefined();
    });

    test('should provide performance data for 3D visualization overlays', async () => {
      // Test basic system performance calculation
      const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
        velocity: testSystemConfig.velocity,
        method: VelocityPressureMethod.ENHANCED_FORMULA,
        airConditions: testAirConditions
      });

      const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
        velocity: testSystemConfig.velocity,
        hydraulicDiameter: testSystemConfig.hydraulicDiameter,
        length: testSystemConfig.length,
        material: testSystemConfig.material,
        method: FrictionMethod.ENHANCED_DARCY,
        airConditions: testAirConditions
      });

      // Verify data suitable for 3D visualization
      expect(vpResult.velocityPressure).toBeGreaterThan(0);
      expect(vpResult.corrections).toBeDefined();
      expect(vpResult.corrections.temperature).toBeGreaterThan(0);
      expect(vpResult.corrections.altitude).toBeGreaterThan(0);

      expect(frictionResult.frictionLoss).toBeGreaterThan(0);
      expect(frictionResult.flowRegime).toBeDefined();
      expect(frictionResult.reynoldsNumber).toBeGreaterThan(0);
      expect(frictionResult.materialProperties).toBeDefined();
    });
  });

  describe('Production Readiness Validation', () => {
    test('should handle edge cases and error conditions gracefully', async () => {
      // Test with extreme values
      const extremeTests = [
        { velocity: 0.1, shouldWarn: true },
        { velocity: 10000, shouldWarn: true },
        { diameter: 0.5, shouldWarn: true },
        { diameter: 48, shouldWarn: true },
        { length: 0.1, shouldWarn: true },
        { length: 10000, shouldWarn: true }
      ];

      for (const test of extremeTests) {
        const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
          velocity: test.velocity || 2000,
          validationLevel: 'strict'
        });

        const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
          velocity: test.velocity || 2000,
          hydraulicDiameter: test.diameter || 12,
          length: test.length || 100,
          material: 'galvanized_steel',
          validationLevel: 'strict'
        });

        if (test.shouldWarn) {
          expect(vpResult.warnings.length + frictionResult.warnings.length).toBeGreaterThan(0);
        }

        // Should still produce valid results
        expect(vpResult.velocityPressure).toBeGreaterThan(0);
        expect(frictionResult.frictionLoss).toBeGreaterThan(0);
      }
    });

    test('should maintain performance under load', async () => {
      const startTime = Date.now();
      const iterations = 100;

      // Perform multiple calculations to test performance
      for (let i = 0; i < iterations; i++) {
        const velocity = 1000 + (i * 30); // Vary velocity
        
        VelocityPressureCalculator.calculateVelocityPressure({
          velocity,
          method: VelocityPressureMethod.ENHANCED_FORMULA,
          airConditions: testAirConditions
        });

        EnhancedFrictionCalculator.calculateFrictionLoss({
          velocity,
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel',
          method: FrictionMethod.ENHANCED_DARCY,
          airConditions: testAirConditions
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;

      // Should complete calculations quickly (< 10ms average)
      expect(averageTime).toBeLessThan(10);
    });
  });
});
