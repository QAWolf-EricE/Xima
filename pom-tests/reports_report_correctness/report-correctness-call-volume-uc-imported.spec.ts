import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Call Volume UC Imported', () => {
  test('Call Volume UC Imported report displays correct UC imported call volume data', async ({ page }) => {
    const reportName = 'Call Volume (UC Imported)';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: ['UC Imported Calls', 'Call Volume', 'Import Rate'],
      validations: [
        { field: 'UC Imported Calls', type: 'number' },
        { field: 'Call Volume', type: 'number' },
        { field: 'Import Rate', type: 'percentage' }
      ]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

