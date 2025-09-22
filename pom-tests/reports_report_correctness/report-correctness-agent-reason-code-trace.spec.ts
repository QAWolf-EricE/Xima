import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Agent Reason Code Trace', () => {
  test('Agent Reason Code Trace report displays correct reason code usage data', async ({ page }) => {
    const reportName = 'Agent Reason Code Trace';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      requiredFields: ['Agent Name', 'Reason Code', 'Time Used', 'Duration'],
      summaryFields: ['Total Reason Codes', 'Total Duration'],
      validations: [
        { field: 'Total Reason Codes', type: 'number' },
        { field: 'Total Duration', type: 'duration' }
      ]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

