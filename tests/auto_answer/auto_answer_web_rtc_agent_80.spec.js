import { createCall, inputDigits, logInWebRTCAgent, reportCleanupFailed, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("auto_answer_web_rtc_agent_80", async () => {
 // Step 1. Auto Answer - WebRTC Agent 80
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Log in with WebRTC Agent 80
  const { page } = await logInWebRTCAgent(process.env.WEBRTCAGENT_80_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Toggle on Skill "80" for Agent 80
  await toggleSkill(page, "80");
  
  // Set Agent 80's status to "Ready"
  await toggleStatusOn(page);
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  
  try {
    // Soft assert that there is not a call currently in progress
    await expect(page.locator(`[data-cy="end-call-btn"]`)).not.toBeVisible({
      timeout: 5 * 1000,
    });
  } catch {
    // If there is, click the "End Call" button
    await page.locator(`[data-cy="end-call-btn"]`).click();
  
    // Click the "I Am Done" button
    await page.getByRole(`button`, { name: `I Am Done` }).click();
  
    // Click the "Close" button
    await page.getByRole(`button`, { name: `Close` }).click();
  
    // Soft assert that there is not a call sill in progress
    await expect(page.locator(`[data-cy="end-call-btn"]`)).not.toBeVisible();
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Simulate an incoming call
  let callId = await createCall({ number: "4352001586" });
  
  // Direct call to Agent 80
  await inputDigits(callId, [0]);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert call connects and is automatically answered
  await expect(
    page.locator(`xima-dialog-header`).getByText(`Call Active`),
  ).toBeVisible({ timeout: 5 * 60 * 1000 });
  
  // Assert an "Active Media" card appears
  await expect(page.locator(`xima-active-media-tile`)).toBeVisible();
  
  // Assert the call had a "Wait Time" of "00:00"
  await expect(
    page.locator(`[data-cy="details-sidebar-details-MEDIA_WAIT_TIME"]`),
  ).toHaveText("00:00:00");
  
  // Assert call eventually ends
  await expect(
    page.locator(`xima-dialog-header`).getByText(`Call Ended`),
  ).toBeVisible({ timeout: 3 * 60 * 1000 });
  
  // Assert the "After Call Work" tile appears
  await expect(
    page.locator(`[data-cy="alert-after-call-work-title"]`),
  ).toBeVisible();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  
  try {
    // Click the "I Am Done" button
    await page.getByRole(`button`, { name: `I Am Done` }).click();
  
    // Click the "Close" button
    await page.getByRole(`button`, { name: `Close` }).click();
  } catch (e) {
    await reportCleanupFailed({
      dedupKey: "postTestEndCall",
      errorMsg: e.message,
    });
  }
  
});