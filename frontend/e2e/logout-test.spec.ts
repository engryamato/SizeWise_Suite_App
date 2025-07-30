import { test, expect } from '@playwright/test';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

test.describe('Logout Functionality', () => {
  test('Complete logout flow - login, navigate, logout, verify redirect', async ({ page }) => {
    // Step 1: Login
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Fill in credentials and login
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    
    // Verify successful login
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Welcome to SizeWise Suite', { timeout: 5000 });
    
    // Step 2: Test logout from navigation dropdown
    // Look for the profile/user dropdown in the navigation
    const profileButton = page.locator('[data-testid="profile-dropdown"], button:has-text("Profile"), .profile-dropdown, [aria-label*="profile" i], [aria-label*="user" i]').first();
    
    // If profile button not found by test id, try finding by icon or text
    if (await profileButton.count() === 0) {
      // Try to find by User icon or Profile text in navigation
      const navButtons = page.locator('nav button, header button');
      let profileFound = false;
      
      for (let i = 0; i < await navButtons.count(); i++) {
        const button = navButtons.nth(i);
        const text = await button.textContent();
        if (text && (text.includes('Profile') || text.includes('User') || text.includes('Admin'))) {
          await button.click();
          profileFound = true;
          break;
        }
      }
      
      if (!profileFound) {
        // Try clicking on any dropdown that might contain logout
        const dropdownTriggers = page.locator('button:has([data-lucide="chevron-down"]), button:has([data-lucide="user"])');
        if (await dropdownTriggers.count() > 0) {
          await dropdownTriggers.first().click();
        }
      }
    } else {
      await profileButton.click();
    }
    
    // Wait a moment for dropdown to appear
    await page.waitForTimeout(500);
    
    // Step 3: Click logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")').first();
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
    } else {
      // If logout button not found, try to find it in any visible dropdown
      const allButtons = page.locator('button, a');
      for (let i = 0; i < await allButtons.count(); i++) {
        const button = allButtons.nth(i);
        const text = await button.textContent();
        if (text && (text.includes('Logout') || text.includes('Sign Out'))) {
          await button.click();
          break;
        }
      }
    }
    
    // Step 4: Verify logout redirect
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    
    // Step 5: Verify user is actually logged out by trying to access protected route
    await page.goto('http://localhost:3000/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    
    // Step 6: Verify login form is visible and functional
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Logout clears authentication state', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000');
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    
    // Check that localStorage has authentication data
    const tokenBefore = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userBefore = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    
    expect(tokenBefore).toBeTruthy();
    expect(userBefore).toBeTruthy();
    
    // Logout (try multiple methods to ensure we find the logout button)
    try {
      // Method 1: Try profile dropdown
      await page.locator('button:has([data-lucide="user"]), button:has-text("Profile")').first().click();
      await page.waitForTimeout(300);
      await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first().click();
    } catch {
      // Method 2: Try any dropdown with logout
      const dropdowns = page.locator('button:has([data-lucide="chevron-down"])');
      for (let i = 0; i < await dropdowns.count(); i++) {
        await dropdowns.nth(i).click();
        await page.waitForTimeout(200);
        const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
        if (await logoutBtn.count() > 0) {
          await logoutBtn.first().click();
          break;
        }
      }
    }
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    
    // Check that localStorage is cleared
    const tokenAfter = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfter = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    const tierStatusAfter = await page.evaluate(() => localStorage.getItem('sizewise_tier_status'));
    
    expect(tokenAfter).toBeNull();
    expect(userAfter).toBeNull();
    expect(tierStatusAfter).toBeNull();
  });
});
