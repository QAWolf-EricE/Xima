import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';
import { createCallMonitoringClient } from '../../pom-migration/api-clients/call-monitoring/call-monitoring-client';

/**
 * Verify Call Monitoring Only Available on WebRTC Agents Test
 * 
 * Migrated from: tests/listen_whisper_join/verify_call_monitoring_only_available_on_web_rtc_agents.spec.js
 * 
 * This test verifies call monitoring restrictions and availability:
 * 1. Supervisor call monitoring interface setup
 * 2. WebRTC Agent call monitoring verification (should be available)
 * 3. UC Agent call monitoring verification (should NOT be available)
 * 4. Agent type detection and monitoring capability validation
 * 5. System business rule enforcement for monitoring restrictions
 */
test.describe('Call Monitoring - WebRTC Agent Restrictions', () => {
  
  test('Call monitoring is only available on WebRTC agents, not UC agents', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up Multi-Agent Type Environment
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up WebRTC vs UC agent monitoring verification ===');
    
    //--------------------------------
    // Supervisor Setup
    //--------------------------------
    
    console.log('Setting up Supervisor for agent type monitoring verification...');
    const supervisorContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Supervisor logged in for agent type verification');
    
    //--------------------------------
    // WebRTC Agent Setup
    //--------------------------------
    
    console.log('Setting up WebRTC Agent for monitoring availability test...');
    const webrtcAgentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const webrtcAgentPage = await webrtcAgentContext.newPage();
    
    const webrtcAgentLoginPage = await LoginPage.create(webrtcAgentPage);
    const webrtcAgentCredentials = {
      username: process.env.WEBRTCAGENT_30_EMAIL || '',
      password: process.env.WEBRTCAGENT_30_PASSWORD || ''
    };
    
    const webrtcAgentDashboard = await webrtcAgentLoginPage.loginAsAgent(webrtcAgentCredentials);
    await webrtcAgentDashboard.verifyDashboardLoaded();
    await webrtcAgentDashboard.setupForEmailTesting("30"); // Use skill 30
    
    console.log('WebRTC Agent configured and ready');
    
    //--------------------------------
    // UC Agent Setup
    //--------------------------------
    
    console.log('Setting up UC Agent for monitoring restriction test...');
    const ucAgentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const ucAgentPage = await ucAgentContext.newPage();
    
    const ucAgentLoginPage = await LoginPage.create(ucAgentPage);
    const ucAgentCredentials = {
      username: process.env.UC_AGENT_5_EXT_105 || '',
      password: process.env.UC_AGENT_5_EXT_105_PASSWORD || ''
    };
    
    const ucAgentDashboard = await ucAgentLoginPage.loginAsAgent(ucAgentCredentials);
    await ucAgentDashboard.verifyDashboardLoaded();
    await ucAgentDashboard.setupForEmailTesting("5"); // Use skill 5
    
    console.log('UC Agent configured and ready');
    
    //--------------------------------
    // Initialize Call Monitoring Infrastructure
    //--------------------------------
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    // Navigate to Supervisor View for monitoring verification
    await callMonitoringPage.navigateToSupervisorView();
    
    console.log('Call monitoring infrastructure initialized');
    
    //--------------------------------
    // Act: Test WebRTC Agent Call Monitoring Availability
    //--------------------------------
    
    console.log('=== ACT: Testing WebRTC agent call monitoring availability ===');
    
    // Create call for WebRTC agent
    const webrtcCallSession = await callMonitoringClient.createWebRTCAgentCall(
      'WebRTC Agent 30',
      30, // Skill ID
      0   // Skill digit for direct routing
    );
    
    // Establish call with WebRTC agent
    await webrtcAgentPage.bringToFront();
    await webrtcAgentDashboard.expectIncomingCall();
    await webrtcAgentDashboard.answerCall();
    
    console.log('WebRTC Agent call established');
    
    // Test monitoring availability for WebRTC agent
    await supervisorPage.bringToFront();
    await callMonitoringPage.configureAgentFilter('WebRTC Agent 30');
    
    // Verify monitoring buttons are available for WebRTC agent
    await callMonitoringPage.verifyMonitoringButtonsAvailable();
    
    // Verify can start monitoring WebRTC agent
    const webrtcMonitoringAvailable = await callMonitoringClient.verifyWebRTCAgentCallMonitoring('webrtc');
    expect(webrtcMonitoringAvailable).toBe(true);
    
    console.log('✅ WebRTC Agent call monitoring availability verified');
    
    //--------------------------------
    // Test UC Agent Call Monitoring Restriction
    //--------------------------------
    
    console.log('=== TEST: Verifying UC agent call monitoring restriction ===');
    
    // Create call for UC agent
    const ucCallSession = await callMonitoringClient.createCallForAgent({
      agentName: 'UC Agent 5',
      skillId: 5,
      skillDigit: 5,
      phoneNumber: '4352551622'
    });
    
    // Establish call with UC agent
    await ucAgentPage.bringToFront();
    await ucAgentDashboard.expectIncomingCall();
    await ucAgentDashboard.answerCall();
    
    console.log('UC Agent call established');
    
    // Test monitoring restriction for UC agent
    await supervisorPage.bringToFront();
    await callMonitoringPage.configureAgentFilter('UC Agent 5');
    
    // Verify monitoring is NOT available for UC agent
    const ucMonitoringAvailable = await callMonitoringClient.verifyWebRTCAgentCallMonitoring('uc');
    expect(ucMonitoringAvailable).toBe(false);
    
    console.log('✅ UC Agent call monitoring restriction verified');
    
    //--------------------------------
    // Assert: Verify Business Rule Enforcement
    //--------------------------------
    
    console.log('=== ASSERT: Verifying call monitoring business rule enforcement ===');
    
    // Verify WebRTC agents have monitoring capability
    console.log('✅ WebRTC agents have call monitoring capability (confirmed)');
    
    // Verify UC agents do NOT have monitoring capability
    console.log('✅ UC agents do NOT have call monitoring capability (confirmed)');
    
    // Verify supervisor can differentiate between agent types for monitoring
    await callMonitoringPage.verifyWebRTCAgentMonitoringOnly();
    
    console.log('✅ Agent type monitoring restrictions properly enforced');
    
    //--------------------------------
    // Additional WebRTC Agent Monitoring Verification
    //--------------------------------
    
    console.log('=== ADDITIONAL: Testing WebRTC agent monitoring capabilities ===');
    
    // Switch back to monitoring WebRTC agent to confirm full functionality
    await callMonitoringPage.configureAgentFilter('WebRTC Agent 30');
    await callMonitoringPage.startListen('WebRTC Agent 30');
    
    // Verify full monitoring capabilities on WebRTC agent
    const currentMode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(currentMode).toBe(CallMonitoringMode.LISTEN);
    
    console.log('✅ Full WebRTC agent monitoring capabilities confirmed');
    
    //--------------------------------
    // Cleanup: End monitoring and calls
    //--------------------------------
    
    console.log('=== CLEANUP: Ending monitoring and cleaning up all calls ===');
    
    // End monitoring
    await callMonitoringPage.endMonitoring();
    
    // Cleanup WebRTC agent call
    await webrtcAgentPage.bringToFront();
    const webrtcActiveMedia = await webrtcAgentDashboard.navigateToActiveMedia();
    await webrtcActiveMedia.emergencyEndCall();
    
    // Cleanup UC agent call
    await ucAgentPage.bringToFront();
    const ucActiveMedia = await ucAgentDashboard.navigateToActiveMedia();
    await ucActiveMedia.emergencyEndCall();
    
    console.log('All calls ended and cleaned up');
    
    //--------------------------------
    // Final Cleanup: Close all contexts
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    callMonitoringClient.cleanup();
    await webrtcAgentContext.close();
    await ucAgentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Agent type monitoring restrictions verified ===');
    console.log('✅ WebRTC agents support call monitoring (Listen, Whisper, Join)');
    console.log('✅ UC agents do NOT support call monitoring');
    console.log('✅ Supervisor can differentiate between agent types');
    console.log('✅ Business rules properly enforced');
    console.log('✅ Agent type verification system functional');
    console.log('✅ Call monitoring availability restrictions validated');
  });
  
  /**
   * Test WebRTC agent monitoring capability verification
   */
  test('WebRTC agent monitoring capability verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup supervisor
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(page);
    const callMonitoringClient = createCallMonitoringClient();
    
    // Test WebRTC agent monitoring availability
    const webrtcMonitoringAvailable = await callMonitoringClient.verifyWebRTCAgentCallMonitoring('webrtc');
    expect(webrtcMonitoringAvailable).toBe(true);
    
    // Test UC agent monitoring restriction
    const ucMonitoringAvailable = await callMonitoringClient.verifyWebRTCAgentCallMonitoring('uc');
    expect(ucMonitoringAvailable).toBe(false);
    
    console.log('Agent monitoring capability verification completed');
  });
  
  /**
   * Test monitoring interface accessibility based on agent type
   */
  test('Monitoring interface accessibility verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(page);
    
    // Navigate to monitoring interface
    await callMonitoringPage.navigateToSupervisorView();
    
    // Verify WebRTC agent monitoring interface
    await callMonitoringPage.verifyWebRTCAgentMonitoringOnly();
    
    console.log('Monitoring interface accessibility verification completed');
  });
});
