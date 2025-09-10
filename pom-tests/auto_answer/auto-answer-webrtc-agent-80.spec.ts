import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createCallManagementClient } from '../../pom-migration/api-clients/call-management/call-management-client';
import { AgentStatus, ChannelType } from '../../pom-migration/shared/types/core';

/**
 * Auto Answer WebRTC Agent 80 Test
 * 
 * Migrated from: tests/auto_answer/auto_answer_web_rtc_agent_80.spec.js
 * 
 * This test verifies that WebRTC Agent 80 can automatically answer incoming calls
 * without manual intervention. The test validates the complete auto-answer workflow:
 * 1. Agent login with media permissions
 * 2. Skill configuration and status setup  
 * 3. Call generation and routing
 * 4. Auto-answer verification
 * 5. Call completion and cleanup
 */
test.describe('Auto Answer - WebRTC Agent', () => {
  
  test('WebRTC Agent 80 auto-answers incoming calls', async ({ page, context }) => {
    //--------------------------------
    // Arrange: Set up WebRTC Agent 80 with auto-answer configuration
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up WebRTC Agent 80 ===');
    
    // Configure browser context for WebRTC with media permissions
    await context.grantPermissions(['microphone', 'camera']);
    
    // Create login page and login as WebRTC Agent 80
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_80_EMAIL || '',
      password: process.env.WEBRTCAGENT_80_PASSWORD || ''
    };
    
    console.log(`Logging in as WebRTC Agent 80: ${agentCredentials.username}`);
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    
    await agentDashboard.verifyDashboardLoaded();
    console.log('WebRTC Agent 80 dashboard loaded successfully');
    
    // Enable Skill "80" for Agent 80
    console.log('Configuring Agent 80 skills...');
    await agentDashboard.enableSkill("80");
    
    // Set Agent 80's status to "Ready"
    console.log('Setting Agent 80 to Ready status...');
    await agentDashboard.setReady();
    
    // Verify agent is in Ready state
    const agentStatus = await agentDashboard.getAgentStatus();
    expect(agentStatus).toBe(AgentStatus.READY);
    
    //--------------------------------
    // Cleanup: Ensure no active calls before test
    //--------------------------------
    
    console.log('=== CLEANUP: Pre-test verification ===');
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    
    try {
      // Verify no active call is currently in progress
      await activeMediaPage.verifyNoActiveCall();
      console.log('Confirmed no active calls before test execution');
    } catch {
      console.warn('Found active call - performing emergency cleanup...');
      await activeMediaPage.emergencyEndCall();
      
      // Re-verify no active call after cleanup
      await activeMediaPage.verifyNoActiveCall();
    }
    
    //--------------------------------
    // Act: Generate incoming call to Agent 80
    //--------------------------------
    
    console.log('=== ACT: Generating incoming call ===');
    
    // Initialize call management client
    const callClient = createCallManagementClient();
    
    // Create call to auto-attendant with skill routing
    console.log('Creating call to number 4352001586...');
    const callId = await callClient.createCall({ 
      number: "4352001586" 
    });
    
    console.log(`Call created with ID: ${callId}`);
    
    // Direct call to Agent 80 using DTMF digit 0
    console.log('Routing call to Agent 80 using DTMF digit 0...');
    await callClient.inputDigits(callId, "0");
    
    //--------------------------------
    // Assert: Verify auto-answer workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying auto-answer workflow ===');
    
    // 1. Assert call connects and is automatically answered
    console.log('Waiting for call to be auto-answered...');
    await activeMediaPage.expectCallAutoAnswered(5 * 60 * 1000); // 5 minute timeout
    
    // 2. Assert an "Active Media" tile appears
    console.log('Verifying active media tile appears...');
    await activeMediaPage.expectActiveMediaTileVisible();
    
    // 3. Assert the call had a "Wait Time" of "00:00:00" (immediate auto-answer)
    console.log('Verifying minimal wait time for auto-answer...');
    await activeMediaPage.verifyCallWaitTime("00:00:00");
    
    // 4. Get call details for verification
    const callDetails = await activeMediaPage.getCallDetails();
    console.log('Call details:', callDetails);
    expect(callDetails.waitTime).toBe("00:00:00");
    
    // 5. Assert call eventually ends naturally
    console.log('Waiting for call to end naturally...');
    await activeMediaPage.expectCallEnded(3 * 60 * 1000); // 3 minute timeout
    
    // 6. Assert the "After Call Work" tile appears
    console.log('Verifying after call work appears...');
    await activeMediaPage.expectAfterCallWorkVisible();
    
    //--------------------------------
    // Cleanup: Complete after call work
    //--------------------------------
    
    console.log('=== CLEANUP: Completing after call work ===');
    
    try {
      // Complete after call work and close dialog
      await activeMediaPage.completeCallCleanup();
      console.log('Call cleanup completed successfully');
      
    } catch (error) {
      console.error('Call cleanup failed:', error.message);
      
      // Log error for debugging but don't fail the test if cleanup fails
      console.warn('Cleanup failure will be reported but not fail the test');
      
      // Attempt emergency cleanup one more time
      try {
        await activeMediaPage.emergencyEndCall();
      } catch (emergencyError) {
        console.error('Emergency cleanup also failed:', emergencyError.message);
      }
    }
    
    console.log('=== TEST COMPLETED: Auto-answer workflow verified successfully ===');
  });
  
  /**
   * Additional test case for auto-answer flow verification using the enhanced POM method
   */
  test('WebRTC Agent 80 complete auto-answer flow verification', async ({ page, context }) => {
    // Setup similar to the main test
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_80_EMAIL || '',
      password: process.env.WEBRTCAGENT_80_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    
    await agentDashboard.enableSkill("80");
    await agentDashboard.setReady();
    
    // Navigate to active media and prepare for test
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.emergencyEndCall(); // Ensure clean state
    
    // Generate call
    const callClient = createCallManagementClient();
    const callId = await callClient.createCall({ number: "4352001586" });
    await callClient.inputDigits(callId, "0");
    
    // Use the enhanced POM method for complete flow verification
    await activeMediaPage.verifyAutoAnswerFlow();
    
    // Final cleanup
    await activeMediaPage.completeCallCleanup();
  });
  
  /**
   * Test case for handling edge cases and error scenarios
   */
  test('WebRTC Agent 80 handles auto-answer edge cases', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_80_EMAIL || '',
      password: process.env.WEBRTCAGENT_80_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    
    // Test 1: Verify agent can handle no active calls gracefully
    await activeMediaPage.verifyNoActiveCall();
    
    // Test 2: Verify emergency cleanup works when no calls are active
    await activeMediaPage.emergencyEndCall(); // Should not throw error
    
    // Test 3: Verify call details retrieval when no call is active
    const emptyDetails = await activeMediaPage.getCallDetails();
    console.log('Empty call details:', emptyDetails);
    
    console.log('Edge case testing completed successfully');
  });
});
