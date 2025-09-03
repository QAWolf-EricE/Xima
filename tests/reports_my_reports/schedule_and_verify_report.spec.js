import { logInSupervisor, scheduleVerifyReportCleanupCheck } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("schedule_and_verify_report", async () => {
 // Step 1. Schedule Report
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as supervisor
  const { browser, context, page } = await logInSupervisor({ slowmo: 500 });
  
  // Wait for 5 seconds
  await page.waitForTimeout(5000);
  
  // Expect the page to be at the "Reports" section
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Get email inbox for "xima+verifyschedules@qawolf.email"
  const { waitForMessage } = await getInbox({
    address: "xima+verifyschedules1@qawolf.email",
  });
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Schedule a new report
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  // Open the management menu
  await page.click('[data-cy="manage-menu-open-button"]');
  
  // Navigate to the schedule management section
  await page.click('[data-cy="manage-menu-manage-schedules"]');
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  await expect(page.locator(`xima-loading`)).not.toBeVisible();
  
  // Clean up and check if the schedule already exists
  await scheduleVerifyReportCleanupCheck(page);
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  // Click the "add a schedule" button
  await page.click('[data-cy="schedule-list-add-schedule-button"]');
  
  // Prepare the report details
  const report = {
    name: "Schedule and Verify Report",
    deliverTo: "xima+verifyschedules1@qawolf.email",
  };
  
  // Fill out the report name
  await page.fill('[data-cy="schedule-form-name-input"]', report.name);
  
  // Fill out the deliver to email for the report
  await page.fill('[data-cy="schedule-form-email-input"]', report.deliverTo);
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  // Open the calendar
  await page.click('[aria-label="Open calendar"]');
  await page.waitForTimeout(1000);
  
  // Select the current date
  try {
    await page.click('[aria-current="date"]');
  } catch {
    await page.locator('[aria-label="Previous month"]').click();
    await page.click('[aria-current="date"]');
  }
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  // Get the current time with {today}
  let today = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Denver",
    }),
  );
  
  // Format the current time as {time}
  today = dateFns.addMinutes(today, 2)
  let time = dateFns.format(today, "hh:mm:ss a")
  
  // Print the current time
  console.log(time);
  
  // Wait for 1 second
  await page.waitForTimeout(1000);
  
  // Click on the delivery time input field
  await page.click('[data-cy="schedule-form-delivery-time-input"]'); // can't get Delivery Time selectors
  
  // Wait for 1 second
  await page.waitForTimeout(3000);
  
  // Type the adjusted time
  await page.keyboard.type(time.replaceAll(":", ""));
  
  // Wait for 3 seconds
  await page.waitForTimeout(3000);
  
  // Click the "next" button
  await page.click('[data-cy="schedule-form-next-button"]');
  await page.waitForTimeout(3000);
  
  // Expect the "Schedule Report" section to be visible
  await expect(page.locator(':text("Schedule Report")')).toBeVisible();
  await page.waitForTimeout(5000);
  
  // Try to input "Testing 1" on the search and click on the "Testing 1" report
  try {
    await page.type('[placeholder="Type to Search"]', "Testing 1");
    await page.waitForTimeout(3000);
    await page.click(
      '[data-cy="reports-list-report-name"]:has-text("Testing 1")',
    );
  } catch (err) {
    console.log(err);
  }
  
  // Expect the selected report to have the name "Testing 1"
  await expect(
    page.locator('[data-cy="schedule-reports-selection-selected-report-name"]'),
  ).toHaveText("Testing 1");
  
  // Click the "next" button
  await page.click('[data-cy="schedule-reports-selection-next-button"]');
  await page.waitForTimeout(3000);
  
  // Expect the "Configuration" header to be visible
  await expect(
    page.locator('[data-cy="configure-report-header"] :text("Configuration")'),
  ).toBeVisible();
  
  // Wait for 1 second
  await page.waitForTimeout(3000);
  
  // Get the current time with {after}
  const after = new Date();
  
  // Select rows
  await page.click('[data-mat-icon-name="edit"]');
  await page.waitForTimeout(3000);
  
  // Select "All" if not checked
  if (!(await page.locator("mat-checkbox.all input").isChecked())) {
    await page.check("mat-checkbox.all input");
  }
  
  // Click "Save"
  await page.click('span:text-is("Apply")');
  await page.waitForTimeout(3000);
  
  // Click the "finish" button on the schedule report configuration
  await page
    .locator('[data-cy="schedule-reports-configuration-finish-button"]')
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Verify the report has been scheduled
  
  // Expect the first report in the schedule list to have the title "Schedule and Verify Report"
  await expect(page.locator("app-schedule-list").first()).toContainText(
    "Schedule and Verify Report",
  );
  
 // Step 2. Report is Delivered
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Wait for a message and log its subject and text
  
  // Await a message for 3 minutes and destructure the result to {text}, {subject}
  const { text, subject } = await waitForMessage({ after });
  
  // Log the {subject} of the message
  console.log(subject);
  
  // Log the {text} of the message
  console.log(text);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Check for email content, delete schedule and ensure it's no longer visible
  
  // Expect {subject} to match "Schedule and Verify Report"
  expect(subject).toMatch(`Schedule and Verify Report`);
  
  // Expect {text} to match "Testing 1:"
  expect(text).toMatch(`Testing 1:`);
  
  // Click the remove schedule button
  try { 
    await page.locator('.schedule-list-item:has-text("Schedule and Verify Report") >> nth=0 >> [data-cy="reports-list-report-more-menu-button"]').click({ timeout: 7000 });
    await page.locator('[data-cy="schedule-list-remove-schedule-button"]').click();
    await page.waitForTimeout(3000);
    await page.click('[data-cy="confirmation-dialog-okay-button"]', {
      force: true,
      delay: 500,
    });
  } catch {
    await page.click(
      '.schedule-list-item:has-text("Schedule and Verify Report") >> nth=0 >> [data-cy="schedule-list-remove-schedule-button"], [data-cy="schedule-list-remove-schedule-button"]',
      {
        force: true,
        delay: 500,
      }
    );
    await page.waitForTimeout(3000);
    await page.click('[data-cy="confirmation-dialog-okay-button"]', {
      force: true,
      delay: 500,
    });
  }
  
  // Expect the schedule, labeled "Schedule and Verify Report", to not be visible
  await expect(
    page.locator('[data-cy="schedule-list-schedule-title"]:text("Schedule and Verify Report")')
  ).not.toBeVisible();
});