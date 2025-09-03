import { buildUrl, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_internal_assisted_transfer_using_dialpad", async () => {
 // Step 1. Call other agent
  // --------------------------------
  // Arrange:
  // --------------------------------
  // Log in to Agent 55
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_55_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Log in to Agent 56
  const { browser: browser4, page: page4 } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_56_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // toggle skill for agent 56
  await page4.bringToFront();
  await toggleSkill(page4, "41");
  
  // Toggle status on for Agent 56
  await toggleStatusOn(page4);
  
  //!! Create a new context for WebRTC Agent 57
  const context = await browser.newContext();
  
  //!! Open a new page
  const page2 = await context.newPage();
  
  //!! Load the base website URL
  await page2.bringToFront();
  await page2.goto(buildUrl("/"));
  
  //!! Fill the username field with the email of WebRTC Agent 57
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_57_EMAIL,
  );
  
  //!! Fill the password field with the password of WebRTC Agent 57
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  
  //!! Click the login button
  await page2
    .locator('[data-cy="consolidated-login-login-button"]')
    .click({ delay: 150 });
  
  //!! Enable agent 57's skills
  await toggleSkill(page2, "41");
  
  //!! Wait for 3 seconds for the skill toggle to take effect
  await page2.waitForTimeout(3000);
  
  //!! Toggle agent 57's status as ready
  await toggleStatusOn(page2);
  
  //!! Bring agent 55's page to the front for interaction
  await page.bringToFront();
  
  //!! Enable agent 55's skills
  await toggleSkill(page, "42");
  
  //!! Toggle agent 57's status to ready
  await toggleStatusOn(page);
  
  //!! Verify that agent 55's status is "Ready"
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  //!! Verify that agent 55's voice icon color signifies readiness
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Verify that agent 55's chat icon color signifies readiness
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Bring back agent 57's page to the front for interaction
  await page2.bringToFront();
  
  //!! Verify that agent 57's status is "Ready"
  await expect(page2.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  //!! Verify that agent 57's voice icon color signifies readiness
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Verify that agent 57's chat icon color signifies readiness
  await expect(
    page2.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! Create a new context for a Supervisor
  const context2 = await browser.newContext({ timezoneId: "America/Denver" });
  
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
  
  //!! Search for "Agent 55" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 55`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 55"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Search for "Agent 57" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 57`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 56"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Search for "Agent 56" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 56`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 56"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Apply the agent selection
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! Apply the filter choice
  await page3.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  //!! Bring agent 55's page to the front for interaction
  await page.bringToFront();
  
  //!! Click the button to open active media menu
  await page.locator(`[data-cy="active-media-menu-button"]`).click();
  
  //!! Select "New Call" from the menu
  await page.locator(`:text("New Call")`).click();
  
  //!! Confirm the new call
  await page.locator(`:text("Confirm")`).click();
  
  //!! Input first "2" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("7P Q R S")`).click();
  
  //!! Input second "2" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("3D E F")`).click();
  
  //!! Input "6" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("3D E F")`).click();
  await page.waitForTimeout(3000);
  
  //!! Initiate the call
  await page.locator(`[data-cy="call-button"]`).click({ delay: 150 });
  
  //!! Verify that connection to call recipient is being established
  await expect(page.locator(`:text("Connecting to...")`)).toBeVisible();
  
  //!! Bring back agent 21's page to the front for interaction
  await page2.bringToFront();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  //!! Check that Agent 57 receives an incoming call
  await expect(
    page2.locator(
      `[data-cy="alert-incoming-call-title-selector"]:has-text("Incoming Call")`,
    ),
  ).toBeVisible();
  
  // Answer call
  await page2.waitForTimeout(2000);
  await page2.click('span:text-is("Answer Call")');
  
  // Agent 55 puts call on hold
  await page.bringToFront();
  await page.waitForTimeout(2000);
  await page.click('[mattooltip="Hold"]');
  
  // Agent 55 takes call off hold
  await page.waitForTimeout(2000);
  await page.click('[mattooltip="Hold"]');
  
  // Transfer call to Agent 56
  await page.bringToFront();
  await page.waitForTimeout(2000);
  await page.locator(`[data-cy="transfer-btn"]`).click();
  
  //!! Input first "2" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("7P Q R S")`).click();
  
  //!! Input second "2" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("3D E F")`).click();
  
  //!! Input "7" digit to the number pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("2A B C")`).click();
  await page.waitForTimeout(3000);
  
  //!! Initiate the call
  await page.locator(`[data-cy="call-button"]`).click();
  
  // Click "Assisted Transfer"
  await page.waitForTimeout(2000);
  await page.click('span:text-is("Assisted Transfer")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that Agent 56 receives transferred call
  await page4.bringToFront();
  await expect(
    page4.locator(':text(" Assisted Transfer Attempt ")'),
  ).toBeVisible();
  
  // Ansser call
  await page4.waitForTimeout(2000);
  await page4.locator(`:text("Answer Call")`).click();
  
  // Complete tranfer
  await page.bringToFront();
  await page.waitForTimeout(2000);
  await page.getByRole(`button`, { name: `Complete Transfer` }).click();
  
  // See that transfer finished
  await page4.bringToFront();
  await expect(page4.locator(`:text("Call Active")`)).toBeVisible();
  
  // Clean up - end call
  await page2.bringToFront();
  await page2.waitForTimeout(2000);
  await page2.click('[data-cy="end-call-btn"]');
  
  // See call ended automatically
  await page4.waitForTimeout(1000);
  await expect(
    page2.locator(`xima-dialog-header`).getByText(`Internal Call Ended`),
  ).toBeVisible();
  
  // Click Close
  await page2.getByRole(`button`, { name: `Close` }).click();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Bring supervisor page to front
  await page3.waitForTimeout(10000);
  await page3.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click reports
  await page3.locator(`[data-cy="sidenav-menu-REPORTS"]`).click();
  
  // Click cradle to grave
  await page3
    .locator(
      `[data-cy="reports-c2g-component-tab-ctog"]:has-text("Cradle to Grave")`,
    )
    .click();
  
  // Click agents
  await page3
    .locator(
      `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  
  //!! Search for "Agent 55" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 55`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 55"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Search for "Agent 57" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 57`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 57"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Search for "Agent 56" in the agent filter search field
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 56`);
  
  //!! Wait for a second for the agent filter search result to appear
  await page3.waitForTimeout(1000);
  
  //!! Click the first search result for "Agent 56"
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  // Click Apply
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // Click Apply
  await page3.waitForTimeout(1000);
  await page3
    .locator(`[data-cy="configure-cradle-to-grave-container-apply-button"]`)
    .click();
  
  await page3.waitForTimeout(1000);
  
  // Sort by latest
  await page3
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`,
    )
    .click();
  
  // Move first columns into view
  const numberOfPresses = 50;
  for (let i = 0; i < numberOfPresses; i++) {
    await page3.keyboard.press("ArrowLeft");
  }
  
  // Click call
  await page3
    .locator(
      `[data-cy="cradle-to-grave-table-cell-CALLING_PARTY"]:has-text("WebRTC Agent 55")>>nth=0`,
    )
    .click();
  
  // expand the call row if it's not expanded
  const locator = page3.locator(
    'mat-row:has([data-cy="cradle-to-grave-table-row-details-expand-row-button"]):has-text("Transfer Hold"):has-text("Hold party hang up")',
  );
  if (!(await locator.isVisible())) {
    await page3
      .locator(
        'mat-row:has([data-cy="cradle-to-grave-table-row-details-expand-row-button"]):has-text("Transfer Hold") [data-mat-icon-name="chevron-closed"]',
      )
      .click();
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-INFO"] :text("Internal")>>nth=0`,
    ),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Ringing")>>nth=0`,
    ),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")>>nth=0`,
    ),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Hold")>>nth=0`,
    ),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")>>nth=1`,
    ),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Transfer Hold")`,
    ),
  ).toBeVisible();
  await expect(
    page3
      .locator(
        `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Ringing")`,
      )
      .last(),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")>>nth=2`,
    ),
  ).toBeVisible({ timeout: 3000 });
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Calling drop")>>nth=0`,
    ),
  ).toBeVisible({ timeout: 3000 });
  
 // Step 2. Call events are logged into cradle to grave
  
});