import { Page, Locator, expect } from '@playwright/test';

/**
 * Visual Testing Utilities for SizeWise Suite
 * 
 * This module provides helper functions for consistent visual regression testing
 * across the SizeWise Suite application.
 */

export interface VisualTestOptions {
  threshold?: number;
  maxDiffPixels?: number;
  fullPage?: boolean;
  mask?: Locator[];
  animations?: 'disabled' | 'allow';
  timeout?: number;
}

export class VisualTestHelper {
  constructor(private page: Page) {}

  /**
   * Prepare page for visual testing by disabling animations and setting consistent state
   */
  async prepareForVisualTest(): Promise<void> {
    // Disable animations and transitions
    await this.page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        
        /* Disable CSS animations */
        @keyframes * {
          0%, 100% { opacity: 1; }
        }
        
        /* Disable smooth scrolling */
        html {
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    });

    // Wait for fonts to load
    await this.page.waitForFunction(() => document.fonts.ready);
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mock authentication state for testing authenticated pages
   */
  async mockAuthentication(userTier: 'trial' | 'free' | 'premium' = 'premium'): Promise<void> {
    await this.page.evaluate((tier) => {
      localStorage.setItem('auth-token', 'mock-visual-test-token');
      localStorage.setItem('user-tier', tier);
      localStorage.setItem('user-id', 'visual-test-user');
      localStorage.setItem('user-email', 'visual-test@sizewise.com');
    }, userTier);
  }

  /**
   * Take a screenshot with consistent settings
   */
  async takeScreenshot(
    name: string, 
    element?: Locator, 
    options: VisualTestOptions = {}
  ): Promise<void> {
    const defaultOptions: VisualTestOptions = {
      threshold: 0.2,
      maxDiffPixels: 1000,
      fullPage: false,
      animations: 'disabled'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    if (element) {
      await expect(element).toHaveScreenshot(name, {
        threshold: mergedOptions.threshold,
        maxDiffPixels: mergedOptions.maxDiffPixels,
        mask: mergedOptions.mask
      });
    } else {
      await expect(this.page).toHaveScreenshot(name, {
        threshold: mergedOptions.threshold,
        maxDiffPixels: mergedOptions.maxDiffPixels,
        fullPage: mergedOptions.fullPage,
        mask: mergedOptions.mask
      });
    }
  }

  /**
   * Wait for specific elements to be stable before taking screenshot
   */
  async waitForStableElements(selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      await this.page.waitForSelector(selector, { state: 'visible' });
      
      // Wait for element to stop moving/changing
      await this.page.waitForFunction(
        (sel) => {
          const element = document.querySelector(sel);
          if (!element) return false;
          
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        },
        selector
      );
    }
  }

  /**
   * Hide dynamic content that changes between test runs
   */
  async hideDynamicContent(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        /* Hide timestamps and dynamic dates */
        [data-testid*="timestamp"],
        [data-testid*="date"],
        .timestamp,
        .date-time,
        .last-updated {
          visibility: hidden !important;
        }
        
        /* Hide loading indicators */
        .loading,
        .spinner,
        [data-testid*="loading"] {
          visibility: hidden !important;
        }
        
        /* Hide random IDs or generated content */
        [data-testid*="random"],
        [data-testid*="generated"] {
          visibility: hidden !important;
        }
        
        /* Hide user avatars that might change */
        .user-avatar img,
        [data-testid="user-avatar"] img {
          visibility: hidden !important;
        }
      `
    });
  }

  /**
   * Set consistent test data for forms and inputs
   */
  async setConsistentTestData(): Promise<void> {
    // Fill common form fields with consistent test data
    const testData = {
      '[data-testid="airflow-input"]': '1000',
      '[data-testid="velocity-input"]': '800',
      '[data-testid="duct-width"]': '12',
      '[data-testid="duct-height"]': '8',
      '[data-testid="material-select"]': 'galvanized-steel',
      '[data-testid="units-select"]': 'imperial'
    };

    for (const [selector, value] of Object.entries(testData)) {
      const element = this.page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        await element.fill(value);
      }
    }
  }

  /**
   * Scroll element into view and wait for it to be stable
   */
  async scrollToElementAndWait(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500); // Wait for scroll to complete
    await element.waitFor({ state: 'visible' });
  }

  /**
   * Test component in different states (hover, focus, active)
   */
  async testComponentStates(
    selector: string, 
    baseName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    
    // Default state
    await this.takeScreenshot(`${baseName}-default.png`, element, options);
    
    // Hover state
    await element.hover();
    await this.page.waitForTimeout(200);
    await this.takeScreenshot(`${baseName}-hover.png`, element, options);
    
    // Focus state (if focusable)
    if (await element.isEnabled().catch(() => false)) {
      await element.focus();
      await this.page.waitForTimeout(200);
      await this.takeScreenshot(`${baseName}-focus.png`, element, options);
    }
    
    // Reset state
    await this.page.mouse.move(0, 0);
    await this.page.waitForTimeout(200);
  }

  /**
   * Test responsive breakpoints for a page
   */
  async testResponsiveBreakpoints(
    pagePath: string,
    baseName: string
  ): Promise<void> {
    const breakpoints = [
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ];

    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await this.page.goto(pagePath);
      await this.prepareForVisualTest();
      
      await this.takeScreenshot(
        `${baseName}-${breakpoint.name}.png`,
        undefined,
        { fullPage: true }
      );
    }
  }

  /**
   * Compare before and after states of a component
   */
  async compareBeforeAfter(
    selector: string,
    action: () => Promise<void>,
    baseName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    
    // Before state
    await this.takeScreenshot(`${baseName}-before.png`, element, options);
    
    // Perform action
    await action();
    await this.page.waitForTimeout(500); // Wait for changes to settle
    
    // After state
    await this.takeScreenshot(`${baseName}-after.png`, element, options);
  }

  /**
   * Test dark/light theme variations
   */
  async testThemeVariations(
    pagePath: string,
    baseName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    // Test light theme
    await this.page.goto(pagePath);
    await this.page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await this.prepareForVisualTest();
    await this.takeScreenshot(`${baseName}-light.png`, undefined, options);
    
    // Test dark theme
    await this.page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await this.prepareForVisualTest();
    await this.takeScreenshot(`${baseName}-dark.png`, undefined, options);
  }
}
