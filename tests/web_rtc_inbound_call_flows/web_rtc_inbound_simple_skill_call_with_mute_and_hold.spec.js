import { buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkill, toggleStatusOff, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_inbound_simple_skill_call_with_mute_and_hold", async () => {
 // Step 1. Login as WebRTC Agent 8 & Supervisor (inbound call presented...)
  
  // REQ03 Login as WebRTC Agent 64
  const { browser, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_64_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    }
  );
  
  
  // toggle Skill 52
  await page.bringToFront()
  await toggleSkill(page, "52");
  
  // create new context and log in as Supervisor
  const context = await browser.newContext({ timezoneId: "America/Denver" });
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // REQ134 Toggle Agent status to Ready
  await page.bringToFront();
  await toggleStatusOn(page)
  
  // REQ135 Simulate an incoming call
  let callId = await createCall({
    number: "4352551623"
  });
  console.log(callId);
  await page.waitForTimeout(3000);
  await inputDigits(callId, [2]);
  
  // REQ192 WebRTC Agent able to answer incoming call on UI
  await page.click('button:has-text("Answer Call")', { timeout: 2 * 60 * 1000 });
  
  // REQ196 Supervisor can view Agent who is currently talking in supervisor view
  await page2.bringToFront();
  await page2.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  await page2.click(':text("Supervisor View")');
  
  // Apply filter to show available agents
  await expect(async () => {
    await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
    await page2.locator('[placeholder="Select type"]').click();
    await page2.locator('[role="option"] span:text-is("Agent")').click();
  }).toPass({ timeout: 1000 * 120 });
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0'
    )
    .click();
  
  // Uncheck select all agents
  const allAgents = page2.locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`);
  await allAgents.uncheck();
  
  // Search for WebRTC Agent 64
  await page2.getByPlaceholder(` Search Agents `).fill(`WebRTC Agent 64`);
  await page2.waitForTimeout(2000);
  await expect(page2.locator(`[role="option"] :text("WebRTC Agent 64")`)).toBeVisible();
  
  // Check select all agents
  await allAgents.check();
  
  // Apply filters
  await page2.waitForTimeout(2000);
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  await expect(page2.getByRole(`button`, { name: `Ok` })).toBeVisible();
  await page2.waitForTimeout(1000)
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  // Assert that agent was found "Talking"
  await expect(
    page2.locator('app-agent-status:has-text("WebRTC Agent 64")')
  ).toContainText("Talking (Skill 52)");
  
  // REQ193 WebRTC Agent can mute a call
  await page.bringToFront();
  await page.click('[data-cy="mute-btn"]');
  // await expect(page.locator('[data-cy="mute-btn"] path >> nth=0')).toHaveCSS("fill", "rgb(22, 126, 208)");
  await expect(page.locator('.actions [data-cy="mute-btn"]')).toBeVisible();
  await page.click('[data-cy="mute-btn"]');
  
  // REQ194 WebRTC Agent can put a call on hold
  await page.click('[data-cy="hold-btn"]');
  
  // REQ195 Supervisor can view Agent who Is currently on hold in supervisor view
  await page2.bringToFront();
  await expect(
    page2.locator('app-agent-status:has-text("WebRTC Agent 64")')
  ).toContainText("Hold (Skill 52)");
  
  // Clean up - reset filter that showed all agents available
  await page2.keyboard.press("Escape");
  await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0'
    )
    .click();
  await page2.locator(`[data-cy="xima-list-select-select-all"]`).click();
  await page2.waitForTimeout(2000);
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // REQ197 WebRTC Agent can hang up a call from the UI
  await page.bringToFront();
  await page.click('[data-cy="end-call-btn"]');
  // await page.click('[data-cy="call-details-finish-anchor"]');
  await page.click('[data-cy="finish-btn"]');
  
  // unready agent
  await toggleStatusOff(page)
  
  // REQ146 Log back into Admin user and assert call correctness
  await page2.bringToFront();
  
  await expect(page2.getByRole(`button`, { name: `Ok` })).toBeVisible();
  await page2.waitForTimeout(1000)
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  await page2.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await page2.locator(`:text("Cradle to Grave")`).click();
  
  // change filter date range
  await page2.click(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`
  ); // clicks calendar icon
  await page2.click(`.mat-calendar-body-cell :text-is("1")`);
  await page2.click(".mat-calendar-body-today");
  await page2.waitForTimeout(3000);
  await page2.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]'
  ); // click apply
  
  // include filter to have unique agent to avoid collisions
  await page2.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
  try {
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  } catch {
    await page2.locator(`xima-header-add`).getByRole(`button`).click();
    await page2.locator(`[data-cy="xima-criteria-selector-search-input"]`).fill(`Agent`);
    await page2.getByText(`Agent`, { exact: true }).click();
    await page2
      .locator(
        '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]'
      )
      .click();
  }
  await page2
    .locator('[data-cy="xima-list-select-search-input"]')
    .fill("Agent 64");
  await page2.waitForTimeout(1000);
  await page2.locator('[data-cy="xima-list-select-select-all"]').click();
  await page2.waitForTimeout(1000);
  await page2.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
  await page2.waitForTimeout(3000);
  await page2
    .locator('[data-cy="configure-cradle-to-grave-container-apply-button"]')
    .click();
  
  await expect(page2.locator(`mat-progress-bar`)).toBeVisible();
  await expect(page2.locator(`mat-progress-bar`)).not.toBeVisible();
  
  // expand last inbound call report
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page2.click('.mat-sort-header-container:has-text("START TIME") >> nth=1');
  await page2.waitForTimeout(2000);
  
  // sometimes already expanded
  try {
    await page2.click(
      'mat-row:has-text("Inbound") [data-mat-icon-name="chevron-closed"] >> nth=0'
    );
  } catch (err) {
    console.log(err)
  }
  
  try {
    await expect(page2.locator(`:text("Queue"):visible`)).toHaveCount(1);
  } catch { // sometimes already expanded
    await expect(page2.locator(`:text("Queue"):visible`)).toHaveCount(3);
    await page2.locator(`[data-cy="cradle-to-grave-table-row-details-collapse-row-button"]`).click();
    await expect(page2.locator(`:text("Queue"):visible`)).toHaveCount(1);
  }
  await expect(page2.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Talking")`)).toBeVisible();
  await expect(page2.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Hold")`)).toBeVisible();
  await expect(page2.locator(`[data-cy="cradle-to-grave-table-cell-event-name"]:has-text("Drop")`)).toBeVisible();
  
 // Step 2. Simulate an incoming call (inbound call presented...)
  // Description:
 // Step 3. Answer Call (inbound call presented...)
  // Description:
 // Step 4. View Talking Agent as Supervisor (inbound call presented...)
  // Description:
 // Step 5. WebRTC Agent can mute a call (inbound call presented...)
  // Description:
 // Step 6. WebRTC Agent can put a call on hold (inbound call presented...)
  // Description:
 // Step 7. View Agent on Hold as Supervisor (inbound call presented...)
  // Description:
 // Step 8. View Call in C2G (inbound call presented...)
  // Description:
});