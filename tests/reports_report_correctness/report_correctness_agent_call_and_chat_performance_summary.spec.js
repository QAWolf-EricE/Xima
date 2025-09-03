import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_call_and_chat_performance_summary", async () => {
 // Step 1. View Agent Call and Chat Performance Summary report
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // REQ09 Navigate to my reports (CCaaS with UC tab)
  await page.hover('[data-cy="sidenav-menu-REPORTS"]');
  await page.click(':text("My Reports")');
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  
  // REQ149 Report run time adds one every configuration
  await page.fill('[placeholder="Type to Search"]', "Assert Report Correctness");
  await page.keyboard.press("Enter");
  
  // grab run times count
  await expect(async () => {
    await page
      .locator('[data-cy="reports-list-report-run-times"]')
      .waitFor({ timeout: 1000 });
  }).toPass({ timeout: 1000 * 120 });
  const firstRunTimes = Number(
    await page.innerText('[data-cy="reports-list-report-run-times"] >> nth=0')
  );
  
  // nav into searched report
  await page.click('[data-cy="reports-list-report-name"] >> nth=0');
  await expect(
    page.locator('app-report-execution-toolbar :text("Download")')
  ).toBeVisible();
  
  // run report
  try {
    await page.waitForTimeout(2000);
    await page
      .locator('[data-cy="report-execution-toolbar-configure-button"]')
      .click();
    await page.click('[data-cy="configure-report-apply-button"]');
    await expect(page.locator(':text("Gathering Data")')).toBeVisible();
    await expect(page.locator(':text("Gathering Data")')).not.toBeVisible();
    await expect(page.locator(':text("Calculating Data")')).toBeVisible();
    await expect(page.locator(':text("Calculating Data")')).not.toBeVisible({
      timeout: 3 * 60 * 1000,
    });
  } catch {
    await page.waitForTimeout(2000);
    await page
      .locator('[data-cy="report-execution-toolbar-configure-button"]')
      .click();
    await page.click('[data-cy="configure-report-apply-button"]');
    await expect(page.locator(':text("Gathering Data")')).toBeVisible();
    await expect(page.locator(':text("Gathering Data")')).not.toBeVisible();
    await expect(page.locator(':text("Calculating Data")')).toBeVisible();
    await expect(page.locator(':text("Calculating Data")')).not.toBeVisible({
      timeout: 2 * 60 * 1000,
    });
  }
  
  // check that run time count increased
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  await expect(async () => {
    await page
      .locator('[data-cy="reports-list-report-run-times"]')
      .waitFor({ timeout: 1000 });
  }).toPass({ timeout: 1000 * 120 });
  const secondRunTimes = Number(
    await page.innerText('[data-cy="reports-list-report-run-times"] >> nth=0')
  );
  
  let retries = 0; 
  const maxRetries = 5;
  let currentRunTimes = Number(await page.locator('[data-cy="reports-list-report-run-times"]').innerText());
  while (currentRunTimes !== firstRunTimes + 1 && retries < maxRetries) {
      await page.reload();
      await page.locator('[data-cy="reports-list-report-run-times"]').first().waitFor();
      await page.locator('[placeholder="Type to Search"]').click();
      await page.keyboard.type('Assert Report Correctness')
      await page.waitForTimeout(2000); 
      await page.locator('[data-cy="reports-list-report-run-times"]').waitFor({ timeout: 20 * 1000 });
      currentRunTimes = Number(await page.locator('[data-cy="reports-list-report-run-times"]').innerText());
      retries++;
  }
  // Now, use a direct expect assertion
  expect(Number(currentRunTimes)).toEqual(firstRunTimes + 1);
  
  // REQ178 View Agent Call and Chat Performance Summary report
  await page.click('[data-cy="reports-list-report-name"] >> nth=0');
  await expect(
    page.locator('app-report-execution-toolbar :text("Download")')
  ).toBeVisible();
  await page.waitForTimeout(1000);
  
  // REQ179 Assert correct tiles for Agent Call and Chat Performance Summary report
  await expect(page.locator(':text("PRESENTED CALL COUNT")')).toBeVisible({ timeout: 120000 });
  await expect(page.locator(':text("ANSWERED CALL COUNT")')).toBeVisible({ timeout: 120000 });
  await expect(page.locator(':text("TOTAL TALKING DURATION")')).toBeVisible({ timeout: 120000 });
  await expect(page.locator(':text("AVG TALKING DURATION")')).toBeVisible({ timeout: 120000 });
  await expect(page.locator(':text("CHAT COUNT") >> nth=0')).toBeVisible({ timeout: 120000 });
  await expect(page.locator(':text("ANSWERED CHAT COUNT")')).toBeVisible({ timeout: 120000 });
  await expect(page.locator(':text("TOTAL CHAT DURATION")')).toBeVisible({ timeout: 120000 });
  await expect(page.locator(':text("AVG CHAT DURATION")')).toBeVisible({ timeout: 120000 });
  
});