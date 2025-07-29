/**
 * WASMCalculationService Test Suite
 * 
 * Comprehensive tests for WebAssembly calculation service including:
 * - WASM module loading and initialization
 * - Performance benchmarking (WASM vs JavaScript)
 * - Fallback mechanism validation
 * - HVAC calculation accuracy
 * - Error handling and recovery
 * - Memory management
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { 
  WASMCalculationService,
  WASMCalculationConfig,
  AirDuctParameters,
  PressureDropParameters,
  HeatTransferParameters,
  SystemOptimizationParameters
} from '../WASMCalculationService';

// Mock WebAssembly for testing
const mockWASMModule = {
  calculateAirDuctSize: vi.fn().mockReturnValue(12.5),
  calculatePressureDrop: vi.fn().mockReturnValue(0.25),
  calculateHeatTransfer: vi.fn().mockReturnValue(15000),
  optimizeSystem: vi.fn().mockReturnValue({
    efficiency: 0.92,
    energySavings: 15.5,
    recommendations: ['Increase duct size', 'Optimize airflow']
  }),
  memory: new WebAssembly.Memory({ initial: 1 }),
  exports: {}
};

// Mock WebAssembly.instantiate
global.WebAssembly = {
  instantiate: vi.fn().mockResolvedValue({
    instance: {
      exports: mockWASMModule
    }
  }),
  Memory: class MockMemory {
    constructor(descriptor: any) {
      this.buffer = new ArrayBuffer(descriptor.initial * 65536);
    }
    buffer: ArrayBuffer;
  }
} as any;

describe('WASMCalculationService', () => {
  let wasmService: WASMCalculationService;
  let defaultConfig: WASMCalculationConfig;

  beforeEach(() => {
    defaultConfig = {
      enableWASM: true,
      fallbackToJS: true,
      performanceLogging: true,
      wasmModulePath: '/wasm/hvac-calculations.wasm'
    };
    
    wasmService = new WASMCalculationService(defaultConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    wasmService.cleanup();
  });

  // =============================================================================
  // WASM Initialization Tests
  // =============================================================================

  describe('WASM Initialization', () => {
    it('should initialize WASM module successfully', async () => {
      const initialized = await wasmService.initialize();
      
      expect(initialized).toBe(true);
      expect(wasmService.isWASMAvailable()).toBe(true);
      expect(global.WebAssembly.instantiate).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.any(Object)
      );
    });

    it('should handle WASM initialization failure gracefully', async () => {
      // Mock WASM instantiation failure
      (global.WebAssembly.instantiate as any).mockRejectedValueOnce(
        new Error('WASM instantiation failed')
      );

      const initialized = await wasmService.initialize();
      
      expect(initialized).toBe(false);
      expect(wasmService.isWASMAvailable()).toBe(false);
    });

    it('should fall back to JavaScript when WASM is disabled', async () => {
      const jsOnlyService = new WASMCalculationService({
        ...defaultConfig,
        enableWASM: false
      });

      const initialized = await jsOnlyService.initialize();
      
      expect(initialized).toBe(true);
      expect(jsOnlyService.isWASMAvailable()).toBe(false);
      
      jsOnlyService.cleanup();
    });

    it('should validate WASM module exports', async () => {
      await wasmService.initialize();
      
      const exports = wasmService.getWASMExports();
      
      expect(exports).toHaveProperty('calculateAirDuctSize');
      expect(exports).toHaveProperty('calculatePressureDrop');
      expect(exports).toHaveProperty('calculateHeatTransfer');
      expect(exports).toHaveProperty('optimizeSystem');
    });
  });

  // =============================================================================
  // Air Duct Calculation Tests
  // =============================================================================

  describe('Air Duct Calculations', () => {
    beforeEach(async () => {
      await wasmService.initialize();
    });

    it('should calculate air duct size using WASM', async () => {
      const parameters: AirDuctParameters = {
        airflow: 2000,
        velocity: 1200,
        frictionFactor: 0.02,
        roughness: 0.0001,
        temperature: 70,
        pressure: 14.7
      };

      const result = await wasmService.calculateAirDuctSize(parameters);

      expect(result.value).toBe(12.5);
      expect(result.method).toBe('wasm');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(mockWASMModule.calculateAirDuctSize).toHaveBeenCalledWith(
        parameters.airflow,
        parameters.velocity,
        parameters.frictionFactor,
        parameters.roughness,
        parameters.temperature,
        parameters.pressure
      );
    });

    it('should fall back to JavaScript when WASM fails', async () => {
      // Mock WASM function failure
      mockWASMModule.calculateAirDuctSize.mockImplementationOnce(() => {
        throw new Error('WASM calculation failed');
      });

      const parameters: AirDuctParameters = {
        airflow: 2000,
        velocity: 1200,
        frictionFactor: 0.02
      };

      const result = await wasmService.calculateAirDuctSize(parameters);

      expect(result.method).toBe('javascript');
      expect(result.value).toBeGreaterThan(0); // JavaScript fallback should work
    });

    it('should validate input parameters', async () => {
      const invalidParameters: AirDuctParameters = {
        airflow: -1000, // Invalid negative airflow
        velocity: 1200,
        frictionFactor: 0.02
      };

      await expect(wasmService.calculateAirDuctSize(invalidParameters))
        .rejects.toThrow('Invalid airflow value');
    });

    it('should handle edge cases in calculations', async () => {
      const edgeCaseParameters: AirDuctParameters = {
        airflow: 0.1, // Very low airflow
        velocity: 50, // Very low velocity
        frictionFactor: 0.001 // Very low friction
      };

      const result = await wasmService.calculateAirDuctSize(edgeCaseParameters);

      expect(result.value).toBeGreaterThan(0);
      expect(result.metadata).toHaveProperty('edgeCase', true);
    });
  });

  // =============================================================================
  // Pressure Drop Calculation Tests
  // =============================================================================

  describe('Pressure Drop Calculations', () => {
    beforeEach(async () => {
      await wasmService.initialize();
    });

    it('should calculate pressure drop using WASM', async () => {
      const parameters: PressureDropParameters = {
        airflow: 2000,
        ductLength: 100,
        ductDiameter: 12,
        fittings: [
          { type: 'elbow', coefficient: 0.5 },
          { type: 'tee', coefficient: 1.2 }
        ],
        elevation: 10
      };

      const result = await wasmService.calculatePressureDrop(parameters);

      expect(result.value).toBe(0.25);
      expect(result.method).toBe('wasm');
      expect(mockWASMModule.calculatePressureDrop).toHaveBeenCalled();
    });

    it('should handle complex fitting configurations', async () => {
      const parameters: PressureDropParameters = {
        airflow: 3000,
        ductLength: 200,
        ductDiameter: 16,
        fittings: [
          { type: 'elbow', coefficient: 0.5 },
          { type: 'tee', coefficient: 1.2 },
          { type: 'reducer', coefficient: 0.3 },
          { type: 'damper', coefficient: 2.0 }
        ]
      };

      const result = await wasmService.calculatePressureDrop(parameters);

      expect(result.value).toBeGreaterThan(0);
      expect(result.metadata).toHaveProperty('fittingCount', 4);
    });
  });

  // =============================================================================
  // Heat Transfer Calculation Tests
  // =============================================================================

  describe('Heat Transfer Calculations', () => {
    beforeEach(async () => {
      await wasmService.initialize();
    });

    it('should calculate heat transfer using WASM', async () => {
      const parameters: HeatTransferParameters = {
        airflow: 2000,
        inletTemperature: 75,
        outletTemperature: 65,
        surfaceArea: 100,
        heatTransferCoefficient: 25,
        ambientTemperature: 70
      };

      const result = await wasmService.calculateHeatTransfer(parameters);

      expect(result.value).toBe(15000);
      expect(result.method).toBe('wasm');
      expect(mockWASMModule.calculateHeatTransfer).toHaveBeenCalled();
    });

    it('should handle different heat transfer scenarios', async () => {
      const heatingParameters: HeatTransferParameters = {
        airflow: 1500,
        inletTemperature: 60,
        outletTemperature: 75, // Heating scenario
        surfaceArea: 80,
        heatTransferCoefficient: 30,
        ambientTemperature: 70
      };

      const result = await wasmService.calculateHeatTransfer(heatingParameters);

      expect(result.value).toBeGreaterThan(0);
      expect(result.metadata).toHaveProperty('scenario', 'heating');
    });
  });

  // =============================================================================
  // System Optimization Tests
  // =============================================================================

  describe('System Optimization', () => {
    beforeEach(async () => {
      await wasmService.initialize();
    });

    it('should optimize HVAC system using WASM', async () => {
      const parameters: SystemOptimizationParameters = {
        zones: [
          { airflow: 1000, temperature: 72 },
          { airflow: 1500, temperature: 70 }
        ],
        constraints: {
          maxPressureDrop: 1.0,
          maxVelocity: 2000,
          energyEfficiencyTarget: 0.9
        },
        objectives: ['minimize_energy', 'maximize_comfort']
      };

      const result = await wasmService.optimizeSystem(parameters);

      expect(result.value).toEqual({
        efficiency: 0.92,
        energySavings: 15.5,
        recommendations: ['Increase duct size', 'Optimize airflow']
      });
      expect(result.method).toBe('wasm');
      expect(mockWASMModule.optimizeSystem).toHaveBeenCalled();
    });

    it('should provide optimization recommendations', async () => {
      const parameters: SystemOptimizationParameters = {
        zones: [{ airflow: 2000, temperature: 75 }],
        constraints: {
          maxPressureDrop: 0.5,
          maxVelocity: 1500,
          energyEfficiencyTarget: 0.95
        },
        objectives: ['minimize_energy']
      };

      const result = await wasmService.optimizeSystem(parameters);

      expect(result.metadata).toHaveProperty('recommendations');
      expect(Array.isArray(result.metadata?.recommendations)).toBe(true);
    });
  });

  // =============================================================================
  // Performance Benchmarking Tests
  // =============================================================================

  describe('Performance Benchmarking', () => {
    beforeEach(async () => {
      await wasmService.initialize();
    });

    it('should benchmark WASM vs JavaScript performance', async () => {
      const parameters: AirDuctParameters = {
        airflow: 2000,
        velocity: 1200,
        frictionFactor: 0.02
      };

      const benchmark = await wasmService.benchmarkCalculation(
        'calculateAirDuctSize',
        parameters,
        100 // 100 iterations
      );

      expect(benchmark).toHaveProperty('wasmTime');
      expect(benchmark).toHaveProperty('jsTime');
      expect(benchmark).toHaveProperty('speedupFactor');
      expect(benchmark.speedupFactor).toBeGreaterThan(1); // WASM should be faster
    });

    it('should track performance metrics over time', async () => {
      const parameters: AirDuctParameters = {
        airflow: 1500,
        velocity: 1000,
        frictionFactor: 0.015
      };

      // Perform multiple calculations
      for (let i = 0; i < 10; i++) {
        await wasmService.calculateAirDuctSize(parameters);
      }

      const metrics = wasmService.getPerformanceMetrics();

      expect(metrics.totalCalculations).toBe(10);
      expect(metrics.averageWASMTime).toBeGreaterThan(0);
      expect(metrics.wasmSuccessRate).toBe(1.0);
    });

    it('should identify performance bottlenecks', async () => {
      const complexParameters: SystemOptimizationParameters = {
        zones: Array.from({ length: 50 }, (_, i) => ({
          airflow: 1000 + i * 100,
          temperature: 70 + i
        })),
        constraints: {
          maxPressureDrop: 1.0,
          maxVelocity: 2000,
          energyEfficiencyTarget: 0.9
        },
        objectives: ['minimize_energy', 'maximize_comfort']
      };

      const startTime = performance.now();
      await wasmService.optimizeSystem(complexParameters);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  // =============================================================================
  // Error Handling and Recovery Tests
  // =============================================================================

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await wasmService.initialize();
    });

    it('should handle WASM memory errors gracefully', async () => {
      // Mock memory allocation failure
      mockWASMModule.calculateAirDuctSize.mockImplementationOnce(() => {
        throw new Error('Out of memory');
      });

      const parameters: AirDuctParameters = {
        airflow: 2000,
        velocity: 1200,
        frictionFactor: 0.02
      };

      const result = await wasmService.calculateAirDuctSize(parameters);

      expect(result.method).toBe('javascript'); // Should fall back
      expect(result.metadata).toHaveProperty('fallbackReason', 'wasm_error');
    });

    it('should recover from WASM module corruption', async () => {
      // Simulate module corruption
      wasmService.markWASMAsCorrupted();

      const parameters: AirDuctParameters = {
        airflow: 1000,
        velocity: 800,
        frictionFactor: 0.01
      };

      const result = await wasmService.calculateAirDuctSize(parameters);

      expect(result.method).toBe('javascript');
      expect(wasmService.isWASMAvailable()).toBe(false);
    });

    it('should handle invalid WASM responses', async () => {
      // Mock invalid WASM response
      mockWASMModule.calculateAirDuctSize.mockReturnValueOnce(NaN);

      const parameters: AirDuctParameters = {
        airflow: 2000,
        velocity: 1200,
        frictionFactor: 0.02
      };

      const result = await wasmService.calculateAirDuctSize(parameters);

      expect(result.method).toBe('javascript');
      expect(result.metadata).toHaveProperty('fallbackReason', 'invalid_wasm_result');
    });
  });

  // =============================================================================
  // Memory Management Tests
  // =============================================================================

  describe('Memory Management', () => {
    beforeEach(async () => {
      await wasmService.initialize();
    });

    it('should monitor WASM memory usage', () => {
      const memoryUsage = wasmService.getMemoryUsage();

      expect(memoryUsage).toHaveProperty('wasmMemorySize');
      expect(memoryUsage).toHaveProperty('jsHeapUsed');
      expect(memoryUsage).toHaveProperty('totalMemoryUsage');
      expect(memoryUsage.wasmMemorySize).toBeGreaterThan(0);
    });

    it('should cleanup resources on service destruction', () => {
      const cleanupSpy = vi.spyOn(wasmService, 'cleanup');

      wasmService.cleanup();

      expect(cleanupSpy).toHaveBeenCalled();
      expect(wasmService.isWASMAvailable()).toBe(false);
    });

    it('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure
      const largeParameters: SystemOptimizationParameters = {
        zones: Array.from({ length: 1000 }, (_, i) => ({
          airflow: 1000 + i,
          temperature: 70 + (i % 20)
        })),
        constraints: {
          maxPressureDrop: 1.0,
          maxVelocity: 2000,
          energyEfficiencyTarget: 0.9
        },
        objectives: ['minimize_energy']
      };

      const result = await wasmService.optimizeSystem(largeParameters);

      expect(result.value).toBeDefined();
      expect(result.metadata).toHaveProperty('memoryPressureHandled');
    });
  });
});
