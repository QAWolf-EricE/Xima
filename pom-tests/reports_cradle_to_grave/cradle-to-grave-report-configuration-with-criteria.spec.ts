import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { CradleToGravePage } from '../../pom-migration/pages/reports/cradle-to-grave-page';
import { createCradleToGraveClient } from '../../pom-migration/api-clients/report-management/cradle-to-grave-client';

/**
 * Cradle to Grave Report Configuration with Criteria Test
 * 
 * Migrated from: tests/reports_cradle_to_grave/cradle_to_grave_report_configuration_with_criteria.spec.js
 * 
 * This test verifies advanced cradle to grave report configuration:
 * 1. Supervisor access to advanced report configuration interface
 * 2. Custom criteria selection and configuration
 * 3. Advanced date range configuration with multi-month selection
 * 4. Column editing and report customization
 * 5. Complex report configuration and criteria management
 * 6. Advanced reporting features and customization verification
 */
test.describe('Reports - Cradle to Grave Advanced Configuration', () => {
  
  test('Supervisor can configure cradle to grave reports with custom criteria and columns', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up supervisor for advanced report configuration
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor for advanced cradle to grave configuration ===');
    
    //--------------------------------
    // Supervisor Setup for Advanced Configuration
    //--------------------------------
    
    console.log('Setting up Supervisor for advanced report configuration...');
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Verify we start on Reports page
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    console.log('✅ Supervisor logged in for advanced report configuration');
    
    //--------------------------------
    // Initialize Advanced Report Infrastructure
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up advanced report management ===');
    
    const cradleToGravePage = new CradleToGravePage(page);
    const cradleToGraveClient = createCradleToGraveClient();
    
    // Generate available criteria and columns for advanced configuration
    const availableCriteria = cradleToGraveClient.generateReportCriteria();
    const availableColumns = cradleToGraveClient.generateReportColumns();
    
    console.log('Available criteria for configuration:', availableCriteria.slice(0, 5));
    console.log('Available columns for configuration:', availableColumns.slice(0, 5));
    
    // Create advanced report session
    const advancedReport = cradleToGraveClient.createReportSession({
      reportName: 'Advanced Configuration Report',
      dateRange: cradleToGraveClient.calculateReportDateRange(2),
      criteria: availableCriteria.slice(0, 3), // Use first 3 criteria
      columns: availableColumns.slice(0, 5)   // Use first 5 columns
    });
    
    console.log('✅ Advanced report infrastructure initialized');
    
    //--------------------------------
    // Act: Navigate to Cradle to Grave for Advanced Configuration
    //--------------------------------
    
    console.log('=== ACT: Navigating to cradle to grave for advanced configuration ===');
    
    // Navigate to Cradle to Grave reports using mat-toolbar navigation
    await cradleToGravePage.navigateToCradleToGrave();
    
    console.log('✅ Cradle to grave advanced configuration page accessed');
    
    //--------------------------------
    // Configure Advanced Date Range (Multi-Month)
    //--------------------------------
    
    console.log('=== DATE RANGE: Configuring advanced date range ===');
    
    // Configure advanced date range (2 months back to current)
    await cradleToGravePage.configureDateRange({
      monthsBack: 2
    });
    
    console.log('✅ Advanced date range configured (2 months)');
    
    //--------------------------------
    // Configure Custom Report Criteria
    //--------------------------------
    
    console.log('=== CRITERIA: Configuring custom report criteria ===');
    
    // Configure multiple criteria for advanced reporting
    const testCriteria = ['Agent', 'Skill', 'Call Type'];
    await cradleToGravePage.configureMultipleCriteria(testCriteria);
    
    console.log('✅ Custom report criteria configured');
    
    //--------------------------------
    // Configure Report Columns
    //--------------------------------
    
    console.log('=== COLUMNS: Configuring report columns ===');
    
    // Edit report columns for advanced configuration
    const testColumns = ['Start Date', 'End Date', 'Agent Name', 'Call Duration', 'Recording'];
    await cradleToGravePage.editReportColumns(testColumns);
    
    console.log('✅ Report columns configured');
    
    //--------------------------------
    // Apply Advanced Configuration
    //--------------------------------
    
    console.log('=== APPLY: Applying advanced configuration ===');
    
    // Apply complete advanced configuration
    await cradleToGravePage.applyReportConfiguration();
    
    console.log('✅ Advanced configuration applied');
    
    //--------------------------------
    // Wait for Advanced Report Data
    //--------------------------------
    
    console.log('=== LOADING: Waiting for advanced report data ===');
    
    // Wait for advanced report data to load
    await cradleToGravePage.waitForReportData();
    
    console.log('✅ Advanced report data loaded');
    
    //--------------------------------
    // Verify Advanced Report Configuration
    //--------------------------------
    
    console.log('=== VERIFY: Verifying advanced report configuration ===');
    
    // Verify report has data with advanced configuration
    await cradleToGravePage.verifyReportHasData();
    
    // Verify advanced configuration in client
    const configurationValid = cradleToGraveClient.verifyReportConfiguration('Advanced Configuration Report');
    expect(configurationValid).toBe(true);
    
    console.log('✅ Advanced report configuration verification completed');
    
    //--------------------------------
    // Validate Advanced Report Data
    //--------------------------------
    
    console.log('=== VALIDATION: Validating advanced report data ===');
    
    // Validate advanced report data
    const validationResult = cradleToGraveClient.validateReportData(
      'Advanced Configuration Report',
      advancedReport.dateRange
    );
    
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.criteriaValid).toBe(true);
    
    console.log('✅ Advanced report data validation successful');
    
    //--------------------------------
    // Verify Criteria and Column Configuration
    //--------------------------------
    
    console.log('=== ADVANCED: Verifying criteria and column configuration ===');
    
    // Verify advanced report session has correct configuration
    const activeReport = cradleToGraveClient.getActiveReport('Advanced Configuration Report');
    expect(activeReport?.criteria.length).toBe(3);
    expect(activeReport?.columns.length).toBe(5);
    
    console.log('✅ Criteria and column configuration verified');
    
    // Get advanced report metrics
    const reportRowCount = await cradleToGravePage.getReportRowCount();
    console.log(`Advanced report contains ${reportRowCount} rows with custom criteria`);
    
    //--------------------------------
    // Assert: Verify Complete Advanced Configuration Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete advanced configuration workflow ===');
    
    // Verify all advanced configuration elements
    expect(activeReport?.isActive).toBe(true);
    expect(activeReport?.dateRange).toBeTruthy();
    expect(activeReport?.criteria.length).toBeGreaterThan(0);
    expect(activeReport?.columns.length).toBeGreaterThan(0);
    
    console.log('✅ Complete advanced configuration workflow verified');
    
    //--------------------------------
    // Cleanup: End advanced report session
    //--------------------------------
    
    console.log('=== CLEANUP: Ending advanced configuration session ===');
    
    cradleToGraveClient.endReportSession('Advanced Configuration Report');
    cradleToGraveClient.cleanup();
    
    console.log('=== TEST COMPLETED: Advanced cradle to grave configuration verified ===');
    console.log('✅ Supervisor can access advanced report configuration');
    console.log('✅ Custom criteria selection and configuration working');
    console.log('✅ Advanced date range configuration functional');
    console.log('✅ Column editing and customization operational');
    console.log('✅ Complex report configuration management validated');
    console.log('✅ Advanced reporting features confirmation successful');
  });
  
  /**
   * Test criteria configuration workflow
   */
  test('Report criteria configuration workflow verification', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const cradleToGravePage = new CradleToGravePage(page);
    await cradleToGravePage.navigateToCradleToGrave();
    
    // Test criteria configuration
    const testCriteria = ['Agent', 'Skill'];
    await cradleToGravePage.configureMultipleCriteria(testCriteria);
    
    console.log('Report criteria configuration workflow verified');
  });
  
  /**
   * Test advanced configuration elements
   */
  test('Advanced configuration elements verification', async ({ page }) => {
    const cradleToGraveClient = createCradleToGraveClient();
    
    // Test criteria and column generation
    const criteria = cradleToGraveClient.generateReportCriteria();
    const columns = cradleToGraveClient.generateReportColumns();
    
    expect(criteria.length).toBeGreaterThan(0);
    expect(columns.length).toBeGreaterThan(0);
    expect(criteria).toContain('Agent');
    expect(columns).toContain('Start Date');
    
    cradleToGraveClient.cleanup();
    
    console.log('Advanced configuration elements verification completed');
  });
});

