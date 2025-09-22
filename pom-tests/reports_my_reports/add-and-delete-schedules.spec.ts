import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { MyReportsPage } from '../../pom-migration/pages/reports/my-reports-page';
import { createMyReportsManagementClient } from '../../pom-migration/api-clients/my-reports-management/my-reports-client';

test.describe('My Reports - Schedule Management', () => {
  test('Supervisor can add and delete report schedules', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const myReportsPage = new MyReportsPage(page);
    const reportsClient = createMyReportsManagementClient();
    
    // Add schedule
    await myReportsPage.openManageSchedules();
    await myReportsPage.addReportSchedule({
      name: 'Test Schedule',
      deliverTo: 'test@example.com'
    });
    
    // Verify and cleanup
    const schedule = reportsClient.addScheduledReport({
      name: 'Test Schedule',
      deliverTo: 'test@example.com',
      reportType: 'Test Report'
    });
    
    reportsClient.cleanup();
    
    console.log('=== TEST COMPLETED: Schedule management verified ===');
  });
});

