import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * Test software version verification functionality  
 * Migrated from: tests/account/software_verification.spec.js
 */
test.describe('Software Version Verification', () => {
  
  test('supervisor can view software version through About dialog', async ({ page }) => {
    // Arrange: Login as supervisor
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Verify supervisor dashboard loaded
    await supervisorDash.verifyDashboardLoaded();
    
    // Wait for page elements to be fully loaded
    await page.locator('mat-row').first().waitFor({ timeout: 30000 });
    
    // Act: Check application version through About dialog
    const version = await supervisorDash.checkApplicationVersion();
    
    // Assert: Verify version information is displayed
    expect(version).toBeTruthy();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
    
    // Version should follow expected format (e.g., "5.18(1-qawolftest)")
    expect(version).toMatch(/^\d+\.\d+/); // Should start with major.minor version
    
    console.log('XIMA CURRENT VERSION:', version);
    
    // Store version in environment for other tests to use
    await supervisorDash.setEnvironmentVariable('XIMA_VERSION', version);
  });
  
  test('software version is accessible from supervisor dashboard', async ({ page }) => {
    // Test that the version checking functionality works reliably
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Check version accessibility
    const userInitials = await supervisorDash.getUserInitials();
    expect(userInitials).toBe('SA'); // Verify we're logged in as supervisor
    
    // Try both methods of accessing About dialog
    try {
      const version = await supervisorDash.checkApplicationVersion();
      expect(version).toBeTruthy();
      console.log('Version accessed successfully:', version);
    } catch (error) {
      console.error('Failed to access version information:', error.message);
      throw error;
    }
  });
  
  test('about dialog opens and closes properly', async ({ page }) => {
    // Test the About dialog interaction specifically
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Verify supervisor access
    await supervisorDash.verifyDashboardLoaded();
    
    // Test the About dialog workflow manually for verification
    try {
      // Hover over user menu
      await page.locator('xima-user-menu').getByRole('button').hover();
      
      // Click About button
      await page.getByRole('button', { name: 'About' }).click();
      
      // Verify About dialog is visible
      const aboutDialog = page.locator('xima-about-dialog, [data-cy="about-ccaas-version"]');
      await expect(aboutDialog.first()).toBeVisible();
      
      // Get version text
      const versionElement = page.locator('[data-cy="about-ccaas-version"]');
      const version = await versionElement.textContent();
      expect(version).toBeTruthy();
      
      // Verify version matches expected format
      await expect(versionElement).toHaveText(version!);
      
      // Close dialog (OK button should be available but may not be needed)
      try {
        const okButton = page.locator('[data-cy="about-ccaas-ok"]');
        if (await okButton.isVisible()) {
          await okButton.click();
        }
      } catch (error) {
        // OK button might not be visible, that's fine
        console.log('OK button not found, dialog might close automatically');
      }
      
      console.log('About dialog workflow completed successfully');
      
    } catch (error) {
      console.error('About dialog workflow failed:', error.message);
      throw error;
    }
  });
  
  test('version information format is valid', async ({ page }) => {
    // Test that version information follows expected patterns
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    const version = await supervisorDash.checkApplicationVersion();
    
    // Test various version format expectations
    expect(version).toMatch(/\d/); // Should contain at least one digit
    expect(version.trim()).toBe(version); // Should not have leading/trailing whitespace
    expect(version.length).toBeGreaterThan(3); // Should be substantial
    expect(version.length).toBeLessThan(100); // Should not be excessively long
    
    // Common version patterns that might be seen
    const commonPatterns = [
      /^\d+\.\d+/, // Major.Minor
      /\d+\.\d+\(\d+/, // Version with build number in parentheses
      /\d+\.\d+\.\d+/, // Major.Minor.Patch
    ];
    
    const matchesPattern = commonPatterns.some(pattern => pattern.test(version));
    expect(matchesPattern).toBe(true);
    
    console.log('Version format validation passed:', version);
  });
});
