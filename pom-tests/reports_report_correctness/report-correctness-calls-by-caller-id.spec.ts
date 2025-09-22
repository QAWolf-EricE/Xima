import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Calls by Caller ID', () => {
  test('Calls by Caller ID report displays correct caller ID call data', async ({ page }) => {
    const reportName = 'Calls By Caller ID';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      requiredFields: ['Caller ID', 'Call Count', 'Last Call Date'],
      summaryFields: ['Unique Caller IDs', 'Total Calls'],
      validations: [{ field: 'Unique Caller IDs', type: 'number' }, { field: 'Total Calls', type: 'number' }]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

