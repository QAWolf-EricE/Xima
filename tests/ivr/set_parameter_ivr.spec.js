import { buildOptions, checkCallResults, findClosestTime, generateTwilioSignature, initiateStartCall, logInSupervisor, pollCallStatus, setFilter } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("set_parameter_ivr", async () => {
 // Step 1. Set Parameter IVR
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Please see: https://app.diagrams.net/#G1XFaJUxNU0Jn9PY8LP7nvZlVekZTmwPyA#%7B%22pageId%22%3A%22ZGpmcN66cr_cd86ZKPq-%22%7D
  // See "Set Parameter IVR"
  const uniqueIdentifier = Date.now(); // Generate unique identifier for document
  
  let params = {};
  const baseUrl = "https://xima-set-parameter-ivr-6543.twil.io";
  const startUrl = `${baseUrl}/start-call?uniqueIdentifier=${uniqueIdentifier}`;
  const checkUrl = `${baseUrl}/check-results?uniqueIdentifier=${uniqueIdentifier}`;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
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
  
  // filter by Calls made today to the "In Holiday" Skill
  await setFilter({
    page,
    channel: "Calls",
    skill: "Set Parameter Skill"
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
    .first()
    .click();
  
  // expand the last auto attendant row
  await page
    .locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Auto Attendant")`,
    )
    .last()
    .click();
  
  // Check to make sure correct call was opened
  const targetLocator = page.locator(
    `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Set Parameter - Set Parameter as Passed")`,
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
      await page
        .getByRole(`button`, { name: `End Timestamp` })
        .click({ delay: 500 });
      await page
        .getByRole(`button`, { name: `End Timestamp` })
        .click({ delay: 500 });
      await page
        .getByRole(`button`, { name: `End Timestamp` })
        .click({ delay: 500 });
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
        .click();
  
      // expand the last auto attendant row
      await page
        .locator(
          `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Auto Attendant")`,
        )
        .last()
        .click({ delay: 500 });
  
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
  
  /* 
    Assert there is a row that contains "Auto Attendant" and "Announcement - Announcement Test"
    This means the caller sucessfully transferred to the Forced Announcement 
  */
  await expect(
    page
      .getByRole(`cell`, { 
        name: `Set Parameter - Set Parameter as Passed`, 
        exact: true 
      })
      .locator(`app-cradle-to-grave-translation`)
  ).toBeVisible();
  
});