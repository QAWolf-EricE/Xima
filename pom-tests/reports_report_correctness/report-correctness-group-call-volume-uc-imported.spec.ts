import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Group Call Volume UC Imported', () => {
  test('Group Call Volume UC Imported report displays correct group volume data', async ({ page }) => {
    const reportName = 'Group Call Volume (UC Imported)';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: ['Total Groups', 'Call Volume', 'Peak Volume'],
      validations: [{ field: 'Call Volume', type: 'number' }, { field: 'Peak Volume', type: 'number' }]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

