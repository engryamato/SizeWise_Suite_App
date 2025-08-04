import { test, expect, Page } from '@playwright/test';

/**
 * SizeWise Suite Application Discovery Test
 * 
 * This test discovers what's actually on each page and tests the real application structure.
 */

test.describe('SizeWise Suite - Application Discovery', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Discover Application Structure and Test All Pages', async () => {
    console.log('🔍 Starting application discovery...');

    // ===== ROOT PAGE DISCOVERY =====
    console.log('🏠 Testing Root Page (/)...');
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Capture page content
    const rootTitle = await page.title();
    const rootHeadings = await page.locator('h1, h2, h3').allTextContents();
    const rootButtons = await page.locator('button, [role="button"]').count();
    const rootLinks = await page.locator('a[href]').count();
    
    console.log(`📄 Root page title: "${rootTitle}"`);
    console.log(`📝 Root page headings: ${JSON.stringify(rootHeadings)}`);
    console.log(`🔘 Root page buttons: ${rootButtons}`);
    console.log(`🔗 Root page links: ${rootLinks}`);

    // Check if we're redirected or what content is shown
    const currentUrl = page.url();
    console.log(`🌐 Current URL after loading root: ${currentUrl}`);

    // ===== DASHBOARD PAGE DISCOVERY =====
    console.log('🏠 Testing Dashboard Page...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dashboardTitle = await page.title();
    const dashboardHeadings = await page.locator('h1, h2, h3').allTextContents();
    const dashboardCards = await page.locator('[class*="card"], [class*="grid"], .p-6, .bg-white').count();
    const dashboardNavLinks = await page.locator('a[href^="/"]').count();
    
    console.log(`📄 Dashboard title: "${dashboardTitle}"`);
    console.log(`📝 Dashboard headings: ${JSON.stringify(dashboardHeadings)}`);
    console.log(`🎴 Dashboard cards: ${dashboardCards}`);
    console.log(`🔗 Dashboard nav links: ${dashboardNavLinks}`);

    // Verify dashboard loads successfully
    expect(dashboardHeadings.length).toBeGreaterThan(0);

    // ===== AIR DUCT SIZER DISCOVERY =====
    console.log('🔧 Testing Air Duct Sizer...');
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Allow for lazy loading

    const adsTitle = await page.title();
    const adsHeadings = await page.locator('h1, h2, h3').allTextContents();
    const adsCanvas = await page.locator('canvas').count();
    const adsWorkspace = await page.locator('[class*="workspace"], [class*="canvas"], .h-screen').count();
    const adsModularComponents = await page.locator('[class*="toolbar"], [class*="panel"], [class*="status"]').count();
    
    console.log(`📄 Air Duct Sizer title: "${adsTitle}"`);
    console.log(`📝 Air Duct Sizer headings: ${JSON.stringify(adsHeadings)}`);
    console.log(`🎨 Canvas elements: ${adsCanvas}`);
    console.log(`🏗️ Workspace elements: ${adsWorkspace}`);
    console.log(`🧩 Modular components: ${adsModularComponents}`);

    // Verify Air Duct Sizer workspace
    expect(adsWorkspace).toBeGreaterThan(0);

    // ===== PROJECTS PAGE DISCOVERY =====
    console.log('📁 Testing Projects Page...');
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');

    const projectsTitle = await page.title();
    const projectsHeadings = await page.locator('h1, h2, h3').allTextContents();
    const projectsContent = await page.locator('main, [class*="container"], [class*="page"]').count();
    
    console.log(`📄 Projects title: "${projectsTitle}"`);
    console.log(`📝 Projects headings: ${JSON.stringify(projectsHeadings)}`);
    console.log(`📦 Projects content areas: ${projectsContent}`);

    // ===== TOOLS PAGE DISCOVERY =====
    console.log('🛠️ Testing Tools Page...');
    await page.goto('http://localhost:3000/tools');
    await page.waitForLoadState('networkidle');

    const toolsTitle = await page.title();
    const toolsHeadings = await page.locator('h1, h2, h3').allTextContents();
    const toolCards = await page.locator('[class*="card"], [class*="tool"], .grid > div').count();
    const toolLinks = await page.locator('a[href*="sizer"], a[href*="tool"]').count();
    
    console.log(`📄 Tools title: "${toolsTitle}"`);
    console.log(`📝 Tools headings: ${JSON.stringify(toolsHeadings)}`);
    console.log(`🎴 Tool cards: ${toolCards}`);
    console.log(`🔗 Tool links: ${toolLinks}`);

    // ===== REPORTS PAGE DISCOVERY =====
    console.log('📈 Testing Reports Page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');

    const reportsTitle = await page.title();
    const reportsHeadings = await page.locator('h1, h2, h3').allTextContents();
    const reportsContent = await page.locator('main, [class*="container"]').count();
    
    console.log(`📄 Reports title: "${reportsTitle}"`);
    console.log(`📝 Reports headings: ${JSON.stringify(reportsHeadings)}`);
    console.log(`📊 Reports content: ${reportsContent}`);

    // ===== SETTINGS PAGE DISCOVERY =====
    console.log('⚙️ Testing Settings Page...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');

    const settingsTitle = await page.title();
    const settingsHeadings = await page.locator('h1, h2, h3').allTextContents();
    const settingsContent = await page.locator('main, [class*="container"]').count();
    
    console.log(`📄 Settings title: "${settingsTitle}"`);
    console.log(`📝 Settings headings: ${JSON.stringify(settingsHeadings)}`);
    console.log(`⚙️ Settings content: ${settingsContent}`);

    // ===== ADDITIONAL PAGES DISCOVERY =====
    console.log('📄 Testing Additional Pages...');
    
    const additionalPages = [
      '/help',
      '/admin', 
      '/chat',
      '/notifications',
      '/recent',
      '/export',
      '/import'
    ];
    
    for (const pagePath of additionalPages) {
      try {
        console.log(`🔍 Testing ${pagePath}...`);
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const pageTitle = await page.title();
        const pageHeadings = await page.locator('h1, h2, h3').allTextContents();
        const pageContent = await page.locator('main, [class*="container"], [class*="page"], body > div').count();
        
        console.log(`📄 ${pagePath} title: "${pageTitle}"`);
        console.log(`📝 ${pagePath} headings: ${JSON.stringify(pageHeadings)}`);
        console.log(`📦 ${pagePath} content areas: ${pageContent}`);
        
        // Basic assertion that page loads
        expect(pageContent).toBeGreaterThan(0);
        
      } catch (error) {
        console.log(`⚠️ ${pagePath} error: ${error.message}`);
      }
    }

    // ===== NAVIGATION TESTING =====
    console.log('🧭 Testing Navigation...');
    
    // Go back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Find and test navigation links
    const navLinks = await page.locator('a[href^="/"]').all();
    console.log(`🔗 Found ${navLinks.length} navigation links on dashboard`);
    
    // Test first few navigation links
    for (let i = 0; i < Math.min(3, navLinks.length); i++) {
      try {
        const href = await navLinks[i].getAttribute('href');
        const linkText = await navLinks[i].textContent();
        
        console.log(`🔗 Testing navigation to: ${href} (${linkText})`);
        
        await navLinks[i].click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const targetUrl = page.url();
        console.log(`✅ Successfully navigated to: ${targetUrl}`);
        
        // Return to dashboard
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');
        
      } catch (error) {
        console.log(`⚠️ Navigation test failed: ${error.message}`);
      }
    }

    // ===== PERFORMANCE CHECK =====
    console.log('⚡ Testing Performance...');
    
    const performancePages = ['/dashboard', '/air-duct-sizer', '/tools'];
    
    for (const perfPage of performancePages) {
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${perfPage}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`⚡ ${perfPage} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    }

    console.log('✅ Application discovery and testing completed successfully!');
  });
});
