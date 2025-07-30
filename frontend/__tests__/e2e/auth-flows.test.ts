/**
 * End-to-End Authentication Flow Tests
 * 
 * Integration tests for complete authentication workflows
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean state
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test.describe('Super Admin Authentication', () => {
    test('should authenticate super admin and access all features', async ({ page }) => {
      await page.goto('/auth/login')

      // Fill in super admin credentials
      await page.fill('[name="email"]', 'admin@sizewise.com')
      await page.fill('[name="password"]', 'SizeWise2024!6EAF4610705941')
      
      // Submit login form
      await page.click('button[type="submit"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')

      // Should show super admin indicators
      await expect(page.locator('[data-testid="super-admin-badge"]')).toBeVisible()

      // Should have access to all tools
      await page.goto('/air-duct-sizer')
      await expect(page.locator('[data-testid="tool-interface"]')).toBeVisible()

      // Should be able to create unlimited projects
      await page.goto('/projects')
      await page.click('[data-testid="create-project-button"]')
      await expect(page.locator('[data-testid="project-form"]')).toBeVisible()
    })

    test('should reject invalid super admin credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('[name="email"]', 'admin@sizewise.com')
      await page.fill('[name="password"]', 'wrongpassword')
      
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('[role="alert"]')).toContainText('Error:')
      
      // Should remain on login page
      await expect(page).toHaveURL('/auth/login')
    })
  })

  test.describe('User Registration Flow', () => {
    test('should register new user with trial', async ({ page }) => {
      await page.goto('/auth/register')

      // Fill registration form
      await page.fill('[name="name"]', 'Test User')
      await page.fill('[name="email"]', 'testuser@example.com')
      await page.fill('[name="company"]', 'Test Company')
      await page.fill('[name="password"]', 'password123')
      await page.fill('[name="confirmPassword"]', 'password123')

      // Submit registration
      await page.click('button[type="submit"]')

      // Should show success message
      await expect(page.locator('text=Welcome to SizeWise!')).toBeVisible()

      // Should show trial information
      await expect(page.locator('text=14-day Premium trial')).toBeVisible()

      // Should show migration wizard
      await expect(page.locator('[data-testid="migration-wizard"]')).toBeVisible()

      // Skip migration for now
      await page.click('[data-testid="skip-migration"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')

      // Should show trial manager
      await expect(page.locator('[data-testid="trial-manager"]')).toBeVisible()
    })

    test('should handle registration validation errors', async ({ page }) => {
      await page.goto('/auth/register')

      // Submit empty form
      await page.click('button[type="submit"]')

      // Should show validation errors
      await expect(page.locator('text=Name is required')).toBeVisible()
      await expect(page.locator('text=Email is required')).toBeVisible()
      await expect(page.locator('text=Password is required')).toBeVisible()

      // Fill partial form with mismatched passwords
      await page.fill('[name="name"]', 'Test User')
      await page.fill('[name="email"]', 'invalid-email')
      await page.fill('[name="password"]', 'short')
      await page.fill('[name="confirmPassword"]', 'different')

      await page.click('button[type="submit"]')

      // Should show specific validation errors
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
      await expect(page.locator('text=Passwords do not match')).toBeVisible()
    })
  })

  test.describe('User Login Flow', () => {
    test('should login existing user and show tier status', async ({ page }) => {
      await page.goto('/auth/login')

      // Mock successful login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'user-123',
              email: 'user@example.com',
              name: 'Test User',
              tier: 'free',
              company: 'Test Company',
            },
            token: 'jwt-token-123',
          }),
        })
      })

      // Mock tier status response
      await page.route('**/api/auth/tier-status', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tier_status: {
              tier: 'free',
              features: {
                max_projects: 3,
                max_segments_per_project: 25,
                high_res_exports: false,
                watermarked_exports: true,
                api_access: false,
              },
              usage: {
                projects_count: 1,
                segments_count: 10,
              },
            },
          }),
        })
      })

      await page.fill('[name="email"]', 'user@example.com')
      await page.fill('[name="password"]', 'password123')
      
      await page.click('button[type="submit"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')

      // Should show free tier information
      await expect(page.locator('text=Free Tier Active')).toBeVisible()
      await expect(page.locator('text=1/3 Projects')).toBeVisible()
    })

    test('should handle login failure', async ({ page }) => {
      await page.goto('/auth/login')

      // Mock failed login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Invalid credentials' },
          }),
        })
      })

      await page.fill('[name="email"]', 'user@example.com')
      await page.fill('[name="password"]', 'wrongpassword')
      
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible()
      
      // Should remain on login page
      await expect(page).toHaveURL('/auth/login')
    })
  })

  test.describe('Offline Behavior', () => {
    test('should show offline indicator when disconnected', async ({ page, context }) => {
      await page.goto('/auth/login')

      // Simulate offline mode
      await context.setOffline(true)

      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
      await expect(page.locator('text=Working offline')).toBeVisible()

      // Registration should be disabled
      await page.goto('/auth/register')
      await expect(page.locator('text=Registration requires an internet connection')).toBeVisible()
      
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeDisabled()
    })

    test('should handle connection restoration', async ({ page, context }) => {
      await page.goto('/auth/login')

      // Start offline
      await context.setOffline(true)
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

      // Restore connection
      await context.setOffline(false)
      
      // Click retry button
      await page.click('[data-testid="retry-connection"]')

      // Should hide offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
    })
  })

  test.describe('Trial Management', () => {
    test('should show trial expiration warnings', async ({ page }) => {
      await page.goto('/dashboard')

      // Mock trial expiring soon
      await page.route('**/api/auth/tier-status', async route => {
        const expiryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tier_status: {
              tier: 'trial',
              trial_expires: expiryDate.toISOString(),
              features: {
                max_projects: -1,
                max_segments_per_project: -1,
                high_res_exports: true,
                watermarked_exports: false,
                api_access: true,
              },
            },
          }),
        })
      })

      await page.reload()

      // Should show trial expiring warning
      await expect(page.locator('text=Trial Expiring Soon')).toBeVisible()
      await expect(page.locator('text=expires in 2 days')).toBeVisible()
      await expect(page.locator('text=Upgrade Now')).toBeVisible()
    })

    test('should handle trial expiration', async ({ page }) => {
      await page.goto('/dashboard')

      // Mock expired trial
      await page.route('**/api/auth/tier-status', async route => {
        const expiryDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tier_status: {
              tier: 'free', // Downgraded to free
              trial_expired: true,
              features: {
                max_projects: 3,
                max_segments_per_project: 25,
                high_res_exports: false,
                watermarked_exports: true,
                api_access: false,
              },
              usage: {
                projects_count: 5, // Over free limit
                segments_count: 100,
              },
            },
          }),
        })
      })

      await page.reload()

      // Should show trial expired message
      await expect(page.locator('text=Trial Expired')).toBeVisible()
      await expect(page.locator('text=Upgrade to Premium')).toBeVisible()

      // Should show project limit warning
      await expect(page.locator('text=5/3 Projects')).toBeVisible()
    })
  })

  test.describe('Feature Restrictions', () => {
    test('should enforce project limits for free tier', async ({ page }) => {
      await page.goto('/projects')

      // Mock free tier at limit
      await page.route('**/api/auth/can-perform-action', async route => {
        const url = new URL(route.request().url())
        const action = url.searchParams.get('action')
        
        if (action === 'create_project') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ allowed: false }),
          })
        }
      })

      await page.click('[data-testid="create-project-button"]')

      // Should show upgrade prompt
      await expect(page.locator('text=Project limit reached')).toBeVisible()
      await expect(page.locator('text=Upgrade to Premium')).toBeVisible()
    })

    test('should enforce export restrictions for free tier', async ({ page }) => {
      await page.goto('/air-duct-sizer')

      // Create a simple project
      await page.click('[data-testid="create-project"]')
      await page.fill('[data-testid="project-name"]', 'Test Project')
      await page.click('[data-testid="save-project"]')

      // Try to export
      await page.click('[data-testid="export-button"]')

      // Should show watermark warning for free tier
      await expect(page.locator('text=watermarked exports')).toBeVisible()
      await expect(page.locator('text=Upgrade for high-resolution')).toBeVisible()
    })
  })

  test.describe('Migration Wizard', () => {
    test('should complete project migration flow', async ({ page }) => {
      // Set up local projects in localStorage
      await page.evaluate(() => {
        localStorage.setItem('sizewise-projects', JSON.stringify([
          { id: '1', name: 'Local Project 1', created_at: '2024-01-01' },
          { id: '2', name: 'Local Project 2', created_at: '2024-01-02' },
        ]))
      })

      await page.goto('/auth/register')

      // Complete registration
      await page.fill('[name="name"]', 'Test User')
      await page.fill('[name="email"]', 'testuser@example.com')
      await page.fill('[name="password"]', 'password123')
      await page.fill('[name="confirmPassword"]', 'password123')
      await page.click('button[type="submit"]')

      // Migration wizard should appear
      await expect(page.locator('[data-testid="migration-wizard"]')).toBeVisible()
      await expect(page.locator('text=2 local projects found')).toBeVisible()

      // Select projects to migrate
      await page.click('[data-testid="project-checkbox-1"]')
      await page.click('[data-testid="project-checkbox-2"]')
      await page.click('[data-testid="next-step"]')

      // Confirm migration
      await page.click('[data-testid="start-migration"]')

      // Should show progress
      await expect(page.locator('[data-testid="migration-progress"]')).toBeVisible()

      // Wait for completion
      await expect(page.locator('text=Migration Complete')).toBeVisible()
      await expect(page.locator('text=2 projects migrated successfully')).toBeVisible()

      // Finish migration
      await page.click('[data-testid="finish-migration"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
    })
  })
})
