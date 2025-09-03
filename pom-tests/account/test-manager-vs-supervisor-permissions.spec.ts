import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * Test permission differences between Test Manager and Supervisor user types
 * Migrated from: tests/account/test_manager_ui_vs_admin_ui.spec.js
 */
test.describe('User Permission Comparison', () => {
  
  test('supervisor has access to management features that test manager does not', async ({ browser }) => {
    // Arrange: Set up both user sessions
    
    // Login as Supervisor
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDash = await supervisorLoginPage.loginAsSupervisor();
    
    // Login as Test Manager in separate context
    const testManagerContext = await browser.newContext();
    const testManagerPage = await testManagerContext.newPage();
    const testManagerLoginPage = await LoginPage.create(testManagerPage);
    
    // Use hardcoded test manager credentials from original test
    const testManagerCredentials = {
      username: 'ximatest+120@ximasoftware.com',
      password: 'Password123!'
    };
    
    const testManagerDash = await testManagerLoginPage.loginAsTestManager(testManagerCredentials);
    
    // Assert: Verify both dashboards loaded
    await supervisorDash.verifyDashboardLoaded();
    await testManagerDash.verifyDashboardLoaded();
    
    // Test 1: User Management Access
    await supervisorPage.bringToFront();
    const supervisorHasUserMgmt = await supervisorDash.hasSupervisorPrivileges();
    expect(supervisorHasUserMgmt).toBe(true);
    
    // Navigate to user management to verify access
    const userMgmtPage = await supervisorDash.navigateToUserManagement();
    await userMgmtPage.verifyAgentLicensingVisible();
    
    // Test Manager should NOT have user management access
    await testManagerPage.bringToFront();
    const testManagerHasUserMgmt = await testManagerDash.hasUserManagementAccess();
    expect(testManagerHasUserMgmt).toBe(false);
    
    // Test 2: Contact Center Access
    await supervisorPage.bringToFront();
    const supervisorHasContactCenter = await supervisorDash.hasContactCenterAccess();
    expect(supervisorHasContactCenter).toBe(true);
    
    await testManagerPage.bringToFront();
    const testManagerHasContactCenter = await testManagerDash.hasContactCenterAccess();
    expect(testManagerHasContactCenter).toBe(false);
    
    // Test 3: Routing Configuration Access
    await supervisorPage.bringToFront();
    await expect(
      supervisorPage.locator('[data-cy="sidenav-menu-ROUTING_CONFIGURATION"]')
    ).toBeVisible();
    
    await testManagerPage.bringToFront();
    const testManagerHasRoutingConfig = await testManagerDash.hasRoutingConfigAccess();
    expect(testManagerHasRoutingConfig).toBe(false);
    
    // Test 4: Admin Systems Access
    await supervisorPage.bringToFront();
    await expect(
      supervisorPage.locator('[data-cy="sidenav-menu-ADMIN_SYSTEM"]')
    ).toBeVisible();
    
    await testManagerPage.bringToFront();
    const testManagerHasAdminSystems = await testManagerDash.hasAdminSystemsAccess();
    expect(testManagerHasAdminSystems).toBe(false);
    
    // Cleanup: Close contexts
    await supervisorContext.close();
    await testManagerContext.close();
  });
  
  test('test manager has appropriate restrictions compared to supervisor', async ({ browser }) => {
    // Arrange: Login as Test Manager
    const testManagerContext = await browser.newContext();
    const testManagerPage = await testManagerContext.newPage();
    const testManagerLoginPage = await LoginPage.create(testManagerPage);
    
    const testManagerCredentials = {
      username: 'ximatest+120@ximasoftware.com',
      password: 'Password123!'
    };
    
    const testManagerDash = await testManagerLoginPage.loginAsTestManager(testManagerCredentials);
    
    // Act & Assert: Verify all test manager restrictions
    const restrictions = await testManagerDash.verifyTestManagerRestrictions();
    
    // Test Manager should NOT have access to these features
    expect(restrictions.hasContactCenter).toBe(false);
    expect(restrictions.hasUserManagement).toBe(false);
    expect(restrictions.hasRoutingConfig).toBe(false);
    expect(restrictions.hasAdminSystems).toBe(false);
    
    // Verify test manager session is correctly identified
    await testManagerDash.verifyTestManagerSession();
    
    // Verify available options are limited to reports
    const availableOptions = await testManagerDash.getAvailableNavigationOptions();
    expect(availableOptions).toEqual(['Reports']);
    
    // Verify restricted options are not available
    const restrictedOptions = await testManagerDash.getRestrictedNavigationOptions();
    expect(restrictedOptions).toEqual([]); // Should be empty - no restricted items should be visible
    
    // Test Manager should still be able to access reports
    const reportsPage = await testManagerDash.navigateToReports();
    await reportsPage.verifyPageLoaded();
    
    // Cleanup
    await testManagerContext.close();
  });
  
  test('supervisor has full access to all management features', async ({ page }) => {
    // Arrange: Login as Supervisor  
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Act & Assert: Verify supervisor has full access
    const hasSupervisorPrivileges = await supervisorDash.hasSupervisorPrivileges();
    expect(hasSupervisorPrivileges).toBe(true);
    
    // Should NOT have test manager limitations
    const hasTestManagerLimitations = await supervisorDash.hasTestManagerLimitations();
    expect(hasTestManagerLimitations).toBe(false);
    
    // Get all available navigation options
    const availableOptions = await supervisorDash.getAvailableNavigationOptions();
    
    // Supervisor should have access to multiple features
    expect(availableOptions.length).toBeGreaterThan(1);
    expect(availableOptions).toContain('Reports');
    expect(availableOptions).toContain('User Management');
    
    // Test specific navigation access
    const userMgmtPage = await supervisorDash.navigateToUserManagement();
    await userMgmtPage.verifyPageLoaded();
    
    await page.goBack();
    await supervisorDash.verifyDashboardLoaded();
    
    const reportsPage = await supervisorDash.navigateToReports();
    await reportsPage.verifyPageLoaded();
    
    // Cleanup
    await page.goBack();
    await supervisorDash.logout();
  });
  
  test('different user types land on appropriate dashboards', async ({ browser }) => {
    // Test that login routing works correctly for different user types
    
    // Test Supervisor Login
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDash = await supervisorLoginPage.loginAsSupervisor();
    
    await supervisorDash.verifyDashboardLoaded();
    expect(await supervisorDash.hasSupervisorPrivileges()).toBe(true);
    
    // Test Test Manager Login  
    const testManagerContext = await browser.newContext();
    const testManagerPage = await testManagerContext.newPage();
    const testManagerLoginPage = await LoginPage.create(testManagerPage);
    
    const testManagerCredentials = {
      username: 'ximatest+120@ximasoftware.com',
      password: 'Password123!'
    };
    
    const testManagerDash = await testManagerLoginPage.loginAsTestManager(testManagerCredentials);
    await testManagerDash.verifyDashboardLoaded();
    await testManagerDash.verifyTestManagerSession();
    
    // Cleanup
    await supervisorContext.close();
    await testManagerContext.close();
  });
});
