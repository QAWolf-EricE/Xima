import { createCall, inputDigits, logInStaggeringSupervisor, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("whisper_changes_to_listen_on_call_end", async () => {
 // Step 1. Whisper Persists Through Call End
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Supervisor logs in to monitor the Agent in Whisper mode until an incoming call ends
  
  //!! Execute the function to log in as the Supervisor, "Manager 2", on "https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1684183581323679" using {logInStaggeringSupervisor} with permissions on microphone and camera, and a response delay of 1 second
  const {
    browser: supervisorBrowser,
    context: supervisorContext,
    page: supervisorPage,
  } = await logInStaggeringSupervisor({
    username: "Manager 2",
    password: "Password07272023!",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  //!! Execute the function to log in as the listened WebRTC Agent using {logInWebRTCAgent} with permissions on microphone and camera
  const {
    browser,
    context,
    page: agentPage,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_47_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  //!! Click on the 'Realtime Displays' sidebar option on the Supervisor's page
  await supervisorPage.bringToFront();
  await supervisorPage.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! Click on the 'Supervisor View' option on the Supervisor's page
  await supervisorPage.click(':text("Supervisor View")');
  
  //!! Wait for 5 seconds on the Supervisor's page
  await supervisorPage.waitForTimeout(5000);
  
  // Filter by WebRTC Agent 47
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-title"]`)
    .click();
  await supervisorPage
    .locator(
      'mat-label:has-text("Agents") + [class="input-field-container"] [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  // Check and uncheck Select all Agents to reset selected to 0
  await supervisorPage
    .locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`)
    .check();
  await expect(
    supervisorPage.locator(
      `[data-cy="xima-list-select-select-all"] [type="checkbox"]`,
    ),
  ).toBeChecked();
  await supervisorPage
    .locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`)
    .uncheck();
  await expect(
    supervisorPage.locator(
      `[data-cy="xima-list-select-select-all"] [type="checkbox"]`,
    ),
  ).not.toBeChecked();
  // Search for and select agent 47
  await supervisorPage
    .getByPlaceholder(` Search Agents `)
    .fill(`WebRTC Agent 47`);
  await supervisorPage
    .locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`)
    .check();
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();
  await supervisorPage
    .locator(`[data-cy="supervisor-view-filter-apply-button"]`)
    .click();
  
  // See refresh dialog
  await expect(
    supervisorPage.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
  
  //!! Click on the kebab menu button on the Agent's tile from "WebRTC Agent 47 ("
  await supervisorPage
    .locator(
      'app-agent-status-container:has-text("WebRTC Agent 47 (") [data-cy="agent-tile-more-menu"]',
    )
    .waitFor();
  await supervisorPage
    .locator(
      'app-agent-status-container:has-text("WebRTC Agent 47 (") [data-cy="agent-tile-more-menu"]',
    )
    .click({ delay: 300 });
  
  //!! Click on the 'Call Monitoring' option on the Supervisor's page
  await supervisorPage.getByRole(`menuitem`, { name: `Call Monitoring` }).click();
  
  //!! Check if the "LISTEN" icon is visible on the Supervisor's page. If not, repeat steps from line 8, including clicking the "confirm-replace" button
  try {
    await supervisorPage.click(".confirm-replace", { timeout: 5000 });
  } catch (err) {
    console.log(err);
  }
  
  //!! Click on the "Listen" headphones icon on the Supervisor's page
  await supervisorPage.click(".LISTEN");
  
  //!! Toggle the status of the Agent to "Ready"
  await agentPage.bringToFront();
  await toggleSkill(agentPage, "51");
  
  //!! Click on the "toggle-click-target" icon on the Agent's page
  await toggleStatusOn(agentPage);
  
  //!! Expect to see the text "Ready" on the Agent's page
  await expect(agentPage.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  //!! Wait for 15 seconds on the Agent's page
  await agentPage.waitForTimeout(15 * 1000);
  
  //!! Simulate a call for the Agent
  let callId = await createCall({
    number: "4352551623",
  });
  
  //!! Input digits to simulate a call routing to the Agent
  await inputDigits(callId, [1]);
  
  //!! Click on the 'Answer Call' button on the Agent's page
  await agentPage.click('button:has-text("Answer Call")');
  
  //!! Bring the Supervisor's page to focus
  await supervisorPage.bringToFront();
  
  //!! Click on the "Whisper" icon on the Supervisor's page
  await supervisorPage.locator(".WHISPER").click();
  
  //!! Bring the Agent's page to focus
  await agentPage.bringToFront();
  
  //!! Click "Ok" on confirmation modal that Supervisor is on the call
  await agentPage.locator(':text("Ok")').click();
  
  //!! Confirm that Supervisor's name can be found under Active Media with "Whispering" status on the Agent's page
  await expect(
    agentPage.locator(':text("Whispering"):below(:text("Manager 2"))'),
  ).toBeVisible();
  
  //!! Bring the Supervisor's page to focus
  await supervisorPage.bringToFront();
  
  //!! Confirm that "Whisper" is still selected on the call monitoring tool
  await expect(
    supervisorPage.locator('[data-mat-icon-name="whisper-selected"]'),
  ).toBeVisible();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! End the current call as the Agent
  
  //!! Bring the Agent's page to focus
  await agentPage.bringToFront();
  
  //!! Click on the "end-call-btn" on the Agent's page
  await agentPage.locator('[data-cy="end-call-btn"]').click();
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that Supervisor switches to "Listen" mode and can end call monitoring
  
  //!! Bring the Supervisor's page to focus
  await supervisorPage.bringToFront();
  
  //!! Expect to see the "Listen" icon on the Supervisor's page
  await expect(
    supervisorPage.locator('[data-mat-icon-name="listen-selected"]'),
  ).toBeVisible();
  
  //!! Click "End Call Monitoring" on the Supervisor's page to clean up
  await supervisorPage.click(':text("End Call Monitoring")');
  
});