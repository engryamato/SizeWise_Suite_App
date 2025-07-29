/**
 * React Hook for Enhanced Offline Service
 * 
 * Provides React integration for the enhanced offline service with:
 * - Automatic service initialization
 * - Real-time sync status updates
 * - Performance metrics monitoring
 * - Error handling and recovery
 * - Type-safe operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EnhancedOfflineService, createEnhancedOfflineService, SyncStatus, PerformanceMetrics } from '../services/EnhancedOfflineService';
import { Project, CalculationInput, CalculationResult } from '@/types/air-duct-sizer';
import { SizeWiseCalculation, SpatialDataLayer } from '../database/DexieDatabase';

// =============================================================================
// Hook Interfaces
// =============================================================================

export interface UseEnhancedOfflineServiceOptions {
  enablePerformanceMonitoring?: boolean;
  enableAutoSync?: boolean;
  syncIntervalMs?: number;
  maxRetryAttempts?: number;
}

export interface EnhancedOfflineServiceState {
  service: EnhancedOfflineService | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus | null;
  performanceMetrics: PerformanceMetrics | null;
}

export interface EnhancedOfflineServiceOperations {
  // Project operations
  createProject: (projectData: Omit<Project, 'id'>) => Promise<string>;
  updateProject: (uuid: string, updates: Partial<Project>) => Promise<void>;
  getProject: (uuid: string) => Promise<Project | null>;
  getAllProjects: () => Promise<Project[]>;
  deleteProject: (uuid: string) => Promise<void>;

  // Calculation operations
  saveCalculation: (
    projectUuid: string,
    input: CalculationInput,
    result: CalculationResult,
    segmentUuid?: string,
    roomUuid?: string
  ) => Promise<string>;
  getCalculationsByProject: (projectUuid: string) => Promise<SizeWiseCalculation[]>;

  // Spatial data operations
  saveSpatialLayer: (
    projectUuid: string,
    layerType: SpatialDataLayer['layerType'],
    geometry: any,
    properties?: Record<string, any>
  ) => Promise<string>;
  getSpatialLayersByProject: (projectUuid: string) => Promise<SpatialDataLayer[]>;

  // Sync operations
  forceSyncAll: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  refreshPerformanceMetrics: () => Promise<void>;

  // Utility operations
  cleanup: () => Promise<void>;
}

// =============================================================================
// Enhanced Offline Service Hook
// =============================================================================

export function useEnhancedOfflineService(
  options: UseEnhancedOfflineServiceOptions = {}
): EnhancedOfflineServiceState & EnhancedOfflineServiceOperations {
  const [state, setState] = useState<EnhancedOfflineServiceState>({
    service: null,
    isInitialized: false,
    isLoading: true,
    error: null,
    syncStatus: null,
    performanceMetrics: null
  });

  const serviceRef = useRef<EnhancedOfflineService | null>(null);
  const initializationRef = useRef<Promise<EnhancedOfflineService> | null>(null);

  // =============================================================================
  // Service Initialization
  // =============================================================================

  useEffect(() => {
    let isMounted = true;

    const initializeService = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Prevent multiple initializations
        if (!initializationRef.current) {
          initializationRef.current = createEnhancedOfflineService({
            enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
            enableAutoSync: options.enableAutoSync ?? false,
            syncIntervalMs: options.syncIntervalMs ?? 30000,
            maxRetryAttempts: options.maxRetryAttempts ?? 3
          });
        }

        const service = await initializationRef.current;

        if (!isMounted) return;

        serviceRef.current = service;

        // Set up event listeners
        service.on('project:created', () => refreshSyncStatus());
        service.on('project:updated', () => refreshSyncStatus());
        service.on('project:deleted', () => refreshSyncStatus());
        service.on('calculation:saved', () => refreshSyncStatus());
        service.on('spatial:saved', () => refreshSyncStatus());
        service.on('sync:queued', () => refreshSyncStatus());

        // Get initial status
        const [syncStatus, performanceMetrics] = await Promise.all([
          service.getSyncStatus(),
          service.getPerformanceMetrics()
        ]);

        if (!isMounted) return;

        setState(prev => ({
          ...prev,
          service,
          isInitialized: true,
          isLoading: false,
          syncStatus,
          performanceMetrics
        }));

        console.log('✅ Enhanced Offline Service hook initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Enhanced Offline Service:', error);
        
        if (!isMounted) return;

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize service'
        }));
      }
    };

    initializeService();

    return () => {
      isMounted = false;
      
      // Cleanup service if it was initialized
      if (serviceRef.current) {
        serviceRef.current.removeAllListeners();
        serviceRef.current.close().catch(console.error);
        serviceRef.current = null;
      }
    };
  }, [options.enablePerformanceMonitoring, options.enableAutoSync, options.syncIntervalMs, options.maxRetryAttempts]);

  // =============================================================================
  // Operation Wrappers
  // =============================================================================

  const createProject = useCallback(async (projectData: Omit<Project, 'id'>): Promise<string> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    return await serviceRef.current.createProject(projectData);
  }, []);

  const updateProject = useCallback(async (uuid: string, updates: Partial<Project>): Promise<void> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    await serviceRef.current.updateProject(uuid, updates);
  }, []);

  const getProject = useCallback(async (uuid: string): Promise<Project | null> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    return await serviceRef.current.getProject(uuid);
  }, []);

  const getAllProjects = useCallback(async (): Promise<Project[]> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    return await serviceRef.current.getAllProjects();
  }, []);

  const deleteProject = useCallback(async (uuid: string): Promise<void> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    await serviceRef.current.deleteProject(uuid);
  }, []);

  const saveCalculation = useCallback(async (
    projectUuid: string,
    input: CalculationInput,
    result: CalculationResult,
    segmentUuid?: string,
    roomUuid?: string
  ): Promise<string> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    return await serviceRef.current.saveCalculation(projectUuid, input, result, segmentUuid, roomUuid);
  }, []);

  const getCalculationsByProject = useCallback(async (projectUuid: string): Promise<SizeWiseCalculation[]> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    return await serviceRef.current.getCalculationsByProject(projectUuid);
  }, []);

  const saveSpatialLayer = useCallback(async (
    projectUuid: string,
    layerType: SpatialDataLayer['layerType'],
    geometry: any,
    properties: Record<string, any> = {}
  ): Promise<string> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    return await serviceRef.current.saveSpatialLayer(projectUuid, layerType, geometry, properties);
  }, []);

  const getSpatialLayersByProject = useCallback(async (projectUuid: string): Promise<SpatialDataLayer[]> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    return await serviceRef.current.getSpatialLayersByProject(projectUuid);
  }, []);

  const forceSyncAll = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) throw new Error('Service not initialized');
    await serviceRef.current.forceSyncAll();
  }, []);

  const refreshSyncStatus = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) return;
    
    try {
      const syncStatus = await serviceRef.current.getSyncStatus();
      setState(prev => ({ ...prev, syncStatus }));
    } catch (error) {
      console.error('Failed to refresh sync status:', error);
    }
  }, []);

  const refreshPerformanceMetrics = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) return;
    
    try {
      const performanceMetrics = await serviceRef.current.getPerformanceMetrics();
      setState(prev => ({ ...prev, performanceMetrics }));
    } catch (error) {
      console.error('Failed to refresh performance metrics:', error);
    }
  }, []);

  const cleanup = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) return;
    await serviceRef.current.cleanup();
  }, []);

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // State
    ...state,

    // Operations
    createProject,
    updateProject,
    getProject,
    getAllProjects,
    deleteProject,
    saveCalculation,
    getCalculationsByProject,
    saveSpatialLayer,
    getSpatialLayersByProject,
    forceSyncAll,
    refreshSyncStatus,
    refreshPerformanceMetrics,
    cleanup
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook for monitoring sync status only
 */
export function useSyncStatus() {
  const { syncStatus, refreshSyncStatus } = useEnhancedOfflineService();
  
  useEffect(() => {
    // Refresh sync status every 30 seconds
    const interval = setInterval(refreshSyncStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshSyncStatus]);

  return syncStatus;
}

/**
 * Hook for monitoring performance metrics only
 */
export function usePerformanceMetrics() {
  const { performanceMetrics, refreshPerformanceMetrics } = useEnhancedOfflineService();
  
  useEffect(() => {
    // Refresh performance metrics every 60 seconds
    const interval = setInterval(refreshPerformanceMetrics, 60000);
    return () => clearInterval(interval);
  }, [refreshPerformanceMetrics]);

  return performanceMetrics;
}

/**
 * Hook for project operations only
 */
export function useProjectOperations() {
  const {
    createProject,
    updateProject,
    getProject,
    getAllProjects,
    deleteProject,
    isInitialized,
    error
  } = useEnhancedOfflineService();

  return {
    createProject,
    updateProject,
    getProject,
    getAllProjects,
    deleteProject,
    isInitialized,
    error
  };
}
