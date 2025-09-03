import { logInStaggeringSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("start_live_listen", async () => {
 // Step 1. Start Live Listen
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! execute {logInStaggeringSupervisor} with options
  const { browser, context, page } = await logInStaggeringSupervisor({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  //! ----
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Check system administrator visible
  
  //!! expect text "System Administrator" to be visible
  await page.locator(`xima-user-menu`).getByRole(`button`).hover();
  await expect(page.locator('span:text("System Administrator")')).toBeVisible();
  
  //! ----
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Start going through menu
  
  //!! click on the "REALTIME_DISPLAYS" menu expansion button
  await page.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).click();
  
  //! ----
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Configure the view
  await page.getByRole(`tab`, { name: `Supervisor View` }).click();
  
  //!! click on "supervisor-view-filter-title"
  await page
    .locator(`[data-cy="supervisor-view-filter-title"] [type="button"]`)
    .click();
  //!! click on the first element in the "configure-report-preview-parameter-container"
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // cleanup - clear agent filter
  try {
    await expect(page.locator(`:text("0 Agents Selected")`)).toBeVisible({
      timeout: 3000,
    });
  } catch {
    try {
      // if select all checkbox is checked, uncheck it
      await expect(
        page.locator(
          `[data-cy="xima-list-select-select-all"] .mdc-checkbox--selected`,
        ),
      ).toBeVisible({
        timeout: 3000,
      });
      await page.waitForTimeout(1000);
      await page.locator(`[data-cy="xima-list-select-select-all"]`).click();
    } catch (err) {
      console.log(err);
    }
    await page.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page.waitForTimeout(1000);
    await page.locator(`[data-cy="xima-list-select-select-all"]`).click();
    await page.waitForTimeout(1000);
  }
  
  // select WebRTC Agent 1 (202)
  await page.waitForTimeout(2000);
  await page
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill(`WebRTC Agent 1(202)`);
  await page.waitForTimeout(2000);
  await page
    .locator(
      `[data-cy="xima-list-select-option"] div:left-of(:text("")) >> nth=0`,
    )
    .click();
  
  //!! wait for 2000ms
  await page.waitForTimeout(2000);
  
  //!! click the apply button with text "Apply"
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2000ms
  await page.waitForTimeout(2000);
  
  // Ensure display offline agents is checked
  if (
    !(await page
      .locator('[data-cy="supervisor-view-agent-offline-checkbox"] input')
      .isChecked())
  ) {
    await page.click('[data-cy="supervisor-view-agent-offline-checkbox"] input');
  }
  
  //!! click on "supervisor-view-filter-apply-button"
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
  //! ----
  //--------------------------------
  // Act:
  //--------------------------------
  
  //!! initialize an attempts counter
  let attempts = 0;
  
  //!! while the 'WebRTC Agent 1 (202)' is not visible and attempts are less than 50, scroll down and press 'End', increment attempts
  while (attempts < 50) {
    try {
      await expect(
        page.locator(
          `app-agent-status-container:has-text("WebRTC Agent 1 (202)")`,
        ),
      ).toBeVisible({ timeout: 1000 });
      break;
    } catch {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(500);
    }
    attempts += 1;
  }
  
  //!! wait for changes to settle
  await page.waitForTimeout(5000);
  
  //! Perform live listening
  await expect(async () => {
    //!! click the more menu for 'WebRTC Agent 1 (202)' agent status container
    await page.click(
      'app-agent-status-container:has-text("WebRTC Agent 1 (202)") [data-cy="agent-tile-more-menu"]',
    );
  
    //!! wait for the menu to load
    await page.waitForTimeout(3000);
  
    //!! click 'Call Monitoring' item from agent's more menu
    await page.locator('[data-cy="agent-more-menu-live-listen"]').click();
  
    //!! try to click the replace confirmation in the dialog box with a maximum time limit of 5 seconds
    try {
      await page.click('[role="dialog"] .confirm-replace', {
        timeout: 5000,
      });
    } catch (err) {
      console.log(err);
    }
  
    //!! click the 'LISTEN' icon
    await page.click(".LISTEN");
  }).toPass({ timeout: 60000 });
  
  //! ----
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Check that the appropriate elements are visible/disabled
  
  //!! expect element with "listen-selected" icon to be visible
  await expect(
    page.locator('[data-mat-icon-name="listen-selected"]'),
  ).toBeVisible();
  
  //!! expect text "WHISPER" to be visible
  await expect(page.locator(".WHISPER")).toBeVisible();
  
  //!! expect text "JOIN" to be visible
  await expect(page.locator(".JOIN")).toBeVisible();
  
  //!! expect "mic" button to be disabled
  await expect(
    page.locator('button:has([data-mat-icon-name="mic"])'),
  ).toBeDisabled();
  
  //!! expect mat-slider element to be visible
  await expect(page.locator("mat-slider")).toBeVisible();
  
  //! ----
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Change volume and end call monitoring
  
  //!! click on "volume"
  await page.click(".volume");
  
  //!! expect volume slider to be at 0
  await expect(page.locator('[data-mat-icon-name="volume-muted"]')).toBeVisible();
  
  //!! click on "End Call Monitoring"
  await page.click(':text("End Call Monitoring")');
  
  //! ----
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Reset view
  
  //!! click on "supervisor-view-filter-title"
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  //!! click on first element in "configure-report-preview-parameter-container"
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! uncheck "xima-list-select-select-all" if it is checked
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
  
  //!! click on the apply button that contains the text "Apply"
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2000ms
  await page.waitForTimeout(2000);
  
  //!! click on "supervisor-view-filter-apply-button"
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  //! ----
  
});