import { test, expect } from '@playwright/test';

const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@sizewise.com',
  password: 'SizeWise2024!6EAF4610705941'
};

test.describe('Login Functionality', () => {
  test('Super admin login works with Enter key', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Wait for form to be ready
    await page.waitForSelector('form');
    
    // Fill in credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill(SUPER_ADMIN_CREDENTIALS.email);
    await passwordInput.fill(SUPER_ADMIN_CREDENTIALS.password);
    
    // Submit form with Enter key
    await passwordInput.press('Enter');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText('Welcome to SizeWise Suite', { timeout: 5000 });
  });
});
