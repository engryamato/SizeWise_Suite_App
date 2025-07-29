/**
 * Test Suite for Enhanced Project Store React Hook
 * 
 * Tests the React integration of the enhanced project store including:
 * - Hook initialization and state subscriptions
 * - Computed properties integration
 * - Performance monitoring
 * - Specialized hooks functionality
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useEnhancedProjectStore, 
  useProjectStats, 
  useProjectActions, 
  useProjectValidation,
  useOptimisticUpdates,
  useProjectHistory,
  useProjectStorePerformance
} from '../useEnhancedProjectStore';
import { advancedStateManager } from '../../state/AdvancedStateManager';

// =============================================================================
// Test Setup and Mocks
// =============================================================================

// Mock the enhanced project store
jest.mock('../../stores/enhanced-project-store', () => ({
  useEnhancedProjectStore: jest.fn(() => ({
    getState: jest.fn(() => ({
      currentProject: null,
      projects: [],
      isLoading: false,
      isSaving: false,
      error: null,
      totalRooms: 0,
      totalSegments: 0,
      totalEquipment: 0,
      totalCFM: 0,
      totalDuctLength: 0,
      averageVelocity: 0,
      systemPressureDrop: 0,
      projectComplexity: 'simple',
      complianceStatus: { smacna: false, ashrae: false, overall: false },
      lastCalculationTime: 0,
      cacheHitRate: 0,
      createProject: jest.fn(),
      loadProject: jest.fn(),
      updateProject: jest.fn(),
      saveProject: jest.fn(),
      deleteProject: jest.fn(),
      clearProject: jest.fn(),
      addRoom: jest.fn(),
      updateRoom: jest.fn(),
      deleteRoom: jest.fn(),
      addSegment: jest.fn(),
      updateSegment: jest.fn(),
      deleteSegment: jest.fn(),
      addEquipment: jest.fn(),
      updateEquipment: jest.fn(),
      deleteEquipment: jest.fn(),
      optimisticUpdate: jest.fn(() => 'update-id'),
      confirmOptimisticUpdate: jest.fn(),
      rollbackOptimisticUpdate: jest.fn(),
      undo: jest.fn(() => true),
      redo: jest.fn(() => false),
      getComputedProperty: jest.fn(),
      getStateMetrics: jest.fn(() => ({
        storeName: 'enhanced-project',
        stateSize: 1024,
        historySize: 5,
        optimisticUpdatesCount: 0,
        computedPropertiesCount: 8,
        cacheSize: 10,
        memoryUsage: 2048
      })),
      clearHistory: jest.fn(),
      getHistorySize: jest.fn(() => 5),
      canAddRoom: jest.fn(() => true),
      canAddSegment: jest.fn(() => true),
      canAddEquipment: jest.fn(() => true),
      validateProject: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
      exportProject: jest.fn(() => '{}'),
      importProject: jest.fn()
    })),
    subscribe: jest.fn((callback) => {
      // Return unsubscribe function
      return jest.fn();
    }),
    setState: jest.fn()
  }))
}));

// Mock the advanced state manager
jest.mock('../../state/AdvancedStateManager', () => ({
  advancedStateManager: {
    getStateMetrics: jest.fn(() => ({
      storeName: 'enhanced-project',
      stateSize: 1024,
      historySize: 5,
      optimisticUpdatesCount: 0,
      computedPropertiesCount: 8,
      cacheSize: 10,
      memoryUsage: 2048
    }))
  }
}));

describe('useEnhancedProjectStore Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  // =============================================================================
  // Main Hook Tests
  // =============================================================================

  describe('Main Hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useEnhancedProjectStore());

      expect(result.current.state).toBeDefined();
      expect(result.current.computedProperties).toBeDefined();
      expect(result.current.actions).toBeDefined();
      expect(result.current.metrics).toBeDefined();
      
      // Check initial computed properties
      expect(result.current.computedProperties.totalRooms).toBe(0);
      expect(result.current.computedProperties.totalSegments).toBe(0);
      expect(result.current.computedProperties.totalEquipment).toBe(0);
      expect(result.current.computedProperties.projectComplexity).toBe('simple');
    });

    it('should provide all required actions', () => {
      const { result } = renderHook(() => useEnhancedProjectStore());

      const { actions } = result.current;

      // Core project actions
      expect(typeof actions.createProject).toBe('function');
      expect(typeof actions.loadProject).toBe('function');
      expect(typeof actions.updateProject).toBe('function');
      expect(typeof actions.saveProject).toBe('function');
      expect(typeof actions.deleteProject).toBe('function');
      expect(typeof actions.clearProject).toBe('function');

      // Room management
      expect(typeof actions.addRoom).toBe('function');
      expect(typeof actions.updateRoom).toBe('function');
      expect(typeof actions.deleteRoom).toBe('function');

      // Segment management
      expect(typeof actions.addSegment).toBe('function');
      expect(typeof actions.updateSegment).toBe('function');
      expect(typeof actions.deleteSegment).toBe('function');

      // Equipment management
      expect(typeof actions.addEquipment).toBe('function');
      expect(typeof actions.updateEquipment).toBe('function');
      expect(typeof actions.deleteEquipment).toBe('function');

      // Advanced state management
      expect(typeof actions.optimisticUpdate).toBe('function');
      expect(typeof actions.confirmOptimisticUpdate).toBe('function');
      expect(typeof actions.rollbackOptimisticUpdate).toBe('function');
      expect(typeof actions.undo).toBe('function');
      expect(typeof actions.redo).toBe('function');

      // Utility actions
      expect(typeof actions.validateProject).toBe('function');
      expect(typeof actions.exportProject).toBe('function');
      expect(typeof actions.importProject).toBe('function');
    });

    it('should provide status flags', () => {
      const { result } = renderHook(() => useEnhancedProjectStore());

      expect(typeof result.current.canAddRoom).toBe('boolean');
      expect(typeof result.current.canAddSegment).toBe('boolean');
      expect(typeof result.current.canAddEquipment).toBe('boolean');
      expect(typeof result.current.hasUnsavedChanges).toBe('boolean');
      expect(typeof result.current.canUndo).toBe('boolean');
      expect(typeof result.current.canRedo).toBe('boolean');
    });

    it('should provide performance metrics', () => {
      const { result } = renderHook(() => useEnhancedProjectStore());

      const { metrics } = result.current;

      expect(metrics).toHaveProperty('stateSize');
      expect(metrics).toHaveProperty('historySize');
      expect(metrics).toHaveProperty('optimisticUpdatesCount');
      expect(metrics).toHaveProperty('computedPropertiesCount');
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('lastCalculationTime');

      expect(typeof metrics.stateSize).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
    });

    it('should update metrics periodically', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useEnhancedProjectStore());

      const initialMetrics = result.current.metrics;

      // Fast-forward time to trigger metrics update
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(advancedStateManager.getStateMetrics).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  // =============================================================================
  // Specialized Hooks Tests
  // =============================================================================

  describe('useProjectStats Hook', () => {
    it('should return computed properties and performance metrics', () => {
      const { result } = renderHook(() => useProjectStats());

      expect(result.current).toHaveProperty('totalRooms');
      expect(result.current).toHaveProperty('totalSegments');
      expect(result.current).toHaveProperty('totalEquipment');
      expect(result.current).toHaveProperty('totalCFM');
      expect(result.current).toHaveProperty('totalDuctLength');
      expect(result.current).toHaveProperty('averageVelocity');
      expect(result.current).toHaveProperty('systemPressureDrop');
      expect(result.current).toHaveProperty('projectComplexity');
      expect(result.current).toHaveProperty('complianceStatus');
      expect(result.current).toHaveProperty('performance');

      expect(result.current.performance).toHaveProperty('cacheHitRate');
      expect(result.current.performance).toHaveProperty('lastCalculationTime');
      expect(result.current.performance).toHaveProperty('memoryUsage');
    });
  });

  describe('useProjectActions Hook', () => {
    it('should return only action methods', () => {
      const { result } = renderHook(() => useProjectActions());

      // Should have all action methods
      expect(typeof result.current.createProject).toBe('function');
      expect(typeof result.current.addRoom).toBe('function');
      expect(typeof result.current.optimisticUpdate).toBe('function');

      // Should not have state properties
      expect(result.current).not.toHaveProperty('state');
      expect(result.current).not.toHaveProperty('metrics');
    });
  });

  describe('useProjectValidation Hook', () => {
    it('should return validation and compliance information', () => {
      const { result } = renderHook(() => useProjectValidation());

      expect(result.current).toHaveProperty('validation');
      expect(result.current).toHaveProperty('complianceStatus');
      expect(result.current).toHaveProperty('projectComplexity');

      expect(result.current.validation).toHaveProperty('valid');
      expect(result.current.validation).toHaveProperty('errors');
      expect(result.current.validation).toHaveProperty('warnings');

      expect(result.current.complianceStatus).toHaveProperty('smacna');
      expect(result.current.complianceStatus).toHaveProperty('ashrae');
      expect(result.current.complianceStatus).toHaveProperty('overall');
    });
  });

  describe('useOptimisticUpdates Hook', () => {
    it('should return optimistic update methods and count', () => {
      const { result } = renderHook(() => useOptimisticUpdates());

      expect(typeof result.current.optimisticUpdate).toBe('function');
      expect(typeof result.current.confirmOptimisticUpdate).toBe('function');
      expect(typeof result.current.rollbackOptimisticUpdate).toBe('function');
      expect(typeof result.current.pendingUpdatesCount).toBe('number');
    });
  });

  describe('useProjectHistory Hook', () => {
    it('should return history management methods', () => {
      const { result } = renderHook(() => useProjectHistory());

      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
      expect(typeof result.current.clearHistory).toBe('function');
      expect(typeof result.current.historySize).toBe('number');
      expect(typeof result.current.canUndo).toBe('boolean');
      expect(typeof result.current.canRedo).toBe('boolean');
    });
  });

  describe('useProjectStorePerformance Hook', () => {
    it('should return performance status and recommendations', () => {
      const { result } = renderHook(() => useProjectStorePerformance());

      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('recommendations');
      expect(result.current).toHaveProperty('metrics');
      expect(result.current).toHaveProperty('isOptimizing');
      expect(result.current).toHaveProperty('rawMetrics');

      expect(['excellent', 'good', 'fair', 'poor']).toContain(result.current.status);
      expect(Array.isArray(result.current.recommendations)).toBe(true);
    });

    it('should provide formatted metrics', () => {
      const { result } = renderHook(() => useProjectStorePerformance());

      const { metrics } = result.current;

      expect(metrics.memoryUsage).toMatch(/\d+\.\d+ MB/);
      expect(metrics.cacheHitRate).toMatch(/\d+\.\d%/);
      expect(metrics.stateSize).toMatch(/\d+\.\d+ KB/);
    });

    it('should determine performance status based on metrics', () => {
      // Mock high memory usage
      (advancedStateManager.getStateMetrics as jest.Mock).mockReturnValue({
        storeName: 'enhanced-project',
        stateSize: 1024,
        historySize: 5,
        optimisticUpdatesCount: 0,
        computedPropertiesCount: 8,
        cacheSize: 10,
        memoryUsage: 60000000 // 60MB - should be 'poor'
      });

      const { result } = renderHook(() => useProjectStorePerformance());

      expect(result.current.status).toBe('poor');
      expect(result.current.recommendations.length).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // State Subscription Tests
  // =============================================================================

  describe('State Subscriptions', () => {
    it('should subscribe to store changes on mount', () => {
      const mockSubscribe = jest.fn(() => jest.fn());
      
      // Mock the store to return our mock subscribe function
      const mockStore = {
        getState: jest.fn(() => ({})),
        subscribe: mockSubscribe,
        setState: jest.fn()
      };

      // Override the mock for this test
      const useEnhancedProjectStoreMock = jest.requireMock('../../stores/enhanced-project-store').useEnhancedProjectStore;
      useEnhancedProjectStoreMock.mockReturnValue(mockStore);

      const { unmount } = renderHook(() => useEnhancedProjectStore());

      expect(mockSubscribe).toHaveBeenCalled();

      // Cleanup
      unmount();
    });

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = jest.fn();
      const mockSubscribe = jest.fn(() => mockUnsubscribe);
      
      const mockStore = {
        getState: jest.fn(() => ({})),
        subscribe: mockSubscribe,
        setState: jest.fn()
      };

      const useEnhancedProjectStoreMock = jest.requireMock('../../stores/enhanced-project-store').useEnhancedProjectStore;
      useEnhancedProjectStoreMock.mockReturnValue(mockStore);

      const { unmount } = renderHook(() => useEnhancedProjectStore());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Memory Management Tests
  // =============================================================================

  describe('Memory Management', () => {
    it('should trigger optimization when memory usage is high', async () => {
      // Mock high memory usage
      (advancedStateManager.getStateMetrics as jest.Mock).mockReturnValue({
        storeName: 'enhanced-project',
        stateSize: 1024,
        historySize: 25, // High history size
        optimisticUpdatesCount: 0,
        computedPropertiesCount: 8,
        cacheSize: 10,
        memoryUsage: 15000000 // 15MB - above threshold
      });

      const { result } = renderHook(() => useEnhancedProjectStore());

      await waitFor(() => {
        expect(result.current.isOptimizing).toBe(true);
      });
    });

    it('should clear history when memory usage is too high', async () => {
      jest.useFakeTimers();

      // Mock very high memory usage
      (advancedStateManager.getStateMetrics as jest.Mock).mockReturnValue({
        storeName: 'enhanced-project',
        stateSize: 1024,
        historySize: 25,
        optimisticUpdatesCount: 0,
        computedPropertiesCount: 8,
        cacheSize: 10,
        memoryUsage: 15000000
      });

      const mockClearHistory = jest.fn();
      const mockStore = {
        getState: jest.fn(() => ({
          clearHistory: mockClearHistory,
          getHistorySize: jest.fn(() => 25)
        })),
        subscribe: jest.fn(() => jest.fn()),
        setState: jest.fn()
      };

      const useEnhancedProjectStoreMock = jest.requireMock('../../stores/enhanced-project-store').useEnhancedProjectStore;
      useEnhancedProjectStoreMock.mockReturnValue(mockStore);

      renderHook(() => useEnhancedProjectStore());

      // Fast-forward past the optimization timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockClearHistory).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle store subscription errors gracefully', () => {
      const mockStore = {
        getState: jest.fn(() => ({})),
        subscribe: jest.fn(() => {
          throw new Error('Subscription error');
        }),
        setState: jest.fn()
      };

      const useEnhancedProjectStoreMock = jest.requireMock('../../stores/enhanced-project-store').useEnhancedProjectStore;
      useEnhancedProjectStoreMock.mockReturnValue(mockStore);

      expect(() => {
        renderHook(() => useEnhancedProjectStore());
      }).not.toThrow();
    });

    it('should handle metrics update errors gracefully', () => {
      (advancedStateManager.getStateMetrics as jest.Mock).mockImplementation(() => {
        throw new Error('Metrics error');
      });

      expect(() => {
        renderHook(() => useEnhancedProjectStore());
      }).not.toThrow();
    });
  });

  // =============================================================================
  // Memoization Tests
  // =============================================================================

  describe('Memoization', () => {
    it('should memoize computed properties', () => {
      const { result, rerender } = renderHook(() => useEnhancedProjectStore());

      const firstComputedProperties = result.current.computedProperties;
      
      // Rerender without changing dependencies
      rerender();
      
      const secondComputedProperties = result.current.computedProperties;
      
      // Should be the same reference due to memoization
      expect(firstComputedProperties).toBe(secondComputedProperties);
    });

    it('should memoize actions', () => {
      const { result, rerender } = renderHook(() => useEnhancedProjectStore());

      const firstActions = result.current.actions;
      
      rerender();
      
      const secondActions = result.current.actions;
      
      expect(firstActions).toBe(secondActions);
    });
  });
});
