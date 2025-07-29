import { test, expect, Page } from '@playwright/test';

/**
 * Debug Form Handler Attachment
 * 
 * Check if the form event handler is properly attached
 */

const BASE_URL = 'http://localhost:3000';

test.describe('Debug Form Handler', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture console messages and errors
    page.on('console', (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR] ${error.message}`);
      console.log(`[PAGE ERROR STACK] ${error.stack}`);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Debug: Check form event handler attachment', async () => {
    console.log('🔍 Checking form event handler attachment...');

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Give extra time for React to hydrate

    // Check if the form exists and has the right properties
    const formCheck = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { error: 'Form not found' };

      // Check form properties
      const formInfo = {
        hasForm: true,
        formAction: form.action,
        formMethod: form.method,
        formOnSubmit: form.onsubmit ? 'has onsubmit handler' : 'no onsubmit handler',
        formEventListeners: 'cannot detect directly',
        formHTML: form.outerHTML.substring(0, 200) + '...'
      };

      // Try to manually trigger the form submission to see what happens
      const submitButton = form.querySelector('button[type="submit"]');
      const submitButtonInfo = {
        hasSubmitButton: !!submitButton,
        buttonDisabled: submitButton?.disabled,
        buttonType: submitButton?.type,
        buttonOnClick: submitButton?.onclick ? 'has onclick handler' : 'no onclick handler'
      };

      return { formInfo, submitButtonInfo };
    });

    console.log('Form check result:', formCheck);

    // Try to manually attach an event listener and test it
    const manualEventTest = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { error: 'Form not found' };

      let eventCaptured = false;
      
      // Add a manual event listener
      const testHandler = (e: Event) => {
        console.log('🔥 MANUAL EVENT LISTENER TRIGGERED');
        eventCaptured = true;
        e.preventDefault();
      };
      
      form.addEventListener('submit', testHandler);
      
      // Try to trigger the form submission programmatically
      try {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        
        return {
          manualEventAttached: true,
          eventCaptured: eventCaptured,
          testCompleted: true
        };
      } catch (error) {
        return {
          manualEventAttached: true,
          eventCaptured: eventCaptured,
          error: error.message
        };
      }
    });

    console.log('Manual event test result:', manualEventTest);

    // Check if React has hydrated properly
    const reactHydrationCheck = await page.evaluate(() => {
      // Check for React DevTools or React-specific properties
      const reactCheck = {
        hasReact: typeof (window as any).React !== 'undefined',
        hasReactDOM: typeof (window as any).ReactDOM !== 'undefined',
        hasReactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        reactFiberNode: !!(document.querySelector('form') as any)?._reactInternalFiber || 
                       !!(document.querySelector('form') as any)?.__reactInternalInstance ||
                       !!(document.querySelector('form') as any)?._reactInternals,
        nextJsHydrated: !!(window as any).__NEXT_DATA__
      };

      return reactCheck;
    });

    console.log('React hydration check:', reactHydrationCheck);

    // Try clicking the submit button directly and see what happens
    console.log('📍 Testing direct button click...');
    
    await page.fill('input[type="email"]', 'admin@sizewise.com');
    await page.fill('input[type="password"]', 'SizeWise2024!6EAF4610705941');

    // Add a listener for any form-related events
    await page.evaluate(() => {
      const form = document.querySelector('form');
      const button = document.querySelector('button[type="submit"]');
      
      if (form) {
        ['submit', 'click', 'change', 'input'].forEach(eventType => {
          form.addEventListener(eventType, (e) => {
            console.log(`🔥 FORM EVENT: ${eventType}`, e);
          });
        });
      }
      
      if (button) {
        ['click', 'mousedown', 'mouseup'].forEach(eventType => {
          button.addEventListener(eventType, (e) => {
            console.log(`🔥 BUTTON EVENT: ${eventType}`, e);
          });
        });
      }
    });

    // Click the submit button
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log('Final URL after button click:', finalUrl);

    // Check if any errors occurred during the process
    const errorCheck = await page.evaluate(() => {
      const errors = (window as any).errors || [];
      return { errors, errorCount: errors.length };
    });

    console.log('Error check:', errorCheck);
  });
});
