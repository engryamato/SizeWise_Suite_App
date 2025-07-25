import '@testing-library/jest-dom'

// Mock Konva for testing
jest.mock('konva', () => ({
  Stage: jest.fn(),
  Layer: jest.fn(),
  Rect: jest.fn(),
  Circle: jest.fn(),
  Line: jest.fn(),
  Text: jest.fn(),
  Group: jest.fn(),
}))

jest.mock('react-konva', () => ({
  Stage: jest.fn(({ children }) => children),
  Layer: jest.fn(({ children }) => children),
  Rect: jest.fn(() => null),
  Circle: jest.fn(() => null),
  Line: jest.fn(() => null),
  Text: jest.fn(() => null),
  Group: jest.fn(({ children }) => children),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

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
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock environment variables for authentication
process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL = 'admin@sizewise.com'
process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD = 'SizeWise2024!6EAF4610705941'
process.env.NEXT_PUBLIC_AUTH_SERVER_URL = 'http://localhost:5000'

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeEach(() => {
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
  jest.clearAllMocks()
})

// Global test utilities for authentication testing
global.testUtils = {
  // Helper to create mock user
  createMockUser: (overrides = {}) => ({
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    tier: 'free',
    company: 'Test Company',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  // Helper to create mock tier status
  createMockTierStatus: (overrides = {}) => ({
    tier: 'free',
    features: {
      max_projects: 3,
      max_segments_per_project: 25,
      high_res_exports: false,
      watermarked_exports: true,
      api_access: false,
    },
    usage: {
      projects_count: 1,
      segments_count: 10,
    },
    last_validated: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  // Helper to create mock super admin
  createMockSuperAdmin: () => ({
    id: 'super-admin-001',
    email: 'admin@sizewise.com',
    name: 'SizeWise Administrator',
    tier: 'super_admin',
    company: 'SizeWise Suite',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_super_admin: true,
  }),

  // Helper to create trial user
  createMockTrialUser: (daysRemaining = 7) => {
    const expiryDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
    return {
      user: {
        id: 'trial-user-123',
        email: 'trial@example.com',
        name: 'Trial User',
        tier: 'trial',
        company: 'Trial Company',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trial_expires: expiryDate.toISOString(),
      },
      tierStatus: {
        tier: 'trial',
        trial_expires: expiryDate.toISOString(),
        features: {
          max_projects: -1,
          max_segments_per_project: -1,
          high_res_exports: true,
          watermarked_exports: false,
          api_access: true,
        },
        usage: {
          projects_count: 5,
          segments_count: 150,
        },
        last_validated: '2024-01-01T00:00:00Z',
      },
    }
  },

  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to simulate network delay
  simulateNetworkDelay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),
}
