/**
 * Service Integration Hooks
 * 
 * Custom React hooks that connect UI components with the existing service layer.
 * Provides a clean abstraction between components and business logic while
 * maintaining compatibility with the repository pattern and dependency injection.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 * @see docs/implementation/saas-readiness/service-layer-architecture.md
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import {
  ProjectServiceHook,
  CalculationServiceHook,
  ExportServiceHook,
  TierServiceHook,
  ServiceHookResult
} from '../../types/component-interfaces';
import {
  Project,
  CalculationInput,
  CalculationResult,
  ExportOptions,
  ExportResult,
  TierLimits
} from '../../types/air-duct-sizer';
import { UserTier } from '../repositories/interfaces/UserRepository';
import { ValidationResult } from '../../../backend/services/calculations/SMACNAValidator';

// =============================================================================
// Service Context Interfaces
// =============================================================================

/**
 * Service container interface for dependency injection
 */
export interface ServiceContainer {
  projectService: any; // Will be typed based on actual service implementation
  calculationService: any;
  validationService: any;
  exportService: any;
  tierService: any;
  featureManager: any;
}

/**
 * Service context for React components
 */
export interface ServiceContextValue {
  services: ServiceContainer;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// =============================================================================
// Base Service Hook
// =============================================================================

/**
 * Base hook for service integration with error handling and loading states
 */
function useBaseService<T>(
  serviceGetter: () => T,
  serviceName: string
): ServiceHookResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    try {
      serviceGetter();
      setLoading(false);
    } catch (err) {
      setError(`Failed to initialize ${serviceName}: ${err.message}`);
      setLoading(false);
    }
  }, [serviceGetter, serviceName]);

  const service = serviceGetter();

  return {
    service,
    loading,
    error,
    retry
  };
}

// =============================================================================
// Project Service Hook
// =============================================================================

/**
 * Hook for project-related operations
 */
export function useProjectService(): ProjectServiceHook {
  // This will be injected via context in the actual implementation
  const getProjectService = useCallback(() => {
    // Placeholder - will be replaced with actual service injection
    return {
      getProject: async (id: string) => null,
      saveProject: async (project: Project) => {},
      createProject: async (data: Partial<Project>) => ({} as Project),
      deleteProject: async (id: string) => {},
      listProjects: async (userId: string) => []
    };
  }, []);

  const baseHook = useBaseService(getProjectService, 'ProjectService');

  const loadProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      return await baseHook.service.getProject(id);
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }, [baseHook.service]);

  const saveProject = useCallback(async (project: Project): Promise<void> => {
    try {
      await baseHook.service.saveProject(project);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }, [baseHook.service]);

  const createProject = useCallback(async (data: Partial<Project>): Promise<Project> => {
    try {
      return await baseHook.service.createProject(data);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [baseHook.service]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      await baseHook.service.deleteProject(id);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [baseHook.service]);

  const listProjects = useCallback(async (userId: string): Promise<Project[]> => {
    try {
      return await baseHook.service.listProjects(userId);
    } catch (error) {
      console.error('Failed to list projects:', error);
      throw error;
    }
  }, [baseHook.service]);

  return {
    ...baseHook,
    loadProject,
    saveProject,
    createProject,
    deleteProject,
    listProjects
  };
}

// =============================================================================
// Calculation Service Hook
// =============================================================================

/**
 * Hook for calculation-related operations
 */
export function useCalculationService(): CalculationServiceHook {
  const getCalculationService = useCallback(() => {
    // Placeholder - will be replaced with actual service injection
    return {
      calculateDuctSizing: async (inputs: CalculationInput) => ({} as CalculationResult),
      validateResults: async (results: CalculationResult) => ({} as ValidationResult),
      getCalculationHistory: async (projectId: string) => []
    };
  }, []);

  const baseHook = useBaseService(getCalculationService, 'CalculationService');

  const calculateDuctSizing = useCallback(async (inputs: CalculationInput): Promise<CalculationResult> => {
    try {
      return await baseHook.service.calculateDuctSizing(inputs);
    } catch (error) {
      console.error('Failed to calculate duct sizing:', error);
      throw error;
    }
  }, [baseHook.service]);

  const validateResults = useCallback(async (results: CalculationResult): Promise<ValidationResult> => {
    try {
      return await baseHook.service.validateResults(results);
    } catch (error) {
      console.error('Failed to validate results:', error);
      throw error;
    }
  }, [baseHook.service]);

  const getCalculationHistory = useCallback(async (projectId: string): Promise<CalculationResult[]> => {
    try {
      return await baseHook.service.getCalculationHistory(projectId);
    } catch (error) {
      console.error('Failed to get calculation history:', error);
      throw error;
    }
  }, [baseHook.service]);

  return {
    ...baseHook,
    calculateDuctSizing,
    validateResults,
    getCalculationHistory
  };
}

// =============================================================================
// Export Service Hook
// =============================================================================

/**
 * Hook for export-related operations
 */
export function useExportService(): ExportServiceHook {
  const getExportService = useCallback(() => {
    // Placeholder - will be replaced with actual service injection
    return {
      exportProject: async (projectId: string, options: ExportOptions) => ({} as ExportResult),
      getExportStatus: async (exportId: string) => ({} as ExportResult),
      downloadExport: async (exportId: string) => new Blob()
    };
  }, []);

  const baseHook = useBaseService(getExportService, 'ExportService');

  const exportProject = useCallback(async (projectId: string, options: ExportOptions): Promise<ExportResult> => {
    try {
      return await baseHook.service.exportProject(projectId, options);
    } catch (error) {
      console.error('Failed to export project:', error);
      throw error;
    }
  }, [baseHook.service]);

  const getExportStatus = useCallback(async (exportId: string): Promise<ExportResult> => {
    try {
      return await baseHook.service.getExportStatus(exportId);
    } catch (error) {
      console.error('Failed to get export status:', error);
      throw error;
    }
  }, [baseHook.service]);

  const downloadExport = useCallback(async (exportId: string): Promise<Blob> => {
    try {
      return await baseHook.service.downloadExport(exportId);
    } catch (error) {
      console.error('Failed to download export:', error);
      throw error;
    }
  }, [baseHook.service]);

  return {
    ...baseHook,
    exportProject,
    getExportStatus,
    downloadExport
  };
}

// =============================================================================
// Tier Service Hook
// =============================================================================

/**
 * Hook for tier and feature management operations
 */
export function useTierService(): TierServiceHook {
  const getTierService = useCallback(() => {
    // Placeholder - will be replaced with actual service injection
    return {
      getCurrentTier: async () => 'free' as UserTier,
      hasFeatureAccess: async (feature: string) => false,
      getTierLimits: async () => ({} as TierLimits),
      upgradeTier: async (newTier: UserTier) => {}
    };
  }, []);

  const baseHook = useBaseService(getTierService, 'TierService');

  const getCurrentTier = useCallback(async (): Promise<UserTier> => {
    try {
      return await baseHook.service.getCurrentTier();
    } catch (error) {
      console.error('Failed to get current tier:', error);
      throw error;
    }
  }, [baseHook.service]);

  const hasFeatureAccess = useCallback(async (feature: string): Promise<boolean> => {
    try {
      return await baseHook.service.hasFeatureAccess(feature);
    } catch (error) {
      console.error('Failed to check feature access:', error);
      throw error;
    }
  }, [baseHook.service]);

  const getTierLimits = useCallback(async (): Promise<TierLimits> => {
    try {
      return await baseHook.service.getTierLimits();
    } catch (error) {
      console.error('Failed to get tier limits:', error);
      throw error;
    }
  }, [baseHook.service]);

  const upgradeTier = useCallback(async (newTier: UserTier): Promise<void> => {
    try {
      await baseHook.service.upgradeTier(newTier);
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
      throw error;
    }
  }, [baseHook.service]);

  return {
    ...baseHook,
    getCurrentTier,
    hasFeatureAccess,
    getTierLimits,
    upgradeTier
  };
}

// =============================================================================
// Combined Service Hook
// =============================================================================

/**
 * Combined hook that provides access to all services
 */
export function useServices() {
  const projectService = useProjectService();
  const calculationService = useCalculationService();
  const exportService = useExportService();
  const tierService = useTierService();

  const loading = projectService.loading || calculationService.loading || 
                 exportService.loading || tierService.loading;

  const error = projectService.error || calculationService.error || 
               exportService.error || tierService.error;

  return {
    project: projectService,
    calculation: calculationService,
    export: exportService,
    tier: tierService,
    loading,
    error
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsyncOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<R | null>(null);

  const execute = useCallback(async (...args: T) => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation(...args);
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operation]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    execute,
    loading,
    error,
    result,
    reset
  };
}

/**
 * Hook for debounced operations (useful for search, auto-save, etc.)
 */
export function useDebouncedOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  delay: number = 300
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const asyncOp = useAsyncOperation(operation);

  const debouncedExecute = useCallback((...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      asyncOp.execute(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }, [asyncOp.execute, delay, timeoutId]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return {
    ...asyncOp,
    execute: debouncedExecute
  };
}
