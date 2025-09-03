import { createCall, inputDigits, logInSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("start_end_join", async () => {
 // Step 1. Start Join
  //--------------------------------
  // Arrange:
  //--------------------------------
  // log in as supervisor
  const {
    browser: supervisorBrowser,
    context: supervisorContext,
    page: supervisorPage,
  } = await logInSupervisor({
    username: process.env.MANAGER_4_USERNAME,
    password: process.env.MANAGERS_1_TO_4_PASSWORD,
    // username: "Manager 1",
    // password: "Password07272023!",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Login as the Listened WebRTC Agent
  const {
    browser: agentBrowser,
    context: agentContext,
    page: agentPage,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_34_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  //!! click the REALTIME_DISPLAYS menu
  await supervisorPage.bringToFront();
  await supervisorPage.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click 'Supervisor View' text item
  await supervisorPage.click(':text("Supervisor View")');
  
  //!! click filter and select 'Agent', expect this to pass within 120 seconds
  await expect(async () => {
    await supervisorPage
      .locator(`[data-cy="supervisor-view-filter-title"]`)
      .click();
    await supervisorPage.locator('[placeholder="Select type"]').click();
    await supervisorPage
      .locator(`[id*='mat-option']:has-text("Agent")`)
      .click({ force: true });
  }).toPass({ timeout: 1000 * 120 });
  
  //!! click the edit button for the first report preview parameter
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // first select all agents
  // click checkbox
  let checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  let isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // then unselect all agents
  checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is checked, click it to uncheck
  if (isChecked) {
    await checkboxLocator.click();
  }
  
  // Fill agent we will call
  await supervisorPage
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 34`);
  
  // click checkbox
  checkboxLocator = supervisorPage.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Check if the checkbox is checked
  isChecked = await checkboxLocator.isChecked();
  
  // If the checkbox is unchecked, click it to check
  if (!isChecked) {
    await checkboxLocator.click();
  }
  
  // Click apply
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  
  // CLick apply
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-apply-button"]`)
    .click();
  
  // See refresh dialog
  await expect(
    supervisorPage.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
  
  //!! wait for changes to settle
  await supervisorPage.waitForTimeout(1000);
  
  //!! click on the more menu of the agent "WebRTC Agent 34"
  await supervisorPage.click(
    'app-agent-status-container:has-text("WebRTC Agent 34") [data-cy="agent-tile-more-menu"]',
  );
  
  //!! click on the "Live Listen" option from the agent's more menu
  await supervisorPage.click('[data-cy="agent-more-menu-live-listen"]');
  
  await expect(async () => {
    try {
      await expect(supervisorPage.locator(".LISTEN")).toBeVisible({
        timeout: 4000,
      });
    } catch {
      try {
        await supervisorPage.click(".confirm-replace", { timeout: 4000 });
      } catch {
        await supervisorPage.click(
          'app-agent-status-container:has-text("WebRTC Agent 34") [data-cy="agent-tile-more-menu"]',
        );
        await supervisorPage.click('[data-cy="agent-more-menu-live-listen"]');
        await supervisorPage.click(".confirm-replace");
      }
    }
  }).toPass({ timeout: 120000 });
  
  //!! wait briefly for changes to take effect
  await supervisorPage.waitForTimeout(2000);
  
  // Toggle Agent status to Ready
  // await agentPage.locator( '.toggle-click-target').click({force: true})
  //! Click the "toggle-click-target" and update the agent status to ready.
  await agentPage.bringToFront();
  await toggleSkill(agentPage, 4);
  
  //!! Click on the element with class "toggle-click-target"
  await agentPage.waitForTimeout(1000);
  await toggleStatusOn(agentPage);
  
  // Simulate a call for this agent
  await agentPage.waitForTimeout(3000);
  let callId = await createCall();
  console.log("CALL ID: " + callId);
  await inputDigits(callId, [4]);
  
  // Click the 'Answer Call' button
  await agentPage.locator('[data-cy="alert-incoming-call-accept"]').click();
  await agentPage.bringToFront();
  //--------------------------------
  // Act:
  //--------------------------------
  // on Supervisor page, click Join icon
  await supervisorPage.bringToFront();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator(".LISTEN").click();
  await supervisorPage.waitForTimeout(1000);
  await supervisorPage.locator("button.JOIN").click();
  // assert popup to notify that all parties will be able to hear
  await expect(
    supervisorPage.locator(
      ':text("By joining the call, both agent and customer will be able to hear you. Do you want to proceed?")',
    ),
  ).toBeVisible();
  // click "Join Call"
  await supervisorPage.locator(".confirm-join").click();
  // assert "Join Call" icon highlights
  await expect(
    supervisorPage.locator('[data-mat-icon-name="join-selected"]'),
  ).toBeVisible();
  
  // on Agent page, assert agent receives popup that notifies them that supervisor has joined the call
  await agentPage.bringToFront();
  await expect(
    agentPage.locator(':text("Supervisor Joined Call")'),
  ).toBeVisible();
  
  // agent notification includes supervisor's name
  await expect(
    agentPage.locator(
      ':text("Manager 4 has now joined this call. The external party is able to hear Manager 4.")',
    ),
  ).toBeVisible();
  
  // click Ok
  await agentPage.locator(':text("Ok")').click();
  
  // active media card of "Join Call" in the left pane + includes supervisor's name
  await expect(
    agentPage.locator('[data-cy="active-media-tile"] :text("Manager 4")'),
  ).toBeVisible();
  await expect(
    agentPage.locator('[data-cy="active-media-tile"] :text("Joined Call")'),
  ).toBeVisible();
  
  // on Supervisor page, assert microphone icon is now active
  await supervisorPage.bringToFront();
  await expect(supervisorPage.locator(".mute")).not.toHaveAttribute(
    "disabled",
    "true",
  );
  
  // microphone icon is muted by default
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic-muted"]'),
  ).toBeVisible();
  
  // supervisor can toggle microphone icon (unmute)
  await supervisorPage.locator(".mute").click();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic"]'),
  ).toBeVisible();
  
  // supervisor can toggle microphone icon again (mute)
  await supervisorPage.locator(".mute").click();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic-muted"]'),
  ).toBeVisible();
  
  // supervisor can toggle microphone icon again (unmute)
  await supervisorPage.locator(".mute").click();
  await expect(
    supervisorPage.locator('[data-mat-icon-name="mic"]'),
  ).toBeVisible();
  
  // Agent ends call
  await agentPage.bringToFront();
  try {
    await agentPage.locator('[data-cy="end-call-btn"]').click({ timeout: 5000 });
  } catch (err) {
    console.log(err);
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // on Agent page, no longer sees active media card "Joined Call" in left pane
  await expect(
    agentPage.locator('[data-cy="active-media-tile"] :text("Manager 4")'),
  ).not.toBeVisible();
  await expect(
    agentPage.locator('[data-cy="active-media-tile"] :text("Joined Call")'),
  ).not.toBeVisible();
  
  // on Supervisor page, call monitoring tool returns to "Live Listen" state
  await supervisorPage.bringToFront();
  await expect(
    supervisorPage.locator('[mattooltip="Listen"]'),
  ).not.toHaveAttribute("disabled", "true");
  await expect(supervisorPage.locator('[mattooltip="Whisper"]')).toHaveAttribute(
    "disabled",
    "true",
  );
  await expect(supervisorPage.locator('[mattooltip="Join"]')).toHaveAttribute(
    "disabled",
    "true",
  );
  await expect(supervisorPage.locator(".mute")).toHaveAttribute(
    "disabled",
    "true",
  );
  
  // clean up - end call monitoring
  await supervisorPage.locator(':text("End Call Monitoring")').click();
  
  // End call and Toggle RTC Agent to DND, logout
  await agentPage.bringToFront();
  await agentPage
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await agentPage.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(agentPage.locator(`.dnd-status-container`)).toHaveText(`Lunch`);
  await agentPage.locator('[data-cy="agent-status-menu-button"]').click();
  await agentPage.locator('[data-cy="agent-status-logout-link"]').click();
  
  // Confirm logout modal
  try {
    await agentPage.waitForTimeout(3000);
    await agentPage
      .locator('button:has-text("Logout")')
      .click({ timeout: 5000, delay: 500 });
  } catch (err) {
    console.log(err);
  }
  
  // Assert logged out
  await expect(
    agentPage.locator(`[data-cy="consolidated-login-forgot-password"]`),
  ).toBeVisible();
  await expect(agentPage.locator(`button:text-is("Login")`)).toBeVisible();
  
 // Step 2. End Join
  
});