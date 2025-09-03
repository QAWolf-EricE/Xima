import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_account_code_summary", async () => {
 // Step 1. View Account Code Summary report
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports (CCaaS with UC tab)
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]', { timeout: 1 * 60 * 1000 }
  )
  
  // REQ172 View Account Code Summary report
  await page.fill(
    '[placeholder="Type to Search"]#mat-input-0',
    "Account Code Summary"
  );
  await page.press("body", "Enter");
  await page.waitForTimeout(5000);
  const runTimes = await page.innerText(
    'mat-row:has(mat-cell:text-is("Account Code Summary")) [data-cy="reports-list-report-run-times"]'
  );
  await page.waitForTimeout(3000);
  await page.locator('mat-row:has(mat-cell:text-is("Account Code Summary"))').click();
  
  // REQ171 Assert correct tiles for Account Code Summary report
  // Expected tiles
  // - Account codes
  // - Total Call count
  // - Total Chat count
  // - Total Call duration
  // - Total Talking Duration
  // - Total Chat Duration
  
  // REQ149 Report run time adds one every configuration
  await page.waitForTimeout(5000);
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.waitForTimeout(5000);
  await page.click('[data-cy="configure-report-apply-button"]');
  await expect(page.locator(':text("Gathering Data")')).toBeVisible();
  try {
    await expect(page.locator(':text("Gathering Data")')).not.toBeVisible();
  } catch {
    await page.reload();
  }
  await page.waitForTimeout(5000);
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  await page.waitForTimeout(1 * 45 * 1000);
  await page.reload();
  
  await page.waitForTimeout(1 * 10 * 1000);
  const newRunTime = await page.innerText(
    'mat-row:has(mat-cell:text-is("Account Code Summary")) [data-cy="reports-list-report-run-times"]'
  );
  
  expect(Number(newRunTime)).toBe(Number(runTimes) + 1);
});