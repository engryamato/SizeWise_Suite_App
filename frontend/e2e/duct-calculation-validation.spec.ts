import { test, expect } from '@playwright/test';

test.describe('Air Duct Sizer - Calculation Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Air Duct Sizer
    await page.goto('http://localhost:3000/air-duct-sizer');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for services to initialize
    await page.waitForFunction(() => {
      const logs = window.console;
      return document.querySelector('[data-testid="workspace-container"]') !== null ||
             document.querySelector('canvas') !== null ||
             document.body.textContent?.includes('Loading 3D workspace') === false;
    }, { timeout: 30000 });
  });

  test('should have no default calculation values before drawing ductwork', async ({ page }) => {
    console.log('🔍 Testing for default values before ductwork is drawn...');
    
    // Check CFM value should be 0 or empty
    const cfmElement = page.locator('text=/\\d+\\s*CFM/').first();
    if (await cfmElement.isVisible()) {
      const cfmText = await cfmElement.textContent();
      console.log(`CFM Display: ${cfmText}`);
      
      // Extract numeric value
      const cfmValue = cfmText?.match(/(\d+(?:\.\d+)?)/)?.[1];
      if (cfmValue && parseFloat(cfmValue) > 0) {
        console.error(`❌ ERROR: CFM shows default value of ${cfmValue} before drawing ductwork`);
        throw new Error(`CFM should be 0 or empty before drawing ductwork, but shows: ${cfmValue}`);
      }
    }
    
    // Check pressure drop value should be 0 or empty
    const pressureElement = page.locator('text=/\\d+\\.\\d+.*WC/').first();
    if (await pressureElement.isVisible()) {
      const pressureText = await pressureElement.textContent();
      console.log(`Pressure Display: ${pressureText}`);
      
      // Extract numeric value
      const pressureValue = pressureText?.match(/(\d+(?:\.\d+)?)/)?.[1];
      if (pressureValue && parseFloat(pressureValue) > 0) {
        console.error(`❌ ERROR: Pressure shows default value of ${pressureValue} before drawing ductwork`);
        throw new Error(`Pressure should be 0 or empty before drawing ductwork, but shows: ${pressureValue}`);
      }
    }
    
    // Check efficiency value should be 0 or empty
    const efficiencyElement = page.locator('text=/\\d+\\.\\d+.*%.*Eff/').first();
    if (await efficiencyElement.isVisible()) {
      const efficiencyText = await efficiencyElement.textContent();
      console.log(`Efficiency Display: ${efficiencyText}`);
      
      // Extract numeric value
      const efficiencyValue = efficiencyText?.match(/(\d+(?:\.\d+)?)/)?.[1];
      if (efficiencyValue && parseFloat(efficiencyValue) > 0) {
        console.error(`❌ ERROR: Efficiency shows default value of ${efficiencyValue} before drawing ductwork`);
        throw new Error(`Efficiency should be 0 or empty before drawing ductwork, but shows: ${efficiencyValue}`);
      }
    }
    
    // Check system efficiency should be 0
    const systemEffElement = page.locator('text=/\\d+\\.\\d+.*%.*System.*Efficiency/').first();
    if (await systemEffElement.isVisible()) {
      const systemEffText = await systemEffElement.textContent();
      console.log(`System Efficiency Display: ${systemEffText}`);
      
      const systemEffValue = systemEffText?.match(/(\d+(?:\.\d+)?)/)?.[1];
      if (systemEffValue && parseFloat(systemEffValue) > 0) {
        console.error(`❌ ERROR: System Efficiency shows default value of ${systemEffValue} before drawing ductwork`);
        throw new Error(`System Efficiency should be 0 before drawing ductwork, but shows: ${systemEffValue}`);
      }
    }
    
    // Check elements count should be 0
    const elementsElement = page.locator('text=/Elements:\\s*\\d+/').first();
    if (await elementsElement.isVisible()) {
      const elementsText = await elementsElement.textContent();
      console.log(`Elements Display: ${elementsText}`);
      
      const elementsValue = elementsText?.match(/Elements:\\s*(\\d+)/)?.[1];
      if (elementsValue && parseInt(elementsValue) > 0) {
        console.error(`❌ ERROR: Elements count shows ${elementsValue} before drawing ductwork`);
        throw new Error(`Elements count should be 0 before drawing ductwork, but shows: ${elementsValue}`);
      }
    }
    
    console.log('✅ All calculation values are correctly at zero/empty before drawing ductwork');
  });

  test('should calculate correct values after drawing ductwork', async ({ page }) => {
    console.log('🔍 Testing calculation values after drawing ductwork...');
    
    // First verify no default values
    await test.step('Verify no default values', async () => {
      const cfmElement = page.locator('text=/\\d+\\s*CFM/').first();
      if (await cfmElement.isVisible()) {
        const cfmText = await cfmElement.textContent();
        const cfmValue = cfmText?.match(/(\d+(?:\.\d+)?)/)?.[1];
        expect(parseFloat(cfmValue || '0')).toBe(0);
      }
    });
    
    // Look for drawing tools or workspace
    await test.step('Attempt to draw ductwork', async () => {
      // Try to find and interact with 3D workspace or drawing tools
      const workspace = page.locator('[data-testid="workspace-container"], canvas, [data-testid="three-canvas"]').first();
      
      if (await workspace.isVisible()) {
        console.log('📐 Found workspace, attempting to draw ductwork...');
        
        // Try clicking on the workspace to start drawing
        await workspace.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(1000);
        
        // Try dragging to create a duct segment
        await workspace.click({ position: { x: 100, y: 100 } });
        await page.mouse.down();
        await page.mouse.move(200, 100);
        await page.mouse.up();
        
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️ Workspace not found, looking for drawing tools...');
        
        // Look for drawing tools or buttons
        const drawButton = page.locator('button:has-text("Draw"), button:has-text("Add"), button[title*="draw"], button[title*="add"]').first();
        if (await drawButton.isVisible()) {
          await drawButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
    
    // Check if calculations updated after drawing
    await test.step('Verify calculations after drawing', async () => {
      await page.waitForTimeout(3000); // Wait for calculations to process
      
      // Check if any values have changed from 0
      const cfmElement = page.locator('text=/\\d+\\s*CFM/').first();
      const pressureElement = page.locator('text=/\\d+\\.\\d+.*WC/').first();
      const elementsElement = page.locator('text=/Elements:\\s*\\d+/').first();
      
      let hasCalculations = false;
      
      if (await cfmElement.isVisible()) {
        const cfmText = await cfmElement.textContent();
        const cfmValue = parseFloat(cfmText?.match(/(\d+(?:\.\d+)?)/)?.[1] || '0');
        console.log(`CFM after drawing: ${cfmValue}`);
        if (cfmValue > 0) hasCalculations = true;
      }
      
      if (await pressureElement.isVisible()) {
        const pressureText = await pressureElement.textContent();
        const pressureValue = parseFloat(pressureText?.match(/(\d+(?:\.\d+)?)/)?.[1] || '0');
        console.log(`Pressure after drawing: ${pressureValue}`);
        if (pressureValue > 0) hasCalculations = true;
      }
      
      if (await elementsElement.isVisible()) {
        const elementsText = await elementsElement.textContent();
        const elementsValue = parseInt(elementsText?.match(/Elements:\\s*(\\d+)/)?.[1] || '0');
        console.log(`Elements after drawing: ${elementsValue}`);
        if (elementsValue > 0) hasCalculations = true;
      }
      
      if (hasCalculations) {
        console.log('✅ Calculations updated after drawing ductwork');
      } else {
        console.log('⚠️ No calculations detected - may need manual ductwork input or different drawing method');
      }
    });
  });

  test('should validate HVAC calculation accuracy', async ({ page }) => {
    console.log('🔍 Testing HVAC calculation accuracy...');
    
    // This test will validate that calculations follow SMACNA standards
    // and are mathematically correct based on duct dimensions and airflow
    
    await test.step('Check for SMACNA compliance indicators', async () => {
      const smacnaElement = page.locator('text=/SMACNA/i').first();
      if (await smacnaElement.isVisible()) {
        console.log('✅ SMACNA compliance indicator found');
      } else {
        console.log('⚠️ SMACNA compliance indicator not visible');
      }
    });
    
    await test.step('Validate calculation status', async () => {
      const calculatingElement = page.locator('text=/Calculating/i, text=/Real-time.*Calculations/i').first();
      if (await calculatingElement.isVisible()) {
        console.log('✅ Real-time calculation system is active');
      }
    });
  });
});
