import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_call_summary_by_group_uc_imported", async () => {
 // Step 1. View Agent Call Summary by Group (UC) (imported) report
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //!! log in as a Supervisor
  const { context, page } = await logInSupervisor();
  
  //!! hover over the "REPORTS" section of the menu
  await page.hover('[data-cy="sidenav-menu-REPORTS"]');
  
  //!! click the "My Reports" link
  await page.click(':text("My Reports")');
  
  //!! wait for the list of reports to load
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  
  //! ----
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Search for the "Agent Call Summary by Group (UC) (imported)" report and open it
  
  //!! search for "Agent Call Summary by Group (UC) (imported)" in the input field
  await page.fill("input", "Agent Call Summary by Group (UC) (imported)");
  
  //!! press the Enter key
  await page.keyboard.press("Enter");
  
  //!! get the current number of run times
  const runTimes = Number(
    await page
      .locator(
        'mat-row:has(mat-cell:has-text("Standard")) [data-cy="reports-list-report-run-times"]',
      )
      .innerText(),
  );
  
  //!! click the "Standard" type report
  await page
    .locator('[data-cy="reports-list-report-type"] :text("Standard")')
    .click();
  
  //! ----
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify the correct tiles appear for the "Agent Call Summary by Group (UC) (imported)" report
  
  //!! expect the "Total Presented Calls" tile to be visible
  await expect(
    page.locator('.mat-sort-header-content:has-text("Total Presented Calls")'),
  ).toBeVisible();
  
  //!! expect the "Total Missed Calls" tile to be visible
  await expect(
    page.locator('.mat-sort-header-content:has-text("Total Missed Calls")'),
  ).toBeVisible();
  
  //!! expect the "Total Talking Duration" tile to be visible
  await expect(
    page.locator('.mat-sort-header-content:has-text("Total Talking Duration")'),
  ).toBeVisible();
  
  //!! expect the "Avg Talking Duration" tile to be visible
  await expect(
    page.locator('.mat-sort-header-content:has-text("Avg Talking Duration")'),
  ).toBeVisible();
  
  //!! expect the "Agent Speed of Answer" tile to be visible
  await expect(
    page.locator('.mat-sort-header-content:has-text("Agent Speed of Answer")'),
  ).toBeVisible();
  
  //! ----
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Increase the "Agent Call Summary by Group (UC) (imported)" report run times by one
  
  //!! click the "Configure" button
  await page.click('button:has-text("Configure")');
  
  //!! click the "Apply" button // 2023/10/18 23:06:41 - playground-859f744954-r5npj
  await page
    .locator(`[data-cy="configure-report-apply-button"]`)
    .locator("visible=true")
    .click();
  
  //!! expect the "Loading Report..." message to be visible
  await expect(page.locator(':text("Gathering Data")')).toBeVisible({timeout: 1 * 60 * 1000});
  
  //!! wait for the "Loading Report..." message to disappear or reload the page if it doesn't disappear
  try {
    await expect(page.locator(':text("Gathering Data")')).not.toBeVisible( 2 * 60 * 1000);
  } catch {
    await page.reload();
  }
  
  //!! click the back button represented by a left arrow icon
  await page.click('mat-icon:has-text("keyboard_arrow_left")');
  
  //!! wait for 20 seconds
  await page.waitForTimeout(20 * 1000);
  
  //! ----
  //--------------------------------
  // Assert:
  //--------------------------------
  await page.reload();
  //! Verify that the run times of the "Agent Call Summary by Group (UC) (imported)" report increased by one
  await page.locator(`[placeholder="Type to Search"]`).fill("Agent Call Summary by Group (UC)");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  
  //!! expect the text content of run times to be equivalent to {runTimes} plus one // 2023/10/18 23:07:42 - playground-859f744954-r5npj
  const actualRunTimes = await page
    .locator('[data-cy="reports-list-report-run-times"]')
    .textContent();
  expect(parseInt(actualRunTimes)).toBe(runTimes + 1);
});