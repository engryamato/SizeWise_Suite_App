/**
 * User Account Management Testing - Offline-First Desktop Version
 * 
 * Comprehensive E2E testing for user account creation, super admin access,
 * tier management, and offline-first functionality with SQLite database integration.
 * 
 * Test Coverage:
 * 1. User Account Creation Testing
 * 2. Super Admin Access Validation  
 * 3. Database Integration Testing
 * 4. Offline-First Functionality
 * 
 * @see docs/testing/e2e-testing-guide.md
 * @see docs/implementation/offline-first-architecture.md
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  superAdminCredentials: {
    email: 'super@sizewise.com',
    password: 'SuperAdmin123!'
  },
  testUsers: [
    {
      email: 'test.user1@example.com',
      password: 'TestUser123!',
      name: 'Test User One',
      company: 'Test Company A',
      tier: 'free' as const
    },
    {
      email: 'test.user2@example.com', 
      password: 'TestUser456!',
      name: 'Test User Two',
      company: 'Test Company B',
      tier: 'pro' as const
    }
  ]
};

// Test utilities
class UserAccountTestUtils {
  constructor(private page: Page) {}

  async navigateToLogin() {
    await this.page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToRegistration() {
    await this.page.goto(`${TEST_CONFIG.baseUrl}/register`);
    await this.page.waitForLoadState('networkidle');
  }

  async loginAsSuperAdmin() {
    await this.navigateToLogin();
    
    await this.page.fill('[data-testid="email-input"]', TEST_CONFIG.superAdminCredentials.email);
    await this.page.fill('[data-testid="password-input"]', TEST_CONFIG.superAdminCredentials.password);
    
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('**/dashboard');
    
    // Verify super admin access
    await expect(this.page.locator('[data-testid="super-admin-panel"]')).toBeVisible();
  }

  async createTestUser(userIndex: number = 0) {
    const user = TEST_CONFIG.testUsers[userIndex];
    
    await this.navigateToRegistration();
    
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    await this.page.fill('[data-testid="name-input"]', user.name);
    await this.page.fill('[data-testid="company-input"]', user.company);
    
    await this.page.click('[data-testid="register-button"]');
    
    return user;
  }

  async verifyUserInDatabase(email: string) {
    // Execute database query to verify user exists
    const result = await this.page.evaluate(async (userEmail) => {
      // Access the database through the application's API
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      return response.json();
    }, email);
    
    return result;
  }

  async checkOfflineMode() {
    // Simulate offline mode by intercepting network requests
    await this.page.route('**/*', route => {
      if (route.request().url().includes('/api/')) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  async clearOfflineMode() {
    await this.page.unroute('**/*');
  }
}

test.describe('User Account Management Testing - Offline-First Desktop', () => {
  let utils: UserAccountTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new UserAccountTestUtils(page);
    
    // Enable detailed logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    // Set up test environment
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. User Account Creation Testing', () => {
    test('should create new user account and store in SQLite database', async ({ page }) => {
      const testUser = {
        id: uuidv4(),
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        company: 'Test Company',
        tier: 'free' as const
      };

      // Navigate to registration
      await utils.navigateToRegistration();

      // Fill registration form
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="name-input"]', testUser.name);
      await page.fill('[data-testid="company-input"]', testUser.company);

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Verify successful registration
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

      // Verify user data persistence in database
      const dbResult = await utils.verifyUserInDatabase(testUser.email);
      expect(dbResult.exists).toBe(true);
      expect(dbResult.user.email).toBe(testUser.email);
      expect(dbResult.user.name).toBe(testUser.name);
      expect(dbResult.user.tier).toBe('free');
    });

    test('should generate proper UUID for new user accounts', async ({ page }) => {
      const testUser = await utils.createTestUser(0);

      // Verify UUID format in database
      const dbResult = await utils.verifyUserInDatabase(testUser.email);
      expect(dbResult.user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should store user settings and preferences in JSON fields', async ({ page }) => {
      const testUser = await utils.createTestUser(0);

      // Login as the created user
      await utils.navigateToLogin();
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');

      // Navigate to settings
      await page.click('[data-testid="user-settings"]');

      // Update user preferences
      await page.selectOption('[data-testid="units-preference"]', 'metric');
      await page.selectOption('[data-testid="theme-preference"]', 'dark');
      await page.click('[data-testid="save-settings"]');

      // Verify settings persistence
      await page.reload();
      await expect(page.locator('[data-testid="units-preference"]')).toHaveValue('metric');
      await expect(page.locator('[data-testid="theme-preference"]')).toHaveValue('dark');
    });
  });

  test.describe('2. Super Admin Access Validation', () => {
    test('should allow super admin to access complete user account list', async ({ page }) => {
      // Create test users first
      await utils.createTestUser(0);
      await utils.createTestUser(1);

      // Login as super admin
      await utils.loginAsSuperAdmin();

      // Navigate to user management
      await page.click('[data-testid="user-management-tab"]');

      // Verify user list is visible
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();

      // Verify test users appear in list
      await expect(page.locator(`[data-testid="user-row-${TEST_CONFIG.testUsers[0].email}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="user-row-${TEST_CONFIG.testUsers[1].email}"]`)).toBeVisible();

      // Verify user details are displayed
      const userRow = page.locator(`[data-testid="user-row-${TEST_CONFIG.testUsers[0].email}"]`);
      await expect(userRow.locator('[data-testid="user-name"]')).toContainText(TEST_CONFIG.testUsers[0].name);
      await expect(userRow.locator('[data-testid="user-tier"]')).toContainText(TEST_CONFIG.testUsers[0].tier);
      await expect(userRow.locator('[data-testid="user-company"]')).toContainText(TEST_CONFIG.testUsers[0].company);
    });

    test('should allow super admin to modify user tier assignments', async ({ page }) => {
      // Create test user
      const testUser = await utils.createTestUser(0);

      // Login as super admin
      await utils.loginAsSuperAdmin();

      // Navigate to user management
      await page.click('[data-testid="user-management-tab"]');

      // Find user row and click edit
      const userRow = page.locator(`[data-testid="user-row-${testUser.email}"]`);
      await userRow.locator('[data-testid="edit-user-button"]').click();

      // Change tier from 'free' to 'pro'
      await page.selectOption('[data-testid="user-tier-select"]', 'pro');
      await page.click('[data-testid="save-user-changes"]');

      // Verify tier change persistence
      await page.reload();
      await page.click('[data-testid="user-management-tab"]');
      
      const updatedUserRow = page.locator(`[data-testid="user-row-${testUser.email}"]`);
      await expect(updatedUserRow.locator('[data-testid="user-tier"]')).toContainText('pro');

      // Verify change is logged in database
      const changeLog = await page.evaluate(async (email) => {
        const response = await fetch('/api/admin/change-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'user', email })
        });
        return response.json();
      }, testUser.email);

      expect(changeLog.changes).toContainEqual(
        expect.objectContaining({
          operation: 'UPDATE',
          entity_type: 'user',
          changes: expect.objectContaining({
            tier: { from: 'free', to: 'pro' }
          })
        })
      );
    });

    test('should validate super admin session and permissions', async ({ page }) => {
      // Attempt to access admin panel without authentication
      await page.goto(`${TEST_CONFIG.baseUrl}/admin/users`);
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/login/);

      // Login as regular user (not super admin)
      await utils.createTestUser(0);
      await utils.navigateToLogin();
      await page.fill('[data-testid="email-input"]', TEST_CONFIG.testUsers[0].email);
      await page.fill('[data-testid="password-input"]', TEST_CONFIG.testUsers[0].password);
      await page.click('[data-testid="login-button"]');

      // Attempt to access admin panel
      await page.goto(`${TEST_CONFIG.baseUrl}/admin/users`);
      
      // Should show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });
  });

  test.describe('3. Database Integration Testing', () => {
    test('should ensure all user account operations work with SQLite backend', async ({ page }) => {
      // Test database connection and operations
      const dbTest = await page.evaluate(async () => {
        try {
          // Test database initialization
          const initResponse = await fetch('/api/database/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const initResult = await initResponse.json();

          // Test user CRUD operations
          const testUser = {
            id: crypto.randomUUID(),
            email: 'db-test@example.com',
            name: 'Database Test User',
            tier: 'free',
            company: 'Test Company'
          };

          // Create user
          const createResponse = await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
          });
          const createResult = await createResponse.json();

          // Read user
          const readResponse = await fetch(`/api/users/${testUser.id}`);
          const readResult = await readResponse.json();

          // Update user
          const updateData = { ...testUser, tier: 'pro' };
          const updateResponse = await fetch(`/api/users/${testUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          const updateResult = await updateResponse.json();

          return {
            connection: initResult.success,
            create: createResult.success,
            read: readResult.user?.email === testUser.email,
            update: updateResult.success
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(dbTest.connection).toBe(true);
      expect(dbTest.create).toBe(true);
      expect(dbTest.read).toBe(true);
      expect(dbTest.update).toBe(true);
    });

    test('should validate repository pattern implementation for user management', async ({ page }) => {
      // Test repository pattern through API
      const repositoryTest = await page.evaluate(async () => {
        try {
          // Test LocalUserRepository methods
          const testResults = await fetch('/api/test/repository-pattern', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tests: [
                'getUser',
                'getCurrentUser',
                'saveUser',
                'deleteUser',
                'validateLicense',
                'getLicenseInfo'
              ]
            })
          });

          return testResults.json();
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(repositoryTest.success).toBe(true);
      expect(repositoryTest.results.getUser).toBe(true);
      expect(repositoryTest.results.saveUser).toBe(true);
      expect(repositoryTest.results.getCurrentUser).toBe(true);
    });

    test('should validate foreign key constraints and data integrity', async ({ page }) => {
      // Test foreign key constraints
      const constraintTest = await page.evaluate(async () => {
        try {
          // Attempt to create project with invalid user_id
          const invalidProjectResponse = await fetch('/api/projects/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: crypto.randomUUID(),
              user_id: 'invalid-user-id',
              name: 'Test Project'
            })
          });

          // Should fail due to foreign key constraint
          const result = await invalidProjectResponse.json();
          return {
            foreignKeyEnforced: !result.success && result.error.includes('foreign key'),
            statusCode: invalidProjectResponse.status
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(constraintTest.foreignKeyEnforced).toBe(true);
      expect(constraintTest.statusCode).toBe(400);
    });
  });

  test.describe('4. Offline-First Functionality', () => {
    test('should confirm all user management features work without internet connection', async ({ page }) => {
      // Create user while online
      const testUser = await utils.createTestUser(0);

      // Switch to offline mode
      await utils.checkOfflineMode();

      // Test offline login
      await utils.navigateToLogin();
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');

      // Should successfully login using cached credentials
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

      // Test offline user settings modification
      await page.click('[data-testid="user-settings"]');
      await page.selectOption('[data-testid="units-preference"]', 'metric');
      await page.click('[data-testid="save-settings"]');

      // Verify settings saved locally
      await expect(page.locator('[data-testid="settings-saved-offline"]')).toBeVisible();

      // Clear offline mode
      await utils.clearOfflineMode();
    });

    test('should test user authentication and session management in offline mode', async ({ page }) => {
      // Create and login user while online
      const testUser = await utils.createTestUser(0);
      await utils.navigateToLogin();
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');

      // Verify session is established
      const sessionToken = await page.evaluate(() => localStorage.getItem('sizewise_token'));
      expect(sessionToken).toBeTruthy();

      // Switch to offline mode
      await utils.checkOfflineMode();

      // Test session persistence in offline mode
      await page.reload();
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

      // Test logout in offline mode
      await page.click('[data-testid="logout-button"]');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Verify session cleanup
      const clearedToken = await page.evaluate(() => localStorage.getItem('sizewise_token'));
      expect(clearedToken).toBeNull();
    });

    test('should verify change logging captures user tier modifications for future sync', async ({ page }) => {
      // Create test user
      const testUser = await utils.createTestUser(0);

      // Switch to offline mode
      await utils.checkOfflineMode();

      // Login as super admin in offline mode
      await utils.loginAsSuperAdmin();

      // Modify user tier while offline
      await page.click('[data-testid="user-management-tab"]');
      const userRow = page.locator(`[data-testid="user-row-${testUser.email}"]`);
      await userRow.locator('[data-testid="edit-user-button"]').click();
      await page.selectOption('[data-testid="user-tier-select"]', 'enterprise');
      await page.click('[data-testid="save-user-changes"]');

      // Verify change is logged for future sync
      const changeLogEntry = await page.evaluate(async (email) => {
        const response = await fetch('/api/admin/change-log/pending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'user', email })
        });
        return response.json();
      }, testUser.email);

      expect(changeLogEntry.pendingChanges).toContainEqual(
        expect.objectContaining({
          operation: 'UPDATE',
          entity_type: 'user',
          sync_status: 'pending',
          changes: expect.objectContaining({
            tier: { from: 'free', to: 'enterprise' }
          })
        })
      );

      // Clear offline mode
      await utils.clearOfflineMode();
    });

    test('should validate offline data persistence and recovery', async ({ page }) => {
      // Create multiple users while online
      const users = [
        await utils.createTestUser(0),
        await utils.createTestUser(1)
      ];

      // Switch to offline mode
      await utils.checkOfflineMode();

      // Verify all users are accessible offline
      await utils.loginAsSuperAdmin();
      await page.click('[data-testid="user-management-tab"]');

      for (const user of users) {
        await expect(page.locator(`[data-testid="user-row-${user.email}"]`)).toBeVisible();
      }

      // Test data recovery after simulated crash
      await page.evaluate(() => {
        // Simulate application restart by clearing memory state
        sessionStorage.clear();
        // Keep localStorage for persistence testing
      });

      await page.reload();

      // Verify data is still accessible
      await utils.loginAsSuperAdmin();
      await page.click('[data-testid="user-management-tab"]');

      for (const user of users) {
        await expect(page.locator(`[data-testid="user-row-${user.email}"]`)).toBeVisible();
      }
    });
  });

  test.describe('5. Performance and Stress Testing', () => {
    test('should handle large user datasets efficiently', async ({ page }) => {
      // Create multiple users for performance testing
      const userCount = 50;
      const startTime = Date.now();

      for (let i = 0; i < userCount; i++) {
        await page.evaluate(async (index) => {
          await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: crypto.randomUUID(),
              email: `perf-test-${index}@example.com`,
              name: `Performance Test User ${index}`,
              tier: 'free',
              company: 'Performance Test Company'
            })
          });
        }, i);
      }

      const creationTime = Date.now() - startTime;
      console.log(`Created ${userCount} users in ${creationTime}ms`);

      // Test user list loading performance
      await utils.loginAsSuperAdmin();

      const listLoadStart = Date.now();
      await page.click('[data-testid="user-management-tab"]');
      await page.waitForSelector('[data-testid="user-list"]');
      const listLoadTime = Date.now() - listLoadStart;

      console.log(`Loaded user list in ${listLoadTime}ms`);

      // Performance assertions
      expect(creationTime).toBeLessThan(30000); // 30 seconds max for 50 users
      expect(listLoadTime).toBeLessThan(5000);  // 5 seconds max for list loading
    });
  });
});
