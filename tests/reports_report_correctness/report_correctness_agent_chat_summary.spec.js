import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_chat_summary", async () => {
 // Step 1. View Agent Chat Summary report
  // REQ01 Login as Supervisor
  const { page, context, browser } = await logInSupervisor();
  
  // REQ09 Navigate to my reports
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  await expect(page).toHaveURL(/reports/);
  await page.click(".report-links");
  await page.click('[id*="mat-option"] :text("My Reports")');
  
  // search "Agent Chat Summary"
  await page.waitForTimeout(2000);
  await page.fill('[placeholder="Type to Search"]', "Agent Chat Summary");
  await page.keyboard.press("Enter");
  
  // get run times for Agent Chat Summary reports
  await page.waitForTimeout(3000);
  const runTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"] >> nth=0',
  );
  
  // Click into the report
  await page.click(
    '[data-cy="reports-list-report-name"]:has-text("Agent Chat Summary")',
  );
  await page.waitForTimeout(3000);
  
  // REQ149 Report run time adds one every configuration
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.waitForTimeout(3000);
  await page.click('[data-cy="configure-report-apply-button"]');
  
  // assert report is loading
  await expect(page.locator(':text("Gathering Data")')).toBeVisible( 1 * 60 * 1000);
  try {
    await expect(page.locator(':text("Gathering Data")')).not.toBeVisible({
      timeout: 2 * 60 * 1000,
    });
  } catch {
    await page.reload();
  }
  await page.waitForTimeout(10000);
  
  await expect(
    page.locator(
      '[data-cy="report-execution-toolbar-report-title"]:has-text("Agent Chat Summary")',
    ),
  ).toBeVisible();
  
  // go back to Reports
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  // search for Agent Chat Summary
  await page.waitForTimeout(2000);
  await page.fill('[placeholder="Type to Search"]', "Agent Chat Summary");
  await page.keyboard.press("Enter");
  
  await page.waitForTimeout(10 * 1000);
  const newRunTimes = parseInt(runTimes) + 1;
  await page.waitForTimeout(3000);
  console.log("new run times:", newRunTimes); // 97
  await expect(
    page.locator('[data-cy="reports-list-report-run-times"] >> nth=0'),
  ).toHaveText(newRunTimes.toString());
  
  // REQ180 View Agent Chat Summary report
  await page.click(
    '[data-cy="reports-list-report-name"]:has-text("Agent Chat Summary")',
  );
  
  // REQ181 Assert correct tiles for Agent Chat Summary report
  await expect(
    page.locator('.summary-item-value:below(:text("Total Chat Count"))').first(),
  ).toBeVisible();
  await expect(
    page
      .locator('.summary-item-value:below(:text("Total Answered Chat Count"))')
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator('.summary-item-value:below(:text("Avg Chat Speed of Answer"))')
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator('.summary-item-value:below(:text("Total Chat Duration"))')
      .first(),
  ).toBeVisible();
  await expect(
    page.locator('.summary-item-value:below(:text("Avg Chat Duration"))').first(),
  ).toBeVisible();
});