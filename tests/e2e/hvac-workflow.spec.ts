/**
 * End-to-End Tests for HVAC Design Workflow
 * 
 * Tests complete user workflows including:
 * - Project creation and management
 * - HVAC calculations and design
 * - Collaboration features
 * - Data persistence and synchronization
 * - Performance under load
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test data constants
const TEST_PROJECT = {
  name: 'E2E Test HVAC Project',
  buildingArea: '10000',
  occupancy: '100',
  buildingType: 'office',
  climateZone: 'zone_4a'
};

const HVAC_CALCULATIONS = {
  airDuct: {
    roomArea: '500',
    cfmRequired: '2000',
    ductMaterial: 'galvanized_steel'
  },
  loadCalculation: {
    buildingArea: '5000',
    occupancy: '50',
    buildingType: 'office'
  },
  equipmentSizing: {
    heatingLoad: '50000',
    coolingLoad: '60000',
    systemType: 'heat_pump'
  }
};

// Helper functions
async function createNewProject(page: Page, projectData = TEST_PROJECT) {
  await page.goto('/');
  await page.click('[data-testid="new-project-btn"]');
  await page.fill('[data-testid="project-name"]', projectData.name);
  await page.fill('[data-testid="building-area"]', projectData.buildingArea);
  await page.fill('[data-testid="occupancy"]', projectData.occupancy);
  await page.selectOption('[data-testid="building-type"]', projectData.buildingType);
  await page.click('[data-testid="create-project-btn"]');
  
  // Wait for project creation confirmation
  await expect(page.locator('[data-testid="project-created-success"]')).toBeVisible();
  
  return page.url(); // Return project URL for sharing
}

async function performAirDuctCalculation(page: Page, calcData = HVAC_CALCULATIONS.airDuct) {
  await page.click('[data-testid="calculations-tab"]');
  await page.selectOption('[data-testid="calculation-type"]', 'air_duct');
  
  await page.fill('[data-testid="room-area"]', calcData.roomArea);
  await page.fill('[data-testid="cfm-required"]', calcData.cfmRequired);
  await page.selectOption('[data-testid="duct-material"]', calcData.ductMaterial);
  
  await page.click('[data-testid="calculate-btn"]');
  
  // Wait for calculation results
  await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
}

async function performLoadCalculation(page: Page, calcData = HVAC_CALCULATIONS.loadCalculation) {
  await page.selectOption('[data-testid="calculation-type"]', 'load_calculation');
  
  await page.fill('[data-testid="building-area"]', calcData.buildingArea);
  await page.fill('[data-testid="occupancy"]', calcData.occupancy);
  await page.selectOption('[data-testid="building-type"]', calcData.buildingType);
  
  await page.click('[data-testid="calculate-btn"]');
  
  await expect(page.locator('[data-testid="load-results"]')).toBeVisible();
}

test.describe('HVAC Design Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
    
    // Mock API responses for consistent testing
    await page.route('**/api/calculations/**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (method === 'POST' && url.includes('air-duct')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            duct_size: { width: 14, height: 10 },
            velocity: 800,
            pressure_drop: 0.08,
            material: 'galvanized_steel',
            calculation_id: 'test_calc_1'
          })
        });
      } else if (method === 'POST' && url.includes('load')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            heating_load: 125000,
            cooling_load: 170000,
            sensible_load: 127500,
            latent_load: 42500,
            breakdown: {
              walls: 37500,
              windows: 25000,
              roof: 31250,
              infiltration: 18750,
              occupancy: 20000
            },
            calculation_id: 'test_calc_2'
          })
        });
      } else if (method === 'POST' && url.includes('equipment')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            air_handler: {
              cfm: 5000,
              model: 'AH-5000-E',
              efficiency: 0.85
            },
            heating_equipment: {
              capacity: 60000,
              type: 'heat_pump',
              efficiency: 3.2
            },
            cooling_equipment: {
              capacity: 69000,
              type: 'heat_pump',
              efficiency: 16
            },
            calculation_id: 'test_calc_3'
          })
        });
      }
    });
  });

  test('complete HVAC design process', async ({ page }) => {
    // Step 1: Create new project
    const projectUrl = await createNewProject(page);
    
    // Verify project details are displayed
    await expect(page.locator('[data-testid="project-title"]')).toContainText(TEST_PROJECT.name);
    await expect(page.locator('[data-testid="building-area-display"]')).toContainText(TEST_PROJECT.buildingArea);
    
    // Step 2: Perform air duct calculation
    await performAirDuctCalculation(page);
    
    // Verify air duct results
    await expect(page.locator('[data-testid="duct-size-result"]')).toContainText('14" × 10"');
    await expect(page.locator('[data-testid="velocity-result"]')).toContainText('800 FPM');
    await expect(page.locator('[data-testid="pressure-drop-result"]')).toContainText('0.08 in. w.g.');
    
    // Step 3: Perform load calculation
    await performLoadCalculation(page);
    
    // Verify load calculation results
    await expect(page.locator('[data-testid="heating-load-result"]')).toContainText('125,000 BTU/h');
    await expect(page.locator('[data-testid="cooling-load-result"]')).toContainText('170,000 BTU/h');
    
    // Step 4: Perform equipment sizing
    await page.selectOption('[data-testid="calculation-type"]', 'equipment_sizing');
    await page.fill('[data-testid="heating-load"]', HVAC_CALCULATIONS.equipmentSizing.heatingLoad);
    await page.fill('[data-testid="cooling-load"]', HVAC_CALCULATIONS.equipmentSizing.coolingLoad);
    await page.selectOption('[data-testid="system-type"]', HVAC_CALCULATIONS.equipmentSizing.systemType);
    await page.click('[data-testid="calculate-btn"]');
    
    // Verify equipment sizing results
    await expect(page.locator('[data-testid="air-handler-result"]')).toContainText('AH-5000-E');
    await expect(page.locator('[data-testid="heating-equipment-result"]')).toContainText('Heat Pump');
    await expect(page.locator('[data-testid="cooling-equipment-result"]')).toContainText('69,000 BTU/h');
    
    // Step 5: Save project
    await page.click('[data-testid="save-project-btn"]');
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    
    // Step 6: Verify project persistence
    await page.reload();
    await expect(page.locator('[data-testid="project-title"]')).toContainText(TEST_PROJECT.name);
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
  });

  test('project sharing and collaboration', async ({ browser }) => {
    // Create two browser contexts for multi-user testing
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // User 1 creates and shares project
    const projectUrl = await createNewProject(page1, {
      ...TEST_PROJECT,
      name: 'Collaboration Test Project'
    });
    
    // Enable collaboration
    await page1.click('[data-testid="collaboration-toggle"]');
    await expect(page1.locator('[data-testid="collaboration-active"]')).toBeVisible();
    
    // Get shareable link
    await page1.click('[data-testid="share-project-btn"]');
    const shareUrl = await page1.locator('[data-testid="share-url"]').textContent();
    
    // User 2 joins the project
    await page2.goto(shareUrl || projectUrl);
    
    // Verify both users see the same project
    const title1 = await page1.locator('[data-testid="project-title"]').textContent();
    const title2 = await page2.locator('[data-testid="project-title"]').textContent();
    expect(title1).toBe(title2);
    
    // Test real-time updates
    await page1.fill('[data-testid="building-area"]', '8000');
    
    // Verify User 2 sees the update
    await expect(page2.locator('[data-testid="building-area"]')).toHaveValue('8000');
    
    // Test collaborative calculation
    await page2.click('[data-testid="calculations-tab"]');
    await performAirDuctCalculation(page2);
    
    // Verify User 1 sees the calculation results
    await expect(page1.locator('[data-testid="calculation-results"]')).toBeVisible();
    
    // Test user presence indicators
    await expect(page1.locator('[data-testid="active-users"]')).toContainText('2 users');
    await expect(page2.locator('[data-testid="active-users"]')).toContainText('2 users');
    
    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('offline functionality and data synchronization', async ({ page, context }) => {
    // Create project while online
    const projectUrl = await createNewProject(page);
    await performAirDuctCalculation(page);
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Perform calculations offline
    await page.selectOption('[data-testid="calculation-type"]', 'load_calculation');
    await page.fill('[data-testid="building-area"]', '6000');
    await page.fill('[data-testid="occupancy"]', '60');
    await page.click('[data-testid="calculate-btn"]');
    
    // Verify offline calculation works
    await expect(page.locator('[data-testid="offline-calculation-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="load-results"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Verify synchronization
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible({ timeout: 10000 });
    
    // Verify data persistence after sync
    await page.reload();
    await expect(page.locator('[data-testid="load-results"]')).toBeVisible();
  });

  test('responsive design and mobile compatibility', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const projectUrl = await createNewProject(page);
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
    await page.click('[data-testid="mobile-nav-toggle"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Test calculations on mobile
    await page.click('[data-testid="calculations-tab"]');
    await performAirDuctCalculation(page);
    
    // Verify results display properly on mobile
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="duct-size-result"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Verify desktop layout
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
  });

  test('error handling and recovery', async ({ page }) => {
    const projectUrl = await createNewProject(page);
    
    // Test API error handling
    await page.route('**/api/calculations/air-duct', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Attempt calculation that will fail
    await page.click('[data-testid="calculations-tab"]');
    await performAirDuctCalculation(page);
    
    // Verify error handling
    await expect(page.locator('[data-testid="calculation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    
    // Test retry functionality
    await page.unroute('**/api/calculations/air-duct');
    await page.route('**/api/calculations/air-duct', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          duct_size: { width: 14, height: 10 },
          velocity: 800,
          pressure_drop: 0.08
        })
      });
    });
    
    await page.click('[data-testid="retry-btn"]');
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
    
    // Test input validation errors
    await page.fill('[data-testid="room-area"]', '-100');
    await page.click('[data-testid="calculate-btn"]');
    
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('must be positive');
  });

  test('performance under load', async ({ page }) => {
    const projectUrl = await createNewProject(page);
    
    // Measure page load performance
    const startTime = Date.now();
    await page.goto(projectUrl);
    await expect(page.locator('[data-testid="project-title"]')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Verify page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Measure calculation performance
    await page.click('[data-testid="calculations-tab"]');
    
    const calcStartTime = Date.now();
    await performAirDuctCalculation(page);
    const calcTime = Date.now() - calcStartTime;
    
    // Verify calculation completes within 5 seconds
    expect(calcTime).toBeLessThan(5000);
    
    // Test multiple rapid calculations
    const rapidCalcStart = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="room-area"]', `${500 + i * 100}`);
      await page.click('[data-testid="calculate-btn"]');
      await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible();
    }
    
    const rapidCalcTime = Date.now() - rapidCalcStart;
    
    // Verify multiple calculations complete within 15 seconds
    expect(rapidCalcTime).toBeLessThan(15000);
  });

  test('accessibility compliance', async ({ page }) => {
    const projectUrl = await createNewProject(page);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="new-project-btn"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="calculations-tab"]')).toBeFocused();
    
    // Test screen reader compatibility
    const projectTitle = page.locator('[data-testid="project-title"]');
    await expect(projectTitle).toHaveAttribute('aria-label');
    
    const calculateButton = page.locator('[data-testid="calculate-btn"]');
    await expect(calculateButton).toHaveAttribute('aria-describedby');
    
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('body')).toHaveClass(/dark-theme/);
    
    // Test focus indicators
    await page.click('[data-testid="calculations-tab"]');
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('data export and reporting', async ({ page }) => {
    const projectUrl = await createNewProject(page);
    
    // Perform multiple calculations
    await performAirDuctCalculation(page);
    await performLoadCalculation(page);
    
    // Test PDF export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-pdf-btn"]')
    ]);
    
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
    
    // Test Excel export
    const [excelDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-excel-btn"]')
    ]);
    
    expect(excelDownload.suggestedFilename()).toMatch(/.*\.xlsx$/);
    
    // Test calculation history
    await page.click('[data-testid="calculation-history-btn"]');
    await expect(page.locator('[data-testid="calculation-history-list"]')).toBeVisible();
    
    const historyItems = page.locator('[data-testid="history-item"]');
    await expect(historyItems).toHaveCount(2); // Air duct + Load calculation
  });
});

test.describe('Analytics Dashboard', () => {
  test('displays comprehensive analytics', async ({ page }) => {
    await page.goto('/analytics');
    
    // Verify dashboard loads
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    
    // Check key performance indicators
    await expect(page.locator('[data-testid="energy-efficiency-kpi"]')).toBeVisible();
    await expect(page.locator('[data-testid="cost-savings-kpi"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-score-kpi"]')).toBeVisible();
    
    // Test tab navigation
    await page.click('[data-testid="energy-tab"]');
    await expect(page.locator('[data-testid="energy-consumption-chart"]')).toBeVisible();
    
    await page.click('[data-testid="performance-tab"]');
    await expect(page.locator('[data-testid="performance-metrics-chart"]')).toBeVisible();
    
    await page.click('[data-testid="compliance-tab"]');
    await expect(page.locator('[data-testid="compliance-status-chart"]')).toBeVisible();
    
    // Test data filtering
    await page.selectOption('[data-testid="time-range-filter"]', '30d');
    await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="energy-consumption-chart"]')).toBeVisible();
  });
});

test.describe('AI Optimization Features', () => {
  test('provides AI-powered recommendations', async ({ page }) => {
    const projectUrl = await createNewProject(page);
    
    // Navigate to AI optimization
    await page.click('[data-testid="ai-optimization-tab"]');
    
    // Input system data for optimization
    await page.fill('[data-testid="current-energy-usage"]', '150000');
    await page.fill('[data-testid="operating-hours"]', '8760');
    await page.click('[data-testid="analyze-system-btn"]');
    
    // Wait for AI analysis
    await expect(page.locator('[data-testid="ai-analysis-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible({ timeout: 10000 });
    
    // Verify recommendations
    await expect(page.locator('[data-testid="energy-savings-recommendation"]')).toBeVisible();
    await expect(page.locator('[data-testid="equipment-optimization-recommendation"]')).toBeVisible();
    await expect(page.locator('[data-testid="roi-analysis"]')).toBeVisible();
    
    // Test recommendation implementation
    await page.click('[data-testid="implement-recommendation-btn"]');
    await expect(page.locator('[data-testid="implementation-success"]')).toBeVisible();
  });
});
