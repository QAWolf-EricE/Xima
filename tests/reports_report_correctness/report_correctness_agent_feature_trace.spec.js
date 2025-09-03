import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_feature_trace", async () => {
 // Step 1. View Agent Feature Trace Report
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const reportName = `Agent Feature Trace`;
  
  // Log in as supervisor
  const { page } = await logInSupervisor({ sloMo: 1500 });
  
  // Verify that the reports page is visible
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Check if the reports title is visible
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  // Search for the report "Agent Feature Trace"
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
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the report to open it
  await agentLocator.click();
  
  // Wait for Configure button to appear
  await expect(page.locator('button:has-text("Configure")')).toBeVisible();
  
  // Verify the url
  await expect(page).toHaveURL(/report-executions/);
  await page.waitForTimeout(1000)
  
  // Click the configure button of the report
  await page
    .locator('[data-cy="report-execution-toolbar-configure-button"]')
    .click();
  
  // Click the edit button of the "FEATURE_TYPES" parameter on the preview screen
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-FEATURE_TYPES"] [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  
  // Click the 'All' checkbox to select all feature types
  await page
    .locator(`[data-cy="checkbox-tree-property-select-all"] input`)
    .check();
  
  // Apply feature types selection
  await page.locator('[data-cy="checkbox-tree-dialog-apply-button"]').click();
  
  // Edit Agents
  await page
    .locator(`[data-cy="xima-preview-input-edit-button"]`)
    .first()
    .click();
  await page
    .locator(`[data-cy="xima-list-select-search-input"]`)
    .fill("WebRTC Agent 4");
  await page
    .getByRole("option", { name: "WebRTC Agent 4" })
    .locator("div")
    .first()
    .click();
  await page.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // Apply configuration to the report
  await page.locator('[data-cy="configure-report-apply-button"]').click();
  
  // Wait for report to load
  await expect(
    page.getByRole(`button`, { name: `Open In New Tab` }),
  ).toBeVisible();
  await expect(
    page.getByRole(`button`, { name: `Open In New Tab` }),
  ).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  // Verify report tiles
  // Check if "Stephanie P(666)" is visible on the report
  await expect(page.locator(':text("Stephanie P(666)")')).toBeVisible();
  
  // Open agent data view and verify elements
  
  // Click "Open" to open the agent's data view
  await page.locator(':text("Open") >> nth=1').click({ timeout: 60000 });
  
  // Check if "Feature Events" text is visible
  await expect(page.locator(':text("Feature Events")')).toBeVisible();
  
  // Check if "Total Duration" text is visible
  await expect(page.locator(':text("Total Duration")')).toBeVisible();
  
  // Check if "FEATURE TYPE" is visible
  await expect(page.locator(':text("FEATURE TYPE")')).toBeVisible();
  
  // Check if "FEATURE ENABLED" is visible
  await expect(page.locator(':text("FEATURE ENABLED")')).toBeVisible();
  
  // Check if "REASON CODE" is visible
  await expect(page.locator(':text("REASON CODE")')).toBeVisible();
  
  // Check if "START TIME" is visible
  await expect(page.locator(':text("START TIME")')).toBeVisible();
  
  // Check if "END TIME" is visible
  await expect(page.locator(':text("END TIME")')).toBeVisible();
  
  // Click the back button to go back to the report
  await page.locator('[data-cy="report-execution-toolbar-back-button"]').click();
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  // Click the configure button of the report
  await page
    .locator('[data-cy="report-execution-toolbar-configure-button"]')
    .click();
  
  // Apply configuration to the report
  await page.locator('[data-cy="configure-report-apply-button"]').click();
  
  // Wait for report to load
  await expect(
    page.getByRole(`button`, { name: `Open In New Tab` }),
  ).toBeVisible();
  await expect(
    page.getByRole(`button`, { name: `Open In New Tab` }),
  ).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  // Click the back button to go back to the report
  await page.locator('[data-cy="report-execution-toolbar-back-button"]').click();
  
  // Setting variables {attempts} to 0 and {isSuccessful} to false
  let attempts = 0;
  
  // Setting a max attempts variable to 10
  let maxAttempts = 10;
  
  // initialize the successful check variable
  let isSuccessful = false;
  
  // Reload and search for the report up to 10 times while checking if the report count increased by 2
  while (attempts < maxAttempts && !isSuccessful) {
    await page.reload();
    await page.waitForSelector('[placeholder="Type to Search"]', {
      timeout: 60 * 1000,
    });
    await page.locator('[placeholder="Type to Search"]').fill(reportName);
    await page.keyboard.press("Enter");
  
    try {
      await page.waitForSelector('[data-cy="reports-list-report-run-times"]', {
        timeout: 60 * 1000,
      });
      const newRunTime = await page
        .locator('[data-cy="reports-list-report-run-times"]')
        .innerText();
      if (Number(newRunTime) === Number(runTimes) + 2) {
        console.log("Run times count increased by 2.");
        isSuccessful = true;
        break;
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
    // Wait for 30 seconds before the next attempt
    await page.waitForTimeout(30 * 1000);
    attempts++;
  }
  
  // Get the new report run times
  const newRunTime = await page
    .locator('[data-cy="reports-list-report-run-times"]')
    .innerText();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that the new run time is increased by 2
  expect(Number(newRunTime)).toBe(Number(Number(runTimes) + 2)); // Changed assertion from +1 to +2, b/c our test is making a report twice, thus the run times are +2, which is correct
  
});