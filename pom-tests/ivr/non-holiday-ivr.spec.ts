import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Non Holiday IVR Test
 * 
 * Migrated from: tests/ivr/non_holiday_ivr.spec.js
 * 
 * This test verifies the non-holiday IVR call flow functionality:
 * 1. Non-holiday IVR testing with standard business routing
 * 2. Regular business day call handling and processing
 * 3. Call status polling during normal operations
 * 4. Supervisor reporting for standard business operations
 * 5. Mountain timezone (America/Denver) non-holiday processing
 */
test.describe('IVR Testing - Non Holiday Flow', () => {
  
  test('Non Holiday IVR processes calls correctly during regular business days', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Non Holiday IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    const currentMountainTime = twilioIvrClient.getCurrentMountainTime();
    
    console.log(`Non Holiday IVR test starting at Mountain Time: ${currentMountainTime}`);
    console.log(`Unique identifier: ${uniqueIdentifier}`);
    
    // Setup supervisor for non-holiday monitoring
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing Non Holiday IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.NON_HOLIDAY.testName,
      baseUrl: IVR_CONFIGS.NON_HOLIDAY.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying Non Holiday IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Non Holiday IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Non Holiday IVR flow verified ===');
  });
});
