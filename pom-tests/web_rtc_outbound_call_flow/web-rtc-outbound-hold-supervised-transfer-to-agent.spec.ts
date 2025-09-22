import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Outbound Hold Supervised Transfer to Agent Test
 * Migrated from: tests/web_rtc_outbound_call_flow/web_rtc_outbound_hold_supervised_transfer_to_agent.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 58 and Agent 59 with different skills
 * - Make outbound call from Agent 58
 * - Test hold functionality during outbound call
 * - Verify supervisor monitoring of hold status
 * - Perform assisted transfer to Agent 59
 * - Verify transfer completion and call states
 * - Monitor agent status changes in supervisor view
 */
test.describe('WebRTC Outbound Hold Supervised Transfer to Agent', () => {

  test('web_rtc_outbound_hold_supervised_transfer_to_agent', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Simulate an outbound call through WebRTC UI (outbound call assisted transfer with hold)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Login as WebRTC Agent 58
    const agent58Credentials = {
      username: process.env.WEBRTCAGENT_58_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent59Credentials = {
      username: process.env.WEBRTCAGENT_59_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 58 with skill 43
    const { agentDash: agent58Dash, agentName: agent58Name } = await webRTCClient.setupWebRTCAgent(
      agent58Credentials,
      '43' // Toggle agent 58 skills on
    );

    // Create new context and log in as WebRTC Agent 59
    const agent59PageInstance = await context.newPage();
    const agent59LoginPage = await LoginPage.create(agent59PageInstance);
    
    await agent59LoginPage.navigateTo();
    await agent59PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent59Credentials.username);
    await agent59PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent59Credentials.password);
    await agent59PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // If call in progress, hang up
    if (await agent59PageInstance.locator('[data-mat-icon-name="hangup"]').isVisible()) {
      await agent59PageInstance.click('[data-mat-icon-name="hangup"]');
    }

    // Setup Agent 59 with skill 44
    const agent59Client = new WebRTCClient(agent59PageInstance);
    const { agentDash: agent59Dash } = await agent59Client.setupWebRTCAgent(
      agent59Credentials,
      '44' // Toggle agent 59 skills on
    );

    await agent59PageInstance.waitForTimeout(2000);

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Toggle Agent 58 status to Ready (should already be Ready from setup)
    await page.bringToFront();
    await expect(page.locator('[data-cy="channel-state-channel-VOICE-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Simulate an outbound call through WebRTC UI
    try {
      await page.click('[data-cy="end-call-btn"]', { timeout: 3000 });
    } catch (err) {
      console.log(err);
    }

    const dialpadPage = new WebRTCDialpadPage(page);
    const callPage = new WebRTCCallPage(page);

    await page.locator('[data-cy="active-media-menu-button"]').click();
    await page.click('span:has-text("New Call")');

    // Dial number to call
    await page.waitForTimeout(1600);
    try {
      await page.click(':text("Confirm")');
    } catch (err) {
      console.log(err);
    }
    await page.click("#phoneNumberInput");

    // Get phone number to make an outbound call
    const getOutBoundNumber = require('../../lib/node_20_helpers').getOutBoundNumber;
    const outboundNumberToCall = await getOutBoundNumber();
    console.log(outboundNumberToCall);

    await page.keyboard.type(`${outboundNumberToCall}`);
    await page.waitForTimeout(1600);
    await page.click('[data-cy="call-button"]');
    await page.click('span:text-is("Skill 43")');

    // Assert call active to agent 58
    await expect(page.locator('app-call-container span:has-text("Outbound Call")')).toBeVisible();
    await expect(page.locator('.dialog-body div:has-text("WebRTC Agent 58")')).toBeVisible();

    // Press hold
    await expect(page.locator('[data-cy="hold-btn"]')).toBeVisible();
    await page.waitForTimeout(5000);
    await callPage.holdCall();

    // Check that call is on hold in supervisor view
    await supervisorPageInstance.bringToFront();
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    
    await supervisorPageInstance.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
    await supervisorPageInstance.locator(':text("Supervisor View")').click();

    // Apply filter to show available agents
    await expect(async () => {
      await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();
      await supervisorPageInstance.locator('[placeholder="Select type"]').click();
      await supervisorPageInstance.locator('[role="option"] span:text-is("Agent")').click();
    }).toPass({ timeout: 120000 });

    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0').click();
    
    try {
      await expect(supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]')).not.toHaveAttribute("class", /checkbox-checked/, { timeout: 10000 });
    } catch (err) {
      await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]').evaluate((node) => node.click());
      console.error(err);
    }
    
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("WebRTC Agent 58");
    await supervisorPageInstance.waitForTimeout(1500);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"]').click();
    await supervisorPageInstance.waitForTimeout(1500);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("WebRTC Agent 59");
    await supervisorPageInstance.waitForTimeout(1500);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"]').click();

    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('button.apply> span:text-is(" Apply ")').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    // See refresh dialog
    await expect(supervisorPageInstance.locator('xima-dialog:has-text("Refresh Required")')).toBeVisible();

    // Click OK
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    // Assert that agent 58 is on hold
    await expect(supervisorPageInstance.locator('app-agent-status-container:has-text("WebRTC Agent 58") [class="realtime-status-bar-container"]:has-text("Hold")')).toBeVisible({ timeout: 120000 });

    // Take off hold
    await page.bringToFront();
    await callPage.unholdCall();

    // Check that agent 58 is talking in supervisor view
    await supervisorPageInstance.bringToFront();
    await expect(supervisorPageInstance.locator('app-agent-status-container:has-text("WebRTC Agent 58") [class="realtime-status-bar-container"]:has-text("Talking")')).toBeVisible();

    // Click transfer button
    await page.bringToFront();
    await page.waitForTimeout(1000);
    await callPage.initiateTransfer();

    // Click agent option
    await page.click('[role="tab"]:has([data-mat-icon-name="agent"])');

    // Select WebRTC agent 59
    await page.click(':text("WebRTC Agent 59")');

    // Click assisted transfer
    await page.click(':text("Assisted Transfer")');

    // Bring agent 59 page to view
    await agent59PageInstance.bringToFront();
    const agent59CallPage = new WebRTCCallPage(agent59PageInstance);

    // Assert "Assisted Transfer Attempt"
    await expect(agent59PageInstance.locator(':text("Assisted Transfer Attempt")')).toBeVisible();

    // Assert "WebRTC Agent 58" is shown
    await expect(agent59PageInstance.locator('xima-dialog-body:has-text("WebRTC Agent 58")')).toBeVisible();

    // Answer transfer call
    await agent59CallPage.answerCall();

    // Assert "Assisted Transfer Pending"
    await expect(agent59PageInstance.locator(':text("Assisted Transfer Pending")')).toBeVisible();

    // Bring agent 58 page to view
    await page.bringToFront();

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Assert connected
    await expect(page.locator('xima-call span:has-text("Connected")')).toBeVisible();
    await page.waitForTimeout(1000);

    // Assert "WebRTC Agent 59"
    await expect(page.locator('.dialog-body div:has-text("WebRTC Agent 59")')).toBeVisible();

    // Complete transfer
    await page.waitForTimeout(1000);
    await page.locator('[data-cy="complete-transfer-btn"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('xima-call span:has-text("Call Ended")')).toBeVisible();
    await expect(page.locator('.dialog-body div:has-text("WebRTC Agent 59")')).toBeVisible();

    // Verify Agent 59 has active call
    await agent59PageInstance.bringToFront();
    await expect(agent59PageInstance.locator('xima-call span:has-text("Call Active")')).toBeVisible();

    // Clean up - end call on Agent 59
    await agent59CallPage.endCall();
    await agent59CallPage.finishAfterCallWork();

    console.log('✅ WebRTC outbound hold supervised transfer to agent workflow completed successfully');
  });
});
