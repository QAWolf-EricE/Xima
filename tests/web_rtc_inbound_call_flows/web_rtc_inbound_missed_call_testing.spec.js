import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_missed_call_testing", async () => {
 // Step 1. Simulate incoming call (miss call testing)
  //--------------------------------
  // Arrange:
  //--------------------------------
      //! log in as Agent 17 and Agent 18 to prepare for incoming call testing
  
  //!! log in as Agent 17 and get browser, context, and page
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_17_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  //!! toggle on skill "35" for Agent 17
  await toggleSkill(page, "35");
  
  //!! create a new context in the browser
  const context = await browser.newContext();
  
  //!! create a new page in the context
  const page2 = await context.newPage();
  
  //!! navigate to the default url on the new page
  await page2.goto(buildUrl("/"));
  
  //!! fill the email field with WebRTC Agent 18's email
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_18_EMAIL
  );
  
  //!! fill the password field with WebRTC's password
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD
  );
  
  //!! submit the login form
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! toggle on skill "35" for Agent 18
  await toggleSkill(page2, "35");
  
  //!! try to set the Agent 18 status to "Ready", if it's not already
  await toggleStatusOn(page2);
  
  //!! wait for 10 seconds
  await page2.waitForTimeout(1000);
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! simulate an incoming call for Agent 17
  //!! bring Agent 17's page to the front
  await page.bringToFront();
  
  //!! toggle Agent 17's status to "Ready"
  await toggleStatusOn(page);
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  // create call for skill 35
  await expect(async () => {
    let callId = await createCall({
      number: "4352551621"
    });
    console.log("CALL ID: " + callId);
    await inputDigits(callId, [5]);
    await expect(
      page.locator('[data-cy="alert-incoming-call-calling-number"]')
    ).toBeVisible();
  }).toPass({ timeout: 1000 * 240 });
  
  //!! get the phone number of the caller
  const phoneNumber = await page.innerText(
    `[data-cy="alert-incoming-call-calling-number"]`
  );
  
  //!! click the "Miss Call" button
  await page.waitForTimeout(1000)
  await page.click('button:has-text("Miss Call")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! verify that Agent 17 misses the call and Agent 18 picks it up and hangs up
  
  //!! assert that the call has been missed by Agent 17
  await expect(page.locator("text=Missed Call Timeout")).toBeVisible();
  
  //!! bring Agent 18's page to the front
  await page.waitForTimeout(1000)
  await page2.bringToFront();
  
  //!! click the "Answer Call" button for Agent 18
  await page2.waitForTimeout(1000)
  await page2.click('button:has-text("Answer Call")');
  
  //!! assert that the call was answered by Agent 18
  await expect(page2.locator(`xima-dialog`)).toBeVisible();
  
  //!! click the "End Call" button for Agent 18
  await page2.waitForTimeout(15000)
  await page2.click('[data-cy="end-call-btn"]');
  
  // Assert After Call work timer is visible
  await expect(page2.locator(`[data-cy="alert-after-call-work-title"]`)).toBeVisible();
  await expect(page2.locator("text=After Call Work")).toBeVisible();
  
  //!! click the "Finish" button for Agent 18
  await page2.waitForTimeout(1000)
  await page2.click('[data-cy="finish-btn"]');
  
 // Step 2. Reject call (miss call testing)
  // Description:
 // Step 3. Pick up and hang up call as second agent (miss call testing)
  // Description:
});