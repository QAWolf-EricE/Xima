import { buildOptions, checkCallResults, findClosestTime, generateTwilioSignature, initiateStartCall, logInSupervisor, logInWebRTCAgent, pollCallStatus, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("collect_digits_c_ivr", async () => {
 // Step 1. Collect Digits C IVR
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const fs = await import("node:fs/promises");
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const user = process.env.IVR_API_SID;
  const userPassword = process.env.IVR_API_SECRET;
  const params = { menu1digit: "3", menu2digit: "3" };
  const auth =
    "Basic " + Buffer.from(`${user}:${userPassword}`).toString("base64");
  const queryParams = `&menu1digit=3&menu2digit=3`;
  const skill = "Collect Digits C";
  
  // Login as WebRTC agent
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_53_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Toggle Skills on
  await page.click('[data-cy="channel-state-manage-skills"]');
  await page.click(':text("All Skills Off")');
  await page.waitForTimeout(1000);
  await page.click(`span:text("${skill} Skill") + mat-slide-toggle`);
  await page.waitForTimeout(1000);
  await page.click('[data-unit="close"]');
  
  //!! Click the agent status toggle button
  await page.waitForTimeout(1500);
  await toggleStatusOn(page);
  
  // Generate unique identifier for document
  const uniqueIdentifier = Date.now();
  
  // Setup vars that use date
  const date = new Date(uniqueIdentifier);
  const mountainTimeZone = date.toLocaleString("en-US", {
    timeZone: "America/Denver",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const mountainDate = date.toLocaleString("en-US", {
    timeZone: "America/Denver",
    month: "numeric",
    day: "2-digit",
    year: "numeric",
  });
  console.log(mountainTimeZone, mountainDate);
  let startUrl = `https://xima-ivr-9663.twil.io/start-call-options?uniqueIdentifier=${uniqueIdentifier}`;
  let checkUrl = `https://xima-ivr-9663.twil.io/check-results?uniqueIdentifier=${uniqueIdentifier}`;
  
  // Generate Twilio signature for startUrl
  const startCallSignature = generateTwilioSignature(startUrl, params, authToken);
  
  // Update startUrl with query params
  startUrl += queryParams;
  
  // Build POST request to start call
  const startCallOptions = buildOptions("POST", startCallSignature);
  
  // Generate Twilio signature for checkUrl
  const checkCallSignature = generateTwilioSignature(checkUrl, params, authToken);
  
  // Update checkUrl with query params
  checkUrl += queryParams;
  
  // Build POST request to check call
  const checkCallOptions = buildOptions("POST", checkCallSignature);
  
  // Create a twilio client
  const twilioClient = new twilio(accountSid, authToken);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Initiate start call function
  const callSid = await initiateStartCall(startUrl, startCallOptions);
  console.log("Call SID:", callSid);
  
  // Give time for call to complete
  await new Promise((resolve) => setTimeout(resolve, 20 * 1000));
  
  // Wait for call to appear in the UI
  await expect(
    page.locator(`.phone-number:has-text("${process.env.TWILIO_NUMBER}")`),
  ).toBeVisible();
  
  // Pick up call
  await page.getByRole(`button`, { name: `Answer Call` }).click();
  
  // Check call status until call is completed
  const { status: callStatus, startTime: callStartTime } = await pollCallStatus(
    callSid,
    twilioClient,
  );
  
  // Stop if call failed
  if (callStatus !== "completed") throw new Error("Call failed!");
  
  // Give time for transcriptions to complete
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
  
  // Get call results
  let results = await checkCallResults(checkUrl, checkCallOptions);
  console.log("Call Results:", results);
  
  if (results === "Transcription still pending.") {
    await new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    results = await checkCallResults(checkUrl, checkCallOptions);
  }
  
  if (results === "Menu navigation failed") throw new Error(results);
  
  // log in as admin
  const { page: adminPage } = await logInSupervisor({
    allowTracking: true,
    timezoneId: "America/Denver",
  });
  
  // Go to  "Cradle to Grave"
  await adminPage.getByText(`Cradle to Grave`).click();
  
  // Filter by Calls made today to the "Collect Digits C" Skill
  await adminPage
    .locator(`app-configure-report-preview-parameter`)
    .filter({ hasText: `Channels 0 Selected` })
    .getByRole(`button`)
    .click();
  await adminPage.getByText(`Calls`).click();
  await adminPage.getByRole(`button`, { name: `Apply` }).click();
  await adminPage
    .locator(`app-configure-report-preview-parameter`)
    .filter({ hasText: `Skill 0 Selected` })
    .getByRole(`button`)
    .click();
  await adminPage
    .locator(`[data-cy="checkbox-tree-property-option"] :text("${skill} Skill")`)
    .click();
  await adminPage.getByRole(`button`, { name: `Apply` }).click();
  await adminPage
    .locator(
      `[data-cy="configure-cradle-to-grave-container-apply-button"]:has-text("Apply")`,
    )
    .click();
  
  // Sort by end timestamp descending
  await adminPage.getByRole(`button`, { name: `End Timestamp` }).click();
  await adminPage.getByRole(`button`, { name: `End Timestamp` }).click();
  
  // Find current call
  const startTimeLocators = adminPage.locator(
    '[data-cy="cradle-to-grave-table-cell-START"]',
  );
  const rawStartTimes = await startTimeLocators.allInnerTexts();
  const startTimes = rawStartTimes.map((text) => text.split("\n")[1]);
  console.log(startTimes);
  const targetCallTime = findClosestTime(mountainTimeZone, startTimes);
  console.log(targetCallTime);
  if (!targetCallTime) throw new Error("Call not found");
  
  try {
    // expand target call row
    await adminPage
      .locator(
        `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
      )
      .click({ timeout: 3000 });
  } catch {
    // Refresh page and try again
    await adminPage
      .locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`)
      .click();
    await adminPage
      .locator(
        `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
      )
      .click();
  }
  
  // expand the queue row
  await adminPage
    .locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Queue") [data-mat-icon-name="chevron-closed"]`,
    )
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert agent can NOT view collected digits
  await page.bringToFront();
  // Assert Session Parameters are visible
  await expect(
    page.locator(`.data:has-text("Session Parameters")`),
  ).not.toBeVisible();
  
  // Assert agent can NOT view collected digits
  await expect(
    page.locator(
      `.session-parameter:text("Account: ${process.env.COLLECT_DIGITS_ACC}")`,
    ),
  ).not.toBeVisible();
  
  // Assert call routed to Collect Digits Skill
  await expect(
    page.locator(`[data-cy="details-sidebar-details-MEDIA_TARGET_SKILL"]`),
  ).toHaveText(`${skill} Skill`);
  
  // Cleanup
  await page.getByRole(`button`, { name: `Close` }).click();
  
  // Assert collected digits are viewable in logs (C2G)
  await adminPage.bringToFront();
  
  // Assert there is a row that contains "Auto Attendant" and "CD and DD Menu"(
  // This means the caller sucessfully tranfered to the "Collect Digits / Data Dip" menu
  // )
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Auto Attendant"):has-text("CD and DD Menu"):has-text("${mountainDate}")`,
    ),
  ).toBeVisible();
  
  // Assert there is a row that contains "Auto Attendant" and "Collect Digits C Hide Agent"(
  // This means the caller sucessfully tranfered to "Collect Digits C"
  // )
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Auto Attendant"):has-text("${skill} Hide All"):has-text("${mountainDate}")`,
    ),
  ).toBeVisible();
  
  // Expect the kebab menu to be missing
  // Expect there to only be 2 icons in the record
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-cell-INFO"] .mat-icon`,
    ),
  ).toHaveCount(2);
  
  // Assert that the first icon is the expand/collapse arrow
  // Click on the arrow icon
  await adminPage
    .locator(
      `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-cell-INFO"] .mat-icon`,
    )
    .first()
    .click();
  
  // Assert the row collapsed
  await expect(
    adminPage.locator(`[data-cy="cradle-to-grave-table-row-details-row"]`),
  ).not.toBeVisible();
  
  // Assert "View Session Parameters" is not visible
  await expect(
    adminPage.getByRole(`menuitem`, { name: `View Session Parameters` }),
  ).not.toBeVisible();
  
});