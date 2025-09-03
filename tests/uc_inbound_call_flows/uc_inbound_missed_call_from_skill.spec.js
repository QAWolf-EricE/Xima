import { buildUrl, createCall, inputDigits, logInAgent, logUCAgentIntoUCWebphone, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("uc_inbound_missed_call_from_skill", async () => {
 // Step 1. Simulate incoming call (miss call testing)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as a UC Agent
  const { page, context, browser } = await logInAgent({
    email: process.env.UC_AGENT_12_EXT_112,
    password: process.env.UC_AGENT_12_EXT_112_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Toggle agent skills on (UC Agent)
  await toggleSkill(page, "28");
  
  // Create new context and log in as another agent (e.g. WebRTC Agent 1)
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_10_EMAIL
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // Toggle agent skills on (WebRTC Agent 1 page)
  await page2.waitForTimeout(3000)
  await toggleSkill(page2, "29");
  
  // Toggle agent status to Ready (WebRTC Agent 1 page)
  await toggleStatusOn(page2)
  
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page2.locator('[data-cy="channel-state-channel-CHAT-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //--------------------------------
  // Act:
  //--------------------------------
  // log into uc agent webphone
  const { ucWebPhonePage: webPhonePage } = await logUCAgentIntoUCWebphone(context, process.env.UC_AGENT_12_EXT_112_WEBPHONE_USERNAME);
  
  // Toggle Agent status to Ready
  await page.bringToFront();
  await page.waitForTimeout(5000)
  await toggleStatusOn(page);
  
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  // Simulate an incoming call (UC Agent page)
  let callId = await createCall({ number: 4352437431 });
  console.log("CALL ID: " + callId);
  await inputDigits(callId, [9]);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that there's an incoming call
  await page2.bringToFront();
  await expect(
    page2.locator('[data-cy="alert-incoming-call-calling-number"]:visible')
  ).toBeVisible({ timeout: 60 * 1000 });
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // WebRTC Agent 1 rejects call (WebRTC Agent 1 page)
  await page2.click('button:has-text("Miss Call")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert incoming call modal no longer visible
  await expect(
    page2.locator('[data-cy="alert-incoming-call-calling-number"]')
  ).not.toBeVisible();
  
  // Assert call has been missed
  await expect(page2.locator("text=Missed Call Timeout")).toBeVisible();
  
  // Wait for Missed Call Timeout to disappear
  await expect(page2.locator("text=Missed Call Timeout")).not.toBeVisible({ timeout: 35000 });
  
  // Assert Incoming call modal appears
  await expect(
    page2.locator('[data-cy="alert-incoming-call-calling-number"]')
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // answer the call
  await page2.click('button:has-text("Answer Call")');
  
  // Assert phone call was picked up
  await expect(page2.locator(`xima-dialog`)).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // WebRTC Agent can hang up a call from the UI
  await page2.click('[data-cy="end-call-btn"]');
  await page2.click('[data-cy="finish-btn"]');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert call has been hung up and in the post call
  await expect(page2.locator("text=After Call Work")).toBeVisible();
  
 // Step 2. Reject call (miss call testing)
  
 // Step 3. Pick up and hang up call as second agent (miss call testing)
  
});