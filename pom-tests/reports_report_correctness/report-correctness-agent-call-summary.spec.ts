import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

/**
 * Report Correctness - Agent Call Summary Test
 * 
 * Migrated from: tests/reports_report_correctness/report_correctness_agent_call_summary.spec.js
 * 
 * This test verifies the correctness of the Agent Call Summary report:
 * 1. Supervisor access to reports interface
 * 2. Agent Call Summary report execution with run times verification
 * 3. Comprehensive data validation for agent call metrics
 * 4. Call data consistency validation (presented vs answered/missed)
 */
test.describe('Report Correctness - Agent Call Summary', () => {
  
  test('Agent Call Summary report displays correct data and validates call consistency', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for Agent Call Summary report validation ===');
    
    const reportName = 'Agent Call Summary';
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const correctnessClient = createReportCorrectnessManagementClient();
    const reportExecution = correctnessClient.createReportExecution({
      reportName: reportName
    });
    
    console.log('=== ACT: Executing Agent Call Summary report with comprehensive validation ===');
    
    // Wait for run times to be available
    await page.locator('mat-row:has-text("Agent Call Summary") >> nth=0 >> [data-cy="reports-list-report-run-times"]').waitFor();
    await page.waitForTimeout(2000);
    
    // Execute report correctness workflow
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: [
        'Total Presented Calls',
        'Total Answered Calls',
        'Total Missed Calls',
        'Total Scheduled Callbacks',
        'Average Talk Time',
        'Average Hold Time',
        'Average After Call Work Time'
      ],
      validations: [
        { field: 'Average Talk Time', type: 'duration' },
        { field: 'Average Hold Time', type: 'duration' },
        { field: 'Average After Call Work Time', type: 'duration' },
        { field: 'Total Presented Calls', type: 'number' },
        { field: 'Total Answered Calls', type: 'number' },
        { field: 'Total Missed Calls', type: 'number' },
        { field: 'Total Scheduled Callbacks', type: 'number' }
      ]
    });
    
    console.log('=== ASSERT: Verifying Agent Call Summary report correctness ===');
    
    // Verify report execution success
    expect(result.success).toBe(true);
    expect(result.runResult.runTimesChanged).toBe(true);
    
    // Verify all format validations passed
    result.formatValidations.forEach(validation => {
      expect(validation.isValid).toBe(true);
    });
    
    // Validate call data consistency
    const presentedCalls = result.summaryData['Total Presented Calls'] || '0';
    const answeredCalls = result.summaryData['Total Answered Calls'] || '0';
    const missedCalls = result.summaryData['Total Missed Calls'] || '0';
    
    const callConsistency = reportCorrectnessPage.validateCallDataConsistency(
      presentedCalls,
      answeredCalls,
      missedCalls
    );
    
    expect(callConsistency.isConsistent).toBe(true);
    
    // Create comprehensive workflow result
    const workflowResult = correctnessClient.executeCorrectnessWorkflow({
      reportName: reportName,
      formatValidations: result.formatValidations,
      dataConsistency: callConsistency
    });
    
    expect(workflowResult.overallSuccess).toBe(true);
    
    // Complete execution tracking
    correctnessClient.completeReportExecution(reportExecution.executionId, result.success);
    correctnessClient.cleanup();
    
    console.log('=== TEST COMPLETED: Agent Call Summary report correctness verified ===');
  });
  
  test('Agent Call Summary report format validation for duration fields', async ({ page }) => {
    console.log('=== ARRANGE: Setting up for duration format validation ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    console.log('=== ACT: Running report and validating duration formats ===');
    
    await reportCorrectnessPage.searchForReport('Agent Call Summary');
    await reportCorrectnessPage.runReport();
    
    // Get duration values
    const durationFields = [
      'Average Talk Time',
      'Average Hold Time',
      'Average After Call Work Time'
    ];
    
    console.log('=== ASSERT: Verifying duration format validation ===');
    
    for (const field of durationFields) {
      const duration = await reportCorrectnessPage.getSummaryItemValue(field);
      const isValidDuration = reportCorrectnessPage.validateDurationFormat(duration);
      expect(isValidDuration).toBe(true);
    }
    
    console.log('=== TEST COMPLETED: Duration format validation verified ===');
  });
});

