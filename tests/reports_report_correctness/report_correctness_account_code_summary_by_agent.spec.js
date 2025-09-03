import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_account_code_summary_by_agent", async () => {
 // Step 1. Report Correctness: Account Code Summary by Agent
  
  
  // REQ01 Login as Supervisor
  const { page, context, browser } = await logInSupervisor();
  
  // REQ09 Navigate to my reports
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]', { timeout: 1 * 60 * 1000 }
  )
  
  // REQ149 Report run time adds one every configuration
  // search report
  const reportName = "Agent Call Summary";
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  
  // grab run times count
  const firstRunTimes = Number(
    await page.innerText('[data-cy="reports-list-report-run-times"] >> nth=0')
  );
  
  // nav into searched report
  await page.click('[data-cy="reports-list-report-name"] >> nth=0');
  await expect(page.locator(':text("Configure")')).toBeVisible();
  
  // run report
  await page.waitForTimeout(3000);
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.waitForTimeout(3000);
  await page.click('[data-cy="configure-report-apply-button"]');
  await expect(page.locator(':text("Gathering Data")')).toBeVisible();
  await expect(page.locator(':text("Gathering Data")')).not.toBeVisible();
  await expect(page.locator(':text("Calculating Data")')).toBeVisible();
  try {
    await expect(page.locator(':text("Calculating Data")')).not.toBeVisible();
  } catch {
    await page.reload();
  }
  // check that run time count increased
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  await expect(page.locator(`[data-cy="reports-list-report-run-times"] >> nth=0 >> text="${firstRunTimes}"`)).not.toBeVisible({ timeout: 2 * 60 * 1000 })
  await page.waitForTimeout(3000);
  const secondRunTimes = Number(
    await page.innerText('[data-cy="reports-list-report-run-times"] >> nth=0')
  );
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  console.log(secondRunTimes, firstRunTimes);
  expect(secondRunTimes).toEqual(firstRunTimes + 1);
  await page.waitForTimeout(5000)
  
  // REQ170 Assert correct tiles for Agent Call Summary report
  await page.click('[data-cy="reports-list-report-name"] >> nth=0');
  await page.waitForTimeout(5000)
  await page.reload()
  await page.waitForTimeout(5000)
  
  await expect(page.locator(':text-is("Total Calls")')).toBeVisible();
  await expect(page.locator(':text-is("Total Call Duration")')).toBeVisible();
  await expect(
    page.locator(':text-is("Total Queue Offer Duration")')
  ).toBeVisible();
  await expect(
    page.locator(':text-is("Avg Queue Offer Duration")')
  ).toBeVisible();
  await expect(page.locator(':text-is("Total Talking Duration")')).toBeVisible();
  await expect(page.locator(':text-is("Avg Talking Duration")')).toBeVisible();
  await expect(page.locator(':text-is("Total Answered Calls")')).toBeVisible();
  await expect(
    page.locator(':text-is("Avg Answered Call Percentage")')
  ).toBeVisible();
  await expect(page.locator(':text-is("Max Talking Duration")')).toBeVisible();
  
});