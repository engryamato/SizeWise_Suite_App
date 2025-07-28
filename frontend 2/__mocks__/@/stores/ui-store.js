// Mock for @/stores/ui-store
const mockUIStore = {
  drawingState: {
    tool: 'select',
    isDrawing: false,
    currentPath: null
  },
  grid: {
    visible: true,
    snapEnabled: true,
    size: 20,
    opacity: 0.3
  },
  viewport: {
    scale: 1,
    x: 0,
    y: 0,
    width: 800,
    height: 600
  },
  planScale: {
    pixelsPerMeter: 100,
    isCalibrated: true,
    calibrationPoints: []
  },
  sidebar: {
    isOpen: true,
    activePanel: null
  },
  panels: {
    properties: { isOpen: false },
    help: { isOpen: false },
    chat: { isOpen: false }
  },
  theme: 'light',
  setDrawingTool: jest.fn(),
  setGridVisible: jest.fn(),
  setSnapToGrid: jest.fn(),
  setViewport: jest.fn(),
  resetViewport: jest.fn(),
  toggleSidebar: jest.fn(),
  openPanel: jest.fn(),
  closePanel: jest.fn(),
  setTheme: jest.fn()
};

const useUIStore = jest.fn(() => mockUIStore);

module.exports = {
  useUIStore,
  __esModule: true,
  default: useUIStore
};
