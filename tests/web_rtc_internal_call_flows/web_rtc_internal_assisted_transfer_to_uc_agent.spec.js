import { buildUrl, logInAgent, logInWebRTCAgent, logUCAgentIntoUCWebphone, toggleSkill, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_internal_assisted_transfer_to_uc_agent", async () => {
 // Step 1. Initiate call, then transfer call to UC user
  //--------------------------------
  // Arrange:
  //--------------------------------
  // wait for previous workflow in group to finish
  
  // Log in to Agent 14
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_14_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Login as a UC Agent 17(Xima Agent 17)
  const { page: page4, browser: browser2 } = await logInAgent({
    email: process.env.UC_AGENT_17_EXT_117,
    password: process.env.UC_AGENT_17_EXT_117_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // log into webphone for uc agent
  await page.waitForTimeout(3000);
  const context1 = await browser.newContext();
  const { ucWebPhonePage: webPhonePageSecond } = await logUCAgentIntoUCWebphone(
    context1,
    process.env.UC_AGENT_17_EXT_117_WEBPHONE_USERNAME,
  );
  await page.waitForTimeout(10000);
  
  // Toggle status on for Agent 25
  await page4.bringToFront();
  await toggleSkillsOn(page4, "72");
  await toggleStatusOn(page4);
  
  //!! Create a new context for WebRTC Agent 12
  const context = await browser.newContext();
  
  //!! Open a new page
  const page2 = await context.newPage();
  
  //!! Load the base website URL
  await page2.bringToFront();
  await page2.goto(buildUrl("/"));
  
  //!! Fill the username field with the email of WebRTC Agent 15
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_15_EMAIL,
  );
  
  //!! Fill the password field with the password of WebRTC Agent 15
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  
  //!! Click the login button
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! Enable agent 2's skills
  await toggleSkill(page2, "73");
  
  // Clean up - end call
  try {
    await page2.locator('[data-cy="end-call-btn"]').click({ timeout: 2000 });
  } catch (err) {
    console.log(err);
  }
  
  //!! Wait for 3 seconds for the skill toggle to take effect
  await page2.waitForTimeout(3000);
  
  //!! Toggle agent 2's status as ready
  await toggleStatusOn(page2);
  
  //!! Bring agent 1's page to the front for interaction
  await page.bringToFront();
  
  //!! Enable agent 1's skills
  await toggleSkill(page, "74");
  
  //!! Toggle agent 2's status to ready
  await toggleStatusOn(page);
  
  //!! Verify that agent 20's status is "Ready"
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  //!! Verify that agent 20's voice icon color signifies readiness
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Verify that agent 20's chat icon color signifies readiness
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Bring back agent 21's page to the front for interaction
  await page2.bringToFront();
  
  //!! Verify that agent 21's status is "Ready"
  await expect(page2.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  //!! Verify that agent 21's voice icon color signifies readiness
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Verify that agent 21's chat icon color signifies readiness
  await expect(
    page2.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Create a new context for a Supervisor
  const context2 = await browser.newContext();
  
  //!! Open a new page for Supervisor
  const page3 = await context2.newPage();
  
  //!! Supervisor navigates to the base URL
  await page3.bringToFront();
  await page3.goto(buildUrl("/"));
  
  //!! Fill the username field with the Supervisor's username
  await page3.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  
  //!! Fill the password field with the Supervisor's password
  await page3.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  
  //!! Click the login button
  await page3.click('[data-cy="consolidated-login-login-button"]');
  
  //!! Go to the "Supervisor View"
  await expect(async () => {
    await page3.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  
    //!! Click the option "Supervisor View"
    await page3.locator(`:text("Supervisor View")`).click();
  }).toPass({ timeout: 1000 * 120 });
  
  //!! Wait for 3 seconds to load the Supervisor View
  await page3.waitForTimeout(3000);
  
  //!! Click the button to filter options
  await page3
    .locator(
      `[data-cy="supervisor-view-filter-title"] #mat-button-toggle-5-button`,
    )
    .click();
  
  //!! Open agent selection dropdown
  await page3.locator(`[placeholder="Select type"]`).click();
  
  //!! Select the "Agent" option from the dropdown menu
  await page3.locator(`[role="option"] span:has-text("Agent")`).click();
  
  //!! Wait for 3 seconds for the agent selection change to take effect
  await page3.waitForTimeout(3000);
  
  //!! Click the edit button for the "Agent" search field
  await page3
    .locator(`[data-cy="xima-preview-input-edit-button"]`)
    .first()
    .click();
  
  //!! Wait for 3 seconds for the agent search field to become editable
  await page3.waitForTimeout(3000);
  
  //!! Uncheck "Select All" checkbox if it is checked otherwise check "Select All" checkbox to select all agents
  try {
    await expect(page3.locator(`:text("0 Agents Selected")`)).toBeVisible({
      timeout: 3000,
    });
  } catch {
    try {
      // if select all checkbox is checked, uncheck it
      await expect(
        page3.locator(
          `[data-cy="xima-list-select-select-all"] .mdc-checkbox--selected`,
        ),
      ).toBeVisible({
        timeout: 3000,
      });
      await page3.waitForTimeout(1000);
      await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
    } catch (err) {
      console.log(err);
    }
    await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page3.waitForTimeout(1000);
    await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page3.waitForTimeout(1000);
  }
  
  //!! Search for "Agent 14" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 14`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 14"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Search for "Agent 15" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 15`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 15"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Search for "Xima Agent 17" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Xima Agent 17`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 17"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Apply the agent selection
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! Apply the filter choice
  await page3.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  //!! Bring agent 20's page to the front for interaction
  await page.bringToFront();
  
  //!! Click the button to open active media menu
  await page.locator(`[data-cy="active-media-menu-button"]`).click();
  
  //!! Select "New Call" from the menu
  await page.locator(`:text("New Call")`).click();
  
  //!! Confirm the new call
  await page.locator(`:text("Confirm")`).click();
  
  //!! Input first "2" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("2A B C")`).click();
  
  //!! Input second "2" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("2A B C")`).click();
  
  //!! Input "0" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("0+")`).click();
  
  //!! Initiate the call
  await page.locator(`[data-cy="call-button"]`).click({ delay: 150 });
  
  //!! Verify that connection to call recipient is being established
  await expect(page.locator(`:text("Connecting to...")`)).toBeVisible();
  
  //!! Bring back agent 15 page to the front for interaction
  await page2.bringToFront();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  //!! Check that Agent 15 receives an incoming call
  await expect(
    page2.locator(
      `[data-cy="alert-incoming-call-title-selector"]:has-text("Incoming Call")`,
    ),
  ).toBeVisible();
  
  // Answer call
  await page2.click('span:text-is("Answer Call")');
  
  // Transfer call to Agent 3
  await page.bringToFront();
  await page.locator(`[data-cy="transfer-btn"]`).click();
  
  //!! Input first "1" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("1")`).click();
  
  //!! Input second "1" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("1")`).click();
  
  //!! Input "7" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("7")`).click();
  
  //!! Initiate the call
  await page.locator(`[data-cy="call-button"]`).click();
  
  // Click "Assisted Transfer"
  await page.click('span:text-is("Assisted Transfer")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Go back to webphone and pick up call
  await webPhonePageSecond.bringToFront();
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
  await expect(page.locator('span:text-is("Internal Call Ended")')).toHaveCount(
    2,
  );
  
  // CLEANUP
  // End call on webphone
  await webPhonePageSecond.bringToFront();
  await webPhonePageSecond.locator(`[data-testid="CallEndIcon"]:visible`).click();
  
  // Assert call ended
  await page.bringToFront();
  await page
    .locator(`xima-dialog-header`)
    .getByText(`Internal Call Ended`)
    .click();
  
});