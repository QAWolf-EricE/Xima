import { buildUrl, getOutBoundNumber, logInAgent, logUCAgentIntoUCWebphone, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("uc_outbound_call_dont_select_skill", async () => {
 // Step 1. Login as UC Agent & Supervisor (agent initialize outbound, no skills)
  /* **************
  Note: Please uncomment the Hold logic in this workflow once the 
  "Call status does not consistently update on supervisor view" bug is resolved.
  
  Bug link: https://app.qawolf.com/xima/bug-reports/43b1c2b0-9d6a-4db7-af8d-3f5c00a82944#
  *************** */
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as a UC Agent
  const { page, browser } = await logInAgent({
    email: process.env.UC_AGENT_9_EXT_109,
    password: process.env.UC_AGENT_9_EXT_109_PASSWORD,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  // log agent into webphone
  const { ucWebPhonePage } = await logUCAgentIntoUCWebphone(
    browser,
    process.env.UC_AGENT_9_EXT_109_WEBPHONE_USERNAME,
  );
  //--------------------------------
  // Act:
  //--------------------------------
  // Create new context and log in as Supervisor (Supervisor page)
  const context = await browser.newContext({ timezoneId: "America/Denver" });
  const page2 = await context.newPage();
  await page2.goto(buildUrl("/"));
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  // Toggle Agent status to Ready (UC Agent page)
  await page.bringToFront();
  await page
    .locator(
      '[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])',
    )
    .click();
  await page.getByRole(`menuitem`, { name: `Ready` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Agent has status Ready
  await expect(page.locator('[data-cy="channel-state-label"]')).toHaveText(
    "Ready",
  );
  
  // toggle skill on
  await toggleSkillsOn(page, 30);
  
  // toggle statuses on
  await toggleStatusOn(page);
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Simulate an outbound call through UC Agent UI
  await page.locator('[data-cy="active-media-menu-button"]').click();
  await page.click(':text("New Call")');
  await page.click('button:has-text("Confirm")');
  
  // dial number to call
  await page.waitForTimeout(1000);
  await page.click("#phoneNumberInput");
  
  // get phone number to make an outbound call
  const outboundNumberToCall = await getOutBoundNumber();
  console.log(outboundNumberToCall);
  
  await page.keyboard.type(`${outboundNumberToCall}`);
  await page.click('[data-cy="call-button"]');
  
  // answer the call
  await ucWebPhonePage.bringToFront();
  await ucWebPhonePage.locator('button:has(+ p:text-is("ANSWER"))').click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Supervisor can view Agent who is currently talking in supervisor view
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
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  try {
    await expect(
      page2.locator('[data-cy="xima-list-select-select-all"]'),
    ).toBeVisible();
    await expect(
      page2.locator(
        '[class*="checkbox-checked"][data-cy="xima-list-select-select-all"]',
      ),
    ).not.toBeVisible({ timeout: 5 * 1000 });
  } catch (err) {
    await page2
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .evaluate((node) => node.click());
    console.error(err);
  }
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("Xima Agent 9");
  await page2.waitForTimeout(1500);
  await page2.locator(`[data-cy="xima-list-select-option"]`).click();
  
  await page2.waitForTimeout(2000);
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(page2.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that agent was found "Talking"
  await expect(
    page2.locator(
      'app-agent-status:has-text("Xima Agent 9"):not(:has-text("P2"))',
    ),
  ).toContainText("Talking");
  
  // Short pause to develop to in C2G
  await page.waitForTimeout(10 * 1000);
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // UC Agent can mute a call
  await ucWebPhonePage.bringToFront();
  await ucWebPhonePage.locator(`[data-testid="MicOffIcon"]:visible`).click();
  await expect(
    ucWebPhonePage.locator(`button:has-text("Mute"):visible`),
  ).toHaveScreenshot("webphoneMuteActiveIcon.png");
  await ucWebPhonePage.locator(`[data-testid="MicOffIcon"]:visible`).click();
  await expect(
    ucWebPhonePage.locator(`button:has-text("Mute"):visible`),
  ).toHaveScreenshot("webphoneMuteNotActiveIcon.png");
  
  // // UC Agent can put a call on hold
  // await ucWebPhonePage.locator(`[data-testid="PauseIcon"]:visible`).click();
  // await expect(
  //   ucWebPhonePage.locator(`button:has-text("Hold"):visible`),
  // ).toHaveScreenshot("webphoneHoldActiveIcon.png");
  
  // Short pause to develop to in C2G
  await page.waitForTimeout(10 * 1000);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Supervisor can view Agent who is currently on hold in supervisor view
  await page2.bringToFront();
  // await expect(
  //   page2.locator(
  //     'app-agent-status:has-text("Xima Agent 9"):not(:has-text("P2"))',
  //   ),
  // ).toContainText("Hold");
  
  // Clean up - reset filter that showed all agents available
  await page2.keyboard.press("Escape");
  
  try {
    await page2
      .locator('[data-cy="supervisor-view-filter-title"]')
      .click({ timeout: 5000 });
  } catch {
    // See refresh dialog
    await expect(
      page2.locator(`xima-dialog:has-text("Refresh Required")`),
    ).toBeVisible();
  
    // Click OK
    await page2.getByRole(`button`, { name: `Ok` }).click();
    await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
  }
  
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  await page2.locator(`[data-cy="xima-list-select-select-all"]`).click();
  await page2.waitForTimeout(2000);
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // UC Agent can hang up a call from the UI
  await ucWebPhonePage.bringToFront();
  await ucWebPhonePage.click('[data-testid="CallEndIcon"]');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert call ended
  await page.bringToFront();
  await expect(
    page.locator(`xima-dialog-header:has-text("Call Ended")`),
  ).toBeVisible();
  
  //--------------------------------
  // Arrange:
  //--------------------------------
  // close associate group with call modal
  await page
    .locator(`[role="dialog"] [data-cy="alert-select-skills-close-button"]`)
    .click();
  
  // UC Agent Post call 'close' button is visible
  await page.click('[data-cy="finish-btn"]');
  
  // unready agent
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
  
  // wait for call to develop in C2G
  await page.waitForTimeout(60 * 1000);
  
  //--------------------------------
  // Act:
  //--------------------------------
  await page2.bringToFront();
  
  // See refresh dialog
  await expect(page2.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  
  // Log back into Admin user and assert call correctness
  await page2.locator(`[data-cy="sidenav-menu-REPORTS"]`).hover();
  await page2.locator(`:text("Cradle to Grave")`).click();
  await page2.click('[aria-label="Open calendar"]');
  const currWeek = page2.locator("tr:has(.mat-calendar-body-today)");
  await currWeek.locator("td >> nth=1").click();
  await currWeek.locator("td >> nth=-2").click();
  await page2.mouse.click(0, 0);
  await page.waitForTimeout(1000);
  await page2.click('button:has-text("Apply")');
  await page2.waitForTimeout(2000);
  
  // change filter date range
  await page2.click('[data-cy="cradle-to-grave-toolbar-filter-button"]');
  await page2.click(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
  ); // clicks calendar icon
  await page2.click(`.mat-calendar-body-active:has-text("")`);
  await page2.click(".mat-calendar-body-today");
  
  // select the correct agent
  await page2
    .locator(`app-configure-report-preview-parameter`)
    .filter({ hasText: `Agent 0 Selected` })
    .getByRole(`button`)
    .click();
  await page2.getByPlaceholder(` Search Agents `).fill(`Xima Agent 9`);
  await page2
    .getByRole(`option`, { name: `Xima Agent 9(109)` })
    .locator(`div`)
    .first()
    .click();
  await page2.getByRole(`button`, { name: `Apply` }).click();
  
  // click apply
  await page2.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  );
  
  // wait for results to load
  try {
    await expect(page2.getByRole("progressbar")).toBeVisible({ timeout: 5000 });
    await expect(page2.getByRole("progressbar")).not.toBeVisible();
  } catch {
    console.log("No progressbar visible.");
  }
  
  // expand last outbound call report
  await page2.click('.mat-sort-header-container:has-text("START TIME")');
  await page2.click('.mat-sort-header-container:has-text("START TIME")');
  await page2.waitForTimeout(2000);
  
  await page2.locator('mat-row:has-text("Outbound")').first().click(); // if there are no results it might be because you have to change the date filter to one day behind - timezone issues.
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert C2G Call History displays accurate history
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Dialing") >> nth=0`),
  ).toBeVisible();
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Ringing") >> nth=0`),
  ).toBeVisible();
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Talking") >> nth=0`),
  ).toBeVisible();
  // await expect(
  //   page2.locator(`app-cradle-to-grave-table-cell:has-text("Hold") >> nth=0`),
  // ).toBeVisible();
  await expect(
    page2.locator(`app-cradle-to-grave-table-cell:has-text("Drop") >> nth=0`),
  ).toBeVisible();
  
 // Step 2. Simulate an outbound call through UC Agent UI & View Talking Agent as Supervisor (agent initialize outbound, no skills)
  
 // Step 3. UC Agent can mute a call, put a call on hold, and end call (agent initialize outbound, no skills)
  
 // Step 4. View Call in C2G (agent initialize outbound, no skills)
  
});