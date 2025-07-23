module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'core/**/*.py',
    'backend/**/*.py',
    '!**/node_modules/**',
    '!**/venv/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testTimeout: 10000,
  verbose: true
};
