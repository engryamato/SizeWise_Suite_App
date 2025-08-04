import { test, expect } from '@playwright/test';

test.describe('SizeWise Suite - Final Comprehensive Testing', () => {
  test('Complete Application Flow: Auth → All Pages Verification', async ({ page }) => {
    console.log('🚀 Starting final comprehensive application testing...');
    
    // Test 1: Authentication Page
    console.log('🔐 Testing Authentication Page...');
    await page.goto('http://localhost:3000');
    
    // Should redirect to login
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    console.log(`🌐 Current URL: ${currentUrl}`);
    expect(currentUrl).toContain('/auth/login');
    
    // Verify login page elements
    const title = await page.title();
    console.log(`📄 Login page title: "${title}"`);
    expect(title).toBe('SizeWise Suite App');
    
    const mainHeading = await page.locator('h1').first().textContent();
    console.log(`📝 Main heading: "${mainHeading}"`);
    expect(mainHeading).toContain('SizeWise');
    
    // Test 2: Dashboard Access
    console.log('🏠 Testing Dashboard Access...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const dashboardTitle = await page.title();
    console.log(`📄 Dashboard title: "${dashboardTitle}"`);
    expect(dashboardTitle).toBe('SizeWise Suite App');
    
    // Check for dashboard content
    const dashboardHeadings = await page.locator('h1, h2, h3').allTextContents();
    console.log(`📝 Dashboard headings: ${JSON.stringify(dashboardHeadings)}`);
    
    // Test 3: Air Duct Sizer Tool
    console.log('🔧 Testing Air Duct Sizer Tool...');
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const airDuctTitle = await page.title();
    console.log(`📄 Air Duct Sizer title: "${airDuctTitle}"`);
    expect(airDuctTitle).toBe('SizeWise Suite App');
    
    // Check for 3D canvas or workspace elements
    const workspaceElements = await page.locator('[class*="workspace"], [class*="canvas"], [class*="3d"]').count();
    console.log(`🎨 Workspace elements found: ${workspaceElements}`);
    
    // Test 4: Projects Page
    console.log('📁 Testing Projects Page...');
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    
    const projectsTitle = await page.title();
    console.log(`📄 Projects title: "${projectsTitle}"`);
    expect(projectsTitle).toBe('SizeWise Suite App');
    
    // Test 5: Tools Page
    console.log('🛠️ Testing Tools Page...');
    await page.goto('http://localhost:3000/tools');
    await page.waitForLoadState('networkidle');
    
    const toolsTitle = await page.title();
    console.log(`📄 Tools title: "${toolsTitle}"`);
    expect(toolsTitle).toBe('SizeWise Suite App');
    
    // Test 6: Reports Page
    console.log('📊 Testing Reports Page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    
    const reportsTitle = await page.title();
    console.log(`📄 Reports title: "${reportsTitle}"`);
    expect(reportsTitle).toBe('SizeWise Suite App');
    
    // Test 7: Settings Page
    console.log('⚙️ Testing Settings Page...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    
    const settingsTitle = await page.title();
    console.log(`📄 Settings title: "${settingsTitle}"`);
    expect(settingsTitle).toBe('SizeWise Suite App');
    
    // Test 8: Help Page
    console.log('❓ Testing Help Page...');
    await page.goto('http://localhost:3000/help');
    await page.waitForLoadState('networkidle');
    
    const helpTitle = await page.title();
    console.log(`📄 Help title: "${helpTitle}"`);
    expect(helpTitle).toBe('SizeWise Suite App');
    
    // Test 9: Admin Page
    console.log('👑 Testing Admin Page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    const adminTitle = await page.title();
    console.log(`📄 Admin title: "${adminTitle}"`);
    expect(adminTitle).toBe('SizeWise Suite App');
    
    console.log('✅ All pages successfully tested!');
  });

  test('Performance and Load Time Verification', async ({ page }) => {
    console.log('⚡ Testing Performance Across All Pages...');
    
    const pagesToTest = [
      '/',
      '/dashboard', 
      '/air-duct-sizer',
      '/projects',
      '/tools',
      '/reports',
      '/settings',
      '/help',
      '/admin'
    ];
    
    for (const pagePath of pagesToTest) {
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${pagePath}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`⚡ ${pagePath} load time: ${loadTime}ms`);
      
      // Verify page loads within reasonable time (under 5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      // Check for basic accessibility elements
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
      const buttons = await page.locator('button').count();
      const links = await page.locator('a').count();
      
      console.log(`♿ ${pagePath} accessibility elements - Headings: ${headings}, Buttons: ${buttons}, Links: ${links}`);
      
      // Basic accessibility checks
      expect(headings).toBeGreaterThan(0); // Should have at least one heading
    }
    
    console.log('✅ Performance testing completed!');
  });

  test('Navigation and User Flow Verification', async ({ page }) => {
    console.log('🧭 Testing Navigation and User Flow...');
    
    // Start from root
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Test navigation to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Dashboard navigation successful');
    
    // Test navigation to air-duct-sizer
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    console.log('✅ Air Duct Sizer navigation successful');
    
    // Test navigation back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Return to dashboard successful');
    
    // Test navigation to projects
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    console.log('✅ Projects navigation successful');
    
    console.log('✅ Navigation flow testing completed!');
  });
});
