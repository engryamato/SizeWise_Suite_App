/**
 * Advanced State Manager for SizeWise Suite
 * 
 * Provides enterprise-scale state management enhancements including:
 * - Computed properties with automatic dependency tracking
 * - Cross-store dependencies and reactive updates
 * - Optimistic updates with rollback capabilities
 * - Undo/redo functionality with history management
 * - Performance optimization and memory management
 * - Real-time synchronization capabilities
 */

import { create, StateCreator } from 'zustand';
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// =============================================================================
// Core Types and Interfaces
// =============================================================================

export interface ComputedProperty<T = any> {
  name: string;
  dependencies: string[];
  compute: (state: any) => T;
  cache?: boolean;
  ttl?: number; // Time to live in milliseconds
}

export interface CrossStoreSubscription {
  sourceStore: string;
  targetStore: string;
  sourceProperty: string;
  targetProperty: string;
  transform?: (value: any) => any;
  condition?: (value: any) => boolean;
}

export interface OptimisticUpdate<T = any> {
  id: string;
  timestamp: number;
  originalState: T;
  optimisticState: T;
  operation: string;
  rollbackTimeout?: number;
}

export interface StateHistoryEntry<T = any> {
  id: string;
  timestamp: number;
  state: T;
  operation: string;
  metadata?: Record<string, any>;
}

export interface AdvancedStoreConfig {
  name: string;
  enableHistory?: boolean;
  historyLimit?: number;
  enableOptimisticUpdates?: boolean;
  optimisticTimeout?: number;
  enableComputedProperties?: boolean;
  enableCrossStoreSync?: boolean;
  persistConfig?: {
    enabled: boolean;
    partialize?: (state: any) => any;
    version?: number;
  };
}

// =============================================================================
// Advanced State Manager Class
// =============================================================================

export class AdvancedStateManager {
  private stores = new Map<string, any>();
  private computedProperties = new Map<string, ComputedProperty[]>();
  private crossStoreSubscriptions = new Map<string, CrossStoreSubscription[]>();
  private optimisticUpdates = new Map<string, OptimisticUpdate[]>();
  private stateHistory = new Map<string, StateHistoryEntry[]>();
  private computedCache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private unsubscribeFunctions = new Map<string, (() => void)[]>();

  // =============================================================================
  // Store Creation and Management
  // =============================================================================

  createStore<T extends Record<string, any>>(
    name: string,
    stateCreator: StateCreator<T>,
    config: AdvancedStoreConfig
  ) {
    const enhancedStateCreator: StateCreator<T> = (set, get, api) => {
      const originalState = stateCreator(set, get, api);

      // Enhanced set function with history and optimistic updates
      const enhancedSet = (
        partial: T | Partial<T> | ((state: T) => T | Partial<T>),
        replace?: boolean | undefined,
        action?: string | undefined
      ) => {
        const currentState = get();

        // Record state history if enabled
        if (config.enableHistory) {
          this.recordStateHistory(name, currentState, action || 'unknown');
        }

        // Apply the update
        set(partial, replace, action);

        // Update computed properties
        if (config.enableComputedProperties) {
          this.updateComputedProperties(name, get());
        }

        // Trigger cross-store updates
        if (config.enableCrossStoreSync) {
          this.triggerCrossStoreUpdates(name, get());
        }
      };

      return {
        ...originalState,

        // Enhanced state management methods
        optimisticUpdate: (updates: Partial<T>, operation: string, timeout?: number) => {
          if (!config.enableOptimisticUpdates) return;

          const updateId = `${name}-${Date.now()}-${Math.random()}`;
          const originalState = get();
          const optimisticState = { ...originalState, ...updates };

          // Store optimistic update
          const optimisticUpdate: OptimisticUpdate<T> = {
            id: updateId,
            timestamp: Date.now(),
            originalState,
            optimisticState,
            operation,
            rollbackTimeout: timeout || config.optimisticTimeout || 5000
          };

          this.addOptimisticUpdate(name, optimisticUpdate);

          // Apply optimistic update
          enhancedSet(updates, false, `optimistic:${operation}`);

          // Set rollback timer
          setTimeout(() => {
            this.rollbackOptimisticUpdate(name, updateId);
          }, optimisticUpdate.rollbackTimeout);

          return updateId;
        },

        confirmOptimisticUpdate: (updateId: string) => {
          this.confirmOptimisticUpdate(name, updateId);
        },

        rollbackOptimisticUpdate: (updateId: string) => {
          this.rollbackOptimisticUpdate(name, updateId);
        },

        undo: () => {
          if (!config.enableHistory) return false;
          return this.undo(name);
        },

        redo: () => {
          if (!config.enableHistory) return false;
          return this.redo(name);
        },

        getComputedProperty: (propertyName: string) => {
          return this.getComputedProperty(name, propertyName);
        },

        // Performance and debugging methods
        getStateMetrics: () => {
          return this.getStateMetrics(name);
        },

        clearHistory: () => {
          this.clearHistory(name);
        },

        getHistorySize: () => {
          return this.getHistorySize(name);
        }
      };
    };

    // Apply middleware based on configuration
    let middlewareStack = enhancedStateCreator;

    // Add immer for immutable updates
    middlewareStack = immer(middlewareStack);

    // Add subscribeWithSelector for computed properties and cross-store sync
    if (config.enableComputedProperties || config.enableCrossStoreSync) {
      middlewareStack = subscribeWithSelector(middlewareStack);
    }

    // Add persistence if configured
    if (config.persistConfig?.enabled) {
      middlewareStack = persist(middlewareStack, {
        name: `sizewise-${name}-store`,
        partialize: config.persistConfig.partialize,
        version: config.persistConfig.version || 1
      });
    }

    // Add devtools
    middlewareStack = devtools(middlewareStack, { name: `SizeWise ${name} Store` });

    // Create the store
    const store = create(middlewareStack);

    // Register the store
    this.stores.set(name, store);

    // Initialize computed properties
    if (config.enableComputedProperties) {
      this.initializeComputedProperties(name, store);
    }

    // Initialize cross-store subscriptions
    if (config.enableCrossStoreSync) {
      this.initializeCrossStoreSubscriptions(name, store);
    }

    return store;
  }

  // =============================================================================
  // Computed Properties Management
  // =============================================================================

  addComputedProperty<T>(storeName: string, property: ComputedProperty<T>) {
    const properties = this.computedProperties.get(storeName) || [];
    properties.push(property);
    this.computedProperties.set(storeName, properties);

    // Update the store with the computed property
    const store = this.stores.get(storeName);
    if (store) {
      this.updateComputedProperty(storeName, property, store.getState());
    }
  }

  private updateComputedProperties(storeName: string, state: any) {
    const properties = this.computedProperties.get(storeName) || [];
    
    for (const property of properties) {
      this.updateComputedProperty(storeName, property, state);
    }
  }

  private updateComputedProperty(storeName: string, property: ComputedProperty, state: any) {
    const cacheKey = `${storeName}.${property.name}`;
    
    // Check cache if enabled
    if (property.cache) {
      const cached = this.computedCache.get(cacheKey);
      if (cached && property.ttl && (Date.now() - cached.timestamp) < property.ttl) {
        return cached.value;
      }
    }

    // Compute the value
    const computedValue = property.compute(state);

    // Cache the result if enabled
    if (property.cache) {
      this.computedCache.set(cacheKey, {
        value: computedValue,
        timestamp: Date.now(),
        ttl: property.ttl || 300000 // Default 5 minutes
      });
    }

    // Update the store state with computed property
    const store = this.stores.get(storeName);
    if (store) {
      store.setState((state: any) => ({
        ...state,
        [property.name]: computedValue
      }), false, `computed:${property.name}`);
    }

    return computedValue;
  }

  getComputedProperty(storeName: string, propertyName: string) {
    const cacheKey = `${storeName}.${propertyName}`;
    const cached = this.computedCache.get(cacheKey);
    
    if (cached) {
      return cached.value;
    }

    // Recompute if not cached
    const properties = this.computedProperties.get(storeName) || [];
    const property = properties.find(p => p.name === propertyName);
    
    if (property) {
      const store = this.stores.get(storeName);
      if (store) {
        return this.updateComputedProperty(storeName, property, store.getState());
      }
    }

    return undefined;
  }

  // =============================================================================
  // Cross-Store Dependencies
  // =============================================================================

  addCrossStoreSubscription(subscription: CrossStoreSubscription) {
    const subscriptions = this.crossStoreSubscriptions.get(subscription.sourceStore) || [];
    subscriptions.push(subscription);
    this.crossStoreSubscriptions.set(subscription.sourceStore, subscriptions);

    // Set up the actual subscription
    this.setupCrossStoreSubscription(subscription);
  }

  private setupCrossStoreSubscription(subscription: CrossStoreSubscription) {
    const sourceStore = this.stores.get(subscription.sourceStore);
    const targetStore = this.stores.get(subscription.targetStore);

    if (!sourceStore || !targetStore) {
      console.warn(`Cross-store subscription failed: stores not found`, subscription);
      return;
    }

    // Subscribe to changes in the source property
    const unsubscribe = sourceStore.subscribe(
      (state: any) => state[subscription.sourceProperty],
      (value: any) => {
        // Apply condition if specified
        if (subscription.condition && !subscription.condition(value)) {
          return;
        }

        // Transform value if specified
        const transformedValue = subscription.transform ? subscription.transform(value) : value;

        // Update target store
        targetStore.setState((state: any) => ({
          ...state,
          [subscription.targetProperty]: transformedValue
        }), false, `cross-store:${subscription.sourceStore}->${subscription.targetStore}`);
      }
    );

    // Store unsubscribe function
    const unsubscribeFunctions = this.unsubscribeFunctions.get(subscription.sourceStore) || [];
    unsubscribeFunctions.push(unsubscribe);
    this.unsubscribeFunctions.set(subscription.sourceStore, unsubscribeFunctions);
  }

  private triggerCrossStoreUpdates(storeName: string, state: any) {
    const subscriptions = this.crossStoreSubscriptions.get(storeName) || [];
    
    for (const subscription of subscriptions) {
      const value = state[subscription.sourceProperty];
      
      if (subscription.condition && !subscription.condition(value)) {
        continue;
      }

      const transformedValue = subscription.transform ? subscription.transform(value) : value;
      const targetStore = this.stores.get(subscription.targetStore);

      if (targetStore) {
        targetStore.setState((targetState: any) => ({
          ...targetState,
          [subscription.targetProperty]: transformedValue
        }), false, `cross-store:${storeName}->${subscription.targetStore}`);
      }
    }
  }

  // =============================================================================
  // Optimistic Updates Management
  // =============================================================================

  private addOptimisticUpdate(storeName: string, update: OptimisticUpdate) {
    const updates = this.optimisticUpdates.get(storeName) || [];
    updates.push(update);
    this.optimisticUpdates.set(storeName, updates);
  }

  confirmOptimisticUpdate(storeName: string, updateId: string) {
    const updates = this.optimisticUpdates.get(storeName) || [];
    const filteredUpdates = updates.filter(update => update.id !== updateId);
    this.optimisticUpdates.set(storeName, filteredUpdates);
  }

  rollbackOptimisticUpdate(storeName: string, updateId: string) {
    const updates = this.optimisticUpdates.get(storeName) || [];
    const update = updates.find(u => u.id === updateId);

    if (update) {
      const store = this.stores.get(storeName);
      if (store) {
        store.setState(update.originalState, true, `rollback:${update.operation}`);
      }

      // Remove the update
      const filteredUpdates = updates.filter(u => u.id !== updateId);
      this.optimisticUpdates.set(storeName, filteredUpdates);
    }
  }

  // =============================================================================
  // History Management
  // =============================================================================

  private recordStateHistory(storeName: string, state: any, operation: string) {
    const history = this.stateHistory.get(storeName) || [];
    const entry: StateHistoryEntry = {
      id: `${storeName}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      operation
    };

    history.push(entry);

    // Limit history size (default 50 entries)
    const limit = 50; // Could be configurable
    if (history.length > limit) {
      history.splice(0, history.length - limit);
    }

    this.stateHistory.set(storeName, history);
  }

  undo(storeName: string): boolean {
    const history = this.stateHistory.get(storeName) || [];
    if (history.length < 2) return false; // Need at least 2 entries to undo

    // Remove current state and restore previous
    history.pop(); // Remove current
    const previousEntry = history[history.length - 1];

    const store = this.stores.get(storeName);
    if (store && previousEntry) {
      store.setState(previousEntry.state, true, `undo:${previousEntry.operation}`);
      return true;
    }

    return false;
  }

  redo(storeName: string): boolean {
    // Redo implementation would require a separate redo stack
    // This is a simplified version - full implementation would need more complex state management
    console.warn('Redo functionality requires additional implementation');
    return false;
  }

  clearHistory(storeName: string) {
    this.stateHistory.delete(storeName);
  }

  getHistorySize(storeName: string): number {
    const history = this.stateHistory.get(storeName) || [];
    return history.length;
  }

  // =============================================================================
  // Performance and Metrics
  // =============================================================================

  getStateMetrics(storeName: string) {
    const store = this.stores.get(storeName);
    const history = this.stateHistory.get(storeName) || [];
    const optimisticUpdates = this.optimisticUpdates.get(storeName) || [];
    const computedProperties = this.computedProperties.get(storeName) || [];

    return {
      storeName,
      stateSize: store ? JSON.stringify(store.getState()).length : 0,
      historySize: history.length,
      optimisticUpdatesCount: optimisticUpdates.length,
      computedPropertiesCount: computedProperties.length,
      cacheSize: this.computedCache.size,
      memoryUsage: this.estimateMemoryUsage(storeName)
    };
  }

  private estimateMemoryUsage(storeName: string): number {
    const store = this.stores.get(storeName);
    const history = this.stateHistory.get(storeName) || [];
    const optimisticUpdates = this.optimisticUpdates.get(storeName) || [];

    let totalSize = 0;

    if (store) {
      totalSize += JSON.stringify(store.getState()).length;
    }

    totalSize += history.reduce((sum, entry) => sum + JSON.stringify(entry).length, 0);
    totalSize += optimisticUpdates.reduce((sum, update) => sum + JSON.stringify(update).length, 0);

    return totalSize;
  }

  // =============================================================================
  // Cleanup and Initialization
  // =============================================================================

  private initializeComputedProperties(storeName: string, store: any) {
    // Set up subscriptions for computed property dependencies
    const properties = this.computedProperties.get(storeName) || [];
    
    for (const property of properties) {
      // Subscribe to dependency changes
      for (const dependency of property.dependencies) {
        const unsubscribe = store.subscribe(
          (state: any) => state[dependency],
          () => {
            this.updateComputedProperty(storeName, property, store.getState());
          }
        );

        const unsubscribeFunctions = this.unsubscribeFunctions.get(storeName) || [];
        unsubscribeFunctions.push(unsubscribe);
        this.unsubscribeFunctions.set(storeName, unsubscribeFunctions);
      }
    }
  }

  private initializeCrossStoreSubscriptions(storeName: string, store: any) {
    const subscriptions = this.crossStoreSubscriptions.get(storeName) || [];
    
    for (const subscription of subscriptions) {
      this.setupCrossStoreSubscription(subscription);
    }
  }

  cleanup(storeName?: string) {
    if (storeName) {
      // Cleanup specific store
      const unsubscribeFunctions = this.unsubscribeFunctions.get(storeName) || [];
      unsubscribeFunctions.forEach(fn => fn());
      
      this.stores.delete(storeName);
      this.computedProperties.delete(storeName);
      this.crossStoreSubscriptions.delete(storeName);
      this.optimisticUpdates.delete(storeName);
      this.stateHistory.delete(storeName);
      this.unsubscribeFunctions.delete(storeName);
    } else {
      // Cleanup all stores
      this.unsubscribeFunctions.forEach(functions => {
        functions.forEach(fn => fn());
      });
      
      this.stores.clear();
      this.computedProperties.clear();
      this.crossStoreSubscriptions.clear();
      this.optimisticUpdates.clear();
      this.stateHistory.clear();
      this.computedCache.clear();
      this.unsubscribeFunctions.clear();
    }
  }
}

// =============================================================================
// React Hook for Advanced State Management
// =============================================================================

import { useEffect, useCallback } from 'react';

export function useAdvancedStore<T>(storeName: string) {
  const store = advancedStateManager.stores.get(storeName);

  if (!store) {
    throw new Error(`Store "${storeName}" not found. Make sure it's created before using this hook.`);
  }

  // Get store methods
  const getState = useCallback(() => store.getState(), [store]);
  const setState = useCallback((partial: any, replace?: boolean, action?: string) => {
    store.setState(partial, replace, action);
  }, [store]);

  const subscribe = useCallback((listener: (state: T) => void) => {
    return store.subscribe(listener);
  }, [store]);

  // Advanced state management methods
  const getMetrics = useCallback(() => {
    return advancedStateManager.getStateMetrics(storeName);
  }, [storeName]);

  const addComputedProperty = useCallback((property: ComputedProperty) => {
    advancedStateManager.addComputedProperty(storeName, property);
  }, [storeName]);

  const addCrossStoreSubscription = useCallback((subscription: CrossStoreSubscription) => {
    advancedStateManager.addCrossStoreSubscription(subscription);
  }, [storeName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Note: We don't cleanup the store itself as it might be used by other components
      // Only cleanup subscriptions if this is the last component using the store
    };
  }, [storeName]);

  return {
    store,
    getState,
    setState,
    subscribe,
    getMetrics,
    addComputedProperty,
    addCrossStoreSubscription
  };
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const advancedStateManager = new AdvancedStateManager();
