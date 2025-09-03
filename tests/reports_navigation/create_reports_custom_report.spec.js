import { cleanUpReports, logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_reports_custom_report", async () => {
 // Step 1. Create Custom Report
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //!! log in as a supervisor
  const { page } = await logInSupervisor({ timezoneId: "America/Denver" });
  
  // Clean up reports
  const reportPrefix = "Create Report";
  await cleanUpReports(page, reportPrefix)
  
  //!! assert that the user is in the reports page
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  //!! hover over the REPORTS menu
  await page.hover('[data-cy="sidenav-menu-REPORTS"]');
  
  //!! wait for the reports list to load
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]',
    { timeout: 1 * 60 * 1000 }
  );
  
  //!! click the 'Create Report' button
  await page.locator('button :text-is("Create Report")').click();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! create a custom report
  
  //!! assert that the user is in the create custom report modal
  await expect(page).toHaveURL(/\/custom-report\/create/);
  await expect(page.locator('[data-cy="custom-report-header"]')).toHaveText(
    "Custom Reports"
  );
  
  //!! select ACCOUNT CODE for row selection
  await page.click(
    '[data-cy="custom-report-row-selection-radio-button-ACCOUNT_CODE"]'
  );
  
  //!! proceed to the next step
  await page.click('[data-cy="custom-report-row-selection-next-button"]');
  
  // Wait for Preview Configurations to load
  await expect(page.getByRole(`button`, { name: `Preview Configuration` })).toBeVisible();
  await page.getByRole(`button`, { name: `Preview Configuration` }).click();
  
  // Toggle on live reporting
  await page.getByRole(`checkbox`, { name: `Live Reporting` }).check();
  await page.getByRole(`button`, { name: `Apply` }).click();
  await expect(page.locator(`:text("Gathering Data")`)).toBeVisible({ timeout: 2 * 60 * 1000 });
  await expect(page.locator(`:text("Gathering Data")`)).not.toBeVisible({ timeout: 2 * 60 * 1000 });
  await expect(page.getByRole(`button`, { name: `ACCOUNT CODE` })).toBeVisible();
  
  //!! click the 'Predefined' tab
  await page.click(
    '[data-cy="custom-report-column-configuration-tab-group"] :text("Predefined")'
  );
  
  //!! open the dropdown for metrics selection
  await page
    .locator(
      `[data-cy="custom-report-column-configuration-tab-group"] mat-select`
    )
    .click();
  
  //!! select 'Park Duration' metric
  await page.click('.metric-list :text("Park Duration")');
  await page.click(`.metric-list button:has-text("Done")`);
  
  //!! generate a unique header name for the predefined column
  const pColumnHeader = "Park Duration " + faker.datatype.number();
  
  //!! fill the column header input with the newly generated header name
  await page.fill('[placeholder="Enter column header"] input', pColumnHeader);
  
  //!! select 'Total Park Duration' for operator
  await page.click('[data-cy="xima-select-container"]');
  await page.click(
    '[data-cy="xima-select-options"] :text("Total Park Duration")'
  );
  
  //!! add the new predefined column
  await page.click(
    '[data-cy="custom-report-column-configuration-container-add-column-button"]'
  );
  
  await expect(page.locator(`:text("Calculating Data")`)).toBeVisible({ timeout: 2 * 60 * 1000 });
  await expect(page.locator(`:text("Calculating Data")`)).not.toBeVisible({ timeout: 2 * 60 * 1000 });
  
  //!! click the 'Customizable' tab
  await page.click(
    '[data-cy="custom-report-column-configuration-tab-group"] :text-is("Customizable")'
  );
  
  //!! wait a second for the tab to load
  await page.waitForTimeout(1000);
  
  //!! open the dropdown for metrics selection
  await page.click(
    '[data-cy="custom-report-column-configuration-tab-group"] mat-select'
  );
  
  //!! select 'Outbound Call Count' metric
  await page.click('.metric-list :text("Outbound Call Count")');
  await page.click(`.metric-list button:has-text("Done")`);
  
  //!! generate a unique header name for the customizable column
  const cColumnHeader = "Outbound Call Count " + faker.datatype.number();
  
  //!! fill the column header input with the newly generated header name
  await page.fill('[data-cy="xima-auto-complete-input"]', cColumnHeader);
  
  //!! add the new customizable column
  await page.click(
    '[data-cy="custom-report-column-configuration-container-add-column-button"]'
  );
  
  //!! wait for the report to load
  await expect(page.locator("text=Preparing Report").or(page.locator("text=Gathering Data"))).toBeVisible({
    timeout: 30 * 10000,
  });
  await expect(page.locator("text=Preparing Report").and(page.locator("text=Gathering Data"))).not.toBeVisible({
    timeout: 30 * 10000,
  });
  
  //!! assert that the headers of the added columns are visible
  await expect(
    page.locator(`[role="button"]:has-text("${pColumnHeader}")`)
  ).toBeVisible();
  await expect(
    page.locator(`[role="button"]:has-text("${cColumnHeader}")`)
  ).toBeVisible();
  
  //!! proceed to the next step
  await page.click(
    '[data-cy="custom-report-column-configuration-container-next-button"]'
  );
  
  //!! open the suggested metrics selection dialog
  await page.click(
    '[data-cy="custom-report-summary-values-container-add-suggested-metric-container"]'
  );
  
  //!! select 'Row Count' from the suggested metrics
  await page.click(
    '[data-cy="suggested-summary-metrics-dialog-metric-option"] :text("Row Count")'
  );
  
  //!! apply the selected suggested metric
  await page.click('[data-cy="suggested-summary-metrics-dialog-apply-button"]');
  
  await expect(page.locator(`:text("Calculating Data")`)).toBeVisible();
  await expect(page.locator(`:text("Calculating Data")`)).not.toBeVisible();
  
  //!! open the custom metrics selection dialog
  await page.click(
    '[data-cy="custom-report-summary-values-container-add-custom-metric-container"]'
  );
  
  //!! open the dropdown for metrics selection
  await page.locator(`mat-select`).click();
  await page.click('.metric-list :text("Answered Call Count")');
  await page.click(`.metric-list button:has-text("Done")`);
  
  //!! select 'Answered Call Count' metric
  await page.click(':text("Apply")');
  
  //!! apply the selected custom metric
  // wait till page to load
  
  //!! wait for the report to load
  await expect(page.locator("text=Preparing Report").or(page.locator("text=Gathering Data"))).toBeVisible({
    timeout: 30 * 10000,
  });
  await expect(async () => {
    await expect(page.locator("text=Preparing Report").or(page.locator("text=Gathering Data"))).not.toBeVisible({
      timeout: 1000,
    });
  }).toPass({ timeout: 30 * 10000 });
  
  //!! proceed to the next step
  await page.click(
    '[data-cy="custom-report-summary-values-container-next-button"]'
  );
  
  //!! generate a unique report name
  const reportName = "Create Report " + new Date().toUTCString();
  
  //!! fill the report name input with the newly generated report name
  await page.fill('[data-cy="xima-auto-complete-input"]', reportName);
  
  //!! open the preview configuration dialog
  await page.click('[data-cy="custom-report-preview-configuration"]');
  
  //!! apply the preview configuration
  await page.click('[data-cy="preview-configuration-apply"]');
  
  //!! wait for the report to load
  await expect(page.locator("text=Preparing Report").or(page.locator("text=Gathering Data"))).toBeVisible({
    timeout: 30 * 10000,
  });
  await expect(page.locator("text=Preparing Report").or(page.locator("text=Gathering Data"))).not.toBeVisible({
    timeout: 30 * 10000,
  });
  
  //!! assert that all expected texts are visible
  await expect(page.locator("text=Row Count")).toBeVisible();
  await expect(page.locator("text=Answered Call Count")).toBeVisible();
  await expect(page.locator("text=" + pColumnHeader)).toBeVisible();
  await expect(page.locator("text=" + cColumnHeader)).toBeVisible();
  
  //!! save the custom report
  await page.click(
    '[data-cy="custom-reports-finalize-report-container-save-button"]'
  );
  
  //!! apply the saved configuration
  await page.click('[data-cy="configure-report-apply-button"]');
  
  //!! wait for the report to load
  await expect(page.locator("text=Preparing Report").or(page.locator("text=Gathering Data"))).toBeVisible({
    timeout: 30 * 10000,
  });
  
  await expect(page.locator("text=Preparing Report").or(page.locator("text=Gathering Data"))).not.toBeVisible({
    timeout: 30 * 10000,
  });
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! verify that the custom report has been created
  
  //!! assert that the report title is the same as the generated report name
  await expect(
    page.locator('[data-cy="report-execution-toolbar-report-title"]')
  ).toHaveText(reportName);
  
  console.log(reportName);
  
  //!! assert that all expected texts are visible
  await expect(page.locator("text=Row Count")).toBeVisible();
  await expect(page.locator("text=Answered Call Count")).toBeVisible();
  await expect(page.locator("text=" + pColumnHeader)).toBeVisible();
  await expect(page.locator("text=" + cColumnHeader)).toBeVisible();
  
  
 // Step 2. Delete Custom Report
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Navigate to "My Reports" page
  await page.goto(
    "https://dev-bwhit.chronicallcloud-staging.com/web/reports/all"
  );
  
  // Search for saved report name
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click kebab icon in result
  await page.click(
    `mat-row:has-text("${reportName}") [data-mat-icon-name="more-v1"]`
  );
  
  // Click "Delete" in menu
  await page.click(':text("Delete")');
  
  // Click "Confirm"
  await page.click('span:text-is("Confirm")');
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert that corresponding report is no longer visible
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  await expect(
    page.locator(
      `mat-row:has-text("${reportName}") [data-mat-icon-name="more-v1"]`
    )
  ).toBeHidden();
  
  await page.reload();
  
  await page.fill('[placeholder="Type to Search"]', reportName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  await expect(
    page.getByText(reportName)
  ).not.toBeVisible();
  
});