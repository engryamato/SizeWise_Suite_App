import '@testing-library/jest-dom'

// Enhanced JSDOM setup for React 18.3.1 compatibility
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js navigation hooks globally
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// IndexedDB polyfill for JSDOM environment
// This fixes "indexedDB is not defined" errors in feature flag tests
try {
  const FDBFactory = require('fake-indexeddb/lib/FDBFactory')
  const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')
  global.indexedDB = new FDBFactory()
  global.IDBKeyRange = FDBKeyRange
} catch (error) {
  // Fallback for newer versions of fake-indexeddb
  const { FDBFactory, FDBKeyRange } = require('fake-indexeddb')
  global.indexedDB = new FDBFactory()
  global.IDBKeyRange = FDBKeyRange
}

// IntersectionObserver polyfill for JSDOM environment
// This fixes "this.intersectionObserver.observe is not a function" errors
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
  }

  observe(element) {
    // Mock implementation - immediately trigger callback with isIntersecting: true
    this.callback([{
      target: element,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRect: element.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now()
    }])
  }

  unobserve() {
    // Mock implementation
  }

  disconnect() {
    // Mock implementation
  }
}

// Configure React Testing Library for React 18
import { configure } from '@testing-library/react'
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  // Disable automatic cleanup to avoid conflicts
  // We'll handle cleanup manually in afterEach
})

// Enhanced DOM environment setup for React 18.3.1 + JSDOM
if (typeof window !== 'undefined') {
  // Create a complete DOM structure from scratch
  const createDOMStructure = () => {
    // Create document element if it doesn't exist
    if (!document.documentElement) {
      const html = document.createElement('html')
      html.setAttribute('lang', 'en')
      document.appendChild(html)
    }

    // Create head if it doesn't exist
    if (!document.head) {
      const head = document.createElement('head')
      document.documentElement.appendChild(head)
    }

    // Create body if it doesn't exist
    if (!document.body) {
      const body = document.createElement('body')
      document.documentElement.appendChild(body)
    }
  }

  // Initialize DOM structure
  createDOMStructure()

  // Store original methods to avoid infinite loops
  const originalAppendChild = Element.prototype.appendChild
  const originalRemoveChild = Element.prototype.removeChild
  const originalInsertBefore = Element.prototype.insertBefore

  // Enhanced appendChild with better error handling
  Element.prototype.appendChild = function(child) {
    try {
      if (child && typeof child === 'object' && child.nodeType) {
        return originalAppendChild.call(this, child)
      }
      return child
    } catch (error) {
      console.warn('appendChild error:', error)
      return child
    }
  }

  // Enhanced removeChild with error handling
  Element.prototype.removeChild = function(child) {
    try {
      if (child && child.parentNode === this) {
        return originalRemoveChild.call(this, child)
      }
      return child
    } catch (error) {
      console.warn('removeChild error:', error)
      return child
    }
  }

  // Enhanced insertBefore with error handling
  Element.prototype.insertBefore = function(newNode, referenceNode) {
    try {
      if (newNode && typeof newNode === 'object' && newNode.nodeType) {
        return originalInsertBefore.call(this, newNode, referenceNode)
      }
      return newNode
    } catch (error) {
      console.warn('insertBefore error:', error)
      return newNode
    }
  }
}

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
  Image: jest.fn(() => null),
}))

// Mock Next.js router with proper Jest mock functions
const mockUseRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}))

const mockUsePathname = jest.fn(() => '/')
const mockUseSearchParams = jest.fn(() => new URLSearchParams())

// Note: next/navigation is already mocked above, no need to duplicate

// Make mocks available globally for tests
global.mockUseRouter = mockUseRouter
global.mockUsePathname = mockUsePathname
global.mockUseSearchParams = mockUseSearchParams

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

// IntersectionObserver is already mocked above with a proper class implementation

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

// Enhanced Canvas and DOM mocking for React 18.3.1
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    arc: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: 800,
  height: 600,
  style: {},
}

// Store original createElement to avoid conflicts
const originalCreateElement = document.createElement.bind(document)

// Simplified document.createElement mock - only mock canvas, leave everything else alone
const originalDocumentCreateElement = document.createElement
document.createElement = function(tagName, options) {
  if (tagName === 'canvas') {
    return mockCanvas
  }
  // Use the original createElement for all other elements
  return originalDocumentCreateElement.call(document, tagName, options)
}

// Mock HTMLCanvasElement constructor
global.HTMLCanvasElement = jest.fn(() => mockCanvas)

// Mock Image constructor
global.Image = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  src: '',
  width: 0,
  height: 0,
  onload: null,
  onerror: null,
}))

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    subtle: {
      generateKey: jest.fn(),
      exportKey: jest.fn(),
      importKey: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    }
  }
})

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeEach(() => {
  console.warn = jest.fn()
  console.error = jest.fn()

  // Ensure DOM is properly set up for each test
  if (typeof document !== 'undefined') {
    // Ensure document structure exists
    if (!document.documentElement) {
      const html = document.createElement('html')
      document.appendChild(html)
    }

    if (!document.head) {
      const head = document.createElement('head')
      document.documentElement.appendChild(head)
    }

    // Ensure body exists and is clean
    if (!document.body) {
      const body = document.createElement('body')
      document.documentElement.appendChild(body)
    } else {
      // Clear existing content safely
      try {
        document.body.innerHTML = ''
      } catch (error) {
        // If innerHTML fails, create a new body
        const newBody = document.createElement('body')
        if (document.body.parentNode) {
          document.body.parentNode.replaceChild(newBody, document.body)
        } else {
          document.documentElement.appendChild(newBody)
        }
      }
    }
  }
})

afterEach(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
  jest.clearAllMocks()

  // Clean up DOM to prevent memory leaks and test interference
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = ''
  }

  // Reset global mocks
  if (global.mockUsePathname) {
    global.mockUsePathname.mockReturnValue('/')
  }
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
