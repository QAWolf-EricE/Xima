import { assert, expect, test, getInbox, launch, dotenv, saveTrace, axios, crypto, dateFns, faker, fse, https, twilio, formatInTimeZone } from '../../qawHelpers';

test("verify_call_monitoring_only_available_on_web_rtc_agents", async () => {
 // Step 1. Verify "Call Monitoring" available for WebRTC Agent only
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const nonWebRTCAgentName = "Xima Agent 3";
  
  // Log in as supervisor
  const { context } = await launch();
  const page = await context.newPage();
  await page.goto(process.env.DEFAULT_URL);
  
  // Fill out supervisor log in details
  await expect(
    page.locator('[data-cy="consolidated-login-username-input"]'),
  ).toBeVisible();
  await page
    .locator('[data-cy="consolidated-login-username-input"]')
    .fill(process.env.SUPERVISOR_USERNAME);
  await page
    .locator('[data-cy="consolidated-login-password-input"]')
    .fill(process.env.SUPERVISOR_PASSWORD);
  
  // Click Log in button
  await page.locator('[data-cy="consolidated-login-login-button"]').click();
  
  // Verify we're logged in as supervisor
  await expect(
    page.locator(':text("System Administrator"):right-of(div .initials)').first(),
  ).toBeVisible();
  await expect(
    page.locator(
      '[data-cy="reports-c2g-component-tab-ctog"]:has-text("Cradle to Grave")',
    ),
  ).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click Realtime Displays on sidenav
  await page.locator('[data-mat-icon-name="realtime-display"]').click();
  
  // Click Supervisor View
  await page.getByRole(`tab`, { name: `Supervisor View` }).click();
  
  // Click the filter button
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  // Wait for fields in side modal to load
  await expect(
    page.locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    ),
  ).toBeVisible();
  
  // Click on the Edit icon for Agents
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // Wait for Agent modal to be visible
  await expect(
    page.locator(`[data-cy="xima-list-select-select-all"] [type="checkbox"]`),
  ).toBeVisible();
  
  // Check the Select all agents checkbox
  if (
    !(await page
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .isChecked({ timeout: 10000 }))
  ) {
    await page
      .locator('[data-cy="xima-list-select-select-all"]')
      .click({ force: true });
  }
  
  // Click the apply button in the modal
  await page.waitForTimeout(1000);
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  // Click Apply in the side panel
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  await page.locator('[class="realtime-status-main-container"]').click();
  
  // See refresh dialog
  await expect(
    page.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
  // Click on an agent's profile icon to focus the container
  await page.locator(`app-agent-status`).getByRole(`img`).first().click();
  
  // Scroll agent into view
  let attempts = 0;
  if (
    !(await page
      .locator(`app-agent-status-container:has-text("${nonWebRTCAgentName}")`)
      .isVisible())
  ) {
    while (
      !(await page
        .locator(`app-agent-status-container:has-text("${nonWebRTCAgentName}")`)
        .isVisible()) &&
      attempts < 50
    ) {
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(2000);
      attempts += 1;
    }
  }
  
  // Click on kebab menu on a NON-WebRTC agent tile
  await page
    .locator(
      `app-agent-status-container:has-text("${nonWebRTCAgentName}") >> [data-cy="agent-tile-more-menu"]`,
    )
    .click();
  
  // Wait for menu to be visible
  await expect(
    page.getByRole(`menuitem`, { name: `Edit Profile` }),
  ).toBeVisible();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert "Call Monitoring" is NOT an option for NON-WebRTC agent
  await expect(
    page.locator('[data-cy="agent-more-menu-live-listen"]'),
  ).not.toBeVisible();
  
  // Close Kebab menu
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole(`menuitem`, { name: `Edit Profile` }),
  ).not.toBeVisible();
  await expect(
    page.locator('[data-cy="agent-menu-component-edit-profile-button"]'),
  ).not.toBeVisible();
  
  // Click on kebab menu on a WebRTC agent tile
  await page
    .locator(
      'app-agent-status-container:has-text("WebRTC") >> nth=0 >> [data-cy="agent-tile-more-menu"]',
    )
    .click();
  
  // Assert "Call Monitoring" IS an option for WebRTC agent
  await expect(
    page.locator('[data-cy="agent-more-menu-live-listen"]'),
  ).toHaveAttribute("aria-disabled", "false");
  
  // Escape out of menu
  await page.keyboard.press("Escape");
  await expect(
    page.locator('[data-cy="agent-more-menu-live-listen"]'),
  ).not.toBeVisible();
  
  //----------------------
  // Cleanup:
  //----------------------
  // Clean up - reset filter that showed all agents available
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page
    .locator(`[data-cy="xima-preview-input-edit-button"] >> nth=0`)
    .click();
  
  // Uncheck Select All
  if (
    await page
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .isChecked({ timeout: 10000 })
  ) {
    await page
      .locator('[data-cy="xima-list-select-select-all"]')
      .click({ force: true });
  }
  
  // Apply changes in modal
  await expect(page.locator(`:text("0 Agents Selected")`)).toBeVisible();
  await page.locator('button.apply > span:text-is(" Apply ")').click();
  
  // Click Apply button in side bar
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
});