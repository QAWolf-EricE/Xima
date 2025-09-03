import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_inbound_calls_by_local_number", async () => {
 // Step 1. Report Correctness: Inbound Calls by Local Number
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as a supervisor and store the page
  const { page } = await logInSupervisor();
  
  //!! check the presence of the text "Reports" in the page element containing the translation set 'HOME_TITLE'
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  //!! wait for the presence of the 'reports-list-report-name' cell on the page
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! navigate to the 'Inbound Calls by Local Number' report and configure it
  
  //!! assign the string 'Inbound Calls by Local Number' to the variable reportName
  const reportName = "Inbound Calls by Local Number";
  
  //!! enter the report name into the search bar
  await page.fill('[placeholder="Type to Search"]', reportName);
  
  //!! submit the search bar by pressing "Enter" on the keyboard
  await page.keyboard.press("Enter");
  
  //!! wait for a short duration
  await page.waitForTimeout(1500);
  
  //!! retrieve the runtime of the report and save it as variable runtime
  const runtime = await page
    .locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`,
    )
    .innerText();
  
  //!! click on the report name
  await page.click(`[data-cy="reports-list-report-name"]:text("${reportName}")`);
  
  //!! wait a second
  await page.waitForTimeout(1000);
  
  //!! click the configuration button
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  
  //!! click the apply button in the configuration view
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! ensure the report page loads correctly, then navigate back to the reports list
  
  //!! check the presence of the text "Loading Report..." indicating that the report is loading
  await expect(page.locator(':text("Gathering Data")')).toBeVisible();
  
  //!! check that the text "Loading Report..." is no longer visible indicating that the report has loaded
  await expect(page.locator(`:text("Gathering Data")`)).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  //!! navigate back to the reports list by clicking the back button
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! check that the runtime has incremented by one
  
  //!! expect the report's runtime to have increased by 1
  await expect(
    page.locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`,
    ),
  ).toHaveText(`${parseInt(runtime) + 1}`, { timeout: 1 * 60 * 1000 });
  
});