// Mock for @/stores/auth-store
const mockAuthStore = {
  user: {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    tier: 'pro',
    company: 'Test Company',
    licenseKey: 'test-license-key',
    organizationId: 'test-org',
    settings: {
      theme: 'light',
      notifications: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  session: {
    token: 'mock-jwt-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    refreshToken: 'mock-refresh-token'
  },
  login: jest.fn().mockResolvedValue({ success: true }),
  logout: jest.fn().mockResolvedValue({ success: true }),
  register: jest.fn().mockResolvedValue({ success: true }),
  updateProfile: jest.fn().mockResolvedValue({ success: true }),
  changePassword: jest.fn().mockResolvedValue({ success: true }),
  refreshSession: jest.fn().mockResolvedValue({ success: true }),
  validateSession: jest.fn().mockResolvedValue({ valid: true })
};

const useAuthStore = jest.fn(() => mockAuthStore);

module.exports = {
  useAuthStore,
  __esModule: true,
  default: useAuthStore
};
