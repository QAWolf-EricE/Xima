import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Skill Callback Summary', () => {
  test('Skill Callback Summary report displays correct skill callback data', async ({ page }) => {
    const reportName = 'Skill Callback Summary';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: ['Total Callbacks', 'Successful Callbacks', 'Callback Rate'],
      validations: [
        { field: 'Total Callbacks', type: 'number' },
        { field: 'Successful Callbacks', type: 'number' },
        { field: 'Callback Rate', type: 'percentage' }
      ]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

