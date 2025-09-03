import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_supervised_transfer_to_skill_using_skill_selector", async () => {
 // Step 1. Create Inbound call to Agent 27
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Log in as three different WebRTC Agents (27, 29, and supervisor) on separate pages, set their status as 'Ready' and filter them in supervisor view.
  
  //!! log in as WebRTC Agent 27 and set browser, context, and first page
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_27_EMAIL,
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
  await page2.goto(buildUrl("/"));
  
  //!! fill in the username for the second agent (Agent 29)
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_29_EMAIL
  );
  
  //!! fill in the password for the second agent (Agent 29)
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD
  );
  
  //!! click the login button for the second agent (Agent 29)
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! toggle Agent 27's skills on
  await toggleSkill(page, "10");
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  // toggle status on
  await toggleStatusOn(page);
  
  // Toggle off all channels aside from email
  await page.locator(`.ready [data-mat-icon-name="chat"]`).click();
  await page.locator(`.ready [data-mat-icon-name="email"]`).click();
  await expect(page.locator(`.channels-disabled [data-mat-icon-name="chat"]`)).toBeVisible();
  await expect(page.locator(`.channels-disabled [data-mat-icon-name="email"]`)).toBeVisible();
  
  //!! bring Agent 29's browser to the front
  await page2.bringToFront();
  
  //!! toggle Agent 29's skills on
  await toggleSkill(page2, "11");
  
  //!! wait for 3 seconds
  await page2.waitForTimeout(3000);
  
  // toggle status on
  await toggleStatusOn(page2)
  
  // Toggle off all channels aside from email
  await page2.locator(`.ready [data-mat-icon-name="chat"]`).click();
  await page2.locator(`.ready [data-mat-icon-name="email"]`).click();
  await expect(page2.locator(`.channels-disabled [data-mat-icon-name="chat"]`)).toBeVisible();
  await expect(page2.locator(`.channels-disabled [data-mat-icon-name="email"]`)).toBeVisible();
  
  //!! bring Agent 27's browser to the front
  await page.bringToFront();
  
  //!! create a new context for the supervisor's login
  const context2 = await browser.newContext();
  
  //!! create a new page for the supervisor
  const page3 = await context2.newPage();
  
  //!! navigate to a web address for the supervisor
  await page3.goto(buildUrl("/"));
  
  //!! fill in the username for the Supervisor
  await page3.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME
  );
  
  //!! fill in the password for the Supervisor
  await page3.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD
  );
  
  //!! click the login button for the Supervisor
  await page3.click('[data-cy="consolidated-login-login-button"]');
  
  //!! hover over the 'REALTIME_DISPLAYS' section of the menu
  await page3.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  
  //!! click on 'Supervisor View'
  await page3.locator(`:text("Supervisor View")`).click();
  
  //!! wait for 3 seconds
  await page3.waitForTimeout(3000);
  
  //!! click on the 'filter-title' button to filter the view further
  await page3
    .locator(
      `[data-cy="supervisor-view-filter-title"] #mat-button-toggle-5-button`
    )
    .click();
  
  //!! click to edit the preview input
  await page3
    .locator(`[data-cy="xima-preview-input-edit-button"]`)
    .first()
    .click();
  
  //!! wait for 3 seconds
  await page3.waitForTimeout(3000);
  
  //!! try to clear the agent filter if all agents are selected
  try {
    await expect(page3.locator(`:text("0 Agents Selected")`)).toBeVisible({
      timeout: 3000,
    });
  } catch {
    try { // if select all checkbox is checked, uncheck it
      await expect(
        page3.locator(
          `[data-cy="xima-list-select-select-all"] .mdc-checkbox--selected`
        )
      ).toBeVisible({
        timeout: 3000,
      });
      await page3.waitForTimeout(1000);
      await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
    }  catch (err) {
        console.log(err)
       }
    await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page3.waitForTimeout(1000);
    await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page3.waitForTimeout(1000);
  }
  
  //!! fill in 'Agent 27' to the agent filter
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 27`);
  
  //!! wait for 1 second
  await page3.waitForTimeout(1000);
  
  //!! select 'Agent 27' from the options
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! add 'Agent 29' to the agent filter
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 29`);
  
  //!! wait for 1 second
  await page3.waitForTimeout(1000);
  
  //!! select 'Agent 29' from the options
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! click on the 'apply' button to apply the agent filter
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! click on the 'apply' button to apply the view filter
  await page3.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  // See refresh dialog
  await expect(page3.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  //!! check if there are 2 'Ready' agents
  await expect(page3.locator(`:text("Idle"):visible`)).toHaveCount(2);
  
  //!! check if Agent 27's status is 'Ready'
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 27")')
  ).toContainText("Idle");
  
  //!! check if Agent 29's status is 'Ready'
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 29")')
  ).toContainText("Idle");
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  //! Simulate an Inbound call to Agent 27
  await page.bringToFront();
  let callId = await createCall({ number: `4352005133` });
  
  //!! log the value of {callId}
  console.log("callId", callId);
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! input the {callId} and digit 0 for skill 10
  await inputDigits(callId, [0]);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Assert that Agent 27 receives a call and save the pages
  
  //!! check if Agent 27 receives an incoming call
  await expect(page.locator(`[data-cy="alert-incoming-call-title-selector"]:has-text("Incoming Call")`)).toBeVisible();
  
  
 // Step 2. Answer call
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! answer the incoming call on {page2}
  
  //!! click the button to answer the incoming call
  await page.locator(`[data-cy="alert-incoming-call-accept"]`).click();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! check the call status on the Supervisor View, reload the page, assert agent's statuses, and focus on Agent 12
  
  //!! bring {page3} to the foreground
  await page3.bringToFront()
  
  //!! reload the {page3}
  await page3.reload()
  
  //!! wait for changes to settle
  await page3.waitForTimeout(5000);
  
  //!! expect the text "Talking" appears once
  await expect(page3.locator(`:text("Talking"):visible`)).toHaveCount(1);
  
  //!! expect the 'WebRTC Agent 27' status to contain "Talking"
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 27")').first()
  ).toContainText("Talking");
  
  //!! expect the 'WebRTC Agent 13' status to contain "Talking"
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 29")').first()
  ).toContainText("Idle");
  
  //!! bring {page} to the foreground 
  await page.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! verify that the call is active
  
  //!! expect the text "Call Active" to be visible
  await expect(page.locator(`xima-call span:has-text("Call Active")`)).toBeVisible();
  
  //! ----
 // Step 3. Assisted transfer
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Wait for 2 seconds before transfer
  await page.waitForTimeout(2000);
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  //!! click on the transfer button 
  await page.click('[data-cy="transfer-btn"]');
  
  //!! wait for 1 second
  await page.waitForTimeout(1000);
  
  // navigate to skill tab
  await page.locator(`[data-mat-icon-name="skill"]`).click();
  
  // select Skill 11 (Agent 29's skill)
  await page.locator(`.item-list-item :text("Skill 11")`).click();
  
  // select assisted transfer option
  await page.locator(`:text("Assisted Transfer")`).click();
  
  // Expect call to be connected
  await expect(page.locator(`xima-dialog-header`)).toHaveText("Connected");
  
  //!! wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! bring page to the front
  await page2.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //! verify an incoming call is made to page from a WebRTC Agent 29, accept this call, and then return to page2 to end the call
  
  //!! expect the title of the incoming call alert to be visible
  await expect(page2.locator(`[data-cy="alert-incoming-call-title-selector"]:has-text("Incoming Call")`)).toBeVisible();
  
  //!! expect the incoming call alert display text to be "WebRTC Agent 3(205)"
  await expect(page2.locator(`[data-cy="alert-incoming-call-calling-number"]:has-text("WebRTC Agent 27(684)")`)).toBeVisible();
  
  //!! click the accept button on the incoming call alert
  await page2.locator(`:text("Answer Call")`).click();
  
  // Let call connect for 2 seconds before completing transfer
  await page.waitForTimeout(2000);
  
  //!! bring page back to the front
  await page.bringToFront();
  
  // complete transfer
  await page.locator(`[data-cy="complete-transfer-btn"]`).click();
  
  await page.getByRole(`button`, { name: `I Am Done` }).click();
  
 // Step 4. Supervisor can view new transferred agent is now talking
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Prepare the supervisor view
  
  
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Bring the supervisor view to the front
  
  //!! Bring the supervisor view page to the front
  await page3.bringToFront()
  
  //! ----
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify the statuses of Agent 27, Agent 29
  
  //!! Ensure that the status of "WebRTC Agent 27" is "Idle"
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 27")').first()
  ).toContainText("Idle");
  
  //!! Ensure that the status of "WebRTC Agent 29" is "Talking"
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 29")')
  ).toContainText("Talking");
  
  //! ----
  
  
  // Clean up
  
  //! Reset the filter and re-assign roles for Agents 1, 2, and 3
  
  //!! Click to reset the filter that shows all available agents
  await page3.locator(`[data-cy="supervisor-view-filter-title"]`).click();
  
  //!! Click the first edit button of the preview input
  await page3.locator(`[data-cy="xima-preview-input-edit-button"]`).first().click();
  
  //!! Fill the input field of the select search with `Agent 1`
  await page3.locator(`[data-cy="xima-list-select-search-input"]`).fill(`Agent 27`);
  
  //!! Wait for 1 second
  await page3.waitForTimeout(1000);
  
  //!! Click the first option in the list select for Agent 1
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Fill the input field of the select search with `Agent 3`
  await page3.locator(`[data-cy="xima-list-select-search-input"]`).fill(`Agent 29`);
  
  //!! Wait for 1 second
  await page3.waitForTimeout(1000);
  
  //!! Click the first option in the list select for Agent 3
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! Click the apply button for agents' roles dialog
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! Click the apply button for supervisor view filter
  await page3.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  //! ----
 // Step 5. Call appears on C2G
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // End call for Agent 29
  await page2.bringToFront();
  await page2.waitForTimeout(2000);
  await page2.locator(`[data-cy="end-call-btn"]`).click();
  
  //!! Expect the text "Internal Call Ended" to be visible on main page
  await expect(
    page2.locator(`xima-call span:has-text("Call Ended")`),
  ).toBeVisible();
  
  // Click Close button
  await page2.getByRole(`button`, { name: `Close` }).click();
  
  // Click "I Am Done" button if it has not timed out
  try {
    await page2
      .getByRole(`button`, { name: `I Am Done` })
      .click({ timeout: 5000 });
  } catch {
    console.log("Message timed out.");
  }
  
  //! Navigate to C2G in reports
  await page3.bringToFront();
  
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  //!! click on the Reports navigation on page3 to navigate to C2G
  await page3.locator(`[data-cy="sidenav-menu-REPORTS"]`).click();
  
  //!! click on the c2g-component-tab-ctog to open up C2G.
  await page3.locator(`[data-cy="reports-c2g-component-tab-ctog"]`).click();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Apply filter "Agent 12", sort by "Start Time" and expand the most recent call
  await page3
    .locator(
      `[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .first()
    .click();
  await page3.waitForTimeout(1000);
  await page3.getByLabel(`All`).check();
  await page3.getByLabel(`All`).uncheck();
  await page3.waitForTimeout(1000);
  await page3.getByRole(`option`, { name: `Calls` }).click();
  await page3.getByRole(`button`, { name: `Apply` }).click({ delay: 500 });
  
  //!! click on the preview input edit button in "PBX_USERS" on page3 to apply filters
  await page3
    .locator(
      `[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  
  //!! fill the search input with "Agent 12" on page3
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 27`);
  
  //!! wait for 1 second
  await page3.waitForTimeout(10000);
  
  //!! select the first option in the list
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! click on the apply button in the agents roles dialog
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! click on the apply button in the cradle-to-grave container
  await page3
    .locator(`[data-cy="configure-cradle-to-grave-container-apply-button"]`)
    .click();
  
  //!! click on the "Start Timestamp" column header in the cradle to grave table to sort data
  await page3
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`,
    )
    .click();
  
  //!! click to expand the most recent "Internal" call
  try {
    await page3
      .locator(
        `[data-cy="cradle-to-grave-table-expand-row-button"] + :has-text("Inbound")`,
      )
      .first()
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify call statuses are as expected - Queue, Talking, Transfer Hold, Queue, Talking, Tansfer, Talking, Receiving drop
  // Refresh the queue
  
  await expect(async () => {
    await page.bringToFront();
    await toggleSkill(page, "10");
  
    //!! expect the text "Queue" appears in the call status index 1
    await page3.bringToFront();
    await expect(
      page3.locator(
        `[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Queue") >> nth=0`,
      ),
    ).toBeVisible();
  }).toPass({ intervals: [15 * 1000], timeout: 5 * 60 * 1000 });
  
  // Expect the text "Talking" and "Skill 10" to appear in the call status at index 2 on page3
  const row = page3
    .locator('[data-cy="cradle-to-grave-table-row-details-row"]')
    .nth(2);
  
  await expect(
    page3
      .locator(`[data-cy="cradle-to-grave-table-row-details-cell-INFO"] #talking`)
      .first(),
  ).toBeVisible();
  await expect(
    row.locator(
      '[data-cy="cradle-to-grave-table-row-details-cell-SKILL"]:has-text("Skill 10")',
    ),
  ).toBeVisible();
  
  //!! expect the text "Transfer Hold" and "Skill 10" to be visible in the call status index 3
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=3 >> :text-is("Transfer Hold")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=3 >> :text-is("Skill 10")`,
    ),
  ).toBeVisible();
  
  // expect the text "Queue" appears in the call status index 4
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=4 >> :text-is("Queue")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Talking" and "Skill 11" appears in the call status index 5
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=5 >> :text-is("Talking")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=5 >> :text-is("Skill 11")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Talking" and "Skill 11" appears in the call status index 6
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=6 >> :text-is("Transfer")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=6 >> :text-is("Skill 11")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Talking" appears in the call status index 7
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=7 >> :text-is("Talking")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Receiving Drop" to be visible in the call statuses
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >> nth=8 >> :text-is("Receiving Drop")`,
    ),
  ).toBeVisible();
  
  //!! Bring page to the front
  await page.bringToFront();
  
  //!! Click the end call button on page
  try {
    await page.locator(`[data-cy="end-call-btn"]`).click({ timeout: 5000 });
  } catch {
    await expect(
      page.locator(`xima-dialog-header:has-text("Call Ended")`),
    ).toBeVisible();
    console.log("Call ended automatically");
  }
  
  //!! Expect the text "Call Ended" to be visible on page
  await expect(
    page.locator(`xima-call span:has-text("Call Ended")`),
  ).toBeVisible();
  
  //!! Click the finish button on page
  try {
    await page
      .locator(`xima-dialog-header`)
      .filter({ hasText: `Manage Skills` })
      .getByRole(`button`)
      .click({ timeout: 5000 });
  } catch {
    console.log("Manage skills window not open.");
  }
  await page.locator(`[data-cy="finish-btn"]`).click();
  
});