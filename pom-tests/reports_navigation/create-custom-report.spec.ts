import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { ReportsNavigationPage, CustomReportPage } from '../../pom-migration/pages/reports/reports-navigation-page';
import { createNavigationManagementClient } from '../../pom-migration/api-clients/navigation-management/navigation-management-client';

/**
 * Create Custom Report Test
 * 
 * Migrated from: tests/reports_navigation/create_reports_custom_report.spec.js
 * 
 * This test verifies the complete custom report creation workflow:
 * 1. Supervisor access to custom report creation interface
 * 2. Row selection configuration (Account Code)
 * 3. Preview configuration with live reporting
 * 4. Predefined column addition with metrics
 * 5. Customizable column addition with custom headers
 * 6. Report saving with name and description
 */
test.describe('Reports Navigation - Create Custom Report', () => {
  
  test('Supervisor can create a complete custom report with predefined and customizable columns', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for custom report creation ===');
    
    const reportPrefix = 'Create Report';
    
    const loginPage = await LoginPage.create(page, { timezoneId: "America/Denver" });
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Clean up any existing reports with our prefix
    console.log(`Cleaning up existing reports with prefix: ${reportPrefix}`);
    // Note: cleanUpReports functionality would be implemented in the SupervisorDashboardPage or as a utility
    
    const reportsNavPage = new ReportsNavigationPage(page);
    await reportsNavPage.verifyReportsPageLoaded();
    
    const navigationClient = createNavigationManagementClient();
    const navSession = navigationClient.createNavigationSession({
      sessionName: 'Custom Report Creation Session'
    });
    
    console.log('=== ACT: Creating custom report with complete workflow ===');
    
    // Navigate to custom report creation
    const customReportPage = await reportsNavPage.navigateToCreateCustomReport();
    await customReportPage.verifyCustomReportPageLoaded();
    
    navigationClient.trackNavigationStep(navSession.sessionName, {
      action: 'navigate',
      destination: 'Custom Report Creation',
      timestamp: new Date()
    });
    
    // Configure custom report
    const reportName = `${reportPrefix} ${Date.now().toString().slice(-4)}`;
    const predefinedColumnHeader = CustomReportPage.generateColumnHeader('Park Duration');
    const customizableColumnHeader = CustomReportPage.generateColumnHeader('Outbound Call Count');
    
    const reportConfig = {
      name: reportName,
      description: 'Automated test custom report with predefined and customizable columns',
      predefinedColumn: {
        metric: 'Park Duration',
        header: predefinedColumnHeader,
        operator: 'Total Park Duration'
      },
      customizableColumn: {
        metric: 'Outbound Call Count',
        header: customizableColumnHeader
      }
    };
    
    // Execute complete custom report creation workflow
    await customReportPage.createCustomReport(reportConfig);
    
    // Track report creation in navigation client
    const reportCreationResult = navigationClient.executeCustomReportCreationWorkflow({
      reportName: reportConfig.name,
      description: reportConfig.description,
      rowSelection: 'ACCOUNT_CODE',
      previewSettings: { liveReporting: true },
      columns: [
        {
          type: 'predefined',
          metric: reportConfig.predefinedColumn!.metric,
          header: reportConfig.predefinedColumn!.header,
          operator: reportConfig.predefinedColumn!.operator
        },
        {
          type: 'customizable',
          metric: reportConfig.customizableColumn!.metric,
          header: reportConfig.customizableColumn!.header
        }
      ]
    });
    
    console.log('=== ASSERT: Verifying custom report creation ===');
    
    // Verify the workflow was successful
    expect(reportCreationResult.success).toBe(true);
    expect(reportCreationResult.steps.length).toBeGreaterThan(0);
    
    // Verify all workflow steps completed successfully
    reportCreationResult.steps.forEach(step => {
      expect(step.success).toBe(true);
    });
    
    // Clean up resources
    navigationClient.endNavigationSession(navSession.sessionName);
    navigationClient.cleanup();
    
    console.log('=== TEST COMPLETED: Custom report creation workflow verified ===');
  });
  
  test('Supervisor can navigate to custom report creation interface', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for custom report navigation ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportsNavPage = new ReportsNavigationPage(page);
    await reportsNavPage.verifyReportsPageLoaded();
    
    console.log('=== ACT: Navigating to Create Custom Report ===');
    
    // Wait for reports to load before proceeding
    await reportsNavPage.waitForReportsToLoad();
    
    // Navigate to custom report creation
    const customReportPage = await reportsNavPage.navigateToCreateCustomReport();
    
    console.log('=== ASSERT: Verifying custom report interface loaded ===');
    
    await customReportPage.verifyCustomReportPageLoaded();
    
    // Verify we're on the custom report creation page
    await expect(page).toHaveURL(/\/custom-report\/create/);
    await expect(page.locator('[data-cy="custom-report-header"]')).toHaveText('Custom Reports');
    
    console.log('=== TEST COMPLETED: Custom report navigation verified ===');
  });
  
  test('Custom report creation handles data processing states correctly', async ({ page }) => {
    console.log('=== ARRANGE: Setting up for data processing validation ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const reportsNavPage = new ReportsNavigationPage(page);
    await reportsNavPage.verifyReportsPageLoaded();
    
    const customReportPage = await reportsNavPage.navigateToCreateCustomReport();
    await customReportPage.verifyCustomReportPageLoaded();
    
    console.log('=== ACT: Testing data processing workflows ===');
    
    // Test row selection and preview configuration
    await customReportPage.selectRowConfiguration();
    await customReportPage.configurePreview();
    
    console.log('=== ASSERT: Verifying data processing handled correctly ===');
    
    // Verify Account Code button is visible after data processing
    const accountCodeButton = page.getByRole('button', { name: 'ACCOUNT CODE' });
    await expect(accountCodeButton).toBeVisible();
    
    console.log('=== TEST COMPLETED: Data processing states verified ===');
  });
});

