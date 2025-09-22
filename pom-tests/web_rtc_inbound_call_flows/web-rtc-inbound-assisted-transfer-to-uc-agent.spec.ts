import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Assisted Transfer to UC Agent Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_assisted_transfer_to_uc_agent.spec.js
 * 
 * This test covers:
 * - Login as UC Agent (Xima Agent 7) and WebRTC Agent 16
 * - Setup UC webphone for UC agent
 * - Simulate incoming call to WebRTC agent
 * - Perform assisted transfer to UC agent via extension
 * - Verify transfer completion and call states
 */
test.describe('WebRTC Inbound Assisted Transfer to UC Agent', () => {

  test('web_rtc_inbound_assisted_transfer_to_uc_agent', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Transfer via UC extension
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Login as a UC Agent (Xima Agent 7)
    const ucAgentCredentials = {
      username: process.env.UC_AGENT_7_EXT_107 || '',
      password: process.env.UC_AGENT_7_EXT_107_PASSWORD || ''
    };
    const webRTCAgentCredentials = {
      username: process.env.WEBRTCAGENT_16_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    // Login UC Agent using legacy helper
    const logInAgent = require('../../lib/node_20_helpers').logInAgent;
    const { page: ucAgentPage, browser: ucAgentBrowser } = await logInAgent({
      email: ucAgentCredentials.username,
      password: ucAgentCredentials.password,
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    });

    // Log in as WebRTC Agent
    const webRTCClient = new WebRTCClient(page);
    const { agentDash: webRTCAgentDash, agentName: webRTCAgentName } = await webRTCClient.setupWebRTCAgent(
      webRTCAgentCredentials,
      '23' // Toggle agent skills on WebRTC agent
    );

    // Wait and log into webphone for UC agent
    await page.waitForTimeout(3000);
    const logUCAgentIntoUCWebphone = require('../../lib/node_20_helpers').logUCAgentIntoUCWebphone;
    const { ucWebPhonePage: webPhonePageSecond } = await logUCAgentIntoUCWebphone(
      ucAgentBrowser,
      process.env.UC_AGENT_7_EXT_107_WEBPHONE_USERNAME,
    );
    await page.waitForTimeout(10000);

    // Toggle Xima Agent 7 status to Ready
    await ucAgentPage.bringToFront();
    const ucAgentClient = new WebRTCClient(ucAgentPage);
    const { agentDash: ucAgentDash } = await ucAgentClient.setupWebRTCAgent(
      ucAgentCredentials,
      '24' // Toggle skill for UC agent
    );

    // Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({
      number: "4352437431",
    });
    console.log(callId);

    await page.waitForTimeout(3000);
    await inputDigits(callId, [3]);

    // WebRTC agent able to answer call
    await page.bringToFront();
    const callPage = new WebRTCCallPage(page);
    await callPage.waitForIncomingCall(120000);
    await callPage.answerCall();
    await callPage.verifyCallActive();

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Transfer to other logged in UC agent
    const dialpadPage = new WebRTCDialpadPage(page);
    
    await callPage.initiateTransfer();

    // Dial Xima Agent 4 extension
    await page.click('[data-cy="dialpad-number"]:text-is("1")');
    await page.click('[data-cy="dialpad-number"]:text-is("0")');
    await page.click('[data-cy="dialpad-number"]:text-is("7")');
    await page.click('[data-cy="call-button"]');

    // Click "Assisted Transfer"
    await page.click(':text-is(" Assisted Transfer ")');

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Go back to webphone and pick up call
    await webPhonePageSecond.bringToFront();
    await webPhonePageSecond.waitForTimeout(2000);
    await webPhonePageSecond.locator('button:has(+ p:text-is("ANSWER"))').click();

    // Assert that Agent 1 sees "Complete Transfer"
    await page.bringToFront();
    await expect(page.locator('span:text-is("Complete Transfer")')).toBeVisible();

    // Click "Complete Transfer" on agent 1's page
    await page.click('span:text-is("Complete Transfer")');

    // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
    await ucAgentPage.bringToFront();
    await expect(ucAgentPage.locator('span:text-is("Assisted Transfer Pending")')).toBeHidden();
    await expect(ucAgentPage.locator('span:text-is("Call Active")')).toBeVisible();

    // Assert "Call Ended" is visible on agent 1 page
    await page.bringToFront();
    await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();

    // Cleanup
    await webPhonePageSecond.locator('[data-testid="CallEndIcon"]:visible').click();

    console.log('✅ WebRTC inbound assisted transfer to UC agent workflow completed successfully');
  });
});
