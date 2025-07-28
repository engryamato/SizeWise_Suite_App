/**
 * Free Tier E2E Tests - Comprehensive Tier Restriction Testing
 * 
 * CRITICAL: Validates free tier limitations and upgrade prompts
 * Tests 3-project limit, watermarked exports, and tier enforcement
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 4.1
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const FREE_TIER_LIMITS = {
  maxProjects: 3,
  maxCalculationsPerDay: 50,
  allowedExportFormats: ['pdf', 'json'],
  maxFileSizeMB: 10
};

// Test data
const TEST_USER = {
  email: 'freetier@test.com',
  password: 'TestPassword123!',
  name: 'Free Tier User'
};

const TEST_PROJECTS = [
  { name: 'HVAC Project 1', description: 'Basic duct sizing project' },
  { name: 'HVAC Project 2', description: 'Office building ventilation' },
  { name: 'HVAC Project 3', description: 'Residential system design' },
  { name: 'HVAC Project 4', description: 'Should be blocked - exceeds limit' }
];

test.describe('Free Tier Restrictions', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      storageState: undefined // Start with clean state
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Navigate to app and ensure free tier user is logged in
    await page.goto('/');
    await setupFreeTierUser(page);
  });

  test.describe('Project Limit Enforcement', () => {
    test('should allow creating up to 3 projects', async () => {
      const startTime = Date.now();

      // Create first 3 projects (should succeed)
      for (let i = 0; i < 3; i++) {
        await createProject(page, TEST_PROJECTS[i]);
        
        // Verify project was created
        await expect(page.locator(`[data-testid="project-${i + 1}"]`)).toBeVisible();
        
        // Check project count indicator
        await expect(page.locator('[data-testid="project-count"]')).toContainText(`${i + 1}/3`);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // <10s requirement
    });

    test('should block 4th project creation with upgrade prompt', async () => {
      // Create 3 projects first
      for (let i = 0; i < 3; i++) {
        await createProject(page, TEST_PROJECTS[i]);
      }

      // Attempt to create 4th project
      await page.click('[data-testid="new-project-button"]');
      
      // Should show tier limit modal instead of project creation form
      await expect(page.locator('[data-testid="tier-limit-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="tier-limit-message"]')).toContainText(
        'You have reached the 3-project limit for Free tier'
      );
      
      // Should show upgrade button
      await expect(page.locator('[data-testid="upgrade-to-pro-button"]')).toBeVisible();
      
      // Should not create the project
      await expect(page.locator('[data-testid="project-4"]')).not.toBeVisible();
    });

    test('should show project limit warning at 2/3 projects', async () => {
      // Create 2 projects
      for (let i = 0; i < 2; i++) {
        await createProject(page, TEST_PROJECTS[i]);
      }

      // Should show warning banner
      await expect(page.locator('[data-testid="project-limit-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-limit-warning"]')).toContainText(
        'You have 1 project remaining in your Free tier'
      );
    });

    test('should allow deleting projects to free up slots', async () => {
      // Create 3 projects
      for (let i = 0; i < 3; i++) {
        await createProject(page, TEST_PROJECTS[i]);
      }

      // Delete one project
      await page.click('[data-testid="project-1"] [data-testid="delete-button"]');
      await page.click('[data-testid="confirm-delete"]');

      // Should update project count
      await expect(page.locator('[data-testid="project-count"]')).toContainText('2/3');

      // Should be able to create new project
      await createProject(page, { name: 'New Project', description: 'After deletion' });
      await expect(page.locator('[data-testid="project-count"]')).toContainText('3/3');
    });
  });

  test.describe('Export Restrictions', () => {
    test('should add watermarks to PDF exports', async () => {
      await createProject(page, TEST_PROJECTS[0]);
      await page.click('[data-testid="project-1"]');

      // Add some calculations
      await addBasicCalculation(page);

      // Export as PDF
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-pdf"]');

      // Should show watermark warning
      await expect(page.locator('[data-testid="watermark-notice"]')).toBeVisible();
      await expect(page.locator('[data-testid="watermark-notice"]')).toContainText(
        'Free tier exports include SizeWise watermark'
      );

      // Proceed with export
      await page.click('[data-testid="confirm-export"]');

      // Should download file with watermark
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
      
      // Verify watermark is mentioned in export metadata
      await expect(page.locator('[data-testid="export-status"]')).toContainText(
        'PDF exported with watermark'
      );
    });

    test('should restrict high-resolution image exports', async () => {
      await createProject(page, TEST_PROJECTS[0]);
      await page.click('[data-testid="project-1"]');

      // Try to export as high-res PNG
      await page.click('[data-testid="export-button"]');
      
      // High-res options should be disabled/hidden
      await expect(page.locator('[data-testid="export-png-hd"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="export-jpg-hd"]')).not.toBeVisible();

      // Should show upgrade prompt for high-res exports
      await page.hover('[data-testid="export-png-disabled"]');
      await expect(page.locator('[data-testid="upgrade-tooltip"]')).toContainText(
        'High-resolution exports require Pro tier'
      );
    });

    test('should restrict Excel export format', async () => {
      await createProject(page, TEST_PROJECTS[0]);
      await page.click('[data-testid="project-1"]');

      await page.click('[data-testid="export-button"]');
      
      // Excel export should be disabled
      await expect(page.locator('[data-testid="export-excel"]')).toBeDisabled();
      
      // Should show tier requirement
      await page.hover('[data-testid="export-excel"]');
      await expect(page.locator('[data-testid="tier-tooltip"]')).toContainText(
        'Excel export requires Pro tier'
      );
    });

    test('should allow basic export formats', async () => {
      await createProject(page, TEST_PROJECTS[0]);
      await page.click('[data-testid="project-1"]');
      await addBasicCalculation(page);

      // Test JSON export
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-json"]');
      
      const jsonDownload = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export"]');
      const jsonFile = await jsonDownload;
      
      expect(jsonFile.suggestedFilename()).toMatch(/.*\.json$/);

      // Test basic PDF export
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-pdf"]');
      
      const pdfDownload = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export"]');
      const pdfFile = await pdfDownload;
      
      expect(pdfFile.suggestedFilename()).toMatch(/.*\.pdf$/);
    });
  });

  test.describe('Feature Access Restrictions', () => {
    test('should restrict advanced calculation features', async () => {
      await createProject(page, TEST_PROJECTS[0]);
      await page.click('[data-testid="project-1"]');

      // Advanced calculation options should be disabled
      await expect(page.locator('[data-testid="advanced-calculations"]')).toBeDisabled();
      
      // Should show upgrade prompt
      await page.click('[data-testid="advanced-calculations"]');
      await expect(page.locator('[data-testid="feature-upgrade-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="feature-upgrade-message"]')).toContainText(
        'Advanced calculations require Pro tier'
      );
    });

    test('should restrict file import features', async () => {
      await page.click('[data-testid="import-button"]');
      
      // PDF import should be disabled
      await expect(page.locator('[data-testid="import-pdf"]')).toBeDisabled();
      
      // CAD import should be disabled
      await expect(page.locator('[data-testid="import-cad"]')).toBeDisabled();
      
      // Should show tier requirements
      await page.hover('[data-testid="import-pdf"]');
      await expect(page.locator('[data-testid="tier-tooltip"]')).toContainText(
        'PDF import requires Pro tier'
      );
    });

    test('should allow basic calculation features', async () => {
      await createProject(page, TEST_PROJECTS[0]);
      await page.click('[data-testid="project-1"]');

      // Basic calculations should be available
      await expect(page.locator('[data-testid="round-duct-calculator"]')).toBeEnabled();
      await expect(page.locator('[data-testid="rectangular-duct-calculator"]')).toBeEnabled();
      
      // Should be able to perform calculations
      await addBasicCalculation(page);
      await expect(page.locator('[data-testid="calculation-result"]')).toBeVisible();
    });
  });

  test.describe('Upgrade Flow', () => {
    test('should show upgrade prompts at appropriate times', async () => {
      // Create maximum projects
      for (let i = 0; i < 3; i++) {
        await createProject(page, TEST_PROJECTS[i]);
      }

      // Try to create another project
      await page.click('[data-testid="new-project-button"]');
      
      // Should show upgrade modal
      await expect(page.locator('[data-testid="tier-limit-modal"]')).toBeVisible();
      
      // Click upgrade button
      await page.click('[data-testid="upgrade-to-pro-button"]');
      
      // Should navigate to pricing page
      await expect(page).toHaveURL(/.*\/pricing/);
      
      // Should highlight Pro tier
      await expect(page.locator('[data-testid="pro-tier-card"]')).toHaveClass(/highlighted/);
    });

    test('should track upgrade conversion events', async () => {
      // Mock analytics tracking
      await page.addInitScript(() => {
        window.analytics = {
          track: (event, properties) => {
            window.analyticsEvents = window.analyticsEvents || [];
            window.analyticsEvents.push({ event, properties });
          }
        };
      });

      // Trigger upgrade flow
      await page.click('[data-testid="new-project-button"]');
      await page.click('[data-testid="upgrade-to-pro-button"]');

      // Check analytics events
      const events = await page.evaluate(() => window.analyticsEvents);
      expect(events).toContainEqual({
        event: 'upgrade_prompt_shown',
        properties: { trigger: 'project_limit', current_tier: 'free' }
      });
      expect(events).toContainEqual({
        event: 'upgrade_button_clicked',
        properties: { source: 'project_limit_modal', target_tier: 'pro' }
      });
    });
  });

  test.describe('Performance Requirements', () => {
    test('should load tier restrictions quickly', async () => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      
      // Wait for tier-specific UI elements to load
      await expect(page.locator('[data-testid="project-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="tier-badge"]')).toContainText('Free');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // <3s requirement
    });

    test('should validate tier restrictions quickly', async () => {
      await createProject(page, TEST_PROJECTS[0]);
      
      const startTime = Date.now();
      
      // Try restricted action
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-excel"]');
      
      // Should show restriction immediately
      await expect(page.locator('[data-testid="tier-restriction-message"]')).toBeVisible();
      
      const validationTime = Date.now() - startTime;
      expect(validationTime).toBeLessThan(1000); // <1s for tier validation
    });
  });
});

// Helper functions
async function setupFreeTierUser(page: Page) {
  // Mock authentication state for free tier user
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock-free-tier-token');
    localStorage.setItem('user_tier', 'free');
    localStorage.setItem('user_id', 'free-tier-user-123');
  });

  // Wait for authentication to be processed
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });
}

async function createProject(page: Page, project: { name: string; description: string }) {
  await page.click('[data-testid="new-project-button"]');
  
  // Fill project form (if not blocked by tier limit)
  const modal = page.locator('[data-testid="new-project-modal"]');
  if (await modal.isVisible()) {
    await page.fill('[data-testid="project-name"]', project.name);
    await page.fill('[data-testid="project-description"]', project.description);
    await page.click('[data-testid="create-project"]');
    
    // Wait for project to be created
    await expect(page.locator('[data-testid="project-created-toast"]')).toBeVisible();
  }
}

async function addBasicCalculation(page: Page) {
  await page.click('[data-testid="add-calculation"]');
  await page.click('[data-testid="round-duct-calculator"]');
  
  // Fill calculation inputs
  await page.fill('[data-testid="airflow-input"]', '1000');
  await page.fill('[data-testid="velocity-input"]', '1500');
  
  await page.click('[data-testid="calculate"]');
  
  // Wait for results
  await expect(page.locator('[data-testid="calculation-result"]')).toBeVisible();
}
