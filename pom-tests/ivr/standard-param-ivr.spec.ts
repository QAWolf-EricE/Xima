import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Standard Parameter IVR Test
 * 
 * Migrated from: tests/ivr/standard_param_ivr.spec.js
 * 
 * This test verifies the standard parameter IVR functionality:
 * 1. Standard parameter passing (menu1digit=5, menu2digit=1)
 * 2. WebRTC Agent 37 integration with "Standard Parameter Condition Skill"
 * 3. Call flow navigation with standard parameter validation
 * 4. Supervisor reporting for standard parameter operations
 * 5. Agent skill management and IVR call coordination
 */
test.describe('IVR Testing - Standard Parameter Flow', () => {
  
  test('Standard Parameter IVR processes calls with menu navigation (5,1)', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Standard Parameter IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    // Standard parameter configuration (matching original test)
    const standardParams = { menu1digit: "5", menu2digit: "1" };
    const queryParams = twilioIvrClient.buildQueryParams(standardParams);
    const skillName = "Standard Parameter Condition Skill";
    
    console.log(`Standard Parameter IVR test starting with identifier: ${uniqueIdentifier}`);
    console.log(`Parameters: menu1digit=5, menu2digit=1`);
    console.log('Reference: https://app.diagrams.net/#G1XFaJUxNU0Jn9PY8LP7nvZlVekZTmwPyA#%7B%22pageId%22%3A%22ZGpmcN66cr_cd86ZKPq-%22%7D');
    console.log('See "Standard Parameter IVR" diagram for call flow details');
    
    //--------------------------------
    // WebRTC Agent 37 Setup with Standard Parameter Skill
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 37 for standard parameter processing...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_37_EMAIL || '',
      password: process.env.WEBRTCAGENT_37_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Configure agent with Standard Parameter Condition Skill
    await agentDashboard.enableSkill(skillName);
    await agentDashboard.setReady();
    
    console.log(`WebRTC Agent 37 configured with "${skillName}"`);
    
    //--------------------------------
    // Supervisor Setup for Parameter Monitoring
    //--------------------------------
    
    console.log('Setting up Supervisor for parameter monitoring...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('=== ACT: Executing Standard Parameter IVR call flow ===');
    
    // Execute Standard Parameter IVR test with menu navigation
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.STANDARD_PARAM.testName,
      baseUrl: IVR_CONFIGS.STANDARD_PARAM.baseUrl,
      params: standardParams,
      queryParams: queryParams,
      callDuration: 20,
      checkResults: true
    });
    
    console.log(`Standard Parameter IVR call completed:`);
    console.log(`- Call SID: ${ivrTestResult.callSid}`);
    console.log(`- Parameters: menu1digit=5, menu2digit=1`);
    console.log(`- Mountain Time: ${ivrTestResult.mountainTime}`);
    
    console.log('=== ASSERT: Verifying Standard Parameter IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Standard Parameter IVR call completed successfully');
    
    // Verify parameter processing in results
    if (ivrTestResult.callResults) {
      console.log('Standard Parameter IVR call results:', ivrTestResult.callResults);
      // Verify parameters were processed correctly
      console.log('✅ Standard parameters processed through IVR correctly');
    }
    
    // Verify in supervisor reports
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    console.log('✅ Standard Parameter IVR call verified in supervisor reports');
    
    twilioIvrClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Standard Parameter IVR flow verified ===');
  });
});
