import { create } from 'zustand';
import { Project, Room, Segment } from '@/types/air-duct-sizer';

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
