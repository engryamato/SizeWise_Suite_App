/**
 * Advanced Fitting Calculator Test Suite
 * 
 * Comprehensive tests for Phase 3 advanced fitting calculations including:
 * - Multi-parameter K-factor calculations
 * - Performance curve interpolation
 * - Interaction effects
 * - Integration with existing Phase 1/2 components
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
  CalculationMethod,
  FittingComplexity,
  PerformanceClass
} from '../types/AdvancedFittingTypes';

describe('AdvancedFittingCalculator', () => {
  
  describe('Database Operations', () => {
    test('should load advanced fittings database successfully', () => {
      const fittings = AdvancedFittingCalculator.listAvailableFittings();
      expect(fittings).toBeDefined();
      expect(fittings.length).toBeGreaterThan(0);
      expect(fittings[0]).toHaveProperty('id');
      expect(fittings[0]).toHaveProperty('description');
      expect(fittings[0]).toHaveProperty('category');
    });

    test('should retrieve specific fitting configuration', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('trans_rect_round_gradual');
      expect(config).toBeDefined();
      expect(config?.id).toBe('trans_rect_round_gradual');
      expect(config?.category).toBe('transition');
      expect(config?.complexity).toBe('complex');
    });

    test('should return null for non-existent fitting', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('non_existent_fitting');
      expect(config).toBeNull();
    });
  });

  describe('Single K-Factor Calculations', () => {
    test('should calculate simple fire damper pressure loss', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('ctrl_fire_damper');
      expect(config).toBeDefined();

      const flowConditions: FlowConditions = {
        velocity: 1500,
        volumeFlow: 2000,
        massFlow: 150,
        reynoldsNumber: 75000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 5
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        flowConditions
      );

      expect(result).toBeDefined();
      expect(result.pressureLoss).toBeGreaterThan(0);
      expect(result.kFactor).toBeCloseTo(0.19, 1); // Base K-factor from database
      expect(result.calculationMethod).toBe(CalculationMethod.SINGLE_K_FACTOR);
      expect(result.warnings).toBeDefined();
      expect(result.validationResults.isValid).toBe(true);
    });
  });

  describe('Multi-Parameter Calculations', () => {
    test('should calculate complex transition pressure loss with parameter dependencies', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('trans_rect_round_gradual');
      expect(config).toBeDefined();

      const flowConditions: FlowConditions = {
        velocity: 2000,
        volumeFlow: 3000,
        massFlow: 225,
        reynoldsNumber: 100000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 8
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        flowConditions
      );

      expect(result).toBeDefined();
      expect(result.pressureLoss).toBeGreaterThan(0);
      expect(result.calculationMethod).toBe(CalculationMethod.MULTI_PARAMETER);
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.efficiency).toBeGreaterThan(0);
      expect(result.performanceMetrics.flowUniformity).toBe(85); // From database
    });

    test('should apply Reynolds number correction when enabled', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('trans_rect_round_gradual');
      expect(config).toBeDefined();

      // Test with high Reynolds number
      const highReFlowConditions: FlowConditions = {
        velocity: 3000,
        volumeFlow: 5000,
        massFlow: 375,
        reynoldsNumber: 200000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 10
      };

      const highReResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        highReFlowConditions
      );

      // Test with low Reynolds number
      const lowReFlowConditions: FlowConditions = {
        velocity: 1000,
        volumeFlow: 1500,
        massFlow: 112.5,
        reynoldsNumber: 50000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 6
      };

      const lowReResult = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        lowReFlowConditions
      );

      expect(highReResult.kFactor).not.toEqual(lowReResult.kFactor);
      expect(highReResult.calculationMethod).toBe(CalculationMethod.MULTI_PARAMETER);
      expect(lowReResult.calculationMethod).toBe(CalculationMethod.MULTI_PARAMETER);
    });
  });

  describe('Performance Curve Calculations', () => {
    test('should calculate VAV box pressure loss using performance curves', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('term_vav_single_duct');
      expect(config).toBeDefined();

      const flowConditions: FlowConditions = {
        velocity: 1200,
        volumeFlow: 1000,
        massFlow: 75,
        reynoldsNumber: 60000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 5
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        flowConditions
      );

      expect(result).toBeDefined();
      expect(result.pressureLoss).toBeGreaterThan(0);
      expect(result.calculationMethod).toBe(CalculationMethod.PERFORMANCE_CURVE);
      expect(result.performanceMetrics.flowUniformity).toBe(90); // From database
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Validation and Error Handling', () => {
    test('should validate flow within operating range', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('term_vav_single_duct');
      expect(config).toBeDefined();

      // Test flow below minimum
      const lowFlowConditions: FlowConditions = {
        velocity: 500,
        volumeFlow: 25, // Below minimum of 50 CFM
        massFlow: 1.875,
        reynoldsNumber: 25000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 3
      };

      expect(() => {
        AdvancedFittingCalculator.calculateAdvancedFittingLoss(config!, lowFlowConditions);
      }).toThrow('Flow 25 CFM outside fitting operating range');
    });

    test('should validate velocity range', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('ctrl_fire_damper');
      expect(config).toBeDefined();

      const invalidVelocityConditions: FlowConditions = {
        velocity: 7000, // Above maximum of 6000 FPM
        volumeFlow: 5000,
        massFlow: 375,
        reynoldsNumber: 350000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 15
      };

      expect(() => {
        AdvancedFittingCalculator.calculateAdvancedFittingLoss(config!, invalidVelocityConditions);
      }).toThrow('Velocity 7000 FPM outside reasonable range');
    });

    test('should generate validation warnings for suboptimal conditions', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('term_vav_single_duct');
      expect(config).toBeDefined();

      const highVelocityConditions: FlowConditions = {
        velocity: 2800, // High velocity that should trigger warning
        volumeFlow: 2000,
        massFlow: 150,
        reynoldsNumber: 140000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 12
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        highVelocityConditions
      );

      expect(result.validationResults.warnings.length).toBeGreaterThan(0);
      expect(result.validationResults.warnings.some(w => w.code === 'VR002')).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate comprehensive performance metrics', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('spec_sound_att_parallel');
      expect(config).toBeDefined();

      const flowConditions: FlowConditions = {
        velocity: 1800,
        volumeFlow: 4000,
        massFlow: 300,
        reynoldsNumber: 90000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 12
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        flowConditions
      );

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.efficiency).toBeGreaterThan(0);
      expect(result.performanceMetrics.efficiency).toBeLessThanOrEqual(100);
      expect(result.performanceMetrics.noiseGeneration).toBeGreaterThan(0);
      expect(result.performanceMetrics.energyLoss).toBeGreaterThan(0);
      expect(result.performanceMetrics.flowUniformity).toBe(80); // From database
      expect(result.performanceMetrics.pressureRecovery).toBe(40); // From database
    });
  });

  describe('Recommendations', () => {
    test('should generate optimization recommendations for poor efficiency', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('spec_sound_att_parallel');
      expect(config).toBeDefined();

      // High velocity conditions that should result in poor efficiency
      const highVelocityConditions: FlowConditions = {
        velocity: 2500,
        volumeFlow: 8000,
        massFlow: 600,
        reynoldsNumber: 125000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 15
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        highVelocityConditions
      );

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const optimizationRecs = result.recommendations.filter(r => r.type === 'optimization');
      expect(optimizationRecs.length).toBeGreaterThan(0);
    });

    test('should generate maintenance recommendations for control devices', () => {
      const config = AdvancedFittingCalculator.getFittingConfiguration('term_vav_single_duct');
      expect(config).toBeDefined();

      const flowConditions: FlowConditions = {
        velocity: 1500,
        volumeFlow: 1200,
        massFlow: 90,
        reynoldsNumber: 75000,
        airDensity: 0.075,
        viscosity: 0.0000121,
        temperature: 70,
        pressure: 29.92,
        turbulenceIntensity: 6
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        flowConditions
      );

      const maintenanceRecs = result.recommendations.filter(r => r.type === 'maintenance');
      expect(maintenanceRecs.length).toBeGreaterThan(0);
      expect(maintenanceRecs[0].description).toContain('inspection and calibration');
    });
  });

  describe('Integration with Existing Components', () => {
    test('should integrate with SystemPressureCalculator for complete system analysis', () => {
      // This test demonstrates integration with existing Phase 1/2 components
      const segments = [
        {
          id: 'segment1',
          length: 50,
          width: 24,
          height: 12,
          shape: 'rectangular' as const,
          material: 'galvanized_steel',
          roughness: 0.0005,
          airflow: 2000,
          fittings: [
            {
              type: 'elbow_90_rectangular',
              quantity: 1,
              K: 0.25
            }
          ],
          elevation: 0,
          temperature: 70,
          humidity: 50,
          pressure: 29.92,
          materialAge: 'new' as const,
          surfaceCondition: 'good' as const
        }
      ];

      const systemResult = SystemPressureCalculator.calculateEnhancedSystemPressure({
        segments: segments,
        systemType: 'supply',
        designConditions: {
          temperature: 70,
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

      expect(systemResult).toBeDefined();
      expect(systemResult.totalPressureLoss).toBeGreaterThan(0);
      expect(systemResult.segments).toHaveLength(1);
      expect(systemResult.segments[0].fittingLosses).toBeGreaterThan(0);
    });

    test('should work with AirPropertiesCalculator for environmental corrections', () => {
      const airConditions = {
        temperature: 85, // Higher temperature
        pressure: 28.5,  // Higher elevation
        humidity: 80     // High humidity
      };

      const airProperties = AirPropertiesCalculator.calculateAirProperties(airConditions);
      expect(airProperties).toBeDefined();

      const config = AdvancedFittingCalculator.getFittingConfiguration('trans_rect_round_gradual');
      expect(config).toBeDefined();

      const flowConditions: FlowConditions = {
        velocity: 1800,
        volumeFlow: 2500,
        massFlow: 2500 * airProperties.density / 60, // Convert to lb/min
        reynoldsNumber: 85000,
        airDensity: airProperties.density,
        viscosity: airProperties.viscosity,
        temperature: airConditions.temperature,
        pressure: airConditions.pressure,
        turbulenceIntensity: 8
      };

      const result = AdvancedFittingCalculator.calculateAdvancedFittingLoss(
        config!,
        flowConditions
      );

      expect(result).toBeDefined();
      expect(result.pressureLoss).toBeGreaterThan(0);
      // Pressure loss should be affected by non-standard air properties
      expect(result.pressureLoss).not.toBeCloseTo(0.15 * 0.2025, 2); // Standard conditions result
    });
  });
});
