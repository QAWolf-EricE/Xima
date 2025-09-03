import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("view_edit_and_download_report_from_report_details", async () => {
 // Step 1. View Individual Report
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const today = new Date();
  const formattedDate = dateFns.format(today, "MMM d, yyyy");
  const ausDate = dateFns.format(dateFns.sub(today, {days: 1}), "MMM d, yyyy");
  
  // Log in
  const { page } = await logInSupervisor();
  
  // Wait for "My Reports" page to load
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  await expect(
    page.locator('[data-cy="reports-list-report-name"] >> nth=0'),
  ).toBeVisible();
  
  // Store data in first row
  const reportName = await page
    .locator('[data-cy="reports-list-report-name"] >> nth=0')
    .innerText();
  const lastRun = await page
    .locator('[data-cy="reports-list-report-last-run"] >> nth=0')
    .innerText();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the first row
  await page.locator('[data-cy="reports-list-report-name"] >> nth=0').click();
  
  // Wait for the page to load
  await expect(page.locator(`mat-row:has-text("Call ID")`).first()).toBeVisible();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert report name and last run details
  await expect(
    page.locator('[data-cy="report-execution-toolbar-report-title"]'),
  ).toHaveText(reportName);
  const reportViewLastRun = await page
    .locator('[data-cy="report-execution-toolbar-report-last-run"]')
    .innerText();
  expect("Last Time Run: " + lastRun.replaceAll(",", "")).toBe(
    reportViewLastRun.replace(",", ""),
  );
  await page.waitForTimeout(1500);
  
  // Assert tiles are visible
  const tiles = await page.locator(".summary-item").count();
  expect(tiles).toBeGreaterThan(0);
  
 // Step 2. Edit Report from Report Details
  //--------------------------------
  // Arrange:
  //--------------------------------
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Edit button
  await page.locator('[data-cy="report-execution-toolbar-edit-button"]').click();
  await expect(page).toHaveURL(/\/web\/reports\/custom-report\/edit/);
  await expect(page.locator('[data-cy="custom-report-header"]')).toHaveText(
    "Custom Reports"
  );
  
  // Verify custom report modal
  await expect(page.locator("app-custom-report-container")).toBeVisible();
  await expect(page.locator(".summary-item").first()).toBeVisible();
  
  // Go back to report details page
  await page.goBack();
  await expect(page.locator('[data-cy="confirmation-dialog-okay-button"]')).toBeVisible()
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  // Configure report from report details
  await expect(page.locator('[data-cy="report-execution-toolbar-configure-button"]')).toBeVisible();
  await expect(page.locator('[data-cy="report-execution-toolbar-configure-button"]')).toBeEnabled();
  await page.waitForTimeout(1000)
  await page.locator('[data-cy="report-execution-toolbar-configure-button"]').click();
  await expect(page.locator('[data-cy="configure-report-apply-button"]')).toBeVisible();
  await page.locator('[data-cy="configure-report-apply-button"]').click();
  
  // Wait for the "Loading Report" to not be visible
  await expect(page.locator(`app-report-loading`)).toBeVisible({timeout: 2 * 60 * 1000 });
  await expect(page.locator(`app-report-loading`)).not.toBeVisible({ timeout: 2 * 60 * 1000 });
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert last time run updated
  await expect(
    page.locator('[data-cy="report-execution-toolbar-report-last-run"]')
  ).not.toHaveText("Last Time Run: " + lastRun);
  
  // Assert last time run date, including ausDate for AU QAEs
  try {
    await expect(
      page.locator('[data-cy="report-execution-toolbar-report-last-run"]')
    ).toContainText("Last Time Run: " + formattedDate);
  } catch {
    await expect(
      page.locator('[data-cy="report-execution-toolbar-report-last-run"]')
    ).toContainText("Last Time Run: " + ausDate);
  }
 // Step 3. Download Report from Report Details
  //--------------------------------
  // Arrange:
  //--------------------------------
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the download button
  await page
    .locator('[data-cy="report-execution-toolbar-download-button"]')
    .click();
  
  // Select JSON as file type
  await page.locator('[data-cy="xima-select-container"]').click();
  await page.locator('[data-cy="xima-select-options"] :text("JSON")').click();
  await expect(
    page.locator(
      `app-export-report [data-cy="xima-select-container"] :text("JSON")`,
    ),
  ).toBeVisible();
  
  // Select Yes as Summarize
  await page.waitForTimeout(1000);
  await page.locator('[data-cy="dropdown-property-container"]').click();
  await page.waitForTimeout(1000);
  await page
    .locator('[data-cy="dropdown-property-options"] :text("Yes")')
    .click();
  await expect(
    page.locator(
      `app-export-report [data-cy="dropdown-property-container"] :text("Yes")`,
    ),
  ).toBeVisible();
  
  // Click the export button
  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("app-export-report button").click(),
  ]);
  
  // Wait for download to complete and convert file data
  const path = await jsonDownload.path();
  const jsonData = JSON.parse(await fse.readFile(path, "utf-8"));
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert download contains report name
  expect(jsonData.title).toContain(reportName);
  
});