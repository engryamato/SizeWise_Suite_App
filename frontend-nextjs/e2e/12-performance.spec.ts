import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test('should load the application within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const loadTime = Date.now() - startTime;

    // V1 application should load within 8 seconds (allowing for V1 complexity)
    expect(loadTime).toBeLessThan(8000);

    // Check that V1 essential elements are visible
    await expect(page.getByText('Welcome to Air Duct Sizer V1!')).toBeVisible({ timeout: 10000 });
    const drawingFAB = page.getByRole('button').first(); // The main FAB button
    await expect(drawingFAB).toBeVisible({ timeout: 10000 });

    console.log(`✅ V1 application loaded in ${loadTime}ms`);
  });

  test('should respond to user interactions quickly', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Test V1 interaction responsiveness
    const interactions = [
      { key: 'Escape', description: 'Cancel operation' },
      { key: 'g', description: 'Grid toggle' },
      { key: 's', description: 'Snap toggle' }
    ];

    for (const interaction of interactions) {
      const startTime = Date.now();

      await page.keyboard.press(interaction.key);
      await page.waitForTimeout(50); // Small wait for V1 processing

      const responseTime = Date.now() - startTime;

      // V1 interactions should be responsive (< 200ms)
      expect(responseTime).toBeLessThan(200);

      console.log(`✅ V1 ${interaction.description} responded in ${responseTime}ms`);
    }

    // Test FAB click responsiveness
    const startTime = Date.now();
    const drawingFAB = page.getByRole('button').first(); // The main FAB button
    await drawingFAB.click();
    const fabResponseTime = Date.now() - startTime;

    expect(fabResponseTime).toBeLessThan(300);
    console.log(`✅ V1 FAB click responded in ${fabResponseTime}ms`);
  });

  test('should handle rapid user interactions without lag', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const startTime = Date.now();

    // Rapidly use V1 keyboard shortcuts
    const rapidInputs = ['Escape', 'g', 's', 'Escape', 'g', 's', 'Escape'];

    for (const input of rapidInputs) {
      await page.keyboard.press(input);
      await page.waitForTimeout(20); // Small delay to simulate rapid typing
    }

    // FAB should remain accessible after rapid interactions
    const drawingFAB = page.getByRole('button').first(); // The main FAB button
    await expect(drawingFAB).toBeVisible({ timeout: 10000 });

    const totalTime = Date.now() - startTime;

    // V1 rapid interactions should complete quickly
    expect(totalTime).toBeLessThan(1000);

    console.log(`✅ V1 rapid interactions completed in ${totalTime}ms`);
  });

  test('should maintain performance with canvas interactions', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();

    if (canvasBox) {
      const startTime = Date.now();

      // Simulate multiple V1 canvas interactions
      const interactions = [
        { x: canvasBox.x + 100, y: canvasBox.y + 100 },
        { x: canvasBox.x + 200, y: canvasBox.y + 150 },
        { x: canvasBox.x + 300, y: canvasBox.y + 200 },
        { x: canvasBox.x + 150, y: canvasBox.y + 250 },
        { x: canvasBox.x + 250, y: canvasBox.y + 300 }
      ];

      for (const point of interactions) {
        await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(100); // Slightly longer delay for V1 processing
      }

      const totalTime = Date.now() - startTime;

      // V1 canvas interactions should be responsive
      expect(totalTime).toBeLessThan(1500);

      console.log(`✅ V1 canvas interactions completed in ${totalTime}ms`);
    }
  });

  test('should handle backend API calls efficiently', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // V1 may not have backend connectivity - test graceful handling
    const startTime = Date.now();

    try {
      // Test a single API call to check if backend is available
      const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
        data: {
          airflow: 1000,
          duct_type: 'round',
          friction_rate: 0.1,
          units: 'imperial',
          material: 'galvanized_steel'
        }
      });

      if (response.ok()) {
        await response.json(); // Consume the response
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(1000);
        console.log(`✅ V1 backend API call completed in ${responseTime}ms`);
      } else {
        console.log('ℹ️ V1 backend API not available - testing client-side fallback');
      }
    } catch (error: unknown) {
      console.log('ℹ️ V1 backend API not available - V1 may use client-side calculations');
      console.log(`Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // V1 should remain functional regardless of backend availability
    const drawingFAB = page.getByRole('button').first();
    await expect(drawingFAB).toBeVisible({ timeout: 10000 });
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // Perform V1 memory-intensive operations
    await page.keyboard.press('Escape'); // Cancel
    await page.keyboard.press('g'); // Grid toggle
    await page.keyboard.press('s'); // Snap toggle

    // Simulate V1 canvas interactions
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    const canvasBox = await canvas.boundingBox();

    if (canvasBox) {
      for (let i = 0; i < 10; i++) {
        await page.mouse.click(
          canvasBox.x + Math.random() * canvasBox.width,
          canvasBox.y + Math.random() * canvasBox.height
        );
        await page.waitForTimeout(50); // Longer delay for V1 processing
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
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const viewportSizes = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Medium' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewportSizes) {
      const startTime = Date.now();

      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Wait for V1 layout to stabilize
      await page.waitForTimeout(200);

      // Check that V1 essential elements are still visible
      await expect(page.getByText('Welcome to Air Duct Sizer V1!')).toBeVisible({ timeout: 10000 });

      const resizeTime = Date.now() - startTime;

      // V1 viewport changes should be handled efficiently
      expect(resizeTime).toBeLessThan(1000);

      console.log(`✅ V1 ${viewport.name} (${viewport.width}x${viewport.height}) resize: ${resizeTime}ms`);
    }
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const startTime = Date.now();

    // Perform multiple V1 concurrent operations
    const operations = [
      // V1 keyboard shortcuts
      page.keyboard.press('Escape'),
      page.keyboard.press('g'), // Grid toggle
      page.keyboard.press('s'), // Snap toggle

      // Canvas interactions
      page.mouse.click(400, 300),
      page.mouse.click(500, 400)
    ];

    // Execute all operations concurrently
    await Promise.all(operations);

    const totalTime = Date.now() - startTime;

    // V1 concurrent operations should complete efficiently
    expect(totalTime).toBeLessThan(500);

    // V1 application should still be responsive
    const drawingFAB = page.getByRole('button').first();
    await expect(drawingFAB).toBeVisible({ timeout: 10000 });

    console.log(`✅ V1 concurrent operations completed in ${totalTime}ms`);
  });

  test('should maintain performance during extended use', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const startTime = Date.now();

    // Simulate extended V1 use with repeated operations
    for (let i = 0; i < 10; i++) {
      // V1 keyboard shortcuts cycle
      await page.keyboard.press('Escape');
      await page.keyboard.press('g');
      await page.keyboard.press('s');
      await page.keyboard.press('Escape');

      // Canvas interaction
      await page.mouse.click(300 + (i * 10), 200 + (i * 5));

      // Longer delay for V1 processing
      await page.waitForTimeout(50);
    }

    const totalTime = Date.now() - startTime;
    const averageOperationTime = totalTime / 40; // 4 operations per iteration * 10 iterations

    // V1 extended use should maintain reasonable performance
    expect(averageOperationTime).toBeLessThan(100);

    // V1 application should still be responsive
    await expect(page.getByText('Welcome to Air Duct Sizer V1!')).toBeVisible({ timeout: 10000 });

    console.log(`✅ V1 extended use test: ${totalTime}ms total, ${averageOperationTime.toFixed(1)}ms per operation`);
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    await page.goto('/air-duct-sizer-v1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Test V1 performance when backend is unavailable
    await page.route('**/api/calculations/**', route => route.abort());

    const startTime = Date.now();

    // V1 application should still be responsive even with API failures
    await page.keyboard.press('Escape');
    await page.keyboard.press('g');
    await page.keyboard.press('s');

    const responseTime = Date.now() - startTime;

    // V1 UI should remain responsive even with backend errors
    expect(responseTime).toBeLessThan(400);

    // Check that V1 UI is still functional
    const drawingFAB = page.getByRole('button').first();
    await expect(drawingFAB).toBeVisible({ timeout: 10000 });

    console.log(`✅ V1 error condition handling: ${responseTime}ms`);
  });
});
