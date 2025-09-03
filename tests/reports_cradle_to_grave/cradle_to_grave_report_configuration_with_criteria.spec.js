import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("cradle_to_grave_report_configuration_with_criteria", async () => {
 // Step 1. Cradle to grave: edit columns
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Log in as a supervisor
  const { page } = await logInSupervisor();
  
  // Validate that the logged-in user has been redirected to the "Reports" page
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to "Cradle to Grave" reports
  await page.locator(`.mat-toolbar :text-is("Cradle to Grave")`).click();
  
  // Check the visibility of the "Cradle to Grave" configuration title
  await expect(
    page.locator('[data-cy="configure-cradle-to-grave-title"]'),
  ).toBeVisible();
  
  // Click on the "Open calendar" button for the date range field
  await page
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  
  // Go to the previous month
  await page.locator('[aria-label="Previous month"]').click();
  
  // Go to another previous month
  await page.locator('[aria-label="Previous month"]').click();
  
  // Select the 1st day of the month
  await page.locator('.mat-calendar-body-cell :text-is("1")').click();
  
  // Go to the next month
  await page.locator('[aria-label="Next month"]').click();
  
  // Select the 1st day of that month
  await page.locator('.mat-calendar-body-cell :text-is("1")').click();
  
  // Click the "add" button to configure the report criteria
  await page.locator('[data-cy="xima-header-add-button"]').click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Configure Criteria of the Cradle to Grave Reports
  // Check for the visibility of "Select Criteria"
  await expect(page.locator(':text-is("Select Criteria")')).toBeVisible();
  
  // Click the search input box
  await page.locator('[data-cy="xima-criteria-selector-search-input"]').click();
  
  // Locate the first option in the criteria
  const firstOption = page.locator("mat-option >> nth=0");
  
  // Get the inner text of the first option
  const firstOptionText = await firstOption.innerText();
  
  // Select the first option
  await firstOption.click();
  
  // Click on the "Edit" button to select all options in the criteria
  await page.locator('.criteria [data-mat-icon-name="edit"]').click();
  
  // Click on the "select all" checkbox to select all the options
  await page.locator('.all [type="checkbox"]').click();
  
  // Click on the "apply" button to apply selected criteria
  await page.locator(".apply").click();
  
  // Click on the "Apply" button to apply all changes
  await page.locator('button:has-text("Apply")').click();
  
  // Wait for data to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Report correctly configured and Columns edited as required
  
  // Define the list of starting columns
  const startingColumns = [
    "Call Info",
    "Duration",
    "Calling Party",
    "Receiving Party",
    "Caller Name",
    "Location",
    "Group",
  ];
  
  // Loop through the starting columns and validate if they are visible on the page
  for (let i = 0; i < startingColumns.length; i++) {
    const column = startingColumns[i];
    await expect(
      page.locator(`mat-header-cell:has-text("${column}")`),
    ).toBeVisible();
  }
  
  // Click on the "Edit columns" button of cradle to grave reports
  await page
    .locator('[data-cy="cradle-to-grave-toolbar-edit-columns-button"]')
    .click();
  
  // Click on the checkbox to toggle the "Duration" column
  await page
    .locator(
      '[data-cy="arrange-columns-layout-column-type-DURATION"] [for="cy-data_DURATION-input"]',
    )
    .click();
  
  // Click on the checkbox to toggle the "Calling party" column
  await page
    .locator(
      '[data-cy="arrange-columns-layout-column-type-CALLING_PARTY"] [for="cy-data_CALLING_PARTY-input"]',
    )
    .click();
  
  // Click on the "Apply" button to save the changes
  await page.locator('button:has-text("Apply")').click();
  
  // Wait for data to load
  await expect(
    page.locator(`mat-header-cell:has-text("Call Info")`),
  ).toBeVisible();
  await page.waitForTimeout(2000);
  
  // Validate that the "Duration" column is no longer visible
  await expect(
    page.locator(`mat-header-cell:has-text("Duration")`),
  ).not.toBeVisible();
  
  // Validate that the "Calling Party" column is no longer visible
  await expect(
    page.locator(`mat-header-cell:has-text("Calling party")`),
  ).not.toBeVisible();
  
 // Step 2. Cradle to grave: edit results per page
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Click on the "Edit Columns" button to revert changes
  await page
    .locator('[data-cy="cradle-to-grave-toolbar-edit-columns-button"]')
    .click();
  
  // Click on the checkbox to toggle the "Duration" column
  await page
    .locator(
      '[data-cy="arrange-columns-layout-column-type-DURATION"] [for="cy-data_DURATION-input"]',
    )
    .click();
  
  // Click on the checkbox to toggle the "Calling party" column
  await page
    .locator(
      '[data-cy="arrange-columns-layout-column-type-CALLING_PARTY"] [for="cy-data_CALLING_PARTY-input"]',
    )
    .click();
  
  // Click on the "Apply" button to save the changes
  await page.locator('button:has-text("Apply")').click();
  
  // Wait for data to load
  await expect(
    page.locator(`mat-header-cell:has-text("Duration")`),
  ).toBeVisible();
  await expect(
    page.locator(`mat-header-cell:has-text("Calling party")`),
  ).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Check report pagination controls and filters
  
  // Validate that page displays results of 100
  await expect(
    page.locator('[class*="paginator"] :text-is("100"):right-of(:text("Next"))'),
  ).toBeVisible();
  
  // Check the total count of rows is 200
  await expect(page.locator("mat-row")).toHaveCount(200); // inner row as well
  
  // Click on page results dropdown
  await page.locator(`xima-paginator button`).click();
  
  // Change page size to show 25 results per page
  await page.locator('[class*="menu-content"] :text-is("25")').click();
  
  // Wait for data to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible();
  
  // Validate that 25 results are shown on the current page
  await expect(
    page.locator(':text-is("25"):right-of(:text("Next"))'),
  ).toBeVisible();
  
  // Check the total count of rows is 50
  await expect(page.locator("mat-row")).toHaveCount(50); // inner row as well
  
  // Click on page drop-down results
  try {
    await page.locator(`xima-paginator button`).click({timeout: 5000});
  } catch {
    await page.locator(`app-home-title-translation`).hover();
    await page.locator(`xima-paginator button`).click();
  }
  
  // Change page size to show 10 results per page
  await page.locator('[class*="menu-content"] :text-is("10")').click();
  
  // Wait for data to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible();
  
  // Validate that 10 results are shown on the current page
  await expect(
    page.locator(':text-is("10"):right-of(:text("Next"))'),
  ).toBeVisible();
  
  // Assert the total count of rows is 20
  await expect(page.locator("mat-row")).toHaveCount(20); // inner row as well
  
  // Click on page drop-down results
  await page.locator(`xima-paginator button`).click();
  
  // Change page size to show 5 results per page
  await page.locator('[class*="menu-content"] :text-is("5")').click();
  
  // Wait for data to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Validate that 5 results are shown on the current page
  await expect(
    page.locator(':text-is("5"):right-of(:text("Next"))'),
  ).toBeVisible();
  
  // Assert the total count of rows is 10
  await expect(page.locator("mat-row")).toHaveCount(10); // inner row as well
  
 // Step 3. Cradle to grave: reconfigure report (Filters button)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click on the filtering button on "Cradle to Grave" Reports
  await page.locator('[data-cy="cradle-to-grave-toolbar-filter-button"]').click();
  
  // Open the calendar for date range
  await page
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  
  // Navigate to the previous month three times
  await page.locator(`[aria-label="Previous month"]`).click({
    clickCount: 3,
    delay: 500,
  });
  
  // Select the 1st day of the month
  await page.locator('mat-calendar :text-is("1")').click();
  
  // Navigate to the next month
  await page.locator('[aria-label="Next month"]').click();
  
  // Select the 1st day of that month
  await page.locator('mat-calendar :text-is("1")').click();
  
  // Click on the "Apply" button to apply these changes
  await page.locator('button:has-text("Apply")').click();
  
  // Wait for data to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Check if the count of rows is 10, validating the report was updated
  await expect(page.locator("mat-row")).toHaveCount(10);
  
});