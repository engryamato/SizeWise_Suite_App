/**
 * End-to-End Authentication Flow Tests
 * 
 * Comprehensive E2E tests for the hybrid authentication system covering:
 * - Super admin login with exact credentials
 * - New user registration with 14-day trial setup
 * - Tier enforcement scenarios
 * - Offline-first functionality and graceful degradation
 * - Trial management and upgrade prompts
 * - Post-login redirect validation
 */

import { test, expect } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const SUPER_ADMIN_EMAIL = 'admin@sizewise.com'
const SUPER_ADMIN_PASSWORD = 'SizeWise2024!6EAF4610705941'

test.describe('Authentication Flows E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies()
    await page.goto(BASE_URL)
  })

  test.describe('Super Admin Authentication', () => {
    test('should authenticate super admin with exact credentials and redirect to dashboard', async ({ page }) => {
      // Navigate to login page
      await page.goto(`${BASE_URL}/login`)
      
      // Verify login page loads
      await expect(page.locator('h1')).toContainText('Login')
      
      // Fill in super admin credentials
      await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL)
      await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD)
      
      // Submit login form
      await page.click('button[type="submit"]')
      
      // Wait for authentication to complete
      await page.waitForLoadState('networkidle')
      
      // Verify redirect to dashboard (NOT /air-duct-sizer)
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Verify super admin is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toContainText('admin@sizewise.com')
      
      // Verify super admin privileges
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible()
    })

    test('should reject invalid super admin credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      
      // Try with wrong password
      await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL)
      await page.fill('input[type="password"]', 'wrong-password')
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
      
      // Should remain on login page
      await expect(page).toHaveURL(`${BASE_URL}/login`)
    })

    test('should provide emergency access when server is offline', async ({ page }) => {
      // Simulate offline mode
      await page.route('**/api/**', route => route.abort())
      
      await page.goto(`${BASE_URL}/login`)
      
      // Fill super admin credentials
      await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL)
      await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      
      // Should still authenticate via offline mode
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    })
  })

  test.describe('User Registration and Trial Setup', () => {
    test('should register new user with automatic 14-day trial', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      
      // Fill registration form
      const testEmail = `test-${Date.now()}@example.com`
      await page.fill('input[name="email"]', testEmail)
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
      await page.fill('input[name="company"]', 'Test Company')
      
      // Submit registration
      await page.click('button[type="submit"]')
      
      // Wait for registration to complete
      await page.waitForLoadState('networkidle')
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Should show trial notification
      await expect(page.locator('[data-testid="trial-banner"]')).toBeVisible()
      await expect(page.locator('[data-testid="trial-banner"]')).toContainText('14-day trial')
      
      // Should show trial days remaining
      await expect(page.locator('[data-testid="trial-days-remaining"]')).toContainText('14')
    })

    test('should handle registration with existing email', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      
      // Try to register with super admin email
      await page.fill('input[name="email"]', SUPER_ADMIN_EMAIL)
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
      await page.fill('input[name="company"]', 'Test Company')
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already exists')
    })
  })

  test.describe('Tier Enforcement', () => {
    test('should enforce free tier project limits (3 projects)', async ({ page }) => {
      // Login as free tier user
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', 'freetier@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Navigate to projects
      await page.click('[data-testid="projects-nav"]')
      
      // Create 3 projects (should be allowed)
      for (let i = 1; i <= 3; i++) {
        await page.click('[data-testid="create-project-btn"]')
        await page.fill('input[name="projectName"]', `Test Project ${i}`)
        await page.click('button[type="submit"]')
        await page.waitForLoadState('networkidle')
      }
      
      // Try to create 4th project (should be blocked)
      await page.click('[data-testid="create-project-btn"]')
      
      // Should show upgrade prompt
      await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible()
      await expect(page.locator('[data-testid="upgrade-modal"]')).toContainText('Project limit reached')
      await expect(page.locator('[data-testid="upgrade-modal"]')).toContainText('3/3')
    })

    test('should enforce free tier segment limits (25 segments)', async ({ page }) => {
      // Login and navigate to a project
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', 'freetier@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      await page.click('[data-testid="projects-nav"]')
      await page.click('[data-testid="project-1"]')
      
      // Add segments up to limit
      for (let i = 1; i <= 25; i++) {
        await page.click('[data-testid="add-segment-btn"]')
        await page.waitForTimeout(100) // Brief pause for UI updates
      }
      
      // Try to add 26th segment (should be blocked)
      await page.click('[data-testid="add-segment-btn"]')
      
      // Should show upgrade prompt
      await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible()
      await expect(page.locator('[data-testid="upgrade-modal"]')).toContainText('Segment limit reached')
      await expect(page.locator('[data-testid="upgrade-modal"]')).toContainText('25/25')
    })
  })

  test.describe('Offline-First Functionality', () => {
    test('should work offline with cached authentication', async ({ page }) => {
      // First, login while online
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL)
      await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Now simulate going offline
      await page.route('**/api/**', route => route.abort())
      
      // Refresh page to test offline functionality
      await page.reload()
      
      // Should still be authenticated
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
      
      // Core functionality should still work
      await expect(page.locator('[data-testid="projects-nav"]')).toBeVisible()
    })

    test('should gracefully degrade when server is unavailable', async ({ page }) => {
      // Start offline
      await page.route('**/api/**', route => route.abort())
      
      await page.goto(`${BASE_URL}/dashboard`)
      
      // Should show offline mode message
      await expect(page.locator('[data-testid="offline-mode-banner"]')).toBeVisible()
      
      // Should still allow basic navigation
      await expect(page.locator('[data-testid="projects-nav"]')).toBeVisible()
      
      // Should disable server-dependent features
      await expect(page.locator('[data-testid="sync-button"]')).toBeDisabled()
    })
  })

  test.describe('Trial Management', () => {
    test('should show trial expiration warnings', async ({ page }) => {
      // Mock trial user with 3 days remaining
      await page.route('**/api/tier-status', route => {
        route.fulfill({
          json: {
            tier: 'trial',
            trial_expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            features: { max_projects: -1, max_segments_per_project: -1 }
          }
        })
      })
      
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', 'trial@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Should show urgent trial warning
      await expect(page.locator('[data-testid="trial-warning"]')).toBeVisible()
      await expect(page.locator('[data-testid="trial-warning"]')).toContainText('3 days remaining')
      
      // Should show upgrade button
      await expect(page.locator('[data-testid="upgrade-now-btn"]')).toBeVisible()
    })

    test('should handle trial expiration', async ({ page }) => {
      // Mock expired trial
      await page.route('**/api/tier-status', route => {
        route.fulfill({
          json: {
            tier: 'free',
            trial_expired: true,
            features: { max_projects: 3, max_segments_per_project: 25 }
          }
        })
      })
      
      await page.goto(`${BASE_URL}/dashboard`)
      
      // Should show trial expired modal
      await expect(page.locator('[data-testid="trial-expired-modal"]')).toBeVisible()
      await expect(page.locator('[data-testid="trial-expired-modal"]')).toContainText('Trial has expired')
      
      // Should show downgrade notice
      await expect(page.locator('[data-testid="downgrade-notice"]')).toContainText('Limited to 3 projects')
    })
  })

  test.describe('Post-Login Redirect Fix', () => {
    test('should redirect to dashboard after login, not air-duct-sizer', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      
      await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL)
      await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      
      // Wait for redirect
      await page.waitForLoadState('networkidle')
      
      // Should be on dashboard, NOT air-duct-sizer
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
      await expect(page).not.toHaveURL(`${BASE_URL}/air-duct-sizer`)
      
      // Verify dashboard content loads
      await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard')
    })

    test('should preserve intended destination after login', async ({ page }) => {
      // Try to access protected page while logged out
      await page.goto(`${BASE_URL}/projects/create`)
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/login/)
      
      // Login
      await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL)
      await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      
      // Should redirect to originally intended page
      await expect(page).toHaveURL(`${BASE_URL}/projects/create`)
    })
  })
})
