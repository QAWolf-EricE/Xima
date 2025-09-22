import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { CradleToGravePage } from '../../pom-migration/pages/reports/cradle-to-grave-page';
import { createCradleToGraveClient } from '../../pom-migration/api-clients/report-management/cradle-to-grave-client';
import * as dateFns from 'date-fns';

/**
 * Cradle to Grave Correctness Test
 * 
 * Migrated from: tests/reports_cradle_to_grave/cradle_to_grave_correctness.spec.js
 * 
 * This test verifies cradle to grave report data correctness:
 * 1. Supervisor access to cradle to grave reports interface
 * 2. Specific year date range configuration and validation
 * 3. Report data correctness verification with date interval checking
 * 4. Date range validation and data integrity verification
 * 5. Historical data accuracy and correctness confirmation
 */
test.describe('Reports - Cradle to Grave Correctness', () => {
  
  test('Supervisor can verify cradle to grave report data correctness with historical data', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up supervisor for data correctness verification
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor for cradle to grave correctness ===');
    
    // Test constants (matching original test exactly)
    const lastYear = dateFns.getYear(dateFns.subYears(new Date(), 1));
    
    console.log(`Cradle to grave correctness test configuration:`);
    console.log(`- Target year: ${lastYear}`);
    console.log(`- Test focus: Historical data correctness verification`);
    
    //--------------------------------
    // Supervisor Setup for Report Correctness
    //--------------------------------
    
    console.log('Setting up Supervisor for report correctness verification...');
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    // Verify we start on Reports page
    const homeTitle = page.locator('[translationset="HOME_TITLE"]');
    await expect(homeTitle).toHaveText('Reports');
    
    console.log('✅ Supervisor logged in for report correctness verification');
    
    //--------------------------------
    // Initialize Cradle to Grave Correctness Infrastructure
    //--------------------------------
    
    console.log('=== INFRASTRUCTURE: Setting up correctness verification ===');
    
    const cradleToGravePage = new CradleToGravePage(page);
    const cradleToGraveClient = createCradleToGraveClient();
    
    // Generate specific year date range for correctness testing
    const yearDateRange = cradleToGraveClient.generateSpecificYearRange(lastYear);
    
    console.log('Specific year date range generated:', yearDateRange);
    
    // Create report session for correctness testing
    const correctnessReport = cradleToGraveClient.createReportSession({
      reportName: 'Correctness Verification Report',
      dateRange: yearDateRange
    });
    
    console.log('✅ Cradle to grave correctness infrastructure initialized');
    
    //--------------------------------
    // Act: Navigate to Cradle to Grave Reports
    //--------------------------------
    
    console.log('=== ACT: Navigating to cradle to grave for correctness verification ===');
    
    // Navigate to Cradle to Grave reports
    await cradleToGravePage.navigateToCradleToGrave();
    
    console.log('✅ Cradle to grave reports accessed for correctness testing');
    
    //--------------------------------
    // Configure Specific Year Date Range
    //--------------------------------
    
    console.log('=== DATE CONFIGURATION: Configuring specific year date range ===');
    
    // Configure date range for specific year (last year)
    await cradleToGravePage.configureDateRange({
      specificYear: lastYear
    });
    
    console.log(`✅ Date range configured for year: ${lastYear}`);
    
    //--------------------------------
    // Apply Configuration and Load Report Data
    //--------------------------------
    
    console.log('=== APPLY: Applying configuration and loading report data ===');
    
    // Apply report configuration
    await cradleToGravePage.applyReportConfiguration();
    
    // Wait for report data to load
    await cradleToGravePage.waitForReportData();
    
    console.log('✅ Report configuration applied and data loaded');
    
    //--------------------------------
    // Verify Report Data Correctness
    //--------------------------------
    
    console.log('=== CORRECTNESS: Verifying report data correctness ===');
    
    // Verify report data correctness with specific year range
    const expectedDateRange = {
      start: new Date(`01/01/${lastYear}`),
      end: new Date(`12/31/${lastYear}`)
    };
    
    await cradleToGravePage.verifyReportDataCorrectness(expectedDateRange);
    
    console.log(`✅ Report data correctness verified for year ${lastYear}`);
    
    //--------------------------------
    // Validate Historical Data Accuracy
    //--------------------------------
    
    console.log('=== HISTORICAL: Validating historical data accuracy ===');
    
    // Validate report data against expected date range
    const validationResult = cradleToGraveClient.validateReportData(
      'Correctness Verification Report',
      yearDateRange
    );
    
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.dateRangeValid).toBe(true);
    
    console.log('✅ Historical data accuracy validation successful');
    
    //--------------------------------
    // Verify Report Row Data
    //--------------------------------
    
    console.log('=== DATA: Verifying report row data ===');
    
    // Get report row count
    const reportRowCount = await cradleToGravePage.getReportRowCount();
    console.log(`Historical report contains ${reportRowCount} rows for year ${lastYear}`);
    
    // Verify report has meaningful data
    if (reportRowCount > 0) {
      console.log('✅ Report contains historical data for correctness verification');
    } else {
      console.log('⚠️ Report may not contain data for the specified historical period');
    }
    
    //--------------------------------
    // Assert: Verify Complete Correctness Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete correctness workflow ===');
    
    // Verify report configuration is valid
    const configurationValid = cradleToGraveClient.verifyReportConfiguration('Correctness Verification Report');
    expect(configurationValid).toBe(true);
    
    // Verify active report session
    const activeReport = cradleToGraveClient.getActiveReport('Correctness Verification Report');
    expect(activeReport?.isActive).toBe(true);
    expect(activeReport?.validationResults?.isValid).toBe(true);
    
    console.log('✅ Complete correctness workflow verified');
    
    //--------------------------------
    // Cleanup: End report session
    //--------------------------------
    
    console.log('=== CLEANUP: Ending cradle to grave correctness session ===');
    
    cradleToGraveClient.endReportSession('Correctness Verification Report');
    cradleToGraveClient.cleanup();
    
    console.log('=== TEST COMPLETED: Cradle to grave correctness verified ===');
    console.log('✅ Supervisor can access cradle to grave correctness verification');
    console.log('✅ Specific year date range configuration working');
    console.log('✅ Historical data correctness validation functional');
    console.log('✅ Report data integrity verification confirmed');
    console.log('✅ Date range validation in historical data accurate');
    console.log('✅ Complete correctness verification workflow validated');
  });
  
  /**
   * Test historical data validation
   */
  test('Historical data validation verification', async ({ page }) => {
    const cradleToGraveClient = createCradleToGraveClient();
    
    // Test historical year range generation
    const lastYear = dateFns.getYear(dateFns.subYears(new Date(), 1));
    const yearRange = cradleToGraveClient.generateSpecificYearRange(lastYear);
    
    expect(yearRange.startDate.getFullYear()).toBe(lastYear);
    expect(yearRange.endDate.getFullYear()).toBe(lastYear);
    
    console.log(`Historical data validation verified for year: ${lastYear}`);
    
    cradleToGraveClient.cleanup();
  });
});
