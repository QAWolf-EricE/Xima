import { buildUrl, getOutBoundNumber, logInWebRTCAgent, recordingMode } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("recording_automatic_recording", async () => {
 // Step 1. Pause Recording when set to Automatic recording
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const agent = "WebRTC Agent 69";
  const ausDate = dateFns.format(dateFns.sub(new Date(), {days: 1}), `MMMM d,`);
  
  // Login as WebRTC Agent 69
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_69_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 500,
    },
  );
  
  // Create new context and log in as Supervisor
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2
    .locator('[data-cy="consolidated-login-username-input"]')
    .fill(process.env.SUPERVISOR_USERNAME);
  await page2
    .locator('[data-cy="consolidated-login-password-input"]')
    .fill(process.env.SUPERVISOR_PASSWORD);
  await page2.locator('[data-cy="consolidated-login-login-button"]').click();
  
  // Update agent's recording to automatic
  await recordingMode(page2, "Automatic", agent);
  
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
    .uncheck();
  await expect(
    page2.locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`),
  ).not.toBeChecked();
  
  // Set Filter
  // Fill the search input with "WebRTC Agent 69"
  await page2.locator('[formcontrolname="searchInput"]').fill(agent);
  
  // Select "WebRTC Agent 69" from the list
  await page2
    .locator(`[data-cy="xima-list-select-option"]:has-text("${agent}")`)
    .click();
  
  // Apply the selected filter
  await page2.locator('[class*="overlay"] button:has-text("Apply")').click();
  
  // Wait for 2 seconds for changes to settle
  await page2.waitForTimeout(2000);
  
  // Click the "Apply" button again
  await page2.getByRole(`button`, { name: `Apply` }).click();
  
  // Wait for results to load
  try {
    await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("progressbar")).not.toBeVisible({
      timeout: 45 * 1000,
    });
    await page2.waitForTimeout(2000);
  } catch {
    console.log("Progress bar did not appear.");
  }
  
  // Get current number of calls for today
  let numOfCalls = await page2
    .locator(`[data-cy="cradle-to-grave-table-row"]:has-text("${agent}")`)
    .count();
  
  // Focus agent page
  await page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Start Call
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
  
  // Enter number
  await page.keyboard.type(`${outboundNumberToCall}`);
  
  // Simulate the click of the call button to initiate the call
  await page.locator(`#call-button`).click();
  
  // Associate skill with Default skill
  await page
    .locator(`[data-cy="alert-select-skills-skill-button-Default"]`)
    .click();
  
  // Assert recording active
  await expect(page.locator("text=Call Recording: ACTIVE")).toBeVisible();
  await expect(page.locator("text=Call Recording: PAUSED")).not.toBeVisible();
  
  // Assert pause button is visble
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
    ),
  ).not.toBeVisible();
  
  // Pause recording
  await page
    .locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    )
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert recording paused
  await expect(page.locator("text=Call Recording: PAUSED")).toBeVisible();
  await expect(page.locator("text=Call Recording: ACTIVE")).not.toBeVisible();
  
  // Assert pause button visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    ),
  ).not.toBeVisible();
  
  // Resume recording
  await page
    .locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
    )
    .click();
  
  // Wait
  await page.waitForTimeout(2000);
  
  // Assert recording active
  await expect(page.locator("text=Call Recording: ACTIVE")).toBeVisible();
  await expect(page.locator("text=Call Recording: PAUSED")).not.toBeVisible();
  
  // Assert pause button visible
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-pause"]',
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      '[data-cy="record-call-btn"][data-mat-icon-name="record-call-active"]',
    ),
  ).not.toBeVisible();
  
 // Step 2. View Automatic Recording as supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
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
  
  // Focus supervisor page
  await page2.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Wait for 1 minute to allow the recording to finish uploading
  await page2.waitForTimeout(1 * 60 * 1000);
  
  try {
    // Click the refresh icon on the supervisor page
    await page2
      .locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`)
      .click();
    await page.waitForTimeout(2000)
    await page2
    .locator(`[data-cy="cradle-to-grave-table-row"] >> nth=${numOfCalls}`)
    .click({ timeout: 15 * 1000 }); // clicks newest item
  } catch {
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
      } catch {
        console.log("Progress bar did not appear attempting AU Date.");
        await page2.getByRole(`button`, { name: `Filters` }).click();
        await page2.getByRole(`button`, { name: `Open calendar` }).click();
        await page2.getByRole(`button`, { name: `${ausDate}` }).dblclick();
        await page2.getByRole(`button`, { name: `Apply` }).click();
  
        // await expect(page2.getByRole("progressbar")).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(2000)
        await expect(page2.getByRole("progressbar")).not.toBeVisible({
          timeout: 45 * 1000,
        });
        await page2.waitForTimeout(2000);
      }
  
      // Navigate to the relevant row in the Cradle to Grave table based on the count of the calls collected earlier in {numOfCalls}
      await page2
        .locator(`[data-cy="cradle-to-grave-table-row"] >> nth=${numOfCalls}`)
        .click({ timeout: 15 * 1000 }); // clicks newest item
    }).toPass({ timeout: 60 * 1000 });
  }
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the presence of the recording button in the relevant table row
  await expect(
    page2.locator(
      `mat-row:has-text("${agent}") >> nth=${numOfCalls} >> mat-icon:text("play_circle_outline")`,
    ),
  ).toBeVisible();
  
  // Assert the recording icon opens up the recording
  await page2
    .locator(
      `mat-row:has-text("${agent}") >> nth=${numOfCalls} >> mat-icon:text("play_circle_outline")`,
    )
    .click();
  await expect(page2.locator(`.cradle-to-grave-recordings`)).toBeVisible();
  await expect(
    page2.locator(`[data-cy="c2g-recordings-waveform"]`),
  ).toBeVisible();
  
});