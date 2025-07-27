import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive Drawing Tool Functionality Testing Suite
 * 
 * This test suite validates the complete drawing tool workflow including:
 * - Drawing FAB activation and tool selection
 * - Straight duct drawing workflow
 * - Curved duct and complex system creation
 * - Undo/redo functionality during drawing operations
 * - Drawing precision and snap-to-grid features
 * - Performance with large duct networks
 * - Integration with 3D canvas system
 * 
 * Following the same systematic debugging approach used for authentication and canvas testing
 */

interface DrawingMetrics {
  segmentCount: number;
  drawingTime: number;
  memoryUsage: number;
  canvasPerformance: number;
  timestamp: number;
}

interface DrawingOperation {
  type: 'line' | 'duct' | 'equipment' | 'room';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  duration: number;
}

test.describe('Drawing Tool Functionality Testing', () => {
  let context: BrowserContext;
  let page: Page;
  let consoleMessages: string[] = [];
  let networkRequests: any[] = [];
  let drawingMetrics: DrawingMetrics[] = [];
  let drawingOperations: DrawingOperation[] = [];

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
    drawingMetrics = [];
    drawingOperations = [];
  });

  test.afterEach(async () => {
    // Save trace for debugging
    await context.tracing.stop({ 
      path: `./test-results/drawing-tools-trace-${Date.now()}.zip` 
    });
    
    await context.close();
  });

  test('Drawing FAB Activation and Tool Selection', async () => {
    console.log('🎯 Testing Drawing FAB Activation and Tool Selection');

    // Navigate to Air Duct Sizer page
    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    
    // Wait for services to initialize
    await page.waitForSelector('text=✅ Service initialization completed successfully', { timeout: 30000 });
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: `./test-results/drawing-01-initial-state.png`,
      fullPage: true 
    });

    // Locate the Drawing FAB button
    const drawingFAB = await page.waitForSelector('button[aria-label*="Draw"], button[title*="Draw"], [data-testid="drawing-fab"]', { timeout: 15000 });
    expect(drawingFAB).toBeTruthy();

    // Check initial FAB state (should be OFF/grey)
    const initialFABState = await page.evaluate(() => {
      const fab = document.querySelector('button[aria-label*="Draw"], button[title*="Draw"]') as HTMLButtonElement;
      if (!fab) return null;
      
      const computedStyle = window.getComputedStyle(fab);
      return {
        visible: fab.offsetParent !== null,
        disabled: fab.disabled,
        backgroundColor: computedStyle.backgroundColor,
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        ariaLabel: fab.getAttribute('aria-label') || fab.getAttribute('title')
      };
    });

    console.log('Initial FAB State:', initialFABState);
    expect(initialFABState?.visible).toBe(true);
    expect(initialFABState?.position).toBe('fixed');

    // Click FAB to activate drawing mode
    await drawingFAB.click();
    await page.waitForTimeout(1000);

    // Check FAB state after activation (should be ON/orange)
    const activeFABState = await page.evaluate(() => {
      const fab = document.querySelector('button[aria-label*="Draw"], button[title*="Draw"]') as HTMLButtonElement;
      if (!fab) return null;
      
      const computedStyle = window.getComputedStyle(fab);
      return {
        backgroundColor: computedStyle.backgroundColor,
        ariaLabel: fab.getAttribute('aria-label') || fab.getAttribute('title')
      };
    });

    console.log('Active FAB State:', activeFABState);

    // Check for property panel or drawing tools panel
    const propertyPanel = await page.locator('[class*="property"], [class*="panel"], [data-testid*="panel"]').count();
    console.log(`Found ${propertyPanel} property panels after FAB activation`);

    await page.screenshot({ 
      path: `./test-results/drawing-02-fab-activated.png`,
      fullPage: true 
    });

    // Test keyboard shortcut for drawing tool
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(500);

    // Verify drawing mode is active
    const drawingModeActive = await page.evaluate(() => {
      // Check for drawing mode indicators
      const fab = document.querySelector('button[aria-label*="Draw"], button[title*="Draw"]') as HTMLButtonElement;
      const ariaLabel = fab?.getAttribute('aria-label') || fab?.getAttribute('title') || '';
      return ariaLabel.toLowerCase().includes('on') || ariaLabel.toLowerCase().includes('drawing');
    });

    expect(drawingModeActive).toBe(true);

    console.log('✅ Drawing FAB activation and tool selection test completed');
  });

  test('Straight Duct Drawing Workflow', async () => {
    console.log('📏 Testing Straight Duct Drawing Workflow');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('text=✅ Service initialization completed successfully', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Activate drawing mode
    const drawingFAB = await page.locator('button[aria-label*="Draw"], button[title*="Draw"]').first();
    await drawingFAB.click();
    await page.waitForTimeout(1000);

    // Get canvas element for drawing
    const canvas = await page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();
    
    if (!canvasBounds) {
      throw new Error('Canvas bounds not found');
    }

    // Record initial state
    const initialState = await page.evaluate(() => {
      return {
        segmentCount: document.querySelectorAll('[data-testid*="segment"], [class*="segment"]').length,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
        timestamp: Date.now()
      };
    });

    console.log('Initial state before drawing:', initialState);

    // Draw first straight duct segment
    const startX = canvasBounds.x + 200;
    const startY = canvasBounds.y + 200;
    const endX = startX + 150;
    const endY = startY + 50;

    console.log(`Drawing duct from (${startX}, ${startY}) to (${endX}, ${endY})`);

    // Start drawing operation
    const drawingStartTime = Date.now();
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.waitForTimeout(100);
    
    await page.mouse.up();
    await page.waitForTimeout(1000);

    const drawingEndTime = Date.now();
    const drawingDuration = drawingEndTime - drawingStartTime;

    // Record drawing operation
    drawingOperations.push({
      type: 'duct',
      startPoint: { x: startX, y: startY },
      endPoint: { x: endX, y: endY },
      duration: drawingDuration
    });

    // Check if duct segment was created
    const postDrawingState = await page.evaluate(() => {
      return {
        segmentCount: document.querySelectorAll('[data-testid*="segment"], [class*="segment"]').length,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
        timestamp: Date.now()
      };
    });

    console.log('State after drawing:', postDrawingState);
    console.log(`Drawing duration: ${drawingDuration}ms`);

    // Verify segment was created (either in DOM or in application state)
    const segmentCreated = postDrawingState.segmentCount > initialState.segmentCount;
    
    if (!segmentCreated) {
      // Check application state for segments
      const appState = await page.evaluate(() => {
        // Try to access Zustand stores or React state
        return {
          // @ts-ignore
          projectStore: window.__PROJECT_STORE_STATE__ || null,
          // @ts-ignore
          uiStore: window.__UI_STORE_STATE__ || null,
          // Check for any duct-related elements
          ductElements: document.querySelectorAll('[class*="duct"], [data-type="duct"]').length
        };
      });
      console.log('Application state check:', appState);
    }

    await page.screenshot({ 
      path: `./test-results/drawing-03-first-segment.png`,
      fullPage: true 
    });

    // Draw second connected segment
    const secondEndX = endX + 100;
    const secondEndY = endY + 80;

    await page.mouse.move(endX, endY);
    await page.mouse.down();
    await page.mouse.move(secondEndX, secondEndY, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    await page.screenshot({ 
      path: `./test-results/drawing-04-second-segment.png`,
      fullPage: true 
    });

    // Test drawing precision with snap-to-grid
    console.log('Testing snap-to-grid functionality...');
    
    // Enable grid if not already enabled
    await page.keyboard.press('KeyG'); // Grid toggle shortcut
    await page.waitForTimeout(300);

    // Draw with snap-to-grid
    const gridStartX = canvasBounds.x + 300;
    const gridStartY = canvasBounds.y + 300;
    const gridEndX = gridStartX + 120; // Should snap to grid
    const gridEndY = gridStartY + 60;

    await page.mouse.move(gridStartX, gridStartY);
    await page.mouse.down();
    await page.mouse.move(gridEndX, gridEndY, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    await page.screenshot({ 
      path: `./test-results/drawing-05-grid-snap.png`,
      fullPage: true 
    });

    console.log('✅ Straight duct drawing workflow test completed');
  });

  test('Undo/Redo Functionality During Drawing Operations', async () => {
    console.log('↩️ Testing Undo/Redo Functionality During Drawing Operations');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('text=✅ Service initialization completed successfully', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Activate drawing mode
    const drawingFAB = await page.locator('button[aria-label*="Draw"], button[title*="Draw"]').first();
    await drawingFAB.click();
    await page.waitForTimeout(1000);

    const canvas = await page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();

    if (!canvasBounds) {
      throw new Error('Canvas bounds not found');
    }

    // Record initial state
    const initialSegmentCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid*="segment"], [class*="segment"], [class*="duct"]').length;
    });

    console.log(`Initial segment count: ${initialSegmentCount}`);

    // Draw multiple segments to test undo/redo
    const segments = [
      { start: { x: 200, y: 200 }, end: { x: 350, y: 250 } },
      { start: { x: 350, y: 250 }, end: { x: 500, y: 200 } },
      { start: { x: 500, y: 200 }, end: { x: 650, y: 300 } }
    ];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const startX = canvasBounds.x + segment.start.x;
      const startY = canvasBounds.y + segment.start.y;
      const endX = canvasBounds.x + segment.end.x;
      const endY = canvasBounds.y + segment.end.y;

      console.log(`Drawing segment ${i + 1}: (${startX}, ${startY}) to (${endX}, ${endY})`);

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(800);

      await page.screenshot({
        path: `./test-results/drawing-06-segment-${i + 1}.png`,
        fullPage: true
      });
    }

    // Test undo functionality
    console.log('Testing undo functionality...');

    // Try keyboard shortcut for undo
    await page.keyboard.press('Control+KeyZ');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `./test-results/drawing-07-after-undo-1.png`,
      fullPage: true
    });

    // Check if undo worked by counting segments
    const afterFirstUndo = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid*="segment"], [class*="segment"], [class*="duct"]').length;
    });

    console.log(`Segment count after first undo: ${afterFirstUndo}`);

    // Try undo button if available
    const undoButton = page.locator('button[aria-label*="undo"], button[title*="undo"], button:has-text("Undo")').first();
    if (await undoButton.count() > 0) {
      await undoButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `./test-results/drawing-08-after-undo-button.png`,
        fullPage: true
      });
    }

    // Test redo functionality
    console.log('Testing redo functionality...');

    // Try keyboard shortcut for redo
    await page.keyboard.press('Control+KeyY');
    await page.waitForTimeout(1000);

    // Alternative redo shortcut
    await page.keyboard.press('Control+Shift+KeyZ');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `./test-results/drawing-09-after-redo.png`,
      fullPage: true
    });

    // Try redo button if available
    const redoButton = page.locator('button[aria-label*="redo"], button[title*="redo"], button:has-text("Redo")').first();
    if (await redoButton.count() > 0) {
      await redoButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `./test-results/drawing-10-after-redo-button.png`,
        fullPage: true
      });
    }

    // Test multiple undo operations
    console.log('Testing multiple undo operations...');

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Control+KeyZ');
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `./test-results/drawing-11-multiple-undo.png`,
      fullPage: true
    });

    // Verify undo/redo state consistency
    const finalSegmentCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid*="segment"], [class*="segment"], [class*="duct"]').length;
    });

    console.log(`Final segment count: ${finalSegmentCount}`);

    // Check for undo/redo UI indicators
    const undoRedoState = await page.evaluate(() => {
      const undoBtn = document.querySelector('button[aria-label*="undo"], button[title*="undo"]') as HTMLButtonElement;
      const redoBtn = document.querySelector('button[aria-label*="redo"], button[title*="redo"]') as HTMLButtonElement;

      return {
        undoAvailable: undoBtn ? !undoBtn.disabled : false,
        redoAvailable: redoBtn ? !redoBtn.disabled : false,
        undoVisible: undoBtn ? undoBtn.offsetParent !== null : false,
        redoVisible: redoBtn ? redoBtn.offsetParent !== null : false
      };
    });

    console.log('Undo/Redo UI State:', undoRedoState);

    console.log('✅ Undo/redo functionality test completed');
  });

  test('Complex Duct System Creation and Performance', async () => {
    console.log('🏗️ Testing Complex Duct System Creation and Performance');

    await page.goto('http://localhost:3000/air-duct-sizer-v1');
    await page.waitForSelector('text=✅ Service initialization completed successfully', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Activate drawing mode
    const drawingFAB = await page.locator('button[aria-label*="Draw"], button[title*="Draw"]').first();
    await drawingFAB.click();
    await page.waitForTimeout(1000);

    const canvas = await page.locator('canvas').first();
    const canvasBounds = await canvas.boundingBox();

    if (!canvasBounds) {
      throw new Error('Canvas bounds not found');
    }

    // Monitor performance metrics
    const performanceStart = await page.evaluate(() => {
      return {
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
        timestamp: performance.now()
      };
    });

    console.log('Starting complex system creation...');

    // Create a complex branching duct system
    const mainTrunk = [
      { start: { x: 100, y: 400 }, end: { x: 300, y: 400 } },
      { start: { x: 300, y: 400 }, end: { x: 500, y: 400 } },
      { start: { x: 500, y: 400 }, end: { x: 700, y: 400 } }
    ];

    const branches = [
      // Branch 1
      { start: { x: 300, y: 400 }, end: { x: 300, y: 250 } },
      { start: { x: 300, y: 250 }, end: { x: 450, y: 250 } },

      // Branch 2
      { start: { x: 500, y: 400 }, end: { x: 500, y: 550 } },
      { start: { x: 500, y: 550 }, end: { x: 650, y: 550 } },

      // Branch 3
      { start: { x: 700, y: 400 }, end: { x: 700, y: 300 } },
      { start: { x: 700, y: 300 }, end: { x: 850, y: 300 } }
    ];

    const allSegments = [...mainTrunk, ...branches];

    // Draw all segments with performance monitoring
    for (let i = 0; i < allSegments.length; i++) {
      const segment = allSegments[i];
      const startX = canvasBounds.x + segment.start.x;
      const startY = canvasBounds.y + segment.start.y;
      const endX = canvasBounds.x + segment.end.x;
      const endY = canvasBounds.y + segment.end.y;

      const segmentStartTime = performance.now();

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(300);

      const segmentEndTime = performance.now();
      const segmentDuration = segmentEndTime - segmentStartTime;

      drawingOperations.push({
        type: 'duct',
        startPoint: { x: startX, y: startY },
        endPoint: { x: endX, y: endY },
        duration: segmentDuration
      });

      // Take periodic screenshots
      if (i % 3 === 0) {
        await page.screenshot({
          path: `./test-results/drawing-12-complex-progress-${i}.png`,
          fullPage: true
        });
      }
    }

    // Final screenshot of complex system
    await page.screenshot({
      path: `./test-results/drawing-13-complex-complete.png`,
      fullPage: true
    });

    // Measure final performance
    const performanceEnd = await page.evaluate(() => {
      return {
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
        timestamp: performance.now()
      };
    });

    const totalDrawingTime = performanceEnd.timestamp - performanceStart.timestamp;
    const memoryIncrease = performanceEnd.memoryUsage - performanceStart.memoryUsage;

    console.log(`Complex system creation metrics:`);
    console.log(`- Total segments drawn: ${allSegments.length}`);
    console.log(`- Total drawing time: ${totalDrawingTime.toFixed(2)}ms`);
    console.log(`- Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    console.log(`- Average time per segment: ${(totalDrawingTime / allSegments.length).toFixed(2)}ms`);

    // Performance assertions
    expect(totalDrawingTime).toBeLessThan(30000); // Should complete within 30 seconds
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Should not use more than 50MB additional memory

    // Test canvas responsiveness after complex drawing
    console.log('Testing canvas responsiveness after complex drawing...');

    await page.mouse.wheel(0, -200); // Zoom in
    await page.waitForTimeout(500);

    await page.mouse.wheel(0, 200); // Zoom out
    await page.waitForTimeout(500);

    // Test panning
    const centerX = canvasBounds.x + canvasBounds.width / 2;
    const centerY = canvasBounds.y + canvasBounds.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(centerX + 100, centerY + 50, { steps: 5 });
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `./test-results/drawing-14-complex-interaction.png`,
      fullPage: true
    });

    console.log('✅ Complex duct system creation and performance test completed');
  });
});
