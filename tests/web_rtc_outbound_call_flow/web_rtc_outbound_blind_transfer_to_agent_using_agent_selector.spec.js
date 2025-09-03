import { buildUrl, getOutBoundNumber, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_outbound_blind_transfer_to_agent_using_agent_selector", async () => {
 // Step 1. Login as WebRTC Agent 9 & 10 (outbound call transfer direct)
  // REQ03 Login as WebRTC Agent 60
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_60_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  // toggle agent 60 skills on
  await page.bringToFront();
  await toggleSkillsOn(page, "54");
  
  // create new context and log in as WebRTC Agent 61
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_61_EMAIL,
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // If call in progress, hang up
  
  // toggle agent 61 skills on
  await toggleSkillsOn(page2, "53");
  await page2.waitForTimeout(10000);
  if (await page2.locator('[data-mat-icon-name="hangup"]').isVisible()) {
    await page2.click('[data-mat-icon-name="hangup"]');
  }
  
  // toggle agent 61 status as ready
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
  
  // REQ134 Toggle Agent 60 status to Ready
  await page.bringToFront();
  await toggleStatusOn(page);
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).toHaveCSS("color", "rgb(49, 180, 164)");
  
  // REQ198 Simulate an outbound call through WebRTC UI
  try {
    await page.click('[data-cy="end-call-btn"]', { timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  await page.locator('[data-cy="active-media-menu-button"]').click();
  await page.click('span:has-text("New Call")');
  
  // dial number to call
  await page.waitForTimeout(1000);
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
  await page.waitForTimeout(2000);
  await page.click('[data-cy="call-button"]');
  await page.click('span:text-is("Skill 54")');
  
  // REQ202 WebRTC blind transfer by Agent Name
  await page.click('[data-cy="transfer-btn"]');
  await page.click('[role="tab"]:has([data-mat-icon-name="agent"])');
  await page.click(':text("WebRTC Agent 61")');
  await page.click(':text("Blind Transfer")');
  
  // REQ200 WebRTC agent can answer transfer
  await page2.bringToFront();
  await page2.click('button:has-text("Answer Call")');
  
  // REQ201 Supervisor can view new transferred agent is now talking
  await page3.bringToFront();
  await page3.hover('[data-mat-icon-name="realtime-display"]');
  await page3.click(':text-is("Supervisor View")');
  
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
    .fill("WebRTC Agent 60");
  await page3.waitForTimeout(1500);
  await page3.locator(`[data-cy="xima-list-select-option"]`).click();
  await page3.waitForTimeout(1500);
  await page3
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("WebRTC Agent 61");
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
  
  // Assert that agent was found "Talking"
  await expect(
    page3.locator(
      'app-agent-status-container:has-text("WebRTC Agent 61") [class="realtime-status-bar-container"]:has-text("Talking")',
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
  
  // unready agent
  // await page2.locator('[role="switch"]').click({force: true});
  await page2.click('[class="dnd-status-container"] button', {
    force: true,
  });
  await page2.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page2.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  // unready original agent
  await page.bringToFront();
  // await page.locator('[role="switch"]').click({force: true});
  await page.click('[class="dnd-status-container"] button', {
    force: true,
  });
  await page.getByRole(`menuitem`, { name: `Lunch` }).click();
  await expect(
    page.locator('[data-cy="channel-state-channel-VOICE-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  await expect(
    page.locator('[data-cy="channel-state-channel-CHAT-icon"]'),
  ).not.toHaveCSS("color", "rgb(49, 180, 164)");
  
  // REQ146 Log back into Admin user and assert call correctness
  await page3.bringToFront();
  await page3.hover('[data-mat-icon-name="reports"]');
  await page3.click(
    'app-navigation-menu-translation:has-text("Cradle to Grave")',
  );
  await page3.click('[aria-label="Open calendar"]');
  await page3.click(`.mat-calendar-body-cell :text-is("1")`);
  await page3.click(".mat-calendar-body-today");
  await page3.waitForTimeout(3000);
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
    .fill("Agent 61");
  await page3.waitForTimeout(1000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.waitForTimeout(1000);
  await page3
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("Agent 60");
  await page3.waitForTimeout(1000);
  await page3.locator('[data-cy="xima-list-select-select-all"]').click();
  await page3.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page3.waitForTimeout(1000);
  await page3
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  // expand last oubound call report
  await page3.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page3.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page3.waitForTimeout(2000);
  try {
    await page3
      .locator(
        `mat-row:has-text("Outbound") [data-mat-icon-name="chevron-closed"] >> nth=0`,
      )
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err);
  }
  await expect(
    page3.locator(".mat-column-expandedDetail:visible "),
  ).toContainText("Ringing");
  await expect(
    page3.locator(".mat-column-expandedDetail:visible "),
  ).toContainText("Talking");
  await expect(
    page3.locator(".mat-column-expandedDetail:visible "),
  ).toContainText("Transfer");
  await expect(
    page3.locator(".mat-column-expandedDetail:visible "),
  ).toContainText("Drop");
  
 // Step 2. Simulate an outbound call through WebRTC UI (outbound call transfer direct)
  // Description:
 // Step 3. Blind transfer by Agent Name (outbound call transfer direct)
  // Description:
 // Step 4. Supervisor can view new transferred agent is now talking (outbound call transfer direct)
  // Description:
 // Step 5. View Call in C2G (outbound call transfer direct)
  // Description:
});