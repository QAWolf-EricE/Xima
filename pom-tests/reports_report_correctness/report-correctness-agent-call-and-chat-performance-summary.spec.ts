import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Agent Call and Chat Performance Summary', () => {
  test('Agent Call and Chat Performance Summary report displays correct combined metrics', async ({ page }) => {
    const reportName = 'Agent Call and Chat Performance Summary';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: ['Total Calls', 'Total Chats', 'Performance Score', 'Average Handle Time'],
      validations: [
        { field: 'Total Calls', type: 'number' },
        { field: 'Total Chats', type: 'number' },
        { field: 'Performance Score', type: 'percentage' },
        { field: 'Average Handle Time', type: 'duration' }
      ]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

