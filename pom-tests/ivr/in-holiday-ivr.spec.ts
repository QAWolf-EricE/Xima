import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * In Holiday IVR Test
 * 
 * Migrated from: tests/ivr/in_holiday_ivr.spec.js
 * 
 * This test verifies the holiday-specific IVR call flow functionality:
 * 1. Holiday-based IVR testing with special routing
 * 2. Holiday schedule verification and call handling
 * 3. Call status polling during holiday periods
 * 4. Supervisor reporting for holiday operations
 * 5. Mountain timezone (America/Denver) holiday processing
 */
test.describe('IVR Testing - Holiday Flow', () => {
  
  test('In Holiday IVR processes calls correctly during holiday periods', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up In Holiday IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    const currentMountainTime = twilioIvrClient.getCurrentMountainTime();
    
    console.log(`In Holiday IVR test starting at Mountain Time: ${currentMountainTime}`);
    console.log(`Unique identifier: ${uniqueIdentifier}`);
    
    // Setup supervisor for holiday monitoring
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing In Holiday IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.IN_HOLIDAY.testName,
      baseUrl: IVR_CONFIGS.IN_HOLIDAY.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying In Holiday IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ In Holiday IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: In Holiday IVR flow verified ===');
  });
});
