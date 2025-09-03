import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_chat_volume", async () => {
 // Step 1. Report Correctness: Chat Volume
  
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor();
  
  // REQ09 Navigate to my reports
  await page.hover('[data-cy="sidenav-menu-REPORTS"]');
  await page.click(':text("My Reports")');
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  
  // View Chat Volume report
  await page.fill('[placeholder="Type to Search"]', "Chat Volume");
  await page.keyboard.press("Enter");
  const runTimes = Number(
    await page.innerText('[data-cy="reports-list-report-run-times"] >> nth=0'),
  );
  await page.waitForTimeout(2000);
  await page.click(':text("Chat Volume")');
  
  // REQ149 Report run time adds one every configuration
  await page.waitForTimeout(3000);
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  await page.waitForTimeout(2000);
  await page.click('[data-cy="configure-report-apply-button"]');
  await page.waitForTimeout(2000);
  await expect(page.locator(`:text("Loading Report")`)).not.toBeVisible({
    timeout: 3 * 60 * 1000,
  });
  
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  await page.waitForTimeout(3000);
  
  // Click search & wait for count to update
  await expect(async () => {
    await page.reload();
    await page.fill('[placeholder="Type to Search"]', "Chat Volume");
    await page.keyboard.press("Enter");
    await expect(
      page.locator('[data-cy="reports-list-report-run-times"] >> nth=0'),
    ).toHaveText(`${runTimes + 1}`, { timeout: 15 * 1000 });
  }).toPass({ timeout: 2 * 60 * 1000 });
  
});