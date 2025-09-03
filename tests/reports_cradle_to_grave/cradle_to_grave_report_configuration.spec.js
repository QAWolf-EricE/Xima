import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("cradle_to_grave_report_configuration", async () => {
 // Step 1. Cradle to grave: filter by date range
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  let today = new Date();
  const firstDayOfThisMonth = dateFns.startOfMonth(today);
  const thisMonth = dateFns.format(firstDayOfThisMonth, "yMMdd");
  const lastMonth = dateFns.subMonths(firstDayOfThisMonth, 4);
  const startDate = dateFns.format(lastMonth, "yMMdd") * 1;
  const endDate = dateFns.format(today, "yMMdd") * 1;
  
  // Format report date
  const formatReportDate = async (isStart = false) => {
    await page.locator('[data-cy="cradle-to-grave-table-cell-END_DATE"]').first().waitFor();
    const report = isStart
      ? await page.innerText('[data-cy="cradle-to-grave-table-cell-START_DATE"]')
      : await page.innerText('[data-cy="cradle-to-grave-table-cell-END_DATE"]');
  
    const reportArr = report.split("\n")[0].split("/");
    const reportYear = reportArr[2];
    reportArr[2] = reportArr[1];
    reportArr[1] = reportArr[0];
    reportArr[0] = reportYear;
    return reportArr.join("") * 1;
  };
  
  // Login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to Cradle to Grave
  await page.click('[data-cy="reports-c2g-component-tab-ctog"]');
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Set date range
  await page.click('[aria-label="Open calendar"]');
  await page.click('[aria-label="Previous month"]');
  await page.waitForTimeout(1000);
  await page.click('[role="row"] [type="button"]');
  await page.waitForTimeout(1000);
  await page.click('[aria-label="Next month"]');
  await page.click('[aria-current="date"]');
  await page.waitForTimeout(1500);
  
  // Click apply
  await page.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  );
  
  // Wait for results to load
  await page.locator('[data-cy="cradle-to-grave-table-cell-START_DATE"]').first().waitFor();
  
  // Sort reports by oldest start date first - asc
  await page.click('[data-cy="cradle-to-grave-table-header-cell-START_DATE"]');
  
  // Wait for results to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible({
    timeout: 45 * 1000,
  });
  await page.locator('[data-cy="cradle-to-grave-table-cell-START_DATE"]').first().waitFor();
  await page.waitForTimeout(2000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert reports are within the range
  // Context - only one of the timestamps have to fall within the date range - https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1738770055410379?thread_ts=1738686958.065639&cid=C03PG5DB4N9
  const firstSortedReport = await formatReportDate(true);
  // Assert first report is on or after the start date
  try {
    expect(firstSortedReport).toBeGreaterThanOrEqual(startDate);
  } catch {
    // If start date earlier than date range, end date should fall within date range
    expect(await formatReportDate()).toBeLessThanOrEqual(endDate);
  }
  
  // Click on End Timestamp to sort by most recent end date
  await page.click('[data-cy="cradle-to-grave-table-header-cell-END_DATE"]'); // asc
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible({
    timeout: 45 * 1000,
  });
  await page.click('[data-cy="cradle-to-grave-table-header-cell-END_DATE"]'); // desc
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible({
    timeout: 45 * 1000,
  });
  await page.locator('[data-cy="cradle-to-grave-table-cell-START_DATE"]').first().waitFor();
  await page.waitForTimeout(2000);
  
  // Assert first report is on or before the end date
  const lastReport = await formatReportDate();
  expect(lastReport).toBeLessThanOrEqual(endDate);
  
 // Step 2. Cradle to grave:  refresh page button
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Store total results
  const total = await page.innerText(
    "app-cradle-to-grave-table span:nth-of-type(4)",
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click refresh button
  await page
    .locator('[data-cy="cradle-to-grave-toolbar-refresh-button"]')
    .click();
  
  // Wait for results to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible({
    timeout: 45 * 1000,
  });
  await page
    .locator('[data-cy="cradle-to-grave-table-cell-START_DATE"]')
    .first()
    .waitFor();
  await page.waitForTimeout(2000);
  
  // Save new total
  const newTotal = await page.innerText(
    "app-cradle-to-grave-table span:nth-of-type(4)",
  );
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert total is still the same (or increased)
  expect(newTotal * 1).toBeGreaterThanOrEqual(total * 1);
  
 // Step 3. Cradle to grave:  search call button
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Store call info
  const callInfo = await page.innerText(
    '[data-cy="cradle-to-grave-table-cell-INFO"]',
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click search button
  await page
    .locator('[data-cy="cradle-to-grave-toolbar-search-button"]')
    .waitFor();
  await page.locator('[data-cy="cradle-to-grave-toolbar-search-button"]').click();
  
  // Fill in call info
  await page
    .locator('[data-cy="cradle-to-grave-toolbar-search-input"]')
    .fill(callInfo);
  await page.waitForTimeout(3000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert search result shows 1/n
  const searchResults = await page
    .locator(`[class*="search-suffix"] span`)
    .innerText();
  expect(searchResults.split("/")[0]).toBe("1");
  
 // Step 4. Cradle to grave:  expand all rows button
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Click refresh button
  await page.click('[data-cy="cradle-to-grave-toolbar-refresh-button"]');
  
  // Wait for results to load
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByRole("progressbar")).not.toBeVisible({
    timeout: 45 * 1000,
  });
  await page
    .locator('[data-cy="cradle-to-grave-table-cell-START_DATE"]')
    .first()
    .waitFor();
  await page.waitForTimeout(2000);
  
  // Store row number
  await page
    .locator('[data-cy="cradle-to-grave-table-cell-INFO"]')
    .first()
    .waitFor();
  const rows = await page
    .locator('[data-cy="cradle-to-grave-table-cell-INFO"]')
    .count();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click expand all rows button
  try {
    await page.click(
      '[data-cy="cradle-to-grave-toolbar-expand-all-rows-button"]',
      {
        force: true,
        timeout: 4000,
      },
    );
  } catch {
    // Row(s) are already expanded
    await page
      .locator('[data-cy="cradle-to-grave-table-cell-event-name"]')
      .first()
      .waitFor();
  }
  
  // Wait for rows to expand
  await page
    .locator('[data-cy="cradle-to-grave-table-cell-event-name"]')
    .first()
    .waitFor();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert rows increased
  const expandedRows = await page
    .locator('[data-cy="cradle-to-grave-table-cell-event-name"]')
    .count();
  expect(expandedRows).toBeGreaterThan(rows);
  
 // Step 5. Cradle to grave: collapse all rows button
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click collapse all rows button
  await page.locator(
    '[data-cy="cradle-to-grave-toolbar-collapse-all-rows-button"]',
  ).click();
  
  // Wait for results to load
  await page.waitForTimeout(3000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert event names are not visible
  await expect(
    page.locator('[data-cy="cradle-to-grave-table-cell-event-name"]'),
  ).toHaveCount(0);
  
});