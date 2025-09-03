import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_callback_calls", async () => {
 // Step 1. Report Correctness: Callback Calls
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports
  await page.hover('[data-cy="sidenav-menu-REPORTS"]');
  await page.click(':text("My Reports")');
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  // View Callback Calls Report
  await page.locator('[placeholder="Type to Search"]').fill("Callback Calls");
  await page.keyboard.press("Enter");
  const runTimes = Number(
    await page.locator('[data-cy="reports-list-report-run-times"]').innerText(),
  );
  await page.waitForTimeout(2000);
  await page.click(':text("Callback Calls")');
  
  // REQ149 Report run time adds one every configuration
  await page.waitForTimeout(3000);
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.click('[data-cy="configure-report-apply-button"]');
  
  // Wait for report to load
  await page.waitForTimeout(2000);
  try {
    await expect(page.locator(`:text("Loading Report... 100%")`)).toBeVisible({
      timeout: 2 * 60 * 1000,
    });
    await page.reload();
  } catch {
    await page.reload();
  }
  
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  // Search for callback calls again
  await page.locator('[placeholder="Type to Search"]').fill("Callback Calls");
  await page.keyboard.press("Enter");
  
  await expect(
    page.locator('[data-cy="reports-list-report-run-times"]'),
  ).toHaveText(`${runTimes + 1}`, { delay: 500 });
});