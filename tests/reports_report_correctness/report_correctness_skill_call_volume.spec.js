import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_skill_call_volume", async () => {
 // Step 1. Report Correctness: Skill Call Volume
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  
  await page.fill('[placeholder="Type to Search"]', "Skill Call Volume");
  await page.waitForTimeout(3000);
  await page.press("body", "Enter");
  await page.waitForTimeout(3000);
  
  // REQ149 Report run time adds one every configuration
  await expect(page.locator('[data-cy="reports-list-report-name"] >> nth=0')).toHaveText(
    "Skill Call Volume"
  );
  const runTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]'
  );
  await page.click('[data-cy="reports-list-report-name"]');
  await page.waitForTimeout(5000);
  
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.waitForTimeout(5000);
  await page.click('[data-cy="configure-report-apply-button"]');
  await expect(page.locator('text=Loading Report...')).not.toBeVisible();
  await page.waitForTimeout(30000);
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  await page.waitForTimeout(30000);
  const newRunTime = await page.innerText(
    '[data-cy="reports-list-report-run-times"]'
  );
  
  expect(Number(newRunTime)).not.toBe(Number(runTimes));
  expect(Number(newRunTime)).toBe(Number(runTimes) + 1);
});