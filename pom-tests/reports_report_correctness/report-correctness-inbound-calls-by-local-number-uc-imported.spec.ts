import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

test.describe('Report Correctness - Inbound Calls by Local Number UC Imported', () => {
  test('Inbound Calls by Local Number UC Imported report displays correct UC imported data', async ({ page }) => {
    const reportName = 'Inbound Calls By Local Number (UC Imported)';
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    const correctnessClient = createReportCorrectnessManagementClient();
    
    await supervisorDashboard.verifyDashboardLoaded();
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: ['UC Imported Calls', 'Local Number Count'],
      validations: [{ field: 'UC Imported Calls', type: 'number' }, { field: 'Local Number Count', type: 'number' }]
    });
    
    expect(result.success).toBe(true);
    correctnessClient.cleanup();
  });
});

