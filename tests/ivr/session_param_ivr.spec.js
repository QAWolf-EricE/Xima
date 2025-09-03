import { buildOptions, checkCallResults, findClosestTime, generateTwilioSignature, initiateStartCall, logInSupervisor, pollCallStatus, setFilter } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("session_param_ivr", async () => {
 // Step 1. Session Param IVR
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Please see: https://app.diagrams.net/#G1XFaJUxNU0Jn9PY8LP7nvZlVekZTmwPyA#%7B%22pageId%22%3A%22ZGpmcN66cr_cd86ZKPq-%22%7D
  // See "Standard Parameter IVR"
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const user = process.env.IVR_API_SID;
  const userPassword = process.env.IVR_API_SECRET;
  const params = { menu1digit: "5", menu2digit: "2" };
  const queryParams = `&menu1digit=5&menu2digit=2`;
  
  const uniqueIdentifier = Date.now(); // Generate unique identifier for document
  const date = new Date(uniqueIdentifier);
  const mountainTimeZone = date.toLocaleString("en-US", {
    timeZone: "America/Denver",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  
  let startUrl = `https://xima-ivr-9663.twil.io/start-call-options?uniqueIdentifier=${uniqueIdentifier}`;
  let checkUrl = `https://xima-ivr-9663.twil.io/check-results?uniqueIdentifier=${uniqueIdentifier}`;
  const startCallSignature = generateTwilioSignature(startUrl, params, authToken);
  startUrl += queryParams; // Update startUrl with query params
  const startCallOptions = buildOptions("POST", startCallSignature);
  const checkCallSignature = generateTwilioSignature(checkUrl, params, authToken);
  checkUrl += queryParams; // Update checkUrl with query params
  
  const checkCallOptions = buildOptions("POST", checkCallSignature);
  const twilioClient = new twilio(accountSid, authToken);
  const skill = "Session Parameter Condition Skill";
  
  //--------------------------------
  // Act:
  //--------------------------------
  // initiate call
  const callSid = await initiateStartCall(startUrl, startCallOptions);
  console.log("Call SID:", callSid);
  
  // give time for call to complete
  await new Promise((resolve) => setTimeout(resolve, 20 * 1000));
  
  // check call status until call is completed
  const { status: callStatus, startTime: callStartTime } = await pollCallStatus(
    callSid,
    twilioClient,
  );
  
  // stop if call failed
  if (callStatus !== "completed") throw new Error("Call failed!");
  
  // give time for transcriptions to complete
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
  
  // get call results
  let results = await checkCallResults(checkUrl, checkCallOptions);
  console.log("Call Results:", results);
  
  if (results === "Transcription still pending.") {
    await new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    results = await checkCallResults(checkUrl, checkCallOptions);
  }
  
  if (results === "Menu navigation failed") throw new Error(results);
  
  // log in as admin
  const { page } = await logInSupervisor({
    allowTracking: true,
    timezoneId: "America/Denver",
  });
  
  // go to  "Cradle to Grave"
  await page.getByText(`Cradle to Grave`).click();
  
  // filter by Calls made today to the "In Holiday" Skill
  await setFilter({
    page,
    channel: "Calls",
    skill,
  });
  
  // sort by end timestamp descending
  await page.getByRole(`button`, { name: `End Timestamp` }).click();
  await page.getByRole(`button`, { name: `End Timestamp` }).click();
  
  // find current call
  const startTimeLocators = page.locator(
    '[data-cy="cradle-to-grave-table-cell-START"]',
  );
  let rawStartTimes = await startTimeLocators.allInnerTexts();
  let startTimes = rawStartTimes.map((text) => text.split("\n")[1]);
  const startTimeToMountain = formatInTimeZone(
    new Date(callStartTime),
    "America/Denver",
    "hh:mm:ss a",
  );
  let targetCallTime = findClosestTime(startTimeToMountain, startTimes);
  
  let tries = 0;
  while (!targetCallTime && tries < 5) {
    tries++;
  
    // Wait 15 seconds and refresh table
    await page.waitForTimeout(15 * 1000);
    await page
      .locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`)
      .click();
  
    // sort by end timestamp descending
    await page.getByRole(`button`, { name: `End Timestamp` }).click();
    await page.getByRole(`button`, { name: `End Timestamp` }).click();
    await page.getByRole(`button`, { name: `End Timestamp` }).click();
    await page.waitForTimeout(3000);
  
    rawStartTimes = await startTimeLocators.allInnerTexts();
    startTimes = rawStartTimes.map((text) => text.split("\n")[1]);
    targetCallTime = findClosestTime(startTimeToMountain, startTimes);
  }
  
  if (!targetCallTime) throw new Error("Call not found");
  
  // expand target call row
  await page
    .locator(
      `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
    )
    .click();
  
  // expand the last auto attendant row
  await page
    .locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Auto Attendant")`,
    )
    .last()
    .click();
  
  // expand the queue row
  await page
    .locator(
      `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Queue") [data-mat-icon-name="chevron-closed"]`,
    )
    .first()
    .click();
  
  // Check to make sure correct call was opened
  const targetLocator = page.locator(
    `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Parameter Check - Check Amount Due")`,
  );
  
  try {
    await expect(targetLocator).toBeVisible({ timeout: 5000 });
  } catch {
    const ignoreTime = [targetCallTime];
    targetCallTime = null;
    tries = 0;
    let foundRow = false;
    while (!targetCallTime && tries < 5 && !foundRow) {
      tries++;
  
      // Wait 15 seconds and refresh table
      await page.waitForTimeout(15 * 1000);
      await page
        .locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`)
        .click();
      await page.waitForTimeout(3000);
  
      // sort by end timestamp descending
      await page.getByRole(`button`, { name: `End Timestamp` }).click();
      await page.getByRole(`button`, { name: `End Timestamp` }).click();
      await page.getByRole(`button`, { name: `End Timestamp` }).click();
      await page.waitForTimeout(3000);
  
      rawStartTimes = await startTimeLocators.allInnerTexts();
      startTimes = rawStartTimes.map((text) => text.split("\n")[1]);
      startTimes = startTimes.filter((time) => !ignoreTime.includes(time));
      targetCallTime = findClosestTime(startTimeToMountain, startTimes);
  
      // expand target call row
      await page
        .locator(
          `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
        )
        .first()
        .click({ delay: 500 });
  
      // expand the last auto attendant row
      await page
        .locator(
          `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Auto Attendant")`,
        )
        .last()
        .click({ delay: 500 });
  
      // expand the queue row
      await page
        .locator(
          `[data-cy="cradle-to-grave-table-row-details-row"]:has-text("Queue") [data-mat-icon-name="chevron-closed"]`,
        )
        .first()
        .click();
  
      try {
        await expect(targetLocator).toBeVisible({ timeout: 5000 });
        foundRow = true;
      } catch {
        ignoreTime.push(targetCallTime);
        targetCallTime = null;
      }
    }
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert there is a row that contains "Auto Attendant" and "Parameter Check - Check Amount Due"(
  // This means the caller sucessfully tranfered to the "Test Holidays" menu
  // )
  await expect(
    page
      .getByRole(`cell`, { name: `Parameter Check - Check Amount Due`, exact: true })
      .locator(`app-cradle-to-grave-translation`),
  ).toBeVisible();
  
  /* 
    Assert there is a row that contains "Queue Audio" and "Session Parameter Condition Skill"
    This means the caller was sucessfully tranfered to the Session Parameter Queue
  */
  await expect(
    page
      .locator(`.element-row:has(:text-is("Queue Audio")) .mat-column-SKILL`)
  ).toHaveText(skill);
  
});