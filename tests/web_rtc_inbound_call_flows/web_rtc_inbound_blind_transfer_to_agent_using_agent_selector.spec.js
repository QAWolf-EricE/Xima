import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_blind_transfer_to_agent_using_agent_selector", async () => {
 // Step 1. Login as WebRTC Agent 4 & 5 (direct to agent)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // REQ03 Login as WebRTC Agent 1
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_1_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 300,
    },
  );
  
  // create new context and log in as WebRTC Agent 2
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_2_EMAIL,
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // toggle agent 2 skills on
  await page2.waitForTimeout(1000);
  await toggleSkill(page2, "31");
  
  // toggle agent 2 status as ready
  await toggleStatusOn(page2);
  
  // create new context and log in as Supervisor
  const context2 = await browser.newContext();
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
  
  // focus Agent 1
  await page.bringToFront();
  
  // toggle agent 1 skills on
  await page.waitForTimeout(1000);
  await toggleSkill(page, "31");
  
  // REQ134 Toggle Agent status to Ready
  await page.waitForTimeout(1000);
  await toggleStatusOn(page);
  
  // REQ135 Simulate an incoming call
  let callId = await createCall({
    number: "4352551621",
  });
  console.log("CALL ID: " + callId);
  await page.waitForTimeout(3000);
  await inputDigits(callId, [1]);
  
  // REQ192 WebRTC Agent able to answer incoming call on UI
  await page.click('button:has-text("Answer Call")', {
    timeout: 3 * 60 * 1000,
  });
  
  // REQ202 WebRTC blind transfer by Agent Name
  await page.waitForTimeout(1000);
  await page.click('[data-cy="transfer-btn"]');
  await page.waitForTimeout(1000);
  await page.click(
    '[role="tab"]:has([data-mat-icon-name="agent"]), button:has-text("Blind transfer")',
  );
  await page.waitForTimeout(1000);
  await page.click(
    '[role="tab"]:has([data-mat-icon-name="agent"]), button:has-text("Blind transfer")',
  );
  await page.waitForTimeout(1000);
  await page.click(':text("WebRTC Agent 2")');
  await page.waitForTimeout(1000);
  await page
    .click('button:has-text("Blind transfer")', { timeout: 5000 })
    .catch((err) => {
      console.error(err);
    });
  
  // REQ200 WebRTC agent can answer transfer
  await page2.bringToFront();
  await page2.click('button:has-text("Answer Call")');
  
  // assert ext calls don't stick previous agent in the call,
  // finishing on one agent doesn't end call for the other
  await page.bringToFront();
  await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
  await page.click('[data-cy="finish-btn"]');
  await page.click('[data-cy="alert-after-call-work-done"]');
  await expect(page.locator("text=Phone not available")).not.toBeVisible();
  await page2.bringToFront();
  await expect(page2.locator('[data-cy="end-call-btn"]')).toBeVisible();
  
  // REQ201 Supervisor can view new transferred agent is now talking
  await page3.bringToFront();
  
  // // Apply filter to show available agents
  //!! click the REALTIME_DISPLAYS menu
  await page3.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click 'Supervisor View' text item
  await page3.click(':text("Supervisor View")');
  
  //!! click filter and select 'Agent', expect this to pass within 120 seconds
  await expect(async () => {
    await page3.locator(`[data-cy="supervisor-view-filter-title"]`).click();
    await page3.locator('[placeholder="Select type"]').click();
    await page3
      .locator(`[id*='mat-option']:has-text("Agent")`)
      .click({ force: true });
  }).toPass({ timeout: 1000 * 120 });
  
  //!! click the edit button for the first report preview parameter
  await page3.waitForTimeout(1000);
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // first select all agents
  // click checkbox
  let checkboxLocator = page3.locator(
    `[data-cy="xima-list-select-select-all"]>>input`,
  );
  
  // Uncheck checkbox
  await checkboxLocator.uncheck();
  
  // Fill agent we will call
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 2(203)`);
  
  // Wait for search results to load
  await expect(
    page3.getByRole(`option`, { name: `WebRTC Agent 2(203)` }),
  ).toBeVisible();
  
  // click checkbox
  await checkboxLocator.check();
  
  // Click apply
  await page3.waitForTimeout(1000);
  await page3.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // CLick apply
  await page3.waitForTimeout(1000);
  await page3.locator(`[data-cy="supervisor-view-filter-apply-button"]`).click();
  
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  
  //!! wait for changes to settle
  await page3.waitForTimeout(1000);
  
  // Assert that agent was found "Talking"
  await expect(
    page3.locator(
      'app-agent-status-container:has(.agent-status-fullname:text-is("WebRTC Agent 2 (203)"))',
    ),
  ).toContainText("Talking");
  
  // Clean up - reset filter that showed all agents available
  await page3.keyboard.press("Escape");
  await page3.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
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
  
  // REQ197 WebRTC Agent can hang up a call from the UI
  await page2.bringToFront();
  await page2.click('[data-cy="end-call-btn"]');
  await page2.click('[data-cy="finish-btn"]');
  
  // REQ146 Log back into Admin user and assert call correctness
  await page3.bringToFront();
  await page3.waitForTimeout(1000);
  await page3.hover(`[data-cy="sidenav-menu-REPORTS"]`);
  await page3.click(':text("Cradle to Grave")');
  await page3.click('[aria-label="Open calendar"]');
  await page3.click(`.mat-calendar-body-cell :text-is("1")`);
  await page.waitForTimeout(500);
  await page3.click(".mat-calendar-body-today");
  await page3.waitForTimeout(1000);
  await page3.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  ); // click apply
  
  // expand last oubound call report
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.waitForTimeout(5000);
  
  await page3
    .locator(
      'mat-row:has-text("Call"):has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
    )
    .click();
  try {
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Transfer");
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Talking");
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Ringing");
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Drop");
  } catch {
    await page3
      .locator(
        'mat-row:has-text("Call"):has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
      )
      .click();
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Transfer");
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Talking");
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Ringing");
    await expect(
      page3.locator(`app-cradle-to-grave-table-row-details`),
    ).toContainText("Drop");
  }
  
 // Step 2. Simulate an incoming call (direct to agent)
  // Description:
 // Step 3. Answer Call (direct to agent)
  // Description:
 // Step 4. Blind transfer by Agent Name (direct to agent)
  // Description:
 // Step 5. Supervisor can view new transferred agent is now talking (direct to agent)
  // Description:
 // Step 6. View Call in C2G (direct to agent)
  // Description:
});