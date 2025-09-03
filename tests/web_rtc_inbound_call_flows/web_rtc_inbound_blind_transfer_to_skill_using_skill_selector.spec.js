import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkill, toggleStatusOff, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_blind_transfer_to_skill_using_skill_selector", async () => {
 // Step 1. Login as WebRTC Agent 6 & 7 (skill group)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // REQ03 Login as WebRTC Agent 45
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_45_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // toggle agent 45 skills on
  await page.bringToFront();
  await toggleSkill(page, "58");
  
  // create new context and log in as WebRTC Agent 46
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_46_EMAIL,
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // toggle agent 46 skills on
  await toggleSkill(page2, "58");
  
  // toggle agent 2 status as ready
  await page2.waitForTimeout(3000);
  await toggleStatusOn(page2);
  await expect(page2.locator('[class="dnd-status-text"]')).toHaveText("Ready");
  await page2.waitForTimeout(2000);
  try {
    await expect(
      page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await page2.click('[data-cy="channel-state-channel-VOICE"]', {
      force: true,
      delay: 500,
    });
  } catch (err) {
    console.log(err);
  }
  try {
    await expect(
      page2.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
    ).not.toHaveCSS("color", "rgb(49, 180, 164)", { timeout: 3000 });
    await page2.click('[data-cy="channel-state-channel-CHAT"]', {
      force: true,
      delay: 500,
    });
  } catch (err) {
    console.log(err);
  }
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)"); // #a6a6a6 , rgb(49, 180, 164)
  await expect(
    page2.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
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
  
  // REQ134 Toggle Agent status to Ready
  await page.bringToFront();
  await toggleStatusOn(page);
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // REQ135 Simulate an incoming call
  let callId = await createCall({ number: "4352551623" });
  await page.waitForTimeout(3000);
  await inputDigits(callId, [8]);
  let phoneNumber = await page.innerText(
    '[data-cy="alert-incoming-call-calling-number"]',
  );
  
  // REQ192 WebRTC Agent able to answer incoming call on UI
  await page.click('button:has-text("Answer Call")');
  
  // REQ203 WebRTC blind transfer by Skill Group
  await page.waitForTimeout(1000);
  await page.click('[data-cy="transfer-btn"]');
  await page.waitForTimeout(1000);
  await page.click(
    '[role="tab"]:has([svgicon="app:skill"]), button:has-text("Blind transfer")',
  );
  await page.waitForTimeout(1000);
  await page.click(
    '.item-list-item :text("Skill 58"), [role="tab"]:has([svgicon="app:skill"])',
  );
  await page.waitForTimeout(1000);
  await page.click(
    'button:has-text("Blind transfer"), .item-list-item :text("Skill 58")',
  );
  await page.waitForTimeout(1000);
  await page
    .click('button:has-text("Blind transfer")', { timeout: 5000 })
    .catch((e) => console.error(e));
  
  // REQ200 WebRTC agent can answer transfer
  await page2.bringToFront();
  await page2.click('button:has-text("Answer Call")');
  
  // transfer to skill fully removes transferring agent
  await page.bringToFront();
  await expect(page.locator('[data-cy="finish-btn"]')).toBeVisible();
  await page.click('[data-cy="finish-btn"]');
  await page.click('[data-cy="alert-after-call-work-done"]');
  await expect(page.locator("text=Phone not available")).not.toBeVisible();
  await page2.bringToFront();
  await expect(page2.locator('[data-cy="end-call-btn"]')).toBeVisible();
  
  // REQ201 Supervisor can view new transferred agent is now talking
  await page3.bringToFront();
  await page3.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  await page3.click(':text("Supervisor View")');
  
  // Apply filter to show available agents
  await expect(async () => {
    await page3.locator('[data-cy="supervisor-view-filter-title"]').click();
    await page3.locator(`[placeholder="Select type"] >> nth=0`).click();
    await page3.locator('[role="option"] :text-is("Agent")').click();
  }).toPass({ timeout: 1000 * 120 });
  await page3.click('[data-mat-icon-name="filter"]');
  await page3.click('[data-mat-icon-name="edit"]');
  await page3.waitForTimeout(2000);
  
  // Uncheck select all agents
  const allAgents = page3.locator(
    `[data-cy="xima-list-select-select-all"] [type="checkbox"]`,
  );
  await allAgents.uncheck();
  
  // Search for WebRTC Agent 46
  await page3.getByPlaceholder(` Search Agents `).fill(`WebRTC Agent 46`);
  await expect(
    page3.locator(`[role="option"] :text("WebRTC Agent 46")`),
  ).toBeVisible();
  
  // Check select all agents
  await allAgents.check();
  
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
  
  // Assert that agent was found "Talking"
  await expect(
    page3.locator('app-agent-status-container:has-text("WebRTC Agent 46")'),
  ).toContainText("Talking (Skill 58)", { timeout: 60 * 1000 });
  
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
  
  // REQ197 WebRTC Agent can hang up a call from the UI
  await page2.bringToFront();
  
  try {
    await page2.click('[data-cy="end-call-btn"]');
    await page2.click('[data-cy="finish-btn"]');
  } catch (err) {
    console.log(err);
  }
  
  // unready agent
  await toggleStatusOff(page2);
  
  // unready original agent
  await page.bringToFront();
  await toggleStatusOff(page);
  
  // REQ146 Log back into Admin user and assert call correctness
  await page3.bringToFront();
  // See refresh dialog
  await expect(
    page3.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page3.getByRole(`button`, { name: `Ok` }).click();
  await page3.waitForTimeout(2000)
  await page3.hover('[data-cy="sidenav-menu-REPORTS"]');
  await page3.click(':text("Cradle to Grave")');
  await page3.click('[aria-label="Open calendar"]');
  await page3.click(`.mat-calendar-body-cell :text-is("1")`);
  await page.waitForTimeout(500);
  await page3.click(".mat-calendar-body-today");
  await page3.waitForTimeout(1000);
  await page3.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  ); // click apply
  
  // include filter to have unique agent to avoid collisions
  await page3.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
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
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("Agent 45");
  await page3.waitForTimeout(1000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.waitForTimeout(1000);
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("Agent 46");
  await page3.waitForTimeout(1000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page3.waitForTimeout(3000);
  await page3
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  // expand last oubound call report
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.click('.mat-sort-header-container:has-text("START TIME")');
  await page3.waitForTimeout(2000);
  await page3
    .locator(
      `mat-row:has-text("Inbound"):has-text("${phoneNumber}") [data-mat-icon-name="chevron-closed"] >> nth=0`,
    )
    .scrollIntoViewIfNeeded();
  await page3.click(
    `mat-row:has-text("Inbound"):has-text("${phoneNumber}") [data-mat-icon-name="chevron-closed"] >> nth=0`,
  );
  
  //--------------------------------
  // Assert:
  //--------------------------------
  await expect(
    page3.locator(`app-cradle-to-grave-table-row-details`),
  ).toContainText("Transfer");
  await expect(
    page3.locator(`app-cradle-to-grave-table-row-details`),
  ).toContainText("Talking");
  await expect(
    page3.locator(`app-cradle-to-grave-table-row-details`),
  ).toContainText("Drop");
  
 // Step 2. Simulate an incoming call (skill group)
  // Description:
 // Step 3. Answer Call (skill group)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 4. Blind Transfer (skill group)
  // Description:
 // Step 5. Supervisor can view new transferred agent is now talking (skill group)
  // Description:
 // Step 6. View Call in C2G (skill group)
  // Description:
});