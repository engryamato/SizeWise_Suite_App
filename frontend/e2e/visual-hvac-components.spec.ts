import { test, expect } from '@playwright/test';
import { VisualTestHelper } from './utils/visual-test-helpers';

/**
 * Visual Regression Tests for HVAC-Specific Components
 * 
 * This test suite focuses on visual testing of HVAC calculation interfaces,
 * 3D visualization components, and domain-specific UI elements.
 */

test.describe('HVAC Components Visual Regression', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
    await visualHelper.prepareForVisualTest();
    await visualHelper.mockAuthentication('premium');
  });

  test.describe('Air Duct Sizer Components', () => {
    
    test('air duct calculator form states', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await visualHelper.waitForStableElements(['[data-testid="air-duct-calculator"]']);
      
      // Empty form state
      await visualHelper.takeScreenshot('air-duct-form-empty.png', 
        page.locator('[data-testid="air-duct-calculator"]'));
      
      // Filled form state
      await visualHelper.setConsistentTestData();
      await visualHelper.takeScreenshot('air-duct-form-filled.png',
        page.locator('[data-testid="air-duct-calculator"]'));
      
      // Results state
      await page.click('[data-testid="calculate-button"]');
      await page.waitForSelector('[data-testid="calculation-results"]', { timeout: 10000 });
      await visualHelper.takeScreenshot('air-duct-form-with-results.png',
        page.locator('[data-testid="air-duct-calculator"]'), { fullPage: true });
    });

    test('duct size visualization component', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await visualHelper.setConsistentTestData();
      await page.click('[data-testid="calculate-button"]');
      
      await page.waitForSelector('[data-testid="duct-visualization"]', { timeout: 10000 });
      
      // Test different duct shapes
      const ductShapes = ['rectangular', 'round', 'oval'];
      for (const shape of ductShapes) {
        await page.selectOption('[data-testid="duct-shape-select"]', shape);
        await page.waitForTimeout(1000); // Wait for visualization update
        
        await visualHelper.takeScreenshot(`duct-visualization-${shape}.png`,
          page.locator('[data-testid="duct-visualization"]'));
      }
    });

    test('material selection component', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      
      // Test material dropdown states
      const materialDropdown = page.locator('[data-testid="material-select"]');
      
      // Closed state
      await visualHelper.takeScreenshot('material-select-closed.png', materialDropdown);
      
      // Open state
      await materialDropdown.click();
      await page.waitForSelector('[data-testid="material-options"]');
      await visualHelper.takeScreenshot('material-select-open.png',
        page.locator('[data-testid="material-dropdown-container"]'));
      
      // Selected state
      await page.click('[data-testid="material-option-galvanized-steel"]');
      await visualHelper.takeScreenshot('material-select-selected.png', materialDropdown);
    });
  });

  test.describe('3D Visualization Components', () => {
    
    test('3D canvas with different fitting types', async ({ page }) => {
      await page.goto('/tools/3d-visualization');
      await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 15000 });
      
      // Wait for 3D scene to fully load
      await page.waitForTimeout(3000);
      
      // Test different fitting types
      const fittingTypes = ['elbow-90', 'tee', 'reducer', 'transition'];
      
      for (const fitting of fittingTypes) {
        await page.click(`[data-testid="fitting-${fitting}"]`);
        await page.waitForTimeout(2000); // Wait for 3D rendering
        
        await visualHelper.takeScreenshot(`3d-canvas-${fitting}.png`,
          page.locator('[data-testid="3d-canvas"]'), {
            threshold: 0.3, // Higher threshold for 3D content
            maxDiffPixels: 2000
          });
      }
    });

    test('3D controls and toolbar', async ({ page }) => {
      await page.goto('/tools/3d-visualization');
      await visualHelper.waitForStableElements(['[data-testid="3d-controls-panel"]']);
      
      // Main controls panel
      await visualHelper.takeScreenshot('3d-controls-panel.png',
        page.locator('[data-testid="3d-controls-panel"]'));
      
      // View controls
      await visualHelper.takeScreenshot('3d-view-controls.png',
        page.locator('[data-testid="3d-view-controls"]'));
      
      // Fitting library
      await visualHelper.takeScreenshot('3d-fitting-library.png',
        page.locator('[data-testid="fitting-library"]'));
    });

    test('3D scene with different view angles', async ({ page }) => {
      await page.goto('/tools/3d-visualization');
      await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 15000 });
      await page.waitForTimeout(3000);
      
      // Add a fitting to the scene
      await page.click('[data-testid="fitting-elbow-90"]');
      await page.waitForTimeout(2000);
      
      // Test different view angles
      const viewAngles = ['front', 'back', 'left', 'right', 'top', 'bottom', 'isometric'];
      
      for (const angle of viewAngles) {
        await page.click(`[data-testid="view-${angle}"]`);
        await page.waitForTimeout(1500); // Wait for camera transition
        
        await visualHelper.takeScreenshot(`3d-view-${angle}.png`,
          page.locator('[data-testid="3d-canvas"]'), {
            threshold: 0.3,
            maxDiffPixels: 2000
          });
      }
    });
  });

  test.describe('Calculation Results Components', () => {
    
    test('results table with different data sets', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await visualHelper.setConsistentTestData();
      await page.click('[data-testid="calculate-button"]');
      
      await page.waitForSelector('[data-testid="results-table"]', { timeout: 10000 });
      
      // Standard results table
      await visualHelper.takeScreenshot('results-table-standard.png',
        page.locator('[data-testid="results-table"]'));
      
      // Switch to detailed view
      await page.click('[data-testid="detailed-view-toggle"]');
      await visualHelper.takeScreenshot('results-table-detailed.png',
        page.locator('[data-testid="results-table"]'));
      
      // Switch to comparison view
      await page.click('[data-testid="comparison-view-toggle"]');
      await visualHelper.takeScreenshot('results-table-comparison.png',
        page.locator('[data-testid="results-table"]'));
    });

    test('pressure loss charts', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await visualHelper.setConsistentTestData();
      await page.click('[data-testid="calculate-button"]');
      
      await page.waitForSelector('[data-testid="pressure-loss-chart"]', { timeout: 10000 });
      
      // Wait for chart to render
      await page.waitForTimeout(2000);
      
      await visualHelper.takeScreenshot('pressure-loss-chart.png',
        page.locator('[data-testid="pressure-loss-chart"]'));
    });

    test('velocity profile visualization', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await visualHelper.setConsistentTestData();
      await page.click('[data-testid="calculate-button"]');
      
      await page.waitForSelector('[data-testid="velocity-profile"]', { timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for visualization to render
      
      await visualHelper.takeScreenshot('velocity-profile.png',
        page.locator('[data-testid="velocity-profile"]'));
    });
  });

  test.describe('Export and Report Components', () => {
    
    test('calculation report preview', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await visualHelper.setConsistentTestData();
      await page.click('[data-testid="calculate-button"]');
      
      // Open report preview
      await page.click('[data-testid="preview-report-button"]');
      await page.waitForSelector('[data-testid="report-preview"]', { timeout: 10000 });
      
      await visualHelper.takeScreenshot('calculation-report-preview.png',
        page.locator('[data-testid="report-preview"]'), { fullPage: true });
    });

    test('export options modal', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await visualHelper.setConsistentTestData();
      await page.click('[data-testid="calculate-button"]');
      
      // Open export modal
      await page.click('[data-testid="export-button"]');
      await page.waitForSelector('[data-testid="export-modal"]', { timeout: 10000 });
      
      await visualHelper.takeScreenshot('export-modal.png',
        page.locator('[data-testid="export-modal"]'));
      
      // Test different export format selections
      const formats = ['pdf', 'excel', 'csv', 'json'];
      for (const format of formats) {
        await page.click(`[data-testid="export-format-${format}"]`);
        await visualHelper.takeScreenshot(`export-modal-${format}.png`,
          page.locator('[data-testid="export-modal"]'));
      }
    });
  });

  test.describe('Error States and Validation', () => {
    
    test('form validation error states', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      
      // Submit empty form to trigger validation
      await page.click('[data-testid="calculate-button"]');
      await page.waitForSelector('[data-testid="validation-errors"]', { timeout: 5000 });
      
      await visualHelper.takeScreenshot('form-validation-errors.png',
        page.locator('[data-testid="air-duct-calculator"]'));
    });

    test('calculation error states', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      
      // Enter invalid data that will cause calculation errors
      await page.fill('[data-testid="airflow-input"]', '-1000');
      await page.fill('[data-testid="velocity-input"]', '0');
      await page.click('[data-testid="calculate-button"]');
      
      await page.waitForSelector('[data-testid="calculation-error"]', { timeout: 10000 });
      
      await visualHelper.takeScreenshot('calculation-error-state.png',
        page.locator('[data-testid="calculation-error"]'));
    });

    test('3D rendering error state', async ({ page }) => {
      // Mock WebGL failure
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextType) {
          if (contextType === 'webgl' || contextType === 'webgl2') {
            return null; // Simulate WebGL failure
          }
          return originalGetContext.call(this, contextType);
        };
      });
      
      await page.goto('/tools/3d-visualization');
      await page.waitForSelector('[data-testid="3d-error-fallback"]', { timeout: 10000 });
      
      await visualHelper.takeScreenshot('3d-rendering-error.png',
        page.locator('[data-testid="3d-error-fallback"]'));
    });
  });

  test.describe('Responsive HVAC Components', () => {
    
    test('air duct calculator on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/air-duct-sizer');
      await visualHelper.waitForStableElements(['[data-testid="air-duct-calculator"]']);
      
      await visualHelper.takeScreenshot('air-duct-calculator-tablet.png',
        undefined, { fullPage: true });
    });

    test('3D visualization on large desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/tools/3d-visualization');
      await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 15000 });
      await page.waitForTimeout(3000);
      
      await visualHelper.takeScreenshot('3d-visualization-large-desktop.png',
        undefined, { fullPage: true, threshold: 0.3, maxDiffPixels: 2000 });
    });
  });
});
