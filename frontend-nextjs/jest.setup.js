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
