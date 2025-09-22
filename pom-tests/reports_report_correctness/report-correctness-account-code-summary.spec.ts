import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

/**
 * Report Correctness - Account Code Summary Test
 * 
 * Migrated from: tests/reports_report_correctness/report_correctness_account_code_summary.spec.js
 * 
 * This test verifies the correctness of the Account Code Summary report:
 * 1. Supervisor access to reports interface
 * 2. Account Code Summary report execution and data validation
 * 3. Account code metrics and call data consistency
 * 4. Duration and numeric format verification
 */
test.describe('Report Correctness - Account Code Summary', () => {
  
  test('Account Code Summary report displays correct account code data', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for Account Code Summary report validation ===');
    
    const reportName = 'Account Code Summary';
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const correctnessClient = createReportCorrectnessManagementClient();
    const reportExecution = correctnessClient.createReportExecution({
      reportName: reportName
    });
    
    console.log('=== ACT: Executing Account Code Summary report and validating data ===');
    
    // Execute report correctness workflow
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: [
        'Total Calls',
        'Total Duration',
        'Average Call Duration',
        'Billable Calls',
        'Non-Billable Calls'
      ],
      validations: [
        { field: 'Total Calls', type: 'number' },
        { field: 'Billable Calls', type: 'number' },
        { field: 'Non-Billable Calls', type: 'number' },
        { field: 'Total Duration', type: 'duration' },
        { field: 'Average Call Duration', type: 'duration' }
      ],
      requiredFields: [
        'Account Code',
        'Call Count',
        'Total Duration',
        'Average Duration'
      ]
    });
    
    console.log('=== ASSERT: Verifying Account Code Summary report correctness ===');
    
    // Verify report execution success
    expect(result.success).toBe(true);
    expect(result.runResult.runTimesChanged).toBe(true);
    
    // Verify all format validations passed
    result.formatValidations.forEach(validation => {
      expect(validation.isValid).toBe(true);
    });
    
    // Validate account code data consistency
    const totalCalls = parseInt(result.summaryData['Total Calls']?.replace(/,/g, '') || '0');
    const billableCalls = parseInt(result.summaryData['Billable Calls']?.replace(/,/g, '') || '0');
    const nonBillableCalls = parseInt(result.summaryData['Non-Billable Calls']?.replace(/,/g, '') || '0');
    
    // Verify billable + non-billable <= total calls
    expect(billableCalls + nonBillableCalls).toBeLessThanOrEqual(totalCalls);
    
    // Create workflow result
    const workflowResult = correctnessClient.executeCorrectnessWorkflow({
      reportName: reportName,
      formatValidations: result.formatValidations,
      dataConsistency: {
        presented: totalCalls,
        answered: billableCalls,
        missed: nonBillableCalls,
        isConsistent: (billableCalls + nonBillableCalls) <= totalCalls,
        explanation: `Account code consistency: Total (${totalCalls}) >= Billable (${billableCalls}) + Non-Billable (${nonBillableCalls})`
      }
    });
    
    expect(workflowResult.overallSuccess).toBe(true);
    
    // Complete execution tracking
    correctnessClient.completeReportExecution(reportExecution.executionId, result.success);
    correctnessClient.cleanup();
    
    console.log('=== TEST COMPLETED: Account Code Summary report correctness verified ===');
  });
});

