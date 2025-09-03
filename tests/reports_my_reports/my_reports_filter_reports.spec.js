import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_filter_reports", async () => {
 // Step 1. Filter reports by tags
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! call logInSupervisor and get {page}
  const { page } = await logInSupervisor();
  
  //!! expect the home title to be "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  //!! expect the text "Abandoned Calls{Final Skill}" to be visible
  await expect(page.locator("text=Abandoned Calls{Final Skill}")).toBeVisible();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Filter reports by tags, verify visibility, select certain reports, and type to search
  
  //!! click the filter tags button
  await page.click('[data-cy="filter-tags"]');
  
  //!! click the "app-tags-translation" element
  await page.click("app-tags-translation");
  
  //!! expect the text "Abandoned Calls{Final Skill}" to be hidden
  await expect(page.locator("text=Abandoned Calls{Final Skill}")).toBeHidden();
  
  //!! click the "app-tags-translation" element again
  await page.click("app-tags-translation");
  
  //!! expect the text "Abandoned Calls{Final Skill}" to be visible
  await expect(page.locator("text=Abandoned Calls{Final Skill}")).toBeVisible();
  
  //!! click at (0, 0) on the mouse
  await page.mouse.click(0, 0);
  
  //!! click the #mat-select-2 #mat-select-value-3 element
  await page.click("#mat-select-2 #mat-select-value-3");
  
  //!! click the 'mat-option' that has text "All Reports"
  await page.click('mat-option:has-text("All Reports")');
  
  //!! type "Group Inbound Test" into the "Type to Search" input box
  await page.type(
    '[placeholder="Type to Search"]#mat-input-0',
    "Group Inbound Test"
  );
  
  //!! expect the text "Group Inbound Test" to be visible
  await expect(page.locator('text="Group Inbound Test"')).toBeVisible();
  
  //!! expect the text "Group Inbound Test - with extra" to be visible
  await expect(
    page.locator("text=Group Inbound Test - with extra")
  ).toBeVisible();
  
  // clear search
  await page.locator('[placeholder="Type to Search"]').fill("");
  
  //!! click the ".report-links" element
  await page.click(".report-links"); // all reports dropdown
  
  //!! click the text "My Reports"
  await page.click(':text("My Reports")');
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! verify the filtering by "My reports" is successful
  
  //!! expect none of the run times to be 0
  const numOfResultsMyResults = await page.locator(`[data-cy="reports-list-report-run-times"]`).count();
  
  for (let i = 0; i < numOfResultsMyResults; i++) {
    const runTimeSelector = `[data-cy="reports-list-report-run-times"] >> nth=${i}`;
    const runTime = await page.innerText(runTimeSelector);
    
    // Ensure that the runTime is retrieved successfully and is not "0"
    expect(runTime).toBeTruthy();
    expect(runTime).not.toEqual("0");
  }
  
  //!! click the 'mat-select' that has text "My Reports"
  await page.click('mat-select:has-text("My Reports")');
  
  //!! click the 'mat-option' that has text "Custom Reports"
  await page.click('mat-option:has-text("Custom Reports")');
  
  //!! expect all the types to by custom
  const numOfResultsCustom = await page
    .locator(`[data-cy="reports-list-report-type"]`)
    .count();
  
  for (let i = 0; i < numOfResultsCustom; i++) {
    const typeSelector = `[data-cy="reports-list-report-type"] >> nth=${i}`;
    const type = await page.innerText(typeSelector);
    
    expect(type).toEqual("Custom");
  }
 // Step 2. Filter reports by my reports
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 3. Filter reports by custom reports
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
});