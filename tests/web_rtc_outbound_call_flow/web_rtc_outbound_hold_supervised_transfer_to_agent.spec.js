import { buildUrl, getOutBoundNumber, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_outbound_hold_supervised_transfer_to_agent", async () => {
 // Step 1. Simulate an outbound call through WebRTC UI (outbound call assisted transfer with hold)
  // --------------------------------
  // Arrange:
  // --------------------------------
  // Login as WebRTC Agent 58
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_58_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // toggle agent 58 skills on
  await page.bringToFront();
  await toggleSkillsOn(page, "43");
  
  // create new context and log in as WebRTC Agent 59
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_59_EMAIL,
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
  
  // toggle agent 59 skills on
  await toggleSkillsOn(page2, "44");
  await page2.waitForTimeout(2000);
  
  // toggle agent 59 status as ready
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
  // Toggle Agent 58 status to Ready
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
  await page.waitForTimeout(1600);
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
  await page.waitForTimeout(1600);
  await page.click('[data-cy="call-button"]');
  await page.click('span:text-is("Skill 43")');
  
  // assert call active to agent 58
  await expect(
    page.locator(`app-call-container span:has-text("Outbound Call")`),
  ).toBeVisible();
  await expect(
    page.locator(`.dialog-body div:has-text("WebRTC Agent 58")`),
  ).toBeVisible();
  
  // press hold
  await expect(page.locator(`[data-cy="hold-btn"]`)).toBeVisible();
  await page.waitForTimeout(5 * 1000);
  await page.locator(`[data-cy="hold-btn"]`).click({ force: true });
  
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
    ).not.toHaveAttribute("class", /checkbox-checked/, { timeout: 10 * 1000 });
  } catch (err) {
    await page3
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .evaluate((node) => node.click());
    console.error(err);
  }
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("WebRTC Agent 58");
  await page3.waitForTimeout(1500);
  await page3.locator(`[data-cy="xima-list-select-option"]`).click();
  await page3.waitForTimeout(1500);
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("WebRTC Agent 59");
  await page3.waitForTimeout(1500);
  await page3.locator(`[data-cy="xima-list-select-option"]`).click();
  
  await page3.waitForTimeout(2000);
  await page3.locator('button.apply> span:text-is(" Apply ")').click();
  await page3.waitForTimeout(2000);
  await page3.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  // Assert that agent 58 is on hold
  await expect(
    page3.locator(
      'app-agent-status-container:has-text("WebRTC Agent 58") [class="realtime-status-bar-container"]:has-text("Hold")',
    ),
  ).toBeVisible({ timeout: 120000 });
  
  // take off hold
  await page.bringToFront();
  await page.locator(`[data-cy="hold-btn"]`).click();
  
  // check that agent 58 is talking in supervisor view
  await page3.bringToFront();
  await expect(
    page3.locator(
      'app-agent-status-container:has-text("WebRTC Agent 58") [class="realtime-status-bar-container"]:has-text("Talking")',
    ),
  ).toBeVisible();
  
  // click transfer button
  await page.bringToFront();
  await page.waitForTimeout(1000);
  await page.click('[data-cy="transfer-btn"]');
  
  // click agent option
  await page.click('[role="tab"]:has([data-mat-icon-name="agent"])');
  
  // select webrtc agent 59
  await page.click(':text("WebRTC Agent 59")');
  
  // click assisted transfer
  await page.click(':text("Assisted Transfer")');
  
  // bring agent 59 page to view
  await page2.bringToFront();
  
  // assert "Assisted Transfer Attempt"
  await expect(page2.locator(`:text("Assisted Transfer Attempt")`)).toBeVisible();
  
  // assert "WebRTC Agent 58" is shown
  await expect(
    page2.locator(`xima-dialog-body:has-text("WebRTC Agent 58")`),
  ).toBeVisible();
  
  // answer transfer call
  await page2.click('button:has-text("Answer Call")');
  
  // assert "Assisted Transfer Pending"
  await expect(page2.locator(`:text("Assisted Transfer Pending")`)).toBeVisible();
  
  // bring agent 58 page to view
  await page.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // assert connected
  await expect(
    page.locator(`xima-call span:has-text("Connected")`),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  
  // assert "WebRTC Agent 59"
  await expect(
    page.locator(`.dialog-body div:has-text("WebRTC Agent 59")`),
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // complete transfer
  await page.waitForTimeout(1000);
  await page.locator(`[data-cy="complete-transfer-btn"]`).click();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`xima-call span:has-text("Call Ended")`),
  ).toBeVisible();
  await expect(
    page.locator(`.dialog-body div:has-text("WebRTC Agent 59")`),
  ).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Supervisor can view new transferred agent is now talking
  await page3.bringToFront();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that agent 59 was found "Talking"
  await expect(
    page3.locator(
      'app-agent-status-container:has-text("WebRTC Agent 59") [class="realtime-status-bar-container"]:has-text("Talking")',
    ),
  ).toBeVisible();
  
  // Clean up - reset filter that showed all agents available
  await page3.keyboard.press("Escape");
  await page3.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.waitForTimeout(1600);
  await page3.locator('button.apply> span:text-is(" Apply ")').click();
  await page3.waitForTimeout(1600);
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
  
  // unready agent
  await page2.click('[class="dnd-status-container"] button', {
    force: true,
  });
  await page2.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(419, 180, 164)");
  
  // unready original agent
  await page.bringToFront();
  await page.click('[class="dnd-status-container"] button', {
    force: true,
  });
  await page.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(419, 180, 164)");
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).not.toHaveCSS("color", "rgb(419, 180, 164)");
  
  // Log back into Admin user and assert call correctness
  await page3.bringToFront();
  await page3.hover('[data-mat-icon-name="reports"]');
  await page3.click(
    'app-navigation-menu-translation:has-text("Cradle to Grave")',
  );
  await page3.click('[aria-label="Open calendar"]');
  await page3.click(".mat-calendar-body-today");
  await page3.click(".mat-calendar-body-today");
  await page3.waitForTimeout(2000);
  await page3.click('button:has-text("Apply")');
  await page3.waitForTimeout(2000);
  
  // include filter to have unique agent to avoid collisions
  await page3.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("WebRTC Agent 58");
  await page3.waitForTimeout(2000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.waitForTimeout(2000);
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("WebRTC Agent 59");
  await page3.waitForTimeout(2000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page3.waitForTimeout(2000);
  await page3
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  try {
    await expect(page3.locator(`mat-progress-bar`)).toBeVisible({
      timeout: 5000,
    });
    await expect(page3.locator(`mat-progress-bar`)).not.toBeVisible();
  } catch (e) {
    console.log(e);
  }
  
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
  try {
    await page3
      .locator(
        'mat-row:has-text("Outbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
      )
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing") >>nth=0`,
    ),
  ).toBeVisible();
  
  // Try to close expanded view if open
  try {
    await page3
      .locator(
        `[data-cy="cradle-to-grave-table-row-details-collapse-row-button"]`,
      )
      .click({ timeout: 4000 });
  } catch (err) {
    console.log(err);
  }
  
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`,
    ),
  ).toHaveCount(3);
  
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text-is("Hold")`,
    ),
  ).toBeVisible();
  
  // Try to open expanded view
  try {
    await page3
      .locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"]`)
      .click({ timeout: 4000 });
  } catch (err) {
    console.log(err);
  }
  
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Ringing")`,
    ),
  ).toHaveCount(2);
  
  await expect(
    page3.locator(
      `[data-cy="cradle-to-grave-table-cell-event-name"] :text("Talking")`,
    ),
  ).toHaveCount(4);
  
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
  
 // Step 2. Supervisor can view new transferred agent is now talking (outbound call assisted transfer with hold)
  
 // Step 3. View Call in C2G (outbound call assisted transfer with hold)
  
});