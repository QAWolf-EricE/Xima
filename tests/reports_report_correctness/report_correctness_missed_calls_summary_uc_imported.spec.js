import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_missed_calls_summary_uc_imported", async () => {
 // Step 1. Report Correctness: Missed Calls Summary (UC) (imported)
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports (CCaaS with UC tab)
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // navigate to report
  const reportName = "Missed Call Summary (UC) (imported)";
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);
  
  //store runtime
  const runtime = await page
    .locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`
    )
    .innerText();
  await page.click(`[data-cy="reports-list-report-name"]:text("${reportName}")`);
  
  // start configuring
  await page.waitForTimeout(4000);
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.waitForTimeout(1000);
  await page.click('[data-cy="configure-report-apply-button"]');
  
  // wait for page to load
  await expect(page.locator(':text("Loading Report...")')).not.toBeVisible({
    timeout: 3* 60 * 1000,
  });
  
  // back to previous page
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  await page.waitForTimeout(30000);
  await page.reload()
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  
  // REQ149 Report run time adds one every configuration
  await expect(
    page.locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`
    )
  ).toHaveText(`${parseInt(runtime) + 1}`);
  
});