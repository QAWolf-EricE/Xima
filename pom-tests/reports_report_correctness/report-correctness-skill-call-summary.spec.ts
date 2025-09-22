import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

/**
 * Report Correctness - Skill Call Summary Test
 * 
 * Migrated from: tests/reports_report_correctness/report_correctness_skill_call_summary.spec.js
 * 
 * This test verifies the correctness of the Skill Call Summary report:
 * 1. Supervisor access to reports interface with slow motion
 * 2. Skill Call Summary report execution and run times tracking
 * 3. Comprehensive skill-based call metrics validation
 * 4. Duration format validation and data consistency checks
 */
test.describe('Report Correctness - Skill Call Summary', () => {
  
  test('Skill Call Summary report displays correct skill call data and validates consistency', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for Skill Call Summary report validation ===');
    
    const reportName = 'Skill Call Summary';
    
    const loginPage = await LoginPage.create(page, { slowMo: 500 });
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const correctnessClient = createReportCorrectnessManagementClient();
    const reportExecution = correctnessClient.createReportExecution({
      reportName: reportName
    });
    
    console.log('=== ACT: Executing Skill Call Summary report with comprehensive skill validation ===');
    
    // Search for report and store run times
    await reportCorrectnessPage.searchForReport(reportName);
    await page.waitForTimeout(2000);
    
    const initialRunTimes = await reportCorrectnessPage.getCurrentRunTimes();
    console.log(`Initial run times: ${initialRunTimes}`);
    
    // Run the report
    await reportCorrectnessPage.runReport(5);
    
    // Execute comprehensive correctness workflow
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: [
        'Total Presented Calls',
        'Total Answered Calls',
        'Total Missed Calls',
        'Total Scheduled Callbacks',
        'Average Talk Time',
        'Average Hold Time',
        'Average Queue Time'
      ],
      validations: [
        { field: 'Average Talk Time', type: 'duration' },
        { field: 'Average Hold Time', type: 'duration' },
        { field: 'Average Queue Time', type: 'duration' },
        { field: 'Total Presented Calls', type: 'number' },
        { field: 'Total Answered Calls', type: 'number' },
        { field: 'Total Missed Calls', type: 'number' },
        { field: 'Total Scheduled Callbacks', type: 'number' }
      ]
    });
    
    console.log('=== ASSERT: Verifying Skill Call Summary report correctness ===');
    
    // Verify report execution success
    expect(result.success).toBe(true);
    
    // Verify run times changed (indicating report was executed)
    const finalRunTimes = await reportCorrectnessPage.getCurrentRunTimes();
    expect(finalRunTimes).not.toBe(initialRunTimes);
    
    // Verify all format validations passed
    result.formatValidations.forEach(validation => {
      expect(validation.isValid).toBe(true);
    });
    
    // Validate skill call data consistency
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
    
    console.log('=== TEST COMPLETED: Skill Call Summary report correctness verified ===');
  });
  
  test('Skill Call Summary report individual metric validation', async ({ page }) => {
    console.log('=== ARRANGE: Setting up for individual metric validation ===');
    
    const loginPage = await LoginPage.create(page, { slowMo: 500 });
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    console.log('=== ACT: Running report and validating individual metrics ===');
    
    await reportCorrectnessPage.searchForReport('Skill Call Summary');
    await reportCorrectnessPage.runReport();
    
    // Validate individual metrics
    const metricsToValidate = [
      'Total Presented Calls',
      'Total Answered Calls',
      'Total Missed Calls',
      'Total Scheduled Callbacks'
    ];
    
    console.log('=== ASSERT: Verifying individual metric formats and values ===');
    
    for (const metric of metricsToValidate) {
      const value = await reportCorrectnessPage.getSummaryItemValue(metric);
      const isValidNumber = reportCorrectnessPage.validateNumberFormat(value);
      expect(isValidNumber).toBe(true);
      
      // Verify non-negative values
      const numericValue = parseInt(value.replace(/,/g, ''));
      expect(numericValue).toBeGreaterThanOrEqual(0);
    }
    
    console.log('=== TEST COMPLETED: Individual metric validation verified ===');
  });
});

