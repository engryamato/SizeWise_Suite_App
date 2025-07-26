/**
 * Advanced Calculation Modules Integration Tests
 * 
 * Comprehensive test suite for Phase 3: Advanced Calculation Modules
 * Tests VelocityPressureCalculator and EnhancedFrictionCalculator
 * 
 * @version 3.0.0
 */

import { 
  VelocityPressureCalculator, 
  VelocityPressureMethod, 
  ValidationLevel,
  VelocityPressureInput 
} from '../VelocityPressureCalculator';

import { 
  EnhancedFrictionCalculator, 
  FrictionMethod, 
  FlowRegime,
  MaterialAge,
  SurfaceCondition,
  FrictionCalculationInput 
} from '../EnhancedFrictionCalculator';

describe('Advanced Calculation Modules', () => {
  
  describe('VelocityPressureCalculator', () => {
    
    describe('Basic Velocity Pressure Calculations', () => {
      test('should calculate velocity pressure using formula method', () => {
        const input: VelocityPressureInput = {
          velocity: 2000,
          method: VelocityPressureMethod.FORMULA
        };
        
        const result = VelocityPressureCalculator.calculateVelocityPressure(input);
        
        expect(result.velocityPressure).toBeCloseTo(0.249, 3);
        expect(result.method).toBe(VelocityPressureMethod.FORMULA);
        expect(result.velocity).toBe(2000);
        expect(result.airDensity).toBe(0.075);
        expect(result.densityRatio).toBe(1.0);
      });

      test('should calculate velocity pressure with custom air density', () => {
        const input: VelocityPressureInput = {
          velocity: 2000,
          method: VelocityPressureMethod.FORMULA,
          airDensity: 0.0375 // Half standard density
        };
        
        const result = VelocityPressureCalculator.calculateVelocityPressure(input);
        
        expect(result.velocityPressure).toBeCloseTo(0.125, 3);
        expect(result.densityRatio).toBe(0.5);
        expect(result.corrections.combined).toBeCloseTo(0.5, 3);
      });

      test('should calculate velocity pressure with environmental conditions', () => {
        const input: VelocityPressureInput = {
          velocity: 2000,
          method: VelocityPressureMethod.ENHANCED_FORMULA,
          airConditions: {
            temperature: 100, // Higher temperature
            altitude: 5000,   // Higher altitude
            humidity: 80      // Higher humidity
          }
        };
        
        const result = VelocityPressureCalculator.calculateVelocityPressure(input);
        
        expect(result.velocityPressure).toBeGreaterThan(0);
        expect(result.corrections.combined).not.toBe(1.0);
        expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Method Selection and Optimization', () => {
      test('should recommend optimal method for different conditions', () => {
        // Standard velocity, no special conditions
        const method1 = VelocityPressureCalculator.getOptimalMethod(2000);
        expect([
          VelocityPressureMethod.INTERPOLATED,
          VelocityPressureMethod.ENHANCED_FORMULA
        ]).toContain(method1);

        // High accuracy requirement
        const method2 = VelocityPressureCalculator.getOptimalMethod(2000, undefined, 'maximum');
        expect(method2).toBe(VelocityPressureMethod.CFD_CORRECTED);

        // Low velocity outside table range
        const method3 = VelocityPressureCalculator.getOptimalMethod(50);
        expect(method3).toBe(VelocityPressureMethod.ENHANCED_FORMULA);
      });

      test('should handle different calculation methods', () => {
        const baseInput: VelocityPressureInput = {
          velocity: 1500
        };

        const methods = [
          VelocityPressureMethod.FORMULA,
          VelocityPressureMethod.ENHANCED_FORMULA,
          VelocityPressureMethod.INTERPOLATED
        ];

        methods.forEach(method => {
          const input = { ...baseInput, method };
          const result = VelocityPressureCalculator.calculateVelocityPressure(input);
          
          expect(result.velocityPressure).toBeGreaterThan(0);
          expect(result.method).toBe(method);
          expect(result.accuracy).toBeGreaterThan(0.9);
        });
      });
    });

    describe('Inverse Calculations', () => {
      test('should calculate velocity from velocity pressure', () => {
        const velocityPressure = 0.249; // Approximately 2000 FPM
        
        const result = VelocityPressureCalculator.calculateVelocityFromPressure(velocityPressure);
        
        expect(result.velocity).toBeCloseTo(2000, 0);
        expect(result.accuracy).toBeGreaterThan(0.9);
        expect(result.warnings).toBeDefined();
      });

      test('should handle inverse calculation with air conditions', () => {
        const velocityPressure = 0.125;
        const airConditions = {
          temperature: 70,
          altitude: 0,
          humidity: 50
        };
        
        const result = VelocityPressureCalculator.calculateVelocityFromPressure(
          velocityPressure, 
          airConditions
        );
        
        expect(result.velocity).toBeGreaterThan(0);
        expect(result.accuracy).toBeGreaterThan(0.9);
      });
    });

    describe('Validation and Error Handling', () => {
      test('should validate inputs based on validation level', () => {
        const input: VelocityPressureInput = {
          velocity: 15000, // Very high velocity
          validationLevel: ValidationLevel.STRICT
        };
        
        const result = VelocityPressureCalculator.calculateVelocityPressure(input);
        
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes('High velocity'))).toBe(true);
      });

      test('should handle negative velocity', () => {
        const input: VelocityPressureInput = {
          velocity: -1000
        };
        
        expect(() => {
          VelocityPressureCalculator.calculateVelocityPressure(input);
        }).toThrow('Velocity cannot be negative');
      });
    });
  });

  describe('EnhancedFrictionCalculator', () => {
    
    describe('Basic Friction Calculations', () => {
      test('should calculate friction loss using Colebrook-White method', () => {
        const input: FrictionCalculationInput = {
          velocity: 2000,
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel',
          method: FrictionMethod.COLEBROOK_WHITE
        };
        
        const result = EnhancedFrictionCalculator.calculateFrictionLoss(input);
        
        expect(result.frictionLoss).toBeGreaterThan(0);
        expect(result.frictionFactor).toBeGreaterThan(0);
        expect(result.frictionRate).toBeGreaterThan(0);
        expect(result.method).toBe(FrictionMethod.COLEBROOK_WHITE);
        expect(result.flowRegime).toBeDefined();
        expect(result.reynoldsNumber).toBeGreaterThan(0);
      });

      test('should handle different friction calculation methods', () => {
        const baseInput: FrictionCalculationInput = {
          velocity: 2000,
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel'
        };

        const methods = [
          FrictionMethod.COLEBROOK_WHITE,
          FrictionMethod.SWAMEE_JAIN,
          FrictionMethod.HAALAND,
          FrictionMethod.CHEN,
          FrictionMethod.ENHANCED_DARCY
        ];

        methods.forEach(method => {
          const input = { ...baseInput, method };
          const result = EnhancedFrictionCalculator.calculateFrictionLoss(input);
          
          expect(result.frictionLoss).toBeGreaterThan(0);
          expect(result.method).toBe(method);
          expect(result.accuracy).toBeGreaterThan(0.9);
        });
      });

      test('should calculate friction with material aging effects', () => {
        const baseInput: FrictionCalculationInput = {
          velocity: 2000,
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel',
          materialAge: MaterialAge.NEW,
          surfaceCondition: SurfaceCondition.EXCELLENT
        };

        const newResult = EnhancedFrictionCalculator.calculateFrictionLoss(baseInput);

        const agedInput = {
          ...baseInput,
          materialAge: MaterialAge.POOR,
          surfaceCondition: SurfaceCondition.POOR
        };

        const agedResult = EnhancedFrictionCalculator.calculateFrictionLoss(agedInput);
        
        expect(agedResult.frictionLoss).toBeGreaterThan(newResult.frictionLoss);
        expect(agedResult.materialProperties.agingFactor).toBeGreaterThan(1.0);
        expect(agedResult.materialProperties.surfaceFactor).toBeGreaterThan(1.0);
      });
    });

    describe('Flow Regime Classification', () => {
      test('should correctly classify laminar flow', () => {
        const input: FrictionCalculationInput = {
          velocity: 100, // Very low velocity for laminar flow
          hydraulicDiameter: 6,
          length: 50,
          material: 'galvanized_steel'
        };
        
        const result = EnhancedFrictionCalculator.calculateFrictionLoss(input);
        
        expect(result.reynoldsNumber).toBeLessThan(2300);
        expect(result.flowRegime).toBe(FlowRegime.LAMINAR);
      });

      test('should correctly classify turbulent flow', () => {
        const input: FrictionCalculationInput = {
          velocity: 3000, // High velocity for turbulent flow
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel'
        };
        
        const result = EnhancedFrictionCalculator.calculateFrictionLoss(input);
        
        expect(result.reynoldsNumber).toBeGreaterThan(4000);
        expect([
          FlowRegime.TURBULENT_SMOOTH,
          FlowRegime.TURBULENT_ROUGH,
          FlowRegime.FULLY_ROUGH
        ]).toContain(result.flowRegime);
      });
    });

    describe('Environmental Corrections', () => {
      test('should apply environmental corrections', () => {
        const input: FrictionCalculationInput = {
          velocity: 2000,
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel',
          airConditions: {
            temperature: 120, // High temperature
            altitude: 8000,   // High altitude
            humidity: 90      // High humidity
          }
        };
        
        const result = EnhancedFrictionCalculator.calculateFrictionLoss(input);
        
        expect(result.environmentalCorrections.combined).not.toBe(1.0);
        expect(result.frictionLoss).toBeGreaterThan(0);
      });
    });

    describe('Method Optimization', () => {
      test('should recommend optimal method for different conditions', () => {
        // Laminar flow
        const method1 = EnhancedFrictionCalculator.getOptimalMethod(1000, 0.001);
        expect(method1).toBe(FrictionMethod.ENHANCED_DARCY);

        // Turbulent flow, high accuracy
        const method2 = EnhancedFrictionCalculator.getOptimalMethod(100000, 0.001, 'maximum');
        expect(method2).toBe(FrictionMethod.COLEBROOK_WHITE);

        // Turbulent flow, standard accuracy, smooth pipe
        const method3 = EnhancedFrictionCalculator.getOptimalMethod(50000, 0.0001, 'standard');
        expect(method3).toBe(FrictionMethod.SWAMEE_JAIN);

        // Turbulent flow, standard accuracy, rough pipe
        const method4 = EnhancedFrictionCalculator.getOptimalMethod(50000, 0.01, 'standard');
        expect(method4).toBe(FrictionMethod.CHEN);
      });
    });

    describe('Validation and Error Handling', () => {
      test('should validate inputs', () => {
        const input: FrictionCalculationInput = {
          velocity: 8000, // Very high velocity
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel',
          validationLevel: 'strict'
        };
        
        const result = EnhancedFrictionCalculator.calculateFrictionLoss(input);
        
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      test('should handle invalid inputs', () => {
        const input: FrictionCalculationInput = {
          velocity: -1000, // Negative velocity
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel'
        };
        
        expect(() => {
          EnhancedFrictionCalculator.calculateFrictionLoss(input);
        }).toThrow('Velocity must be positive');
      });
    });
  });

  describe('Integration Between Calculators', () => {
    test('should work together for complete duct analysis', () => {
      const velocity = 2000;
      const hydraulicDiameter = 12;
      const length = 100;
      const material = 'galvanized_steel';

      // Calculate velocity pressure
      const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
        velocity,
        method: VelocityPressureMethod.ENHANCED_FORMULA
      });

      // Calculate friction loss
      const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
        velocity,
        hydraulicDiameter,
        length,
        material,
        method: FrictionMethod.ENHANCED_DARCY
      });

      // Verify results are consistent
      expect(vpResult.velocity).toBe(velocity);
      expect(frictionResult.frictionLoss).toBeGreaterThan(0);
      expect(frictionResult.frictionRate).toBeGreaterThan(0);
      
      // Calculate total pressure loss (velocity pressure + friction loss)
      const totalPressureLoss = vpResult.velocityPressure + frictionResult.frictionLoss;
      expect(totalPressureLoss).toBeGreaterThan(vpResult.velocityPressure);
      expect(totalPressureLoss).toBeGreaterThan(frictionResult.frictionLoss);
    });

    test('should provide consistent results with existing calculators', () => {
      // This test ensures backward compatibility with existing calculation methods
      const velocity = 2000;
      
      // Test velocity pressure consistency
      const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
        velocity,
        method: VelocityPressureMethod.FORMULA
      });
      
      // Manual calculation for comparison
      const expectedVP = Math.pow(velocity / 4005, 2);
      expect(vpResult.velocityPressure).toBeCloseTo(expectedVP, 4);
    });
  });

  describe('Performance and Accuracy', () => {
    test('should complete calculations within reasonable time', () => {
      const startTime = Date.now();
      
      // Perform multiple calculations
      for (let i = 0; i < 100; i++) {
        VelocityPressureCalculator.calculateVelocityPressure({
          velocity: 1000 + i * 10,
          method: VelocityPressureMethod.ENHANCED_FORMULA
        });
        
        EnhancedFrictionCalculator.calculateFrictionLoss({
          velocity: 1000 + i * 10,
          hydraulicDiameter: 12,
          length: 100,
          material: 'galvanized_steel',
          method: FrictionMethod.ENHANCED_DARCY
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 200 calculations in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should provide uncertainty bounds', () => {
      const vpResult = VelocityPressureCalculator.calculateVelocityPressure({
        velocity: 2000,
        method: VelocityPressureMethod.ENHANCED_FORMULA
      });

      const frictionResult = EnhancedFrictionCalculator.calculateFrictionLoss({
        velocity: 2000,
        hydraulicDiameter: 12,
        length: 100,
        material: 'galvanized_steel',
        method: FrictionMethod.COLEBROOK_WHITE
      });

      expect(vpResult.uncertaintyBounds).toBeDefined();
      expect(vpResult.uncertaintyBounds!.lower).toBeLessThan(vpResult.velocityPressure);
      expect(vpResult.uncertaintyBounds!.upper).toBeGreaterThan(vpResult.velocityPressure);
      expect(vpResult.uncertaintyBounds!.confidenceLevel).toBeGreaterThan(0.9);

      expect(frictionResult.uncertaintyBounds).toBeDefined();
      expect(frictionResult.uncertaintyBounds!.lower).toBeLessThan(frictionResult.frictionLoss);
      expect(frictionResult.uncertaintyBounds!.upper).toBeGreaterThan(frictionResult.frictionLoss);
      expect(frictionResult.uncertaintyBounds!.confidenceLevel).toBeGreaterThan(0.9);
    });
  });
});
