import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_export_reports", async () => {
 // Step 1. Export Reports
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! Log in as a supervisor, yielding a {page} object
  const { page } = await logInSupervisor({ slowMo: 500 });
  
  //!! expect the home title to be set to "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Navigate to the export reports function and select the first two reports
  
  //!! click the button to open the manage menu
  await page.click('[data-cy="manage-menu-open-button"]');
  
  //!! click the link for exporting reports
  await page.click('[data-cy="manage-menu-export-reports"]');
  
  //!! assert that the export report side navigation is visible
  await expect(
    page.locator('app-export-reports-sidenav span.title:has-text("Export")')
  ).toBeVisible();
  
  //!! assert that the text "Select Reports from the List" is visible on the page
  await expect(
    page.locator(':text("Select Reports from the List")')
  ).toBeVisible();
  
  //!! wait for the first report in the reports list to load
  await expect(async () => {
    await page
      .locator('[data-cy="reports-list-report-name"] >> nth=0')
      .waitFor({ timeout: 1000 });
  }).toPass({ timeout: 1000 * 240 });
  
  //!! select the first report in the list
  const firstReport = page.locator('[role="row"]:below(:text("Name"))').first();
  
  //!! select the second report in the list for exporting
  const secondReport = page.locator('[role="row"]:below(:text("Name"))').nth(1);
  
  //!! get the title text for the first report
  const firstReportTitle = await firstReport
    .locator('[data-cy="reports-list-report-name"]')
    .innerText();
  console.log(`firstReportTitle:`, firstReportTitle);
  
  //!! get the title text for the second report
  const secondReportTitle = await secondReport
    .locator('[data-cy="reports-list-report-name"]')
    .innerText();
  console.log(`secondReportTitle:`, secondReportTitle);
  
  //!! click the checkbox to select the first report for exporting
  await firstReport
    .locator('[type="checkbox"]')
    .click({ delay: 500, force: true });
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! click the checkbox to select the second report for exporting
  await secondReport.locator('[type="checkbox"]').click({ delay: 500 });
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Validate that the reports were selected and then deselect the second one
  
  //!! assert that the first report has been selected for exporting
  await expect(
    page.locator(`app-export-reports-sidenav :text-is("${firstReportTitle}")`)
  ).toBeVisible();
  
  //!! assert that the second report has been selected for exporting
  await expect(
    page.locator(`app-export-reports-sidenav :text("${secondReportTitle}")`)
  ).toBeVisible();
  
  //!! click on an area that removes the second report from the selection list
  await page.uncheck(`mat-row:has-text("${secondReportTitle}") [type="checkbox"]`);
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! assert the second report was removed
  await expect(
    page.locator(`app-export-reports-sidenav :text("${secondReportTitle}")`)
  ).not.toBeVisible();
  
  //!! assert that the second report checkbox is unchecked
  await expect(secondReport.locator('[type="checkbox"]')).not.toBeChecked();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Export the selected reports and confirm the export
  
  //!! await the download of exported reports after clicking the export button
  const [csvDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.click('button:has-text("Export")'),
  ]);
  
  //!! get the path of the downloaded file
  const path = await csvDownload.path();
  
  //!! read the contents of the downloaded CSV file
  const csvData = await fse.readFile(path, "utf8");
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Confirm the first report title is in the downloaded CSV file
  
  //!! assert that the CSV data contains the title of the first report
  expect(csvData).toContain(firstReportTitle);
});