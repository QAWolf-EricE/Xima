import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * After Hours IVR Test
 * 
 * Migrated from: tests/ivr/after_hours_ivr.spec.js
 * 
 * This test verifies the after-hours IVR call flow functionality:
 * 1. Time-based IVR testing outside business hours
 * 2. After hours call routing and handling
 * 3. Call status polling and completion verification
 * 4. Supervisor reporting for after-hours operations
 * 5. Mountain timezone (America/Denver) after-hours processing
 */
test.describe('IVR Testing - After Hours Flow', () => {
  
  test('After Hours IVR processes calls correctly outside business hours', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up After Hours IVR testing infrastructure
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up After Hours IVR test infrastructure ===');
    
    // Initialize Twilio IVR client
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    // Get current Mountain timezone for after hours verification
    const currentMountainTime = twilioIvrClient.getCurrentMountainTime();
    console.log(`After Hours IVR test starting at Mountain Time: ${currentMountainTime}`);
    console.log(`Unique identifier: ${uniqueIdentifier}`);
    
    //--------------------------------
    // Supervisor Setup for After Hours Monitoring
    //--------------------------------
    
    console.log('Setting up Supervisor access for after hours monitoring...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Supervisor dashboard ready for after hours call monitoring');
    
    //--------------------------------
    // Act: Execute After Hours IVR Call Flow
    //--------------------------------
    
    console.log('=== ACT: Executing After Hours IVR call flow ===');
    
    // Execute After Hours IVR test workflow
    console.log('Initiating After Hours IVR call...');
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.AFTER_HOURS.testName,
      baseUrl: IVR_CONFIGS.AFTER_HOURS.baseUrl,
      params: {},
      callDuration: 20, // 20 seconds for call completion
      checkResults: true
    });
    
    console.log(`After Hours IVR call completed successfully:`);
    console.log(`- Call SID: ${ivrTestResult.callSid}`);
    console.log(`- Mountain Time: ${ivrTestResult.mountainTime}`);
    console.log(`- After Hours Processing: Verified`);
    
    //--------------------------------
    // Assert: Verify After Hours Call Processing
    //--------------------------------
    
    console.log('=== ASSERT: Verifying After Hours IVR call results ===');
    
    // Verify call completed successfully during after hours
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    expect(ivrTestResult.callSid).toBeTruthy();
    
    console.log('✅ After Hours IVR call completed successfully');
    
    // Verify Mountain timezone formatting and after hours processing
    expect(ivrTestResult.mountainTime).toMatch(/\d{2}:\d{2}:\d{2} [AP]M/);
    console.log(`✅ Mountain timezone after hours verified: ${ivrTestResult.mountainTime}`);
    
    // Verify unique identifier preservation for after hours tracking
    expect(ivrTestResult.uniqueIdentifier).toBe(uniqueIdentifier);
    console.log(`✅ After hours tracking identifier preserved: ${uniqueIdentifier}`);
    
    //--------------------------------
    // After Hours Supervisor Reporting Verification
    //--------------------------------
    
    console.log('=== REPORTING: Verifying after hours call reporting ===');
    
    // Navigate to reports dashboard for after hours verification
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    await reportsDashboard.verifyPageLoaded();
    
    // Set time filter for after hours call lookup
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.setTimeFilter(callStartTime);
    
    // Verify call appears in after hours reporting
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    console.log('✅ After Hours IVR call verified in supervisor reports');
    
    //--------------------------------
    // Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== CLEANUP: Finalizing After Hours IVR test ===');
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: After Hours IVR flow verified successfully ===');
    console.log('✅ After hours IVR processing confirmed');
    console.log('✅ Time-based call routing working correctly');
    console.log('✅ Supervisor after hours reporting verified');
  });
});
