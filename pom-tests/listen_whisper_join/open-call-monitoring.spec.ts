import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { SupervisorCallMonitoringPage } from '../../pom-migration/pages/supervisor/supervisor-call-monitoring-page';

/**
 * Open Call Monitoring Test
 * 
 * Migrated from: tests/listen_whisper_join/open_call_monitoring.spec.js
 * 
 * This test verifies the basic call monitoring interface accessibility:
 * 1. Staggering supervisor login with media permissions
 * 2. Navigation to Realtime Displays and Supervisor View
 * 3. Agent filter configuration and setup
 * 4. Call monitoring interface availability verification
 * 5. System administrator access confirmation
 */
test.describe('Call Monitoring - Interface Access', () => {
  
  test('Supervisor can open and configure call monitoring interface', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up Staggering Supervisor with media permissions
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up staggering supervisor for call monitoring ===');
    
    // Setup supervisor context with WebRTC capabilities
    const supervisorContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const supervisorPage = await supervisorContext.newPage();
    
    // Login as staggering supervisor (special supervisor type for call monitoring)
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('Staggering supervisor logged in for call monitoring');
    
    //--------------------------------
    // Assert: Verify System Administrator Access
    //--------------------------------
    
    console.log('=== ASSERT: Verifying system administrator access ===');
    
    // Create call monitoring page instance
    const callMonitoringPage = new SupervisorCallMonitoringPage(supervisorPage);
    
    // Verify supervisor identity and system administrator access
    await callMonitoringPage.verifySupervisorIdentity('System Administrator');
    
    console.log('✅ System Administrator access verified');
    
    //--------------------------------
    // Act: Navigate to Call Monitoring Interface
    //--------------------------------
    
    console.log('=== ACT: Opening call monitoring interface ===');
    
    // Navigate to Supervisor View for call monitoring
    await callMonitoringPage.navigateToSupervisorView();
    
    console.log('Call monitoring interface navigation completed');
    
    //--------------------------------
    // Configure Call Monitoring Setup
    //--------------------------------
    
    console.log('=== CONFIGURE: Setting up agent filtering and monitoring ===');
    
    // Configure agent filter for call monitoring
    await callMonitoringPage.configureAgentFilter();
    
    console.log('Agent filter configuration completed');
    
    //--------------------------------
    // Verify Call Monitoring Interface
    //--------------------------------
    
    console.log('=== VERIFY: Confirming call monitoring interface availability ===');
    
    // Verify call monitoring buttons and interface are available
    await callMonitoringPage.verifyMonitoringButtonsAvailable();
    
    console.log('✅ Call monitoring interface verification completed');
    
    // Verify page is ready for call monitoring operations
    await callMonitoringPage.verifyPageLoaded();
    
    console.log('✅ Call monitoring page fully loaded and configured');
    
    //--------------------------------
    // Cleanup: Close supervisor context
    //--------------------------------
    
    console.log('=== CLEANUP: Closing supervisor session ===');
    
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Call monitoring interface access verified ===');
    console.log('✅ Staggering supervisor can access call monitoring');
    console.log('✅ System Administrator permissions confirmed');
    console.log('✅ Realtime Displays navigation working');
    console.log('✅ Supervisor View configuration accessible');
    console.log('✅ Agent filtering interface available');
    console.log('✅ Call monitoring buttons present and functional');
  });
  
  /**
   * Test call monitoring interface elements verification
   */
  test('Call monitoring interface elements are properly accessible', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup supervisor
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    // Navigate to call monitoring
    const callMonitoringPage = new SupervisorCallMonitoringPage(page);
    await callMonitoringPage.navigateToSupervisorView();
    
    // Verify interface elements
    await callMonitoringPage.verifyPageLoaded();
    await callMonitoringPage.verifyMonitoringButtonsAvailable();
    
    console.log('Call monitoring interface elements verification completed');
  });
  
  /**
   * Test supervisor access permissions for call monitoring
   */
  test('Supervisor access permissions verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    
    const callMonitoringPage = new SupervisorCallMonitoringPage(page);
    
    // Verify supervisor has proper access
    await callMonitoringPage.verifySupervisorIdentity('System Administrator');
    
    // Verify can access realtime displays
    await callMonitoringPage.verifyPageLoaded();
    
    console.log('Supervisor access permissions verified');
  });
});
