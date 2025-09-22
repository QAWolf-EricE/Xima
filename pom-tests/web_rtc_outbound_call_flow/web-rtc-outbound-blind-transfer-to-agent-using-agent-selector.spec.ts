import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Outbound Blind Transfer to Agent Using Agent Selector Test
 * Migrated from: tests/web_rtc_outbound_call_flow/web_rtc_outbound_blind_transfer_to_agent_using_agent_selector.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 60 and Agent 61 with different skills
 * - Setup supervisor monitoring
 * - Make outbound call from Agent 60
 * - Perform blind transfer using agent selector to Agent 61
 * - Verify transfer completion and supervisor monitoring
 * - Verify call events in Cradle to Grave report
 */
test.describe('WebRTC Outbound Blind Transfer to Agent Using Agent Selector', () => {

  test('web_rtc_outbound_blind_transfer_to_agent_using_agent_selector', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as WebRTC Agent 9 & 10 (outbound call transfer direct)
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent 60
    const agent60Credentials = {
      username: process.env.WEBRTCAGENT_60_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent61Credentials = {
      username: process.env.WEBRTCAGENT_61_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 60 with skill 54
    const { agentDash: agent60Dash, agentName: agent60Name } = await webRTCClient.setupWebRTCAgent(
      agent60Credentials,
      '54' // Toggle agent 60 skills on
    );

    // Create new context and log in as WebRTC Agent 61
    const agent61PageInstance = await context.newPage();
    const agent61LoginPage = await LoginPage.create(agent61PageInstance);
    
    await agent61LoginPage.navigateTo();
    await agent61PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent61Credentials.username);
    await agent61PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent61Credentials.password);
    await agent61PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // If call in progress, hang up
    if (await agent61PageInstance.locator('[data-mat-icon-name="hangup"]').isVisible()) {
      await agent61PageInstance.click('[data-mat-icon-name="hangup"]');
    }

    // Setup Agent 61 with skill 53
    const agent61Client = new WebRTCClient(agent61PageInstance);
    const { agentDash: agent61Dash } = await agent61Client.setupWebRTCAgent(
      agent61Credentials,
      '53' // Toggle agent 61 skills on
    );

    await agent61PageInstance.waitForTimeout(10000);

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // REQ134 Toggle Agent 60 status to Ready (should already be Ready from setup)
    await page.bringToFront();
    await expect(page.locator('[data-cy="channel-state-channel-CHAT-icon"]')).toHaveCSS("color", "rgb(49, 180, 164)");

    // REQ198 Simulate an outbound call through WebRTC UI
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
    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(2000);
    await page.click('[data-cy="call-button"]');
    await page.click('span:text-is("Skill 54")');

    // REQ202 WebRTC blind transfer by Agent Name
    await callPage.initiateTransfer();
    await page.click('[role="tab"]:has([data-mat-icon-name="agent"])');
    await page.click(':text("WebRTC Agent 61")');
    await page.click(':text("Blind Transfer")');

    // REQ200 WebRTC agent can answer transfer
    await agent61PageInstance.bringToFront();
    const agent61CallPage = new WebRTCCallPage(agent61PageInstance);
    await agent61CallPage.waitForIncomingCall(60000);
    await agent61CallPage.answerCall();

    // REQ201 Supervisor can view new transferred agent is now talking
    await supervisorPageInstance.bringToFront();
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    
    await supervisorPageInstance.hover('[data-mat-icon-name="realtime-display"]');
    await supervisorPageInstance.click(':text-is("Supervisor View")');

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
    
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("WebRTC Agent 60");
    await supervisorPageInstance.waitForTimeout(1500);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"]').click();
    await supervisorPageInstance.waitForTimeout(1500);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("WebRTC Agent 61");
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

    // Assert that agent was found "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status-container:has-text("WebRTC Agent 61") [class="realtime-status-bar-container"]:has-text("Talking")')).toBeVisible();

    // Clean up - reset filter that showed all agents available
    await supervisorPageInstance.keyboard.press("Escape");
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0').click();
    await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('button.apply> span:text-is(" Apply ")').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    // See refresh dialog
    await expect(supervisorPageInstance.locator('xima-dialog:has-text("Refresh Required")')).toBeVisible();

    // Click OK
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    // REQ197 WebRTC Agent can hang up a call from the UI
    await agent61PageInstance.bringToFront();
    await agent61CallPage.endCall();
    await agent61CallPage.finishAfterCallWork();

    // Unready agents
    await agent61Dash.setStatus('Lunch');
    await page.bringToFront();
    await agent60Dash.setStatus('Lunch');

    // REQ146 Log back into Admin user and assert call correctness
    await supervisorPageInstance.bringToFront();
    await supervisorPageInstance.hover('[data-mat-icon-name="reports"]');
    await supervisorPageInstance.click('app-navigation-menu-translation:has-text("Cradle to Grave")');
    await supervisorPageInstance.click('[aria-label="Open calendar"]');
    await supervisorPageInstance.click('.mat-calendar-body-cell :text-is("1")');
    await supervisorPageInstance.click(".mat-calendar-body-today");
    await supervisorPageInstance.waitForTimeout(3000);
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
    
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("Agent 61");
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("Agent 60");
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="configure-cradle-to-grave-container-apply-button"]').click();

    // Expand last outbound call report
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await supervisorPageInstance.waitForTimeout(2000);
    
    try {
      await supervisorPageInstance.locator('mat-row:has-text("Outbound") [data-mat-icon-name="chevron-closed"] >> nth=0').click({ timeout: 3000 });
    } catch (err) {
      console.log(err);
    }
    
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Ringing");
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Talking");
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Transfer");
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Drop");

    console.log('✅ WebRTC outbound blind transfer to agent using agent selector workflow completed successfully');

    // ================================================================================================
    // Step 2. Simulate an outbound call through WebRTC UI (outbound call transfer direct)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Blind transfer by Agent Name (outbound call transfer direct)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. Supervisor can view new transferred agent is now talking (outbound call transfer direct)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 5. View Call in C2G (outbound call transfer direct)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
