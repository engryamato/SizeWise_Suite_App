import { test, expect } from '@playwright/test';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

test.describe('Simple Logout Test', () => {
  test('Login and check localStorage, then find logout button', async ({ page }) => {
    // Step 1: Login
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Fill in credentials and login
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    
    // Verify successful login
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    
    // Step 2: Check localStorage after login
    const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    
    console.log('Token after login:', tokenAfterLogin ? 'EXISTS' : 'NULL');
    console.log('User after login:', userAfterLogin ? 'EXISTS' : 'NULL');
    
    // Step 3: Take a screenshot to see the UI
    await page.screenshot({ path: 'dashboard-after-login.png', fullPage: true });
    
    // Step 4: Look for any buttons or dropdowns that might contain logout
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on the page`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      if (text && text.trim()) {
        console.log(`Button ${i}: "${text.trim()}" (visible: ${isVisible})`);
      }
    }
    
    // Step 5: Look for navigation elements
    const navElements = await page.locator('nav, header, [role="navigation"]').all();
    console.log(`Found ${navElements.length} navigation elements`);
    
    // Step 6: Try to find and click profile/user dropdown
    const possibleProfileButtons = page.locator('button:has-text("Profile"), button:has([data-lucide="user"]), button:has([data-lucide="chevron-down"])');
    const profileButtonCount = await possibleProfileButtons.count();
    console.log(`Found ${profileButtonCount} possible profile buttons`);
    
    if (profileButtonCount > 0) {
      // Click the first profile-like button
      await possibleProfileButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'after-profile-click.png', fullPage: true });
      
      // Look for logout button
      const logoutButtons = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")');
      const logoutCount = await logoutButtons.count();
      console.log(`Found ${logoutCount} logout buttons after clicking profile`);
      
      if (logoutCount > 0) {
        console.log('Logout button found! Clicking it...');
        await logoutButtons.first().click();
        
        // Wait for potential redirect
        await page.waitForTimeout(2000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after logout click:', currentUrl);
        
        // Check localStorage after logout attempt
        const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_token'));
        const userAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_user'));
        
        console.log('Token after logout:', tokenAfterLogout ? 'EXISTS' : 'NULL');
        console.log('User after logout:', userAfterLogout ? 'EXISTS' : 'NULL');
      }
    }
  });
});
