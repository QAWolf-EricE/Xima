import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Collect Digits C IVR Test
 * 
 * Migrated from: tests/ivr/collect_digits_c_ivr.spec.js
 * 
 * This test verifies the collect digits C IVR functionality:
 * 1. WebRTC Agent integration with "Collect Digits C Skill"
 * 2. DTMF digit collection and processing with C-specific parameters
 * 3. Agent skill management for C-variant digit collection
 * 4. IVR API authentication and C-parameter processing
 * 5. Supervisor reporting for C-variant digit collection operations
 */
test.describe('IVR Testing - Collect Digits C Flow', () => {
  
  test('Collect Digits C IVR processes C-variant digit collection correctly', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Collect Digits C IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    const skillName = "Collect Digits C Skill";
    
    console.log(`Collect Digits C IVR test starting with identifier: ${uniqueIdentifier}`);
    console.log(`C-variant digit collection skill: ${skillName}`);
    
    //--------------------------------
    // WebRTC Agent Setup for Collect Digits C
    //--------------------------------
    
    const agentContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_42_EMAIL || process.env.WEBRTCAGENT_40_EMAIL || '',
      password: process.env.WEBRTCAGENT_42_PASSWORD || process.env.WEBRTCAGENT_40_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.enableSkill(skillName);
    await agentDashboard.setReady();
    
    // Supervisor setup
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing Collect Digits C IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.COLLECT_DIGITS_C.testName,
      baseUrl: IVR_CONFIGS.COLLECT_DIGITS_C.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying Collect Digits C IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Collect Digits C IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Collect Digits C IVR flow verified ===');
  });
});
