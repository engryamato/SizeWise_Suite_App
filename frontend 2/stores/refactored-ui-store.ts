/**
 * Refactored UI Store
 * 
 * Zustand store focused purely on UI state management with clear boundaries.
 * Separated from business logic and aligned with new component architecture.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  CanvasViewport, 
  CanvasGrid, 
  DrawingTool, 
  DrawingState,
  Notification 
} from '../types/air-duct-sizer';

// =============================================================================
// UI State Interface
// =============================================================================

/**
 * UI-focused state interface
 * Contains only presentation and interaction state
 */
export interface UIState {
  // =============================================================================
  // Layout State
  // =============================================================================
  
  /** Whether the main sidebar is open */
  sidebarOpen: boolean;
  
  /** Currently active sidebar panel */
  activePanel: 'project' | 'room' | 'segment' | 'equipment' | 'calculation' | 'validation' | null;
  
  /** Whether mobile menu is open */
  mobileMenuOpen: boolean;
  
  /** Whether project properties panel is open */
  projectPropertiesOpen: boolean;
  
  /** Current theme mode */
  theme: 'light' | 'dark' | 'auto';
  
  // =============================================================================
  // Canvas State
  // =============================================================================
  
  /** Canvas viewport (pan, zoom, position) */
  viewport: CanvasViewport;
  
  /** Grid configuration */
  grid: CanvasGrid;
  
  /** Current drawing state */
  drawingState: DrawingState;
  
  /** Plan scale factor */
  planScale: number;
  
  /** Whether snap to grid is enabled */
  snapToGrid: boolean;
  
  /** Whether grid is visible */
  gridVisible: boolean;
  
  // =============================================================================
  // Selection State
  // =============================================================================
  
  /** Currently selected object IDs */
  selectedObjects: string[];
  
  /** Selection box for multi-select */
  selectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  };
  
  // =============================================================================
  // Interaction State
  // =============================================================================
  
  /** Whether user is currently drawing */
  isDrawing: boolean;
  
  /** Whether user is currently panning */
  isPanning: boolean;
  
  /** Whether user is currently selecting */
  isSelecting: boolean;
  
  /** Current cursor mode */
  cursorMode: 'default' | 'crosshair' | 'move' | 'resize' | 'grab' | 'grabbing';
  
  // =============================================================================
  // Notification State
  // =============================================================================
  
  /** Active notifications */
  notifications: Notification[];
  
  /** Maximum number of notifications to show */
  maxNotifications: number;
  
  // =============================================================================
  // Loading States
  // =============================================================================
  
  /** Whether calculations are running */
  isCalculating: boolean;
  
  /** Whether project is being saved */
  isSaving: boolean;
  
  /** Whether export is in progress */
  isExporting: boolean;
  
  /** Whether validation is running */
  isValidating: boolean;
  
  // =============================================================================
  // Actions
  // =============================================================================
  
  // Layout actions
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: UIState['activePanel']) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setProjectPropertiesOpen: (open: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  
  // Canvas actions
  setViewport: (viewport: CanvasViewport) => void;
  setGrid: (grid: Partial<CanvasGrid>) => void;
  setDrawingTool: (tool: DrawingTool) => void;
  setDrawingState: (state: Partial<DrawingState>) => void;
  setPlanScale: (scale: number) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  resetViewport: () => void;
  
  // Selection actions
  setSelectedObjects: (ids: string[]) => void;
  addSelectedObject: (id: string) => void;
  removeSelectedObject: (id: string) => void;
  clearSelection: () => void;
  setSelectionBox: (box: Partial<UIState['selectionBox']>) => void;
  
  // Interaction actions
  setIsDrawing: (drawing: boolean) => void;
  setIsPanning: (panning: boolean) => void;
  setIsSelecting: (selecting: boolean) => void;
  setCursorMode: (mode: UIState['cursorMode']) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading state actions
  setIsCalculating: (calculating: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setIsValidating: (validating: boolean) => void;
  
  // Utility actions
  resetUIState: () => void;
}

// =============================================================================
// Default State
// =============================================================================

const defaultState: Omit<UIState, keyof UIActions> = {
  // Layout
  sidebarOpen: true,
  activePanel: 'project',
  mobileMenuOpen: false,
  projectPropertiesOpen: false,
  theme: 'auto',
  
  // Canvas
  viewport: { x: 0, y: 0, scale: 1 },
  grid: { size: 20, visible: true, snapEnabled: true },
  drawingState: { tool: 'select', isDrawing: false },
  planScale: 1,
  snapToGrid: true,
  gridVisible: true,
  
  // Selection
  selectedObjects: [],
  selectionBox: { x: 0, y: 0, width: 0, height: 0, visible: false },
  
  // Interaction
  isDrawing: false,
  isPanning: false,
  isSelecting: false,
  cursorMode: 'default',
  
  // Notifications
  notifications: [],
  maxNotifications: 5,
  
  // Loading states
  isCalculating: false,
  isSaving: false,
  isExporting: false,
  isValidating: false,
};

// =============================================================================
// Store Implementation
// =============================================================================

type UIActions = Pick<UIState, 
  | 'setSidebarOpen' | 'setActivePanel' | 'setMobileMenuOpen' | 'setProjectPropertiesOpen' | 'setTheme'
  | 'setViewport' | 'setGrid' | 'setDrawingTool' | 'setDrawingState' | 'setPlanScale' | 'setSnapToGrid' | 'setGridVisible' | 'resetViewport'
  | 'setSelectedObjects' | 'addSelectedObject' | 'removeSelectedObject' | 'clearSelection' | 'setSelectionBox'
  | 'setIsDrawing' | 'setIsPanning' | 'setIsSelecting' | 'setCursorMode'
  | 'addNotification' | 'removeNotification' | 'clearNotifications'
  | 'setIsCalculating' | 'setIsSaving' | 'setIsExporting' | 'setIsValidating'
  | 'resetUIState'
>;

/**
 * Refactored UI store with clear boundaries and reduced coupling
 */
export const useRefactoredUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,
        
        // =============================================================================
        // Layout Actions
        // =============================================================================
        
        setSidebarOpen: (open) => {
          set({ sidebarOpen: open }, false, 'setSidebarOpen');
        },
        
        setActivePanel: (panel) => {
          set({ activePanel: panel }, false, 'setActivePanel');
        },
        
        setMobileMenuOpen: (open) => {
          set({ mobileMenuOpen: open }, false, 'setMobileMenuOpen');
        },
        
        setProjectPropertiesOpen: (open) => {
          set({ projectPropertiesOpen: open }, false, 'setProjectPropertiesOpen');
        },
        
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
        },
        
        // =============================================================================
        // Canvas Actions
        // =============================================================================
        
        setViewport: (viewport) => {
          set({ viewport }, false, 'setViewport');
        },
        
        setGrid: (gridUpdates) => {
          const currentGrid = get().grid;
          set({ grid: { ...currentGrid, ...gridUpdates } }, false, 'setGrid');
        },
        
        setDrawingTool: (tool) => {
          const currentDrawingState = get().drawingState;
          set({ 
            drawingState: { ...currentDrawingState, tool },
            cursorMode: tool === 'select' ? 'default' : 'crosshair'
          }, false, 'setDrawingTool');
        },
        
        setDrawingState: (stateUpdates) => {
          const currentDrawingState = get().drawingState;
          set({ drawingState: { ...currentDrawingState, ...stateUpdates } }, false, 'setDrawingState');
        },
        
        setPlanScale: (scale) => {
          set({ planScale: Math.max(0.1, Math.min(10, scale)) }, false, 'setPlanScale');
        },
        
        setSnapToGrid: (enabled) => {
          set({ snapToGrid: enabled }, false, 'setSnapToGrid');
        },
        
        setGridVisible: (visible) => {
          set({ gridVisible: visible }, false, 'setGridVisible');
        },
        
        resetViewport: () => {
          set({ viewport: { x: 0, y: 0, scale: 1 } }, false, 'resetViewport');
        },
        
        // =============================================================================
        // Selection Actions
        // =============================================================================
        
        setSelectedObjects: (ids) => {
          set({ selectedObjects: ids }, false, 'setSelectedObjects');
        },
        
        addSelectedObject: (id) => {
          const current = get().selectedObjects;
          if (!current.includes(id)) {
            set({ selectedObjects: [...current, id] }, false, 'addSelectedObject');
          }
        },
        
        removeSelectedObject: (id) => {
          const current = get().selectedObjects;
          set({ selectedObjects: current.filter(objId => objId !== id) }, false, 'removeSelectedObject');
        },
        
        clearSelection: () => {
          set({ selectedObjects: [] }, false, 'clearSelection');
        },
        
        setSelectionBox: (boxUpdates) => {
          const currentBox = get().selectionBox;
          set({ selectionBox: { ...currentBox, ...boxUpdates } }, false, 'setSelectionBox');
        },
        
        // =============================================================================
        // Interaction Actions
        // =============================================================================
        
        setIsDrawing: (drawing) => {
          set({ isDrawing: drawing }, false, 'setIsDrawing');
        },
        
        setIsPanning: (panning) => {
          set({ 
            isPanning: panning,
            cursorMode: panning ? 'grabbing' : 'default'
          }, false, 'setIsPanning');
        },
        
        setIsSelecting: (selecting) => {
          set({ isSelecting: selecting }, false, 'setIsSelecting');
        },
        
        setCursorMode: (mode) => {
          set({ cursorMode: mode }, false, 'setCursorMode');
        },
        
        // =============================================================================
        // Notification Actions
        // =============================================================================
        
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = Date.now();
          const newNotification: Notification = { ...notification, id, timestamp };
          
          const current = get().notifications;
          const maxNotifications = get().maxNotifications;
          
          // Remove oldest notifications if we exceed the limit
          const updatedNotifications = [newNotification, ...current].slice(0, maxNotifications);
          
          set({ notifications: updatedNotifications }, false, 'addNotification');
        },
        
        removeNotification: (id) => {
          const current = get().notifications;
          set({ notifications: current.filter(n => n.id !== id) }, false, 'removeNotification');
        },
        
        clearNotifications: () => {
          set({ notifications: [] }, false, 'clearNotifications');
        },
        
        // =============================================================================
        // Loading State Actions
        // =============================================================================
        
        setIsCalculating: (calculating) => {
          set({ isCalculating: calculating }, false, 'setIsCalculating');
        },
        
        setIsSaving: (saving) => {
          set({ isSaving: saving }, false, 'setIsSaving');
        },
        
        setIsExporting: (exporting) => {
          set({ isExporting: exporting }, false, 'setIsExporting');
        },
        
        setIsValidating: (validating) => {
          set({ isValidating: validating }, false, 'setIsValidating');
        },
        
        // =============================================================================
        // Utility Actions
        // =============================================================================
        
        resetUIState: () => {
          set(defaultState, false, 'resetUIState');
        },
      }),
      {
        name: 'sizewise-ui-store',
        partialize: (state) => ({
          // Only persist certain UI preferences
          sidebarOpen: state.sidebarOpen,
          theme: state.theme,
          grid: state.grid,
          snapToGrid: state.snapToGrid,
          gridVisible: state.gridVisible,
        }),
      }
    ),
    { name: 'SizeWise UI Store' }
  )
);
