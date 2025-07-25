/**
 * Basic E2E Setup Test
 * 
 * Simple test to verify E2E infrastructure is working
 */

import { test, expect } from '@playwright/test'

test.describe('Basic E2E Setup', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/')
    
    // Should load without errors
    await expect(page).toHaveTitle(/SizeWise/)
    
    // Should have basic navigation
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    
    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})
