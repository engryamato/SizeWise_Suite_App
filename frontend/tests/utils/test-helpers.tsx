/**
 * Test Helpers - Shared Testing Utilities
 * 
 * MISSION-CRITICAL: Comprehensive testing utilities for SizeWise Suite
 * Provides mock data, test helpers, and validation utilities
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.3
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';

/**
 * Test tier configurations
 */
export const TEST_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    features: ['air_duct_sizer', 'basic_calculations', 'pdf_export'],
    limits: {
      projects: 3,
      calculations_per_day: 50,
      export_formats: ['pdf', 'json'],
      file_size_mb: 10
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    features: [
      'air_duct_sizer',
      'basic_calculations',
      'advanced_calculations',
      'unlimited_projects',
      'high_res_export',
      'excel_export',
      'pdf_import'
    ],
    limits: {
      projects: -1, // unlimited
      calculations_per_day: 1000,
      export_formats: ['pdf', 'json', 'png', 'jpg', 'excel'],
      file_size_mb: 100
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    features: [
      'air_duct_sizer',
      'basic_calculations',
      'advanced_calculations',
      'unlimited_projects',
      'high_res_export',
      'excel_export',
      'pdf_import',
      'cad_import',
      'api_access',
      'custom_branding',
      'priority_support'
    ],
    limits: {
      projects: -1, // unlimited
      calculations_per_day: -1, // unlimited
      export_formats: ['pdf', 'json', 'png', 'jpg', 'excel', 'dwg', 'ifc'],
      file_size_mb: 1024
    }
  }
};

/**
 * Test user configurations
 */
export const TEST_USERS = {
  freeUser: {
    id: 'user-free-123',
    email: 'free@test.com',
    name: 'Free User',
    tier: 'free',
    subscription: {
      status: 'trial',
      trialDaysRemaining: 14
    }
  },
  proUser: {
    id: 'user-pro-456',
    email: 'pro@test.com',
    name: 'Pro User',
    tier: 'pro',
    subscription: {
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  },
  enterpriseUser: {
    id: 'user-enterprise-789',
    email: 'enterprise@test.com',
    name: 'Enterprise User',
    tier: 'enterprise',
    subscription: {
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  }
};

/**
 * Test project data
 */
export const TEST_PROJECTS = {
  basic: {
    id: 'project-basic-1',
    name: 'Basic HVAC Project',
    description: 'Simple duct sizing project',
    calculations: [
      {
        id: 'calc-1',
        type: 'round_duct',
        inputs: { airflow: 1000, velocity: 1500 },
        results: { diameter: 12.7, pressure_loss: 0.08 }
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02')
  },
  advanced: {
    id: 'project-advanced-2',
    name: 'Advanced HVAC System',
    description: 'Complex multi-zone system',
    calculations: [
      {
        id: 'calc-2',
        type: 'rectangular_duct',
        inputs: { airflow: 2000, width: 12, height: 8 },
        results: { velocity: 2083, pressure_loss: 0.15 }
      },
      {
        id: 'calc-3',
        type: 'fitting_loss',
        inputs: { fitting_type: 'elbow_90', velocity: 2083 },
        results: { pressure_loss: 0.25 }
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }
};

/**
 * Test feature flags
 */
export const TEST_FEATURE_FLAGS = {
  air_duct_sizer: { enabled: true, tier: 'free' },
  basic_calculations: { enabled: true, tier: 'free' },
  advanced_calculations: { enabled: true, tier: 'pro' },
  unlimited_projects: { enabled: true, tier: 'pro' },
  high_res_export: { enabled: true, tier: 'pro' },
  excel_export: { enabled: true, tier: 'pro' },
  pdf_import: { enabled: true, tier: 'pro' },
  cad_import: { enabled: true, tier: 'enterprise' },
  api_access: { enabled: true, tier: 'enterprise' },
  custom_branding: { enabled: true, tier: 'enterprise' }
};

/**
 * Custom render function with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTier?: 'free' | 'pro' | 'enterprise';
  initialUser?: typeof TEST_USERS.freeUser;
  queryClient?: QueryClient;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    initialTier = 'free',
    initialUser = TEST_USERS.freeUser,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    route = '/',
    ...renderOptions
  } = options;

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Performance testing utilities
 */
export function measureRenderPerformance(
  renderFn: () => RenderResult,
  maxTime: number = 100
): { result: RenderResult; duration: number; withinLimit: boolean } {
  const start = performance.now();
  const result = renderFn();
  const end = performance.now();
  const duration = end - start;

  return {
    result,
    duration,
    withinLimit: duration <= maxTime
  };
}

export async function measureAsyncPerformance<T>(
  asyncFn: () => Promise<T>,
  maxTime: number = 1000
): Promise<{ result: T; duration: number; withinLimit: boolean }> {
  const start = performance.now();
  const result = await asyncFn();
  const end = performance.now();
  const duration = end - start;

  return {
    result,
    duration,
    withinLimit: duration <= maxTime
  };
}

/**
 * Mock API responses
 */
export const mockApiResponses = {
  featureFlags: (tier: string) => ({
    features: Object.entries(TEST_FEATURE_FLAGS)
      .filter(([_, config]) => {
        const tierOrder = ['free', 'pro', 'enterprise'];
        const userTierIndex = tierOrder.indexOf(tier);
        const featureTierIndex = tierOrder.indexOf(config.tier);
        return userTierIndex >= featureTierIndex;
      })
      .reduce((acc, [feature, config]) => ({
        ...acc,
        [feature]: config.enabled
      }), {})
  }),

  tierValidation: (tier: string, feature: string) => {
    const tierOrder = ['free', 'pro', 'enterprise'];
    const userTierIndex = tierOrder.indexOf(tier);
    const featureFlag = TEST_FEATURE_FLAGS[feature as keyof typeof TEST_FEATURE_FLAGS];
    const requiredTierIndex = tierOrder.indexOf(featureFlag?.tier || 'enterprise');
    
    return {
      allowed: userTierIndex >= requiredTierIndex,
      currentTier: tier,
      requiredTier: featureFlag?.tier || 'enterprise',
      feature
    };
  },

  projectValidation: (tier: string, projectCount: number) => {
    const tierData = TEST_TIERS[tier as keyof typeof TEST_TIERS];
    const limits = tierData?.limits;
    const maxProjects = limits?.projects || 0;
    
    return {
      allowed: maxProjects === -1 || projectCount < maxProjects,
      currentCount: projectCount,
      maxAllowed: maxProjects,
      tier
    };
  }
};

/**
 * Test data generators
 */
export function generateTestProject(overrides: Partial<typeof TEST_PROJECTS.basic> = {}) {
  return {
    ...TEST_PROJECTS.basic,
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides
  };
}

export function generateTestUser(tier: 'free' | 'pro' | 'enterprise' = 'free') {
  const baseUser = TEST_USERS[`${tier}User`];
  return {
    ...baseUser,
    id: `user-${tier}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
}

export function generateTestCalculation(type: string = 'round_duct') {
  return {
    id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    inputs: { airflow: 1000, velocity: 1500 },
    results: { diameter: 12.7, pressure_loss: 0.08 },
    timestamp: new Date()
  };
}



/**
 * Wait utilities
 */
export function waitForNextTick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock cleanup utilities
 */
export function clearAllMocks() {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.restoreAllMocks();
}

export function resetTestEnvironment() {
  clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset fetch mock
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear();
  }
}

/**
 * Feature flag testing utilities
 */
export function mockFeatureFlag(feature: string, enabled: boolean, tier?: string) {
  return {
    [feature]: {
      enabled,
      tier: tier || 'free',
      timestamp: Date.now()
    }
  };
}

export function mockTierValidation(
  tier: 'free' | 'pro' | 'enterprise',
  feature: string,
  allowed: boolean = true
) {
  const featureFlag = TEST_FEATURE_FLAGS[feature as keyof typeof TEST_FEATURE_FLAGS];
  return {
    allowed,
    currentTier: tier,
    requiredTier: featureFlag?.tier || 'free',
    feature,
    reason: allowed ? undefined : `${feature} requires ${featureFlag?.tier} tier`
  };
}

export default {
  TEST_TIERS,
  TEST_USERS,
  TEST_PROJECTS,
  TEST_FEATURE_FLAGS,
  renderWithProviders,
  measureRenderPerformance,
  measureAsyncPerformance,
  mockApiResponses,
  generateTestProject,
  generateTestUser,
  generateTestCalculation,
  waitForNextTick,
  waitFor,
  clearAllMocks,
  resetTestEnvironment,
  mockFeatureFlag,
  mockTierValidation
};
