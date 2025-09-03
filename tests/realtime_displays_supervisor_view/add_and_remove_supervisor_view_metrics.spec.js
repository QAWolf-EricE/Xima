import { addMetric, buildUrl, createCall, inputDigits, logInWebRTCAgent, toggleSkillsOn, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("add_and_remove_supervisor_view_metrics", async () => {
 // Step 1. Edit Metrics
  //--------------------------------
  // Arrange:
  //--------------------------------
  //! Log in as a WebRTC agent and a supervisor, and prepare the dashboard page
  
  //!! log in as a WebRTC agent and store the browser, context, and page
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_21_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
    },
  );
  
  //!! enable three skills on the agent's page
  await toggleSkillsOn(page, "36");
  
  //!! click the toggle click target on the page
  await page.locator(`app-channel-states`).getByRole(`button`).first().click();
  // await page.getByRole(`menuitem`, { name: `Ready` }).click();
  try {
    await toggleStatusOn(page);
  } catch {
    await toggleStatusOn(page);
  }
  
  //!! create a new context within the browser for a Supervisor login
  const context2 = await browser.newContext();
  
  //!! create a new page within the Supervisor context
  const page2 = await context2.newPage();
  
  //!! navigate to the base URL on the new page
  await page2.goto(buildUrl("/"));
  
  //!! fill in the Supervisor username
  await page2.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  
  //!! fill in the Supervisor password
  await page2.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  
  //!! click the login button
  await page2.click('[data-cy="consolidated-login-login-button"]');
  
  //!! check that the "Reports" text is visible
  await expect(page2.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  //!! click the 'REALTIME_DISPLAYS' menu
  await page2.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click the 'Supervisor View' link
  await page2.click('a:has-text("Supervisor View")');
  
  //!! click to show available agents
  await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  //!! click edit button to configure display parameters
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! wait for 5 seconds
  await page2.waitForTimeout(5000);
  
  // Click the "All" checkbox
  await page2.getByRole(`checkbox`, { name: `All` }).click();
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! click 'Apply' button
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! click the apply filter button
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //!! wait for 5 seconds
  await page2.waitForTimeout(5000);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Edit and restore metrics for all agents
  
  //!! open the settings menu
  await page2.click('[data-cy="settings-menu-button"]');
  
  //!! select the 'settings-menu-edit-summary-metrics-all-agents' option
  await page2.click('[data-cy="settings-menu-edit-summary-metrics-all-agents"]');
  
  //!! click the 'Restore Default Metrics' button
  await page2.click(':text("Restore Default Metrics")');
  
  //!! confirm the restoration of default metrics
  await page2.click('[data-cy="confirmation-dialog-okay-button"]');
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //!! open the settings menu
  await page2.click('[data-cy="settings-menu-button"]');
  
  //!! select the 'settings-menu-edit-summary-metrics-all-agents' option
  await page2.click('[data-cy="settings-menu-edit-summary-metrics-all-agents"]');
  
  //!! add the "Abandoned Call Count" metric
  await addMetric(page2, "Abandoned Call Count");
  
  //!! add the "Abandoned Calls Percent" metric
  await addMetric(page2, "Abandoned Calls Percent");
  
  //!! add the "Active Lines" metric
  await addMetric(page2, "Active Lines");
  
  //!! click the 'apply-agent-metrics-button' to apply the metric changes
  await page2.waitForTimeout(2000);
  await page2.click('[data-cy="apply-agent-metrics-button"]');
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.waitForTimeout(1000);
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify the added metrics are visible; test in-call statuses and restore the metrics
  
  //!! expect "Abandoned Call Count" text to be visible
  await expect(page2.locator("text=Abandoned Call Count").first()).toBeVisible();
  
  //!! expect "Abandoned Calls Percent" text to be visible
  await expect(
    page2.locator("text=Abandoned Calls Percent").first(),
  ).toBeVisible();
  
  //!! expect "Active Lines" text to be visible
  await expect(page2.locator("text=Active Lines").first()).toBeVisible();
  
  //!! bring the agent's page to the front and interact with page so their status is not 'Idle'
  await page.bringToFront();
  await page.mouse.click(0, 0);
  await page2.bringToFront();
  
  // Go back to supervisor page
  await page2.bringToFront();
  
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
    ).not.toHaveAttribute("class", /checkbox-checked/, { timeout: 10 * 1000 });
  } catch (err) {
    await page2
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .evaluate((node) => node.click());
    console.error(err);
  }
  await page2
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("WebRTC Agent 21");
  await page2.waitForTimeout(1500);
  await page2.locator(`[data-cy="xima-list-select-option"]`).click();
  
  await page2.waitForTimeout(2000);
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  await page2.waitForTimeout(2000);
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  //!! check that 'WebRTC Agent 21 (216)' agent status is "Ready"
  await expect(
    page2
      .locator(
        "app-agent-status-container:has-text('WebRTC Agent 21 ('):has-text('Ready')",
      )
      .first(),
  ).toBeVisible();
  
  // Wait for connection before making call
  await page2.waitForTimeout(3000);
  await page2.reload();
  try {
    await expect(
      page2.locator(
        `app-agent-status-container:has-text('WebRTC Agent 21 ('):has(xima-loading)`,
      ),
    ).not.toBeVisible({ timeout: 5000 });
  } catch {
    await page2.reload();
    await expect(
      page2
        .locator(
          "app-agent-status-container:has-text('WebRTC Agent 21 ('):has-text('Ready')",
        )
        .first(),
    ).toBeVisible();
    await expect(
      page2.locator(
        `app-agent-status-container:has-text('WebRTC Agent 21 ('):has(xima-loading)`,
      ),
    ).not.toBeVisible();
  }
  
  //!! bring the agent's page to the front
  await page.bringToFront();
  
  //!! create a call and store the callID {callId}
  let callId = await createCall({ number: "4352551621" });
  
  //!! log the {callId}
  console.log("CALL ID: " + callId);
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! input digits containing the number 6 into the call
  await inputDigits(callId, [6]);
  
  //!! answer the call
  await page.click('[data-cy="alert-incoming-call-accept"]');
  
  //!! bring the Supervisor page to the front and expect the agent status to be "Talking"
  await page2.bringToFront();
  
  //!! expect text "Talking" to be visible
  await expect(page2.locator("text=Talking").first()).toBeVisible();
  
  //!! bring the agent's page to the front and hang up the call
  await page.bringToFront();
  
  //!! hang up the call
  await page.click('[data-cy="end-call-btn"]');
  
  //!! bring the Supervisor page to the front
  await page2.bringToFront();
  
  //!! open again the settings menu
  await page2.click('[data-cy="settings-menu-button"]');
  
  //!! select again the 'settings-menu-edit-summary-metrics-all-agents' option
  await page2.click('[data-cy="settings-menu-edit-summary-metrics-all-agents"]');
  
  //!! click again the 'Restore Default Metrics' button
  await page2.click(':text("Restore Default Metrics")');
  
  //!! confirm again the restoration of default metrics
  await page2.click('[data-cy="confirmation-dialog-okay-button"]');
  
  // See refresh dialog
  await expect(
    page2.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page2.getByRole(`button`, { name: `Ok` }).click();
  
  //!! wait for 5 seconds
  await page2.waitForTimeout(5000);
  
  //!! apply the metric changes
  // await page2.locator('[data-cy="apply-agent-metrics-button"]').click();
  
  //!! click the 'supervisor-view-filter-title'
  await page2.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  //!! click the first 'xima-preview-input-edit-button'
  await page2
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! deselect the "All" checkbox
  await page2.locator('label:has-text("All")').evaluate((node) => node.click());
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! apply the filter changes
  await page2.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2 seconds
  await page2.waitForTimeout(2000);
  
  //!! click the filter apply button
  await page2.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
 // Step 2. Restore Metrics defaults
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
});