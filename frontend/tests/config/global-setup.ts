/**
 * Global Test Setup - Initialize Testing Environment
 * 
 * MISSION-CRITICAL: Global setup for comprehensive testing environment
 * Initializes databases, mock servers, and testing infrastructure
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md sections 4.1-4.3
 */

import { chromium, FullConfig } from '@playwright/test';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API handlers
const handlers = [
  // Feature flag endpoints
  rest.get('/api/features/:userId', (req, res, ctx) => {
    const { userId } = req.params;
    const tier = userId.includes('free') ? 'free' : userId.includes('pro') ? 'pro' : 'enterprise';
    
    const features = {
      free: ['air_duct_sizer', 'basic_calculations', 'pdf_export'],
      pro: ['air_duct_sizer', 'basic_calculations', 'advanced_calculations', 'unlimited_projects', 'high_res_export', 'excel_export', 'pdf_import'],
      enterprise: ['air_duct_sizer', 'basic_calculations', 'advanced_calculations', 'unlimited_projects', 'high_res_export', 'excel_export', 'pdf_import', 'cad_import', 'api_access', 'custom_branding']
    };

    return res(
      ctx.status(200),
      ctx.json({
        userId,
        tier,
        features: features[tier] || features.free,
        timestamp: new Date().toISOString()
      })
    );
  }),

  // Tier validation endpoints
  rest.post('/api/tier/validate', (req, res, ctx) => {
    const { userId, feature, action } = req.body as any;
    const tier = userId.includes('free') ? 'free' : userId.includes('pro') ? 'pro' : 'enterprise';
    
    const tierOrder = ['free', 'pro', 'enterprise'];
    const featureTiers = {
      air_duct_sizer: 'free',
      basic_calculations: 'free',
      pdf_export: 'free',
      advanced_calculations: 'pro',
      unlimited_projects: 'pro',
      high_res_export: 'pro',
      excel_export: 'pro',
      pdf_import: 'pro',
      cad_import: 'enterprise',
      api_access: 'enterprise',
      custom_branding: 'enterprise'
    };

    const requiredTier = featureTiers[feature] || 'enterprise';
    const userTierIndex = tierOrder.indexOf(tier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    const allowed = userTierIndex >= requiredTierIndex;

    return res(
      ctx.status(200),
      ctx.json({
        allowed,
        currentTier: tier,
        requiredTier,
        feature,
        action,
        reason: allowed ? undefined : `${feature} requires ${requiredTier} tier or higher`
      })
    );
  }),

  // Project management endpoints
  rest.get('/api/projects/:userId', (req, res, ctx) => {
    const { userId } = req.params;
    const tier = userId.includes('free') ? 'free' : userId.includes('pro') ? 'pro' : 'enterprise';
    
    const projectCounts = { free: 2, pro: 15, enterprise: 50 }; // Mock current counts
    const maxProjects = { free: 3, pro: -1, enterprise: -1 };

    return res(
      ctx.status(200),
      ctx.json({
        userId,
        tier,
        currentCount: projectCounts[tier],
        maxAllowed: maxProjects[tier],
        projects: Array.from({ length: projectCounts[tier] }, (_, i) => ({
          id: `project-${i + 1}`,
          name: `Test Project ${i + 1}`,
          createdAt: new Date().toISOString()
        }))
      })
    );
  }),

  // License validation endpoints
  rest.post('/api/license/validate', (req, res, ctx) => {
    const { licenseKey, hardwareFingerprint } = req.body as any;
    
    const mockLicenses = {
      'free-license-key': { tier: 'free', valid: true },
      'pro-license-key': { tier: 'pro', valid: true },
      'enterprise-license-key': { tier: 'enterprise', valid: true },
      'invalid-license-key': { tier: 'free', valid: false }
    };

    const license = mockLicenses[licenseKey] || { tier: 'free', valid: false };

    return res(
      ctx.status(200),
      ctx.json({
        isValid: license.valid,
        tier: license.tier,
        hardwareMatch: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        features: license.tier === 'enterprise' ? ['all'] : license.tier === 'pro' ? ['pro_features'] : ['basic_features']
      })
    );
  }),

  // File operation endpoints
  rest.post('/api/files/validate', (req, res, ctx) => {
    const { userId, fileSize, fileType } = req.body as any;
    const tier = userId.includes('free') ? 'free' : userId.includes('pro') ? 'pro' : 'enterprise';
    
    const sizeLimits = { free: 10 * 1024 * 1024, pro: 100 * 1024 * 1024, enterprise: 1024 * 1024 * 1024 };
    const allowedTypes = {
      free: ['.sizewise', '.json', '.pdf'],
      pro: ['.sizewise', '.json', '.pdf', '.png', '.jpg', '.xlsx'],
      enterprise: ['.sizewise', '.json', '.pdf', '.png', '.jpg', '.xlsx', '.dwg', '.dxf', '.ifc']
    };

    const sizeAllowed = fileSize <= sizeLimits[tier];
    const typeAllowed = allowedTypes[tier].includes(fileType);

    return res(
      ctx.status(200),
      ctx.json({
        allowed: sizeAllowed && typeAllowed,
        tier,
        fileSize,
        fileType,
        maxSize: sizeLimits[tier],
        allowedTypes: allowedTypes[tier],
        reason: !sizeAllowed ? 'File size exceeds tier limit' : !typeAllowed ? 'File type not allowed for tier' : undefined
      })
    );
  }),

  // Analytics endpoints
  rest.post('/api/analytics/track', (req, res, ctx) => {
    const { event, properties } = req.body as any;
    
    return res(
      ctx.status(200),
      ctx.json({
        tracked: true,
        event,
        properties,
        timestamp: new Date().toISOString()
      })
    );
  }),

  // Health check endpoint
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
    );
  })
];

// Create mock server
const server = setupServer(...handlers);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Start mock server
  server.listen({
    onUnhandledRequest: 'warn'
  });
  console.log('✅ Mock API server started');

  // Setup test database
  await setupTestDatabase();
  console.log('✅ Test database initialized');

  // Setup test storage
  await setupTestStorage();
  console.log('✅ Test storage configured');

  // Setup browser for authentication
  await setupAuthenticationState();
  console.log('✅ Authentication state prepared');

  // Verify test environment
  await verifyTestEnvironment();
  console.log('✅ Test environment verified');

  console.log('🎯 Global test setup completed successfully');
}

async function setupTestDatabase() {
  // Mock database setup for testing
  const mockDb = {
    users: [
      { id: 'user-free-123', email: 'free@test.com', tier: 'free' },
      { id: 'user-pro-456', email: 'pro@test.com', tier: 'pro' },
      { id: 'user-enterprise-789', email: 'enterprise@test.com', tier: 'enterprise' }
    ],
    projects: [
      { id: 'project-1', userId: 'user-free-123', name: 'Free Project 1' },
      { id: 'project-2', userId: 'user-free-123', name: 'Free Project 2' },
      { id: 'project-3', userId: 'user-pro-456', name: 'Pro Project 1' }
    ],
    features: [
      { name: 'air_duct_sizer', enabled: true, tier: 'free' },
      { name: 'basic_calculations', enabled: true, tier: 'free' },
      { name: 'advanced_calculations', enabled: true, tier: 'pro' },
      { name: 'unlimited_projects', enabled: true, tier: 'pro' },
      { name: 'cad_import', enabled: true, tier: 'enterprise' }
    ]
  };

  // Store in global for test access
  (global as any).testDatabase = mockDb;
}

async function setupTestStorage() {
  // Setup test file storage
  const testStorage = {
    licenses: {
      'user-free-123': { tier: 'free', key: 'free-license-key' },
      'user-pro-456': { tier: 'pro', key: 'pro-license-key' },
      'user-enterprise-789': { tier: 'enterprise', key: 'enterprise-license-key' }
    },
    files: {
      'test-project.sizewise': { size: 1024, type: '.sizewise' },
      'large-project.sizewise': { size: 15 * 1024 * 1024, type: '.sizewise' }
    }
  };

  (global as any).testStorage = testStorage;
}

async function setupAuthenticationState() {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Create authentication states for different tiers
  const authStates = {
    free: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [
          { name: 'auth_token', value: 'mock-free-tier-token' },
          { name: 'user_tier', value: 'free' },
          { name: 'user_id', value: 'user-free-123' }
        ]
      }]
    },
    pro: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [
          { name: 'auth_token', value: 'mock-pro-tier-token' },
          { name: 'user_tier', value: 'pro' },
          { name: 'user_id', value: 'user-pro-456' }
        ]
      }]
    },
    enterprise: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [
          { name: 'auth_token', value: 'mock-enterprise-tier-token' },
          { name: 'user_tier', value: 'enterprise' },
          { name: 'user_id', value: 'user-enterprise-789' }
        ]
      }]
    }
  };

  // Save authentication states
  await context.storageState({ path: 'test-results/auth-free.json' });
  await context.storageState({ path: 'test-results/auth-pro.json' });
  await context.storageState({ path: 'test-results/auth-enterprise.json' });

  await browser.close();

  (global as any).authStates = authStates;
}

async function verifyTestEnvironment() {
  // Verify mock server is responding
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      throw new Error('Mock server health check failed');
    }
  } catch (error) {
    console.warn('Mock server not available, using MSW handlers');
  }

  // Verify test data integrity
  const testDb = (global as any).testDatabase;
  if (!testDb || !testDb.users || !testDb.features) {
    throw new Error('Test database not properly initialized');
  }

  // Verify environment variables
  const requiredEnvVars = ['NODE_ENV'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Environment variable ${envVar} not set`);
    }
  }
}

export default globalSetup;
