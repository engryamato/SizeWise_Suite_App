import { test, expect } from '@playwright/test';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

test.describe('Logout with Hover Test', () => {
  test('Login, hover over Profile, and logout', async ({ page }) => {
    // Step 1: Login
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Fill in credentials and login
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    
    // Verify successful login
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    
    // Step 2: Verify localStorage has data
    const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    
    expect(tokenAfterLogin).toBeTruthy();
    expect(userAfterLogin).toBeTruthy();
    
    // Step 3: Look for Profile navigation item and hover over it
    const profileNavItem = page.locator('nav').locator('text=Profile').first();
    
    if (await profileNavItem.count() > 0) {
      console.log('Found Profile navigation item, hovering...');
      await profileNavItem.hover();
      
      // Wait for dropdown to appear
      await page.waitForTimeout(500);
      
      // Look for logout button in dropdown
      const logoutButton = page.locator('text=Logout').first();
      
      if (await logoutButton.count() > 0) {
        console.log('Found Logout button, clicking...');
        await logoutButton.click();
        
        // Wait for redirect
        await page.waitForTimeout(2000);
        
        // Verify redirect to login
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
        
        // Verify localStorage is cleared
        const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_token'));
        const userAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_user'));
        
        expect(tokenAfterLogout).toBeNull();
        expect(userAfterLogout).toBeNull();
        
        console.log('✅ Logout successful!');
      } else {
        console.log('❌ Logout button not found in dropdown');
        
        // Take screenshot to debug
        await page.screenshot({ path: 'profile-dropdown-debug.png', fullPage: true });
        
        // List all visible text elements
        const allText = await page.locator('*').allTextContents();
        console.log('All visible text:', allText.filter(text => text.includes('Logout') || text.includes('Sign Out')));
      }
    } else {
      console.log('❌ Profile navigation item not found');
      
      // Take screenshot to debug
      await page.screenshot({ path: 'navigation-debug.png', fullPage: true });
      
      // Try to find any element with "Profile" text
      const allProfileElements = page.locator('text=Profile');
      const profileCount = await allProfileElements.count();
      console.log(`Found ${profileCount} elements with "Profile" text`);
      
      // Try alternative approach - look for User icon
      const userIconElements = page.locator('[data-lucide="user"]');
      const userIconCount = await userIconElements.count();
      console.log(`Found ${userIconCount} user icon elements`);
      
      if (userIconCount > 0) {
        console.log('Trying to hover over user icon...');
        await userIconElements.first().hover();
        await page.waitForTimeout(500);
        
        const logoutAfterUserIcon = page.locator('text=Logout').first();
        if (await logoutAfterUserIcon.count() > 0) {
          console.log('Found Logout after hovering user icon!');
          await logoutAfterUserIcon.click();
          await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
        }
      }
    }
  });
});
