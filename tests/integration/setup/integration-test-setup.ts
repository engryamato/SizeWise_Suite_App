/**
 * Integration Test Setup
 * 
 * Global setup for HVAC component integration tests
 * Configures mocks, test utilities, and environment for integration testing
 * 
 * Part of Phase 1 bridging plan for comprehensive integration test coverage
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 */

require('@testing-library/jest-dom');

// =============================================================================
// Global Mocks
// =============================================================================

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockLocalStorage
});

// Mock IndexedDB for offline storage testing
const mockIndexedDB = {
  open: jest.fn(() => Promise.resolve({
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(() => Promise.resolve()),
          get: jest.fn(() => Promise.resolve()),
          put: jest.fn(() => Promise.resolve()),
          delete: jest.fn(() => Promise.resolve())
        }))
      }))
    }
  })),
  deleteDatabase: jest.fn(() => Promise.resolve())
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    })),
    ready: Promise.resolve({
      active: {
        postMessage: jest.fn()
      }
    }),
    controller: {
      postMessage: jest.fn()
    }
  },
  writable: true
});

// Mock Web Workers for WASM calculations
Object.defineProperty(window, 'Worker', {
  value: class MockWorker {
    constructor(public url: string) {}
    postMessage = jest.fn();
    terminate = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
  }
});

// Mock WebAssembly for WASM testing
Object.defineProperty(window, 'WebAssembly', {
  value: {
    instantiate: jest.fn(() => Promise.resolve({
      instance: {
        exports: {
          calculate_air_duct_size: jest.fn(() => 14.0),
          calculate_pressure_drop: jest.fn(() => 0.8),
          calculate_heat_transfer: jest.fn(() => 1200.0),
          optimize_hvac_system: jest.fn(() => ({ efficiency: 0.95 }))
        }
      }
    })),
    compile: jest.fn(() => Promise.resolve({}))
  }
});

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Mock API response helper
 */
export const mockApiResponse = (data: any, options: { ok?: boolean; status?: number } = {}) => {
  const { ok = true, status = 200 } = options;
  
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData()
  } as Response;
};

/**
 * Mock HVAC calculation data factory
 */
export const createMockCalculationData = {
  airDuct: (overrides: Partial<any> = {}) => ({
    airflow: 1500,
    duct_type: 'round',
    friction_rate: 0.08,
    units: 'imperial',
    material: 'galvanized_steel',
    ...overrides
  }),
  
  pressureDrop: (overrides: Partial<any> = {}) => ({
    airflow: 2000,
    duct_length: 100,
    duct_diameter: 16,
    fittings: [
      { type: 'elbow_90', quantity: 2 },
      { type: 'tee_branch', quantity: 1 }
    ],
    ...overrides
  }),
  
  compliance: (overrides: Partial<any> = {}) => ({
    system_type: 'supply_air',
    velocity: 1800,
    duct_type: 'rectangular',
    width: 20,
    height: 8,
    standards: ['SMACNA', 'ASHRAE'],
    ...overrides
  })
};

/**
 * Mock calculation results factory
 */
export const createMockCalculationResults = {
  airDuct: (overrides: Partial<any> = {}) => ({
    success: true,
    results: {
      diameter: { value: 14.0, unit: 'in' },
      velocity: { value: 1400.0, unit: 'fpm' },
      area: { value: 1.07, unit: 'sq_ft' },
      pressure_loss: { value: 0.8, unit: 'in_wg_per_100ft' }
    },
    compliance: {
      smacna: {
        velocity: { passed: true, value: 1400.0, limit: 2500 }
      }
    },
    ...overrides
  }),
  
  compliance: (overrides: Partial<any> = {}) => ({
    success: true,
    overall_compliance: 'compliant',
    validation_results: {
      smacna: { status: 'compliant', score: 95 },
      ashrae: { status: 'compliant', score: 88 }
    },
    ...overrides
  })
};

/**
 * Integration test environment setup
 */
export const setupIntegrationTestEnvironment = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TESTING = 'true';
  process.env.API_BASE_URL = 'http://127.0.0.1:5000/api';
  
  // Configure console for test environment
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Suppress expected React warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
  
  return {
    cleanup: () => {
      console.error = originalConsoleError;
    }
  };
};

/**
 * Mock network conditions for offline testing
 */
export const mockNetworkConditions = {
  online: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  },
  
  offline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
  },
  
  slowConnection: () => {
    // Mock slow network by adding delays to fetch
    const originalFetch = global.fetch;
    global.fetch = jest.fn((...args) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(originalFetch(...args));
        }, 2000); // 2 second delay
      });
    });
  }
};

// =============================================================================
// Global Test Setup
// =============================================================================

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage
  mockLocalStorage.clear();
  
  // Reset fetch mock
  (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  
  // Reset network to online
  mockNetworkConditions.online();
});

afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();
  
  // Reset modules
  jest.resetModules();
});

// Setup integration test environment
const testEnv = setupIntegrationTestEnvironment();

// Cleanup after all tests
afterAll(() => {
  testEnv.cleanup();
});

// =============================================================================
// Custom Matchers
// =============================================================================

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidHVACCalculation(): R;
      toBeCompliantWithStandards(standards: string[]): R;
      toHaveOfflineCapability(): R;
    }
  }
}

// Custom matcher for HVAC calculation validation
expect.extend({
  toBeValidHVACCalculation(received) {
    const pass = received &&
      received.success === true &&
      received.results &&
      typeof received.results === 'object';
    
    return {
      message: () => pass
        ? `Expected ${received} not to be a valid HVAC calculation`
        : `Expected ${received} to be a valid HVAC calculation with success=true and results object`,
      pass
    };
  },
  
  toBeCompliantWithStandards(received, standards) {
    const pass = received &&
      received.compliance &&
      standards.every((standard: string) => 
        received.compliance[standard.toLowerCase()] &&
        received.compliance[standard.toLowerCase()].status === 'compliant'
      );
    
    return {
      message: () => pass
        ? `Expected ${received} not to be compliant with standards ${standards.join(', ')}`
        : `Expected ${received} to be compliant with standards ${standards.join(', ')}`,
      pass
    };
  },
  
  toHaveOfflineCapability(received) {
    const pass = received &&
      (received.calculated_offline === true || received.offline_capable === true);
    
    return {
      message: () => pass
        ? `Expected ${received} not to have offline capability`
        : `Expected ${received} to have offline capability`,
      pass
    };
  }
});
