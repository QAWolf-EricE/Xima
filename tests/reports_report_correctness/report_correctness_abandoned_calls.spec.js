import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_abandoned_calls", async () => {
 // Step 1. Verify abandoned call report page
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Const
  const reportName = "Abandoned Calls (7)";
  const durationRegex = /[0-9]+:[0-9]+:[0-9]+/;
  
  // Log in as supervisor
  const { page } = await logInSupervisor();
  
  // Expect to see text "Reports" on the page
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  // Expect the reports list to be visible within a specified timeout
  await expect(async () => {
    await page.waitForSelector(
      '[data-cy="reports-list-report-name"][role="cell"]',
      { timeout: 1000 },
    );
  }).toPass({ timeout: 1000 * 240 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Fill in search bar with "Abandoned Calls"
  await page.locator('[placeholder="Type to Search"]').fill(reportName);
  
  // Press the "Enter" key to submit the search
  await page.keyboard.press("Enter");
  
  // Wait for 2 seconds to load results
  await page.waitForTimeout(2000);
  
  // Assign the current number of report run times to {currRunTimes}
  const currRunTimes = await page
    .locator(`mat-row:has(mat-cell:text-is("${reportName}")) [data-cy="reports-list-report-run-times"]`)
    .innerText();
  
  // Click on the first row of the results, presumably the first "Abandoned Calls" report
  await page.locator(`mat-row:has(mat-cell:text-is("${reportName}"))`).click();
  
  // Expect the selected report's title to be "Abandoned Calls"
  await expect(
    page.locator('[data-cy="report-execution-toolbar-report-title"]'),
  ).toHaveText(reportName, { timeout: 10 * 1000 });
  
  // Wait for report details to load
  await expect(
    page.locator(`[role="row"]:has-text("Call ID") >> nth=0`),
  ).toBeVisible();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert 'Abandoned Calls' metric to be greater than or equal to 2
  expect(
    (await page
      .locator('.summary-item:has-text("Abandoned Calls") .summary-item-value')
      .innerText()) * 1,
  ).toBeGreaterThanOrEqual(2);
  
  // Assert 'Answered Calls' metric to be greater than or equal to 0
  expect(
    (await page
      .locator('.summary-item:has-text("Answered Calls") .summary-item-value')
      .innerText()) * 1,
  ).toBeGreaterThanOrEqual(0);
  
  // Assert 'Total Call Duration' to match duration regex format
  await expect(
    page.locator(
      '.summary-item:has-text("Total Call Duration") .summary-item-value',
    ),
  ).toHaveText(durationRegex);
  
  // Assert 'Avg Call duration' to match duration regex format
  await expect(
    page.locator(
      '.summary-item:has-text("Avg Call duration") .summary-item-value',
    ),
  ).toHaveText(durationRegex);
  
 // Step 2. Report run time adds one every configuration
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the configure button on the report
  await page
    .locator('[data-cy="report-execution-toolbar-configure-button"]')
    .click();
  
  // Apply changes by clicking the apply button
  await page.locator('[data-cy="configure-report-apply-button"]').click();
  
  // Wait for page to update
  await expect(
    page.locator('[data-cy="configure-report-apply-button"]'),
  ).not.toBeVisible();
  await expect(
    page.locator(`[role="row"]:has-text("Call ID") >> nth=0`),
  ).toBeVisible();
  
  // Navigate back by clicking the back button
  await page.locator('[data-cy="report-execution-toolbar-back-button"]').click();
  
  // Wait for page to load
  await expect(
    page.getByRole(`columnheader`, { name: `Run Times` }),
  ).toBeVisible();
  
  let attempts = 0;
  let maxAttempts = 10;
  let isSuccessful = false;
  
  // Loop - reload the page and check if the report run times have been increased by 1 if not retry until the maximum attempts reached
  while (attempts < maxAttempts && !isSuccessful) {
    await page.reload();
    try {
      await page.waitForSelector(`mat-row:has(mat-cell:text-is("${reportName}")) [data-cy="reports-list-report-run-times"]`, {
        timeout: 60 * 1000,
      });
      const newRunTimes = await page
        .locator(`mat-row:has(mat-cell:text-is("${reportName}")) [data-cy="reports-list-report-run-times"]`)
        .innerText();
      if (Number(newRunTimes) === Number(currRunTimes) + 1) {
        console.log("Run times count increased by 1.");
        isSuccessful = true;
        break;
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
    // Wait for 30 seconds before the next attempt
    await page.waitForTimeout(30 * 1000);
    attempts++;
  }
  
  // Get the new amount of report run times and assign to {newRunTimes}
  const newRunTimes = await page
    .locator(`mat-row:has(mat-cell:text-is("${reportName}")) [data-cy="reports-list-report-run-times"]`)
    .innerText();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the new report run times to be equal to the old report run times increased by 1
  expect(newRunTimes * 1).toBe(currRunTimes * 1 + 1);
  
});