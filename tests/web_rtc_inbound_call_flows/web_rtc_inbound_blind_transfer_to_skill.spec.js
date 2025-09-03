import { createCall, inputDigits, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_blind_transfer_to_skill", async () => {
 // Step 1. Transfer call to UC group
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as a WebRTC Agent 54
  const { browser: browser2, page: page2 } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_54_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  // Log in as WebRTC Agent
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_12_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  // Toggle agent skills on WebRTC agent and UC Group agent
  await page.bringToFront();
  await toggleSkillsOn(page, "69");
  
  // REQ134 Toggle Agent1 status to Ready
  await page.bringToFront();
  await toggleStatusOn(page);
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  try {
    await page2.click('button:has-text("Exit")')
  } catch (err) {
    console.log(err)
  }
  
  // REQ134 Toggle Agent 2 status to Ready
  await page2.bringToFront();
  await toggleSkillsOn(page2, "68");
  await toggleStatusOn(page2);
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page2.locator('[data-cy="channel-state-channel-CHAT-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // REQ135 Simulate an incoming call
  let callId = await createCall({ number: "4352001585" });
  console.log(callId);
  
  await inputDigits(callId, [9]);
  
  // WebRTC agent able to answer call
  await page.bringToFront();
  await page.click('button:has-text("Answer Call")', { timeout: 2 * 60 * 1000 });
  
  // Transfer to other logged in UC agent
  await page.click('[data-cy="transfer-btn"]');
  
  // Click "Skill Group" button
  await page.click('[data-mat-icon-name="skill"]');
  
  // Click "Skill 25"
  await page.click(`div:text-is("Skill ${"68"}")`);
  
  // Click "Blind Transfer"
  await page.locator(`:text("Blind Transfer")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Answer the call
  await page2.bringToFront();
  await page2.click('span:text-is("Answer Call")');
  
  // Assert "Assisted Transfer Pending" is no longer visible on agent 2 page and call is active
  await expect(page2.locator('span:text-is("Assisted Transfer Pending")')).toBeHidden();
  await expect(page2.locator('span:text-is("Call Active")')).toBeVisible();
  await page2.click('[data-mat-icon-name="hangup"]');
  
  // Assert "Call Ended" is visible on agent 1 page
  await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();
  
});