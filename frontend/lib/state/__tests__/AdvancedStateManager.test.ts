/**
 * Test Suite for Advanced State Manager
 * 
 * Tests all advanced state management features including:
 * - Store creation and configuration
 * - Computed properties with caching
 * - Cross-store dependencies and synchronization
 * - Optimistic updates with rollback
 * - Undo/redo functionality
 * - Performance monitoring and metrics
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AdvancedStateManager, ComputedProperty, CrossStoreSubscription } from '../AdvancedStateManager';

// =============================================================================
// Test Setup and Mocks
// =============================================================================

interface TestState {
  count: number;
  name: string;
  items: string[];
  computedTotal?: number;
  computedLength?: number;
  
  // Actions
  increment: () => void;
  setName: (name: string) => void;
  addItem: (item: string) => void;
  
  // Advanced methods (injected by AdvancedStateManager)
  optimisticUpdate: (updates: any, operation: string, timeout?: number) => string;
  confirmOptimisticUpdate: (updateId: string) => void;
  rollbackOptimisticUpdate: (updateId: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  getComputedProperty: (propertyName: string) => any;
  getStateMetrics: () => any;
  clearHistory: () => void;
  getHistorySize: () => number;
}

interface SecondTestState {
  multiplier: number;
  externalCount?: number;
  
  setMultiplier: (multiplier: number) => void;
  
  // Advanced methods
  optimisticUpdate: (updates: any, operation: string, timeout?: number) => string;
  confirmOptimisticUpdate: (updateId: string) => void;
  rollbackOptimisticUpdate: (updateId: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  getComputedProperty: (propertyName: string) => any;
  getStateMetrics: () => any;
  clearHistory: () => void;
  getHistorySize: () => number;
}

describe('AdvancedStateManager', () => {
  let stateManager: AdvancedStateManager;
  let testStore: any;
  let secondStore: any;

  beforeEach(() => {
    stateManager = new AdvancedStateManager();
    
    // Create test store
    testStore = stateManager.createStore<TestState>(
      'test-store',
      (set, get) => ({
        count: 0,
        name: 'test',
        items: [],
        
        increment: () => {
          set((state) => ({ count: state.count + 1 }), false, 'increment');
        },
        
        setName: (name: string) => {
          set({ name }, false, 'setName');
        },
        
        addItem: (item: string) => {
          set((state) => ({ items: [...state.items, item] }), false, 'addItem');
        },
        
        // Placeholder methods (will be replaced by AdvancedStateManager)
        optimisticUpdate: () => '',
        confirmOptimisticUpdate: () => {},
        rollbackOptimisticUpdate: () => {},
        undo: () => false,
        redo: () => false,
        getComputedProperty: () => undefined,
        getStateMetrics: () => ({}),
        clearHistory: () => {},
        getHistorySize: () => 0
      }),
      {
        name: 'test-store',
        enableHistory: true,
        enableOptimisticUpdates: true,
        enableComputedProperties: true,
        enableCrossStoreSync: true
      }
    );

    // Create second store for cross-store testing
    secondStore = stateManager.createStore<SecondTestState>(
      'second-store',
      (set, get) => ({
        multiplier: 1,
        
        setMultiplier: (multiplier: number) => {
          set({ multiplier }, false, 'setMultiplier');
        },
        
        // Placeholder methods
        optimisticUpdate: () => '',
        confirmOptimisticUpdate: () => {},
        rollbackOptimisticUpdate: () => {},
        undo: () => false,
        redo: () => false,
        getComputedProperty: () => undefined,
        getStateMetrics: () => ({}),
        clearHistory: () => {},
        getHistorySize: () => 0
      }),
      {
        name: 'second-store',
        enableHistory: true,
        enableCrossStoreSync: true
      }
    );
  });

  afterEach(() => {
    stateManager.cleanup();
  });

  // =============================================================================
  // Basic Store Creation Tests
  // =============================================================================

  describe('Store Creation', () => {
    it('should create stores with correct initial state', () => {
      const state = testStore.getState();
      
      expect(state.count).toBe(0);
      expect(state.name).toBe('test');
      expect(state.items).toEqual([]);
    });

    it('should provide enhanced methods', () => {
      const state = testStore.getState();
      
      expect(typeof state.optimisticUpdate).toBe('function');
      expect(typeof state.undo).toBe('function');
      expect(typeof state.redo).toBe('function');
      expect(typeof state.getStateMetrics).toBe('function');
    });

    it('should track state changes', () => {
      const initialState = testStore.getState();
      
      testStore.getState().increment();
      
      const newState = testStore.getState();
      expect(newState.count).toBe(1);
      expect(newState.count).not.toBe(initialState.count);
    });
  });

  // =============================================================================
  // Computed Properties Tests
  // =============================================================================

  describe('Computed Properties', () => {
    beforeEach(() => {
      // Add computed properties
      const computedTotal: ComputedProperty = {
        name: 'computedTotal',
        dependencies: ['count', 'items'],
        compute: (state: TestState) => state.count + state.items.length,
        cache: true,
        ttl: 60000
      };

      const computedLength: ComputedProperty = {
        name: 'computedLength',
        dependencies: ['name'],
        compute: (state: TestState) => state.name.length,
        cache: false
      };

      stateManager.addComputedProperty('test-store', computedTotal);
      stateManager.addComputedProperty('test-store', computedLength);
    });

    it('should calculate computed properties', () => {
      // Wait for computed properties to be calculated
      setTimeout(() => {
        const state = testStore.getState();
        expect(state.computedTotal).toBe(0); // count(0) + items.length(0)
        expect(state.computedLength).toBe(4); // 'test'.length
      }, 100);
    });

    it('should update computed properties when dependencies change', (done) => {
      setTimeout(() => {
        testStore.getState().increment();
        testStore.getState().addItem('item1');
        
        setTimeout(() => {
          const state = testStore.getState();
          expect(state.computedTotal).toBe(2); // count(1) + items.length(1)
          done();
        }, 50);
      }, 100);
    });

    it('should cache computed properties when enabled', () => {
      const computedValue = stateManager.getComputedProperty('test-store', 'computedTotal');
      const cachedValue = stateManager.getComputedProperty('test-store', 'computedTotal');
      
      expect(computedValue).toBe(cachedValue);
    });
  });

  // =============================================================================
  // Cross-Store Dependencies Tests
  // =============================================================================

  describe('Cross-Store Dependencies', () => {
    beforeEach(() => {
      const crossStoreSubscription: CrossStoreSubscription = {
        sourceStore: 'test-store',
        targetStore: 'second-store',
        sourceProperty: 'count',
        targetProperty: 'externalCount'
      };

      stateManager.addCrossStoreSubscription(crossStoreSubscription);
    });

    it('should sync properties across stores', (done) => {
      testStore.getState().increment();
      
      setTimeout(() => {
        const secondState = secondStore.getState();
        expect(secondState.externalCount).toBe(1);
        done();
      }, 50);
    });

    it('should apply transformations when specified', (done) => {
      const transformedSubscription: CrossStoreSubscription = {
        sourceStore: 'test-store',
        targetStore: 'second-store',
        sourceProperty: 'count',
        targetProperty: 'multiplier',
        transform: (value: number) => value * 2
      };

      stateManager.addCrossStoreSubscription(transformedSubscription);
      
      testStore.getState().increment();
      testStore.getState().increment();
      
      setTimeout(() => {
        const secondState = secondStore.getState();
        expect(secondState.multiplier).toBe(4); // count(2) * 2
        done();
      }, 50);
    });

    it('should apply conditions when specified', (done) => {
      const conditionalSubscription: CrossStoreSubscription = {
        sourceStore: 'test-store',
        targetStore: 'second-store',
        sourceProperty: 'count',
        targetProperty: 'multiplier',
        condition: (value: number) => value > 2
      };

      stateManager.addCrossStoreSubscription(conditionalSubscription);
      
      // This should not trigger the subscription
      testStore.getState().increment();
      
      setTimeout(() => {
        let secondState = secondStore.getState();
        expect(secondState.multiplier).toBe(1); // Should remain unchanged
        
        // This should trigger the subscription
        testStore.getState().increment();
        testStore.getState().increment();
        
        setTimeout(() => {
          secondState = secondStore.getState();
          expect(secondState.multiplier).toBe(3); // Should be updated
          done();
        }, 50);
      }, 50);
    });
  });

  // =============================================================================
  // Optimistic Updates Tests
  // =============================================================================

  describe('Optimistic Updates', () => {
    it('should apply optimistic updates immediately', () => {
      const updateId = testStore.getState().optimisticUpdate(
        { count: 10 },
        'optimistic-increment'
      );
      
      expect(updateId).toBeTruthy();
      expect(testStore.getState().count).toBe(10);
    });

    it('should confirm optimistic updates', () => {
      const updateId = testStore.getState().optimisticUpdate(
        { count: 5 },
        'optimistic-set'
      );
      
      testStore.getState().confirmOptimisticUpdate(updateId);
      
      // State should remain the same after confirmation
      expect(testStore.getState().count).toBe(5);
    });

    it('should rollback optimistic updates', () => {
      const originalCount = testStore.getState().count;
      
      const updateId = testStore.getState().optimisticUpdate(
        { count: 100 },
        'optimistic-large-increment'
      );
      
      expect(testStore.getState().count).toBe(100);
      
      testStore.getState().rollbackOptimisticUpdate(updateId);
      
      expect(testStore.getState().count).toBe(originalCount);
    });

    it('should auto-rollback after timeout', (done) => {
      const originalCount = testStore.getState().count;
      
      testStore.getState().optimisticUpdate(
        { count: 50 },
        'auto-rollback-test',
        100 // 100ms timeout
      );
      
      expect(testStore.getState().count).toBe(50);
      
      setTimeout(() => {
        expect(testStore.getState().count).toBe(originalCount);
        done();
      }, 150);
    });
  });

  // =============================================================================
  // History and Undo/Redo Tests
  // =============================================================================

  describe('History Management', () => {
    it('should record state history', () => {
      const initialHistorySize = testStore.getState().getHistorySize();
      
      testStore.getState().increment();
      testStore.getState().setName('new-name');
      
      const newHistorySize = testStore.getState().getHistorySize();
      expect(newHistorySize).toBeGreaterThan(initialHistorySize);
    });

    it('should support undo functionality', () => {
      const originalName = testStore.getState().name;
      
      testStore.getState().setName('changed-name');
      expect(testStore.getState().name).toBe('changed-name');
      
      const undoResult = testStore.getState().undo();
      expect(undoResult).toBe(true);
      expect(testStore.getState().name).toBe(originalName);
    });

    it('should not undo when history is insufficient', () => {
      // Clear history first
      testStore.getState().clearHistory();
      
      const undoResult = testStore.getState().undo();
      expect(undoResult).toBe(false);
    });

    it('should clear history', () => {
      testStore.getState().increment();
      testStore.getState().increment();
      
      expect(testStore.getState().getHistorySize()).toBeGreaterThan(0);
      
      testStore.getState().clearHistory();
      expect(testStore.getState().getHistorySize()).toBe(0);
    });
  });

  // =============================================================================
  // Performance and Metrics Tests
  // =============================================================================

  describe('Performance Monitoring', () => {
    it('should provide state metrics', () => {
      const metrics = stateManager.getStateMetrics('test-store');
      
      expect(metrics).toHaveProperty('storeName');
      expect(metrics).toHaveProperty('stateSize');
      expect(metrics).toHaveProperty('historySize');
      expect(metrics).toHaveProperty('optimisticUpdatesCount');
      expect(metrics).toHaveProperty('computedPropertiesCount');
      expect(metrics).toHaveProperty('memoryUsage');
      
      expect(metrics.storeName).toBe('test-store');
      expect(typeof metrics.stateSize).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
    });

    it('should track memory usage', () => {
      const initialMetrics = stateManager.getStateMetrics('test-store');
      
      // Add some data to increase memory usage
      for (let i = 0; i < 100; i++) {
        testStore.getState().addItem(`item-${i}`);
      }
      
      const newMetrics = stateManager.getStateMetrics('test-store');
      expect(newMetrics.memoryUsage).toBeGreaterThan(initialMetrics.memoryUsage);
    });

    it('should track optimistic updates count', () => {
      const updateId1 = testStore.getState().optimisticUpdate({ count: 1 }, 'test1');
      const updateId2 = testStore.getState().optimisticUpdate({ count: 2 }, 'test2');
      
      const metrics = stateManager.getStateMetrics('test-store');
      expect(metrics.optimisticUpdatesCount).toBe(2);
      
      testStore.getState().confirmOptimisticUpdate(updateId1);
      
      const updatedMetrics = stateManager.getStateMetrics('test-store');
      expect(updatedMetrics.optimisticUpdatesCount).toBe(1);
    });
  });

  // =============================================================================
  // Cleanup Tests
  // =============================================================================

  describe('Cleanup', () => {
    it('should cleanup specific stores', () => {
      stateManager.cleanup('test-store');
      
      // Store should be removed
      expect(stateManager['stores'].has('test-store')).toBe(false);
      
      // Other stores should remain
      expect(stateManager['stores'].has('second-store')).toBe(true);
    });

    it('should cleanup all stores', () => {
      stateManager.cleanup();
      
      expect(stateManager['stores'].size).toBe(0);
      expect(stateManager['computedProperties'].size).toBe(0);
      expect(stateManager['crossStoreSubscriptions'].size).toBe(0);
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle invalid computed property dependencies', () => {
      const invalidProperty: ComputedProperty = {
        name: 'invalidProperty',
        dependencies: ['nonExistentProperty'],
        compute: (state: any) => state.nonExistentProperty || 0
      };

      expect(() => {
        stateManager.addComputedProperty('test-store', invalidProperty);
      }).not.toThrow();
    });

    it('should handle invalid cross-store subscriptions', () => {
      const invalidSubscription: CrossStoreSubscription = {
        sourceStore: 'non-existent-store',
        targetStore: 'test-store',
        sourceProperty: 'someProperty',
        targetProperty: 'someTarget'
      };

      // Should not throw, but should log warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      stateManager.addCrossStoreSubscription(invalidSubscription);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
