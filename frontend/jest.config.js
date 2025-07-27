const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',  // Exclude Playwright tests
    '<rootDir>/__tests__/e2e/',  // Exclude E2E tests from Jest
    '<rootDir>/tests/e2e/',  // Exclude E2E tests from Jest
    '<rootDir>/test-results/',  // Exclude Playwright test results
    '<rootDir>/playwright-report/',  // Exclude Playwright reports
    '\\.spec\\.(ts|tsx|js|jsx)$',  // Exclude .spec files (Playwright)
    'playwright\\.config\\.(ts|js)$'  // Exclude Playwright config
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@backend/(.*)$': '<rootDir>/__mocks__/backend/$1',
    '^@electron/(.*)$': '<rootDir>/__mocks__/electron/$1',
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
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'stores/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/tests/**/*.test.{js,jsx,ts,tsx}',
    '!**/tests/e2e/**',
    '!**/*.spec.{js,jsx,ts,tsx}',
  ],
  testTimeout: 10000,

  // Transform ignore patterns for ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@jest|uuid|konva))'
  ],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
