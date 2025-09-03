import { logInSupervisor, logInWebRTCAgent } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("edit_agent_licensing", async () => {
 // Step 1. Disable Webchat
  //--------------------------------
  // Arrange:
  //--------------------------------
  //log in as agent
  const {
    browser: browser2,
    context: context2,
    page: page2,
  } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_73_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
    { sloMo: 1500 },
  );
  
  // login
  const { page, context } = await logInSupervisor({ sloMo: 500 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Soft assert that `Reports` is visible
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // navigate to agent licensing
  await page.hover('[data-mat-icon-name="user-management"]');
  await page.click('button:has-text("Agent Licensing")');
  await page.waitForTimeout(3000);
  
  // Save locator
  const testAgentRow = page.locator(
    '[data-cy="user-license-management-user-row"]:has-text("WebRTC Agent 73")',
  );
  
  const webchatButton = testAgentRow.locator(
    '[data-cy="user-license-management-addon-selection-CCAAS_VOICE.CCAAS_WEB_CHAT_ADDON"]',
  );
  
  //disable webchat channel button if enabled
  try {
    await expect(webchatButton.locator("input")).toBeChecked({ timeout: 3000 });
    await webchatButton.click();
  } catch (err) {
    console.log(err);
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //assert unchecked but still visible
  await expect(webchatButton.locator("input")).not.toBeChecked();
  await expect(webchatButton).toHaveCount(1);
  
  // save changes
  await page.click('button:has-text("Save")');
  
 // Step 2. Enable Webchat
  //--------------------------------
  // Arrange:
  //--------------------------------
  //Go to agent page
  await page2.bringToFront();
  await page2.reload();
  
  //return to supervisor page
  await page.bringToFront();
  await page.mouse.move(500,500)
  
  //--------------------------------
  // Act:
  //--------------------------------
  // navigate to agent licensing
  await page.waitForTimeout(3000);
  await page.hover('[data-mat-icon-name="user-management"]');
  await expect(
    page.getByRole(`button`, { name: `Agent Licensing` }),
  ).toBeVisible();
  await page.waitForTimeout(1000)
  await page
    .getByRole(`button`, { name: `Agent Licensing` })
    .click({ force: true});
  await page.waitForTimeout(5000);
  
  //disable webchat channel button if enabled
  try {
    await expect(webchatButton.locator("input")).not.toBeChecked({
      timeout: 3000,
    });
    await webchatButton.click();
  } catch (err) {
    console.log(err);
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Verify that webchat is checked
  await expect(webchatButton.locator("input")).toBeChecked();
  await page.waitForTimeout(2000);
  
  // save changes
  await page.getByRole(`button`, { name: `Save` }).click();
  await page.waitForTimeout(2000);
  
 // Step 3. Disable Voice Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  //Go to agent page
  await page2.bringToFront();
  await page2.reload();
  
  //return to supervisor page
  await page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // navigate to agent licensing
  await page.waitForTimeout(3000);
  await page.hover('[data-mat-icon-name="user-management"]');
  await page.getByRole(`button`, { name: `Agent Licensing` }).click();
  await page.waitForTimeout(3000);
  
  // Save voice button
  const voiceButton = testAgentRow.locator(
    '[data-cy="user-license-management-license-selection-CCAAS_VOICE"] >> [type="radio"]',
  );
  
  //disable voice agent button
  await voiceButton.uncheck({ force: true });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert voice agent button unchecked and webchat button not visible
  await expect(voiceButton).not.toBeChecked();
  await expect(webchatButton).toHaveCount(0);
  
  // Just take a moment to relax
  await page.waitForTimeout(1000);
  
  // save changes
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(2000);
  
 // Step 4. Enable Voice Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  //Go to agent page
  await page2.bringToFront();
  await page2.reload();
  
  //return to supervisor page
  await page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // navigate to agent licensing
  await page.waitForTimeout(3000);
  await page.hover('[data-mat-icon-name="user-management"]');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Agent Licensing")');
  await page.waitForTimeout(3000);
  
  //enable voice agent button
  await voiceButton.waitFor();
  await page.waitForTimeout(1000)
  await voiceButton.check({ force: true });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Verify that voice agent button checked and webchat button visible but unchecked
  await expect(voiceButton).toBeChecked();
  
  
  // save changes
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(2000);
  
  // Assert license not removed
  await page2.bringToFront();
  await expect(
    page2.locator('xima-dialog-header:text("License Removed")'),
  ).not.toBeVisible();
  
});