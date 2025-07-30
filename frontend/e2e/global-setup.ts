/**
 * Global Setup for E2E Authentication Tests
 * 
 * Prepares test environment with:
 * - Test user accounts
 * - Authentication server setup
 * - Database seeding for consistent test scenarios
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for servers to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3001'
    const authServerURL = 'http://localhost:5000'
    
    console.log('⏳ Waiting for frontend server...')
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    console.log('✅ Frontend server ready')
    
    console.log('⏳ Waiting for authentication server...')
    await page.goto(`${authServerURL}/health`, { waitUntil: 'networkidle' })
    console.log('✅ Authentication server ready')
    
    // Setup test users via API
    console.log('👥 Setting up test users...')
    
    // Create free tier test user
    await page.request.post(`${authServerURL}/api/auth/register`, {
      data: {
        email: 'freetier@example.com',
        password: 'password123',
        company: 'Free Tier Test Company'
      }
    })
    
    // Create trial user
    await page.request.post(`${authServerURL}/api/auth/register`, {
      data: {
        email: 'trial@example.com',
        password: 'password123',
        company: 'Trial Test Company'
      }
    })
    
    // Create expired trial user
    await page.request.post(`${authServerURL}/api/auth/register`, {
      data: {
        email: 'expiredtrial@example.com',
        password: 'password123',
        company: 'Expired Trial Company'
      }
    })
    
    console.log('✅ Test users created successfully')
    
    // Seed test data for tier enforcement tests
    console.log('📊 Seeding test data...')
    
    // Login as free tier user and create test projects
    const loginResponse = await page.request.post(`${authServerURL}/api/auth/login`, {
      data: {
        email: 'freetier@example.com',
        password: 'password123'
      }
    })
    
    if (loginResponse.ok()) {
      const { token } = await loginResponse.json()
      
      // Create 2 projects (leaving room for 1 more to test limit)
      for (let i = 1; i <= 2; i++) {
        await page.request.post(`${authServerURL}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: {
            name: `Test Project ${i}`,
            description: `Test project ${i} for tier enforcement testing`
          }
        })
      }
    }
    
    console.log('✅ Test data seeded successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('🎉 E2E test environment setup complete!')
}

export default globalSetup
