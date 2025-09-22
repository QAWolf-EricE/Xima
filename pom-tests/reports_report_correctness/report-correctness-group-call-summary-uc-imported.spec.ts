import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Group Call Summary UC Imported', () => {
  test('Group Call Summary UC Imported report displays correct group call data', async ({ page }) => {
    const reportName = 'Group Call Summary (UC Imported)';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: ['Total Groups', 'Total Calls', 'Group Performance'],
      validations: [{ field: 'Total Groups', type: 'number' }, { field: 'Total Calls', type: 'number' }]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

