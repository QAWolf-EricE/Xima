import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Drop Call IVR Test
 * 
 * Migrated from: tests/ivr/drop_call_ivr.spec.js
 * 
 * This test verifies the drop call IVR functionality:
 * 1. Call drop scenarios through IVR system
 * 2. Call termination and cleanup verification
 * 3. Supervisor reporting for dropped call operations
 * 4. Call state management during drop scenarios
 */
test.describe('IVR Testing - Drop Call Flow', () => {
  
  test('Drop Call IVR handles call termination correctly', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Drop Call IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    console.log(`Drop Call IVR test starting with identifier: ${uniqueIdentifier}`);
    
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing Drop Call IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.DROP_CALL.testName,
      baseUrl: IVR_CONFIGS.DROP_CALL.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying Drop Call IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Drop Call IVR completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Drop Call IVR flow verified ===');
  });
});
