/**
 * Global Teardown for E2E Authentication Tests
 * 
 * Cleans up test environment:
 * - Removes test user accounts
 * - Clears test data
 * - Resets authentication state
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    const authServerURL = 'http://localhost:5000'
    
    // Clean up test users
    console.log('🗑️ Cleaning up test users...')
    
    const testEmails = [
      'freetier@example.com',
      'trial@example.com',
      'expiredtrial@example.com'
    ]
    
    for (const email of testEmails) {
      try {
        await page.request.delete(`${authServerURL}/api/auth/user`, {
          data: { email }
        })
      } catch (error) {
        // Non-critical error, continue cleanup
        console.warn(`⚠️ Could not delete user ${email}:`, error)
      }
    }
    
    // Clear any test projects
    console.log('🗑️ Cleaning up test projects...')
    
    try {
      await page.request.delete(`${authServerURL}/api/projects/test-cleanup`)
    } catch (error) {
      console.warn('⚠️ Could not clean up test projects:', error)
    }
    
    console.log('✅ E2E test environment cleanup complete!')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid masking test failures
  } finally {
    await browser.close()
  }
}

export default globalTeardown
