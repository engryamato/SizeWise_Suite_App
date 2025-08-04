import { test, expect } from '@playwright/test';

test.describe('SizeWise Suite - Interactive Tool Usage Testing', () => {
  test('Complete User Journey: Auth → Navigate All Pages → Use Tools', async ({ page }) => {
    console.log('🚀 Starting interactive tool usage testing...');
    
    // Step 1: Start from Authentication Page
    console.log('🔐 Step 1: Testing Authentication Page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const authUrl = page.url();
    console.log(`🌐 Auth URL: ${authUrl}`);
    expect(authUrl).toContain('/auth/login');
    
    // Check for login elements and try to interact
    const loginForms = await page.locator('form').count();
    console.log(`📝 Login forms found: ${loginForms}`);
    
    // Look for demo/skip buttons or direct navigation options
    const demoButtons = await page.locator('button:has-text("demo"), button:has-text("skip"), button:has-text("continue")').count();
    console.log(`🎮 Demo/Skip buttons found: ${demoButtons}`);
    
    // Step 2: Navigate to Dashboard
    console.log('🏠 Step 2: Navigating to Dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow components to load
    
    const dashboardUrl = page.url();
    console.log(`🌐 Dashboard URL: ${dashboardUrl}`);
    
    // Interact with dashboard elements
    const dashboardButtons = await page.locator('button').count();
    console.log(`🔘 Dashboard buttons available: ${dashboardButtons}`);
    
    // Try to click on Air Duct Sizer tool if available
    const airDuctButton = page.locator('button:has-text("Air Duct"), a:has-text("Air Duct"), [href*="air-duct"]').first();
    const airDuctExists = await airDuctButton.count() > 0;
    console.log(`🔧 Air Duct Sizer button found: ${airDuctExists}`);
    
    if (airDuctExists) {
      console.log('🎯 Clicking Air Duct Sizer from dashboard...');
      await airDuctButton.click();
      await page.waitForLoadState('networkidle');
      console.log(`🌐 After click URL: ${page.url()}`);
    }
    
    // Step 3: Navigate to and Use Air Duct Sizer Tool
    console.log('🔧 Step 3: Testing Air Duct Sizer Tool...');
    await page.goto('http://localhost:3000/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow 3D components to load
    
    console.log(`🌐 Air Duct Sizer URL: ${page.url()}`);
    
    // Look for tool interface elements
    const canvasElements = await page.locator('canvas, [class*="canvas"], [class*="3d"], [class*="workspace"]').count();
    console.log(`🎨 Canvas/3D elements found: ${canvasElements}`);
    
    const toolPanels = await page.locator('[class*="panel"], [class*="toolbar"], [class*="sidebar"]').count();
    console.log(`🛠️ Tool panels found: ${toolPanels}`);
    
    const drawingTools = await page.locator('button:has-text("draw"), button:has-text("add"), button:has-text("create"), [class*="drawing"]').count();
    console.log(`✏️ Drawing tools found: ${drawingTools}`);
    
    // Try to interact with drawing tools
    const drawButton = page.locator('button:has-text("draw"), button:has-text("add"), button:has-text("create")').first();
    if (await drawButton.count() > 0) {
      console.log('🎯 Attempting to use drawing tool...');
      await drawButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Drawing tool interaction attempted');
    }
    
    // Try to interact with canvas if present
    const canvas = page.locator('canvas').first();
    if (await canvas.count() > 0) {
      console.log('🎯 Attempting canvas interaction...');
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 200, y: 150 } });
      console.log('✅ Canvas interaction attempted');
    }
    
    // Step 4: Navigate to Projects and Use Project Tools
    console.log('📁 Step 4: Testing Projects Page...');
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🌐 Projects URL: ${page.url()}`);
    
    // Look for project management tools
    const projectButtons = await page.locator('button:has-text("new"), button:has-text("create"), button:has-text("open"), button:has-text("import")').count();
    console.log(`📋 Project action buttons found: ${projectButtons}`);
    
    // Try to create a new project
    const newProjectButton = page.locator('button:has-text("new"), button:has-text("create")').first();
    if (await newProjectButton.count() > 0) {
      console.log('🎯 Attempting to create new project...');
      await newProjectButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ New project creation attempted');
    }
    
    // Step 5: Navigate to Tools Page
    console.log('🛠️ Step 5: Testing Tools Page...');
    await page.goto('http://localhost:3000/tools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🌐 Tools URL: ${page.url()}`);
    
    const availableTools = await page.locator('button, a, [class*="tool"], [class*="card"]').count();
    console.log(`🔧 Available tools/cards found: ${availableTools}`);
    
    // Try to access different tools
    const toolLinks = page.locator('a[href*="tool"], button:has-text("tool"), [class*="tool-card"]');
    const toolCount = await toolLinks.count();
    console.log(`🎯 Tool links found: ${toolCount}`);
    
    if (toolCount > 0) {
      console.log('🎯 Attempting to access first tool...');
      await toolLinks.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Tool access attempted');
    }
    
    // Step 6: Navigate to Reports and Use Reporting Tools
    console.log('📊 Step 6: Testing Reports Page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🌐 Reports URL: ${page.url()}`);
    
    const reportButtons = await page.locator('button:has-text("generate"), button:has-text("export"), button:has-text("download"), button:has-text("create")').count();
    console.log(`📈 Report action buttons found: ${reportButtons}`);
    
    // Try to generate a report
    const generateButton = page.locator('button:has-text("generate"), button:has-text("create")').first();
    if (await generateButton.count() > 0) {
      console.log('🎯 Attempting to generate report...');
      await generateButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Report generation attempted');
    }
    
    // Step 7: Navigate to Settings and Use Configuration Tools
    console.log('⚙️ Step 7: Testing Settings Page...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🌐 Settings URL: ${page.url()}`);
    
    const settingsInputs = await page.locator('input, select, textarea, button:has-text("save"), button:has-text("apply")').count();
    console.log(`⚙️ Settings controls found: ${settingsInputs}`);
    
    // Try to interact with settings
    const settingsInput = page.locator('input[type="text"], input[type="number"]').first();
    if (await settingsInput.count() > 0) {
      console.log('🎯 Attempting to modify settings...');
      await settingsInput.fill('test-value');
      await page.waitForTimeout(500);
      console.log('✅ Settings modification attempted');
    }
    
    // Step 8: Navigate to Help and Use Help Tools
    console.log('❓ Step 8: Testing Help Page...');
    await page.goto('http://localhost:3000/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🌐 Help URL: ${page.url()}`);
    
    const helpSections = await page.locator('[class*="help"], [class*="faq"], [class*="guide"], button, a').count();
    console.log(`📚 Help sections/links found: ${helpSections}`);
    
    // Try to access help content
    const helpLink = page.locator('a, button').first();
    if (await helpLink.count() > 0) {
      console.log('🎯 Attempting to access help content...');
      await helpLink.click();
      await page.waitForTimeout(1000);
      console.log('✅ Help content access attempted');
    }
    
    // Step 9: Navigate to Admin and Use Admin Tools
    console.log('👑 Step 9: Testing Admin Page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🌐 Admin URL: ${page.url()}`);
    
    const adminControls = await page.locator('button, input, select, [class*="admin"], [class*="control"]').count();
    console.log(`👑 Admin controls found: ${adminControls}`);
    
    // Try to interact with admin tools (carefully)
    const adminButton = page.locator('button:has-text("view"), button:has-text("show"), button:has-text("display")').first();
    if (await adminButton.count() > 0) {
      console.log('🎯 Attempting to use admin tool...');
      await adminButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Admin tool interaction attempted');
    }
    
    // Step 10: Return to Dashboard and Test Navigation
    console.log('🔄 Step 10: Testing Return Navigation...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log(`🌐 Final dashboard URL: ${page.url()}`);
    console.log('✅ Complete interactive tool usage testing finished!');
    
    // Verify we can still navigate
    expect(page.url()).toContain('/dashboard');
  });
});
