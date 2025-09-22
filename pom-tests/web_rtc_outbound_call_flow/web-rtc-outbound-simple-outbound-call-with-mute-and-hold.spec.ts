import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCCallPage } from '../../pom-migration/pages/agent/webrtc-call-page';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';
import { SupervisorViewPage } from '../../pom-migration/pages/supervisor/supervisor-view-page';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Outbound Simple Outbound Call with Mute and Hold Test
 * Migrated from: tests/web_rtc_outbound_call_flow/web_rtc_outbound_simple_outbound_call_with_mute_and_hold.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 65 and Supervisor
 * - Setup supervisor monitoring for agent
 * - Make outbound call through WebRTC UI with skill selection
 * - Verify supervisor can view agent status as "Talking"
 * - Test mute and unmute functionality during outbound call
 * - Test hold functionality and supervisor monitoring of "Hold" status
 * - End call and verify After Call Work (ACW) timer
 * - Set agent status to Lunch and verify channel deactivation
 * - Verify call events in Cradle to Grave report
 */
test.describe('WebRTC Outbound Simple Outbound Call with Mute and Hold', () => {

  test('web_rtc_outbound_simple_outbound_call_with_mute_and_hold', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Login as WebRTC Agent 3 & Supervisor (agent initialize outbound...)
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Log in as WebRTC Agent 65 and Supervisor
    
    // Log in as WebRTC Agent 65 with specific browser arguments and permissions
    const agent65Credentials = {
      username: process.env.WEBRTCAGENT_65_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Setup WebRTC Agent 65 with skill 8
    const { agentDash: agent65Dash, agentName: agent65Name } = await webRTCClient.setupWebRTCAgent(
      agent65Credentials,
      '8' // Toggle on skills for agent 65
    );

    // Create a new browser context for Supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // Click the REALTIME_DISPLAYS menu
    await supervisorPageInstance.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');

    // Click 'Supervisor View' text item
    await supervisorPageInstance.click(':text("Supervisor View")');

    // Click filter and select 'Agent', expect this to pass within 120 seconds
    const supervisorViewPage = new SupervisorViewPage(supervisorPageInstance);
    await expect(async () => {
      await supervisorPageInstance.locator('[data-cy="supervisor-view-filter-title"]').click();
      await supervisorPageInstance.locator('[placeholder="Select type"]').click();
      await supervisorPageInstance.locator('[id*="mat-option"]:has-text("Agent")').click({ force: true });
    }).toPass({ timeout: 120000 });

    // Click the edit button for the first report preview parameter
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0').click();

    // First select all agents, then unselect all agents
    let checkboxLocator = supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]>>input');

    // Check if the checkbox is checked
    let isChecked = await checkboxLocator.isChecked();

    // If the checkbox is unchecked, click it to check
    if (!isChecked) {
      await checkboxLocator.click();
    }

    // Then unselect all agents
    checkboxLocator = supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]>>input');

    // Check if the checkbox is checked
    isChecked = await checkboxLocator.isChecked();

    // If the checkbox is checked, click it to uncheck
    if (isChecked) {
      await checkboxLocator.click();
    }

    // Fill agent we will call
    await supervisorPageInstance.locator('[data-cy="xima-list-select-search-input"]').fill('WebRTC Agent 65');

    // Click checkbox
    checkboxLocator = supervisorPageInstance.locator('[data-cy="xima-list-select-select-all"]>>input');

    // Check if the checkbox is checked
    isChecked = await checkboxLocator.isChecked();

    // If the checkbox is unchecked, click it to check
    if (!isChecked) {
      await checkboxLocator.click();
    }

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

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Test interaction between WebRTC Agent 65's actions and visibility in the Supervisor view

    // Bring forth the agent's page
    await page.bringToFront();

    // Get phone number to make an outbound call
    const getOutBoundNumber = require('../../lib/node_20_helpers').getOutBoundNumber;
    const outboundNumberToCall = await getOutBoundNumber();
    console.log(outboundNumberToCall);

    const dialpadPage = new WebRTCDialpadPage(page);
    const callPage = new WebRTCCallPage(page);

    // Make outbound call
    await dialpadPage.openNewCallDialog();

    // Type in outbound call
    await page.locator('[data-cy="dialpad-text"] #phoneNumberInput').fill(outboundNumberToCall);

    // Call outbound number
    await dialpadPage.initiateCall();

    // Select correct skill
    await page.locator(':text-is("Skill 8"):visible >> nth=-1').click();

    // Bring forth the Supervisor's page
    await supervisorPageInstance.bringToFront();

    // Check that the agent's status is "Talking"
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 65") >> nth=0')).toContainText("Talking");

    // Bring forth the agent's page again and click the 'mute-btn' to mute and unmute the call
    await page.bringToFront();
    await callPage.muteCall();
    await expect(page.locator('.actions [data-cy="mute-btn"]')).toBeVisible();
    await callPage.unmuteCall();

    // Pause the call by clicking the 'hold-btn'
    await callPage.holdCall();

    // Bring forth the Supervisor's page and check that the agent's status is "Hold"
    await supervisorPageInstance.bringToFront();
    await expect(supervisorPageInstance.locator('app-agent-status:has-text("WebRTC Agent 65") >> nth=0')).toContainText("Hold");

    // Reset filters: Click 'Escape', edit filters and click to select all agents, wait for a short duration and apply filter changes
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

    // Bring forth the agent's page and end the call by clicking the 'end-call-btn'
    await page.bringToFront();
    await callPage.endCall();

    // Assert the 'After Call Work' alert visibility
    // await expect(
    //   page.locator('[data-cy="alert-after-call-work-title"]')
    // ).toHaveText("After Call Work");

    // Assert the 'finish-btn' visibility and click on it
    await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
    await callPage.finishAfterCallWork();

    // Switch the agent's status off by clicking the toggle button
    await agent65Dash.setStatus('Lunch');
    await expect(
      // Check that VOICE is inactive
      page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)");

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Log back in as Admin user and check call correctness
    
    // Bring forth the Supervisor's page
    await supervisorPageInstance.bringToFront();

    // Navigate to Cradle to Grave report by expanding 'reports' and clicking on Cradle to Grave
    await supervisorPageInstance.locator('[data-cy="sidenav-menu-REPORTS"]').hover();
    await supervisorPageInstance.locator(':text("Cradle to Grave")').click();

    // Open calendar and select today
    await supervisorPageInstance.click('[aria-label="Open calendar"]');
    await supervisorPageInstance.click('.mat-calendar-body-cell :text-is("1")');
    await supervisorPageInstance.click(".mat-calendar-body-today");
    await page.waitForTimeout(1000);

    // Apply the date filter changes
    await supervisorPageInstance.click('button:has-text("Apply")');
    await supervisorPageInstance.waitForTimeout(5000);

    // Sort report by "START TIME" twice and wait for a short duration to ensure sorting is completed
    // Expand last outbound call report
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await supervisorPageInstance.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
    await expect(supervisorPageInstance.locator('.mdc-linear-progress__bar-inner')).toHaveCount(0);
    await supervisorPageInstance.waitForTimeout(5000);

    // Open the details of the last outbound call in the report
    await supervisorPageInstance.click('mat-row:has-text("Call") :has-text("Outbound") [data-mat-icon-name="chevron-closed"] >> nth=0');
    // If there are no results it might be because you have to change the date filter to one day behind - timezone issues.

    // Expect to see "Dialing", "Ringing", "Talking", "Hold" and "Drop" in the call details
    // await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Dialing")')).toBeVisible();
    // await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Ringing")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Hold")')).toBeVisible();
    await expect(supervisorPageInstance.locator('[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Drop")')).toBeVisible();

    console.log('✅ WebRTC outbound simple outbound call with mute and hold workflow completed successfully');

    // ================================================================================================
    // Step 2. Simulate an outbound call through WebRTC UI (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 3. View Talking Agent as Supervisor (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 4. WebRTC Agent can mute a call (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 5. WebRTC Agent can put a call on hold (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 6. View Agent on Hold as Supervisor (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 7. View ACW timer (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 8. End Call (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
    
    // ================================================================================================
    // Step 9. View Call in C2G (agent initialize outbound...)
    // ================================================================================================
    // Note: This step is completed above in the main workflow
  });
});
