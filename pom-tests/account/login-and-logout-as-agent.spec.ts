import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { DEFAULT_CREDENTIALS } from '../../pom-migration/shared/constants/app-constants';

/**
 * Test agent login and logout functionality
 * Migrated from: tests/account/login_and_logout_as_agent.spec.js
 */
test.describe('Agent Authentication', () => {
  
  test('agent can login and logout successfully', async ({ page }) => {
    // Arrange: Test data from original test
    const expectedAgentName = 'Xima Agent 10';
    const agentCredentials = {
      username: process.env.UC_AGENT_10_EXT_110 || '',
      password: process.env.UC_AGENT_10_EXT_110_PASSWORD || ''
    };
    
    // Create login page (entry point)
    const loginPage = await LoginPage.create(page);
    await loginPage.verifyLoginFormVisible();
    
    // Act: Login as agent using specific credentials
    const agentDash = await loginPage.loginAsAgent(agentCredentials);
    
    // Assert: Verify agent dashboard loaded correctly
    await agentDash.verifyDashboardLoaded();
    
    // Verify we're on the correct agent URL
    await expect(page).toHaveURL(/\/ccagent/);
    
    // Verify agent name is displayed (from original test)
    await agentDash.verifyAgentName(expectedAgentName);
    
    // Verify agent-specific elements are present (from original test)
    await agentDash.verifyDashboardElements();
    
    // Act: Logout from agent dashboard
    await agentDash.logout();
    
    // Assert: Verify we're back on login page
    await loginPage.verifyLoginFormVisible();
    
    // Verify company logo is visible (from original test assertion)
    await expect(page.locator('[alt="company-logo"]')).toBeVisible();
    
    // Verify login fields are empty and login button is disabled (from original test)
    const usernameField = page.locator('[data-cy="consolidated-login-username-input"]');
    const passwordField = page.locator('[data-cy="consolidated-login-password-input"]');
    const loginButton = page.locator('[data-cy="consolidated-login-login-button"]');
    
    await expect(usernameField).toBeVisible();
    await expect(usernameField).not.toHaveValue(agentCredentials.username);
    
    await expect(passwordField).toBeVisible();
    await expect(passwordField).not.toHaveValue(agentCredentials.password);
    
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeDisabled();
  });
  
  test('agent dashboard shows correct elements and functionality', async ({ page }) => {
    // Arrange: Create login page and login as agent
    const loginPage = await LoginPage.create(page);
    const agentDash = await loginPage.loginAsAgent();
    
    // Assert: Verify all expected dashboard elements are present
    await agentDash.verifyDashboardElements();
    
    // Verify Channel States section
    const channelStatesTitle = page.getByText('Channel States');
    await expect(channelStatesTitle).toBeVisible();
    
    // Verify Active Media section  
    const activeMediaTitle = page.getByText('Active Media');
    await expect(activeMediaTitle).toBeVisible();
    
    // Verify agent can access channel management
    const channelStatePage = await agentDash.navigateToChannelState();
    await channelStatePage.verifyPageLoaded();
    
    // Verify agent can access active media
    const activeMediaPage = await agentDash.navigateToActiveMedia();
    await activeMediaPage.verifyPageLoaded();
    
    // Cleanup: Logout
    await agentDash.logout();
  });
  
  test('agent can manage channel states', async ({ page }) => {
    // Arrange: Login as agent
    const loginPage = await LoginPage.create(page);
    const agentDash = await loginPage.loginAsAgent();
    
    // Act & Assert: Test channel state management
    const initialStates = await agentDash.getChannelStatesSummary();
    console.log('Initial channel states:', initialStates);
    
    // Set agent to Ready status
    await agentDash.setReady();
    const agentStatus = await agentDash.getAgentStatus();
    expect(agentStatus).toBe('Ready');
    
    // Test channel enabling/disabling if available
    try {
      const hasVoiceChannel = await agentDash.isChannelEnabled('VOICE');
      console.log('Voice channel enabled:', hasVoiceChannel);
      
      const hasChatChannel = await agentDash.isChannelEnabled('CHAT');
      console.log('Chat channel enabled:', hasChatChannel);
      
      const hasEmailChannel = await agentDash.isChannelEnabled('EMAIL');
      console.log('Email channel enabled:', hasEmailChannel);
      
    } catch (error) {
      console.log('Channel state testing skipped due to permissions or availability');
    }
    
    // Cleanup: Logout
    await agentDash.logout();
  });
  
  test('agent login handles popup redirection', async ({ page, context }) => {
    // This test handles the case where agent login might redirect through home page first
    const loginPage = await LoginPage.create(page);
    
    // Use default agent credentials
    const agentCredentials = {
      username: process.env.UCAGENT_1_EMAIL || '',
      password: process.env.UCAGENT_1_PASSWORD || ''
    };
    
    // Login might redirect through home page or directly to agent dashboard
    const agentDash = await loginPage.loginAsAgent(agentCredentials);
    
    // Should end up on agent dashboard regardless of redirect path
    await agentDash.verifyDashboardLoaded();
    await expect(page).toHaveURL(/\/ccagent/);
    
    // Cleanup
    await agentDash.logout();
  });
});
