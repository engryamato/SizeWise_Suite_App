/**
 * Playwright Configuration for SizeWise Suite E2E Testing
 * 
 * Comprehensive configuration for end-to-end testing including:
 * - Multiple browser support
 * - Device emulation
 * - Performance testing
 * - Visual regression testing
 * - Accessibility testing
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github'] // GitHub Actions integration
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Accept downloads */
    acceptDownloads: true,
    
    /* Locale for testing */
    locale: 'en-US',
    
    /* Timezone for testing */
    timezoneId: 'America/New_York',
    
    /* Geolocation for testing */
    geolocation: { longitude: -74.006, latitude: 40.7128 }, // New York
    permissions: ['geolocation'],
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for performance monitoring
        launchOptions: {
          args: ['--enable-automation', '--disable-background-timer-throttling']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against tablet viewports */
    {
      name: 'Tablet Chrome',
      use: { ...devices['iPad Pro'] },
    },

    /* High DPI displays */
    {
      name: 'High DPI',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
      },
    },

    /* Accessibility testing */
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Enable accessibility tree in DevTools
        launchOptions: {
          args: ['--force-renderer-accessibility']
        }
      },
      testMatch: '**/*accessibility*.spec.ts'
    },

    /* Performance testing */
    {
      name: 'Performance',
      use: {
        ...devices['Desktop Chrome'],
        // Optimize for performance testing
        launchOptions: {
          args: [
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
      testMatch: '**/*performance*.spec.ts'
    },

    /* Visual regression testing */
    {
      name: 'Visual Regression',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent rendering for visual tests
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
      testMatch: '**/*visual*.spec.ts'
    }
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../frontend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        NODE_ENV: 'test'
      }
    },
    {
      command: 'python -m uvicorn app:app --host 0.0.0.0 --port 8000',
      cwd: '../backend',
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      env: {
        ENVIRONMENT: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/sizewise_test',
        MONGODB_URL: 'mongodb://localhost:27017/sizewise_test',
        REDIS_URL: 'redis://localhost:6379/1'
      }
    }
  ],

  /* Test timeout */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled'
    },
    toMatchSnapshot: {
      threshold: 0.2
    }
  },

  /* Output directory */
  outputDir: 'test-results/',

  /* Test metadata */
  metadata: {
    'test-suite': 'SizeWise Suite E2E Tests',
    'version': process.env.npm_package_version || '1.0.0',
    'environment': process.env.NODE_ENV || 'test',
    'build': process.env.BUILD_NUMBER || 'local'
  }
});

/* Environment-specific configurations */
if (process.env.CI) {
  // CI-specific settings
  module.exports.use.video = 'retain-on-failure';
  module.exports.use.trace = 'retain-on-failure';
  module.exports.workers = 2;
  module.exports.retries = 3;
}

if (process.env.HEADLESS === 'false') {
  // Development mode settings
  module.exports.use.headless = false;
  module.exports.use.slowMo = 1000;
}
