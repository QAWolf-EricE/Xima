import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_call_details", async () => {
 // Step 1. View Call Details report
  // REQ01 - login as supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // REQ09 - navigate to my reports
  await expect(page).toHaveURL(/reports/);
  await page.click("mat-form-field >> nth=2");
  await page.click('mat-option:has-text("My Reports")');
  await page.waitForSelector(
    '[data-cy="reports-list-report-name"][role="cell"]', { timeout: 1 * 60 * 1000 }
  );
  
  // get number of run times
  let runtimes = await page
    .locator(
      'mat-row:has-text("Call Details") [data-cy="reports-list-report-run-times"]'
    )
    .innerText();
  
  // REQ162 - view call details report
  await page.click('mat-row:has-text("Call Details")');
  
  // REQ163 - assert correct tiles for call details report
  await expect(
    page.locator('.summary-item-header:has-text("Total Calls")')
  ).toBeVisible();
  await expect(
    page.locator('.summary-item-header:has-text("Answered Calls")')
  ).toBeVisible();
  await expect(
    page.locator('.summary-item-header:has-text("Total Call Duration")')
  ).toBeVisible();
  await expect(
    page.locator('.summary-item-header:has-text("Total Talking Duration")')
  ).toBeVisible();
  
  await expect(
    page.locator('mat-header-cell:has-text("CALL DIRECTION")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("CALL DURATION")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("START TIME")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("END TIME")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("EXTERNAL NUMBER")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("INITIAL AGENT")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("TOTAL TALKING DURATION")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("IS ANSWERED")')
  ).toBeVisible();
  await expect(
    page.locator('mat-header-cell:has-text("ACCOUNT CODE")')
  ).toBeVisible();
  
  // REQ149 - assert report run time adds one every configuration
  await page.click('button:has-text("Configure")');
  await page.click('button:has-text("Apply")');
  await page.waitForTimeout(2000);
  try {
    await page.waitForSelector('.summary-item-header:has-text("Total Calls")');
  } catch {
    await page.reload();
    await page.waitForSelector('.summary-item-header:has-text("Total Calls")');
  }
  await page.waitForSelector('.summary-item-header:has-text("Total Calls")');
  await page.click('mat-icon:has-text("keyboard_arrow_left")');
  
  runtimes = parseInt(runtimes) + 1;
  await expect(
    page.locator(
      'mat-row:has-text("Call Details") [data-cy="reports-list-report-run-times"]'
    )
  ).toHaveText(runtimes.toString(), { timeout: 1 * 60 * 1000 });
});