/**
 * useSizeWiseDatabase Hook
 * 
 * React hook for interacting with the SizeWise Dexie database.
 * Provides a convenient interface for database operations with React state management.
 */

import { useEffect, useState, useCallback } from 'react';
import { getSizeWiseDatabase, SizeWiseDatabase, SizeWiseProject } from '../database/DexieDatabase';

interface DatabaseState {
  db: SizeWiseDatabase | null;
  isReady: boolean;
  error: string | null;
}

export function useSizeWiseDatabase() {
  const [state, setState] = useState<DatabaseState>({
    db: null,
    isReady: false,
    error: null
  });

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const database = getSizeWiseDatabase();
        await database.open();
        setState({
          db: database,
          isReady: true,
          error: null
        });
      } catch (error) {
        setState({
          db: null,
          isReady: false,
          error: error instanceof Error ? error.message : 'Database initialization failed'
        });
      }
    };

    initDatabase();
  }, []);

  const createProject = useCallback(async (project: Omit<SizeWiseProject, 'id' | 'lastModified' | 'syncStatus' | 'version'>) => {
    if (!state.db) throw new Error('Database not ready');
    return await state.db.createProject(project);
  }, [state.db]);

  const getProject = useCallback(async (uuid: string) => {
    if (!state.db) throw new Error('Database not ready');
    return await state.db.getProject(uuid);
  }, [state.db]);

  const updateProject = useCallback(async (uuid: string, updates: Partial<SizeWiseProject>) => {
    if (!state.db) throw new Error('Database not ready');
    return await state.db.updateProject(uuid, updates);
  }, [state.db]);

  const getAllProjects = useCallback(async () => {
    if (!state.db) throw new Error('Database not ready');
    return await state.db.getAllProjects();
  }, [state.db]);

  const deleteProject = useCallback(async (uuid: string) => {
    if (!state.db) throw new Error('Database not ready');
    return await state.db.deleteProject(uuid);
  }, [state.db]);

  const healthCheck = useCallback(async () => {
    if (!state.db) throw new Error('Database not ready');
    return await state.db.testDatabaseConnection();
  }, [state.db]);

  return {
    database: state.db,
    db: state.db,
    isReady: state.isReady,
    error: state.error,
    createProject,
    getProject,
    updateProject,
    getAllProjects,
    deleteProject,
    healthCheck
  };
}
