import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { DrawingTool, DrawingState, CanvasViewport, CanvasGrid, SelectionBox, Notification } from '@/types/air-duct-sizer'

interface UIState {
  // Sidebar and panels
  sidebarOpen: boolean
  activePanel: 'project' | 'room' | 'segment' | 'equipment' | null
  
  // Canvas state
  viewport: CanvasViewport
  grid: CanvasGrid
  selectionBox: SelectionBox

  // Plan settings
  planScale: number
  
  // Drawing state
  drawingState: DrawingState
  
  // Selection state
  selectedObjects: string[]
  
  // Notifications
  notifications: Notification[]
  
  // Loading states
  isCalculating: boolean
  isSaving: boolean
  isExporting: boolean
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setActivePanel: (panel: 'project' | 'room' | 'segment' | 'equipment' | null) => void
  
  // Canvas actions
  setViewport: (viewport: Partial<CanvasViewport>) => void
  resetViewport: () => void
  setGridVisible: (visible: boolean) => void
  setSnapToGrid: (enabled: boolean) => void
  setGridSize: (size: number) => void
  
  // Drawing actions
  setDrawingTool: (tool: DrawingTool) => void
  setDrawingState: (state: Partial<DrawingState>) => void
  startDrawing: (point: { x: number; y: number }) => void
  updateDrawing: (point: { x: number; y: number }) => void
  finishDrawing: () => void
  cancelDrawing: () => void
  
  // Selection actions
  selectObject: (objectId: string) => void
  selectMultiple: (objectIds: string[]) => void
  deselectObject: (objectId: string) => void
  clearSelection: () => void
  isSelected: (objectId: string) => boolean
  
  // Selection box actions
  showSelectionBox: (x: number, y: number) => void
  updateSelectionBox: (width: number, height: number) => void
  hideSelectionBox: () => void

  // Plan actions
  setPlanScale: (scale: number) => void
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Loading state actions
  setCalculating: (calculating: boolean) => void
  setSaving: (saving: boolean) => void
  setExporting: (exporting: boolean) => void
}

const generateNotificationId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      activePanel: 'project',
      
      viewport: {
        x: 0,
        y: 0,
        scale: 1,
      },
      
      grid: {
        size: 20,
        visible: true,
        snapEnabled: true,
      },

      planScale: 1,
      
      selectionBox: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        visible: false,
      },
      
      drawingState: {
        tool: 'select',
        isDrawing: false,
      },
      
      selectedObjects: [],
      notifications: [],
      
      isCalculating: false,
      isSaving: false,
      isExporting: false,

      // Sidebar and panel actions
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open }, false, 'setSidebarOpen')
      },

      setActivePanel: (panel) => {
        set({ activePanel: panel }, false, 'setActivePanel')
      },

      // Canvas actions
      setViewport: (viewportUpdates) => {
        const { viewport } = get()
        set({ 
          viewport: { ...viewport, ...viewportUpdates } 
        }, false, 'setViewport')
      },

      resetViewport: () => {
        set({ 
          viewport: { x: 0, y: 0, scale: 1 } 
        }, false, 'resetViewport')
      },

      setGridVisible: (visible) => {
        const { grid } = get()
        set({ 
          grid: { ...grid, visible } 
        }, false, 'setGridVisible')
      },

      setSnapToGrid: (enabled) => {
        const { grid } = get()
        set({ 
          grid: { ...grid, snapEnabled: enabled } 
        }, false, 'setSnapToGrid')
      },

      setGridSize: (size) => {
        const { grid } = get()
        set({ 
          grid: { ...grid, size } 
        }, false, 'setGridSize')
      },

      // Drawing actions
      setDrawingTool: (tool) => {
        set({ 
          drawingState: { ...get().drawingState, tool } 
        }, false, 'setDrawingTool')
      },

      setDrawingState: (stateUpdates) => {
        const { drawingState } = get()
        set({ 
          drawingState: { ...drawingState, ...stateUpdates } 
        }, false, 'setDrawingState')
      },

      startDrawing: (point) => {
        set({ 
          drawingState: {
            ...get().drawingState,
            isDrawing: true,
            startPoint: point,
            endPoint: point,
          }
        }, false, 'startDrawing')
      },

      updateDrawing: (point) => {
        const { drawingState } = get()
        if (!drawingState.isDrawing) return
        
        set({ 
          drawingState: {
            ...drawingState,
            endPoint: point,
          }
        }, false, 'updateDrawing')
      },

      finishDrawing: () => {
        set({ 
          drawingState: {
            ...get().drawingState,
            isDrawing: false,
            startPoint: undefined,
            endPoint: undefined,
          }
        }, false, 'finishDrawing')
      },

      cancelDrawing: () => {
        set({ 
          drawingState: {
            ...get().drawingState,
            isDrawing: false,
            startPoint: undefined,
            endPoint: undefined,
          }
        }, false, 'cancelDrawing')
      },

      // Selection actions
      selectObject: (objectId) => {
        const { selectedObjects } = get()
        if (!selectedObjects.includes(objectId)) {
          set({ 
            selectedObjects: [...selectedObjects, objectId] 
          }, false, 'selectObject')
        }
      },

      selectMultiple: (objectIds) => {
        set({ selectedObjects: objectIds }, false, 'selectMultiple')
      },

      deselectObject: (objectId) => {
        const { selectedObjects } = get()
        set({ 
          selectedObjects: selectedObjects.filter(id => id !== objectId) 
        }, false, 'deselectObject')
      },

      clearSelection: () => {
        set({ selectedObjects: [] }, false, 'clearSelection')
      },

      isSelected: (objectId) => {
        return get().selectedObjects.includes(objectId)
      },

      // Selection box actions
      showSelectionBox: (x, y) => {
        set({ 
          selectionBox: {
            x,
            y,
            width: 0,
            height: 0,
            visible: true,
          }
        }, false, 'showSelectionBox')
      },

      updateSelectionBox: (width, height) => {
        const { selectionBox } = get()
        set({ 
          selectionBox: {
            ...selectionBox,
            width,
            height,
          }
        }, false, 'updateSelectionBox')
      },

      hideSelectionBox: () => {
        set({ 
          selectionBox: {
            ...get().selectionBox,
            visible: false,
          }
        }, false, 'hideSelectionBox')
      },

      // Notification actions
      addNotification: (notification) => {
        const { notifications } = get()
        const newNotification: Notification = {
          ...notification,
          id: generateNotificationId(),
          timestamp: Date.now(),
        }
        
        set({ 
          notifications: [...notifications, newNotification] 
        }, false, 'addNotification')

        // Auto-remove notification after duration
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id)
          }, notification.duration)
        }
      },

      removeNotification: (id) => {
        const { notifications } = get()
        set({ 
          notifications: notifications.filter(n => n.id !== id) 
        }, false, 'removeNotification')
      },

      clearNotifications: () => {
        set({ notifications: [] }, false, 'clearNotifications')
      },

      // Loading state actions
      setCalculating: (calculating) => {
        set({ isCalculating: calculating }, false, 'setCalculating')
      },

      setSaving: (saving) => {
        set({ isSaving: saving }, false, 'setSaving')
      },

      setExporting: (exporting) => {
        set({ isExporting: exporting }, false, 'setExporting')
      },

      setPlanScale: (scale) => {
        set({ planScale: scale }, false, 'setPlanScale')
      },
    }),
    { name: 'UIStore' }
  )
)
