import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

/**
 * Report Correctness - Audit Events Test
 * 
 * Migrated from: tests/reports_report_correctness/report_correctness_audit_events.spec.js
 * 
 * This test verifies the correctness of the Audit Events report:
 * 1. Supervisor access to reports interface
 * 2. Audit Events report search and execution
 * 3. System audit data validation and completeness
 * 4. Event timestamp and data format verification
 */
test.describe('Report Correctness - Audit Events', () => {
  
  test('Audit Events report displays correct system audit data', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for Audit Events report validation ===');
    
    const reportName = 'Audit Events';
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const correctnessClient = createReportCorrectnessManagementClient();
    const reportExecution = correctnessClient.createReportExecution({
      reportName: reportName
    });
    
    console.log('=== ACT: Executing Audit Events report and validating system data ===');
    
    // Execute report correctness workflow
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      requiredFields: [
        'Event Type',
        'User',
        'Timestamp',
        'Description',
        'IP Address'
      ],
      summaryFields: [
        'Total Events',
        'Login Events',
        'Logout Events',
        'Configuration Changes'
      ],
      validations: [
        { field: 'Total Events', type: 'number' },
        { field: 'Login Events', type: 'number' },
        { field: 'Logout Events', type: 'number' },
        { field: 'Configuration Changes', type: 'number' }
      ]
    });
    
    console.log('=== ASSERT: Verifying Audit Events report correctness ===');
    
    // Verify report execution success
    expect(result.success).toBe(true);
    expect(result.runResult.runTimesChanged).toBe(true);
    
    // Verify all format validations passed
    result.formatValidations.forEach(validation => {
      expect(validation.isValid).toBe(true);
    });
    
    // Verify data completeness
    if (result.completenessResult) {
      expect(result.completenessResult.completeness).toBeGreaterThan(80); // 80% completeness threshold
    }
    
    // Create workflow result
    const workflowResult = correctnessClient.executeCorrectnessWorkflow({
      reportName: reportName,
      formatValidations: result.formatValidations,
      completenessResult: result.completenessResult
    });
    
    expect(workflowResult.overallSuccess).toBe(true);
    
    // Complete execution tracking
    correctnessClient.completeReportExecution(reportExecution.executionId, result.success);
    correctnessClient.cleanup();
    
    console.log('=== TEST COMPLETED: Audit Events report correctness verified ===');
  });
});

