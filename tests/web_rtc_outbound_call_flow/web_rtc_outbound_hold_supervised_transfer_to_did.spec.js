import { buildUrl, getOutBoundNumber, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_outbound_hold_supervised_transfer_to_did", async () => {
 // Step 1. Simulate an outbound call through WebRTC UI (outbound call assisted transfer to external number)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as WebRTC Agent 62
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_62_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // toggle agent 62 skills on
  await page.bringToFront();
  await toggleSkillsOn(page, "56");
  
  // create new context and log in as WebRTC Agent 63
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_63_EMAIL,
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // If call in progress, hang up
  if (await page2.locator('[data-mat-icon-name="hangup"]').isVisible()) {
    await page2.click('[data-mat-icon-name="hangup"]');
  }
  
  // toggle agent 63 skills on
  await toggleSkillsOn(page2, "55");
  await page2.waitForTimeout(2000);
  
  // toggle agent 63 status as ready
  await toggleStatusOn(page2);
  
  // create new context and log in as Supervisor
  const context2 = await browser.newContext({ timezoneId: "America/Denver" });
  const page3 = await context2.newPage();
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
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Toggle Agent 62 status to Ready
  await page.bringToFront();
  await toggleStatusOn(page);
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  // Simulate an outbound call through WebRTC UI
  try {
    await page.click('[data-cy="end-call-btn"]', { timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  await page.locator('[data-cy="active-media-menu-button"]').click();
  await page.click('span:has-text("New Call")');
  
  // dial number to call
  await page.waitForTimeout(1200);
  try {
    await page.click(':text("Confirm")');
  } catch (err) {
    console.log(err);
  }
  await page.click("#phoneNumberInput");
  
  // get phone number to make an outbound call
  const outboundNumberToCall = await getOutBoundNumber();
  console.log(outboundNumberToCall);
  
  await page.keyboard.type(`${outboundNumberToCall}`);
  await page.waitForTimeout(1200);
  await page.click('[data-cy="call-button"]');
  await page.click('span:text-is("Skill 56")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert call active to agent 62
  await expect(
    page.locator(`app-call-container span:has-text("Outbound Call")`),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`.dialog-body div:has-text("WebRTC Agent 62")`),
  ).toBeVisible();
  
  // Small pause for "Ringing" event to develop in C2G
  await page.waitForTimeout(5000);
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // click transfer button
  await page.click('[data-cy="transfer-btn"]');
  
  // call agent 63
  await page.locator(`[data-cy="dialpad-number"]:has-text("7P Q R S")`).click();
  await page.locator(`[data-cy="dialpad-number"]:has-text("3D E F")`).click();
  await page.locator(`[data-cy="dialpad-number"]:has-text("9W X Y Z")`).click();
  await page.locator(`[data-cy="call-button"]`).click();
  
  // click assisted transfer
  await page.locator(':text("Assisted Transfer")').click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // bring agent 63 page to view
  await page2.bringToFront();
  
  // assert "Assisted Transfer Attempt"
  await expect(page2.locator(`:text("Assisted Transfer Attempt")`)).toBeVisible();
  
  // assert "WebRTC Agent 62" is shown
  await expect(
    page2.locator(`xima-dialog-body:has-text("WebRTC Agent 62")`),
  ).toBeVisible();
  
  // answer transfer call
  await page2.click('button:has-text("Answer Call")');
  
  // assert "Assisted Transfer Pending"
  await expect(page2.locator(`:text("Assisted Transfer Pending")`)).toBeVisible();
  
  // bring agent 62 page to view
  await page.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert connected
  await expect(
    page.locator(`xima-call span:has-text("Connected")`),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  
  // assert "WebRTC Agent 63"
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`.dialog-body div:has-text("WebRTC Agent 63")`),
  ).toBeVisible();
  
  // assert call ended upon completing transfer
  await page.waitForTimeout(1000);
  await page.locator(`[data-cy="complete-transfer-btn"]`).click();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`xima-call span:has-text("Call Ended")`),
  ).toBeVisible();
  await expect(
    page.locator(`.dialog-body div:has-text("WebRTC Agent 63")`),
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // check that call is on hold in supervisor view
  await page3.bringToFront();
  await page3.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  await page3.locator(`:text("Supervisor View")`).click();
  
  // Apply filter to show available agents
  await expect(async () => {
    await page3.locator('[data-cy="supervisor-view-filter-title"]').click();
    await page3.locator('[placeholder="Select type"]').click();
    await page3.locator('[role="option"] span:text-is("Agent")').click();
  }).toPass({ timeout: 1000 * 120 });
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  try {
    await expect(
      page3.locator('[data-cy="xima-list-select-select-all"]'),
    ).toBeEnabled();
    await expect(
      page3.locator('[data-cy="xima-list-select-select-all"]'),
    ).not.toHaveAttribute("class", /checkbox-checked/, { timeout: 10 * 1000 });
  } catch (err) {
    await page3
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .evaluate((node) => node.click());
    console.error(err);
  }
  
  // Search for WebRTC Agent 63
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("WebRTC Agent 63");
  
  // Soft assert the agent's option appears
  await expect(
    page3
      .locator(`[data-cy="xima-list-select-option"]`)
      .getByText("WebRTC Agent 63"),
  ).toBeVisible();
  
  // Ensure the agent is selected
  await expect(async () => {
    // Click on the agent option checkbox
    await page3.locator(`[data-cy="xima-list-select-option"]`).click();
  
    // Assert the agent is selected
    await expect(
      page3.locator(`[data-cy="xima-list-select-option"]`),
    ).toHaveAttribute("aria-selected", "true", { timeout: 3 * 1000 });
  }).toPass({ timeout: 30 * 1000 });
  
  // Click the "Apply" button in the modal
  await page3.locator('button.apply> span:text-is(" Apply ")').click();
  
  // Click the "Apply" button in the side menu
  await page3.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that agent was found "Talking"
  await expect(
    page3.locator(
      'app-agent-status-container:has-text("WebRTC Agent 63") [class="realtime-status-bar-container"]:has-text("Talking")',
    ),
  ).toBeVisible();
  
  // Clean up - reset filter
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
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // WebRTC Agent can hang up a call from the UI
  await page2.bringToFront();
  await page2.click('[data-cy="end-call-btn"]');
  
  // assert call ended
  await expect(
    page2.locator(`app-call-container span:has-text("Outbound Call Ended")`),
  ).toBeVisible();
  await expect(
    page2.locator(`xima-call span:has-text("Call Ended")`),
  ).toBeVisible();
  
  // unready agent
  await page2
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await page2.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(411, 180, 164)");
  
  // unready original agent
  await page.bringToFront();
  await page
    .locator(`[class="dnd-status-container"] button`)
    .click({ force: true });
  await page.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(411, 180, 164)");
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).not.toHaveCSS("color", "rgb(411, 180, 164)");
  
  // Log back into Admin user and assert call correctness
  await page3.bringToFront();
  await page3.hover('[data-mat-icon-name="reports"]');
  await page3.click(
    'app-navigation-menu-translation:has-text("Cradle to Grave")',
  );
  
  // change filter date range
  await page3.click(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
  ); // clicks calendar icon
  await page3.click(`.mat-calendar-body-cell:has-text("1") >> nth=0`);
  await page3.click(".mat-calendar-body-today");
  await page3.waitForTimeout(3000);
  await page3.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  ); // click apply
  
  // include filter to have unique agent to avoid collisions
  await page3.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("WebRTC Agent 63");
  await page3.waitForTimeout(2000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page3.waitForTimeout(2000);
  await page3
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  await expect(page3.locator(`mat-progress-bar`)).toBeVisible();
  await expect(page3.locator(`mat-progress-bar`)).not.toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // expand last oubound call report
  await page3.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page3.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page3.waitForTimeout(2000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert C2G correctness
  
  await page3
    .locator(`[data-cy="cradle-to-grave-table-expand-row-button"] >>nth=0`)
    .click();
  
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing") >>nth=0`,
    ),
  ).toBeVisible();
  
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`,
    ),
  ).toHaveCount(2);
  await page3
    .locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"]`)
    .click();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing")`,
    ),
  ).toHaveCount(2);
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`,
    ),
  ).toHaveCount(3);
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Transfer") >>nth=0`,
    ),
  ).toBeVisible();
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Drop") >>nth=0`,
    ),
  ).toBeVisible();
  
 // Step 2. Assisted transfer by dial pad (outbound call assisted transfer to external number)
  
 // Step 3. Supervisor can view new transferred agent is now talking (outbound call assisted transfer to external number)
  
 // Step 4. View Call in C2G (outbound call assisted transfer to external number)
  
});