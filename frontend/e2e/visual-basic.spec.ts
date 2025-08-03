import { test, expect } from '@playwright/test';

/**
 * Basic Visual Regression Tests for SizeWise Suite
 * 
 * This test suite covers basic visual testing without backend dependencies
 * to verify the visual regression testing setup is working correctly.
 */

test.describe('Basic Visual Regression Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Disable animations for consistent screenshots
    await page.addInitScript(() => {
      // Disable CSS animations and transitions
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test('landing page visual snapshot', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('landing-page-basic.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 1000
    });
  });

  test('login page visual snapshot', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.fonts.ready);
    
    // Wait a bit for any dynamic content to settle
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('login-page-basic.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 1000
    });
  });

  test('signup page visual snapshot', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.fonts.ready);
    
    // Wait a bit for any dynamic content to settle
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('signup-page-basic.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 1000
    });
  });

  test('responsive design - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.fonts.ready);
    
    await expect(page).toHaveScreenshot('landing-page-tablet.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 1000
    });
  });

  test('responsive design - large desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.fonts.ready);
    
    await expect(page).toHaveScreenshot('landing-page-large-desktop.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 1000
    });
  });

  test('404 error page visual snapshot', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.fonts.ready);
    
    await expect(page).toHaveScreenshot('404-error-page-basic.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 1000
    });
  });
});
