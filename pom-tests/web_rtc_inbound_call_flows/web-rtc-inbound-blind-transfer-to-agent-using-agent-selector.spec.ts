import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Blind Transfer to Agent Using Agent Selector Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_blind_transfer_to_agent_using_agent_selector.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 1 and Agent 2 with skill 31
 * - Setup supervisor monitoring
 * - Simulate incoming call and answer by Agent 1
 * - Perform blind transfer using agent selector to Agent 2
 * - Verify transfer completion and call states
 * - Monitor agent status in supervisor view
 * - Verify call events in Cradle to Grave report
 */
test.describe('WebRTC Inbound Blind Transfer to Agent Using Agent Selector', () => {

  test('web_rtc_inbound_blind_transfer_to_agent_using_agent_selector', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as WebRTC Agent 4 & 5 (direct to agent)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent 1
    const agent1Credentials = {
      username: process.env.WEBRTCAGENT_1_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent2Credentials = {
      username: process.env.WEBRTCAGENT_2_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 1 with skill 31
    const { agentDash: agent1Dash, agentName: agent1Name } = await webRTCClient.setupWebRTCAgent(
      agent1Credentials,
      '31' // Toggle agent 1 skills on
    );

    // Create new context and log in as WebRTC Agent 2
    const agent2PageInstance = await context.newPage();
    const agent2LoginPage = await LoginPage.create(agent2PageInstance);
    
    await agent2LoginPage.navigateTo();
    await agent2PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent2Credentials.username);
    await agent2PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent2Credentials.password);
    await agent2PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Setup Agent 2 with skill 31
    const agent2Client = new WebRTCClient(agent2PageInstance);
    const { agentDash: agent2Dash } = await agent2Client.setupWebRTCAgent(
      agent2Credentials,
      '31' // Toggle agent 2 skills on
    );

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // REQ135 Simulate an incoming call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({
      number: "4352551621",
    });
    console.log("CALL ID: " + callId);
    await page.waitForTimeout(3000);
    await inputDigits(callId, [1]);

    const callPage = new WebRTCCallPage(page);

    // REQ192 WebRTC Agent able to answer incoming call on UI
    await callPage.waitForIncomingCall(180000); // 3 minutes timeout
    await callPage.answerCall();

    // REQ202 WebRTC blind transfer by Agent Name
    await page.waitForTimeout(1000);
    await callPage.initiateTransfer();
    await page.waitForTimeout(1000);
    
    await page.click('[role="tab"]:has([data-mat-icon-name="agent"]), button:has-text("Blind transfer")');
    await page.waitForTimeout(1000);
    await page.click('[role="tab"]:has([data-mat-icon-name="agent"]), button:has-text("Blind transfer")');
    await page.waitForTimeout(1000);
    await page.click(':text("WebRTC Agent 2")');
    await page.waitForTimeout(1000);
    
    try {
      await page.click('button:has-text("Blind transfer")', { timeout: 5000 });
    } catch (err) {
      console.error(err);
    }

    // REQ200 WebRTC agent can answer transfer
    await agent2PageInstance.bringToFront();
    const agent2CallPage = new WebRTCCallPage(agent2PageInstance);
    await agent2CallPage.waitForIncomingCall(60000);
    await agent2CallPage.answerCall();

    // Assert ext calls don't stick previous agent in the call,
    // finishing on one agent doesn't end call for the other
    await page.bringToFront();
    await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
    await callPage.finishAfterCallWork();
    await page.click('[data-cy="alert-after-call-work-done"]');
    await expect(page.locator("text=Phone not available")).not.toBeVisible();
    
    await agent2PageInstance.bringToFront();
    await expect(agent2PageInstance.locator('[data-cy="end-call-btn"]')).toBeVisible();

    // REQ201 Supervisor can view new transferred agent is now talking
    await supervisorPageInstance.bringToFront();

    // Click the REALTIME_DISPLAYS menu
    await supervisorPageInstance.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');

    // Click 'Supervisor View' text item
    await supervisorPageInstance.click(':text("Supervisor View")');

    // Click filter and select 'Agent', expect this to pass within 120 seconds
    await expect(async () => {
      await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();
      await supervisorPageInstance.locator('[placeholder="Select type"]').click();
      await supervisorPageInstance.locator('[id*="mat-option"]:has-text("Agent")').click({ force: true });
    }).toPass({ timeout: 120000 });

    // Click the edit button for the first report preview parameter
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0').click();

    // First select all agents, then uncheck
    let checkboxLocator = supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]>>input');

    // Uncheck checkbox
    await checkboxLocator.uncheck();

    // Fill agent we will call
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill('WebRTC Agent 2(203)');

    // Wait for search results to load
    await expect(supervisorPageInstance.getByRole('option', { name: 'WebRTC Agent 2(203)' })).toBeVisible();

    // Click checkbox
    await checkboxLocator.check();

    // Click apply
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();

    // Click apply
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    // See refresh dialog
    await expect(supervisorPageInstance.locator('xima-dialog:has-text("Refresh Required")')).toBeVisible();

    // Click OK
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    // Wait for changes to settle
    await supervisorPageInstance.waitForTimeout(1000);

    // Assert that agent was found "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status-container:has(.agent-status-fullname:text-is("WebRTC Agent 2 (203)"))')).toContainText("Talking");

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
    await agent2PageInstance.bringToFront();
    await agent2CallPage.endCall();
    await agent2CallPage.finishAfterCallWork();

    // REQ146 Log back into Admin user and assert call correctness
    await supervisorPageInstance.bringToFront();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.hover('[data-cy="sidenav-menu-REPORTS"]');
    await supervisorPageInstance.click(':text("Cradle to Grave")');
    await supervisorPageInstance.click('[aria-label="Open calendar"]');
    await supervisorPageInstance.click('.mat-calendar-body-cell :text-is("1")');
    await page.waitForTimeout(500);
    await supervisorPageInstance.click(".mat-calendar-body-today");
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.click('[data-cy="configure-cradle-to-grave-container-apply-button"]');

    // Expand last inbound call report
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME")');
    await supervisorPageInstance.waitForTimeout(5000);

    await supervisorPageInstance.locator('mat-row:has-text("Call"):has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0').click();
    
    try {
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Transfer");
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Talking");
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Ringing");
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Drop");
    } catch {
      await supervisorPageInstance.locator('mat-row:has-text("Call"):has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0').click();
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Transfer");
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Talking");
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Ringing");
      await expect(supervisorPageInstance.locator('app-cradle-to-grave-table-row-details')).toContainText("Drop");
    }

    console.log('✅ WebRTC inbound blind transfer to agent using agent selector workflow completed successfully');

    // ================================================================================================
    // Step 2. Simulate an incoming call (direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Answer Call (direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. Blind transfer by Agent Name (direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 5. Supervisor can view new transferred agent is now talking (direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 6. View Call in C2G (direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
