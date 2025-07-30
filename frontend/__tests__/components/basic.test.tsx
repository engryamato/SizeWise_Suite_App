/**
 * Basic component tests for SizeWise Suite frontend
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Zustand store
jest.mock('../../stores/auth-store', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
  }),
}))

describe('Basic Component Tests', () => {
  test('renders without crashing', () => {
    // This is a basic smoke test to ensure the test environment is working
    const TestComponent = () => <div>Test Component</div>
    render(<TestComponent />)
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  test('test environment has required globals', () => {
    // Ensure test environment is properly configured
    expect(global.fetch).toBeDefined()
    expect(global.localStorage).toBeDefined()
    expect(global.sessionStorage).toBeDefined()
  })
})

// Test that our mocks are working
describe('Mock Verification', () => {
  test('Next.js router mock works', () => {
    const { useRouter } = require('next/navigation')
    const router = useRouter()
    expect(router.push).toBeDefined()
    expect(typeof router.push).toBe('function')
  })

  test('Auth store mock works', () => {
    const { useAuthStore } = require('../../stores/auth-store')
    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.login).toBeDefined()
    expect(typeof authStore.login).toBe('function')
  })
})
