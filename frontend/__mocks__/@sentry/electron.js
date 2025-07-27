/**
 * Mock for @sentry/electron in Jest test environment
 * Prevents Sentry from interfering with test execution while maintaining API compatibility
 */

// Mock Sentry Electron functions to prevent network calls and errors during testing
const mockSentryElectron = {
  // Core functions
  init: jest.fn(),
  captureException: jest.fn(() => 'mock-event-id'),
  captureMessage: jest.fn(() => 'mock-event-id'),
  captureEvent: jest.fn(() => 'mock-event-id'),
  
  // Scope management
  withScope: jest.fn((callback) => {
    const mockScope = {
      setTag: jest.fn(),
      setTags: jest.fn(),
      setContext: jest.fn(),
      setUser: jest.fn(),
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      clear: jest.fn(),
      addBreadcrumb: jest.fn(),
      setExtra: jest.fn(),
      setExtras: jest.fn(),
    };
    return callback(mockScope);
  }),
  
  getCurrentScope: jest.fn(() => ({
    setTag: jest.fn(),
    setTags: jest.fn(),
    setContext: jest.fn(),
    setUser: jest.fn(),
    setLevel: jest.fn(),
    setFingerprint: jest.fn(),
    clear: jest.fn(),
    addBreadcrumb: jest.fn(),
    setExtra: jest.fn(),
    setExtras: jest.fn(),
  })),
  
  // Configuration
  configureScope: jest.fn((callback) => {
    const mockScope = {
      setTag: jest.fn(),
      setTags: jest.fn(),
      setContext: jest.fn(),
      setUser: jest.fn(),
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      clear: jest.fn(),
      addBreadcrumb: jest.fn(),
      setExtra: jest.fn(),
      setExtras: jest.fn(),
    };
    return callback(mockScope);
  }),
  
  // Breadcrumbs
  addBreadcrumb: jest.fn(),
  
  // Performance monitoring
  startSpan: jest.fn((options, callback) => {
    const mockSpan = {
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
      isRecording: jest.fn(() => true),
    };
    
    if (callback) {
      return callback(mockSpan);
    }
    return mockSpan;
  }),
  
  startTransaction: jest.fn(() => ({
    setTag: jest.fn(),
    setData: jest.fn(),
    setStatus: jest.fn(),
    finish: jest.fn(),
    startChild: jest.fn(() => ({
      setTag: jest.fn(),
      setData: jest.fn(),
      setStatus: jest.fn(),
      finish: jest.fn(),
    })),
  })),
  
  // Electron-specific integrations
  electronMainIntegration: jest.fn(() => ({})),
  electronRendererIntegration: jest.fn(() => ({})),
  electronPreloadIntegration: jest.fn(() => ({})),
  
  // Session management
  startSession: jest.fn(),
  endSession: jest.fn(),
  captureSession: jest.fn(),
  
  // Hub management
  getCurrentHub: jest.fn(() => ({
    getClient: jest.fn(),
    getScope: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    captureEvent: jest.fn(),
    addBreadcrumb: jest.fn(),
    withScope: jest.fn(),
    configureScope: jest.fn(),
  })),
  
  // Client management
  getClient: jest.fn(() => ({
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    captureEvent: jest.fn(),
    getOptions: jest.fn(() => ({})),
  })),
  
  // Flush and close
  flush: jest.fn(() => Promise.resolve(true)),
  close: jest.fn(() => Promise.resolve(true)),
  
  // Utilities
  setUser: jest.fn(),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setContext: jest.fn(),
  setExtra: jest.fn(),
  setExtras: jest.fn(),
  setLevel: jest.fn(),
  
  // Constants
  Severity: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
    Debug: 'debug',
  },
  
  // Electron-specific utilities
  IPCMode: {
    Classic: 'classic',
    Protocol: 'protocol',
    Both: 'both',
  },
};

// Export all functions
module.exports = mockSentryElectron;

// Also support ES6 imports
module.exports.default = mockSentryElectron;

// Individual exports for destructuring
Object.keys(mockSentryElectron).forEach(key => {
  module.exports[key] = mockSentryElectron[key];
});
