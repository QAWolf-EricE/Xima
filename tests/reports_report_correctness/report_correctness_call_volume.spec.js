import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_call_volume", async () => {
 // Step 1. Call Volume Reports
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //!! Log in as a supervisor in the system
  const { page, context, browser } = await logInSupervisor();
  
  //!! Navigate to the "My Reports" section
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  //!! Ensure the URL corresponds to the "reports" section
  await expect(page).toHaveURL(/reports/);
  
  //!! Click the dropdown with id 'mat-select-2' to select a report. // 2023/11/09 02:06:12 - playground-c59ff9f4b-q8fmv
  await page.locator(`[id="mat-select-2"]`).locator("visible=true").click();
  
  //!! Select the "My Reports" option
  await page.click('[id*="mat-option"] :text("My Reports")');
  
  //! ----
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Search and run "Call Volume" reports
  
  //!! Wait for 2 seconds before conducting a search
  await page.waitForTimeout(2000);
  
  //!! Input "Call Volume" in the search bar
  await page.fill('[placeholder="Type to Search"]', "Call Volume");
  
  //!! Confirm the search by pressing "Enter"
  await page.keyboard.press("Enter");
  
  //!! Allow time for the report run times to load
  await page.waitForTimeout(3000);
  
  //!! Save the current run times of the "Call Volume" reports to {runTimes}
  const runTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]',
  );
  
  //!! Open the "Call Volume" report
  await page.click(
    '[data-cy="reports-list-report-name"]:has-text("Call Volume")',
  );
  
  //!! Wait for 3 seconds for the page to load
  await page.waitForTimeout(3000);
  
  //!! Verify that the "Call Volume" report is visible on the toolbar
  await expect(
    page.locator(
      '[data-cy="report-execution-toolbar-report-title"]:has-text("Call Volume")',
    ),
  ).toBeVisible();
  
  //! ----
  // Execute
  
  //! Configure and run another "Call Volume" report
  
  //!! Click on the configuration button on the toolbar
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  
  //!! Allow for a 3-second wait
  await page.waitForTimeout(3000);
  
  //!! Confirm the report configuration by clicking the "apply" button
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //!! Verify that the report is currently loading
  await expect(page.locator(':text("Gathering Data")')).toBeVisible();
  
  //!! Make sure the loading screen is no longer visible
  await expect(page.locator(`:text("Gathering Data")`)).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  await page.reload();
  
  //!! Wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! Back to the "Reports" section
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  //!! Calculate the supposed new run times value by adding one to the original run times
  const newRunTimes = parseInt(runTimes) + 1;
  
  //! ----
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify the new run times amount for the "Call Volume" report
  
  //!! Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! Confirm the new run times is interpreted correctly for the "Call Volume" report
  await expect(
    page.locator(
      'mat-row:has-text("Agent Call Volume") [data-cy="reports-list-report-run-times"]',
    ),
  ).toHaveText(newRunTimes.toString());
  
});