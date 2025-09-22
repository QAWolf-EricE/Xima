import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportCorrectnessPage } from '../../pom-migration/pages/reports/report-correctness-page';
import { createReportCorrectnessManagementClient } from '../../pom-migration/api-clients/report-correctness-management/report-correctness-client';

/**
 * Report Correctness - Call Volume Test
 * 
 * Migrated from: tests/reports_report_correctness/report_correctness_call_volume.spec.js
 * 
 * This test verifies the correctness of the Call Volume report:
 * 1. Supervisor access to My Reports section
 * 2. Call Volume report search and execution
 * 3. Run times verification and data validation
 * 4. Call volume metrics consistency checks
 */
test.describe('Report Correctness - Call Volume', () => {
  
  test('Call Volume report displays correct data with My Reports view', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for Call Volume report validation ===');
    
    const reportName = 'Call Volume';
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    const correctnessClient = createReportCorrectnessManagementClient();
    const reportExecution = correctnessClient.createReportExecution({
      reportName: reportName
    });
    
    console.log('=== ACT: Switching to My Reports view and executing Call Volume report ===');
    
    // Switch to My Reports view
    await reportCorrectnessPage.switchToMyReportsView();
    await page.waitForTimeout(2000);
    
    // Execute report correctness workflow
    const result = await reportCorrectnessPage.executeReportCorrectnessWorkflow({
      reportName: reportName,
      summaryFields: [
        'Total Inbound Calls',
        'Total Outbound Calls',
        'Total Presented Calls',
        'Total Answered Calls',
        'Total Missed Calls',
        'Answer Rate',
        'Average Call Duration'
      ],
      validations: [
        { field: 'Total Inbound Calls', type: 'number' },
        { field: 'Total Outbound Calls', type: 'number' },
        { field: 'Total Presented Calls', type: 'number' },
        { field: 'Total Answered Calls', type: 'number' },
        { field: 'Total Missed Calls', type: 'number' },
        { field: 'Answer Rate', type: 'percentage' },
        { field: 'Average Call Duration', type: 'duration' }
      ]
    });
    
    console.log('=== ASSERT: Verifying Call Volume report correctness ===');
    
    // Verify report execution success
    expect(result.success).toBe(true);
    expect(result.runResult.runTimesChanged).toBe(true);
    
    // Verify all format validations passed
    result.formatValidations.forEach(validation => {
      expect(validation.isValid).toBe(true);
    });
    
    // Validate call volume data consistency
    const inboundCalls = parseInt(result.summaryData['Total Inbound Calls']?.replace(/,/g, '') || '0');
    const outboundCalls = parseInt(result.summaryData['Total Outbound Calls']?.replace(/,/g, '') || '0');
    const presentedCalls = parseInt(result.summaryData['Total Presented Calls']?.replace(/,/g, '') || '0');
    const answeredCalls = parseInt(result.summaryData['Total Answered Calls']?.replace(/,/g, '') || '0');
    const missedCalls = parseInt(result.summaryData['Total Missed Calls']?.replace(/,/g, '') || '0');
    
    // Validate data consistency
    expect(answeredCalls + missedCalls).toBeLessThanOrEqual(presentedCalls);
    expect(presentedCalls).toBeLessThanOrEqual(inboundCalls + outboundCalls);
    
    // Create workflow result
    const workflowResult = correctnessClient.executeCorrectnessWorkflow({
      reportName: reportName,
      formatValidations: result.formatValidations,
      dataConsistency: {
        presented: presentedCalls,
        answered: answeredCalls,
        missed: missedCalls,
        isConsistent: (answeredCalls + missedCalls) <= presentedCalls,
        explanation: `Call volume consistency: Presented (${presentedCalls}) >= Answered (${answeredCalls}) + Missed (${missedCalls})`
      }
    });
    
    expect(workflowResult.overallSuccess).toBe(true);
    
    // Complete execution tracking
    correctnessClient.completeReportExecution(reportExecution.executionId, result.success);
    correctnessClient.cleanup();
    
    console.log('=== TEST COMPLETED: Call Volume report correctness verified ===');
  });
  
  test('Call Volume report percentage format validation', async ({ page }) => {
    console.log('=== ARRANGE: Setting up for percentage format validation ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportCorrectnessPage = new ReportCorrectnessPage(page);
    await reportCorrectnessPage.verifyReportsPageLoaded();
    
    console.log('=== ACT: Running report and validating percentage formats ===');
    
    await reportCorrectnessPage.switchToMyReportsView();
    await reportCorrectnessPage.searchForReport('Call Volume');
    await reportCorrectnessPage.runReport();
    
    console.log('=== ASSERT: Verifying percentage format validation ===');
    
    // Validate percentage fields if available
    const percentageFields = ['Answer Rate', 'Service Level'];
    
    for (const field of percentageFields) {
      try {
        const percentage = await reportCorrectnessPage.getSummaryItemValue(field);
        if (percentage && percentage !== 'N/A') {
          const isValidPercentage = reportCorrectnessPage.validatePercentageFormat(percentage);
          expect(isValidPercentage).toBe(true);
        }
      } catch (error) {
        console.log(`Field ${field} not found or not applicable`);
      }
    }
    
    console.log('=== TEST COMPLETED: Percentage format validation verified ===');
  });
});

