import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Visual Regression Testing
 * 
 * This configuration is optimized for visual regression testing with:
 * - Consistent screenshot settings
 * - Disabled animations for stable captures
 * - Multiple browser and viewport testing
 * - Proper retry and timeout settings
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/visual-basic.spec.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable for visual tests to avoid resource conflicts
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only - visual tests are more sensitive */
  retries: process.env.CI ? 1 : 0,
  
  /* Opt out of parallel tests on CI for visual consistency */
  workers: process.env.CI ? 1 : 2,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'test-results/visual-regression-report' }],
    ['json', { outputFile: 'test-results/visual-regression-results.json' }],
    ['list']
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for each action - longer for visual tests */
    actionTimeout: 15000,

    /* Global timeout for navigation */
    navigationTimeout: 45000,

    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true
  },

  /* Visual comparison settings */
  expect: {
    /* Global screenshot comparison threshold */
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 1000
    },
    /* Global visual comparison timeout */
    timeout: 30000
  },

  /* Configure projects for visual regression testing */
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Tablet viewport testing */
    {
      name: 'tablet-ipad',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 }
      },
    },

    /* Large desktop viewport testing */
    {
      name: 'large-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    /* Microsoft Edge testing */
    {
      name: 'edge-desktop',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        viewport: { width: 1280, height: 720 }
      },
    },
  ],

  /* Global setup and teardown - disabled for visual tests to avoid backend dependency */
  // globalSetup: require.resolve('./e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/visual-regression-artifacts',

  /* Test timeout */
  timeout: 60 * 1000
});
