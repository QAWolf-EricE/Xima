import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Blind Transfer to Skill Using Skill Selector Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_blind_transfer_to_skill_using_skill_selector.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 45 and 46 with skill 58
 * - Setup supervisor monitoring for both agents
 * - Simulate incoming call and answer by Agent 45
 * - Perform blind transfer to skill using skill selector
 * - Verify Agent 46 receives transferred call
 * - Monitor agent status changes in supervisor view
 * - Verify call events in Cradle to Grave report
 */
test.describe('WebRTC Inbound Blind Transfer to Skill Using Skill Selector', () => {

  test('web_rtc_inbound_blind_transfer_to_skill_using_skill_selector', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as WebRTC Agent 6 & 7 (skill group)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent 45
    const agent45Credentials = {
      username: process.env.WEBRTCAGENT_45_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent46Credentials = {
      username: process.env.WEBRTCAGENT_46_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 45 with skill 58
    const { agentDash: agent45Dash, agentName: agent45Name } = await webRTCClient.setupWebRTCAgent(
      agent45Credentials,
      '58' // Toggle agent 45 skills on
    );

    // Create new context and log in as WebRTC Agent 46
    const agent46PageInstance = await context.newPage();
    const agent46LoginPage = await LoginPage.create(agent46PageInstance);
    
    await agent46LoginPage.navigateTo();
    await agent46PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent46Credentials.username);
    await agent46PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent46Credentials.password);
    await agent46PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Setup Agent 46 with skill 58
    const agent46Client = new WebRTCClient(agent46PageInstance);
    const { agentDash: agent46Dash } = await agent46Client.setupWebRTCAgent(
      agent46Credentials,
      '58' // Toggle agent 46 skills on
    );

    // Verify Agent 46 channels are ready
    await agent46PageInstance.waitForTimeout(2000);
    try {
      await expect(agent46PageInstance.locator('[data-cy="channel-state-channel-VOICE-icon"]')).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
      await agent46PageInstance.click('[data-cy="channel-state-channel-VOICE"]', { force: true, delay: 500 });
    } catch (err) {
      console.log(err);
    }
    try {
      await expect(agent46PageInstance.locator('[data-cy="channel-state-channel-CHAT-icon"]')).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
      await agent46PageInstance.click('[data-cy="channel-state-channel-CHAT"]', { force: true, delay: 500 });
    } catch (err) {
      console.log(err);
    }
    
    await expect(agent46PageInstance.locator('[data-cy="channel-state-channel-VOICE-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");
    await expect(agent46PageInstance.locator('[data-cy="channel-state-channel-CHAT-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // REQ134 Toggle Agent status to Ready
    await page.bringToFront();
    // Agent should already be Ready from setup

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // REQ135 Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({ number: "4352551623" });
    await page.waitForTimeout(3000);
    await inputDigits(callId, [8]);
    let phoneNumber = await page.innerText('[data-cy="alert-incoming-call-calling-number"]');

    const callPage = new WebRTCCallPage(page);

    // REQ192 WebRTC Agent able to answer incoming call on UI
    await callPage.waitForIncomingCall(120000);
    await callPage.answerCall();

    // REQ203 WebRTC blind transfer by Skill Group
    await page.waitForTimeout(1000);
    await callPage.initiateTransfer();
    await page.waitForTimeout(1000);
    
    await page.click('[role="tab"]:has([svgicon="app:skill"]), button:has-text("Blind transfer")');
    await page.waitForTimeout(1000);
    await page.click('.item-list-item :text("Skill 58"), [role="tab"]:has([svgicon="app:skill"])');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Blind transfer"), .item-list-item :text("Skill 58")');
    await page.waitForTimeout(1000);
    
    try {
      await page.click('button:has-text("Blind transfer")', { timeout: 5000 });
    } catch (e) {
      console.error(e);
    }

    // REQ200 WebRTC agent can answer transfer
    await agent46PageInstance.bringToFront();
    const agent46CallPage = new WebRTCCallPage(agent46PageInstance);
    await agent46CallPage.waitForIncomingCall(60000);
    await agent46CallPage.answerCall();

    // Transfer to skill fully removes transferring agent
    await page.bringToFront();
    await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
    await callPage.finishAfterCallWork();
    await page.click('[data-cy="alert-after-call-work-done"]');
    await expect(page.locator("text=Phone not available")).not.toBeVisible();
    
    await agent46PageInstance.bringToFront();
    await expect(agent46PageInstance.locator('[data-cy="end-call-btn"]')).toBeVisible();

    // REQ201 Supervisor can view new transferred agent is now talking
    await supervisorPageInstance.bringToFront();
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    await supervisorViewPage.navigateToSupervisorView();

    // Apply filter to show available agents
    await expect(async () => {
      await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();
      await supervisorPageInstance.locator('[placeholder="Select type"] >> nth=0').click();
      await supervisorPageInstance.locator('[role="option"] :text-is("Agent")').click();
    }).toPass({ timeout: 120000 });
    
    await supervisorPageInstance.click('[data-mat-icon-name="filter"]');
    await supervisorPageInstance.click('[data-mat-icon-name="edit"]');
    await supervisorPageInstance.waitForTimeout(2000);

    // Uncheck select all agents
    const allAgents = supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]');
    await allAgents.uncheck();

    // Search for WebRTC Agent 46
    await supervisorPageInstance.getByPlaceholder(' Search Agents ').fill('WebRTC Agent 46');
    await expect(supervisorPageInstance.locator('[role="option"] :text("WebRTC Agent 46")')).toBeVisible();

    // Check select all agents
    await allAgents.check();

    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('button.apply> span:text-is(" Apply ")').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    // See refresh dialog
    await expect(supervisorPageInstance.locator('xima-dialog:has-text("Refresh Required")')).toBeVisible();

    // Click OK
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    // Assert that agent was found "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status-container:has-text("WebRTC Agent 46")')).toContainText("Talking (Skill 58)", { timeout: 60000 });

    // Clean up - reset filter that showed all agents available
    await supervisorPageInstance.keyboard.press("Escape");
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0').click();
    await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('button.apply> span:text-is(" Apply ")').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    // REQ197 WebRTC Agent can hang up a call from the UI
    await agent46PageInstance.bringToFront();

    try {
      await agent46CallPage.endCall();
      await agent46CallPage.finishAfterCallWork();
    } catch (err) {
      console.log(err);
    }

    // Unready agents
    await agent46Dash.setStatus('Break');
    await page.bringToFront();
    await agent45Dash.setStatus('Break');

    // REQ146 Log back into Admin user and assert call correctness
    await supervisorPageInstance.bringToFront();
    
    // See refresh dialog
    await expect(supervisorPageInstance.locator('xima-dialog:has-text("Refresh Required")')).toBeVisible();
    
    // Click OK
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.hover('[data-cy="sidenav-menu-REPORTS"]');
    await supervisorPageInstance.click(':text("Cradle to Grave")');
    await supervisorPageInstance.click('[aria-label="Open calendar"]');
    await supervisorPageInstance.click('.mat-calendar-body-cell :text-is("1")');
    await page.waitForTimeout(500);
    await supervisorPageInstance.click(".mat-calendar-body-today");
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.click('[data-cy="configure-cradle-to-grave-container-apply-button"]');

    // Include filter to have unique agent to avoid collisions
    await supervisorPageInstance.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
    
    try {
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    } catch {
      await supervisorPageInstance.locator('xima-header-add').getByRole('button').click();
      await supervisorPageInstance.locator('[data-cy="xima-criteria-selector-search-input"]').fill('Agent');
      await supervisorPageInstance.getByText('Agent', { exact: true }).click();
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    }
    
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("Agent 45");
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("Agent 46");
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
    await supervisorPageInstance.waitForTimeout(3000);
    await supervisorPageInstance.locator('[data-cy="configure-cradle-to-grave-container-apply-button"]').click();

    // Expand last inbound call report
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME")');
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME")');
    await supervisorPageInstance.waitForTimeout(2000);
    
    await supervisorPageInstance.locator(`mat-row:has-text("Inbound"):has-text("${phoneNumber}") [data-mat-icon-name="chevron-closed"] >> nth=0`).scrollIntoView();
    await supervisorPageInstance.click(`mat-row:has-text("Inbound"):has-text("${phoneNumber}") [data-mat-icon-name="chevron-closed"] >> nth=0`);

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Transfer");
    await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Talking");
    await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Drop");

    console.log('✅ WebRTC inbound blind transfer to skill using skill selector workflow completed successfully');

    // ================================================================================================
    // Step 2. Simulate an incoming call (skill group)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Answer Call (skill group)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. Blind Transfer (skill group)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 5. Supervisor can view new transferred agent is now talking (skill group)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 6. View Call in C2G (skill group)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
