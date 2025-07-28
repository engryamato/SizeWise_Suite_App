// Mock for @/stores/ui-store
const mockUIStore = {
  // Sidebar and panels
  sidebarOpen: true,
  activePanel: null,

  // Canvas state
  viewport: {
    scale: 1,
    x: 0,
    y: 0
  },
  grid: {
    visible: true,
    snapEnabled: true,
    size: 20
  },
  selectionBox: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false
  },

  // Plan settings - FIXED: should be number, not object
  planScale: 1,

  // Drawing state
  drawingState: {
    tool: 'select',
    isDrawing: false,
    currentPath: null
  },

  // Selection state
  selectedObjects: [],

  // Notifications
  notifications: [],

  // Loading states
  isCalculating: false,
  isSaving: false,
  isExporting: false,

  // Actions
  setSidebarOpen: jest.fn(),
  setActivePanel: jest.fn(),

  // Canvas actions
  setViewport: jest.fn(),
  resetViewport: jest.fn(),
  setGridVisible: jest.fn(),
  setSnapToGrid: jest.fn(),
  setGridSize: jest.fn(),

  // Drawing actions
  setDrawingTool: jest.fn(),
  setDrawingState: jest.fn(),
  startDrawing: jest.fn(),
  updateDrawing: jest.fn(),
  finishDrawing: jest.fn(),
  cancelDrawing: jest.fn(),

  // Selection actions
  selectObjects: jest.fn(),
  deselectObjects: jest.fn(),
  clearSelection: jest.fn(),
  showSelectionBox: jest.fn(),
  updateSelectionBox: jest.fn(),
  hideSelectionBox: jest.fn(),

  // Plan actions
  setPlanScale: jest.fn(),

  // Notification actions
  addNotification: jest.fn(),
  removeNotification: jest.fn(),
  clearNotifications: jest.fn(),

  // Loading actions
  setCalculating: jest.fn(),
  setSaving: jest.fn(),
  setExporting: jest.fn()
};

const useUIStore = jest.fn(() => mockUIStore);

module.exports = {
  useUIStore,
  __esModule: true,
  default: useUIStore
};
