module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/app/tools/estimating-app/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'app/tools/estimating-app/**/*.js',
    'frontend/js/**/*.js',
    'core/**/*.py',
    '!frontend/js/main.js',
    '!**/node_modules/**',
    '!**/venv/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/js/$1',
    '^@core/(.*)$': '<rootDir>/core/$1'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testTimeout: 10000,
  verbose: true
};
