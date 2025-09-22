import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';

/**
 * My Reports Search Report Test
 * 
 * Migrated from: tests/reports_my_reports/my_reports_search_report.spec.js
 * 
 * This test verifies report search functionality in My Reports:
 * 1. Supervisor access to My Reports interface
 * 2. Report search functionality with specific search terms
 * 3. Search result verification and filtering
 * 4. Report visibility and hiding based on search criteria
 */
test.describe('My Reports - Search Functionality', () => {
  
  test('Supervisor can search reports and verify search results', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for report search ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    const myReportsPage = new MyReportsPage(page);
    
    console.log('=== ACT: Testing report search functionality ===');
    
    // Verify initial reports are visible
    await expect(page.locator(':text-is("Abandoned Calls (7)")')).toBeVisible();
    await expect(page.locator('text=Agent Call Summary By Skill').first()).toBeVisible();
    
    // Execute search workflow
    await myReportsPage.executeReportSearchWorkflow(
      'Skill Call Volume',
      ['Skill Call Volume'], // Expected visible
      ['Abandoned Calls', 'Agent Call Summary By Skill'] // Expected hidden
    );
    
    console.log('=== TEST COMPLETED: Report search functionality verified ===');
  });
});

