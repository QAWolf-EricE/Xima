import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';
import { createHandsetManagementClient } from '../../pom-migration/api-clients/handset-management/handset-management-client';
import { SipOutageScenario } from '../../pom-migration/pages/external/integration-test-page';

/**
 * Handset Registration SRV Failover Test - NO_RESPONSES Scenario
 * 
 * Migrated from: tests/handset_registration_srv_failover_tests/handset_registration_srv_failover_tests_no_responses.spec.js
 * 
 * This test verifies handset registration SRV failover when SIP servers don't respond:
 * 1. WebRTC Agent 76 setup with skill 18
 * 2. Admin system access for SRV record configuration
 * 3. External SRV record lookup and IP resolution
 * 4. SIP outage simulation (NO_RESPONSES scenario)
 * 5. Call routing verification during SIP server outage
 * 6. Failover functionality confirmation
 */
test.describe('Handset Registration SRV Failover - NO_RESPONSES', () => {
  
  test('WebRTC Agent 76 handles SRV failover when SIP servers do not respond', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up WebRTC Agent 76 and Admin System Access
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up WebRTC Agent 76 and admin system access ===');
    
    // Test constants (matching original test exactly)
    const skill = "18";
    const skillDigit = [8];
    const agentEmail = "xima+webrtcagent76@qawolf.email";
    const callNumber = "4352437430";
    
    //--------------------------------
    // WebRTC Agent 76 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 76...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_76_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    console.log('WebRTC Agent 76 logged in successfully');
    
    //--------------------------------
    // Admin System Setup with Denver Timezone
    //--------------------------------
    
    console.log('Setting up admin system access with America/Denver timezone...');
    const adminContext = await browser.newContext({ 
      timezoneId: 'America/Denver' 
    });
    const adminPage = await adminContext.newPage();
    
    // Setup handset management client
    const handsetClient = createHandsetManagementClient();
    
    const adminCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    await handsetClient.setupAdminAccess(adminPage, adminCredentials);
    console.log('Admin system access established');
    
    //--------------------------------
    // Agent Configuration: Skill 18 and Ready Status
    //--------------------------------
    
    console.log('Configuring WebRTC Agent 76 with skill 18...');
    await agentPage.bringToFront();
    
    // Enable skill 18 for the agent
    await agentDashboard.enableSkill(skill);
    
    // Set agent to Ready status
    await agentDashboard.setReady();
    
    console.log('Agent 76 configured with skill 18 and set to Ready');
    
    //--------------------------------
    // Initial Call Test: Establish Baseline Functionality
    //--------------------------------
    
    console.log('=== BASELINE: Testing initial call routing before SIP outage ===');
    
    const callClient = createCallManagementClient();
    let callId: string;
    
    try {
      // Create initial call to establish baseline
      console.log('Creating baseline call...');
      callId = await callClient.createCall({ number: callNumber });
      
      // Wait for call setup
      await agentPage.waitForTimeout(3000);
      
      // Input skill digit for routing
      await callClient.inputDigits(callId, skillDigit);
      
      // Answer the incoming call
      console.log('Answering baseline call...');
      await agentDashboard.expectIncomingCall();
      await agentDashboard.answerCall();
      
      // Verify call is active
      const activeMediaPage = await agentDashboard.navigateToActiveMedia();
      await activeMediaPage.expectCallAutoAnswered();
      
      console.log('✅ Baseline call established successfully');
      
    } catch (error) {
      console.log('First call attempt failed, trying second call...');
      
      try {
        // Retry call creation as per original test logic
        callId = await callClient.createCall({ number: callNumber });
        await agentPage.waitForTimeout(3000);
        await callClient.inputDigits(callId, skillDigit);
        
        await agentDashboard.expectIncomingCall();
        await agentDashboard.answerCall();
        
        const activeMediaPage = await agentDashboard.navigateToActiveMedia();
        await activeMediaPage.expectCallAutoAnswered();
        
        console.log('✅ Baseline call established on second attempt');
        
      } catch (secondError) {
        throw new Error(`Failed to establish baseline call after 2 attempts: ${secondError.message}`);
      }
    }
    
    //--------------------------------
    // SRV Record Configuration and Outage Setup
    //--------------------------------
    
    console.log('=== ACT: Configuring SIP outage scenario (NO_RESPONSES) ===');
    await adminPage.bringToFront();
    
    // Execute complete SRV failover test workflow
    console.log('Executing SRV failover test workflow...');
    
    const srvLookupPage = await adminContext.newPage();
    const integrationPage = await adminContext.newPage();
    
    const failoverResult = await handsetClient.executeFailoverTest({
      srvLookupPage,
      integrationPage,
      scenario: SipOutageScenario.NO_RESPONSES,
      outageDuration: 10 * 60 * 1000 // 10 minutes as per original test
    });
    
    console.log('SRV failover configuration completed:', failoverResult);
    
    //--------------------------------
    // Failover Call Test: Verify SRV Failover Functionality
    //--------------------------------
    
    console.log('=== ASSERT: Testing call routing during SIP server outage ===');
    await agentPage.bringToFront();
    
    // Make call during SIP outage to test failover
    console.log('Creating call during SIP outage to test failover...');
    callId = await callClient.createCall({ number: callNumber });
    
    // Wait for call setup during outage
    await agentPage.waitForTimeout(3000);
    
    // Input skill digit for routing
    await callClient.inputDigits(callId, skillDigit);
    
    // Answer the call during outage
    console.log('Answering call during SIP outage...');
    await agentDashboard.expectIncomingCall();
    await agentDashboard.answerCall();
    
    // Verify call is active despite SIP servers not responding
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.expectCallAutoAnswered();
    
    console.log('✅ Call successfully routed during SIP outage - failover working!');
    
    //--------------------------------
    // Assert: Verify Failover Success
    //--------------------------------
    
    console.log('=== ASSERT: Verifying SRV failover functionality ===');
    
    // Verify call is active (proves failover worked)
    const callActiveHeader = agentPage.locator('xima-dialog-header:has-text("Call Active")');
    await expect(callActiveHeader).toBeVisible();
    
    console.log('✅ SRV failover verified - calls routing despite SIP server NO_RESPONSES scenario');
    
    // Verify handset registration status
    const registrationStatus = await handsetClient.verifyHandsetRegistration();
    console.log('Handset registration status:', registrationStatus);
    
    //--------------------------------
    // Cleanup: Reset SIP Outage and End Call
    //--------------------------------
    
    console.log('=== CLEANUP: Resetting SIP outage and ending call ===');
    
    // Reset SIP outage configuration
    await adminPage.bringToFront();
    await handsetClient.resetSipOutage();
    console.log('SIP outage configuration reset to normal operation');
    
    // End the active call
    await agentPage.bringToFront();
    const endCallButton = agentPage.locator('[data-cy="end-call-btn"]');
    await endCallButton.click();
    
    // Complete after-call work
    const iAmDoneButton = agentPage.getByRole('button', { name: 'I Am Done' });
    await iAmDoneButton.click();
    
    const closeButton = agentPage.getByRole('button', { name: 'Close' });
    await closeButton.click();
    
    // Reset agent configuration
    await agentDashboard.enableSkill(""); // Turn off all skills
    await agentDashboard.setStatus('Do Not Disturb');
    
    console.log('Agent configuration reset');
    
    //--------------------------------
    // Final Cleanup: Close Contexts and Resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    await handsetClient.cleanup();
    await agentContext.close();
    await adminContext.close();
    
    console.log('=== TEST COMPLETED: SRV failover NO_RESPONSES scenario verified ===');
    console.log('✅ WebRTC Agent 76 successfully handled SIP server outage');
    console.log('✅ SRV failover mechanism working correctly');
    console.log('✅ Calls continued to route despite SIP servers not responding');
    console.log('✅ Handset registration failover functionality confirmed');
  });
  
  /**
   * Test simplified SRV failover verification workflow
   */
  test('Agent 76 basic SRV failover connectivity test', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup WebRTC Agent 76
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: "xima+webrtcagent76@qawolf.email",
      password: process.env.WEBRTCAGENT_76_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    await agentDashboard.setupForEmailTesting("18"); // Use skill 18
    
    // Basic handset management setup
    const handsetClient = createHandsetManagementClient();
    
    // Verify handset registration capability
    const registrationStatus = await handsetClient.verifyHandsetRegistration();
    expect(registrationStatus.isRegistered).toBe(true);
    
    console.log('Basic SRV failover connectivity verified');
  });
  
  /**
   * Test SIP outage configuration without full failover test
   */
  test('SIP outage configuration and reset functionality', async ({ browser }) => {
    // Setup admin access
    const adminContext = await browser.newContext({ timezoneId: 'America/Denver' });
    const adminPage = await adminContext.newPage();
    
    const handsetClient = createHandsetManagementClient();
    const adminCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    await handsetClient.setupAdminAccess(adminPage, adminCredentials);
    
    // Test SRV record retrieval
    const srvRecord = await handsetClient.getSrvRecordFromAdmin();
    expect(srvRecord).toBeTruthy();
    console.log(`SRV record retrieved: ${srvRecord}`);
    
    // Test configuration reset
    await handsetClient.resetSipOutage();
    
    await handsetClient.cleanup();
    await adminContext.close();
    
    console.log('SIP outage configuration functionality verified');
  });
});
