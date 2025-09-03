import { buildOptions, checkCallResults, findClosestTime, generateTwilioSignature, initiateStartCall, logInSupervisor, pollCallStatus, setFilter } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("drop_call_ivr", async () => {
 // Step 1. Drop Call IVR
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Please see: https://app.diagrams.net/#G1XFaJUxNU0Jn9PY8LP7nvZlVekZTmwPyA#%7B%22pageId%22%3A%22ZGpmcN66cr_cd86ZKPq-%22%7D
  // See "Drop Call IVR"
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const uniqueIdentifier = Date.now(); // Generate unique identifier for document
  // const date = new Date(uniqueIdentifier);
  
  let params = {};
  const startUrl = `https://xima-drop-call-ivr-3273.twil.io/start-call?uniqueIdentifier=${uniqueIdentifier}`;
  const checkUrl = `https://xima-drop-call-ivr-3273.twil.io/check-results?uniqueIdentifier=${uniqueIdentifier}`;
  const startCallSignature = generateTwilioSignature(startUrl, params, authToken);
  const startCallOptions = buildOptions("POST", startCallSignature);
  const checkCallSignature = generateTwilioSignature(checkUrl, params, authToken);
  const checkCallOptions = buildOptions("POST", checkCallSignature);
  const twilioClient = new twilio(accountSid, authToken);
  
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
  const startTimeToMountain = formatInTimeZone(
    new Date(callStartTime),
    "America/Denver",
    "hh:mm:ss a",
  );
  
  // stop if call failed
  if (callStatus !== "completed") throw new Error("Call failed!");
  
  // give time for transcriptions to complete
  await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
  
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
  
  // filter by Calls made today without skills in the calls filter
  await setFilter({
    page,
    channel: "Calls",
    criteria: [
      { name: "Call Does Not Include Skill", values: ["All"] },
      { name: "Call Direction", values: ["Inbound"] },
    ],
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
  let targetCallTime = findClosestTime(startTimeToMountain, startTimes);
  
  let tries = 0;
  while (!targetCallTime && tries < 5) {
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
    targetCallTime = findClosestTime(startTimeToMountain, startTimes);
  }
  
  if (!targetCallTime) throw new Error("Call not found");
  
  // expand target call row
  await page
    .locator(
      `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
    )
    .first()
    .click();
  
  // expand the auto attendant row
  await page
    .locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Auto Attendant")`,
    )
    .last()
    .click();
  
  // Check to make sure correct call was opened
  const targetLocator = page.locator(
    `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Digit Pressed - 8")`,
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
  
      console.log(ignoreTime);
  
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
      await page.waitForTimeout(5000);
  
      rawStartTimes = await startTimeLocators.allInnerTexts();
      const mappedStartTimes = rawStartTimes.map((text) => text.split("\n")[1]);
      const formattedStartTimes = mappedStartTimes.filter(
        (time) => !ignoreTime.includes(time),
      );
      console.log("[FORMATTED_START_TIMES]", formattedStartTimes);
      targetCallTime = findClosestTime(startTimeToMountain, formattedStartTimes);
  
      console.log("[TARGET_CALL_TIME]", targetCallTime);
  
      // expand target call row
      await page
        .locator(
          `[data-cy="cradle-to-grave-table-row"]:has(:text("${targetCallTime}")) [data-cy="cradle-to-grave-table-expand-row-button"]`,
        )
        .first()
        .click();
  
      // expand the auto attendant row
      await page
        .locator(
          `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Auto Attendant")`,
        )
        .last()
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
  
  // Assert there is a row that contains "Digit Pressed - 8"
  await expect(targetLocator).toBeVisible();
  
  // Assert that the call was dropped
  await expect(
    page.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-INFO"]:has-text("Drop")`,
    ),
  ).toBeVisible();
  
});