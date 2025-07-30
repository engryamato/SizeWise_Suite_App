/**
 * React Hook for Enhanced Project Store
 * 
 * Provides a convenient React interface for the enhanced project store with:
 * - Automatic state subscriptions and updates
 * - Performance monitoring and metrics
 * - Real-time computed properties
 * - Optimistic update management
 * - Undo/redo functionality
 * - Cross-store synchronization
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useEnhancedProjectStore, EnhancedProjectState } from '../../stores/enhanced-project-store';
import { advancedStateManager } from '../state/AdvancedStateManager';

// =============================================================================
// Hook Interface and Types
// =============================================================================

export interface ProjectStoreMetrics {
  stateSize: number;
  historySize: number;
  optimisticUpdatesCount: number;
  computedPropertiesCount: number;
  cacheSize: number;
  memoryUsage: number;
  cacheHitRate: number;
  lastCalculationTime: number;
}

export interface ProjectStoreActions {
  // Core project actions
  createProject: (projectData: any) => Promise<void>;
  loadProject: (project: any) => Promise<void>;
  updateProject: (updates: any) => Promise<void>;
  saveProject: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearProject: () => void;
  
  // Room management
  addRoom: (roomData: any) => Promise<void>;
  updateRoom: (roomId: string, updates: any) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  
  // Segment management
  addSegment: (segmentData: any) => Promise<void>;
  updateSegment: (segmentId: string, updates: any) => Promise<void>;
  deleteSegment: (segmentId: string) => Promise<void>;
  
  // Equipment management
  addEquipment: (equipmentData: any) => Promise<void>;
  updateEquipment: (equipmentId: string, updates: any) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  
  // Advanced state management
  optimisticUpdate: (updates: any, operation: string, timeout?: number) => string;
  confirmOptimisticUpdate: (updateId: string) => void;
  rollbackOptimisticUpdate: (updateId: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  
  // Utility actions
  validateProject: () => { valid: boolean; errors: string[]; warnings: string[] };
  exportProject: () => string;
  importProject: (projectData: string) => Promise<void>;
}

export interface ProjectStoreHookReturn {
  // Current state
  state: EnhancedProjectState;
  
  // Computed properties (real-time)
  computedProperties: {
    totalRooms: number;
    totalSegments: number;
    totalEquipment: number;
    totalCFM: number;
    totalDuctLength: number;
    averageVelocity: number;
    systemPressureDrop: number;
    projectComplexity: 'simple' | 'moderate' | 'complex';
    complianceStatus: {
      smacna: boolean;
      ashrae: boolean;
      overall: boolean;
    };
  };
  
  // Actions
  actions: ProjectStoreActions;
  
  // Performance and debugging
  metrics: ProjectStoreMetrics;
  isOptimizing: boolean;
  
  // Status flags
  canAddRoom: boolean;
  canAddSegment: boolean;
  canAddEquipment: boolean;
  hasUnsavedChanges: boolean;
  
  // Advanced features
  historySize: number;
  canUndo: boolean;
  canRedo: boolean;
}

// =============================================================================
// Main Hook Implementation
// =============================================================================

export function useEnhancedProjectStore(): ProjectStoreHookReturn {
  // Get the store instance
  const store = useEnhancedProjectStore();
  
  // Subscribe to store state
  const [state, setState] = useState<EnhancedProjectState>(store.getState());
  const [metrics, setMetrics] = useState<ProjectStoreMetrics>({
    stateSize: 0,
    historySize: 0,
    optimisticUpdatesCount: 0,
    computedPropertiesCount: 0,
    cacheSize: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    lastCalculationTime: 0
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [store]);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const storeMetrics = advancedStateManager.getStateMetrics('enhanced-project');
      setMetrics({
        ...storeMetrics,
        cacheHitRate: state.cacheHitRate || 0,
        lastCalculationTime: state.lastCalculationTime || 0
      });
    };

    // Update metrics immediately
    updateMetrics();

    // Set up periodic updates
    const interval = setInterval(updateMetrics, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [state.cacheHitRate, state.lastCalculationTime]);

  // Memoized computed properties
  const computedProperties = useMemo(() => ({
    totalRooms: state.totalRooms,
    totalSegments: state.totalSegments,
    totalEquipment: state.totalEquipment,
    totalCFM: state.totalCFM,
    totalDuctLength: state.totalDuctLength,
    averageVelocity: state.averageVelocity,
    systemPressureDrop: state.systemPressureDrop,
    projectComplexity: state.projectComplexity,
    complianceStatus: state.complianceStatus
  }), [
    state.totalRooms,
    state.totalSegments,
    state.totalEquipment,
    state.totalCFM,
    state.totalDuctLength,
    state.averageVelocity,
    state.systemPressureDrop,
    state.projectComplexity,
    state.complianceStatus
  ]);

  // Memoized actions
  const actions = useMemo<ProjectStoreActions>(() => ({
    // Core project actions
    createProject: state.createProject,
    loadProject: state.loadProject,
    updateProject: state.updateProject,
    saveProject: state.saveProject,
    deleteProject: state.deleteProject,
    clearProject: state.clearProject,
    
    // Room management
    addRoom: state.addRoom,
    updateRoom: state.updateRoom,
    deleteRoom: state.deleteRoom,
    
    // Segment management
    addSegment: state.addSegment,
    updateSegment: state.updateSegment,
    deleteSegment: state.deleteSegment,
    
    // Equipment management
    addEquipment: state.addEquipment,
    updateEquipment: state.updateEquipment,
    deleteEquipment: state.deleteEquipment,
    
    // Advanced state management
    optimisticUpdate: state.optimisticUpdate,
    confirmOptimisticUpdate: state.confirmOptimisticUpdate,
    rollbackOptimisticUpdate: state.rollbackOptimisticUpdate,
    undo: state.undo,
    redo: state.redo,
    
    // Utility actions
    validateProject: state.validateProject,
    exportProject: state.exportProject,
    importProject: state.importProject
  }), [state]);

  // Status flags
  const canAddRoom = useMemo(() => state.canAddRoom(), [state.canAddRoom]);
  const canAddSegment = useMemo(() => state.canAddSegment(), [state.canAddSegment]);
  const canAddEquipment = useMemo(() => state.canAddEquipment(), [state.canAddEquipment]);
  
  const hasUnsavedChanges = useMemo(() => {
    if (!state.currentProject) return false;
    // Simple check - in real implementation, would compare with last saved state
    return state.currentProject.last_modified !== state.currentProject.created_at;
  }, [state.currentProject]);

  const historySize = useMemo(() => state.getHistorySize(), [state.getHistorySize]);
  const canUndo = useMemo(() => historySize > 1, [historySize]);
  const canRedo = useMemo(() => false, []);  // Simplified - full redo would need separate implementation

  // Performance optimization effect
  useEffect(() => {
    if (metrics.memoryUsage > 10000000) { // 10MB threshold
      setIsOptimizing(true);
      
      // Trigger cleanup after a delay
      const timeout = setTimeout(() => {
        // Clear old history entries
        if (historySize > 20) {
          state.clearHistory();
        }
        
        setIsOptimizing(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [metrics.memoryUsage, historySize, state]);

  return {
    state,
    computedProperties,
    actions,
    metrics,
    isOptimizing,
    canAddRoom,
    canAddSegment,
    canAddEquipment,
    hasUnsavedChanges,
    historySize,
    canUndo,
    canRedo
  };
}

// =============================================================================
// Specialized Hooks for Specific Use Cases
// =============================================================================

/**
 * Hook for project statistics and computed properties only
 */
export function useProjectStats() {
  const { computedProperties, metrics } = useEnhancedProjectStore();
  
  return {
    ...computedProperties,
    performance: {
      cacheHitRate: metrics.cacheHitRate,
      lastCalculationTime: metrics.lastCalculationTime,
      memoryUsage: metrics.memoryUsage
    }
  };
}

/**
 * Hook for project actions only (useful for components that only need to trigger actions)
 */
export function useProjectActions() {
  const { actions } = useEnhancedProjectStore();
  return actions;
}

/**
 * Hook for project validation and compliance
 */
export function useProjectValidation() {
  const { state, computedProperties, actions } = useEnhancedProjectStore();
  
  const validation = useMemo(() => {
    return actions.validateProject();
  }, [actions, state.currentProject]);

  return {
    validation,
    complianceStatus: computedProperties.complianceStatus,
    projectComplexity: computedProperties.projectComplexity
  };
}

/**
 * Hook for optimistic updates management
 */
export function useOptimisticUpdates() {
  const { actions, metrics } = useEnhancedProjectStore();
  
  return {
    optimisticUpdate: actions.optimisticUpdate,
    confirmOptimisticUpdate: actions.confirmOptimisticUpdate,
    rollbackOptimisticUpdate: actions.rollbackOptimisticUpdate,
    pendingUpdatesCount: metrics.optimisticUpdatesCount
  };
}

/**
 * Hook for undo/redo functionality
 */
export function useProjectHistory() {
  const { actions, historySize, canUndo, canRedo } = useEnhancedProjectStore();
  
  return {
    undo: actions.undo,
    redo: actions.redo,
    historySize,
    canUndo,
    canRedo,
    clearHistory: actions.clearHistory
  };
}

// =============================================================================
// Performance Monitoring Hook
// =============================================================================

/**
 * Hook for monitoring store performance and optimization
 */
export function useProjectStorePerformance() {
  const { metrics, isOptimizing } = useEnhancedProjectStore();
  
  const performanceStatus = useMemo(() => {
    const { memoryUsage, cacheHitRate, stateSize } = metrics;
    
    let status: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    const recommendations: string[] = [];
    
    if (memoryUsage > 50000000) { // 50MB
      status = 'poor';
      recommendations.push('Consider clearing project history');
      recommendations.push('Reduce number of cached calculations');
    } else if (memoryUsage > 20000000) { // 20MB
      status = 'fair';
      recommendations.push('Monitor memory usage');
    } else if (memoryUsage > 10000000) { // 10MB
      status = 'good';
    }
    
    if (cacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low - consider adjusting cache strategy');
    }
    
    if (stateSize > 1000000) { // 1MB
      recommendations.push('State size is large - consider data normalization');
    }
    
    return {
      status,
      recommendations,
      metrics: {
        memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)} MB`,
        cacheHitRate: `${(cacheHitRate * 100).toFixed(1)}%`,
        stateSize: `${(stateSize / 1024).toFixed(2)} KB`
      }
    };
  }, [metrics]);
  
  return {
    ...performanceStatus,
    isOptimizing,
    rawMetrics: metrics
  };
}
