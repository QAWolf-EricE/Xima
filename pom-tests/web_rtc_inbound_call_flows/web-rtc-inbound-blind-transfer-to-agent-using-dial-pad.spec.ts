import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Blind Transfer to Agent Using Dial Pad Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_blind_transfer_to_agent_using_dial_pad.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 5 and Agent 6 in separate contexts
 * - Setup supervisor monitoring
 * - Simulate incoming call and answer by Agent 5
 * - Perform blind transfer using dial pad to Agent 6
 * - Verify transfer completion and supervisor monitoring
 * - Verify call events in Cradle to Grave report
 */
test.describe('WebRTC Inbound Blind Transfer to Agent Using Dial Pad', () => {

  test('web_rtc_inbound_blind_transfer_to_agent_using_dial_pad', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as WebRTC Agent 14 & 2 (dial pad)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent 5
    const agent5Credentials = {
      username: process.env.WEBRTCAGENT_5_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent6Credentials = {
      username: process.env.WEBRTCAGENT_6_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 5 with skill 33
    const { agentDash: agent5Dash, agentName: agent5Name } = await webRTCClient.setupWebRTCAgent(
      agent5Credentials,
      '33' // Toggle agent 5 skills on
    );

    // Create new context and log in as WebRTC Agent 6
    const agent6PageInstance = await context.newPage();
    const agent6LoginPage = await LoginPage.create(agent6PageInstance);
    
    await agent6LoginPage.navigateTo();
    await agent6PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent6Credentials.username);
    await agent6PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent6Credentials.password);
    await agent6PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Setup Agent 6 with skill 33
    const agent6Client = new WebRTCClient(agent6PageInstance);
    const { agentDash: agent6Dash } = await agent6Client.setupWebRTCAgent(
      agent6Credentials,
      '33' // Toggle agent 6 skills on
    );

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // Focus Agent 5
    await page.bringToFront();

    // REQ135 Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({
      number: "4352551621",
    });
    console.log("CALL ID: " + callId);
    await page.waitForTimeout(3000);
    await inputDigits(callId, [3]);

    const callPage = new WebRTCCallPage(page);
    const dialpadPage = new WebRTCDialpadPage(page);

    // REQ192 WebRTC Agent able to answer incoming call on UI
    await callPage.waitForIncomingCall(300000); // 5 minutes timeout
    await callPage.answerCall();
    await callPage.verifyCallActive();

    // REQ199 WebRTC blind transfer by dial pad
    await callPage.initiateTransfer();
    await page.waitForTimeout(1000);
    await page.keyboard.type("208");
    await page.waitForTimeout(1000);
    await page.locator('[data-cy="call-button"]').click();
    await page.click(':text("Blind Transfer")');
    await page.waitForTimeout(1000);

    // REQ200 WebRTC agent can answer transfer
    await agent6PageInstance.bringToFront();
    const agent6CallPage = new WebRTCCallPage(agent6PageInstance);
    await agent6CallPage.waitForIncomingCall(60000);
    await agent6CallPage.answerCall();

    // After call agent's phone is available
    await page.bringToFront();
    await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
    await page.waitForTimeout(5000);
    await callPage.finishAfterCallWork();
    await page.locator('[data-cy="alert-after-call-work-done"]').click();
    await expect(page.locator("text=Phone not available")).not.toBeVisible();

    // REQ201 Supervisor can view new transferred agent is now talking
    await supervisorPageInstance.bringToFront();
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    
    await supervisorViewPage.navigateToSupervisorView();

    // Apply filter to show available agents
    await supervisorPageInstance.click('[data-mat-icon-name="filter"]');
    await supervisorPageInstance.click('[data-mat-icon-name="edit"]');
    await supervisorPageInstance.waitForTimeout(4000);
    
    if (await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"] input').isChecked()) {
      await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    }
    await supervisorPageInstance.waitForTimeout(3000);

    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill('WebRTC Agent 6');

    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"] div >> nth=0').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('button.apply> span:text-is(" Apply ")').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    // See refresh dialog
    await expect(supervisorPageInstance.locator('xima-dialog:has-text("Refresh Required")')).toBeVisible();

    // Click OK
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    // Scroll agent into view
    let attempts = 0;
    await supervisorPageInstance.click('[class="realtime-status-main-container"]');
    if (!(await supervisorPageInstance.locator('.agent-status-fullname:has-text("WebRTC Agent 6")').isVisible())) {
      while (!(await supervisorPageInstance.locator('.agent-status-fullname:has-text("WebRTC Agent 6")').isVisible()) && attempts < 50) {
        await supervisorPageInstance.keyboard.press("PageDown");
        await supervisorPageInstance.waitForTimeout(2000);
        attempts += 1;
      }
    }

    // Assert that agent was found "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status-container:has-text("WebRTC Agent 6")').first()).toContainText("Talking");

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
    await agent6PageInstance.bringToFront();
    await agent6PageInstance.waitForTimeout(5000);
    await agent6CallPage.endCall();
    await agent6CallPage.finishAfterCallWork();

    // Unready agent 6
    await agent6Dash.setStatus('Break');

    // Unready original agent (Agent 5)
    await page.bringToFront();
    await agent5Dash.setStatus('Break');

    // REQ146 Log back into Admin user and assert call correctness
    await supervisorPageInstance.bringToFront();
    await supervisorPageInstance.locator('[data-cy="sidenav-menu-REPORTS"]').click();
    await supervisorPageInstance.click(':text("Cradle to Grave")');
    await supervisorPageInstance.click('[aria-label="Open calendar"]');
    await supervisorPageInstance.click('.mat-calendar-body-cell :text-is("1")');
    await page.waitForTimeout(500);
    await supervisorPageInstance.click(".mat-calendar-body-today");
    await supervisorPageInstance.waitForTimeout(1000);

    // Choose agent 5
    try {
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    } catch {
      await supervisorPageInstance.locator('xima-header-add').getByRole('button').click();
      await supervisorPageInstance.locator('[data-cy="xima-criteria-selector-search-input"]').fill('Agent');
      await supervisorPageInstance.getByText('Agent', { exact: true }).click();
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    }
    
    await supervisorPageInstance.fill('[data-cy="xima-list-select-search-input"]', "WebRTC Agent 5");
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.click('[data-cy="xima-list-select-option"]');
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();

    // Choose skill 33
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]').click();
    await supervisorPageInstance.locator('[data-cy="checkbox-tree-property-option"]:has-text("Skill 33") >> nth=0').click();
    await supervisorPageInstance.locator('[data-cy="checkbox-tree-dialog-apply-button"]').click();

    // Apply
    await supervisorPageInstance.click('[data-cy="configure-cradle-to-grave-container-apply-button"]');

    // Expand most recent inbound call report
    await page.waitForTimeout(3000);
    await supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")').click();

    await supervisorPageInstance.click('mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0');
    
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Transfer", { timeout: 3000 });
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Queue");
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Talking");
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Receiving Drop");

    console.log('✅ WebRTC inbound blind transfer to agent using dial pad workflow completed successfully');

    // ================================================================================================
    // Step 2. Simulate an incoming call (dial pad)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Answer Call (dial pad)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. Blind Transfer (dial pad)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 5. Supervisor can view new transferred agent is now talking (dial pad)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 6. View Call in C2G (dial pad)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
