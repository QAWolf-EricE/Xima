import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_call_volume_uc_imported", async () => {
 // Step 1. Report Correctness: Call Volume (UC) (imported)
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports
  await page.hover('[data-cy="sidenav-menu-REPORTS"]');
  await page.click(':text("My Reports")');
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  
  // View Call Volume (UC) (imported) report
  await page.fill('[placeholder="Type to Search"]', "Call Volume (UC) (imported)");
  await page.keyboard.press("Enter");
  const runTimes = Number(
    await page.innerText('[data-cy="reports-list-report-run-times"] >> nth=0')
  );
  await page.waitForTimeout(10000);
  await page.click(':text("Call Volume (UC) (imported)")');
  
  // REQ149 Report run time adds one every configuration
  await page.waitForTimeout(5000);
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.waitForTimeout(5000);
  await page.click('[data-cy="configure-report-apply-button"]');
  await expect(page.locator(':text("Loading")')).not.toBeVisible({ 
    timeout: 3 * 60 * 1000 });
  
  await page.waitForTimeout(30000);
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  // await page.waitForTimeout(30000);
  await expect(
    page.locator('[data-cy="reports-list-report-run-times"] >> nth=0')
  ).toHaveText(`${runTimes + 1}`, { timeout: 3 * 60 * 1000 });
});