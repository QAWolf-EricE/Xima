import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("end_call_monitoring_monitor_new_agent", async () => {
 // Step 1. End Call Monitoring
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! call the {logInSupervisor} function with specific parameters and permissions, destructuring the result to {page}, {browser}, and {context}
  const { page, browser, context } = await logInSupervisor({
    slowMo: 1000,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
    permissions: ["camera", "microphone", "clipboard-read", "clipboard-write"],
  });
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! navigate to Supervisor View and apply filter settings
  
  //!! hover over "REALTIME_DISPLAYS" on the sidebar, click on "Supervisor View", and wait for the view filter title to load
  await expect(async () => {
    // click Realtime Displays on sidenav
    await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]', {
      timeout: 2000,
    });
  
    // click Supervisor View
    await page.click(':text-is("Supervisor View")', { timeout: 2000 });
    await page.waitForSelector('[data-cy="supervisor-view-filter-title"]', {
      timeout: 2000,
    });
  }).toPass({ timeout: 120 * 1000 });
  
  //!! click on the supervisor view filter title
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  // Change selection mode to "Agent" if necessary
  if (
    await page
      .locator(
        '[role="combobox"]:has-text("Skill"):below(span:text-is("Selection Mode")) >> nth=0',
      )
      .isVisible()
  ) {
    await page.click('span:text-is("Skill")');
    await page.click('mat-option:has-text("Agent")');
  }
  
  //!! click on the first preview parameter container
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // Ensure no agents are selected
  await page
    .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
    .check();
  await page
    .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
    .uncheck();
  await expect(page.locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
  ).not.toBeChecked();
  
  // Search for & check Agent 17 & Agent 18
  await page.getByPlaceholder(` Search Agents `).fill(`WebRTC Agent 17`);
  await page.getByRole(`option`, { name: `WebRTC Agent 17(222)` }).click();
  await page.getByPlaceholder(` Search Agents `).fill(`WebRTC Agent 18`);
  await page.getByRole(`option`, { name: `WebRTC Agent 18(223)` }).click();
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! apply the selected settings
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! click the filter apply button
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(page.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
  //!! if the replace supervisor title is visible, confirm the action
  if (await page.locator('span[class="replace-supervisor-title"]').isVisible()) {
    await page.click('button:has-text("Confirm")');
  }
  
  //! ----
  
  //! view Agent 17's status and start call monitoring for them
  
  //!! click on Agent 17's status icon
  await page.click('app-agent-status-container:has-text("Agent 17") mat-icon', {
    timeout: 10000,
  });
  
  //!! click the "Call Monitoring" button
  await page.click('button:has-text("Call Monitoring"):visible');
  
  //!! if a "Confirm" button is visible, click it
  if (await page.locator('button:has-text("Confirm")').isVisible()) {
    await page.click('button:has-text("Confirm")');
  }
  
  //!! if an "Ok" button is visible, click it
  if (await page.locator("button:has-text('Ok')").isVisible({ timeout: 5000 })) {
    await page.locator("button:has-text('Ok')").click();
  }
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! the supervisor observation toolbar is visible and ends call monitoring
  
  //!! expect the "xima-supervisor-observation-toolbar" to be visible
  await expect(page.locator("xima-supervisor-observation-toolbar")).toBeVisible();
  
  //!! click the "End Call Monitoring" button
  await page.locator(':text("End Call Monitoring")').click();
  
  //!! expect the "xima-supervisor-observation-toolbar" not to be visible
  await expect(
    page.locator("xima-supervisor-observation-toolbar"),
  ).not.toBeVisible();
  
 // Step 2. Monitor New Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! click on an icon near the text "Agent 18"
  await page.click('app-agent-status-container:has-text("Agent 18") mat-icon');
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Start call monitoring
  
  //!! click on the "Call Monitoring" text with a timeout of 2000ms
  await page.click(':text("Call Monitoring")', { timeout: 2000 });
  
  //!! if the "Confirm" button is visible, click it
  if (await page.locator('button:has-text("Confirm")').isVisible()) {
    await page.click('button:has-text("Confirm")');
  }
  
  //!! if the "Ok" button is visible within a 5000ms timeout, click it
  if (await page.locator("button:has-text('Ok')").isVisible({ timeout: 5000 })) {
    await page.locator("button:has-text('Ok')").click();
  }
  
  //! ----
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Monitor the call
  
  //!! expect the "xima-supervisor-observation-toolbar" locator to be visible
  await expect(page.locator("xima-supervisor-observation-toolbar")).toBeVisible();
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! End call monitoring
  
  //!! click on the "End Call Monitoring" text
  await page.locator(':text("End Call Monitoring")').click();
  
  //! ----
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify call monitoring has ended
  
  //!! expect the "xima-supervisor-observation-toolbar" locator to not be visible
  await expect(
    page.locator("xima-supervisor-observation-toolbar")
  ).not.toBeVisible();
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Configure report view
  
  //!! click on the '[data-cy="supervisor-view-filter-title"]' locator
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  //!! click on the zeroth locator of '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"]' 
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0'
    )
    .click();
  
  //!! if the checkbox in '[data-cy="xima-list-select-select-all"] [type="checkbox"]' is already checked, uncheck it
  if (
    await page
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .isChecked()
  ) {
    await page
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .evaluate((node) => node.click());
  }
  
  //!! wait for 2000ms
  await page.waitForTimeout(2000);
  
  //!! click on the button with the text " Apply "
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  //! ----
  
  
  //! Apply configured report view
  
  //!! wait for 2000ms
  await page.waitForTimeout(2000);
  
  //!! click on the '[data-cy="supervisor-view-filter-apply-button"]' locator.
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(page.locator(`xima-dialog:has-text("Refresh Required")`)).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
  
  
});