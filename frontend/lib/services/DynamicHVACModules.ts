/**
 * Dynamic HVAC Module Loader
 * 
 * Provides dynamic imports for HVAC calculation modules to enable code splitting
 * and reduce initial bundle size. Modules are loaded on-demand when needed.
 */

import { lazy } from 'react';

// =============================================================================
// Dynamic Import Types
// =============================================================================

export interface HVACModuleLoader {
  loadAirDuctCalculator: () => Promise<any>;
  loadGreaseDuctCalculator: () => Promise<any>;
  loadEngineExhaustCalculator: () => Promise<any>;
  loadBoilerVentCalculator: () => Promise<any>;
  loadWASMCalculations: () => Promise<any>;
  loadAIOptimization: () => Promise<any>;
}

export interface HVACComponentLoader {
  load3DCanvas: () => Promise<any>;
  loadFittingViewer: () => Promise<any>;
  loadPDFImport: () => Promise<any>;
  loadViewCube: () => Promise<any>;
}

// =============================================================================
// Service Module Loaders
// =============================================================================

/**
 * Dynamically load HVAC calculation services
 */
export const HVACModules: HVACModuleLoader = {
  // Air Duct Calculator - Core calculation engine
  loadAirDuctCalculator: () => 
    import('../hooks/useWASMCalculations').then(module => ({
      useAirDuctCalculator: module.useAirDuctCalculator,
      useWASMCalculations: module.useWASMCalculations
    })),

  // Grease Duct Calculator - NFPA 96 compliance
  loadGreaseDuctCalculator: () =>
    import('../api/calculations').then(module => ({
      calculateDuctSizing: module.calculateDuctSizing,
      validateProject: module.validateProject
    })),

  // Engine Exhaust Calculator - Generator and CHP systems
  loadEngineExhaustCalculator: () =>
    import('../api/calculations').then(module => ({
      calculateDuctSizing: module.calculateDuctSizing,
      validateProject: module.validateProject
    })),

  // Boiler Vent Calculator - Category I-IV appliances
  loadBoilerVentCalculator: () =>
    import('../api/calculations').then(module => ({
      calculateDuctSizing: module.calculateDuctSizing,
      validateProject: module.validateProject
    })),

  // WASM Calculations - High-performance calculations
  loadWASMCalculations: () => 
    import('./WASMCalculationService').then(module => ({
      WASMCalculationService: module.WASMCalculationService,
      default: module.WASMCalculationService
    })),

  // AI Optimization - Machine learning optimization
  loadAIOptimization: () => 
    import('./AIOptimizationService').then(module => ({
      AIOptimizationService: module.AIOptimizationService,
      useAIOptimization: module.useAIOptimization
    }))
};

// =============================================================================
// Component Loaders (React.lazy)
// =============================================================================

/**
 * Dynamically load heavy UI components
 */
export const HVACComponents: HVACComponentLoader = {
  // 3D Canvas - Three.js visualization
  load3DCanvas: () =>
    import('../../components/3d/Canvas3D').then(module => ({
      Canvas3D: module.Canvas3D
    })),

  // Fitting Viewer - 3D fitting visualization
  loadFittingViewer: () =>
    import('../../components/3d/FittingViewer').then(module => ({
      FittingViewer: module.FittingViewer
    })),

  // PDF Import - PDF.js integration
  loadPDFImport: () =>
    import('../../components/pdf/PDFImport').then(module => ({
      PDFImport: module.PDFImport
    })),

  // View Cube - 3D navigation control
  loadViewCube: () =>
    import('../../components/ui/ViewCube').then(module => ({
      ViewCube: module.ViewCube
    }))
};

// =============================================================================
// Lazy Component Definitions
// =============================================================================

// 3D Visualization Components (Heavy - Three.js)
export const Canvas3DLazy = lazy(() =>
  import('../../components/3d/Canvas3D').then(module => ({ default: module.Canvas3D }))
);
export const FittingViewerLazy = lazy(() =>
  import('../../components/3d/FittingViewer').then(module => ({ default: module.FittingViewer }))
);
export const FittingSelectorLazy = lazy(() =>
  import('../../components/3d/FittingSelector').then(module => ({ default: module.FittingSelector }))
);

// PDF Processing Components (Heavy - PDF.js)
export const PDFImportLazy = lazy(() =>
  import('../../components/pdf/PDFImport').then(module => ({ default: module.PDFImport }))
);

// Advanced UI Components
export const ViewCubeLazy = lazy(() =>
  import('../../components/ui/ViewCube').then(module => ({ default: module.ViewCube }))
);

// =============================================================================
// Module Loading Utilities
// =============================================================================

/**
 * Preload critical modules for better UX
 */
export async function preloadCriticalModules(): Promise<void> {
  try {
    // Preload air duct calculator (most commonly used)
    await HVACModules.loadAirDuctCalculator();
    
    // Preload WASM calculations if supported
    if (typeof WebAssembly !== 'undefined') {
      await HVACModules.loadWASMCalculations();
    }
  } catch (error) {
    console.warn('Failed to preload critical HVAC modules:', error);
  }
}

/**
 * Load module with error handling and fallback
 */
export async function loadModuleWithFallback<T>(
  loader: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error('Module loading failed:', error);
    if (fallback) {
      return fallback();
    }
    throw error;
  }
}

/**
 * Check if module is already loaded
 */
export function isModuleLoaded(moduleName: string): boolean {
  // Check if module exists in webpack's module cache
  if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
    const webpackRequire = (window as any).__webpack_require__;
    return webpackRequire.cache && Object.keys(webpackRequire.cache).some(
      key => key.includes(moduleName)
    );
  }
  return false;
}

// =============================================================================
// Module Loading Hooks
// =============================================================================

/**
 * Hook for loading HVAC modules on demand
 */
export function useHVACModuleLoader() {
  const loadModule = async (moduleName: keyof HVACModuleLoader) => {
    try {
      const loadedModule = await HVACModules[moduleName]();
      return loadedModule;
    } catch (error) {
      console.error(`Failed to load HVAC module: ${moduleName}`, error);
      throw error;
    }
  };

  return { loadModule, isModuleLoaded };
}

/**
 * Hook for loading UI components on demand
 */
export function useComponentLoader() {
  const loadComponent = async (componentName: keyof HVACComponentLoader) => {
    try {
      const component = await HVACComponents[componentName]();
      return component;
    } catch (error) {
      console.error(`Failed to load component: ${componentName}`, error);
      throw error;
    }
  };

  return { loadComponent };
}

// =============================================================================
// Export All
// =============================================================================

const DynamicHVACModules = {
  HVACModules,
  HVACComponents,
  preloadCriticalModules,
  loadModuleWithFallback,
  isModuleLoaded
};

export default DynamicHVACModules;
