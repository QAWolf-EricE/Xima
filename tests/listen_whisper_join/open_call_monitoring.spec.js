import { liveListen, logInStaggeringSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("open_call_monitoring", async () => {
 // Step 1. Open Call Monitoring
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as a supervisor using {logInStaggeringSupervisor}, providing config details, and retrieve {browser}, {context} and {page}
  const { browser, context, page } = await logInStaggeringSupervisor({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Expand the "Realtime Displays" section in the side navigation menu
  await page.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).hover();
  
  // Navigate to the "Realtime Status" page from the side navigation menu
  await page.getByRole(`button`, { name: `Realtime Wallboards` }).click();
  
  // Click on the supervisor view filter title
  await page.getByRole(`tab`, { name: `Supervisor View` }).click();
  
  // Click to start setting up the first parameter in the report preview configuration
  await page
    .locator(
      `[data-cy="supervisor-view-filter-title"] #mat-button-toggle-5-button`,
    )
    .click();
  await page
    .locator(
      `[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0`,
    )
    .click();
  
  // Check all items if not already checked in 'xima-list-select-select-all' checkbox
  await page.locator('[data-cy="xima-list-select-select-all"]').waitFor();
  
  if (
    !(await page
      .locator('[data-cy="xima-list-select-select-all"] input')
      .isChecked())
  ) {
    await page.locator('[data-cy="xima-list-select-select-all"]').click();
  }
  
  // Click on the apply button in the preview input
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  // Ensure display offline agents is checked
  if (
    !(await page
      .locator('[data-cy="supervisor-view-agent-offline-checkbox"] input')
      .isChecked())
  ) {
    await page.click('[data-cy="supervisor-view-agent-offline-checkbox"] input');
  }
  
  // Click the apply button in the supervisor view filter
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
  // Initialize counter {attempts} to 0
  let attempts = 0;
  
  // Click on the realtime status main container
  await page.locator('[class="realtime-status-main-container"]').click();
  
  // Locate targeted agent for live listening
  const agent = page.locator(
    'app-agent-status-container:has-text("Aaron Test "):has-text("242")',
  );
  
  // Scroll until agent "Aaron Test (242)" is visible or until 50 attempts are made
  while (
    !(await agent.locator('[data-cy="agent-tile-more-menu"]').isVisible()) &&
    attempts < 50
  ) {
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(1000);
    attempts += 1;
  }
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Start live listening on agent "Aaron Test (242)" using the {liveListen} function
  const agentName = await agent.locator(`.agent-status-fullname`).innerText();
  await liveListen(page, agentName);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the observation toolbar to be visible
  await expect(page.locator("xima-supervisor-observation-toolbar")).toBeVisible();
  await expect(
    page.locator(
      `xima-supervisor-observation-toolbar:has-text("Call Monitoring Active: Aaron Test(242)")`,
    ),
  ).toBeVisible();
  
  // Assert the text "LISTEN" to be visible
  await expect(page.locator(".LISTEN")).toBeVisible();
  
  //--------------------------------
  // Clean-up:
  //--------------------------------
  // Click to end call monitoring
  await page.locator(':text("End Call Monitoring")').click();
  
  // Click the supervisor view filter title
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  // Click to start editing the first parameter in the report preview configuration
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  // Uncheck all items if they are checked in 'xima-list-select-select-all' checkbox
  await page.locator('[data-cy="xima-list-select-select-all"]').waitFor();
  
  if (
    await page
      .locator(`[data-cy="xima-list-select-select-all"] input`)
      .isChecked()
  ) {
    await page
      .locator(`[data-cy="xima-list-select-select-all"]`)
      .evaluate((node) => node.click());
  }
  
  // Click on the apply button in the preview input
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  // Wait for 2 seconds
  await page.waitForTimeout(1000);
  
  // Click the apply button in the supervisor view filter
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
});