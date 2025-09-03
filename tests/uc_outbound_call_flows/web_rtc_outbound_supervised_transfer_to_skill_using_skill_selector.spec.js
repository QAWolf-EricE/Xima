import { buildUrl, getOutBoundNumber, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_outbound_supervised_transfer_to_skill_using_skill_selector", async () => {
 // Step 1. Simulate an outbound call through WebRTC UI (outbound call assisted transfer to UC group)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as Web Agent 48
  const { page } = await logInWebRTCAgent(process.env.WEBRTCAGENT_48_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Toggle agent skills on
  await toggleSkillsOn(page, "7");
  await toggleStatusOn(page);
  
  // Toggle off all channels aside from voice
  await page.locator(`.ready [data-mat-icon-name="chat"]`).click();
  await expect(
    page.locator(`.channels-disabled [data-mat-icon-name="chat"]`),
  ).toBeVisible();
  try {
    // Try to toggle off email
    await page
      .locator(`.ready [data-mat-icon-name="email"]`)
      .click({ timeout: 10 * 1000 });
    await expect(
      page.locator(`.channels-disabled [data-mat-icon-name="email"]`),
    ).toBeVisible();
  } catch {
    // There is an active email
    await expect(
      page.locator(`[data-cy="active-media-tile-EMAIL"]`),
    ).toBeVisible();
  }
  
  // Login as a Web agent 49
  const {
    page: page2,
    browser,
    context: context2,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_49_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Toggle agent skills on
  await page2.bringToFront();
  await toggleSkillsOn(page2, "65");
  await toggleStatusOn(page2);
  
  // Toggle off all channels aside from voice
  await page2.locator(`.ready [data-mat-icon-name="chat"]`).click();
  await expect(
    page2.locator(`.channels-disabled [data-mat-icon-name="chat"]`),
  ).toBeVisible();
  try {
    // Try to toggle off email
    await page2
      .locator(`.ready [data-mat-icon-name="email"]`)
      .click({ timeout: 10 * 1000 });
    await expect(
      page2.locator(`.channels-disabled [data-mat-icon-name="email"]`),
    ).toBeVisible();
  } catch {
    // There is an active email
    await expect(
      page2.locator(`[data-cy="active-media-tile-EMAIL"]`),
    ).toBeVisible();
  }
  
  // Create new context and log in as Supervisor
  const context3 = await browser.newContext();
  const page3 = await context3.newPage();
  await page3.goto(buildUrl("/"));
  await page3.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  await page3.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  await page3.click('[data-cy="consolidated-login-login-button"]');
  
  // Hover over the 'REALTIME_DISPLAYS' section of the menu
  await page3.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  
  // Click on 'Supervisor View'
  await page3.getByRole(`button`, { name: `Supervisor View` }).click();
  
  //!! wait for 3 seconds
  await page3.waitForTimeout(3000);
  
  //!! click on the 'filter-title' button to filter the view further
  await page3.locator(`[data-cy="supervisor-view-filter-title"]`).click();
  
  //!! click to edit the preview input
  await page3
    .locator(`[data-cy="xima-preview-input-edit-button"]`)
    .first()
    .click();
  
  //!! wait for 3 seconds
  await page3.waitForTimeout(3000);
  
  // Ensure no agents are selected
  await expect(async () => {
    // Click the "Select All Agents" checkbox
    await page3.getByRole(`checkbox`, { name: `Select All Agents` }).click();
  
    // Assert the "All" checkbox is selected
    await expect(
      page3.getByRole(`checkbox`, { name: `Select All Agents` }),
    ).not.toHaveAttribute("class", /selected/, { timeout: 3 * 1000 });
  
    // Assert 0 agents are selected
    await expect(page3.locator(`:text("0 Agents Selected")`)).toBeVisible({
      timeout: 3 * 1000,
    });
  }).toPass({ timeout: 30 * 1000 });
  
  // Fill in 'Agent 48' to the agent filter
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 48`);
  
  //!! wait for 1 second
  await page3.waitForTimeout(1000);
  
  //!! select 'Agent 48' from the options
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! add 'Agent 49' to the agent filter
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 49`);
  
  //!! wait for 1 second
  await page3.waitForTimeout(1000);
  
  //!! select 'Agent 49' from the options
  await page3.locator(`[data-cy="xima-list-select-option"] div`).first().click();
  
  //!! click on the 'apply' button to apply the agent filter
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  //!! click on the 'apply' button to apply the view filter
  await page3.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  //!! check if Agent 48's status is 'Ready'
  try {
    await expect(
      page3.locator('app-agent-status:has-text("WebRTC Agent 48")'),
    ).toContainText("Idle", { timeout: 15 * 1000 });
  } catch {
    await expect(
      page3.locator('app-agent-status:has-text("WebRTC Agent 48")'),
    ).toContainText("Email", { timeout: 10 * 1000 });
  }
  
  //!! check if Agent 49's status is 'Ready'
  try {
    await expect(
      page3.locator('app-agent-status:has-text("WebRTC Agent 49")'),
    ).toContainText("Idle", { timeout: 10 * 1000 });
  } catch {
    await expect(
      page3.locator('app-agent-status:has-text("WebRTC Agent 49")'),
    ).toContainText("Email", { timeout: 10 * 1000 });
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  // WebRTC Agent 48 make an outbound call
  await page.bringToFront();
  
  // Click + button by Active Media
  await page.locator(`[data-cy="active-media-menu-button"]`).click();
  
  // Click "New Call"
  await page.getByRole(`menuitem`, { name: `New Call` }).click();
  
  // Handle No Emergency Calls modal
  await page.getByRole(`button`, { name: `Confirm` }).click();
  
  // Get phone number to make an outbound call
  const outboundNumberToCall = await getOutBoundNumber();
  console.log(outboundNumberToCall);
  
  // Fill phone number field
  await page.locator("#phoneNumberInput").fill(`${outboundNumberToCall}`);
  
  // Start call
  await page.locator(`[data-cy="call-button"]`).click();
  
  // Associate call with Agent 48's skill 7
  await page.click('span:text-is("Skill 7")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert call active to Agent 48
  await expect(
    page.locator(`xima-call span:has-text("Call Active")`),
  ).toBeVisible();
  await expect(
    page.locator(`xima-dialog:has-text("WebRTC Agent 48(724)")`),
  ).toBeVisible();
  
  // Assert call number is correct
  await expect(
    page.locator(`xima-dialog:has-text("${outboundNumberToCall}")`),
  ).toBeVisible();
  
  // Assert Agent statuses are correct in Supervisor view
  await page3.bringToFront();
  await page3.reload();
  
  //Expect the 'WebRTC Agent 48' status to contain "Talking"
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 48")').first(),
  ).toContainText("Talking");
  
  // Expect the 'WebRTC Agent 49' status to contain "Idle"
  try {
    await expect(
      page3.locator('app-agent-status:has-text("WebRTC Agent 49")'),
    ).toContainText("Idle", { timeout: 5 * 1000 });
  } catch {
    await expect(
      page3.locator('app-agent-status:has-text("WebRTC Agent 49")'),
    ).toContainText("Email", { timeout: 10 * 1000 });
  }
  
 // Step 2. Assisted transfer by dial pad (outbound call assisted transfer to UC Group)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Two second pause after call is connected
  await page.bringToFront();
  await page.waitForTimeout(2000);
  
  // Click transfer button
  await page.locator('[data-cy="transfer-btn"]').click();
  
  // Click "Skill" tab
  await page.locator('[role="tab"]:has([data-mat-icon-name="skill"])').click();
  
  // Select WebRTC Agent 49's skill 65
  await page.locator(`.item-list-item :text("Skill 65")`).click();
  
  // Click "Assisted Transfer"
  await page.locator(`:text("Assisted Transfer")`).click();
  
  // Expect call to be connected
  await expect(page.locator(`xima-dialog-header`)).toHaveText("Connected");
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Bring second agent's page to front (Agent 49)
  await page2.bringToFront();
  
  // Assert that "Incoming Call" is visible on Agent 49's page
  await expect(
    page2.locator('[data-cy="alert-incoming-call-title-selector"]:has-text("Incoming Call")')
  ).toBeVisible();
  
  // Assert caller is Agent 48
  await expect(page2.locator(`[data-cy="alert-incoming-call-calling-number"]:has-text("WebRTC Agent 48")`)).toBeVisible();
  
  // Two second pause after call is received
  await page.waitForTimeout(2000);
  
  // Answer the call
  await page2.locator(`:text-is("Answer Call")`).click();
  
  // Two second pause after call is answered
  await page.waitForTimeout(2000);
  
  // Assert that Agent 48 sees "Complete Transfer"
  await page.bringToFront();
  await expect(page.locator('[data-cy="complete-transfer-btn"]')).toBeVisible();
  
  // Let call connect for 2 seconds before completing transfer
  await page.waitForTimeout(2000);
  
  // Click "Complete Transfer" on agent 1's page
  await page.locator('[data-cy="complete-transfer-btn"]').click();
  
  // //--------------------------------
  // // Assert:
  // //--------------------------------
  // Assert "Assisted Transfer Pending" is no longer visible on Agent 49's page and call is active
  await page2.bringToFront();
  await expect(
    page2.locator('span:text-is("Assisted Transfer Pending")')
  ).toBeHidden();
  await expect(page2.locator('span:text-is("Call Active")')).toBeVisible();
  
  // Assert "Call Ended" is visible on Agent 48's page
  await page.bringToFront();
  await expect(page.locator('span:text-is("Call Ended")')).toBeVisible();
  
 // Step 3. Supervisor can view new transferred agent is now talking (outbound call assisted transfer to UC Group)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Supervisor can view new transferred agent is now talking
  await page3.bringToFront();
  await page3.reload();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Expect the 'WebRTC Agent 48' status to contain "Idle"
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 48")').first()
  ).toContainText("ACW");
  
  // Expect the 'WebRTC Agent 49' status to contain "Talking"
  await expect(
    page3.locator('app-agent-status:has-text("WebRTC Agent 49")').first()
  ).toContainText("Talking");
  
 // Step 4. View Call in C2G (outbound call assisted transfer to UC Group)
  // //--------------------------------
  // // Arrange:
  // //--------------------------------
  // WebRTC Agent 49 can hang up a call from the UI
  await page2.bringToFront();
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="end-call-btn"]').click();
  
  // Assert call ended
  await expect(
    page.locator(`app-call-container span:has-text("Outbound Call Ended")`),
  ).toBeVisible();
  await expect(
    page.locator(`xima-call span:has-text("Call Ended")`),
  ).toBeVisible();
  
  // Close call ended modal
  await page2.getByRole(`button`, { name: `Close` }).click();
  
  // Unready agent
  await page2.locator('[class="dnd-status-container"] button').click();
  await page2.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page2.locator(`[data-cy="channel-state-label"]:has-text("Lunch")`),
  ).toBeVisible();
  
  // Unready original agent
  await page.bringToFront();
  await page.locator('[class="dnd-status-container"] button').click();
  await page.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page.locator(`[data-cy="channel-state-label"]:has-text("Lunch")`),
  ).toBeVisible();
  
  // Close call ended modal
  await page.locator(`button`).filter({ hasText: `Close` }).click();
  
  // Clean up - reset filter
  await page3.bringToFront();
  await page3.keyboard.press("Escape");
  await page3.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.waitForTimeout(1200);
  await page3.locator('button.apply> span:text-is(" Apply ")').click();
  await page3.waitForTimeout(1200);
  await page3.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  // Navigate to C2G
  await page3.hover('[data-mat-icon-name="reports"]');
  await page3
    .locator('app-navigation-menu-translation:has-text("Cradle to Grave")')
    .click();
  
  // Filter by Agent 48
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("WebRTC Agent 48");
  await page3.waitForTimeout(2000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page3.waitForTimeout(2000);
  
  // Check current date
  const currDate = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Denver",
    }),
  );
  const utcDate = new Date();
  const isSameDay = dateFns.isSameDay(currDate, utcDate);
  const isSameMonth = dateFns.isSameMonth(currDate, utcDate);
  console.log(isSameDay);
  
  // If there's a time difference, select the previous day
  if (!isSameDay) {
    // Open the calendar
    await page3.getByRole(`button`, { name: `Open calendar` }).click();
  
    // Click prev month if necessary
    if (!isSameMonth) {
      await page3.getByRole(`button`, { name: `Previous month` }).click();
    }
  
    const selectingDate = dateFns.format(currDate, "MMMM d,");
    await page3.getByRole(`button`, { name: selectingDate }).click();
    await page.waitForTimeout(1000);
    await page3.getByRole(`button`, { name: selectingDate }).click();
  }
  
  // Click Apply
  await page3
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  // //--------------------------------
  // // Act:
  // //--------------------------------
  // Filter by Start Time descending
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.waitForTimeout(2000);
  
  // Expand latest Outbound call report (try catch as could be already expanded)
  try {
    await page3
      .locator(
        'mat-row:has-text("Outbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
      )
      .click();
  } catch {
    //
  }
  
  // Close sub rows
  const openSubRows = page3.locator(
    `[data-cy="cradle-to-grave-table-row-details-collapse-row-button"]`,
  );
  while (await openSubRows.count()) {
    await openSubRows.first().click();
    await page3.waitForTimeout(1000);
  }
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert C2G correctness
  
  //! Verify call statuses are as expected - Ringing, Talking, Transfer Hold, Queue, Talking, Tansfer, Talking, Calling drop
  
  //!! expect the text "Ringing" appears in the call status index 1
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=1 >> :text("Ringing")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Talking" and "Skill 7" appears in the call status index 2
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=2 >> :text-is("Talking")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=2 >> :text-is("Skill 7")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Transfer Hold" and "Skill 7" to be visible in the call status index 3
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=3 >> :text-is("Transfer Hold")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=3 >> :text-is("Skill 7")`,
    ),
  ).toBeVisible();
  
  // expect the text "Queue" appears in the call status index 4
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=4 >> :text-is("Queue")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Talking" and "Skill 65" appears in the call status index 5
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=5 >> :text-is("Talking")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=5 >> :text-is("Skill 65")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Talking" and "Skill 65" appears in the call status index 6
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=6 >> :text-is("Transfer")`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-row-details-cell-SKILL"] >>nth=6 >> :text-is("Skill 65")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Talking" appears in the call status index 7
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=7 >> :text-is("Talking")`,
    ),
  ).toBeVisible();
  
  //!! expect the text "Calling Drop" to be visible in the call statuses
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] >>nth=8 >>  :text-is("Calling Drop")`,
    ),
  ).toBeVisible();
  
});