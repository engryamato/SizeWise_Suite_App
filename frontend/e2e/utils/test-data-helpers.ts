import { Page } from '@playwright/test';

/**
 * Test Data Helpers for E2E Tests
 * 
 * Provides utilities for creating consistent test data and managing
 * test scenarios across different E2E test suites.
 */

export interface TestProject {
  name: string;
  description: string;
  type: 'air-duct' | 'grease-duct' | 'engine-exhaust' | 'boiler-vent';
  calculations: TestCalculation[];
}

export interface TestCalculation {
  type: string;
  parameters: Record<string, any>;
  expectedResults?: Record<string, any>;
}

export interface TestUser {
  id: string;
  tier: 'trial' | 'free' | 'premium';
  token: string;
  permissions: string[];
}

export class TestDataHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Create a test user with specified tier and permissions
   */
  async createTestUser(tier: 'trial' | 'free' | 'premium' = 'premium'): Promise<TestUser> {
    const user: TestUser = {
      id: `test-user-${Date.now()}`,
      tier,
      token: `test-token-${Date.now()}`,
      permissions: this.getTierPermissions(tier)
    };

    await this.page.evaluate((userData) => {
      localStorage.setItem('auth-token', userData.token);
      localStorage.setItem('user-tier', userData.tier);
      localStorage.setItem('user-id', userData.id);
      localStorage.setItem('user-permissions', JSON.stringify(userData.permissions));
    }, user);

    return user;
  }

  /**
   * Get permissions for a specific tier
   */
  private getTierPermissions(tier: string): string[] {
    const permissions: Record<string, string[]> = {
      trial: ['basic-calculations', 'limited-projects'],
      free: ['basic-calculations', 'limited-projects', 'basic-export'],
      premium: ['all-calculations', 'unlimited-projects', 'advanced-export', '3d-visualization', 'compliance-reports']
    };
    return permissions[tier] || permissions.free;
  }

  /**
   * Create test calculation data for different HVAC scenarios
   */
  getTestCalculations(): Record<string, TestCalculation[]> {
    return {
      'air-duct': [
        {
          type: 'round-duct',
          parameters: {
            airflow: 1000,
            velocity: 1200,
            ductType: 'round',
            material: 'galvanized-steel',
            units: 'imperial'
          },
          expectedResults: {
            diameter: { min: 10, max: 14 },
            velocity: { min: 800, max: 1500 },
            pressureLoss: { min: 0.05, max: 0.15 }
          }
        },
        {
          type: 'rectangular-duct',
          parameters: {
            airflow: 2000,
            velocity: 1000,
            ductType: 'rectangular',
            material: 'galvanized-steel',
            units: 'imperial'
          },
          expectedResults: {
            width: { min: 12, max: 20 },
            height: { min: 8, max: 16 },
            velocity: { min: 900, max: 1100 }
          }
        }
      ],
      'grease-duct': [
        {
          type: 'commercial-kitchen',
          parameters: {
            exhaustFlow: 1500,
            applianceType: 'fryer',
            ductMaterial: 'stainless-steel',
            ductLength: 25,
            units: 'imperial'
          },
          expectedResults: {
            diameter: { min: 8, max: 12 },
            velocity: { min: 1500, max: 2500 },
            compliance: 'NFPA-96'
          }
        }
      ],
      'engine-exhaust': [
        {
          type: 'diesel-generator',
          parameters: {
            engineType: 'diesel-generator',
            power: 500,
            powerUnits: 'kw',
            fuelType: 'diesel'
          },
          expectedResults: {
            exhaustFlow: { min: 2000, max: 4000 },
            pipeDiameter: { min: 6, max: 12 },
            backPressure: { max: 10 }
          }
        }
      ]
    };
  }

  /**
   * Create a test project with calculations
   */
  async createTestProject(projectData: Partial<TestProject>): Promise<TestProject> {
    const project: TestProject = {
      name: projectData.name || `Test Project ${Date.now()}`,
      description: projectData.description || 'Automated test project',
      type: projectData.type || 'air-duct',
      calculations: projectData.calculations || []
    };

    // Navigate to dashboard and create project
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');

    await this.page.click('[data-testid="new-project-button"]');
    await this.page.fill('[data-testid="project-name-input"]', project.name);
    await this.page.fill('[data-testid="project-description-input"]', project.description);
    await this.page.click('[data-testid="create-project-button"]');

    await this.page.waitForSelector('[data-testid="project-created-success"]', { timeout: 10000 });

    return project;
  }

  /**
   * Perform a calculation with given parameters
   */
  async performCalculation(calculation: TestCalculation, toolPath: string): Promise<any> {
    await this.page.goto(toolPath);
    await this.page.waitForLoadState('networkidle');

    // Fill in parameters based on calculation type
    for (const [key, value] of Object.entries(calculation.parameters)) {
      const selector = `[data-testid="${this.parameterToSelector(key)}"]`;
      
      try {
        // Check if it's a select element
        const element = await this.page.locator(selector).first();
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          await this.page.selectOption(selector, value.toString());
        } else {
          await this.page.fill(selector, value.toString());
        }
      } catch (error) {
        console.warn(`Could not fill parameter ${key} with value ${value}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Perform calculation
    await this.page.click('[data-testid="calculate-button"]');
    await this.page.waitForSelector('[data-testid="calculation-results"]', { timeout: 15000 });

    // Extract results
    const results = await this.extractCalculationResults();
    return results;
  }

  /**
   * Convert parameter name to test selector format
   */
  private parameterToSelector(parameterName: string): string {
    return parameterName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '') + '-input';
  }

  /**
   * Extract calculation results from the page
   */
  private async extractCalculationResults(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    // Common result selectors
    const resultSelectors = [
      'diameter', 'width', 'height', 'velocity', 'pressure-loss',
      'exhaust-flow', 'pipe-diameter', 'back-pressure'
    ];

    for (const selector of resultSelectors) {
      try {
        const element = this.page.locator(`[data-testid="${selector}"]`);
        if (await element.isVisible()) {
          const text = await element.textContent();
          const numericValue = this.extractNumericValue(text);
          if (numericValue !== null) {
            results[selector.replace('-', '_')] = numericValue;
          }
        }
      } catch (error) {
        // Selector not found, continue
      }
    }

    return results;
  }

  /**
   * Extract numeric value from text content
   */
  private extractNumericValue(text: string | null): number | null {
    if (!text) return null;
    
    const match = text.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Validate calculation results against expected values
   */
  validateResults(actual: Record<string, any>, expected: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(expected)) {
      const actualValue = actual[key];
      
      if (actualValue === undefined) {
        console.warn(`Expected result ${key} not found in actual results`);
        return false;
      }

      if (typeof expectedValue === 'object' && expectedValue.min !== undefined) {
        // Range validation
        if (actualValue < expectedValue.min || actualValue > expectedValue.max) {
          console.warn(`Result ${key} (${actualValue}) outside expected range [${expectedValue.min}, ${expectedValue.max}]`);
          return false;
        }
      } else if (typeof expectedValue === 'number') {
        // Exact value with tolerance
        const tolerance = expectedValue * 0.1; // 10% tolerance
        if (Math.abs(actualValue - expectedValue) > tolerance) {
          console.warn(`Result ${key} (${actualValue}) differs from expected (${expectedValue}) by more than 10%`);
          return false;
        }
      } else if (actualValue !== expectedValue) {
        console.warn(`Result ${key} (${actualValue}) does not match expected (${expectedValue})`);
        return false;
      }
    }

    return true;
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    // Clear localStorage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear IndexedDB if available
    await this.page.evaluate(async () => {
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && db.name.includes('test')) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (error) {
          console.warn('Could not clean IndexedDB:', error);
        }
      }
    });
  }

  /**
   * Setup mock API responses for testing
   */
  async setupMockResponses(): Promise<void> {
    // Mock successful calculation responses
    await this.page.route('**/api/calculations/**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (method === 'POST') {
        const mockResponse = {
          success: true,
          results: {
            diameter: { value: 12.5, unit: 'inches' },
            velocity: { value: 1150, unit: 'fpm' },
            pressure_loss: { value: 0.08, unit: 'in_wg_per_100ft' }
          },
          metadata: {
            calculation_time: Date.now(),
            version: '1.0.0'
          }
        };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
      } else {
        await route.continue();
      }
    });

    // Mock project save responses
    await this.page.route('**/api/projects/**', async route => {
      const method = route.request().method();
      
      if (method === 'POST' || method === 'PUT') {
        const mockResponse = {
          success: true,
          project_id: `test-project-${Date.now()}`,
          message: 'Project saved successfully'
        };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Generate performance test data
   */
  generatePerformanceTestData(count: number): TestProject[] {
    const projects: TestProject[] = [];
    
    for (let i = 0; i < count; i++) {
      projects.push({
        name: `Performance Test Project ${i + 1}`,
        description: `Generated project ${i + 1} for performance testing`,
        type: ['air-duct', 'grease-duct', 'engine-exhaust'][i % 3] as any,
        calculations: this.generateRandomCalculations(3)
      });
    }
    
    return projects;
  }

  /**
   * Generate random calculations for testing
   */
  private generateRandomCalculations(count: number): TestCalculation[] {
    const calculations: TestCalculation[] = [];
    
    for (let i = 0; i < count; i++) {
      calculations.push({
        type: 'random-test',
        parameters: {
          airflow: 1000 + (Math.random() * 2000),
          velocity: 800 + (Math.random() * 1000),
          ductType: Math.random() > 0.5 ? 'round' : 'rectangular',
          material: 'galvanized-steel',
          units: 'imperial'
        }
      });
    }
    
    return calculations;
  }
}
