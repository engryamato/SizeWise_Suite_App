/**
 * React Hook for Real-time Collaboration
 * 
 * Provides React integration for the CollaborationService with
 * state management, event handling, and component lifecycle management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CollaborationService, 
  CollaborationUser, 
  CollaborationDocument, 
  Operation,
  getCollaborationService 
} from '../services/CollaborationService';

export interface UseCollaborationOptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
  syncInterval?: number;
}

export interface CollaborationHookState {
  isConnected: boolean;
  isInitialized: boolean;
  currentDocument: CollaborationDocument | null;
  activeUsers: CollaborationUser[];
  currentUser: CollaborationUser | null;
  isReconnecting: boolean;
  pendingOperations: number;
  lastSyncTime: Date | null;
  error: string | null;
  stats: {
    activeUsers: number;
    totalOperations: number;
    pendingOperations: number;
    lastSyncTime: Date;
    isConnected: boolean;
  } | null;
}

export interface CollaborationActions {
  initialize: (user: CollaborationUser, serverUrl?: string) => Promise<void>;
  joinDocument: (documentId: string, projectId: string) => Promise<CollaborationDocument>;
  leaveDocument: () => Promise<void>;
  applyOperation: (operation: Omit<Operation, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  updateCursor: (position: { x: number; y: number; elementId?: string }) => void;
  lockDocument: (lock: boolean) => Promise<boolean>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export function useCollaboration(options: UseCollaborationOptions = {}): [CollaborationHookState, CollaborationActions] {
  const {
    autoConnect = false,
    reconnectOnMount = true,
    syncInterval = 30000
  } = options;

  // State
  const [state, setState] = useState<CollaborationHookState>({
    isConnected: false,
    isInitialized: false,
    currentDocument: null,
    activeUsers: [],
    currentUser: null,
    isReconnecting: false,
    pendingOperations: 0,
    lastSyncTime: null,
    error: null,
    stats: null
  });

  // Refs
  const serviceRef = useRef<CollaborationService | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Map<string, Function>>(new Map());

  // Get collaboration service instance
  useEffect(() => {
    serviceRef.current = getCollaborationService();
    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy();
      }
    };
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!serviceRef.current) return;

    const service = serviceRef.current;

    // Connection events
    const onConnected = () => {
      setState(prev => ({ ...prev, isConnected: true, isReconnecting: false, error: null }));
    };

    const onDisconnected = () => {
      setState(prev => ({ ...prev, isConnected: false }));
    };

    const onReconnecting = (attempts: number) => {
      setState(prev => ({ 
        ...prev, 
        isReconnecting: true, 
        error: `Reconnecting... (attempt ${attempts})` 
      }));
    };

    // Document events
    const onDocumentJoined = (document: CollaborationDocument) => {
      setState(prev => ({ 
        ...prev, 
        currentDocument: document,
        activeUsers: document.participants.filter(u => u.isOnline)
      }));
    };

    const onDocumentLeft = () => {
      setState(prev => ({ 
        ...prev, 
        currentDocument: null,
        activeUsers: []
      }));
    };

    // User events
    const onUserJoined = (user: CollaborationUser) => {
      setState(prev => ({
        ...prev,
        activeUsers: [...prev.activeUsers.filter(u => u.id !== user.id), user]
      }));
    };

    const onUserLeft = (userId: string) => {
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.filter(u => u.id !== userId)
      }));
    };

    // Operation events
    const onOperationApplied = (operation: Operation) => {
      // Update pending operations count
      updateStats();
    };

    const onRemoteOperation = (operation: Operation) => {
      // Handle remote operation
      updateStats();
    };

    // Cursor events
    const onCursorUpdated = (data: { userId: string; cursor: any }) => {
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.map(user => 
          user.id === data.userId ? { ...user, cursor: data.cursor } : user
        )
      }));
    };

    // Document lock events
    const onDocumentLockChanged = (data: { locked: boolean; userId: string }) => {
      setState(prev => ({
        ...prev,
        currentDocument: prev.currentDocument ? {
          ...prev.currentDocument,
          isLocked: data.locked,
          lockedBy: data.locked ? data.userId : undefined
        } : null
      }));
    };

    // Register event listeners
    const listeners = [
      ['connected', onConnected],
      ['disconnected', onDisconnected],
      ['reconnecting', onReconnecting],
      ['document_joined', onDocumentJoined],
      ['document_left', onDocumentLeft],
      ['user_joined', onUserJoined],
      ['user_left', onUserLeft],
      ['operation_applied', onOperationApplied],
      ['remote_operation', onRemoteOperation],
      ['cursor_updated', onCursorUpdated],
      ['document_lock_changed', onDocumentLockChanged]
    ] as const;

    listeners.forEach(([event, handler]) => {
      service.on(event, handler);
      eventListenersRef.current.set(event, handler);
    });

    // Cleanup function
    return () => {
      listeners.forEach(([event]) => {
        const handler = eventListenersRef.current.get(event);
        if (handler) {
          service.off(event, handler);
        }
      });
      eventListenersRef.current.clear();
    };
  }, []);

  // Stats update function
  const updateStats = useCallback(() => {
    if (serviceRef.current) {
      const stats = serviceRef.current.getCollaborationStats();
      setState(prev => ({ 
        ...prev, 
        stats,
        pendingOperations: stats.pendingOperations,
        lastSyncTime: stats.lastSyncTime
      }));
    }
  }, []);

  // Setup periodic stats updates
  useEffect(() => {
    if (syncInterval > 0) {
      syncIntervalRef.current = setInterval(updateStats, syncInterval);
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [syncInterval, updateStats]);

  // Actions
  const initialize = useCallback(async (user: CollaborationUser, serverUrl?: string) => {
    if (!serviceRef.current) {
      throw new Error('Collaboration service not available');
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      await serviceRef.current.initialize(user, serverUrl);
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        currentUser: user 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize collaboration';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const joinDocument = useCallback(async (documentId: string, projectId: string) => {
    if (!serviceRef.current) {
      throw new Error('Collaboration service not initialized');
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      const document = await serviceRef.current.joinDocument(documentId, projectId);
      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join document';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const leaveDocument = useCallback(async () => {
    if (!serviceRef.current) {
      return;
    }

    try {
      await serviceRef.current.leaveDocument();
    } catch (error) {
      console.error('Error leaving document:', error);
    }
  }, []);

  const applyOperation = useCallback(async (operation: Omit<Operation, 'id' | 'userId' | 'timestamp'>) => {
    if (!serviceRef.current) {
      throw new Error('Collaboration service not initialized');
    }

    try {
      await serviceRef.current.applyOperation(operation);
      updateStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply operation';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updateStats]);

  const updateCursor = useCallback((position: { x: number; y: number; elementId?: string }) => {
    if (serviceRef.current) {
      serviceRef.current.updateCursor(position);
    }
  }, []);

  const lockDocument = useCallback(async (lock: boolean) => {
    if (!serviceRef.current) {
      return false;
    }

    try {
      return await serviceRef.current.lockDocument(lock);
    } catch (error) {
      console.error('Error locking document:', error);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.destroy();
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isInitialized: false,
        currentDocument: null,
        activeUsers: [],
        currentUser: null
      }));
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (!serviceRef.current || !state.currentUser) {
      throw new Error('Cannot reconnect without initialization');
    }

    try {
      setState(prev => ({ ...prev, error: null, isReconnecting: true }));
      await serviceRef.current.initialize(state.currentUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reconnect';
      setState(prev => ({ ...prev, error: errorMessage, isReconnecting: false }));
      throw error;
    }
  }, [state.currentUser]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && !state.isInitialized && state.currentUser) {
      initialize(state.currentUser).catch(console.error);
    }
  }, [autoConnect, state.isInitialized, state.currentUser, initialize]);

  // Reconnect on mount if enabled
  useEffect(() => {
    if (reconnectOnMount && !state.isConnected && state.isInitialized) {
      reconnect().catch(console.error);
    }
  }, [reconnectOnMount, state.isConnected, state.isInitialized, reconnect]);

  const actions: CollaborationActions = {
    initialize,
    joinDocument,
    leaveDocument,
    applyOperation,
    updateCursor,
    lockDocument,
    disconnect,
    reconnect
  };

  return [state, actions];
}

export default useCollaboration;
