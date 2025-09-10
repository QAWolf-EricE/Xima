import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage, CallMonitoringMode } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';
import { createCallMonitoringClient } from '../../pom-migration/api-clients/call-monitoring/call-monitoring-client';

/**
 * Live Listen Persists Through New Call Test
 * 
 * Migrated from: tests/listen_whisper_join/live_listen_persists_through_new_call.spec.js
 * 
 * This test verifies live listen persistence when agents receive new calls:
 * 1. Supervisor call monitoring setup and configuration
 * 2. Agent call establishment with active monitoring
 * 3. First call completion while monitoring active
 * 4. New call initiation with same agent
 * 5. Monitoring persistence verification across new calls
 * 6. Continuous monitoring session management
 */
test.describe('Call Monitoring - New Call Persistence', () => {
  
  test('Live listen persists correctly when agent receives new calls', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up environment for new call persistence testing ===');
    
    //--------------------------------
    // Supervisor Setup
    //--------------------------------
    
    const supervisorContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    //--------------------------------
    // Agent Setup
    //--------------------------------
    
    const agentContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const agentPage = await agentContext.newPage();
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentDashboard = await agentLoginPage.loginAsAgent();
    await agentDashboard.setupForEmailTesting("47"); // Use skill 47 for new call testing
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    console.log('=== ACT: Testing live listen persistence through new calls ===');
    
    // Setup monitoring
    await callMonitoringPage.navigateToSupervisorView();
    await callMonitoringPage.configureAgentFilter('Agent');
    
    // First call
    console.log('Creating first call...');
    const firstCallSession = await callMonitoringClient.createWebRTCAgentCall('Agent', 47, 7);
    await agentDashboard.expectIncomingCall();
    await agentDashboard.answerCall();
    
    // Start live listen
    await callMonitoringPage.startListen();
    let mode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(mode).toBe(CallMonitoringMode.LISTEN);
    console.log('✅ Live listen started on first call');
    
    // End first call
    const activeMediaPage = await agentDashboard.navigateToActiveMedia();
    await activeMediaPage.completeCallCleanup();
    console.log('First call ended');
    
    // Create new call
    console.log('Creating new call...');
    const secondCallSession = await callMonitoringClient.createWebRTCAgentCall('Agent', 47, 7);
    await agentDashboard.expectIncomingCall();
    await agentDashboard.answerCall();
    console.log('New call established');
    
    console.log('=== ASSERT: Verifying monitoring persistence through new call ===');
    
    // Verify monitoring persists
    await supervisorPage.bringToFront();
    await callMonitoringPage.verifyMonitoringPersistsThroughNewCall();
    
    console.log('✅ Live listen persistence through new call verified');
    
    callMonitoringClient.cleanup();
    await agentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: New call persistence verified ===');
  });
});
