import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Hold Supervised Transfer to DID Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_hold_supervised_transfer_to_did.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 36 and 37 with different skills
 * - Simulate incoming call and answer
 * - Put call on hold and take off hold
 * - Perform assisted transfer via DID/extension dialing
 * - Verify transfer workflow and completion
 */
test.describe('WebRTC Inbound Hold Supervised Transfer to DID', () => {

  test('web_rtc_inbound_hold_supervised_transfer_to_did', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Put call on hold, transfer via DID
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent InboundCallHoldFlow
    const agent36Credentials = {
      username: process.env.WEBRTCAGENT_36_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent37Credentials = {
      username: process.env.WEBRTCAGENT_37_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 36 with skill 48
    const { agentDash: agent36Dash } = await webRTCClient.setupWebRTCAgent(
      agent36Credentials,
      '48' // Toggle Skill 48
    );

    // REQ03 Login as WebRTC Agent InboundCallHoldFlow2
    const agent37PageInstance = await context.newPage();
    const agent37Client = new WebRTCClient(agent37PageInstance);
    
    // Setup Agent 37 with all skills
    const agent37LoginPage = await LoginPage.create(agent37PageInstance);
    const agent37Dash = await agent37LoginPage.loginAsAgent(agent37Credentials);
    
    // Enable all skills for agent 37
    const toggleOnAllSkills = require('../../lib/node_20_helpers').toggleOnAllSkills;
    await agent37PageInstance.bringToFront();
    await toggleOnAllSkills(agent37PageInstance);
    await agent37Dash.setReady();

    // Bring user 1 page to front
    await page.bringToFront();

    // REQ135 Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({ number: "4352551622" });
    console.log(callId);
    await page.waitForTimeout(3000);
    await inputDigits(callId, [8]);

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

    const dialpadPage = new WebRTCDialpadPage(page);

    // Dial "ext<agentExtension>" (713 for Agent 37)
    await page.locator('[data-cy="dialpad-number"]:has-text("7P Q R S")').click();
    await page.locator('[data-cy="dialpad-number"]:has-text("1")').click();
    await page.locator('[data-cy="dialpad-number"]:has-text("3D E F")').click();
    await page.click('[data-cy="call-button"]');

    // Click "Assisted Transfer"
    await page.waitForTimeout(1000);
    await page.click('[role="menuitem"]:has-text("Assisted Transfer")');

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Assert that "Assisted Transfer Attempt" is visible on Agent 2's page
    await agent37PageInstance.bringToFront();
    const agent37CallPage = new WebRTCCallPage(agent37PageInstance);
    
    await expect(agent37PageInstance.locator('xima-dialog-header:has-text("Assisted Transfer Attempt")')).toBeVisible();

    // Answer the call
    await page.waitForTimeout(3000);
    await agent37CallPage.answerCall();

    // Assert that Agent 1 sees "Complete Transfer"
    await page.bringToFront();
    await expect(page.locator('span:text-is("Complete Transfer")')).toBeVisible();

    // Click "Complete Transfer" on agent 1's page
    await page.click('span:text-is("Complete Transfer")');

    // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
    await agent37PageInstance.bringToFront();
    await expect(agent37PageInstance.locator('span:text-is("Assisted Transfer Pending")')).toBeHidden();
    await expect(agent37PageInstance.locator('span:text-is("Call Active")')).toBeVisible();

    // Assert "Call Ended" is visible on agent 1 page
    await page.bringToFront();
    await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();

    // Cleanup - Agent 2 ends call
    await agent37PageInstance.bringToFront();
    await agent37CallPage.endCall();
    await agent37CallPage.finishAfterCallWork();

    console.log('✅ WebRTC inbound hold supervised transfer to DID workflow completed successfully');
  });
});
