import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_skill_callback_summary", async () => {
 // Step 1. Report Correctness: Skill Callback Summary
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as supervisor and store the page
  const { page } = await logInSupervisor();
  
  //!! verify that the page navigated to is "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  //!! wait for the reports list to load
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]', { timeout: 1 * 60 * 1000 }
  );
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! navigate to "Skill Callback Summary" report and start configuring
  
  //!! set {reportName} as "Skill Callback Summary"
  const reportName = "Skill Callback Summary";
  
  //!! fill the search field with {reportName}
  await page.fill('[placeholder="Type to Search"]', reportName);
  
  //!! press Enter to start the search
  await page.keyboard.press("Enter");
  
  //!! wait for a short duration to ensure the search processes
  await page.waitForTimeout(1500);
  
  //!! store the number of run times of the report
  const runtime = await page
    .locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`
    )
    .innerText();
  
  //!! click the report with the name matching {reportName}
  await page.click(`[data-cy="reports-list-report-name"]:text("${reportName}")`);
  
  //!! wait for a short duration to ensure the page loads properly
  await page.waitForTimeout(3000);
  
  //!! click the configure button
  await page.click('[data-cy="report-execution-toolbar-configure-button"]', {timeout: 3000});
  
  //!! click the 'Apply' button
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //!! wait for the report to load
  await expect(page.locator(':text("Gathering Data")')).toBeVisible();
  await expect(page.locator(':text("Gathering Data")')).not.toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  //!! go back to the previous page
  await page.click('[data-cy="report-execution-toolbar-back-button"]');
  
  //! ----
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! verify that the report run times increased by 1
  
  //!! check if the number of run times of the report has increased by 1
  await expect(
    page.locator(
      `mat-row:has-text("${reportName}") >> nth=0 >> [data-cy="reports-list-report-run-times"]`
    )
  ).toHaveText(`${parseInt(runtime) + 1}`, { timeout: 1 * 60 * 1000 });
  
});