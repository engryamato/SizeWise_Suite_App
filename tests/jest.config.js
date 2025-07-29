/**
 * Jest Configuration for SizeWise Suite Frontend Testing
 * 
 * Comprehensive configuration for unit and integration testing including:
 * - TypeScript support
 * - React Testing Library integration
 * - Coverage reporting
 * - Mock configurations
 * - Performance testing
 */

const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directory
  rootDir: path.resolve(__dirname, '..'),
  
  // Test directories
  testMatch: [
    '<rootDir>/tests/frontend/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/frontend/$1',
    '^@components/(.*)$': '<rootDir>/frontend/components/$1',
    '^@lib/(.*)$': '<rootDir>/frontend/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/frontend/lib/hooks/$1',
    '^@services/(.*)$': '<rootDir>/frontend/lib/services/$1',
    '^@utils/(.*)$': '<rootDir>/frontend/lib/utils/$1',
    '^@types/(.*)$': '<rootDir>/frontend/types/$1',
    '^@styles/(.*)$': '<rootDir>/frontend/styles/$1',
    '^@public/(.*)$': '<rootDir>/frontend/public/$1'
  },
  
  // File extensions to consider
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread'
      ]
    }],
    '^.+\\.css$': 'jest-transform-css',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': 'jest-transform-file'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@babel|react-dnd|dnd-core|recharts))'
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/.next/'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'frontend/**/*.{js,jsx,ts,tsx}',
    '!frontend/**/*.d.ts',
    '!frontend/**/*.stories.{js,jsx,ts,tsx}',
    '!frontend/**/*.config.{js,ts}',
    '!frontend/**/index.{js,ts}',
    '!frontend/public/**',
    '!frontend/.next/**',
    '!frontend/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    './frontend/components/': {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95
    },
    './frontend/lib/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './frontend/lib/hooks/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/frontend/tsconfig.json'
    }
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-html-reporters', {
      publicPath: '<rootDir>/test-results',
      filename: 'jest-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'SizeWise Suite Test Report'
    }]
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Snapshot serializers
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ],
  
  // Test result processor
  testResultsProcessor: '<rootDir>/tests/utils/testResultsProcessor.js',
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js',
    '<rootDir>/tests/setup/customMatchers.js'
  ],
  
  // Performance testing configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/frontend/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/integration.setup.js'
      ]
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/performance.setup.js'
      ],
      testTimeout: 30000
    }
  ]
};

// Environment-specific configurations
if (process.env.CI) {
  // CI-specific settings
  module.exports.maxWorkers = 2;
  module.exports.cache = false;
  module.exports.watchman = false;
}

if (process.env.NODE_ENV === 'development') {
  // Development settings
  module.exports.watch = true;
  module.exports.watchAll = false;
  module.exports.collectCoverage = false;
}
