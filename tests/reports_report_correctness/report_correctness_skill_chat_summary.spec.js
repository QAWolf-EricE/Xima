import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_skill_chat_summary", async () => {
 // Step 1. Report Correctness: Skill Chat Summary
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as supervisor
  const { page } = await logInSupervisor();
  
  //!! assert that the "Reports" title is visible
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  //!! wait for report list
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Increase the number of run times of the "Skill Chat Summary" report by 1
  
  //!! search for the "Skill Chat Summary" report
  await page.fill('[placeholder="Type to Search"]', "Skill Chat Summary");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);
  
  //!! save the current number of run times of the "Skill Chat Summary" report
  const currRunTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]',
  );
  
  //!! click the "Skill Chat Summary" report in the list
  await page.click(':text-is("Skill Chat Summary")');
  
  //!! assert that we are in the "Skill Chat Summary" page
  await expect(
    page.locator(
      '[data-cy="report-execution-toolbar-report-title"]:has-text("Skill Chat Summary")',
    ),
  ).toBeVisible();
  
  //!! click the configure button
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  
  //!! click the apply button to increase the number of run times by 1
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //!! wait for the report to load
  await expect(page.locator(':text("Gathering Data")')).toBeVisible({
    timeout: 90 * 1000,
  });
  await expect(page.locator(`:text("Gathering Data")`)).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  //!! wait for three seconds
  await page.waitForTimeout(3000);
  
  //!! go back to report list
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! verify run time increased by 1
  
  //!! assert that the run times of the "Skill Chat Summary" report is now the previous run times + 1, or it is no less than the previous run times if the former fails
  try {
    await expect(
      page.locator('[data-cy="reports-list-report-run-times"]'),
    ).toHaveText((parseInt(currRunTimes) + 1).toString(), {
      timeout: 1 * 60 * 1000,
    });
  } catch {
    expect(
      parseInt(await page.innerText('[data-cy="reports-list-report-run-times"]')),
    ).toBeGreaterThan(parseInt(currRunTimes), { timeout: 1 * 60 * 1000 });
  }
  
});