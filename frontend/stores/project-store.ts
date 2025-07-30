import { create } from 'zustand';
import { Project, Room, Segment, Equipment, ComputationalProperties } from '@/types/air-duct-sizer';

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  selectedRoom: Room | null;
  selectedSegment: Segment | null;
  isLoading: boolean;

  // Project actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  loadProject: (projectIdOrProject: string | Project) => Promise<void>;

  // Entity actions
  addRoom: (room: Room) => void;
  addSegment: (segment: Segment) => void;
  addEquipment: (equipment: Equipment) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  updateSegment: (segmentId: string, updates: Partial<Segment>) => void;
  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => void;
  deleteRoom: (roomId: string) => void;
  deleteSegment: (segmentId: string) => void;
  deleteEquipment: (equipmentId: string) => void;

  // Plan actions
  setPlanScale: (scale: number) => void;
  updateComputationalProperties: (properties: Partial<ComputationalProperties>) => void;

  // Getter actions
  getRoomById: (roomId: string) => Room | undefined;
  getSegmentById: (segmentId: string) => Segment | undefined;
  getEquipmentById: (equipmentId: string) => Equipment | undefined;

  // Selection actions
  setSelectedRoom: (room: Room | null) => void;
  setSelectedSegment: (segment: Segment | null) => void;

  // Loading state
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  projects: [],
  selectedRoom: null,
  selectedSegment: null,
  isLoading: false,
  
  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },
  
  setProjects: (projects: Project[]) => {
    set({ projects });
  },
  
  addProject: (project: Project) => {
    set((state) => ({
      projects: [...state.projects, project]
    }));
  },
  
  updateProject: (projectId: string, updates: Partial<Project>) => {
    set((state) => ({
      projects: state.projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      ),
      currentProject: state.currentProject?.id === projectId 
        ? { ...state.currentProject, ...updates }
        : state.currentProject
    }));
  },
  
  deleteProject: (projectId: string) => {
    set((state) => ({
      projects: state.projects.filter(p => p.id !== projectId),
      currentProject: state.currentProject?.id === projectId
        ? null
        : state.currentProject
    }));
  },

  loadProject: async (projectIdOrProject: string | Project) => {
    set({ isLoading: true });
    try {
      if (typeof projectIdOrProject === 'string') {
        // Load by ID - find project in existing projects
        const state = get();
        const project = state.projects.find(p => p.id === projectIdOrProject);

        if (project) {
          set({ currentProject: project, isLoading: false });
        } else {
          // In a real app, this would load from API/database
          console.warn(`Project with ID ${projectIdOrProject} not found`);
          set({ isLoading: false });
        }
      } else {
        // Load project object directly
        const project = projectIdOrProject;
        set((state) => ({
          currentProject: project,
          projects: state.projects.some(p => p.id === project.id)
            ? state.projects
            : [...state.projects, project],
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      set({ isLoading: false });
    }
  },

  // Entity actions
  addRoom: (room: Room) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          rooms: [...state.currentProject.rooms, room]
        }
      };
    });
  },

  addSegment: (segment: Segment) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          segments: [...state.currentProject.segments, segment]
        }
      };
    });
  },

  addEquipment: (equipment: Equipment) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          equipment: [...state.currentProject.equipment, equipment]
        }
      };
    });
  },

  updateRoom: (roomId: string, updates: Partial<Room>) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          rooms: state.currentProject.rooms.map(r =>
            r.room_id === roomId ? { ...r, ...updates } : r
          )
        }
      };
    });
  },

  updateSegment: (segmentId: string, updates: Partial<Segment>) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          segments: state.currentProject.segments.map(s =>
            s.segment_id === segmentId ? { ...s, ...updates } : s
          )
        }
      };
    });
  },

  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          equipment: state.currentProject.equipment.map(e =>
            e.equipment_id === equipmentId ? { ...e, ...updates } : e
          )
        }
      };
    });
  },

  deleteRoom: (roomId: string) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          rooms: state.currentProject.rooms.filter(r => r.room_id !== roomId)
        }
      };
    });
  },

  deleteSegment: (segmentId: string) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          segments: state.currentProject.segments.filter(s => s.segment_id !== segmentId)
        }
      };
    });
  },

  deleteEquipment: (equipmentId: string) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          equipment: state.currentProject.equipment.filter(e => e.equipment_id !== equipmentId)
        }
      };
    });
  },

  // Plan actions
  setPlanScale: (scale: number) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          plan_scale: scale
        }
      };
    });
  },

  updateComputationalProperties: (properties: Partial<ComputationalProperties>) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          computational_properties: {
            ...state.currentProject.computational_properties,
            ...properties
          }
        } as any
      };
    });
  },

  // Getter actions
  getRoomById: (roomId: string) => {
    const state = get();
    return state.currentProject?.rooms.find(r => r.room_id === roomId);
  },

  getSegmentById: (segmentId: string) => {
    const state = get();
    return state.currentProject?.segments.find(s => s.segment_id === segmentId);
  },

  getEquipmentById: (equipmentId: string) => {
    const state = get();
    return state.currentProject?.equipment.find(e => e.equipment_id === equipmentId);
  },

  setSelectedRoom: (room: Room | null) => {
    set({ selectedRoom: room });
  },
  
  setSelectedSegment: (segment: Segment | null) => {
    set({ selectedSegment: segment });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));
