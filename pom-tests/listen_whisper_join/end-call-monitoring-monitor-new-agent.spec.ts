import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage, CallMonitoringMode } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';
import { createCallMonitoringClient } from '../../pom-migration/api-clients/call-monitoring/call-monitoring-client';

/**
 * End Call Monitoring, Monitor New Agent Test
 * 
 * Migrated from: tests/listen_whisper_join/end_call_monitoring_monitor_new_agent.spec.js
 * 
 * This test verifies supervisor ability to switch monitoring between agents:
 * 1. Supervisor call monitoring setup
 * 2. First agent call establishment and monitoring
 * 3. End monitoring on first agent
 * 4. Switch to monitoring different agent
 * 5. New agent monitoring activation verification
 * 6. Multi-agent monitoring coordination
 */
test.describe('Call Monitoring - Agent Switching', () => {
  
  test('Supervisor can end monitoring one agent and start monitoring another', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up multi-agent monitoring switch test ===');
    
    //--------------------------------
    // Supervisor Setup
    //--------------------------------
    
    const supervisorContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    //--------------------------------
    // First Agent Setup
    //--------------------------------
    
    const firstAgentContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const firstAgentPage = await firstAgentContext.newPage();
    const firstAgentLoginPage = await LoginPage.create(firstAgentPage);
    const firstAgentDashboard = await firstAgentLoginPage.loginAsAgent();
    await firstAgentDashboard.setupForEmailTesting("48");
    
    //--------------------------------
    // Second Agent Setup
    //--------------------------------
    
    const secondAgentContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const secondAgentPage = await secondAgentContext.newPage();
    const secondAgentLoginPage = await LoginPage.create(secondAgentPage);
    const secondAgentDashboard = await secondAgentLoginPage.loginAsAgent();
    await secondAgentDashboard.setupForEmailTesting("49");
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    console.log('=== ACT: Testing agent monitoring switching ===');
    
    // Setup monitoring for first agent
    await callMonitoringPage.navigateToSupervisorView();
    
    // Create call for first agent
    const firstCallSession = await callMonitoringClient.createWebRTCAgentCall('First Agent', 48, 8);
    await firstAgentDashboard.expectIncomingCall();
    await firstAgentDashboard.answerCall();
    
    // Start monitoring first agent
    await callMonitoringPage.startListen('First Agent');
    console.log('✅ Monitoring started on First Agent');
    
    // End monitoring of first agent
    await callMonitoringPage.endMonitoring();
    console.log('✅ Monitoring ended for First Agent');
    
    // Create call for second agent
    const secondCallSession = await callMonitoringClient.createWebRTCAgentCall('Second Agent', 49, 9);
    await secondAgentDashboard.expectIncomingCall();
    await secondAgentDashboard.answerCall();
    
    // Start monitoring second agent
    await callMonitoringPage.monitorAgentByName('Second Agent', CallMonitoringMode.LISTEN);
    
    console.log('=== ASSERT: Verifying agent monitoring switch ===');
    
    // Verify monitoring is now on second agent
    await callMonitoringPage.verifyMonitoringActive();
    
    console.log('✅ Agent monitoring switch verified');
    
    callMonitoringClient.cleanup();
    await firstAgentContext.close();
    await secondAgentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Agent monitoring switch verified ===');
  });
});
