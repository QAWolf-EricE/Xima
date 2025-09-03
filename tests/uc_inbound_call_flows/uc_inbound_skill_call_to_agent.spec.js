import { buildUrl, createCall, inputDigits, logInAgent, logUCAgentIntoUCWebphone, toggleSkillsOn, toggleStatusOff, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("uc_inbound_skill_call_to_agent", async () => {
 // Step 1. Login as UC Agent & Supervisor (inbound call presented...)
  /* **************
  Note: Please uncomment the Hold logic in this workflow once the 
  "Call status does not consistently update on supervisor view" bug is resolved.
  
  Bug link: https://app.qawolf.com/xima/bug-reports/43b1c2b0-9d6a-4db7-af8d-3f5c00a82944#
  *************** */
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as a UC Agent with specific arguments and permissions, destructuring the result to {page} and {browser}
  const { page, browser } = await logInAgent({
    email: process.env.UC_AGENT_16_EXT_116,
    password: process.env.UC_AGENT_16_EXT_116_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // log agent into webphone
  const { ucWebPhonePage } = await logUCAgentIntoUCWebphone(
    browser,
    process.env.UC_AGENT_16_EXT_116_WEBPHONE_USERNAME,
  );
  
  //!! turn on the agent skills for the "70" category
  await page.bringToFront();
  await toggleSkillsOn(page, "70");
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Log in as a supervisor on a new page and toggle agent status to Ready
  
  //!! create a new context for the supervisor login, destructuring the result to {context}
  const context = await browser.newContext({ timezoneId: "America/Denver" });
  
  //!! create a new supervisor page, with the result {page2}, in the newly created context
  const page2 = await context.newPage();
  
  //!! navigate to the main page using the {buildUrl} function in the new supervisor context
  await page2.goto(buildUrl("/"));
  
  //!! fill in the supervisor username input field with the supervisor username from the environment variables
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  
  //!! fill in the supervisor password input field with the supervisor password from the environment variables
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  
  //!! click on the login button of the supervisor page
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! bring the UC Agent page to the front
  await page.bringToFront();
  
  //!! click to change the agent status to "Ready"
  await toggleStatusOn(page);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Check if agent status is Ready and skills' colors are correct, and save {page} and {page2} to {shared}
  
  //!! expect the agent status to be "Ready"
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  await page.waitForTimeout(5000);
  await toggleStatusOn(page);
  
  //!! expect the voice channel icon to have a certain color
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! expect the chat channel icon to have a certain color
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Simulate an incoming call to Skill 70
  
  //!! simulate an incoming call and save the resulting call ID in {callId}
  let callId = await createCall({ number: `4352001585` });
  
  //!! log the value of {callId}
  console.log("callId", callId);
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! input the {callId} and digit 0 for skill 70
  await inputDigits(callId, [0]);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Navigate to skill queue count view in "Supervisor View"
  
  //!! bring the second page to front which is used by supervisor to view skill queue count
  await page2.bringToFront();
  
  //!! hover over the "REALTIME_DISPLAYS" button on the sidebar menu
  await page2.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  
  //!! click the "Supervisor View" button
  await page2.locator(`:text("Supervisor View")`).click();
  
  //!! click the settings menu button
  await expect(page2.locator(`[data-cy="settings-menu-button"]`)).toBeEnabled();
  await page2.locator(`[data-cy="settings-menu-button"]`).click();
  
  //!! click the "calls queue" option in the settings menu
  await expect(
    page2.locator(`[data-cy="settings-menu-views-calls-queue"]`),
  ).toBeEnabled();
  await page2.locator(`[data-cy="settings-menu-views-calls-queue"]`).click();
  
  //!! click the skill/group selection dropdown
  await expect(page2.locator(`.queued-calls-dropdown`)).toBeVisible();
  await page2.waitForTimeout(3000);
  await page2.locator(`.queued-calls-dropdown`).click();
  
  //!! select the last visible option "Skill 70" from the skill/group dropdown
  await page2.locator(`:text-is("Skill 70"):visible >> nth=-1`).click();
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that the skill queue displays correctly for skill 70
  
  //!! expect the item with text "In Queue (1)" under the header of the queued calls accordion to be visible
  await expect(
    page2.locator(`.queued-calls-accordion-header:has-text("In Queue (1)")`),
  ).toBeVisible();
  
  //!! expect the element with id "accordion-body-0" that has the text "Skill30/Xima Live Media" to be visible
  await expect(
    page2.locator(`#accordion-body-0:has-text("Xima Live Media")`),
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Load shared pages and bring the UC Agent page into view
  
  //!! Focus on the UC Agent page
  await page.bringToFront();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Answer incoming call on the UC Agent page
  await ucWebPhonePage.bringToFront();
  //!! Click the "Answer Call" button
  await ucWebPhonePage
    .locator(`button:has(+ p:text-is("ANSWER"))`)
    .click({ timeout: 2 * 60 * 1000 });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that the call is active, Skill queue count has decremented, and the "Skill30/Xima Live Media" element is not visible
  
  //!! Expect "Call Active" text to be visible
  await page.bringToFront();
  await expect(
    page.locator(`xima-call span:has-text("Call Active")`),
  ).toBeVisible();
  
  //!! Focus on the supervisor page
  await page2.bringToFront();
  
  //!! Expect "In Queue (0)" text to be visible
  await expect(
    page2.locator(`.queued-calls-accordion-header:has-text("In Queue (0)")`),
  ).toBeVisible();
  
  //!! Expect "Skill70/Xima Live Media" text to not be visible
  await expect(
    page2.locator(`#accordion-body-0:has-text("Skill70/Xima Live Media")`),
  ).not.toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Apply filters to show agents, select all available agents and apply filter
  
  //!! open "supervisor-view-filter-title", select the first option and choose "Agent", expecting this block of operations to pass within 120 seconds
  await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page2.locator(`[placeholder="Select type"]`).click();
  await page2.locator('[role="option"]:has-text("Agent")').click();
  
  //!! click the edit button of the first input in the "configure-report-preview-parameter-container"
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! if the "Select All Agents" checkbox isn't checked within 5 seconds, then manually check it
  try {
    await expect(
      page2.locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]'),
    ).not.toBeChecked({ timeout: 5000 });
  } catch (err) {
    await page2
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .evaluate((node) => node.click());
    console.error(err);
  }
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Xima Agent 16`);
  await page2.waitForTimeout(2000);
  await page2.locator(`[data-cy="xima-list-select-option"]`).click();
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! click the " Apply " button
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! click the "supervisor-view-filter-apply-button"
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that agent "Xima Agent 16" is "Talking (Skill 70)"
  
  //!! expect the text inside agent "Xima Agent 16"'s card to contain "Talking (Skill 70)"
  await expect(
    page2.locator('app-agent-status-container:has-text("Xima Agent 16")'),
  ).toContainText("Talking (Skill 70)");
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Prepare for UC Agent to mute a call
  
  //!! bring {page} to the front
  await ucWebPhonePage.bringToFront();
  
  //!! click the mute button on {page}
  await ucWebPhonePage.locator(`button:has-text("Mute"):visible`).click();
  
  await ucWebPhonePage.waitForTimeout(1000);
  await expect(
    ucWebPhonePage.locator(`button:has-text("Mute"):visible`),
  ).toHaveScreenshot("webphoneMuteActiveIcon.png");
  
  //!! click the mute button on {page} again
  await ucWebPhonePage.locator('button:has-text("Mute"):visible').click();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Let UC Agent put a call on hold
  
  // //!! click the hold button on {page}
  // await ucWebPhonePage.locator('button:has-text("Hold"):visible').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Confirm that the Supervisor can view the Agent currently on hold and then reset the supervisor view filter
  
  //!! bring {page2} to the front
  await page2.bringToFront();
  
  //!! confirm that Xima Agent 16's card on {page2} contains the text "Hold (Skill 70)"
  // await expect(
  //   page2.locator('app-agent-status-container:has-text("Xima Agent 16")'),
  // ).toContainText("Hold (Skill 70)");
  
  //!! press the "Escape" key on {page2} to reset the filter view
  await page2.keyboard.press("Escape");
  
  //!! click the filter title on {page2}
  await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  //!! click the first preview input edit button in the report preview parameter container
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! if the "Select All Agents" checkbox isn't checked within 5 seconds, then manually check it
  try {
    await expect(
      page2.locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]'),
    ).not.toBeChecked({ timeout: 5000 });
    await page2
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .evaluate((node) => node.click());
  } catch (err) {
    console.error(err);
  }
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! click the "Apply" button to confirm selection
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for another 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! apply the supervised view filter
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Prepare the shared UC Agent page
  
  //!! Bring the UC Agent page to the front
  await ucWebPhonePage.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Hang up the call, finish the action, and set the agent to 'unready' state
  
  //!! Click the 'end call' button
  await ucWebPhonePage.click('[data-testid="CallEndIcon"]');
  //!! Click the 'finish' button
  await page.bringToFront();
  await page.click('[data-cy="finish-btn"]');
  
  //!! Click on the element to set agent to unready state
  await toggleStatusOff(page);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify the agent is not ready
  
  //!! Assert that the voice channel icon doesn't have the green color indicating readiness
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Assert that the chat channel icon also doesn't have this green color.
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  // pause to develop in C2G
  await page.waitForTimeout(30 * 1000);
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Log in as Admin user, navigate to "Cradle to Grave" report, filter by a user named Xima Agent 16, change the date range, and apply the filter
  
  //!! Bring the Admin user's page to the front
  await page2.bringToFront();
  
  //!! Hover over the element containing the reports icon
  await page2.hover('[data-cy="sidenav-menu-REPORTS"]');
  
  //!! Click on the "Cradle to Grave" menu item
  await page2.click(':text-is("Cradle to Grave")');
  
  //!! Click on the "Configure Report Preview Parameter PBX_USERS" edit button
  try {
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  } catch {
    await page2.locator(`xima-header-add`).getByRole(`button`).click();
    await page2
      .locator(`[data-cy="xima-criteria-selector-search-input"]`)
      .fill(`Agent`);
    await page2.getByText(`Agent`, { exact: true }).click();
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  }
  
  //!! Fill in the search input with "Xima Agent 16"
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Xima Agent 16`);
  
  //!! Wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! Click on the first checkbox in the results list
  await page2
    .locator(`[data-cy="xima-list-select-option"]:has-text("Xima Agent 16")`)
    .click();
  
  //!! Click the apply button on the dialog
  await page2.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! Perform a click outside of any focused element
  await page2.mouse.click(0, 0);
  
  //!! Wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! Apply user filter by clicking the button named "Apply"
  await page2.click('button:has-text("Apply")');
  
  //--------------------------------
  // Act:
  //--------------------------------
  // wait for 60 seconds and the refresh CTG
  await page2.waitForTimeout(2 * 60 * 1000);
  await page2
    .locator(`[data-cy="cradle-to-grave-toolbar-refresh-button"]`)
    .click();
  
  //!! Click "START TIME" to sort by starting time of the call
  await page2.click('.mat-sort-header-container:has-text("START TIME")');
  
  //!! Click "START TIME" again to expand the sorted call details
  await page2.waitForTimeout(2000);
  await page2.click('.mat-sort-header-container:has-text("START TIME")');
  
  //!! Wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! Expand the details of the most recent inbound call
  await page2.click(
    'mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
  );
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Ensure the call record shows "Talking", "Hold", and "Drop" stages in "Cradle to Grave"
  
  //!! Check if "Talking" is present in the call details
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Talking")`),
  ).toBeVisible();
  
  // //!! Check if "Hold" is present in the call details
  // await expect(
  //   page2.locator(`app-cradle-to-grave-table-cell:has-text("Hold")`),
  // ).toBeVisible();
  
  //!! Check if "Drop" is present in the call details
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Drop")`),
  ).toBeVisible();
  
 // Step 2. Simulating an incoming call increases skill queue count (inbound call presented...)
  
 // Step 3. Skill queue count decreases once agent picks up (inbound call presented...)
  
 // Step 4. View Talking Agent as Supervisor (inbound call presented...)
  
 // Step 5. UC Agent can mute and put a call on hold (inbound call presented...)
  
 // Step 6. UC Agent can hang up a call (inbound call presented...)
  
 // Step 7. View Call in C2G (inbound call presented...)
  
});