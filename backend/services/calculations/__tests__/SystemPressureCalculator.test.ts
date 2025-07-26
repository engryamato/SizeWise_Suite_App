/**
 * SystemPressureCalculator Tests
 * 
 * Comprehensive test suite for system-level pressure drop calculations
 * Tests complete duct systems with straight runs and fittings
 */

import { SystemPressureCalculator, DuctSegment, SystemCalculationInputs } from '../SystemPressureCalculator';

describe('SystemPressureCalculator', () => {
  
  // Test data setup
  const defaultDesignConditions = {
    temperature: 70,
    barometricPressure: 29.92,
    altitude: 0
  };

  const defaultCalculationOptions = {
    includeElevationEffects: false,
    includeTemperatureEffects: true,
    frictionMethod: 'darcy_weisbach' as const,
    roundingPrecision: 3
  };

  describe('Simple System Calculations', () => {
    test('should calculate pressure drop for straight duct only', () => {
      const segments: DuctSegment[] = [
        {
          id: 'seg-1',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.totalPressureLoss).toBeGreaterThan(0);
      expect(result.totalFrictionLoss).toBeGreaterThan(0);
      expect(result.totalMinorLoss).toBe(0); // No fittings
      expect(result.totalLength).toBe(10);
      expect(result.segmentResults).toHaveLength(1);
      expect(result.segmentResults[0].frictionLoss).toBeGreaterThan(0);
      expect(result.segmentResults[0].minorLoss).toBe(0);
    });

    test('should calculate pressure drop for fitting only', () => {
      const segments: DuctSegment[] = [
        {
          id: 'fitting-1',
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
          }
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.totalPressureLoss).toBeGreaterThan(0);
      expect(result.totalFrictionLoss).toBe(0); // No straight runs
      expect(result.totalMinorLoss).toBeGreaterThan(0);
      expect(result.totalLength).toBe(0);
      expect(result.segmentResults).toHaveLength(1);
      expect(result.segmentResults[0].frictionLoss).toBe(0);
      expect(result.segmentResults[0].minorLoss).toBeGreaterThan(0);
      expect(result.segmentResults[0].kFactor).toBe(0.15); // From fitting coefficients
    });
  });

  describe('Complex System Calculations', () => {
    test('should calculate complete system: straight → elbow → straight', () => {
      // This matches the user's example: 10″ round duct → 10′ run → 90° elbow → 10′ run
      const segments: DuctSegment[] = [
        {
          id: 'straight-1',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        },
        {
          id: 'elbow-1',
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
          }
        },
        {
          id: 'straight-2',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.totalPressureLoss).toBeGreaterThan(0);
      expect(result.totalFrictionLoss).toBeGreaterThan(0);
      expect(result.totalMinorLoss).toBeGreaterThan(0);
      expect(result.totalLength).toBe(20); // Two 10-foot segments
      expect(result.segmentResults).toHaveLength(3);

      // Check individual segments
      expect(result.segmentResults[0].frictionLoss).toBeGreaterThan(0);
      expect(result.segmentResults[0].minorLoss).toBe(0);
      expect(result.segmentResults[1].frictionLoss).toBe(0);
      expect(result.segmentResults[1].minorLoss).toBeGreaterThan(0);
      expect(result.segmentResults[2].frictionLoss).toBeGreaterThan(0);
      expect(result.segmentResults[2].minorLoss).toBe(0);

      // Total should equal sum of parts
      const calculatedTotal = result.totalFrictionLoss + result.totalMinorLoss;
      expect(result.totalPressureLoss).toBeCloseTo(calculatedTotal, 3);
    });

    test('should handle system with multiple fittings', () => {
      const segments: DuctSegment[] = [
        {
          id: 'straight-1',
          type: 'straight',
          ductShape: 'round',
          length: 5,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        },
        {
          id: 'elbow-1',
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
          }
        },
        {
          id: 'straight-2',
          type: 'straight',
          ductShape: 'round',
          length: 5,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        },
        {
          id: 'tee-1',
          type: 'fitting',
          ductShape: 'round',
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel',
          fittingConfig: {
            type: 'tee_round_branch_90deg',
            ductShape: 'round',
            diameter: 10,
            subtype: 'straight_through',
            parameter: '0.5'
          }
        },
        {
          id: 'straight-3',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.segmentResults).toHaveLength(5);
      expect(result.totalLength).toBe(20); // 5 + 5 + 10 feet
      
      // Should have both friction and minor losses
      expect(result.totalFrictionLoss).toBeGreaterThan(0);
      expect(result.totalMinorLoss).toBeGreaterThan(0);
      
      // Multiple fittings should increase minor losses
      const fittingSegments = result.segmentResults.filter(seg => seg.segmentType === 'fitting');
      expect(fittingSegments).toHaveLength(2);
      fittingSegments.forEach(seg => {
        expect(seg.minorLoss).toBeGreaterThan(0);
        expect(seg.kFactor).toBeGreaterThan(0);
      });
    });
  });

  describe('Rectangular Duct Systems', () => {
    test('should calculate rectangular duct system', () => {
      const segments: DuctSegment[] = [
        {
          id: 'rect-1',
          type: 'straight',
          ductShape: 'rectangular',
          length: 10,
          width: 12,
          height: 8,
          airflow: 1000,
          material: 'galvanized_steel'
        },
        {
          id: 'rect-elbow-1',
          type: 'fitting',
          ductShape: 'rectangular',
          width: 12,
          height: 8,
          airflow: 1000,
          material: 'galvanized_steel',
          fittingConfig: {
            type: '90deg_rect_smooth',
            ductShape: 'rectangular',
            width: 12,
            height: 8,
            parameter: '1.0'
          }
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.totalPressureLoss).toBeGreaterThan(0);
      expect(result.segmentResults).toHaveLength(2);
      expect(result.segmentResults[0].frictionLoss).toBeGreaterThan(0);
      expect(result.segmentResults[1].minorLoss).toBeGreaterThan(0);
    });
  });

  describe('System Validation', () => {
    test('should validate velocity compliance', () => {
      // High velocity system
      const segments: DuctSegment[] = [
        {
          id: 'high-velocity',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 6, // Small diameter for high velocity
          airflow: 1000,
          material: 'galvanized_steel'
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.maxVelocity).toBeGreaterThan(2500); // Above SMACNA limit
      expect(result.complianceStatus.velocityCompliant).toBe(false);
      expect(result.systemWarnings.length).toBeGreaterThan(0);
      expect(result.systemWarnings.some(w => w.includes('velocities outside SMACNA limits'))).toBe(true);
    });

    test('should validate pressure compliance', () => {
      // Create a system with high pressure loss
      const segments: DuctSegment[] = [];
      
      // Add many fittings to create high pressure loss
      for (let i = 0; i < 20; i++) {
        segments.push({
          id: `elbow-${i}`,
          type: 'fitting',
          ductShape: 'round',
          diameter: 8,
          airflow: 1500,
          material: 'galvanized_steel',
          fittingConfig: {
            type: '90deg_round_mitered',
            ductShape: 'round',
            diameter: 8,
            parameter: 'single_miter' // High K-factor
          }
        });
      }

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.totalPressureLoss).toBeGreaterThan(6.0); // Above SMACNA limit
      expect(result.complianceStatus.pressureCompliant).toBe(false);
      expect(result.systemWarnings.some(w => w.includes('pressure loss') && w.includes('exceeds SMACNA limit'))).toBe(true);
    });

    test('should provide recommendations for optimization', () => {
      const segments: DuctSegment[] = [
        {
          id: 'suboptimal',
          type: 'fitting',
          ductShape: 'round',
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel',
          fittingConfig: {
            type: '90deg_round_smooth',
            ductShape: 'round',
            diameter: 10,
            parameter: '0.5' // Sharp radius - should trigger recommendation
          }
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      const result = SystemPressureCalculator.calculateSystemPressure(inputs);

      expect(result.segmentResults[0].recommendations.length).toBeGreaterThan(0);
      expect(result.segmentResults[0].recommendations[0]).toContain('radius-to-diameter ratio');
    });
  });

  describe('Design Conditions Effects', () => {
    test('should adjust for temperature effects', () => {
      const segments: DuctSegment[] = [
        {
          id: 'temp-test',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        }
      ];

      const standardInputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: { temperature: 70, barometricPressure: 29.92, altitude: 0 },
        calculationOptions: defaultCalculationOptions
      };

      const hotInputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: { temperature: 120, barometricPressure: 29.92, altitude: 0 },
        calculationOptions: defaultCalculationOptions
      };

      const standardResult = SystemPressureCalculator.calculateSystemPressure(standardInputs);
      const hotResult = SystemPressureCalculator.calculateSystemPressure(hotInputs);

      // Hot air is less dense, should have lower pressure loss
      expect(hotResult.totalPressureLoss).toBeLessThan(standardResult.totalPressureLoss);
    });

    test('should adjust for altitude effects', () => {
      const segments: DuctSegment[] = [
        {
          id: 'altitude-test',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
        }
      ];

      const seaLevelInputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: { temperature: 70, barometricPressure: 29.92, altitude: 0 },
        calculationOptions: defaultCalculationOptions
      };

      const highAltitudeInputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: { temperature: 70, barometricPressure: 24.89, altitude: 5000 },
        calculationOptions: defaultCalculationOptions
      };

      const seaLevelResult = SystemPressureCalculator.calculateSystemPressure(seaLevelInputs);
      const highAltitudeResult = SystemPressureCalculator.calculateSystemPressure(highAltitudeInputs);

      // High altitude air is less dense, should have lower pressure loss
      expect(highAltitudeResult.totalPressureLoss).toBeLessThan(seaLevelResult.totalPressureLoss);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for empty segment list', () => {
      const inputs: SystemCalculationInputs = {
        segments: [],
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      expect(() => {
        SystemPressureCalculator.calculateSystemPressure(inputs);
      }).toThrow('System must contain at least one segment');
    });

    test('should throw error for invalid airflow', () => {
      const segments: DuctSegment[] = [
        {
          id: 'invalid',
          type: 'straight',
          ductShape: 'round',
          length: 10,
          diameter: 10,
          airflow: -100, // Invalid negative airflow
          material: 'galvanized_steel'
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      expect(() => {
        SystemPressureCalculator.calculateSystemPressure(inputs);
      }).toThrow('Invalid airflow');
    });

    test('should throw error for straight segment without length', () => {
      const segments: DuctSegment[] = [
        {
          id: 'no-length',
          type: 'straight',
          ductShape: 'round',
          diameter: 10,
          airflow: 1000,
          material: 'galvanized_steel'
          // Missing length
        }
      ];

      const inputs: SystemCalculationInputs = {
        segments,
        systemType: 'supply',
        designConditions: defaultDesignConditions,
        calculationOptions: defaultCalculationOptions
      };

      expect(() => {
        SystemPressureCalculator.calculateSystemPressure(inputs);
      }).toThrow('must have positive length');
    });
  });

  describe('Utility Functions', () => {
    test('should return system limits for different system types', () => {
      const supplyLimits = SystemPressureCalculator.getSystemLimits('supply');
      const returnLimits = SystemPressureCalculator.getSystemLimits('return');
      const exhaustLimits = SystemPressureCalculator.getSystemLimits('exhaust');

      expect(supplyLimits.velocity.max).toBe(2500);
      expect(supplyLimits.pressure.max).toBe(6.0);
      
      expect(returnLimits.velocity.max).toBe(2000);
      expect(returnLimits.pressure.max).toBe(4.0);
      
      expect(exhaustLimits.velocity.max).toBe(3000);
      expect(exhaustLimits.pressure.max).toBe(8.0);
    });
  });
});
