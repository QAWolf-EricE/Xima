import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_external_number_summary", async () => {
 // Step 1. View External Number Summary report
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! login as the supervisor of the account, and obtain the page object {page}
  const { page } = await logInSupervisor();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Navigate to External Number Summary report
  
  //!! expect the page's title to be "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  //!! type "External Number Summary" into the search field
  await page.fill('[placeholder="Type to Search"]', "External Number Summary");
  
  //!! simulate pressing the "Enter" key on the keyboard
  await page.keyboard.press("Enter");
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! retrieve the run times of the "External Number Summary" report and assign them to {runTimes}
  let runTimes = await page
    .locator(
      'mat-row:has-text("External Number Summary") [data-cy="reports-list-report-run-times"]',
    )
    .innerText();
  
  //!! log {runTimes} to the console
  console.log("runTimes", runTimes);
  
  //!! click on the "External Number Summary" table cell
  await page.click('mat-cell:has-text("External Number Summary")');
  
  //!! validate the URL contains "report-executions"
  await expect(page).toHaveURL(/report-executions/);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify required page fields are visible
  
  //!! verify "EXTERNAL NUMBER" is visible on the page
  await expect(page.locator(':text-is("EXTERNAL NUMBER")')).toBeVisible();
  
  //!! verify "TOTAL CALLS" is visible on the page
  await expect(page.locator(':text-is("TOTAL CALLS")')).toBeVisible();
  
  //!! verify "TOTAL TALKING DURATION" is visible on the page
  await expect(page.locator(':text-is("TOTAL TALKING DURATION")')).toBeVisible();
  
  //!! verify "AVG TALKING DURATION" is visible on the page
  await expect(page.locator(':text-is("AVG TALKING DURATION")')).toBeVisible();
  
  //!! verify "TOTAL CALL DURATION" is visible on the page
  await expect(page.locator(':text-is("TOTAL CALL DURATION")')).toBeVisible();
  
  //!! verify "AVG CALL DURATION" is visible on the page
  await expect(page.locator(':text-is("AVG CALL DURATION")')).toBeVisible();
  
  //!! verify "MAX CALL DURATION" is visible on the page
  await expect(page.locator(':text-is("MAX CALL DURATION")')).toBeVisible();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Configure and apply changes to the report
  
  //!! click the "Configure" button
  await page.click('button:has-text("Configure")');
  
  //!! click the "Apply" button
  await page.click('button:has-text("Apply")');
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  await expect(page.locator(`:text("Gathering Data")`)).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  await page.waitForTimeout(10000);
  
  await page.reload();
  
  //!! ensure that the first "Total Talking Duration" is visible, waiting for up to 120 seconds if necessary
  await expect(
    page.locator(':text("Total Talking Duration")').first(),
  ).toBeVisible({
    timeout: 60 * 2000,
  });
  
  //!! wait for an additional 3 seconds
  await page.waitForTimeout(3000);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify the updated runtimes
  
  //!! click on the "reports" icon
  await page.click('[data-mat-icon-name="reports"]');
  
  //!! ensure that the page's title is "Reports"
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  
  await page.locator(`[placeholder="Type to Search"]`).fill("External Number Summary");
  await page.keyboard.press("Enter");
  
  //!! confirm that "External Number Summary" is visible
  await expect(page.locator(':text("External Number Summary")')).toBeVisible();
  
  //!! wait for 7 seconds
  await page.waitForTimeout(7000);
  
  //!! assign the updated runtimes for the "External Number Summary" report to {newRunTimes}
  const newRunTimes = await page
    .locator(
      'mat-row:has-text("External Number Summary") [data-cy="reports-list-report-run-times"]',
    )
    .innerText();
  
  //!! log {newRunTimes} to the console
  console.log(newRunTimes);
  
  //!! increment {runTimes} by 1 and convert it back to a string
  runTimes = (Number(runTimes) + 1).toString();
  
  //!! wait for {runTimes} to appear within 4 minutes
  await page.waitForSelector(`"${runTimes}"`, { timeout: 240 * 1000 });
  
  //!! validate that {newRunTimes} is now equivalent to {runTimes}
  expect(Number(newRunTimes)).toEqual(Number(runTimes));
  
});