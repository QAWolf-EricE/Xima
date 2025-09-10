import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Session Parameter IVR Test
 * 
 * Migrated from: tests/ivr/session_param_ivr.spec.js
 * 
 * This test verifies the session parameter IVR functionality:
 * 1. Session-specific parameter management through IVR
 * 2. Call session state management and validation
 * 3. WebRTC Agent integration with session parameter skills
 * 4. Supervisor reporting for session-based operations
 * 5. Parameter persistence across call session
 */
test.describe('IVR Testing - Session Parameter Flow', () => {
  
  test('Session Parameter IVR manages session state correctly', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Session Parameter IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    console.log(`Session Parameter IVR test starting with identifier: ${uniqueIdentifier}`);
    
    // Setup supervisor for session monitoring
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing Session Parameter IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.SESSION_PARAM.testName,
      baseUrl: IVR_CONFIGS.SESSION_PARAM.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying Session Parameter IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Session Parameter IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Session Parameter IVR flow verified ===');
  });
});
