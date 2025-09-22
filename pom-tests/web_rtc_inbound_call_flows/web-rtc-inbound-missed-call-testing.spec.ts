import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Missed Call Testing
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_missed_call_testing.spec.js
 * 
 * This test covers:
 * - Login as Agent 17 and Agent 18 to prepare for incoming call testing
 * - Simulate incoming call for skill-based routing
 * - Agent 17 misses the call
 * - Agent 18 picks up the call and completes it
 * - Verify missed call timeout and call forwarding
 */
test.describe('WebRTC Inbound Missed Call Testing', () => {

  test('web_rtc_inbound_missed_call_testing', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Simulate incoming call (miss call testing)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Log in as Agent 17 and Agent 18 to prepare for incoming call testing
    
    // Log in as Agent 17 and get browser, context, and page
    const agent17Credentials = {
      username: process.env.WEBRTCAGENT_17_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent18Credentials = {
      username: process.env.WEBRTCAGENT_18_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup Agent 17 with skill 35
    const { agentDash: agent17Dash, agentName: agent17Name } = await webRTCClient.setupWebRTCAgent(
      agent17Credentials,
      '35' // Toggle on skill "35" for Agent 17
    );

    // Create a new context and page for Agent 18
    const agent18PageInstance = await context.newPage();
    const agent18LoginPage = await LoginPage.create(agent18PageInstance);
    
    // Login Agent 18
    await agent18LoginPage.navigateTo();
    await agent18PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent18Credentials.username);
    await agent18PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent18Credentials.password);
    await agent18PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Setup Agent 18 with skill 35
    const agent18Client = new WebRTCClient(agent18PageInstance);
    const { agentDash: agent18Dash } = await agent18Client.setupWebRTCAgent(
      agent18Credentials,
      '35' // Toggle on skill "35" for Agent 18
    );

    // Wait for 1 second
    await agent18PageInstance.waitForTimeout(1000);

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Simulate an incoming call for Agent 17
    
    // Bring Agent 17's page to the front
    await page.bringToFront();

    // Agent 17 should already be Ready from setup
    await page.waitForTimeout(2000);

    // Create call for skill 35
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    await expect(async () => {
      let callId = await createCall({
        number: "4352551621"
      });
      console.log("CALL ID: " + callId);
      await inputDigits(callId, [5]);
      await expect(page.locator('[data-cy="alert-incoming-call-calling-number"]')).toBeVisible();
    }).toPass({ timeout: 240000 });

    const callPage = new WebRTCCallPage(page);

    // Get the phone number of the caller
    const phoneNumber = await page.innerText('[data-cy="alert-incoming-call-calling-number"]');

    // Click the "Miss Call" button
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Miss Call")');

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Verify that Agent 17 misses the call and Agent 18 picks it up and hangs up
    
    // Assert that the call has been missed by Agent 17
    await expect(page.locator("text=Missed Call Timeout")).toBeVisible();

    // Bring Agent 18's page to the front
    await page.waitForTimeout(1000);
    await agent18PageInstance.bringToFront();

    const agent18CallPage = new WebRTCCallPage(agent18PageInstance);

    // Click the "Answer Call" button for Agent 18
    await agent18PageInstance.waitForTimeout(1000);
    await agent18CallPage.waitForIncomingCall(60000);
    await agent18CallPage.answerCall();

    // Assert that the call was answered by Agent 18
    await expect(agent18PageInstance.locator('xima-dialog')).toBeVisible();

    // Wait 15 seconds as in original test
    await agent18PageInstance.waitForTimeout(15000);

    // Click the "End Call" button for Agent 18
    await agent18CallPage.endCall();

    // Assert After Call work timer is visible
    await expect(agent18PageInstance.locator('[data-cy="alert-after-call-work-title"]')).toBeVisible();
    await expect(agent18PageInstance.locator("text=After Call Work")).toBeVisible();

    // Click the "Finish" button for Agent 18
    await agent18PageInstance.waitForTimeout(1000);
    await agent18CallPage.finishAfterCallWork();

    console.log('✅ WebRTC inbound missed call testing workflow completed successfully');

    // ================================================================================================
    // Step 2. Reject call (miss call testing)
    // ================================================================================================
    // Note: This step is completed above with the "Miss Call" button
    
    // ================================================================================================
    // Step 3. Pick up and hang up call as second agent (miss call testing)
    // ================================================================================================
    // Note: This step is completed above with Agent 18 handling the call
  });
});
