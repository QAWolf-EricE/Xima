import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_group_call_summary_uc_imported", async () => {
 // Step 1. Report Correctness: Group Call Summary (UC) (imported)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //! Log in as supervisor and prepare the "Group Call Summary (UC) (imported)" report
  //!! log in as a supervisor, destructuring the result to {page}
  const { page } = await logInSupervisor();
  
  //!! confirm that the current page text includes "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  //!! confirm again that the current page text includes "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  //!! wait for a report name cell to appear
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 },
  );
  
  //!! type "Group Call Summary (UC) (imported)" into the search box
  await page.fill(
    '[placeholder="Type to Search"]',
    "Group Call Summary (UC) (imported)",
  );
  
  //!! wait for 3 seconds before moving on to the next task
  await page.waitForTimeout(3000);
  
  //!! press 'Enter' on the body of the page
  await page.press("body", "Enter");
  
  //!! wait for another 3 seconds
  await page.waitForTimeout(3000);
  
  //!! verify that the report selected matches the search text
  await expect(page.locator('[data-cy="reports-list-report-name"]')).toHaveText(
    "Group Call Summary (UC) (imported)",
  );
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Retrieve the initial run times, configure, and run the selected report, then return to the reports list
  
  //!! store the initial number of run times
  const runTimes = await page.innerText(
    '[data-cy="reports-list-report-run-times"]',
  );
  
  //!! click on the report name to navigate to its details
  await page.click('[data-cy="reports-list-report-name"]');
  
  //!! wait for 5 seconds in preparation to configure the report
  await page.waitForTimeout(5000);
  
  //!! click the button to configure the report
  await page.click('[data-cy="report-execution-toolbar-configure-button"]');
  
  //!! wait for 5 seconds before proceeding
  await page.waitForTimeout(5000);
  
  //!! click the apply button to complete the report configuration
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //!! wait for the "Loading Report" message to appear, indicating the start of the report
  await expect(page.locator("text=Gathering Data")).toBeVisible();
  
  //!! wait for the "Loading Report" message to disappear, indicating the end of the report
  await expect(page.locator(`:text("Gathering Data")`)).not.toBeVisible({
    timeout: 3 * 60 * 1000,
  });
  
  //!! wait an additional 5 seconds before moving on to the next task
  await page.waitForTimeout(5000);
  
  //!! click the back button to return to the list of reports
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  //!! wait for 30 seconds before moving on to the next task
  await page.waitForTimeout(30 * 1000);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify that the number of run times has increased by 1, and store the page, initial run times, and new run times
  
  //!! store the new number of run times
  const newRunTime = await page.innerText(
    '[data-cy="reports-list-report-run-times"]',
  );
  
  //!! verify that the new number of run times is one more than the initial run times
  expect(Number(newRunTime)).toBe(Number(runTimes) + 1);
  
});