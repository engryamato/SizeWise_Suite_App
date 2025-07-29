import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive 3D Canvas and Visualization Testing Suite
 * 
 * This test suite validates the 3D canvas functionality including:
 * - Canvas rendering and initialization
 * - Zoom, pan, and rotate controls
 * - Performance with complex duct systems
 * - Responsive behavior across screen sizes
 * - WebGL compatibility and fallback handling
 * 
 * Following the same systematic debugging approach used for authentication testing
 */

interface CanvasMetrics {
  fps: number;
  renderCalls: number;
  memoryUsage: number;
  canvasSize: { width: number; height: number };
  webglSupported: boolean;
  timestamp: number;
}

interface ViewportTest {
  name: string;
  width: number;
  height: number;
  devicePixelRatio: number;
}

test.describe('3D Canvas and Visualization Testing', () => {
  let context: BrowserContext;
  let page: Page;
  let consoleMessages: string[] = [];
  let networkRequests: any[] = [];
  let canvasMetrics: CanvasMetrics[] = [];

  test.beforeEach(async ({ browser }) => {
    // Create new context with tracing for detailed debugging
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    
    // Start tracing for detailed step-by-step analysis
    await context.tracing.start({ 
      screenshots: true, 
      snapshots: true,
      sources: true 
    });

    page = await context.newPage();

    // Capture console messages for debugging
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
    });

    // Monitor network requests
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });

    // Monitor page errors
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
      consoleMessages.push(`[ERROR] ${error.message}`);
    });

    // Clear arrays for each test
    consoleMessages = [];
    networkRequests = [];
    canvasMetrics = [];
  });

  test.afterEach(async () => {
    // Save trace for debugging
    await context.tracing.stop({ 
      path: `./test-results/3d-canvas-trace-${Date.now()}.zip` 
    });
    
    await context.close();
  });

  test('Canvas Initialization and Rendering', async () => {
    console.log('🎯 Testing 3D Canvas Initialization and Rendering');

    // Navigate to Air Duct Sizer page which contains the 3D canvas
    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    
    // Wait for services to initialize
    await page.waitForSelector('text=✅ Service initialization completed successfully', { timeout: 30000 });
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: `./test-results/canvas-01-initial-load.png`,
      fullPage: true 
    });

    // Wait for 3D canvas to be present
    const canvasElement = await page.waitForSelector('canvas', { timeout: 15000 });
    expect(canvasElement).toBeTruthy();

    // Check WebGL support and canvas initialization
    const webglInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { error: 'Canvas not found' };

      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const webgl2 = canvas.getContext('webgl2');
      
      return {
        canvasPresent: !!canvas,
        canvasSize: { width: canvas.width, height: canvas.height },
        webglSupported: !!gl,
        webgl2Supported: !!webgl2,
        renderer: gl ? gl.getParameter(gl.RENDERER) : 'No WebGL',
        vendor: gl ? gl.getParameter(gl.VENDOR) : 'No WebGL',
        version: gl ? gl.getParameter(gl.VERSION) : 'No WebGL'
      };
    });

    console.log('WebGL Info:', webglInfo);
    expect(webglInfo.canvasPresent).toBe(true);
    expect(webglInfo.webglSupported).toBe(true);
    expect(webglInfo.canvasSize.width).toBeGreaterThan(0);
    expect(webglInfo.canvasSize.height).toBeGreaterThan(0);

    // Check for Three.js initialization
    const threeJsInfo = await page.evaluate(() => {
      // @ts-ignore
      return {
        threeAvailable: typeof window.THREE !== 'undefined' || typeof THREE !== 'undefined',
        reactThreeFiberActive: !!document.querySelector('[data-react-three-fiber]'),
        sceneElements: document.querySelectorAll('canvas').length
      };
    });

    console.log('Three.js Info:', threeJsInfo);
    expect(threeJsInfo.sceneElements).toBeGreaterThan(0);

    // Wait for canvas to be fully rendered (check for grid or other 3D elements)
    await page.waitForTimeout(3000); // Allow time for 3D scene to render

    // Take screenshot of rendered canvas
    await page.screenshot({ 
      path: `./test-results/canvas-02-rendered.png`,
      fullPage: true 
    });

    console.log('✅ Canvas initialization and rendering test completed');
  });

  test('Zoom Controls Testing', async () => {
    console.log('🔍 Testing Zoom Controls');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000); // Allow canvas to initialize

    // Get initial camera position
    const initialCameraState = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
      // Try to access Three.js camera through React Three Fiber
      // This is a simplified approach - in real implementation, we'd need proper camera access
      return {
        timestamp: Date.now(),
        canvasSize: { width: canvas.width, height: canvas.height }
      };
    });

    // Test mouse wheel zoom
    const canvasElement = await page.locator('canvas').first();
    await canvasElement.hover();
    
    // Zoom in with mouse wheel
    await page.mouse.wheel(0, -500); // Negative for zoom in
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `./test-results/canvas-03-zoom-in.png`,
      fullPage: true 
    });

    // Zoom out with mouse wheel
    await page.mouse.wheel(0, 500); // Positive for zoom out
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `./test-results/canvas-04-zoom-out.png`,
      fullPage: true 
    });

    // Test keyboard zoom controls if available
    await page.keyboard.press('Equal'); // Zoom in
    await page.waitForTimeout(300);
    await page.keyboard.press('Minus'); // Zoom out
    await page.waitForTimeout(300);

    // Check for zoom controls in UI
    const zoomControls = await page.locator('button:has-text("Zoom"), button[aria-label*="zoom"], button[title*="zoom"]').count();
    console.log(`Found ${zoomControls} zoom control buttons`);

    if (zoomControls > 0) {
      // Test UI zoom controls
      const zoomInButton = page.locator('button:has-text("Zoom in"), button[aria-label*="zoom in"], button[title*="zoom in"]').first();
      const zoomOutButton = page.locator('button:has-text("Zoom out"), button[aria-label*="zoom out"], button[title*="zoom out"]').first();
      
      if (await zoomInButton.count() > 0) {
        await zoomInButton.click();
        await page.waitForTimeout(300);
      }
      
      if (await zoomOutButton.count() > 0) {
        await zoomOutButton.click();
        await page.waitForTimeout(300);
      }
    }

    console.log('✅ Zoom controls testing completed');
  });

  test('Pan and Rotate Controls Testing', async () => {
    console.log('🔄 Testing Pan and Rotate Controls');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const canvasElement = await page.locator('canvas').first();
    const canvasBounds = await canvasElement.boundingBox();
    
    if (!canvasBounds) {
      throw new Error('Canvas bounds not found');
    }

    const centerX = canvasBounds.x + canvasBounds.width / 2;
    const centerY = canvasBounds.y + canvasBounds.height / 2;

    // Test mouse drag for rotation/pan
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 50, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    await page.screenshot({ 
      path: `./test-results/canvas-05-after-drag.png`,
      fullPage: true 
    });

    // Test right-click drag for pan (if supported)
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(centerX - 50, centerY - 30, { steps: 8 });
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(500);

    // Test keyboard controls for rotation/pan
    await canvasElement.click(); // Focus canvas
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Test ViewCube if present
    const viewCube = page.locator('[class*="view-cube"], [data-testid="view-cube"]');
    if (await viewCube.count() > 0) {
      await viewCube.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ 
      path: `./test-results/canvas-06-after-controls.png`,
      fullPage: true 
    });

    console.log('✅ Pan and rotate controls testing completed');
  });

  test('Performance with Complex Duct Systems', async () => {
    console.log('⚡ Testing Performance with Complex Duct Systems');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Monitor performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const startTime = performance.now();
      
      // Simulate adding multiple duct segments (if drawing tools are available)
      // This would typically involve clicking drawing tools and creating segments
      
      return {
        startTime,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
        timing: performance.timing
      };
    });

    // Test drawing multiple segments if drawing tools are available
    const drawingFAB = page.locator('[data-testid="drawing-fab"], button:has-text("Draw")').first();
    if (await drawingFAB.count() > 0) {
      await drawingFAB.click();
      await page.waitForTimeout(500);
      
      // Simulate drawing multiple duct segments
      const canvas = await page.locator('canvas').first();
      const bounds = await canvas.boundingBox();
      
      if (bounds) {
        // Draw several line segments
        for (let i = 0; i < 5; i++) {
          const startX = bounds.x + 100 + (i * 50);
          const startY = bounds.y + 100 + (i * 30);
          const endX = startX + 100;
          const endY = startY + 50;
          
          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, endY, { steps: 5 });
          await page.mouse.up();
          await page.waitForTimeout(300);
        }
      }
    }

    // Measure FPS and performance after adding elements
    const finalMetrics = await page.evaluate(() => {
      const endTime = performance.now();
      return {
        endTime,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
        renderingTime: endTime - window.performance.timing.navigationStart
      };
    });

    console.log('Performance Metrics:', {
      initial: performanceMetrics,
      final: finalMetrics,
      memoryIncrease: finalMetrics.memoryUsage - performanceMetrics.memoryUsage
    });

    // Verify performance is acceptable
    expect(finalMetrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    
    await page.screenshot({ 
      path: `./test-results/canvas-07-complex-system.png`,
      fullPage: true 
    });

    console.log('✅ Performance testing completed');
  });

  test('Responsive Behavior Across Screen Sizes', async () => {
    console.log('📱 Testing Responsive Behavior Across Screen Sizes');

    const viewportTests: ViewportTest[] = [
      { name: 'Desktop Large', width: 1920, height: 1080, devicePixelRatio: 1 },
      { name: 'Desktop Medium', width: 1366, height: 768, devicePixelRatio: 1 },
      { name: 'Tablet Landscape', width: 1024, height: 768, devicePixelRatio: 2 },
      { name: 'Tablet Portrait', width: 768, height: 1024, devicePixelRatio: 2 },
      { name: 'Large Tablet', width: 1280, height: 800, devicePixelRatio: 1.5 }
    ];

    for (const viewport of viewportTests) {
      console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      // Set viewport size
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      // Navigate to page
      await page.goto('http://localhost:3000/air-duct-sizer-v1');
      await page.waitForSelector('canvas', { timeout: 15000 });
      await page.waitForTimeout(2000);

      // Check canvas responsiveness
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(canvas);

        return {
          canvasSize: { width: canvas.width, height: canvas.height },
          displaySize: { width: rect.width, height: rect.height },
          cssSize: {
            width: computedStyle.width,
            height: computedStyle.height
          },
          devicePixelRatio: window.devicePixelRatio,
          isVisible: rect.width > 0 && rect.height > 0
        };
      });

      console.log(`Canvas info for ${viewport.name}:`, canvasInfo);

      expect(canvasInfo).toBeTruthy();
      expect(canvasInfo!.isVisible).toBe(true);
      expect(canvasInfo!.displaySize.width).toBeGreaterThan(0);
      expect(canvasInfo!.displaySize.height).toBeGreaterThan(0);

      // Test canvas interaction at this viewport
      const canvasElement = await page.locator('canvas').first();
      await canvasElement.hover();
      await page.mouse.wheel(0, -100); // Small zoom test
      await page.waitForTimeout(300);

      // Take screenshot for visual verification
      await page.screenshot({
        path: `./test-results/canvas-responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });

      // Check UI elements are still accessible
      const uiElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, input, select');
        let visibleCount = 0;
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) visibleCount++;
        });
        return { total: elements.length, visible: visibleCount };
      });

      console.log(`UI elements for ${viewport.name}:`, uiElements);
      expect(uiElements.visible).toBeGreaterThan(0);
    }

    console.log('✅ Responsive behavior testing completed');
  });

  test('WebGL Compatibility and Fallback Handling', async () => {
    console.log('🔧 Testing WebGL Compatibility and Fallback Handling');

    // Test 1: Normal WebGL support
    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const normalWebGLInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const gl2 = canvas.getContext('webgl2');

      return {
        webglSupported: !!gl,
        webgl2Supported: !!gl2,
        renderer: gl ? gl.getParameter(gl.RENDERER) : null,
        vendor: gl ? gl.getParameter(gl.VENDOR) : null,
        maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : null,
        maxVertexAttribs: gl ? gl.getParameter(gl.MAX_VERTEX_ATTRIBS) : null,
        extensions: gl ? gl.getSupportedExtensions() : []
      };
    });

    console.log('Normal WebGL Info:', normalWebGLInfo);
    expect(normalWebGLInfo).toBeTruthy();
    expect(normalWebGLInfo!.webglSupported).toBe(true);

    await page.screenshot({
      path: `./test-results/canvas-webgl-normal.png`,
      fullPage: true
    });

    // Test 2: Simulate WebGL failure and check fallback
    await page.evaluate(() => {
      // Override WebGL context creation to simulate failure
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(contextType: string, ...args: any[]) {
        if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
          console.log('WebGL context creation blocked for testing');
          return null;
        }
        return originalGetContext.call(this, contextType, ...args);
      };
    });

    // Reload page to test fallback
    await page.reload();
    await page.waitForTimeout(3000);

    const fallbackInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { canvasPresent: false };

      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const ctx2d = canvas.getContext('2d');

      return {
        canvasPresent: true,
        webglSupported: !!gl,
        canvas2dSupported: !!ctx2d,
        fallbackActive: !gl && !!ctx2d,
        errorMessages: Array.from(document.querySelectorAll('[class*="error"], [class*="warning"]')).map(el => el.textContent)
      };
    });

    console.log('Fallback Info:', fallbackInfo);

    // Check if application handles WebGL failure gracefully
    expect(fallbackInfo.canvasPresent).toBe(true);

    // Look for error messages or fallback indicators
    const errorMessages = await page.locator('text=/webgl|WebGL|graphics|fallback/i').count();
    console.log(`Found ${errorMessages} potential WebGL-related messages`);

    await page.screenshot({
      path: `./test-results/canvas-webgl-fallback.png`,
      fullPage: true
    });

    // Test 3: Check for graceful degradation
    const pageStillFunctional = await page.evaluate(() => {
      // Check if basic page functionality still works
      const buttons = document.querySelectorAll('button');
      const links = document.querySelectorAll('a');
      const inputs = document.querySelectorAll('input');

      return {
        buttonsPresent: buttons.length > 0,
        linksPresent: links.length > 0,
        inputsPresent: inputs.length > 0,
        pageResponsive: document.body.offsetWidth > 0
      };
    });

    console.log('Page functionality after WebGL failure:', pageStillFunctional);
    expect(pageStillFunctional.pageResponsive).toBe(true);

    console.log('✅ WebGL compatibility and fallback testing completed');
  });

  test('Canvas Error Handling and Edge Cases', async () => {
    console.log('🚨 Testing Canvas Error Handling and Edge Cases');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Test 1: Rapid interaction stress test
    const canvas = await page.locator('canvas').first();
    const bounds = await canvas.boundingBox();

    if (bounds) {
      console.log('Performing rapid interaction stress test...');

      // Rapid mouse movements and clicks
      for (let i = 0; i < 20; i++) {
        const x = bounds.x + Math.random() * bounds.width;
        const y = bounds.y + Math.random() * bounds.height;
        await page.mouse.move(x, y);
        if (i % 3 === 0) await page.mouse.click(x, y);
        if (i % 5 === 0) await page.mouse.wheel(0, Math.random() > 0.5 ? 100 : -100);
      }
    }

    // Test 2: Memory stress test
    console.log('Performing memory stress test...');
    const memoryBefore = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Simulate heavy operations
    await page.evaluate(() => {
      // Create and destroy many objects to test memory handling
      for (let i = 0; i < 1000; i++) {
        const array = new Array(1000).fill(Math.random());
        // Let it be garbage collected
      }
    });

    const memoryAfter = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    console.log(`Memory usage: ${memoryBefore} -> ${memoryAfter} (diff: ${memoryAfter - memoryBefore})`);

    // Test 3: Check for console errors
    const errorCount = consoleMessages.filter(msg => msg.includes('[error]') || msg.includes('ERROR')).length;
    console.log(`Console errors detected: ${errorCount}`);

    // Allow some errors but not excessive amounts
    expect(errorCount).toBeLessThan(10);

    // Test 4: Canvas context loss simulation
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const gl = canvas.getContext('webgl');
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            console.log('Simulating WebGL context loss...');
            ext.loseContext();

            // Restore context after a delay
            setTimeout(() => {
              ext.restoreContext();
              console.log('WebGL context restored');
            }, 1000);
          }
        }
      }
    });

    await page.waitForTimeout(2000);

    // Verify canvas is still functional after context loss
    const canvasStillWorks = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas && canvas.width > 0 && canvas.height > 0;
    });

    expect(canvasStillWorks).toBe(true);

    await page.screenshot({
      path: `./test-results/canvas-error-handling.png`,
      fullPage: true
    });

    console.log('✅ Canvas error handling and edge cases testing completed');
  });

  test('Canvas Integration with UI Controls', async () => {
    console.log('🎛️ Testing Canvas Integration with UI Controls');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Test grid toggle
    const gridToggle = page.locator('button:has-text("Grid"), button[aria-label*="grid"], input[type="checkbox"]:near(text="Grid")').first();
    if (await gridToggle.count() > 0) {
      console.log('Testing grid toggle...');
      await gridToggle.click();
      await page.waitForTimeout(500);
      await gridToggle.click();
      await page.waitForTimeout(500);
    }

    // Test view controls
    const viewControls = page.locator('button:has-text("View"), button:has-text("Reset"), button[aria-label*="view"]');
    const viewControlCount = await viewControls.count();
    console.log(`Found ${viewControlCount} view controls`);

    for (let i = 0; i < Math.min(viewControlCount, 3); i++) {
      await viewControls.nth(i).click();
      await page.waitForTimeout(300);
    }

    // Test toolbar integration
    const toolbarButtons = page.locator('button:has-text("Zoom"), button:has-text("Pan"), button:has-text("Rotate")');
    const toolbarCount = await toolbarButtons.count();
    console.log(`Found ${toolbarCount} toolbar buttons`);

    for (let i = 0; i < Math.min(toolbarCount, 5); i++) {
      await toolbarButtons.nth(i).click();
      await page.waitForTimeout(200);
    }

    // Test property panels
    const propertyPanels = page.locator('[class*="property"], [class*="panel"], [data-testid*="panel"]');
    const panelCount = await propertyPanels.count();
    console.log(`Found ${panelCount} property panels`);

    // Verify canvas responds to UI changes
    const canvasResponsive = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas && canvas.offsetParent !== null;
    });

    expect(canvasResponsive).toBe(true);

    await page.screenshot({
      path: `./test-results/canvas-ui-integration.png`,
      fullPage: true
    });

    console.log('✅ Canvas integration with UI controls testing completed');
  });
});
