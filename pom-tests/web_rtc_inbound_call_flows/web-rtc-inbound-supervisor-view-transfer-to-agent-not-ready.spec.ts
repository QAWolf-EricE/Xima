import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';

/**
 * WebRTC Inbound Supervisor View Transfer to Agent Not Ready Test
 * Migrated from: tests/web_rtc_inbound_call_flows/web_rtc_inbound_supervisor_view_transfer_to_agent_not_ready.spec.js
 * 
 * This test covers:
 * - Supervisor can transfer a WebRTC call queued on a skill to an agent not ready in that skill
 * - Call comes into system and queues on a skill
 * - Agent is logged in but not ready in the skill
 * - Call is transferred from skill to agent via Supervisor View
 * - Agent answers call and ends it
 */
test.describe('WebRTC Inbound Supervisor View Transfer to Agent Not Ready', () => {

  test('web_rtc_inbound_supervisor_view_transfer_to_agent_not_ready', async ({ page, context }) => {
    // ================================================================================================
    // Step 1. Supervisor can transfer a webRTC call that is queued on a skill to an agent that does not have that skill ready
    // ================================================================================================
    // Arrange:
    // ================================================================================================
    
    // Test 2: Call comes into the system and queues a skill. 
    // An Agent (WebRTC user) is logged in but is not ready in the skill. 
    // The call is transferred from the skill to the agent via Supervisor View. 
    // The agent answers the call and shortly after ends the call.

    // Declare constants
    const agentName = 'WebRTC Agent 42';
    const skillNumber = 57;
    const agentEmail = process.env.WEBRTCAGENT_42_EMAIL || '';

    // Login to a UC Agent stephanie (do not Ready this agent)
    const agentCredentials = {
      username: agentEmail,
      password: process.env.DEFAULT_PASSWORD || ''
    };
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Login agent but don't setup fully (agent not ready in skill)
    const agentLoginPage = await LoginPage.create(page);
    const agentDash = await agentLoginPage.loginAsAgent(agentCredentials);

    // Login supervisor
    const supervisorPageInstance = await context.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPageInstance);
    await supervisorLoginPage.loginAsSupervisor(supervisorCredentials);

    // Toggle all skills off
    await page.bringToFront();
    await page.locator('[data-cy="channel-state-manage-skills"]').click();
    await page.locator(':text("All Skills Off")').click();
    await page.waitForTimeout(1000);

    // Close skill modal
    await page.locator('[data-unit="close"]').click();

    // ================================================================================================
    // Act:
    // ================================================================================================
    
    // Use helper inputDigits(callId, [enter skill number here]) to make a call
    const createCall = require('../../lib/node_20_helpers').createCall;
    const inputDigits = require('../../lib/node_20_helpers').inputDigits;
    
    let callId = await createCall({ number: "4352551623" });
    console.log({ callId });
    await supervisorPageInstance.waitForTimeout(3000);
    await inputDigits(callId, [7]);

    // Go to Supervisor View on supervisor page
    await supervisorPageInstance.bringToFront();

    // Using supervisor view, transfer the call from the skill # you select
    // Hover over real time displays
    await supervisorPageInstance.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();

    // Click supervisor view
    await supervisorPageInstance.locator(':text("Supervisor View")').click();

    // Click the settings menu button
    await supervisorPageInstance.locator('[data-cy="settings-menu-button"]').click();

    // Click the "calls queue" option in the settings menu
    await supervisorPageInstance.locator('[data-cy="settings-menu-views-calls-queue"]').click();
    await supervisorPageInstance.waitForTimeout(1000);

    // Click the skill/group selection dropdown
    await expect(supervisorPageInstance.locator('.queued-calls-dropdown')).toBeEnabled();
    await supervisorPageInstance.waitForTimeout(1500);
    await supervisorPageInstance.locator('.queued-calls-dropdown').click();

    // Select the last visible option "Skill ${skillNumber}" from the skill/group dropdown
    await expect(supervisorPageInstance.locator(`:text-is("Skill ${skillNumber}"):visible >> nth=-1`)).toBeEnabled();
    await supervisorPageInstance.waitForTimeout(1500);
    await supervisorPageInstance.locator(`:text-is("Skill ${skillNumber}"):visible >> nth=-1`).click();

    const callIdentifier = await supervisorPageInstance.locator('.queued-calls-content-row-name>>span').innerText();
    console.log({ callIdentifier });

    // Expect the item with text "In Queue (1)" under the header of the queued calls accordion to be visible
    await expect(supervisorPageInstance.locator('.queued-calls-accordion-header:has-text("In Queue (1)")')).toBeVisible();

    // Expect the element with id "accordion-body-0" that has the text "Xima Live Media" to be visible
    await expect(supervisorPageInstance.locator('#accordion-body-0:has-text("Xima Live Media")')).toBeVisible();

    // Click the phone forward button
    await supervisorPageInstance.locator('#phone-forward').click();

    // Click Transfer to Agent
    await supervisorPageInstance.locator(':text("Transfer to Agent")').click();

    // Click the transfer to agent drop down
    await expect(supervisorPageInstance.locator('[data-cy="dropdown-property-container"]:below(:text("Transfer to Agent"))>>nth=0')).toBeEnabled();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator('[data-cy="dropdown-property-container"]:below(:text("Transfer to Agent"))>>nth=0').click();

    // Select the agent with the matching agentName from the dropdown
    await expect(supervisorPageInstance.locator(`:text-is("${agentName}"):below(:text("Transfer to Agent"))>>nth=0`)).toBeEnabled();
    await supervisorPageInstance.waitForTimeout(1000);
    await supervisorPageInstance.locator(`:text-is("${agentName}"):below(:text("Transfer to Agent"))>>nth=0`).click();

    // Click the "Transfer" button
    await expect(supervisorPageInstance.locator('button:has-text("Transfer")')).toBeEnabled();
    await supervisorPageInstance.locator('button:has-text("Transfer")').click();

    // ================================================================================================
    // Assert:
    // ================================================================================================
    
    // Go to agent page and verify transfer
    await page.bringToFront();

    // Expect to see an incoming call alert on the agent's page
    await expect(page.locator(':text("Incoming Call")')).toBeVisible({ timeout: 30000 });

    const callPage = new WebRTCCallPage(page);

    // Answer the transferred call
    await callPage.answerCall();

    // Verify call is active
    await callPage.verifyCallActive();

    // End the call
    await callPage.endCall();
    await callPage.finishAfterCallWork();

    console.log('✅ WebRTC inbound hold supervised transfer to DID workflow completed successfully');
  });
});
