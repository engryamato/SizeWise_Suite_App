/**
 * Enhanced Project Service Hook
 * 
 * React hook for managing projects with database storage,
 * duct segments, and fitting segments integration.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SizeWiseDatabase } from '@/lib/database/DexieDatabase';
import { EnhancedProjectService, EnhancedProject, EnhancedDuctSegment, EnhancedFittingSegment } from '@/lib/services/EnhancedProjectService';

// =============================================================================
// Hook State Interface
// =============================================================================

interface UseEnhancedProjectServiceState {
  currentProject: EnhancedProject | null;
  projects: EnhancedProject[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
}

interface UseEnhancedProjectServiceActions {
  saveProject: (project: EnhancedProject) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  createNewProject: (projectData: Partial<EnhancedProject>) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  loadProjectList: () => Promise<void>;
  addDuctSegment: (segment: EnhancedDuctSegment) => Promise<void>;
  addFittingSegment: (segment: EnhancedFittingSegment) => Promise<void>;
  updateDuctSegment: (segmentId: string, updates: Partial<EnhancedDuctSegment>) => Promise<void>;
  updateFittingSegment: (segmentId: string, updates: Partial<EnhancedFittingSegment>) => Promise<void>;
  deleteDuctSegment: (segmentId: string) => Promise<void>;
  deleteFittingSegment: (segmentId: string) => Promise<void>;
  clearError: () => void;
}

// =============================================================================
// Enhanced Project Service Hook
// =============================================================================

export function useEnhancedProjectService(userId: string = 'default-user') {
  // State
  const [state, setState] = useState<UseEnhancedProjectServiceState>({
    currentProject: null,
    projects: [],
    isLoading: false,
    isSaving: false,
    error: null,
    lastSaved: null
  });

  // Initialize database and service
  const db = useMemo(() => new SizeWiseDatabase(), []);
  const service = useMemo(() => new EnhancedProjectService(db, userId), [db, userId]);

  // =============================================================================
  // Core Actions
  // =============================================================================

  const saveProject = useCallback(async (project: EnhancedProject) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      await service.saveProject(project);
      
      setState(prev => ({
        ...prev,
        currentProject: project,
        projects: prev.projects.map(p => p.id === project.id ? project : p),
        lastSaved: new Date(),
        isSaving: false
      }));
      
      console.log('✅ Project saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save project';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isSaving: false
      }));
      throw error;
    }
  }, [service]);

  const loadProject = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const project = await service.loadProject(projectId);
      
      setState(prev => ({
        ...prev,
        currentProject: project,
        isLoading: false
      }));
      
      console.log('✅ Project loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      throw error;
    }
  }, [service]);

  const createNewProject = useCallback(async (projectData: Partial<EnhancedProject>): Promise<string> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newProject: EnhancedProject = {
        id: projectId,
        project_name: projectData.project_name || 'New Project',
        project_location: projectData.project_location || '',
        codes: projectData.codes || [],
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        rooms: projectData.rooms || [],
        segments: projectData.segments || [],
        equipment: projectData.equipment || [],
        computational_properties: projectData.computational_properties,
        ductSegments: projectData.ductSegments || [],
        fittingSegments: projectData.fittingSegments || [],
        projectSettings: {
          units: 'imperial',
          defaultMaterial: 'galvanized_steel',
          defaultGauge: '26',
          autoValidation: true,
          autoOptimization: false,
          ...projectData.projectSettings
        }
      };

      await service.saveProject(newProject);
      
      setState(prev => ({
        ...prev,
        currentProject: newProject,
        projects: [...prev.projects, newProject],
        lastSaved: new Date(),
        isSaving: false
      }));
      
      console.log('✅ New project created successfully');
      return projectId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isSaving: false
      }));
      throw error;
    }
  }, [service]);

  const deleteProject = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await service.deleteProject(projectId);
      
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        currentProject: prev.currentProject?.id === projectId ? null : prev.currentProject,
        isLoading: false
      }));
      
      console.log('✅ Project deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      throw error;
    }
  }, [service]);

  const loadProjectList = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const projects = await service.getProjectList();
      
      setState(prev => ({
        ...prev,
        projects,
        isLoading: false
      }));
      
      console.log('✅ Project list loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project list';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      throw error;
    }
  }, [service]);

  // =============================================================================
  // Segment Management Actions
  // =============================================================================

  const addDuctSegment = useCallback(async (segment: EnhancedDuctSegment) => {
    if (!state.currentProject) {
      throw new Error('No current project loaded');
    }

    const updatedProject = {
      ...state.currentProject,
      ductSegments: [...(state.currentProject.ductSegments || []), segment]
    };

    await saveProject(updatedProject);
  }, [state.currentProject, saveProject]);

  const addFittingSegment = useCallback(async (segment: EnhancedFittingSegment) => {
    if (!state.currentProject) {
      throw new Error('No current project loaded');
    }

    const updatedProject = {
      ...state.currentProject,
      fittingSegments: [...(state.currentProject.fittingSegments || []), segment]
    };

    await saveProject(updatedProject);
  }, [state.currentProject, saveProject]);

  const updateDuctSegment = useCallback(async (segmentId: string, updates: Partial<EnhancedDuctSegment>) => {
    if (!state.currentProject) {
      throw new Error('No current project loaded');
    }

    const updatedProject = {
      ...state.currentProject,
      ductSegments: state.currentProject.ductSegments?.map(segment =>
        segment.segment_id === segmentId ? { ...segment, ...updates } : segment
      ) || []
    };

    await saveProject(updatedProject);
  }, [state.currentProject, saveProject]);

  const updateFittingSegment = useCallback(async (segmentId: string, updates: Partial<EnhancedFittingSegment>) => {
    if (!state.currentProject) {
      throw new Error('No current project loaded');
    }

    const updatedProject = {
      ...state.currentProject,
      fittingSegments: state.currentProject.fittingSegments?.map(segment =>
        segment.segment_id === segmentId ? { ...segment, ...updates } : segment
      ) || []
    };

    await saveProject(updatedProject);
  }, [state.currentProject, saveProject]);

  const deleteDuctSegment = useCallback(async (segmentId: string) => {
    if (!state.currentProject) {
      throw new Error('No current project loaded');
    }

    const updatedProject = {
      ...state.currentProject,
      ductSegments: state.currentProject.ductSegments?.filter(segment =>
        segment.segment_id !== segmentId
      ) || []
    };

    await saveProject(updatedProject);
  }, [state.currentProject, saveProject]);

  const deleteFittingSegment = useCallback(async (segmentId: string) => {
    if (!state.currentProject) {
      throw new Error('No current project loaded');
    }

    const updatedProject = {
      ...state.currentProject,
      fittingSegments: state.currentProject.fittingSegments?.filter(segment =>
        segment.segment_id !== segmentId
      ) || []
    };

    await saveProject(updatedProject);
  }, [state.currentProject, saveProject]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // =============================================================================
  // Actions Object
  // =============================================================================

  const actions: UseEnhancedProjectServiceActions = {
    saveProject,
    loadProject,
    createNewProject,
    deleteProject,
    loadProjectList,
    addDuctSegment,
    addFittingSegment,
    updateDuctSegment,
    updateFittingSegment,
    deleteDuctSegment,
    deleteFittingSegment,
    clearError
  };

  // =============================================================================
  // Auto-load projects on mount
  // =============================================================================

  useEffect(() => {
    loadProjectList().catch(console.error);
  }, [loadProjectList]);

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // State
    ...state,
    
    // Actions
    ...actions,
    
    // Computed properties
    hasUnsavedChanges: state.isSaving,
    projectCount: state.projects.length,
    ductSegmentCount: state.currentProject?.ductSegments?.length || 0,
    fittingSegmentCount: state.currentProject?.fittingSegments?.length || 0,
    
    // Utilities
    db,
    service
  };
}

export type UseEnhancedProjectServiceReturn = ReturnType<typeof useEnhancedProjectService>;
