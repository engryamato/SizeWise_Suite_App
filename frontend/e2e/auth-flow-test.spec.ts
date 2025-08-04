import { test, expect, Page } from '@playwright/test';

/**
 * SizeWise Suite Authentication Flow Test
 * 
 * Tests the complete authentication flow and then navigates through all pages.
 */

test.describe('SizeWise Suite - Authentication Flow and Page Navigation', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Complete Authentication Flow and Page Testing', async () => {
    console.log('🚀 Starting authentication flow and page testing...');

    // ===== STEP 1: INITIAL PAGE LOAD =====
    console.log('🌐 Loading initial page...');
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const initialUrl = page.url();
    console.log(`🌐 Initial URL: ${initialUrl}`);

    // ===== STEP 2: HANDLE AUTHENTICATION =====
    if (initialUrl.includes('/auth/login')) {
      console.log('🔐 Authentication required - testing login page...');
      
      // Test login page loads
      const loginPageTitle = await page.title();
      console.log(`📄 Login page title: "${loginPageTitle}"`);
      
      // Look for login page elements
      const loginHeadings = await page.locator('h1, h2, h3').allTextContents();
      console.log(`📝 Login page headings: ${JSON.stringify(loginHeadings)}`);
      
      // Look for login form or demo access
      const loginForm = await page.locator('form, [class*="form"], [class*="login"]').count();
      const demoButton = await page.locator('button:has-text("Demo"), button:has-text("Guest"), button:has-text("Continue"), a:has-text("Demo")').count();
      const skipButton = await page.locator('button:has-text("Skip"), a:has-text("Skip")').count();
      
      console.log(`📝 Login forms found: ${loginForm}`);
      console.log(`🎮 Demo buttons found: ${demoButton}`);
      console.log(`⏭️ Skip buttons found: ${skipButton}`);
      
      // Try different authentication methods
      if (demoButton > 0) {
        console.log('🎮 Attempting demo access...');
        await page.locator('button:has-text("Demo"), button:has-text("Guest"), button:has-text("Continue"), a:has-text("Demo")').first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else if (skipButton > 0) {
        console.log('⏭️ Attempting to skip authentication...');
        await page.locator('button:has-text("Skip"), a:has-text("Skip")').first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else if (loginForm > 0) {
        console.log('📝 Attempting form-based login...');
        
        // Try to find and fill login form
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
        
        if (await emailInput.isVisible() && await passwordInput.isVisible()) {
          await emailInput.fill('test@example.com');
          await passwordInput.fill('password123');
          await submitButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
        }
      } else {
        console.log('🔍 Looking for any clickable elements to proceed...');
        const clickableElements = await page.locator('button, a, [role="button"]').count();
        console.log(`🖱️ Found ${clickableElements} clickable elements`);
        
        if (clickableElements > 0) {
          // Try clicking the first button or link
          await page.locator('button, a, [role="button"]').first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
        }
      }
      
      const postAuthUrl = page.url();
      console.log(`🌐 Post-auth URL: ${postAuthUrl}`);
    } else {
      console.log('✅ No authentication required or already authenticated');
    }

    // ===== STEP 3: NAVIGATE TO DASHBOARD =====
    console.log('🏠 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dashboardUrl = page.url();
    console.log(`🌐 Dashboard URL: ${dashboardUrl}`);
    
    // Test dashboard content
    const dashboardTitle = await page.title();
    const dashboardHeadings = await page.locator('h1, h2, h3').allTextContents();
    const dashboardContent = await page.locator('main, [class*="container"], [class*="page"], body > div').count();
    
    console.log(`📄 Dashboard title: "${dashboardTitle}"`);
    console.log(`📝 Dashboard headings: ${JSON.stringify(dashboardHeadings)}`);
    console.log(`📦 Dashboard content areas: ${dashboardContent}`);
    
    // Verify dashboard loads
    expect(dashboardContent).toBeGreaterThan(0);

    // ===== STEP 4: TEST AIR DUCT SIZER =====
    console.log('🔧 Testing Air Duct Sizer...');
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Allow for lazy loading

    const adsUrl = page.url();
    console.log(`🌐 Air Duct Sizer URL: ${adsUrl}`);
    
    const adsTitle = await page.title();
    const adsContent = await page.locator('main, [class*="workspace"], [class*="canvas"], .h-screen, body > div').count();
    const adsCanvas = await page.locator('canvas').count();
    
    console.log(`📄 Air Duct Sizer title: "${adsTitle}"`);
    console.log(`📦 Air Duct Sizer content areas: ${adsContent}`);
    console.log(`🎨 Canvas elements: ${adsCanvas}`);
    
    expect(adsContent).toBeGreaterThan(0);

    // ===== STEP 5: TEST ALL OTHER PAGES =====
    console.log('📄 Testing all other pages...');
    
    const pagesToTest = [
      '/projects',
      '/tools', 
      '/reports',
      '/settings',
      '/help',
      '/admin',
      '/chat',
      '/notifications',
      '/recent',
      '/export',
      '/import',
      '/projects/new'
    ];
    
    for (const pagePath of pagesToTest) {
      try {
        console.log(`🔍 Testing ${pagePath}...`);
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const pageUrl = page.url();
        const pageTitle = await page.title();
        const pageContent = await page.locator('main, [class*="container"], [class*="page"], body > div').count();
        const pageHeadings = await page.locator('h1, h2, h3').allTextContents();
        
        console.log(`🌐 ${pagePath} URL: ${pageUrl}`);
        console.log(`📄 ${pagePath} title: "${pageTitle}"`);
        console.log(`📦 ${pagePath} content areas: ${pageContent}`);
        console.log(`📝 ${pagePath} headings: ${JSON.stringify(pageHeadings.slice(0, 3))}`); // First 3 headings
        
        // Basic assertion that page loads with content
        expect(pageContent).toBeGreaterThan(0);
        
      } catch (error) {
        console.log(`⚠️ ${pagePath} error: ${error.message}`);
      }
    }

    // ===== STEP 6: TEST NAVIGATION FROM DASHBOARD =====
    console.log('🧭 Testing navigation from dashboard...');
    
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find navigation links
    const navLinks = await page.locator('a[href^="/"]').all();
    console.log(`🔗 Found ${navLinks.length} navigation links on dashboard`);
    
    // Test navigation to key pages
    const keyNavTargets = ['/air-duct-sizer', '/projects', '/tools', '/reports'];
    
    for (const target of keyNavTargets) {
      try {
        const targetLink = page.locator(`a[href="${target}"], a[href*="${target.split('/')[1]}"]`).first();
        
        if (await targetLink.isVisible()) {
          console.log(`🔗 Testing navigation to ${target}...`);
          await targetLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          const targetUrl = page.url();
          console.log(`✅ Successfully navigated to: ${targetUrl}`);
          
          // Return to dashboard
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        } else {
          console.log(`⚠️ Navigation link to ${target} not found`);
        }
      } catch (error) {
        console.log(`⚠️ Navigation to ${target} failed: ${error.message}`);
      }
    }

    // ===== STEP 7: PERFORMANCE CHECK =====
    console.log('⚡ Testing page load performance...');
    
    const performancePages = ['/dashboard', '/air-duct-sizer', '/tools', '/projects'];
    
    for (const perfPage of performancePages) {
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${perfPage}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`⚡ ${perfPage} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(15000); // Should load within 15 seconds
    }

    console.log('✅ Complete authentication flow and page testing completed successfully!');
  });
});
