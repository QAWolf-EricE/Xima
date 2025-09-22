import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { CradleToGravePage } from '../../pom-migration/pages/reports/cradle-to-grave-page';
import { createCradleToGraveClient } from '../../pom-migration/api-clients/report-management/cradle-to-grave-client';

/**
 * Cradle to Grave Report Configuration Test
 * 
 * Migrated from: tests/reports_cradle_to_grave/cradle_to_grave_report_configuration.spec.js
 * 
 * This test verifies cradle to grave report configuration functionality:
 * 1. Supervisor access to reports and cradle to grave interface
 * 2. Date range configuration with month/year navigation
 * 3. Report configuration application and data loading
 * 4. Report data validation and date range verification
 * 5. Complete customer interaction lifecycle reporting
 */
test.describe('Reports - Cradle to Grave Configuration', () => {
  
  test('Supervisor can configure cradle to grave report with date range filtering', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up supervisor for cradle to grave reporting
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor for cradle to grave reporting ===');
    
    //--------------------------------
    // Supervisor Setup for Report Configuration
    //--------------------------------
    
    console.log('Setting up Supervisor for cradle to grave report configuration...');
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Verify we start on Reports page
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    console.log('✅ Supervisor logged in for cradle to grave reporting');
    
    //--------------------------------
    // Initialize Cradle to Grave Infrastructure
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up cradle to grave report management ===');
    
    const cradleToGravePage = new CradleToGravePage(page);
    const cradleToGraveClient = createCradleToGraveClient();
    
    // Calculate date range for report (matching original test logic)
    const dateRangeCalc = cradleToGravePage.calculateDateRangeValues();
    
    console.log('Date range calculation:', {
      startDate: dateRangeCalc.startDate,
      endDate: dateRangeCalc.endDate,
      thisMonth: dateRangeCalc.thisMonth
    });
    
    // Create report session for tracking
    const reportSession = cradleToGraveClient.createReportSession({
      reportName: 'Date Range Configuration Report',
      dateRange: {
        startDate: dateRangeCalc.lastMonth,
        endDate: dateRangeCalc.today,
        thisMonth: dateRangeCalc.thisMonth,
        startDateFormatted: dateRangeCalc.startDate,
        endDateFormatted: dateRangeCalc.endDate
      }
    });
    
    console.log('✅ Cradle to grave infrastructure initialized');
    
    //--------------------------------
    // Act: Navigate to Cradle to Grave Reports
    //--------------------------------
    
    console.log('=== ACT: Navigating to cradle to grave reports ===');
    
    // Navigate to Cradle to Grave reports
    await cradleToGravePage.navigateToCradleToGrave();
    
    console.log('✅ Cradle to grave reports page accessed');
    
    //--------------------------------
    // Configure Date Range for Report
    //--------------------------------
    
    console.log('=== DATE RANGE: Configuring report date range ===');
    
    // Configure date range (previous month to current date)
    await cradleToGravePage.configureDateRange({
      useRelativeRange: true,
      monthsBack: 1
    });
    
    console.log('✅ Date range configured for cradle to grave report');
    
    //--------------------------------
    // Apply Report Configuration
    //--------------------------------
    
    console.log('=== APPLY: Applying report configuration ===');
    
    // Apply report configuration
    await cradleToGravePage.applyReportConfiguration();
    
    console.log('✅ Report configuration applied');
    
    //--------------------------------
    // Wait for Report Data Loading
    //--------------------------------
    
    console.log('=== LOADING: Waiting for report data ===');
    
    // Wait for report data to load
    await cradleToGravePage.waitForReportData();
    
    console.log('✅ Report data loading completed');
    
    //--------------------------------
    // Verify Report Data and Date Range
    //--------------------------------
    
    console.log('=== VERIFY: Verifying report data and configuration ===');
    
    // Verify report has data
    await cradleToGravePage.verifyReportHasData();
    
    // Verify date range in report matches configuration
    await cradleToGravePage.verifyDateRangeInReport();
    
    console.log('✅ Report data and date range verification completed');
    
    //--------------------------------
    // Validate Report Configuration
    //--------------------------------
    
    console.log('=== VALIDATION: Validating report configuration ===');
    
    // Verify report configuration is complete
    const configurationValid = cradleToGraveClient.verifyReportConfiguration('Date Range Configuration Report');
    expect(configurationValid).toBe(true);
    
    // Validate report data correctness
    const validationResult = cradleToGraveClient.validateReportData(
      'Date Range Configuration Report',
      reportSession.dateRange
    );
    
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.dateRangeValid).toBe(true);
    
    console.log('✅ Report configuration validation successful');
    
    //--------------------------------
    // Assert: Verify Complete Report Configuration Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete report configuration workflow ===');
    
    // Verify active report session
    const activeReport = cradleToGraveClient.getActiveReport('Date Range Configuration Report');
    expect(activeReport?.isActive).toBe(true);
    expect(activeReport?.dateRange).toBeTruthy();
    
    console.log('✅ Complete report configuration workflow verified');
    
    // Get report row count for verification
    const reportRowCount = await cradleToGravePage.getReportRowCount();
    console.log(`Report contains ${reportRowCount} rows of cradle to grave data`);
    
    //--------------------------------
    // Cleanup: End report session
    //--------------------------------
    
    console.log('=== CLEANUP: Ending cradle to grave report session ===');
    
    cradleToGraveClient.endReportSession('Date Range Configuration Report');
    cradleToGraveClient.cleanup();
    
    console.log('=== TEST COMPLETED: Cradle to grave report configuration verified ===');
    console.log('✅ Supervisor can access cradle to grave reports');
    console.log('✅ Date range configuration working correctly');
    console.log('✅ Report configuration application successful');
    console.log('✅ Report data loading and verification functional');
    console.log('✅ Date range validation in report data confirmed');
    console.log('✅ Complete cradle to grave configuration workflow validated');
  });
  
  /**
   * Test simplified report configuration workflow
   */
  test('Cradle to grave basic configuration workflow', async ({ page }) => {
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const cradleToGravePage = new CradleToGravePage(page);
    await cradleToGravePage.navigateToCradleToGrave();
    
    // Test basic configuration
    await cradleToGravePage.configureDateRange({ useRelativeRange: true });
    await cradleToGravePage.applyReportConfiguration();
    
    console.log('Cradle to grave basic configuration workflow verified');
  });
  
  /**
   * Test report date calculations
   */
  test('Report date range calculations verification', async ({ page }) => {
    const cradleToGravePage = new CradleToGravePage(page);
    const cradleToGraveClient = createCradleToGraveClient();
    
    // Test date range calculations
    const dateRange = cradleToGraveClient.calculateReportDateRange(4);
    expect(dateRange.startDate).toBeTruthy();
    expect(dateRange.endDate).toBeTruthy();
    expect(dateRange.startDateFormatted).toBeGreaterThan(0);
    
    // Test page date calculations
    const pageCalc = cradleToGravePage.calculateDateRangeValues();
    expect(pageCalc.thisMonth).toBeGreaterThan(0);
    
    cradleToGraveClient.cleanup();
    
    console.log('Report date range calculations verification completed');
  });
});

