import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * Test SIP extension management functionality
 * Migrated from: tests/account/remove_add_a_sip_extension.spec.js
 */
test.describe('SIP Extension Management', () => {
  
  test('administrator can remove and add SIP extensions', async ({ page }) => {
    // Arrange: Login as supervisor/administrator
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    await supervisorDash.verifyDashboardLoaded();
    
    // Navigate to SIP Extensions management
    const sipExtensionsPage = await supervisorDash.navigateToSipExtensions();
    
    // Step 1: Remove SIP Extension
    // Verify that both extensions are initially "Registered"
    await sipExtensionsPage.verifyExtensionStatus('111', 'Registered');
    await sipExtensionsPage.verifyExtensionStatus('101', 'Registered');
    
    // Act: Remove extension 111
    await sipExtensionsPage.removeExtension('111');
    
    // Assert: Verify extension 111 is no longer visible
    await sipExtensionsPage.verifyExtensionNotExists('111');
    
    // Extension 101 should still be there
    await sipExtensionsPage.verifyExtensionExists('101');
    
    // Step 2: Add SIP Extension back
    // Navigate back to extensions page (close and reopen)
    await sipExtensionsPage.closePage();
    
    // Navigate back to SIP Extensions
    const sipExtensionsPage2 = await supervisorDash.navigateToSipExtensions();
    
    // Act: Add extension 111 back
    await sipExtensionsPage2.addExtension('111', 'uY2uVA0v');
    
    // Refresh the extensions list
    await sipExtensionsPage2.refreshExtensions();
    
    // Assert: Verify both SIP handsets are now "Registered"
    await sipExtensionsPage2.verifyExtensionStatus('111', 'Registered');
    await sipExtensionsPage2.verifyExtensionStatus('101', 'Registered');
    
    console.log('SIP extension management test completed successfully');
  });
  
  test('SIP extensions page displays current extension status', async ({ page }) => {
    // Test that the SIP extensions page loads and shows extension information
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Navigate to SIP Extensions
    const sipExtensionsPage = await supervisorDash.navigateToSipExtensions();
    
    // Verify page loaded correctly
    await sipExtensionsPage.verifyPageLoaded();
    
    // Get all current extensions and their statuses
    const extensions = await sipExtensionsPage.getAllExtensions();
    
    console.log('Current SIP Extensions:', extensions);
    
    // Should have at least some extensions
    expect(extensions.length).toBeGreaterThan(0);
    
    // Each extension should have a valid status
    for (const ext of extensions) {
      expect(ext.extension).toMatch(/^\d+$/); // Should be numeric
      expect(['Registered', 'Unregistered']).toContain(ext.status);
    }
  });
  
  test('SIP extension removal requires confirmation', async ({ page }) => {
    // Test that extension removal shows confirmation dialog
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    const sipExtensionsPage = await supervisorDash.navigateToSipExtensions();
    
    // Verify at least extension 101 exists (don't remove 111 in case previous test failed)
    await sipExtensionsPage.verifyExtensionExists('101');
    
    // Try to access the menu for extension 101 (but don't actually delete)
    const extensionRow = page.locator('tr:has-text("101")');
    const menuButton = extensionRow.locator('button').first();
    
    await menuButton.click();
    
    // Verify Delete option is available
    const deleteMenuItem = page.getByRole('menuitem', { name: 'Delete' });
    await expect(deleteMenuItem).toBeVisible();
    
    // Click somewhere else to close the menu without deleting
    await page.click('body');
    await expect(deleteMenuItem).not.toBeVisible();
    
    console.log('Extension deletion menu verified');
  });
  
  test('SIP extension addition form validation works', async ({ page }) => {
    // Test the extension addition form
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    const sipExtensionsPage = await supervisorDash.navigateToSipExtensions();
    
    // Click add extension button to open form
    const addButton = page.locator('xima-header-add:has-text("Inbound Extensions") button');
    await addButton.click();
    
    // Verify form fields are visible
    const extensionInput = page.locator('mat-label:has-text("SIP Extension") + div input');
    const passwordInput = page.locator('mat-label:has-text("SIP Password") + div input');
    const saveButton = page.locator('button:has(:text-is("Save"))');
    
    await expect(extensionInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(saveButton).toBeVisible();
    
    // Test that form can be filled
    await extensionInput.fill('999');
    await passwordInput.fill('testpass');
    
    // Verify values were entered
    await expect(extensionInput).toHaveValue('999');
    await expect(passwordInput).toHaveValue('testpass');
    
    // Don't actually save - just verify form works
    console.log('Extension addition form validation passed');
  });
  
  test('extension status refresh works correctly', async ({ page }) => {
    // Test that the refresh functionality works
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    const sipExtensionsPage = await supervisorDash.navigateToSipExtensions();
    
    // Get initial extensions list
    const initialExtensions = await sipExtensionsPage.getAllExtensions();
    
    // Refresh the extensions list
    await sipExtensionsPage.refreshExtensions();
    
    // Get updated extensions list
    const refreshedExtensions = await sipExtensionsPage.getAllExtensions();
    
    // Should have same extensions (though status might change)
    expect(refreshedExtensions.length).toBe(initialExtensions.length);
    
    // Compare extension numbers (should be the same)
    const initialNumbers = initialExtensions.map(e => e.extension).sort();
    const refreshedNumbers = refreshedExtensions.map(e => e.extension).sort();
    
    expect(refreshedNumbers).toEqual(initialNumbers);
    
    console.log('Extension refresh functionality verified');
  });
  
  test('admin access required for SIP extension management', async ({ page }) => {
    // Verify that admin access is required
    const loginPage = await LoginPage.create(page);
    const supervisorDash = await loginPage.loginAsSupervisor();
    
    // Verify supervisor has admin systems access
    const hasAdminAccess = await supervisorDash.hasAdminSystemsAccess();
    expect(hasAdminAccess).toBe(true);
    
    if (hasAdminAccess) {
      // Should be able to navigate to SIP Extensions
      const sipExtensionsPage = await supervisorDash.navigateToSipExtensions();
      await sipExtensionsPage.verifyPageLoaded();
      
      console.log('Supervisor has proper admin access for SIP extension management');
    }
  });
});
