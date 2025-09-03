import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_group_call_volume_uc_imported", async () => {
 // Step 1. Report Correctness: Group Call Volume (UC) (imported)
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports (CCaaS with UC tab)
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 2 * 60 * 1000 },
  );
  
  // navigate to report
  const reportName = "Group Call Volume (UC) (imported)";
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  //store runtime
  const runtime = await page
    .locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`,
    )
    .innerText();
  await page.click(`[data-cy="reports-list-report-name"]:text("${reportName}")`, {
    force: true,
  });
  
  // apply configuration
  await page.waitForTimeout(3000);
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.click('[data-cy="configure-report-apply-button"]');
  
  // wait for page to load
  await page
    .locator('span:text-is(" Open In New Tab ")')
    .waitFor({ timeout: 180 * 1000 });
    
  await expect(async () => {
    await expect(page.locator(`:text("Gathering Data...")`)).not.toBeVisible({
      timeout: 1000,
    });
  }).toPass({ timeout: 1000 * 180 });
  
  // back to previous page
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  // Reload the page
  await page.reload();
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  
  // REQ149 Report run time adds one every configuration
  try {
    await expect(
      page.locator(
        `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`,
      ),
    ).toHaveText(`${parseInt(runtime) + 1}`, { timeout: 3 * 60 * 1000 });
  } catch {
    await page.reload();
    await page.fill('[placeholder="Type to Search"]', reportName);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000);
    await expect(
      page.locator(
        `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`,
      ),
    ).toHaveText(`${parseInt(runtime) + 1}`);  
  }
});