import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_search_report", async () => {
 // Step 1. Search Report
  // login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // search report
  await expect(page.locator(':text-is("Abandoned Calls (7)")')).toBeVisible();
  await expect(
    page.locator("text=Agent Call Summary By Skill").first()
  ).toBeVisible();
  
  await page.fill('[placeholder="Type to Search"]', "Skill Call Volume");
  await page.keyboard.press("Enter");
  
  // assert search
  await expect(page.locator(`[role="row"]:has([data-cy="reports-list-report-name"]:text("Skill Call Volume"))`).first()).toBeVisible();
  await expect(page.locator("text=Abandoned Calls")).toBeHidden();
  await expect(
    page.locator("text=Agent Call Summary By Skill")
  ).toBeHidden();
});