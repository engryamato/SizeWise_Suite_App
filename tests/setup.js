/**
 * Jest Test Setup
 * 
 * Global test configuration and mocks for SizeWise Suite.
 */

// Mock IndexedDB for testing
import 'fake-indexeddb/auto';

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    serviceWorker: {
      register: jest.fn(() => Promise.resolve())
    }
  },
  writable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    reload: jest.fn()
  },
  writable: true
});

// Global test utilities
global.testUtils = {
  // Create mock API response
  createMockApiResponse: (success = true, data = {}) => ({
    success,
    ...data
  }),
  
  // Create mock calculation data
  createMockCalculationData: () => ({
    airflow: 1000,
    duct_type: 'rectangular',
    friction_rate: 0.08,
    units: 'imperial'
  }),
  
  // Create mock project data
  createMockProjectData: () => ({
    name: 'Test Project',
    description: 'A test project',
    units: 'imperial'
  }),
  
  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
});
