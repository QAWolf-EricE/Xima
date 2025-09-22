import { test, expect } from '@playwright/test';
import { PortalLoginPage, PortalAccountType } from '../../pom-migration/pages/auth/portal-login-page';

/**
 * Login Portal - Agent Test
 * 
 * Migrated from: tests/login_portal/login_portal_login_with_agent.spec.js
 * 
 * This test verifies portal agent authentication and interface access:
 * 1. Portal agent login with agent-specific credentials
 * 2. Agent interface verification (Channel States, Active Media)
 * 3. Agent name display and identity verification
 * 4. Agent logout menu accessibility
 * 5. Portal agent logout functionality and cleanup
 */
test.describe('Portal Authentication - Agent Access', () => {
  
  test('Portal agent can login and access agent-specific interface', async ({ page }) => {
    //--------------------------------
    // Arrange: Set up portal agent login
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up portal agent login ===');
    
    // Test constants (matching original test exactly)
    const accountType = PortalAccountType.AGENT;
    const expectedAgentName = "Keith Agent";
    
    console.log(`Portal agent test starting for account: ${accountType}`);
    console.log(`Expected agent name: ${expectedAgentName}`);
    
    //--------------------------------
    // Act: Login as Portal Agent
    //--------------------------------
    
    console.log('=== ACT: Logging in as portal agent ===');
    
    // Create portal login page and login as agent
    const portalLoginPage = await PortalLoginPage.create(page);
    const agentDashboard = await portalLoginPage.loginAsPortalAgent();
    
    console.log('Portal agent login completed');
    
    //--------------------------------
    // Assert: Verify Agent Interface Access
    //--------------------------------
    
    console.log('=== ASSERT: Verifying agent interface access ===');
    
    // Verify agent dashboard loaded with agent-specific interface
    await agentDashboard.verifyAgentDashboardLoaded();
    
    console.log('✅ Agent dashboard loaded successfully');
    
    // Verify agent name is displayed correctly in avatar container
    await agentDashboard.verifyAgentName(expectedAgentName);
    
    console.log(`✅ Agent name verified: ${expectedAgentName}`);
    
    //--------------------------------
    // Verify Agent-Specific Interface Elements
    //--------------------------------
    
    console.log('=== VERIFICATION: Confirming agent-specific interface elements ===');
    
    // Verify Channel States section is visible (agent-specific functionality)
    const channelStatesSection = page.getByText('Channel States');
    await expect(channelStatesSection).toBeVisible();
    
    console.log('✅ Channel States section verified');
    
    // Verify Active Media section is visible (agent-specific functionality)
    const activeMediaSection = page.getByText('Active Media');
    await expect(activeMediaSection).toBeVisible();
    
    console.log('✅ Active Media section verified');
    
    //--------------------------------
    // Verify Agent Status Menu and Logout Access
    //--------------------------------
    
    console.log('=== MENU: Verifying agent status menu and logout access ===');
    
    // Access agent logout menu
    await agentDashboard.accessLogoutMenu();
    
    console.log('✅ Agent status menu and logout access verified');
    
    //--------------------------------
    // Verify Agent User Identity
    //--------------------------------
    
    console.log('=== IDENTITY: Verifying agent user identity in portal ===');
    
    // Note: Agent portal may have different identity display than admin/supervisor
    // The agent name is verified through the avatar container rather than user menu
    
    console.log(`✅ Agent identity verified through interface: ${expectedAgentName}`);
    
    //--------------------------------
    // Cleanup: Portal Agent Logout
    //--------------------------------
    
    console.log('=== CLEANUP: Logging out from portal agent ===');
    
    try {
      // Perform agent logout
      await agentDashboard.logout();
      
      console.log('✅ Portal agent logout successful');
      
      // Verify return to login page with company logo
      await portalLoginPage.verifyLoginFormVisible();
      
      console.log('✅ Returned to portal login page after logout');
      
    } catch (error) {
      console.warn('Portal agent logout encountered issues:', error.message);
      
      // Report cleanup failure (matching original test pattern)
      console.error('Cleanup failed - could not log out as agent:', error.message);
      throw error;
    }
    
    console.log('=== TEST COMPLETED: Portal agent access verified successfully ===');
    console.log('✅ Portal agent can login with agent credentials');
    console.log('✅ Agent-specific interface elements accessible');
    console.log('✅ Channel States and Active Media sections available');
    console.log('✅ Agent status menu and logout functionality working');
    console.log('✅ Agent portal workflow validation complete');
  });
  
  /**
   * Test portal agent interface elements verification
   */
  test('Portal agent interface elements are properly accessible', async ({ page }) => {
    // Simplified agent interface test
    const portalLoginPage = await PortalLoginPage.create(page);
    const agentDashboard = await portalLoginPage.loginAsPortalAgent();
    
    // Verify agent-specific elements
    await agentDashboard.verifyAgentDashboardLoaded();
    await agentDashboard.verifyAgentName('Keith Agent');
    
    console.log('Portal agent interface elements verification completed');
  });
  
  /**
   * Test portal agent logout workflow
   */
  test('Portal agent logout workflow verification', async ({ page }) => {
    const portalLoginPage = await PortalLoginPage.create(page);
    const agentDashboard = await portalLoginPage.loginAsPortalAgent();
    
    // Test agent logout menu access
    await agentDashboard.accessLogoutMenu();
    
    // Test logout functionality
    await agentDashboard.logout();
    
    // Verify return to login
    await portalLoginPage.verifyLoginFormVisible();
    
    console.log('Portal agent logout workflow verification completed');
  });
});

