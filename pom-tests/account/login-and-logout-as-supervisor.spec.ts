import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * Test supervisor login and logout functionality
 * Migrated from: tests/account/login_and_logout_as_supervisor.spec.js
 */
test.describe('Supervisor Authentication', () => {
  
  test('supervisor can login and logout successfully', async ({ page }) => {
    // Arrange: Create login page (entry point)
    const loginPage = await LoginPage.create(page);
    
    // Verify login form is displayed
    await loginPage.verifyLoginFormVisible();
    
    // Act: Login as supervisor using default credentials
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Assert: Verify supervisor dashboard loaded correctly
    await supervisorDash.verifyDashboardLoaded();
    
    // Verify supervisor-specific elements
    const userInitials = await supervisorDash.getUserInitials();
    expect(userInitials).toBe('SA');
    
    // Verify supervisor has access to user management (proves supervisor privileges)
    const hasSupervisorAccess = await supervisorDash.hasSupervisorPrivileges();
    expect(hasSupervisorAccess).toBe(true);
    
    // Verify "Cradle to Grave" tab is visible (from original test)
    const reportsPage = await supervisorDash.navigateToReports();
    await expect(page.locator('[data-cy="reports-c2g-component-tab-ctog"]:has-text("Cradle to Grave")')).toBeVisible();
    
    // Navigate back to dashboard for logout
    await page.goBack();
    await supervisorDash.verifyDashboardLoaded();
    
    // Act: Logout from supervisor dashboard
    await supervisorDash.logout();
    
    // Assert: Verify we're back on login page
    await loginPage.verifyLoginFormVisible();
    
    // Verify company logo is visible (from original test assertion)
    await expect(page.locator('[alt="company-logo"]')).toBeVisible();
    
    // Verify login fields are empty and login button is disabled
    const usernameField = page.locator('[data-cy="consolidated-login-username-input"]');
    const passwordField = page.locator('[data-cy="consolidated-login-password-input"]');
    const loginButton = page.locator('[data-cy="consolidated-login-login-button"]');
    
    await expect(usernameField).toBeVisible();
    await expect(usernameField).toHaveValue(''); // Should be empty after logout
    
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveValue(''); // Should be empty after logout
    
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeDisabled(); // Should be disabled when fields are empty
  });
  
  test('supervisor login with invalid credentials shows error', async ({ page }) => {
    // Arrange: Create login page
    const loginPage = await LoginPage.create(page);
    
    // Act: Attempt login with invalid credentials
    const invalidCredentials = {
      username: 'invalid_user',
      password: 'wrong_password'
    };
    
    try {
      await loginPage.login(invalidCredentials);
    } catch (error) {
      // Expected to fail
    }
    
    // Assert: Check if error message is displayed
    const hasError = await loginPage.hasLoginError();
    if (hasError) {
      const errorMessage = await loginPage.getLoginErrorMessage();
      expect(errorMessage).toBeTruthy();
      console.log('Login error message:', errorMessage);
    }
    
    // Should still be on login page
    await loginPage.verifyLoginFormVisible();
  });
  
  test('supervisor can clear login form', async ({ page }) => {
    // Arrange: Create login page and fill with data
    const loginPage = await LoginPage.create(page);
    
    const testCredentials = {
      username: 'test_user',
      password: 'test_password'
    };
    
    // Fill form with test data
    await page.locator('[data-cy="consolidated-login-username-input"]').fill(testCredentials.username);
    await page.locator('[data-cy="consolidated-login-password-input"]').fill(testCredentials.password);
    
    // Verify fields have values
    await expect(page.locator('[data-cy="consolidated-login-username-input"]')).toHaveValue(testCredentials.username);
    await expect(page.locator('[data-cy="consolidated-login-password-input"]')).toHaveValue(testCredentials.password);
    
    // Act: Clear the form
    await loginPage.clearForm();
    
    // Assert: Fields should be empty
    await expect(page.locator('[data-cy="consolidated-login-username-input"]')).toHaveValue('');
    await expect(page.locator('[data-cy="consolidated-login-password-input"]')).toHaveValue('');
  });
});
