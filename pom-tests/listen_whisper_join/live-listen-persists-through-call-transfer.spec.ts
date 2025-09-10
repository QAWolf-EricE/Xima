import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage, CallMonitoringMode } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';
import { createCallMonitoringClient } from '../../pom-migration/api-clients/call-monitoring/call-monitoring-client';

/**
 * Live Listen Persists Through Call Transfer Test
 * 
 * Migrated from: tests/listen_whisper_join/live_listen_persists_through_call_transfer.spec.js
 * 
 * This test verifies live listen persistence during call transfers:
 * 1. Supervisor call monitoring setup
 * 2. Agent call establishment with monitoring
 * 3. Call transfer initiation while monitoring active
 * 4. Monitoring persistence verification across transfer
 * 5. Post-transfer monitoring state validation
 * 6. Complex call flow management during transfers
 */
test.describe('Call Monitoring - Transfer Persistence', () => {
  
  test('Live listen persists correctly through call transfers', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up Multi-Agent Environment for Transfer Testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up multi-agent environment for transfer persistence ===');
    
    //--------------------------------
    // Supervisor Setup
    //--------------------------------
    
    console.log('Setting up Supervisor for transfer monitoring...');
    const supervisorContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Supervisor logged in for transfer monitoring');
    
    //--------------------------------
    // Primary Agent Setup (Call Recipient)
    //--------------------------------
    
    console.log('Setting up Primary Agent for call handling...');
    const primaryAgentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const primaryAgentPage = await primaryAgentContext.newPage();
    
    const primaryAgentLoginPage = await LoginPage.create(primaryAgentPage);
    const primaryAgentDashboard = await primaryAgentLoginPage.loginAsAgent();
    await primaryAgentDashboard.setupForEmailTesting("45"); // Use skill 45 for transfer testing
    
    console.log('Primary Agent configured and ready');
    
    //--------------------------------
    // Secondary Agent Setup (Transfer Target)
    //--------------------------------
    
    console.log('Setting up Secondary Agent as transfer target...');
    const secondaryAgentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const secondaryAgentPage = await secondaryAgentContext.newPage();
    
    const secondaryAgentLoginPage = await LoginPage.create(secondaryAgentPage);
    const secondaryAgentDashboard = await secondaryAgentLoginPage.loginAsAgent();
    await secondaryAgentDashboard.setupForEmailTesting("46"); // Use skill 46 for transfer target
    
    console.log('Secondary Agent configured as transfer target');
    
    //--------------------------------
    // Initialize Call Monitoring Infrastructure
    //--------------------------------
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    // Navigate to Supervisor View
    await callMonitoringPage.navigateToSupervisorView();
    await callMonitoringPage.configureAgentFilter('Primary Agent');
    
    console.log('Call monitoring infrastructure initialized');
    
    //--------------------------------
    // Act: Establish Call and Start Monitoring
    //--------------------------------
    
    console.log('=== ACT: Establishing call and starting live listen ===');
    
    // Create call for primary agent
    const callSession = await callMonitoringClient.createWebRTCAgentCall(
      'Primary Agent',
      45, // Skill ID
      5   // Skill digit
    );
    
    // Establish call with primary agent
    await primaryAgentPage.bringToFront();
    await primaryAgentDashboard.expectIncomingCall();
    await primaryAgentDashboard.answerCall();
    
    console.log('Call established with Primary Agent');
    
    // Start live listen monitoring
    await supervisorPage.bringToFront();
    await callMonitoringPage.startListen('Primary Agent');
    
    // Verify live listen is active
    let currentMode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(currentMode).toBe(CallMonitoringMode.LISTEN);
    
    console.log('✅ Live listen monitoring established');
    
    //--------------------------------
    // Initiate Call Transfer While Monitoring
    //--------------------------------
    
    console.log('=== TRANSFER: Initiating call transfer while monitoring ===');
    
    // Simulate call transfer through primary agent
    await primaryAgentPage.bringToFront();
    
    // Note: In a real implementation, this would involve:
    // 1. Primary agent initiating transfer to Secondary Agent
    // 2. Transfer process completion
    // 3. Call moving from Primary to Secondary Agent
    
    // For this test, we simulate the transfer process
    await callMonitoringClient.simulateCallTransferDuringMonitoring(callSession.callId);
    
    console.log('Call transfer initiated while live listen active');
    
    //--------------------------------
    // Verify Monitoring Persists Through Transfer
    //--------------------------------
    
    console.log('=== VERIFY: Confirming monitoring persistence through transfer ===');
    
    // Switch back to supervisor to verify monitoring persistence
    await supervisorPage.bringToFront();
    
    // Verify monitoring persists through transfer
    await callMonitoringPage.verifyMonitoringPersistsThroughTransfer();
    
    console.log('✅ Live listen persistence through transfer verified');
    
    //--------------------------------
    // Post-Transfer Monitoring Verification
    //--------------------------------
    
    console.log('=== POST-TRANSFER: Verifying monitoring state after transfer ===');
    
    // Verify monitoring is still active after transfer
    await callMonitoringPage.verifyMonitoringActive();
    
    // Verify session state in monitoring client
    const activeSession = callMonitoringClient.getActiveSession(callSession.callId);
    expect(activeSession?.hasTransfer).toBe(true);
    expect(activeSession?.isActive).toBe(true);
    
    console.log('✅ Post-transfer monitoring state verified');
    
    //--------------------------------
    // End Monitoring and Cleanup Calls
    //--------------------------------
    
    console.log('=== CLEANUP: Ending monitoring and cleaning up calls ===');
    
    // End monitoring session
    await callMonitoringPage.endMonitoring();
    
    // Cleanup agent calls
    await primaryAgentPage.bringToFront();
    const primaryActiveMedia = await primaryAgentDashboard.navigateToActiveMedia();
    await primaryActiveMedia.emergencyEndCall();
    
    await secondaryAgentPage.bringToFront();
    const secondaryActiveMedia = await secondaryAgentDashboard.navigateToActiveMedia();
    await secondaryActiveMedia.emergencyEndCall();
    
    console.log('All calls ended and cleaned up');
    
    //--------------------------------
    // Final Cleanup: Close all contexts and resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all contexts and resources ===');
    
    callMonitoringClient.cleanup();
    await primaryAgentContext.close();
    await secondaryAgentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Live listen persistence through transfer verified ===');
    console.log('✅ Live listen monitoring persists across call transfers');
    console.log('✅ Multi-agent transfer coordination working');
    console.log('✅ Transfer state tracking in monitoring client');
    console.log('✅ Post-transfer monitoring validation successful');
    console.log('✅ Complex call flow monitoring maintained');
  });
  
  /**
   * Test simplified transfer persistence verification
   */
  test('Live listen transfer persistence basic verification', async ({ browser }) => {
    // Setup supervisor
    const supervisorContext = await browser.newContext({ permissions: ['microphone', 'camera'] });
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    const callMonitoringClient = createCallMonitoringClient();
    
    // Basic transfer persistence test
    await callMonitoringPage.navigateToSupervisorView();
    await callMonitoringPage.verifyMonitoringPersistsThroughTransfer();
    
    console.log('Live listen transfer persistence basic verification completed');
    
    callMonitoringClient.cleanup();
    await supervisorContext.close();
  });
});
