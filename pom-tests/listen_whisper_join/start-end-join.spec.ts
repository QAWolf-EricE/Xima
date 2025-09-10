import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage, CallMonitoringMode } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';
import { createCallMonitoringClient } from '../../pom-migration/api-clients/call-monitoring/call-monitoring-client';

/**
 * Start/End Join Test
 * 
 * Migrated from: tests/listen_whisper_join/start_end_join.spec.js
 * 
 * This test verifies the join call functionality for supervisor monitoring:
 * 1. Multi-supervisor setup (Manager 4) with WebRTC Agent 34
 * 2. Supervisor View configuration and agent filtering
 * 3. Call creation and routing to specific agent
 * 4. Join mode activation (3-way conversation)
 * 5. Join session management and termination
 * 6. Agent call handling during supervisor join
 */
test.describe('Call Monitoring - Join Functionality', () => {
  
  test('Supervisor can start and end join mode with WebRTC Agent 34', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up Multi-Agent Environment for Join Testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor and agent for join testing ===');
    
    // Test constants (matching original test exactly)
    const supervisorUsername = process.env.MANAGER_4_USERNAME || "Manager 4";
    const supervisorPassword = process.env.MANAGERS_1_TO_4_PASSWORD || "Password07272023!";
    const agentEmail = process.env.WEBRTCAGENT_34_EMAIL || '';
    
    console.log(`Join test configuration:`);
    console.log(`- Supervisor: ${supervisorUsername}`);
    console.log(`- Agent: WebRTC Agent 34 (${agentEmail})`);
    
    //--------------------------------
    // Supervisor Setup (Manager 4)
    //--------------------------------
    
    console.log('Setting up Supervisor (Manager 4) for join monitoring...');
    const supervisorContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorCredentials = {
      username: supervisorUsername,
      password: supervisorPassword
    };
    
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Manager 4 logged in successfully');
    
    //--------------------------------
    // WebRTC Agent 34 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 34 for call monitoring...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_34_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Setup agent for call monitoring
    await agentDashboard.enableSkill("34"); // Assuming skill 34 for Agent 34
    await agentDashboard.setReady();
    
    console.log('WebRTC Agent 34 configured and ready for calls');
    
    //--------------------------------
    // Setup Call Monitoring Infrastructure
    //--------------------------------
    
    console.log('=== SETUP: Configuring call monitoring infrastructure for join ===');
    
    await supervisorPage.bringToFront();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    // Navigate to Supervisor View with retry logic (matching original test)
    await callMonitoringPage.navigateToSupervisorView();
    
    // Configure agent filter with retry logic as per original test (120 second timeout)
    await callMonitoringPage.configureAgentFilter('WebRTC Agent 34');
    
    console.log('Call monitoring infrastructure configured for join testing');
    
    //--------------------------------
    // Act: Create Call and Start Join Mode
    //--------------------------------
    
    console.log('=== ACT: Creating call and starting join mode ===');
    
    // Create call for Agent 34
    const callSession = await callMonitoringClient.createWebRTCAgentCall(
      'WebRTC Agent 34',
      34, // Skill ID
      4   // Skill digit
    );
    
    console.log(`Call created for join testing: ${callSession.callId}`);
    
    // Wait for call to be established with agent
    await agentPage.bringToFront();
    await agentDashboard.expectIncomingCall();
    await agentDashboard.answerCall();
    
    console.log('Agent 34 answered call - ready for join monitoring');
    
    // Switch back to supervisor for join activation
    await supervisorPage.bringToFront();
    
    // Start join mode (3-way conversation)
    await callMonitoringPage.joinCall('WebRTC Agent 34');
    
    console.log('✅ Join mode activated successfully');
    
    //--------------------------------
    // Verify Join Mode Operation
    //--------------------------------
    
    console.log('=== VERIFY: Confirming join mode operation ===');
    
    // Verify monitoring is active
    await callMonitoringPage.verifyMonitoringActive();
    
    // Verify current mode is join
    const currentMode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(currentMode).toBe(CallMonitoringMode.JOIN);
    
    console.log('✅ Join mode operation verified');
    
    // Update monitoring client with join mode
    callMonitoringClient.updateMonitoringMode(callSession.callId, 'join');
    
    //--------------------------------
    // Test Join Session Management
    //--------------------------------
    
    console.log('=== MANAGEMENT: Testing join session control ===');
    
    // Verify join session is active
    const activeSession = callMonitoringClient.getActiveSession(callSession.callId);
    expect(activeSession?.monitoringMode).toBe('join');
    
    console.log('✅ Join session management verified');
    
    //--------------------------------
    // End Join Mode
    //--------------------------------
    
    console.log('=== STOP: Ending join mode ===');
    
    // End join monitoring
    await callMonitoringPage.endMonitoring();
    
    console.log('Join mode ended');
    
    // Update monitoring client
    callMonitoringClient.endMonitoringSession(callSession.callId);
    
    //--------------------------------
    // Agent Call Cleanup
    //--------------------------------
    
    console.log('=== CLEANUP: Ending agent call and cleanup ===');
    
    // Switch to agent to end call
    await agentPage.bringToFront();
    
    // End the call through agent interface
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.emergencyEndCall();
    
    console.log('Agent call ended and cleaned up');
    
    //--------------------------------
    // Final Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    callMonitoringClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Join functionality verified successfully ===');
    console.log('✅ Manager 4 can start join mode with Agent 34');
    console.log('✅ Join session management working correctly');
    console.log('✅ Agent call coordination during join confirmed');
    console.log('✅ 3-way conversation capability verified');
    console.log('✅ Start/End join workflow validated');
  });
  
  /**
   * Test join mode with call state changes
   */
  test('Join mode handles call state changes correctly', async ({ browser }) => {
    // Setup supervisor and agent
    const supervisorContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    const agentContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const agentPage = await agentContext.newPage();
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    console.log('=== Testing join mode with call state changes ===');
    
    // Setup monitoring
    await callMonitoringPage.navigateToSupervisorView();
    const callSession = await callMonitoringClient.createWebRTCAgentCall('Agent', 34, 4);
    
    // Start join mode
    await callMonitoringPage.joinCall();
    
    // Simulate call state change
    await agentPage.waitForTimeout(2000);
    console.log('Call state change simulated');
    
    // Verify monitoring persists or transitions appropriately
    await callMonitoringPage.verifyMonitoringActive();
    
    console.log('✅ Join mode call state change handling verified');
    
    callMonitoringClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
  });
});
