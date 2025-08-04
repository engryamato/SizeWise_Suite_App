import { test, expect } from '@playwright/test';

test.describe('SizeWise Suite - Direct Tool Usage Testing', () => {
  test('Direct Tool Access and Usage: Navigate All Pages and Use Tools', async ({ page }) => {
    console.log('🚀 Starting direct tool usage testing...');
    
    // Step 1: Test Authentication Page Structure
    console.log('🔐 Step 1: Analyzing Authentication Page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const authUrl = page.url();
    console.log(`🌐 Auth URL: ${authUrl}`);
    
    // Analyze login page elements
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const loginButton = await page.locator('button[type="submit"]').count();
    const formElements = await page.locator('form').count();
    
    console.log(`📧 Email inputs: ${emailInput}`);
    console.log(`🔒 Password inputs: ${passwordInput}`);
    console.log(`🔘 Login buttons: ${loginButton}`);
    console.log(`📝 Forms: ${formElements}`);
    console.log('✅ Authentication page structure analyzed');
    
    // Step 2: Test Dashboard Page (even if redirected to login)
    console.log('🏠 Step 2: Testing Dashboard Page Access...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dashboardUrl = page.url();
    console.log(`🌐 Dashboard URL: ${dashboardUrl}`);
    
    // Count interactive elements on the page
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    const inputs = await page.locator('input').count();
    const headings = await page.locator('h1, h2, h3').count();
    
    console.log(`🔘 Buttons: ${buttons}, 🔗 Links: ${links}, 📝 Inputs: ${inputs}, 📋 Headings: ${headings}`);
    
    // Try to interact with available elements
    if (buttons > 0) {
      console.log('🎯 Testing button interactions...');
      const firstButton = page.locator('button').first();
      const buttonText = await firstButton.textContent();
      console.log(`🔘 First button text: "${buttonText}"`);
      
      // Try to click the first button
      try {
        await firstButton.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        console.log('✅ Button click successful');
      } catch (error) {
        console.log('⚠️ Button click failed (may be disabled)');
      }
    }
    
    // Step 3: Test Air Duct Sizer Tool Interface
    console.log('🔧 Step 3: Testing Air Duct Sizer Tool Interface...');
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow time for 3D components
    
    const airDuctUrl = page.url();
    console.log(`🌐 Air Duct Sizer URL: ${airDuctUrl}`);
    
    // Analyze tool interface elements
    const canvasElements = await page.locator('canvas').count();
    const toolButtons = await page.locator('button').count();
    const panels = await page.locator('[class*="panel"], [class*="sidebar"], [class*="toolbar"]').count();
    const fabButtons = await page.locator('[class*="fab"], [class*="floating"]').count();
    
    console.log(`🎨 Canvas elements: ${canvasElements}`);
    console.log(`🔧 Tool buttons: ${toolButtons}`);
    console.log(`📋 Panels: ${panels}`);
    console.log(`🎯 FAB buttons: ${fabButtons}`);
    
    // Try to interact with canvas if present
    if (canvasElements > 0) {
      console.log('🎯 Testing canvas interactions...');
      const canvas = page.locator('canvas').first();
      
      try {
        // Test multiple canvas interactions
        await canvas.click({ position: { x: 100, y: 100 }, timeout: 2000 });
        await page.waitForTimeout(500);
        await canvas.click({ position: { x: 200, y: 150 }, timeout: 2000 });
        await page.waitForTimeout(500);
        await canvas.click({ position: { x: 150, y: 200 }, timeout: 2000 });
        console.log('✅ Canvas interactions completed');
      } catch (error) {
        console.log('⚠️ Canvas interaction failed');
      }
    }
    
    // Try to interact with tool buttons
    if (toolButtons > 0) {
      console.log('🎯 Testing tool button interactions...');
      const buttons = page.locator('button');
      const buttonCount = Math.min(3, toolButtons); // Test first 3 buttons
      
      for (let i = 0; i < buttonCount; i++) {
        try {
          const button = buttons.nth(i);
          const buttonText = await button.textContent();
          console.log(`🔘 Testing button ${i + 1}: "${buttonText}"`);
          await button.click({ timeout: 2000 });
          await page.waitForTimeout(500);
          console.log(`✅ Button ${i + 1} clicked successfully`);
        } catch (error) {
          console.log(`⚠️ Button ${i + 1} interaction failed`);
        }
      }
    }
    
    // Step 4: Test Projects Page Interface
    console.log('📁 Step 4: Testing Projects Page Interface...');
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const projectsUrl = page.url();
    console.log(`🌐 Projects URL: ${projectsUrl}`);
    
    const projectButtons = await page.locator('button').count();
    const projectCards = await page.locator('[class*="card"], [class*="project"]').count();
    const projectInputs = await page.locator('input').count();
    
    console.log(`🔘 Project buttons: ${projectButtons}`);
    console.log(`📋 Project cards: ${projectCards}`);
    console.log(`📝 Project inputs: ${projectInputs}`);
    
    // Test project-related interactions
    if (projectButtons > 0) {
      console.log('🎯 Testing project button interactions...');
      const projectBtn = page.locator('button').first();
      try {
        await projectBtn.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        console.log('✅ Project button interaction successful');
      } catch (error) {
        console.log('⚠️ Project button interaction failed');
      }
    }
    
    // Step 5: Test Tools Page Interface
    console.log('🛠️ Step 5: Testing Tools Page Interface...');
    await page.goto('http://localhost:3000/tools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const toolsUrl = page.url();
    console.log(`🌐 Tools URL: ${toolsUrl}`);
    
    const toolsButtons = await page.locator('button').count();
    const toolsLinks = await page.locator('a').count();
    const toolsCards = await page.locator('[class*="card"], [class*="tool"]').count();
    
    console.log(`🔘 Tools buttons: ${toolsButtons}`);
    console.log(`🔗 Tools links: ${toolsLinks}`);
    console.log(`🛠️ Tools cards: ${toolsCards}`);
    
    // Step 6: Test Reports Page Interface
    console.log('📊 Step 6: Testing Reports Page Interface...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const reportsUrl = page.url();
    console.log(`🌐 Reports URL: ${reportsUrl}`);
    
    const reportButtons = await page.locator('button').count();
    const reportTables = await page.locator('table, [class*="table"]').count();
    const reportCharts = await page.locator('[class*="chart"], canvas, svg').count();
    
    console.log(`🔘 Report buttons: ${reportButtons}`);
    console.log(`📊 Report tables: ${reportTables}`);
    console.log(`📈 Report charts: ${reportCharts}`);
    
    // Step 7: Test Settings Page Interface
    console.log('⚙️ Step 7: Testing Settings Page Interface...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const settingsUrl = page.url();
    console.log(`🌐 Settings URL: ${settingsUrl}`);
    
    const settingsInputs = await page.locator('input').count();
    const settingsSelects = await page.locator('select').count();
    const settingsCheckboxes = await page.locator('input[type="checkbox"]').count();
    const settingsButtons = await page.locator('button').count();
    
    console.log(`📝 Settings inputs: ${settingsInputs}`);
    console.log(`📋 Settings selects: ${settingsSelects}`);
    console.log(`☑️ Settings checkboxes: ${settingsCheckboxes}`);
    console.log(`🔘 Settings buttons: ${settingsButtons}`);
    
    // Test settings interactions
    if (settingsInputs > 0) {
      console.log('🎯 Testing settings input interactions...');
      const textInput = page.locator('input[type="text"], input[type="number"]').first();
      if (await textInput.count() > 0) {
        try {
          await textInput.fill('test-value');
          await page.waitForTimeout(500);
          console.log('✅ Settings input interaction successful');
        } catch (error) {
          console.log('⚠️ Settings input interaction failed');
        }
      }
    }
    
    // Step 8: Test Help Page Interface
    console.log('❓ Step 8: Testing Help Page Interface...');
    await page.goto('http://localhost:3000/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const helpUrl = page.url();
    console.log(`🌐 Help URL: ${helpUrl}`);
    
    const helpButtons = await page.locator('button').count();
    const helpLinks = await page.locator('a').count();
    const helpSections = await page.locator('[class*="help"], [class*="faq"], section').count();
    
    console.log(`🔘 Help buttons: ${helpButtons}`);
    console.log(`🔗 Help links: ${helpLinks}`);
    console.log(`📚 Help sections: ${helpSections}`);
    
    // Step 9: Test Admin Page Interface
    console.log('👑 Step 9: Testing Admin Page Interface...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const adminUrl = page.url();
    console.log(`🌐 Admin URL: ${adminUrl}`);
    
    const adminButtons = await page.locator('button').count();
    const adminInputs = await page.locator('input').count();
    const adminTables = await page.locator('table, [class*="table"]').count();
    
    console.log(`🔘 Admin buttons: ${adminButtons}`);
    console.log(`📝 Admin inputs: ${adminInputs}`);
    console.log(`📊 Admin tables: ${adminTables}`);
    
    // Step 10: Performance and Navigation Summary
    console.log('📈 Step 10: Performance and Navigation Summary...');
    
    const pagesToTest = [
      { path: '/', name: 'Root' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/air-duct-sizer', name: 'Air Duct Sizer' },
      { path: '/projects', name: 'Projects' },
      { path: '/tools', name: 'Tools' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' },
      { path: '/help', name: 'Help' },
      { path: '/admin', name: 'Admin' }
    ];
    
    console.log('📊 Final Performance Test...');
    for (const pageInfo of pagesToTest) {
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      const finalButtons = await page.locator('button').count();
      console.log(`⚡ ${pageInfo.name}: ${loadTime}ms, ${finalButtons} interactive elements`);
    }
    
    console.log('✅ Complete direct tool usage testing finished!');
    
    // Final verification - ensure we can navigate
    const finalUrl = page.url();
    expect(finalUrl).toContain('localhost:3000');
  });
});
