import { buildUrl, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_internal_blind_transfer_to_external_number", async () => {
 // Step 1. Call agent 13 with agent 11
  //--------------------------------
  // Arrange:
  //--------------------------------
  // agent 50 calls agent 51, agent 51 transfer call to 8889449462
  
  //!! log in as WebRTC Agent 50 and set browser, context, and first page
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_50_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    }
  );
  
  //!! create a new context for the second agent's login
  const context = await browser.newContext();
  
  //!! create a new page for the second agent
  const page2 = await context.newPage();
  
  //!! navigate to a web address for the second agent
  await page2.bringToFront()
  await page2.goto(buildUrl("/"));
  
  //!! fill in the username for the second agent (Agent 51)
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_51_EMAIL
  );
  
  //!! fill in the password for the second agent (Agent 51)
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD
  );
  
  //!! click the login button for the second agent (Agent 51)
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! toggle Agent 51's skills on
  await toggleSkill(page2, "39");
  
  //!! wait for 3 seconds
  await page2.waitForTimeout(3000);
  
  //!! toggle Agent 51's status to 'Ready'
  await toggleStatusOn(page2);
  
  //!! check if Agent 51's status is 'Ready'
  await expect(page2.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready"
  );
  
  //!! check if voice channel of Agent 51 is active
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! check if chat channel of Agent 51 is active
  await expect(
    page2.locator('[data-cy="channel-state-channel-CHAT-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! bring Agent 50's browser to the front
  await page.bringToFront();
  
  //!! toggle Agent 50's skills on
  await toggleSkill(page, "40");
  
  //!! click to change the status of Agent 50
  await toggleStatusOn(page);
  
  //!! check if Agent 50's status is 'Ready'
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready"
  );
  
  //!! check if voice channel of Agent 50 is active
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! check if chat channel of Agent 50 is active
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]')
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  //!! create a new context for the supervisor's login
  const context2 = await browser.newContext();
  
  //!! create a new page for the supervisor
  const page4 = await context2.newPage();
  
  //!! navigate to a web address for the supervisor
  await page4.goto(buildUrl("/"));
  
  //!! fill in the username for the Supervisor
  await page4.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME
  );
  
  //!! fill in the password for the Supervisor
  await page4.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD
  );
  
  //!! click the login button for the Supervisor
  await page4.click('[data-cy="consolidated-login-login-button"]');
  
  await expect(async () => {
    //!! hover over the 'REALTIME_DISPLAYS' section of the menu
    await page4.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  
    //!! click on 'Supervisor View'
    await page4.locator(`:text("Supervisor View")`).click();
  }).toPass({ timeout: 1000 * 120 });
  
  //!! wait for 3 seconds
  await page4.waitForTimeout(3000);
  
  //!! click on the 'filter-title' button to filter the view further
  await page4
    .locator(
      `[data-cy="supervisor-view-filter-title"] #mat-button-toggle-5-button`
    )
    .click();
  
  //!! click to edit the preview input
  await page4
    .locator(`[data-cy="xima-preview-input-edit-button"]`)
    .first()
    .click();
  
  //!! wait for 3 seconds
  await page4.waitForTimeout(3000);
  
  //!! try to clear the agent filter if all agents are selected
  try {
    await expect(page4.locator(`:text("0 Agents Selected")`)).toBeVisible({
      timeout: 3000,
    });
  } catch {
    try {
      // if select all checkbox is checked, uncheck it
      await expect(
        page4.locator(
          `[data-cy="xima-list-select-select-all"] .mdc-checkbox--selected`
        )
      ).toBeVisible({
        timeout: 3000,
      });
      await page4.waitForTimeout(1000);
      await page4.locator(`[data-cy="xima-list-select-select-all"]`).click();
    } catch (err) { 
        console.log(err)
      }
    await page4.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page4.waitForTimeout(1000);
    await page4.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page4.waitForTimeout(1000);
  }
  
  //!! fill in 'Agent 50' to the agent filter
  await page4
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 50`);
  
  //!! wait for 1 second
  await page4.waitForTimeout(1000);
  
  //!! select 'Agent 50' from the options
  await page4.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! add 'Agent 51' to the agent filter
  await page4
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`Agent 51`);
  
  //!! wait for 1 second
  await page4.waitForTimeout(1000);
  
  //!! select 'Agent 51' from the options
  await page4.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! click on the 'apply' button to apply the agent filter
  await page4.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! click on the 'apply' button to apply the view filter
  await page4.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  // See refresh dialog
  await expect(page4.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
  // Click OK
  await page4.getByRole(`button`, { name: `Ok` }).click();
  
  let attempts = 0;
  while (attempts < 50) {
    try {
      await expect(
        page4.locator(`app-agent-status:has-text("WebRTC Agent 50")`)
      ).toBeVisible({ timeout: 1000 });
      break;
    } catch {
      await page4.mouse.wheel(0, 300);
      await page4.waitForTimeout(500);
    }
    attempts += 1;
  }
  
  //!! check if there are 2 'Ready' agents
  await expect(page4.locator(`:text("Ready"):visible`)).toHaveCount(2);
  
  //!! check if Agent 50's status is 'Ready'
  await expect(
    page4.locator('app-agent-status:has-text("WebRTC Agent 50")')
  ).toContainText("Ready");
  
  //!! check if Agent 51's status is 'Ready'
  await expect(
    page4.locator('app-agent-status:has-text("WebRTC Agent 51")')
  ).toContainText("Ready");
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Simulate an incoming call from Agent 50 to Agent 51
  
  //!! bring Agent 50's browser to the front
  await page.bringToFront();
  
  //!! click on the 'active-media-menu-button'
  await page.locator(`[data-cy="active-media-menu-button"]`).click();
  
  //!! click on 'New Call'
  await page.locator(`:text("New Call")`).click();
  
  //!! confirm the new call
  await page.locator(`:text("Confirm")`).click();
  
  //!! dial '2' on the dial pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("7P Q R S")`).click();
  
  //!! dial '1' on the dial pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("2A B C")`).click();
  
  //!! dial '7' on the dial pad
  await page.locator(`[data-cy="dialpad-number"]:has-text("7P Q R S")`).click();
  
  //!! click on the 'call' button
  await page.locator(`[data-cy="call-button"]`).click({ delay: 150 });
  
  //!! verify the 'Connecting to...' text is visible
  await expect(page.locator(`:text("Connecting to...")`)).toBeVisible();
  
  //!! bring Agent 51's browser to the front
  await page2.bringToFront();
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Assert that Agent 51 receives a call and save the pages
  
  //!! check if Agent 51 receives an incoming call
  await expect(
    page2.locator(
      `[data-cy="alert-incoming-call-title-selector"]:has-text("Incoming Call")`
    )
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! answer the incoming call on {page2}
  
  //!! click the button to answer the incoming call
  await page2.locator(`[data-cy="alert-incoming-call-accept"]`).click();
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! check the call status on the Supervisor View, reload the page, assert agent's statuses, and focus on Agent 12
  
  //!! bring {page4} to the foreground
  await page4.bringToFront()
  
  //!! reload the {page4}
  await page4.reload()
  
  attempts = 0;
  while (attempts < 50) {
    try {
      await expect(page4.getByText("WebRTC Agent 50").first()
      ).toBeVisible({ timeout: 1000 });
      break
    } catch {
      await page4.mouse.wheel(0, 300);
      await page4.waitForTimeout(500);
    }
    attempts += 1;
  }
  
  //!! wait for changes to settle
  await page4.waitForTimeout(5000);
  
  //!! expect the text "Talking" appears twice
  await expect(page4.locator(`:text("Talking"):visible`)).toHaveCount(2);
  
  //!! expect the 'WebRTC Agent 50' status to contain "Talking"
  await expect(
    page4.locator('app-agent-status:has-text("WebRTC Agent 50")').first()
  ).toContainText("Talking");
  
  //!! expect the 'WebRTC Agent 51' status to contain "Talking"
  await expect(
    page4.locator('app-agent-status:has-text("WebRTC Agent 51")').first()
  ).toContainText("Talking");
  
  //!! bring {page2} to the foreground 
  await page2.bringToFront()
  
  //! verify that the call is active
  
  //!! expect the text "Call Active" to be visible
  await expect(page2.locator(`xima-call span:has-text("Call Active")`)).toBeVisible();
  
  //! perform a "blind transfer" using the dial pad on page2, then return to page3 to answer the transfer
  
  //!! click on the transfer button 
  await page2.click('[data-cy="transfer-btn"]');
  
  //!! wait for 1 second
  await page2.waitForTimeout(1000);
  
  //!! type "8889449462" using the keyboard
  await page2.keyboard.type("8889449462");
  
  //!! wait for 1 second
  await page2.waitForTimeout(1000);
  
  //!! click on the call button
  await page2.locator('[data-cy="call-button"]').click();
  
  //!! click on "Blind Transfer" text
  await page2.click(':text("Blind Transfer")');
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  // //!! expect the finish button to be visible
  await expect(page2.locator('[data-cy="finish-btn"]')).toBeVisible();
  
  // //!! wait for 5 seconds
  await page2.waitForTimeout(5000);
  
  // //!! click on the finish button
  await page2.click('[data-cy="finish-btn"]');
  
  //! Bring the supervisor view to the front
  
  //!! Bring the supervisor view page to the front
  await page4.bringToFront()
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify the statuses of Agent 50, Agent 12, and Agent 51
  
  //!! Ensure that the status of "WebRTC Agent 50" is "Talking"
  await expect(
    page4.locator('app-agent-status:has-text("WebRTC Agent 50")').first()
  ).toContainText("Talking");
  
  //!! Ensure that the status of "WebRTC Agent 51" is "Ready"
  await expect(
    page4.locator('app-agent-status:has-text("WebRTC Agent 51")')
  ).toContainText("Ready");
  
  
  // Clean up
  
  //! Reset the filter and re-assign roles for Agents 50, and 51
  
  //!! Click to reset the filter that shows all available agents
  await page4.locator(`[data-cy="supervisor-view-filter-title"] [name="mat-button-toggle-group-0"]`).click();
  
  //!! Click the first edit button of the preview input
  await page4.locator(`[data-cy="xima-preview-input-edit-button"]`).first().click();
  
  //!! Fill the input field of the select search with `Agent 50`
  await page4.locator(`[data-cy="xima-list-select-search-input"]`).fill(`Agent 50`);
  
  // End call for agent
  await page.bringToFront();
  await page.locator(`[data-cy="end-call-btn"]`).click();
  
  //!! Wait for 1 second
  await page4.waitForTimeout(1000);
  
  //!! Click the first option in the list select for Agent 50
  await page4.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Fill the input field of the select search with `Agent 51`
  await page4.locator(`[data-cy="xima-list-select-search-input"]`).fill(`Agent 51`);
  
  //!! Wait for 1 second
  await page4.waitForTimeout(1000);
  
  //!! Click the first option in the list select for Agent 12
  await page4.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Click the apply button for agents' roles dialog
  await page4.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! Click the apply button for supervisor view filter
  await page4.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Navigate to C2G in reports
  await page4.bringToFront();
  
  // See refresh dialog
  await expect(page4.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
  // Click OK
  await page4.getByRole(`button`, { name: `Ok` }).click();
  
  //!! click on the Reports navigation on page4 to navigate to C2G
  await page4.locator(`[data-cy="sidenav-menu-REPORTS"]`).click();
  
  //!! click on the c2g-component-tab-ctog to open up C2G.
  await page4.locator(`[data-cy="reports-c2g-component-tab-ctog"]`).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Apply filter "Agent 51", sort by "Start Time" and expand the most recent call
  
  // Pause to let call develop in C2G
  await page.waitForTimeout(10 * 1000);
  
  //!! click on the preview input edit button in "PBX_USERS" on page4 to apply filters 
  await page4.locator(`[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`).click();
  
  //!! fill the search input with "Agent 51" on page4
  await page4.locator(`[data-cy="xima-list-select-search-input"]`).fill(`Agent 51`);
  
  //!! wait for 1 second
  await page4.waitForTimeout(1000);
  
  //!! select the first option in the list
  await page4.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! click on the apply button in the agents roles dialog
  await page4.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // click todays date
  await page4.locator('mat-datepicker-toggle').click();
  await page4.locator(`.mat-calendar-body-cell :text-is("1")`).click();
  await page4.locator(`.mat-calendar-body-cell-content:text-is("${dateFns.getDate(new Date())}")`).click();
  
  //!! click on the apply button in the cradle-to-grave container
  await page4.locator(`[data-cy="configure-cradle-to-grave-container-apply-button"]`).click();
  
  //!! click on the "Start Timestamp" column header in the cradle to grave table to sort data
  await page4.locator(`[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`).click();
  await page4.locator(`[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`).click();
  await page4.waitForTimeout(5000);
  
  //!! click to expand the most recent "Internal" call
  await page4.locator(`[data-cy="cradle-to-grave-table-cell-INFO"]:has-text("Internal")`).first().click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify call statuses are as expected - Ringing, Talking, Transfer, Ringing, Drop, and then cleanup - end calls
  
  //!! expect the text "Ringing" to appear twice in the call statuses
  await expect(page4.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing")`)).toHaveCount(2);
  
  //!! expect the text "Talking" to appear twice in the call statuses
  await expect(page4.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`)).toHaveCount(2);
  
  //!! expect the text "Transfer" to be visible in the call statuses
  await expect(page4.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Transfer")`)).toBeVisible();
  
  //!! expect the text "Drop" to be visible in the call statuses
  await expect(page4.locator(`[data-cy="cradle-to-grave-table-cell-event-name"] :text("Drop")`)).toBeVisible();
  
  //!! Bring page to the front
  await page.bringToFront();
  
  //!! Expect the text "Internal Call Ended" to be visible on main page
  await expect(page.locator(`xima-call span:has-text("Internal Call Ended")`)).toBeVisible();
  
  //!! Click the finish button on the main page
  await page.locator(`[data-cy="finish-btn"]`).click();
  
 // Step 2. Answer call
  
 // Step 3. Blind transfer (dial pad)
  
 // Step 4. Supervisor can view new transferred agent is now talking
  
 // Step 5. Call appears on C2G
  
});