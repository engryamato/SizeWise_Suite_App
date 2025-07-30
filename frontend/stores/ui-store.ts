import { create } from 'zustand';
import { DrawingTool } from '@/types/air-duct-sizer';

type Theme = 'light' | 'dark' | 'system';
type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Viewport {
  x: number;
  y: number;
  scale: number;
  width?: number;
  height?: number;
}

interface Grid {
  visible: boolean;
  snapEnabled: boolean;
  size: number;
  opacity?: number;
}

interface DrawingState {
  tool: DrawingTool;
  isDrawing: boolean;
  currentPath: any;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
}

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

interface PlanScale {
  pixelsPerMeter: number;
  isCalibrated: boolean;
  calibrationPoints: any[];
}

interface UIState {
  // Basic UI state
  sidebarOpen: boolean;
  theme: Theme;
  notifications: Array<{
    id: string;
    type: NotificationType;
    message: string;
    timestamp: number;
  }>;
  isLoading: boolean;

  // Canvas state
  viewport: Viewport;
  grid: Grid;
  drawingState: DrawingState;
  selectedObjects: string[];
  selectionBox: SelectionBox;
  planScale: PlanScale;

  // Panel state
  activePanel: 'project' | 'room' | 'segment' | 'equipment' | null;
  panels: {
    properties: { isOpen: boolean };
    help: { isOpen: boolean };
    chat: { isOpen: boolean };
  };

  // Basic UI actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Canvas actions
  setViewport: (viewport: Partial<Viewport>) => void;
  resetViewport: () => void;
  setGridVisible: (visible: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;

  // Drawing actions
  setDrawingTool: (tool: DrawingTool) => void;
  startDrawing: (point: { x: number; y: number }) => void;
  updateDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;

  // Selection actions
  selectObject: (id: string) => void;
  selectObjects: (ids: string[]) => void;
  selectMultiple: (ids: string[]) => void;
  deselectObjects: (ids: string[]) => void;
  clearSelection: () => void;
  showSelectionBox: (box: Omit<SelectionBox, 'visible'>) => void;
  updateSelectionBox: (box: Partial<SelectionBox>) => void;
  hideSelectionBox: () => void;

  // Plan actions
  setPlanScale: (scale: Partial<PlanScale>) => void;

  // Panel actions
  setActivePanel: (panel: 'project' | 'room' | 'segment' | 'equipment' | null) => void;
  openPanel: (panel: 'project' | 'room' | 'segment' | 'equipment') => void;
  closePanel: (panel: 'project' | 'room' | 'segment' | 'equipment') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Basic UI state
  sidebarOpen: true,
  theme: 'system',
  notifications: [],
  isLoading: false,

  // Canvas state
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
    width: 800,
    height: 600
  },
  grid: {
    visible: true,
    snapEnabled: true,
    size: 20,
    opacity: 0.3
  },
  drawingState: {
    tool: 'select',
    isDrawing: false,
    currentPath: null
  },
  selectedObjects: [],
  selectionBox: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false
  },
  planScale: {
    pixelsPerMeter: 100,
    isCalibrated: false,
    calibrationPoints: []
  },

  // Panel state
  activePanel: null,
  panels: {
    properties: { isOpen: false },
    help: { isOpen: false },
    chat: { isOpen: false }
  },

  // Basic UI actions
  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setTheme: (theme: Theme) => {
    set({ theme });
  },

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();

    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id, timestamp }
      ]
    }));

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Canvas actions
  setViewport: (viewport: Partial<Viewport>) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport }
    }));
  },

  resetViewport: () => {
    set({
      viewport: {
        x: 0,
        y: 0,
        scale: 1,
        width: 800,
        height: 600
      }
    });
  },

  setGridVisible: (visible: boolean) => {
    set((state) => ({
      grid: { ...state.grid, visible }
    }));
  },

  setSnapToGrid: (enabled: boolean) => {
    set((state) => ({
      grid: { ...state.grid, snapEnabled: enabled }
    }));
  },

  setGridSize: (size: number) => {
    set((state) => ({
      grid: { ...state.grid, size }
    }));
  },

  // Drawing actions
  setDrawingTool: (tool: DrawingTool) => {
    set((state) => ({
      drawingState: { ...state.drawingState, tool }
    }));
  },

  startDrawing: (point: { x: number; y: number }) => {
    set((state) => ({
      drawingState: {
        ...state.drawingState,
        isDrawing: true,
        startPoint: point
      }
    }));
  },

  updateDrawing: (point: { x: number; y: number }) => {
    set((state) => ({
      drawingState: {
        ...state.drawingState,
        endPoint: point
      }
    }));
  },

  finishDrawing: () => {
    set((state) => ({
      drawingState: {
        ...state.drawingState,
        isDrawing: false,
        startPoint: undefined,
        endPoint: undefined,
        currentPath: null
      }
    }));
  },

  cancelDrawing: () => {
    set((state) => ({
      drawingState: {
        ...state.drawingState,
        isDrawing: false,
        startPoint: undefined,
        endPoint: undefined,
        currentPath: null
      }
    }));
  },

  // Selection actions
  selectObject: (id: string) => {
    set((state) => ({
      selectedObjects: [...state.selectedObjects, id]
    }));
  },

  selectObjects: (ids: string[]) => {
    set({ selectedObjects: ids });
  },

  selectMultiple: (ids: string[]) => {
    set({ selectedObjects: ids });
  },

  deselectObjects: (ids: string[]) => {
    set((state) => ({
      selectedObjects: state.selectedObjects.filter(id => !ids.includes(id))
    }));
  },

  clearSelection: () => {
    set({ selectedObjects: [] });
  },

  showSelectionBox: (box: Omit<SelectionBox, 'visible'>) => {
    set({
      selectionBox: { ...box, visible: true }
    });
  },

  updateSelectionBox: (box: Partial<SelectionBox>) => {
    set((state) => ({
      selectionBox: { ...state.selectionBox, ...box }
    }));
  },

  hideSelectionBox: () => {
    set((state) => ({
      selectionBox: { ...state.selectionBox, visible: false }
    }));
  },

  // Plan actions
  setPlanScale: (scale: Partial<PlanScale>) => {
    set((state) => ({
      planScale: { ...state.planScale, ...scale }
    }));
  },

  // Panel actions
  setActivePanel: (panel: 'project' | 'room' | 'segment' | 'equipment' | null) => {
    set({ activePanel: panel });
  },

  openPanel: (panel: 'project' | 'room' | 'segment' | 'equipment') => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panel]: { isOpen: true }
      }
    }));
  },

  closePanel: (panel: 'project' | 'room' | 'segment' | 'equipment') => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panel]: { isOpen: false }
      }
    }));
  }
}));
