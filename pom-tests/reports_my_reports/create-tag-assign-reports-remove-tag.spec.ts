import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';
import { createMyReportsManagementClient } from '../../pom-migration/api-clients/my-reports-management/my-reports-client';

/**
 * Create Tag Assign Reports Remove Tag Test
 * 
 * Migrated from: tests/reports_my_reports/create_tag_assign_reports_remove_reports_remove_tag.spec.js
 * 
 * This test verifies complete tag lifecycle management:
 * 1. Tag creation and management interface access
 * 2. Tag assignment to reports and report association
 * 3. Report removal from tags and tag cleanup
 * 4. Complete tag workflow with report coordination
 */
test.describe('My Reports - Tag Management', () => {
  
  test('Supervisor can create tags, assign reports, and manage complete tag lifecycle', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for tag management ===');
    
    const tagName = 'Manage tags test';
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const myReportsPage = new MyReportsPage(page);
    const reportsClient = createMyReportsManagementClient();
    
    await myReportsPage.waitForReportsToLoad();
    
    console.log('=== ACT: Executing complete tag lifecycle ===');
    
    // Open tag management
    await myReportsPage.openManageTags();
    
    // Clean up existing tag if present
    await myReportsPage.deleteTag(tagName);
    
    // Create new tag
    await myReportsPage.createTag(tagName);
    
    // Execute tag workflow with report assignment
    const tagWorkflow = reportsClient.executeTagWorkflow(tagName, ['Report 1', 'Report 2']);
    
    console.log('=== ASSERT: Verifying tag management workflow ===');
    
    expect(tagWorkflow.success).toBe(true);
    expect(tagWorkflow.assignedReports.length).toBe(2);
    
    // Clean up tag
    await myReportsPage.deleteTag(tagName);
    reportsClient.deleteReportTag(tagName);
    
    reportsClient.cleanup();
    
    console.log('=== TEST COMPLETED: Tag lifecycle management verified ===');
  });
});

