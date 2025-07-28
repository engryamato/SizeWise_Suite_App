/**
 * Jest Configuration - Comprehensive Testing Setup
 * 
 * MISSION-CRITICAL: Jest configuration for unit and integration testing
 * Provides optimized testing environment for all SizeWise Suite components
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.3
 */

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Root directory - set to frontend directory
  rootDir: '../../',

  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directories
  roots: ['<rootDir>/app', '<rootDir>/components', '<rootDir>/lib', '<rootDir>/tests'],

  // Module paths
  modulePaths: ['<rootDir>/app', '<rootDir>/components', '<rootDir>/lib'],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@backend/(.*)$': '<rootDir>/../backend/$1',
    '^@electron/(.*)$': '<rootDir>/../electron/$1',
    '^../backend/(.*)$': '<rootDir>/__mocks__/backend/$1',
    '^../../backend/(.*)$': '<rootDir>/__mocks__/backend/$1',
    '^../../../../backend/(.*)$': '<rootDir>/__mocks__/backend/$1',
    '^../../../electron/(.*)$': '<rootDir>/__mocks__/electron/$1',
    '^@/stores/(.*)$': '<rootDir>/__mocks__/stores/$1',
    '^@/lib/hooks/useFeatureFlag$': '<rootDir>/__mocks__/@/lib/hooks/useFeatureFlag.js',
    'better-sqlite3': '<rootDir>/__mocks__/better-sqlite3.js',
    'canvas': '<rootDir>/__mocks__/canvas.js',
    'konva': '<rootDir>/__mocks__/konva.js',
    '^uuid$': '<rootDir>/__mocks__/uuid.js',
    'lucide-react': '<rootDir>/__mocks__/lucide-react.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css',
    '^.+\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-file'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@jest|uuid|konva))'
  ],
  
  // Test match patterns - only Jest tests, exclude Playwright
  testMatch: [
    '<rootDir>/**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/**/tests/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/lib/**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/lib/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/components/**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/components/**/*.test.(ts|tsx|js|jsx)'
  ],
  
  // Test ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/tests/e2e/',
    '\\.spec\\.(ts|tsx)$',
    'playwright\\.config\\.(ts|js)$'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/config/jest.setup.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/hooks/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/components/tier/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Test timeout
  testTimeout: 10000,
  
  // Performance settings
  maxWorkers: '50%',
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Clear mocks
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Global setup/teardown
  globalSetup: '<rootDir>/tests/config/global-setup.ts',
  globalTeardown: '<rootDir>/tests/config/global-teardown.ts',
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  // Resolver - commented out as file doesn't exist
  // resolver: '<rootDir>/tests/config/jest.resolver.js',
  
  // Watch plugins - commented out as packages not installed
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ],
  
  // Reporters - simplified to default only
  reporters: ['default'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true
    },
    __DEV__: true,
    __TEST__: true,
    __PROD__: false
  }
};

export default config;
