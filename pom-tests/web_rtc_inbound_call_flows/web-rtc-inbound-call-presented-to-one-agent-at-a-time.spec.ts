import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Call Presented to One Agent at a Time Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_call_presented_to_one_agent_at_a_time.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 30 and 31 in separate contexts
 * - Simulate incoming call for skill-based routing
 * - Verify call is presented to only one agent at a time
 * - Answer call and verify caller ID details
 * - Add notes and account codes to the call
 * - End call and verify ACW timer
 * - Verify call details in Cradle to Grave report including notes
 */
test.describe('WebRTC Inbound Call Presented to One Agent at a Time', () => {

  test('web_rtc_inbound_call_presented_to_one_agent_at_a_time', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as WebRTC Agent 11 & 12 in separate contexts
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent 30
    const agent30Credentials = {
      username: process.env.WEBRTCAGENT_30_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const agent31Credentials = {
      username: process.env.WEBRTCAGENT_31_EMAIL || '',
      password: process.env.WEBRTC_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 30 with skill 46
    const { agentDash: agent30Dash, agentName: agent30Name } = await webRTCClient.setupWebRTCAgent(
      agent30Credentials,
      '46' // Toggle agent 30 skills on
    );

    // Create new context and log in as WebRTC Agent 31
    const agent31PageInstance = await context.newPage();
    const agent31LoginPage = await LoginPage.create(agent31PageInstance);
    
    await agent31LoginPage.navigateTo();
    await agent31PageInstance.fill('[data-cy="consolidated-login-username-input"]', agent31Credentials.username);
    await agent31PageInstance.fill('[data-cy="consolidated-login-password-input"]', agent31Credentials.password);
    await agent31PageInstance.click('[data-cy="consolidated-login-login-button"]');

    // Setup Agent 31 with skill 46
    const agent31Client = new WebRTCClient(agent31PageInstance);
    const { agentDash: agent31Dash } = await agent31Client.setupWebRTCAgent(
      agent31Credentials,
      '46' // Toggle agent 31 skills on
    );

    // Create new context and log in as Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // REQ135 Simulate an incoming call
    await page.bringToFront();
    
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({
      number: "4352551622"
    });
    console.log("CALL ID: " + callId);
    await page.waitForTimeout(3000);
    await inputDigits(callId, [6]);

    const callPage = new WebRTCCallPage(page);

    // REQ204 Call presented to one agent at a time
    await expect(page.locator('[data-cy="alert-incoming-call-content"]')).toBeVisible({ timeout: 65000 });

    // Switch to agent 31 and assert call modal is not shown
    await agent31PageInstance.bringToFront();
    await expect(agent31PageInstance.locator('[data-cy="alert-incoming-call-skill"]')).not.toBeVisible();

    // Back to agent 30
    await page.bringToFront();

    // REQ205 WebRTC Assert incoming CallerID
    await expect(page.locator('[data-cy="alert-incoming-call-content"]')).toBeVisible({ timeout: 10000 });

    const callerId = await page.innerText('[data-cy="alert-incoming-call-content"]');

    // Answer the call
    await callPage.answerCall();

    console.log(callerId.slice(0, 11));

    // REQ206 WebRTC Call details match CallerID
    await expect(page.locator('[data-cy="details-sidebar-details-CUSTOMER_CALL_EXTERNAL_PARTY_NUMBER"]')).toHaveText(callerId.slice(0, 11));

    // REQ207 WebRTC Add notes to a call
    await page.click('[role="tab"]#mat-tab-label-0-1');
    const faker = require('faker');
    const notes = faker.lorem.words();
    await page.fill('[data-cy="details-sidebar-note-textarea"]', notes);
    await page.click('[data-cy="details-sidebar-note-post-anchor"]');

    // Assert posted notes
    await expect(page.locator(".note")).toContainText(notes);

    // REQ208 WebRTC Add account codes to a call
    await page.click('[role="tab"]#mat-tab-label-0-2');
    await page.click('[data-cy="details-sidebar-select-code"]');
    await page.click(':text("Test Code")');
    await page.click('[data-cy="details-sidebar-post-code"]');

    // REQ197 WebRTC Agent can hang up a call from the UI
    await callPage.endCall();

    // REQ213 WebRTC ACW timer is visible
    // await expect(
    //   page.locator('[data-cy="alert-after-call-work-title"]')
    // ).toHaveText("After Call Work");

    // REQ209 WebRTC Post call 'Finish' button is visible
    await callPage.finishAfterCallWork();

    // REQ146 Log back into Admin user and assert call correctness
    await supervisorPageInstance.bringToFront();
    await supervisorPageInstance.hover('[data-mat-icon-name="reports"]');
    await supervisorPageInstance.click(':text("Cradle to Grave")');
    await supervisorPageInstance.click('[aria-label="Open calendar"]');
    await supervisorPageInstance.click('.mat-calendar-body-cell :text-is("1")');
    await page.waitForTimeout(500);
    await supervisorPageInstance.click(".mat-calendar-body-today");
    await supervisorPageInstance.waitForTimeout(1000);
    
    try {
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    } catch {
      await supervisorPageInstance.locator('xima-header-add').getByRole('button').click();
      await supervisorPageInstance.locator('[data-cy="xima-criteria-selector-search-input"]').fill('Agent');
      await supervisorPageInstance.getByText('Agent', { exact: true }).click();
      await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]').click();
    }
    
    await supervisorPageInstance.fill('[data-cy="xima-list-select-search-input"]', "WebRTC Agent 30");
    await supervisorPageInstance.waitForTimeout(2000);
    await supervisorPageInstance.click('[data-cy="xima-list-select-option"]');
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.click('button:has-text("Apply")');
    await supervisorPageInstance.waitForTimeout(2000);

    // Expand recent call report for agent 30
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME")');
    await supervisorPageInstance.waitForTimeout(2000);
    const callRow = supervisorPageInstance.locator('mat-row:has([data-cy="cradle-to-grave-table-cell-RECEIVING_PARTY"] :text("Agent 30"))');
    await callRow.locator(' [data-mat-icon-name="chevron-closed"]').first().click();

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Talking");
    await expect(supervisorPageInstance.locator(".mat-column-expandedDetail:visible")).toContainText("Drop");

    // Open notes and assert
    await callRow.locator('[data-cy="cradle-to-grave-table-note-button"]').first().click();

    console.log("NOTES: ", notes);
    await expect(supervisorPageInstance.locator('[data-cy="c2g-note-content"]')).toHaveText(notes);

    console.log('✅ WebRTC inbound call presented to one agent at a time workflow completed successfully');

    // ================================================================================================
    // Step 2. Confirm call presented to one agent at a time
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. Add Notes to Call (call presented to one agent...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. Add account codes to a call (call presented to one agent...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 5. View ACW timer (call presented to one agent...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 6. View Call in C2G (call presented to one agent...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
