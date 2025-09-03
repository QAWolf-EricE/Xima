import { logInWebRTCAgent, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_outbound_dial_an_incorrect_number", async () => {
 // Step 1. WebRTC Dial an incorrect number
  // REQ03 Login as WebRTC Agent 66
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_66_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // toggle agent 66 skills on
  await page.click('[data-mat-icon-name="sliders"]');
  await page.click('span:text-is("All Skills On")');
  await page.click('[data-mat-icon-name="x"]');
  
  // Click exit if applicable
  try {
    await page.click('button:has-text("Exit")');
  } catch (err) {
    console.log(err)
   }
  
  // toggle agent 66 status on
  await toggleStatusOn(page);
  
  // REQ212 WebRTC Dial incorrect number
  await page.click('[data-cy="active-media-menu-button"]');
  await page.click('[data-mat-icon-name="active-media-voice"]'); // New call
  await page.waitForTimeout(500);
  if (await page.locator('button :text("Confirm")').count()) {
    await page.click(':text("Confirm")');
  }
  // const invalidPhone = faker.phone.phoneNumber("###-555-0###")
  const invalidPhone = "191-555-0788";
  await page.fill('[data-cy="dialpad-text"] #phoneNumberInput', invalidPhone);
  await page.click('[data-cy="call-button"]');
  
  // assert error message
  await expect(
    page.locator(
      `:text("There was an issue making outbound call. Please verify the dialed number is correct")`,
    ),
  ).toBeVisible();
  
  // end the call incase it doesn't end in 10s automatically
  // await page.click('[data-cy="end-cal"]', { timeout: 5000 });
  try {
    await page.getByRole(`button`, { name: `Close` }).click();
  } catch { console.log("No group to associate popup.") }
  
  // end call
  try {
    await page.locator('[data-cy="end-call-btn"]').click({ timeout: 5000 });
  } catch (err) {
    console.log(err)
   }
  
  await expect(page.locator('xima-call:has-text("Call Ended")')).toBeVisible();
  
});