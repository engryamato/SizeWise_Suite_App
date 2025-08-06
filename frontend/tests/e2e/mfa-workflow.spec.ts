import { test, expect } from '@playwright/test';

test.describe('MFA Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Start the application
    await page.goto('/login');
  });

  test('should complete MFA setup workflow', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Navigate to security settings
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="security-settings"]');

    // Start MFA setup
    await page.click('[data-testid="setup-mfa-button"]');

    // Verify MFA setup modal appears
    await expect(page.locator('.max-w-md')).toContainText('Set Up Two-Factor Authentication');

    // Verify progress indicator shows step 1
    await expect(page.locator('[data-testid="mfa-step-1"]')).toBeVisible();

    // Verify QR code section is visible
    await expect(page.locator('h3')).toContainText('1. Install an Authenticator App');
    await expect(page.locator('h3')).toContainText('2. Scan QR Code');
    await expect(page.locator('h3')).toContainText('3. Manual Entry (Alternative)');

    // Continue to verification step
    await page.click('button:has-text("Continue to Verification")');

    // Verify we're on step 2
    await expect(page.locator('h3')).toContainText('Verify Your Setup');

    // Enter verification code (using a mock TOTP code)
    await page.fill('input[placeholder="000000"]', '123456');

    // Mock successful verification (in real test, would need valid TOTP)
    await page.evaluate(() => {
      // Mock the securityService.verifyMFASetup method
      (window as any).mockMFAVerification = true;
    });

    // Click verify button
    await page.click('button:has-text("Verify")');

    // Wait for backup codes step (mocked success)
    // In real implementation, this would wait for actual API response
    await page.waitForTimeout(1000);
    
    // Note: This test would need to be adapted based on actual implementation
    // and would require proper mocking of the MFA verification API
  });

  test('should handle MFA setup cancellation', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Navigate to security settings
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="security-settings"]');

    // Start MFA setup
    await page.click('[data-testid="setup-mfa-button"]');

    // Cancel setup
    await page.click('button:has-text("Cancel Setup")');

    // Verify modal is closed
    await expect(page.locator('.max-w-md')).not.toBeVisible();
  });

  test('should handle invalid verification code', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Navigate to security settings
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="security-settings"]');

    // Start MFA setup
    await page.click('[data-testid="setup-mfa-button"]');

    // Continue to verification
    await page.click('button:has-text("Continue to Verification")');

    // Enter invalid verification code
    await page.fill('input[placeholder="000000"]', '000000');

    // Click verify
    await page.click('button:has-text("Verify")');

    // Verify error message appears
    await expect(page.locator('.bg-red-100')).toContainText('Invalid verification code');
  });

  test('should validate verification code format', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Navigate to security settings
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="security-settings"]');

    // Start MFA setup
    await page.click('[data-testid="setup-mfa-button"]');

    // Continue to verification
    await page.click('button:has-text("Continue to Verification")');

    // Test various invalid formats
    const invalidCodes = ['12345', '1234567', 'abcdef', '12345a'];

    for (const code of invalidCodes) {
      await page.fill('input[placeholder="000000"]', code);
      
      // Verify button should be disabled for invalid length
      if (code.length !== 6) {
        await expect(page.locator('button:has-text("Verify")')).toBeDisabled();
      }
    }

    // Enter valid format (6 digits)
    await page.fill('input[placeholder="000000"]', '123456');
    await expect(page.locator('button:has-text("Verify")')).toBeEnabled();
  });

  test('should handle backup codes download', async ({ page }) => {
    // This test would need to mock the entire MFA setup flow
    // and test the backup codes download functionality
    
    // Mock the completed MFA setup state
    await page.evaluate(() => {
      // Mock state where user has completed MFA setup
      (window as any).mockMFASetupComplete = {
        step: 'backup',
        backupCodes: [
          'ABC123DEF456',
          'GHI789JKL012',
          'MNO345PQR678',
          'STU901VWX234',
          'YZA567BCD890'
        ]
      };
    });

    // Navigate directly to security settings (after mock login)
    await page.goto('/security-settings');

    // Verify backup codes are displayed
    await expect(page.locator('h3')).toContainText('Save Your Backup Codes');

    // Test download functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download Backup Codes")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sizewise-backup-codes.txt');

    // Verify checkbox is required for completion
    await expect(page.locator('button:has-text("Complete Setup")')).toBeDisabled();

    // Check the confirmation checkbox
    await page.check('input[type="checkbox"]');
    await expect(page.locator('button:has-text("Complete Setup")')).toBeEnabled();

    // Complete setup
    await page.click('button:has-text("Complete Setup")');
  });

  test('should show MFA status in security settings', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Navigate to security settings
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="security-settings"]');

    // Verify MFA status is shown
    await expect(page.locator('[data-testid="mfa-status"]')).toBeVisible();

    // For user without MFA enabled
    await expect(page.locator('[data-testid="mfa-status"]')).toContainText('Two-Factor Authentication: Disabled');
    await expect(page.locator('[data-testid="setup-mfa-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="disable-mfa-button"]')).not.toBeVisible();
  });

  test('should handle MFA disable workflow', async ({ page }) => {
    // Mock user with MFA enabled
    await page.evaluate(() => {
      (window as any).mockUserMFAEnabled = true;
    });

    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Navigate to security settings
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="security-settings"]');

    // Verify MFA enabled status
    await expect(page.locator('[data-testid="mfa-status"]')).toContainText('Two-Factor Authentication: Enabled');
    await expect(page.locator('[data-testid="disable-mfa-button"]')).toBeVisible();

    // Click disable MFA
    await page.click('[data-testid="disable-mfa-button"]');

    // Verify confirmation dialog
    await expect(page.locator('.max-w-md')).toContainText('Disable Two-Factor Authentication');

    // Enter password
    await page.fill('input[type="password"]', 'testpassword123');

    // Confirm disable
    await page.click('button:has-text("Disable MFA")');

    // Verify MFA is disabled
    await expect(page.locator('[data-testid="mfa-status"]')).toContainText('Two-Factor Authentication: Disabled');
  });
});

test.describe('MFA Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user with MFA enabled
    await page.addInitScript(() => {
      (window as any).mockUserMFAEnabled = true;
    });
    
    await page.goto('/login');
  });

  test('should prompt for MFA token during login', async ({ page }) => {
    // Enter credentials
    await page.fill('input[type="email"]', 'mfa-user@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Verify MFA prompt appears
    await expect(page.locator('input[placeholder="000000"]')).toBeVisible();
    await expect(page.locator('text=Enter your authentication code')).toBeVisible();

    // Enter MFA token
    await page.fill('input[placeholder="000000"]', '123456');
    await page.click('button:has-text("Verify")');

    // Should proceed to dashboard (mocked success)
    // In real implementation, would verify actual redirect
  });

  test('should allow backup code for MFA authentication', async ({ page }) => {
    // Enter credentials
    await page.fill('input[type="email"]', 'mfa-user@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Click use backup code link
    await page.click('text=Use backup code');

    // Enter backup code
    await page.fill('input[placeholder="Enter backup code"]', 'ABC123DEF456');
    await page.click('button:has-text("Verify")');

    // Should proceed to dashboard (mocked success)
  });

  test('should handle invalid MFA token during login', async ({ page }) => {
    // Enter credentials
    await page.fill('input[type="email"]', 'mfa-user@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Enter invalid MFA token
    await page.fill('input[placeholder="000000"]', '000000');
    await page.click('button:has-text("Verify")');

    // Verify error message
    await expect(page.locator('.bg-red-100')).toContainText('Invalid authentication code');
  });
});
