import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("cradle_to_grave_correctness", async () => {
 // Step 1. Navigate to Cradle to Grave reports
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const lastYear = dateFns.getYear(dateFns.subYears(new Date(), 1));
  
  // Login as Supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to Cradle to Grave reports
  await page.locator('.tab:has-text("Cradle to Grave")').click();
  await expect(
    page.locator('[data-cy="configure-cradle-to-grave-title"]'),
  ).toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Configure cradle to grave reports based on date range
  await page
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
    )
    .click();
  await page.locator('[aria-label="Choose month and year"]').click();
  await page.locator(`[aria-label="${lastYear}"]`).click();
  await page.locator('.mat-calendar-body-cell :text("JAN")').click();
  await page.locator('.mat-calendar-body-cell :text-is("1")').click();
  await page.locator('.mat-calendar-body-cell :text-is("31")').click();
  
  // Soft assert values populated
  await expect(page.locator(`.mat-end-date`)).toHaveValue(`1/31/${lastYear}`);
  await page.waitForTimeout(1500);
  
  // Apply
  await page.locator('button:has-text("Apply")').click();
  await expect(
    page.locator('[data-cy="cradle-to-grave-table-cell-INFO"]').first(),
  ).toBeVisible();
  await page.waitForSelector('[data-cy="cradle-to-grave-table-cell-INFO"]');
  
  const startDate = (
    await page.innerText('[data-cy="cradle-to-grave-table-cell-START_DATE"]')
  ).split("\n")[0];
  console.log(startDate);
  const endDate = (
    await page.innerText('[data-cy="cradle-to-grave-table-cell-END_DATE"]')
  ).split("\n")[0];
  const assertDate = (date) =>
    dateFns.isWithinInterval(new Date(date), {
      start: new Date(`01/01/${lastYear}`),
      end: new Date(`01/31/${lastYear}`),
    });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert first record falls within date range
  // Only so long as start or end date is within range - context in notes
  expect(assertDate(startDate) || assertDate(endDate)).toBeTruthy();
  
  // Cradle to grave: expand details of first chat row
  await page.click('[data-cy="cradle-to-grave-table-cell-INFO"] #chat', {
    force: true,
  });
  await page
    .locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"]`)
    .click();
  
  // Assert there are more than 2 chat events
  const chatEvents = await page
    .locator('[data-cy="cradle-to-grave-table-cell-event-name"]')
    .count();
  expect(chatEvents).toBeGreaterThan(2);
  
  // Close chat row
  await page.click('[data-cy="cradle-to-grave-table-cell-INFO"] #chat', {
    force: true,
  });
  
  // Cradle to grave: expand first incoming call row
  await page.click('[data-cy="cradle-to-grave-table-cell-INFO"] #inbound', {
    force: true,
  });
  await page
    .locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"]`)
    .waitFor();
  
  // Assert there are 2 or more inbound call events
  let inboundEvents = await page
    .locator('[data-cy="cradle-to-grave-table-cell-event-name"]')
    .count();
  expect(inboundEvents).toBeGreaterThanOrEqual(2);
  
  // Close inbound call row
  await page.click('[data-cy="cradle-to-grave-table-cell-INFO"] #inbound', {
    force: true,
  });
  
  // Cradle to grave: expand first outgoing call row
  await page.click('[data-mat-icon-name="callback"]', { force: true });
  await page
    .locator(`[data-cy="cradle-to-grave-table-row-details-expand-row-button"]`)
    .waitFor();
  
  // Assert there are 2 or more outbound call events
  inboundEvents = await page
    .locator('[data-cy="cradle-to-grave-table-cell-event-name"]')
    .count();
  expect(inboundEvents).toBeGreaterThanOrEqual(2);
  
  // Close outbound call row
  await page.click('[data-mat-icon-name="callback"]', { force: true });
  
});