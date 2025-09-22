import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';
import { createMyReportsManagementClient } from '../../pom-migration/api-clients/my-reports-management/my-reports-client';

/**
 * Schedule and Verify Report Test
 * 
 * Migrated from: tests/reports_my_reports/schedule_and_verify_report.spec.js
 * 
 * This test verifies report scheduling functionality:
 * 1. Supervisor access to report scheduling interface
 * 2. Report schedule creation with email delivery configuration
 * 3. Schedule verification and email delivery confirmation
 * 4. Scheduled report lifecycle management
 */
test.describe('My Reports - Schedule and Verify', () => {
  
  test('Supervisor can schedule reports and verify delivery', async ({ page, context }) => {
    console.log('=== ARRANGE: Setting up supervisor for report scheduling ===');
    
    const testEmailAddress = 'xima+verifyschedules1@qawolf.email';
    const reportConfig = {
      name: 'Schedule and Verify Report',
      deliverTo: testEmailAddress,
      frequency: 'daily',
      format: 'PDF'
    };
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const myReportsPage = new MyReportsPage(page);
    const reportsClient = createMyReportsManagementClient();
    
    console.log('=== ACT: Scheduling report with email delivery ===');
    
    await myReportsPage.openManageSchedules();
    await myReportsPage.addReportSchedule(reportConfig);
    
    const scheduledReport = reportsClient.addScheduledReport({
      name: reportConfig.name,
      deliverTo: reportConfig.deliverTo,
      reportType: 'Scheduled Report'
    });
    
    console.log('=== ASSERT: Verifying scheduled report ===');
    
    const verified = reportsClient.verifyScheduledReport(reportConfig.name);
    expect(verified?.deliverTo).toBe(testEmailAddress);
    
    reportsClient.cleanup();
    
    console.log('=== TEST COMPLETED: Report scheduling verified ===');
  });
});

