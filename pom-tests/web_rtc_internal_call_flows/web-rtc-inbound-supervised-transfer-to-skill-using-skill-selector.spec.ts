import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Supervised Transfer to Skill Using Skill Selector Test
 * Migrated from: tests/web_rtc_internal_call_flows/web_rtc_inbound_supervised_transfer_to_skill_using_skill_selector.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 27 and 29 with different skills
 * - Setup supervisor monitoring for multi-agent scenario
 * - Simulate inbound call to Agent 27
 * - Answer call and perform supervised transfer to skill using skill selector
 * - Verify transfer completion and agent status changes
 * - Monitor transfer events in supervisor view
 */
test.describe('WebRTC Inbound Supervised Transfer to Skill Using Skill Selector', () => {

  test('web_rtc_inbound_supervised_transfer_to_skill_using_skill_selector', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Create Inbound call to Agent 27
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Log in as three different WebRTC Agents (27, 29, and supervisor) on separate pages, set their status as 'Ready' and filter them in supervisor view.

    // Log in as WebRTC Agent 27 and set browser, context, and first page
    const agent27Credentials = {
      username: process.env.WEBRTCAGENT_27_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent29Credentials = {
      username: process.env.WEBRTCAGENT_29_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 27 with skill 10
    const { agentDash: agent27Dash, agentName: agent27Name } = await webRTCClient.setupWebRTCAgent(
      agent27Credentials,
      '10' // Toggle Agent 27's skills on
    );

    // Toggle off all channels aside from voice (disable chat and email)
    await page.locator('.ready [data-mat-icon-name="chat"]').click();
    await page.locator('.ready [data-mat-icon-name="email"]').click();
    await expect(page.locator('.channels-disabled [data-mat-icon-name="chat"]')).toBeVisible();
    await expect(page.locator('.channels-disabled [data-mat-icon-name="email"]')).toBeVisible();

    // Create a new context for the second agent's login
    const agent29PageInstance = await context.newPage();
    const agent29LoginPage = await LoginPage.create(agent29PageInstance);
    
    // Navigate to web address for the second agent
    await agent29LoginPage.navigateTo();

    // Fill in the username for the second agent (Agent 29)
    await agent29PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent29Credentials.username);

    // Fill in the password for the second agent (Agent 29)
    await agent29PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent29Credentials.password);

    // Click the login button for the second agent (Agent 29)
    await agent29PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Bring Agent 29's browser to the front
    await agent29PageInstance.bringToFront();

    // Setup Agent 29 with skill 11
    const agent29Client = new WebRTCClient(agent29PageInstance);
    const { agentDash: agent29Dash } = await agent29Client.setupWebRTCAgent(
      agent29Credentials,
      '11' // Toggle Agent 29's skills on
    );

    // Wait for 3 seconds
    await agent29PageInstance.waitForTimeout(3000);

    // Toggle off all channels aside from voice (disable chat and email)
    await agent29PageInstance.locator('.ready [data-mat-icon-name="chat"]').click();
    await agent29PageInstance.locator('.ready [data-mat-icon-name="email"]').click();
    await expect(agent29PageInstance.locator('.channels-disabled [data-mat-icon-name="chat"]')).toBeVisible();
    await expect(agent29PageInstance.locator('.channels-disabled [data-mat-icon-name="email"]')).toBeVisible();

    // Bring Agent 27's browser to the front
    await page.bringToFront();

    // Create a new context for the supervisor's login
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // Setup supervisor monitoring
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    await supervisorViewPage.setupMultiAgentMonitoring([
      { name: 'WebRTC Agent 27', number: '27' },
      { name: 'WebRTC Agent 29', number: '29' }
    ]);

    // Check if there are 2 'Idle' agents  
    await expect(supervisorPageInstance.locator(':text("Idle"):visible')).toHaveCount(2);

    // Check if Agent 27's status is 'Idle'
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 27")')).toContainText("Idle");

    // Check if Agent 29's status is 'Idle'
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 29")')).toContainText("Idle");

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Simulate an Inbound call to Agent 27
    await page.bringToFront();
    
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({ number: '4352005133' });

    // Log the value of {callId}
    console.log("callId", callId);

    // Wait for 3 seconds
    await page.waitForTimeout(3000);

    // Input the {callId} and digit 0 for skill 10
    await inputDigits(callId, [0]);

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Assert that Agent 27 receives a call and save the pages

    // Check if Agent 27 receives an incoming call
    const callPage27 = new WebRTCCallPage(page);
    await callPage27.waitForIncomingCall();

    // ================================================================================================
    // Step 2. Answer call
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Answer the incoming call on Agent 27

    // Click the button to answer the incoming call
    await callPage27.answerCall();
    await callPage27.verifyCallActive();

    // ================================================================================================
    // Step 3. Supervised transfer to skill
    // ================================================================================================
    
    // Check call status on the Supervisor View, reload page, assert agent's statuses, and focus on Agent 27

    // Bring supervisor page to the foreground
    await supervisorPageInstance.bringToFront();

    // Reload the supervisor page
    await supervisorPageInstance.reload();

    // Wait for changes to settle
    await supervisorPageInstance.waitForTimeout(5000);

    // Expect the text "Talking" appears once
    await expect(supervisorPageInstance.locator(':text("Talking"):visible')).toHaveCount(1);

    // Expect the 'WebRTC Agent 27' status to contain "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 27")').first()).toContainText("Talking");

    // Expect the 'WebRTC Agent 29' status to contain "Idle"
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 29")').first()).toContainText("Idle");

    // Bring Agent 27 page to the foreground
    await page.bringToFront();

    // Verify that the call is active
    await expect(page.locator('xima-call span:has-text("Call Active")')).toBeVisible();

    // ================================================================================================
    // Step 4. Assisted transfer
    // ================================================================================================
    
    // Wait for 2 seconds before transfer
    await page.waitForTimeout(2000);

    // Click on the transfer button
    await callPage27.initiateTransfer();

    // Wait for 1 second
    await page.waitForTimeout(1000);

    // Navigate to skill tab
    await page.locator('[data-mat-icon-name="skill"]').click();

    // Select Skill 11 (Agent 29's skill)
    await page.locator('.item-list-item :text("Skill 11")').click();

    // Select assisted transfer option
    await page.locator(':text("Assisted Transfer")').click();

    // Expect call to be connected
    await expect(page.locator('xima-dialog-header')).toHaveText("Connected");

    // Wait for 1 second
    await page.waitForTimeout(1000);

    // Bring Agent 29 page to the front
    await agent29PageInstance.bringToFront();

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Verify an incoming call is made to Agent 29 from WebRTC Agent 27, accept this call, and then complete the transfer

    // Expect the title of the incoming call alert to be visible
    const callPage29 = new WebRTCCallPage(agent29PageInstance);
    await callPage29.waitForIncomingCall();

    // Expect the incoming call alert display text to be "WebRTC Agent 27(684)"
    await expect(agent29PageInstance.locator('[data-cy="alert-incoming-call-calling-number"]:has-text("WebRTC Agent 27(684)")')).toBeVisible();

    // Click the accept button on the incoming call alert
    await callPage29.answerCall();

    // Let call connect for 2 seconds before completing transfer
    await page.waitForTimeout(2000);

    // Bring Agent 27 page back to the front
    await page.bringToFront();

    // Complete transfer
    await page.locator('[data-cy="complete-transfer-btn"]').click();
    await page.getByRole('button', { name: 'I Am Done' }).click();

    // ================================================================================================
    // Step 5. Supervisor can view new transferred agent is now talking
    // ================================================================================================
    
    // Bring the supervisor view page to the front
    await supervisorPageInstance.bringToFront();

    // Ensure that the status of "WebRTC Agent 27" is "Idle"
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 27")').first()).toContainText("Idle");

    // Ensure that the status of "WebRTC Agent 29" is "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 29")')).toContainText("Talking");

    // ================================================================================================
    // Clean up
    // ================================================================================================
    
    // Reset the filter and re-assign roles for Agents 27 and 29

    // Click to reset the filter that shows all available agents
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();

    // Click the first edit button of the preview input
    await supervisorPageInstance.locator('[data-cy="xima-preview-input-edit-button"]').first().click();

    // Fill the input field of the select search with 'Agent 27'
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill('Agent 27');

    // Wait for 1 second
    await supervisorPageInstance.waitForTimeout(1000);

    // Click the first option in the list select for Agent 27
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"] div').first().click();

    // Fill the input field of the select search with 'Agent 29'
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill('Agent 29');

    // Wait for 1 second
    await supervisorPageInstance.waitForTimeout(1000);

    // Click the first option in the list select for Agent 29
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"] div').first().click();

    // Click the apply button for agents' roles dialog
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();

    // Click the apply button for supervisor view filter
    await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-apply-button"]').click();

    // ================================================================================================
    // Step 6. Call appears on C2G
    // ================================================================================================
    
    // Navigate to C2G in reports
    await supervisorPageInstance.bringToFront();

    // See refresh dialog
    await expect(supervisorPageInstance.locator('xima-dialog:has-text("Refresh Required")')).toBeVisible();

    // Click OK
    await supervisorPageInstance.getByRole('button', { name: 'Ok' }).click();

    // Click on the Reports navigation to navigate to C2G
    await supervisorPageInstance.locator('[data-cy="sidenav-menu-REPORTS"]').click();

    // Click on the c2g-component-tab-ctog to open up C2G
    await supervisorPageInstance.locator('[data-cy="reports-c2g-component-tab-ctog"]').click();

    // Apply filter "Agent 27", sort by "Start Time" and expand the most recent call
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"]').first().click();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.getByLabel('All').check();
    await supervisorPageInstance.getByLabel('All').uncheck();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.getByRole('option', { name: 'Calls' }).click();
    await supervisorPageInstance.getByRole('button', { name: 'Apply' }).click({ delay: 500 });

    // Click on the preview input edit button in "PBX_USERS" to apply filters
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();

    // Fill the search input with "WebRTC Agent 27"
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill('WebRTC Agent 27');

    // Wait for 10 seconds
    await supervisorPageInstance.waitForTimeout(10000);

    // Select the first option in the list
    await supervisorPageInstance.locator('[data-cy="xima-list-select-option"] div').first().click();

    // Click on the apply button in the agents roles dialog
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();

    // Click on the apply button in the cradle-to-grave container
    await supervisorPageInstance.locator('[data-cy="configure-cradle-to-grave-container-apply-button"]').click();

    // Click on the "Start Timestamp" column header in the cradle to grave table to sort data
    await supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")').click();

    // Click to expand the most recent "Internal" call
    try {
      await supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Inbound")').first().click({ timeout: 3000 });
    } catch (err) {
      console.log(err);
    }

    // Verify call statuses are as expected - Queue, Talking, Transfer Hold, Queue, Talking, Transfer, Talking, Receiving drop
    await expect(async () => {
      await page.bringToFront();
      const toggleSkill = require('../../lib/node_20_helpers').toggleSkill;
      await toggleSkill(page, "10");

      // Expect the text "Queue" appears in the call status index 1
      await supervisorPageInstance.bringToFront();
      await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Queue") >> nth=0')).toBeVisible();
    }).toPass({ intervals: [15 * 1000], timeout: 5 * 60 * 1000 });

    // Expect the text "Talking" and "Skill 10" to appear in the call status at index 2
    const row = supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-row-details-row"]').nth(2);

    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-row-details-cell-INFO"] #talking').first()).toBeVisible();
    await expect(row.locator('[data-cy="cradle-to-grave-table-row-details-cell-SKILL"]:has-text("Skill 10")')).toBeVisible();

    // Expect the text "Transfer Hold" and "Skill 10" to be visible in the call status index 3
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=3 >> :text-is("Transfer Hold")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=3 >> :text-is("Skill 10")')).toBeVisible();

    // Expect the text "Queue" appears in the call status index 4
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=4 >> :text-is("Queue")')).toBeVisible();

    // Expect the text "Talking" and "Skill 11" appears in the call status index 5
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=5 >> :text-is("Talking")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=5 >> :text-is("Skill 11")')).toBeVisible();

    // Expect the text "Transfer" and "Skill 11" appears in the call status index 6
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=6 >> :text-is("Transfer")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=6 >> :text-is("Skill 11")')).toBeVisible();

    // Expect the text "Talking" appears in the call status index 7
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=7 >> :text-is("Talking")')).toBeVisible();

    // Expect the text "Receiving Drop" to be visible in the call statuses
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"] >> nth=8 >> :text-is("Receiving Drop")')).toBeVisible();

    // Bring Agent 27 page to the front
    await page.bringToFront();

    // Click the end call button if still active
    try {
      await page.locator('[data-cy="end-call-btn"]').click({ timeout: 5000 });
    } catch {
      await expect(page.locator('xima-dialog-header:has-text("Call Ended")')).toBeVisible();
      console.log("Call ended automatically");
    }

    // Expect the text "Call Ended" to be visible
    await expect(page.locator('xima-call span:has-text("Call Ended")')).toBeVisible();

    // Click the finish button
    try {
      await page.locator('xima-dialog-header').filter({ hasText: 'Manage Skills' }).getByRole('button').click({ timeout: 5000 });
    } catch {
      console.log("Manage skills window not open.");
    }
    await page.locator('[data-cy="finish-btn"]').click();

    // End call for Agent 29
    await agent29PageInstance.bringToFront();
    await agent29PageInstance.waitForTimeout(2000);
    await callPage29.endCall();

    // Expect the text "Internal Call Ended" to be visible on main page
    await expect(agent29PageInstance.locator('xima-call span:has-text("Call Ended")')).toBeVisible();

    // Click Close button
    await agent29PageInstance.getByRole('button', { name: 'Close' }).click();

    // Click "I Am Done" button if it has not timed out
    try {
      await agent29PageInstance.getByRole('button', { name: 'I Am Done' }).click({ timeout: 5000 });
    } catch {
      console.log("Message timed out.");
    }

    console.log('✅ WebRTC inbound supervised transfer to skill using skill selector workflow completed successfully');
  });
});
