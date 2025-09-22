import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

/**
 * Report Correctness - Abandoned Calls Test
 * 
 * Migrated from: tests/reports_report_correctness/report_correctness_abandoned_calls.spec.js
 * 
 * This test verifies the correctness of the Abandoned Calls report:
 * 1. Supervisor access to reports interface
 * 2. Abandoned Calls report search and execution
 * 3. Data validation for call metrics and timing
 * 4. Duration format verification and data consistency
 */
test.describe('Report Correctness - Abandoned Calls', () => {
  
  test('Abandoned Calls report displays correct data and format validation', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for Abandoned Calls report validation ===');
    
    const reportName = 'Abandoned Calls (7)';
    const durationRegex = /[0-9]+:[0-9]+:[0-9]+/;
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const correctnessClient = createReportCorrectnessManagementClient();
    const reportExecution = correctnessClient.createReportExecution({
      reportName: reportName
    });
    
    // Wait for reports list to load
    await reportCorrectnessPage.waitForReportsListToLoad();
    
    console.log('=== ACT: Executing Abandoned Calls report and validating data ===');
    
    // Execute report correctness workflow
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: [
        'Total Calls',
        'Total Abandoned Calls',
        'Average Time to Abandon',
        'Max Time to Abandon',
        'Min Time to Abandon'
      ],
      validations: [
        { field: 'Average Time to Abandon', type: 'duration' },
        { field: 'Max Time to Abandon', type: 'duration' },
        { field: 'Min Time to Abandon', type: 'duration' },
        { field: 'Total Calls', type: 'number' },
        { field: 'Total Abandoned Calls', type: 'number' }
      ],
      requiredFields: [
        'caller id',
        'skill',
        'time to abandon',
        'date'
      ]
    });
    
    console.log('=== ASSERT: Verifying Abandoned Calls report correctness ===');
    
    // Verify report execution success
    expect(result.success).toBe(true);
    expect(result.runResult.runTimesChanged).toBe(true);
    
    // Verify all format validations passed
    result.formatValidations.forEach(validation => {
      expect(validation.isValid).toBe(true);
    });
    
    // Verify data completeness if available
    if (result.completenessResult) {
      expect(result.completenessResult.isComplete).toBe(true);
    }
    
    // Create correctness workflow result
    const workflowResult = correctnessClient.executeCorrectnessWorkflow({
      reportName: reportName,
      formatValidations: result.formatValidations,
      completenessResult: result.completenessResult
    });
    
    expect(workflowResult.overallSuccess).toBe(true);
    
    // Complete execution tracking
    correctnessClient.completeReportExecution(reportExecution.executionId, result.success);
    correctnessClient.cleanup();
    
    console.log('=== TEST COMPLETED: Abandoned Calls report correctness verified ===');
  });
  
  test('Abandoned Calls report data consistency validation', async ({ page }) => {
    console.log('=== ARRANGE: Setting up for data consistency validation ===');
    
    const reportName = 'Abandoned Calls (7)';
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    console.log('=== ACT: Running report and validating data consistency ===');
    
    await reportCorrectnessPage.waitForReportsListToLoad();
    await reportCorrectnessPage.searchForReport(reportName);
    await reportCorrectnessPage.runReport();
    
    // Get summary values for consistency check
    const summaryValues = await reportCorrectnessPage.getSummaryValues([
      'Total Calls',
      'Total Abandoned Calls'
    ]);
    
    console.log('=== ASSERT: Verifying data consistency ===');
    
    // Verify total abandoned calls is not greater than total calls
    const totalCalls = parseInt(summaryValues.get('Total Calls')?.replace(/,/g, '') || '0');
    const abandonedCalls = parseInt(summaryValues.get('Total Abandoned Calls')?.replace(/,/g, '') || '0');
    
    expect(abandonedCalls).toBeLessThanOrEqual(totalCalls);
    console.log(`✅ Data consistency verified: Abandoned (${abandonedCalls}) <= Total (${totalCalls})`);
    
    console.log('=== TEST COMPLETED: Data consistency validation verified ===');
  });
});

