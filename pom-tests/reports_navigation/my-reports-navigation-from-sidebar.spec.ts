import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportsNavigationPage } from '../../pom-migration/pages/reports/reports-navigation-page';

/**
 * My Reports Navigation from Sidebar Test
 * 
 * Migrated from: tests/reports_navigation/my_reports_navigation_from_hovering_sidebar.spec.js
 * 
 * This test verifies sidebar navigation to My Reports:
 * 1. Supervisor access to reports interface
 * 2. Sidebar hover functionality for reports menu
 * 3. Navigation to My Reports section
 * 4. URL path verification for My Reports
 */
test.describe('Reports Navigation - My Reports Sidebar', () => {
  
  test('Supervisor can navigate to My Reports from hovering sidebar', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for My Reports navigation ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportsNavPage = new ReportsNavigationPage(page);
    await reportsNavPage.verifyReportsPageLoaded();
    
    console.log('=== ACT: Navigating to My Reports from sidebar ===');
    
    // REQ132: Click My reports from sidebar hover
    await reportsNavPage.navigateToMyReportsFromSidebar();
    
    console.log('=== ASSERT: Verifying My Reports page navigation ===');
    
    // Verify we're on the My Reports page with correct URL path
    const currentURL = page.url();
    const urlPath = currentURL.split(".com")[1];
    expect(urlPath).toEqual("/web/reports/all");
    
    console.log('=== TEST COMPLETED: My Reports navigation from sidebar verified ===');
  });
});

