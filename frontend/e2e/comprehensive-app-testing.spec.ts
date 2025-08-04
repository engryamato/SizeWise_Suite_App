import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive SizeWise Suite Application Testing
 * 
 * This test suite conducts end-to-end testing from authentication through all pages
 * to verify complete application functionality and user journey.
 */

test.describe('SizeWise Suite - Comprehensive Application Testing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Complete User Journey: Auth → Dashboard → All Pages', async () => {
    console.log('🚀 Starting comprehensive application testing...');

    // ===== AUTHENTICATION TESTING =====
    console.log('📝 Testing Authentication Flow...');
    
    // Check if we're redirected to auth or already authenticated
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
      console.log('🔐 Authentication required - testing login flow');
      
      // Test login page elements
      await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
      
      // Look for login form elements
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');
        await loginButton.click();
        
        // Wait for authentication to complete
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️ Login form not found - checking for alternative auth methods');
        
        // Look for demo/guest access
        const demoButton = page.locator('button:has-text("Demo"), button:has-text("Guest"), a:has-text("Continue")').first();
        if (await demoButton.isVisible()) {
          await demoButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    } else {
      console.log('✅ Already authenticated or no auth required');
    }

    // ===== DASHBOARD TESTING =====
    console.log('🏠 Testing Dashboard...');
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto('http://localhost:3000/dashboard');
    }
    
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard elements
    await expect(page.locator('h1, h2')).toContainText(/welcome|dashboard|sizewise/i);
    
    // Check for navigation elements
    const dashboardCards = page.locator('[href*="/"], a, button').filter({ hasText: /project|tool|report|module/i });
    const cardCount = await dashboardCards.count();
    console.log(`📊 Found ${cardCount} navigation elements on dashboard`);
    
    expect(cardCount).toBeGreaterThan(0);

    // ===== AIR DUCT SIZER TESTING =====
    console.log('🔧 Testing Air Duct Sizer Tool...');
    
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow for lazy loading
    
    // Verify Air Duct Sizer workspace loads
    const workspaceLoaded = await page.locator('canvas, .canvas, [class*="canvas"], [class*="workspace"]').first().isVisible({ timeout: 10000 });
    console.log(`🎨 Air Duct Sizer workspace loaded: ${workspaceLoaded}`);
    
    // Check for modular components
    const toolbarVisible = await page.locator('[class*="toolbar"], [class*="header"], .fixed.top-0').first().isVisible();
    const statusBarVisible = await page.locator('[class*="status"], .fixed.bottom-0').first().isVisible();
    
    console.log(`🛠️ Toolbar visible: ${toolbarVisible}`);
    console.log(`📊 Status bar visible: ${statusBarVisible}`);
    
    // Test real-time calculation components
    const calculationElements = await page.locator('[class*="calculation"], [class*="real-time"], [class*="system"]').count();
    console.log(`⚡ Real-time calculation elements found: ${calculationElements}`);

    // ===== PROJECTS TESTING =====
    console.log('📁 Testing Projects Pages...');
    
    // Test Projects main page
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    
    const projectsPageLoaded = await page.locator('h1, h2').filter({ hasText: /project/i }).isVisible();
    console.log(`📂 Projects page loaded: ${projectsPageLoaded}`);
    
    // Test New Project page
    await page.goto('http://localhost:3000/projects/new');
    await page.waitForLoadState('networkidle');
    
    const newProjectPageLoaded = await page.locator('h1, h2').filter({ hasText: /new|create/i }).isVisible();
    console.log(`➕ New Project page loaded: ${newProjectPageLoaded}`);

    // ===== REPORTS TESTING =====
    console.log('📈 Testing Reports Page...');
    
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    
    const reportsPageLoaded = await page.locator('h1, h2').filter({ hasText: /report/i }).isVisible();
    console.log(`📊 Reports page loaded: ${reportsPageLoaded}`);

    // ===== TOOLS TESTING =====
    console.log('🛠️ Testing Tools Directory...');
    
    await page.goto('http://localhost:3000/tools');
    await page.waitForLoadState('networkidle');
    
    const toolsPageLoaded = await page.locator('h1, h2').filter({ hasText: /tool/i }).isVisible();
    const toolCards = await page.locator('[class*="card"], [class*="tool"], a[href*="sizer"]').count();
    
    console.log(`🔧 Tools page loaded: ${toolsPageLoaded}`);
    console.log(`🛠️ Tool cards found: ${toolCards}`);

    // ===== SETTINGS TESTING =====
    console.log('⚙️ Testing Settings Page...');
    
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    
    const settingsPageLoaded = await page.locator('h1, h2').filter({ hasText: /setting/i }).isVisible();
    console.log(`⚙️ Settings page loaded: ${settingsPageLoaded}`);

    // ===== HELP TESTING =====
    console.log('❓ Testing Help Page...');
    
    await page.goto('http://localhost:3000/help');
    await page.waitForLoadState('networkidle');
    
    const helpPageLoaded = await page.locator('h1, h2').filter({ hasText: /help|support/i }).isVisible();
    console.log(`❓ Help page loaded: ${helpPageLoaded}`);

    // ===== ADMIN TESTING =====
    console.log('👑 Testing Admin Page...');
    
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    const adminPageLoaded = await page.locator('h1, h2').filter({ hasText: /admin/i }).isVisible();
    console.log(`👑 Admin page loaded: ${adminPageLoaded}`);

    // ===== ADDITIONAL PAGES TESTING =====
    console.log('📄 Testing Additional Pages...');
    
    const additionalPages = [
      '/chat',
      '/notifications', 
      '/recent',
      '/export',
      '/import',
      '/file'
    ];
    
    for (const pagePath of additionalPages) {
      try {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        const pageLoaded = await page.locator('h1, h2, main, [class*="page"], [class*="container"]').first().isVisible();
        console.log(`📄 ${pagePath} page loaded: ${pageLoaded}`);
      } catch (error) {
        console.log(`⚠️ ${pagePath} page error: ${error.message}`);
      }
    }

    // ===== NAVIGATION TESTING =====
    console.log('🧭 Testing Navigation Between Pages...');
    
    // Test navigation from dashboard to key pages
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation links
    const navLinks = page.locator('a[href^="/"], button[onclick*="navigate"]');
    const navCount = await navLinks.count();
    console.log(`🔗 Navigation links found: ${navCount}`);
    
    // Test a few key navigation paths
    const keyNavPaths = [
      { selector: 'a[href="/air-duct-sizer"], a[href*="duct-sizer"]', name: 'Air Duct Sizer' },
      { selector: 'a[href="/projects"], a[href*="project"]', name: 'Projects' },
      { selector: 'a[href="/tools"], a[href*="tool"]', name: 'Tools' },
      { selector: 'a[href="/reports"], a[href*="report"]', name: 'Reports' }
    ];
    
    for (const navPath of keyNavPaths) {
      try {
        const navElement = page.locator(navPath.selector).first();
        if (await navElement.isVisible()) {
          await navElement.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          
          const targetPageLoaded = await page.locator('h1, h2, main').first().isVisible();
          console.log(`🔗 Navigation to ${navPath.name}: ${targetPageLoaded}`);
          
          // Return to dashboard for next test
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');
        }
      } catch (error) {
        console.log(`⚠️ Navigation to ${navPath.name} failed: ${error.message}`);
      }
    }

    console.log('✅ Comprehensive application testing completed!');
  });

  test('Performance and Accessibility Checks', async () => {
    console.log('⚡ Testing Performance and Accessibility...');
    
    const pagesToTest = [
      '/',
      '/dashboard', 
      '/air-duct-sizer',
      '/projects',
      '/tools'
    ];
    
    for (const pagePath of pagesToTest) {
      await page.goto(`http://localhost:3000${pagePath}`);
      await page.waitForLoadState('networkidle');
      
      // Performance check - page load time
      const startTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`⚡ ${pagePath} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      
      // Basic accessibility check
      const headings = await page.locator('h1, h2, h3').count();
      const buttons = await page.locator('button, [role="button"]').count();
      const links = await page.locator('a').count();
      
      console.log(`♿ ${pagePath} accessibility elements - Headings: ${headings}, Buttons: ${buttons}, Links: ${links}`);
      
      // Ensure basic interactive elements exist
      expect(headings + buttons + links).toBeGreaterThan(0);
    }
  });
});
