import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Direct to Agent Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_direct_to_agent.spec.js
 * 
 * This test covers:
 * - Login as Agent 202 (WebRTC Agent 1) and supervisor
 * - Simulate incoming call directly to agent
 * - Answer call and verify call details
 * - End call and verify in Cradle to Grave report
 */
test.describe('WebRTC Inbound Direct to Agent', () => {

  test('web_rtc_inbound_direct_to_agent', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as Agent 202 & supervisor (incoming call direct to agent)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Log in as Agent 202 aka agent 1 with specific browser permissions
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_1_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC agent
    const { agentDash, agentName } = await webRTCClient.setupWebRTCAgent(
      agentCredentials,
      '50' // Toggle skill 50
    );

    // Create new context and login as supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Engage in a call, checking status and details, then hang up
    
    // Bring the agent's page to the front
    await page.bringToFront();

    // Simulate an incoming call directly to agent
    const createWebRTCCall = require('../../lib/node_20_helpers').createWebRTCCall;
    let callId = await createWebRTCCall();

    // Log the call ID
    console.log("CALL ID: " + callId);

    const callPage = new WebRTCCallPage(page);

    // Answer the incoming call
    await callPage.waitForIncomingCall(120000);
    await callPage.answerCall();

    // Check whether the call status shows "Call Active"
    await callPage.verifyCallActive();

    // Check whether the Caller Id, External Party Number, Wait Time and Call Direction details are visible
    await callPage.verifyCallDetails();

    // End the call
    await callPage.endCall();

    // Click the finish button
    await callPage.finishAfterCallWork();

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Log back in as an admin user and validate the call report
    
    // Bring the supervisor's page to the front
    await supervisorPageInstance.bringToFront();

    // Click Cradle to Grave from the dropdown menu
    await supervisorPageInstance.click(':text("Cradle to Grave")');

    // Open the UI to change Channels to phone
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-MEDIA_SELECTION"] [data-cy="xima-preview-input-edit-button"]').click();

    // Toggle the Calls checkbox
    await page.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="checkbox-tree-property-option"] :text("Calls")').click();

    // Apply the selection
    await page.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="checkbox-tree-dialog-apply-button"]').click();
    await page.waitForTimeout(1000);

    // Add the agent filter for WebRTC Agent 1
    try {
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    } catch {
      await supervisorPageInstance.locator('xima-header-add').getByRole('button').click();
      await supervisorPageInstance.locator('[data-cy="xima-criteria-selector-search-input"]').fill('Agent');
      await supervisorPageInstance.getByText('Agent', { exact: true }).click();
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    }

    // Input "WebRTC Agent 1" into the agent filter search field
    await page.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill("WebRTC Agent 1");

    // Toggle the checkbox for "WebRTC Agent 1"
    await page.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"]:has-text("WebRTC Agent 1("):visible').click();

    // Apply the selection
    await page.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
    await page.waitForTimeout(1000);

    // Date filter
    await supervisorPageInstance.locator('[data-cy="\'configure-report-preview-parameter-DATE_RANGE\'"] [aria-label="Open calendar"]').click();
    await supervisorPageInstance.click('.mat-calendar-body-cell :text-is("1")');
    await supervisorPageInstance.locator('[aria-current="date"]').click();
    await page.waitForTimeout(1000);

    // Click Apply to enforce all filters
    await supervisorPageInstance.locator('[data-cy="configure-cradle-to-grave-container-apply-button"]').click();

    // Try navigating to the page with the latest inbound call report
    const nextButton = page.locator('a[aria-label="Next page"]');
    try {
      while (nextButton) {
        await supervisorPageInstance.click('[aria-label="Next page"]', { timeout: 10000 });
        await page.waitForTimeout(1500);
      }
    } catch {
      await page.waitForTimeout(100);
    }

    // Sort the calls by start time
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await supervisorPageInstance.waitForTimeout(2000);

    try {
      // Expand the last inbound call report
      await supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-expand-row-button"] >> nth=0').click({ timeout: 3000 });
    } catch (err) {
      console.log(err);
    }

    // Check whether the call report details show "Ringing"
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Ringing", { timeout: 4000 });

    // Check whether the call report details show "Talking"
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Talking");

    // Check whether the call report details show "Drop"
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Drop");

    console.log('✅ WebRTC inbound direct to agent workflow completed successfully');

    // ================================================================================================
    // Step 2. Simulate an incoming call direct to agent (incoming call direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Answer Call (incoming call direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. View Call in C2G (incoming call direct to agent)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
