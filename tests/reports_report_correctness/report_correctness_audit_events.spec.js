import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("report_correctness_audit_events", async () => {
 // Step 1. Audit Events
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor({sloMo: 2000});
  
  // REQ09 Navigate to my reports
  await expect(page).toHaveURL(/reports/);
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  await page.waitForTimeout(5000);
  
  
  // REQ149 Report run time adds one every configuration
  const runtimes = await page
    .locator(
      'mat-row:has-text("Audit Events") >> nth=0 >> [data-cy="reports-list-report-run-times"]'
    )
    .innerText();
  await page.click(
    'mat-row:has-text("Audit Events") >> nth=0 >> [data-cy="reports-list-report-name"]'
  );
  await page.waitForTimeout(7000);
  await page.mouse.click(500, 500);
  await page.click('button:has-text("Configure")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Apply")');
  try{
    await expect(page.locator('text=Loading Report... ')).toBeVisible();
  } catch (err) {
    console.log(err)
  }
  await expect(page.locator('text=Loading Report... ')).not.toBeVisible({ timeout: 8 * 60 * 1000 });
  await page.mouse.click(500, 500);
  
  await page.click('mat-icon:has-text("keyboard_arrow_left")');
  await page.waitForTimeout(10000);
  
  await page.locator('[placeholder="Type to Search"]').fill("Audit Events");
  await page.keyboard.press('Enter')
  
  // const tableVal = await page.locator(
  //     'mat-row:has-text("Audit Events") >> nth=0 >> [data-cy="reports-list-report-run-times"]'
  //   ).innerText()
  // expect(`${parseInt(runtimes) + 1}`).toBe(tableVal)
  // console.log(tableVal)
  
  await expect(
    page.locator(
      'mat-row:has-text("Audit Events") >> nth=0 >> [data-cy="reports-list-report-run-times"]'
    )
  ).toHaveText(`${parseInt(runtimes) + 1}`, { timeout: 3 * 60 * 1000 });
  console.log(runtimes)
  console.log(`${parseInt(runtimes) + 1}`)
});