import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportsNavigationPage } from '../../pom-migration/pages/reports/reports-navigation-page';

/**
 * Cradle to Grave Navigation from Sidebar Test
 * 
 * Migrated from: tests/reports_navigation/cradle_to_grave_navigation_from_hovering_sidebar.spec.js
 * 
 * This test verifies sidebar navigation to Cradle to Grave reports:
 * 1. Supervisor access to reports interface
 * 2. Sidebar hover functionality for reports menu
 * 3. Navigation to Cradle to Grave report section
 * 4. URL verification and page content validation
 */
test.describe('Reports Navigation - Cradle to Grave Sidebar', () => {
  
  test('Supervisor can navigate to Cradle to Grave from hovering sidebar', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for Cradle to Grave navigation ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportsNavPage = new ReportsNavigationPage(page);
    await reportsNavPage.verifyReportsPageLoaded();
    
    console.log('=== ACT: Navigating to Cradle to Grave from sidebar ===');
    
    // REQ133: Click Cradle to Grave from sidebar hover
    await reportsNavPage.navigateToCradleToGraveFromSidebar();
    
    console.log('=== ASSERT: Verifying Cradle to Grave page loaded ===');
    
    // Verify we're on the Cradle to Grave page
    await expect(page).toHaveURL(/cradle-to-grave/);
    await expect(page.locator('.toolbar-title')).toHaveText('Cradle to Grave');
    
    console.log('=== TEST COMPLETED: Cradle to Grave navigation from sidebar verified ===');
  });
});

