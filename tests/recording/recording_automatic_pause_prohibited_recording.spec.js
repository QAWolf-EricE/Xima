import { buildUrl, getOutBoundNumber, logInWebRTCAgent, recordingMode } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("recording_automatic_pause_prohibited_recording", async () => {
 // Step 1. Confirm Automatic (Pause Prohibited) setting records automatically
  // Consts
  const ausDate = dateFns.format(dateFns.sub(new Date(), {days: 1}), `MMMM d,`);
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as a recording agent, simulate a call, and verify the recording
  // Login as WebRTC agent 68
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_68_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      timezoneId: "America/New_York",
    },
  );
  
  // Login as Supervisor in new context
  // Navigate to login page in new context
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto(buildUrl("/"));
  
  // Fill in the supervisor's username
  await page2
    .locator('[data-cy="consolidated-login-username-input"]')
    .fill(process.env.SUPERVISOR_USERNAME);
  
  // Fill in the supervisor's password
  await page2
    .locator('[data-cy="consolidated-login-password-input"]')
    .fill(process.env.SUPERVISOR_PASSWORD);
  
  // Click on the login button
  await page2.locator('[data-cy="consolidated-login-login-button"]').click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Update the agent's recording mode to "Automatic (Pausing Prohibited)"
  await recordingMode(page2, "Automatic (Pausing Prohibited)", "WebRTC Agent 68");
  
  // Navigate to the reports section
  await page2.locator('[data-mat-icon-name="reports"]').click();
  
  // Navigate to "Cradle to Grave" section under reports
  await page2.locator(`.tab:has-text("Cradle to Grave")`).click();
  
  // Initiate a filter on the agent field in the application UI
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  
  // Uncheck "Select All Agents" checkbox
  await page2
    .locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`)
    .waitFor();
  await page2
    .locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`)
    .uncheck();
  await expect(
    page2.locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`),
  ).not.toBeChecked();
  
  // Fill the search input with "WebRTC Agent 68"
  await page2.locator('[formcontrolname="searchInput"]').fill("WebRTC Agent 68");
  
  // Select "WebRTC Agent 68" from the list
  await page2
    .locator('[data-cy="xima-list-select-option"]:has-text("WebRTC Agent 68")')
    .click();
  
  // Apply the selected filter
  await page2.locator('[class*="overlay"] button:has-text("Apply")').click();
  
  // Wait for 2 seconds for changes to settle
  await page2.waitForTimeout(2000);
  
  // Click the "Apply" button again
  await page2.getByRole(`button`, { name: `Apply` }).click();
  
  // Wait for results to load
  try {
    await expect(page2.getByRole("progressbar")).toBeVisible({ timeout: 5000 });
    await expect(page2.getByRole("progressbar")).not.toBeVisible({
      timeout: 45 * 1000,
    });
    await page2.waitForTimeout(2000);
  } catch {
      console.log("Progress bar did not appear attempting AU Date.");
      await page2.getByRole(`button`, { name: `Filters` }).click();
      await page2.getByRole(`button`, { name: `Open calendar` }).click();
      await page2.getByRole(`button`, { name: `${ausDate}` }).dblclick();
      await page2.getByRole(`button`, { name: `Apply` }).click();
  
      await expect(page2.getByRole("progressbar")).toBeVisible({ timeout: 5000 });
      await expect(page2.getByRole("progressbar")).not.toBeVisible({
        timeout: 45 * 1000,
      });
      await page2.waitForTimeout(2000);
  }
  
  // Store the current number of calls for Agent "WebRTC Agent 68" in {numOfCalls}
  var numOfCalls = await page2
    .locator('[data-cy="cradle-to-grave-table-row"]:has-text("WebRTC Agent 68")')
    .count();
  
  // Switch focus to the agent page
  await page.bringToFront();
  
  // Click on the active-media-menu-button to start a call
  await page.locator('[data-cy="active-media-menu-button"]').click();
  
  // Click on the "New Call" option
  await page.getByRole(`menuitem`, { name: `New Call` }).click();
  
  // Confirm the new call
  await page.getByRole(`button`, { name: `Confirm` }).click();
  
  // Select the phoneNumberInput input field
  await page.locator("#phoneNumberInput").click();
  
  // Get phone number to make an outbound call
  const outboundNumberToCall = await getOutBoundNumber();
  console.log(outboundNumberToCall);
  
  // Simulate the input of a phone number "4352437430"
  await page.keyboard.type(`${outboundNumberToCall}`);
  
  // Simulate the click of the call button to initiate the call
  await page.locator(`#call-button`).click();
  
  // Select the "Default" skill for the call
  await page
    .locator(`[data-cy="alert-select-skills-skill-button-Skill 16"]`)
    .click();
  
  // Verify that the call recording is active
  await expect(page.locator("text=Call Recording: ACTIVE")).toBeVisible();
  
  // Verify that the call recording is not paused
  await expect(page.locator("text=Call Recording: PAUSED")).not.toBeVisible();
  
  // Wait for 5 seconds for the call to mature
  await page.waitForTimeout(5000);
  
  // Verify that the recording pause button is not visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    ),
  ).not.toBeVisible();
  
  // Simulate the end of the call by clicking the end call button
  await page.locator('[data-cy="end-call-btn"]').click();
  
  // Click the finish button to conclude the call
  await page.locator('[data-cy="finish-btn"]').click();
  
  // Simulate completion of after call work
  try {
    await page
      .locator('[data-cy="alert-after-call-work-done"]')
      .click({ timeout: 3000 });
  } catch {
    console.log("Button timed out.");
  }
  
  // Switch focus to the supervisor page
  await page2.bringToFront();
  
  // Wait for 1 minute to allow the recording to finish uploading
  await page2.waitForTimeout(1 * 60 * 1000);
  
  // Refresh and wait for call to appear
  await expect(async () => {
    // Click the refresh icon on the supervisor page
    await page2
      .locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`)
      .click();
  
    // Wait for results to load
    try {
      await expect(page2.getByRole("progressbar")).toBeVisible({ timeout: 5000 });
      await expect(page2.getByRole("progressbar")).not.toBeVisible({
        timeout: 45 * 1000,
      });
      await page2.waitForTimeout(2000);
      await expect(page2
        .locator(`[data-cy="cradle-to-grave-table-row"] >> nth=${numOfCalls}`)).toBeVisible();
    } catch {
      console.log("Progress bar did not appear attempting AU Date.");
      await page.waitForTimeout(4000);
      await page2.getByRole(`button`, { name: `Filters` }).click();
      await page2.waitForTimeout(2000)
      await page2.getByRole(`button`, { name: `Open calendar` }).click();
      await page2.waitForTimeout(2000)
      await page2.getByRole(`button`, { name: `${ausDate}` }).dblclick();
      await page2.waitForTimeout(2000)
      await page2.getByRole(`button`, { name: `Apply` }).click();
  
      await expect(page2.getByRole("progressbar")).toBeVisible({ timeout: 5000 });
      await expect(page2.getByRole("progressbar")).not.toBeVisible({
        timeout: 45 * 1000,
      });
      await page.waitForTimeout(2000)
    }
  
    // Navigate to the relevant row in the Cradle to Grave table based on the count of the calls collected earlier in {numOfCalls}
    await page2
      .locator(`[data-cy="cradle-to-grave-table-row"] >> nth=${numOfCalls}`)
      .click({ timeout: 15 * 1000 }); // clicks newest item
  }).toPass({ timeout: 60 * 1000 });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the presence of the recording button in the relevant table row
  await expect(
    page2.locator(
      `mat-row:has-text("WebRTC Agent 68") >> nth=${numOfCalls} >> mat-icon:text("play_circle_outline")`,
    ),
  ).toBeVisible();
  
  // Assert the recording icon opens up the recording
  await page2
    .locator(
      `mat-row:has-text("WebRTC Agent 68") >> nth=${numOfCalls} >> mat-icon:text("play_circle_outline")`,
    )
    .click();
  await expect(page2.locator(`.cradle-to-grave-recordings`)).toBeVisible();
  await expect(
    page2.locator(`[data-cy="c2g-recordings-waveform"]`),
  ).toBeVisible();
  
});