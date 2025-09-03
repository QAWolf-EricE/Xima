import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_local_number_inbound_summary", async () => {
 // Step 1. Report Correctness: Local Number Inbound Summary
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //!! log in as a supervisor and destructure the page object to {page}
  const { page } = await logInSupervisor();
  
  //!! assert that the "Reports" tab is visible on the page
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  //!! wait for the reports list to load on the page
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! navigate to "Local Number Inbound Summary" report and configure it
  
  //!! name a const variable {reportName} as "Local Number Inbound Summary"
  const reportName = "Local Number Inbound Summary";
  
  //!! fill the search bar with {reportName}
  await page.fill('[placeholder="Type to Search"]', reportName);
  
  //!! press Enter to submit the search
  await page.keyboard.press("Enter");
  
  //!! wait for 1.5 seconds
  await page.waitForTimeout(1500);
  
  //!! store the initial run times of the {reportName} into a variable called {runtime}
  const runtime = await page
    .locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`,
    )
    .innerText();
  
  //!! click on the {reportName} from the list
  await page.click(`[data-cy="reports-list-report-name"]:text("${reportName}")`);
  
  //!! wait for 5 seconds before starting the configuration
  await page.waitForTimeout(5000);
  
  //!! click the configuration button
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! click the apply button to submit configurations
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //!! assert that the "Loading Report" message is visible
  await expect(page.locator(':text("Gathering Data")')).toBeVisible();
  
  //!! assert that the "Loading Report" message disappears before 60 seconds
  await expect(page.locator(':text("Gathering Data")')).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  //!! click the back button to go back to the previous page
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! verify the reported runtime increased by 1 after configuration
  
  //!! assert the updated runtime of {reportName} should be 1 more than the initial {runtime}
  await expect(
    page.locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`,
    ),
  ).toHaveText(`${parseInt(runtime) + 1}`, { timeout: 1 * 60 * 1000 });
});