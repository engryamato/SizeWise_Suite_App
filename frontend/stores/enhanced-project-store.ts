/**
 * Enhanced Project Store with Advanced State Management
 * 
 * Builds upon the existing project store with:
 * - Computed properties for real-time calculations
 * - Cross-store dependencies with calculation and UI stores
 * - Optimistic updates for better UX
 * - Undo/redo functionality for project changes
 * - Performance optimization and caching
 */

import { StateCreator } from 'zustand';
import { advancedStateManager, AdvancedStoreConfig, ComputedProperty, CrossStoreSubscription } from '../lib/state/AdvancedStateManager';
import { Project, Room, Segment, Equipment } from '@/types/air-duct-sizer';

// =============================================================================
// Enhanced Project State Interface
// =============================================================================

export interface EnhancedProjectState {
  // Core project data
  currentProject: Project | null;
  projects: Project[];
  
  // Loading and error states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Computed properties (automatically calculated)
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
  
  // Performance metrics
  lastCalculationTime: number;
  cacheHitRate: number;
  
  // Core actions
  createProject: (projectData: Partial<Project>) => Promise<void>;
  loadProject: (project: Project) => Promise<void>;
  updateProject: (updates: Partial<Project>) => Promise<void>;
  saveProject: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearProject: () => void;
  
  // Room management
  addRoom: (roomData: Partial<Room>) => Promise<void>;
  updateRoom: (roomId: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  
  // Segment management
  addSegment: (segmentData: Partial<Segment>) => Promise<void>;
  updateSegment: (segmentId: string, updates: Partial<Segment>) => Promise<void>;
  deleteSegment: (segmentId: string) => Promise<void>;
  
  // Equipment management
  addEquipment: (equipmentData: Partial<Equipment>) => Promise<void>;
  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  
  // Advanced state management methods
  optimisticUpdate: (updates: Partial<EnhancedProjectState>, operation: string, timeout?: number) => string;
  confirmOptimisticUpdate: (updateId: string) => void;
  rollbackOptimisticUpdate: (updateId: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  getComputedProperty: (propertyName: string) => any;
  getStateMetrics: () => any;
  clearHistory: () => void;
  getHistorySize: () => number;
  
  // Utility methods
  canAddRoom: () => boolean;
  canAddSegment: () => boolean;
  canAddEquipment: () => boolean;
  validateProject: () => { valid: boolean; errors: string[]; warnings: string[] };
  exportProject: () => string;
  importProject: (projectData: string) => Promise<void>;
}

// =============================================================================
// Utility Functions
// =============================================================================

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createDefaultProject = (): Project => ({
  id: generateId('project'),
  project_name: 'New Project',
  project_location: '',
  codes: ['SMACNA'],
  rooms: [],
  segments: [],
  equipment: [],
  plan_pdf: undefined,
  plan_scale: 1,
  created_at: new Date().toISOString(),
  last_modified: new Date().toISOString(),
});

// =============================================================================
// Computed Properties Definitions
// =============================================================================

const projectComputedProperties: ComputedProperty[] = [
  {
    name: 'totalRooms',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => state.currentProject?.rooms?.length || 0,
    cache: true,
    ttl: 60000 // 1 minute
  },
  {
    name: 'totalSegments',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => state.currentProject?.segments?.length || 0,
    cache: true,
    ttl: 60000
  },
  {
    name: 'totalEquipment',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => state.currentProject?.equipment?.length || 0,
    cache: true,
    ttl: 60000
  },
  {
    name: 'totalCFM',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => {
      if (!state.currentProject?.rooms) return 0;
      return state.currentProject.rooms.reduce((total, room) => total + (room.cfm || 0), 0);
    },
    cache: true,
    ttl: 30000 // 30 seconds
  },
  {
    name: 'totalDuctLength',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => {
      if (!state.currentProject?.segments) return 0;
      return state.currentProject.segments.reduce((total, segment) => total + (segment.length || 0), 0);
    },
    cache: true,
    ttl: 30000
  },
  {
    name: 'averageVelocity',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => {
      if (!state.currentProject?.segments || state.currentProject.segments.length === 0) return 0;
      const totalVelocity = state.currentProject.segments.reduce((total, segment) => {
        return total + (segment.velocity || 0);
      }, 0);
      return totalVelocity / state.currentProject.segments.length;
    },
    cache: true,
    ttl: 30000
  },
  {
    name: 'systemPressureDrop',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => {
      if (!state.currentProject?.segments) return 0;
      return state.currentProject.segments.reduce((total, segment) => {
        return total + (segment.pressure_loss || 0);
      }, 0);
    },
    cache: true,
    ttl: 30000
  },
  {
    name: 'projectComplexity',
    dependencies: ['totalRooms', 'totalSegments', 'totalEquipment'],
    compute: (state: EnhancedProjectState) => {
      const complexity = state.totalRooms + state.totalSegments + state.totalEquipment;
      if (complexity <= 10) return 'simple';
      if (complexity <= 50) return 'moderate';
      return 'complex';
    },
    cache: true,
    ttl: 60000
  },
  {
    name: 'complianceStatus',
    dependencies: ['currentProject'],
    compute: (state: EnhancedProjectState) => {
      if (!state.currentProject) {
        return { smacna: false, ashrae: false, overall: false };
      }

      // Simplified compliance check - in real implementation, this would be more complex
      const smacnaCompliant = state.currentProject.segments?.every(segment => 
        segment.velocity && segment.velocity >= 500 && segment.velocity <= 2500
      ) || false;

      const ashraeCompliant = state.currentProject.rooms?.every(room => 
        room.cfm && room.cfm > 0
      ) || false;

      return {
        smacna: smacnaCompliant,
        ashrae: ashraeCompliant,
        overall: smacnaCompliant && ashraeCompliant
      };
    },
    cache: true,
    ttl: 60000
  }
];

// =============================================================================
// Cross-Store Subscriptions
// =============================================================================

const projectCrossStoreSubscriptions: CrossStoreSubscription[] = [
  {
    sourceStore: 'enhanced-project',
    targetStore: 'calculation',
    sourceProperty: 'currentProject',
    targetProperty: 'activeProject',
    condition: (project) => project !== null
  },
  {
    sourceStore: 'enhanced-project',
    targetStore: 'ui',
    sourceProperty: 'isLoading',
    targetProperty: 'isCalculating',
    transform: (isLoading) => isLoading
  },
  {
    sourceStore: 'enhanced-project',
    targetStore: 'ui',
    sourceProperty: 'totalRooms',
    targetProperty: 'projectStats',
    transform: (totalRooms, state) => ({
      ...state.projectStats,
      totalRooms
    })
  }
];

// =============================================================================
// Enhanced Project Store Creator
// =============================================================================

const enhancedProjectStoreCreator: StateCreator<EnhancedProjectState> = (set, get) => ({
  // Initial state
  currentProject: null,
  projects: [],
  isLoading: false,
  isSaving: false,
  error: null,
  
  // Computed properties (will be populated by AdvancedStateManager)
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

  // Core actions
  createProject: async (projectData) => {
    set({ isLoading: true, error: null }, false, 'createProject:start');
    
    try {
      const newProject: Project = {
        ...createDefaultProject(),
        ...projectData,
        id: generateId('project'),
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
      };

      set({ 
        currentProject: newProject,
        isLoading: false 
      }, false, 'createProject:success');

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false 
      }, false, 'createProject:error');
    }
  },

  loadProject: async (project) => {
    set({ isLoading: true, error: null }, false, 'loadProject:start');
    
    try {
      // Simulate async loading (could be from API or IndexedDB)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set({ 
        currentProject: project,
        isLoading: false 
      }, false, 'loadProject:success');

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load project',
        isLoading: false 
      }, false, 'loadProject:error');
    }
  },

  updateProject: async (updates) => {
    const { currentProject } = get();
    if (!currentProject) return;

    // Use optimistic update for better UX
    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        ...updates,
        last_modified: new Date().toISOString(),
      }
    }, 'updateProject');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Confirm the optimistic update
      get().confirmOptimisticUpdate(updateId);

    } catch (error) {
      // Rollback on error
      get().rollbackOptimisticUpdate(updateId);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update project'
      }, false, 'updateProject:error');
    }
  },

  saveProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isSaving: true, error: null }, false, 'saveProject:start');
    
    try {
      // Simulate API save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({ isSaving: false }, false, 'saveProject:success');

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save project',
        isSaving: false 
      }, false, 'saveProject:error');
    }
  },

  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null }, false, 'deleteProject:start');
    
    try {
      // Simulate API delete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { projects, currentProject } = get();
      const updatedProjects = projects.filter(p => p.id !== projectId);
      const updatedCurrentProject = currentProject?.id === projectId ? null : currentProject;
      
      set({ 
        projects: updatedProjects,
        currentProject: updatedCurrentProject,
        isLoading: false 
      }, false, 'deleteProject:success');

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete project',
        isLoading: false 
      }, false, 'deleteProject:error');
    }
  },

  clearProject: () => {
    set({ currentProject: null }, false, 'clearProject');
  },

  // Room management
  addRoom: async (roomData) => {
    const { currentProject } = get();
    if (!currentProject) return;

    if (!get().canAddRoom()) {
      set({ error: 'Room limit reached for current tier' }, false, 'addRoom:limit');
      return;
    }

    const newRoom: Room = {
      ...roomData,
      room_id: generateId('room'),
    } as Room;

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        rooms: [...currentProject.rooms, newRoom],
        last_modified: new Date().toISOString(),
      }
    }, 'addRoom');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to add room' }, false, 'addRoom:error');
    }
  },

  updateRoom: async (roomId, updates) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedRooms = currentProject.rooms.map(room =>
      room.room_id === roomId ? { ...room, ...updates } : room
    );

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        rooms: updatedRooms,
        last_modified: new Date().toISOString(),
      }
    }, 'updateRoom');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to update room' }, false, 'updateRoom:error');
    }
  },

  deleteRoom: async (roomId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedRooms = currentProject.rooms.filter(room => room.room_id !== roomId);

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        rooms: updatedRooms,
        last_modified: new Date().toISOString(),
      }
    }, 'deleteRoom');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to delete room' }, false, 'deleteRoom:error');
    }
  },

  // Segment management (similar pattern)
  addSegment: async (segmentData) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const newSegment: Segment = {
      ...segmentData,
      segment_id: generateId('segment'),
    } as Segment;

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        segments: [...currentProject.segments, newSegment],
        last_modified: new Date().toISOString(),
      }
    }, 'addSegment');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to add segment' }, false, 'addSegment:error');
    }
  },

  updateSegment: async (segmentId, updates) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedSegments = currentProject.segments.map(segment =>
      segment.segment_id === segmentId ? { ...segment, ...updates } : segment
    );

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        segments: updatedSegments,
        last_modified: new Date().toISOString(),
      }
    }, 'updateSegment');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to update segment' }, false, 'updateSegment:error');
    }
  },

  deleteSegment: async (segmentId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedSegments = currentProject.segments.filter(segment => segment.segment_id !== segmentId);

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        segments: updatedSegments,
        last_modified: new Date().toISOString(),
      }
    }, 'deleteSegment');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to delete segment' }, false, 'deleteSegment:error');
    }
  },

  // Equipment management (similar pattern)
  addEquipment: async (equipmentData) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const newEquipment: Equipment = {
      ...equipmentData,
      equipment_id: generateId('equipment'),
    } as Equipment;

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        equipment: [...currentProject.equipment, newEquipment],
        last_modified: new Date().toISOString(),
      }
    }, 'addEquipment');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to add equipment' }, false, 'addEquipment:error');
    }
  },

  updateEquipment: async (equipmentId, updates) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedEquipment = currentProject.equipment.map(equipment =>
      equipment.equipment_id === equipmentId ? { ...equipment, ...updates } : equipment
    );

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        equipment: updatedEquipment,
        last_modified: new Date().toISOString(),
      }
    }, 'updateEquipment');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to update equipment' }, false, 'updateEquipment:error');
    }
  },

  deleteEquipment: async (equipmentId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedEquipment = currentProject.equipment.filter(equipment => equipment.equipment_id !== equipmentId);

    const updateId = get().optimisticUpdate({
      currentProject: {
        ...currentProject,
        equipment: updatedEquipment,
        last_modified: new Date().toISOString(),
      }
    }, 'deleteEquipment');

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      get().confirmOptimisticUpdate(updateId);
    } catch (error) {
      get().rollbackOptimisticUpdate(updateId);
      set({ error: 'Failed to delete equipment' }, false, 'deleteEquipment:error');
    }
  },

  // Advanced state management methods (will be injected by AdvancedStateManager)
  optimisticUpdate: () => '',
  confirmOptimisticUpdate: () => {},
  rollbackOptimisticUpdate: () => {},
  undo: () => false,
  redo: () => false,
  getComputedProperty: () => undefined,
  getStateMetrics: () => ({}),
  clearHistory: () => {},
  getHistorySize: () => 0,

  // Utility methods
  canAddRoom: () => {
    // Simplified tier checking - in real implementation, would check auth store
    const { totalRooms } = get();
    return totalRooms < 50; // Assume pro tier limit
  },

  canAddSegment: () => {
    const { totalSegments } = get();
    return totalSegments < 200; // Assume pro tier limit
  },

  canAddEquipment: () => {
    const { totalEquipment } = get();
    return totalEquipment < 100; // Assume pro tier limit
  },

  validateProject: () => {
    const { currentProject } = get();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!currentProject) {
      errors.push('No project loaded');
      return { valid: false, errors, warnings };
    }

    if (!currentProject.project_name || currentProject.project_name.trim() === '') {
      errors.push('Project name is required');
    }

    if (currentProject.rooms.length === 0) {
      warnings.push('Project has no rooms defined');
    }

    if (currentProject.segments.length === 0) {
      warnings.push('Project has no duct segments defined');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  exportProject: () => {
    const { currentProject } = get();
    if (!currentProject) return '';
    
    return JSON.stringify(currentProject, null, 2);
  },

  importProject: async (projectData) => {
    try {
      const project = JSON.parse(projectData) as Project;
      await get().loadProject(project);
    } catch (error) {
      set({ 
        error: 'Invalid project data format' 
      }, false, 'importProject:error');
    }
  }
});

// =============================================================================
// Store Configuration and Creation
// =============================================================================

const storeConfig: AdvancedStoreConfig = {
  name: 'enhanced-project',
  enableHistory: true,
  historyLimit: 50,
  enableOptimisticUpdates: true,
  optimisticTimeout: 5000,
  enableComputedProperties: true,
  enableCrossStoreSync: true,
  persistConfig: {
    enabled: true,
    partialize: (state) => ({
      currentProject: state.currentProject,
      projects: state.projects
    }),
    version: 1
  }
};

// Create the enhanced store
export const useEnhancedProjectStore = advancedStateManager.createStore(
  'enhanced-project',
  enhancedProjectStoreCreator,
  storeConfig
);

// Add computed properties
projectComputedProperties.forEach(property => {
  advancedStateManager.addComputedProperty('enhanced-project', property);
});

// Add cross-store subscriptions
projectCrossStoreSubscriptions.forEach(subscription => {
  advancedStateManager.addCrossStoreSubscription(subscription);
});

// Export types for use in components
export type { EnhancedProjectState };
