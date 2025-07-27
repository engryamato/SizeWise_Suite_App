import { test, expect } from '@playwright/test';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

test.describe('Complete Logout System Test', () => {
  test('Full logout flow: login → navigate → logout → verify protection', async ({ page }) => {
    // Step 1: Login
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Welcome to SizeWise Suite', { timeout: 5000 });
    
    // Step 2: Verify authentication state
    const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    
    expect(tokenAfterLogin).toBeTruthy();
    expect(userAfterLogin).toBeTruthy();
    
    console.log('✅ Login successful with localStorage data');
    
    // Step 3: Navigate to different pages to verify authenticated access
    // Try to access projects page
    await page.goto('http://localhost:3000/projects');
    // Should stay on projects page (not redirect to login)
    await page.waitForTimeout(1000);
    const projectsUrl = page.url();
    expect(projectsUrl).toContain('/projects');
    
    console.log('✅ Authenticated navigation works');
    
    // Step 4: Return to dashboard and logout
    await page.goto('http://localhost:3000/dashboard');
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    
    // Hover over Profile to open dropdown
    const profileNavItem = page.locator('nav').locator('text=Profile').first();
    await profileNavItem.hover();
    await page.waitForTimeout(500);
    
    // Click logout
    const logoutButton = page.locator('text=Logout').first();
    await logoutButton.click();
    
    // Step 5: Verify logout redirect
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    
    console.log('✅ Logout redirect successful');
    
    // Step 6: Verify localStorage is cleared
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    const tierStatusAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_tier_status'));
    
    expect(tokenAfterLogout).toBeNull();
    expect(userAfterLogout).toBeNull();
    expect(tierStatusAfterLogout).toBeNull();
    
    console.log('✅ localStorage cleared successfully');
    
    // Step 7: Verify protected routes redirect to login
    await page.goto('http://localhost:3000/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    
    await page.goto('http://localhost:3000/projects');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    
    console.log('✅ Protected routes redirect to login after logout');
    
    // Step 8: Verify login form is functional after logout
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Sign In")')).toBeVisible();
    
    console.log('✅ Login form is accessible after logout');
    
    // Step 9: Verify can login again after logout
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    
    console.log('✅ Re-login after logout works');
    
    // Final verification: Check localStorage is populated again
    const tokenAfterReLogin = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterReLogin = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    
    expect(tokenAfterReLogin).toBeTruthy();
    expect(userAfterReLogin).toBeTruthy();
    
    console.log('✅ Complete logout system test passed!');
  });
});
