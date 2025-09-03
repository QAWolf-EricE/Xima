import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_agent_call_summary", async () => {
 // Step 1. View Agent Call Summary report
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //!! log in as a Supervisor and store the context and page
  const { context, page } = await logInSupervisor();
  
  //!! expect the URL to contain '/reports/'
  await expect(page).toHaveURL(/reports/);
  await expect(
  
  //!! expect the Reports title to be visible
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Open and run the Agent Call Summary report
  
  //!! Wait for the report's run times text to become available
  await page
    .locator(
      'mat-row:has-text("Agent Call Summary") >> nth=0 >> [data-cy="reports-list-report-run-times"]'
    )
    .waitFor();
  
  //!! Wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! get the inner text of the report's run times
  const runtimes = await page
    .locator(
      'mat-row:has-text("Agent Call Summary") >> nth=0 >> [data-cy="reports-list-report-run-times"]'
    )
    .innerText();
  
  //!! click the report's name to open it
  await page.click(
    'mat-row:has-text("Agent Call Summary") >> nth=0 >> [data-cy="reports-list-report-name"]'
  );
  
  //!! Wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! click the 'Configure' button
  await expect(page.locator('button:has-text("Configure")')).toBeEnabled();
  await page.click('button:has-text("Configure")');
  
  //!! click the 'Apply' button
  await page.click('button:has-text("Apply")');
  
  //!! Wait for a second
  await page.waitForTimeout(1000);
  
  //!! Expect the loading report message to be hidden within 2 minutes
  await expect(page.locator(`:text("Gathering Data")`)).toBeVisible({timeout: 2 * 60 * 1000});
  
  await page.waitForTimeout(30000);
  await page.reload(); 
  await page.waitForTimeout(30000);
  
  //!! wait for the ".summary-item-header" to be available
  await page.waitForSelector(".summary-item-header");
  
  //!! navigate back
  await page.click('mat-icon:has-text("keyboard_arrow_left")');
  
  //!! wait for 30 seconds
  await page.waitForTimeout(30000);
  
  //!! expect the new run times count to be one more than the previous
  await expect(
    page.locator(
      'mat-row:has-text("Agent Call Summary") >> nth=0 >> [data-cy="reports-list-report-run-times"]'
    )
  ).toHaveText(`${parseInt(runtimes) + 1}`);
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Open the Agent Call Summary report again
  
  //!! click on the name of the Agent Call Summary report to open it
  await page.click(
    'mat-row:has-text("Agent Call Summary") >> nth=0 >> [data-cy="reports-list-report-name"]'
  );
  
  //! ----
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Visible panels and values of the Agent Call Summary report
  
  //!! Assert that "Total Calls" panel is visible
  await expect(
    page.locator('.summary-item-header:has-text("Total Calls")')
  ).toBeVisible();
  await expect(
  
  //!! Assert that "Total Calls" panel value is present
    page.locator('.summary-item:has-text("Total Calls") .summary-item-value')
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Total Call Duration")')
  
  //!! Assert that "Total Call Duration" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Total Call Duration") .summary-item-value'
  
  //!! Assert that "Total Call Duration" panel value is present
    )
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Total Queue Offer Duration")')
  
  //!! Assert that "Total Queue Offer Duration" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Total Queue Offer Duration") .summary-item-value'
  
  //!! Assert that "Total Queue Offer Duration" panel value is present
    )
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Avg Queue Offer Duration")')
  
  //!! Assert that "Avg Queue Offer Duration" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Avg Queue Offer Duration") .summary-item-value'
  
  //!! Assert that "Avg Queue Offer Duration" panel value is present
    )
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Total Talking Duration")')
  
  //!! Assert that "Total Talking Duration" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Total Talking Duration") .summary-item-value'
  
  //!! Assert that "Total Talking Duration" panel value is present
    )
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Avg Talking Duration")')
  
  //!! Assert that "Avg Talking Duration" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Avg Talking Duration") .summary-item-value'
  
  //!! Assert that "Avg Talking Duration" panel value is present
    )
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Total Answered Calls")')
  
  //!! Assert that "Total Answered Calls" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Total Answered Calls") .summary-item-value'
  
  //!! Assert that "Total Answered Calls" panel value is present
    )
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Avg Answered Call Percentage")')
  
  //!! Assert that "Avg Answered Call Percentage" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Avg Answered Call Percentage") .summary-item-value'
  
  //!! Assert that "Avg Answered Call Percentage" panel value is present
    )
  ).not.toBeEmpty();
  await expect(
    page.locator('.summary-item-header:has-text("Max Talking Duration")')
  
  //!! Assert that "Max Talking Duration" panel is visible
  ).toBeVisible();
  await expect(
    page.locator(
      '.summary-item:has-text("Max Talking Duration") .summary-item-value'
  
  //!! Assert that "Max Talking Duration" panel value is present
    )
  ).not.toBeEmpty();
  
  //!! Assert that "mat-table" is visible
  await expect(page.locator("mat-table")).toBeVisible();
  
  //!! Assert that there is more than 0 row in the table
  expect(await page.locator("mat-row").count()).toBeGreaterThan(0);
});