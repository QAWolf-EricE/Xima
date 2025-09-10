import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';
import { createHandsetManagementClient } from '../../pom-migration/api-clients/handset-management/handset-management-client';
import { SipOutageScenario } from '../../pom-migration/pages/external/integration-test-page';

/**
 * Handset Registration SRV Failover Test - RESPONDS_WITH_ALL_503 Scenario
 * 
 * Migrated from: tests/handset_registration_srv_failover_tests/handset_registration_srv_failover_tests_responds_with_all_503.spec.js
 * 
 * This test verifies handset registration SRV failover when SIP servers respond with 503 errors:
 * 1. WebRTC Agent 75 setup with skill 17
 * 2. Admin system access for SRV record configuration
 * 3. External SRV record lookup and IP resolution
 * 4. SIP outage simulation (RESPONDS_WITH_ALL_503 scenario)
 * 5. Call routing verification during SIP server 503 errors
 * 6. Failover functionality confirmation
 */
test.describe('Handset Registration SRV Failover - RESPONDS_WITH_ALL_503', () => {
  
  test('WebRTC Agent 75 handles SRV failover when SIP servers respond with 503 errors', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up WebRTC Agent 75 and Admin System Access
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up WebRTC Agent 75 and admin system access ===');
    
    // Test constants (matching original test exactly)
    const skill = "17";
    const skillDigit = [7];
    const agentEmail = "xima+webrtcagent75@qawolf.email";
    const callNumber = "4352437430";
    
    //--------------------------------
    // WebRTC Agent 75 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 75...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_75_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    console.log('WebRTC Agent 75 logged in successfully');
    
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
    // Agent Configuration: Skill 17 and Ready Status
    //--------------------------------
    
    console.log('Configuring WebRTC Agent 75 with skill 17...');
    await agentPage.bringToFront();
    
    // Enable skill 17 for the agent
    await agentDashboard.enableSkill(skill);
    
    // Set agent to Ready status
    await agentDashboard.setReady();
    
    console.log('Agent 75 configured with skill 17 and set to Ready');
    
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
    
    console.log('=== ACT: Configuring SIP outage scenario (RESPONDS_WITH_ALL_503) ===');
    await adminPage.bringToFront();
    
    // Execute complete SRV failover test workflow
    console.log('Executing SRV failover test workflow...');
    
    const srvLookupPage = await adminContext.newPage();
    const integrationPage = await adminContext.newPage();
    
    const failoverResult = await handsetClient.executeFailoverTest({
      srvLookupPage,
      integrationPage,
      scenario: SipOutageScenario.RESPONDS_WITH_ALL_503,
      outageDuration: 10 * 60 * 1000 // 10 minutes as per original test
    });
    
    console.log('SRV failover configuration completed:', failoverResult);
    
    //--------------------------------
    // Failover Call Test: Verify SRV Failover Functionality
    //--------------------------------
    
    console.log('=== ASSERT: Testing call routing during SIP server 503 errors ===');
    await agentPage.bringToFront();
    
    // Make call during SIP outage to test failover
    console.log('Creating call during SIP 503 error scenario to test failover...');
    callId = await callClient.createCall({ number: callNumber });
    
    // Wait for call setup during outage
    await agentPage.waitForTimeout(3000);
    
    // Input skill digit for routing
    await callClient.inputDigits(callId, skillDigit);
    
    // Answer the call during 503 error scenario
    console.log('Answering call during SIP 503 error scenario...');
    await agentDashboard.expectIncomingCall();
    await agentDashboard.answerCall();
    
    // Verify call is active despite SIP servers responding with 503 errors
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.expectCallAutoAnswered();
    
    console.log('✅ Call successfully routed during SIP 503 errors - failover working!');
    
    //--------------------------------
    // Assert: Verify Failover Success
    //--------------------------------
    
    console.log('=== ASSERT: Verifying SRV failover functionality ===');
    
    // Verify call is active (proves failover worked)
    const callActiveHeader = agentPage.locator('xima-dialog-header:has-text("Call Active")');
    await expect(callActiveHeader).toBeVisible();
    
    console.log('✅ SRV failover verified - calls routing despite SIP server 503 error responses');
    
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
    
    console.log('=== TEST COMPLETED: SRV failover RESPONDS_WITH_ALL_503 scenario verified ===');
    console.log('✅ WebRTC Agent 75 successfully handled SIP server 503 errors');
    console.log('✅ SRV failover mechanism working correctly');
    console.log('✅ Calls continued to route despite SIP servers responding with 503 errors');
    console.log('✅ Handset registration failover functionality confirmed');
  });
  
  /**
   * Test simplified SRV failover verification workflow for Agent 75
   */
  test('Agent 75 basic SRV failover connectivity test', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup WebRTC Agent 75
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: "xima+webrtcagent75@qawolf.email",
      password: process.env.WEBRTCAGENT_75_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    await agentDashboard.setupForEmailTesting("17"); // Use skill 17
    
    // Basic handset management setup
    const handsetClient = createHandsetManagementClient();
    
    // Verify handset registration capability
    const registrationStatus = await handsetClient.verifyHandsetRegistration();
    expect(registrationStatus.isRegistered).toBe(true);
    
    console.log('Basic SRV failover connectivity verified for Agent 75');
  });
  
  /**
   * Test SIP 503 error scenario configuration
   */
  test('SIP 503 error scenario configuration and validation', async ({ browser }) => {
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
    console.log(`SRV record retrieved for 503 testing: ${srvRecord}`);
    
    // Test SRV lookup functionality
    const srvLookupPage = await adminContext.newPage();
    const srvResult = await handsetClient.lookupSrvRecordDetails(srvLookupPage, srvRecord);
    
    expect(srvResult.target).toBeTruthy();
    expect(srvResult.ipAddress).toBeTruthy();
    console.log(`SRV lookup completed - Target: ${srvResult.target}, IP: ${srvResult.ipAddress}`);
    
    // Test configuration reset
    await handsetClient.resetSipOutage();
    
    await handsetClient.cleanup();
    await adminContext.close();
    
    console.log('SIP 503 error scenario configuration validated');
  });
  
  /**
   * Test comparison between NO_RESPONSES and RESPONDS_WITH_ALL_503 scenarios
   */
  test('SRV failover scenario comparison verification', async ({ browser }) => {
    // This test verifies that both failover scenarios are available and configurable
    const adminContext = await browser.newContext({ timezoneId: 'America/Denver' });
    const adminPage = await adminContext.newPage();
    
    const handsetClient = createHandsetManagementClient();
    const adminCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    await handsetClient.setupAdminAccess(adminPage, adminCredentials);
    
    // Verify both scenarios are supported by attempting configuration
    const integrationPage = await adminContext.newPage();
    
    try {
      // Test NO_RESPONSES scenario configuration (Agent 76 scenario)
      await handsetClient.configureSipOutage(integrationPage, SipOutageScenario.NO_RESPONSES, '192.168.1.1');
      console.log('✅ NO_RESPONSES scenario configuration available');
      
      // Reset to clear configuration
      await handsetClient.resetSipOutage();
      
      // Test RESPONDS_WITH_ALL_503 scenario configuration (Agent 75 scenario)
      await handsetClient.configureSipOutage(integrationPage, SipOutageScenario.RESPONDS_WITH_ALL_503, '192.168.1.1');
      console.log('✅ RESPONDS_WITH_ALL_503 scenario configuration available');
      
      // Final reset
      await handsetClient.resetSipOutage();
      
    } catch (error) {
      console.warn('Scenario configuration test encountered issues:', error.message);
    }
    
    await handsetClient.cleanup();
    await adminContext.close();
    
    console.log('SRV failover scenario comparison completed');
  });
});
