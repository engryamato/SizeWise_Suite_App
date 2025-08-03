/**
 * Jest Configuration for Integration Tests
 * 
 * Specialized configuration for HVAC component integration testing
 * Part of Phase 1 bridging plan for comprehensive integration test coverage
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 */

module.exports = {
  // Set root directory to project root
  rootDir: '../../',

  // Test environment
  testEnvironment: 'jsdom',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.{js,ts,tsx}',
    '<rootDir>/tests/integration/**/*.integration.{js,ts,tsx}'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setup/integration-test-setup.ts'
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tests/tsconfig.test.json'
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds for integration tests
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // Specific thresholds for HVAC components
    './backend/services/calculations/': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    },
    './frontend/lib/services/': {
      branches: 75,
      functions: 80,
      lines: 75,
      statements: 75
    },
    './backend/compliance/': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'backend/services/calculations/**/*.{ts,js}',
    'backend/compliance/**/*.{ts,js,py}',
    'frontend/lib/services/**/*.{ts,tsx}',
    'shared/calculations/**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/*.test.{ts,js}',
    '!**/*.spec.{ts,js}',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  
  // Test timeout for integration tests (longer than unit tests)
  testTimeout: 30000,
  
  // Global setup and teardown
  // globalSetup: '<rootDir>/tests/integration/setup/global-setup.ts',
  // globalTeardown: '<rootDir>/tests/integration/setup/global-teardown.ts',
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Verbose output for integration tests
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test result processor
  // testResultsProcessor: '<rootDir>/tests/integration/processors/integration-results-processor.js',
  
  // Custom reporters
  reporters: [
    'default'
  ],
  
  // Environment variables for integration tests
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Watch plugins
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ],
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache/integration',
  
  // Globals for TypeScript
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tests/tsconfig.test.json',
      isolatedModules: true
    }
  },
  
  // Maximum worker processes for integration tests
  maxWorkers: '50%',
  
  // Note: retry option not supported in Jest, handled by CI/CD instead
  
  // Bail after first test suite failure
  bail: false,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Detect leaked timers
  detectLeaks: false
};
