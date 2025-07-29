// Mock for @/stores/project-store
const mockProjectStore = {
  currentProject: {
    id: 'test-project',
    name: 'Test Project',
    description: 'Test project description',
    segments: [],
    rooms: [],
    equipment: [],
    settings: {
      units: 'imperial',
      precision: 2
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  },
  projects: [],
  isLoading: false,
  error: null,
  createProject: jest.fn(),
  loadProject: jest.fn(),
  saveProject: jest.fn(),
  deleteProject: jest.fn(),
  updateProject: jest.fn(),
  addSegment: jest.fn(),
  updateSegment: jest.fn(),
  deleteSegment: jest.fn(),
  addRoom: jest.fn(),
  updateRoom: jest.fn(),
  deleteRoom: jest.fn(),
  addEquipment: jest.fn(),
  updateEquipment: jest.fn(),
  deleteEquipment: jest.fn()
};

const useProjectStore = jest.fn(() => mockProjectStore);

module.exports = {
  useProjectStore,
  __esModule: true,
  default: useProjectStore
};
