import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_blind_transfer_to_agent_using_dial_pad", async () => {
 // Step 1. Login as WebRTC Agent 14 & 2 (dial pad)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // REQ03 Login as WebRTC Agent 5
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_5_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 300,
    },
  );
  
  // create new context and log in as WebRTC Agent 6
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_6_EMAIL,
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // toggle agent 6 skills on
  await toggleSkillsOn(page2, 33);
  
  // toggle agent 6 status as ready
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
  
  // uncomment to check version for bug reports
  // await page3.click('[data-cy="home-component-arrow-drop-down-button"]');
  // await page3.click('[data-cy="home-component-menu-option-about-button"]');
  // const version = await page3.innerText('[data-cy="about-ccaas-version"]');
  // console.log("XIMA CURRENT VERSION " + version);
  
  // focus Agent 5
  await page.bringToFront();
  
  // toggle agent 5 skills on
  await toggleSkillsOn(page, 33);
  
  // REQ134 Toggle Agent status to Ready
  await toggleStatusOn(page);
  
  // REQ135 Simulate an incoming call
  let callId = await createCall({
    number: "4352551621",
  });
  console.log("CALL ID: " + callId);
  await page.waitForTimeout(3000);
  await inputDigits(callId, [3]);
  
  // REQ192 WebRTC Agent able to answer incoming call on UI
  await page.click('button:has-text("Answer Call")', { timeout: 5 * 60 * 1000 });
  
  // Provide version and callid when reporting a bug
  // console.log("version: " + version + ",callid: " + callId);
  
  // REQ199 WebRTC blind transfer by dial pad
  await page.click('[data-cy="transfer-btn"]');
  await page.waitForTimeout(1000);
  await page.keyboard.type("208");
  await page.waitForTimeout(1000);
  await page.locator('[data-cy="call-button"]').click();
  await page.click(':text("Blind Transfer")');
  await page.waitForTimeout(1000);
  
  // REQ200 WebRTC agent can answer transfer
  await page2.bringToFront();
  await page2.click('button:has-text("Answer Call")');
  
  // after call agent's phone is available
  await page.bringToFront();
  await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
  await page.waitForTimeout(5000);
  await page.click('[data-cy="finish-btn"]');
  await page.click('[data-cy="alert-after-call-work-done"]');
  await expect(page.locator("text=Phone not available")).not.toBeVisible();
  
  // REQ201 Supervisor can view new transferred agent is now talking
  await page3.bringToFront();
  await page3.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  await page3.locator(`:text("Supervisor View")`).click();
  
  // Apply filter to show available agents
  await page3.click('[data-mat-icon-name="filter"]');
  await page3.click('[data-mat-icon-name="edit"]');
  await page3.waitForTimeout(4000);
  if (
    await page3
      .locator('[data-cy="xima-list-select-select-all"] input')
      .isChecked()
  ) {
    await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  }
  await page3.waitForTimeout(3000);
  
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 6`);
  
  await page3.waitForTimeout(2000);
  await page3.locator(`[data-cy="xima-list-select-option"] div >> nth=0`).click();
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
  
  // Scroll agent into view
  let attempts = 0;
  await page3.click('[class="realtime-status-main-container"]');
  if (
    !(await page3
      .locator('.agent-status-fullname:has-text("WebRTC Agent 6")')
      .isVisible())
  ) {
    while (
      !(await page3
        .locator('.agent-status-fullname:has-text("WebRTC Agent 6")')
        .isVisible()) &&
      attempts < 50
    ) {
      await page3.keyboard.press("PageDown");
      await page3.waitForTimeout(2000);
      attempts += 1;
    }
  }
  
  // Assert that agent was found "Talking"
  await expect(
    page3
      .locator('app-agent-status-container:has-text("WebRTC Agent 6")')
      .first(),
  ).toContainText("Talking");
  
  // Clean up - reset filter that showed all agents available
  await page3.keyboard.press("Escape");
  await page3.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page3
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  await page3.locator(`[data-cy="xima-list-select-select-all"]`).click();
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
  await page2.waitForTimeout(5000);
  await page2.click('[data-cy="end-call-btn"]');
  await page2.click('[data-cy="finish-btn"]');
  
  // unready agent
  // await page2.locator('[role="switch"]').click({ force: true });
  await page2
    .locator(
      '[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])',
    )
    .click();
  await page2.getByRole(`menuitem`, { name: `Break` }).click();
  
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page2.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  // unready original agent
  await page.bringToFront();
  // await page.locator('[role="switch"]').click({ force: true });
  await page
    .locator(
      '[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])',
    )
    .click();
  await page.getByRole(`menuitem`, { name: `Break` }).click();
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  // REQ146 Log back into Admin user and assert call correctness
  await page3.bringToFront();
  await page3.locator(`[data-cy="sidenav-menu-REPORTS"]`).click();
  await page3.click(':text("Cradle to Grave")');
  await page3.click('[aria-label="Open calendar"]');
  await page3.click(`.mat-calendar-body-cell :text-is("1")`);
  await page.waitForTimeout(500);
  await page3.click(".mat-calendar-body-today");
  await page3.waitForTimeout(1000);
  
  // choose agent 5
  try {
    await page3
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  } catch {
    await page3.locator(`xima-header-add`).getByRole(`button`).click();
    await page3
      .locator(`[data-cy="xima-criteria-selector-search-input"]`)
      .fill(`Agent`);
    await page3.getByText(`Agent`, { exact: true }).click();
    await page3
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
      )
      .click();
  }
  await page3.fill('[data-cy="xima-list-select-search-input"]', "WebRTC Agent 5");
  await page3.waitForTimeout(2000);
  await page3.click('[data-cy="xima-list-select-option"]');
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  
  // choose skill 33
  await page3
    .locator(
      `[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`,
    )
    .click();
  await page3
    .locator(
      `[data-cy="checkbox-tree-property-option"]:has-text("Skill 33") >> nth=0`,
    )
    .click();
  await page3.locator(`[data-cy="checkbox-tree-dialog-apply-button"]`).click();
  
  // apply
  await page3.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  );
  
  // expand most recent inbound call report
  await page.waitForTimeout(3000);
  await page3
    .locator(
      `[data-cy="cradle-to-grave-table-header-cell-START"] :text("Start Timestamp")`,
    )
    .click();
  
  await page3.click(
    'mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0',
  );
  await expect(page3.locator(".mat-column-expandedDetail:visible")).toContainText(
    "Transfer",
    {
      timeout: 3000,
    },
  );
  await expect(page3.locator(".mat-column-expandedDetail:visible")).toContainText(
    "Queue",
  );
  await expect(page3.locator(".mat-column-expandedDetail:visible")).toContainText(
    "Talking",
  );
  await expect(page3.locator(".mat-column-expandedDetail:visible")).toContainText(
    "Receiving Drop",
  );
  
 // Step 2. Simulate an incoming call (dial pad)
  // Description:
 // Step 3. Answer Call (dial pad)
  // Description:
 // Step 4. Blind Transfer (dial pad)
  // Description:
 // Step 5. Supervisor can view new transferred agent is now talking (dial pad)
  // Description:
 // Step 6. View Call in C2G (dial pad)
  // Description:
});