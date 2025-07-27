import { test, expect } from '@playwright/test';

/**
 * Simple 3D Canvas Test
 * Basic validation of canvas functionality
 */

test.describe('Simple 3D Canvas Test', () => {
  test('Basic Canvas Presence and WebGL Support', async ({ page }) => {
    console.log('🎯 Testing Basic Canvas Presence and WebGL Support');

    // Navigate to Air Duct Sizer page
    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: `./test-results/simple-canvas-01-initial.png`,
      fullPage: true 
    });

    // Wait for canvas to be present
    const canvasElement = await page.waitForSelector('canvas', { timeout: 15000 });
    expect(canvasElement).toBeTruthy();

    // Check WebGL support
    const webglInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { error: 'Canvas not found' };

      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      return {
        canvasPresent: !!canvas,
        canvasSize: { width: canvas.width, height: canvas.height },
        webglSupported: !!gl,
        renderer: gl ? gl.getParameter(gl.RENDERER) : 'No WebGL'
      };
    });

    console.log('WebGL Info:', webglInfo);
    expect(webglInfo.canvasPresent).toBe(true);
    expect(webglInfo.canvasSize.width).toBeGreaterThan(0);
    expect(webglInfo.canvasSize.height).toBeGreaterThan(0);

    // Take final screenshot
    await page.screenshot({ 
      path: `./test-results/simple-canvas-02-final.png`,
      fullPage: true 
    });

    console.log('✅ Basic canvas test completed successfully');
  });

  test('Canvas Interaction Test', async ({ page }) => {
    console.log('🖱️ Testing Basic Canvas Interaction');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Test basic mouse interaction
    const canvasElement = await page.locator('canvas').first();
    await canvasElement.hover();
    
    // Test mouse wheel
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(500);
    
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(500);

    // Test click
    await canvasElement.click();
    await page.waitForTimeout(500);

    await page.screenshot({ 
      path: `./test-results/simple-canvas-03-interaction.png`,
      fullPage: true 
    });

    console.log('✅ Canvas interaction test completed');
  });
});
