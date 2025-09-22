import { test, expect } from '@playwright/test';
import { PortalLoginPage, PortalAccountType } from '../../pom-migration/pages/auth/portal-login-page';

/**
 * Login Portal - Admin Test
 * 
 * Migrated from: tests/login_portal/login_portal_login_with_admin.spec.js
 * 
 * This test verifies portal admin authentication and interface access:
 * 1. Portal admin login with full administrative credentials
 * 2. Complete admin interface verification (all sidebar menus)
 * 3. Admin permissions and access level validation
 * 4. User identity verification in portal context
 * 5. Portal logout functionality and cleanup
 */
test.describe('Portal Authentication - Admin Access', () => {
  
  test('Portal admin can login and access full administrative interface', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up portal admin login
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up portal admin login ===');
    
    // Test constants (matching original test exactly)
    const accountType = PortalAccountType.ADMIN;
    const expectedAdminName = "Keith Admin";
    
    console.log(`Portal admin test starting for account: ${accountType}`);
    console.log(`Expected admin name: ${expectedAdminName}`);
    
    //--------------------------------
    // Act: Login as Portal Admin
    //--------------------------------
    
    console.log('=== ACT: Logging in as portal admin ===');
    
    // Create portal login page and login as admin
    const portalLoginPage = await PortalLoginPage.create(page);
    const adminDashboard = await portalLoginPage.loginAsPortalAdmin();
    
    console.log('Portal admin login completed');
    
    //--------------------------------
    // Assert: Verify Complete Admin Interface Access
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete admin interface access ===');
    
    // Verify admin dashboard loaded with full permissions
    await adminDashboard.verifyAdminDashboardLoaded();
    
    console.log('✅ Admin dashboard loaded successfully');
    
    // Verify Reports tab is visible and active by default
    await adminDashboard.verifyReportsTabActive();
    
    console.log('✅ Reports tab verified as active by default');
    
    // Verify Cradle to Grave tab is visible
    const cradleToGraveTab = page.locator('mat-toolbar-row').getByText('Cradle to Grave');
    await expect(cradleToGraveTab).toBeVisible();
    
    console.log('✅ Cradle to Grave tab verified');
    
    //--------------------------------
    // Verify All Admin Sidebar Menu Items
    //--------------------------------
    
    console.log('=== VERIFICATION: Confirming all admin sidebar permissions ===');
    
    // Verify comprehensive admin access to all system components
    await adminDashboard.verifyFullAdminAccess();
    
    console.log('✅ All admin sidebar menu items verified');
    
    //--------------------------------
    // Verify Admin User Identity
    //--------------------------------
    
    console.log('=== IDENTITY: Verifying admin user identity in portal ===');
    
    // Verify admin name and email are displayed correctly
    const adminEmail = process.env.PORTAL_ADMIN_EMAIL || '';
    await adminDashboard.verifyUserIdentity(expectedAdminName, adminEmail);
    
    console.log(`✅ Admin identity verified: ${expectedAdminName} (${adminEmail})`);
    
    //--------------------------------
    // Cleanup: Portal Admin Logout
    //--------------------------------
    
    console.log('=== CLEANUP: Logging out from portal admin ===');
    
    try {
      // Perform admin logout
      await adminDashboard.logout();
      
      console.log('✅ Portal admin logout successful');
      
      // Verify return to login page with company logo
      await portalLoginPage.verifyLoginFormVisible();
      
      console.log('✅ Returned to portal login page after logout');
      
    } catch (error) {
      console.warn('Portal admin logout encountered issues:', error.message);
      
      // Report cleanup failure (matching original test pattern)
      console.error('Cleanup failed - could not log out as admin:', error.message);
      throw error;
    }
    
    console.log('=== TEST COMPLETED: Portal admin access verified successfully ===');
    console.log('✅ Portal admin can login with full permissions');
    console.log('✅ Complete administrative interface accessible');
    console.log('✅ All sidebar menu items available to admin');
    console.log('✅ Admin user identity properly displayed');
    console.log('✅ Portal logout functionality working');
    console.log('✅ Admin portal workflow validation complete');
  });
  
  /**
   * Test portal admin permissions verification
   */
  test('Portal admin has complete system access', async ({ page }) => {
    // Simplified admin permissions test
    const portalLoginPage = await PortalLoginPage.create(page);
    const adminDashboard = await portalLoginPage.loginAsPortalAdmin();
    
    // Verify full admin access
    await adminDashboard.verifyFullAdminAccess();
    
    console.log('Portal admin permissions verification completed');
  });
  
  /**
   * Test portal admin interface elements
   */
  test('Portal admin interface elements verification', async ({ page }) => {
    const portalLoginPage = await PortalLoginPage.create(page);
    const adminDashboard = await portalLoginPage.loginAsPortalAdmin();
    
    // Verify specific admin interface elements
    await adminDashboard.verifyAdminDashboardLoaded();
    await adminDashboard.verifyReportsTabActive();
    
    // Test logout
    await adminDashboard.logout();
    
    console.log('Portal admin interface elements verification completed');
  });
});
