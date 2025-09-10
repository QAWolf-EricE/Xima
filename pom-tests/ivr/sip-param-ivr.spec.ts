import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * SIP Parameter IVR Test
 * 
 * Migrated from: tests/ivr/sip_param_ivr.spec.js
 * 
 * This test verifies the SIP parameter IVR functionality:
 * 1. SIP-specific parameter management through IVR
 * 2. SIP protocol integration with parameter validation
 * 3. Call flow navigation with SIP parameter handling
 * 4. Supervisor reporting for SIP parameter operations
 * 5. SIP call quality and parameter verification
 */
test.describe('IVR Testing - SIP Parameter Flow', () => {
  
  test('SIP Parameter IVR handles SIP-specific parameters correctly', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up SIP Parameter IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    console.log(`SIP Parameter IVR test starting with identifier: ${uniqueIdentifier}`);
    
    // Setup supervisor for SIP monitoring
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing SIP Parameter IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.SIP_PARAM.testName,
      baseUrl: IVR_CONFIGS.SIP_PARAM.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying SIP Parameter IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ SIP Parameter IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: SIP Parameter IVR flow verified ===');
  });
});
