/**
 * Jest Setup - Testing Environment Configuration
 * 
 * MISSION-CRITICAL: Jest setup for comprehensive testing environment
 * Configures mocks, utilities, and testing infrastructure
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.3
 */

import '@testing-library/jest-dom';
import 'jest-extended';
import { configure } from '@testing-library/react';
import { expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
// import { server } from '../utils/mock-server';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHavePerformanceWithin(maxTime: number): R;
      toHaveTierAccess(tier: string): R;
      toBeSecurelyEncrypted(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHavePerformanceWithin(received: number, maxTime: number) {
    const pass = received <= maxTime;
    if (pass) {
      return {
        message: () => `expected ${received}ms not to be within performance limit of ${maxTime}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received}ms to be within performance limit of ${maxTime}ms`,
        pass: false,
      };
    }
  },

  toHaveTierAccess(received: any, tier: string) {
    const hasAccess = received?.tier === tier || received?.allowedTiers?.includes(tier);
    if (hasAccess) {
      return {
        message: () => `expected not to have ${tier} tier access`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected to have ${tier} tier access`,
        pass: false,
      };
    }
  },

  toBeSecurelyEncrypted(received: string) {
    const isEncrypted = received && received.length > 0 && !received.includes('plain:');
    if (isEncrypted) {
      return {
        message: () => `expected ${received} not to be securely encrypted`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be securely encrypted`,
        pass: false,
      };
    }
  }
});

// Mock console methods in test environment
const originalConsole = { ...console };

beforeAll(() => {
  // Start mock server - commented out until MSW is installed
  // server.listen({
  //   onUnhandledRequest: 'warn'
  // });

  // Mock console methods to reduce noise in tests
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Reset handlers after each test - commented out until MSW is installed
  // server.resetHandlers();
  
  // Clear all mocks
  jest.clearAllMocks();
});

afterAll(() => {
  // Clean up mock server - commented out until MSW is installed
  // server.close();
  
  // Restore console
  Object.assign(console, originalConsole);
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock fetch
(global as any).fetch = jest.fn();

// Mock crypto - commented out due to TypeScript issues
/*
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9012'),
    getRandomValues: jest.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32) as any),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16) as any),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16) as any),
      generateKey: jest.fn().mockResolvedValue({} as any),
      importKey: jest.fn().mockResolvedValue({} as any),
      exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32) as any)
    }
  }
});
*/

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  }
});

// Mock URL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File and FileReader - commented out due to TypeScript issues
/*
(global as any).File = jest.fn().mockImplementation((bits: any, name: any, options: any) => ({
  name,
  size: bits.length,
  type: options?.type || 'text/plain',
  lastModified: Date.now(),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(bits.length) as any),
  text: jest.fn().mockResolvedValue(bits.join('')),
  stream: jest.fn()
}));
*/

(global as any).FileReader = jest.fn().mockImplementation(() => ({
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  onload: null,
  onerror: null,
  result: null
}));

// Mock Blob - commented out due to TypeScript issues
/*
(global as any).Blob = jest.fn().mockImplementation((content: any, options: any) => ({
  size: content ? content.length : 0,
  type: options?.type || 'text/plain',
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(content?.length || 0)),
  text: jest.fn().mockResolvedValue(content?.join('') || ''),
  stream: jest.fn()
}));
*/

// Performance monitoring utilities
(global as any).measurePerformance = (fn: () => any) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return {
    result,
    duration: end - start
  };
};

(global as any).measureAsyncPerformance = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    duration: end - start
  };
};

// Test data cleanup
beforeEach(() => {
  // Clear localStorage
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();

  // Clear sessionStorage
  sessionStorageMock.clear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();

  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
});

// Error boundary for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress specific warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('Warning: componentWillMount'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

export {};
