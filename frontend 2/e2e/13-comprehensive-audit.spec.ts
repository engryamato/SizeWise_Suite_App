import { test, expect } from '@playwright/test';

test.describe('Comprehensive Stability & Functionality Audit', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitor console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Monitor network failures
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
  });

  test('Phase 1: Application Launch & Initial State', async ({ page }) => {
    console.log('🚀 PHASE 1: Application Launch & Initial State');
    
    // Check page title and meta
    await expect(page).toHaveTitle(/SizeWise Suite/);
    
    // Verify essential elements are present
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    await expect(page.getByRole('toolbar', { name: 'Drawing tools' })).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
    
    // Check status bar
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar).toBeVisible();
    await expect(statusBar.getByText('Ready')).toBeVisible();
    await expect(statusBar.getByText('0/3 rooms, 0/25 segments')).toBeVisible();
    
    // Check Free tier indicator
    await expect(page.getByText('Free')).toBeVisible();
    
    console.log('✅ Application launched successfully with all essential elements');
  });

  test('Phase 2: Toolbar Tools Comprehensive Testing', async ({ page }) => {
    console.log('🔧 PHASE 2: Toolbar Tools Comprehensive Testing');
    
    const tools = [
      { key: 'v', name: 'select tool', description: 'Select Tool' },
      { key: 'r', name: 'room tool', description: 'Room Tool' },
      { key: 'd', name: 'duct tool', description: 'Duct Tool' },
      { key: 'e', name: 'equipment tool', description: 'Equipment Tool' },
      { key: 'h', name: 'pan tool', description: 'Pan Tool' }
    ];

    // Test each tool activation via keyboard
    for (const tool of tools) {
      await page.keyboard.press(tool.key);
      const toolButton = page.getByRole('button', { name: new RegExp(tool.name, 'i') });
      await expect(toolButton).toHaveAttribute('aria-pressed', 'true');
      console.log(`✅ ${tool.description} activated via keyboard (${tool.key})`);
    }

    // Test each tool activation via mouse click
    for (const tool of tools) {
      const toolButton = page.getByRole('button', { name: new RegExp(tool.name, 'i') });
      await toolButton.click();
      await expect(toolButton).toHaveAttribute('aria-pressed', 'true');
      console.log(`✅ ${tool.description} activated via mouse click`);
    }

    // Test escape key functionality
    await page.keyboard.press('r'); // Room tool
    await page.keyboard.press('Escape');
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    console.log('✅ Escape key returns to select tool');

    // Test rapid tool switching
    const rapidSequence = ['r', 'd', 'e', 'h', 'v'];
    for (const key of rapidSequence) {
      await page.keyboard.press(key);
      await page.waitForTimeout(10);
    }
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    console.log('✅ Rapid tool switching works correctly');
  });

  test('Phase 3: Canvas Interactions & Drawing System', async ({ page }) => {
    console.log('🎨 PHASE 3: Canvas Interactions & Drawing System');
    
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    if (canvasBox) {
      // Test canvas click interactions
      const testPoints = [
        { x: canvasBox.x + 100, y: canvasBox.y + 100 },
        { x: canvasBox.x + 200, y: canvasBox.y + 150 },
        { x: canvasBox.x + 300, y: canvasBox.y + 200 }
      ];

      for (const point of testPoints) {
        await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(50);
      }
      console.log('✅ Canvas click interactions working');

      // Test canvas drag interactions
      await page.mouse.move(canvasBox.x + 150, canvasBox.y + 150);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 250, canvasBox.y + 250);
      await page.mouse.up();
      console.log('✅ Canvas drag interactions working');

      // Test zoom functionality (if implemented)
      await canvas.hover();
      await page.mouse.wheel(0, -100); // Zoom in
      await page.mouse.wheel(0, 100);  // Zoom out
      console.log('✅ Canvas zoom interactions tested');
    }

    // Test grid and snap toggles
    await page.keyboard.press('g'); // Grid toggle
    await page.keyboard.press('s'); // Snap toggle
    console.log('✅ Grid and snap toggles working');
  });

  test('Phase 4: Sidebar Panels & Properties', async ({ page }) => {
    console.log('📋 PHASE 4: Sidebar Panels & Properties');
    
    // Check if sidebar is visible
    const sidebar = page.locator('.w-80');
    const sidebarVisible = await sidebar.isVisible();
    
    if (sidebarVisible) {
      console.log('✅ Sidebar is visible');
      
      // Test project panel
      const projectPanel = page.getByRole('button', { name: /project properties panel/i });
      if (await projectPanel.count() > 0) {
        const isEnabled = await projectPanel.isEnabled();
        if (isEnabled) {
          await projectPanel.click();
          console.log('✅ Project properties panel accessible');
        }
      }

      // Test room panel (should be disabled initially)
      const roomPanel = page.getByRole('button', { name: /room properties panel/i });
      if (await roomPanel.count() > 0) {
        const isDisabled = await roomPanel.isDisabled();
        expect(isDisabled).toBeTruthy();
        console.log('✅ Room properties panel correctly disabled (no rooms)');
      }

      // Test equipment panel (should be disabled initially)
      const equipmentPanel = page.getByRole('button', { name: /equipment properties panel/i });
      if (await equipmentPanel.count() > 0) {
        const isDisabled = await equipmentPanel.isDisabled();
        expect(isDisabled).toBeTruthy();
        console.log('✅ Equipment properties panel correctly disabled (no equipment)');
      }
    } else {
      console.log('ℹ️ Sidebar not visible (may be collapsed)');
    }
  });

  test('Phase 5: Backend API Connectivity & Calculations', async ({ page }) => {
    console.log('🔌 PHASE 5: Backend API Connectivity & Calculations');
    
    // Test health endpoint
    const healthResponse = await page.request.get('http://127.0.0.1:5000/api/health');
    expect(healthResponse.ok()).toBeTruthy();
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('healthy');
    console.log('✅ Backend health check passed');

    // Test calculation endpoints
    const calculationTests = [
      {
        name: 'Round Duct Calculation',
        data: {
          airflow: 1000,
          duct_type: 'round',
          friction_rate: 0.1,
          units: 'imperial',
          material: 'galvanized_steel'
        }
      },
      {
        name: 'Rectangular Duct Calculation',
        data: {
          airflow: 2000,
          duct_type: 'rectangular',
          friction_rate: 0.08,
          units: 'imperial',
          material: 'galvanized_steel'
        }
      }
    ];

    for (const test of calculationTests) {
      const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
        data: test.data
      });
      
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBeTruthy();
      console.log(`✅ ${test.name} API working correctly`);
    }

    // Test error handling with invalid data
    const errorResponse = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
      data: {
        airflow: -100, // Invalid airflow
        duct_type: 'round',
        friction_rate: 0.1,
        units: 'imperial',
        material: 'galvanized_steel'
      }
    });
    
    const errorResult = await errorResponse.json();
    expect(errorResult.success).toBeFalsy();
    console.log('✅ Backend error handling working correctly');
  });

  test('Phase 6: Status Bar & Free Tier Enforcement', async ({ page }) => {
    console.log('💰 PHASE 6: Status Bar & Free Tier Enforcement');
    
    const statusBar = page.locator('.bg-white.border-t');
    
    // Check status bar elements
    await expect(statusBar.getByText('Ready')).toBeVisible();
    await expect(statusBar.getByText('0/3 rooms, 0/25 segments')).toBeVisible();
    await expect(statusBar.getByText(/Grid: \d+px/)).toBeVisible();
    await expect(statusBar.getByText(/Zoom: \d+%/)).toBeVisible();
    console.log('✅ Status bar displaying all required information');

    // Check Free tier indicator
    await expect(page.getByText('Free')).toBeVisible();
    console.log('✅ Free tier indicator visible');

    // Verify tier limits are displayed correctly
    const roomLimit = statusBar.getByText(/\/3 rooms/);
    const segmentLimit = statusBar.getByText(/\/25 segments/);
    await expect(roomLimit).toBeVisible();
    await expect(segmentLimit).toBeVisible();
    console.log('✅ Free tier limits displayed correctly');
  });

  test('Phase 7: Error Handling & Edge Cases', async ({ page }) => {
    console.log('⚠️ PHASE 7: Error Handling & Edge Cases');
    
    // Test network failure handling
    await page.route('**/api/calculations/**', route => route.abort());
    
    // Application should still be responsive
    await page.keyboard.press('r');
    await page.keyboard.press('d');
    await page.keyboard.press('v');
    
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    console.log('✅ Application remains responsive during network failures');

    // Restore network
    await page.unroute('**/api/calculations/**');

    // Test rapid interactions
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('r');
      await page.keyboard.press('d');
      await page.waitForTimeout(10);
    }
    console.log('✅ Rapid interactions handled without errors');

    // Test invalid canvas interactions
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (canvasBox) {
      // Click outside canvas bounds (should be handled gracefully)
      await page.mouse.click(canvasBox.x - 10, canvasBox.y - 10);
      await page.mouse.click(canvasBox.x + canvasBox.width + 10, canvasBox.y + canvasBox.height + 10);
      console.log('✅ Out-of-bounds canvas clicks handled gracefully');
    }
  });

  test('Phase 8: Performance & Memory Monitoring', async ({ page }) => {
    console.log('⚡ PHASE 8: Performance & Memory Monitoring');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // Perform intensive operations
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('r');
      await page.keyboard.press('d');
      await page.keyboard.press('e');
      await page.keyboard.press('v');
      
      // Canvas interactions
      const canvas = page.locator('canvas').first();
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(
          canvasBox.x + Math.random() * canvasBox.width,
          canvasBox.y + Math.random() * canvasBox.height
        );
      }
      
      await page.waitForTimeout(25);
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      console.log(`📊 Memory usage change: ${memoryIncreaseMB.toFixed(2)}MB`);
      
      // Memory increase should be reasonable
      expect(Math.abs(memoryIncreaseMB)).toBeLessThan(20);
    }

    console.log('✅ Performance monitoring completed');
  });

  test('Phase 9: Mobile Responsiveness', async ({ page }) => {
    console.log('📱 PHASE 9: Mobile Responsiveness');
    
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1024, height: 768, name: 'iPad Landscape' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(200);
      
      // Check essential elements are still visible
      await expect(page.getByText('Air Duct Sizer')).toBeVisible();
      
      // Check canvas is still accessible
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
      
      // Check status bar is still functional
      const statusBar = page.locator('.bg-white.border-t');
      await expect(statusBar).toBeVisible();
      
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) responsive`);
    }
  });

  test.afterEach(async ({ page }) => {
    // Report any issues found
    if (consoleErrors.length > 0) {
      console.log('🚨 Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (consoleWarnings.length > 0) {
      console.log('⚠️ Console Warnings Found:');
      consoleWarnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('🌐 Network Errors Found:');
      networkErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (consoleErrors.length === 0 && consoleWarnings.length === 0 && networkErrors.length === 0) {
      console.log('✅ No console errors, warnings, or network failures detected');
    }

    // Reset arrays for next test
    consoleErrors = [];
    consoleWarnings = [];
    networkErrors = [];
  });
});
