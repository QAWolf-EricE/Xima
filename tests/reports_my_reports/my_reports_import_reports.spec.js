import { cleanUpReports, logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_import_reports", async () => {
 // Step 1. Import Reports
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor({ slowMo: 1000 });
  
  // Clean up reports
  const reportPrefix = 'Import Reports'
  await cleanUpReports(page, reportPrefix)
  
  // REQ09 Navigate to my reports (CCaaS with UC tab)
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // export existing report
  await page.click('[data-cy="manage-menu-open-button"]');
  await page.click('[data-cy="manage-menu-export-reports"]');
  await expect(async () => {
    await page.click(':text("Abandoned Calls")');
  }).toPass({ timeout: 1000 * 240 });
  
  const [rxaDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.click('button :text("Export")'),
  ]);
  
  // wait for download to complete and store file path
  const path = await rxaDownload.path();
  
  // close modal
  await page.click(':text("close")');
  
  // REQ31 Import reports
  await page.click('[data-cy="manage-menu-open-button"]');
  page.once("filechooser", async (chooser) => await chooser.setFiles(path));
  await page.click('[data-cy="manage-menu-import-reports"]');
  
  // rename
  await page.click('[data-mat-icon-name="edit"]');
  const reportName = "Import Reports " + new Date().getTime();
  await page.fill(`[data-cy="app-prompt-input"]`, reportName);
  await page.waitForTimeout(1500);
  await page.click('[data-cy="app-prompt-submit"]');
  await page.locator(`[data-unit="close"]`).click();
  // navigate to imported report
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);
  await page.click(`[data-cy="reports-list-report-name"]:text("${reportName}")`, {
    timeout: 60 * 2 * 1000,
  });
  
  // set date range 9/26/2022 - 9/28/2022
  try {
    await page
      .locator(`[data-cy="report-execution-toolbar-configure-button"]`)
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err)
   }
  await page
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`
    )
    .click();
  await page.click('[aria-label="Choose month and year"]');
  await page.click('[aria-label="2022"]');
  await page.click('.mat-calendar-body-cell :text("SEP")');
  await page.click('.mat-calendar-body-cell :text-is("26")');
  await page.click('.mat-calendar-body-cell :text-is("28")');
  await page.waitForTimeout(2000);
  // apply
  await page.click('button:has-text("Apply")');
  
  // wait for page to load
  await expect(async () => {
    await page.waitForSelector(".summary-item-header", { timeout: 1000 });
  }).toPass({ timeout: 1000 * 240 * 2 });
  
  // assert tiles match with the original Abandoned Calls report
  const durationRegex = /[0-9]+:[0-9]+:[0-9]+/;
  expect(
    (await page.innerText(
      '.summary-item:has-text("Abandoned Calls") .summary-item-value'
    )) * 1
  ).toBeGreaterThanOrEqual(2);
  expect(
    (await page.innerText(
      '.summary-item:has-text("Answered Calls") .summary-item-value'
    )) * 1
  ).toBeGreaterThanOrEqual(0);
  await expect(
    page.locator(
      '.summary-item:has-text("Total Call Duration") .summary-item-value'
    )
  ).toHaveText(durationRegex);
  await expect(
    page.locator(
      '.summary-item:has-text("Avg Call duration") .summary-item-value'
    )
  ).toHaveText(durationRegex);
  
  // cleanup report
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  await page.waitForTimeout(5000);
  await page.click(
    `mat-row:has-text("${reportName}") [data-cy="reports-list-report-more-menu-button"]`
  );
  await page.click('[data-cy="reports-list-more-menu-delete-button"]');
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  await expect(
    page.locator(`mat-row:has-text("${reportName}")`)
  ).not.toBeVisible();
});