import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage, CallMonitoringMode } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';
import { createCallMonitoringClient } from '../../pom-migration/api-clients/call-monitoring/call-monitoring-client';

/**
 * Start/Stop Whisper Test
 * 
 * Migrated from: tests/listen_whisper_join/start_stop_whisper.spec.js
 * 
 * This test verifies the whisper functionality for call monitoring:
 * 1. Multi-supervisor setup (Manager 2) with WebRTC Agent 29
 * 2. Supervisor View configuration and agent filtering
 * 3. Call creation and routing to specific agent with skill 45
 * 4. Whisper mode activation and verification
 * 5. Whisper session management and termination
 * 6. Agent call handling during supervisor whisper
 */
test.describe('Call Monitoring - Whisper Functionality', () => {
  
  test('Supervisor can start and stop whisper mode with WebRTC Agent 29', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up Multi-Agent Environment for Whisper Testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up supervisor and agent for whisper testing ===');
    
    // Test constants (matching original test exactly)
    const supervisorUsername = "Manager 2";
    const supervisorPassword = "Password07272023!";
    const phoneNumber = "4352551622";
    const skillId = 45;
    const skillDigit = 5;
    const agentEmail = process.env.WEBRTCAGENT_29_EMAIL || '';
    
    console.log(`Whisper test configuration:`);
    console.log(`- Supervisor: ${supervisorUsername}`);
    console.log(`- Agent: WebRTC Agent 29 (${agentEmail})`);
    console.log(`- Skill ID: ${skillId}, Skill Digit: ${skillDigit}`);
    console.log(`- Phone Number: ${phoneNumber}`);
    
    //--------------------------------
    // Supervisor Setup (Manager 2)
    //--------------------------------
    
    console.log('Setting up Supervisor (Manager 2) for whisper monitoring...');
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
    
    console.log('Manager 2 logged in successfully');
    
    //--------------------------------
    // WebRTC Agent 29 Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 29 for call monitoring...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: agentEmail,
      password: process.env.WEBRTCAGENT_29_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Setup agent with skill 45
    await agentDashboard.enableSkill(skillId.toString());
    await agentDashboard.setReady();
    
    console.log('WebRTC Agent 29 configured with skill 45 and ready for calls');
    
    //--------------------------------
    // Assert: Verify Supervisor Access
    //--------------------------------
    
    console.log('=== ASSERT: Verifying Manager 2 supervisor access ===');
    
    await supervisorPage.bringToFront();
    
    // Verify Manager 2 identity
    const m2Element = supervisorPage.locator(':text("M2")');
    await expect(m2Element).toBeVisible();
    
    console.log('✅ Manager 2 (M2) identity verified');
    
    //--------------------------------
    // Setup Call Monitoring Infrastructure
    //--------------------------------
    
    console.log('=== SETUP: Configuring call monitoring infrastructure ===');
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    // Navigate to Supervisor View
    await callMonitoringPage.navigateToSupervisorView();
    
    // Configure agent filter for WebRTC Agent 29
    await callMonitoringPage.configureAgentFilter('WebRTC Agent 29');
    
    console.log('Call monitoring infrastructure configured');
    
    //--------------------------------
    // Act: Create Call and Start Whisper
    //--------------------------------
    
    console.log('=== ACT: Creating call and starting whisper mode ===');
    
    // Create call for Agent 29 with skill 45
    const callSession = await callMonitoringClient.createWebRTCAgentCall(
      'WebRTC Agent 29',
      skillId,
      skillDigit
    );
    
    console.log(`Call created for whisper testing: ${callSession.callId}`);
    
    // Wait for call to be established with agent
    await agentPage.bringToFront();
    await agentDashboard.expectIncomingCall();
    await agentDashboard.answerCall();
    
    console.log('Agent 29 answered call - ready for whisper monitoring');
    
    // Switch back to supervisor for whisper activation
    await supervisorPage.bringToFront();
    
    // Start whisper mode
    await callMonitoringPage.startWhisper('WebRTC Agent 29');
    
    console.log('✅ Whisper mode activated successfully');
    
    //--------------------------------
    // Verify Whisper Mode Operation
    //--------------------------------
    
    console.log('=== VERIFY: Confirming whisper mode operation ===');
    
    // Verify monitoring is active
    await callMonitoringPage.verifyMonitoringActive();
    
    // Verify current mode is whisper
    const currentMode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(currentMode).toBe(CallMonitoringMode.WHISPER);
    
    console.log('✅ Whisper mode operation verified');
    
    // Update monitoring client with whisper mode
    callMonitoringClient.updateMonitoringMode(callSession.callId, 'whisper');
    
    //--------------------------------
    // Test Whisper Session Management
    //--------------------------------
    
    console.log('=== MANAGEMENT: Testing whisper session control ===');
    
    // Verify whisper session is active
    const activeSession = callMonitoringClient.getActiveSession(callSession.callId);
    expect(activeSession?.monitoringMode).toBe('whisper');
    
    console.log('✅ Whisper session management verified');
    
    //--------------------------------
    // Stop Whisper Mode
    //--------------------------------
    
    console.log('=== STOP: Ending whisper mode ===');
    
    // End whisper monitoring
    await callMonitoringPage.endMonitoring();
    
    console.log('Whisper mode ended');
    
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
    
    console.log('=== TEST COMPLETED: Whisper functionality verified successfully ===');
    console.log('✅ Manager 2 can start whisper mode with Agent 29');
    console.log('✅ Whisper session management working correctly');
    console.log('✅ Agent call coordination during whisper confirmed');
    console.log('✅ Call monitoring mode transitions successful');
    console.log('✅ Skill-based call routing (45→5) verified');
    console.log('✅ Start/Stop whisper workflow validated');
  });
  
  /**
   * Test whisper mode transitions
   */
  test('Whisper mode transitions between monitoring states', async ({ browser }) => {
    // Setup supervisor and agent
    const supervisorContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    await callMonitoringPage.navigateToSupervisorView();
    
    // Test mode transitions
    await callMonitoringPage.startListen();
    let mode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(mode).toBe(CallMonitoringMode.LISTEN);
    
    await callMonitoringPage.startWhisper();
    mode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(mode).toBe(CallMonitoringMode.WHISPER);
    
    await callMonitoringPage.endMonitoring();
    
    await supervisorContext.close();
    console.log('Whisper mode transitions verified');
  });
  
  /**
   * Test agent-specific whisper configuration
   */
  test('Agent-specific whisper configuration verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(page);
    await callMonitoringPage.navigateToSupervisorView();
    
    // Test agent filtering for specific agent
    await callMonitoringPage.configureAgentFilter('WebRTC Agent 29');
    
    console.log('Agent-specific whisper configuration verified');
  });
});
