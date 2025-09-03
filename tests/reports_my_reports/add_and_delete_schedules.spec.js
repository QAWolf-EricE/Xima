import { cleanupCheck, logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("add_and_delete_schedules", async () => {
 // Step 1. Add Schedule
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const report = {
    name: "Testing Add Report",
    deliverTo: "xima+manage-schedules@qawolf.email",
  };
  
  // Call logInSupervisor, destructuring the result to {page} (REQ01 Login as Supervisor)
  const { page } = await logInSupervisor({ slomo: 1000 });
  
  // Expect the "Reports" element to be visible
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Click more options button, vertical ellipsis (3 dots)
  await page.locator('[data-cy="manage-menu-open-button"]').click();
  
  // Click to manage the schedule
  await page.locator('[data-cy="manage-menu-manage-schedules"]').click();
  
  // Wait for page to load
  await expect(
    page.locator(`app-schedule-list .body .schedule-list-item`).first(),
  ).toBeVisible();
  
  // Clean up existing schedules
  await cleanupCheck(page);
  //--------------------------------
  // Act:
  //--------------------------------
  // Click "Add Schedule" button
  await page.locator('[data-cy="schedule-list-add-schedule-button"]').click();
  
  // Fill out the name field with the {report}'s name
  await page.locator('[data-cy="schedule-form-name-input"]').fill(report.name);
  
  // Fill out the email field with the {report}'s delivery address
  await page
    .locator('[data-cy="schedule-form-email-input"]')
    .fill(report.deliverTo);
  
  // Click to open the report format dropdown
  await page.locator(`[data-cy="schedule-form-report-format-dropdown"]`).click();
  
  // Select HTML format for the report
  await page.locator('[data-cy="schedule-form-report-format-HTML"]').click();
  
  // Click to open the schedule period dropdown
  await page
    .locator(`[data-cy="schedule-form-schedule-period-dropdown"]`)
    .click();
  
  // Select "weekly" for the schedule period
  await page.locator('[data-cy="schedule-form-schedule-period-weekly"]').click();
  
  // Fill the "every" field with "2"
  await page.locator('[formcontrolname="every"]').fill("2");
  
  // Click the "next" button
  await page.locator('[data-cy="schedule-form-next-button"]').click();
  
  // Verify that the 'Schedule Report' text is visible (added a report to schedule)
  await expect(page.locator(':text("Schedule Report")')).toBeVisible();
  
  // Try to search for "Testing 1" and select if available
  try {
    await page.type('[placeholder="Type to Search"]', "Testing 1");
    await page
      .locator('[data-cy="reports-list-report-name"]:has-text("Testing 1")')
      .click();
  } catch (err) {
    console.log(err);
  }
  
  // Expect "Testing 1" to be the selected report name
  await expect(
    page.locator('[data-cy="schedule-reports-selection-selected-report-name"]'),
  ).toHaveText("Testing 1");
  
  // Click the "next" button
  await page
    .locator('[data-cy="schedule-reports-selection-next-button"]')
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the text "Configuration" to be visible (asserts report was added)
  await expect(
    page.locator('[data-cy="configure-report-header"] :text("Configuration")'),
  ).toBeVisible();
  
  // Click edit button for Rows (Account Code)
  await expect(
    page.locator(`[data-cy="xima-preview-input-edit-button"]`),
  ).toBeVisible();
  await page
    .locator(`[data-cy="xima-preview-input-edit-button"]`)
    .click({ timeout: 5000 });
  await expect(
    page.locator(
      `app-configure-report-parameter:has-text("Rows (Account Code)")`,
    ),
  ).toBeVisible();
  await page.locator(`input[type="checkbox"] >> nth=0`).click();
  await page
    .locator(`app-configure-report-parameter button:has-text("Apply")`)
    .click();
  
  // Wait for modal to disappear
  await expect(
    page.locator(`app-configure-report-parameter button:has-text("Apply")`),
  ).not.toBeVisible();
  
  // Click the "finish" button
  await page
    .locator('[data-cy="schedule-reports-configuration-finish-button"]')
    .click();
  
  // Assert the first schedule to have the name "Testing Add Report" (assert creation)
  await expect(page.locator("app-schedule-list")).toContainText(
    "Testing Add Report",
  );
  
 // Step 2. Delete Schedule
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the kebab next to the schedule
  await page
    .locator(
      `.schedule-list-item:has-text("Testing Add Report") >> nth=0 >> [data-cy="reports-list-report-more-menu-button"]`,
    )
    .click({ timeout: 7000 });
  
  // Click teh Delete Schedule button
  await page.locator('[data-cy="schedule-list-remove-schedule-button"]').click();
  
  // Wait for confirmation modal
  await expect(
    page.locator(`xima-dialog:has-text("Delete Schedule")`),
  ).toBeVisible();
  
  // Click Confirm button
  await page
    .locator(`xima-dialog:has-text("Delete Schedule") button:has-text("Confirm")`)
    .click();
  await expect(
    page.locator(`xima-dialog:has-text("Delete Schedule")`),
  ).not.toBeVisible();
  
  // Wait for page to load
  await expect(
    page.locator('[data-cy="schedule-list-schedule-title"] >> nth=0'),
  ).toBeVisible();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the schedule is no longer visible
  await expect(
    page.locator(
      '[data-cy="schedule-list-schedule-title"]:text("Testing Add Report")',
    ),
  ).not.toBeVisible();
  
});