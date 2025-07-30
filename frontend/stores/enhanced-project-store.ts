/**
 * Enhanced Project Store
 * 
 * Advanced project state management with enhanced features like:
 * - Optimistic updates
 * - Conflict resolution
 * - Advanced caching
 * - Real-time collaboration support
 */

import { create } from 'zustand';
import { Project, Room, Segment, Equipment, ComputationalProperties } from '@/types/air-duct-sizer';

export interface EnhancedProjectState {
  // Core project data
  currentProject: Project | null;
  projects: Project[];
  selectedRoom: Room | null;
  selectedSegment: Segment | null;
  selectedEquipment: Equipment | null;
  
  // Enhanced state
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  conflictResolution: 'local' | 'remote' | 'manual' | null;
  optimisticUpdates: Map<string, any>;
  
  // Collaboration state
  collaborators: Array<{
    userId: string;
    userName: string;
    isActive: boolean;
    lastSeen: Date;
  }>;
  
  // Performance tracking
  metrics: {
    loadTime: number;
    syncTime: number;
    operationCount: number;
  };

  // Core actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  loadProject: (projectIdOrProject: string | Project) => Promise<void>;
  
  // Room actions
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  setSelectedRoom: (room: Room | null) => void;
  getRoomById: (roomId: string) => Room | undefined;
  
  // Segment actions
  addSegment: (segment: Segment) => void;
  updateSegment: (segmentId: string, updates: Partial<Segment>) => void;
  deleteSegment: (segmentId: string) => void;
  setSelectedSegment: (segment: Segment | null) => void;
  getSegmentById: (segmentId: string) => Segment | undefined;
  
  // Equipment actions
  addEquipment: (equipment: Equipment) => void;
  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (equipmentId: string) => void;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  getEquipmentById: (equipmentId: string) => Equipment | undefined;
  
  // Enhanced actions
  updateComputationalProperties: (properties: Partial<ComputationalProperties>) => void;
  setPlanScale: (scale: number) => void;
  
  // Sync and collaboration
  syncProject: () => Promise<void>;
  resolveConflict: (resolution: 'local' | 'remote') => void;
  addOptimisticUpdate: (id: string, update: any) => void;
  removeOptimisticUpdate: (id: string) => void;
  
  // Performance
  updateMetrics: (metrics: Partial<EnhancedProjectState['metrics']>) => void;
  resetMetrics: () => void;
}

export const useEnhancedProjectStore = create<EnhancedProjectState>((set, get) => ({
  // Initial state
  currentProject: null,
  projects: [],
  selectedRoom: null,
  selectedSegment: null,
  selectedEquipment: null,
  isLoading: false,
  isSyncing: false,
  lastSyncTime: null,
  conflictResolution: null,
  optimisticUpdates: new Map(),
  collaborators: [],
  metrics: {
    loadTime: 0,
    syncTime: 0,
    operationCount: 0
  },

  // Core actions
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  
  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { ...p, ...updates } : p),
    currentProject: state.currentProject?.id === projectId 
      ? { ...state.currentProject, ...updates } 
      : state.currentProject
  })),
  
  deleteProject: (projectId) => set((state) => ({
    projects: state.projects.filter(p => p.id !== projectId),
    currentProject: state.currentProject?.id === projectId ? null : state.currentProject
  })),
  
  loadProject: async (projectIdOrProject) => {
    const startTime = Date.now();
    set({ isLoading: true });
    
    try {
      // Mock implementation - in real app this would load from database
      if (typeof projectIdOrProject === 'string') {
        const project = get().projects.find(p => p.id === projectIdOrProject);
        set({ currentProject: project || null });
      } else {
        set({ currentProject: projectIdOrProject });
      }
      
      const loadTime = Date.now() - startTime;
      get().updateMetrics({ loadTime });
    } finally {
      set({ isLoading: false });
    }
  },

  // Room actions
  addRoom: (room) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      rooms: [...state.currentProject.rooms, room]
    } : null
  })),
  
  updateRoom: (roomId, updates) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      rooms: state.currentProject.rooms.map(r => r.room_id === roomId ? { ...r, ...updates } : r)
    } : null
  })),
  
  deleteRoom: (roomId) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      rooms: state.currentProject.rooms.filter(r => r.room_id !== roomId)
    } : null,
    selectedRoom: state.selectedRoom?.room_id === roomId ? null : state.selectedRoom
  })),
  
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  
  getRoomById: (roomId) => {
    const state = get();
    return state.currentProject?.rooms.find(r => r.room_id === roomId);
  },

  // Segment actions
  addSegment: (segment) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      segments: [...state.currentProject.segments, segment]
    } : null
  })),
  
  updateSegment: (segmentId, updates) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      segments: state.currentProject.segments.map(s => s.segment_id === segmentId ? { ...s, ...updates } : s)
    } : null
  })),
  
  deleteSegment: (segmentId) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      segments: state.currentProject.segments.filter(s => s.segment_id !== segmentId)
    } : null,
    selectedSegment: state.selectedSegment?.segment_id === segmentId ? null : state.selectedSegment
  })),
  
  setSelectedSegment: (segment) => set({ selectedSegment: segment }),
  
  getSegmentById: (segmentId) => {
    const state = get();
    return state.currentProject?.segments.find(s => s.segment_id === segmentId);
  },

  // Equipment actions
  addEquipment: (equipment) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      equipment: [...state.currentProject.equipment, equipment]
    } : null
  })),
  
  updateEquipment: (equipmentId, updates) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      equipment: state.currentProject.equipment.map(e => e.equipment_id === equipmentId ? { ...e, ...updates } : e)
    } : null
  })),
  
  deleteEquipment: (equipmentId) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      equipment: state.currentProject.equipment.filter(e => e.equipment_id !== equipmentId)
    } : null,
    selectedEquipment: state.selectedEquipment?.equipment_id === equipmentId ? null : state.selectedEquipment
  })),
  
  setSelectedEquipment: (equipment) => set({ selectedEquipment: equipment }),
  
  getEquipmentById: (equipmentId) => {
    const state = get();
    return state.currentProject?.equipment.find(e => e.equipment_id === equipmentId);
  },

  // Enhanced actions
  updateComputationalProperties: (properties) => set((state) => {
    // Filter out undefined values to match Project interface requirements
    const filteredProperties = Object.fromEntries(
      Object.entries(properties).filter(([_, value]) => value !== undefined)
    );

    return {
      currentProject: state.currentProject ? {
        ...state.currentProject,
        computational_properties: {
          ...state.currentProject.computational_properties,
          ...filteredProperties
        }
      } as any : null
    };
  }),
  
  setPlanScale: (scale) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      plan_scale: scale
    } : null
  })),

  // Sync and collaboration
  syncProject: async () => {
    const startTime = Date.now();
    set({ isSyncing: true });
    
    try {
      // Mock sync implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const syncTime = Date.now() - startTime;
      set({ 
        lastSyncTime: new Date(),
        isSyncing: false
      });
      get().updateMetrics({ syncTime });
    } catch (error) {
      set({ isSyncing: false });
      throw error;
    }
  },
  
  resolveConflict: (resolution) => set({ conflictResolution: resolution }),
  
  addOptimisticUpdate: (id, update) => set((state) => {
    const newUpdates = new Map(state.optimisticUpdates);
    newUpdates.set(id, update);
    return { optimisticUpdates: newUpdates };
  }),
  
  removeOptimisticUpdate: (id) => set((state) => {
    const newUpdates = new Map(state.optimisticUpdates);
    newUpdates.delete(id);
    return { optimisticUpdates: newUpdates };
  }),

  // Performance
  updateMetrics: (metrics) => set((state) => ({
    metrics: { ...state.metrics, ...metrics }
  })),
  
  resetMetrics: () => set({
    metrics: {
      loadTime: 0,
      syncTime: 0,
      operationCount: 0
    }
  })
}));
