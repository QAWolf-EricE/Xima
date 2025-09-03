import { buildUrl, getOutBoundNumber, logInWebRTCAgent, recordingMode } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("recording_manual_recording", async () => {
 // Step 1. Take call with "Manual Recording" setting
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Log in as two users in different pages (a WebRTC agent and a supervisor), make a manually-recorded call, and check that it is visible in the supervisor's view
  
  //!! Log in as a WebRTC agent using the {logInWebRTCAgent} function with process.env.WEBRTCAGENT_71_EMAIL
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_71_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  //!! Create a new context {context} for a fresh session
  const context2 = await browser.newContext();
  
  //!! Create a new page {page2} in the new context
  const page2 = await context2.newPage();
  
  //!! Navigate to homepage using the {buildUrl} function
  await page2.goto(buildUrl("/"));
  
  //!! Fill the username input field with SUPERVISOR_USERNAME
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  
  //!! Fill the password input field with SUPERVISOR_PASSWORD
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  
  //!! Log in as a supervisor by clicking the login button
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! Change the agent's recording setting to "manual"
  await recordingMode(page2, "Manual", "WebRTC Agent 71");
  
  //!! Navigate to reports by clicking the reports icon
  await page2.click('[data-mat-icon-name="reports"]');
  
  //!! Navigate to "Cradle to Grave" report by clicking its text
  await page2.click(':text("Cradle to Grave")');
  
  //!! Open the agent filter dropdown by clicking the edit button below the text "Agent"
  try {
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  } catch {
    await page2.locator(`xima-header-add`).getByRole(`button`).click();
    await page2
      .locator(`[data-cy="xima-criteria-selector-search-input"]`)
      .fill(`Agent`);
    await page2.getByText(`Agent`, { exact: true }).click();
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  }
  
  //!! Enter "WebRTC Agent 71" into the search input field
  await page2.fill('[formcontrolname="searchInput"]', "WebRTC Agent 71");
  
  //!! Select the "WebRTC Agent 71" option from the dropdown
  await page2.click(
    '[data-cy="xima-list-select-option-container"]:has-text("WebRTC Agent 71")',
  );
  
  //!! Apply the agent filter by clicking the "Apply" button in the overlay
  await page2.click('[class*="overlay"] button:has-text("Apply")');
  
  //!! Wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! Apply the filter again by clicking the "Apply" button
  await page2.click('button:has-text("Apply")');
  
  //!! Wait for 5 seconds to get the current number of calls for today
  await page2.waitForTimeout(5000);
  
  //!! Count the number of calls for today and store in {numOfCalls}
  let numOfCalls = await page2
    .locator('mat-row:has-text("WebRTC Agent 71")')
    .count();
  
  //!! If there are no calls, set {numOfCalls} to 1
  if (numOfCalls === 0) numOfCalls = 1;
  
  //!! Bring the agent's page {page} to front
  await page.bringToFront();
  
  //!! Open the active media menu
  await page.locator('[data-cy="active-media-menu-button"]').click();
  
  //!! Click on "New Call"
  await page.click(':text("New Call")');
  
  //!! Confirm the new call action by clicking the "Confirm" button
  await page.click('button:has-text("Confirm")');
  
  //!! Click the phone number input
  await page.click("#phoneNumberInput");
  
  // get phone number to make an outbound call
  const outboundNumberToCall = await getOutBoundNumber();
  console.log(outboundNumberToCall);
  
  //!! Type into the phone number input
  await page.keyboard.type(`${outboundNumberToCall}`);
  
  //!! Start the call by clicking the call button
  await page.click('[data-cy="call-button"]');
  
  //!! Select the "Default" skill for the call
  await page
    .locator(`[data-cy="alert-select-skills-skill-button-Default"]`)
    .click();
  
  //!! Verify that the call recording has not started
  await expect(page.locator("text=Call Recording: PAUSED")).not.toBeVisible();
  
  //!! Ensure that the call recording is not active
  await expect(page.locator("text=Call Recording: ACTIVE")).not.toBeVisible();
  
  //***/ Beginning of 2nd test, "Start recording (Manual Recording)"
  // Begin the recording by clicking the record button
  await page.click('[data-cy="record-call-btn"]');
  
  //!! Verify that the recording is not paused
  await expect(page.locator("text=Call Recording: PAUSED")).not.toBeVisible();
  
  //!! Ensure that the recording is active
  await expect(page.locator("text=Call Recording: ACTIVE")).toBeVisible();
  
  //!! Ensure that the pause button is visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    ),
  ).toBeVisible();
  
  //!! Ensure that the active recording button is not visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
    ),
  ).not.toBeVisible();
  
  //***/ Beginning of third test "Pause recording (Manual Recording)"
  
  //!! Pause the recording by clicking the pause button
  await page.click(
    '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
  );
  
  //!! Ensure that the recording is paused
  await expect(page.locator("text=Call Recording: PAUSED")).toBeVisible();
  
  //!! Ensure that the recording is not active
  await expect(page.locator("text=Call Recording: ACTIVE")).not.toBeVisible();
  
  //!! Ensure that the resume recording button is visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
    ),
  ).toBeVisible();
  
  //!! Ensure that the pause button is not visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    ),
  ).not.toBeVisible();
  
  // Beginning of "View Manual Recording as Supervisor test", this is Arrange step
  
  //!! Resume recording by clicking on the record button
  await page.click(
    '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
  );
  
  //!! Wait for 5 seconds for the call
  await page.waitForTimeout(5000);
  
  //!! Verify that the call's recording is active
  await expect(page.locator("text=Call Recording: ACTIVE")).toBeVisible();
  
  //!! Verify that the call's recording is not paused
  await expect(page.locator("text=Call Recording: PAUSED")).not.toBeVisible();
  
  //!! Ensure that the pause button is visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    ),
  ).toBeVisible();
  
  //!! Ensure that the active recording button is not visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
    ),
  ).not.toBeVisible();
  
  //!! End the call by clicking the "End Call" button
  await page.click('[data-cy="end-call-btn"]');
  
  //!! Complete the after-call work by clicking the "Finish" button
  await page.click('[data-cy="finish-btn"]');
  
  //!! Close the after-call work alert by clicking the "Done" button
  // await page.click('[data-cy="alert-after-call-work-done"]');
  
  // Beginning of act step for "View Manual Recording as Supervisor test"
  
  //!! Bring the supervisor's page {page2} to the front
  await page2.bringToFront();
  
  //!! Wait for 60 seconds for the recording to finish uploading
  await page2.waitForTimeout(60 * 1000);
  
  //!! Reload the page {page2}
  await page2.reload();
  
  //!! Open the agent filter dropdown by clicking the edit button below the text "Agent"
  try {
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  } catch {
    await page2.locator(`xima-header-add`).getByRole(`button`).click();
    await page2
      .locator(`[data-cy="xima-criteria-selector-search-input"]`)
      .fill(`Agent`);
    await page2.getByText(`Agent`, { exact: true }).click();
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  }
  
  //!! Wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! Enter "WebRTC Agent 71" into the search input field
  await page2.fill('[formcontrolname="searchInput"]', "WebRTC Agent 71");
  
  //!! Wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! Select the "WebRTC Agent 71" option from the dropdown
  await page2.click(
    '[data-cy="xima-list-select-option"]:has-text("WebRTC Agent 71")',
  );
  
  //!! Wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! Apply the filter by clicking the "Apply" button in the overlay
  await page2.click('[class*="overlay"] button:has-text("Apply")');
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! Apply the filter again by clicking the "Apply" button
  await page2.click('button:has-text("Apply")');
  
  //!! Check for the recording in the last or second to last call made by "WebRTC Agent 71"
  try {
    await expect(
      page2
        .locator(`mat-row:has-text("WebRTC Agent 71") >> nth=-1`)
        .locator(`[data-cy="cradle-to-grave-table-recording-button"] mat-icon`),
    ).toBeVisible({ timeout: 5000 });
  } catch {
    // Refresh and check again
    await page2.locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`).click();
    await expect(
      page2
        .locator(`mat-row:has-text("WebRTC Agent 71")`)
        .locator(`[data-cy="cradle-to-grave-table-recording-button"] mat-icon`),
    ).toBeVisible();
  }
  
  // End of View Manual Recording as supervisor test
 // Step 2. Start recording (Manual Recording)
  //--------------------------------
  // Arrange:
  // set/ensure an agent's recording setting is set to "Manual"
  // start call
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  // start recording
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  // assert recording is able to be paused
  //--------------------------------
  
  
  
 // Step 3. Pause recording (Manual Recording)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! No tasks in this section.
  
  //! ----
  
  
 // Step 4. View Manual Recording as supervisor
  //--------------------------------
  // Arrange:
  // start with partially recorded call in manual recording mode
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  // end call
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  // recording is visible in recording tool bar
  //--------------------------------
  
  
  
 // Step 5. Ensure Manual recording doesn't automatically record as supervisor
  // Arrange:
  // set/ensure an agent's recording setting is set to "Manual"
  
  // Act:
  // make another call
  // wait 10 seconds and end call
  
  // Assert:
  // assert call recording not in recording tool bar
  
});