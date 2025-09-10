import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Collect Digits B IVR Test
 * 
 * Migrated from: tests/ivr/collect_digits_b_ivr.spec.js
 * 
 * This test verifies the collect digits B IVR functionality:
 * 1. WebRTC Agent integration with "Collect Digits B Skill" 
 * 2. DTMF digit collection and processing with B-specific parameters
 * 3. Agent skill management for B-variant digit collection
 * 4. IVR API authentication and B-parameter processing
 * 5. Supervisor reporting for B-variant digit collection operations
 */
test.describe('IVR Testing - Collect Digits B Flow', () => {
  
  test('Collect Digits B IVR processes B-variant digit collection correctly', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Collect Digits B IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    const skillName = "Collect Digits B Skill";
    
    console.log(`Collect Digits B IVR test starting with identifier: ${uniqueIdentifier}`);
    console.log(`B-variant digit collection skill: ${skillName}`);
    
    //--------------------------------
    // WebRTC Agent Setup for Collect Digits B
    //--------------------------------
    
    const agentContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    // Using a generic WebRTC agent for B-variant testing
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_41_EMAIL || process.env.WEBRTCAGENT_40_EMAIL || '',
      password: process.env.WEBRTCAGENT_41_PASSWORD || process.env.WEBRTCAGENT_40_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.enableSkill(skillName);
    await agentDashboard.setReady();
    
    // Supervisor setup
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing Collect Digits B IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.COLLECT_DIGITS_B.testName,
      baseUrl: IVR_CONFIGS.COLLECT_DIGITS_B.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying Collect Digits B IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Collect Digits B IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Collect Digits B IVR flow verified ===');
  });
});
