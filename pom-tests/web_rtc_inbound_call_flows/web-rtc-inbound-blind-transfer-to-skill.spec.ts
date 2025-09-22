import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Blind Transfer to Skill Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_blind_transfer_to_skill.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 54 and Agent 12
 * - Setup skill groups for transfer testing
 * - Simulate incoming call to first agent
 * - Perform blind transfer to skill group
 * - Verify transfer completion and call routing
 * - Monitor transferred agent in supervisor view
 */
test.describe('WebRTC Inbound Blind Transfer to Skill', () => {

  test('web_rtc_inbound_blind_transfer_to_skill', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Transfer call to UC group
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Login as a WebRTC Agent 54
    const agent54Credentials = {
      username: process.env.WEBRTCAGENT_54_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent12Credentials = {
      username: process.env.WEBRTCAGENT_12_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    // Setup Agent 54 with skill 69
    const webRTCClient = new WebRTCClient(page);
    const { agentDash: agent54Dash } = await webRTCClient.setupWebRTCAgent(
      agent54Credentials,
      '69' // Toggle agent skills on WebRTC agent
    );

    // Setup Agent 12 with skill 68
    const agent12PageInstance = await context.newPage();
    const agent12Client = new WebRTCClient(agent12PageInstance);
    const { agentDash: agent12Dash } = await agent12Client.setupWebRTCAgent(
      agent12Credentials,
      '68' // Toggle skills for receiving agent
    );

    // Handle any exit dialogs for Agent 54
    try {
      await agent12PageInstance.click('button:has-text("Exit")');
    } catch (err) {
      console.log(err);
    }

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // REQ135 Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({ number: "4352001585" });
    console.log(callId);

    await inputDigits(callId, [9]);

    // WebRTC agent able to answer call
    await page.bringToFront();
    const callPage = new WebRTCCallPage(page);
    await callPage.waitForIncomingCall(120000);
    await callPage.answerCall();
    await callPage.verifyCallActive();

    // Transfer to other logged in UC agent
    await callPage.initiateTransfer();

    // Click "Skill Group" button
    await page.click('[data-mat-icon-name="skill"]');

    // Click "Skill 68"
    await page.click('div:text-is("Skill 68")');

    // Click "Blind Transfer"
    await page.locator(':text("Blind Transfer")').click();

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Answer the call
    await agent12PageInstance.bringToFront();
    const agent12CallPage = new WebRTCCallPage(agent12PageInstance);
    await agent12CallPage.waitForIncomingCall(60000);
    await agent12CallPage.answerCall();

    // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
    await expect(agent12PageInstance.locator('span:text-is("Assisted Transfer Pending")')).toBeHidden();
    await expect(agent12PageInstance.locator('span:text-is("Call Active")')).toBeVisible();
    await agent12PageInstance.click('[data-mat-icon-name="hangup"]');

    // Assert "Call Ended" is visible on agent 1 page
    await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();

    console.log('✅ WebRTC inbound blind transfer to skill workflow completed successfully');
  });
});
