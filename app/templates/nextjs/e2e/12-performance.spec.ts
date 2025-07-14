import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test('should load the application within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Application should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check that essential elements are visible
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    await expect(page.getByRole('toolbar', { name: 'Drawing tools' })).toBeVisible();
    
    console.log(`Application loaded in ${loadTime}ms`);
  });

  test('should respond to user interactions quickly', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    // Test tool switching responsiveness
    const interactions = [
      { key: 'r', tool: 'room tool' },
      { key: 'd', tool: 'duct tool' },
      { key: 'e', tool: 'equipment tool' },
      { key: 'v', tool: 'select tool' }
    ];
    
    for (const interaction of interactions) {
      const startTime = Date.now();
      
      await page.keyboard.press(interaction.key);
      
      const toolButton = page.getByRole('button', { name: new RegExp(interaction.tool, 'i') });
      await expect(toolButton).toHaveAttribute('aria-pressed', 'true');
      
      const responseTime = Date.now() - startTime;
      
      // Tool switching should be nearly instantaneous (< 100ms)
      expect(responseTime).toBeLessThan(100);
      
      console.log(`${interaction.tool} activated in ${responseTime}ms`);
    }
  });

  test('should handle rapid user interactions without lag', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Rapidly switch between tools
    const rapidInputs = ['r', 'd', 'e', 'v', 'h', 'r', 'd', 'v'];
    
    for (const input of rapidInputs) {
      await page.keyboard.press(input);
      await page.waitForTimeout(10); // Small delay to simulate rapid typing
    }
    
    // Final tool should be select (v)
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    
    const totalTime = Date.now() - startTime;
    
    // Rapid interactions should complete quickly
    expect(totalTime).toBeLessThan(500);
    
    console.log(`Rapid interactions completed in ${totalTime}ms`);
  });

  test('should maintain performance with canvas interactions', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    if (canvasBox) {
      const startTime = Date.now();
      
      // Simulate multiple canvas interactions
      const interactions = [
        { x: canvasBox.x + 100, y: canvasBox.y + 100 },
        { x: canvasBox.x + 200, y: canvasBox.y + 150 },
        { x: canvasBox.x + 300, y: canvasBox.y + 200 },
        { x: canvasBox.x + 150, y: canvasBox.y + 250 },
        { x: canvasBox.x + 250, y: canvasBox.y + 300 }
      ];
      
      for (const point of interactions) {
        await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(50); // Small delay between clicks
      }
      
      const totalTime = Date.now() - startTime;
      
      // Canvas interactions should be responsive
      expect(totalTime).toBeLessThan(1000);
      
      console.log(`Canvas interactions completed in ${totalTime}ms`);
    }
  });

  test('should handle backend API calls efficiently', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    // Test multiple API calls
    const apiCalls = [
      { airflow: 1000, ductType: 'round' },
      { airflow: 1500, ductType: 'round' },
      { airflow: 2000, ductType: 'rectangular' },
      { airflow: 2500, ductType: 'round' }
    ];
    
    const startTime = Date.now();
    
    for (const call of apiCalls) {
      const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
        data: {
          airflow: call.airflow,
          duct_type: call.ductType,
          friction_rate: 0.1,
          units: 'imperial',
          material: 'galvanized_steel'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBeTruthy();
    }
    
    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / apiCalls.length;
    
    // Each API call should complete within 500ms on average
    expect(averageTime).toBeLessThan(500);
    
    console.log(`${apiCalls.length} API calls completed in ${totalTime}ms (avg: ${averageTime.toFixed(0)}ms)`);
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });
    
    // Perform memory-intensive operations
    await page.keyboard.press('r'); // Room tool
    await page.keyboard.press('d'); // Duct tool
    await page.keyboard.press('e'); // Equipment tool
    
    // Simulate canvas interactions
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (canvasBox) {
      for (let i = 0; i < 10; i++) {
        await page.mouse.click(
          canvasBox.x + Math.random() * canvasBox.width,
          canvasBox.y + Math.random() * canvasBox.height
        );
        await page.waitForTimeout(10);
      }
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
      
      // Memory increase should be reasonable (< 10MB for basic interactions)
      expect(memoryIncreaseMB).toBeLessThan(10);
      
      console.log(`Memory usage increased by ${memoryIncreaseMB.toFixed(2)}MB`);
    } else {
      console.log('Memory measurement not available in this browser');
    }
  });

  test('should handle viewport changes efficiently', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Medium' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewportSizes) {
      const startTime = Date.now();
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for layout to stabilize
      await page.waitForTimeout(100);
      
      // Check that essential elements are still visible
      await expect(page.getByText('Air Duct Sizer')).toBeVisible();
      
      const resizeTime = Date.now() - startTime;
      
      // Viewport changes should be handled quickly
      expect(resizeTime).toBeLessThan(500);
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}) resize: ${resizeTime}ms`);
    }
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Perform multiple concurrent operations
    const operations = [
      // Tool switching
      page.keyboard.press('r'),
      page.keyboard.press('d'),
      page.keyboard.press('e'),
      
      // Canvas interactions
      page.mouse.click(400, 300),
      page.mouse.click(500, 400),
      
      // Keyboard shortcuts
      page.keyboard.press('g'), // Grid toggle
      page.keyboard.press('s')  // Snap toggle
    ];
    
    // Execute all operations concurrently
    await Promise.all(operations);
    
    const totalTime = Date.now() - startTime;
    
    // Concurrent operations should complete quickly
    expect(totalTime).toBeLessThan(300);
    
    // Application should still be responsive
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await page.keyboard.press('v');
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    
    console.log(`Concurrent operations completed in ${totalTime}ms`);
  });

  test('should maintain performance during extended use', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Simulate extended use with repeated operations
    for (let i = 0; i < 20; i++) {
      // Tool switching cycle
      await page.keyboard.press('r');
      await page.keyboard.press('d');
      await page.keyboard.press('e');
      await page.keyboard.press('v');
      
      // Canvas interaction
      await page.mouse.click(300 + (i * 10), 200 + (i * 5));
      
      // Small delay to simulate realistic usage
      await page.waitForTimeout(25);
    }
    
    const totalTime = Date.now() - startTime;
    const averageOperationTime = totalTime / 80; // 4 operations per iteration * 20 iterations
    
    // Extended use should maintain performance
    expect(averageOperationTime).toBeLessThan(50);
    
    // Application should still be responsive
    await expect(page.getByText('Air Duct Sizer')).toBeVisible();
    
    console.log(`Extended use test: ${totalTime}ms total, ${averageOperationTime.toFixed(1)}ms per operation`);
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    // Test performance when backend is unavailable
    await page.route('**/api/calculations/**', route => route.abort());
    
    const startTime = Date.now();
    
    // Application should still be responsive even with API failures
    await page.keyboard.press('r');
    await page.keyboard.press('d');
    await page.keyboard.press('v');
    
    const responseTime = Date.now() - startTime;
    
    // UI should remain responsive even with backend errors
    expect(responseTime).toBeLessThan(200);
    
    // Check that UI is still functional
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    
    console.log(`Error condition handling: ${responseTime}ms`);
  });
});
