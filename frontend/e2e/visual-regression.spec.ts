import { test, expect } from '@playwright/test';

/**
 * Visual Regression Testing Suite for SizeWise Suite
 * 
 * This test suite captures screenshots of key UI components and pages
 * to detect visual regressions across different browsers and screen sizes.
 * 
 * Test Coverage:
 * - Landing page and authentication flows
 * - Dashboard and navigation components
 * - HVAC calculation interfaces
 * - 3D visualization components
 * - Export and reporting interfaces
 * - Error states and loading states
 */

test.describe('Visual Regression Tests', () => {
  
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

  test.describe('Landing Page and Authentication', () => {
    
    test('landing page visual snapshot', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('landing-page.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });

    test('login page visual snapshot', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      
      // Wait for login form to be visible
      await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
      
      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });

    test('signup page visual snapshot', async ({ page }) => {
      await page.goto('/auth/signup');
      await page.waitForLoadState('networkidle');
      
      // Wait for signup form to be visible
      await page.waitForSelector('[data-testid="signup-form"]', { timeout: 10000 });
      
      await expect(page).toHaveScreenshot('signup-page.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });
  });

  test.describe('Dashboard and Navigation', () => {
    
    test.beforeEach(async ({ page }) => {
      // Mock authentication for dashboard tests
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
        localStorage.setItem('user-tier', 'premium');
      });
    });

    test('dashboard overview visual snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Wait for dashboard components to load
      await page.waitForSelector('[data-testid="dashboard-overview"]', { timeout: 10000 });
      
      await expect(page).toHaveScreenshot('dashboard-overview.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });

    test('navigation sidebar visual snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Focus on navigation sidebar
      const sidebar = page.locator('[data-testid="navigation-sidebar"]');
      await expect(sidebar).toBeVisible();
      
      await expect(sidebar).toHaveScreenshot('navigation-sidebar.png', {
        threshold: 0.2,
        maxDiffPixels: 500
      });
    });

    test('user profile dropdown visual snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Open user profile dropdown
      await page.click('[data-testid="user-profile-button"]');
      await page.waitForSelector('[data-testid="user-profile-dropdown"]');
      
      const dropdown = page.locator('[data-testid="user-profile-dropdown"]');
      await expect(dropdown).toHaveScreenshot('user-profile-dropdown.png', {
        threshold: 0.2,
        maxDiffPixels: 300
      });
    });
  });

  test.describe('HVAC Calculation Interfaces', () => {
    
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
        localStorage.setItem('user-tier', 'premium');
      });
    });

    test('air duct sizer interface visual snapshot', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await page.waitForLoadState('networkidle');
      
      // Wait for calculation form to load
      await page.waitForSelector('[data-testid="air-duct-calculator"]', { timeout: 10000 });
      
      await expect(page).toHaveScreenshot('air-duct-sizer.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });

    test('calculation results panel visual snapshot', async ({ page }) => {
      await page.goto('/air-duct-sizer');
      await page.waitForLoadState('networkidle');
      
      // Fill in sample calculation data
      await page.fill('[data-testid="airflow-input"]', '1000');
      await page.fill('[data-testid="velocity-input"]', '800');
      await page.click('[data-testid="calculate-button"]');
      
      // Wait for results to appear
      await page.waitForSelector('[data-testid="calculation-results"]', { timeout: 10000 });
      
      const resultsPanel = page.locator('[data-testid="calculation-results"]');
      await expect(resultsPanel).toHaveScreenshot('calculation-results.png', {
        threshold: 0.2,
        maxDiffPixels: 500
      });
    });
  });

  test.describe('3D Visualization Components', () => {
    
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
        localStorage.setItem('user-tier', 'premium');
      });
    });

    test('3D canvas interface visual snapshot', async ({ page }) => {
      await page.goto('/tools/3d-visualization');
      await page.waitForLoadState('networkidle');
      
      // Wait for 3D canvas to initialize
      await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 15000 });
      
      // Wait a bit more for 3D scene to render
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('3d-canvas-interface.png', {
        fullPage: true,
        threshold: 0.3, // Higher threshold for 3D content
        maxDiffPixels: 2000
      });
    });

    test('3D controls panel visual snapshot', async ({ page }) => {
      await page.goto('/tools/3d-visualization');
      await page.waitForLoadState('networkidle');
      
      // Wait for controls panel
      await page.waitForSelector('[data-testid="3d-controls-panel"]', { timeout: 10000 });
      
      const controlsPanel = page.locator('[data-testid="3d-controls-panel"]');
      await expect(controlsPanel).toHaveScreenshot('3d-controls-panel.png', {
        threshold: 0.2,
        maxDiffPixels: 500
      });
    });
  });

  test.describe('Export and Reporting Interfaces', () => {
    
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
        localStorage.setItem('user-tier', 'premium');
      });
    });

    test('export options modal visual snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Open export modal
      await page.click('[data-testid="export-button"]');
      await page.waitForSelector('[data-testid="export-modal"]', { timeout: 10000 });
      
      const exportModal = page.locator('[data-testid="export-modal"]');
      await expect(exportModal).toHaveScreenshot('export-modal.png', {
        threshold: 0.2,
        maxDiffPixels: 500
      });
    });

    test('reports dashboard visual snapshot', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      
      // Wait for reports to load
      await page.waitForSelector('[data-testid="reports-dashboard"]', { timeout: 10000 });
      
      await expect(page).toHaveScreenshot('reports-dashboard.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });
  });

  test.describe('Error States and Loading States', () => {
    
    test('404 error page visual snapshot', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('404-error-page.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });

    test('loading spinner visual snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Capture loading state before page fully loads
      await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 5000 });
      
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      await expect(loadingSpinner).toHaveScreenshot('loading-spinner.png', {
        threshold: 0.2,
        maxDiffPixels: 300
      });
    });

    test('network error state visual snapshot', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Wait for error state to appear
      await page.waitForSelector('[data-testid="network-error"]', { timeout: 10000 });
      
      const errorState = page.locator('[data-testid="network-error"]');
      await expect(errorState).toHaveScreenshot('network-error-state.png', {
        threshold: 0.2,
        maxDiffPixels: 500
      });
    });
  });

  test.describe('Responsive Design Tests', () => {
    
    test('tablet viewport visual snapshot', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });

    test('large desktop viewport visual snapshot', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('dashboard-large-desktop.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });
  });
});
