import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Simple Skill Call with Mute and Hold Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_simple_skill_call_with_mute_and_hold.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 64 and Supervisor
 * - Simulate incoming call for skill-based routing
 * - Answer call and verify supervisor monitoring
 * - Test mute and hold functionality
 * - Verify supervisor view updates for call states
 * - End call and verify in Cradle to Grave report
 */
test.describe('WebRTC Inbound Simple Skill Call with Mute and Hold', () => {

  test('web_rtc_inbound_simple_skill_call_with_mute_and_hold', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as WebRTC Agent 8 & Supervisor (inbound call presented...)
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent 64
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_64_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 64 with skill 52
    const { agentDash, agentName } = await webRTCClient.setupWebRTCAgent(
      agentCredentials,
      '52' // Toggle skill 52
    );

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // REQ134 Toggle Agent status to Ready
    await page.bringToFront();
    // Agent should already be Ready from setup

    // REQ135 Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({
      number: "4352551623"
    });
    console.log(callId);
    await page.waitForTimeout(3000);
    await inputDigits(callId, [2]);

    const callPage = new WebRTCCallPage(page);

    // REQ192 WebRTC Agent able to answer incoming call on UI
    await callPage.waitForIncomingCall(300000); // 5 minutes timeout
    await callPage.answerCall();
    await callPage.verifyCallActive();

    // REQ196 Supervisor can view Agent who is currently talking in supervisor view
    await supervisorPageInstance.bringToFront();
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    
    await supervisorViewPage.navigateToSupervisorView();

    // Apply filter to show available agents
    await expect(async () => {
      await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();
      await supervisorPageInstance.locator('[placeholder="Select type"]').click();
      await supervisorPageInstance.locator('[role="option"] span:text-is("Agent")').click();
    }).toPass({ timeout: 120000 });

    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0').click();

    // Uncheck select all agents
    const allAgents = supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]');
    await allAgents.uncheck();

    // Search for WebRTC Agent 64
    await supervisorPageInstance.getByPlaceholder(' Search Agents ').fill('WebRTC Agent 64');
    await supervisorPageInstance.waitForTimeout(2000);
    await expect(supervisorPageInstance.locator('[role="option"] :text("WebRTC Agent 64")')).toBeVisible();

    // Check select all agents
    await allAgents.check();

    // Apply filters
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('button.apply> span:text-is(" Apply ")').click();
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    await expect(supervisorPageInstance.getByRole('button', { name: 'Ok' })).toBeVisible();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    // Assert that agent was found "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 64")')).toContainText("Talking (Skill 52)");

    // REQ193 WebRTC Agent can mute a call
    await page.bringToFront();
    await callPage.muteCall();
    await expect(page.locator('.actions [data-cy="mute-btn"]')).toBeVisible();
    await callPage.unmuteCall();

    // REQ194 WebRTC Agent can put a call on hold
    await callPage.holdCall();

    // REQ195 Supervisor can view Agent who is currently on hold in supervisor view
    await supervisorPageInstance.bringToFront();
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 64")')).toContainText("Hold (Skill 52)");

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
    await page.bringToFront();
    await callPage.endCall();
    await callPage.finishAfterCallWork();

    // Unready agent
    await agentDash.setStatus('Break');

    // REQ146 Log back into Admin user and assert call correctness
    await supervisorPageInstance.bringToFront();

    await expect(supervisorPageInstance.getByRole('button', { name: 'Ok' })).toBeVisible();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    await supervisorPageInstance.locator('[data-cy="sidenav-menu-REPORTS"]').hover();
    await supervisorPageInstance.locator(':text("Cradle to Grave")').click();

    // Change filter date range
    await supervisorPageInstance.click('[data-cy="\'configure-report-preview-parameter-DATE_RANGE\'"] [aria-label="Open calendar"]');
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
    
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("Agent 64");
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]').click();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
    await supervisorPageInstance.waitForTimeout(3000);
    await supervisorPageInstance.locator('[data-cy="configure-cradle-to-grave-container-apply-button"]').click();

    await expect(supervisorPageInstance.locator('mat-progress-bar')).toBeVisible();
    await expect(supervisorPageInstance.locator('mat-progress-bar')).not.toBeVisible();

    // Expand last inbound call report
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await supervisorPageInstance.waitForTimeout(2000);

    // Sometimes already expanded
    try {
      await supervisorPageInstance.click('mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0');
    } catch (err) {
      console.log(err);
    }

    try {
      await expect(supervisorPageInstance.locator(':text("Queue"):visible')).toHaveCount(1);
    } catch {
      // Sometimes already expanded
      await expect(supervisorPageInstance.locator(':text("Queue"):visible')).toHaveCount(3);
      await supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-row-details-collapse-row-button"]').click();
      await expect(supervisorPageInstance.locator(':text("Queue"):visible')).toHaveCount(1);
    }

    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Hold")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Drop")')).toBeVisible();

    console.log('✅ WebRTC inbound simple skill call with mute and hold workflow completed successfully');

    // ================================================================================================
    // Step 2. Simulate an incoming call (inbound call presented...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Answer Call (inbound call presented...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. View Talking Agent as Supervisor (inbound call presented...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 5. WebRTC Agent can mute a call (inbound call presented...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 6. WebRTC Agent can put a call on hold (inbound call presented...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 7. View Agent on Hold as Supervisor (inbound call presented...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 8. View Call in C2G (inbound call presented...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
