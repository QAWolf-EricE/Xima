import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Internal Assisted Transfer to UC Agent Test
 * Migrated from: tests/web_rtc_internal_call_flows/web_rtc_internal_assisted_transfer_to_uc_agent.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 14 and UC Agent 17
 * - Setup UC webphone for UC agent integration
 * - Login as WebRTC Agent 15 for internal call testing
 * - Setup supervisor monitoring for all agents
 * - Perform internal call from Agent 14 to Agent 15
 * - Transfer call from Agent 15 to UC Agent 17 via extension
 * - Verify assisted transfer completion and call states
 */
test.describe('WebRTC Internal Assisted Transfer to UC Agent', () => {

  test('web_rtc_internal_assisted_transfer_to_uc_agent', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Initiate call, then transfer call to UC user
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Wait for previous workflow in group to finish
    
    // Log in to Agent 14
    const agent14Credentials = {
      username: process.env.WEBRTCAGENT_14_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent15Credentials = {
      username: process.env.WEBRTCAGENT_15_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const ucAgent17Credentials = {
      username: process.env.UC_AGENT_17_EXT_117 || '',
      password: process.env.UC_AGENT_17_EXT_117_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 14 with skill 74
    const { agentDash: agent14Dash, agentName: agent14Name } = await webRTCClient.setupWebRTCAgent(
      agent14Credentials,
      '74' // Enable agent 1's skills
    );

    // Login as a UC Agent 17 (Xima Agent 17)
    const logInAgent = require('../../lib/node_20_helpers').logInAgent;
    const { page: ucAgentPage, browser: ucAgentBrowser } = await logInAgent({
      email: ucAgent17Credentials.username,
      password: ucAgent17Credentials.password,
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    });

    // Log into webphone for UC agent
    await page.waitForTimeout(3000);
    const logUCAgentIntoUCWebphone = require('../../lib/node_20_helpers').logUCAgentIntoUCWebphone;
    const { ucWebPhonePage: webPhonePageSecond } = await logUCAgentIntoUCWebphone(
      ucAgentBrowser,
      process.env.UC_AGENT_17_EXT_117_WEBPHONE_USERNAME,
    );
    await page.waitForTimeout(10000);

    // Toggle status on for UC Agent 17
    await ucAgentPage.bringToFront();
    const ucAgent17Client = new WebRTCClient(ucAgentPage);
    const { agentDash: ucAgent17Dash } = await ucAgent17Client.setupWebRTCAgent(
      ucAgent17Credentials,
      '72' // Toggle skills for UC agent
    );

    // Create a new context for WebRTC Agent 15
    const agent15PageInstance = await context.newPage();
    const agent15LoginPage = await LoginPage.create(agent15PageInstance);
    
    // Load the base website URL
    await agent15LoginPage.navigateTo();

    // Fill the username field with the email of WebRTC Agent 15
    await agent15PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent15Credentials.username);

    // Fill the password field with the password of WebRTC Agent 15
    await agent15PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent15Credentials.password);

    // Click the login button
    await agent15PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Setup Agent 15 with skill 73
    const agent15Client = new WebRTCClient(agent15PageInstance);
    const { agentDash: agent15Dash } = await agent15Client.setupWebRTCAgent(
      agent15Credentials,
      '73' // Enable agent 2's skills
    );

    // Clean up - end call (if any existing)
    try {
      await agent15PageInstance.locator('[data-cy="end-call-btn"]').click({ timeout: 2000 });
    } catch (err) {
      console.log(err);
    }

    // Wait for 3 seconds for the skill toggle to take effect
    await agent15PageInstance.waitForTimeout(3000);

    // Verify that agent 15's status is "Ready"
    await expect(agent15PageInstance.locator('[data-cy="channel-state-label"]')).toHaveText("Ready");

    // Verify that agent 15's voice icon color signifies readiness
    await expect(agent15PageInstance.locator('[data-cy="channel-state-channel-VOICE-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Verify that agent 15's chat icon color signifies readiness
    await expect(agent15PageInstance.locator('[data-cy="channel-state-channel-CHAT-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Create a new context for a Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // Setup supervisor monitoring for all agents
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    await supervisorViewPage.setupMultiAgentMonitoring([
      { name: 'Agent 14', number: '14' },
      { name: 'Agent 15', number: '15' },
      { name: 'Xima Agent 17', number: '17' }
    ]);

    // Verify agents are visible in supervisor view
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 14")')).toContainText("Ready");
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 15")')).toContainText("Ready");

    // ================================================================================================
    // Step 2: Agent 14 calls Agent 15
    // ================================================================================================
    
    // Bring agent 14's page to the front for interaction
    await page.bringToFront();

    const dialpadPage14 = new WebRTCDialpadPage(page);
    const callPage14 = new WebRTCCallPage(page);

    // Click the button to open active media menu
    await dialpadPage14.openNewCallDialog();

    // Input Agent 15's extension (typically 233 for agent-to-agent)
    await page.locator('[data-cy="dialpad-number"]:has-text("7P Q R S")').click(); // 7
    await page.locator('[data-cy="dialpad-number"]:has-text("3D E F")').click();   // 3
    await page.locator('[data-cy="dialpad-number"]:has-text("3D E F")').click();   // 3

    await page.waitForTimeout(3000);

    // Initiate the call
    await dialpadPage14.initiateCall();

    // Verify that connection to call recipient is being established
    await callPage14.verifyConnecting();

    // Check that Agent 15 receives an incoming call
    await agent15PageInstance.bringToFront();
    const callPage15 = new WebRTCCallPage(agent15PageInstance);
    await callPage15.waitForIncomingCall();

    // Answer call on Agent 15
    await agent15PageInstance.waitForTimeout(2000);
    await callPage15.answerCall();

    // Verify both agents are in active call
    await page.bringToFront();
    await callPage14.verifyCallActive();
    
    await agent15PageInstance.bringToFront();
    await callPage15.verifyCallActive();

    // ================================================================================================
    // Step 3: Transfer from Agent 15 to UC Agent 17
    // ================================================================================================

    // Agent 15 transfers call to UC Agent 17
    await callPage15.initiateTransfer();

    // Dial UC Agent 17's extension (117)
    await agent15PageInstance.locator('[data-cy="dialpad-number"]:has-text("1")').click();       // 1
    await agent15PageInstance.locator('[data-cy="dialpad-number"]:has-text("1")').click();       // 1  
    await agent15PageInstance.locator('[data-cy="dialpad-number"]:has-text("7P Q R S")').click(); // 7

    await agent15PageInstance.waitForTimeout(3000);
    await agent15PageInstance.locator('[data-cy="call-button"]').click();

    // Click "Assisted Transfer"
    await agent15PageInstance.waitForTimeout(2000);
    await agent15PageInstance.click(':text("Assisted Transfer")');

    // ================================================================================================
    // Assert:
    // ================================================================================================

    // Go back to UC webphone and pick up call
    await webPhonePageSecond.bringToFront();
    await webPhonePageSecond.waitForTimeout(2000);
    await webPhonePageSecond.locator('button:has(+ p:text-is("ANSWER"))').click();

    // Assert that Agent 15 sees "Complete Transfer"
    await agent15PageInstance.bringToFront();
    await expect(agent15PageInstance.locator(':text("Complete Transfer")')).toBeVisible();

    // Click "Complete Transfer" on Agent 15's page
    await agent15PageInstance.click(':text("Complete Transfer")');

    // Assert "Assisted Transfer Pending" is no longer visible on UC agent page and call is active
    await ucAgentPage.bringToFront();
    await expect(ucAgentPage.locator(':text("Assisted Transfer Pending")')).toBeHidden();
    await expect(ucAgentPage.locator(':text("Call Active")')).toBeVisible();

    // Assert "Call Ended" is visible on Agent 15 page
    await agent15PageInstance.bringToFront();
    await expect(agent15PageInstance.locator(':text("Call Ended")')).toBeVisible();

    // Clean up - end call on UC webphone
    await webPhonePageSecond.locator('[data-testid="CallEndIcon"]:visible').click();

    console.log('✅ WebRTC internal assisted transfer to UC agent workflow completed successfully');
  });
});
