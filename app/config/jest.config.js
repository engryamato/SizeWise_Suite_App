module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/app/tests/setup.js'],
  testMatch: [
    '<rootDir>/app/tests/**/*.test.js',
    '<rootDir>/app/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'app/templates/frontend/js/**/*.js',
    'app/core/**/*.py',
    '!app/templates/frontend/js/main.js',
    '!**/node_modules/**',
    '!**/venv/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/templates/frontend/js/$1',
    '^@core/(.*)$': '<rootDir>/app/core/$1'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testTimeout: 10000,
  verbose: true
};
