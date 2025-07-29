/**
 * React Hook for WebAssembly Calculations
 * 
 * Provides React integration for high-performance HVAC calculations with:
 * - Automatic WASM initialization
 * - Graceful fallback to JavaScript
 * - Performance monitoring and metrics
 * - React state integration
 * - Error handling and recovery
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  WASMCalculationService, 
  WASMCalculationConfig,
  CalculationResult,
  AirDuctParameters,
  PressureDropParameters,
  HeatTransferParameters,
  SystemOptimizationParameters
} from '../services/WASMCalculationService';

// =============================================================================
// Hook Types and Interfaces
// =============================================================================

export interface WASMCalculationsHookConfig extends WASMCalculationConfig {
  autoInitialize?: boolean;
  enablePerformanceTracking?: boolean;
  trackingInterval?: number;
}

export interface WASMCalculationsHookReturn {
  // Service state
  isWASMAvailable: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Calculation methods
  calculateAirDuctSize: (parameters: AirDuctParameters) => Promise<CalculationResult>;
  calculatePressureDrop: (parameters: PressureDropParameters) => Promise<CalculationResult>;
  calculateHeatTransfer: (parameters: HeatTransferParameters) => Promise<CalculationResult>;
  optimizeSystem: (parameters: SystemOptimizationParameters) => Promise<CalculationResult>;
  
  // Performance monitoring
  performanceMetrics: PerformanceMetrics;
  getRecommendations: () => PerformanceRecommendation[];
  
  // Service management
  reinitialize: () => Promise<boolean>;
  resetMetrics: () => void;
  updateConfig: (config: Partial<WASMCalculationConfig>) => void;
}

export interface PerformanceMetrics {
  wasmCalls: number;
  jsCalls: number;
  averageWasmTime: number;
  averageJsTime: number;
  performanceRatio: number;
  wasmAvailable: boolean;
  totalCalculations: number;
  errorRate: number;
}

export interface PerformanceRecommendation {
  type: 'performance' | 'fallback' | 'optimization';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: () => Promise<void>;
}

// =============================================================================
// WASM Calculations Hook Implementation
// =============================================================================

export function useWASMCalculations(config: WASMCalculationsHookConfig = {}): WASMCalculationsHookReturn {
  const [calculationService, setCalculationService] = useState<WASMCalculationService | null>(null);
  const [isWASMAvailable, setIsWASMAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    wasmCalls: 0,
    jsCalls: 0,
    averageWasmTime: 0,
    averageJsTime: 0,
    performanceRatio: 1,
    wasmAvailable: false,
    totalCalculations: 0,
    errorRate: 0
  });

  const trackingIntervalRef = useRef<NodeJS.Timeout>();
  const errorCountRef = useRef(0);
  const totalCalculationsRef = useRef(0);

  // =============================================================================
  // Service Initialization
  // =============================================================================

  useEffect(() => {
    if (config.autoInitialize !== false) {
      initializeService();
    }
  }, [config]);

  const initializeService = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const service = new WASMCalculationService({
        enableWASM: true,
        fallbackToJS: true,
        performanceLogging: config.performanceLogging || false,
        ...config
      });

      const wasmInitialized = await service.initialize();
      
      setCalculationService(service);
      setIsWASMAvailable(wasmInitialized);
      setIsInitialized(true);
      setIsLoading(false);

      if (config.enablePerformanceTracking !== false) {
        startPerformanceTracking(service);
      }

      return wasmInitialized;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize WASM service');
      setError(error);
      setIsLoading(false);
      setIsInitialized(false);
      return false;
    }
  };

  // =============================================================================
  // Performance Tracking
  // =============================================================================

  const startPerformanceTracking = (service: WASMCalculationService): void => {
    const interval = config.trackingInterval || 5000; // 5 seconds default

    trackingIntervalRef.current = setInterval(() => {
      try {
        const metrics = service.getPerformanceMetrics();
        setPerformanceMetrics({
          ...metrics,
          totalCalculations: totalCalculationsRef.current,
          errorRate: totalCalculationsRef.current > 0 ? 
            errorCountRef.current / totalCalculationsRef.current : 0
        });
      } catch (err) {
        console.warn('Failed to update performance metrics:', err);
      }
    }, interval);
  };

  // =============================================================================
  // Calculation Methods
  // =============================================================================

  const calculateAirDuctSize = useCallback(async (
    parameters: AirDuctParameters
  ): Promise<CalculationResult> => {
    if (!calculationService) {
      throw new Error('Calculation service not initialized');
    }

    totalCalculationsRef.current++;

    try {
      const result = calculationService.calculateAirDuctSize(parameters);
      return result;
    } catch (err) {
      errorCountRef.current++;
      throw err;
    }
  }, [calculationService]);

  const calculatePressureDrop = useCallback(async (
    parameters: PressureDropParameters
  ): Promise<CalculationResult> => {
    if (!calculationService) {
      throw new Error('Calculation service not initialized');
    }

    totalCalculationsRef.current++;

    try {
      const result = calculationService.calculatePressureDrop(parameters);
      return result;
    } catch (err) {
      errorCountRef.current++;
      throw err;
    }
  }, [calculationService]);

  const calculateHeatTransfer = useCallback(async (
    parameters: HeatTransferParameters
  ): Promise<CalculationResult> => {
    if (!calculationService) {
      throw new Error('Calculation service not initialized');
    }

    totalCalculationsRef.current++;

    try {
      const result = calculationService.calculateHeatTransfer(parameters);
      return result;
    } catch (err) {
      errorCountRef.current++;
      throw err;
    }
  }, [calculationService]);

  const optimizeSystem = useCallback(async (
    parameters: SystemOptimizationParameters
  ): Promise<CalculationResult> => {
    if (!calculationService) {
      throw new Error('Calculation service not initialized');
    }

    totalCalculationsRef.current++;

    try {
      const result = calculationService.optimizeSystem(parameters);
      return result;
    } catch (err) {
      errorCountRef.current++;
      throw err;
    }
  }, [calculationService]);

  // =============================================================================
  // Performance Analysis
  // =============================================================================

  const getRecommendations = useCallback((): PerformanceRecommendation[] => {
    const recommendations: PerformanceRecommendation[] = [];

    // WASM availability recommendation
    if (!isWASMAvailable && performanceMetrics.totalCalculations > 10) {
      recommendations.push({
        type: 'fallback',
        severity: 'medium',
        message: 'WASM not available. Consider enabling WASM for better performance.',
        action: async () => await reinitialize()
      });
    }

    // Performance ratio recommendation
    if (performanceMetrics.performanceRatio > 5 && isWASMAvailable) {
      recommendations.push({
        type: 'performance',
        severity: 'low',
        message: `WASM is ${performanceMetrics.performanceRatio.toFixed(1)}x faster than JavaScript.`,
      });
    }

    // Error rate recommendation
    if (performanceMetrics.errorRate > 0.1) {
      recommendations.push({
        type: 'optimization',
        severity: 'high',
        message: `High error rate (${(performanceMetrics.errorRate * 100).toFixed(1)}%). Check calculation parameters.`,
      });
    }

    // Calculation frequency recommendation
    if (performanceMetrics.totalCalculations > 100 && !isWASMAvailable) {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        message: 'High calculation frequency detected. WASM would provide significant performance benefits.',
        action: async () => await reinitialize()
      });
    }

    return recommendations;
  }, [isWASMAvailable, performanceMetrics]);

  // =============================================================================
  // Service Management
  // =============================================================================

  const reinitialize = useCallback(async (): Promise<boolean> => {
    if (calculationService) {
      calculationService.resetMetrics();
    }
    
    errorCountRef.current = 0;
    totalCalculationsRef.current = 0;
    
    return await initializeService();
  }, [calculationService]);

  const resetMetrics = useCallback((): void => {
    if (calculationService) {
      calculationService.resetMetrics();
    }
    
    errorCountRef.current = 0;
    totalCalculationsRef.current = 0;
    
    setPerformanceMetrics({
      wasmCalls: 0,
      jsCalls: 0,
      averageWasmTime: 0,
      averageJsTime: 0,
      performanceRatio: 1,
      wasmAvailable: isWASMAvailable,
      totalCalculations: 0,
      errorRate: 0
    });
  }, [calculationService, isWASMAvailable]);

  const updateConfig = useCallback((newConfig: Partial<WASMCalculationConfig>): void => {
    if (calculationService) {
      calculationService.updateConfig(newConfig);
    }
  }, [calculationService]);

  // =============================================================================
  // Cleanup
  // =============================================================================

  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // Service state
    isWASMAvailable,
    isInitialized,
    isLoading,
    error,
    
    // Calculation methods
    calculateAirDuctSize,
    calculatePressureDrop,
    calculateHeatTransfer,
    optimizeSystem,
    
    // Performance monitoring
    performanceMetrics,
    getRecommendations,
    
    // Service management
    reinitialize,
    resetMetrics,
    updateConfig
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook for simple air duct calculations with automatic optimization
 */
export function useAirDuctCalculator() {
  const { calculateAirDuctSize, isWASMAvailable } = useWASMCalculations({
    enablePerformanceTracking: true,
    performanceLogging: false
  });

  const calculateOptimalDuctSize = useCallback(async (
    airflow: number,
    maxVelocity: number = 2000
  ) => {
    const parameters: AirDuctParameters = {
      airflow,
      velocity: Math.min(maxVelocity, airflow / 10), // Optimize velocity
      frictionFactor: 0.02,
      roughness: 0.0001
    };

    return await calculateAirDuctSize(parameters);
  }, [calculateAirDuctSize]);

  return {
    calculateOptimalDuctSize,
    isWASMAvailable
  };
}

/**
 * Hook for system-wide HVAC optimization
 */
export function useHVACOptimizer() {
  const { optimizeSystem, performanceMetrics } = useWASMCalculations({
    enablePerformanceTracking: true,
    performanceLogging: true
  });

  const optimizeForEfficiency = useCallback(async (
    zones: Array<{ airflow: number; temperature: number; area: number }>
  ) => {
    const parameters: SystemOptimizationParameters = {
      zones,
      constraints: {
        maxPressureDrop: 0.5,
        maxVelocity: 2000,
        energyEfficiencyTarget: 0.85
      },
      preferences: {
        costWeight: 0.3,
        efficiencyWeight: 0.5,
        noiseWeight: 0.2
      }
    };

    return await optimizeSystem(parameters);
  }, [optimizeSystem]);

  return {
    optimizeForEfficiency,
    performanceMetrics
  };
}
