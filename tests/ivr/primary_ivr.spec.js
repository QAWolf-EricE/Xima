import { buildOptions, findClosestTime, generateTwilioSignature, initiateStartCall, logInSupervisor, pollCallStatus, setFilter } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("primary_ivr", async () => {
 // Step 1. Primary IVR
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Please see: https://app.diagrams.net/#G1XFaJUxNU0Jn9PY8LP7nvZlVekZTmwPyA#%7B%22pageId%22%3A%22ZGpmcN66cr_cd86ZKPq-%22%7D
  // See "Primary IVR"
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const uniqueIdentifier = Date.now(); // Generate unique identifier for document
  
  let params = {};
  const startUrl = `https://xima-primary-ivr-9108.twil.io/start-call?uniqueIdentifier=${uniqueIdentifier}`;
  const startCallSignature = generateTwilioSignature(startUrl, params, authToken);
  const startCallOptions = buildOptions("POST", startCallSignature);
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
  
  const autoAttendantLocator = page.locator(
    `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Auto Attendant")`,
  );
  
  // expand the auto attendant row
  await autoAttendantLocator.last().click();
  
  // Select the locator for the drop element after the Digit Menu text
  const targetLocator = page.locator(
    ':text("Drop"):below(:text("Digit Menu - Main IVR DM")):below(:text("Auto Attendant")):visible:not(mat-icon)',
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
  
  /*
    Assert position of "Drop" is directly under "Digit Menu - Main IVR" which is directly under "Auto Attendant"
    This ensures that no transfer occurred or additional digits were pressed and the call was dropped
  */
  await expect(targetLocator).toBeVisible();
  
  // Assert there is a row that contains "Digit Menu - Main IVR DM"
  await expect(
    page
      .getByRole(`cell`, { name: `Digit Menu - Main IVR DM`, exact: true })
      .locator(`app-cradle-to-grave-translation`),
  ).toBeVisible();
  
});