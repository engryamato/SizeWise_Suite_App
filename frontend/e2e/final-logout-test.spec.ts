import { test, expect } from '@playwright/test';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

test.describe('Final Logout System Verification', () => {
  test('Complete logout system works perfectly', async ({ page }) => {
    console.log('🚀 Starting comprehensive logout system test...');
    
    // Step 1: Login
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL(/\/auth\/login/);
    
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    console.log('✅ 1. Login successful');
    
    // Step 2: Verify authentication data is stored
    const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterLogin = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    const cookieAfterLogin = await page.evaluate(() => document.cookie.includes('auth-token'));
    
    expect(tokenAfterLogin).toBeTruthy();
    expect(userAfterLogin).toBeTruthy();
    expect(cookieAfterLogin).toBe(true);
    console.log('✅ 2. Authentication data stored (localStorage + cookie)');
    
    // Step 3: Test authenticated navigation
    await page.goto('http://localhost:3000/projects');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/projects');
    console.log('✅ 3. Authenticated navigation works');
    
    // Step 4: Logout via Profile dropdown
    await page.goto('http://localhost:3000/dashboard');
    const profileNavItem = page.locator('nav').locator('text=Profile').first();
    await profileNavItem.hover();
    await page.waitForTimeout(500);
    
    const logoutButton = page.locator('text=Logout').first();
    await logoutButton.click();
    console.log('✅ 4. Logout button clicked');
    
    // Step 5: Verify logout redirect
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    console.log('✅ 5. Redirected to login page');
    
    // Step 6: Verify all authentication data is cleared
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    const tierStatusAfterLogout = await page.evaluate(() => localStorage.getItem('sizewise_tier_status'));
    const cookieAfterLogout = await page.evaluate(() => document.cookie.includes('auth-token'));
    
    expect(tokenAfterLogout).toBeNull();
    expect(userAfterLogout).toBeNull();
    expect(tierStatusAfterLogout).toBeNull();
    expect(cookieAfterLogout).toBe(false);
    console.log('✅ 6. All authentication data cleared (localStorage + cookie)');
    
    // Step 7: Verify protected routes redirect to login
    await page.goto('http://localhost:3000/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    
    await page.goto('http://localhost:3000/projects');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    console.log('✅ 7. Protected routes redirect to login');
    
    // Step 8: Verify login form is functional
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✅ 8. Login form is accessible');
    
    // Step 9: Test re-login functionality
    await page.locator('input[type="email"]').fill(SUPER_ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(SUPER_ADMIN_CREDENTIALS.password);
    await page.locator('input[type="password"]').press('Enter');
    
    // Should redirect to dashboard or the originally requested page
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    const isValidRedirect = finalUrl.includes('/dashboard') || finalUrl.includes('/projects');
    expect(isValidRedirect).toBe(true);
    console.log('✅ 9. Re-login works correctly');
    
    // Step 10: Verify authentication data is restored
    const tokenAfterReLogin = await page.evaluate(() => localStorage.getItem('sizewise_token'));
    const userAfterReLogin = await page.evaluate(() => localStorage.getItem('sizewise_user'));
    const cookieAfterReLogin = await page.evaluate(() => document.cookie.includes('auth-token'));
    
    expect(tokenAfterReLogin).toBeTruthy();
    expect(userAfterReLogin).toBeTruthy();
    expect(cookieAfterReLogin).toBe(true);
    console.log('✅ 10. Authentication data restored after re-login');
    
    console.log('🎉 LOGOUT SYSTEM TEST COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Login stores data in localStorage and cookies');
    console.log('   ✅ Authenticated navigation works');
    console.log('   ✅ Logout button is accessible via Profile dropdown');
    console.log('   ✅ Logout clears all authentication data');
    console.log('   ✅ Logout redirects to login page');
    console.log('   ✅ Protected routes redirect to login after logout');
    console.log('   ✅ Login form remains functional after logout');
    console.log('   ✅ Re-login works correctly');
    console.log('   ✅ Authentication state is properly restored');
  });
});
