import { buildOptions, checkCallResults, findClosestTime, generateTwilioSignature, initiateStartCall, logInSupervisor, pollCallStatus } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("sip_param_ivr", async () => {
 // Step 1. SIP Param IVR
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const skill = "SIP Parameter Condition Skill";
  const fs = await import("node:fs/promises");
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const user = process.env.IVR_API_SID;
  const userPassword = process.env.IVR_API_SECRET;
  const params = { menu1digit: "5", menu2digit: "3" };
  const auth =
    "Basic " + Buffer.from(`${user}:${userPassword}`).toString("base64");
  const queryParams = `&menu1digit=5&menu2digit=3`;
  
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
  
  // Check call status until call is completed
  const { status: callStatus } = await pollCallStatus(callSid, twilioClient);
  
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
  
  // Log in as admin
  const { page: adminPage } = await logInSupervisor({
    allowTracking: true,
    timezoneId: "America/Denver",
  });
  
  // Go to  "Cradle to Grave"
  await adminPage.getByText(`Cradle to Grave`).click();
  
  // Filter by Calls made today to the "Collect Digits" Skill
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
    .locator(
      `[data-cy="checkbox-tree-property-option"] :text("${skill}")`,
    )
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
  
  // Expand target call row
  await adminPage
    .locator(
      `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
    )
    .click();
  
  // Expand the queue row
  await adminPage
    .locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Queue") [data-mat-icon-name="chevron-closed"]`,
    )
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert there is a row that contains "Auto Attendant" and "Parameter Cond IVR"(
  // This means the caller sucessfully tranfered to the "Parameter Cond IVR" menu
  // )
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Auto Attendant"):has-text("Parameter Cond IVR"):has-text("${mountainDate}")`,
    ),
  ).toBeVisible();
  
  // Assert there is a row that contains "Auto Attendant" and "SIP Parameter IVR"(
  // This means the caller sucessfully tranfered to "SIP Parameter IVR"
  // )
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Auto Attendant"):has-text("SIP Parameter IVR"):has-text("${mountainDate}")`,
    ),
  ).toBeVisible();
  
  // Assert there is a row that contains "Queue" and "SIP Parameter Condition Skill"(
  // This means the caller sucessfully tranfered to "SIP Parameter Condition Skill"
  // )
  await expect(
    adminPage.locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has(:text-is("Queue")):has-text("SIP Parameter Condition Skill"):has-text("${mountainDate}")`,
    ),
  ).toBeVisible();
  
});