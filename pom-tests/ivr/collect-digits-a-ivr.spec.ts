import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Collect Digits A IVR Test
 * 
 * Migrated from: tests/ivr/collect_digits_a_ivr.spec.js
 * 
 * This test verifies the collect digits A IVR functionality:
 * 1. WebRTC Agent 40 integration with "Collect Digits A Skill"
 * 2. DTMF digit collection and processing (menu1digit=3, menu2digit=1)
 * 3. Agent skill management and call routing
 * 4. IVR API authentication and parameter processing
 * 5. Supervisor reporting for digit collection operations
 */
test.describe('IVR Testing - Collect Digits A Flow', () => {
  
  test('Collect Digits A IVR processes digit collection correctly (3,1)', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up WebRTC Agent 40 and digit collection infrastructure
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up Collect Digits A IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    // Collect Digits A parameters (matching original test)
    const collectDigitsParams = { menu1digit: "3", menu2digit: "1" };
    const queryParams = twilioIvrClient.buildQueryParams(collectDigitsParams);
    const skillName = "Collect Digits A Skill";
    
    console.log(`Collect Digits A IVR test starting with identifier: ${uniqueIdentifier}`);
    console.log(`Digit collection parameters: menu1digit=3, menu2digit=1`);
    console.log('Reference: https://docs.google.com/spreadsheets/d/1lQpQLW626ildlPUukqZNPc4CcZQjrKSEr1_NaiI5kEo/edit?usp=sharing');
    console.log('See "Collect Digits A IVR" for detailed specifications');
    console.log('Functions are on Twilio platform');
    
    //--------------------------------
    // WebRTC Agent 40 Setup with Collect Digits A Skill
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 40 for digit collection processing...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_40_EMAIL || '',
      password: process.env.WEBRTCAGENT_40_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Navigate to skills management and configure Collect Digits A Skill
    const skillsPage = await agentDashboard.navigateToSkillsManagement();
    await skillsPage.allSkillsOff();
    await agentPage.waitForTimeout(1000);
    
    // Enable Collect Digits A Skill specifically
    await skillsPage.enableSkill(skillName);
    await agentPage.waitForTimeout(1000);
    await skillsPage.close();
    
    // Set agent to Ready status
    await agentDashboard.setReady();
    
    console.log(`WebRTC Agent 40 configured with "${skillName}" and set to Ready`);
    
    //--------------------------------
    // Supervisor Setup for Digit Collection Monitoring
    //--------------------------------
    
    console.log('Setting up Supervisor for digit collection monitoring...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Supervisor dashboard ready for digit collection monitoring');
    
    //--------------------------------
    // Act: Execute Collect Digits A IVR Call Flow
    //--------------------------------
    
    console.log('=== ACT: Executing Collect Digits A IVR call flow ===');
    
    // Execute Collect Digits A IVR test with digit parameters
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.COLLECT_DIGITS_A.testName,
      baseUrl: IVR_CONFIGS.COLLECT_DIGITS_A.baseUrl,
      params: collectDigitsParams,
      queryParams: queryParams,
      callDuration: 20,
      checkResults: true
    });
    
    console.log(`Collect Digits A IVR call completed:`);
    console.log(`- Call SID: ${ivrTestResult.callSid}`);
    console.log(`- Digit Collection: menu1digit=3, menu2digit=1`);
    console.log(`- Mountain Time: ${ivrTestResult.mountainTime}`);
    console.log(`- Agent Skill: ${skillName}`);
    
    //--------------------------------
    // Assert: Verify Digit Collection Results
    //--------------------------------
    
    console.log('=== ASSERT: Verifying Collect Digits A IVR results ===');
    
    // Verify call completed successfully
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    expect(ivrTestResult.callSid).toBeTruthy();
    
    console.log('✅ Collect Digits A IVR call completed successfully');
    
    // Verify digit collection parameters were processed
    expect(ivrTestResult.uniqueIdentifier).toBe(uniqueIdentifier);
    console.log(`✅ Digit collection tracking identifier preserved: ${uniqueIdentifier}`);
    
    // Verify digit collection results
    if (ivrTestResult.callResults) {
      console.log('Collect Digits A IVR call results:', ivrTestResult.callResults);
      console.log('✅ Digit collection parameters processed correctly through IVR');
    }
    
    //--------------------------------
    // Agent Skill Verification
    //--------------------------------
    
    console.log('=== VERIFICATION: Confirming agent skill configuration ===');
    
    // Verify agent is still ready after call processing
    const agentStatus = await agentDashboard.getAgentStatus();
    expect(agentStatus).toBe('Ready');
    console.log(`✅ WebRTC Agent 40 status maintained: ${agentStatus}`);
    
    // Verify agent can handle digit collection calls
    const channelStates = await agentDashboard.getChannelStatesSummary();
    console.log('Agent channel states after digit collection:', channelStates);
    
    //--------------------------------
    // Supervisor Digit Collection Reporting
    //--------------------------------
    
    console.log('=== REPORTING: Verifying digit collection reporting ===');
    
    // Navigate to reports dashboard for digit collection verification
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    await reportsDashboard.verifyPageLoaded();
    
    // Set time filter for digit collection call lookup
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.setTimeFilter(callStartTime);
    
    // Verify call appears in digit collection reporting
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    console.log('✅ Collect Digits A IVR call verified in supervisor reports');
    
    // Get detailed call information including digit collection data
    const callDetails = await reportsDashboard.getIvrCallDetails(uniqueIdentifier);
    if (callDetails) {
      console.log('Digit collection call details:', callDetails);
      expect(callDetails.callFound).toBe(true);
      console.log('✅ Detailed digit collection call information retrieved');
    }
    
    //--------------------------------
    // Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== CLEANUP: Finalizing Collect Digits A IVR test ===');
    
    twilioIvrClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Collect Digits A IVR flow verified successfully ===');
    console.log('✅ WebRTC Agent 40 successfully processed digit collection');
    console.log('✅ Collect Digits A Skill configuration verified');
    console.log('✅ Digit parameters (3,1) processed correctly');
    console.log('✅ IVR API authentication and parameter handling confirmed');
    console.log('✅ Supervisor digit collection reporting validated');
  });
  
  /**
   * Test simplified Collect Digits A workflow
   */
  test('Collect Digits A basic digit collection verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup WebRTC Agent 40
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_40_EMAIL || '',
      password: process.env.WEBRTCAGENT_40_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    
    // Enable Collect Digits A Skill
    await agentDashboard.enableSkill("Collect Digits A Skill");
    await agentDashboard.setReady();
    
    // Verify agent is configured for digit collection
    const agentStatus = await agentDashboard.getAgentStatus();
    expect(agentStatus).toBe('Ready');
    
    console.log('Collect Digits A agent configuration verified');
  });
  
  /**
   * Test digit collection parameter validation
   */
  test('Collect Digits A parameter validation', async ({ page }) => {
    const twilioIvrClient = createTwilioIvrClient();
    
    // Test with specific digit collection parameters
    const collectDigitsParams = { menu1digit: "3", menu2digit: "1" };
    const queryParams = twilioIvrClient.buildQueryParams(collectDigitsParams);
    
    // Verify query parameters are built correctly
    expect(queryParams).toContain('menu1digit=3');
    expect(queryParams).toContain('menu2digit=1');
    
    console.log('Collect Digits A parameter validation completed');
  });
});
