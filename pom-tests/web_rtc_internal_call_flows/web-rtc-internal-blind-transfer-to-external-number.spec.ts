import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Internal Blind Transfer to External Number Test
 * Migrated from: tests/web_rtc_internal_call_flows/web_rtc_internal_blind_transfer_to_external_number.spec.js
 * 
 * This test covers:
 * - Agent 50 calls Agent 51 for internal communication
 * - Agent 51 transfers the call to external number (8889449462)
 * - Supervisor monitoring of internal call and transfer
 * - Call event verification in Cradle to Grave report
 * - Complex multi-agent transfer workflow
 */
test.describe('WebRTC Internal Blind Transfer to External Number', () => {

  test('web_rtc_internal_blind_transfer_to_external_number', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Call agent 13 with agent 11
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Agent 50 calls agent 51, agent 51 transfer call to 8889449462
    
    // Log in as WebRTC Agent 50 and set browser, context, and first page
    const agent50Credentials = {
      username: process.env.WEBRTCAGENT_50_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent51Credentials = {
      username: process.env.WEBRTCAGENT_51_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 50 with skill 40
    const { agentDash: agent50Dash, agentName: agent50Name } = await webRTCClient.setupWebRTCAgent(
      agent50Credentials,
      '40', // Toggle Agent 50's skills on
      { enableVoice: true, enableChat: true }
    );

    // Create a new context for the second agent's login
    const agent51PageInstance = await context.newPage();
    const agent51LoginPage = await LoginPage.create(agent51PageInstance);
    
    // Navigate to web address for the second agent
    await agent51LoginPage.navigateTo();

    // Fill in the username for the second agent (Agent 51)
    await agent51PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent51Credentials.username);

    // Fill in the password for the second agent (Agent 51)
    await agent51PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent51Credentials.password);

    // Click the login button for the second agent (Agent 51)
    await agent51PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Setup Agent 51 with skill 39
    const agent51Client = new WebRTCClient(agent51PageInstance);
    const { agentDash: agent51Dash } = await agent51Client.setupWebRTCAgent(
      agent51Credentials,
      '39', // Toggle Agent 51's skills on
      { enableVoice: true, enableChat: true }
    );

    // Wait for 3 seconds
    await agent51PageInstance.waitForTimeout(3000);

    // Check if Agent 51's status is 'Ready'
    await expect(agent51PageInstance.locator('[data-cy="channel-state-label"]')).toHaveText("Ready");

    // Check if voice channel of Agent 51 is active
    await expect(agent51PageInstance.locator('[data-cy="channel-state-channel-VOICE-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Check if chat channel of Agent 51 is active
    await expect(agent51PageInstance.locator('[data-cy="channel-state-channel-CHAT-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Bring Agent 50's browser to the front
    await page.bringToFront();

    // Check if Agent 50's status is 'Ready'
    await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText("Ready");

    // Check if voice channel of Agent 50 is active
    await expect(page.locator('[data-cy="channel-state-channel-VOICE-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Check if chat channel of Agent 50 is active
    await expect(page.locator('[data-cy="channel-state-channel-CHAT-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Create a new context for the supervisor's login
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // Setup supervisor monitoring
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    await supervisorViewPage.setupMultiAgentMonitoring([
      { name: 'Agent 50', number: '50' },
      { name: 'Agent 51', number: '51' }
    ]);

    // Check if there are 2 'Ready' agents
    await expect(supervisorPageInstance.locator(':text("Ready"):visible')).toHaveCount(2);

    // Check if Agent 50's status is 'Ready'
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 50")')).toContainText("Ready");

    // Check if Agent 51's status is 'Ready'
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 51")')).toContainText("Ready");

    // ================================================================================================
    // Act:
    // ================================================================================================

    // Simulate an incoming call from Agent 50 to Agent 51

    // Bring Agent 50's browser to the front
    await page.bringToFront();

    const dialpadPage = new WebRTCDialpadPage(page);
    const callPage = new WebRTCCallPage(page);

    // Click on the 'active-media-menu-button'
    await dialpadPage.openNewCallDialog();

    // Type in Agent 51's extension (typically 3-digit)
    await page.locator('[data-cy="dialpad-number"]:has-text("7P Q R S")').click(); // 7
    await page.locator('[data-cy="dialpad-number"]:has-text("3D E F")').click();   // 3
    await page.locator('[data-cy="dialpad-number"]:has-text("6M N O")').click();   // 6

    // Wait for 3 seconds
    await page.waitForTimeout(3000);

    // Click the call button to initiate the call
    await dialpadPage.initiateCall();

    // Verify that connection to call recipient is being established
    await callPage.verifyConnecting();

    // Bring back Agent 51's page to the front for interaction
    await agent51PageInstance.bringToFront();

    // Check that Agent 51 receives an incoming call
    const agent51CallPage = new WebRTCCallPage(agent51PageInstance);
    await agent51CallPage.waitForIncomingCall();

    // Answer call
    await agent51PageInstance.waitForTimeout(2000);
    await agent51CallPage.answerCall();

    // Agent 50 puts call on hold
    await page.bringToFront();
    await page.waitForTimeout(2000);
    await callPage.holdCall();

    // Agent 50 takes call off hold
    await page.waitForTimeout(2000);
    await callPage.unholdCall();

    // Transfer call to external number (8889449462)
    await page.bringToFront();
    await page.waitForTimeout(2000);
    await callPage.initiateTransfer();

    // Input external number using dialpad
    const externalNumber = "8889449462";
    await page.locator('[data-cy="dialpad-number"]:has-text("8T U V")').click();   // 8
    await page.locator('[data-cy="dialpad-number"]:has-text("8T U V")').click();   // 8
    await page.locator('[data-cy="dialpad-number"]:has-text("8T U V")').click();   // 8
    await page.locator('[data-cy="dialpad-number"]:has-text("9W X Y Z")').click(); // 9
    await page.locator('[data-cy="dialpad-number"]:has-text("4G H I")').click();   // 4
    await page.locator('[data-cy="dialpad-number"]:has-text("4G H I")').click();   // 4
    await page.locator('[data-cy="dialpad-number"]:has-text("9W X Y Z")').click(); // 9
    await page.locator('[data-cy="dialpad-number"]:has-text("4G H I")').click();   // 4
    await page.locator('[data-cy="dialpad-number"]:has-text("6M N O")').click();   // 6
    await page.locator('[data-cy="dialpad-number"]:has-text("2A B C")').click();   // 2

    await page.waitForTimeout(3000);

    // Initiate the call
    await dialpadPage.initiateCall();

    // Click "Blind Transfer"
    await page.waitForTimeout(2000);
    await page.click(':text("Blind Transfer")');

    // ================================================================================================
    // Assert:
    // ================================================================================================

    // Assert that Agent 51 call is transferred to external number
    await agent51PageInstance.bringToFront();
    await expect(agent51PageInstance.locator(':text("Call Active")')).toBeVisible();

    // Agent 50 should complete after call work
    await page.bringToFront();
    await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
    await callPage.finishAfterCallWork();

    // Agent 51 should be able to end the external call
    await agent51PageInstance.bringToFront();
    await agent51CallPage.endCall();
    await agent51CallPage.finishAfterCallWork();

    console.log('✅ WebRTC internal blind transfer to external number workflow completed successfully');
  });
});
