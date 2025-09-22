import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Hold Supervised Transfer to Agent Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_hold_supervised_transfer_to_agent.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 38 and 39 with skill 49
 * - Simulate incoming call and answer
 * - Put call on hold and take off hold
 * - Perform assisted transfer to another agent
 * - Verify transfer workflow completion
 */
test.describe('WebRTC Inbound Hold Supervised Transfer to Agent', () => {

  test('web_rtc_inbound_hold_supervised_transfer_to_agent', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Answer call as WebRTC agent and put call on hold
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent InboundCallHoldFlow
    const agent38Credentials = {
      username: process.env.WEBRTCAGENT_38_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent39Credentials = {
      username: process.env.WEBRTCAGENT_39_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 38 with skill 49
    const { agentDash: agent38Dash } = await webRTCClient.setupWebRTCAgent(
      agent38Credentials,
      '49' // Toggle Skill 49
    );

    // REQ03 Login as WebRTC Agent InboundCallHoldFlow2
    const agent39PageInstance = await context.newPage();
    const agent39Client = new WebRTCClient(agent39PageInstance);
    const { agentDash: agent39Dash } = await agent39Client.setupWebRTCAgent(
      agent39Credentials,
      '49' // Toggle skill for receiving agent
    );

    // Bring user 1 page to front
    await page.bringToFront();

    // REQ135 Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({ number: "4352551622" });
    console.log(callId);
    await page.waitForTimeout(3000);
    await inputDigits(callId, [9]);

    const callPage = new WebRTCCallPage(page);

    // REQ192 WebRTC Agent able to answer incoming call on UI
    await callPage.waitForIncomingCall(120000);
    await callPage.answerCall();

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Put call on hold
    await page.waitForTimeout(3000);
    await callPage.holdCall();

    // Take off of hold
    await page.waitForTimeout(1000);
    await callPage.unholdCall();

    // Transfer to other logged in agent
    await page.waitForTimeout(1000);
    await callPage.initiateTransfer();

    // Click "Agent" icon
    await page.click('[data-mat-icon-name="agent"]');

    // Transfer call to Agent 2
    await page.waitForTimeout(1000);
    await page.click('[aria-haspopup="menu"] div:has-text("WebRTC Agent 39")');

    // Click "Assisted Transfer"
    await page.waitForTimeout(1000);
    await page.click('[role="menuitem"]:has-text("Assisted Transfer")');

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Assert that "Assisted Transfer Attempt" is visible on Agent 2's page
    await agent39PageInstance.bringToFront();
    const agent39CallPage = new WebRTCCallPage(agent39PageInstance);
    
    await expect(agent39PageInstance.locator('xima-dialog-header:has-text("Assisted Transfer Attempt")')).toBeVisible();

    // Answer the call
    await page.waitForTimeout(3000);
    await agent39CallPage.answerCall();

    // Assert that Agent 1 sees "Complete Transfer"
    await page.bringToFront();
    await expect(page.locator('span:text-is("Complete Transfer")')).toBeVisible();

    // Click "Complete Transfer" on agent 1's page
    await page.click('span:text-is("Complete Transfer")');

    // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
    await agent39PageInstance.bringToFront();
    await expect(agent39PageInstance.locator('span:text-is("Assisted Transfer Pending")')).toBeHidden();
    await expect(agent39PageInstance.locator('span:text-is("Call Active")')).toBeVisible();

    // Assert "Call Ended" is visible on agent 1 page
    await page.bringToFront();
    await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();

    // Cleanup - Agent 2 ends call
    await agent39PageInstance.bringToFront();
    await agent39CallPage.endCall();
    await agent39CallPage.finishAfterCallWork();

    console.log('✅ WebRTC inbound hold supervised transfer to agent workflow completed successfully');
  });
});
