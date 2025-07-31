/**
 * FittingLossCalculator Tests
 * 
 * Comprehensive test suite for fitting loss calculations
 * Tests K-factor lookups, velocity pressure calculations, and fitting loss calculations
 */

// FIXED: Import from correct lib path instead of non-existent backend path
import { FittingLossCalculator, FittingConfiguration } from '../../../lib/services/calculations/FittingLossCalculator';

describe('FittingLossCalculator', () => {
  
  describe('Velocity Pressure Calculations', () => {
    test('should calculate velocity pressure correctly for standard conditions', () => {
      const result = FittingLossCalculator.calculateVelocityPressure({ velocity: 1000 });
      
      // VP = (V/4005)² for standard air density
      const expected = Math.pow(1000 / 4005, 2);
      expect(result).toBeCloseTo(expected, 4);
    });

    test('should adjust velocity pressure for non-standard air density', () => {
      const standardResult = FittingLossCalculator.calculateVelocityPressure({ velocity: 1000 });
      const adjustedResult = FittingLossCalculator.calculateVelocityPressure({ 
        velocity: 1000, 
        airDensity: 0.0375 // Half standard density
      });
      
      expect(adjustedResult).toBeCloseTo(standardResult * 0.5, 4);
    });

    test('should handle zero velocity', () => {
      const result = FittingLossCalculator.calculateVelocityPressure({ velocity: 0 });
      expect(result).toBe(0);
    });
  });

  describe('Round Elbow Calculations', () => {
    test('should calculate 90° smooth elbow with R/D = 1.5', () => {
      const config: FittingConfiguration = {
        type: '90deg_round_smooth',
        ductShape: 'round',
        diameter: 10,
        parameter: '1.5'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(0.15); // From fitting_coefficients.json
      expect(result.pressureLoss).toBeGreaterThan(0);
      expect(result.fittingType).toBe('90deg_round_smooth');
      expect(result.configuration).toBe('R/D = 1.5');
      expect(result.warnings).toHaveLength(0); // No warnings for good R/D ratio
    });

    test('should warn about sharp radius elbows', () => {
      const config: FittingConfiguration = {
        type: '90deg_round_smooth',
        ductShape: 'round',
        diameter: 10,
        parameter: '0.5'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(0.60); // Higher K for sharp turn
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Sharp radius');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should handle mitered elbows', () => {
      const config: FittingConfiguration = {
        type: '90deg_round_mitered',
        ductShape: 'round',
        diameter: 10,
        parameter: 'single_miter'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(1.20); // High K for single miter
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Single miter');
    });
  });

  describe('Tee Calculations', () => {
    test('should calculate round tee straight-through flow', () => {
      const config: FittingConfiguration = {
        type: 'tee_round_branch_90deg',
        ductShape: 'round',
        diameter: 10,
        subtype: 'straight_through',
        parameter: '0.5'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(0.30); // From fitting_coefficients.json
      expect(result.configuration).toContain('straight_through');
      expect(result.configuration).toContain('0.5');
    });

    test('should calculate round tee branch flow', () => {
      const config: FittingConfiguration = {
        type: 'tee_round_branch_90deg',
        ductShape: 'round',
        diameter: 10,
        subtype: 'branch_flow',
        parameter: '0.5'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(1.00); // Higher K for branch flow
      expect(result.configuration).toContain('branch_flow');
    });

    test('should warn about large branch area ratios', () => {
      const config: FittingConfiguration = {
        type: 'tee_round_branch_90deg',
        ductShape: 'round',
        diameter: 10,
        subtype: 'straight_through',
        parameter: '0.75'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Large branch area ratio');
    });
  });

  describe('Transition Calculations', () => {
    test('should calculate gradual round-to-round transition', () => {
      const config: FittingConfiguration = {
        type: 'round_to_round_gradual',
        ductShape: 'round',
        diameter: 10,
        parameter: '2.0'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(0.05); // Very low K for gradual transition
      expect(result.configuration).toBe('L/D = 2.0');
      expect(result.warnings).toHaveLength(0); // No warnings for good L/D ratio
    });

    test('should warn about short transitions', () => {
      const config: FittingConfiguration = {
        type: 'round_to_round_gradual',
        ductShape: 'round',
        diameter: 10,
        parameter: '1.0'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Short transition');
    });
  });

  describe('Damper Calculations', () => {
    test('should calculate butterfly damper at various angles', () => {
      const testAngles = ['90', '60', '45', '30'];
      const expectedKs = [0.2, 0.9, 1.8, 5.2];

      testAngles.forEach((angle, index) => {
        const config: FittingConfiguration = {
          type: 'butterfly_damper',
          ductShape: 'round',
          diameter: 10,
          parameter: angle
        };

        const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
        
        expect(result.kFactor).toBe(expectedKs[index]);
        expect(result.configuration).toBe(`${angle}° open`);
      });
    });

    test('should warn about restrictive damper positions', () => {
      const config: FittingConfiguration = {
        type: 'butterfly_damper',
        ductShape: 'round',
        diameter: 10,
        parameter: '30'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('significantly restricting');
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown fitting types gracefully', () => {
      const config: FittingConfiguration = {
        type: 'unknown_fitting_type',
        ductShape: 'round',
        diameter: 10
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(0.5); // Default K-factor
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('not found');
    });

    test('should handle missing parameters gracefully', () => {
      const config: FittingConfiguration = {
        type: '90deg_round_smooth',
        ductShape: 'round',
        diameter: 10
        // Missing parameter
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      expect(result.kFactor).toBe(0.25); // Default to R/D = 1.0
      expect(result.configuration).toBe('R/D = 1.0');
    });
  });

  describe('Utility Functions', () => {
    test('should return available round fittings', () => {
      const fittings = FittingLossCalculator.getAvailableFittings('round');
      
      expect(fittings).toContain('90deg_round_smooth');
      expect(fittings).toContain('tee_round_branch_90deg');
      expect(fittings).toContain('round_to_round_gradual');
      expect(fittings).toContain('butterfly_damper');
    });

    test('should return available rectangular fittings', () => {
      const fittings = FittingLossCalculator.getAvailableFittings('rectangular');
      
      expect(fittings).toContain('90deg_rect_smooth');
      expect(fittings).toContain('rect_to_rect_gradual');
      expect(fittings).toContain('butterfly_damper');
    });

    test('should return fitting metadata', () => {
      const metadata = FittingLossCalculator.getFittingMetadata();
      
      expect(metadata.version).toBeDefined();
      expect(metadata.standard).toBe('ASHRAE/SMACNA');
      expect(metadata.sources).toBeInstanceOf(Array);
    });
  });

  describe('Integration Tests', () => {
    test('should calculate realistic pressure loss for common fitting', () => {
      // Test case: 10" round duct, 1000 CFM, 90° elbow with R/D = 1.5
      const config: FittingConfiguration = {
        type: '90deg_round_smooth',
        ductShape: 'round',
        diameter: 10,
        parameter: '1.5'
      };

      const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
      
      // Velocity = 1000 CFM / (π × (10/12)²/4) = ~1833 FPM
      // VP = (1833/4005)² ≈ 0.21 in wg
      // Pressure loss = K × VP = 0.15 × 0.21 ≈ 0.031 in wg
      
      expect(result.velocity).toBeUndefined(); // Not calculated in this function
      expect(result.velocityPressure).toBeCloseTo(0.21, 1);
      expect(result.pressureLoss).toBeCloseTo(0.031, 2);
      expect(result.kFactor).toBe(0.15);
    });

    test('should handle complete system fitting calculation', () => {
      // Multiple fittings in sequence
      const fittings = [
        { type: '90deg_round_smooth', parameter: '1.5' },
        { type: 'tee_round_branch_90deg', subtype: 'straight_through', parameter: '0.5' },
        { type: '90deg_round_smooth', parameter: '1.5' }
      ];

      let totalPressureLoss = 0;

      fittings.forEach(fitting => {
        const config: FittingConfiguration = {
          type: fitting.type,
          ductShape: 'round',
          diameter: 10,
          subtype: fitting.subtype,
          parameter: fitting.parameter
        };

        const result = FittingLossCalculator.calculateFittingLoss(config, 1000);
        totalPressureLoss += result.pressureLoss;
      });

      expect(totalPressureLoss).toBeGreaterThan(0);
      expect(totalPressureLoss).toBeLessThan(1.0); // Reasonable total for this system
    });
  });
});
