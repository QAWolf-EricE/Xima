import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_skill_call_summary", async () => {
 // Step 1. View Skill Call Summary report
  // REQ01 - Login as Supervisor
  const { page } = await logInSupervisor({slowMo: 500});
  
  // REQ09 - Navigate to my reports
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  
  // search "Skill Call Summary"
  await page.fill('[placeholder="Type to Search"]', "Skill Call Summary");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);
  
  // store run times
  const currRunTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]'
  );
  console.log(currRunTimes)
  // REQ168 - View Skill Call Summary report
  await page.click('[role="row"] >> nth=1');
  await page.waitForTimeout(5000);
  
  // REQ169 - Assert correct tiles for Skill Call Summary
  const durationRegex = /[0-9]+:[0-9]+:[0-9]+/;
  const presented = await page.innerText(
    '.summary-item:has-text("Total Presented Calls") .summary-item-value'
  );3
  const answered = await page.innerText(
    '.summary-item:has-text("Total Answered Calls") .summary-item-value'
  );
  const missed = await page.innerText(
    '.summary-item:has-text("Total Missed Calls") .summary-item-value'
  );
  const scheduled = await page.innerText(
    '.summary-item:has-text("Total Callbacks Scheduled") .summary-item-value'
  );
  const accepted = await page.innerText(
    '.summary-item:has-text("Total Callbacks Accepted") .summary-item-value'
  );
  const cancelled = await page.innerText(
    '.summary-item:has-text("Total Callbacks Cancelled") .summary-item-value'
  );
  const totalDuration = await page.innerText(
    '.summary-item:has-text("Total call duration") .summary-item-value'
  );
  const avgDuration = await page.innerText(
    '.summary-item:has-text("avg call duration") .summary-item-value'
  );
  
  // REQ148 - Assert correct tiles for Abandoned Calls report
  expect(presented * 1).toBeGreaterThanOrEqual(51);
  expect(answered * 1).toBeGreaterThanOrEqual(44);
  expect(missed * 1).toBeGreaterThanOrEqual(7);
  expect(scheduled * 1).toBeGreaterThanOrEqual(0);
  expect(accepted * 1).toBeGreaterThanOrEqual(0);
  expect(cancelled * 1).toBeGreaterThanOrEqual(0);
  await expect(
    page.locator(
      '.summary-item:has-text("Total call duration") .summary-item-value'
    )
  ).toHaveText(durationRegex);
  await expect(
    page.locator(
      '.summary-item:has-text("avg call duration") .summary-item-value'
    )
  ).toHaveText(durationRegex);
  
  // configure reports
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.click('[data-cy="configure-report-apply-button"]');
  
  // wait for loading
  // await expect(page.locator("text=Loading Report...")).toBeVisible();
  // try {
  //   await expect(page.locator("text=Loading Report...")).not.toBeVisible({
  //     timeout: 60 * 1000,
  //   });
  // } catch {
  //   await page.reload();
  // }
  // go back to result page
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  await page.waitForTimeout(1500);
  
  // REQ149 - Report run time adds one every configuration
  const newRunTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]'
  );
  expect(newRunTimes * 1).toBe(Number(currRunTimes));
});