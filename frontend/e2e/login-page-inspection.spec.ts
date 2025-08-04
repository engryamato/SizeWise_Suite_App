import { test, expect, Page } from '@playwright/test';

/**
 * Login Page Inspection Test
 * 
 * Detailed inspection of the login page to understand its structure and content.
 */

test.describe('SizeWise Suite - Login Page Inspection', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Inspect Login Page Structure and Content', async () => {
    console.log('🔍 Starting detailed login page inspection...');

    // Navigate to login page
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow for any lazy loading

    // ===== BASIC PAGE INFO =====
    const url = page.url();
    const title = await page.title();
    console.log(`🌐 URL: ${url}`);
    console.log(`📄 Title: "${title}"`);

    // ===== FULL PAGE CONTENT ANALYSIS =====
    const bodyContent = await page.locator('body').innerHTML();
    console.log(`📝 Body content length: ${bodyContent.length} characters`);
    
    // Check if page is actually loading content
    if (bodyContent.length < 100) {
      console.log('⚠️ Very little content detected - page may not be loading properly');
      console.log(`📝 Full body content: ${bodyContent}`);
    }

    // ===== ELEMENT COUNTS =====
    const allElements = await page.locator('*').count();
    const divs = await page.locator('div').count();
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input').count();
    const forms = await page.locator('form').count();
    const links = await page.locator('a').count();
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    const images = await page.locator('img').count();
    
    console.log(`📊 Element counts:`);
    console.log(`  - Total elements: ${allElements}`);
    console.log(`  - Divs: ${divs}`);
    console.log(`  - Buttons: ${buttons}`);
    console.log(`  - Inputs: ${inputs}`);
    console.log(`  - Forms: ${forms}`);
    console.log(`  - Links: ${links}`);
    console.log(`  - Headings: ${headings}`);
    console.log(`  - Images: ${images}`);

    // ===== TEXT CONTENT ANALYSIS =====
    const allText = await page.locator('body').textContent();
    console.log(`📝 Total text content length: ${allText?.length || 0} characters`);
    
    if (allText && allText.length > 0) {
      const words = allText.split(/\s+/).filter(word => word.length > 0);
      console.log(`📝 Word count: ${words.length}`);
      console.log(`📝 First 20 words: ${words.slice(0, 20).join(' ')}`);
    } else {
      console.log('⚠️ No text content found on page');
    }

    // ===== SPECIFIC ELEMENT INSPECTION =====
    
    // Check for loading indicators
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [class*="loader"]').count();
    console.log(`⏳ Loading indicators: ${loadingElements}`);

    // Check for error messages
    const errorElements = await page.locator('[class*="error"], [class*="alert"], .text-red').count();
    console.log(`❌ Error elements: ${errorElements}`);

    // Check for authentication-related elements
    const authElements = await page.locator('[class*="auth"], [class*="login"], [class*="signin"]').count();
    console.log(`🔐 Auth-related elements: ${authElements}`);

    // ===== CONSOLE LOGS AND ERRORS =====
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // Reload to capture console messages
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log(`🖥️ Console logs (${consoleLogs.length}):`);
    consoleLogs.slice(0, 5).forEach(log => console.log(`  ${log}`));
    
    console.log(`❌ Console errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 5).forEach(error => console.log(`  ${error}`));

    // ===== NETWORK REQUESTS =====
    const networkRequests: string[] = [];
    const failedRequests: string[] = [];
    
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });
    
    page.on('requestfailed', request => {
      failedRequests.push(`FAILED: ${request.method()} ${request.url()}`);
    });

    // Reload to capture network activity
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log(`🌐 Network requests (${networkRequests.length}):`);
    networkRequests.slice(0, 10).forEach(req => console.log(`  ${req}`));
    
    console.log(`❌ Failed requests (${failedRequests.length}):`);
    failedRequests.forEach(req => console.log(`  ${req}`));

    // ===== SCREENSHOT FOR DEBUGGING =====
    await page.screenshot({ path: 'login-page-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as login-page-debug.png');

    // ===== WAIT FOR DYNAMIC CONTENT =====
    console.log('⏳ Waiting for potential dynamic content...');
    await page.waitForTimeout(5000);
    
    // Re-check element counts after waiting
    const finalElements = await page.locator('*').count();
    const finalText = await page.locator('body').textContent();
    
    console.log(`📊 Final element count: ${finalElements} (was ${allElements})`);
    console.log(`📝 Final text length: ${finalText?.length || 0} (was ${allText?.length || 0})`);

    // ===== TRY ALTERNATIVE SELECTORS =====
    console.log('🔍 Checking for common login page patterns...');
    
    const patterns = [
      { name: 'Email input', selector: 'input[type="email"], input[name="email"], input[placeholder*="email"]' },
      { name: 'Password input', selector: 'input[type="password"], input[name="password"]' },
      { name: 'Submit button', selector: 'button[type="submit"], input[type="submit"]' },
      { name: 'Login button', selector: 'button:has-text("Login"), button:has-text("Sign In")' },
      { name: 'Demo/Guest access', selector: 'button:has-text("Demo"), button:has-text("Guest"), a:has-text("Demo")' },
      { name: 'Continue button', selector: 'button:has-text("Continue"), a:has-text("Continue")' },
      { name: 'Skip button', selector: 'button:has-text("Skip"), a:has-text("Skip")' },
      { name: 'Main content', selector: 'main, [role="main"], .main-content' },
      { name: 'Login container', selector: '.login-container, .auth-container, [class*="login"]' },
      { name: 'Card/Panel', selector: '.card, .panel, [class*="card"], [class*="panel"]' }
    ];
    
    for (const pattern of patterns) {
      const count = await page.locator(pattern.selector).count();
      console.log(`  ${pattern.name}: ${count} elements`);
      
      if (count > 0) {
        const firstElement = page.locator(pattern.selector).first();
        const isVisible = await firstElement.isVisible();
        const text = await firstElement.textContent();
        console.log(`    First element visible: ${isVisible}, text: "${text?.slice(0, 50)}"`);
      }
    }

    console.log('✅ Login page inspection completed');
  });
});
