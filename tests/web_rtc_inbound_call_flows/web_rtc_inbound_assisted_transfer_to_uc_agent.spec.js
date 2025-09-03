import { createCall, inputDigits, logInAgent, logInWebRTCAgent, logUCAgentIntoUCWebphone, toggleSkill, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_assisted_transfer_to_uc_agent", async () => {
 // Step 1. Transfer via UC extension
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Login as a UC Agent (Xima Agent 7)
  const { page: page2, browser: browser2 } = await logInAgent({
    email: process.env.UC_AGENT_7_EXT_107,
    password: process.env.UC_AGENT_7_EXT_107_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // Log in as WebRTC Agent
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_16_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // Toggle agent skills on WebRTC agent and UC Group agent
  await page.bringToFront();
  await toggleSkillsOn(page, "23");
  
  // Toggle WebRTC Agent status to Ready
  await toggleStatusOn(page);
  
  // log into webphone for uc agent
  await page.waitForTimeout(3000);
  const { ucWebPhonePage: webPhonePageSecond } = await logUCAgentIntoUCWebphone(
    browser,
    process.env.UC_AGENT_7_EXT_107_WEBPHONE_USERNAME,
  );
  await page.waitForTimeout(10000);
  
  // Toggle Xima Agent 7 status to Ready
  await page2.bringToFront();
  await toggleSkill(page2, "24");
  await toggleStatusOn(page2);
  
  // Simulate an incoming call
  let callId = await createCall({
    number: "4352437431",
  });
  console.log(callId);
  
  await page.waitForTimeout(3000);
  
  await inputDigits(callId, [3]);
  
  // WebRTC agent able to answer call
  await page.bringToFront();
  await page.click('button:has-text("Answer Call")', { timeout: 2 * 60 * 1000 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Transfer to other logged in UC agent
  await page.click('[data-cy="transfer-btn"]');
  
  // Dial Xima Agent 4 extension
  await page.click('[data-cy="dialpad-number"]:text-is("1")');
  await page.click('[data-cy="dialpad-number"]:text-is("0")');
  await page.click('[data-cy="dialpad-number"]:text-is("7")');
  await page.click('[data-cy="call-button"]');
  
  // Click "Assisted Transfer"
  await page.click(':text-is(" Assisted Transfer ")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Go back to webphone and pick up call
  await webPhonePageSecond.bringToFront();
  await webPhonePageSecond.waitForTimeout(2000);
  await webPhonePageSecond.locator(`button:has(+ p:text-is("ANSWER"))`).click();
  
  // Assert that Agent 1 sees "Complete Transfer"
  await page.bringToFront();
  await expect(page.locator('span:text-is("Complete Transfer")')).toBeVisible();
  
  // Click "Complete Transfer" on agent 1's page
  await page.click('span:text-is("Complete Transfer")');
  
  // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
  await page2.bringToFront();
  await expect(
    page2.locator('span:text-is("Assisted Transfer Pending")'),
  ).toBeHidden();
  await expect(page2.locator('span:text-is("Call Active")')).toBeVisible();
  
  // Assert "Call Ended" is visible on agent 1 page
  await page.bringToFront();
  await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();
  
  // Cleanup
  await webPhonePageSecond.locator(`[data-testid="CallEndIcon"]:visible`).click();
  
});