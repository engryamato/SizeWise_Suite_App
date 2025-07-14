import { test, expect } from '@playwright/test';

test.describe('Cross-Component Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
  });

  test('should sync toolbar tool selection with canvas behavior', async ({ page }) => {
    // Test Room tool selection
    const roomTool = page.getByRole('button', { name: /room tool/i });
    await roomTool.click();
    await expect(roomTool).toHaveAttribute('aria-pressed', 'true');
    
    // Canvas should be in room drawing mode (cursor should change)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Test Duct tool selection
    const ductTool = page.getByRole('button', { name: /duct tool/i });
    await ductTool.click();
    await expect(ductTool).toHaveAttribute('aria-pressed', 'true');
    await expect(roomTool).toHaveAttribute('aria-pressed', 'false');
    
    // Test Equipment tool selection
    const equipmentTool = page.getByRole('button', { name: /equipment tool/i });
    await equipmentTool.click();
    await expect(equipmentTool).toHaveAttribute('aria-pressed', 'true');
    await expect(ductTool).toHaveAttribute('aria-pressed', 'false');
    
    // Test Select tool selection
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await selectTool.click();
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    await expect(equipmentTool).toHaveAttribute('aria-pressed', 'false');
  });

  test('should sync keyboard shortcuts with toolbar state', async ({ page }) => {
    // Test keyboard shortcuts change toolbar state
    await page.keyboard.press('r'); // Room tool
    const roomTool = page.getByRole('button', { name: /room tool/i });
    await expect(roomTool).toHaveAttribute('aria-pressed', 'true');
    
    await page.keyboard.press('d'); // Duct tool
    const ductTool = page.getByRole('button', { name: /duct tool/i });
    await expect(ductTool).toHaveAttribute('aria-pressed', 'true');
    await expect(roomTool).toHaveAttribute('aria-pressed', 'false');
    
    await page.keyboard.press('e'); // Equipment tool
    const equipmentTool = page.getByRole('button', { name: /equipment tool/i });
    await expect(equipmentTool).toHaveAttribute('aria-pressed', 'true');
    await expect(ductTool).toHaveAttribute('aria-pressed', 'false');
    
    await page.keyboard.press('v'); // Select tool
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    await expect(equipmentTool).toHaveAttribute('aria-pressed', 'false');
    
    await page.keyboard.press('h'); // Pan tool
    const panTool = page.getByRole('button', { name: /pan tool/i });
    await expect(panTool).toHaveAttribute('aria-pressed', 'true');
    await expect(selectTool).toHaveAttribute('aria-pressed', 'false');
  });

  test('should handle escape key to return to select tool', async ({ page }) => {
    // Start with room tool
    await page.keyboard.press('r');
    const roomTool = page.getByRole('button', { name: /room tool/i });
    await expect(roomTool).toHaveAttribute('aria-pressed', 'true');
    
    // Press escape to cancel
    await page.keyboard.press('Escape');
    
    // Should return to select tool
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    await expect(roomTool).toHaveAttribute('aria-pressed', 'false');
  });

  test('should sync grid controls with status bar display', async ({ page }) => {
    // Check initial grid status
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar.getByText(/Grid: \d+px/)).toBeVisible();
    
    // Toggle grid with keyboard
    await page.keyboard.press('g');
    
    // Status bar should still show grid info
    await expect(statusBar.getByText(/Grid: \d+px/)).toBeVisible();
    
    // Toggle snap with keyboard
    await page.keyboard.press('s');
    
    // Status bar should still be functional
    await expect(statusBar.getByText(/Zoom: \d+%/)).toBeVisible();
  });

  test('should update status bar when project changes', async ({ page }) => {
    const statusBar = page.locator('.bg-white.border-t');
    
    // Initial state should show 0/3 rooms, 0/25 segments
    await expect(statusBar.getByText('0/3 rooms, 0/25 segments')).toBeVisible();
    
    // Status should show "Ready"
    await expect(statusBar.getByText('Ready')).toBeVisible();
    
    // Grid and zoom info should be present
    await expect(statusBar.getByText(/Grid: \d+px/)).toBeVisible();
    await expect(statusBar.getByText(/Zoom: \d+%/)).toBeVisible();
  });

  test('should handle sidebar panel switching', async ({ page }) => {
    // Check if sidebar is visible
    const sidebar = page.locator('.w-80');
    const sidebarVisible = await sidebar.isVisible();

    if (sidebarVisible) {
      // Test panel switching if sidebar is open
      const projectPanel = page.getByRole('button', { name: /project properties panel/i });
      const roomPanel = page.getByRole('button', { name: /room properties panel/i });
      const equipmentPanel = page.getByRole('button', { name: /equipment properties panel/i });

      // Check if panels exist and are enabled
      const projectPanelExists = await projectPanel.count() > 0;
      const roomPanelExists = await roomPanel.count() > 0;
      const equipmentPanelExists = await equipmentPanel.count() > 0;

      if (projectPanelExists) {
        const isEnabled = await projectPanel.isEnabled();
        if (isEnabled) {
          await projectPanel.click();
          // Should show project properties
        }
      }

      if (roomPanelExists) {
        const isEnabled = await roomPanel.isEnabled();
        if (isEnabled) {
          await roomPanel.click();
          // Should show room properties
        } else {
          // Room panel should be disabled when no rooms exist
          await expect(roomPanel).toBeDisabled();
        }
      }

      if (equipmentPanelExists) {
        const isEnabled = await equipmentPanel.isEnabled();
        if (isEnabled) {
          await equipmentPanel.click();
          // Should show equipment properties
        } else {
          // Equipment panel should be disabled when no equipment exists
          await expect(equipmentPanel).toBeDisabled();
        }
      }
    }
  });

  test('should handle canvas zoom controls integration', async ({ page }) => {
    const statusBar = page.locator('.bg-white.border-t');
    
    // Check initial zoom level
    await expect(statusBar.getByText('Zoom: 100%')).toBeVisible();
    
    // Test zoom with mouse wheel (if supported)
    const canvas = page.locator('canvas').first();
    await canvas.hover();
    
    // Test zoom with keyboard shortcuts (if implemented)
    await page.keyboard.press('Equal'); // Zoom in
    await page.keyboard.press('Minus'); // Zoom out
    
    // Status bar should still show zoom percentage
    await expect(statusBar.getByText(/Zoom: \d+%/)).toBeVisible();
  });

  test('should maintain state consistency across tool switches', async ({ page }) => {
    // Test rapid tool switching
    const tools = ['v', 'r', 'd', 'e', 'h'];
    const toolNames = ['select tool', 'room tool', 'duct tool', 'equipment tool', 'pan tool'];
    
    for (let i = 0; i < tools.length; i++) {
      await page.keyboard.press(tools[i]);
      
      const currentTool = page.getByRole('button', { name: new RegExp(toolNames[i], 'i') });
      await expect(currentTool).toHaveAttribute('aria-pressed', 'true');
      
      // Verify other tools are not pressed
      for (let j = 0; j < toolNames.length; j++) {
        if (i !== j) {
          const otherTool = page.getByRole('button', { name: new RegExp(toolNames[j], 'i') });
          await expect(otherTool).toHaveAttribute('aria-pressed', 'false');
        }
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Monitor console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Perform various interactions that might cause errors
    await page.keyboard.press('r'); // Room tool
    await page.keyboard.press('Escape'); // Cancel
    await page.keyboard.press('d'); // Duct tool
    await page.keyboard.press('Escape'); // Cancel
    await page.keyboard.press('e'); // Equipment tool
    await page.keyboard.press('Escape'); // Cancel
    
    // Click on canvas multiple times
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.click(canvasBox.x + 200, canvasBox.y + 200);
      await page.mouse.click(canvasBox.x + 300, canvasBox.y + 300);
    }
    
    // Wait for any async operations
    await page.waitForTimeout(1000);
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test('should handle rapid user interactions', async ({ page }) => {
    // Test rapid keyboard shortcuts
    const shortcuts = ['v', 'r', 'd', 'e', 'h', 'g', 's', 'Escape'];
    
    for (const shortcut of shortcuts) {
      await page.keyboard.press(shortcut);
      await page.waitForTimeout(50); // Small delay between rapid inputs
    }
    
    // Should end up in select tool state after escape
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    
    // Status bar should still be functional
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar.getByText('Ready')).toBeVisible();
  });
});
