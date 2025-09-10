import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage, CallMonitoringMode } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';
import { createCallMonitoringClient } from '../../pom-migration/api-clients/call-monitoring/call-monitoring-client';

/**
 * Start Live Listen Test
 * 
 * Migrated from: tests/listen_whisper_join/start_live_listen.spec.js
 * 
 * This test verifies the live listen functionality for call monitoring:
 * 1. Staggering supervisor login with media permissions
 * 2. Supervisor View navigation and configuration
 * 3. Agent filter setup and configuration
 * 4. Live listen activation and verification
 * 5. System administrator access validation
 * 6. Call monitoring session management
 */
test.describe('Call Monitoring - Live Listen', () => {
  
  test('Supervisor can start live listen on agent calls', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up Staggering Supervisor and Call Monitoring Infrastructure
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up staggering supervisor for live listen ===');
    
    // Setup supervisor context with WebRTC capabilities (matching original args)
    const supervisorContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const supervisorPage = await supervisorContext.newPage();
    
    // Login as staggering supervisor
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Staggering supervisor logged in with media permissions');
    
    // Initialize call monitoring client
    const callMonitoringClient = createCallMonitoringClient();
    
    //--------------------------------
    // Assert: Verify System Administrator Access
    //--------------------------------
    
    console.log('=== ASSERT: Verifying system administrator access ===');
    
    // Create call monitoring page instance
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    
    // Verify supervisor identity and system administrator access
    await callMonitoringPage.verifySupervisorIdentity('System Administrator');
    
    console.log('✅ System Administrator access verified for live listen');
    
    //--------------------------------
    // Act: Configure Supervisor View for Live Listen
    //--------------------------------
    
    console.log('=== ACT: Configuring supervisor view for live listen ===');
    
    // Navigate to Supervisor View
    await callMonitoringPage.navigateToSupervisorView();
    
    console.log('Supervisor View navigation completed');
    
    //--------------------------------
    // Configure Agent Filter for Live Listen
    //--------------------------------
    
    console.log('=== CONFIGURE: Setting up agent filter for live listen ===');
    
    // Configure agent filter for monitoring (matching original test workflow)
    await callMonitoringPage.configureAgentFilter();
    
    console.log('Agent filter configured for live listen monitoring');
    
    //--------------------------------
    // Verify Live Listen Interface
    //--------------------------------
    
    console.log('=== VERIFY: Confirming live listen interface availability ===');
    
    // Verify call monitoring interface is available
    await callMonitoringPage.verifyMonitoringButtonsAvailable();
    
    console.log('✅ Live listen interface verification completed');
    
    //--------------------------------
    // Start Live Listen Session
    //--------------------------------
    
    console.log('=== EXECUTE: Starting live listen session ===');
    
    // Start live listen monitoring
    await callMonitoringPage.startListen();
    
    // Verify monitoring session is active
    await callMonitoringPage.verifyMonitoringActive();
    
    console.log('✅ Live listen session started successfully');
    
    //--------------------------------
    // Live Listen Operation Verification
    //--------------------------------
    
    console.log('=== OPERATION: Verifying live listen functionality ===');
    
    // Verify current monitoring mode
    const currentMode = await callMonitoringPage.getCurrentMonitoringMode();
    expect(currentMode).toBe(CallMonitoringMode.LISTEN);
    
    console.log('✅ Live listen mode confirmed active');
    
    // Wait for listen session to be established
    await supervisorPage.waitForTimeout(5000);
    
    console.log('✅ Live listen session established and operational');
    
    //--------------------------------
    // End Live Listen Session
    //--------------------------------
    
    console.log('=== CLEANUP: Ending live listen session ===');
    
    // End monitoring session
    await callMonitoringPage.endMonitoring();
    
    console.log('Live listen session ended');
    
    //--------------------------------
    // Final Cleanup: Close contexts and reset resources
    //--------------------------------
    
    console.log('=== FINAL CLEANUP: Closing all resources ===');
    
    callMonitoringClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Live listen functionality verified successfully ===');
    console.log('✅ Staggering supervisor can start live listen');
    console.log('✅ System Administrator access confirmed');
    console.log('✅ Supervisor View configuration working');
    console.log('✅ Agent filtering setup completed');
    console.log('✅ Live listen session management functional');
    console.log('✅ Call monitoring mode verification successful');
  });
  
  /**
   * Test simplified live listen activation
   */
  test('Live listen basic activation verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup supervisor
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    // Navigate to call monitoring
    const callMonitoringPage = new SupervisorCallMonitoringPage(page);
    await callMonitoringPage.navigateToSupervisorView();
    
    // Verify live listen interface is accessible
    await callMonitoringPage.verifyMonitoringButtonsAvailable();
    
    console.log('Live listen basic activation verified');
  });
  
  /**
   * Test agent filter configuration for live listen
   */
  test('Agent filter configuration for live listen setup', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(page);
    await callMonitoringPage.navigateToSupervisorView();
    
    // Test agent filter configuration
    await callMonitoringPage.configureAgentFilter('Test Agent');
    
    // Clear filter
    await callMonitoringPage.clearAgentFilter();
    
    console.log('Agent filter configuration for live listen verified');
  });
});
