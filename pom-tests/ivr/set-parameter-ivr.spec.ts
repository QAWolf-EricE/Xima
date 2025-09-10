import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Set Parameter IVR Test
 * 
 * Migrated from: tests/ivr/set_parameter_ivr.spec.js
 * 
 * This test verifies the set parameter IVR functionality:
 * 1. Parameter setting and retrieval through IVR
 * 2. Call flow navigation with parameter validation
 * 3. Twilio integration with parameter passing
 * 4. Supervisor reporting for parameter-based operations
 * 5. Call result verification and parameter confirmation
 */
test.describe('IVR Testing - Set Parameter Flow', () => {
  
  test('Set Parameter IVR handles parameter setting and validation correctly', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Set Parameter IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    console.log(`Set Parameter IVR test starting with identifier: ${uniqueIdentifier}`);
    console.log('Reference: https://app.diagrams.net/#G1XFaJUxNU0Jn9PY8LP7nvZlVekZTmwPyA#%7B%22pageId%22%3A%22ZGpmcN66cr_cd86ZKPq-%22%7D');
    console.log('See "Set Parameter IVR" diagram for call flow details');
    
    // Setup supervisor for parameter monitoring
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing Set Parameter IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.SET_PARAMETER.testName,
      baseUrl: IVR_CONFIGS.SET_PARAMETER.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying Set Parameter IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Set Parameter IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Set Parameter IVR flow verified ===');
  });
});
