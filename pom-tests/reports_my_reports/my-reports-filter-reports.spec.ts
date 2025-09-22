import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';

/**
 * My Reports Filter Reports Test
 * 
 * Migrated from: tests/reports_my_reports/my_reports_filter_reports.spec.js
 * 
 * This test verifies report filtering functionality by tags:
 * 1. Supervisor access to My Reports filtering interface
 * 2. Tag-based filtering with visibility/hiding verification
 * 3. Filter toggle functionality and state management
 * 4. Search integration with filtered reports
 */
test.describe('My Reports - Filter Functionality', () => {
  
  test('Supervisor can filter reports by tags and verify filter behavior', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for report filtering ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    const myReportsPage = new MyReportsPage(page);
    
    console.log('=== ACT: Testing report filtering functionality ===');
    
    // Execute filter by tags workflow
    await myReportsPage.executeFilterByTagsWorkflow('Abandoned Calls{Final Skill}');
    
    // Test additional filtering options
    await myReportsPage.switchToAllReportsView();
    
    // Test search with filtering
    await myReportsPage.searchReports('Group Inbound Test');
    await myReportsPage.verifyReportVisible('Group Inbound Test');
    
    console.log('=== TEST COMPLETED: Report filtering functionality verified ===');
  });
});

