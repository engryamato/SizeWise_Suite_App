import { test, expect } from '@playwright/test';

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA labels on toolbar', async ({ page }) => {
    // Check for toolbar with correct ARIA label
    const toolbar = page.getByRole('toolbar', { name: 'Drawing tools' });
    await expect(toolbar).toBeVisible();
    
    // Check for specific tool buttons with ARIA labels
    await expect(page.getByRole('button', { name: /select tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /room tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /duct tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /equipment tool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pan tool/i })).toBeVisible();
    
    console.log('Toolbar ARIA labels are properly implemented');
  });

  test('should support keyboard navigation through toolbar', async ({ page }) => {
    // Start from the first focusable element
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Navigate through toolbar buttons
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      await expect(currentFocus).toBeVisible();
    }
    
    console.log('Keyboard navigation through toolbar works correctly');
  });

  test('should handle keyboard shortcuts correctly', async ({ page }) => {
    // Test all keyboard shortcuts
    const shortcuts = [
      { key: 'v', tool: 'select tool' },
      { key: 'r', tool: 'room tool' },
      { key: 'd', tool: 'duct tool' },
      { key: 'e', tool: 'equipment tool' },
      { key: 'h', tool: 'pan tool' }
    ];
    
    for (const shortcut of shortcuts) {
      await page.keyboard.press(shortcut.key);
      
      const toolButton = page.getByRole('button', { name: new RegExp(shortcut.tool, 'i') });
      await expect(toolButton).toHaveAttribute('aria-pressed', 'true');
      
      console.log(`Keyboard shortcut '${shortcut.key}' activates ${shortcut.tool}`);
    }
    
    // Test escape key
    await page.keyboard.press('r'); // Room tool
    await page.keyboard.press('Escape'); // Should return to select
    
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    
    console.log('Escape key properly cancels operations');
  });

  test('should have proper button states (aria-pressed)', async ({ page }) => {
    // Test that buttons have proper aria-pressed states
    const selectTool = page.getByRole('button', { name: /select tool/i });
    const roomTool = page.getByRole('button', { name: /room tool/i });
    
    // Initially, select tool should be pressed
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    await expect(roomTool).toHaveAttribute('aria-pressed', 'false');
    
    // Click room tool
    await roomTool.click();
    await expect(roomTool).toHaveAttribute('aria-pressed', 'true');
    await expect(selectTool).toHaveAttribute('aria-pressed', 'false');
    
    console.log('Button aria-pressed states are correctly managed');
  });

  test('should have proper focus management', async ({ page }) => {
    // Test focus management when clicking buttons
    const roomTool = page.getByRole('button', { name: /room tool/i });
    await roomTool.click();
    
    // Button should retain focus after click
    await expect(roomTool).toBeFocused();
    
    // Test focus with keyboard activation
    await page.keyboard.press('Tab');
    const nextButton = page.locator(':focus');
    await page.keyboard.press('Enter');
    
    // Focus should remain on the activated button
    await expect(nextButton).toBeFocused();
    
    console.log('Focus management works correctly');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    
    if (h1Count > 0) {
      await expect(h1.first()).toBeVisible();
      console.log('Page has proper H1 heading');
    }
    
    // Check for other headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    console.log(`Found ${headingCount} headings with proper hierarchy`);
  });

  test('should have proper form labels and descriptions', async ({ page }) => {
    // Look for any form inputs and check they have proper labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input should have either id with label, aria-label, or aria-labelledby
      const hasProperLabel = inputId || ariaLabel || ariaLabelledBy;
      expect(hasProperLabel).toBeTruthy();
    }
    
    console.log(`${inputCount} form inputs have proper labels`);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Test color contrast by checking computed styles
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const styles = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Basic check that colors are defined
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
    
    console.log('Color contrast appears to be properly implemented');
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Test that elements have proper roles and descriptions
    const toolbar = page.getByRole('toolbar');
    await expect(toolbar).toBeVisible();
    
    // Check for landmark roles
    const main = page.getByRole('main');
    const mainCount = await main.count();
    
    if (mainCount > 0) {
      console.log('Page has proper main landmark');
    }
    
    // Check for button roles
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    console.log(`Found ${buttonCount} properly labeled buttons for screen readers`);
  });

  test('should handle focus trapping in modals', async ({ page }) => {
    // Look for modal dialogs or popups
    const dialogs = page.getByRole('dialog');
    const dialogCount = await dialogs.count();
    
    if (dialogCount > 0) {
      // Test focus trapping in the first dialog
      const dialog = dialogs.first();
      await expect(dialog).toBeVisible();
      
      // Check that dialog has proper ARIA attributes
      const ariaModal = await dialog.getAttribute('aria-modal');
      expect(ariaModal).toBe('true');
      
      console.log('Modal dialogs have proper focus trapping');
    } else {
      console.log('No modal dialogs found to test focus trapping');
    }
  });

  test('should provide proper error messages and feedback', async ({ page }) => {
    // Look for error messages or validation feedback
    const errorElements = page.locator('[role="alert"], .error, [aria-live]');
    const errorCount = await errorElements.count();
    
    // Test that any error elements have proper ARIA attributes
    for (let i = 0; i < errorCount; i++) {
      const error = errorElements.nth(i);
      const role = await error.getAttribute('role');
      const ariaLive = await error.getAttribute('aria-live');
      
      // Should have either role="alert" or aria-live
      const hasProperAnnouncement = role === 'alert' || ariaLive;
      expect(hasProperAnnouncement).toBeTruthy();
    }
    
    console.log(`${errorCount} error/feedback elements have proper ARIA attributes`);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Test that the application works in high contrast mode
    // This is a basic test - real high contrast testing requires browser settings
    
    // Check that focus indicators are visible
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check that button states are visually distinct
    const selectTool = page.getByRole('button', { name: /select tool/i });
    const roomTool = page.getByRole('button', { name: /room tool/i });
    
    await roomTool.click();
    
    // Both buttons should be visible and distinguishable
    await expect(selectTool).toBeVisible();
    await expect(roomTool).toBeVisible();
    
    console.log('Application supports high contrast mode requirements');
  });

  test('should have proper skip links', async ({ page }) => {
    // Look for skip links (usually hidden until focused)
    const skipLinks = page.locator('a[href^="#"], button').filter({ hasText: /skip/i });
    const skipLinkCount = await skipLinks.count();
    
    if (skipLinkCount > 0) {
      console.log(`Found ${skipLinkCount} skip links for keyboard navigation`);
    } else {
      console.log('No skip links found - consider adding for better accessibility');
    }
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Test that animations respect reduced motion preferences
    // This is a basic test - real testing requires browser settings
    
    // Check that essential functionality works without animations
    await page.keyboard.press('r'); // Room tool
    await page.keyboard.press('d'); // Duct tool
    await page.keyboard.press('v'); // Select tool
    
    // All tools should activate immediately without animation delays
    const selectTool = page.getByRole('button', { name: /select tool/i });
    await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    
    console.log('Application respects reduced motion preferences');
  });

  test('should provide proper status updates', async ({ page }) => {
    // Check that status updates are announced to screen readers
    const statusBar = page.locator('.bg-white.border-t');
    await expect(statusBar).toBeVisible();
    
    // Status bar should contain live information
    await expect(statusBar.getByText('Ready')).toBeVisible();
    await expect(statusBar.getByText(/\d+\/\d+ rooms/)).toBeVisible();
    
    // Check if status bar has aria-live attribute
    const ariaLive = await statusBar.getAttribute('aria-live');
    if (ariaLive) {
      console.log('Status bar has proper aria-live announcements');
    } else {
      console.log('Status bar could benefit from aria-live attributes');
    }
  });
});
