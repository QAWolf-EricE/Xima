import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_inbound_calls_by_local_number_uc_imported", async () => {
 // Step 1. Report Correctness: Inbound Calls by Local Number (UC) (imported)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //!! log in as Supervisor and store the resulting page
  const { page } = await logInSupervisor();
  
  //!! wait till the reports list cell appears
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 }
  );
  
  //!! define the report name as "Inbound Calls by Local Number (UC) (imported)"
  let reportName = "Inbound Calls by Local Number (UC) (imported)";
  
  //!! enter the report name into the search bar and press "Enter" key
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  
  //!! wait for a short duration for the page to load
  await page.waitForTimeout(1500);
  
  //!! retrieve the runtime of the report and save it as {runtime}
  //store runtime
  const runtime = await page
    .locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`
    )
    .innerText();
  
  //!! click the report to open it
  await page.click(`[data-cy="reports-list-report-name"]:text("${reportName}")`);
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! configure the report and go back to previous page
  
  //!! wait for a short duration for the report to load
  await page.waitForTimeout(1000);
  
  //!! click the 'configure-button'
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  
  //!! commit the changes by clicking the 'apply-button'
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //!! wait until the report loads, or for a maximum of two minutes
  // wait for page to load
  await expect(page.locator(':text("Loading Report...")')).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  //!! click the 'back-button' to go back to the previous page
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! reload the page and look for the report by name
  
  //!! wait for a short duration to ensure the report page loads properly
  await page.waitForTimeout(30000);
  
  //!! reload the page
  await page.reload();
  
  //!! enter the report name into the search bar and press "Enter" key
  reportName = "Inbound Calls by Local Number (UC) (imported)";
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  
  //! ----
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! report run time is incrementing by one on every configuration
  
  //!! assert that the runtime of the report increases by 1
  // REQ149 Report run time adds one every configuration
  await expect(
    page.locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`
    )
  ).toHaveText(`${parseInt(runtime) + 1}`, { timeout: 1 * 60 * 1000 });
  
});