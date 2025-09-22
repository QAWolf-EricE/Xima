import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Missed Calls Summary UC Imported', () => {
  test('Missed Calls Summary UC Imported report displays correct UC imported missed call data', async ({ page }) => {
    const reportName = 'Missed Calls Summary (UC Imported)';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: ['UC Imported Missed Calls', 'Miss Rate'],
      validations: [{ field: 'UC Imported Missed Calls', type: 'number' }, { field: 'Miss Rate', type: 'percentage' }]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

