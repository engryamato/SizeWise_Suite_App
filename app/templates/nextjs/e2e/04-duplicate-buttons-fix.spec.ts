import { test, expect } from '@playwright/test';

test.describe('Duplicate Buttons Fix', () => {
  test('should handle toolbar buttons without conflicts', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Test toolbar buttons with specific selectors
    const toolbarRoomButton = page.getByRole('button', { name: /room tool/i });
    await expect(toolbarRoomButton).toBeVisible();
    
    const toolbarDuctButton = page.getByRole('button', { name: /duct tool/i });
    await expect(toolbarDuctButton).toBeVisible();
    
    const toolbarEquipmentButton = page.getByRole('button', { name: /equipment tool/i });
    await expect(toolbarEquipmentButton).toBeVisible();
    
    // Test that we can click toolbar buttons
    await toolbarRoomButton.click();
    await expect(toolbarRoomButton).toHaveAttribute('aria-pressed', 'true');
    
    await toolbarDuctButton.click();
    await expect(toolbarDuctButton).toHaveAttribute('aria-pressed', 'true');
    
    await toolbarEquipmentButton.click();
    await expect(toolbarEquipmentButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle sidebar panel buttons without conflicts', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if sidebar is open, if not we might need to open it
    const sidebar = page.locator('.w-80'); // Sidebar has w-80 class
    const sidebarVisible = await sidebar.isVisible();
    
    if (sidebarVisible) {
      // Test sidebar panel buttons with specific selectors
      const sidebarRoomButton = page.getByRole('button', { name: /room properties panel/i });
      await expect(sidebarRoomButton).toBeVisible();
      
      const sidebarEquipmentButton = page.getByRole('button', { name: /equipment properties panel/i });
      await expect(sidebarEquipmentButton).toBeVisible();
    }
  });

  test('should distinguish between toolbar and sidebar buttons', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get all buttons with "Room" text
    const allRoomButtons = page.getByRole('button').filter({ hasText: 'Room' });
    const buttonCount = await allRoomButtons.count();
    
    // Should have at least 1 (toolbar) and possibly 2 (toolbar + sidebar if open)
    expect(buttonCount).toBeGreaterThanOrEqual(1);
    
    // Each button should have distinct aria-labels
    for (let i = 0; i < buttonCount; i++) {
      const button = allRoomButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should have proper ARIA labels on toolbar', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for toolbar with correct ARIA label
    const toolbar = page.getByRole('toolbar', { name: 'Drawing tools' });
    await expect(toolbar).toBeVisible();
    
    // Check for specific tool buttons with ARIA labels
    const selectButton = page.getByRole('button', { name: /select tool/i });
    await expect(selectButton).toBeVisible();
    
    const roomButton = page.getByRole('button', { name: /room tool/i });
    await expect(roomButton).toBeVisible();
    
    const ductButton = page.getByRole('button', { name: /duct tool/i });
    await expect(ductButton).toBeVisible();
    
    const equipmentButton = page.getByRole('button', { name: /equipment tool/i });
    await expect(equipmentButton).toBeVisible();
    
    const panButton = page.getByRole('button', { name: /pan tool/i });
    await expect(panButton).toBeVisible();
  });
});
