import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_call_summary_by_skill", async () => {
 // Step 1. View Agent Call Summary by Skill report
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const reportName = `Agent Call Summary by Skill`;
  
  // Login as Supervisor
  const { page } = await logInSupervisor({ slowMo: 500 });
  
  // Navigate to my reports (Reports)
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  await expect(async () => {
    await page.waitForSelector(
      '[data-cy="reports-list-report-name"][role="cell"]',
      { timeout: 1000 },
    );
  }).toPass({ timeout: 1000 * 240 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Search for Agent Call Summary by Skill report
  await page.locator('[placeholder="Type to Search"]').fill(reportName);
  await page.keyboard.press("Enter");
  await expect(page.locator(`mat-row:has-text("${reportName}")`)).toBeVisible();
  await expect(
    page.locator(`mat-row:has-text("Abandoned Calls")`),
  ).not.toBeVisible();
  
  // Save report row to variable
  const agentLocator = page.locator(`mat-row:has-text("${reportName}")`);
  
  // Save the run times
  const runTimes = await agentLocator
    .locator('[data-cy="reports-list-report-run-times"]')
    .innerText();
  
  // Click the report to open it
  await agentLocator.click();
  
  // Wait for Configure button to appear
  await expect(page.locator('button:has-text("Configure")')).toBeVisible();
  
  // Verify the url
  await expect(page).toHaveURL(/report-executions/);
  
  // Verify correct headers for Agent Call Summary by Skill report
  await expect(page.locator(':text-is("Sub Report")')).toBeVisible();
  await expect(page.locator(':text-is("Total Presented Calls")')).toBeVisible();
  await expect(page.locator(':text-is("Total Answered Calls")')).toBeVisible();
  await expect(page.locator(':text-is("Total Missed Calls")')).toBeVisible();
  
  // Agent Call Summary report: Clicking open next to a skill opens data table
  const skillLocator = page.locator('mat-row:has-text("Skill")').first();
  const skillName = await skillLocator
    .locator("mat-cell span")
    .first()
    .innerText();
  await skillLocator.locator(':text("Open")').click();
  
  // Verify report timestamps
  await expect(
    page.locator(
      `[data-cy="report-execution-toolbar-report-title"]:has-text("${skillName}")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(`[data-cy="report-execution-toolbar-report-timeframe"]`),
  ).toHaveText(
    "Thursday, November 30, 2023 12:00:00 AM - Monday, December 4, 2023 11:59:59 PM",
  );
  await expect(page).toHaveURL(/Skill/);
  
  // Navigate back to the previous page
  await page.goBack();
  await page.waitForTimeout(2000);
  
  // Click the Configure button
  await page.locator('button:has-text("Configure")').click();
  
  // Click Apply
  await page.locator('button:has-text("Apply")').click();
  
  // Wait for report to load
  await expect(
    page.getByRole(`button`, { name: `Open In New Tab` }),
  ).toBeVisible();
  await expect(
    page.getByRole(`button`, { name: `Open In New Tab` }),
  ).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  await page.waitForTimeout(2000);
  
  // Reload the page
  await expect(async () => {
    await page.reload();
  
    // Go back to Reports tab
    await page.click('[data-mat-icon-name="reports"]');
    await expect(
      page.locator('app-home-title-translation:text("Reports")'),
    ).toBeVisible();
    await expect(page.locator(`:text("${reportName}")`)).toBeVisible();
  }).toPass({ timeout: 55000 });
  
  await page
    .locator(`mat-row:has-text("${reportName}")`)
    .scrollIntoViewIfNeeded();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the run count went up by one
  await expect(page.locator(`mat-row:has-text("${reportName}")`)).toContainText(
    `${Number(runTimes) + 1}`,
  );
  console.log(`${Number(runTimes) + 1}`);
  
});