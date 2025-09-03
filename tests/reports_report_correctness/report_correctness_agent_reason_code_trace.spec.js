import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_reason_code_trace", async () => {
 // Step 1. View Agent Reason Code Trace report
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as supervisor
  const { page } = await logInSupervisor();
  
  // Wait for load
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to my reports
  await page.locator('[data-cy="sidenav-menu-REPORTS"]').hover();
  await page.locator(':text("My Reports")').click();
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  // Wait for load
  await expect(async () => {
    await page.waitForSelector(
      '[data-cy="reports-list-report-name"][role="cell"]',
      { timeout: 1000 },
    );
  }).toPass({ timeout: 240 * 1000 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // View Agent Reason Code Trace report:
  // Search for "Agent Reason Code Trace"
  await page
    .locator('[placeholder="Type to Search"]')
    .fill("Agent Reason Code Trace");
  await page.keyboard.press("Enter");
  await expect(
    page.locator('[data-cy="reports-list-report-name"] >> nth=0'),
  ).toHaveText("Agent Reason Code Trace", { timeout: 30000 });
  
  // Save current number of run times
  const currentRunTimes = parseInt(
    await page.innerText('[data-cy="reports-list-report-run-times"] >> nth=0'),
  );
  
  // Navigate to Agent Reason Code Trace
  await page
    .locator(
      '[data-cy="reports-list-report-name"]:text-is("Agent Reason Code Trace")',
    )
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert "Agent Reason Code Trace" title
  await expect(
    page.locator('[data-cy="report-execution-toolbar-report-title"]'),
  ).toHaveText("Agent Reason Code Trace");
  
  // Assert "Feature Events" column
  await expect(
    page.locator('mat-header-cell:has-text("Feature Events")'),
  ).toBeVisible();
  
  // Assert "Total Duration" column
  await expect(
    page.locator('mat-header-cell:has-text("Total Duration")'),
  ).toBeVisible();
  
  // Assert "Max Duration" column
  await expect(
    page.locator('mat-header-cell:has-text("Max Duration")'),
  ).toBeVisible();
  
  // Assert "Avg Duration" column
  await expect(
    page.locator('mat-header-cell:has-text("Avg Duration")'),
  ).toBeVisible();
  
  // Click "OPEN" for an agent
  const selectedSubReport = await page.innerText('[role="cell"] >> nth=0');
  await page
    .locator(`[role="row"]:has-text("${selectedSubReport}") :text-is("Open")`)
    .click();
  
  // Assert that the sub report opens
  await expect(
    page.locator('[data-cy="report-execution-toolbar-report-title"]'),
  ).toHaveText(selectedSubReport);
  
  // Assert "FEATURE" column
  await expect(page.locator('mat-header-cell :text-is("FEATURE")')).toBeVisible();
  
  // Assert "FEATURE TYPE" column
  await expect(
    page.locator('mat-header-cell :text-is("FEATURE TYPE")'),
  ).toBeVisible();
  
  // Assert "REASON CODE" column
  await expect(
    page.locator('mat-header-cell :text-is("REASON CODE")'),
  ).toBeVisible();
  
  // Assert "START TIME" column
  await expect(
    page.locator('mat-header-cell :text-is("START TIME")'),
  ).toBeVisible();
  
  // Assert "END TIME" column
  await expect(
    page.locator('mat-header-cell :text-is("END TIME")'),
  ).toBeVisible();
  
  // Assert "DURATION" column
  await expect(
    page.locator('mat-header-cell :text-is("DURATION")'),
  ).toBeVisible();
  
 // Step 2. Open Agent data view (Agent Reason Code Trace)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Navigate back
  await page.locator('[data-cy="report-execution-toolbar-back-button"]').click();
  
  // Report run time adds one every configuration,
  // Configure report to Feb 3 2022 - Feb 3 2022 with 1 agent:
  // Wait for load
  await expect(async () => {
    await page.waitForSelector('[role="row"]', { timeout: 1000 });
  }).toPass({ timeout: 240 * 1000 });
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click "Configure" button
  await page
    .locator('[data-cy="report-execution-toolbar-configure-button"]')
    .click();
  
  // Click "Apply" button
  await page.locator('[data-cy="configure-report-apply-button"]').click();
  
  // Wait for load
  await expect(page.locator(".loading-percent div")).toBeVisible({
    timeout: 2 * 30000,
  });
  await expect(page.locator(".loading-percent div")).not.toBeVisible({
    timeout: 2 * 30000,
  });
  
  // Navigate back
  await page.locator('[data-cy="report-execution-toolbar-back-button"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that current run time increments by 1 when reloaded page
  await expect(async () => {
    await page.reload();
    await page.waitForSelector(
      '[data-cy="reports-list-report-name"][role="cell"]',
      { timeout: 1 * 60 * 1000 },
    );
  
    // Search for "Agent Reason Code Trace"
    await page
      .locator('[placeholder="Type to Search"]')
      .fill("Agent Reason Code Trace");
    await page.keyboard.press("Enter");
  
    // Assert that the run time has incremented by 1
    await expect(
      page
        .locator(
          `[data-cy="reports-list-report-run-times"]:has-text("${
            currentRunTimes + 1
          }")`,
        )
        .first(),
    ).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 1000 * 480 });
  
});