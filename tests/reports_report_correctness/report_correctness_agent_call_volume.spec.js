import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_call_volume", async () => {
 // Step 1. View Agent Call Volume report
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Const
  const reportName = "Agent Call Volume";
  
  // Login as Supervisor
  const { context, page } = await logInSupervisor();
  
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
  // Search for Agent Call Volume report
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
  
  // Verify correct tiles for Agent Call Volume report
  await expect(
    page.locator('[role="columnheader"]:has-text("Sub Report")')
  ).toBeVisible();
  await expect(
    page.locator('[role="columnheader"]:has-text("Total Calls")')
  ).toBeVisible();
  await expect(
    page.locator('[role="columnheader"]:has-text("Total Inbound Calls")')
  ).toBeVisible();
  await expect(
    page.locator('[role="columnheader"]:has-text("Total Callback Calls")')
  ).toBeVisible();
  await expect(
    page.locator('[role="columnheader"]:has-text("Total Talking Duration")')
  ).toBeVisible();
  await expect(
    page.locator(
      '[role="columnheader"]:has-text("Total Inbound Talking Duration")'
    )
  ).toBeVisible();
  await expect(
    page.locator(
      '[role="columnheader"]:has-text("Total Callback Talking Duration")'
    )
  ).toBeVisible();
  await expect(
    page.locator('[role="columnheader"]:has-text("Avg Talking Duration")')
  ).toBeVisible();
  await expect(
    page.locator('[role="columnheader"]:has-text("Max Talking Duration")')
  ).toBeVisible();
  
  // Click Open button in agent row
  await page.locator(`mat-cell:text("Open") >> nth=0`).click();
  await expect(page.locator("mat-table")).toBeVisible();
  
  const row = 'mat-row:has(.cdk-column-0Hour-of-Day:has-text("19:00"))';
  await expect(page.locator(`${row} .cdk-column-1Total-Calls span`)).toHaveText(
    "1", { timeout: 1000 }
  );
  await expect(page.locator(`${row} .cdk-column-2Inbound-Calls span`)).toHaveText(
    "1"
  );
  await expect(
    page.locator(`${row} .cdk-column-3Callback-Calls span`)
  ).toHaveText("");
  await expect(
    page.locator(`${row} .cdk-column-4Total-Talking-Duration span`)
  ).toHaveText("0:00:07");
  await expect(
    page.locator(`${row} .cdk-column-5Inbound-Talking-Duration span`)
  ).toHaveText("0:00:07");
  await expect(
    page.locator(`${row} .cdk-column-6Callback-Talking-Duration span`)
  ).toHaveText("");
  await expect(
    page.locator(`${row} .cdk-column-7Avg-Talking-Duration span`)
  ).toHaveText("0:00:07");
  await expect(
    page.locator(`${row} .cdk-column-8Max-Talking-Duration span`)
  ).toHaveText("0:00:07");
  
  // Go back to previous page
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
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
  
});