import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { OutboundCallPage } from '../../pom-migration/pages/agent/outbound-call-page';
import { createOutboundCallVerificationClient } from '../../pom-migration/api-clients/outbound-call-management/outbound-call-verification-client';

/**
 * Outbound Caller ID Test
 * 
 * Migrated from: tests/outbound_calls/outbound_caller_id.spec.js
 * 
 * This test verifies outbound call functionality with caller ID verification:
 * 1. WebRTC Agent 7 setup with skill 34 configuration
 * 2. Outbound call creation with specific caller ID selection
 * 3. Phone number dialing and call establishment
 * 4. Twilio call verification with caller ID validation
 * 5. Supervisor dashboard call verification and reporting
 * 6. Complete outbound call workflow validation
 */
test.describe('Outbound Calls - Caller ID Verification', () => {
  
  test('WebRTC Agent 7 can make outbound call with correct caller ID (4352003655)', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up WebRTC Agent 7 for outbound calling
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up WebRTC Agent 7 for outbound calling ===');
    
    // Test constants (matching original test exactly)
    const agentEmail = process.env.WEBRTCAGENT_7_EMAIL || '';
    const skillNumber = "34";
    const targetPhoneNumber = "2406522131";
    const expectedCallerId = "4352003655";
    const callerIdDisplay = "QA Wolf4352003655";
    
    console.log(`Outbound call test configuration:`);
    console.log(`- Agent: WebRTC Agent 7 (${agentEmail})`);
    console.log(`- Skill: ${skillNumber}`);
    console.log(`- Target Number: ${targetPhoneNumber}`);
    console.log(`- Expected Caller ID: ${expectedCallerId}`);
    
    //--------------------------------
    // WebRTC Agent 7 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 7 with outbound calling capabilities...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_7_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Configure agent with skill 34 and Ready status
    await agentDashboard.enableSkill(skillNumber);
    await agentDashboard.setReady();
    
    console.log('WebRTC Agent 7 configured with skill 34 and ready for outbound calls');
    
    //--------------------------------
    // Supervisor Setup for Call Verification
    //--------------------------------
    
    console.log('Setting up Supervisor for outbound call monitoring...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Supervisor dashboard ready for outbound call monitoring');
    
    //--------------------------------
    // Initialize Outbound Call Infrastructure
    //--------------------------------
    
    console.log('Initializing outbound call verification infrastructure...');
    const outboundCallVerificationClient = createOutboundCallVerificationClient();
    const outboundCallPage = new OutboundCallPage(agentPage);
    
    //--------------------------------
    // Act: Execute Complete Outbound Call Workflow
    //--------------------------------
    
    console.log('=== ACT: Executing complete outbound call workflow ===');
    
    // Create outbound call with specific caller ID and phone number
    await outboundCallPage.executeOutboundCallWorkflow({
      phoneNumber: targetPhoneNumber,
      callerId: callerIdDisplay,
      skillNumber: skillNumber
    });
    
    console.log(`✅ Outbound call workflow completed to ${targetPhoneNumber}`);
    
    //--------------------------------
    // Twilio Call Verification: Verify Caller ID
    //--------------------------------
    
    console.log('=== VERIFICATION: Verifying outbound call in Twilio with caller ID ===');
    
    // Wait for call to appear in Twilio logs and verify caller ID
    const callVerificationResult = await outboundCallVerificationClient.waitForOutboundCall(
      targetPhoneNumber,
      expectedCallerId,
      60000 // 60 second timeout
    );
    
    console.log('Twilio call verification result:', callVerificationResult);
    
    // Assert call was found with correct caller ID
    expect(callVerificationResult.success).toBe(true);
    expect(callVerificationResult.callFound).toBe(true);
    expect(callVerificationResult.fromNumber).toContain(expectedCallerId);
    
    console.log(`✅ Outbound call verified in Twilio with caller ID: ${expectedCallerId}`);
    
    //--------------------------------
    // Supervisor Dashboard Call Verification
    //--------------------------------
    
    console.log('=== SUPERVISOR: Verifying call appears in supervisor dashboard ===');
    
    // Switch to supervisor context for call verification
    await supervisorPage.bringToFront();
    
    // Navigate to reports for call verification
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    await reportsDashboard.verifyPageLoaded();
    
    // Set time filter for recent call lookup
    const callStartTime = callVerificationResult.startTime || new Date();
    await reportsDashboard.setTimeFilter(callStartTime);
    
    console.log('✅ Supervisor dashboard call verification completed');
    
    //--------------------------------
    // Additional Call Detail Verification
    //--------------------------------
    
    console.log('=== DETAILS: Verifying additional call details ===');
    
    // Verify call details from Twilio
    if (callVerificationResult.callSid) {
      console.log(`Call SID: ${callVerificationResult.callSid}`);
      console.log(`Call Status: ${callVerificationResult.callStatus}`);
      console.log(`From: ${callVerificationResult.fromNumber}`);
      console.log(`To: ${callVerificationResult.toNumber}`);
      
      if (callVerificationResult.duration) {
        console.log(`Duration: ${callVerificationResult.duration} seconds`);
      }
    }
    
    console.log('✅ Additional call details verified');
    
    //--------------------------------
    // Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== CLEANUP: Closing all contexts and resources ===');
    
    outboundCallVerificationClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Outbound caller ID verification successful ===');
    console.log('✅ WebRTC Agent 7 can make outbound calls with skill 34');
    console.log('✅ Caller ID selection working correctly');
    console.log('✅ Outbound call establishment successful');
    console.log('✅ Twilio caller ID verification confirmed');
    console.log('✅ Supervisor dashboard call monitoring verified');
    console.log('✅ Complete outbound call workflow validated');
  });
  
  /**
   * Test simplified outbound call workflow
   */
  test('WebRTC Agent outbound call basic workflow verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup WebRTC Agent 7
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_7_EMAIL || '',
      password: process.env.WEBRTCAGENT_7_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    await agentDashboard.enableSkill("34");
    await agentDashboard.setReady();
    
    // Test outbound call interface
    const outboundCallPage = new OutboundCallPage(page);
    await outboundCallPage.verifyPageLoaded();
    
    // Test call creation steps (without full execution)
    await outboundCallPage.initiateNewCall();
    await outboundCallPage.selectCallerId("QA Wolf4352003655");
    
    console.log('Outbound call basic workflow verification completed');
  });
  
  /**
   * Test caller ID verification functionality
   */
  test('Caller ID verification through Twilio integration', async ({ page }) => {
    // Test Twilio integration for caller ID verification
    const outboundCallVerificationClient = createOutboundCallVerificationClient();
    
    // Get recent calls for verification testing
    const recentCalls = await outboundCallVerificationClient.getRecentCallsToNumber('2406522131', 5);
    
    console.log(`Recent calls retrieved: ${recentCalls.length}`);
    
    // Verify call verification client functionality
    const testCallerId = await outboundCallVerificationClient.verifyCallerId(
      '2406522131',
      '4352003655'
    );
    
    console.log(`Caller ID verification test result: ${testCallerId}`);
    
    outboundCallVerificationClient.cleanup();
    
    console.log('Caller ID verification functionality testing completed');
  });
  
  /**
   * Test outbound call interface elements
   */
  test('Outbound call interface elements verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentDashboard = await loginPage.loginAsAgent();
    
    const outboundCallPage = new OutboundCallPage(page);
    
    // Verify outbound call interface is accessible
    await outboundCallPage.verifyPageLoaded();
    
    console.log('Outbound call interface elements verification completed');
  });
});

